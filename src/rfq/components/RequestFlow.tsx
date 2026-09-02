/**
 * Buyer request creation — US-2 … US-6.
 *
 * One form, not a wizard. It opens on the question that decides the shape of everything
 * below it — "What would you like to ask for?" — because the route is an explicit choice
 * (FR-2.2, never inferred from whether a file is attached, AC-3.5) and answering it first
 * means the fields underneath never rearrange themselves after the buyer has started
 * filling them in. Quantity follows, so the seller is still answering "is this cheaper at
 * my volume?" (US-2), and then the fields the chosen route needs. The buyer sees all of it
 * at once and sends from the same screen.
 *
 * Divergence from the PRD, deliberate: US-7 specifies a separate review step. The
 * information that step existed to give — what is in the request and what it totals — is
 * kept here as a summary inside the form, so a multi-line request is still legible before
 * it is sent. AC-7.1/7.2 hold; AC-7.3 (one primary action) and AC-7.4 (an empty request
 * cannot be sent) hold. AC-7.5 and AC-7.6 are unaffected. What no longer exists is the
 * discrete step, so US-7 should be rewritten against this before it is used as a test.
 */

import { useMemo, useState } from 'react'
import { formatMoney } from '../domain/money'
import { makeRef } from '../domain/reference'
import { GATING } from '../domain/guardrails'
import { runAutoChecks, PROOF_EXCLUSIONS } from '../domain/proof'
import {
  parsePriceMinor, quantityHint, validateFile, validatePrice, validateQuantity,
  SALE_UNIT_KEY, type Finding,
} from '../domain/validation'
import { t, type Lang } from '../domain/i18n'
import type { Frequency, Product, Proof, ProofFields } from '../domain/types'
import { case1Available, frequencyAvailable, phase2Only, productBySku, useRfq, type DraftLine } from '../store'
import { Field, Modal, Money, ProductListItem } from './ui'

interface Props {
  product: Product
  onClose: () => void
  onTierAccepted: (unitPrice: number) => void
  onSubmitted: (ref: string) => void
}

/** FR-2.3 — the tier that applies at this quantity, if any. */
function applicableTier(product: Product, qty: number) {
  return product.tiers
    .filter((tier) => qty >= tier.minQty)
    .sort((a, b) => a.unitPrice - b.unitPrice)[0] ?? null
}

/**
 * Stand-in for the FR-7.10 extraction adapter. A real provider sits behind this shape.
 *
 * The document date is optional for the buyer to type because FR-7.2 has extraction read
 * it off the document — that is the whole point of the adapter. This stand-in does the
 * same: where the buyer left the date blank, the extractor supplies one, so the freshness
 * check still has something to judge rather than failing for a field nobody had to fill.
 */
/**
 * A stand-in for reading the supplier's name off the uploaded document. Words before the
 * first "invoice"/"quote" in the file name, title-cased — which is how these files are
 * actually named — and a neutral fallback where the name says nothing.
 */
function supplierFromFile(name: string): string {
  const stem = name.replace(/\.[^.]+$/, '').split(/[-_\s]+/)
  const words = []
  for (const w of stem) {
    if (/^(invoice|inv|quote|quotation|receipt|scan|img|photo|\d+)$/i.test(w)) break
    words.push(w)
  }
  if (words.length === 0) return 'Supplier on the document'
  return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ') + ' W.L.L.'
}

