/**
 * The seller's request page — Feature Flow Draft §5.
 *
 * A page rather than a dialog. A dialog is for a decision you can take at a glance, and
 * this is not one: the seller is reading a document, three automatic checks and a margin
 * before committing to a price, and that reading has a URL-worthy identity of its own.
 * Being a page also means the buyer's submission can be laid out in full instead of being
 * compressed to fit a modal.
 *
 * The page has three parts, in the order the seller actually works: what the buyer sent,
 * read back field by field exactly as the form captured it; the document and its checks;
 * and then the decision, with the four actions §5 names.
 *
 * §2 — one item per request, so there is one line and the page is written for one. The
 * decision state is still keyed by line id, because the object model keeps its collection
 * for FR-1.9 and a page that quietly assumed otherwise would break the day it grows.
 */

import { useState } from 'react'
import { addDays, isEscalated } from '../domain/clocks'
import { guardrailValue, SAME_AS_LAST_TIME_DAYS } from '../domain/guardrails'
import { t, type Lang } from '../domain/i18n'
import { formatMoney, parseMoney } from '../domain/money'
import { lineMargin, marginAfterAsk, type MarginBand } from '../domain/margin'
import { hasFailedCheck } from '../domain/proof'
import { STATE_META } from '../domain/states'
import type { InfoReason, LineOutcome, Minor, NegotiationRequest, RequestLine } from '../domain/types'
import { productBySku, useRfq } from '../store'
import { CheckBadge, Countdown, Field, Modal, Money, StatusPill } from './ui'

const MAX_INFO_REQUESTS = guardrailValue('maxInfoRequests')
const DEFAULT_VALIDITY = guardrailValue('offerValidityDays')

const BAND_TONE: Record<MarginBand, string> = {
  healthy: 'good', thin: 'warn', below_floor: 'bad', unknown: 'neutral',
}
const BAND_KEY: Record<MarginBand, string> = {
  healthy: 'bandHealthy', thin: 'bandThin', below_floor: 'bandBelowFloor', unknown: 'costNotConfigured',
}

/** AC-5.2 — the controlled vocabulary, localised at render time like everything else. */
const FREQUENCY_KEY: Record<NonNullable<RequestLine['frequency']>, string> = {
  one_off: 'freqOneOff', weekly: 'freqWeekly', fortnightly: 'freqFortnightly', monthly: 'freqMonthly',
}

/** AC-2.4 — the equivalent unit count, from the catalogue rather than the line. */
function productUnits(sku: string): number {
  return productBySku(sku).unitsPerCase
}

function productBaseUnit(sku: string, lang: Lang): string {
  return productBySku(sku).baseUnit[lang]
}

