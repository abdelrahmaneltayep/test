/**
 * Buyer request creation — US-2 … US-6.
 *
 * One form, not a wizard. The order of the fields still carries the reasoning US-2 gives —
 * quantity first, so the seller is answering "is this cheaper at my volume?", then the
 * explicit route choice (FR-2.2, never inferred from whether a file is attached, AC-3.5),
 * then the fields that route needs — but the buyer sees all of it at once and sends from
 * the same screen.
 *
 * Divergence from the PRD, deliberate: US-7 specifies a separate review step. The
 * information that step existed to give — what is in the request and what it totals — is
 * kept here as a summary inside the form, so a multi-line request is still legible before
 * it is sent. AC-7.1/7.2 hold; AC-7.3 (one primary action) and AC-7.4 (an empty request
 * cannot be sent) hold. AC-7.5 and AC-7.6 are unaffected. What no longer exists is the
 * discrete step, so US-7 should be rewritten against this before it is used as a test.
 */

import { useMemo, useState } from 'react'
import { formatMoney, parseMoney } from '../domain/money'
import { makeRef } from '../domain/reference'
import { IMPLAUSIBLE_ASK_RATIO } from '../domain/guardrails'
import { runAutoChecks, PROOF_EXCLUSIONS, ACCEPTED_MIME_TYPES, MAX_FILE_BYTES } from '../domain/proof'
import { t, type Lang } from '../domain/i18n'
import type { Frequency, Product, Proof, ProofFields } from '../domain/types'
import { productBySku, useRfq, type DraftLine } from '../store'
import { CheckBadge, Field, Modal, Money } from './ui'

/** FR-2.1 — the seller's configured negotiation minimum, per line. */
export const NEGOTIATION_MIN_QTY = 10

interface Props {
  product: Product
  onClose: () => void
  onTierAccepted: (unitPrice: number) => void
  onAddAnother: () => void
  onSubmitted: (ref: string) => void
}

/** FR-2.3 — the tier that applies at this quantity, if any. */
function applicableTier(product: Product, qty: number) {
  return product.tiers
    .filter((tier) => qty >= tier.minQty)
    .sort((a, b) => a.unitPrice - b.unitPrice)[0] ?? null
}

/** Stand-in for the FR-7.10 extraction adapter. A real provider sits behind this shape. */
function simulateExtraction(file: File, typed: ProofFields, unavailable: boolean): Proof {
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
      documentDate: typed.documentDate,
      currency: 'BHD',
    },
    extractionUnavailable: unavailable,
    checks: [],
  }
}

