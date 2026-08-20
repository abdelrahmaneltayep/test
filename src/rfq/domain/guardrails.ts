/**
 * Guardrails — PRD §4.3 FR-3.4 (a … h).
 *
 * Every value is tenant-configurable within stated bounds; the defaults ship enabled.
 * G5 depends on these: a negotiation always terminates, so no clock may be switched off.
 */

export interface Guardrail<T> {
  id: string
  default: T
  min: T | null
  max: T | null
  phase: 'P1' | 'P2'
}

export const GUARDRAILS = {
  /** FR-3.4a — escalation notice at 4 h remaining; auto-expired at 0. */
  sellerResponseSlaHours: { id: 'FR-3.4a', default: 24, min: 4, max: 72, phase: 'P1' },
  /** FR-3.4b — offer validity; buyer may re-request after expiry. */
  offerValidityDays: { id: 'FR-3.4b', default: 7, min: 1, max: 30, phase: 'P1' },
  /** FR-3.4c — counter is removed with the reason stated (AC-10.4). */
  maxRounds: { id: 'FR-3.4c', default: 5, min: 1, max: 10, phase: 'P1' },
  /** FR-3.4d — buyer response window on info_requested. */
  buyerResponseWindowHours: { id: 'FR-3.4d', default: 72, min: 24, max: 168, phase: 'P2' },
  /** FR-3.4e — proof freshness; a stale document fails the freshness check. */
  proofFreshnessDays: { id: 'FR-3.4e', default: 30, min: 7, max: 90, phase: 'P2' },
  /** FR-3.4g — auto-accept threshold as a percentage below list. Off by default. */
  autoAcceptPercent: { id: 'FR-3.4g', default: 0, min: 0, max: 10, phase: 'P1' },
  /** FR-3.4h — a third information request is blocked; a decision is required (AC-17.5). */
  maxInfoRequests: { id: 'FR-3.4h', default: 2, min: 1, max: 3, phase: 'P2' },
} as const satisfies Record<string, Guardrail<number>>

/** FR-2.6 — per-seller gating, configurable. */
export const GATING = {
  maxOpenRequestsPerBuyer: 10,
  cooldownDaysAfterTerminal: 14,
  maxLinesPerRequest: 20, // AC-6.5
  minLinesPerRequest: 1,
  draftRetentionDays: 7, // FR-2.8
} as const

/** AC-14.5 — rows under this many hours of SLA remaining are visually escalated. */
export const SLA_ESCALATION_HOURS = 4

/** EC-8 — below this share of list price the ask is implausible: warn and flag, never block. */
export const IMPLAUSIBLE_ASK_RATIO = 0.5

/** EC-13 — grace period from the seller's last edit while composing a response. */
export const COMPOSE_GRACE_MINUTES = 15

/** AC-19.6 / FR-6.9 — "Same as last time" looks back this far. */
export const SAME_AS_LAST_TIME_DAYS = 90

export type GuardrailKey = keyof typeof GUARDRAILS

/** A tenant may only configure a guardrail inside its published bounds. */
export function withinBounds(key: GuardrailKey, value: number): boolean {
  const g = GUARDRAILS[key]
  if (!Number.isFinite(value)) return false
  if (g.min !== null && value < g.min) return false
  if (g.max !== null && value > g.max) return false
  return true
}

export function guardrailValue(key: GuardrailKey, configured?: number): number {
  if (configured !== undefined && withinBounds(key, configured)) return configured
  return GUARDRAILS[key].default
}
