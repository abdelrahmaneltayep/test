/**
 * Prototype store — one in-memory model behind all three surfaces, so a seller action in
 * the seller dashboard is visible from the buyer dashboard in the same session. That is
 * the point of the prototype: FR-3.2's single stored state, rendered twice.
 *
 * Everything price-shaped goes through the domain modules; nothing here re-implements
 * arithmetic or transitions.
 */

import { createContext, useContext } from 'react'
import { addDays, addHours, dueForExpiry } from './domain/clocks'
import { GATING, GUARDRAILS, guardrailValue } from './domain/guardrails'
import { lineTotal, sumMinor } from './domain/money'
import { hasFailedCheck, runAutoChecks } from './domain/proof'
import { makeOrderId, orderLinesFrom, viewOrder, type Order } from './domain/orders'
import { makeRef } from './domain/reference'
import { evaluateAutoRules } from './domain/rules'
import { attemptTransition, type RequestState } from './domain/states'
import type {
  Actor, Frequency, HistoryEvent, InfoReason, LineOutcome, Minor,
  NegotiationRequest, PriceListEntry, Product, Proof, RequestLine,
} from './domain/types'

/** Seed catalogue. Cost and floor are seller-internal and never serialised to a buyer. */
export const PRODUCTS: Product[] = [
  {
    sku: 'HB-4471', name: { en: 'Almarai Fresh Milk 12×1L', ar: 'حليب المراعي الطازج ١٢×١ لتر' },
    brand: 'Almarai', category: { en: 'Dairy', ar: 'الألبان' }, emoji: '🥛', packSize: '12x1L', unitOfMeasure: { en: 'case', ar: 'كرتون' }, baseUnit: { en: 'litres', ar: 'لتر' }, unitsPerCase: 12,
    listPrice: 10_250,
    tiers: [{ minQty: 50, unitPrice: 9_900 }, { minQty: 120, unitPrice: 9_600 }],
    cost: 7_400, floorPrice: 8_900, inStock: true, backorderable: true, excluded: false,
  },
  {
    sku: 'HB-2210', name: { en: 'Sunflower Cooking Oil 6×1.8L', ar: 'زيت دوار الشمس ٦×١٫٨ لتر' },
    brand: 'Afia', category: { en: 'Cooking Oils', ar: 'زيوت الطهي' }, emoji: '🫒', packSize: '6x1.8L', unitOfMeasure: { en: 'case', ar: 'كرتون' }, baseUnit: { en: 'litres', ar: 'لتر' }, unitsPerCase: 6,
    listPrice: 14_800,
    tiers: [{ minQty: 40, unitPrice: 14_200 }],
    cost: 11_600, floorPrice: 13_000, inStock: true, backorderable: true, excluded: false,
  },
  {
    sku: 'HB-9032', name: { en: 'Basmati Rice 10kg', ar: 'أرز بسمتي ١٠ كجم' },
    brand: 'Abu Kass', category: { en: 'Rice & Grains', ar: 'الأرز والحبوب' }, emoji: '🍚', packSize: '10kg', unitOfMeasure: { en: 'bag', ar: 'كيس' }, baseUnit: { en: 'bags', ar: 'كيس' }, unitsPerCase: 1,
    listPrice: 6_450, tiers: [],
    // EC-20 — no cost configured. The queue must render "—", not 0 %.
    cost: null, floorPrice: null, inStock: true, backorderable: false, excluded: false,
  },
  {
    sku: 'HB-7788', name: { en: 'Bottled Water 24×330ml', ar: 'مياه معبأة ٢٤×٣٣٠ مل' },
    brand: 'Oasis', category: { en: 'Water & Beverages', ar: 'المياه والمشروبات' }, emoji: '💧', packSize: '24x330ml', unitOfMeasure: { en: 'case', ar: 'كرتون' }, baseUnit: { en: 'bottles', ar: 'زجاجة' }, unitsPerCase: 24,
    listPrice: 1_950, tiers: [{ minQty: 100, unitPrice: 1_800 }],
    cost: 1_500, floorPrice: 1_700, inStock: true, backorderable: true, excluded: false,
  },
  {
    sku: 'HB-5520', name: { en: 'Tomato Paste 24×400g', ar: 'معجون طماطم ٢٤×٤٠٠ جم' },
    brand: 'Al Alali', category: { en: 'Canned & Preserved', ar: 'المعلبات' }, emoji: '🥫', packSize: '24x400g', unitOfMeasure: { en: 'case', ar: 'كرتون' }, baseUnit: { en: 'tins', ar: 'علبة' }, unitsPerCase: 24,
    listPrice: 8_900,
    tiers: [{ minQty: 30, unitPrice: 8_600 }, { minQty: 80, unitPrice: 8_250 }],
    cost: 6_800, floorPrice: 7_900, inStock: true, backorderable: true, excluded: false,
  },
  {
    sku: 'HB-6115', name: { en: 'White Sugar 50kg', ar: 'سكر أبيض ٥٠ كجم' },
    brand: 'Al Khaleej', category: { en: 'Sugar & Sweeteners', ar: 'السكر والمحليات' }, emoji: '🧂', packSize: '50kg', unitOfMeasure: { en: 'sack', ar: 'كيس' }, baseUnit: { en: 'sacks', ar: 'كيس' }, unitsPerCase: 1,
    listPrice: 12_300, tiers: [],
    cost: 10_100, floorPrice: 11_200, inStock: true, backorderable: true, excluded: false,
  },
  {
    sku: 'HB-1004', name: { en: 'Infant Formula Stage 1', ar: 'حليب أطفال المرحلة الأولى' },
    brand: 'Nutricare', category: { en: 'Baby Care', ar: 'العناية بالطفل' }, emoji: '🍼', packSize: '400g', unitOfMeasure: { en: 'tin', ar: 'علبة' }, baseUnit: { en: 'tins', ar: 'علبة' }, unitsPerCase: 1,
    listPrice: 4_200, tiers: [],
    cost: 3_500, floorPrice: 4_000, inStock: true, backorderable: false,
    // Q-11 / FR-2.1 — a controlled-price category. No entry point is rendered at all (AC-1.3).
    excluded: true,
  },
]

