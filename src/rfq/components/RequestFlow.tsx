/**
 * Buyer request creation — US-2 … US-7.
 *
 * The four steps are quantity → route → route form → review, in that order and for the
 * reason US-2 gives: the seller should be answering "is this cheaper at my volume?",
 * which means the volume comes first. Route selection is explicit (FR-2.2); it is never
 * inferred from whether a file is attached (AC-3.5).
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

type Step = 'quantity' | 'route' | 'form' | 'review'

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
  const hash = `sha256-${file.name}-${file.size}`
  return {
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    hash,
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
  const [step, setStep] = useState<Step>('quantity')

  // AC-3.4 — route-specific data survives a Back, for the life of the session.
  const [qtyText, setQtyText] = useState('')
  const [route, setRoute] = useState<'case_1' | 'case_2' | null>(null)
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
    qtyText === '' ? null
      : !/^\d+$/.test(qtyText) || qty <= 0 ? t(lang, 'quantityInvalid')
        : qty < NEGOTIATION_MIN_QTY ? t(lang, 'minQuantityBlocked', { min: NEGOTIATION_MIN_QTY })
          : null

  // ── AC-4.6 / EC-7 — a target at or above list is blocked, with the list price named ──
  const targetError =
    !showErrors || route !== 'case_1' ? null
      : targetText === '' ? t(lang, 'priceRequired')
        : targetPrice === null ? t(lang, 'priceRequired')
          : targetPrice >= product.listPrice
            ? t(lang, 'targetAboveList', { list: formatMoney(product.listPrice, { withCurrency: true, lang }) })
            : null

  // ── EC-8 — an implausibly low ask warns and flags, but never blocks ──
  const targetWarning =
    route === 'case_1' && targetPrice !== null && targetPrice < product.listPrice * IMPLAUSIBLE_ASK_RATIO
      ? t(lang, 'targetImplausible') : null

  const supplierError = showErrors && route === 'case_1' && !supplier.trim() ? t(lang, 'supplierRequired') : null
  const proofFileError = showErrors && route === 'case_1' && !proof ? t(lang, 'fileRequired') : null

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
    // request is flagged for manual review rather than blocked.
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

  function commitLine(): DraftLine {
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

  function addLineAndGo(next: 'review' | 'another') {
    if (route === 'case_1') {
      setShowErrors(true)
      if (targetError || !supplier.trim() || !proof || targetPrice === null || targetPrice >= product.listPrice) return
    }
    if (!state.draft) dispatch({ type: 'start_draft' })
    dispatch({ type: 'add_line', line: commitLine() })
    if (next === 'another') onAddAnother()
    else setStep('review')
  }

  // ── Submitted confirmation (AC-7.5) ──────────────────────────────────────
  if (submittedRef) {
    return (
      <Modal title={<h2 className="hb-h2">{t(lang, 'submittedTitle')}</h2>} onClose={onClose}>
        <div className="hb-banner hb-banner--good" style={{ marginBottom: 14 }}>
          <div>
            <strong>{t(lang, 'slaPromise')}</strong>
            <div style={{ marginTop: 4 }}>
              {t(lang, 'yourReference')}: <strong className="hb-num">{submittedRef}</strong>
            </div>
          </div>
        </div>
        <button type="button" className="hb-btn hb-btn--primary" onClick={() => onSubmitted(submittedRef)}>
          {t(lang, 'goToMyRequests')}
        </button>
      </Modal>
    )
  }

  const stepIndex = { quantity: 1, route: 2, form: 3, review: 4 }[step]

  return (
    <Modal
      wide={step === 'review'}
      title={
        <div>
          <h2 className="hb-h2">{product.name[lang]}</h2>
          <div className="hb-steps" style={{ marginTop: 6 }}>
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className={`hb-step-dot${n <= stepIndex ? ' hb-step-dot--on' : ''}`}>{n}</span>
            ))}
            <span style={{ marginInlineStart: 6 }}>{t(lang, 'step')} {stepIndex} {t(lang, 'of')} 4</span>
          </div>
        </div>
      }
      onClose={onClose}
      footer={<FlowFooter
        step={step} lang={lang} route={route}
        qtyValid={qtyText !== '' && qtyError === null}
        lineCount={draftLines.length}
        onBack={() => setStep(step === 'review' ? 'form' : step === 'form' ? 'route' : 'quantity')}
        onNext={() => {
          if (step === 'quantity') setStep('route')
          else if (step === 'route') setStep('form')
          else if (step === 'form') addLineAndGo('review')
        }}
        onAddAnother={() => addLineAndGo('another')}
        onSend={() => {
          if (draftLines.length === 0) return
          const draftId = state.draft?.id
          // EC-2 / FR-2.9 — idempotent by draft identity: if this draft was already
          // submitted, show the reference it produced rather than creating a second
          // request. The new reference is derived the same way the reducer derives it,
          // from the same clock and sequence, so both agree without reading back state
          // that has not been committed yet.
          const existing = draftId ? state.submittedDrafts[draftId] : undefined
          const ref = existing ?? makeRef(state.now, state.seq)
          dispatch({ type: 'submit_draft' })
          setSubmittedRef(ref)
        }}
      />}
    >
      {step === 'quantity' && (
        <>
          <h3 className="hb-h3">{t(lang, 'quantityStepTitle')}</h3>
          <Field
            label={t(lang, 'quantityLabel')}
            hint={qty > 0 ? t(lang, 'equalsUnits', { units: qty * product.unitsPerCase, uom: product.unitOfMeasure[lang] }) : undefined}
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
            <div className="hb-banner hb-banner--info">
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
                  type="button" className="hb-btn hb-btn--secondary hb-btn--sm" style={{ marginTop: 8 }}
                  onClick={() => onTierAccepted(tier.unitPrice)}
                >
                  {t(lang, 'useThisPrice')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {step === 'route' && (
        <>
          <h3 className="hb-h3">{t(lang, 'routeStepTitle')}</h3>
          <div className="hb-stack">
            {/* AC-3.3 — where Phase 2 is off the Case 1 card is not rendered at all. A
                disabled card is never shown in its place. */}
            {state.phase2Enabled && (
              <button
                type="button" className="hb-choice" aria-pressed={route === 'case_1'}
                onClick={() => setRoute('case_1')}
              >
                <div className="hb-choice-title">{t(lang, 'case1Title')}</div>
                <div className="hb-choice-body">{t(lang, 'case1Body')}</div>
              </button>
            )}
            <button
              type="button" className="hb-choice" aria-pressed={route === 'case_2'}
              onClick={() => setRoute('case_2')}
            >
              <div className="hb-choice-title">{t(lang, 'case2Title')}</div>
              <div className="hb-choice-body">{t(lang, 'case2Body')}</div>
            </button>
          </div>
        </>
      )}

      {step === 'form' && route === 'case_1' && (
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
          <details style={{ marginBottom: 12 }}>
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

      {step === 'form' && route === 'case_2' && (
        <>
          <div className="hb-banner hb-banner--info" style={{ marginBottom: 14 }}>
            <div>{t(lang, 'quantity')}: <strong>{qty}</strong> · {product.unitOfMeasure[lang]}</div>
          </div>
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

      {step === 'review' && <ReviewTable lang={lang} />}
    </Modal>
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
    return (
      <div className="hb-banner hb-banner--warn">
        <div>{t(lang, 'checksNotRun')}</div>
      </div>
    )
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
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
          <div className="hb-warning" style={{ marginTop: 0 }}>
            {t(lang, 'extractionConflict', { typed: typedSupplier, extracted: proof.extracted?.supplier ?? '' })}
          </div>
          <div className="hb-row" style={{ marginTop: 8 }}>
            <button type="button" className={`hb-btn hb-btn--secondary hb-btn--sm${resolution === 'typed' ? ' hb-btn--primary' : ''}`} onClick={() => onResolve('typed')}>
              {t(lang, 'keepTyped')}
            </button>
            <button type="button" className={`hb-btn hb-btn--secondary hb-btn--sm${resolution === 'extracted' ? ' hb-btn--primary' : ''}`} onClick={() => onResolve('extracted')}>
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

/** US-7 — original versus asked, per line and in total, before anything is sent. */
function ReviewTable({ lang }: { lang: Lang }) {
  const { state } = useRfq()
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
  const totalAtList = rows.reduce((s, r) => s + r.atList, 0)
  const totalAtAsked = rows.reduce((s, r) => s + (r.atAsked ?? 0), 0)
  const askedRows = rows.filter((r) => r.atAsked !== null)
  const comparableList = askedRows.reduce((s, r) => s + r.atList, 0)
  const saving = comparableList - totalAtAsked
  const savingPct = comparableList > 0 ? Math.round((saving / comparableList) * 1000) / 10 : 0
  const hasQuoteLines = rows.some((r) => r.atAsked === null)

  return (
    <>
      <h3 className="hb-h3">{t(lang, 'reviewTitle')}</h3>
      {rows.length === 0 && <p className="hb-sub">{t(lang, 'emptyRequestBlocked')}</p>}
      {rows.length > 0 && (
        <div className="hb-table-wrap">
          <table className="hb-table">
            <thead>
              <tr>
                <th>{t(lang, 'product')}</th>
                <th>{t(lang, 'quantity')}</th>
                <th>{t(lang, 'listPrice')}</th>
                <th>{t(lang, 'askedPrice')}</th>
                <th>{t(lang, 'lineTotalAtList')}</th>
                <th>{t(lang, 'lineTotalAtAsked')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.sku}-${i}`}>
                  <td>{r.name}</td>
                  <td className="hb-num">{r.quantity}</td>
                  <td><Money value={r.listPrice} lang={lang} /></td>
                  <td>
                    {/* AC-9.2 — a Case 2 line says so; it never shows an inferred price. */}
                    {r.askedPrice === null
                      ? <span className="hb-pill hb-pill--neutral">{t(lang, 'quoteRequested')}</span>
                      : <Money value={r.askedPrice} lang={lang} />}
                  </td>
                  <td><Money value={r.atList} lang={lang} /></td>
                  <td><Money value={r.atAsked} lang={lang} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>{t(lang, 'requestTotal')}</td>
                <td><Money value={totalAtList} lang={lang} withCurrency /></td>
                <td>
                  <Money value={totalAtAsked} lang={lang} withCurrency />
                  {/* AC-7.2 — the asked total says what it excludes. */}
                  {hasQuoteLines && <div className="hb-hint">{t(lang, 'excludesQuoteLines')}</div>}
                </td>
              </tr>
              {saving > 0 && (
                <tr>
                  <td colSpan={4}>{t(lang, 'estimatedSaving')}</td>
                  <td colSpan={2} style={{ color: 'var(--hb-good)' }}>
                    <Money value={saving} lang={lang} withCurrency /> · {savingPct}%
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      )}
    </>
  )
}

function FlowFooter({ step, lang, route, qtyValid, lineCount, onBack, onNext, onAddAnother, onSend }: {
  step: Step
  lang: Lang
  route: 'case_1' | 'case_2' | null
  qtyValid: boolean
  lineCount: number
  onBack: () => void
  onNext: () => void
  onAddAnother: () => void
  onSend: () => void
}) {
  // AC-3.2 — with no route selected, progression is blocked and nothing downstream renders.
  const nextBlocked = step === 'quantity' ? !qtyValid : step === 'route' ? route === null : false
  const nextReason = step === 'quantity'
    ? (lang === 'ar' ? 'أدخل كمية صالحة أولاً' : 'Enter a valid quantity first')
    : (lang === 'ar' ? 'اختر أحد الخيارين أولاً' : 'Choose one of the two options first')

  if (step === 'review') {
    return (
      <>
        <button type="button" className="hb-btn hb-btn--secondary" onClick={onBack}>{t(lang, 'back')}</button>
        <button type="button" className="hb-btn hb-btn--secondary" onClick={onAddAnother}>{t(lang, 'addAnotherItem')}</button>
        {/* AC-7.3 — exactly one primary action on this surface. */}
        <span className="hb-primary-slot">
          <button
            type="button" className="hb-btn hb-btn--primary" onClick={onSend}
            disabled={lineCount === 0}
            title={lineCount === 0 ? t(lang, 'emptyRequestBlocked') : undefined}
          >
            {t(lang, 'sendRequest')}
          </button>
        </span>
      </>
    )
  }

  return (
    <>
      {step !== 'quantity' && (
        <button type="button" className="hb-btn hb-btn--secondary" onClick={onBack}>{t(lang, 'back')}</button>
      )}
      <span className="hb-primary-slot">
        {step === 'form' && (
          <button type="button" className="hb-btn hb-btn--secondary" onClick={onAddAnother} style={{ marginInlineEnd: 8 }}>
            {t(lang, 'addAnotherItem')}
          </button>
        )}
        <button
          type="button" className="hb-btn hb-btn--primary" onClick={onNext}
          disabled={nextBlocked}
          // E-2 — a disabled control states its reason, reachable on hover and focus.
          title={nextBlocked ? nextReason : undefined}
          aria-describedby={nextBlocked ? 'hb-next-reason' : undefined}
        >
          {t(lang, 'continue')}
        </button>
        {nextBlocked && <span id="hb-next-reason" className="hb-hint">{nextReason}</span>}
      </span>
    </>
  )
}
