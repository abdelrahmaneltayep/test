/**
 * Feature Flow Draft §5 (MVP), §6, §7, §9, §10 — the order projection.
 *
 * These are the draft's own sentences, turned into assertions. The point of the module is
 * that the draft's order behaviour and the PRD's terminal-is-terminal negotiation can both
 * be true at once, so every case here also asserts what the negotiation is doing.
 */
import { describe, it, expect } from 'vitest'
import {
  makeOrderId, orderLinesFrom, orderOriginalTotal, orderSaving, orderTotal, viewOrder,
  type Order,
} from '@/rfq/domain/orders'
import type { LineOutcome, Minor, NegotiationRequest, Proof, RequestLine } from '@/rfq/domain/types'
import type { RequestState } from '@/rfq/domain/states'

const PROOF: Proof = {
  fileName: 'invoice.pdf', mimeType: 'application/pdf', sizeBytes: 1000, hash: 'h1',
  typed: { supplier: 'Gulf Foods', sku: 'HB-4471', unitPrice: 9_400, documentDate: '2026-08-08', currency: 'BHD' },
  extracted: null, extractionUnavailable: false, checks: [],
}

function line(overrides: Partial<RequestLine> = {}): RequestLine {
  return {
    id: 'l1', sku: 'HB-4471', productName: { en: 'Milk', ar: 'حليب' },
    route: 'case_1', quantity: 10, listPriceSnapshot: 10_000,
    askedPrice: 9_000, offeredPrice: null, outcome: 'pending' as LineOutcome,
    proofs: [], frequency: null, specialCredit: false, note: null, costSnapshot: 7_000, floorSnapshot: 8_000,
    ...overrides,
  }
}

function request(state: RequestState, lines: RequestLine[] = [line()]): NegotiationRequest {
  return {
    ref: 'SPR-2608-0001', tenantId: 't1',
    buyerId: 'b1', buyerName: 'Buyer', sellerId: 's1', sellerName: 'Seller',
    state, lines, rounds: 0, infoRequests: 0,
    submittedAt: '2026-08-20T09:00:00.000Z', slaDueAt: null, offerExpiresAt: null,
    infoReason: null, declineReason: null, history: [], comments: [], version: 1, previousRef: null, sellerResponses: [],
  }
}

function order(r: NegotiationRequest | null, resolution: Order['resolution'] = null): Order {
  return {
    id: 'ORD-2608-0001', buyerId: 'b1', buyerName: 'Buyer', sellerId: 's1', sellerName: 'Seller',
    placedAt: '2026-08-20T09:00:00.000Z',
    lines: r ? orderLinesFrom(r.lines) : [{ sku: 'HB-4471', productName: { en: 'Milk', ar: 'حليب' }, quantity: 10, originalUnitPrice: 10_000 }],
    requestRef: r?.ref ?? null,
    resolution,
  }
}

describe('§7 — "while awaiting the seller\'s response, the buyer sees no action except Cancel"', () => {
  for (const state of ['submitted', 'viewed', 'countered_by_buyer'] as RequestState[]) {
    it(`offers cancel and nothing else from ${state}`, () => {
      const r = request(state)
      const view = viewOrder(order(r), r)
      expect(view.status).toBe('pending')
      expect(view.awaiting).toBe('seller')
      expect(view.buyerActions).toEqual(['cancel'])
    })
  }

  it('shows the original price while the negotiation is unresolved', () => {
    const r = request('submitted')
    expect(viewOrder(order(r), r).prices['HB-4471']).toBe(10_000)
  })
})

describe('§6 — "If the seller Accepts as-is: buyer takes no action — order proceeds normally"', () => {
  it('goes straight to Final Orders at the accepted price with no buttons', () => {
    const r = request('accepted', [line({ outcome: 'accepted', offeredPrice: 9_000 })])
    const view = viewOrder(order(r), r)
    expect(view.status).toBe('final')
    expect(view.buyerActions).toEqual([])
    expect(view.inFinalOrders).toBe(true)
    expect(view.prices['HB-4471']).toBe(9_000)
  })

})

describe('§6/§7 — a Modify gives the buyer Accept and Cancel, on the modified price', () => {
  it('offers both actions against the seller\'s number', () => {
    const r = request('countered_by_seller', [line({ outcome: 'countered', offeredPrice: 9_600 })])
    const view = viewOrder(order(r), r)
    expect(view.status).toBe('pending')
    expect(view.awaiting).toBe('buyer')
    expect(view.buyerActions).toEqual(['confirm', 'cancel'])
    expect(view.prices['HB-4471']).toBe(9_600)
    expect(view.revertedToOriginal).toBe(false)
  })
})