export function RequestFlow({ product, onClose, onTierAccepted, onAddAnother, onSubmitted }: Props) {
  const { state, dispatch, lang } = useRfq()

  const [qtyText, setQtyText] = useState('')
  // AC-3.3 — where Phase 2 is off there is only one route, so it is the route. The
  // chooser is not rendered at all rather than shown with one disabled card.
  const [route, setRoute] = useState<'case_1' | 'case_2' | null>(state.phase2Enabled ? null : 'case_2')
  const [targetText, setTargetText] = useState('')
  const [supplier, setSupplier] = useState('')
  const [theirSku, setTheirSku] = useState('')
  const [docDate, setDocDate] = useState('')
  const [proof, setProof] = useState<Proof | null>(null)
  const [proofError, setProofError] = useState<string | null>(null)
  const [conflictResolved, setConflictResolved] = useState<'typed' | 'extracted' | null>(null)
  const [frequency, setFrequency] = useState<Frequency>('one_off')
  const [note, setNote] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const [submittedRef, setSubmittedRef] = useState<string | null>(null)

  const qty = Number(qtyText)
  const tier = useMemo(() => applicableTier(product, qty), [product, qty])
  const targetPrice = parseMoney(targetText)
  const draftLines = state.draft?.lines ?? []

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
  const routeError = showErrors && route === null ? t(lang, 'routeRequired') : null

  /** Everything the current line needs before it can join the request. */
  const lineComplete =
    qtyText !== '' && qtyError === null && route !== null &&
    (route === 'case_2' || (targetPrice !== null && targetError === null && supplier.trim() !== '' && proof !== null))

  /** The form is untouched, so "Send" means "send what is already in the request". */
  const lineUntouched = qtyText === '' && targetText === '' && supplier === '' && proof === null

  function handleFile(file: File | null) {
    setProofError(null)
    if (!file) return
    // EC-30 — the size limit is enforced before upload completes where the client can see it.
    if (file.size > MAX_FILE_BYTES) {
      setProofError(lang === 'ar' ? 'الحد الأقصى لحجم الملف ١٠ ميجابايت.' : 'The maximum file size is 10 MB.')
      return
    }
    // EC-29 — an unsupported type is rejected with the accepted formats listed.
    if (file.type && !(ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) {
      setProofError(lang === 'ar'
        ? 'الصيغ المقبولة: PDF، JPG، PNG، WEBP، HEIC.'
        : 'Accepted formats: PDF, JPG, PNG, WEBP, HEIC.')
      return
    }
    const typed: ProofFields = {
      supplier: supplier.trim(),
      sku: theirSku.trim() || product.sku,
      unitPrice: targetPrice,
      documentDate: docDate || null,
      currency: 'BHD',
    }
    // AC-4.7 / EC-27 — when the service is unavailable the buyer can still submit; the
    // request is marked for manual review rather than blocked.
    const built = simulateExtraction(file, typed, !state.phase2Enabled)
    built.checks = runAutoChecks(built, {
      now: state.now,
      target: { sku: product.sku, brand: product.brand, packSize: product.packSize, unitOfMeasure: product.unitOfMeasure.en },
      buyerHashes: [],
      otherBuyerHashes: [],
      tenantCurrency: 'BHD',
    })
    setProof(built)
    setConflictResolved(null)
  }

  function currentLine(): DraftLine {
    return {
      sku: product.sku,
      route: route as 'case_1' | 'case_2',
      quantity: qty,
      askedPrice: route === 'case_1' ? targetPrice : null,
      frequency: route === 'case_2' ? frequency : null,
      note: route === 'case_2' && note.trim() ? note.trim().slice(0, 500) : null,
      proof: route === 'case_1' ? proof : null,
    }
  }

  function commitLine() {
    if (!state.draft) dispatch({ type: 'start_draft' })
    dispatch({ type: 'add_line', line: currentLine() })
  }

  function handleAddAnother() {
    setShowErrors(true)
    if (!lineComplete) return
    commitLine()
    onAddAnother()
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

  const blockedReason = !lineComplete && !(lineUntouched && draftLines.length > 0)
    ? (draftLines.length === 0 && lineUntouched ? t(lang, 'emptyRequestBlocked') : t(lang, 'completeFormFirst'))
    : null

  return (
    <Modal
      title={
        <div>
          <h2 className="hb-h2">{t(lang, 'requestSpecialPrice')}</h2>
          <div className="hb-hint">{product.name[lang]} · {product.sku}</div>
        </div>
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" className="hb-btn hb-btn--secondary" onClick={handleAddAnother}>
            {t(lang, 'addAnotherItem')}
          </button>
          {/* AC-7.3 — exactly one primary action on this surface. */}
          <span className="hb-primary-slot">
            {/* E-2 — a blocked control states its reason, on hover and on focus. */}
            {blockedReason && <span className="hb-hint">{blockedReason}</span>}
            <button type="button" className="hb-btn hb-btn--primary" onClick={handleSend}>
              {t(lang, 'sendRequest')}
            </button>
          </span>
        </>
      }
    >
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

      {/* ── Route (US-3) — explicit, never inferred (FR-2.2, AC-3.5) ─────── */}
      {state.phase2Enabled && (
        <div className="hb-field">
          <span className="hb-label">{t(lang, 'routeStepTitle')}</span>
          <div className="hb-stack">
            <button
              type="button" className="hb-choice" aria-pressed={route === 'case_1'}
              onClick={() => setRoute('case_1')}
            >
              <div className="hb-choice-title">{t(lang, 'case1Title')}</div>
              <div className="hb-choice-body">{t(lang, 'case1Body')}</div>
            </button>
            <button
              type="button" className="hb-choice" aria-pressed={route === 'case_2'}
              onClick={() => setRoute('case_2')}
            >
              <div className="hb-choice-title">{t(lang, 'case2Title')}</div>
              <div className="hb-choice-body">{t(lang, 'case2Body')}</div>
            </button>
          </div>
          {routeError && <div className="hb-error" role="alert">{routeError}</div>}
        </div>
      )}

      {/* ── Case 1 (US-4) ────────────────────────────────────────────────── */}
      {route === 'case_1' && (
        <>
          <Field
            label={t(lang, 'targetPrice')}
            hint={`${t(lang, 'listPrice')}: ${formatMoney(product.listPrice, { withCurrency: true, lang })}`}
            error={targetError} warning={targetWarning}
          >
            <input className="hb-input" inputMode="decimal" value={targetText}
              onChange={(e) => setTargetText(e.target.value)} placeholder="0.000" />
          </Field>

          <Field label={t(lang, 'competitorName')} error={supplierError}>
            <input className="hb-input" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </Field>

          <Field label={t(lang, 'competitorSku')}>
            <input className="hb-input" value={theirSku} onChange={(e) => setTheirSku(e.target.value)} />
          </Field>

          <Field label={lang === 'ar' ? 'تاريخ المستند' : 'Document date'}>
            <input className="hb-input" type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
          </Field>

          {/* FR-7.7 / EC-36 — the exclusions are stated before upload, not after rejection. */}
          <details style={{ marginBottom: 14 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{t(lang, 'whatWeCannotMatch')}</summary>
            <ul className="hb-hint" style={{ marginTop: 6 }}>
              {PROOF_EXCLUSIONS[lang].map((x) => <li key={x}>{x}</li>)}
            </ul>
          </details>

          <Field label={t(lang, 'uploadProof')} hint={t(lang, 'uploadHint')} error={proofFileError ?? proofError}>
            {/* AC-21.4 — camera and gallery on a phone, not a desktop-only file picker. */}
            <input
              className="hb-input" type="file" accept=".pdf,image/*" capture="environment"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </Field>

          {proof && <ExtractionPanel
            proof={proof} lang={lang} typedSupplier={supplier}
            resolution={conflictResolved} onResolve={setConflictResolved}
          />}
        </>
      )}

      {/* ── Case 2 (US-5) ────────────────────────────────────────────────── */}
      {route === 'case_2' && (
        <>
          <Field label={t(lang, 'frequency')}>
            {/* AC-5.2 — a controlled picker, never free text. */}
            <select className="hb-select" value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
              <option value="one_off">{t(lang, 'freqOneOff')}</option>
              <option value="weekly">{t(lang, 'freqWeekly')}</option>
              <option value="fortnightly">{t(lang, 'freqFortnightly')}</option>
              <option value="monthly">{t(lang, 'freqMonthly')}</option>
            </select>
          </Field>
          {/* AC-5.3 — optional, capped at 500 characters, sanitised on submission. */}
          <Field label={t(lang, 'noteToSeller')} hint={`${note.length} / 500`}>
            <textarea className="hb-textarea" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {/* AC-5.4 — no file upload is offered on the Case 2 form. */}
        </>
      )}

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

/** AC-4.3 / AC-4.4 — extracted values shown as "extracted — please confirm", with any
 *  conflict against the typed value surfaced rather than silently resolved. */
function ExtractionPanel({ proof, lang, typedSupplier, resolution, onResolve }: {
  proof: Proof
  lang: Lang
  typedSupplier: string
  resolution: 'typed' | 'extracted' | null
  onResolve: (r: 'typed' | 'extracted') => void
}) {
  if (proof.extractionUnavailable) {
    // EC-27 / E-4 — a system failure says so, and is never phrased as user error.
    return <div className="hb-banner hb-banner--warn">{t(lang, 'checksNotRun')}</div>
  }
  const conflict = proof.extracted && typedSupplier.trim() && proof.extracted.supplier !== typedSupplier.trim()
  return (
    <div className="hb-proof" style={{ marginTop: 10 }}>
      <div className="hb-proof-grid">
        <div>
          <div className="hb-hint">{t(lang, 'buyerTyped')}</div>
          <strong>{typedSupplier || '—'}</strong>
        </div>
        <div>
          <div className="hb-hint">{t(lang, 'extractedConfirm')}</div>
          <strong>{proof.extracted?.supplier || '—'}</strong>
        </div>
      </div>
      {conflict && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--hb-line-soft)' }}>
          <div className="hb-warning" style={{ marginTop: 0 }}>
            {t(lang, 'extractionConflict', { typed: typedSupplier, extracted: proof.extracted?.supplier ?? '' })}
          </div>
          <div className="hb-row" style={{ marginTop: 8 }}>
            <button type="button" className={`hb-btn hb-btn--sm ${resolution === 'typed' ? 'hb-btn--primary' : 'hb-btn--secondary'}`} onClick={() => onResolve('typed')}>
              {t(lang, 'keepTyped')}
            </button>
            <button type="button" className={`hb-btn hb-btn--sm ${resolution === 'extracted' ? 'hb-btn--primary' : 'hb-btn--secondary'}`} onClick={() => onResolve('extracted')}>
              {t(lang, 'useExtracted')}
            </button>
          </div>
        </div>
      )}
      {/* AC-4.5 — a failed check warns inline and states why, without blocking submission. */}
      {proof.checks.map((c) => (
        <div className="hb-check" key={c.check}>
          <CheckBadge severity={c.severity} lang={lang} />
          <div>
            <strong>{t(lang, c.check === 'freshness' ? 'proofFreshness' : c.check === 'identity' ? 'proofIdentity' : 'proofDuplicate')}</strong>
            <div className="hb-hint">{c.reasonCode.replace(/_/g, ' ')}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
