/**
 * Clocks — PRD §4.3 FR-3.5/FR-3.6 and the EC-13 … EC-18 family.
 *
 * Every countdown in the product derives from a server-supplied reference timestamp with
 * client-side interpolation only; client wall-clock time is never trusted (EC-18). The
 * buyer's countdown and the seller's countdown are the same computation, so they agree to
 * the minute (FR-4.6 / AC-9.5).
 */

import { COMPOSE_GRACE_MINUTES, SLA_ESCALATION_HOURS } from './guardrails'
import { isTerminal, type RequestState } from './states'

export const HOUR_MS = 3_600_000
export const DAY_MS = 86_400_000

export function addHours(from: Date, hours: number): Date {
  return new Date(from.getTime() + hours * HOUR_MS)
}

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * DAY_MS)
}

export function remainingMs(dueAt: string | null, serverNow: Date): number | null {
  if (!dueAt) return null
  return new Date(dueAt).getTime() - serverNow.getTime()
}

/** AC-14.5 — under 4 hours remaining, the row is escalated. */
export function isEscalated(dueAt: string | null, serverNow: Date): boolean {
  const ms = remainingMs(dueAt, serverNow)
  return ms !== null && ms > 0 && ms < SLA_ESCALATION_HOURS * HOUR_MS
}

/**
 * Format a countdown to the minute. Both surfaces call this with the same reference time,
 * which is what makes FR-4.6's "consistent to the minute" true rather than aspirational.
 */
export function formatCountdown(ms: number | null, lang: 'en' | 'ar'): string {
  if (ms === null) return '—'
  if (ms <= 0) return lang === 'ar' ? 'انتهت المهلة' : 'Elapsed'
  const totalMinutes = Math.floor(ms / 60_000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  if (lang === 'ar') {
    if (days > 0) return `${days} يوم ${hours} ساعة`
    if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`
    return `${minutes} دقيقة`
  }
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

/**
 * EC-16 — server time is authoritative. An accept arriving at or before the expiry
 * timestamp succeeds; one arriving after it fails with the expiry stated.
 */
export function acceptanceAllowed(offerExpiresAt: string | null, serverNow: Date): boolean {
  if (!offerExpiresAt) return true
  return serverNow.getTime() <= new Date(offerExpiresAt).getTime()
}

/**
 * EC-13 — the SLA elapsed while the seller was composing. A response is still accepted
 * within a 15-minute grace period measured from the seller's last edit.
 */
export function withinComposeGrace(
  slaDueAt: string | null, lastEditAt: string | null, serverNow: Date,
): boolean {
  if (!slaDueAt) return true
  const now = serverNow.getTime()
  if (now <= new Date(slaDueAt).getTime()) return true
  if (!lastEditAt) return false
  return now - new Date(lastEditAt).getTime() <= COMPOSE_GRACE_MINUTES * 60_000
}

export interface ExpiryCandidate {
  ref: string
  state: RequestState
  /** The clock that governs this state: SLA, offer validity, or the buyer response window. */
  dueAt: string | null
}

/**
 * FR-3.5 — the sweep. Idempotent and safe to re-run: it selects on state and scheduled
 * time only, so re-running it produces the same set.
 *
 * EC-14 — after an outage the backlog is processed against each request's *scheduled*
 * expiry time, not the execution time, so no party gains or loses hours from the outage.
 */
export function dueForExpiry(candidates: ExpiryCandidate[], serverNow: Date): ExpiryCandidate[] {
  return candidates.filter((c) => {
    if (isTerminal(c.state) || c.state === 'draft') return false
    if (!c.dueAt) return false
    return new Date(c.dueAt).getTime() <= serverNow.getTime()
  })
}

/**
 * FR-3.6 — business-hours awareness. Counts only hours inside the seller's working week,
 * so a 24-hour SLA starting Thursday afternoon does not silently expire over the weekend.
 * EC-17: callers pass the configuration that was in force when the clock started, not the
 * seller's current configuration.
 */
export interface BusinessHours {
  /** 0 = Sunday … 6 = Saturday. The Bahrain default working week is Sunday–Thursday. */
  workingDays: number[]
  startHour: number
  endHour: number
  /** ISO dates (YYYY-MM-DD) treated as non-working. */
  holidays: string[]
}

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  workingDays: [0, 1, 2, 3, 4],
  startHour: 8,
  endHour: 17,
  holidays: [],
}

function isWorkingDay(d: Date, cfg: BusinessHours): boolean {
  if (!cfg.workingDays.includes(d.getUTCDay())) return false
  return !cfg.holidays.includes(d.toISOString().slice(0, 10))
}

/** Add N business hours to a start time, stepping over closed hours, weekends and holidays. */
export function addBusinessHours(from: Date, hours: number, cfg = DEFAULT_BUSINESS_HOURS): Date {
  let remaining = hours
  const cursor = new Date(from.getTime())
  let guard = 0
  while (remaining > 0 && guard < 10_000) {
    guard += 1
    if (!isWorkingDay(cursor, cfg)) {
      cursor.setUTCDate(cursor.getUTCDate() + 1)
      cursor.setUTCHours(cfg.startHour, 0, 0, 0)
      continue
    }
    const hour = cursor.getUTCHours() + cursor.getUTCMinutes() / 60
    if (hour < cfg.startHour) {
      cursor.setUTCHours(cfg.startHour, 0, 0, 0)
      continue
    }
    if (hour >= cfg.endHour) {
      cursor.setUTCDate(cursor.getUTCDate() + 1)
      cursor.setUTCHours(cfg.startHour, 0, 0, 0)
      continue
    }
    const availableToday = cfg.endHour - hour
    if (availableToday >= remaining) return new Date(cursor.getTime() + remaining * HOUR_MS)
    remaining -= availableToday
    cursor.setUTCHours(cfg.endHour, 0, 0, 0)
  }
  return cursor
}
