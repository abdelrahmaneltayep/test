/**
 * Seller Dashboard — US-14 … US-19.
 *
 * G2 is the whole point of the queue: most requests should be decidable without opening
 * the detail view, which is only true if the row already shows what the ask does to
 * margin (PP3.1). Margin never leaves this surface (A7).
 */

import { useMemo, useState } from 'react'
import { isEscalated } from '../domain/clocks'
import { t } from '../domain/i18n'
import { formatMoney } from '../domain/money'
import { marginAfterAsk, type MarginBand } from '../domain/margin'
import { guardrailValue } from '../domain/guardrails'
import { STATE_META } from '../domain/states'
import type { LineOutcome, NegotiationRequest } from '../domain/types'
import { useRfq } from '../store'
import { Empty, Modal, Money, RouteTags, StatusPill } from './ui'
import { DashboardChrome, type NavGroup } from './Chrome'
import { Inbox } from './Inbox'
import { Orders } from './Orders'
import { SellerRequestPage } from './RequestDetail'
import { buildInbox, threadCategory, unreadCount } from '../domain/inbox'

const DEFAULT_VALIDITY = guardrailValue('offerValidityDays')

const BAND_TONE: Record<MarginBand, string> = {
  healthy: 'good', thin: 'warn', below_floor: 'bad', unknown: 'neutral',
}
const BAND_KEY: Record<MarginBand, string> = {
  healthy: 'bandHealthy', thin: 'bandThin', below_floor: 'bandBelowFloor', unknown: 'costNotConfigured',
}

export function SellerDashboard() {
  const { state, dispatch, lang, setLang } = useRfq()
  const [tab, setTab] = useState<'open' | 'sent'>('open')
  const [openRef, setOpenRef] = useState<string | null>(null)
  /**
   * Feature Flow Draft §1/§8/§9 — the sidebar navigates for real, and the two routes are
   * two pages rather than two tabs.
   *
   * Divergence from FR-5.1, deliberate: it specifies the queue's tabs as Special price ·
   * RFQ · Sent. All three views survive, and none is further away than it was — the axis
   * moved, so the route is the page (which is what the sidebar already promised with its
   * RFQs entry) and Open · Sent is the tab within it. What that buys is a Sent list scoped
   * to the route you are working in, and a sidebar highlight that is never lying about
   * which list you are looking at. FR-5.1 should be rewritten against this before it is
   * used as a test.
   */
  const [section, setSection] = useState<'special' | 'rfqs' | 'inbox' | 'orders'>('special')
  // The three decisions are taken from the row now, so the two irreversible ones get a
  // confirmation that puts the numbers in front of the seller first (FR-5.3 is a seller
  // fact, so it belongs in a seller confirmation).
  const [confirming, setConfirming] = useState<{ ref: string; kind: 'accept' | 'decline' } | null>(null)

  const rfqPage = section === 'rfqs'

  /** Sent is everything already answered or closed; Open is what still needs a decision. */
  function isOpen(r: NegotiationRequest): boolean {
    return !STATE_META[r.state].terminal && r.state !== 'draft'
      && r.state !== 'countered_by_seller' && r.state !== 'info_requested'
  }

  const onPage = useMemo(() => state.requests
    .filter((r) => STATE_META[r.state].sellerLabel !== null)
    // The route decides the page; a request appears on exactly one of the two.
    .filter((r) => (threadCategory(r) === 'rfq') === rfqPage),
  [state.requests, rfqPage])

  // AC-14.4 — default sort is SLA ascending, so the most urgent row is first.
  const rows = useMemo(
    () => onPage
      .filter((r) => (tab === 'sent' ? !isOpen(r) : isOpen(r)))
      .sort((a, b) => (a.slaDueAt ?? '9999').localeCompare(b.slaDueAt ?? '9999')),
    [onPage, tab],
  )

  // How many rows sit behind each tab, so the seller can see the size of the pile
  // without opening it. Counted over this page only, so the two never bleed together.
  const counts = { open: onPage.filter(isOpen).length, sent: onPage.filter((r) => !isOpen(r)).length }

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

  const SECTION_HEAD = {
    special: { title: t(lang, 'sellerQueue'), subtitle: t(lang, 'sellerSubtitle'), crumb: t(lang, 'navSpecialPrice') },
    rfqs: { title: t(lang, 'sellerRfqQueue'), subtitle: t(lang, 'sellerRfqSubtitle'), crumb: t(lang, 'navRfqs') },
    inbox: { title: t(lang, 'inboxTitle'), subtitle: t(lang, 'inboxSubtitleSeller'), crumb: t(lang, 'navInbox') },
    orders: { title: t(lang, 'ordersTitle'), subtitle: t(lang, 'ordersSubtitleSeller'), crumb: t(lang, 'navFinalOrders') },
  }[section]

  /*
   * The request is a page, not a dialog, so the page head belongs to it while it is open:
   * the buyer's name is the title and the product is the subtitle, because that pair is
   * what the seller is actually deciding about (§2 — one item per request).
   */
  const HEAD = open
    ? {
      title: open.buyerName,
      subtitle: `${open.lines[0].productName[lang]} · ${t(lang, 'quantity')} ${open.lines[0].quantity}`,
      crumb: `${SECTION_HEAD.crumb} · ${open.ref}`,
    }
    : SECTION_HEAD

  return (
    <DashboardChrome
      lang={lang} setLang={setLang} viewer="seller"
      groups={groups} active={section} alerts={unread}
      onNavigate={(key) => {
        if (key !== 'inbox' && key !== 'orders' && key !== 'special' && key !== 'rfqs') return
        setSection(key)
        // The queue opens on what needs deciding, whichever page you arrive from, and
        // never with a request from the page you just left still on screen.
        setTab('open')
        setOpenRef(null)
      }}
      title={HEAD.title}
      subtitle={HEAD.subtitle}
      breadcrumb={HEAD.crumb}
    >

      {/* EC-21 — a misconfigured floor raises an operations alert rather than firing. */}
      {state.opsAlerts.length > 0 && !open && (section === 'special' || section === 'rfqs') && (
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

      {open && (section === 'special' || section === 'rfqs') && (
        <SellerRequestPage request={open} onBack={() => setOpenRef(null)} />
      )}

      {!open && (section === 'special' || section === 'rfqs') && (
      <div className="hb-card">
        <div className="hb-card-head" style={{ paddingBottom: 0, borderBottom: 'none' }}>
          <div className="hb-tabs" style={{ border: 'none' }}>
            {([['open', 'tabOpen'], ['sent', 'tabSent']] as const).map(([key, label]) => (
              <button
                key={key} type="button" className="hb-tab"
                aria-selected={tab === key} onClick={() => setTab(key)}
              >
                {t(lang, label)}
                {counts[key] > 0 && <span className="hb-tab-count">{counts[key]}</span>}
              </button>
            ))}
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
                  <th>{t(lang, 'product')}</th>
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
                      {/* §2 — one item per request, so the row can name it instead of
                          counting it. */}
                      <td>
                        {r.lines[0].productName[lang]}
                        <div className="hb-hint">{r.lines[0].sku} · {t(lang, 'quantity')} {r.lines[0].quantity}</div>
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

