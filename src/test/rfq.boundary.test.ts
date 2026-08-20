/**
 * §6.8 item 3 — the actor boundary. A7 / FR-4.8 / N6: no buyer-facing payload may carry
 * cost, margin, floor price or rule configuration, and the exclusion happens at the
 * serialiser rather than in the client.
 */
import { describe, it, expect } from 'vitest'
import { toBuyerView, findSellerInternalKeys, SELLER_INTERNAL_KEYS } from '@/rfq/domain/serialize'
import { GUARDRAILS } from '@/rfq/domain/guardrails'
import type { NegotiationRequest, RequestLine } from '@/rfq/domain/types'

function line(overrides: Partial<RequestLine> = {}): RequestLine {
  return {
    id: 'l1', sku: 'SKU-1', productName: { en: 'Milk 12x1L', ar: 'حليب ١٢×١ لتر' },
    route: 'case_1', quantity: 40,
    listPriceSnapshot: 10000, askedPrice: 9000, offeredPrice: 9250,
    outcome: 'countered', proof: null, frequency: null, note: null,
    // Deliberately populated: the point of the test is that these do not come out again.
    costSnapshot: 7000, floorSnapshot: 8800,
    ...overrides,
  }
}

function request(overrides: Partial<NegotiationRequest> = {}): NegotiationRequest {
  return {
    ref: 'SPR-2608-0001', tenantId: 't1',
    buyerId: 'b1', buyerName: 'Nawaf', sellerId: 's1', sellerName: 'Gulf Distribution',
    state: 'countered_by_seller',
    lines: [line()],
    rounds: 1, infoRequests: 0,
    submittedAt: '2026-08-18T08:00:00Z',
    slaDueAt: '2026-08-19T08:00:00Z',
    offerExpiresAt: '2026-08-25T08:00:00Z',
    infoReason: null, history: [], comments: [],
    version: 3, previousRef: null,
    sellerResponses: [{ sellerId: 's1', respondedAt: '2026-08-18T14:00:00Z', expiresAt: '2026-08-25T08:00:00Z', floorOverrideReason: 'strategic account' }],
    ...overrides,
  }
}

describe('FR-4.8 — buyer payloads carry no seller-internal value', () => {
  it('strips every forbidden key, at any depth', () => {
    const view = toBuyerView(request(), 'en', GUARDRAILS.maxRounds.default)
    expect(findSellerInternalKeys(view)).toEqual([])
  })

  it('does not leak a floor override reason recorded on the seller response', () => {
    const serialised = JSON.stringify(toBuyerView(request(), 'en', 5))
    expect(serialised).not.toContain('strategic account')
    expect(serialised).not.toContain('floorOverrideReason')
  })

  it('does not leak the cost or floor value itself, even as a bare number', () => {
    const serialised = JSON.stringify(toBuyerView(request(), 'en', 5))
    expect(serialised).not.toContain('7000')
    expect(serialised).not.toContain('8800')
  })

  it('still carries everything the buyer needs to decide (US-9)', () => {
    const view = toBuyerView(request(), 'en', 5)
    expect(view.ref).toBe('SPR-2608-0001')
    expect(view.lines[0].listPrice).toBe(10000)
    expect(view.lines[0].askedPrice).toBe(9000)
    expect(view.lines[0].offeredPrice).toBe(9250)
    expect(view.offerExpiresAt).toBe('2026-08-25T08:00:00Z')
  })
})

describe('AC-8.4 — internal state names never reach a buyer surface', () => {
  it('sends the buyer label, not the stored state', () => {
    const view = toBuyerView(request(), 'en', 5)
    expect(view.statusLabel).toBe('Counter received')
    expect(JSON.stringify(view)).not.toContain('countered_by_seller')
  })

  it('localises the label rather than sending a pre-rendered English string (FR-11.3)', () => {
    expect(toBuyerView(request(), 'ar', 5).statusLabel).toBe('وصل عرض مقابل')
  })

  it('EC-43 — sends no label at all for `lost`, which is seller analytics only', () => {
    const view = toBuyerView(request({ state: 'lost' }), 'en', 5)
    expect(view.statusLabel).toBeNull()
    expect(JSON.stringify(view)).not.toContain('lost')
  })
})

describe('AC-8.2 — the buyer view says when it is the buyer’s turn', () => {
  it('flags the two states that need the buyer', () => {
    expect(toBuyerView(request({ state: 'countered_by_seller' }), 'en', 5).actionRequired).toBe(true)
    expect(toBuyerView(request({ state: 'info_requested' }), 'en', 5).actionRequired).toBe(true)
    expect(toBuyerView(request({ state: 'submitted' }), 'en', 5).actionRequired).toBe(false)
  })
})

describe('the forbidden-key list stays honest', () => {
  it('catches a leak planted at depth', () => {
    const leaky = { a: { b: [{ marginPct: 22 }] } }
    expect(findSellerInternalKeys(leaky)).toEqual(['$.a.b[0].marginPct'])
  })

  it('covers every seller-internal field name used in the model', () => {
    for (const key of ['costSnapshot', 'floorSnapshot', 'marginPct', 'floorOverrideReason']) {
      expect(SELLER_INTERNAL_KEYS as readonly string[]).toContain(key)
    }
  })
})
