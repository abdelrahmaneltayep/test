/**
 * Orders — Feature Flow Draft §7, §9 and §10.
 *
 * §9 defines Final Orders as "orders with no RFQ/special price negotiation at all
 * (standard orders), plus RFQ/special-price orders once approved", so both kinds are in
 * one list and the negotiated ones carry their provenance on the row. Pending sits in its
 * own tab because that is where the buyer's two buttons live.
 *
 * Every status, button and price here is projected by domain/orders.ts from the
 * negotiation. This component decides nothing about the flow; it only renders it.
 */

import { useState } from 'react'
import { t, renderHistory, type Lang } from '../domain/i18n'
import { formatMoney, percentOff } from '../domain/money'
import {
  orderOriginalTotal, orderSaving, orderTotal, viewOrder,
  type NegotiationOutcome, type Order, type OrderView,
} from '../domain/orders'
import type { NegotiationRequest } from '../domain/types'
import { useRfq } from '../store'
import { Empty, Modal, Money } from './ui'

type OrdersTab = 'pending' | 'final' | 'cancelled'

/** FR-11.3 — the log stores a code; the surfaces turn it into words at render time. */
export function declineReasonKey(code: string): string {
  return `reason${code.replace(/(^|_)(\w)/g, (_, __, c: string) => c.toUpperCase())}`
}

/**
 * §5/§9 — the outcome, named and toned. A rejection is not a failure of the order.
 *
 * Matched and negotiated are both good outcomes and are both green, but they are not the
 * same fact: one is a guarantee honoured, the other a bargain struck. The row says which.
 */
const OUTCOME_KEY: Record<Exclude<NegotiationOutcome, null>, string> = {
  matched: 'negotiationMatched', negotiated: 'negotiationNegotiated',
  rejected: 'negotiationRejected', open: 'negotiationOpen',
}
const OUTCOME_TONE: Record<Exclude<NegotiationOutcome, null>, string> = {
  matched: 'good', negotiated: 'good', rejected: 'bad', open: 'info',
}

const TABS: { key: OrdersTab; label: string }[] = [
  { key: 'pending', label: 'tabPendingOrders' },
  { key: 'final', label: 'tabFinalOrders' },
  { key: 'cancelled', label: 'tabCancelledOrders' },
]