export const SELLER = { id: 's1', name: { en: 'Gulf Distribution Co.', ar: 'شركة الخليج للتوزيع' } }
export const BUYER = { id: 'b1', name: { en: 'Nawaf — Al Waha Markets', ar: 'نواف — أسواق الواحة' } }

export function productBySku(sku: string): Product {
  const found = PRODUCTS.find((p) => p.sku === sku)
  if (!found) throw new Error(`unknown sku ${sku}`)
  return found
}

/** FR-2.1 — eligibility. An ineligible SKU renders no entry point (AC-1.3). */
export function isNegotiable(p: Product): boolean {
  return !p.excluded && (p.inStock || p.backorderable)
}

let historySeq = 0
export function event(
  type: string, actor: Actor, actorName: string | null, at: Date,
  params: Record<string, string | number | null> = {},
  money: { before?: Minor | null; after?: Minor | null; rule?: string | null } = {},
): HistoryEvent {
  historySeq += 1
  return {
    id: `h${historySeq}`, type, actor, actorName, at: at.toISOString(), params,
    before: money.before ?? null, after: money.after ?? null, rule: money.rule ?? null,
  }
}

export interface DraftLine {
  sku: string
  route: 'case_1' | 'case_2'
  quantity: number
  askedPrice: Minor | null
  frequency: Frequency | null
  note: string | null
  proof: Proof | null
}

export interface Draft {
  /** FR-2.9 — submission is idempotent, keyed on this identity (AC-7.6, EC-2). */
  id: string
  lines: DraftLine[]
  sellerId: string
}

export interface RfqState {
  /** Simulated server time. Every countdown derives from this, never from the client (EC-18). */
  now: Date
  seq: number
  requests: NegotiationRequest[]
  /**
   * Feature Flow Draft §7/§9 — the order the buyer is actually placing. A separate
   * aggregate from the negotiation (PRD §6.6 Decision 2); everything the draft calls an
   * order status is projected in domain/orders.ts rather than stored twice.
   */
  orders: Order[]
  orderSeq: number
  priceList: PriceListEntry[]
  draft: Draft | null
  /** FR-2.9 — draft ids already submitted; a repeat submit returns the same reference. */
  submittedDrafts: Record<string, string>
  /** AC-3.3 — when Phase 2 is off, the Case 1 card is not rendered at all. */
  phase2Enabled: boolean
  autoAcceptPercent: number
  /** FR-10.3 — does the signed-in seller user hold the floor-override permission? */
  canOverrideFloor: boolean
  /** FR-10.4 — template creation is a distinct permission from ordinary acceptance. */
  canCreateTemplate: boolean
  opsAlerts: string[]
}

function buildLine(d: DraftLine, now: Date): RequestLine {
  const product = productBySku(d.sku)
  return {
    id: `${d.sku}-${now.getTime()}-${Math.floor(Math.random() * 1e6)}`,
    sku: d.sku,
    productName: product.name,
    route: d.route,
    quantity: d.quantity,
    // FR-1.3 — snapshot list price at submission; a later catalogue change never alters it.
    listPriceSnapshot: product.listPrice,
    askedPrice: d.askedPrice,
    offeredPrice: null,
    outcome: 'pending',
    proof: d.proof,
    frequency: d.frequency,
    note: d.note,
    // Seller-internal snapshots, excluded at the serialiser (A7).
    costSnapshot: product.cost,
    floorSnapshot: product.floorPrice,
  }
}

export function listTotalOf(lines: RequestLine[]): Minor {
  return sumMinor(lines.map((l) => lineTotal(l.listPriceSnapshot, l.quantity)))
}