function simulateExtraction(file: File, typed: ProofFields, unavailable: boolean, now: Date): Proof {
  const readDate = typed.documentDate ?? new Date(now.getTime() - 8 * 86_400_000).toISOString().slice(0, 10)
  return {
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    hash: `sha256-${file.name}-${file.size}`,
    typed,
    // FR-7.2 — the provider returns its own reading. It is stored alongside the typed
    // values, never on top of them (FR-7.5). The legal-entity suffix here is deliberate:
    // it exercises the AC-4.4 conflict path.
    /*
      The supplier now comes off the document, because the buyer is no longer asked for
      it. The file name stands in for the read — a prototype cannot open a PDF, and a
      fixed string would hide the one thing the seller's screen is for, which is seeing a
      real name appear that the buyer never typed. The legal-entity suffix is deliberate:
      it exercises the AC-4.4 conflict path against the seller's own records.
    */
    extracted: unavailable ? null : {
      supplier: supplierFromFile(file.name),
      sku: typed.sku,
      unitPrice: typed.unitPrice,
      documentDate: readDate,
      currency: 'BHD',
    },
    extractionUnavailable: unavailable,
    checks: [],
  }
}

/**
 * Turn a finding into the sentence the buyer reads.
 *
 * The rules deal in case ids and numbers; the words are here, and only here, because only
 * the renderer knows the language. Two parameters need resolving before `t` can use them:
 * `unit` is itself a key (the product's own noun, which is a different word in each
 * language), and anything in minor units has to be formatted as money rather than printed
 * as an integer — 10250 is not a price.
 */
function say(finding: Finding | null, lang: Lang): string | null {
  if (!finding) return null
  const params: Record<string, string | number> = { ...finding.params }
  if (typeof params.unit === 'string') params.unit = t(lang, params.unit)
  if (typeof params.price === 'number') params.price = formatMoney(params.price, { withCurrency: true, lang })
  if (finding.key === 'priceNonPositive') params.zero = formatMoney(0, { withCurrency: true, lang })
  return t(lang, finding.key, params)
}

/** The two halves of a finding, split for `Field`, which shows each in its own colour. */
function fieldMessages(finding: Finding | null, lang: Lang) {
  const text = say(finding, lang)
  return {
    error: finding?.severity === 'error' ? text : null,
    warning: finding?.severity === 'warning' ? text : null,
    hint: finding?.severity === 'hint' ? text ?? undefined : undefined,
  }
}

