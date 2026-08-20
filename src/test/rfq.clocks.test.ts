/**
 * §6.8 item 4 — clock behaviour: EC-13, EC-14, EC-16, EC-18, FR-3.5 and FR-3.6.
 */
import { describe, it, expect } from 'vitest'
import {
  addHours, addDays, remainingMs, isEscalated, formatCountdown,
  acceptanceAllowed, withinComposeGrace, dueForExpiry, addBusinessHours,
  DEFAULT_BUSINESS_HOURS, type ExpiryCandidate,
} from '@/rfq/domain/clocks'
import { guardrailValue, withinBounds, GUARDRAILS } from '@/rfq/domain/guardrails'

const NOW = new Date('2026-08-20T09:00:00Z')

describe('FR-4.6 / AC-9.5 — one computation, so both sides agree to the minute', () => {
  it('derives the same countdown string for buyer and seller from one reference time', () => {
    const dueAt = addHours(NOW, 5).toISOString()
    const buyerSide = formatCountdown(remainingMs(dueAt, NOW), 'en')
    const sellerSide = formatCountdown(remainingMs(dueAt, NOW), 'en')
    expect(buyerSide).toBe(sellerSide)
    expect(buyerSide).toBe('5h 0m')
  })

  it('formats in Arabic too (AC-21.1)', () => {
    expect(formatCountdown(remainingMs(addDays(NOW, 2).toISOString(), NOW), 'ar')).toBe('2 يوم 0 ساعة')
  })

  it('says "elapsed" rather than showing a negative countdown', () => {
    expect(formatCountdown(-1000, 'en')).toBe('Elapsed')
    expect(formatCountdown(null, 'en')).toBe('—')
  })
})

describe('AC-14.5 — SLA escalation under four hours', () => {
  it('escalates a row inside the window and not outside it', () => {
    expect(isEscalated(addHours(NOW, 3).toISOString(), NOW)).toBe(true)
    expect(isEscalated(addHours(NOW, 5).toISOString(), NOW)).toBe(false)
  })

  it('does not escalate an already-elapsed clock — that is expiry, not escalation', () => {
    expect(isEscalated(addHours(NOW, -1).toISOString(), NOW)).toBe(false)
  })
})

describe('EC-16 — accepting at the exact moment of expiry', () => {
  const expiresAt = '2026-08-25T08:00:00Z'

  it('succeeds at or before the expiry timestamp, by server time', () => {
    expect(acceptanceAllowed(expiresAt, new Date('2026-08-25T07:59:59Z'))).toBe(true)
    expect(acceptanceAllowed(expiresAt, new Date('2026-08-25T08:00:00Z'))).toBe(true)
  })

  it('fails one millisecond after it', () => {
    expect(acceptanceAllowed(expiresAt, new Date('2026-08-25T08:00:00.001Z'))).toBe(false)
  })
})

describe('EC-13 — the SLA elapses while the seller is composing', () => {
  const slaDueAt = '2026-08-20T09:00:00Z'

  it('accepts a response sent inside the 15-minute grace from the last edit', () => {
    expect(withinComposeGrace(slaDueAt, '2026-08-20T09:05:00Z', new Date('2026-08-20T09:10:00Z'))).toBe(true)
  })

  it('rejects one sent after the grace has run out', () => {
    expect(withinComposeGrace(slaDueAt, '2026-08-20T09:00:00Z', new Date('2026-08-20T09:20:00Z'))).toBe(false)
  })

  it('rejects a response with no edit activity behind it', () => {
    expect(withinComposeGrace(slaDueAt, null, new Date('2026-08-20T09:01:00Z'))).toBe(false)
  })
})

