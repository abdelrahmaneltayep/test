/**
 * Buyer Dashboard — US-8 … US-13.
 *
 * Two screens: the list, which answers "which of these need me?", and the comparison,
 * which answers "what changed and what do I do about it?" in three columns.
 */

import { useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { acceptanceAllowed } from '../domain/clocks'
import { t } from '../domain/i18n'
import { STATE_META } from '../domain/states'
import type { NegotiationRequest } from '../domain/types'
import { askedTotalOf, useRfq } from '../store'
import { Empty, Money, RouteTags, StatusPill } from './ui'
import { DashboardChrome, type NavGroup } from './Chrome'
import { Inbox } from './Inbox'
import { Orders } from './Orders'
import { BuyerRequestPage } from './RequestDetail'
import { buildInbox, threadCategory, unreadCount } from '../domain/inbox'

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

  const SECTION_HEAD = {
    special: { title: t(lang, 'myRequests'), subtitle: t(lang, 'buyerSubtitle'), crumb: t(lang, 'navSpecialPrice') },
    rfqs: { title: t(lang, 'myRfqs'), subtitle: t(lang, 'buyerRfqSubtitle'), crumb: t(lang, 'navRfqs') },
    inbox: { title: t(lang, 'inboxTitle'), subtitle: t(lang, 'inboxSubtitleBuyer'), crumb: t(lang, 'navInbox') },
    orders: { title: t(lang, 'ordersTitle'), subtitle: t(lang, 'ordersSubtitleBuyer'), crumb: t(lang, 'navFinalOrders') },
  }[section]

  /*
   * The request is a page, so the page head belongs to it while it is open: the supplier
   * and the product are what the buyer is deciding about (§2 — one item per request).
   */
  const HEAD = open
    ? {
      title: open.sellerName,
      subtitle: `${open.lines[0].productName[lang]} · ${t(lang, 'quantity')} ${open.lines[0].quantity}`,
      crumb: `${SECTION_HEAD.crumb} · ${open.ref}`,
    }
    : SECTION_HEAD

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
        setOpenRef(null)
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

      {open && (section === 'special' || section === 'rfqs') && (
        <BuyerRequestPage
          request={open}
          onBack={() => setOpenRef(null)}
          onBrowse={onBrowse}
        />
      )}

      {!open && (section === 'special' || section === 'rfqs') && (
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
                  <th>{t(lang, 'product')}</th>
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
                      {/* §2 — one item per request, so the row names it. */}
                      <td>
                        {r.lines[0].productName[lang]}
                        <div className="hb-hint">{r.lines[0].sku} · {t(lang, 'quantity')} {r.lines[0].quantity}</div>
                      </td>
                      <td><StatusPill state={r.state} viewer="buyer" lang={lang} /></td>
                      <td><Money value={askedTotalOf(r.lines)} lang={lang} withCurrency /></td>
                      <td>
                        <RowActions
                          request={r} lang={lang} now={state.now}
                          onOpen={() => setOpenRef(r.ref)}
                          onOpenDecision={() => setOpenRef(r.ref)}
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

    </DashboardChrome>
  )
}

/**
 * US-8 — the row's next step, in the list.
 *
 * Accept, Counter and Decline all open the request page, because that is where the numbers
 * are: the original beside the ask beside what the supplier came back with, and the reason
 * the supplier gave. AC-10.1 puts Accept on that surface as its single primary action, and
 * a row that settled a negotiation without showing the price it settles at would be a trap.
 * Cancel is the exception — it needs no numbers, so it acts here.
 *
 * The offer countdown that used to sit in this column is on the page, next to the decision
 * it constrains; the row still sorts action-first and tints (AC-8.2).
 */
function RowActions({ request, lang, now, onOpen, onOpenDecision, onWithdraw, onReRequest }: {
  request: NegotiationRequest
  lang: 'en' | 'ar'
  now: Date
  onOpen: () => void
  onOpenDecision: () => void
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

  /*
   * The supplier has answered and the offer still stands.
   *
   * Draft §6 gives the buyer two moves and only two — "Accept (confirms the seller's price,
   * order proceeds) or Reject the modified or original price / Cancel" — so there is no
   * counter on this side. Both open the request page, where the original sits beside the
   * ask beside what came back (AC-10.1).
   */
  if (request.state === 'countered_by_seller' && live) {
    return (
      <div className="hb-rowactions">
        <button type="button" className="hb-btn hb-btn--sm hb-btn--primary" onClick={act(onOpenDecision)}>
          {t(lang, 'accept')}
        </button>
        {/* FR-11.6 — the destructive action is quiet and never primary. */}
        <button type="button" className="hb-btn hb-btn--sm hb-btn--danger" onClick={act(onOpenDecision)}>
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
