/**
 * State machine — PRD §4.3 (FR-3.1 … FR-3.3).
 *
 * One internal state is stored; two labels are rendered depending on who is looking
 * (FR-3.2). Internal names never surface in a user-facing string (AC-8.4).
 * Any transition not in TRANSITIONS is invalid and is rejected with 409 (FR-3.3).
 */

import type { Actor, Route } from './types'

/** FR-3.1 — eleven states since price matching went order by order. Adding one is a schema change. */
export const STATES = [
  'draft',
  'submitted',
  'viewed',
  'info_requested',
  'countered_by_seller',
  'countered_by_buyer',
  'accepted',
  'declined',
  'expired',
  'withdrawn',
  'lost',
] as const

export type RequestState = (typeof STATES)[number]

export interface StateMeta {
  /** FR-3.2 — null where the state is hidden from that actor entirely. */
  buyerLabel: { en: string; ar: string } | null
  sellerLabel: { en: string; ar: string } | null
  /** G3 — whose turn it is, from the single stored state. */
  turn: Actor | null
  terminal: boolean
  phase: 'P1' | 'P2'
  /** AC-8.2 — buyer-side rows that need the buyer sort to the top. */
  buyerActionRequired: boolean
}

/** FR-3.2 — the dual-label table, verbatim. */
export const STATE_META: Record<RequestState, StateMeta> = {
  draft: {
    buyerLabel: { en: 'Draft', ar: 'مسودة' },
    sellerLabel: null,
    turn: 'buyer', terminal: false, phase: 'P1', buyerActionRequired: false,
  },
  submitted: {
    buyerLabel: { en: 'Submitted', ar: 'تم الإرسال' },
    sellerLabel: { en: 'New', ar: 'جديد' },
    turn: 'seller', terminal: false, phase: 'P1', buyerActionRequired: false,
  },
  viewed: {
    buyerLabel: { en: 'Pending', ar: 'قيد المراجعة' },
    sellerLabel: { en: 'Open', ar: 'مفتوح' },
    turn: 'seller', terminal: false, phase: 'P1', buyerActionRequired: false,
  },
  info_requested: {
    buyerLabel: { en: 'Action needed', ar: 'مطلوب إجراء' },
    sellerLabel: { en: 'Awaiting buyer', ar: 'بانتظار المشتري' },
    turn: 'buyer', terminal: false, phase: 'P2', buyerActionRequired: true,
  },
  countered_by_seller: {
    buyerLabel: { en: 'Counter received', ar: 'وصل عرض مقابل' },
    sellerLabel: { en: 'Countered', ar: 'تم الرد بعرض' },
    turn: 'buyer', terminal: false, phase: 'P1', buyerActionRequired: true,
  },
  countered_by_buyer: {
    buyerLabel: { en: 'Countered', ar: 'تم الرد بعرض' },
    sellerLabel: { en: 'Updated', ar: 'تم التحديث' },
    turn: 'seller', terminal: false, phase: 'P1', buyerActionRequired: false,
  },
  accepted: {
    buyerLabel: { en: 'Accepted', ar: 'تم القبول' },
    sellerLabel: { en: 'Accepted', ar: 'تم القبول' },
    turn: null, terminal: true, phase: 'P1', buyerActionRequired: false,
  },
  declined: {
    buyerLabel: { en: 'Declined', ar: 'مرفوض' },
    sellerLabel: { en: 'Declined', ar: 'مرفوض' },
    turn: null, terminal: true, phase: 'P1', buyerActionRequired: false,
  },
  expired: {
    buyerLabel: { en: 'Expired', ar: 'منتهي الصلاحية' },
    sellerLabel: { en: 'Expired', ar: 'منتهي الصلاحية' },
    turn: null, terminal: true, phase: 'P1', buyerActionRequired: false,
  },
  withdrawn: {
    buyerLabel: { en: 'Cancelled', ar: 'ملغى' },
    sellerLabel: { en: 'Withdrawn', ar: 'مسحوب' },
    turn: null, terminal: true, phase: 'P1', buyerActionRequired: false,
  },
  lost: {
    // FR-3.2 — hidden from the buyer entirely; it exists for seller analytics (EC-43).
    buyerLabel: null,
    sellerLabel: { en: 'Lost', ar: 'خسارة' },
    turn: null, terminal: true, phase: 'P1', buyerActionRequired: false,
  },
}

export function isTerminal(state: RequestState): boolean {
  return STATE_META[state].terminal
}

export const NON_TERMINAL_STATES = STATES.filter((s) => !STATE_META[s].terminal)

export interface Transition {
  from: RequestState
  to: RequestState
  trigger: string
  actors: Actor[]
  /**
   * FR-1.2 — the routes this move exists on. Absent means both, which is every row but
   * the seller's counter.
   *
   * Price matching is a guarantee: on the match route the buyer's verified price wins, so
   * there is nothing for the seller to counter with. The move is not merely hidden in the
   * UI — it is not in the table, so the reducer rejects it with the same 409 any other
   * unlisted transition gets (FR-3.3). The quote route keeps the full loop: nothing there
   * is verified, so there is nothing to guarantee.
   */
  routes?: Route[]
}

/**
 * A request is on the match route only when every line is on it. A mixed request keeps the
 * counter, because the guarantee is a claim about verified evidence and a quote line
 * carries none — withdrawing the seller's counter over a line nobody proved anything about
 * would be a guarantee the buyer never earned.
 */
export function routeOf(lines: readonly { route: Route }[]): Route {
  return lines.length > 0 && lines.every((l) => l.route === 'case_1') ? 'case_1' : 'case_2'
}

function allowsRoute(t: Transition, route: Route | undefined): boolean {
  return route === undefined || t.routes === undefined || t.routes.includes(route)
}

