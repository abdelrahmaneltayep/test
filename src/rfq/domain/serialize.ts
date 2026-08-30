/**
 * The actor boundary — PRD §6.1 A7 and §4.4 FR-4.8.
 *
 * Cost, margin, floor price and rule configuration are excluded here, at the serialiser,
 * rather than filtered in the client. §6.8 item 3 requires a contract test per endpoint
 * asserting that no buyer-facing payload contains any of them; that test consumes
 * SELLER_INTERNAL_KEYS below, so adding a new seller-internal field to the model and
 * forgetting it here fails the test rather than leaking.
 */

import { labelFor } from './states'
import type { NegotiationRequest, RequestLine } from './types'

/** Keys that must never appear anywhere in a buyer-facing payload (N6, E-3). */
export const SELLER_INTERNAL_KEYS = [
  'cost', 'costSnapshot', 'costTotal',
  'margin', 'marginPct', 'marginBand',
  'floorPrice', 'floorSnapshot', 'floorOverrideReason',
  'autoAcceptPercent', 'rule', 'internalReason', 'opsAlert',
] as const

export interface BuyerLineView {
  id: string
  sku: string
  productName: { en: string; ar: string }
  route: RequestLine['route']
  quantity: number
  /** FR-1.3 — the snapshot, not today's catalogue price (EC-9). */
  listPrice: number
  /** AC-9.2 — Case 2 lines carry null and render "—", never an inferred value. */
  askedPrice: number | null
  offeredPrice: number | null
  outcome: RequestLine['outcome']
  hasProof: boolean
}

export interface BuyerRequestView {
  ref: string
  sellerName: string
  /** AC-8.4 — the buyer label only. The internal state name is not in the payload. */
  statusLabel: string | null
  actionRequired: boolean
  lines: BuyerLineView[]
  rounds: number
  maxRounds: number
  submittedAt: string | null
  slaDueAt: string | null
  offerExpiresAt: string | null
  infoReason: { code: string; note: string } | null
  /** The seller's named reason for declining. A code and a note — never a margin. */
  declineReason: { code: string; note: string } | null
  previousRef: string | null
}

/**
 * Project a request into what the buyer is allowed to see.
 *
 * Note what is absent by construction: the internal state name, every cost and floor
 * snapshot, and the whole rule configuration. `lost` has no buyer label at all (FR-3.2),
 * so statusLabel is null there rather than exposing seller analytics (EC-43).
 */
export function toBuyerView(
  request: NegotiationRequest,
  lang: 'en' | 'ar',
  maxRounds: number,
): BuyerRequestView {
  return {
    ref: request.ref,
    sellerName: request.sellerName,
    statusLabel: labelFor(request.state, 'buyer', lang),
    actionRequired: request.state === 'info_requested' || request.state === 'countered_by_seller',
    lines: request.lines.map((l) => ({
      id: l.id,
      sku: l.sku,
      productName: l.productName,
      route: l.route,
      quantity: l.quantity,
      listPrice: l.listPriceSnapshot,
      askedPrice: l.askedPrice,
      offeredPrice: l.offeredPrice,
      outcome: l.outcome,
      hasProof: l.proof !== null,
    })),
    rounds: request.rounds,
    maxRounds,
    submittedAt: request.submittedAt,
    slaDueAt: request.slaDueAt,
    offerExpiresAt: request.offerExpiresAt,
    infoReason: request.infoReason
      ? { code: request.infoReason.code, note: request.infoReason.note }
      : null,
    declineReason: request.declineReason
      ? { code: request.declineReason.code, note: request.declineReason.note }
      : null,
    previousRef: request.previousRef,
  }
}

/** Test helper for §6.8 item 3 — walks a payload and reports any forbidden key it finds. */
export function findSellerInternalKeys(payload: unknown, path = '$'): string[] {
  if (payload === null || typeof payload !== 'object') return []
  if (Array.isArray(payload)) {
    return payload.flatMap((v, i) => findSellerInternalKeys(v, `${path}[${i}]`))
  }
  const found: string[] = []
  for (const [key, value] of Object.entries(payload)) {
    if ((SELLER_INTERNAL_KEYS as readonly string[]).includes(key)) found.push(`${path}.${key}`)
    found.push(...findSellerInternalKeys(value, `${path}.${key}`))
  }
  return found
}
