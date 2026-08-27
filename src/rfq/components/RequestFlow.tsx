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

import { useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { formatMoney, parseMoney } from '../domain/money'
import { makeRef } from '../domain/reference'
import { IMPLAUSIBLE_ASK_RATIO } from '../domain/guardrails'
import { runAutoChecks, PROOF_EXCLUSIONS, ACCEPTED_MIME_TYPES, MAX_FILE_BYTES } from '../domain/proof'
import { t, type Lang } from '../domain/i18n'
import type { Frequency, Product, Proof, ProofFields } from '../domain/types'
import { case1Available, frequencyAvailable, phase2Only, productBySku, useRfq, type DraftLine } from '../store'
import { Field, Modal, Money, ProductListItem } from './ui'

/** FR-2.1 — the seller's configured negotiation minimum, per line. */
export const NEGOTIATION_MIN_QTY = 10

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
    extracted: unavailable ? null : {
      supplier: typed.supplier ? `${typed.supplier} W.L.L.` : '',
      sku: typed.sku,
      unitPrice: typed.unitPrice,
      documentDate: readDate,
      currency: 'BHD',
    },
    extractionUnavailable: unavailable,
    checks: [],
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
  const [supplier, setSupplier] = useState('')
  const [theirSku, setTheirSku] = useState('')
  const [docDate, setDocDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [proofError, setProofError] = useState<string | null>(null)
  const [frequency, setFrequency] = useState<Frequency>('one_off')
  const [specialCredit, setSpecialCredit] = useState(false)
  const [note, setNote] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const [submittedRef, setSubmittedRef] = useState<string | null>(null)

  const qty = Number(qtyText)
  const tier = useMemo(() => applicableTier(product, qty), [product, qty])
  const targetPrice = parseMoney(targetText)
  const draftLines = state.draft?.lines ?? []

  function handleFile(picked: File | null) {
    setProofError(null)
    if (!picked) { setFile(null); return }
    // EC-30 — the size limit is enforced before upload completes where the client can see it.
    if (picked.size > MAX_FILE_BYTES) {
      setProofError(lang === 'ar' ? 'الحد الأقصى لحجم الملف ١٠ ميجابايت.' : 'The maximum file size is 10 MB.')
      return
    }
    // EC-29 — an unsupported type is rejected with the accepted formats listed.
    if (picked.type && !(ACCEPTED_MIME_TYPES as readonly string[]).includes(picked.type)) {
      setProofError(lang === 'ar'
        ? 'الصيغ المقبولة: PDF، JPG، PNG، WEBP، HEIC.'
        : 'Accepted formats: PDF, JPG, PNG, WEBP, HEIC.')
      return
    }
    setFile(picked)
  }

  /*
   * The proof is derived, not snapshotted. The upload sits above the SKU and date fields,
   * so a value typed after the file was picked has to reach the extraction comparison and
   * the auto-checks — freezing the typed set at upload time would silently compare against
   * empty fields.
   */
  const proof = useMemo<Proof | null>(() => {
    if (!file) return null
    const typed: ProofFields = {
      supplier: supplier.trim(),
      sku: theirSku.trim() || product.sku,
      unitPrice: targetPrice,
      documentDate: docDate || null,
      currency: 'BHD',
    }
    // AC-4.7 / EC-27 — when the service is unavailable the buyer can still submit; the
    // request is marked for manual review rather than blocked.
    // §3 — the invoice-reading service is Phase 2 under either reading of the phases.
    const built = simulateExtraction(file, typed, !phase2Only(state.phase), state.now)
    built.checks = runAutoChecks(built, {
      now: state.now,
      target: { sku: product.sku, brand: product.brand, packSize: product.packSize, unitOfMeasure: product.unitOfMeasure.en },
      buyerHashes: [],
      otherBuyerHashes: [],
      tenantCurrency: 'BHD',
    })
    return built
  }, [file, supplier, theirSku, targetPrice, docDate, product, state.phase, state.now])


  // ── AC-2.5 / AC-2.3 — quantity validation names the constraint and the value ──
  const qtyError =
    qtyText === '' ? (showErrors ? t(lang, 'quantityInvalid') : null)
      : !/^\d+$/.test(qtyText) || qty <= 0 ? t(lang, 'quantityInvalid')
        : qty < NEGOTIATION_MIN_QTY ? t(lang, 'minQuantityBlocked', { min: NEGOTIATION_MIN_QTY })
          : null

  // ── AC-4.6 / EC-7 — a target at or above list is blocked, with the list price named ──
  const targetError =
    route !== 'case_1' ? null
      : targetText === '' ? (showErrors ? t(lang, 'priceRequired') : null)
        : targetPrice === null ? t(lang, 'priceRequired')
          : targetPrice >= product.listPrice
            ? t(lang, 'targetAboveList', { list: formatMoney(product.listPrice, { withCurrency: true, lang }) })
            : null

  // ── EC-8 — an implausibly low ask warns and flags, but never blocks ──
  const targetWarning =
    route === 'case_1' && targetPrice !== null && targetPrice > 0 && targetPrice < product.listPrice * IMPLAUSIBLE_ASK_RATIO
      ? t(lang, 'targetImplausible') : null

  const supplierError = showErrors && route === 'case_1' && !supplier.trim() ? t(lang, 'supplierRequired') : null
  const proofFileError = showErrors && route === 'case_1' && !proof ? t(lang, 'fileRequired') : null

  /** Everything the current line needs before it can join the request. */
  const lineComplete =
    qtyText !== '' && qtyError === null &&
    (route === 'case_2' || (targetPrice !== null && targetError === null && supplier.trim() !== '' && proof !== null))

  /** The form is untouched, so "Send" means "send what is already in the request". */
  const lineUntouched = qtyText === '' && targetText === '' && supplier === '' && proof === null

  /** Left/right (or up/down) move between tabs, per the tablist pattern. */
  function onRouteKeyDown(e: ReactKeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    e.preventDefault()
    setRoute((r) => (r === 'case_1' ? 'case_2' : 'case_1'))
  }

  function currentLine(): DraftLine {
    return {
      sku: product.sku,
      route: route as 'case_1' | 'case_2',
      quantity: qty,
      askedPrice: route === 'case_1' ? targetPrice : null,
      frequency: route === 'case_2' && frequencyAvailable(state.phase) ? frequency : null,
      specialCredit: phase2Only(state.phase) && specialCredit,
      note: route === 'case_2' && note.trim() ? note.trim().slice(0, 500) : null,
      proof: route === 'case_1' ? proof : null,
    }
  }

  function commitLine() {
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
    return (
      <Modal title={<h2 className="hb-h2">{t(lang, 'submittedTitle')}</h2>} onClose={onClose}>
        <div className="hb-banner hb-banner--good" style={{ marginBottom: 16 }}>
          <div>
            <strong>{t(lang, 'slaPromise')}</strong>
            <div style={{ marginTop: 4 }}>
              {t(lang, 'yourReference')}: <strong className="hb-ref">{submittedRef}</strong>
            </div>
          </div>
        </div>
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
  const blockedReason = showErrors && !lineComplete && !(lineUntouched && draftLines.length > 0)
    ? t(lang, 'completeFormFirst')
    : null

  return (
    <Modal
      title={
        <h2 className="hb-h2">{t(lang, 'requestSpecialPrice')}</h2>
      }
      onClose={onClose}
      footer={
        // AC-7.3 — exactly one action on this surface, and it is the primary one.
        <span className="hb-primary-slot">
          {/* E-2 — a blocked control states its reason, once a send has been attempted. */}
          {blockedReason && <span className="hb-hint">{blockedReason}</span>}
          <button type="button" className="hb-btn hb-btn--primary" onClick={handleSend}>
            {t(lang, 'sendRequest')}
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

      {/* ── Route (US-3) — explicit, never inferred (FR-2.2, AC-3.5) ─────── */}
      {routeChoice && (
        <div className="hb-field">
          <span className="hb-label" id="hb-route-label">{t(lang, 'routeStepTitle')}</span>
          <div className="hb-tabs" role="tablist" aria-labelledby="hb-route-label" onKeyDown={onRouteKeyDown}>
            <button
              type="button" role="tab" id="hb-tab-case1" className="hb-tab"
              aria-selected={route === 'case_1'} aria-controls="hb-route-panel"
              tabIndex={route === 'case_1' ? 0 : -1}
              onClick={() => setRoute('case_1')}
            >
              <span aria-hidden="true">🏷</span>{t(lang, 'case1Title')}
            </button>
            <button
              type="button" role="tab" id="hb-tab-case2" className="hb-tab"
              aria-selected={route === 'case_2'} aria-controls="hb-route-panel"
              tabIndex={route === 'case_2' ? 0 : -1}
              onClick={() => setRoute('case_2')}
            >
              <span aria-hidden="true">📄</span>{t(lang, 'case2Title')}
            </button>
          </div>
          {/* The selected tab still says what it means; the cards used to carry this. */}
          <p className="hb-hint" style={{ marginTop: 10 }}>
            {t(lang, route === 'case_1' ? 'case1Body' : 'case2Body')}
          </p>
        </div>
      )}

      {/* ── Quantity (US-2) ──────────────────────────────────────────────── */}
      <Field
        label={t(lang, 'quantityLabel')}
        hint={qty > 0 ? t(lang, 'equalsUnits', { units: qty * product.unitsPerCase, uom: product.baseUnit[lang] }) : undefined}
        error={qtyError}
      >
        <input
          className="hb-input" inputMode="numeric" autoFocus
          value={qtyText} onChange={(e) => setQtyText(e.target.value)}
          placeholder={String(NEGOTIATION_MIN_QTY)}
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

      {/* The quantity field sits between the tabs and their panel because it belongs to
          both routes; the panel below holds only what the chosen route adds. */}
      <div
        id="hb-route-panel" role={routeChoice ? 'tabpanel' : undefined}
        aria-labelledby={routeChoice ? (route === 'case_1' ? 'hb-tab-case1' : 'hb-tab-case2') : undefined}
      >

      {/* ── Case 1 (US-4) ────────────────────────────────────────────────── */}
      {route === 'case_1' && (
        <>
          {/* The list price used to repeat here as a hint. It now sits in the list item
              at the head of the modal, larger and permanent, so saying it twice within
              one screen was noise rather than help. */}
          <Field
            label={t(lang, 'targetPrice')}
            error={targetError} warning={targetWarning}
          >
            <input className="hb-input" inputMode="decimal" value={targetText}
              onChange={(e) => setTargetText(e.target.value)} placeholder="0.000" />
          </Field>

          <Field label={t(lang, 'competitorName')} error={supplierError}>
            <input className="hb-input" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </Field>

          {/* FR-7.7 / EC-36 — the exclusions are stated before upload, not after rejection. */}
          <details style={{ marginBottom: 14 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{t(lang, 'whatWeCannotMatch')}</summary>
            <ul className="hb-hint" style={{ marginTop: 6 }}>
              {PROOF_EXCLUSIONS[lang].map((x) => <li key={x}>{x}</li>)}
            </ul>
          </details>

          {/*
            Before the upload, the picker. After it, the file — and nothing else.
            The extraction read-back and its checks used to sit here, and they are the
            seller's evidence, not the buyer's: the buyer knows what they attached, and a
            panel telling them what a machine read off their own invoice asked them to
            adjudicate a mismatch they cannot see the document behind. FR-7.2 extraction
            and the FR-7.3 checks still run on submission and still reach the seller's
            request page in full (§3) — what is gone is the buyer being shown the working.
          */}
          <Field
            label={t(lang, 'uploadProof')}
            hint={file ? undefined : t(lang, 'uploadHint')}
            error={proofFileError ?? proofError}
          >
            {file ? (
              <div className="hb-filechip">
                <span aria-hidden="true">{file.type.startsWith('image/') ? '🖼' : '📄'}</span>
                <span className="hb-filechip-name" dir="ltr">{file.name}</span>
                <span className="hb-hint">{Math.max(1, Math.round(file.size / 1024))} KB</span>
                <button
                  type="button" className="hb-btn hb-btn--quiet hb-btn--sm"
                  style={{ marginInlineStart: 'auto' }}
                  onClick={() => handleFile(null)}
                >
                  {t(lang, 'removeFile')}
                </button>
              </div>
            ) : (
              /* AC-21.4 — camera and gallery on a phone, not a desktop-only file picker. */
              <input
                className="hb-input" type="file" accept=".pdf,image/*" capture="environment"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            )}
          </Field>

          {/*
            Both optional, and both below the attachment on purpose: extraction reads them
            off the document (FR-7.2), so they are a correction to what was read rather
            than something the buyer has to supply before uploading.
          */}
          <div style={{ marginTop: 18 }}>
            <Field label={t(lang, 'competitorSku')}>
              <input className="hb-input" value={theirSku} onChange={(e) => setTheirSku(e.target.value)} />
            </Field>

            <Field label={t(lang, 'documentDate')} hint={t(lang, 'documentDateHint')}>
              <input className="hb-input" type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
            </Field>
          </div>
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
        §11 — Special Credit (استمرارية). It belongs to the arrangement rather than to
        either route, so it is offered on both; it is Phase 2 under both readings, and it
        is captured and shown, never priced.
      */}
      {phase2Only(state.phase) && (
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