/** One row of the buyer's submission, read back. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="hb-readrow">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

export function SellerRequestPage({ request, onBack }: {
  request: NegotiationRequest
  onBack: () => void
}) {
  const { state, dispatch, lang } = useRfq()
  const line = request.lines[0]
  /**
   * The counter price, as typed. It is the only staged input on the page — Accept and
   * Decline need nothing beyond the click, and Counter needs this. Everything else the
   * decision shows is derived from it, so the margin and the floor warning track what the
   * seller is typing rather than what they last committed to.
   */
  const [priceText, setPriceText] = useState('')
  const [validityDays, setValidityDays] = useState(DEFAULT_VALIDITY)
  const [infoOpen, setInfoOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  /** §5 — the acceptance that also writes the price forward, as a choice under Accept. */
  const [asTemplate, setAsTemplate] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)

  const readOnly = STATE_META[request.state].terminal || STATE_META[request.state].turn !== 'seller'

  const counterPrice = parseMoney(priceText)
  /** What the seller is currently proposing: the typed counter, or the ask as it stands. */
  const livePrice = counterPrice ?? line.askedPrice

  /**
   * FR-6.7 / AC-15.2 — margin recalculates from the cost snapshot already on the line,
   * with no server round-trip, so the 300 ms budget is met by construction (T3).
   */
  const liveMargin = marginAfterAsk([{ ...line, askedPrice: livePrice }])
  const margin = lineMargin(livePrice ?? line.listPriceSnapshot, line.costSnapshot)

  // AC-15.5 — a counter below floor is blocked unless the permission is held and a reason
  // is written. It only bites on a counter: an acceptance is the buyer's own number, and a
  // decline resolves at list price.
  const floorBreached = line.floorSnapshot !== null && counterPrice !== null
    && counterPrice < line.floorSnapshot
  const overrideOk = !floorBreached || (state.canOverrideFloor && overrideReason.trim().length > 0)

  /** Resolve the request in one move, with the outcome the button names. */
  function resolve(outcome: Exclude<LineOutcome, 'pending'>, price: Minor | null) {
    dispatch({
      type: 'seller_responds',
      ref: request.ref,
      decisions: { [line.id]: { outcome, price } },
      validityDays,
      overrideReason: floorBreached ? overrideReason.trim() : null,
    })
    onBack()
  }

  /** §5 — accept the ask exactly as sent: once, or once and forward as a template. */
  function accept() {
    if (asTemplate) { setTemplateOpen(true); return }
    dispatch({ type: 'seller_accepts', ref: request.ref })
    onBack()
  }

  function counter() {
    // The button is already disabled in both cases; these are the second guard.
    if (counterPrice === null) { setSendError(t(lang, 'counterNeedsPrice')); return }
    if (!overrideOk) {
      setSendError(t(lang, 'floorBlocked', {
        floor: formatMoney(line.floorSnapshot as Minor, { withCurrency: true, lang }), sku: line.sku,
      }))
      return
    }
    resolve('countered', counterPrice)
  }

  /** FR-6.3 — a declined line resolves at list price; the reducer applies that. */
  function decline() {
    resolve('declined', null)
  }

  function setPrice(raw: string) {
    setPriceText(raw)
    setSendError(null)
  }

  const typed = line.proof?.typed ?? null

  return (
    <>
      <button type="button" className="hb-btn hb-btn--quiet hb-btn--sm hb-backlink" onClick={onBack}>
        <span aria-hidden="true">←</span>{t(lang, 'backToQueue')}
      </button>

      {/* The state of play, before anything is read: whose turn, how long, what it costs. */}
      <div className="hb-card">
        <div className="hb-card-body hb-row">
          <span className="hb-ref">{request.ref}</span>
          <StatusPill state={request.state} viewer="seller" lang={lang} />
          {(request.slaDueAt ?? request.offerExpiresAt) && (
            <span className="hb-hint">
              {t(lang, request.slaDueAt ? 'slaRemaining' : 'offerExpiresIn')}:{' '}
              <Countdown
                dueAt={request.slaDueAt ?? request.offerExpiresAt} now={state.now} lang={lang}
                escalate={isEscalated(request.slaDueAt, state.now)}
              />
            </span>
          )}
          {/* AC-14.2 — margin is stated in words as well as colour (FR-11.5). */}
          {liveMargin.pct !== null && (
            <span className={`hb-pill hb-pill--${BAND_TONE[liveMargin.band]}`}>
              {t(lang, 'requestMargin')}: {liveMargin.pct}% · {t(lang, BAND_KEY[liveMargin.band])}
            </span>
          )}
          <span className="hb-hint" style={{ marginInlineStart: 'auto' }} dir="ltr">
            {t(lang, 'submittedAt')} {(request.submittedAt ?? '').replace('T', ' ').slice(0, 16)} UTC
          </span>
        </div>
      </div>

      {/* ── What the buyer sent — the form, read back ─────────────────────── */}
      <div className="hb-card">
        <div className="hb-card-head">
          <div>
            <h2 className="hb-h2">{t(lang, 'whatBuyerSent')}</h2>
            <p className="hb-hint">{t(lang, 'whatBuyerSentHint')}</p>
          </div>
        </div>
        <div className="hb-card-body">
          <dl className="hb-readback">
            <Row label={t(lang, 'requestRoute')}>
              <span className={`hb-pill hb-pill--${line.route === 'case_1' ? 'info' : 'neutral'}`}>
                {t(lang, line.route === 'case_1' ? 'routeCase1' : 'routeCase2')}
              </span>
            </Row>
            <Row label={t(lang, 'product')}>
              <strong>{line.productName[lang]}</strong>
              <div className="hb-hint">{line.sku}</div>
            </Row>
            <Row label={t(lang, 'quantity')}>
              <span className="hb-num">{line.quantity}</span>
              <div className="hb-hint">
                {t(lang, 'equalsUnits', {
                  units: line.quantity * (productUnits(line.sku) ?? 1),
                  uom: productBaseUnit(line.sku, lang),
                })}
              </div>
            </Row>
            <Row label={t(lang, 'listPrice')}><Money value={line.listPriceSnapshot} lang={lang} withCurrency /></Row>
            {/* AC-9.2 — a Case 2 line shows "—", never an inferred value. */}
            <Row label={t(lang, 'askedPrice')}>
              <Money value={line.askedPrice} lang={lang} withCurrency />
            </Row>
            {line.route === 'case_1' && (
              <>
                <Row label={t(lang, 'competitorName')}>{typed?.supplier || t(lang, 'notProvided')}</Row>
                <Row label={t(lang, 'theirReference')}>{typed?.sku || t(lang, 'notProvided')}</Row>
                <Row label={t(lang, 'documentDateLabel')}>{typed?.documentDate || t(lang, 'notProvided')}</Row>
              </>
            )}
            <Row label={t(lang, 'attachment')}>
              {line.proof
                ? <span dir="ltr">{line.proof.fileName} · {Math.round(line.proof.sizeBytes / 1024)} KB</span>
                : <span className="hb-muted">{t(lang, 'noAttachment')}</span>}
            </Row>
            {/* §4/§11 — captured metadata: shown and recorded, never priced (Q-8). */}
            {line.frequency && (
              <Row label={t(lang, 'frequency')}>{t(lang, FREQUENCY_KEY[line.frequency])}</Row>
            )}
            <Row label={t(lang, 'specialCredit')}>
              {line.specialCredit
                ? <span className="hb-pill hb-pill--info">{t(lang, 'specialCreditOn')}</span>
                : <span className="hb-muted">—</span>}
            </Row>
            <Row label={t(lang, 'noteToSeller')}>
              {line.note || <span className="hb-muted">{t(lang, 'notProvided')}</span>}
            </Row>
          </dl>
        </div>
      </div>

      {/* ── The document and its checks ───────────────────────────────────── */}
      {line.proof && (
        <div className="hb-card">
          <div className="hb-card-body">
            <ProofPanel line={line} lang={lang} onRequestInfo={() => setInfoOpen(true)} />
          </div>
        </div>
      )}

      {/* ── The decision ──────────────────────────────────────────────────── */}
      <div className="hb-card">
        <div className="hb-card-head"><h2 className="hb-h2">{t(lang, 'yourDecision')}</h2></div>
        <div className="hb-card-body">
          {readOnly ? (
            <p className="hb-sub">{t(lang, 'readOnlyRequest')}</p>
          ) : (
            <>
              {sendError && <div className="hb-banner hb-banner--bad" style={{ marginBottom: 12 }}>{sendError}</div>}
              {request.infoRequests >= MAX_INFO_REQUESTS && (
                <div className="hb-banner hb-banner--warn" style={{ marginBottom: 12 }}>{t(lang, 'infoRequestsExhausted')}</div>
              )}

              {/*
                Four actions, and the inputs one of them needs.
                §5's moves are not equals and the buttons no longer pretend they are:
                Accept is the primary, Counter the secondary that carries the typed price,
                Decline the quiet destructive one (FR-11.6), and Request more info the
                quietest of the four because it decides nothing — it sends the request back
                for better evidence (US-17). Each acts on click; nothing selects a mode and
                waits for a second button to mean it.
              */}
              <div className="hb-row" style={{ alignItems: 'flex-end' }}>
                <Field
                  label={t(lang, 'counterPrice')}
                  hint={t(lang, 'counterNeedsPrice')}
                  error={floorBreached && !state.canOverrideFloor
                    ? t(lang, 'floorBlocked', { floor: formatMoney(line.floorSnapshot as Minor, { withCurrency: true, lang }), sku: line.sku })
                    : null}
                >
                  <input className="hb-input" inputMode="decimal" style={{ minWidth: 140 }}
                    value={priceText} onChange={(e) => setPrice(e.target.value)} />
                </Field>
                {/* AC-15.6 / FR-6.8 — a counter carries an expiry, editable within bounds. */}
                <Field label={t(lang, 'offerValidFor')}>
                  <select className="hb-select" value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value))}>
                    {[1, 3, 7, 14, 30].map((x) => <option key={x} value={x}>{x} {t(lang, 'days')}</option>)}
                  </select>
                </Field>
                {/* FR-6.9 / AC-19.6 — a one-click repeat of a recent agreed price. */}
                <div style={{ marginBottom: 15 }}>
                  <PreviousPrice line={line} onUse={(p) => setPrice(formatMoney(p))} lang={lang} />
                </div>
                {/* AC-14.2 — margin in words as well as colour, against the live price. */}
                <span style={{ marginInlineStart: 'auto', marginBottom: 15 }}>
                  {margin !== null ? (
                    <span className={`hb-pill hb-pill--${floorBreached ? 'bad' : margin >= 20 ? 'good' : 'warn'}`}>
                      {t(lang, 'lineMargin')} {margin}%
                    </span>
                  ) : (
                    <span className="hb-pill hb-pill--neutral" tabIndex={0} title={t(lang, 'costNotConfigured')}>—</span>
                  )}
                </span>
              </div>

              {/* FR-10.3 — an override needs the permission, a confirmation and a recorded reason. */}
              {floorBreached && state.canOverrideFloor && (
                <div className="hb-banner hb-banner--bad" style={{ marginBottom: 4 }}>
                  <div style={{ width: '100%' }}>
                    <strong>{t(lang, 'floorBlocked', {
                      floor: formatMoney(line.floorSnapshot as Minor, { withCurrency: true, lang }),
                      sku: line.sku,
                    })}</strong>
                    <Field label={t(lang, 'floorOverrideReason')}>
                      <input className="hb-input" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
                    </Field>
                  </div>
                </div>
              )}

              {/*
                §5 — the acceptance that also writes the price forward. It is the same
                decision as Accept, not a fifth action, so it rides on Accept as a choice
                rather than adding a button to a row of four.
              */}
              {state.canCreateTemplate && line.askedPrice !== null && (
                <label className="hb-field hb-checkfield" style={{ marginBottom: 0 }}>
                  <input type="checkbox" checked={asTemplate} onChange={(e) => setAsTemplate(e.target.checked)} />
                  <span>
                    <span className="hb-label" style={{ marginBottom: 2 }}>{t(lang, 'alsoSaveTemplate')}</span>
                    <span className="hb-hint" style={{ marginTop: 0 }}>{t(lang, 'alsoSaveTemplateHint')}</span>
                  </span>
                </label>
              )}
            </>
          )}
        </div>

        {!readOnly && (
          <div className="hb-modal-foot">
            {/* Quietest: it decides nothing, it asks for better evidence (US-17). */}
            {line.route === 'case_1' && (
              <button
                type="button" className="hb-btn hb-btn--quiet"
                disabled={request.infoRequests >= MAX_INFO_REQUESTS}
                title={request.infoRequests >= MAX_INFO_REQUESTS ? t(lang, 'infoRequestsExhausted') : undefined}
                onClick={() => setInfoOpen(true)}
              >
                {t(lang, 'requestMoreInfo')}
              </button>
            )}
            {/* FR-11.6 — destructive, so quiet and never primary. */}
            <button type="button" className="hb-btn hb-btn--danger" onClick={decline}>
              {t(lang, 'decline')}
            </button>
            <span className="hb-primary-slot">
              {/* Secondary: it needs the price above it before it can mean anything. */}
              <button
                type="button" className="hb-btn hb-btn--outline"
                disabled={counterPrice === null || !overrideOk}
                title={counterPrice === null ? t(lang, 'counterNeedsPrice') : undefined}
                onClick={counter}
              >
                {t(lang, 'counter')}
              </button>
              {/* Primary: §5's first move, and the one the seller most often wants. */}
              <button
                type="button" className="hb-btn hb-btn--primary"
                disabled={line.askedPrice === null}
                title={line.askedPrice === null ? t(lang, 'acceptDisabledOnPage') : undefined}
                onClick={accept}
              >
                {t(lang, 'accept')}
              </button>
            </span>
          </div>
        )}
      </div>

      {infoOpen && <InfoRequestDialog request={request} onClose={() => setInfoOpen(false)} onSent={onBack} />}
      {templateOpen && <TemplateDialog request={request} onClose={() => setTemplateOpen(false)} onSaved={onBack} />}
    </>
  )
}

