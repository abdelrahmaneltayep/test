/**
 * HB Admin — Feature Flow Draft §10.
 *
 * The draft asks for one thing by name: "Needed specifically so HB Admins can follow up on
 * past orders where the price was changed." That sentence is the whole brief, and it is a
 * brief for an *audit* surface, not a management one. An admin here answers questions after
 * the fact — which prices moved, on whose authority, against what evidence, and did the
 * guarantee hold — so the page is built to be filtered and read, and nothing on it acts.
 *
 * What it deliberately does not show is margin, cost or floor. A7 keeps those on the
 * seller's own surface, and §10 asks for price provenance rather than the seller's
 * commercial position; an admin who can see a supplier's cost is a different product with
 * a different set of promises in it. The one place that judgement could be revisited is a
 * below-cost match, which is still an open question with the PM.
 */

import { Fragment, useMemo, useState } from 'react'
import { renderHistory, t, type Lang } from '../domain/i18n'
import { formatMoney, percentOff } from '../domain/money'
import {
  orderOriginalTotal, orderSaving, orderTotal, viewOrder,
  SETTLED_OUTCOMES, type NegotiationOutcome, type Order, type OrderView,
} from '../domain/orders'
import { routeOf } from '../domain/states'
import type { NegotiationRequest } from '../domain/types'
import { useRfq } from '../store'
import { DashboardChrome, type NavGroup } from './Chrome'
import { Orders, declineReasonKey } from './Orders'
import { Empty, Money } from './ui'

type Section = 'overview' | 'negotiated' | 'orders'
type OutcomeFilter = 'all' | Exclude<NegotiationOutcome, null | 'open'> | 'open'

const OUTCOME_KEY: Record<Exclude<NegotiationOutcome, null>, string> = {
  matched: 'negotiationMatched', negotiated: 'negotiationNegotiated',
  rejected: 'negotiationRejected', open: 'negotiationOpen',
}
const OUTCOME_TONE: Record<Exclude<NegotiationOutcome, null>, string> = {
  matched: 'good', negotiated: 'good', rejected: 'bad', open: 'info',
}

interface Row {
  order: Order
  request: NegotiationRequest | null
  view: OrderView
}

