/**
 * Request reference — PRD §4.1 FR-1.10.
 *
 * Format SPR-{YY}{MM}-{seq}: stable, unique per tenant, and shown on every surface so a
 * buyer, a seller and support are always talking about the same request (PP5.1).
 */

export function makeRef(date: Date, seq: number): string {
  const yy = String(date.getUTCFullYear() % 100).padStart(2, '0')
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `SPR-${yy}${mm}-${String(seq).padStart(4, '0')}`
}

export const REF_PATTERN = /^SPR-\d{4}-\d{4}$/

export function isValidRef(ref: string): boolean {
  return REF_PATTERN.test(ref)
}
