/**
 * §6.8 item 2 — money arithmetic. FR-1.8 / A5: integer minor units end to end, and
 * EC-23: displayed totals equal the sum of displayed lines exactly.
 */
import { describe, it, expect } from 'vitest'
import {
  parseMoney, formatMoney, lineTotal, sumMinor, applyPercentOff, percentOff, isValidPrice, SCALE,
} from '@/rfq/domain/money'

describe('FR-1.8 — BHD is 3 decimal places, stored as integer fils', () => {
  it('parses a decimal string into minor units', () => {
    expect(parseMoney('1.250')).toBe(1250)
    expect(parseMoney('0.001')).toBe(1)
    expect(parseMoney('12')).toBe(12000)
    expect(parseMoney('12.3')).toBe(12300)
    expect(parseMoney('12.34')).toBe(12340)
  })

  it('rejects anything that is not a well-formed amount', () => {
    for (const bad of ['', '-1', 'abc', '1.2345', '1,250', ' ', '1.']) {
      expect(parseMoney(bad)).toBeNull()
    }
  })

  it('round-trips through format without drift', () => {
    for (const raw of ['0.001', '1.250', '99.999', '1250.000']) {
      expect(formatMoney(parseMoney(raw) as number)).toBe(
        Number(raw).toLocaleString('en-US', { minimumFractionDigits: SCALE, maximumFractionDigits: SCALE }),
      )
    }
  })

  it('renders the currency in both languages (AC-21.3)', () => {
    expect(formatMoney(1250, { withCurrency: true, lang: 'en' })).toBe('1.250 BHD')
    expect(formatMoney(1250, { withCurrency: true, lang: 'ar' })).toBe('1.250 د.ب')
  })

  it('never produces a floating-point artefact on a classic case', () => {
    // 0.1 + 0.2 in floats is 0.30000000000000004; in minor units it is exactly 300.
    expect(sumMinor([parseMoney('0.100') as number, parseMoney('0.200') as number])).toBe(300)
    expect(formatMoney(300)).toBe('0.300')
  })
})

describe('EC-23 — rounding at line versus request level', () => {
  const lines = [
    { unit: parseMoney('1.333') as number, qty: 7 },
    { unit: parseMoney('0.667') as number, qty: 13 },
    { unit: parseMoney('12.005') as number, qty: 3 },
  ]

  it('computes at line level in minor units, then sums', () => {
    const totals = lines.map((l) => lineTotal(l.unit, l.qty))
    expect(totals).toEqual([9331, 8671, 36015])
    expect(sumMinor(totals)).toBe(54017)
  })

  it('makes the displayed total equal the sum of the displayed lines exactly', () => {
    const displayedLines = lines.map((l) => formatMoney(lineTotal(l.unit, l.qty)))
    const displayedTotal = formatMoney(sumMinor(lines.map((l) => lineTotal(l.unit, l.qty))))
    const recomputed = formatMoney(
      sumMinor(displayedLines.map((d) => parseMoney(d.replace(/,/g, '')) as number)),
    )
    expect(recomputed).toBe(displayedTotal)
  })

  it('never redistributes a request-level percentage across lines', () => {
    // Two lines at 1.005 with 10% off. Rounding per line gives 0.905 each — 1.810 in
    // total. Taking 10% off the 2.010 request total instead gives 1.809. The two
    // genuinely disagree, which is why EC-23 fixes line level as the authoritative
    // computation and forbids the request-level shortcut.
    const halfFils = [{ unit: 1005, qty: 1 }, { unit: 1005, qty: 1 }]
    const perLine = sumMinor(halfFils.map((l) => lineTotal(applyPercentOff(l.unit, 10), l.qty)))
    const listTotal = sumMinor(halfFils.map((l) => lineTotal(l.unit, l.qty)))
    const requestLevel = Math.round((listTotal * 90) / 100)

    expect(perLine).toBe(1810)
    expect(requestLevel).toBe(1809)
    expect(perLine).not.toBe(requestLevel)
  })
})

describe('FR-6.2 — percentage entry resolves to whole minor units', () => {
  it('applies a percentage off list', () => {
    expect(applyPercentOff(10000, 10)).toBe(9000)
    expect(applyPercentOff(1333, 7.5)).toBe(1233)
  })

  it('reports discount as a display percentage only', () => {
    expect(percentOff(10000, 9000)).toBe(10)
    expect(percentOff(1250, 1000)).toBe(20)
    expect(percentOff(0, 0)).toBe(0)
  })
})

describe('EC-24 — a price may never resolve to zero or negative', () => {
  it('rejects zero, negative and non-integer prices', () => {
    expect(isValidPrice(0)).toBe(false)
    expect(isValidPrice(-1)).toBe(false)
    expect(isValidPrice(1.5)).toBe(false)
    expect(isValidPrice(1)).toBe(true)
  })
})
