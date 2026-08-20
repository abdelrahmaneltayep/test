/**
 * Money — PRD §4.1 FR-1.8 and §6.1 A5.
 *
 * All monetary values are integer minor units. BHD has a scale of 3, so 1 BHD = 1000 fils
 * and every price in this module is a whole number of fils. Floating-point arithmetic on
 * money is prohibited anywhere in the stack; percentages exist for display only.
 */

import type { Minor } from './types'

/** BHD — 3 decimal places (AC-9.7). */
export const CURRENCY = 'BHD'
export const SCALE = 3
const FACTOR = 1000

/**
 * Parse a typed decimal string into minor units without ever touching a float.
 * Returns null for anything that is not a well-formed non-negative amount.
 */
export function parseMoney(input: string): Minor | null {
  const raw = input.trim()
  if (!/^\d+(\.\d{1,3})?$/.test(raw)) return null
  const [whole, frac = ''] = raw.split('.')
  const padded = (frac + '000').slice(0, SCALE)
  return Number(whole) * FACTOR + Number(padded)
}

/** Render minor units at the currency's full precision — no intermediate rounding (AC-9.7). */
export function formatMoney(minor: Minor, opts: { withCurrency?: boolean; lang?: 'en' | 'ar' } = {}): string {
  const negative = minor < 0
  const abs = Math.abs(minor)
  const whole = Math.floor(abs / FACTOR)
  const frac = String(abs % FACTOR).padStart(SCALE, '0')
  const amount = `${negative ? '-' : ''}${whole.toLocaleString('en-US')}.${frac}`
  if (!opts.withCurrency) return amount
  return opts.lang === 'ar' ? `${amount} د.ب` : `${amount} ${CURRENCY}`
}

/**
 * EC-23 — compute at line level in minor units, then sum. Never compute a request-level
 * percentage and redistribute it: displayed totals must equal the sum of displayed lines.
 */
export function lineTotal(unitPrice: Minor, quantity: number): Minor {
  return unitPrice * quantity
}

export function sumMinor(values: Minor[]): Minor {
  return values.reduce((acc, v) => acc + v, 0)
}

/**
 * Apply a percentage off a list price, resolving to whole minor units with half-up rounding.
 * Used only for the seller's "% off list" counter input (FR-6.2).
 */
export function applyPercentOff(listPrice: Minor, percent: number): Minor {
  const reduced = Math.round((listPrice * (100 - percent)) / 100)
  return reduced
}

/**
 * Discount as a percentage, for display only (A5). Returns a number with one decimal place.
 * Guarded against a zero base so a missing list price can never produce Infinity or NaN.
 */
export function percentOff(listPrice: Minor, agreedPrice: Minor): number {
  if (listPrice <= 0) return 0
  return Math.round(((listPrice - agreedPrice) / listPrice) * 1000) / 10
}

/** EC-24 — a counter may never resolve to a zero or negative price. */
export function isValidPrice(price: Minor): boolean {
  return Number.isInteger(price) && price > 0
}
