/**
 * Order aggregate — Feature Flow Draft §5 (MVP behaviour), §6, §7, §9 and §10.
 *
 * The draft describes the buyer's experience in terms of an *order* that sits in Pending
 * while the seller decides, gains Accept / Cancel buttons when the seller answers, and
 * reverts to Pending at the original price when the seller rejects. The PRD deliberately
 * does not model that on the negotiation itself: §6.6 Decision 2 separates the negotiation
 * object from the order object precisely because "rejected → Pending → awaiting a decision
 * on a request that is already closed" is circular when both live on one record.
 *
 * Both are satisfiable at once, and that is what this module does. The negotiation stays
 * exactly as the PRD specifies — eleven states, terminal is terminal, nothing here writes
 * to it. The order is a second aggregate that *observes* the negotiation and stores only
 * two facts of its own: whether the buyer confirmed it, and whether the buyer cancelled
 * it. Everything else the draft asks for — the status, the buttons, the price shown, the
 * revert-to-original on a reject — is projected from the negotiation's state, so the two
 * records can never disagree.
 */

import { lineTotal, sumMinor } from './money'
import { routeOf, STATE_META, type RequestState } from './states'
import type { Minor, NegotiationRequest, RequestLine } from './types'

/** §7 / §9 — Pending while the negotiation is live, Final once the price is settled. */
export type OrderStatus = 'pending' | 'final' | 'cancelled'

/** §6 / §7 — the buttons the buyer is offered on the order, and only these. */
export type OrderAction = 'confirm' | 'cancel'

/**
 * §5/§9 — how the price question was settled, which is what a Final Order has to state.
 *
 * Price matching split the old `accepted` in two, because it stopped being one thing. A
 * matched price is a guarantee honoured: the buyer proved a price and got exactly it. A
 * negotiated price is the quote route working normally — a number nobody promised, arrived
 * at by counter. Two Final Orders at the same total mean different things depending on
 * which happened, and an auditor asking "was the guarantee kept?" cannot answer it from a
 * row that calls both of them accepted.
 *
 *  - `matched`     the match route settled at the buyer's proved price. The guarantee held
 *  - `negotiated`  a price was agreed that nobody was entitled to: the quote route settled,
 *                  or the seller accepted an ask on it
 *  - `rejected`    the price never moved. The seller declined, or the clock ran out, and the
 *                  order stands at the original price — §5's MVP path
 *  - `open`        still under negotiation, so none of the above yet
 *  - `null`        a standard order; there was no negotiation to settle
 */
export type NegotiationOutcome = 'matched' | 'negotiated' | 'rejected' | 'open' | null

/** Every settled outcome, for a surface that groups or filters by it. */
export const SETTLED_OUTCOMES = ['matched', 'negotiated', 'rejected'] as const

export interface OrderLine {
  sku: string
  productName: { en: string; ar: string }
  quantity: number
  /** §9 — the "old" price the indicator compares against. */
  originalUnitPrice: Minor
}

/**
 * The buyer's own decision on the order. Null until they take one — everything else about
 * the order is derived, so this is the whole of its mutable state.
 */
export interface OrderResolution {
  kind: 'confirmed' | 'cancelled'
  at: string
  /** The unit price per SKU at the moment the buyer confirmed. Empty on a cancel. */
  prices: Record<string, Minor>
}

export interface Order {
  /** ORD-{YY}{MM}-{seq}, the same shape as the negotiation reference (FR-1.10). */
  id: string
  buyerId: string
  buyerName: string
  sellerId: string
  sellerName: string
  placedAt: string
  lines: OrderLine[]
  /** §10 — null for a standard order that never went through a negotiation. */
  requestRef: string | null
  resolution: OrderResolution | null
}

export interface OrderView {
  status: OrderStatus
  /** Whose move it is. Null once the order is settled either way. */
  awaiting: 'buyer' | 'seller' | null
  /** §7 — while awaiting the seller the buyer has Cancel and nothing else. */
  buyerActions: OrderAction[]
  /** The price each line stands at right now, keyed by SKU. */
  prices: Record<string, Minor>
  /**
   * §5 MVP — "once rejected, the order returns to Pending status". True when the price
   * shown is the original one because the negotiation failed rather than settled.
   */
  revertedToOriginal: boolean
  /** §9 — a negotiated order that has been settled belongs in Final Orders. */
  inFinalOrders: boolean
  /** §10 — did the negotiation behind this order carry an invoice or quote. */
  hadProof: boolean
  /** §10 — did this order go through a negotiation at all. */
  negotiated: boolean
  /** §5/§9 — matched, negotiated, rejected, or still open. Null on a standard order. */
  negotiation: NegotiationOutcome
  /**
   * §9/§10 — why the seller turned it down, where they did. An order that reverted to its
   * original price is a question an admin will ask about, and "rejected" is not an answer
   * to it; the reason travels with the order so the answer is on the record beside it.
   */
  declineReason: { code: string; note: string } | null
}

/**
 * §6/§7 — the buyer answers a Modify or a Reject, and only those. An acceptance needs no
 * buyer action ("If the seller Accepts as-is: buyer takes no action"), and a live
 * negotiation offers Cancel alone.
 */
const AWAITS_BUYER_ON_ORDER: RequestState[] = ['countered_by_seller', 'declined', 'expired']

/** A standard order: no negotiation, nothing to wait for, straight into Final Orders. */
function standardView(order: Order): OrderView {
  const prices = Object.fromEntries(order.lines.map((l) => [l.sku, l.originalUnitPrice]))
  const cancelled = order.resolution?.kind === 'cancelled'
  return {
    status: cancelled ? 'cancelled' : 'final',
    awaiting: null,
    buyerActions: [],
    prices,
    revertedToOriginal: false,
    inFinalOrders: !cancelled,
    hadProof: false,
    negotiated: false,
    negotiation: null,
    declineReason: null,
  }
}