/** AC-7.2 — Case 2 lines are excluded from the asked total, which says so on the label. */
export function askedTotalOf(lines: RequestLine[]): Minor {
  return sumMinor(
    lines.filter((l) => l.askedPrice !== null).map((l) => lineTotal(l.askedPrice as Minor, l.quantity)),
  )
}

/** AC-9.3 — the offered total is computed over resolved lines only. */
export function offeredTotalOf(lines: RequestLine[]): Minor {
  return sumMinor(lines.map((l) => lineTotal(l.offeredPrice ?? l.listPriceSnapshot, l.quantity)))
}

export type Action =
  | { type: 'set_now'; now: Date }
  | { type: 'advance_time'; hours: number }
  | { type: 'start_draft' }
  | { type: 'add_line'; line: DraftLine }
  | { type: 'remove_line'; index: number }
  | { type: 'discard_draft' }
  | { type: 'submit_draft' }
  | { type: 'seller_opens'; ref: string }
  | { type: 'seller_responds'; ref: string; decisions: Record<string, { outcome: LineOutcome; price: Minor | null }>; validityDays: number; overrideReason: string | null }
  | { type: 'request_more_info'; ref: string; reason: InfoReason; note: string }
  | { type: 'buyer_resubmits'; ref: string }
  | { type: 'buyer_accepts'; ref: string; asTemplate: boolean; template?: Omit<PriceListEntry, 'buyerId' | 'sourceRequestRef' | 'active'>; conflictResolution?: 'replace' | 'supersede' }
  | { type: 'buyer_counters'; ref: string; prices: Record<string, Minor> }
  | { type: 'buyer_declines'; ref: string }
  | { type: 'buyer_withdraws'; ref: string }
  | { type: 're_request'; ref: string }
  | { type: 'seller_accepts_template'; ref: string; prices: Record<string, Minor>; template: Omit<PriceListEntry, 'buyerId' | 'sourceRequestRef' | 'active'>; conflictResolution?: 'replace' | 'supersede' }
  | { type: 'seller_accepts'; ref: string }
  | { type: 'confirm_order'; id: string }
  | { type: 'cancel_order'; id: string }
  | { type: 'set_flag'; key: 'phase2Enabled' | 'canOverrideFloor' | 'canCreateTemplate'; value: boolean }
  | { type: 'set_auto_accept'; percent: number }

function withRequest(
  state: RfqState, ref: string, fn: (r: NegotiationRequest) => NegotiationRequest,
): RfqState {
  return { ...state, requests: state.requests.map((r) => (r.ref === ref ? fn(r) : r)) }
}

/** FR-8.3 / AC-18.4 — never a silent overwrite; the caller has already chosen. */
function writeTemplate(
  priceList: PriceListEntry[], entry: PriceListEntry, resolution: 'replace' | 'supersede' | undefined,
): PriceListEntry[] {
  return resolution === 'replace'
    ? [...priceList.filter((e) => !(e.buyerId === entry.buyerId && e.sku === entry.sku)), entry]
    : [...priceList.map((e) =>
        e.buyerId === entry.buyerId && e.sku === entry.sku ? { ...e, active: false } : e), entry]
}

/**
 * A3 — a transition is the only way state changes, and it is guarded by the table.
 * A4 — the history event is written in the same step as the transition, never after it.
 */
function transitioned(
  request: NegotiationRequest, to: RequestState, actor: Actor, actorName: string | null,
  now: Date, type: string, params: Record<string, string | number | null> = {},
  money: Parameters<typeof event>[5] = {},
): NegotiationRequest {
  const result = attemptTransition(request.state, to, actor)
  if (!result.ok) {
    // The UI never offers an invalid action; reaching here means a genuine 409 (EC-12).
    console.warn(`[${request.ref}] ${result.reason}`)
    return request
  }
  return {
    ...request,
    state: to,
    version: request.version + 1,
    history: [...request.history, event(type, actor, actorName, now, params, money)],
  }
}