describe('§5 MVP — "once rejected, the order returns to Pending status, with a cancel option still available"', () => {
  const r = request('declined', [line({ outcome: 'declined', offeredPrice: 10_000 })])

  it('returns the order to Pending rather than closing it', () => {
    expect(viewOrder(order(r), r).status).toBe('pending')
  })

  it('keeps cancel available, and §7 adds accepting what was sent', () => {
    expect(viewOrder(order(r), r).buyerActions).toEqual(['confirm', 'cancel'])
  })

  it('reverts the price to the original', () => {
    const view = viewOrder(order(r), r)
    expect(view.prices['HB-4471']).toBe(10_000)
    expect(view.revertedToOriginal).toBe(true)
  })

  it('leaves the negotiation itself terminal — PRD §6.6 Decision 2', () => {
    // The order is Pending again; the request it hangs off is not reopened.
    expect(r.state).toBe('declined')
  })
})

describe('an unanswered request that ran out of clock behaves like a reject', () => {
  it('leaves the order Pending at the original price with both actions', () => {
    const r = request('expired')
    const view = viewOrder(order(r), r)
    expect(view.status).toBe('pending')
    expect(view.revertedToOriginal).toBe(true)
    expect(view.buyerActions).toEqual(['confirm', 'cancel'])
  })
})

describe('the buyer\'s own decision is final', () => {
  it('cancels the order even if the seller later accepts', () => {
    const r = request('accepted', [line({ outcome: 'accepted', offeredPrice: 9_000 })])
    const view = viewOrder(order(r, { kind: 'cancelled', at: 'x', prices: {} }), r)
    expect(view.status).toBe('cancelled')
    expect(view.inFinalOrders).toBe(false)
    expect(view.buyerActions).toEqual([])
  })

  it('holds the price the order was confirmed at', () => {
    const r = request('countered_by_seller', [line({ outcome: 'countered', offeredPrice: 9_600 })])
    const view = viewOrder(order(r, { kind: 'confirmed', at: 'x', prices: { 'HB-4471': 9_600 } }), r)
    expect(view.status).toBe('final')
    expect(view.prices['HB-4471']).toBe(9_600)
    expect(view.buyerActions).toEqual([])
  })

  it('records a confirm after a reject as a confirm at the original price', () => {
    const r = request('declined', [line({ outcome: 'declined', offeredPrice: 10_000 })])
    const view = viewOrder(order(r, { kind: 'confirmed', at: 'x', prices: { 'HB-4471': 10_000 } }), r)
    expect(view.status).toBe('final')
    expect(view.revertedToOriginal).toBe(true)
  })
})

describe('§7 — withdrawing the negotiation cancels the order with it', () => {
  it('does not leave an orphan Pending order behind', () => {
    const r = request('withdrawn')
    expect(viewOrder(order(r), r).status).toBe('cancelled')
  })
})

describe('§9 — "Final Orders = standard orders, plus negotiated orders once approved"', () => {
  it('files a standard order as final with no negotiation provenance', () => {
    const view = viewOrder(order(null), null)
    expect(view.status).toBe('final')
    expect(view.negotiated).toBe(false)
    expect(view.hadProof).toBe(false)
    expect(view.inFinalOrders).toBe(true)
  })

  it('shows the old price against the accepted price', () => {
    const r = request('accepted', [line({ outcome: 'accepted', offeredPrice: 9_000 })])
    const o = order(r)
    const view = viewOrder(o, r)
    expect(orderOriginalTotal(o)).toBe(100_000)
    expect(orderTotal(o, view)).toBe(90_000)
    expect(orderSaving(o, view)).toBe(10_000)
  })

  it('reports no movement when a rejected order is confirmed at the original price', () => {
    const r = request('declined', [line({ outcome: 'declined', offeredPrice: 10_000 })])
    const o = order(r, { kind: 'confirmed', at: 'x', prices: { 'HB-4471': 10_000 } })
    expect(orderSaving(o, viewOrder(o, r))).toBe(0)
  })
})

describe('§10 — provenance is on the order', () => {
  it('reports whether an invoice or quote was submitted', () => {
    const withProof = request('accepted', [line({ outcome: 'accepted', offeredPrice: 9_000, proofs: [PROOF] })])
    const without = request('accepted', [line({ outcome: 'accepted', offeredPrice: 9_000 })])
    expect(viewOrder(order(withProof), withProof).hadProof).toBe(true)
    expect(viewOrder(order(without), without).hadProof).toBe(false)
  })

  it('marks every order that went through a negotiation', () => {
    const r = request('viewed')
    expect(viewOrder(order(r), r).negotiated).toBe(true)
  })
})