/** US-16 — the proof summarised so the seller reads a badge, not a document. */
function ProofPanel({ line, lang, onRequestInfo }: { line: RequestLine; lang: Lang; onRequestInfo: () => void }) {
  const proof = line.proof
  if (!proof) return null
  const failed = hasFailedCheck(proof.checks)
  const notable = proof.checks.filter((c) => c.severity !== 'pass')
  return (
    <div className="hb-proof">
      {/* AC-16.5 — viewable in-browser without download. The prototype stands in for the
          signed-URL viewer described in FR-7.9. */}
      <div className="hb-proof-viewer">
        <div>
          <div style={{ fontSize: 28 }}>{proof.mimeType.startsWith('image/') ? '🖼' : '📄'}</div>
          <div>{proof.fileName}</div>
          <div className="hb-muted">{Math.round(proof.sizeBytes / 1024)} KB · {proof.mimeType}</div>
        </div>
      </div>

      <div className="hb-proof-grid">
        {/* FR-7.5 — typed and extracted values are always distinguishable. */}
        <div>
          <div className="hb-hint">{t(lang, 'buyerTyped')}</div>
          <div>{proof.typed.supplier}</div>
          <div className="hb-num">{proof.typed.unitPrice !== null ? formatMoney(proof.typed.unitPrice) : '—'}</div>
          <div className="hb-hint">{proof.typed.documentDate ?? '—'}</div>
        </div>
        <div>
          <div className="hb-hint">{t(lang, 'documentSays')}</div>
          <div>{proof.extracted?.supplier ?? '—'}</div>
          <div className="hb-num">{proof.extracted?.unitPrice != null ? formatMoney(proof.extracted.unitPrice) : '—'}</div>
          <div className="hb-hint">{proof.extracted?.documentDate ?? '—'}</div>
        </div>
      </div>

      {/*
        AC-16.2 still holds — every check reports pass, warn or fail with a specific reason,
        never a bare icon. What changed is which of them is worth a row: a passing check is
        the expected case and three green rows of it push the two that matter off the
        screen, so the passes collapse to one line and only the ones needing a decision are
        listed. Nothing is hidden; a warn or a fail still states its reason in full.
      */}
      {notable.length === 0 ? (
        <div className="hb-check">
          <CheckBadge severity="pass" lang={lang} />
          <div className="hb-hint" style={{ marginTop: 3 }}>{t(lang, 'allChecksPassed')}</div>
        </div>
      ) : (
        notable.map((c) => (
          <div className="hb-check" key={c.check}>
            <CheckBadge severity={c.severity} lang={lang} />
            <div>
              <strong>{t(lang, c.check === 'freshness' ? 'proofFreshness' : c.check === 'identity' ? 'proofIdentity' : 'proofDuplicate')}</strong>
              {/* EC-33 / FR-13.6 — a cross-buyer duplicate discloses a date and nothing else. */}
              <div className="hb-hint">
                {c.reasonCode.startsWith('seen_before_on_')
                  ? t(lang, 'duplicateSeenBefore', { date: c.reasonCode.replace('seen_before_on_', '') })
                  : c.reasonCode.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        ))
      )}

      {/* AC-16.3 — one tap to send it back, pre-filled with the failure reason. */}
      {failed && (
        <div style={{ padding: '10px 12px' }}>
          <button type="button" className="hb-btn hb-btn--secondary hb-btn--sm" onClick={onRequestInfo}>
            {t(lang, 'requestMoreInfo')}
          </button>
        </div>
      )}
    </div>
  )
}

/** FR-6.9 — where an accepted price for this buyer and SKU exists within 90 days. */
function PreviousPrice({ line, onUse, lang }: { line: RequestLine; onUse: (p: Minor) => void; lang: Lang }) {
  const { state } = useRfq()
  const cutoff = new Date(state.now.getTime() - SAME_AS_LAST_TIME_DAYS * 86_400_000)
  const previous = state.requests.find(
    (r) => ['accepted', 'accepted_as_template'].includes(r.state)
      && new Date(r.submittedAt ?? 0) >= cutoff
      && r.lines.some((l) => l.sku === line.sku && l.offeredPrice !== null),
  )
  const price = previous?.lines.find((l) => l.sku === line.sku)?.offeredPrice
  if (!price) return null
  return (
    <button type="button" className="hb-btn hb-btn--secondary hb-btn--sm" onClick={() => onUse(price)}>
      {t(lang, 'sameAsLastTime', { price: formatMoney(price) })}
    </button>
  )
}

/** US-17 — a mandatory controlled-vocabulary reason, without declining. */
function InfoRequestDialog({ request, onClose, onSent }: { request: NegotiationRequest; onClose: () => void; onSent: () => void }) {
  const { dispatch, lang } = useRfq()
  const [reason, setReason] = useState<InfoReason>('illegible')
  const [note, setNote] = useState('')

  const REASONS: { value: InfoReason; key: string }[] = [
    { value: 'illegible', key: 'reasonIllegible' },
    { value: 'expired', key: 'reasonExpired' },
    { value: 'sku_mismatch', key: 'reasonSkuMismatch' },
    { value: 'wrong_supplier', key: 'reasonWrongSupplier' },
    { value: 'incomplete_document', key: 'reasonIncomplete' },
    { value: 'other', key: 'reasonOther' },
  ]

  return (
    <Modal
      title={<h2 className="hb-h2">{t(lang, 'requestMoreInfo')}</h2>}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="hb-btn hb-btn--secondary" onClick={onClose}>{t(lang, 'cancel')}</button>
          <span className="hb-primary-slot">
            <button
              type="button" className="hb-btn hb-btn--primary"
              onClick={() => { dispatch({ type: 'request_more_info', ref: request.ref, reason, note: note.trim() }); onClose(); onSent() }}
            >
              {t(lang, 'sendResponse')}
            </button>
          </span>
        </>
      }
    >
      {/* AC-17.2 — the reason is mandatory and comes from a controlled list. */}
      <Field label={t(lang, 'infoReasonLabel')}>
        <select className="hb-select" value={reason} onChange={(e) => setReason(e.target.value as InfoReason)}>
          {REASONS.map((r) => <option key={r.value} value={r.value}>{t(lang, r.key)}</option>)}
        </select>
      </Field>
      <Field label={t(lang, 'noteToSeller')}>
        <textarea className="hb-textarea" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <p className="hb-hint">
        {lang === 'ar'
          ? 'طلب المعلومات لا يُحتسب جولة تفاوض، ويوقف مهلة الرد ويبدأ مهلة المشتري.'
          : 'An information request is not a negotiation round. It stops your SLA clock and starts the buyer’s response window.'}
      </p>
    </Modal>
  )
}