/**
 * FR-3.3 — the permitted transitions, expanded one row per (from, to) pair.
 *
 * Two clarifications the table leaves implicit, resolved against the more specific
 * acceptance criteria: `draft` is excluded from the "any non-terminal → withdrawn"
 * row because AC-12.1 enumerates the states withdraw is offered in and draft is not
 * one of them (an unsent draft is discarded, not withdrawn), and it is excluded from
 * "any non-terminal → expired" because a draft is governed by the 7-day draft
 * retention window in FR-2.8, not by the SLA clock in FR-3.4a.
 */
const WITHDRAWABLE: RequestState[] = [
  'submitted', 'viewed', 'info_requested', 'countered_by_seller', 'countered_by_buyer',
]

export const TRANSITIONS: readonly Transition[] = [
  { from: 'draft', to: 'submitted', trigger: 'submit', actors: ['buyer'] },
  { from: 'submitted', to: 'viewed', trigger: 'seller_opens', actors: ['seller'] },

  // The seller's counter, and the only rows in this table a route can take away.
  { from: 'submitted', to: 'countered_by_seller', trigger: 'send_response', actors: ['seller'], routes: ['case_2'] },
  { from: 'viewed', to: 'countered_by_seller', trigger: 'send_response', actors: ['seller'], routes: ['case_2'] },

  { from: 'submitted', to: 'accepted', trigger: 'accept_as_asked', actors: ['seller', 'system'] },
  { from: 'viewed', to: 'accepted', trigger: 'accept_as_asked', actors: ['seller', 'system'] },

  // A price now settles one order and no more: the PM's direction is order by order, so
  // the seller's second acceptance — the one that wrote the price forward as a template —
  // is gone, and with it the state it led to.

  { from: 'submitted', to: 'declined', trigger: 'decline', actors: ['seller', 'system'] },
  { from: 'viewed', to: 'declined', trigger: 'decline', actors: ['seller', 'system'] },

  { from: 'submitted', to: 'info_requested', trigger: 'request_more_info', actors: ['seller'] },
  { from: 'viewed', to: 'info_requested', trigger: 'request_more_info', actors: ['seller'] },
  { from: 'countered_by_buyer', to: 'info_requested', trigger: 'request_more_info', actors: ['seller'] },

  { from: 'info_requested', to: 'countered_by_buyer', trigger: 'buyer_resubmits', actors: ['buyer'] },

  { from: 'countered_by_seller', to: 'accepted', trigger: 'buyer_accepts', actors: ['buyer'] },
  { from: 'countered_by_seller', to: 'countered_by_buyer', trigger: 'buyer_counters', actors: ['buyer'] },
  { from: 'countered_by_seller', to: 'declined', trigger: 'buyer_declines', actors: ['buyer'] },

  { from: 'countered_by_buyer', to: 'countered_by_seller', trigger: 'send_response', actors: ['seller'], routes: ['case_2'] },
  { from: 'countered_by_buyer', to: 'accepted', trigger: 'seller_accepts', actors: ['seller'] },
  { from: 'countered_by_buyer', to: 'declined', trigger: 'seller_declines', actors: ['seller'] },

  ...WITHDRAWABLE.map<Transition>((from) => ({
    from, to: 'withdrawn', trigger: 'buyer_withdraws', actors: ['buyer'],
  })),
  ...NON_TERMINAL_STATES.filter((s) => s !== 'draft').map<Transition>((from) => ({
    from, to: 'expired', trigger: 'clock_elapses', actors: ['system'],
  })),

  { from: 'declined', to: 'lost', trigger: 'bought_elsewhere', actors: ['system'] },
  { from: 'expired', to: 'lost', trigger: 'bought_elsewhere', actors: ['system'] },
]

export function findTransition(
  from: RequestState, to: RequestState, actor?: Actor, route?: Route,
): Transition | undefined {
  return TRANSITIONS.find(
    (t) => t.from === from && t.to === to
      && (actor === undefined || t.actors.includes(actor))
      && allowsRoute(t, route),
  )
}

export function canTransition(
  from: RequestState, to: RequestState, actor?: Actor, route?: Route,
): boolean {
  return findTransition(from, to, actor, route) !== undefined
}

export interface TransitionRejection {
  ok: false
  /** FR-3.3 — the API rejects an unlisted transition with 409 Conflict. */
  status: 409
  reason: string
}

export type TransitionResult = { ok: true; transition: Transition } | TransitionRejection

export function attemptTransition(
  from: RequestState, to: RequestState, actor: Actor, route?: Route,
): TransitionResult {
  const transition = findTransition(from, to, actor, route)
  if (transition) return { ok: true, transition }
  // Three ways to be rejected, and the caller is told which: the pair does not exist, the
  // actor may not make that move, or the route this request took does not carry it.
  const forAnyone = findTransition(from, to, undefined, route)
  const onAnyRoute = findTransition(from, to, actor)
  let reason: string
  if (onAnyRoute !== undefined) {
    reason = `${from} → ${to} is not available on the ${route} route`
  } else if (forAnyone !== undefined || findTransition(from, to) !== undefined) {
    reason = `${actor} may not move a request from ${from} to ${to}`
  } else {
    reason = `${from} → ${to} is not a permitted transition`
  }
  return { ok: false, status: 409, reason }
}

/** FR-3.2 — resolve the label for the actor who is looking. Never leaks the internal name. */
export function labelFor(
  state: RequestState, viewer: 'buyer' | 'seller', lang: 'en' | 'ar',
): string | null {
  const label = viewer === 'buyer' ? STATE_META[state].buyerLabel : STATE_META[state].sellerLabel
  return label ? label[lang] : null
}