export function Orders({ viewer, lang }: { viewer: 'buyer' | 'seller' | 'admin'; lang: Lang }) {
  const { state } = useRfq()
  const [tab, setTab] = useState<OrdersTab>('pending')
  const [openId, setOpenId] = useState<string | null>(null)

  const withViews = state.orders.map((o) => ({
    order: o,
    request: state.requests.find((r) => r.ref === o.requestRef) ?? null,
    view: viewOrder(o, state.requests.find((r) => r.ref === o.requestRef) ?? null),
  }))
  const rows = withViews.filter((r) => r.view.status === tab)
  const open = withViews.find((r) => r.order.id === openId) ?? null

  return (
    <>
      <div className="hb-card">
        <div className="hb-card-head" style={{ paddingBottom: 0, borderBottom: 'none' }}>
          <div className="hb-tabs" style={{ border: 'none' }}>
            {TABS.map((x) => {
              const n = withViews.filter((r) => r.view.status === x.key).length
              return (
                <button key={x.key} type="button" className="hb-tab" aria-selected={tab === x.key} onClick={() => setTab(x.key)}>
                  {t(lang, x.label)}{n > 0 && <span className="hb-tab-count">{n}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {rows.length === 0 ? (
          <Empty title={t(lang, 'ordersEmptyTitle')} body={t(lang, 'ordersEmptyBody')} />
        ) : (
          <div className="hb-table-wrap">
            <table className="hb-table">
              <thead>
                <tr>
                  <th>{t(lang, 'orderRef')}</th>
                  <th>{viewer === 'admin' ? t(lang, 'bothParties') : viewer === 'buyer' ? t(lang, 'supplier') : t(lang, 'buyer')}</th>
                  <th>{t(lang, 'orderItems')}</th>
                  <th>{t(lang, 'originalPrice')}</th>
                  <th>{t(lang, 'agreedPrice')}</th>
                  <th>{t(lang, 'priceChange')}</th>
                  <th>{t(lang, 'orderStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ order, view }) => (
                  <tr key={order.id} className="hb-clickable" onClick={() => setOpenId(order.id)}>
                    <td>
                      <span className="hb-ref">{order.id}</span>
                      <div className="hb-hint">
                        {/*
                          §9/§10 — the row says the order went through a negotiation and how
                          it came out. Two final orders at the same total mean different
                          things depending on whether the price moved, and "negotiation" on
                          its own does not distinguish them.
                        */}
                        {view.negotiation
                          ? <>{t(lang, OUTCOME_KEY[view.negotiation])} · {order.requestRef}</>
                          : t(lang, 'standardOrder')}
                        {/* An order at its original price raises the question "why"; the
                            answer is on the record, so the row carries it. */}
                        {view.declineReason && (
                          <div className="hb-hint">{t(lang, declineReasonKey(view.declineReason.code))}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      {viewer === 'admin'
                        ? <>{order.buyerName}<div className="hb-hint">{order.sellerName}</div></>
                        : viewer === 'buyer' ? order.sellerName : order.buyerName}
                    </td>
                    <td className="hb-num">{order.lines.length}</td>
                    <td><Money value={orderOriginalTotal(order)} lang={lang} /></td>
                    <td><Money value={orderTotal(order, view)} lang={lang} /></td>
                    <td><PriceDelta order={order} view={view} lang={lang} /></td>
                    <td><OrderStatusPill view={view} lang={lang} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <OrderPage
          order={open.order} request={open.request} view={open.view}
          viewer={viewer} lang={lang} onClose={() => setOpenId(null)}
        />
      )}
    </>
  )
}

/** FR-11.5 — the indicator reads in words and in numbers, not by colour alone. */
function PriceDelta({ order, view, lang }: { order: Order; view: OrderView; lang: Lang }) {
  const saving = orderSaving(order, view)
  if (saving === 0) return <span className="hb-muted">{t(lang, 'noPriceChange')}</span>
  const pct = percentOff(orderOriginalTotal(order), orderTotal(order, view))
  return (
    <span style={{ color: saving > 0 ? 'var(--hb-good)' : 'var(--hb-bad)' }} className="hb-num">
      {saving > 0 ? '−' : '+'}{formatMoney(Math.abs(saving))} · {Math.abs(pct)}%
    </span>
  )
}

function OrderStatusPill({ view, lang }: { view: OrderView; lang: Lang }) {
  const key = view.status === 'pending' ? 'orderPending' : view.status === 'final' ? 'orderFinal' : 'orderCancelled'
  const tone = view.status === 'final' ? 'good' : view.status === 'cancelled' ? 'neutral' : view.awaiting === 'buyer' ? 'action' : 'info'
  return <span className={`hb-pill hb-pill--${tone}`}>{t(lang, key)}</span>
}

/**
 * §10 — "Order page must indicate that an order went through special price negotiation,
 * including whether an attachment/invoice was submitted. Full negotiation history/log must
 * be visible on the order. Needed specifically so HB Admins can follow up."
 */
function OrderPage({ order, request, view, viewer, lang, onClose }: {
  order: Order
  request: NegotiationRequest | null
  view: OrderView
  viewer: 'buyer' | 'seller' | 'admin'
  lang: Lang
  onClose: () => void
}) {
  const { dispatch } = useRfq()
  // An admin opens the order to audit it, so the provenance panel starts open for them:
  // it is the reason they are on this page, not an extra they have to go looking for.
  const [admin, setAdmin] = useState(viewer === 'admin')
  /*
    Every document on the record, not the first one. A line can carry more than one now,
    and an audit line that names one of three attachments is worse than naming none — it
    reads as a complete list.
  */
  const proofsOnRecord = request?.lines.flatMap((l) => l.proofs) ?? []

  // §6/§7 — only the buyer acts on the order, and only where the projection says so.
  const canConfirm = viewer === 'buyer' && view.buyerActions.includes('confirm')
  const canCancel = viewer === 'buyer' && view.buyerActions.includes('cancel')

  return (
    <Modal
      wide
      title={
        <div>
          <h2 className="hb-h2">{order.id}</h2>
          <div className="hb-row" style={{ marginTop: 6 }}>
            <OrderStatusPill view={view} lang={lang} />
            <span className="hb-hint">
              {viewer === 'admin'
                ? `${order.buyerName} · ${order.sellerName}`
                : viewer === 'buyer' ? order.sellerName : order.buyerName}
            </span>
          </div>
        </div>
      }
      onClose={onClose}
      footer={
        <>
          {canCancel && (
            <button
              type="button" className="hb-btn hb-btn--danger"
              onClick={() => { dispatch({ type: 'cancel_order', id: order.id }); onClose() }}
            >
              {t(lang, 'cancelOrder')}
            </button>
          )}
          {canConfirm && (
            <span className="hb-primary-slot">
              <button
                type="button" className="hb-btn hb-btn--primary"
                onClick={() => { dispatch({ type: 'confirm_order', id: order.id }); onClose() }}
              >
                {t(lang, 'confirmOrder')}
              </button>
            </span>
          )}
          {!canConfirm && !canCancel && (
            <span className="hb-hint">
              {view.status === 'final' ? t(lang, 'orderSettledNoAction') : t(lang, 'orderCancelled')}
            </span>
          )}
        </>
      }
    >
      {/* §7 — the order says in words what it is waiting for and what the buyer may do. */}
      {view.status === 'pending' && (
        <div className={`hb-banner hb-banner--${view.awaiting === 'buyer' ? 'action' : 'info'}`} style={{ marginBottom: 14 }}>
          {view.awaiting === 'seller'
            ? t(lang, 'awaitingSeller')
            : view.revertedToOriginal ? t(lang, 'awaitingBuyerReverted') : t(lang, 'awaitingBuyerCounter')}
        </div>
      )}

      {/* §10 — provenance, on the order itself, whichever way it went. */}
      <div className="hb-row" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <span className={`hb-pill hb-pill--${view.negotiation ? OUTCOME_TONE[view.negotiation] : 'neutral'}`}>
          {view.negotiation ? t(lang, OUTCOME_KEY[view.negotiation]) : t(lang, 'standardOrder')}
        </span>
        {view.negotiated && (
          <span className={`hb-pill hb-pill--${view.hadProof ? 'good' : 'neutral'}`}>
            {view.hadProof ? t(lang, 'invoiceSubmitted') : t(lang, 'noInvoiceSubmitted')}
          </span>
        )}
        {view.negotiated && order.requestRef && <span className="hb-ref">{order.requestRef}</span>}
      </div>

      {/* §9/§10 — the seller's stated reason, verbatim, where the price did not move. */}
      {view.declineReason && (
        <div className="hb-banner hb-banner--bad" style={{ marginBottom: 14 }}>
          <div>
            <strong>{t(lang, 'supplierDeclinedBecause')}</strong>
            <div style={{ marginTop: 4 }}>
              {t(lang, declineReasonKey(view.declineReason.code))}
              {view.declineReason.note && ` — ${view.declineReason.note}`}
            </div>
          </div>
        </div>
      )}

      {/* §9 — original price against the price the order will actually be placed at. */}
      <div className="hb-table-wrap">
        <table className="hb-table">
          <thead>
            <tr>
              <th>{t(lang, 'product')}</th>
              <th>{t(lang, 'quantity')}</th>
              <th>{t(lang, 'originalPrice')}</th>
              <th className="hb-col-offered">{t(lang, 'agreedPrice')}</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((l) => (
              <tr key={l.sku}>
                <td>{l.productName[lang]}<div className="hb-hint">{l.sku}</div></td>
                <td className="hb-num">{l.quantity}</td>
                <td><Money value={l.originalUnitPrice} lang={lang} /></td>
                <td className="hb-col-offered"><Money value={view.prices[l.sku] ?? l.originalUnitPrice} lang={lang} /></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>{t(lang, 'requestTotal')}</td>
              <td><Money value={orderOriginalTotal(order)} lang={lang} withCurrency /></td>
              <td className="hb-col-offered"><Money value={orderTotal(order, view)} lang={lang} withCurrency /></td>
            </tr>
            <tr>
              <td colSpan={2}>{t(lang, 'savedVsList')}</td>
              <td colSpan={2}><PriceDelta order={order} view={view} lang={lang} /></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* §9/§10 — the full back-and-forth, retained and viewable from the order. */}
      {request && (
        <div style={{ marginTop: 18 }}>
          <div className="hb-spread" style={{ marginBottom: 8 }}>
            <h3 className="hb-h3">{t(lang, 'orderNegotiationLog')}</h3>
            <button
              type="button" className="hb-btn hb-btn--sm hb-btn--secondary"
              aria-pressed={admin} onClick={() => setAdmin((v) => !v)}
            >
              {t(lang, 'adminView')}
            </button>
          </div>

          {admin && (
            <div className="hb-banner hb-banner--info" style={{ marginBottom: 10 }}>
              <div>
                <div>{t(lang, view.hadProof ? 'adminViewNote' : 'adminViewNoteNoProof')}</div>
                {proofsOnRecord.map((pr) => (
                  <div className="hb-hint" style={{ marginTop: 6 }} key={pr.hash}>
                    {t(lang, 'attachmentOnRecord')}: <span dir="ltr">{pr.fileName}</span>
                    {' · '}<span dir="ltr">{pr.hash}</span>
                  </div>
                ))}
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
            <p className="hb-hint">
              {lang === 'ar'
                ? 'السجل غير قابل للتعديل أو الحذف من أي دور، بما في ذلك إدارة المنصة.'
                : 'The history log is append-only and cannot be edited or deleted by any role, including HIGHBASE administrators.'}
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}
