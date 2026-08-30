/**
 * Feature Flow Draft §8 — Inbox.
 *
 * "Use Inbox and/or Notifications to alert both buyer and seller whenever the other party
 * takes action. Inbox lets users see what has been accepted or rejected. Inbox categories:
 * Special Price Request, RFQ, Sent."
 */
import { describe, it, expect } from 'vitest'
import { buildInbox, threadCategory, unreadCount } from '@/rfq/domain/inbox'
import type { HistoryEvent, NegotiationRequest, RequestLine } from '@/rfq/domain/types'
import type { RequestState } from '@/rfq/domain/states'

let seq = 0
function ev(type: string, actor: 'buyer' | 'seller' | 'system', at: string): HistoryEvent {
  seq += 1
  return { id: `e${seq}`, type, actor, actorName: actor, at, params: {}, before: null, after: null, rule: null }
}

function line(route: 'case_1' | 'case_2', sku = 'HB-4471'): RequestLine {
  return {
    id: `l-${sku}-${route}`, sku, productName: { en: 'Milk', ar: 'حليب' }, route,
    quantity: 10, listPriceSnapshot: 10_000, askedPrice: route === 'case_1' ? 9_000 : null,
    offeredPrice: null, outcome: 'pending', proof: null, frequency: null, specialCredit: false, note: null,
    costSnapshot: null, floorSnapshot: null,
  }
}

function request(
  ref: string, state: RequestState, lines: RequestLine[], history: HistoryEvent[],
): NegotiationRequest {
  return {
    ref, tenantId: 't1', buyerId: 'b1', buyerName: 'Buyer', sellerId: 's1', sellerName: 'Seller',
    state, lines, rounds: 0, infoRequests: 0, submittedAt: '2026-08-20T09:00:00.000Z',
    slaDueAt: null, offerExpiresAt: null, infoReason: null, declineReason: null, history, comments: [],
    version: 1, previousRef: null, sellerResponses: [],
  }
}

const SPR = request('SPR-2608-0001', 'countered_by_seller', [line('case_1')], [
  ev('RequestSubmitted', 'buyer', '2026-08-20T09:00:00.000Z'),
  ev('RequestViewed', 'seller', '2026-08-20T10:00:00.000Z'),
  ev('SellerResponded', 'seller', '2026-08-20T11:00:00.000Z'),
])

const RFQ = request('SPR-2608-0002', 'submitted', [line('case_2', 'HB-7788')], [
  ev('RequestSubmitted', 'buyer', '2026-08-20T08:00:00.000Z'),
])

describe('§1 — the route decides the category', () => {
  it('files a thread with a priced ask under Special Price Request', () => {
    expect(threadCategory(SPR)).toBe('special_price')
  })

  it('files a thread with no priced ask under RFQ', () => {
    expect(threadCategory(RFQ)).toBe('rfq')
  })

  it('files a mixed thread under Special Price Request, the stronger of the two', () => {
    const mixed = request('SPR-3', 'submitted', [line('case_1'), line('case_2', 'HB-7788')], [])
    expect(threadCategory(mixed)).toBe('special_price')
  })
})

describe('§8 — the three categories partition the log', () => {
  it('puts what I did in Sent and what they did in the feature category', () => {
    const buyer = buildInbox([SPR], 'buyer')
    const sent = buyer.filter((i) => i.category === 'sent').map((i) => i.event.type)
    const incoming = buyer.filter((i) => i.category === 'special_price').map((i) => i.event.type)
    expect(sent).toEqual(['RequestSubmitted'])
    expect(incoming).toEqual(['SellerResponded'])
  })

  it('reads the same log from the other side, with the categories swapped', () => {
    const seller = buildInbox([SPR], 'seller')
    expect(seller.filter((i) => i.category === 'sent').map((i) => i.event.type)).toEqual(['SellerResponded'])
    expect(seller.filter((i) => i.category === 'special_price').map((i) => i.event.type)).toEqual(['RequestSubmitted'])
  })

  it('never files one event in two categories', () => {
    const items = buildInbox([SPR, RFQ], 'buyer')
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length)
  })

  it('does not tell either party that the request was opened', () => {
    expect(buildInbox([SPR], 'buyer').some((i) => i.event.type === 'RequestViewed')).toBe(false)
  })
})

describe('§8 — "lets users see what has been accepted or rejected"', () => {
  it('names the outcome on the row', () => {
    const accepted = request('SPR-4', 'accepted', [line('case_1')], [ev('RequestAccepted', 'seller', '2026-08-20T12:00:00.000Z')])
    const declined = request('SPR-5', 'declined', [line('case_1')], [ev('RequestDeclined', 'seller', '2026-08-20T12:00:00.000Z')])
    expect(buildInbox([accepted], 'buyer')[0].outcome).toBe('accepted')
    expect(buildInbox([declined], 'buyer')[0].outcome).toBe('rejected')
  })
})

describe('unread', () => {
  it('marks the latest move by the other party when the thread now waits on me', () => {
    const buyer = buildInbox([SPR], 'buyer')
    expect(unreadCount(buyer)).toBe(1)
    expect(buyer.find((i) => i.unread)?.event.type).toBe('SellerResponded')
  })

  it('marks nothing for the party whose move it is not', () => {
    // SPR is countered_by_seller — the buyer's turn, so the seller has nothing waiting.
    expect(unreadCount(buildInbox([SPR], 'seller'))).toBe(0)
  })

  it('never marks my own action unread', () => {
    expect(buildInbox([RFQ], 'buyer').every((i) => !i.unread)).toBe(true)
  })
})

describe('the actor boundary holds — FR-3.2', () => {
  it('keeps a seller-only state off the buyer\'s inbox entirely', () => {
    const lost = request('SPR-6', 'lost', [line('case_1')], [ev('RequestDeclined', 'seller', '2026-08-20T12:00:00.000Z')])
    expect(buildInbox([lost], 'buyer')).toEqual([])
    expect(buildInbox([lost], 'seller')).toHaveLength(1)
  })

  it('leaves an unsent draft out of both inboxes', () => {
    const draft = request('SPR-7', 'draft', [line('case_1')], [ev('RequestSubmitted', 'buyer', '2026-08-20T12:00:00.000Z')])
    expect(buildInbox([draft], 'buyer')).toEqual([])
    expect(buildInbox([draft], 'seller')).toEqual([])
  })
})

describe('ordering', () => {
  it('puts the most recent event first, across threads', () => {
    const items = buildInbox([RFQ, SPR], 'buyer')
    expect(items.map((i) => i.at)).toEqual([...items.map((i) => i.at)].sort().reverse())
    expect(items[0].event.type).toBe('SellerResponded')
  })
})
