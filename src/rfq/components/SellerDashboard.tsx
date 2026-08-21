/**
 * Seller Dashboard — US-14 … US-19.
 *
 * G2 is the whole point of the queue: most requests should be decidable without opening
 * the detail view, which is only true if the row already shows what the ask does to
 * margin (PP3.1). Margin never leaves this surface (A7).
 */

import { useMemo, useState } from 'react'
import { addDays, isEscalated } from '../domain/clocks'
import { guardrailValue, SAME_AS_LAST_TIME_DAYS } from '../domain/guardrails'
import { t, type Lang } from '../domain/i18n'
import { formatMoney, parseMoney } from '../domain/money'
import { lineMargin, marginAfterAsk, type MarginBand } from '../domain/margin'
import { hasFailedCheck } from '../domain/proof'
import { STATE_META } from '../domain/states'
import type { InfoReason, LineOutcome, Minor, NegotiationRequest, RequestLine } from '../domain/types'
import { useRfq } from '../store'
import { CheckBadge, Countdown, Empty, Field, Modal, Money, RouteTags, StatusPill } from './ui'
import { DashboardChrome, type NavGroup } from './Chrome'
import { Inbox } from './Inbox'
import { Orders } from './Orders'
import { buildInbox, unreadCount } from '../domain/inbox'

const MAX_INFO_REQUESTS = guardrailValue('maxInfoRequests')
const DEFAULT_VALIDITY = guardrailValue('offerValidityDays')

const BAND_TONE: Record<MarginBand, string> = {
  healthy: 'good', thin: 'warn', below_floor: 'bad', unknown: 'neutral',
}
const BAND_KEY: Record<MarginBand, string> = {
  healthy: 'bandHealthy', thin: 'bandThin', below_floor: 'bandBelowFloor', unknown: 'costNotConfigured',
}

