/**
 * Auto-rules — PRD §3.3 US-19 and §4.3 FR-3.4f/g.
 *
 * The rules exist so negotiation volume does not scale linearly into seller headcount (O4).
 * Two hard constraints govern them: floor always wins over auto-accept (EC-22), and a
 * failed proof check blocks auto-accept entirely (AC-19.4).
 *
 * Price matching took the floor's *auto-decline* off the match route, and this is where
 * that guarantee is easiest to break by omission: FR-3.4f used to refuse a below-floor ask
 * before a person ever saw it, and AC-19.5 forbids the refusal from saying why. A silent
 * machine "no" to a price the buyer proved is the exact thing the guarantee promises will
 * not happen. So on the match route a below-floor ask is queued for a person; the floor
 * still outranks auto-accept there, and the quote route keeps the rule whole.
 */

import { guardrailValue } from './guardrails'
import type { Minor, RequestLine } from './types'

export type AutoDecision = 'auto_decline' | 'auto_accept' | 'queue'

export interface RuleOutcome {
  decision: AutoDecision
  /** AC-19.3 — recorded in history with actor `system` and the rule that fired. */
  rule: string | null
  /** Operations-facing only. AC-19.5 forbids disclosing any of this to the buyer. */
  internalReason: string | null
  /** EC-21 — a floor above list is a misconfiguration; the rule does not fire. */
  opsAlert: string | null
}

export interface RuleConfig {
  /** FR-3.4g — percentage below list that auto-accepts. 0 means off. */
  autoAcceptPercent?: number
}

export interface RuleContext {
  lines: RequestLine[]
  /** AC-19.4 — true when any Case 1 line has a failed auto-check. */
  hasFailedProofCheck: boolean
  config?: RuleConfig
}

/**
 * Evaluate a submitted request against the seller's rules.
 *
 * Order matters and is not an implementation detail: floor is tested first so that a
 * request can never be auto-accepted below floor, even when the auto-accept threshold
 * would also have matched (EC-22).
 */
export function evaluateAutoRules(ctx: RuleContext): RuleOutcome {
  const priced = ctx.lines.filter((l) => l.askedPrice !== null)
  if (priced.length === 0) {
    return { decision: 'queue', rule: null, internalReason: 'no_priced_lines', opsAlert: null }
  }

  // EC-21 — detect a floor configured above list. The rule does not fire; ops is alerted.
  const misconfigured = priced.find(
    (l) => l.floorSnapshot !== null && l.floorSnapshot > l.listPriceSnapshot,
  )
  if (misconfigured) {
    return {
      decision: 'queue',
      rule: null,
      internalReason: 'floor_above_list',
      opsAlert: `Floor price for ${misconfigured.sku} exceeds its list price; floor rule suppressed (EC-21)`,
    }
  }

  const underFloor = priced.filter(
    (l) => l.floorSnapshot !== null && (l.askedPrice as Minor) < l.floorSnapshot,
  )

  // FR-3.4f — an ask below floor is auto-declined and never enters the queue (AC-19.1).
  // On the quote route only: see the note at the top of this file.
  const belowFloor = underFloor.find((l) => l.route === 'case_2')
  if (belowFloor) {
    return {
      decision: 'auto_decline',
      rule: 'FR-3.4f:floor_price',
      internalReason: `${belowFloor.sku} asked below floor`,
      opsAlert: null,
    }
  }

  // EC-22 still holds on the match route, in the only form left to it: the floor cannot
  // decline the request, but it can and does stop the machine accepting it. A proved ask
  // below floor is a decision for a person, taken with the position stated in red.
  const matchBelowFloor = underFloor.find((l) => l.route === 'case_1')
  if (matchBelowFloor) {
    return {
      decision: 'queue',
      rule: null,
      internalReason: `${matchBelowFloor.sku} asked below floor · match route, seller decides`,
      opsAlert: null,
    }
  }

  // AC-19.4 — never auto-accept a request carrying a failed proof check.
  if (ctx.hasFailedProofCheck) {
    return { decision: 'queue', rule: null, internalReason: 'failed_proof_check', opsAlert: null }
  }

  const threshold = guardrailValue('autoAcceptPercent', ctx.config?.autoAcceptPercent)
  if (threshold <= 0) {
    return { decision: 'queue', rule: null, internalReason: 'auto_accept_off', opsAlert: null }
  }

  // FR-3.4g — every priced line must sit within the threshold for the request to auto-accept.
  const allWithinThreshold = priced.every((l) => {
    const asked = l.askedPrice as Minor
    const maxDiscount = (l.listPriceSnapshot * threshold) / 100
    return l.listPriceSnapshot - asked <= maxDiscount
  })

  if (allWithinThreshold) {
    return {
      decision: 'auto_accept',
      rule: 'FR-3.4g:auto_accept_threshold',
      internalReason: `all lines within ${threshold}% of list`,
      opsAlert: null,
    }
  }
  return { decision: 'queue', rule: null, internalReason: 'outside_threshold', opsAlert: null }
}

/**
 * AC-19.5 — the buyer-facing message for an auto-decline. It names no floor, no cost,
 * no margin and no rule value, and it points at the alternative path (E-5).
 */
export const AUTO_DECLINE_MESSAGE = {
  en: 'This supplier cannot meet the requested price for these items. They remain available to order at list price.',
  ar: 'لا يستطيع المورّد تلبية السعر المطلوب لهذه الأصناف. وتظل متاحة للطلب بالسعر المعلن.',
} as const
