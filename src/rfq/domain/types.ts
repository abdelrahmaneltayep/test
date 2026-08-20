/**
 * Object model — PRD §4.1 (FR-1.1 … FR-1.10).
 *
 * A Request is the negotiation container (Decision 1: order-level, not item-level).
 * It is a separate aggregate from the Order (Decision 2) — nothing here writes order state.
 */

export type Actor = 'buyer' | 'seller' | 'system'

/** FR-1.2 — a line takes exactly one route, chosen explicitly by the buyer (FR-2.2). */
export type Route = 'case_1' | 'case_2'

/** FR-1.2 — per-line outcome; lines resolve independently (FR-4.3). */
export type LineOutcome = 'pending' | 'accepted' | 'countered' | 'declined'

/** AC-5.2 — controlled picker, never free text. Captured only in Phase 1 (Q-8). */
export type Frequency = 'one_off' | 'weekly' | 'fortnightly' | 'monthly'

/** FR-7.3 — every auto-check reports one of these, with a reason code (AC-16.2). */
export type CheckSeverity = 'pass' | 'warn' | 'fail' | 'not_run'

/** AC-17.2 — controlled vocabulary for "request more info". */
export type InfoReason =
  | 'illegible'
  | 'expired'
  | 'sku_mismatch'
  | 'wrong_supplier'
  | 'incomplete_document'
  | 'other'

/** FR-7.8 — Case 1 resolves tri-state, never as a binary approve/reject (Decision 3). */
export type TriStateOutcome = 'matched' | 'beaten' | 'declined'

/** FR-1.8 / A5 — money is always integer minor units. Never a float. */
export type Minor = number

/** FR-2.3 — a published volume tier on the catalogue SKU. */
export interface Tier {
  minQty: number
  unitPrice: Minor
}

export interface Product {
  sku: string
  name: { en: string; ar: string }
  brand: string
  category: { en: string; ar: string }
  /** Stands in for the catalogue image the live product renders here. */
  emoji: string
  packSize: string
  /** The package label — what the card chip shows ("case", "bag", "tin"). */
  unitOfMeasure: { en: string; ar: string }
  /**
   * The base unit inside that package, plural. AC-2.4 asks for the equivalent unit count
   * and its unit of measure, which is this and not the package label: 40 cases of milk is
   * 480 litres, not "480 case".
   */
  baseUnit: { en: string; ar: string }
  unitsPerCase: number
  listPrice: Minor
  tiers: Tier[]
  /** FR-5.3 — seller-internal. Null where cost is not configured (EC-20). */
  cost: Minor | null
  /** FR-3.4f — seller-internal. Unset by default. */
  floorPrice: Minor | null
  inStock: boolean
  backorderable: boolean
  /** FR-2.1 — on the seller's exclusion list (Q-11). */
  excluded: boolean
}

/** FR-1.6 — Proof attaches to a Request Line. */
export interface Proof {
  fileName: string
  mimeType: string
  sizeBytes: number
  /** FR-1.6 — SHA-256 of the file contents. */
  hash: string
  /** FR-7.5 — what the buyer typed. Authoritative for the record. */
  typed: ProofFields
  /** FR-7.5 — what extraction returned. Stored alongside, never overwrites typed. */
  extracted: ProofFields | null
  /** EC-27 — extraction timed out or was unavailable. */
  extractionUnavailable: boolean
  checks: CheckResult[]
}

export interface ProofFields {
  supplier: string
  sku: string
  unitPrice: Minor | null
  documentDate: string | null
  currency: string | null
}

export interface CheckResult {
  check: 'freshness' | 'identity' | 'duplicate'
  severity: CheckSeverity
  /** AC-16.2 — a specific reason, never a bare icon. */
  reasonCode: string
}

export interface RequestLine {
  id: string
  sku: string
  productName: { en: string; ar: string }
  route: Route
  quantity: number
  /** FR-1.3 — snapshotted at submission; a later catalogue change never alters it (EC-9). */
  listPriceSnapshot: Minor
  /** Case 1 only. Case 2 lines carry no asked price and render "—" (AC-9.2). */
  askedPrice: Minor | null
  /** Set when the seller responds. */
  offeredPrice: Minor | null
  outcome: LineOutcome
  proof: Proof | null
  frequency: Frequency | null
  note: string | null
  /** FR-5.3 — seller-internal cost snapshot. Never crosses the actor boundary (A7). */
  costSnapshot: Minor | null
  /** FR-3.4f — seller-internal floor snapshot. */
  floorSnapshot: Minor | null
}

/** FR-1.5 — system-generated, append-only, immutable to every role (FR-12.2). */
export interface HistoryEvent {
  id: string
  /** FR-11.3 — structured event + params, localised at render time. Never a stored string. */
  type: string
  actor: Actor
  actorName: string | null
  /** FR-12.3 — UTC. The tenant-local rendering is derived. */
  at: string
  params: Record<string, string | number | null>
  /** FR-12.3 — before/after for any change to money. */
  before: Minor | null
  after: Minor | null
  /** AC-19.3 — which rule fired, when the actor is `system`. */
  rule: string | null
}

/** FR-1.5 — user-authored, threaded, distinct from History. */
export interface Comment {
  id: string
  actor: Actor
  actorName: string
  at: string
  body: string
}

/** FR-1.7 — written from an accepted request (FR-8.1). */
export interface PriceListEntry {
  buyerId: string
  sku: string
  price: Minor
  validFrom: string
  validUntil: string
  minQty: number
  maxQty: number
  maxOrders: number | null
  sourceRequestRef: string
  active: boolean
}

export interface NegotiationRequest {
  /** FR-1.10 — SPR-{YY}{MM}-{seq}, stable and shown on every surface. */
  ref: string
  tenantId: string
  buyerId: string
  buyerName: string
  sellerId: string
  sellerName: string
  state: import('./states').RequestState
  lines: RequestLine[]
  /** FR-3.4c — an information request never increments this (AC-17.4). */
  rounds: number
  /** FR-3.4h — capped at 2 per request. */
  infoRequests: number
  submittedAt: string | null
  /** FR-3.4a — when the seller's SLA clock runs out. */
  slaDueAt: string | null
  /** FR-3.4b — when the seller's offer stops being valid. */
  offerExpiresAt: string | null
  /** AC-17.1 — the seller's stated reason, shown to the buyer verbatim. */
  infoReason: { code: InfoReason; note: string } | null
  history: HistoryEvent[]
  comments: Comment[]
  /** EC-12 — optimistic concurrency. */
  version: number
  /** AC-22.3 / FR-4.9 — a re-request links back; the terminal request is never reopened. */
  previousRef: string | null
  /** FR-1.9 — N1 (one-to-many RFQ) must stay reachable without a breaking migration. */
  sellerResponses: SellerResponse[]
}

/** FR-1.9 — kept as a collection so a future request can hold N seller responses. */
export interface SellerResponse {
  sellerId: string
  respondedAt: string
  expiresAt: string
  /** FR-10.3 — recorded whenever a floor override was used. */
  floorOverrideReason: string | null
}