describe('FR-3.5 / EC-14 — the expiry sweep', () => {
  const candidates: ExpiryCandidate[] = [
    { ref: 'A', state: 'submitted', dueAt: '2026-08-20T06:00:00Z' },
    { ref: 'B', state: 'countered_by_seller', dueAt: '2026-08-22T06:00:00Z' },
    { ref: 'C', state: 'accepted', dueAt: '2026-08-01T06:00:00Z' },
    { ref: 'D', state: 'draft', dueAt: '2026-08-01T06:00:00Z' },
    { ref: 'E', state: 'info_requested', dueAt: null },
  ]

  it('selects only live requests whose scheduled time has passed', () => {
    expect(dueForExpiry(candidates, NOW).map((c) => c.ref)).toEqual(['A'])
  })

  it('never expires a terminal request or an unsent draft', () => {
    const refs = dueForExpiry(candidates, new Date('2027-01-01T00:00:00Z')).map((c) => c.ref)
    expect(refs).not.toContain('C')
    expect(refs).not.toContain('D')
  })

  it('is idempotent — re-running over the same input selects the same set', () => {
    expect(dueForExpiry(candidates, NOW)).toEqual(dueForExpiry(candidates, NOW))
  })

  it('EC-14 — after an outage it uses the scheduled time, so nobody gains hours', () => {
    // The job was down for two days. A and B were both scheduled to expire in that window;
    // both are picked up, judged by their own scheduled timestamps, not by "now".
    const afterOutage = new Date('2026-08-23T09:00:00Z')
    expect(dueForExpiry(candidates, afterOutage).map((c) => c.ref)).toEqual(['A', 'B'])
  })
})

describe('FR-3.6 — business-hours SLA', () => {
  it('does not burn the clock outside working hours', () => {
    // Sunday 16:00 + 4 business hours (08:00–17:00) → Monday 11:00, not Sunday 20:00.
    const start = new Date('2026-08-23T16:00:00Z') // a Sunday
    const due = addBusinessHours(start, 4, DEFAULT_BUSINESS_HOURS)
    expect(due.toISOString()).toBe('2026-08-24T11:00:00.000Z')
  })

  it('steps over the weekend', () => {
    // Thursday 16:00 + 2 business hours → Sunday 09:00 (Fri/Sat are non-working).
    const start = new Date('2026-08-20T16:00:00Z') // a Thursday
    const due = addBusinessHours(start, 2, DEFAULT_BUSINESS_HOURS)
    expect(due.getUTCDay()).toBe(0)
    expect(due.toISOString()).toBe('2026-08-23T09:00:00.000Z')
  })

  it('steps over a configured public holiday (D12)', () => {
    const cfg = { ...DEFAULT_BUSINESS_HOURS, holidays: ['2026-08-24'] }
    const start = new Date('2026-08-23T16:00:00Z')
    expect(addBusinessHours(start, 4, cfg).toISOString()).toBe('2026-08-25T11:00:00.000Z')
  })
})

describe('FR-3.4 — guardrail defaults and bounds', () => {
  it('ships the documented defaults', () => {
    expect(GUARDRAILS.sellerResponseSlaHours.default).toBe(24)
    expect(GUARDRAILS.offerValidityDays.default).toBe(7)
    expect(GUARDRAILS.maxRounds.default).toBe(5)
    expect(GUARDRAILS.buyerResponseWindowHours.default).toBe(72)
    expect(GUARDRAILS.proofFreshnessDays.default).toBe(30)
    expect(GUARDRAILS.maxInfoRequests.default).toBe(2)
    expect(GUARDRAILS.autoAcceptPercent.default).toBe(0) // off by default
  })

  it('accepts a tenant value inside bounds and rejects one outside', () => {
    expect(withinBounds('sellerResponseSlaHours', 4)).toBe(true)
    expect(withinBounds('sellerResponseSlaHours', 72)).toBe(true)
    expect(withinBounds('sellerResponseSlaHours', 3)).toBe(false)
    expect(withinBounds('sellerResponseSlaHours', 96)).toBe(false)
  })

  it('falls back to the default rather than honouring an out-of-bounds value', () => {
    expect(guardrailValue('maxRounds', 7)).toBe(7)
    expect(guardrailValue('maxRounds', 99)).toBe(5)
    expect(guardrailValue('maxRounds')).toBe(5)
  })
})