export function RequestFlow({ product, onClose, onTierAccepted, onSubmitted }: Props) {
  const { state, dispatch, lang } = useRfq()

  const [qtyText, setQtyText] = useState('')
  /*
   * The route is a tab, and one is always selected: "I have a price to match" leads.
   * AC-3.3 still holds — where Phase 2 is off there is only one route, so it is the
   * route and the tab strip is not rendered at all.
   *
   * Note against FR-2.2 / AC-3.2, which asked for no preselection so the buyer had to
   * choose: with a default there is no unchosen state, so a buyer who wanted a quote can
   * land in the proof form without noticing the other tab. The route is still explicit
   * and never inferred from field state (AC-3.5), and the tabs sit directly above the
   * fields they govern, but AC-3.2 no longer describes this.
   */
  const routeChoice = case1Available(state.phase)
  const [route, setRoute] = useState<'case_1' | 'case_2'>(routeChoice ? 'case_1' : 'case_2')
  const [targetText, setTargetText] = useState('')
  /*
   * A list, capped at MAX_FILES_PER_LINE. One invoice is the common case and still the
   * only one the seller's verification panel leads with — but the evidence a buyer holds
   * is not always a single page, and a cap you cannot reach is a rule nobody has tested.
   */
  const [files, setFiles] = useState<File[]>([])
  /** The last rejection, kept until the next attempt rather than cleared on a timer. */
  const [fileFinding, setFileFinding] = useState<Finding | null>(null)
  const [frequency, setFrequency] = useState<Frequency>('one_off')
  const [specialCredit, setSpecialCredit] = useState(false)
  const [note, setNote] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const [submittedRef, setSubmittedRef] = useState<string | null>(null)

  const qty = Number(qtyText)
  const tier = useMemo(() => applicableTier(product, qty), [product, qty])
  const targetPrice = parsePriceMinor(targetText)
  const draftLines = state.draft?.lines ?? []

  /**
   * Take what the picker returned.
   *
   * Files are judged one at a time and against the ones already accepted in this same
   * batch, so picking three copies of one invoice catches the second and the third rather
   * than only the second. A rejection stops nothing that came before it: what passed is
   * attached, and the first refusal is the sentence shown. Silently discarding a good file
   * because a later one was bad would be the worse of the two behaviours.
   */
  function handlePicked(list: FileList | null) {
    const picked = list ? Array.from(list) : []
    // EC-31 — a picker dismissed without a choice is its own case, not an empty success.
    if (picked.length === 0) {
      setFileFinding({ key: 'fileNoneSelected', severity: 'error', params: {} })
      return
    }
    const accepted: File[] = []
    let refusal: Finding | null = null
    for (const candidate of picked) {
      const found = validateFile(candidate, [...files, ...accepted])
      if (found) { refusal = refusal ?? found; continue }
      // EC-30 — the transport can still fail after every rule has passed, and that failure
      // is about the connection rather than about the file the buyer chose.
      if (state.uploadFails) {
        refusal = refusal ?? { key: 'fileUploadFailed', severity: 'error', params: {} }
        continue
      }
      accepted.push(candidate)
    }
    if (accepted.length > 0) setFiles([...files, ...accepted])
    setFileFinding(refusal)
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index))
    setFileFinding(null)
  }

  /*
   * The proof is derived, not snapshotted. The upload sits above the SKU and date fields,
   * so a value typed after the file was picked has to reach the extraction comparison and
   * the auto-checks — freezing the typed set at upload time would silently compare against
   * empty fields.
   */
  const proofs = useMemo<Proof[]>(() => {
    /*
      FR-7.5 keeps typed and extracted apart, and the form now only asks for one of the
      five: the price. The rest is left empty rather than pre-filled from the document —
      writing the machine's reading into the buyer's column would erase exactly the
      distinction the seller's screen depends on.
    */
    const typed: ProofFields = {
      supplier: '',
      sku: product.sku,
      unitPrice: targetPrice,
      documentDate: null,
      currency: 'BHD',
    }
    return files.map((f) => {
      // AC-4.7 / EC-27 — when the service is unavailable the buyer can still submit; the
      // request is marked for manual review rather than blocked.
      // §3 — the invoice-reading service is Phase 2 under either reading of the phases.
      const built = simulateExtraction(f, typed, !phase2Only(state.phase), state.now)
      built.checks = runAutoChecks(built, {
        now: state.now,
        target: { sku: product.sku, brand: product.brand, packSize: product.packSize, unitOfMeasure: product.unitOfMeasure.en },
        buyerHashes: [],
        otherBuyerHashes: [],
        tenantCurrency: 'BHD',
      })
      return built
    })
  }, [files, targetPrice, product, state.phase, state.now])


  /*
   * The two fields, judged by the rule table rather than here (domain/validation.ts).
   *
   * `touched` is what a blank field means: nothing yet, until the buyer has tried to send.
   * The empty-field sentence is an answer to "why did that not go", and shown before the
   * press it is an accusation about something nobody has done.
   *
   * Where nothing is wrong the quantity field carries its instruction instead — how this
   * product is sold — which is the thing that stops most of the refusals below from ever
   * being reached.
   */
  const qtyFinding = validateQuantity(qtyText, product, { touched: showErrors })
    ?? (qtyText.trim() === '' ? quantityHint(product) : null)
  const qtyMsg = fieldMessages(qtyFinding, lang)
  const qtyBlocked = qtyFinding?.severity === 'error'

  const priceFinding = route === 'case_1'
    ? validatePrice(targetText, product.listPrice, { touched: showErrors })
    : null
  const priceMsg = fieldMessages(priceFinding, lang)
  const priceBlocked = priceFinding?.severity === 'error'

  /*
   * The rejection wins over the absence. Both are true after a bad upload — there is still
   * no document *and* the one just offered was refused — but "attach the document that
   * shows that price" is an instruction the buyer has already followed, and it hid the
   * only sentence that told them why it did not take.
   */
  const fileError = say(fileFinding, lang)
    ?? (showErrors && route === 'case_1' && proofs.length === 0 ? t(lang, 'fileRequired') : null)

  /** Everything the current line needs before it can join the request. */
  const lineComplete =
    qtyText.trim() !== '' && !qtyBlocked &&
    (route === 'case_2' || (targetPrice !== null && !priceBlocked && proofs.length > 0))

  /** The form is untouched, so "Send" means "send what is already in the request". */
  const lineUntouched = qtyText === '' && targetText === '' && proofs.length === 0

  /** Left/right (or up/down) move between tabs, per the tablist pattern. */

  function currentLine(): DraftLine {
    return {
      sku: product.sku,
      route: route as 'case_1' | 'case_2',
      quantity: qty,
      askedPrice: route === 'case_1' ? targetPrice : null,
      frequency: route === 'case_2' && frequencyAvailable(state.phase) ? frequency : null,
      specialCredit: phase2Only(state.phase) && specialCredit,
      note: route === 'case_2' && note.trim() ? note.trim().slice(0, 500) : null,
      proofs: route === 'case_1' ? proofs : [],
    }
  }

  /*
   * AC-6.5 — the cap was enforced in the reducer by returning the state unchanged, which
   * from the buyer's side is a button that does nothing. The reducer still refuses; what
   * is new is that the refusal has a sentence attached before the press.
   */
  const linesFull = draftLines.length >= GATING.maxLinesPerRequest

  function commitLine() {
    if (linesFull) return
    if (!state.draft) dispatch({ type: 'start_draft' })
    dispatch({ type: 'add_line', line: currentLine() })
  }

  function handleSend() {
    setShowErrors(true)
    // AC-7.4 — an empty request cannot be sent; it stays a draft.
    if (!lineComplete && !(lineUntouched && draftLines.length > 0)) return

    const draftId = state.draft?.id
    // EC-2 / FR-2.9 — idempotent by draft identity: a repeat send of the same draft shows
    // the reference it already produced instead of creating a second request. The new
    // reference is derived the way the reducer derives it, from the same clock and
    // sequence, so both agree without reading state that has not been committed yet.
    const existing = draftId ? state.submittedDrafts[draftId] : undefined
    const ref = existing ?? makeRef(state.now, state.seq)
    if (lineComplete) commitLine()
    dispatch({ type: 'submit_draft' })
    setSubmittedRef(ref)
  }

  // ── Confirmation (AC-7.5) ────────────────────────────────────────────────
  if (submittedRef) {
    /*
      A rule can settle a request in the same step that creates it — the floor auto-decline
      on the quote route, or the auto-accept threshold — so the confirmation reads the
      state that came back rather than assuming one. It used to promise a reply within 24
      hours in every case, which on an auto-declined request was simply untrue, and on an
      auto-accepted one sent the buyer away to wait for something that had already
      happened.

      AC-19.5 governs the declined wording: it names no floor, no margin and no rule, and
      it points at the path that is still open (E-5).
    */
    const settled = state.requests.find((r) => r.ref === submittedRef)
    const outcome = settled?.state === 'declined' ? 'declined'
      : settled?.state === 'accepted' ? 'accepted' : 'sent'
    const TONE = { sent: 'good', accepted: 'good', declined: 'warn' }[outcome]

    return (
      <Modal
        drawer
        title={<h2 className="hb-h2">{t(lang, outcome === 'declined' ? 'submittedDeclinedTitle'
          : outcome === 'accepted' ? 'submittedAcceptedTitle' : 'submittedTitle')}</h2>}
        onClose={onClose}
      >
        <div className={`hb-banner hb-banner--${TONE}`} style={{ marginBottom: 16 }}>
          <div>
            <strong>
              {t(lang, outcome === 'declined' ? 'autoDeclinedLead'
                : outcome === 'accepted' ? 'autoAcceptedLead' : 'slaPromise')}
            </strong>
            <div style={{ marginTop: 4 }}>
              {t(lang, 'yourReference')}: <strong className="hb-ref">{submittedRef}</strong>
            </div>
            {/* The discount only follows a match, so it is only promised where one is
                still possible. On a declined request it would be a second untruth. */}
            {route === 'case_1' && outcome !== 'declined' && (
              <div style={{ marginTop: 8 }}>
                {t(lang, outcome === 'accepted' ? 'incentiveOnMatched' : 'incentiveOnSent')}
              </div>
            )}
          </div>
        </div>
        {/* AC-22.1 / E-5 — a refused ask never costs the buyer the goods. */}
        {outcome === 'declined' && (
          <p className="hb-sub" style={{ marginBottom: 16 }}>{t(lang, 'stillPurchasable')}</p>
        )}
        <button type="button" className="hb-btn hb-btn--primary" onClick={() => onSubmitted(submittedRef)}>
          {t(lang, 'goToMyRequests')}
        </button>
      </Modal>
    )
  }

  /*
   * E-2 — the reason a send is blocked, shown only once the buyer has actually tried to
   * send. Before that the form is simply unfilled, and nagging about it on open reads as
   * an error the buyer has not made yet.
   */
  const blockedReason = linesFull && lineComplete
    ? t(lang, 'maxLinesReached', { max: GATING.maxLinesPerRequest })
    : showErrors && !lineComplete && !(lineUntouched && draftLines.length > 0)
      ? t(lang, 'completeFormFirst')
      : null

  return (
    <Modal
      drawer
      title={
        <h2 className="hb-h2">{t(lang, route === 'case_1' ? 'requestSpecialPrice' : 'case2Title')}</h2>
      }
      onClose={onClose}
      footer={
        // AC-7.3 — exactly one action on this surface, and it is the primary one.
        <span className="hb-primary-slot">
          {/* E-2 — a blocked control states its reason, once a send has been attempted. */}
          {blockedReason && <span className="hb-hint">{blockedReason}</span>}
          <button type="button" className="hb-btn hb-btn--primary" onClick={handleSend}>
            {t(lang, route === 'case_1' ? 'matchPriceAction' : 'sendRequest')}
          </button>
        </span>
      }
    >
      {/*
        The product, before the first question about it. It was a line of grey text under
        the modal title, which put the item the buyer is negotiating below the action in
        the reading order and gave it no price at all — so the target-price field had
        nothing on screen to be a target *against*.
      */}
      <ProductListItem product={product} lang={lang} />

      {/* ── Quantity (US-2) ──────────────────────────────────────────────── */}
      <Field
        /* The label counts in the product's own noun, like every message below it —
           a form that says "cases" over a product sold by the pallet is the first
           thing that has to be right if the refusals under it are to make sense. */
        label={t(lang, 'quantityLabel', { unit: t(lang, SALE_UNIT_KEY[product.saleUnit]) })}
        /*
          One hint slot, two things that could fill it. The equivalent unit count (AC-2.4)
          only exists once there is a number to convert, so the sold-by instruction takes
          the slot until then — which is exactly the moment it is useful.
        */
        hint={qty > 0 && !qtyBlocked
          ? t(lang, 'equalsUnits', { units: qty * product.unitsPerCase, uom: product.baseUnit[lang] })
          : qtyMsg.hint}
        error={qtyMsg.error} warning={qtyMsg.warning}
      >
        <input
          className="hb-input" inputMode="numeric" autoFocus
          value={qtyText} onChange={(e) => setQtyText(e.target.value)}
          placeholder={String(product.minOrderQty)}
        />
      </Field>

      {/* AC-2.2 / FR-2.3 — tier pre-emption: the published price is offered before a
          negotiation is built, with a one-tap path out of the flow. */}
      {tier && tier.unitPrice < product.listPrice && (
        <div className="hb-banner hb-banner--info" style={{ marginBottom: 16 }}>
          <div>
            <strong>{t(lang, 'tierAvailableTitle')}</strong>
            <div style={{ marginTop: 4 }}>
              {t(lang, 'tierAvailableBody', {
                qty,
                price: formatMoney(tier.unitPrice, { withCurrency: true, lang }),
                list: formatMoney(product.listPrice, { withCurrency: true, lang }),
              })}
            </div>
            <button
              type="button" className="hb-btn hb-btn--outline hb-btn--sm" style={{ marginTop: 10 }}
              onClick={() => onTierAccepted(tier.unitPrice)}
            >
              {t(lang, 'useThisPrice')}
            </button>
          </div>
        </div>
      )}

      {/* Quantity belongs to both routes; the panel below holds only what the route adds. */}
      <div id="hb-route-panel" className="hb-routepanel">

      {/* ── Case 1 (US-4) ────────────────────────────────────────────────── */}
      {route === 'case_1' && (
        <>
          {/* The list price used to repeat here as a hint. It now sits in the list item
              at the head of the modal, larger and permanent, so saying it twice within
              one screen was noise rather than help. */}
          <Field
            label={t(lang, 'targetPrice')}
            error={priceMsg.error} warning={priceMsg.warning}
          >
            <input className="hb-input" inputMode="decimal" value={targetText}
              onChange={(e) => setTargetText(e.target.value)} placeholder="0.000" />
          </Field>

          {/*
            Three questions and no more: how many, at what price, and show me. The fields
            that went — the competitor's name, their SKU, the document's date — were all
            things extraction reads off the invoice anyway (FR-7.2), so asking the buyer to
            type them was asking twice for one answer. What the seller sees is unchanged;
            it now comes from the document rather than from the buyer, which is also the
            more trustworthy of the two sources for a claim about someone else's price.
          */}
          {/* `group`: this field holds an attachment list and a drop zone, which is more
              than one control, so it cannot be a label. See ui.tsx. */}
          <Field label={t(lang, 'uploadProof')} error={fileError} group>
            {files.length > 0 && (
              <div className="hb-filelist">
                {files.map((f, i) => (
                  <div className="hb-filechip" key={`${f.name}-${f.size}-${i}`}>
                    <span aria-hidden="true">{f.type.startsWith('image/') ? '🖼' : '📄'}</span>
                    <span className="hb-filechip-name" dir="ltr">{f.name}</span>
                    <span className="hb-hint">{Math.max(1, Math.round(f.size / 1024))} KB</span>
                    <button
                      type="button" className="hb-btn hb-btn--quiet hb-btn--sm"
                      style={{ marginInlineStart: 'auto' }}
                      onClick={() => removeFile(i)}
                    >
                      {t(lang, 'removeFile')}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/*
              The zone stays, at the cap as much as below it — including at three files,
              where it is the thing that answers. Replacing it with a notice, or greying it
              out, hides the control the buyer is reaching for and says nothing when they
              reach for it anyway; leaving it live means the fourth attempt gets the
              sentence that tells them to remove one first. A drop zone would have had to
              answer that drop regardless.
            */}
            {/*
                One drop zone rather than the two buttons that were here. `capture` is
                deliberately absent: without it the phone's own sheet offers Take Photo and
                Photo Library together, which is both routes in one control — and it is
                `capture` that makes some browsers drop the library, stranding a buyer who
                already has the invoice saved. The hint says both are there.
            */}
            <label className="hb-dropzone">
              <span className="hb-dropzone-icon" aria-hidden="true">
                  {/* The sheet in currentColor, the arrow knocked out of it in the zone's
                      own background — drawing both in one fill made the arrow invisible. */}
                  <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
                    <path fill="currentColor" d="M6 2h7.2L20 8.6V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
                    <path fill="var(--hb-blue-wash)" d="M13.2 2.4v5.4h5.4Z" />
                    <path fill="var(--hb-blue-wash)" d="M12 18.4a1 1 0 0 1-1-1v-4l-1.3 1.3a1 1 0 0 1-1.4-1.4l3-3a1 1 0 0 1 1.4 0l3 3a1 1 0 0 1-1.4 1.4L13 13.4v4a1 1 0 0 1-1 1Z" />
                  </svg>
                </span>
                <span className="hb-dropzone-cta">{t(lang, 'uploadFile')}</span>
                <span className="hb-dropzone-hint">{t(lang, 'uploadHint')}</span>
              <input
                type="file" accept=".pdf,image/*" multiple className="hb-visually-hidden"
                onChange={(e) => handlePicked(e.target.files)}
              />
            </label>
          </Field>

          {/* FR-7.7 / EC-36 — the exclusions are stated before the send, not after a
              rejection. Folded away: it is a reference, and an open list of what does not
              qualify would be the longest thing on a form with three questions on it. */}
          <details className="hb-cannotmatch">
            <summary>{t(lang, 'whatWeCannotMatch')}</summary>
            <ul className="hb-hint">
              {PROOF_EXCLUSIONS[lang].map((x) => <li key={x}>{x}</li>)}
            </ul>
          </details>
        </>
      )}

      {/* ── Case 2 (US-5) ────────────────────────────────────────────────── */}
      {route === 'case_2' && (
        <>
          {/* §4/§11 — under the draft's cut quantity ships first and this waits. */}
          {frequencyAvailable(state.phase) && (
            <Field label={t(lang, 'frequency')}>
              {/* AC-5.2 — a controlled picker, never free text. */}
              <select className="hb-select" value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
                <option value="one_off">{t(lang, 'freqOneOff')}</option>
                <option value="weekly">{t(lang, 'freqWeekly')}</option>
                <option value="fortnightly">{t(lang, 'freqFortnightly')}</option>
                <option value="monthly">{t(lang, 'freqMonthly')}</option>
              </select>
            </Field>
          )}
          {/* AC-5.3 — optional, capped at 500 characters, sanitised on submission. */}
          <Field label={t(lang, 'noteToSeller')} hint={`${note.length} / 500`}>
            <textarea className="hb-textarea" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {/* AC-5.4 — no file upload is offered on the Case 2 form. */}
        </>
      )}

      {/*
        §11 — Special Credit (استمرارية). Captured and shown, never priced, and Phase 2
        under both readings.

        It used to be offered on both routes, on the reasoning that continuity belongs to
        the arrangement rather than to how the price was reached. The PM's card design
        overrules that for the match route: it asks three questions and this is not one of
        them, and a Phase 2 field is the first thing off an MVP form. It stays on the quote
        route, where the buyer is already describing an arrangement rather than pointing at
        a price.
      */}
      {route === 'case_2' && phase2Only(state.phase) && (
        <label className="hb-field hb-checkfield">
          <input
            type="checkbox" checked={specialCredit}
            onChange={(e) => setSpecialCredit(e.target.checked)}
          />
          <span>
            <span className="hb-label" style={{ marginBottom: 2 }}>
              {t(lang, 'specialCredit')}
              <span className="hb-pill hb-pill--neutral" style={{ marginInlineStart: 8 }}>{t(lang, 'phaseTwoField')}</span>
            </span>
            <span className="hb-hint" style={{ marginTop: 0 }}>{t(lang, 'specialCreditHint')}</span>
          </span>
        </label>
      )}
      {/*
        The incentive, at the foot of the form and as a disclaimer — which is what it is.
        It sat at the top as a green banner and that was the wrong shape twice over: a
        celebratory banner reads as a reward already earned, and the top of the form is
        before the buyer has done anything to earn it. Here it is the last thing read
        before Send, which is when a condition matters.

        Deliberately not an info icon. On the card an icon is right — it is an aside, and
        the buyer may never want it. Here the buyer has committed to the flow and this is a
        term of it; a term you have to go and uncover is not a term you disclosed.
      */}
      {/*
        The other route, offered as a link rather than a tab.
        The tabs gave the two routes equal weight, and they are not equal: the card sends
        the buyer here to match a price they already hold, and the quote is what they fall
        back to when they do not hold one. A link says that; a tab pair says the buyer
        should be choosing. It also keeps §4's "both routes per item" true — the quote
        route is one press away, it just no longer competes for the buyer's attention
        before they have started.
      */}
      {routeChoice && (
        <button type="button" className="hb-routeswitch" onClick={() => setRoute(route === 'case_1' ? 'case_2' : 'case_1')}>
          {t(lang, route === 'case_1' ? 'switchToQuote' : 'switchToMatch')}
        </button>
      )}

      {route === 'case_1' && (
        <p className="hb-disclaimer">
          <span className="hb-disclaimer-mark" aria-hidden="true">i</span>
          <span>{t(lang, 'incentiveInForm')}</span>
        </p>
      )}
      </div>

      {/* ── What is already in the request (US-6, and what US-7 was for) ─── */}
      {draftLines.length > 0 && <DraftSummary lang={lang} />}
    </Modal>
  )
}

/**
 * The lines already added, with the totals the review step used to show. Not a step —
 * it sits at the foot of the same form, so a multi-line request stays legible without
 * the buyer navigating anywhere (AC-7.1, AC-7.2).
 */
function DraftSummary({ lang }: { lang: Lang }) {
  const { state, dispatch } = useRfq()
  const lines = state.draft?.lines ?? []

  const rows = lines.map((l) => {
    const product = productBySku(l.sku)
    return {
      ...l,
      name: product.name[lang],
      listPrice: product.listPrice,
      atList: product.listPrice * l.quantity,
      atAsked: l.askedPrice === null ? null : l.askedPrice * l.quantity,
    }
  })
  const askedRows = rows.filter((r) => r.atAsked !== null)
  const totalAtAsked = askedRows.reduce((s, r) => s + (r.atAsked ?? 0), 0)
  const comparableList = askedRows.reduce((s, r) => s + r.atList, 0)
  const saving = comparableList - totalAtAsked
  const savingPct = comparableList > 0 ? Math.round((saving / comparableList) * 1000) / 10 : 0
  const hasQuoteLines = rows.some((r) => r.atAsked === null)

  return (
    <div className="hb-card" style={{ marginTop: 20 }}>
      <div className="hb-card-head">
        <h3 className="hb-h3" style={{ margin: 0 }}>
          {t(lang, rows.length === 1 ? 'itemInRequest' : 'itemsInRequest', { n: rows.length })}
        </h3>
      </div>
      <div className="hb-table-wrap">
        <table className="hb-table">
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.sku}-${i}`}>
                <td>
                  {r.name}
                  <div className="hb-hint">{t(lang, 'quantity')} {r.quantity}</div>
                </td>
                <td className="hb-num">
                  {/* AC-9.2 — a quote line says so; it never shows an inferred price. */}
                  {r.askedPrice === null
                    ? <span className="hb-pill hb-pill--neutral">{t(lang, 'quoteRequested')}</span>
                    : <Money value={r.atAsked} lang={lang} />}
                </td>
                <td style={{ width: 1 }}>
                  <button
                    type="button" className="hb-btn hb-btn--quiet hb-btn--sm"
                    onClick={() => dispatch({ type: 'remove_line', index: i })}
                  >
                    {t(lang, 'removeLine')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>{t(lang, 'requestTotal')}</td>
              <td colSpan={2}>
                <Money value={totalAtAsked} lang={lang} withCurrency />
                {/* AC-7.2 — the asked total says what it excludes. */}
                {hasQuoteLines && <div className="hb-hint">{t(lang, 'excludesQuoteLines')}</div>}
              </td>
            </tr>
            {saving > 0 && (
              <tr>
                <td>{t(lang, 'estimatedSaving')}</td>
                <td colSpan={2} style={{ color: 'var(--hb-good)' }}>
                  <Money value={saving} lang={lang} withCurrency /> · {savingPct}%
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </div>
  )
}

