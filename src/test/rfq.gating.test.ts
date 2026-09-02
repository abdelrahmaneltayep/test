/**
 * FR-2.6 — the two request gates.
 *
 * Both limits shipped configured and unread: nothing counted a buyer's open requests, and
 * nothing held a SKU back after one closed. These pin the arithmetic, including the two
 * boundaries where an off-by-one would either lock a buyer out a request early or let one
 * ask again on the last day of a cooldown.
 */
import { describe, it, expect } from 'vitest'
import { GATING, requestGate } from '@/rfq/domain/guardrails'

const NOW = new Date('2026-08-20T09:00:00Z')
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000)

describe('the open-request cap', () => {
  it('lets a buyer through one below the limit', () => {
    expect(requestGate({
      openRequestCount: GATING.maxOpenRequestsPerBuyer - 1, lastTerminalAt: null, now: NOW,
    })).toBeNull()
  })

  it('closes the gate at the limit, and names both numbers', () => {
    const gate = requestGate({
      openRequestCount: GATING.maxOpenRequestsPerBuyer, lastTerminalAt: null, now: NOW,
    })
    expect(gate).toEqual({
      kind: 'too_many_open',
      open: GATING.maxOpenRequestsPerBuyer,
      max: GATING.maxOpenRequestsPerBuyer,
    })
  })
})

describe('the cooldown after a terminal outcome', () => {
  it('holds the SKU while the window is still running', () => {
    const gate = requestGate({ openRequestCount: 0, lastTerminalAt: daysAgo(1), now: NOW })
    expect(gate).toEqual({ kind: 'cooldown', daysLeft: GATING.cooldownDaysAfterTerminal - 1 })
  })

  // Rounded up, so a buyer with half a day left is told "1 day" and never "0 days" —
  // a countdown that reaches zero while the control stays shut is the worse error.
  it('rounds a part-day up rather than down', () => {
    const gate = requestGate({
      openRequestCount: 0,
      lastTerminalAt: new Date(NOW.getTime() - (GATING.cooldownDaysAfterTerminal - 0.5) * 86_400_000),
      now: NOW,
    })
    expect(gate).toEqual({ kind: 'cooldown', daysLeft: 1 })
  })

  it('opens again once the window has run out', () => {
    expect(requestGate({
      openRequestCount: 0, lastTerminalAt: daysAgo(GATING.cooldownDaysAfterTerminal), now: NOW,
    })).toBeNull()
  })

  it('ignores a SKU that has never been decided', () => {
    expect(requestGate({ openRequestCount: 0, lastTerminalAt: null, now: NOW })).toBeNull()
  })
})

// The cap is about the buyer and the cooldown about one SKU, so the cap answers first:
// telling someone to wait 13 days for this item, when every item is shut, is the wrong
// half of the truth.
describe('when both gates would fire', () => {
  it('reports the cap, which is the one that closes every card', () => {
    const gate = requestGate({
      openRequestCount: GATING.maxOpenRequestsPerBuyer, lastTerminalAt: daysAgo(1), now: NOW,
    })
    expect(gate?.kind).toBe('too_many_open')
  })
})
