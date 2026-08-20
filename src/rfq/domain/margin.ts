/**
 * Margin — PRD §4.5 FR-5.3 … FR-5.7.
 *
 * Seller-only, in every sense: nothing in this module may ever be serialised into a
 * buyer-facing payload (FR-4.8 / A7). See serialize.ts for the boundary itself.
 */

import { lineTotal, sumMinor } from './money'
import type { Minor, RequestLine } from './types'

/** FR-5.4 — bands are tenant-configured, not hard-coded. These are the shipped defaults. */
export interface MarginThresholds {
  /** At or above this, the row is healthy. */
  healthyPct: number
  /** Below healthy and at or above this, the row is thin. */
  thinPct: number
}

export const DEFAULT_MARGIN_THRESHOLDS: MarginThresholds = { healthyPct: 20, thinPct: 10 }

export type MarginBand = 'healthy' | 'thin' | 'below_floor' | 'unknown'

export interface MarginResult {
  /** Null where cost is not configured — renders "—", never 0 % (FR-5.7, EC-20). */
  pct: number | null
  band: MarginBand
  /** AC-14.6 — the stated reason behind a "—". */
  reason: 'cost_missing' | 'no_priced_lines' | null
  /** AC-14.3 — how many lines carry no asked price, so the row can say so. */
  quoteOnlyLines: number
  askedTotal: Minor
  listTotal: Minor
}

/**
 * FR-5.3 — margin after the ask = (asked total − cost total) ÷ asked total, computed over
 * the lines that carry an asked price. Case 2 lines are excluded from the numerator and
 * counted separately so the row can state how many are quote-only (AC-14.3).
 */
export function marginAfterAsk(
  lines: RequestLine[],
  thresholds: MarginThresholds = DEFAULT_MARGIN_THRESHOLDS,
): MarginResult {
  const priced = lines.filter((l) => l.askedPrice !== null)
  const quoteOnlyLines = lines.length - priced.length
  const listTotal = sumMinor(lines.map((l) => lineTotal(l.listPriceSnapshot, l.quantity)))
  const askedTotal = sumMinor(priced.map((l) => lineTotal(l.askedPrice as Minor, l.quantity)))

  if (priced.length === 0) {
    return { pct: null, band: 'unknown', reason: 'no_priced_lines', quoteOnlyLines, askedTotal, listTotal }
  }
  // EC-20 — a single missing cost makes the whole row's margin unknowable. Never guess.
  if (priced.some((l) => l.costSnapshot === null)) {
    return { pct: null, band: 'unknown', reason: 'cost_missing', quoteOnlyLines, askedTotal, listTotal }
  }

  const costTotal = sumMinor(priced.map((l) => lineTotal(l.costSnapshot as Minor, l.quantity)))
  if (askedTotal <= 0) {
    return { pct: null, band: 'unknown', reason: 'no_priced_lines', quoteOnlyLines, askedTotal, listTotal }
  }

  const pct = Math.round(((askedTotal - costTotal) / askedTotal) * 1000) / 10
  const belowFloor = priced.some(
    (l) => l.floorSnapshot !== null && (l.askedPrice as Minor) < l.floorSnapshot,
  )
  return {
    pct,
    band: belowFloor ? 'below_floor' : bandFor(pct, thresholds),
    reason: null,
    quoteOnlyLines,
    askedTotal,
    listTotal,
  }
}

/** Margin on a single line at a given price — used by the live counter recalculation (FR-6.7). */
export function lineMargin(unitPrice: Minor, cost: Minor | null): number | null {
  if (cost === null || unitPrice <= 0) return null
  return Math.round(((unitPrice - cost) / unitPrice) * 1000) / 10
}

export function bandFor(pct: number, thresholds: MarginThresholds = DEFAULT_MARGIN_THRESHOLDS): MarginBand {
  if (pct >= thresholds.healthyPct) return 'healthy'
  if (pct >= thresholds.thinPct) return 'thin'
  return 'below_floor'
}