export function SellerDashboard() {
  const { state, dispatch, lang, setLang } = useRfq()
  const [tab, setTab] = useState<'special' | 'rfq' | 'sent'>('special')
  const [openRef, setOpenRef] = useState<string | null>(null)
  // Feature Flow Draft §8/§9 — the seller gets the same Inbox and the same order list.
  const [section, setSection] = useState<'special' | 'inbox' | 'orders'>('special')
  // The three decisions are taken from the row now, so the two irreversible ones get a
  // confirmation that puts the numbers in front of the seller first (FR-5.3 is a seller
  // fact, so it belongs in a seller confirmation).
  const [confirming, setConfirming] = useState<{ ref: string; kind: 'accept' | 'decline' } | null>(null)

  const rows = useMemo(() => {
    return state.requests
      .filter((r) => STATE_META[r.state].sellerLabel !== null)
      .filter((r) => {
        const live = !STATE_META[r.state].terminal && r.state !== 'draft'
        // FR-5.1 — Special price · RFQ · Sent.
        if (tab === 'sent') return !live || r.state === 'countered_by_seller' || r.state === 'info_requested'
        if (!live) return false
        if (r.state === 'countered_by_seller' || r.state === 'info_requested') return false
        const anyCase1 = r.lines.some((l) => l.route === 'case_1')
        return tab === 'special' ? anyCase1 : !anyCase1
      })
      // AC-14.4 — default sort is SLA ascending, so the most urgent row is first.
      .sort((a, b) => (a.slaDueAt ?? '9999').localeCompare(b.slaDueAt ?? '9999'))
  }, [state.requests, tab])

  const open = state.requests.find((r) => r.ref === openRef) ?? null

  const unread = unreadCount(buildInbox(state.requests, 'seller'))

  const groups: NavGroup[] = [
    { label: t(lang, 'navOverview'), items: [{ key: 'dashboard', icon: '▦', label: t(lang, 'navDashboard') }] },
    { label: t(lang, 'navComms'), items: [
      { key: 'inbox', icon: '📥', label: t(lang, 'navInbox'), badge: unread || undefined },
      { key: 'messages', icon: '💬', label: t(lang, 'navMessagesCenter') },
      { key: 'buyers', icon: '👥', label: t(lang, 'navBuyerList') },
    ] },
    { label: t(lang, 'navSelling'), items: [
      { key: 'orders', icon: '🛒', label: t(lang, 'navFinalOrders') },
      { key: 'rfqs', icon: '📄', label: t(lang, 'navRfqs') },
      { key: 'special', icon: '🏷', label: t(lang, 'navSpecialPrice') },
      { key: 'quotations', icon: '🧾', label: t(lang, 'navQuotations') },
      { key: 'pricelists', icon: '📋', label: t(lang, 'navPriceLists') },
    ] },
  ]

  const HEAD = {
    special: { title: t(lang, 'sellerQueue'), subtitle: t(lang, 'sellerSubtitle'), crumb: t(lang, 'navSpecialPrice') },
    inbox: { title: t(lang, 'inboxTitle'), subtitle: t(lang, 'inboxSubtitleSeller'), crumb: t(lang, 'navInbox') },
    orders: { title: t(lang, 'ordersTitle'), subtitle: t(lang, 'ordersSubtitleSeller'), crumb: t(lang, 'navFinalOrders') },
  }[section]

  return (
    <DashboardChrome
      lang={lang} setLang={setLang} viewer="seller"
      groups={groups} active={section} alerts={unread}
      onNavigate={(key) => { if (key === 'inbox' || key === 'orders' || key === 'special') setSection(key) }}
      title={HEAD.title}
      subtitle={HEAD.subtitle}
      breadcrumb={HEAD.crumb}
    >

      {/* EC-21 — a misconfigured floor raises an operations alert rather than firing. */}
      {state.opsAlerts.length > 0 && section === 'special' && (
        <div className="hb-banner hb-banner--warn" style={{ marginBottom: 14 }}>
          <div>{state.opsAlerts[state.opsAlerts.length - 1]}</div>
        </div>
      )}

      {section === 'inbox' && (
        <Inbox
          requests={state.requests} viewer="seller" lang={lang}
          onOpen={(ref) => { setSection('special'); setOpenRef(ref) }}
        />
      )}

      {section === 'orders' && <Orders viewer="seller" lang={lang} />}

      {section === 'special' && (
      <div className="hb-card">
        <div className="hb-card-head" style={{ paddingBottom: 0, borderBottom: 'none' }}>
          <div className="hb-tabs" style={{ border: 'none' }}>
            <button type="button" className="hb-tab" aria-selected={tab === 'special'} onClick={() => setTab('special')}>{t(lang, 'tabSpecialPrice')}</button>
            <button type="button" className="hb-tab" aria-selected={tab === 'rfq'} onClick={() => setTab('rfq')}>{t(lang, 'tabRfq')}</button>
            <button type="button" className="hb-tab" aria-selected={tab === 'sent'} onClick={() => setTab('sent')}>{t(lang, 'tabSent')}</button>
          </div>
        </div>

        {rows.length === 0 ? (
          <Empty
            title={lang === 'ar' ? 'لا توجد طلبات هنا' : 'Nothing in this queue'}
            body={lang === 'ar' ? 'ستظهر الطلبات الجديدة هنا فور وصولها.' : 'New requests land here as buyers send them.'}
          />
        ) : (
          <div className="hb-table-wrap">
            <table className="hb-table">
              <thead>
                <tr>
                  <th>{t(lang, 'buyer')}</th>
                  <th>{t(lang, 'requestType')}</th>
                  <th>{t(lang, 'lines')}</th>
                  <th>{t(lang, 'askedVsList')}</th>
                  <th>{t(lang, 'status')}</th>
                  <th>{t(lang, 'actionsColumn')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const margin = marginAfterAsk(r.lines)
                  // AC-14.4 sorts this queue by SLA. The countdown column is gone, so the
                  // tint is now the only urgency signal in the list — the number itself is
                  // on the response panel, beside the decision it constrains.
                  const escalated = isEscalated(r.slaDueAt, state.now)
                  const open = () => { dispatch({ type: 'seller_opens', ref: r.ref }); setOpenRef(r.ref) }
                  const mine = STATE_META[r.state].turn === 'seller'
                  // §5 — "Accept" takes the ask exactly as sent, so every line needs one.
                  const acceptableAsAsked = r.lines.every((l) => l.askedPrice !== null)
                  return (
                    <tr
                      key={r.ref} className={`hb-clickable${escalated ? ' hb-row-action' : ''}`}
                      onClick={open}
                    >
                      <td>
                        <strong>{r.buyerName}</strong>
                        <div className="hb-ref" style={{ fontSize: 12 }}>{r.ref}</div>
                      </td>
                      <td><RouteTags lines={r.lines} lang={lang} /></td>
                      <td className="hb-num">
                        {r.lines.length}
                        {/* AC-14.3 — the row states how many lines are quote-only. */}
                        {margin.quoteOnlyLines > 0 && (
                          <div className="hb-hint">{t(lang, 'quoteOnlyLines', { n: margin.quoteOnlyLines })}</div>
                        )}
                      </td>
                      <td>
                        <Money value={margin.askedTotal} lang={lang} />
                        <div className="hb-hint hb-strike">{formatMoney(margin.listTotal)}</div>
                      </td>
                      <td><StatusPill state={r.state} viewer="seller" lang={lang} /></td>
                      <td>
                        <div className="hb-rowactions">
                          {mine ? (
                            <>
                              {/*
                                §5 — the seller's three decisions, in the row. Accept and
                                Decline settle the request from here; Counter cannot, because
                                it needs a price typed per line, so it opens the panel.
                              */}
                              <button
                                type="button" className="hb-btn hb-btn--sm hb-btn--primary"
                                // E-2 — a Case 2 line has no asked price, so there is nothing
                                // to accept as-is; the control says so rather than going quiet.
                                disabled={!acceptableAsAsked}
                                title={acceptableAsAsked ? undefined : t(lang, 'acceptDisabledQuoteOnly')}
                                onClick={(e) => { e.stopPropagation(); setConfirming({ ref: r.ref, kind: 'accept' }) }}
                              >
                                {t(lang, 'accept')}
                              </button>
                              <button
                                type="button" className="hb-btn hb-btn--sm hb-btn--secondary"
                                onClick={(e) => { e.stopPropagation(); open() }}
                              >
                                {t(lang, 'counter')}
                              </button>
                              {/* FR-11.6 — the destructive action is quiet and never primary. */}
                              <button
                                type="button" className="hb-btn hb-btn--sm hb-btn--danger"
                                onClick={(e) => { e.stopPropagation(); setConfirming({ ref: r.ref, kind: 'decline' }) }}
                              >
                                {t(lang, 'decline')}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button" className="hb-btn hb-btn--sm hb-btn--secondary"
                              onClick={(e) => { e.stopPropagation(); open() }}
                            >
                              {t(lang, 'viewRequest')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {open && <RespondPanel request={open} onClose={() => setOpenRef(null)} />}

      {confirming && (
        <DecisionConfirm
          request={state.requests.find((r) => r.ref === confirming.ref) as NegotiationRequest}
          kind={confirming.kind}
          onClose={() => setConfirming(null)}
        />
      )}
    </DashboardChrome>
  )
}

interface Decision { outcome: LineOutcome; price: Minor | null }

/**
 * Feature Flow Draft §5 — confirming a decision taken from the queue row.
 *
 * Accept and Decline are irreversible and, taken from a row, are taken without the panel's
 * numbers in view. So the confirmation carries them: the ask against list, and the margin
 * that ask leaves. That is seller-internal (FR-5.3 / A7) and never crosses to the buyer.
 *
 * A floor breach is not confirmable here at all. AC-15.5 requires a written reason for an
 * override, and there is nowhere to write one in a two-button dialog, so the seller is sent
 * to the panel instead of being offered a shortcut past the guard.
 */
function DecisionConfirm({ request, kind, onClose }: {
  request: NegotiationRequest
  kind: 'accept' | 'decline'
  onClose: () => void
}) {
  const { state, dispatch, lang } = useRfq()
  const margin = marginAfterAsk(request.lines)
  const belowFloor = request.lines.find(
    (l) => l.floorSnapshot !== null && l.askedPrice !== null && l.askedPrice < l.floorSnapshot,
  )
  const blocked = kind === 'accept' && belowFloor !== undefined

  function run() {
    if (kind === 'accept') {
      dispatch({ type: 'seller_accepts', ref: request.ref })
    } else {
      // FR-6.3 — a declined line resolves at list price; the reducer applies that.
      dispatch({
        type: 'seller_responds', ref: request.ref,
        decisions: Object.fromEntries(
          request.lines.map((l) => [l.id, { outcome: 'declined' as LineOutcome, price: null }]),
        ),
        validityDays: DEFAULT_VALIDITY, overrideReason: null,
      })
    }
    onClose()
  }

  return (
    <Modal
      title={<h2 className="hb-h2">{t(lang, kind === 'accept' ? 'confirmSellerAcceptTitle' : 'confirmSellerDeclineTitle')}</h2>}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="hb-btn hb-btn--secondary" onClick={onClose}>{t(lang, 'cancel')}</button>
          <span className="hb-primary-slot">
            {blocked ? (
              <button type="button" className="hb-btn hb-btn--primary" onClick={onClose}>
                {t(lang, 'viewRequest')}
              </button>
            ) : (
              <button
                type="button"
                className={`hb-btn hb-btn--${kind === 'accept' ? 'primary' : 'danger'}`}
                onClick={run}
              >
                {t(lang, kind === 'accept' ? 'accept' : 'decline')}
              </button>
            )}
          </span>
        </>
      }
    >
      <p className="hb-sub" style={{ marginBottom: 14 }}>
        {t(lang, kind === 'accept' ? 'confirmSellerAcceptBody' : 'confirmSellerDeclineBody')}
      </p>

      <div className="hb-row" style={{ marginBottom: 12 }}>
        <span className="hb-hint">{request.buyerName}</span>
        <span className="hb-ref">{request.ref}</span>
      </div>

      {/* The numbers the row no longer shows, at the moment they decide something. */}
      <div className="hb-table-wrap">
        <table className="hb-table">
          <thead>
            <tr>
              <th>{t(lang, 'askedVsList')}</th>
              <th>{t(lang, 'requestMargin')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <Money value={margin.askedTotal} lang={lang} withCurrency />
                <div className="hb-hint hb-strike">{formatMoney(margin.listTotal, { withCurrency: true, lang })}</div>
              </td>
              <td>
                {margin.pct === null ? (
                  <span className="hb-pill hb-pill--neutral">
                    {t(lang, margin.reason === 'cost_missing' ? 'costNotConfigured' : 'quoteRequested')}
                  </span>
                ) : (
                  <span className={`hb-pill hb-pill--${BAND_TONE[margin.band]}`}>
                    {margin.pct}% · {t(lang, BAND_KEY[margin.band])}
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {blocked && belowFloor && (
        <div className="hb-banner hb-banner--bad" style={{ marginTop: 14 }}>
          {t(lang, 'belowFloorWarning', { sku: belowFloor.sku })}
        </div>
      )}

      {/* AC-15.6 — an acceptance settles the request; there is no offer clock left to run. */}
      {kind === 'accept' && !blocked && state.canCreateTemplate && (
        <p className="hb-hint" style={{ marginTop: 12 }}>
          {lang === 'ar'
            ? 'لحفظ هذا السعر لطلبات المشتري القادمة، افتح الطلب واستخدم «اقبل واحفظه كقالب».'
            : 'To carry this price forward to their next orders, open the request and use “Accept & apply as template”.'}
        </p>
      )}
    </Modal>
  )
}

/** US-15 … US-18 — the response surface: line by line, with live margin. */
function RespondPanel({ request, onClose }: { request: NegotiationRequest; onClose: () => void }) {
  const { state, dispatch, lang } = useRfq()
  const [decisions, setDecisions] = useState<Record<string, Decision>>(
    Object.fromEntries(request.lines.map((l) => [l.id, { outcome: 'pending' as LineOutcome, price: null }])),
  )
  const [priceText, setPriceText] = useState<Record<string, string>>({})
  const [validityDays, setValidityDays] = useState(DEFAULT_VALIDITY)
  const [infoOpen, setInfoOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)

  const readOnly = STATE_META[request.state].terminal || STATE_META[request.state].turn !== 'seller'

  function setLine(l: RequestLine, outcome: LineOutcome, raw?: string) {
    const price = outcome === 'accepted' ? l.askedPrice
      : outcome === 'declined' ? l.listPriceSnapshot
        : raw !== undefined ? parseMoney(raw) : decisions[l.id]?.price ?? null
    setDecisions((d) => ({ ...d, [l.id]: { outcome, price } }))
    if (raw !== undefined) setPriceText((p) => ({ ...p, [l.id]: raw }))
  }

  /**
   * FR-6.7 / AC-15.2 — margin recalculates from the cost snapshot already on the line,
   * with no server round-trip, so the 300 ms budget is met by construction (T3).
   */
  const projected = request.lines.map((l) => {
    const d = decisions[l.id]
    const price = d?.outcome === 'declined' ? l.listPriceSnapshot : d?.price ?? l.askedPrice
    return { ...l, askedPrice: price }
  })
  const liveMargin = marginAfterAsk(projected)

  const unresolved = request.lines.filter((l) => decisions[l.id]?.outcome === 'pending')
  // AC-15.5 — a counter below floor blocks the send unless the override permission is held.
  const belowFloor = request.lines.filter((l) => {
    const d = decisions[l.id]
    if (!d || d.price === null || l.floorSnapshot === null) return false
    return d.outcome !== 'declined' && d.price < l.floorSnapshot
  })
  const needsOverride = belowFloor.length > 0
  // §5 — accepting "as-is" needs something to accept. A Case 2 line has no asked price.
  const acceptableAsAsked = request.lines.every((l) => l.askedPrice !== null)
  const overrideOk = !needsOverride || (state.canOverrideFloor && overrideReason.trim().length > 0)

  function send() {
    // AC-15.4 — sending is blocked and the unresolved lines are named.
    if (unresolved.length > 0) {
      setSendError(t(lang, 'unresolvedLines', { skus: unresolved.map((l) => l.sku).join(', ') }))
      return
    }
    if (!overrideOk) {
      const l = belowFloor[0]
      setSendError(t(lang, 'floorBlocked', { floor: formatMoney(l.floorSnapshot as Minor, { withCurrency: true, lang }), sku: l.sku }))
      return
    }
    dispatch({
      type: 'seller_responds', ref: request.ref, decisions, validityDays,
      overrideReason: needsOverride ? overrideReason.trim() : null,
    })
    onClose()
  }

  return (
    <Modal
      wide
      title={
        <div>
          <h2 className="hb-h2">{request.buyerName}</h2>
          <div className="hb-row" style={{ marginTop: 6 }}>
            <span className="hb-hint hb-num">{request.ref}</span>
            <StatusPill state={request.state} viewer="seller" lang={lang} />
            {/*
              AC-14.5 / FR-4.6 — the SLA countdown moved off the queue row and onto the
              decision itself, where it constrains what the seller is about to do. It is
              still interpolated from the server clock, so both surfaces agree to the minute.
            */}
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
          </div>
        </div>
      }
      onClose={onClose}
      footer={readOnly ? (
        <span className="hb-hint">{lang === 'ar' ? 'هذا الطلب للقراءة فقط الآن.' : 'This request is read-only now.'}</span>
      ) : (
        <>
          {/* US-17 — send it back for better evidence, without declining. */}
          {request.lines.some((l) => l.route === 'case_1') && (
            <button
              type="button" className="hb-btn hb-btn--secondary"
              disabled={request.infoRequests >= MAX_INFO_REQUESTS}
              title={request.infoRequests >= MAX_INFO_REQUESTS ? t(lang, 'infoRequestsExhausted') : undefined}
              onClick={() => setInfoOpen(true)}
            >
              {t(lang, 'requestMoreInfo')}
            </button>
          )}
          {/*
            Feature Flow Draft §5 — Accept and "Accept & apply as template" are two
            decisions, not one with a checkbox: the first settles this order, the second
            also writes the price forward. Both take the ask exactly as sent, so neither
            is offered unless every line carries one — an RFQ line has no price to accept.
          */}
          {acceptableAsAsked && (
            <button
              type="button" className="hb-btn hb-btn--secondary"
              onClick={() => { dispatch({ type: 'seller_accepts', ref: request.ref }); onClose() }}
            >
              {t(lang, 'acceptThisOrderOnly')}
            </button>
          )}
          {state.canCreateTemplate && acceptableAsAsked && (
            <button type="button" className="hb-btn hb-btn--secondary" onClick={() => setTemplateOpen(true)}>
              {t(lang, 'acceptAsTemplate')}
            </button>
          )}
          {/* Modify and Reject are the per-line decisions above; this sends them. */}
          <span className="hb-primary-slot">
            <button type="button" className="hb-btn hb-btn--primary" onClick={send}>{t(lang, 'sendResponse')}</button>
          </span>
        </>
      )}
    >
      {sendError && <div className="hb-banner hb-banner--bad" style={{ marginBottom: 12 }}>{sendError}</div>}

      {request.infoRequests >= MAX_INFO_REQUESTS && (
        <div className="hb-banner hb-banner--warn" style={{ marginBottom: 12 }}>{t(lang, 'infoRequestsExhausted')}</div>
      )}

      <div className="hb-stack">
        {request.lines.map((l) => {
          const d = decisions[l.id]
          const price = d?.outcome === 'declined' ? l.listPriceSnapshot : d?.price ?? l.askedPrice
          const margin = lineMargin(price ?? l.listPriceSnapshot, l.costSnapshot)
          const floorBreached = l.floorSnapshot !== null && price !== null && price < l.floorSnapshot && d?.outcome !== 'declined'
          return (
            <div className="hb-card" key={l.id}>
              <div className="hb-card-body">
                <div className="hb-spread" style={{ marginBottom: 10 }}>
                  <div>
                    <strong>{l.productName[lang]}</strong>
                    <div className="hb-hint">{l.sku} · {t(lang, 'quantity')} {l.quantity}</div>
                  </div>
                  <div className="hb-row">
                    <span className="hb-hint">{t(lang, 'listPrice')} <Money value={l.listPriceSnapshot} lang={lang} /></span>
                    <span className="hb-hint">{t(lang, 'askedPrice')} <Money value={l.askedPrice} lang={lang} /></span>
                    {margin !== null && (
                      <span className={`hb-pill hb-pill--${floorBreached ? 'bad' : margin >= 20 ? 'good' : 'warn'}`}>
                        {t(lang, 'lineMargin')} {margin}%
                      </span>
                    )}
                    {margin === null && (
                      <span className="hb-pill hb-pill--neutral" tabIndex={0} title={t(lang, 'costNotConfigured')}>—</span>
                    )}
                  </div>
                </div>

                {l.proof && <ProofPanel line={l} lang={lang} onRequestInfo={() => setInfoOpen(true)} />}

                {!readOnly && (
                  <>
                    <div className="hb-row" style={{ marginTop: 12 }}>
                      {/* AC-15.1 — each line independently supports all three actions. */}
                      <button type="button" className={`hb-btn hb-btn--secondary hb-btn--sm${d?.outcome === 'accepted' ? ' hb-btn--primary' : ''}`}
                        disabled={l.askedPrice === null}
                        title={l.askedPrice === null ? (lang === 'ar' ? 'لا يوجد سعر مطلوب لقبوله — قدّم عرضاً' : 'No asked price to accept — send a counter') : undefined}
                        onClick={() => setLine(l, 'accepted')}>
                        {t(lang, 'accept')}
                      </button>
                      <button type="button" className={`hb-btn hb-btn--secondary hb-btn--sm${d?.outcome === 'countered' ? ' hb-btn--primary' : ''}`}
                        onClick={() => setLine(l, 'countered', priceText[l.id] ?? '')}>
                        {t(lang, 'counter')}
                      </button>
                      <button type="button" className={`hb-btn hb-btn--sm${d?.outcome === 'declined' ? ' hb-btn--danger' : ' hb-btn--secondary'}`}
                        onClick={() => setLine(l, 'declined')}>
                        {t(lang, 'decline')}
                      </button>
                      {/* FR-6.9 / AC-19.6 — a one-click repeat of a recent agreed price. */}
                      <PreviousPrice line={l} onUse={(p) => setLine(l, 'countered', formatMoney(p))} lang={lang} />
                    </div>

                    {d?.outcome === 'countered' && (
                      <div className="hb-row" style={{ marginTop: 10 }}>
                        <Field label={t(lang, 'counterPrice')}>
                          <input className="hb-input" inputMode="decimal" style={{ minWidth: 130 }}
                            value={priceText[l.id] ?? ''} onChange={(e) => setLine(l, 'countered', e.target.value)} />
                        </Field>
                        {floorBreached && (
                          <div className="hb-error" style={{ marginTop: 24 }}>
                            {t(lang, 'floorBlocked', { floor: formatMoney(l.floorSnapshot as Minor, { withCurrency: true, lang }), sku: l.sku })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!readOnly && (
        <>
          {/* FR-10.3 — an override needs the permission, a confirmation and a recorded reason. */}
          {needsOverride && (
            <div className="hb-banner hb-banner--bad" style={{ marginTop: 14 }}>
              <div style={{ width: '100%' }}>
                <strong>{t(lang, 'floorBlocked', {
                  floor: formatMoney(belowFloor[0].floorSnapshot as Minor, { withCurrency: true, lang }),
                  sku: belowFloor[0].sku,
                })}</strong>
                {state.canOverrideFloor ? (
                  <Field label={t(lang, 'floorOverrideReason')}>
                    <input className="hb-input" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
                  </Field>
                ) : (
                  <div className="hb-hint" style={{ marginTop: 6 }}>
                    {lang === 'ar' ? 'ليس لديك صلاحية تجاوز الحد الأدنى.' : 'You do not hold the floor-override permission.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AC-15.6 / FR-6.8 — every response carries an expiry, editable within bounds. */}
          <div className="hb-row" style={{ marginTop: 14 }}>
            <Field label={t(lang, 'offerValidFor')}>
              <select className="hb-select" value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value))}>
                {[1, 3, 7, 14, 30].map((d) => <option key={d} value={d}>{d} {t(lang, 'days')}</option>)}
              </select>
            </Field>
          </div>
        </>
      )}

      {infoOpen && <InfoRequestDialog request={request} onClose={() => setInfoOpen(false)} onSent={onClose} />}
      {templateOpen && <TemplateDialog request={request} decisions={decisions} onClose={() => setTemplateOpen(false)} onSaved={onClose} />}
    </Modal>
  )
}

/** US-16 — the proof summarised so the seller reads a badge, not a document. */
function ProofPanel({ line, lang, onRequestInfo }: { line: RequestLine; lang: Lang; onRequestInfo: () => void }) {
  const proof = line.proof
  if (!proof) return null
  const failed = hasFailedCheck(proof.checks)
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

      {proof.checks.map((c) => (
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
      ))}

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
function TemplateDialog({ request, decisions, onClose, onSaved }: {
  request: NegotiationRequest
  decisions: Record<string, Decision>
  onClose: () => void
  onSaved: () => void
}) {
  const { state, dispatch, lang } = useRfq()
  const line = request.lines[0]
  const decided = decisions[line.id]
  const price = decided?.price ?? line.askedPrice ?? line.listPriceSnapshot

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
