/**
 * State machine — PRD §4.3 (FR-3.1 … FR-3.3).
 *
 * One internal state is stored; two labels are rendered depending on who is looking
 * (FR-3.2). Internal names never surface in a user-facing string (AC-8.4).
 * Any transition not in TRANSITIONS is invalid and is rejected with 409 (FR-3.3).
 */

import type { Actor } from './types'

/** FR-3.1 — exactly twelve states. Adding a thirteenth is a schema change. */
export const STATES = [
  'draft',
  'submitted',
  'viewed',
  'info_requested',
  'countered_by_seller',
  'countered_by_buyer',
  'accepted',
  'accepted_as_template',
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
  accepted_as_template: {
    buyerLabel: { en: 'Accepted · price saved', ar: 'تم القبول · حُفظ السعر' },
    sellerLabel: { en: 'Template active', ar: 'قالب سعر فعّال' },
    turn: null, terminal: true, phase: 'P2', buyerActionRequired: false,
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

  { from: 'submitted', to: 'countered_by_seller', trigger: 'send_response', actors: ['seller'] },
  { from: 'viewed', to: 'countered_by_seller', trigger: 'send_response', actors: ['seller'] },

  { from: 'submitted', to: 'accepted', trigger: 'accept_as_asked', actors: ['seller', 'system'] },
  { from: 'viewed', to: 'accepted', trigger: 'accept_as_asked', actors: ['seller', 'system'] },

  { from: 'submitted', to: 'declined', trigger: 'decline', actors: ['seller', 'system'] },
  { from: 'viewed', to: 'declined', trigger: 'decline', actors: ['seller', 'system'] },

  { from: 'submitted', to: 'info_requested', trigger: 'request_more_info', actors: ['seller'] },
  { from: 'viewed', to: 'info_requested', trigger: 'request_more_info', actors: ['seller'] },
  { from: 'countered_by_buyer', to: 'info_requested', trigger: 'request_more_info', actors: ['seller'] },

  { from: 'info_requested', to: 'countered_by_buyer', trigger: 'buyer_resubmits', actors: ['buyer'] },

  { from: 'countered_by_seller', to: 'accepted', trigger: 'buyer_accepts', actors: ['buyer'] },
  { from: 'countered_by_seller', to: 'accepted_as_template', trigger: 'buyer_accepts_template', actors: ['buyer'] },
  { from: 'countered_by_seller', to: 'countered_by_buyer', trigger: 'buyer_counters', actors: ['buyer'] },
  { from: 'countered_by_seller', to: 'declined', trigger: 'buyer_declines', actors: ['buyer'] },

  { from: 'countered_by_buyer', to: 'countered_by_seller', trigger: 'send_response', actors: ['seller'] },
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
  from: RequestState, to: RequestState, actor?: Actor,
): Transition | undefined {
  return TRANSITIONS.find(
    (t) => t.from === from && t.to === to && (actor === undefined || t.actors.includes(actor)),
  )
}

export function canTransition(from: RequestState, to: RequestState, actor?: Actor): boolean {
  return findTransition(from, to, actor) !== undefined
}

export interface TransitionRejection {
  ok: false
  /** FR-3.3 — the API rejects an unlisted transition with 409 Conflict. */
  status: 409
  reason: string
}

export type TransitionResult = { ok: true; transition: Transition } | TransitionRejection

export function attemptTransition(
  from: RequestState, to: RequestState, actor: Actor,
): TransitionResult {
  const transition = findTransition(from, to, actor)
  if (transition) return { ok: true, transition }
  const existsForAnyActor = findTransition(from, to) !== undefined
  return {
    ok: false,
    status: 409,
    reason: existsForAnyActor
      ? `${actor} may not move a request from ${from} to ${to}`
      : `${from} → ${to} is not a permitted transition`,
  }
}

/** FR-3.2 — resolve the label for the actor who is looking. Never leaks the internal name. */
export function labelFor(
  state: RequestState, viewer: 'buyer' | 'seller', lang: 'en' | 'ar',
): string | null {
  const label = viewer === 'buyer' ? STATE_META[state].buyerLabel : STATE_META[state].sellerLabel
  return label ? label[lang] : null
}