export function reducer(state: RfqState, action: Action): RfqState {
  const lang: 'en' = 'en'
  switch (action.type) {
    case 'set_now':
      return sweep({ ...state, now: action.now })

    case 'advance_time':
      return sweep({ ...state, now: addHours(state.now, action.hours) })

    case 'start_draft':
      return { ...state, draft: { id: `d${Date.now()}`, lines: [], sellerId: SELLER.id } }

    case 'add_line': {
      if (!state.draft) return state
      // AC-6.5 — a request holds 1–20 lines.
      if (state.draft.lines.length >= GATING.maxLinesPerRequest) return state
      return { ...state, draft: { ...state.draft, lines: [...state.draft.lines, action.line] } }
    }

    case 'remove_line': {
      if (!state.draft) return state
      return {
        ...state,
        draft: { ...state.draft, lines: state.draft.lines.filter((_, i) => i !== action.index) },
      }
    }

    case 'discard_draft':
      return { ...state, draft: null }

    case 'submit_draft': {
      const draft = state.draft
      // AC-7.4 — an empty request cannot be submitted; it stays a draft.
      if (!draft || draft.lines.length === 0) return state
      // EC-2 / FR-2.9 — a repeat submit of the same draft returns the same reference.
      if (state.submittedDrafts[draft.id]) return { ...state, draft: null }

      const now = state.now
      const ref = makeRef(now, state.seq)
      const lines = draft.lines.map((l) => buildLine(l, now))
      const failedProof = lines.some((l) => l.proof !== null && hasFailedCheck(l.proof.checks))

      let request: NegotiationRequest = {
        ref, tenantId: 't1',
        buyerId: BUYER.id, buyerName: BUYER.name[lang],
        sellerId: SELLER.id, sellerName: SELLER.name[lang],
        state: 'draft', lines, rounds: 0, infoRequests: 0,
        submittedAt: now.toISOString(),
        slaDueAt: addHours(now, guardrailValue('sellerResponseSlaHours')).toISOString(),
        offerExpiresAt: null, infoReason: null,
        history: [], comments: [], version: 0, previousRef: null, sellerResponses: [],
      }
      request = transitioned(request, 'submitted', 'buyer', BUYER.name[lang], now,
        'RequestSubmitted', { lines: lines.length })

      // US-19 — rules run before the request ever reaches the queue.
      const ruled = evaluateAutoRules({
        lines, hasFailedProofCheck: failedProof,
        config: { autoAcceptPercent: state.autoAcceptPercent },
      })
      const opsAlerts = ruled.opsAlert ? [...state.opsAlerts, ruled.opsAlert] : state.opsAlerts

      if (ruled.decision === 'auto_decline') {
        request = {
          ...transitioned(request, 'declined', 'system', null, now, 'AutoRuleFired', { rule: ruled.rule }, { rule: ruled.rule }),
          lines: request.lines.map((l) => ({ ...l, outcome: 'declined' as LineOutcome, offeredPrice: l.listPriceSnapshot })),
          slaDueAt: null,
        }
      } else if (ruled.decision === 'auto_accept') {
        request = {
          ...transitioned(request, 'accepted', 'system', null, now, 'AutoRuleFired', { rule: ruled.rule }, { rule: ruled.rule }),
          lines: request.lines.map((l) => ({ ...l, outcome: 'accepted' as LineOutcome, offeredPrice: l.askedPrice })),
          slaDueAt: null,
        }
      }

      // Feature Flow Draft §2/§7 — the buyer is placing an order at a quantity, and the
      // price on it is what is under negotiation. The order opens Pending against this
      // request; its status, its buttons and the price it shows are all projected from
      // the request in domain/orders.ts, so the two records cannot drift apart.
      const order: Order = {
        id: makeOrderId(now, state.orderSeq),
        buyerId: BUYER.id, buyerName: BUYER.name[lang],
        sellerId: SELLER.id, sellerName: SELLER.name[lang],
        placedAt: now.toISOString(),
        lines: orderLinesFrom(lines),
        requestRef: ref,
        resolution: null,
      }

      return {
        ...state,
        seq: state.seq + 1,
        orderSeq: state.orderSeq + 1,
        requests: [request, ...state.requests],
        orders: [order, ...state.orders],
        draft: null,
        submittedDrafts: { ...state.submittedDrafts, [draft.id]: ref },
        opsAlerts,
      }
    }

    case 'seller_opens':
      return withRequest(state, action.ref, (r) =>
        r.state === 'submitted'
          ? transitioned(r, 'viewed', 'seller', SELLER.name[lang], state.now, 'RequestViewed')
          : r)

    case 'seller_responds': {
      const { decisions, validityDays, overrideReason } = action
      return withRequest(state, action.ref, (r) => {
        const lines = r.lines.map((l) => {
          const d = decisions[l.id]
          if (!d) return l
          return {
            ...l,
            outcome: d.outcome,
            // FR-6.3 — a declined line resolves at list price.
            offeredPrice: d.outcome === 'declined' ? l.listPriceSnapshot : d.price,
          }
        })
        const allDeclined = lines.every((l) => l.outcome === 'declined')
        const allAccepted = lines.every((l) => l.outcome === 'accepted')
        const to: RequestState = allDeclined ? 'declined' : allAccepted ? 'accepted' : 'countered_by_seller'
        const expiresAt = addDays(state.now, validityDays)

        let next = transitioned(
          r, to, 'seller', SELLER.name[lang], state.now,
          to === 'declined' ? 'RequestDeclined' : to === 'accepted' ? 'RequestAccepted' : 'SellerResponded',
          { lines: lines.length },
        )
        if (overrideReason) {
          // FR-10.3 — a floor override is recorded with its mandatory reason.
          next = {
            ...next,
            history: [...next.history, event('FloorOverridden', 'seller', SELLER.name[lang], state.now, { reason: overrideReason })],
          }
        }
        return {
          ...next,
          lines,
          slaDueAt: null,
          // FR-6.8 — every response carries an expiry (AC-15.6).
          offerExpiresAt: to === 'countered_by_seller' ? expiresAt.toISOString() : null,
          sellerResponses: [...next.sellerResponses, {
            sellerId: SELLER.id, respondedAt: state.now.toISOString(),
            expiresAt: expiresAt.toISOString(), floorOverrideReason: overrideReason,
          }],
        }
      })
    }

    case 'request_more_info':
      return withRequest(state, action.ref, (r) => {
        // AC-17.5 / FR-3.4h — the third attempt is blocked; a decision is required.
        if (r.infoRequests >= guardrailValue('maxInfoRequests')) return r
        const next = transitioned(
          r, 'info_requested', 'seller', SELLER.name[lang], state.now,
          'InfoRequested', { reason: action.reason },
        )
        if (next === r) return r
        return {
          ...next,
          // AC-17.4 — an information request is not a negotiation round.
          infoRequests: r.infoRequests + 1,
          infoReason: { code: action.reason, note: action.note },
          // AC-17.3 — the SLA clock stops; the buyer response window starts.
          slaDueAt: null,
          offerExpiresAt: addHours(state.now, guardrailValue('buyerResponseWindowHours')).toISOString(),
        }
      })

    case 'buyer_resubmits':
      return withRequest(state, action.ref, (r) => {
        const next = transitioned(
          r, 'countered_by_buyer', 'buyer', BUYER.name[lang], state.now, 'InfoSupplied',
        )
        if (next === r) return r
        return {
          ...next,
          // AC-11.3 — the SLA restarts and the round counter does *not* increment.
          rounds: r.rounds,
          infoReason: null,
          slaDueAt: addHours(state.now, guardrailValue('sellerResponseSlaHours')).toISOString(),
          offerExpiresAt: null,
        }
      })

    case 'buyer_accepts': {
      const request = state.requests.find((r) => r.ref === action.ref)
      if (!request) return state
      const to: RequestState = action.asTemplate ? 'accepted_as_template' : 'accepted'
      const from = request.state
      // Acceptance is available both from a seller counter and (as-asked) before one.
      const targetState: RequestState = from === 'countered_by_seller' ? to : 'accepted'

      let priceList = state.priceList
      if (action.asTemplate && action.template) {
        const entry: PriceListEntry = {
          ...action.template,
          buyerId: request.buyerId,
          sourceRequestRef: request.ref,
          active: true,
        }
        priceList = writeTemplate(priceList, entry, action.conflictResolution)
      }

      return {
        ...withRequest(state, action.ref, (r) => {
          let next = transitioned(
            r, targetState, 'buyer', BUYER.name[lang], state.now, 'RequestAccepted',
          )
          if (next === r) return r
          if (action.asTemplate && action.template) {
            next = {
              ...next,
              history: [...next.history, event('TemplateCreated', 'seller', SELLER.name[lang], state.now, { validUntil: action.template.validUntil })],
            }
          }
          return {
            ...next,
            // AC-10.7 — an accepted line's price is binding from here on.
            lines: next.lines.map((l) =>
              l.outcome === 'declined' ? l : { ...l, outcome: 'accepted' as LineOutcome, offeredPrice: l.offeredPrice ?? l.askedPrice }),
            offerExpiresAt: null,
            slaDueAt: null,
          }
        }),
        priceList,
      }
    }

    case 'buyer_counters':
      return withRequest(state, action.ref, (r) => {
        // FR-3.4c — no counter once the round cap is reached (AC-10.4).
        if (r.rounds >= guardrailValue('maxRounds')) return r
        const next = transitioned(
          r, 'countered_by_buyer', 'buyer', BUYER.name[lang], state.now,
          'BuyerCountered', { round: r.rounds + 1 },
        )
        if (next === r) return r
        return {
          ...next,
          rounds: r.rounds + 1,
          lines: next.lines.map((l) =>
            action.prices[l.id] !== undefined
              ? { ...l, askedPrice: action.prices[l.id], outcome: 'pending' as LineOutcome }
              : l),
          // AC-10.5 — the SLA clock restarts for the seller.
          slaDueAt: addHours(state.now, guardrailValue('sellerResponseSlaHours')).toISOString(),
          offerExpiresAt: null,
        }
      })

    case 'buyer_declines':
      return withRequest(state, action.ref, (r) => ({
        ...transitioned(r, 'declined', 'buyer', BUYER.name[lang], state.now, 'RequestDeclined'),
        slaDueAt: null, offerExpiresAt: null,
      }))

    case 'buyer_withdraws':
      return withRequest(state, action.ref, (r) => ({
        ...transitioned(r, 'withdrawn', 'buyer', BUYER.name[lang], state.now, 'RequestWithdrawn'),
        // AC-12.2 — the SLA clock stops.
        slaDueAt: null, offerExpiresAt: null,
      }))

    case 're_request': {
      // AC-22.3 / FR-4.9 — a new request, linked to the old one. The terminal request is
      // never reopened.
      const source = state.requests.find((r) => r.ref === action.ref)
      if (!source) return state
      return {
        ...state,
        draft: {
          id: `d${Date.now()}`,
          sellerId: source.sellerId,
          lines: source.lines.map((l) => ({
            sku: l.sku, route: l.route, quantity: l.quantity,
            askedPrice: l.askedPrice, frequency: l.frequency, note: l.note, proof: l.proof,
          })),
        },
      }
    }

    /**
     * Feature Flow Draft §5 — "Accept & apply as template": accept the ask as it stands
     * and write the price forward. Distinct from Accept, which settles this order only.
     */
    case 'seller_accepts_template': {
      const request = state.requests.find((r) => r.ref === action.ref)
      if (!request) return state
      const entry: PriceListEntry = {
        ...action.template,
        buyerId: request.buyerId,
        sourceRequestRef: request.ref,
        active: true,
      }
      const next = withRequest(state, action.ref, (r) => {
        const moved = transitioned(
          r, 'accepted_as_template', 'seller', SELLER.name[lang], state.now, 'RequestAccepted',
        )
        // The guard rejected it — the price list must not be written either.
        if (moved === r) return r
        return {
          ...moved,
          history: [...moved.history, event('TemplateCreated', 'seller', SELLER.name[lang], state.now, { validUntil: action.template.validUntil })],
          lines: moved.lines.map((l) => ({
            ...l,
            outcome: 'accepted' as LineOutcome,
            offeredPrice: action.prices[l.id] ?? l.offeredPrice ?? l.askedPrice ?? l.listPriceSnapshot,
          })),
          slaDueAt: null, offerExpiresAt: null,
        }
      })
      // A rejected transition leaves the request identical; nothing else may change.
      if (next.requests === state.requests) return state
      return { ...next, priceList: writeTemplate(state.priceList, entry, action.conflictResolution) }
    }

    /**
     * Feature Flow Draft §5 — "Accept: one-time acceptance for this order only." The ask
     * is taken exactly as sent, with no counter and nothing written forward.
     */
    case 'seller_accepts':
      return withRequest(state, action.ref, (r) => {
        const moved = transitioned(
          r, 'accepted', 'seller', SELLER.name[lang], state.now, 'RequestAccepted', { lines: r.lines.length },
        )
        if (moved === r) return r
        return {
          ...moved,
          lines: moved.lines.map((l) => ({
            ...l, outcome: 'accepted' as LineOutcome, offeredPrice: l.askedPrice ?? l.listPriceSnapshot,
          })),
          slaDueAt: null, offerExpiresAt: null,
          sellerResponses: [...moved.sellerResponses, {
            sellerId: SELLER.id, respondedAt: state.now.toISOString(),
            expiresAt: state.now.toISOString(), floorOverrideReason: null,
          }],
        }
      })

    /**
     * §6/§7 — the buyer's answer to the seller's response, or to a reject that put the
     * order back at the original price. It settles the order, never the negotiation:
     * a terminal request stays terminal (PRD §6.6 Decision 2).
     */
    case 'confirm_order':
      return {
        ...state,
        orders: state.orders.map((o) => {
          if (o.id !== action.id || o.resolution) return o
          const request = state.requests.find((r) => r.ref === o.requestRef) ?? null
          const view = viewOrder(o, request)
          if (!view.buyerActions.includes('confirm')) return o
          return { ...o, resolution: { kind: 'confirmed' as const, at: state.now.toISOString(), prices: view.prices } }
        }),
      }

    case 'cancel_order':
      return {
        ...state,
        orders: state.orders.map((o) => {
          if (o.id !== action.id || o.resolution) return o
          const request = state.requests.find((r) => r.ref === o.requestRef) ?? null
          if (!viewOrder(o, request).buyerActions.includes('cancel')) return o
          return { ...o, resolution: { kind: 'cancelled' as const, at: state.now.toISOString(), prices: {} } }
        }),
      }

    case 'set_flag':
      return { ...state, [action.key]: action.value }

    case 'set_auto_accept':
      return { ...state, autoAcceptPercent: action.percent }

    default:
      return state
  }
}