describe('money stays in minor units', () => {
  it('never produces a fractional total', () => {
    const r = request('countered_by_seller', [
      line({ id: 'a', quantity: 7, listPriceSnapshot: 1_333, offeredPrice: 1_111, outcome: 'countered' }),
    ])
    const o = order(r)
    const total: Minor = orderTotal(o, viewOrder(o, r))
    expect(Number.isInteger(total)).toBe(true)
    expect(total).toBe(7_777)
  })
})

describe('the order reference', () => {
  it('shares the shape of the negotiation reference (FR-1.10)', () => {
    expect(makeOrderId(new Date('2026-08-20T09:00:00Z'), 7)).toBe('ORD-2608-0007')
  })
})

describe('§5/§9 — a Final Order says how the price question was settled', () => {
  // Price matching: a settlement on the match route is a guarantee honoured, and says so.
  it('reads matched where the match route settled at the proved price', () => {
    const r = request('accepted', [line({ route: 'case_1', outcome: 'accepted', offeredPrice: 9_000 })])
    expect(viewOrder(order(r), r).negotiation).toBe('matched')
  })

  it('reads negotiated where the quote route settled instead', () => {
    const r = request('accepted', [line({ route: 'case_2', outcome: 'accepted', offeredPrice: 9_000 })])
    expect(viewOrder(order(r), r).negotiation).toBe('negotiated')
  })

  /*
   * A counter the buyer took is a bargain, however good — they chose it, they were not owed
   * it. So it reads negotiated even though the request began on the match route, which is
   * the one case where the route alone would give the wrong answer.
   */
  it('reads negotiated where the seller countered and the buyer took that', () => {
    const r = request('countered_by_seller', [line({ outcome: 'countered', offeredPrice: 9_600 })])
    const view = viewOrder(order(r, { kind: 'confirmed', at: 'x', prices: { 'HB-4471': 9_600 } }), r)
    expect(view.negotiation).toBe('negotiated')
    expect(view.inFinalOrders).toBe(true)
  })

  // §9/§10 — an order standing at its original price carries the reason it does.
  it('carries the seller’s decline reason onto the order, and only where it declined', () => {
    const declined = request('declined', [line({ outcome: 'declined', offeredPrice: 10_000 })])
    declined.declineReason = { code: 'cannot_supply', note: 'Not at that volume.' }
    expect(viewOrder(order(declined), declined).declineReason)
      .toEqual({ code: 'cannot_supply', note: 'Not at that volume.' })

    const settled = request('accepted', [line({ outcome: 'accepted', offeredPrice: 9_000 })])
    settled.declineReason = { code: 'cannot_supply', note: 'stale' }
    expect(viewOrder(order(settled), settled).declineReason).toBeNull()
  })

  it('reads rejected where the seller declined, whether or not the buyer has answered', () => {
    const r = request('declined', [line({ outcome: 'declined', offeredPrice: 10_000 })])
    expect(viewOrder(order(r), r).negotiation).toBe('rejected')
    const confirmed = order(r, { kind: 'confirmed', at: 'x', prices: { 'HB-4471': 10_000 } })
    const view = viewOrder(confirmed, r)
    // §9 — the goods were bought. It belongs in Final Orders; the price simply did not move.
    expect(view.negotiation).toBe('rejected')
    expect(view.inFinalOrders).toBe(true)
    expect(orderSaving(confirmed, view)).toBe(0)
  })

  it('reads rejected where the clock ran out — the price never moved either', () => {
    const r = request('expired')
    expect(viewOrder(order(r), r).negotiation).toBe('rejected')
  })

  it('still reads rejected on an order the buyer cancelled after the rejection', () => {
    // The outcome is a fact about the negotiation, not about what the buyer did next.
    const r = request('declined', [line({ outcome: 'declined', offeredPrice: 10_000 })])
    const view = viewOrder(order(r, { kind: 'cancelled', at: 'x', prices: {} }), r)
    expect(view.negotiation).toBe('rejected')
    expect(view.status).toBe('cancelled')
  })

  it('reads open while the negotiation is still live', () => {
    for (const state of ['submitted', 'viewed', 'countered_by_buyer', 'info_requested', 'countered_by_seller'] as const) {
      expect(viewOrder(order(request(state)), request(state)).negotiation).toBe('open')
    }
  })

  it('reads null on a standard order — there was nothing to settle', () => {
    expect(viewOrder(order(null), null).negotiation).toBeNull()
  })
})
