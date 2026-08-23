/**
 * Buyer Dashboard — US-8 … US-13.
 *
 * Two screens: the list, which answers "which of these need me?", and the comparison,
 * which answers "what changed and what do I do about it?" in three columns.
 */

import { useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { acceptanceAllowed } from '../domain/clocks'
import { guardrailValue } from '../domain/guardrails'
import { renderHistory, t } from '../domain/i18n'
import { formatMoney, parseMoney, percentOff } from '../domain/money'
import { triStateOutcome } from '../domain/proof'
import { STATE_META } from '../domain/states'
import { toBuyerView } from '../domain/serialize'
import type { NegotiationRequest, RequestLine } from '../domain/types'
import { askedTotalOf, listTotalOf, offeredTotalOf, useRfq } from '../store'
import { Countdown, Empty, Modal, Money, RouteTags, StatusPill } from './ui'
import { DashboardChrome, type NavGroup } from './Chrome'
import { Inbox } from './Inbox'
import { Orders } from './Orders'
import { buildInbox, threadCategory, unreadCount } from '../domain/inbox'

const MAX_ROUNDS = guardrailValue('maxRounds')

export function BuyerDashboard({ onBrowse }: { onBrowse: () => void }) {
  const { state, dispatch, lang, setLang } = useRfq()
  const [openRef, setOpenRef] = useState<string | null>(null)
  /**
   * Feature Flow Draft §1/§8/§9 — every sidebar item here is a real page now. Special Price
   * Requests and RFQs are the two routes as two lists, because a priced ask backed by
   * evidence and a request to quote are answered differently and are looked for separately;
   * threadCategory puts each request in exactly one of them, so nothing is listed twice or
   * missed. Inbox and Final Orders are the draft's other two surfaces.
   */
  const [section, setSection] = useState<'special' | 'rfqs' | 'inbox' | 'orders'>('special')
  // Accept and Decline are taken from the row now, so both confirm first with the numbers
  // in view — Decline already had to (AC-10.6), and Accept is just as final.
  const [confirming, setConfirming] = useState<{ ref: string; kind: 'accept' | 'decline' } | null>(null)
  const [counterRef, setCounterRef] = useState<string | null>(null)
  // The same Open / Closed split the seller's queue uses, so the two sides read alike.
  // "Sent" is a seller word — from here every request has been sent — so the pair that
  // means something to a buyer is whether the thread is still live.
  const [listTab, setListTab] = useState<'open' | 'closed'>('open')
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')

  const rfqPage = section === 'rfqs'

  /** Everything on this page, before the tab and the filters narrow it. */
  const onPage = useMemo(() => state.requests
    // FR-3.2 — `lost` has no buyer label; it does not appear on a buyer surface at all.
    .filter((r) => STATE_META[r.state].buyerLabel !== null && r.state !== 'draft')
    .filter((r) => (threadCategory(r) === 'rfq') === rfqPage),
  [state.requests, rfqPage])

  // Counted over this page only, so the special price and RFQ numbers never bleed together
  // and each tab's count matches the rows it actually shows.
  const counts = {
    open: onPage.filter((r) => !STATE_META[r.state].terminal).length,
    closed: onPage.filter((r) => STATE_META[r.state].terminal).length,
  }

  const visible = useMemo(() => {
    return onPage
      .filter((r) => STATE_META[r.state].terminal === (listTab === 'closed'))
      .filter((r) => statusFilter === 'all' || r.state === statusFilter)
      .filter((r) => {
        if (!query.trim()) return true
        const q = query.toLowerCase()
        return r.ref.toLowerCase().includes(q)
          || r.lines.some((l) => l.productName[lang].toLowerCase().includes(q))
      })
      // AC-8.2 — the rows that need the buyer sort to the top by default.
      .sort((a, b) => {
        const aAction = STATE_META[a.state].buyerActionRequired ? 0 : 1
        const bAction = STATE_META[b.state].buyerActionRequired ? 0 : 1
        if (aAction !== bAction) return aAction - bAction
        return (b.submittedAt ?? '').localeCompare(a.submittedAt ?? '')
      })
  }, [onPage, listTab, statusFilter, query, lang])

  const open = state.requests.find((r) => r.ref === openRef) ?? null

  // The live product files this under Purchasing, beside RFQs and Quotations.
  const unread = unreadCount(buildInbox(state.requests, 'buyer'))

  const groups: NavGroup[] = [
    { label: t(lang, 'navOverview'), items: [{ key: 'dashboard', icon: '▦', label: t(lang, 'navDashboard') }] },
    { label: t(lang, 'navComms'), items: [
      { key: 'inbox', icon: '📥', label: t(lang, 'navInbox'), badge: unread || undefined },
      { key: 'messages', icon: '💬', label: t(lang, 'navMessagesCenter') },
      { key: 'vendors', icon: '👥', label: t(lang, 'navVendorList') },
    ] },
    { label: t(lang, 'navPurchasing'), items: [
      { key: 'orders', icon: '🛒', label: t(lang, 'navFinalOrders') },
      { key: 'rfqs', icon: '📄', label: t(lang, 'navRfqs') },
      { key: 'special', icon: '🏷', label: t(lang, 'navSpecialPrice') },
      { key: 'quotations', icon: '🧾', label: t(lang, 'navQuotations') },
    ] },
  ]

  const HEAD = {
    special: { title: t(lang, 'myRequests'), subtitle: t(lang, 'buyerSubtitle'), crumb: t(lang, 'navSpecialPrice') },
    rfqs: { title: t(lang, 'myRfqs'), subtitle: t(lang, 'buyerRfqSubtitle'), crumb: t(lang, 'navRfqs') },
    inbox: { title: t(lang, 'inboxTitle'), subtitle: t(lang, 'inboxSubtitleBuyer'), crumb: t(lang, 'navInbox') },
    orders: { title: t(lang, 'ordersTitle'), subtitle: t(lang, 'ordersSubtitleBuyer'), crumb: t(lang, 'navFinalOrders') },
  }[section]

  return (
    <DashboardChrome
      lang={lang} setLang={setLang} viewer="buyer"
      groups={groups} active={section} alerts={unread}
      onNavigate={(key) => {
        if (key !== 'inbox' && key !== 'orders' && key !== 'special' && key !== 'rfqs') return
        setSection(key)
        // Each page carries its own pile. Landing on the other page's tab shows an empty
        // table beside a count that says otherwise, so the list opens on Open every time.
        setListTab('open')
        setStatusFilter('all')
      }}
      title={HEAD.title}
      subtitle={HEAD.subtitle}
      breadcrumb={HEAD.crumb}
    >
      {section === 'inbox' && (
        <Inbox
          requests={state.requests} viewer="buyer" lang={lang}
          onOpen={(ref) => { setSection('special'); setOpenRef(ref) }}
        />
      )}

      {section === 'orders' && <Orders viewer="buyer" lang={lang} />}

      {(section === 'special' || section === 'rfqs') && (
      <div className="hb-card">
        <div className="hb-card-head" style={{ paddingBottom: 0, borderBottom: 'none' }}>
          <div className="hb-tabs" style={{ border: 'none' }}>
            {([['open', 'tabOpen'], ['closed', 'tabClosed']] as const).map(([key, label]) => (
              <button
                key={key} type="button" className="hb-tab"
                aria-selected={listTab === key}
                // A status chosen under the other tab would select nothing here, so the
                // filter resets with the tab rather than leaving an empty table behind.
                onClick={() => { setListTab(key); setStatusFilter('all') }}
              >
                {t(lang, label)}
                {counts[key] > 0 && <span className="hb-tab-count">{counts[key]}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="hb-filterbar">
            {/* AC-8.3 — filter by status, search by reference and product name. */}
          <select className="hb-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{t(lang, 'allStatuses')}</option>
            {Object.entries(STATE_META)
              // Only the statuses this tab can hold; the rest would be a dead end.
              .filter(([s, m]) => m.buyerLabel !== null && s !== 'draft'
                && m.terminal === (listTab === 'closed'))
              .map(([s, m]) => <option key={s} value={s}>{m.buyerLabel?.[lang]}</option>)}
          </select>
          <input
            className="hb-input"
            placeholder={t(lang, 'searchPlaceholder')} value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {visible.length === 0 ? (
          // AC-8.5 — the empty state explains what a request is and links to the marketplace.
          <Empty
            title={t(lang, listTab === 'closed' ? 'emptyClosedTitle' : rfqPage ? 'emptyRfqTitle' : 'emptyListTitle')}
            body={t(lang, listTab === 'closed' ? 'emptyClosedBody' : rfqPage ? 'emptyRfqBody' : 'emptyListBody')}
            action={<button type="button" className="hb-btn hb-btn--primary" onClick={onBrowse}>{t(lang, 'browseMarketplace')}</button>}
          />
        ) : (
          <div className="hb-table-wrap">
            <table className="hb-table">
              <thead>
                <tr>
                  <th>{t(lang, 'reference')}</th>
                  <th>{t(lang, 'requestType')}</th>
                  <th>{t(lang, 'supplier')}</th>
                  <th>{t(lang, 'lines')}</th>
                  <th>{t(lang, 'status')}</th>
                  <th>{t(lang, 'totalAsked')}</th>
                  <th>{t(lang, 'actionsColumn')}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const needsMe = STATE_META[r.state].buyerActionRequired
                  return (
                    <tr
                      key={r.ref}
                      className={`hb-clickable${needsMe ? ' hb-row-action' : ''}`}
                      onClick={() => setOpenRef(r.ref)}
                    >
                      <td><span className="hb-ref">{r.ref}</span></td>
                      <td><RouteTags lines={r.lines} lang={lang} /></td>
                      <td>{r.sellerName}</td>
                      <td className="hb-num">{r.lines.length}</td>
                      <td><StatusPill state={r.state} viewer="buyer" lang={lang} /></td>
                      <td><Money value={askedTotalOf(r.lines)} lang={lang} withCurrency /></td>
                      <td>
                        <RowActions
                          request={r} lang={lang} now={state.now}
                          onOpen={() => setOpenRef(r.ref)}
                          onCounter={() => { setCounterRef(r.ref); setOpenRef(r.ref) }}
                          onDecide={(kind) => setConfirming({ ref: r.ref, kind })}
                          onWithdraw={() => dispatch({ type: 'buyer_withdraws', ref: r.ref })}
                          onReRequest={() => { dispatch({ type: 're_request', ref: r.ref }); onBrowse() }}
                        />
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

      {open && (
        <Comparison
          request={open}
          initialCounter={counterRef === open.ref}
          onClose={() => { setOpenRef(null); setCounterRef(null) }}
        />
      )}

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

/**
 * US-8 — the buyer's decision, in the list.
 *
 * Accept, Counter and Decline mirror the seller's row, because the two sides answer each
 * other with the same three moves. Accept and Decline settle the negotiation from here,
 * each behind a confirmation that carries the numbers the row does not show — AC-10.1 puts
 * Accept on the comparison as its single primary action, and the confirmation is how that
 * holds when the click starts in a table. Counter cannot be taken here at all: it needs a
 * price per line, so it opens the comparison with the counter fields already live.
 *
 * Withdraw is not offered beside Decline. On a countered row the two would read as the
 * same button, and only one of them is an answer to the offer; it stays on the comparison.
 *
 * The offer countdown that used to sit in this column lives on the comparison, next to the
 * decision it constrains; the row still sorts action-first and tints (AC-8.2).
 */
function RowActions({ request, lang, now, onOpen, onCounter, onDecide, onWithdraw, onReRequest }: {
  request: NegotiationRequest
  lang: 'en' | 'ar'
  now: Date
  onOpen: () => void
  onCounter: () => void
  onDecide: (kind: 'accept' | 'decline') => void
  onWithdraw: () => void
  onReRequest: () => void
}) {
  const meta = STATE_META[request.state]
  // EC-16 — server time decides. An expired offer is not reviewable, only re-requestable.
  const live = acceptanceAllowed(request.offerExpiresAt, now)
  const canWithdraw = ['submitted', 'viewed', 'info_requested', 'countered_by_seller', 'countered_by_buyer']
    .includes(request.state)

  // A click on a button must not also open the row.
  const act = (fn: () => void) => (e: ReactMouseEvent) => { e.stopPropagation(); fn() }

  // The seller has answered and the offer still stands: the three decisions apply.
  if (request.state === 'countered_by_seller' && live) {
    const roundsLeft = MAX_ROUNDS - request.rounds
    return (
      <div className="hb-rowactions">
        <button type="button" className="hb-btn hb-btn--sm hb-btn--primary" onClick={act(() => onDecide('accept'))}>
          {t(lang, 'accept')}
        </button>
        <button
          type="button" className="hb-btn hb-btn--sm hb-btn--secondary"
          // AC-10.4 — past the cap the counter is not offered, and says why.
          disabled={roundsLeft <= 0}
          title={roundsLeft <= 0 ? t(lang, 'roundCapReached', { n: MAX_ROUNDS }) : undefined}
          onClick={act(onCounter)}
        >
          {t(lang, 'counter')}
        </button>
        {/* FR-11.6 — the destructive action is quiet and never primary. */}
        <button type="button" className="hb-btn hb-btn--sm hb-btn--danger" onClick={act(() => onDecide('decline'))}>
          {t(lang, 'decline')}
        </button>
      </div>
    )
  }

  const primary =
    request.state === 'info_requested' ? { label: t(lang, 'addInformation'), run: onOpen }
      : meta.terminal || !live ? { label: t(lang, 'requestAgain'), run: onReRequest }
        : null

  return (
    <div className="hb-rowactions">
      {primary && (
        <button type="button" className="hb-btn hb-btn--sm hb-btn--primary" onClick={act(primary.run)}>
          {primary.label}
        </button>
      )}
      {canWithdraw && (
        <button type="button" className="hb-btn hb-btn--sm hb-btn--danger" onClick={act(onWithdraw)}>
          {t(lang, 'cancelRequest')}
        </button>
      )}
      {/* E-2 / FR-11.5 — a row with nothing to do says so rather than sitting blank. */}
      {!primary && !canWithdraw && <span className="hb-hint">{t(lang, 'noActionYet')}</span>}
    </div>
  )
}

/**
 * Confirming an Accept or a Decline taken from the list.
 *
 * AC-10.6 already required a confirmation before declining, naming the consequence. Accept
 * is just as final and, taken from a row, is taken without the comparison in view — so it
 * gets the same treatment, and the dialog carries what the row leaves out: the list total,
 * what the supplier is offering, and the difference between them.
 */
function DecisionConfirm({ request, kind, onClose }: {
  request: NegotiationRequest
  kind: 'accept' | 'decline'
  onClose: () => void
}) {
  const { dispatch, lang } = useRfq()
  const listTotal = listTotalOf(request.lines)
  const offeredTotal = offeredTotalOf(request.lines)
  const saving = listTotal - offeredTotal

  function run() {
    dispatch(kind === 'accept'
      ? { type: 'buyer_accepts', ref: request.ref, asTemplate: false }
      : { type: 'buyer_declines', ref: request.ref })
    onClose()
  }

  return (
    <Modal
      title={<h2 className="hb-h2">{t(lang, kind === 'accept' ? 'confirmBuyerAcceptTitle' : 'confirmDeclineTitle')}</h2>}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="hb-btn hb-btn--secondary" onClick={onClose}>{t(lang, 'cancel')}</button>
          <span className="hb-primary-slot">
            <button
              type="button"
              className={`hb-btn hb-btn--${kind === 'accept' ? 'primary' : 'danger'}`}
              onClick={run}
            >
              {t(lang, kind === 'accept' ? 'accept' : 'decline')}
            </button>
          </span>
        </>
      }
    >
      <p className="hb-sub" style={{ marginBottom: 14 }}>
        {t(lang, kind === 'accept' ? 'confirmBuyerAcceptBody' : 'confirmDeclineBody')}
      </p>

      <div className="hb-row" style={{ marginBottom: 12 }}>
        <span className="hb-hint">{request.sellerName}</span>
        <span className="hb-ref">{request.ref}</span>
      </div>

      {/* The numbers the row does not carry, at the moment they decide something. */}
      <div className="hb-table-wrap">
        <table className="hb-table">
          <thead>
            <tr>
              <th>{t(lang, 'original')}</th>
              <th className="hb-col-offered">{t(lang, 'supplierOffers')}</th>
              <th>{t(lang, 'estimatedSaving')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><Money value={listTotal} lang={lang} withCurrency /></td>
              <td className="hb-col-offered"><Money value={offeredTotal} lang={lang} withCurrency /></td>
              <td>
                {saving > 0
                  ? <span className="hb-num" style={{ color: 'var(--hb-good)' }}>
                      {formatMoney(saving, { withCurrency: true, lang })} · {percentOff(listTotal, offeredTotal)}%
                    </span>
                  : <span className="hb-muted">{t(lang, 'noPriceChange')}</span>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  )
}

/** US-9 / US-10 — three columns, per-line outcomes, and the decision actions. */
function Comparison({ request, initialCounter, onClose }: {
  request: NegotiationRequest
  /** Counter was chosen from the row, so the per-line fields open already live. */
  initialCounter?: boolean
  onClose: () => void
}) {
  const { state, dispatch, lang } = useRfq()
  const [tab, setTab] = useState<'compare' | 'history' | 'comments'>('compare')
  const [confirmDecline, setConfirmDecline] = useState(false)
  const [counterMode, setCounterMode] = useState(initialCounter ?? false)
  const [counters, setCounters] = useState<Record<string, string>>({})

  // The buyer only ever sees the projection. Cost, margin and floor are not in it (A7).
  const view = toBuyerView(request, lang, MAX_ROUNDS)

  const listTotal = listTotalOf(request.lines)
  const askedTotal = askedTotalOf(request.lines)
  const offeredTotal = offeredTotalOf(request.lines)
  const saving = listTotal - offeredTotal
  const savingPct = percentOff(listTotal, offeredTotal)

  const meta = STATE_META[request.state]
  const canAct = request.state === 'countered_by_seller'
  // EC-16 — server time decides, and an expired offer disables every decision action.
  const notExpired = acceptanceAllowed(request.offerExpiresAt, state.now)
  const roundsLeft = MAX_ROUNDS - request.rounds
  const canWithdraw = ['submitted', 'viewed', 'info_requested', 'countered_by_seller', 'countered_by_buyer'].includes(request.state)

  function outcomeLabel(l: RequestLine) {
    if (l.outcome === 'pending') return <span className="hb-pill hb-pill--neutral">{t(lang, 'pendingOutcome')}</span>
    // The line outcome comes first: a declined line is declined whatever the numbers say.
    if (l.outcome === 'declined') return <span className="hb-pill hb-pill--bad">{t(lang, 'declinedOutcome')}</span>
    if (l.route === 'case_2') return <span className="hb-pill hb-pill--good">{lang === 'ar' ? 'تم التسعير' : 'Quoted'}</span>
    // FR-7.8 / Decision 3 — a Case 1 claim is named matched or beaten, by name, so the
    // buyer knows which of the three happened. The third value, `declined`, belongs to a
    // declined line and is handled above; a seller who countered *above* the asked price
    // has not declined the line — it is a live counter the buyer can still accept, so it
    // reads as a counter-offer rather than a rejection.
    const tri = triStateOutcome(l.askedPrice, l.offeredPrice, false)
    if (tri === 'beaten') return <span className="hb-pill hb-pill--good">{t(lang, 'beaten')}</span>
    if (tri === 'matched') return <span className="hb-pill hb-pill--good">{t(lang, 'matched')}</span>
    return <span className="hb-pill hb-pill--warn">{t(lang, 'counteredOutcome')}</span>
  }

  return (
    <Modal
      wide
      title={
        <div>
          <h2 className="hb-h2">{view.ref}</h2>
          <div className="hb-row" style={{ marginTop: 6 }}>
            <StatusPill state={request.state} viewer="buyer" lang={lang} />
            <span className="hb-hint">{view.sellerName}</span>
          </div>
        </div>
      }
      onClose={onClose}
      footer={
        <>
          {/* FR-11.6 — destructive actions are quiet and never primary. */}
          {canWithdraw && (
            <button type="button" className="hb-btn hb-btn--danger" onClick={() => dispatch({ type: 'buyer_withdraws', ref: request.ref })}>
              {t(lang, 'withdraw')}
            </button>
          )}
          {meta.terminal && (
            <button type="button" className="hb-btn hb-btn--secondary" onClick={() => { dispatch({ type: 're_request', ref: request.ref }); onClose() }}>
              {t(lang, 'reRequest')}
            </button>
          )}
          {canAct && notExpired && (
            <>
              <button type="button" className="hb-btn hb-btn--danger" onClick={() => setConfirmDecline(true)}>
                {t(lang, 'decline')}
              </button>
              {/* AC-10.4 — past the cap the counter is not offered, and says why. */}
              <button
                type="button" className="hb-btn hb-btn--secondary"
                disabled={roundsLeft <= 0}
                title={roundsLeft <= 0 ? t(lang, 'roundCapReached', { n: MAX_ROUNDS }) : undefined}
                onClick={() => setCounterMode((v) => !v)}
              >
                {t(lang, 'counter')}
              </button>
              <span className="hb-primary-slot">
                {counterMode ? (
                  <button
                    type="button" className="hb-btn hb-btn--primary"
                    onClick={() => {
                      const prices: Record<string, number> = {}
                      for (const [id, raw] of Object.entries(counters)) {
                        const p = parseMoney(raw)
                        if (p !== null) prices[id] = p
                      }
                      dispatch({ type: 'buyer_counters', ref: request.ref, prices })
                      setCounterMode(false)
                      onClose()
                    }}
                  >
                    {t(lang, 'sendRequest')}
                  </button>
                ) : (
                  // AC-10.1 — Accept is the single primary action on this surface.
                  <button
                    type="button" className="hb-btn hb-btn--primary"
                    onClick={() => { dispatch({ type: 'buyer_accepts', ref: request.ref, asTemplate: false }); onClose() }}
                  >
                    {t(lang, 'accept')}
                  </button>
                )}
              </span>
            </>
          )}
          {/* US-11 — from info_requested the buyer may resubmit or withdraw. Accept is not offered. */}
          {request.state === 'info_requested' && (
            <span className="hb-primary-slot">
              <button type="button" className="hb-btn hb-btn--primary" onClick={() => { dispatch({ type: 'buyer_resubmits', ref: request.ref }); onClose() }}>
                {t(lang, 'resubmit')}
              </button>
            </span>
          )}
        </>
      }
    >
      <div className="hb-tabs" style={{ marginBottom: 14 }}>
        {(['compare', 'history', 'comments'] as const).map((k) => (
          <button key={k} type="button" className="hb-tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {k === 'compare' ? t(lang, 'outcome') : k === 'history' ? t(lang, 'history') : t(lang, 'comments')}
          </button>
        ))}
      </div>

      {tab === 'compare' && (
        <>
          {/* AC-11.1 — the seller's reason, verbatim, with the affected lines identified. */}
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
          {!notExpired && request.offerExpiresAt && (
            <div className="hb-banner hb-banner--bad" style={{ marginBottom: 14 }}>
              {t(lang, 'offerExpiredOn', { date: request.offerExpiresAt.slice(0, 10) })}
            </div>
          )}

          {/* AC-22.1 — a failed negotiation never costs the buyer the goods. */}
          {['declined', 'expired', 'withdrawn'].includes(request.state) && (
            <div className="hb-banner hb-banner--info" style={{ marginBottom: 14 }}>{t(lang, 'stillPurchasable')}</div>
          )}

          {view.offerExpiresAt && notExpired && (
            <p className="hb-sub" style={{ marginBottom: 10 }}>
              {t(lang, 'offerExpiresIn')}: <Countdown dueAt={view.offerExpiresAt} now={state.now} lang={lang} />
            </p>
          )}

          <div className="hb-table-wrap">
            <table className="hb-table">
              <thead className="hb-compare-head">
                <tr>
                  <th>{t(lang, 'product')}</th>
                  <th>{t(lang, 'quantity')}</th>
                  <th>{t(lang, 'original')}</th>
                  <th className="hb-col-asked">{t(lang, 'askedPrice')}</th>
                  <th className="hb-col-offered">{t(lang, 'sellerOffers')}</th>
                  <th>{t(lang, 'outcome')}</th>
                </tr>
              </thead>
              <tbody>
                {request.lines.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {l.productName[lang]}
                      <div className="hb-hint">{l.sku}</div>
                    </td>
                    <td className="hb-num">{l.quantity}</td>
                    <td><Money value={l.listPriceSnapshot} lang={lang} /></td>
                    <td className="hb-col-asked">
                      {/* AC-9.2 — a Case 2 line shows "—", never an inferred value. */}
                      {counterMode && canAct ? (
                        <input
                          className="hb-input" style={{ minWidth: 96 }} inputMode="decimal"
                          value={counters[l.id] ?? ''} placeholder={formatMoney(l.askedPrice ?? l.listPriceSnapshot)}
                          onChange={(e) => setCounters((c) => ({ ...c, [l.id]: e.target.value }))}
                        />
                      ) : <Money value={l.askedPrice} lang={lang} />}
                    </td>
                    <td className="hb-col-offered">
                      <Money value={l.offeredPrice} lang={lang} />
                      {/* AC-9.4 — a declined line shows list price, annotated, with no accept. */}
                      {l.outcome === 'declined' && <div className="hb-hint">{t(lang, 'declinedOutcome')}</div>}
                    </td>
                    <td>{outcomeLabel(l)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>{t(lang, 'requestTotal')}</td>
                  <td><Money value={listTotal} lang={lang} withCurrency /></td>
                  <td className="hb-col-asked"><Money value={askedTotal} lang={lang} withCurrency /></td>
                  <td className="hb-col-offered"><Money value={offeredTotal} lang={lang} withCurrency /></td>
                  <td />
                </tr>
                {saving > 0 && (
                  <tr>
                    <td colSpan={2}>{t(lang, 'estimatedSaving')}</td>
                    <td colSpan={4} style={{ color: 'var(--hb-good)' }}>
                      <Money value={saving} lang={lang} withCurrency /> · {savingPct}%
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          {roundsLeft <= 0 && canAct && (
            <p className="hb-warning">{t(lang, 'roundCapReached', { n: MAX_ROUNDS })}</p>
          )}
        </>
      )}

      {/* AC-13.1 — History and Comments are two distinct panels. */}
      {tab === 'history' && (
        <div className="hb-log">
          <ul>
            {request.history.map((h) => (
              <li key={h.id}>
                {/* AC-13.2 — timestamp, actor, event type, and before/after on money. */}
                {/* AC-13.2 — UTC alongside tenant time; pinned LTR so it survives RTL. */}
                <time dir="ltr">{new Date(h.at).toISOString().replace('T', ' ').slice(0, 16)} UTC</time>
                {renderHistory(h, lang)}
                {h.before !== null && h.after !== null && (
                  <span className="hb-hint"> ({formatMoney(h.before)} → {formatMoney(h.after)})</span>
                )}
              </li>
            ))}
          </ul>
          <p className="hb-hint">
            {lang === 'ar'
              ? 'السجل غير قابل للتعديل أو الحذف من أي دور، بما في ذلك إدارة المنصة.'
              : 'The history log is append-only and cannot be edited or deleted by any role, including HIGHBASE administrators.'}
          </p>
        </div>
      )}

      {tab === 'comments' && (
        <div className="hb-log">
          {request.comments.length === 0
            ? <p className="hb-sub">{lang === 'ar' ? 'لا توجد تعليقات.' : 'No comments yet.'}</p>
            : <ul>{request.comments.map((c) => <li key={c.id}><time dir="ltr">{c.at.slice(0, 16)}</time><strong>{c.actorName}</strong>: {c.body}</li>)}</ul>}
        </div>
      )}

      {/* AC-10.6 — a confirmation dialog naming the consequence before a decline. */}
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
                <button
                  type="button" className="hb-btn hb-btn--danger"
                  onClick={() => { dispatch({ type: 'buyer_declines', ref: request.ref }); setConfirmDecline(false); onClose() }}
                >
                  {t(lang, 'decline')}
                </button>
              </span>
            </>
          }
        >
          <p>{t(lang, 'confirmDeclineBody')}</p>
        </Modal>
      )}
    </Modal>
  )
}