/**
 * Project the order's status and the buyer's available actions from the negotiation it
 * hangs off. Pure, and total over every one of the twelve states.
 */
export function viewOrder(order: Order, request: NegotiationRequest | null): OrderView {
  if (!order.requestRef || !request) return standardView(order)

  const hadProof = request.lines.some((l) => l.proofs.length > 0)
  const original = Object.fromEntries(order.lines.map((l) => [l.sku, l.originalUnitPrice]))
  const settled = request.state === 'accepted'

  // The negotiated price, where one was agreed. A declined line resolves at list price
  // (FR-6.3), which is already what `original` holds.
  const negotiated: Record<string, Minor> = { ...original }
  for (const l of request.lines) {
    if (l.offeredPrice !== null && l.outcome !== 'declined') negotiated[l.sku] = l.offeredPrice
  }

  /*
   * The outcome is a fact about the negotiation, not about the order's status, so it is
   * read off the request the same way whether the order is pending, final or cancelled: a
   * buyer who cancelled after a rejection still cancelled after a rejection.
   *
   * A settlement on the match route is `matched` and nowhere else is: the route is what
   * makes a price a guarantee rather than a bargain, and a counter the buyer accepted is a
   * bargain however good it was. That is also why a confirmed counter reads `negotiated`
   * and not `matched` — the buyer chose it, they were not owed it.
   */
  const matchRoute = routeOf(request.lines) === 'case_1'
  const negotiation: NegotiationOutcome = settled ? (matchRoute ? 'matched' : 'negotiated')
    : request.state === 'declined' || request.state === 'expired' ? 'rejected'
      : request.state === 'countered_by_seller' && order.resolution?.kind === 'confirmed' ? 'negotiated'
        : 'open'

  const base = {
    revertedToOriginal: false,
    hadProof,
    negotiated: true,
    negotiation,
    // Carried only where it is the reason this order stands where it does.
    declineReason: negotiation === 'rejected' ? request.declineReason : null,
  }

  // The buyer's own decision wins over everything: a cancelled order is cancelled even if
  // the seller later accepts, and a confirmed order keeps the price it was confirmed at.
  if (order.resolution?.kind === 'cancelled') {
    return { ...base, status: 'cancelled', awaiting: null, buyerActions: [], prices: original, inFinalOrders: false }
  }
  if (order.resolution?.kind === 'confirmed') {
    return {
      ...base,
      status: 'final', awaiting: null, buyerActions: [],
      prices: { ...original, ...order.resolution.prices },
      // §5 MVP — confirming after a reject means confirming at the original price.
      revertedToOriginal: !settled,
      inFinalOrders: true,
    }
  }

  // §6 — the seller accepted as asked, so the order proceeds with no buyer action at all.
  if (settled) {
    return { ...base, status: 'final', awaiting: null, buyerActions: [], prices: negotiated, inFinalOrders: true }
  }

  // §7 — the buyer withdrew the negotiation, which cancels the order with it.
  if (request.state === 'withdrawn' || request.state === 'lost') {
    return { ...base, status: 'cancelled', awaiting: null, buyerActions: [], prices: original, inFinalOrders: false }
  }

  if (AWAITS_BUYER_ON_ORDER.includes(request.state)) {
    // §5 MVP / §7 — a reject (and, by the same reasoning, a lapsed SLA) puts the order back
    // to Pending at the original price with Cancel still available; §7 adds that the buyer
    // may also accept what was sent, which here is the original price standing.
    const reverted = request.state !== 'countered_by_seller'
    return {
      ...base,
      status: 'pending', awaiting: 'buyer', buyerActions: ['confirm', 'cancel'],
      prices: reverted ? original : negotiated,
      revertedToOriginal: reverted,
      inFinalOrders: false,
    }
  }

  // §7 — "while awaiting the seller's response, the buyer sees no action except Cancel".
  return {
    ...base,
    status: 'pending',
    awaiting: STATE_META[request.state].turn === 'buyer' ? 'buyer' : 'seller',
    buyerActions: ['cancel'],
    prices: original,
    inFinalOrders: false,
  }
}

/** §9 — the total the order will actually be invoiced at, at its current prices. */
export function orderTotal(order: Order, view: OrderView): Minor {
  return sumMinor(order.lines.map((l) => lineTotal(view.prices[l.sku] ?? l.originalUnitPrice, l.quantity)))
}

/** §9 — the "old price" side of the indicator: what the same basket costs at list. */
export function orderOriginalTotal(order: Order): Minor {
  return sumMinor(order.lines.map((l) => lineTotal(l.originalUnitPrice, l.quantity)))
}

/**
 * §9 — "Final Orders must show an indicator of the original (old) price vs. the accepted
 * price." Positive means the negotiation saved money; zero means the price did not move,
 * which is the honest reading of a rejected request the buyer confirmed anyway.
 */
export function orderSaving(order: Order, view: OrderView): Minor {
  return orderOriginalTotal(order) - orderTotal(order, view)
}

/** The order lines a negotiation implies, at the prices snapshotted when it was sent. */
export function orderLinesFrom(lines: RequestLine[]): OrderLine[] {
  return lines.map((l) => ({
    sku: l.sku,
    productName: l.productName,
    quantity: l.quantity,
    originalUnitPrice: l.listPriceSnapshot,
  }))
}

export function makeOrderId(now: Date, seq: number): string {
  const yy = String(now.getUTCFullYear()).slice(2)
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `ORD-${yy}${mm}-${String(seq).padStart(4, '0')}`
}
