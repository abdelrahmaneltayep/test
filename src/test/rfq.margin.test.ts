/**
 * FR-5.3 … FR-5.7 margin, including EC-20: a missing cost renders "—", never 0 %.
 */
import { describe, it, expect } from 'vitest'
import { marginAfterAsk, lineMargin, bandFor, DEFAULT_MARGIN_THRESHOLDS } from '@/rfq/domain/margin'
import type { RequestLine } from '@/rfq/domain/types'

function line(overrides: Partial<RequestLine> = {}): RequestLine {
  return {
    id: 'l1', sku: 'SKU-1', productName: { en: 'P', ar: 'ص' },
    route: 'case_1', quantity: 10,
    listPriceSnapshot: 10000, askedPrice: 9000, offeredPrice: null,
    outcome: 'pending', proof: null, frequency: null, note: null,
    costSnapshot: 7000, floorSnapshot: null,
    ...overrides,
  }
}

describe('FR-5.3 — margin after the ask', () => {
  it('computes (asked − cost) ÷ asked over the priced lines', () => {
    // (90,000 − 70,000) ÷ 90,000 = 22.2%
    const result = marginAfterAsk([line()])
    expect(result.pct).toBe(22.2)
    expect(result.band).toBe('healthy')
    expect(result.askedTotal).toBe(90_000)
    expect(result.listTotal).toBe(100_000)
  })

  it('AC-14.3 — excludes quote-only lines from the numerator and counts them separately', () => {
    const result = marginAfterAsk([line(), line({ id: 'l2', route: 'case_2', askedPrice: null })])
    expect(result.quoteOnlyLines).toBe(1)
    expect(result.askedTotal).toBe(90_000)
    // The Case 2 line still contributes its list value to the list total (AC-7.2).
    expect(result.listTotal).toBe(200_000)
  })
})

describe('EC-20 / FR-5.7 — cost data missing', () => {
  it('returns null with a stated reason, never 0 %', () => {
    const result = marginAfterAsk([line({ costSnapshot: null })])
    expect(result.pct).toBeNull()
    expect(result.pct).not.toBe(0)
    expect(result.reason).toBe('cost_missing')
    expect(result.band).toBe('unknown')
  })

  it('treats one missing cost in a multi-line request as unknowable, not partial', () => {
    const result = marginAfterAsk([line(), line({ id: 'l2', costSnapshot: null })])
    expect(result.pct).toBeNull()
    expect(result.reason).toBe('cost_missing')
  })

  it('reports an RFQ-only request as having no priced lines, distinct from missing cost', () => {
    const result = marginAfterAsk([line({ route: 'case_2', askedPrice: null })])
    expect(result.pct).toBeNull()
    expect(result.reason).toBe('no_priced_lines')
  })
})

describe('FR-5.4 — bands are configurable, not hard-coded', () => {
  it('maps a percentage onto the shipped default bands', () => {
    expect(bandFor(30)).toBe('healthy')
    expect(bandFor(20)).toBe('healthy')
    expect(bandFor(15)).toBe('thin')
    expect(bandFor(9)).toBe('below_floor')
  })

  it('honours tenant thresholds over the defaults', () => {
    expect(bandFor(15, { healthyPct: 12, thinPct: 5 })).toBe('healthy')
    expect(bandFor(15, DEFAULT_MARGIN_THRESHOLDS)).toBe('thin')
  })

  it('marks a request below its floor regardless of the resulting percentage', () => {
    const result = marginAfterAsk([line({ askedPrice: 9500, floorSnapshot: 9600 })])
    expect(result.band).toBe('below_floor')
    expect(result.pct).toBeGreaterThan(DEFAULT_MARGIN_THRESHOLDS.healthyPct)
  })
})

describe('FR-6.7 — live line margin for the counter input', () => {
  it('recomputes from a price and a cost snapshot', () => {
    expect(lineMargin(10000, 7000)).toBe(30)
    expect(lineMargin(8000, 7000)).toBe(12.5)
  })

  it('returns null rather than a number where cost is unknown', () => {
    expect(lineMargin(10000, null)).toBeNull()
  })
})

describe('AC-9.2 — an all-quote request has no asked total', () => {
  it('reports null rather than zero, so the queue renders "—"', () => {
    const result = marginAfterAsk([
      line({ id: 'q1', route: 'case_2', askedPrice: null }),
      line({ id: 'q2', route: 'case_2', askedPrice: null }),
    ])
    expect(result.askedTotal).toBeNull()
    expect(result.reason).toBe('no_priced_lines')
    expect(result.quoteOnlyLines).toBe(2)
    // The list total is still real: those lines have a published price.
    expect(result.listTotal).toBeGreaterThan(0)
  })
})
