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
import { acceptanceAllowed, isEscalated } from '../domain/clocks'
import { guardrailValue, SAME_AS_LAST_TIME_DAYS } from '../domain/guardrails'
import { t, type Lang } from '../domain/i18n'
import { formatMoney, lineTotal, parseMoney } from '../domain/money'
import { lineMargin, marginAfterAsk, type MarginBand } from '../domain/margin'
import { hasFailedCheck, triStateOutcome } from '../domain/proof'
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

/**
 * The submission, read back. Shared by both roles: the seller reads it to decide, the
 * buyer reads it to remember what they asked for and to check it before re-requesting.
 * Nothing here is editable on either side — a request is a record once it is sent.
 */
export function SubmissionReadback({ line, lang, title }: {
  line: RequestLine
  lang: Lang
  title: string
}) {
  const typed = line.proof?.typed ?? null
  return (
      <div className="hb-card">
      <div className="hb-card-head">
        <div>
          <h2 className="hb-h2">{title}</h2>
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
  /** §5 — the acceptance that also writes the price forward, as a choice under Accept. */
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

  /** Accept the ask exactly as sent. A price settles this order and no other. */
  function accept() {
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

      <SubmissionReadback line={line} lang={lang} title={t(lang, 'whatBuyerSent')} />

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

/**
 * The buyer's request page — the mirror of the seller's.
 *
 * Same shape for the same reason: this is a document to read before committing, not a
 * decision to take at a glance. What you sent, then what the supplier answered with the
 * three prices side by side (§6), then the decision — ranked by button type exactly as the
 * seller's is, because the two sides answer each other with the same moves.
 *
 * Withdraw takes the place of the seller's Request more info as the quiet fourth: it ends
 * the request rather than answering the offer, so it decides nothing about the price.
 */
export function BuyerRequestPage({ request, onBack, onBrowse }: {
  request: NegotiationRequest
  onBack: () => void
  onBrowse: () => void
}) {
  const { state, dispatch, lang } = useRfq()
  const line = request.lines[0]
  const [confirmDecline, setConfirmDecline] = useState(false)

  const meta = STATE_META[request.state]
  // EC-16 — server time decides, and an expired offer disables every decision action.
  const live = acceptanceAllowed(request.offerExpiresAt, state.now)
  const answered = request.state === 'countered_by_seller' && live
  const canWithdraw = ['submitted', 'viewed', 'info_requested', 'countered_by_seller', 'countered_by_buyer']
    .includes(request.state)

  const listTotal = lineTotal(line.listPriceSnapshot, line.quantity)
  const offeredTotal = lineTotal(line.offeredPrice ?? line.listPriceSnapshot, line.quantity)
  const saving = listTotal - offeredTotal

  return (
    <>
      <button type="button" className="hb-btn hb-btn--quiet hb-btn--sm hb-backlink" onClick={onBack}>
        <span aria-hidden="true">←</span>{t(lang, 'backToRequests')}
      </button>

      <div className="hb-card">
        <div className="hb-card-body hb-row">
          <span className="hb-ref">{request.ref}</span>
          <StatusPill state={request.state} viewer="buyer" lang={lang} />
          <span className="hb-hint">{request.sellerName}</span>
          {request.offerExpiresAt && live && (
            <span className="hb-hint">
              {t(lang, 'offerExpiresIn')}:{' '}
              <Countdown dueAt={request.offerExpiresAt} now={state.now} lang={lang} />
            </span>
          )}
          <span className="hb-hint" style={{ marginInlineStart: 'auto' }} dir="ltr">
            {t(lang, 'submittedAt')} {(request.submittedAt ?? '').replace('T', ' ').slice(0, 16)} UTC
          </span>
        </div>
      </div>

      <SubmissionReadback line={line} lang={lang} title={t(lang, 'whatYouSent')} />

          {/* ── What came back ─────────────────────────────────────────────── */}
          <div className="hb-card">
            <div className="hb-card-head"><h2 className="hb-h2">{t(lang, 'whatSupplierAnswered')}</h2></div>
            <div className="hb-card-body">
              {/* AC-11.1 — the seller's reason, verbatim, with the affected line named. */}
              {request.state === 'info_requested' && request.infoReason && (
                <div className="hb-banner hb-banner--action" style={{ marginBottom: 14 }}>
                  <div>
                    <strong>{t(lang, 'actionNeededBanner')}</strong>
                    <div style={{ marginTop: 4 }}>
                      {t(lang, `reason${request.infoReason.code.replace(/(^|_)(\w)/g, (_, __, c) => c.toUpperCase())}`)} — {request.infoReason.note}
                    </div>
                  </div>
                </div>
              )}

              {/* AC-9.6 — an expired offer disables every decision action, with the date. */}
              {!live && request.offerExpiresAt && (
                <div className="hb-banner hb-banner--bad" style={{ marginBottom: 14 }}>
                  {t(lang, 'offerExpiredOn', { date: request.offerExpiresAt.slice(0, 10) })}
                </div>
              )}

              {/* AC-22.1 — a failed negotiation never costs the buyer the goods. */}
              {['declined', 'expired', 'withdrawn'].includes(request.state) && (
                <div className="hb-banner hb-banner--info" style={{ marginBottom: 14 }}>{t(lang, 'stillPurchasable')}</div>
              )}

              {meta.turn === 'seller' && (
                <div className="hb-banner hb-banner--info" style={{ marginBottom: 14 }}>{t(lang, 'awaitingSupplier')}</div>
              )}

              {/* §6 — the original price beside what the supplier came back with. */}
              <div className="hb-table-wrap">
                <table className="hb-table">
                  <thead className="hb-compare-head">
                    <tr>
                      <th>{t(lang, 'original')}</th>
                      <th className="hb-col-asked">{t(lang, 'askedPrice')}</th>
                      <th className="hb-col-offered">{t(lang, 'supplierOffers')}</th>
                      <th>{t(lang, 'outcome')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><Money value={line.listPriceSnapshot} lang={lang} withCurrency /></td>
                      {/* AC-9.2 — a Case 2 line shows "—", never an inferred value. */}
                      <td className="hb-col-asked"><Money value={line.askedPrice} lang={lang} withCurrency /></td>
                      <td className="hb-col-offered"><Money value={line.offeredPrice} lang={lang} withCurrency /></td>
                      <td><OutcomePill line={line} lang={lang} /></td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}>{t(lang, 'requestTotal')}</td>
                      <td colSpan={2}>
                        <Money value={offeredTotal} lang={lang} withCurrency />
                        {saving > 0 && (
                          <span style={{ color: 'var(--hb-good)' }}>
                            {' · '}{t(lang, 'estimatedSaving')} {formatMoney(saving, { withCurrency: true, lang })}
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* ── The decision ───────────────────────────────────────────────── */}
          <div className="hb-card">
            <div className="hb-card-head"><h2 className="hb-h2">{t(lang, 'yourDecision')}</h2></div>
            <div className="hb-card-body">
              {answered ? (
                <p className="hb-sub">{t(lang, 'buyerDecisionHint')}</p>
              ) : request.state === 'info_requested' ? (
                <p className="hb-sub">{t(lang, 'actionNeededBanner')}</p>
              ) : meta.terminal ? (
                <p className="hb-sub">{t(lang, 'stillPurchasable')}</p>
              ) : (
                <p className="hb-sub">{t(lang, 'awaitingSupplier')}</p>
              )}
            </div>

            <div className="hb-modal-foot">
              {/* Quiet: it ends the request rather than answering the price. */}
              {canWithdraw && (
                <button type="button" className="hb-btn hb-btn--quiet"
                  onClick={() => { dispatch({ type: 'buyer_withdraws', ref: request.ref }); onBack() }}>
                  {t(lang, 'withdraw')}
                </button>
              )}
              {answered && (
                <>
                  {/* FR-11.6 — destructive, so quiet and never primary. AC-10.6 confirms it. */}
                  <button type="button" className="hb-btn hb-btn--danger" onClick={() => setConfirmDecline(true)}>
                    {t(lang, 'decline')}
                  </button>
                  {/* AC-10.1 — Accept is the single primary action on this surface. */}
                  <span className="hb-primary-slot">
                    <button type="button" className="hb-btn hb-btn--primary"
                      onClick={() => { dispatch({ type: 'buyer_accepts', ref: request.ref }); onBack() }}>
                      {t(lang, 'accept')}
                    </button>
                  </span>
                </>
              )}
              {/* US-11 — from info_requested the buyer resubmits or withdraws; no accept. */}
              {request.state === 'info_requested' && (
                <span className="hb-primary-slot">
                  <button type="button" className="hb-btn hb-btn--primary"
                    onClick={() => { dispatch({ type: 'buyer_resubmits', ref: request.ref }); onBack() }}>
                    {t(lang, 'resubmit')}
                  </button>
                </span>
              )}
              {/* AC-22.3 — a re-request is a new request, linked to the closed one. */}
              {(meta.terminal || !live) && (
                <span className="hb-primary-slot">
                  <button type="button" className="hb-btn hb-btn--primary"
                    onClick={() => { dispatch({ type: 're_request', ref: request.ref }); onBrowse() }}>
                    {t(lang, 'requestAgain')}
                  </button>
                </span>
              )}
            </div>
          </div>
      {/* AC-10.6 — a confirmation naming the consequence before a decline. */}
      {confirmDecline && (
        <Modal
          title={<h2 className="hb-h2">{t(lang, 'confirmDeclineTitle')}</h2>}
          onClose={() => setConfirmDecline(false)}
          footer={
            <>
              <button type="button" className="hb-btn hb-btn--secondary" onClick={() => setConfirmDecline(false)}>
                {t(lang, 'cancel')}
              </button>
              <span className="hb-primary-slot">
                <button type="button" className="hb-btn hb-btn--danger"
                  onClick={() => { dispatch({ type: 'buyer_declines', ref: request.ref }); setConfirmDecline(false); onBack() }}>
                  {t(lang, 'decline')}
                </button>
              </span>
            </>
          }
        >
          <p>{t(lang, 'confirmDeclineBody')}</p>
        </Modal>
      )}
    </>
  )
}

/**
 * FR-7.8 / Decision 3 — a Case 1 claim is named matched or beaten, by name, so the buyer
 * knows which of the three happened. A seller who countered *above* the asked price has not
 * declined it — it is a live counter the buyer can still accept, so it reads as a counter.
 */
function OutcomePill({ line, lang }: { line: RequestLine; lang: Lang }) {
  if (line.outcome === 'pending') return <span className="hb-pill hb-pill--neutral">{t(lang, 'pendingOutcome')}</span>
  if (line.outcome === 'declined') return <span className="hb-pill hb-pill--bad">{t(lang, 'declinedOutcome')}</span>
  if (line.route === 'case_2') return <span className="hb-pill hb-pill--good">{lang === 'ar' ? 'تم التسعير' : 'Quoted'}</span>
  const tri = triStateOutcome(line.askedPrice, line.offeredPrice, false)
  if (tri === 'beaten') return <span className="hb-pill hb-pill--good">{t(lang, 'beaten')}</span>
  if (tri === 'matched') return <span className="hb-pill hb-pill--good">{t(lang, 'matched')}</span>
  return <span className="hb-pill hb-pill--warn">{t(lang, 'counteredOutcome')}</span>
}