export function AdminDashboard({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const { state } = useRfq()
  const [section, setSection] = useState<Section>('overview')
  const [outcome, setOutcome] = useState<OutcomeFilter>('all')
  const [movedOnly, setMovedOnly] = useState(false)
  const [openRef, setOpenRef] = useState<string | null>(null)

  const rows: Row[] = useMemo(() => state.orders.map((order) => {
    const request = state.requests.find((r) => r.ref === order.requestRef) ?? null
    return { order, request, view: viewOrder(order, request) }
  }), [state.orders, state.requests])

  /** §10 — the admin's subject is the negotiated order; a standard one has no story. */
  const negotiated = useMemo(() => rows.filter((r) => r.view.negotiated), [rows])

  const shown = useMemo(() => negotiated.filter((r) => {
    if (outcome !== 'all' && r.view.negotiation !== outcome) return false
    if (movedOnly && orderSaving(r.order, r.view) === 0) return false
    return true
  }), [negotiated, outcome, movedOnly])

  const groups: NavGroup[] = [
    { label: t(lang, 'navOverview'), items: [
      { key: 'overview', icon: '▦', label: t(lang, 'adminNavOverview') },
    ] },
    { label: t(lang, 'adminNavGroup'), items: [
      { key: 'negotiated', icon: '🏷', label: t(lang, 'adminNavNegotiated'), badge: negotiated.length || undefined },
      { key: 'orders', icon: '🛒', label: t(lang, 'adminNavAllOrders') },
    ] },
  ]

  const HEAD = {
    overview: { title: t(lang, 'adminOverviewTitle'), sub: t(lang, 'adminOverviewSub'), crumb: t(lang, 'adminNavOverview') },
    negotiated: { title: t(lang, 'adminNegotiatedTitle'), sub: t(lang, 'adminNegotiatedSub'), crumb: t(lang, 'adminNavNegotiated') },
    orders: { title: t(lang, 'adminAllOrdersTitle'), sub: t(lang, 'adminAllOrdersSub'), crumb: t(lang, 'adminNavAllOrders') },
  }[section]

  return (
    <DashboardChrome
      lang={lang} setLang={setLang} viewer="admin"
      groups={groups} active={section}
      onNavigate={(k) => { if (k === 'overview' || k === 'negotiated' || k === 'orders') setSection(k) }}
      title={HEAD.title} subtitle={HEAD.sub} breadcrumb={HEAD.crumb}
    >
      {/*
        Said once, at the top, on every section: this surface reads and never writes. An
        admin who is unsure whether they can change something will not touch anything.
      */}
      <div className="hb-banner hb-banner--info" style={{ marginBottom: 14 }}>
        {t(lang, 'adminReadOnly')}
      </div>

      {section === 'overview' && <Overview rows={negotiated} lang={lang} />}

      {section === 'negotiated' && (
        <>
          <Filters
            lang={lang} outcome={outcome} setOutcome={setOutcome}
            movedOnly={movedOnly} setMovedOnly={setMovedOnly}
            shown={shown.length} total={negotiated.length}
          />
          <AuditTable rows={shown} lang={lang} openRef={openRef} setOpenRef={setOpenRef} />
        </>
      )}

      {/* §9 — every order, negotiated or not, in the list both trading parties see. */}
      {section === 'orders' && <Orders viewer="admin" lang={lang} />}
    </DashboardChrome>
  )
}

/**
 * The four numbers a follow-up starts from. Deliberately not a chart: an admin arriving
 * here has a question about one order, and these are the counts that tell them which
 * filter to press next.
 */
function Overview({ rows, lang }: { rows: Row[]; lang: Lang }) {
  const settled = rows.filter((r) => r.view.negotiation !== 'open')
  const moved = rows.filter((r) => orderSaving(r.order, r.view) > 0)
  const movedTotal = moved.reduce((sum, r) => sum + orderSaving(r.order, r.view), 0)
  const withoutProof = rows.filter((r) => !r.view.hadProof)

  /** §10 — grouped by the reason the seller gave, which only exists since declines named one. */
  const byReason = new Map<string, number>()
  for (const r of rows) {
    if (!r.view.declineReason) continue
    byReason.set(r.view.declineReason.code, (byReason.get(r.view.declineReason.code) ?? 0) + 1)
  }
  const unexplained = rows.filter((r) => r.view.negotiation === 'rejected' && !r.view.declineReason).length

  return (
    <>
      <div className="hb-stats">
        <Stat n={rows.length} label={t(lang, 'adminStatNegotiated')} lang={lang} />
        <Stat n={moved.length} label={t(lang, 'adminStatMoved')} lang={lang}
          sub={movedTotal > 0 ? formatMoney(movedTotal, { withCurrency: true, lang }) : undefined} />
        <Stat n={settled.filter((r) => r.view.negotiation === 'matched').length}
          label={t(lang, 'adminStatMatched')} lang={lang} />
        <Stat n={withoutProof.length} label={t(lang, 'adminStatNoProof')} lang={lang} />
      </div>

      <div className="hb-card" style={{ marginTop: 14 }}>
        <div className="hb-card-head">
          <div>
            <h2 className="hb-h2">{t(lang, 'adminReasonsTitle')}</h2>
            <p className="hb-hint">{t(lang, 'adminReasonsSub')}</p>
          </div>
        </div>
        <div className="hb-card-body">
          {byReason.size === 0 && unexplained === 0 ? (
            <p className="hb-sub">{t(lang, 'adminNoDeclines')}</p>
          ) : (
            <div className="hb-table-wrap">
              <table className="hb-table">
                <thead>
                  <tr><th>{t(lang, 'adminReasonGiven')}</th><th>{t(lang, 'adminOrdersColumn')}</th></tr>
                </thead>
                <tbody>
                  {[...byReason.entries()].sort((a, b) => b[1] - a[1]).map(([code, n]) => (
                    <tr key={code}>
                      <td>{t(lang, declineReasonKey(code))}</td>
                      <td className="hb-num">{n}</td>
                    </tr>
                  ))}
                  {/*
                    Declines predating the named-reason rule. Shown rather than filtered out:
                    a gap in the record is itself something an admin needs to see.
                  */}
                  {unexplained > 0 && (
                    <tr>
                      <td><span className="hb-muted">{t(lang, 'adminNoReasonRecorded')}</span></td>
                      <td className="hb-num">{unexplained}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function Stat({ n, label, sub, lang }: { n: number; label: string; sub?: string; lang: Lang }) {
  return (
    <div className="hb-stat">
      <span className="hb-stat-n" dir="ltr">{n}</span>
      <span className="hb-stat-label">{label}</span>
      {sub && <span className="hb-stat-sub" dir="ltr" lang={lang}>{sub}</span>}
    </div>
  )
}

function Filters({ lang, outcome, setOutcome, movedOnly, setMovedOnly, shown, total }: {
  lang: Lang
  outcome: OutcomeFilter
  setOutcome: (o: OutcomeFilter) => void
  movedOnly: boolean
  setMovedOnly: (b: boolean) => void
  shown: number
  total: number
}) {
  const OPTIONS: OutcomeFilter[] = ['all', ...SETTLED_OUTCOMES, 'open']
  return (
    <div className="hb-card" style={{ marginBottom: 14 }}>
      <div className="hb-card-body hb-row" style={{ flexWrap: 'wrap' }}>
        <span className="hb-hint">{t(lang, 'outcome')}</span>
        {OPTIONS.map((o) => (
          <button
            key={o} type="button" className="hb-btn hb-btn--sm hb-btn--secondary"
            aria-pressed={outcome === o} onClick={() => setOutcome(o)}
          >
            {o === 'all' ? t(lang, 'adminFilterAll') : t(lang, OUTCOME_KEY[o])}
          </button>
        ))}
        <button
          type="button" className="hb-btn hb-btn--sm hb-btn--secondary"
          aria-pressed={movedOnly} onClick={() => setMovedOnly(!movedOnly)}
          style={{ marginInlineStart: 12 }}
        >
          {t(lang, 'adminFilterMoved')}
        </button>
        <span className="hb-hint" style={{ marginInlineStart: 'auto' }}>
          {t(lang, 'adminShowingCount', { shown, total })}
        </span>
      </div>
    </div>
  )
}

/**
 * §10 — one row per negotiated order, and every column is something a follow-up asks:
 * which order, between whom, on which route, how it came out, what the price did, and
 * whether an invoice backed it. The log itself is one click away, on the order.
 */
function AuditTable({ rows, lang, openRef, setOpenRef }: {
  rows: Row[]
  lang: Lang
  openRef: string | null
  setOpenRef: (r: string | null) => void
}) {
  if (rows.length === 0) {
    return (
      <div className="hb-card">
        <Empty title={t(lang, 'adminEmptyTitle')} body={t(lang, 'adminEmptyBody')} />
      </div>
    )
  }
  return (
    <div className="hb-card">
      <div className="hb-table-wrap">
        <table className="hb-table">
          <thead>
            <tr>
              <th>{t(lang, 'orderRef')}</th>
              <th>{t(lang, 'bothParties')}</th>
              <th>{t(lang, 'requestType')}</th>
              <th>{t(lang, 'outcome')}</th>
              {/* One price cell, not two: the original struck above the price the order
                  stands at, which is the comparison §9 asks for and costs a column less. */}
              <th>{t(lang, 'adminPriceColumn')}</th>
              <th>{t(lang, 'priceChange')}</th>
              <th>{t(lang, 'proof')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ order, request, view }) => {
              const saving = orderSaving(order, view)
              const match = request ? routeOf(request.lines) === 'case_1' : false
              const expanded = openRef === order.id
              return (
                <Fragment key={order.id}>
                  <tr className="hb-clickable"
                    onClick={() => setOpenRef(expanded ? null : order.id)}>
                    <td>
                      <span className="hb-ref">{order.id}</span>
                      <div className="hb-hint">{order.requestRef}</div>
                    </td>
                    <td>{order.buyerName}<div className="hb-hint">{order.sellerName}</div></td>
                    <td>
                      <span className={`hb-pill hb-pill--${match ? 'info' : 'neutral'}`}>
                        {t(lang, match ? 'routeCase1' : 'routeCase2')}
                      </span>
                    </td>
                    <td>
                      <span className={`hb-pill hb-pill--${view.negotiation ? OUTCOME_TONE[view.negotiation] : 'neutral'}`}>
                        {view.negotiation ? t(lang, OUTCOME_KEY[view.negotiation]) : t(lang, 'standardOrder')}
                      </span>
                      {view.declineReason && (
                        <div className="hb-hint">{t(lang, declineReasonKey(view.declineReason.code))}</div>
                      )}
                    </td>
                    <td>
                      <Money value={orderTotal(order, view)} lang={lang} />
                      {saving !== 0 && (
                        <div className="hb-hint hb-strike">{formatMoney(orderOriginalTotal(order))}</div>
                      )}
                    </td>
                    <td>
                      {saving === 0 ? <span className="hb-muted">{t(lang, 'noPriceChange')}</span> : (
                        <span className="hb-num" style={{ color: saving > 0 ? 'var(--hb-good)' : 'var(--hb-bad)' }}>
                          {saving > 0 ? '−' : '+'}{formatMoney(Math.abs(saving))}
                          {' · '}{Math.abs(percentOff(orderOriginalTotal(order), orderTotal(order, view)))}%
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`hb-pill hb-pill--${view.hadProof ? 'good' : 'neutral'}`}>
                        {t(lang, view.hadProof ? 'invoiceSubmitted' : 'noInvoiceSubmitted')}
                      </span>
                    </td>
                  </tr>
                  {/*
                    The log expands in place rather than opening a dialog. An admin is
                    comparing rows — losing the table to read one of them is the wrong
                    trade on the one surface whose whole job is the comparison.
                  */}
                  {expanded && request && (
                    <tr>
                      <td colSpan={7}>
                        <AuditLog request={request} view={view} lang={lang} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** §10 — the full back-and-forth, plus the document that was on the record for it. */
function AuditLog({ request, view, lang }: { request: NegotiationRequest; view: OrderView; lang: Lang }) {
  const proof = request.lines.flatMap((l) => l.proofs)[0] ?? null
  return (
    <div className="hb-adminlog">
      <div className="hb-spread" style={{ marginBottom: 8 }}>
        <h3 className="hb-h3">{t(lang, 'orderNegotiationLog')}</h3>
        <span className="hb-hint">{request.ref}</span>
      </div>

      {view.declineReason && (
        <div className="hb-banner hb-banner--bad" style={{ marginBottom: 10 }}>
          <div>
            <strong>{t(lang, 'supplierDeclinedBecause')}</strong>
            <div style={{ marginTop: 4 }}>
              {t(lang, declineReasonKey(view.declineReason.code))}
              {view.declineReason.note && ` — ${view.declineReason.note}`}
            </div>
          </div>
        </div>
      )}

      {/* FR-1.6 — the hash is what makes "an invoice was submitted" checkable later. */}
      {proof && (
        <div className="hb-banner hb-banner--info" style={{ marginBottom: 10 }}>
          <div>
            <div>{t(lang, 'attachmentOnRecord')}: <span dir="ltr">{proof.fileName}</span></div>
            <div className="hb-hint" dir="ltr" style={{ marginTop: 4 }}>{proof.hash}</div>
          </div>
        </div>
      )}

      <div className="hb-log">
        <ul>
          {request.history.map((h) => (
            <li key={h.id}>
              <time dir="ltr">{h.at.replace('T', ' ').slice(0, 16)} UTC</time>
              {renderHistory(h, lang)}
              {h.before !== null && h.after !== null && (
                <span className="hb-hint"> ({formatMoney(h.before)} → {formatMoney(h.after)})</span>
              )}
            </li>
          ))}
        </ul>
        <p className="hb-hint">{t(lang, 'adminLogImmutable')}</p>
      </div>
    </div>
  )
}
