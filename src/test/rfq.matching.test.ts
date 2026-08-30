/**
 * Price matching, at the reducer.
 *
 * The state-machine suite proves the match route has no counter row. This proves the
 * reducer honours it: a seller counter on a matched request is a genuine no-op, not a
 * hidden button, and a decline carries its named reason all the way into the record.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { reducer, initialState, type RfqState } from '@/rfq/store'
import type { LineOutcome } from '@/rfq/domain/types'

const NOW = new Date('2026-08-30T09:00:00Z')

function seeded(): RfqState {
  return initialState(NOW)
}

function find(state: RfqState, ref: string) {
  const r = state.requests.find((x) => x.ref === ref)
  if (!r) throw new Error(`no seeded request ${ref}`)
  return r
}

/** The seller's response, as the surfaces send it. */
function respond(
  state: RfqState, ref: string, outcome: Exclude<LineOutcome, 'pending'>,
  price: number | null, extra: Partial<Parameters<typeof reducer>[1]> = {},
): RfqState {
  const request = find(state, ref)
  return reducer(state, {
    type: 'seller_responds', ref,
    decisions: Object.fromEntries(request.lines.map((l) => [l.id, { outcome, price }])),
    validityDays: 7, overrideReason: null,
    ...extra,
  } as Parameters<typeof reducer>[1])
}

afterEach(() => { vi.restoreAllMocks() })

describe('the guarantee holds at the reducer, not just in the UI', () => {
  // SPR-2608-0007 is the seeded match awaiting verification; SPR-2608-0006 the seeded quote.
  it('refuses a seller counter on a matched request and changes nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const before = seeded()
    const after = respond(before, 'SPR-2608-0007', 'countered', 12_900)
    const r = find(after, 'SPR-2608-0007')
    expect(r.state).toBe('viewed')
    expect(r.lines[0].outcome).toBe('pending')
    expect(r.lines[0].offeredPrice).toBeNull()
    expect(r).toEqual(find(before, 'SPR-2608-0007'))
    // FR-3.3 — an unlisted transition is a 409, and it says why.
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/case_1 route/))
  })

  it('still lets the seller counter a quote', () => {
    const after = respond(seeded(), 'SPR-2608-0006', 'countered', 1_850)
    const r = find(after, 'SPR-2608-0006')
    expect(r.state).toBe('countered_by_seller')
    expect(r.lines[0].offeredPrice).toBe(1_850)
  })

  it('lets the seller match a price that sits below their floor', () => {
    const before = find(seeded(), 'SPR-2608-0007')
    // The fixture is the point of the test: proved, below floor, above cost.
    expect(before.lines[0].askedPrice).toBeLessThan(before.lines[0].floorSnapshot as number)
    expect(before.lines[0].askedPrice).toBeGreaterThan(before.lines[0].costSnapshot as number)

    const after = reducer(seeded(), { type: 'seller_accepts', ref: 'SPR-2608-0007' })
    const r = find(after, 'SPR-2608-0007')
    expect(r.state).toBe('accepted')
    expect(r.lines[0].offeredPrice).toBe(before.lines[0].askedPrice)
  })
})

describe('a decline carries its reason', () => {
  it('stores the code and the note, and writes them into the history', () => {
    const after = respond(seeded(), 'SPR-2608-0007', 'declined', null, {
      declineReason: { code: 'not_comparable', note: 'Different pack size.' },
    })
    const r = find(after, 'SPR-2608-0007')
    expect(r.state).toBe('declined')
    expect(r.declineReason).toEqual({ code: 'not_comparable', note: 'Different pack size.' })
    const last = r.history[r.history.length - 1]
    expect(last.type).toBe('RequestDeclinedWithReason')
    expect(last.params.reason).toBe('not_comparable')
    expect(last.params.note).toBe('Different pack size.')
  })

  it('leaves the reason off a response that did not decline', () => {
    const after = respond(seeded(), 'SPR-2608-0006', 'countered', 1_850, {
      declineReason: { code: 'cannot_supply', note: 'stale' },
    })
    expect(find(after, 'SPR-2608-0006').declineReason).toBeNull()
  })

  // FR-6.3 — the reason explains the answer; it never changes the price the line lands on.
  it('resolves the declined line at list price regardless of the reason', () => {
    const after = respond(seeded(), 'SPR-2608-0007', 'declined', null, {
      declineReason: { code: 'cannot_supply', note: '' },
    })
    const line = find(after, 'SPR-2608-0007').lines[0]
    expect(line.offeredPrice).toBe(line.listPriceSnapshot)
  })
})
