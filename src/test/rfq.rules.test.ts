/**
 * US-19 auto-rules, with the two constraints that carry the margin risk:
 * EC-22 (floor always wins) and AC-19.4 (a failed proof check blocks auto-accept).
 */
import { describe, it, expect } from 'vitest'
import { evaluateAutoRules, AUTO_DECLINE_MESSAGE } from '@/rfq/domain/rules'
import type { RequestLine } from '@/rfq/domain/types'

function line(overrides: Partial<RequestLine> = {}): RequestLine {
  return {
    id: 'l1',
    sku: 'SKU-1',
    productName: { en: 'Product', ar: 'صنف' },
    route: 'case_1',
    quantity: 100,
    listPriceSnapshot: 10000,
    askedPrice: 9800,
    offeredPrice: null,
    outcome: 'pending',
    proofs: [],
    frequency: null, specialCredit: false,
    note: null,
    costSnapshot: 7000,
    floorSnapshot: 9000,
    ...overrides,
  }
}

describe('AC-19.1 / FR-3.4f — floor price auto-decline', () => {
  it('auto-declines an ask below floor so it never enters the queue', () => {
    const out = evaluateAutoRules({
      lines: [line({ route: 'case_2', askedPrice: 8500 })], hasFailedProofCheck: false,
    })
    expect(out.decision).toBe('auto_decline')
    expect(out.rule).toBe('FR-3.4f:floor_price')
  })

  /*
   * Price matching. The same ask, proved, is not refused by a machine that AC-19.5 then
   * forbids from explaining itself — it goes to a person with the position in view. The
   * floor has not stopped mattering; it has stopped deciding.
   */
  it('queues the same ask on the match route instead of declining it', () => {
    const out = evaluateAutoRules({
      lines: [line({ route: 'case_1', askedPrice: 8500 })], hasFailedProofCheck: false,
    })
    expect(out.decision).toBe('queue')
    expect(out.rule).toBeNull()
    expect(out.internalReason).toMatch(/below floor · match route/)
  })

  it('queues an ask exactly at floor — at floor is not below floor', () => {
    const out = evaluateAutoRules({ lines: [line({ askedPrice: 9000 })], hasFailedProofCheck: false })
    expect(out.decision).toBe('queue')
  })

  it('leaves the queue alone where no floor is configured (FR-3.4f defaults unset)', () => {
    const out = evaluateAutoRules({ lines: [line({ floorSnapshot: null, askedPrice: 1 })], hasFailedProofCheck: false })
    expect(out.decision).toBe('queue')
  })
})

describe('EC-22 — auto-accept and floor rules both match', () => {
  it('lets the floor win: a request is never auto-accepted below floor', () => {
    // The ask is within a generous 10% auto-accept threshold *and* below the floor.
    const out = evaluateAutoRules({
      lines: [line({ route: 'case_2', listPriceSnapshot: 10000, askedPrice: 9500, floorSnapshot: 9600 })],
      hasFailedProofCheck: false,
      config: { autoAcceptPercent: 10 },
    })
    expect(out.decision).toBe('auto_decline')
    expect(out.rule).toBe('FR-3.4f:floor_price')
  })

  // EC-22 in the only form the guarantee leaves it: the floor cannot decline a proved ask,
  // but it still outranks auto-accept, so the machine never sells below floor on its own.
  it('holds on the match route too — queued, never auto-accepted', () => {
    const out = evaluateAutoRules({
      lines: [line({ route: 'case_1', listPriceSnapshot: 10000, askedPrice: 9500, floorSnapshot: 9600 })],
      hasFailedProofCheck: false,
      config: { autoAcceptPercent: 10 },
    })
    expect(out.decision).toBe('queue')
  })
})

describe('FR-3.4g — auto-accept threshold', () => {
  it('is off by default, so a small ask still reaches a human', () => {
    const out = evaluateAutoRules({ lines: [line({ askedPrice: 9900 })], hasFailedProofCheck: false })
    expect(out.decision).toBe('queue')
  })

  it('auto-accepts when every priced line sits inside the threshold', () => {
    const out = evaluateAutoRules({
      lines: [line({ askedPrice: 9800 }), line({ id: 'l2', askedPrice: 9750 })],
      hasFailedProofCheck: false,
      config: { autoAcceptPercent: 3 },
    })
    expect(out.decision).toBe('auto_accept')
    expect(out.rule).toBe('FR-3.4g:auto_accept_threshold')
  })

  it('queues the whole request when any single line falls outside the threshold', () => {
    const out = evaluateAutoRules({
      lines: [line({ askedPrice: 9800 }), line({ id: 'l2', askedPrice: 9200 })],
      hasFailedProofCheck: false,
      config: { autoAcceptPercent: 3 },
    })
    expect(out.decision).toBe('queue')
  })

  it('ignores a configured value outside the published bounds and falls back to the default', () => {
    const out = evaluateAutoRules({
      lines: [line({ floorSnapshot: null, askedPrice: 5000 })],
      hasFailedProofCheck: false,
      config: { autoAcceptPercent: 90 }, // outside FR-3.4g's 0–10% bounds
    })
    expect(out.decision).toBe('queue')
  })
})

describe('AC-19.4 — a failed proof check blocks auto-accept', () => {
  it('queues a request that would otherwise auto-accept', () => {
    const out = evaluateAutoRules({
      lines: [line({ askedPrice: 9800 })],
      hasFailedProofCheck: true,
      config: { autoAcceptPercent: 3 },
    })
    expect(out.decision).toBe('queue')
    expect(out.internalReason).toBe('failed_proof_check')
  })

  it('does not stop the floor rule — a failed check is not a reason to sell below floor', () => {
    const out = evaluateAutoRules({
      lines: [line({ route: 'case_2', askedPrice: 100 })],
      hasFailedProofCheck: true,
      config: { autoAcceptPercent: 3 },
    })
    expect(out.decision).toBe('auto_decline')
  })
})

describe('EC-21 — floor configured above list price', () => {
  it('suppresses the rule and raises an operations alert instead of auto-declining', () => {
    const out = evaluateAutoRules({
      lines: [line({ listPriceSnapshot: 10000, floorSnapshot: 12000, askedPrice: 9500 })],
      hasFailedProofCheck: false,
    })
    expect(out.decision).toBe('queue')
    expect(out.opsAlert).toContain('SKU-1')
  })
})

describe('AC-19.5 / E-3 — auto-decline messaging discloses nothing', () => {
  it('names no floor, cost, margin or rule value, in either language', () => {
    for (const lang of ['en', 'ar'] as const) {
      const message = AUTO_DECLINE_MESSAGE[lang]
      expect(message).not.toMatch(/floor|cost|margin|%|الحد الأدنى|التكلفة|الهامش/i)
      expect(message.length).toBeGreaterThan(0)
    }
  })

  it('offers the alternative path (E-5, AC-22.1)', () => {
    expect(AUTO_DECLINE_MESSAGE.en).toMatch(/list price/i)
  })
})

describe('Case 2 requests carry no asked price', () => {
  it('queues an RFQ-only request rather than letting a rule resolve it', () => {
    const out = evaluateAutoRules({
      lines: [line({ route: 'case_2', askedPrice: null })],
      hasFailedProofCheck: false,
      config: { autoAcceptPercent: 3 },
    })
    expect(out.decision).toBe('queue')
    expect(out.internalReason).toBe('no_priced_lines')
  })
})
