/**
 * FR-7 proof and auto-checks [P2]. The QA-critical cases here are EC-27 (extraction
 * unavailable), EC-33 (no cross-buyer identity disclosure) and EC-31's sibling EC-32.
 */
import { describe, it, expect } from 'vitest'
import {
  runAutoChecks, freshnessCheck, identityCheck, duplicateCheck, hasFailedCheck,
  triStateOutcome, abuseFlagged, PROOF_EXCLUSIONS, ACCEPTED_MIME_TYPES, MAX_FILE_BYTES,
  type CheckContext,
} from '@/rfq/domain/proof'
import type { Proof } from '@/rfq/domain/types'

const NOW = new Date('2026-08-20T09:00:00Z')

function ctx(overrides: Partial<CheckContext> = {}): CheckContext {
  return {
    now: NOW,
    target: { sku: 'HB-4471', brand: 'Almarai', packSize: '12x1L', unitOfMeasure: 'case' },
    buyerHashes: [],
    otherBuyerHashes: [],
    tenantCurrency: 'BHD',
    ...overrides,
  }
}

function proof(overrides: Partial<Proof> = {}): Proof {
  return {
    fileName: 'invoice.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 240_000,
    hash: 'hash-a',
    typed: { supplier: 'Gulf Foods', sku: 'HB-4471', unitPrice: 9200, documentDate: '2026-08-05', currency: 'BHD' },
    extracted: { supplier: 'Gulf Foods', sku: 'HB-4471', unitPrice: 9200, documentDate: '2026-08-05', currency: 'BHD' },
    extractionUnavailable: false,
    checks: [],
    ...overrides,
  }
}

describe('FR-7.3(a) — freshness', () => {
  it('passes a document inside the 30-day window', () => {
    expect(freshnessCheck(proof(), ctx()).severity).toBe('pass')
  })

  it('fails a document older than the window, naming the window', () => {
    const result = freshnessCheck(proof({ typed: { ...proof().typed, documentDate: '2026-05-01' } }), ctx())
    expect(result.severity).toBe('fail')
    expect(result.reasonCode).toBe('older_than_30_days')
  })

  it('fails when the document carries no date at all', () => {
    const p = proof({ typed: { ...proof().typed, documentDate: null }, extracted: null })
    expect(freshnessCheck(p, ctx()).severity).toBe('fail')
  })

  it('honours a tenant-configured window inside FR-3.4e bounds', () => {
    const p = proof({ typed: { ...proof().typed, documentDate: '2026-08-05' } })
    expect(freshnessCheck(p, ctx({ freshnessDays: 7 })).severity).toBe('fail')
    expect(freshnessCheck(p, ctx({ freshnessDays: 90 })).severity).toBe('pass')
  })

  it('warns rather than fails on a future-dated document', () => {
    const p = proof({ typed: { ...proof().typed, documentDate: '2026-09-30' } })
    expect(freshnessCheck(p, ctx()).severity).toBe('warn')
  })
})

describe('FR-7.3(b) — product identity', () => {
  it('passes an exact SKU match', () => {
    expect(identityCheck(proof(), ctx()).severity).toBe('pass')
  })

  it('fails an unrelated product', () => {
    const p = proof({ extracted: { ...proof().typed, sku: 'Nadec 6x2L juice' } })
    expect(identityCheck(p, ctx()).severity).toBe('fail')
  })

  it('EC-34 — warns, never fails, on a same-brand different-pack equivalent', () => {
    const p = proof({ extracted: { ...proof().typed, sku: 'Almarai 6x1L' } })
    const result = identityCheck(p, ctx())
    expect(result.severity).toBe('warn')
    expect(result.reasonCode).toBe('pack_size_differs')
  })

  it('EC-25 — flags a foreign currency and performs no conversion', () => {
    const p = proof({ typed: { ...proof().typed, currency: 'SAR' } })
    const result = identityCheck(p, ctx())
    expect(result.severity).toBe('warn')
    expect(result.reasonCode).toContain('currency_mismatch')
  })
})