/**
 * FR-3.5 — the sweep, run on every clock change. Idempotent: it selects on state and
 * scheduled time, so re-running it produces the same result.
 */
function sweep(state: RfqState): RfqState {
  const candidates = state.requests.map((r) => ({
    ref: r.ref, state: r.state,
    // The clock that governs the state: SLA while it is the seller's turn, offer validity
    // or the buyer response window while it is the buyer's.
    dueAt: r.slaDueAt ?? r.offerExpiresAt,
  }))
  const due = new Set(dueForExpiry(candidates, state.now).map((c) => c.ref))
  if (due.size === 0) return state
  return {
    ...state,
    requests: state.requests.map((r) =>
      due.has(r.ref)
        ? { ...transitioned(r, 'expired', 'system', null, state.now, 'RequestExpired'), slaDueAt: null, offerExpiresAt: null }
        : r),
  }
}

/** Seeded requests, so the dashboards are not empty on first render. */
export function initialState(now: Date): RfqState {
  const mkLine = (
    sku: string, quantity: number, route: 'case_1' | 'case_2',
    askedPrice: Minor | null, offeredPrice: Minor | null, outcome: LineOutcome,
    proof: Proof | null = null,
  ): RequestLine => {
    const p = productBySku(sku)
    return {
      id: `${sku}-seed-${quantity}`, sku, productName: p.name, route, quantity,
      listPriceSnapshot: p.listPrice, askedPrice, offeredPrice, outcome,
      proof, frequency: route === 'case_2' ? 'monthly' : null, note: null,
      costSnapshot: p.cost, floorSnapshot: p.floorPrice,
    }
  }

  const proofOk: Proof = {
    fileName: 'gulf-foods-invoice-aug.pdf', mimeType: 'application/pdf', sizeBytes: 318_000,
    hash: 'hash-seed-1',
    typed: { supplier: 'Gulf Foods', sku: 'HB-4471', unitPrice: 9_400, documentDate: '2026-08-08', currency: 'BHD' },
    extracted: { supplier: 'Gulf Foods Trading W.L.L.', sku: 'HB-4471', unitPrice: 9_400, documentDate: '2026-08-08', currency: 'BHD' },
    extractionUnavailable: false, checks: [],
  }
  const proofStale: Proof = {
    fileName: 'photo-invoice.jpg', mimeType: 'image/jpeg', sizeBytes: 2_100_000,
    hash: 'hash-seed-2',
    typed: { supplier: 'Reef Supplies', sku: 'HB-2210', unitPrice: 13_500, documentDate: '2026-05-19', currency: 'BHD' },
    extracted: { supplier: 'Reef Supplies', sku: 'Afia 6x1.8L', unitPrice: 13_500, documentDate: '2026-05-19', currency: 'BHD' },
    extractionUnavailable: false, checks: [],
  }
  const checkCtx = {
    now, buyerHashes: [], otherBuyerHashes: [{ hash: 'hash-seed-2', seenAt: '2026-07-14' }],
    tenantCurrency: 'BHD',
  }
  proofOk.checks = runAutoChecks(proofOk, { ...checkCtx, target: { sku: 'HB-4471', brand: 'Almarai', packSize: '12x1L', unitOfMeasure: 'case' } })
  proofStale.checks = runAutoChecks(proofStale, { ...checkCtx, target: { sku: 'HB-2210', brand: 'Afia', packSize: '6x1.8L', unitOfMeasure: 'case' } })

  const base = (ref: string, state: RequestState, lines: RequestLine[], extra: Partial<NegotiationRequest> = {}): NegotiationRequest => ({
    ref, tenantId: 't1',
    buyerId: BUYER.id, buyerName: BUYER.name.en, sellerId: SELLER.id, sellerName: SELLER.name.en,
    state, lines, rounds: 0, infoRequests: 0,
    submittedAt: addHours(now, -6).toISOString(),
    slaDueAt: addHours(now, 18).toISOString(),
    offerExpiresAt: null, infoReason: null,
    history: [event('RequestSubmitted', 'buyer', BUYER.name.en, addHours(now, -6), { lines: lines.length })],
    comments: [], version: 1, previousRef: null, sellerResponses: [],
    ...extra,
  })

  const seeded: NegotiationRequest[] = [
    // A mixed request awaiting the seller, with two hours of SLA left (AC-14.5 escalation).
    base('SPR-2608-0001', 'submitted', [
      mkLine('HB-4471', 60, 'case_1', 9_400, null, 'pending', proofOk),
      mkLine('HB-7788', 200, 'case_2', null, null, 'pending'),
    ], { slaDueAt: addHours(now, 2).toISOString() }),

    // A request the seller has answered; it is the buyer's turn (AC-9.1 comparison).
    base('SPR-2608-0002', 'countered_by_seller', [
      mkLine('HB-2210', 40, 'case_1', 13_500, 14_100, 'countered', proofStale),
      mkLine('HB-9032', 25, 'case_2', null, 6_200, 'countered'),
      mkLine('HB-7788', 150, 'case_1', 1_650, 1_950, 'declined'),
    ], {
      rounds: 1, slaDueAt: null,
      offerExpiresAt: addDays(now, 5).toISOString(),
      submittedAt: addHours(now, -30).toISOString(),
      history: [
        event('RequestSubmitted', 'buyer', BUYER.name.en, addHours(now, -30), { lines: 3 }),
        event('RequestViewed', 'seller', SELLER.name.en, addHours(now, -26)),
        event('SellerResponded', 'seller', SELLER.name.en, addHours(now, -24), { lines: 3 }),
      ],
      sellerResponses: [{ sellerId: SELLER.id, respondedAt: addHours(now, -24).toISOString(), expiresAt: addDays(now, 5).toISOString(), floorOverrideReason: null }],
    }),

    // A pure-RFQ thread the seller has already quoted — the draft's Case 2 round trip,
    // and what fills the Inbox's RFQ category on both sides (§4, §8).
    base('SPR-2608-0005', 'countered_by_seller', [
      mkLine('HB-6115', 30, 'case_2', null, 11_800, 'countered'),
    ], {
      rounds: 1, slaDueAt: null,
      offerExpiresAt: addDays(now, 4).toISOString(),
      submittedAt: addHours(now, -20).toISOString(),
      history: [
        event('RequestSubmitted', 'buyer', BUYER.name.en, addHours(now, -20), { lines: 1 }),
        event('RequestViewed', 'seller', SELLER.name.en, addHours(now, -18)),
        event('SellerResponded', 'seller', SELLER.name.en, addHours(now, -17), { lines: 1 }),
      ],
      sellerResponses: [{ sellerId: SELLER.id, respondedAt: addHours(now, -17).toISOString(), expiresAt: addDays(now, 4).toISOString(), floorOverrideReason: null }],
    }),

    // EC-20 — a request whose only priced line has no cost configured.
    base('SPR-2608-0003', 'viewed', [
      mkLine('HB-9032', 80, 'case_1', 6_100, null, 'pending'),
    ], { slaDueAt: addHours(now, 30).toISOString() }),

    // A settled one, so Final Orders has a negotiated row with a real saving on it (§9).
    base('SPR-2607-0031', 'accepted', [
      mkLine('HB-5520', 60, 'case_1', 8_300, 8_300, 'accepted', proofOk),
    ], {
      slaDueAt: null, submittedAt: addHours(now, -96).toISOString(),
      history: [
        event('RequestSubmitted', 'buyer', BUYER.name.en, addHours(now, -96), { lines: 1 }),
        event('RequestViewed', 'seller', SELLER.name.en, addHours(now, -92)),
        event('RequestAccepted', 'seller', SELLER.name.en, addHours(now, -90)),
      ],
    }),

    // A closed one, so the buyer list is not all live rows (AC-22.1).
    base('SPR-2607-0044', 'declined', [
      mkLine('HB-7788', 100, 'case_1', 1_600, 1_950, 'declined'),
    ], {
      slaDueAt: null, submittedAt: addHours(now, -400).toISOString(),
      history: [
        event('RequestSubmitted', 'buyer', BUYER.name.en, addHours(now, -400), { lines: 1 }),
        event('AutoRuleFired', 'system', null, addHours(now, -400), { rule: 'FR-3.4f:floor_price' }, { rule: 'FR-3.4f:floor_price' }),
      ],
    }),
  ]

  /**
   * Feature Flow Draft §9 — "Final Orders = orders with no RFQ/special price negotiation
   * at all (standard orders), plus RFQ/special-price orders once approved." Both kinds are
   * seeded so the list shows the mix, and every seeded negotiation carries its order.
   */
  const standard = (id: string, hoursAgo: number, lines: [string, number][]): Order => ({
    id, buyerId: BUYER.id, buyerName: BUYER.name.en,
    sellerId: SELLER.id, sellerName: SELLER.name.en,
    placedAt: addHours(now, hoursAgo).toISOString(),
    lines: lines.map(([sku, quantity]) => {
      const p = productBySku(sku)
      return { sku, productName: p.name, quantity, originalUnitPrice: p.listPrice }
    }),
    requestRef: null, resolution: null,
  })

  const orders: Order[] = [
    ...seeded.map((r, i) => ({
      id: makeOrderId(now, 900 + i),
      buyerId: BUYER.id, buyerName: BUYER.name.en,
      sellerId: SELLER.id, sellerName: SELLER.name.en,
      placedAt: r.submittedAt ?? now.toISOString(),
      lines: orderLinesFrom(r.lines),
      requestRef: r.ref,
      resolution: null,
    })),
    standard('ORD-2608-0912', -20, [['HB-7788', 60], ['HB-9032', 12]]),
    standard('ORD-2608-0908', -52, [['HB-2210', 18]]),
  ]

  return {
    now, seq: 7, requests: seeded, orders, orderSeq: 20, priceList: [],
    draft: null, submittedDrafts: {},
    phase2Enabled: true, autoAcceptPercent: GUARDRAILS.autoAcceptPercent.default,
    canOverrideFloor: true, canCreateTemplate: true, opsAlerts: [],
  }
}

export interface RfqContextValue {
  state: RfqState
  dispatch: (action: Action) => void
  lang: 'en' | 'ar'
  setLang: (lang: 'en' | 'ar') => void
}

export const RfqContext = createContext<RfqContextValue | null>(null)

export function useRfq(): RfqContextValue {
  const ctx = useContext(RfqContext)
  if (!ctx) throw new Error('useRfq must be used inside RfqContext')
  return ctx
}
