/**
 * Proof, extraction and auto-checks — PRD §4.7 FR-7 [P2].
 *
 * The checks are advisory and never automatically decisive (FR-7.4): a failure flags the
 * request and blocks auto-accept, but a human still decides.
 */

import { guardrailValue } from './guardrails'
import type { CheckResult, Minor, Proof, TriStateOutcome } from './types'

/** FR-7.1 — validated by content sniffing, not by extension. */
export const ACCEPTED_MIME_TYPES = [
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic',
] as const
export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const MAX_FILES_PER_LINE = 3
/** EC-29's own limit: a name longer than this is a paste accident, not a file name. */
export const MAX_FILE_NAME_CHARS = 120

/**
 * The leading document on a line, for the screens that show one.
 *
 * Most of the product only ever needs this: the order page names the attachment on record,
 * the seller's verification panel compares one document against the claim. Making that
 * explicit here is better than every reader writing `line.proofs[0] ?? null` and quietly
 * disagreeing about what happens when the list is empty.
 */
export function primaryProof(line: { proofs: Proof[] }): Proof | null {
  return line.proofs[0] ?? null
}

/** FR-7.7 — stated to the buyer before upload, never after rejection (EC-36). */
export const PROOF_EXCLUSIONS = {
  en: [
    'Clearance and closeout prices',
    'Promotional or limited-time offers',
    'Member-only or loyalty pricing',
    'Third-party marketplace sellers',
    'Bundle or multi-buy prices',
  ],
  ar: [
    'أسعار التصفية والتخفيضات النهائية',
    'العروض الترويجية أو محدودة المدة',
    'أسعار الأعضاء أو برامج الولاء',
    'بائعو الأسواق الخارجية',
    'أسعار الباقات أو الشراء المتعدد',
  ],
} as const

export interface IdentityTarget {
  sku: string
  brand: string
  packSize: string
  unitOfMeasure: string
}

export interface CheckContext {
  /** Server reference time; client wall-clock is never trusted (EC-18). */
  now: Date
  target: IdentityTarget
  /** Hashes this same buyer has submitted before (EC-32). */
  buyerHashes: string[]
  /** Hashes any other buyer has submitted, with the date only (EC-33 / FR-13.6). */
  otherBuyerHashes: { hash: string; seenAt: string }[]
  freshnessDays?: number
  tenantCurrency: string
}

/**
 * FR-7.3 — the three auto-checks. Each returns pass / warn / fail with a reason code;
 * EC-27 turns them all into `not_run` rather than inventing a result.
 */
export function runAutoChecks(proof: Proof, ctx: CheckContext): CheckResult[] {
  if (proof.extractionUnavailable) {
    return (['freshness', 'identity', 'duplicate'] as const).map((check) => ({
      check,
      severity: 'not_run' as const,
      reasonCode: 'extraction_unavailable',
    }))
  }
  return [freshnessCheck(proof, ctx), identityCheck(proof, ctx), duplicateCheck(proof, ctx)]
}

/** FR-7.3(a) — document date within the freshness window (FR-3.4e). */
export function freshnessCheck(proof: Proof, ctx: CheckContext): CheckResult {
  const date = proof.typed.documentDate ?? proof.extracted?.documentDate ?? null
  if (!date) return { check: 'freshness', severity: 'fail', reasonCode: 'no_document_date' }
  const days = guardrailValue('proofFreshnessDays', ctx.freshnessDays)
  const ageDays = Math.floor((ctx.now.getTime() - new Date(date).getTime()) / 86_400_000)
  if (Number.isNaN(ageDays)) return { check: 'freshness', severity: 'fail', reasonCode: 'unreadable_date' }
  if (ageDays < 0) return { check: 'freshness', severity: 'warn', reasonCode: 'future_dated' }
  if (ageDays > days) return { check: 'freshness', severity: 'fail', reasonCode: `older_than_${days}_days` }
  return { check: 'freshness', severity: 'pass', reasonCode: `dated_${ageDays}_days_ago` }
}