/** US-18 / FR-8 — write the accepted price into the buyer's price list. */
function TemplateDialog({ request, onClose, onSaved }: {
  request: NegotiationRequest
  onClose: () => void
  onSaved: () => void
}) {
  const { state, dispatch, lang } = useRfq()
  const line = request.lines[0]
  // §5 — this is the acceptance branch, so the price written forward is the ask as sent.
  const price = line.askedPrice ?? line.listPriceSnapshot

  const [validFrom, setValidFrom] = useState(state.now.toISOString().slice(0, 10))
  const [validUntil, setValidUntil] = useState(addDays(state.now, 180).toISOString().slice(0, 10))
  const [minQty, setMinQty] = useState(String(line.quantity))
  const [maxQty, setMaxQty] = useState(String(line.quantity * 4))
  const [resolution, setResolution] = useState<'replace' | 'supersede'>('supersede')

  // FR-8.3 / AC-18.4 — an existing entry must be resolved explicitly; never overwritten.
  const conflict = state.priceList.find((e) => e.sku === line.sku && e.buyerId === request.buyerId && e.active)

  return (
    <Modal
      title={<h2 className="hb-h2">{t(lang, 'acceptAsTemplate')}</h2>}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="hb-btn hb-btn--secondary" onClick={onClose}>{t(lang, 'cancel')}</button>
          <span className="hb-primary-slot">
            <button
              type="button" className="hb-btn hb-btn--primary"
              onClick={() => {
                dispatch({
                  type: 'seller_accepts_template', ref: request.ref,
                  prices: { [line.id]: price },
                  template: {
                    sku: line.sku, price, validFrom, validUntil,
                    minQty: Number(minQty), maxQty: Number(maxQty), maxOrders: null,
                  },
                  conflictResolution: conflict ? resolution : undefined,
                })
                onClose(); onSaved()
              }}
            >
              {t(lang, 'acceptAsTemplate')}
            </button>
          </span>
        </>
      }
    >
      <p className="hb-sub" style={{ marginBottom: 12 }}>
        {line.productName[lang]} · <strong>{formatMoney(price, { withCurrency: true, lang })}</strong>
      </p>

      {conflict && (
        <div className="hb-banner hb-banner--warn" style={{ marginBottom: 12 }}>
          <div style={{ width: '100%' }}>
            <div>{t(lang, 'templateConflict')}</div>
            <div className="hb-row" style={{ marginTop: 8 }}>
              <button type="button" className={`hb-btn hb-btn--sm hb-btn--secondary${resolution === 'replace' ? ' hb-btn--primary' : ''}`} onClick={() => setResolution('replace')}>{t(lang, 'replaceEntry')}</button>
              <button type="button" className={`hb-btn hb-btn--sm hb-btn--secondary${resolution === 'supersede' ? ' hb-btn--primary' : ''}`} onClick={() => setResolution('supersede')}>{t(lang, 'supersedeEntry')}</button>
            </div>
          </div>
        </div>
      )}

      {/* AC-18.2 — valid-from, valid-until (default 180 days), min and max quantity. */}
      <Field label={t(lang, 'validFrom')}><input className="hb-input" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} /></Field>
      <Field label={t(lang, 'validUntil')}><input className="hb-input" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></Field>
      <Field label={t(lang, 'minQty')}><input className="hb-input" inputMode="numeric" value={minQty} onChange={(e) => setMinQty(e.target.value)} /></Field>
      <Field label={t(lang, 'maxQty')}><input className="hb-input" inputMode="numeric" value={maxQty} onChange={(e) => setMaxQty(e.target.value)} /></Field>
    </Modal>
  )
}