describe('FR-7.3(c) — duplicate detection', () => {
  it('EC-32 — fails a file the same buyer already submitted', () => {
    const result = duplicateCheck(proof(), ctx({ buyerHashes: ['hash-a'] }))
    expect(result.severity).toBe('fail')
    expect(result.reasonCode).toBe('resubmitted_by_same_buyer')
  })

  it('EC-33 / FR-13.6 — warns with a date only when another buyer sent the same file', () => {
    const result = duplicateCheck(
      proof(),
      ctx({ otherBuyerHashes: [{ hash: 'hash-a', seenAt: '2026-07-02' }] }),
    )
    expect(result.severity).toBe('warn')
    expect(result.reasonCode).toBe('seen_before_on_2026-07-02')
    // No buyer name, id or reference may appear in the disclosed reason.
    expect(result.reasonCode).not.toMatch(/buyer|acct|account|ref|SPR-/i)
  })

  it('passes a file nobody has sent before', () => {
    expect(duplicateCheck(proof(), ctx()).severity).toBe('pass')
  })
})

describe('EC-27 — extraction unavailable', () => {
  it('reports all three checks as not run rather than inventing a result', () => {
    const results = runAutoChecks(proof({ extractionUnavailable: true }), ctx())
    expect(results).toHaveLength(3)
    for (const r of results) {
      expect(r.severity).toBe('not_run')
      expect(r.reasonCode).toBe('extraction_unavailable')
    }
  })

  it('does not count as a failure, so it never auto-declines (FR-7.4)', () => {
    const results = runAutoChecks(proof({ extractionUnavailable: true }), ctx())
    expect(hasFailedCheck(results)).toBe(false)
  })
})

describe('FR-7.3 — every check reports a specific reason (AC-16.2)', () => {
  it('never returns an empty reason code', () => {
    const results = runAutoChecks(proof(), ctx())
    expect(results).toHaveLength(3)
    for (const r of results) expect(r.reasonCode.length).toBeGreaterThan(0)
  })
})

describe('FR-7.8 / Decision 3 — tri-state outcome', () => {
  it('names matched, beaten or declined — never a binary approve', () => {
    expect(triStateOutcome(9000, 9000, false)).toBe('matched')
    expect(triStateOutcome(9000, 8800, false)).toBe('beaten')
    expect(triStateOutcome(9000, 9500, false)).toBe('declined')
    expect(triStateOutcome(9000, 9000, true)).toBe('declined')
    expect(triStateOutcome(null, null, false)).toBe('declined')
  })
})

describe('FR-7.1 / FR-7.7 — upload policy is stated up front', () => {
  it('accepts the listed types and caps files at 10 MB', () => {
    expect(ACCEPTED_MIME_TYPES).toContain('application/pdf')
    expect(ACCEPTED_MIME_TYPES).toContain('image/heic')
    expect(MAX_FILE_BYTES).toBe(10 * 1024 * 1024)
  })

  it('enumerates the exclusions in both languages so they can be shown before upload (EC-36)', () => {
    expect(PROOF_EXCLUSIONS.en.length).toBe(PROOF_EXCLUSIONS.ar.length)
    expect(PROOF_EXCLUSIONS.en.length).toBeGreaterThan(0)
  })
})

describe('FR-7.6 — abuse signals', () => {
  it('flags a buyer crossing any single threshold', () => {
    const clean = { submissionsLast24h: 2, failedChecksLast30d: 1, duplicateHashesLast30d: 0, flaggedShare: 0.1 }
    expect(abuseFlagged(clean)).toBe(false)
    expect(abuseFlagged({ ...clean, duplicateHashesLast30d: 5 })).toBe(true)
    expect(abuseFlagged({ ...clean, flaggedShare: 0.8 })).toBe(true)
  })
})