/**
 * FR-7.3(b) — identity on brand, pack size and unit of measure.
 *
 * EC-34: a genuinely equivalent product in a different pack fails as a *warn*, not a
 * *fail* — the buyer may still submit with an explanation and the seller decides.
 * EC-25: a foreign currency on the document is flagged, never converted.
 */
export function identityCheck(proof: Proof, ctx: CheckContext): CheckResult {
  const currency = proof.typed.currency ?? proof.extracted?.currency ?? null
  if (currency && currency !== ctx.tenantCurrency) {
    return { check: 'identity', severity: 'warn', reasonCode: `currency_mismatch_${currency}` }
  }
  const candidate = (proof.extracted?.sku ?? proof.typed.sku ?? '').trim().toLowerCase()
  if (!candidate) return { check: 'identity', severity: 'warn', reasonCode: 'no_sku_on_document' }
  if (candidate === ctx.target.sku.toLowerCase()) {
    return { check: 'identity', severity: 'pass', reasonCode: 'sku_match' }
  }
  const brandMatches = candidate.includes(ctx.target.brand.toLowerCase())
  const packMatches = candidate.includes(ctx.target.packSize.toLowerCase())
  if (brandMatches && packMatches) {
    return { check: 'identity', severity: 'pass', reasonCode: 'brand_and_pack_match' }
  }
  if (brandMatches) return { check: 'identity', severity: 'warn', reasonCode: 'pack_size_differs' }
  return { check: 'identity', severity: 'fail', reasonCode: 'product_does_not_match' }
}

/**
 * FR-7.3(c) — duplicate by file hash.
 *
 * The same buyer resubmitting the same file fails (EC-32). The same file seen from a
 * different buyer is a neutral warning carrying a date and nothing else — no cross-buyer
 * identity is ever disclosed (EC-33, FR-13.6).
 */
export function duplicateCheck(proof: Proof, ctx: CheckContext): CheckResult {
  if (ctx.buyerHashes.includes(proof.hash)) {
    return { check: 'duplicate', severity: 'fail', reasonCode: 'resubmitted_by_same_buyer' }
  }
  const other = ctx.otherBuyerHashes.find((h) => h.hash === proof.hash)
  if (other) {
    return { check: 'duplicate', severity: 'warn', reasonCode: `seen_before_on_${other.seenAt}` }
  }
  return { check: 'duplicate', severity: 'pass', reasonCode: 'not_seen_before' }
}

export function hasFailedCheck(checks: CheckResult[]): boolean {
  return checks.some((c) => c.severity === 'fail')
}

/**
 * FR-7.8 / Decision 3 — a Case 1 claim resolves matched, beaten or declined. The
 * buyer-facing result must name which of the three occurred; there is no binary approve.
 */
export function triStateOutcome(asked: Minor | null, offered: Minor | null, declined: boolean): TriStateOutcome {
  if (declined || offered === null || asked === null) return 'declined'
  if (offered < asked) return 'beaten'
  if (offered === asked) return 'matched'
  return 'declined'
}

/** FR-7.6 — abuse signals per buyer; crossing a threshold raises an operations flag. */
export interface AbuseSignals {
  submissionsLast24h: number
  failedChecksLast30d: number
  duplicateHashesLast30d: number
  flaggedShare: number
}

export const ABUSE_THRESHOLDS = {
  submissionsLast24h: 20,
  failedChecksLast30d: 5,
  duplicateHashesLast30d: 2,
  flaggedShare: 0.4,
} as const

export function abuseFlagged(signals: AbuseSignals): boolean {
  return (
    signals.submissionsLast24h > ABUSE_THRESHOLDS.submissionsLast24h ||
    signals.failedChecksLast30d > ABUSE_THRESHOLDS.failedChecksLast30d ||
    signals.duplicateHashesLast30d > ABUSE_THRESHOLDS.duplicateHashesLast30d ||
    signals.flaggedShare > ABUSE_THRESHOLDS.flaggedShare
  )
}
