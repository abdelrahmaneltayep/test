/**
 * §6.8 item 1 — state machine completeness. Every transition in FR-3.3 is exercised, and
 * every transition *not* in the table is proven to be rejected with 409.
 */
import { describe, it, expect } from 'vitest'
import {
  STATES, STATE_META, TRANSITIONS, NON_TERMINAL_STATES,
  canTransition, attemptTransition, isTerminal, labelFor, routeOf,
  type RequestState,
} from '@/rfq/domain/states'

describe('FR-3.1 — exactly eleven states', () => {
  it('declares eleven and no more', () => {
    expect(STATES).toHaveLength(11)
    expect(new Set(STATES).size).toBe(11)
  })

  it('gives every state metadata', () => {
    for (const s of STATES) expect(STATE_META[s]).toBeDefined()
  })
})

/**
 * Price matching — the match route is a guarantee, so the seller's counter is not a move
 * it carries. The quote route is untouched: a quote guarantees nothing.
 */
describe('the match route carries no counter', () => {
  const REACH_COUNTER: RequestState[] = ['submitted', 'viewed', 'countered_by_buyer']

  it('lets the seller counter on the quote route, from every state that could', () => {
    for (const from of REACH_COUNTER) {
      expect(canTransition(from, 'countered_by_seller', 'seller', 'case_2')).toBe(true)
    }
  })

  it('refuses the same move on the match route', () => {
    for (const from of REACH_COUNTER) {
      expect(canTransition(from, 'countered_by_seller', 'seller', 'case_1')).toBe(false)
    }
  })

  it('rejects it with a 409 that names the route rather than the actor', () => {
    const result = attemptTransition('viewed', 'countered_by_seller', 'seller', 'case_1')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.status).toBe(409)
    expect(result.reason).toMatch(/case_1 route/)
  })

  it('leaves every other move on the match route alone', () => {
    expect(canTransition('viewed', 'accepted', 'seller', 'case_1')).toBe(true)
    expect(canTransition('viewed', 'declined', 'seller', 'case_1')).toBe(true)
    expect(canTransition('viewed', 'info_requested', 'seller', 'case_1')).toBe(true)
    expect(canTransition('submitted', 'withdrawn', 'buyer', 'case_1')).toBe(true)
    expect(canTransition('viewed', 'expired', 'system', 'case_1')).toBe(true)
  })

  it('asks about the route on exactly the counter rows and nowhere else', () => {
    const restricted = TRANSITIONS.filter((t) => t.routes !== undefined)
    expect(restricted).toHaveLength(3)
    expect(restricted.every((t) => t.to === 'countered_by_seller')).toBe(true)
  })

  // A guarantee is a claim about proved evidence, so a request only earns it when every
  // line brought some. One quote line and the whole request keeps the loop.
  it('reads the route off the lines, and a mixed request is a quote', () => {
    expect(routeOf([{ route: 'case_1' }])).toBe('case_1')
    expect(routeOf([{ route: 'case_1' }, { route: 'case_1' }])).toBe('case_1')
    expect(routeOf([{ route: 'case_1' }, { route: 'case_2' }])).toBe('case_2')
    expect(routeOf([])).toBe('case_2')
  })

  // Omitting the route asks "does this move exist at all", which is what the rest of the
  // suite means when it leaves the argument off.
  it('is route-blind when no route is given', () => {
    expect(canTransition('viewed', 'countered_by_seller', 'seller')).toBe(true)
  })
})

describe('FR-3.2 — dual labels', () => {
  it('renders a different label per actor where the table says so', () => {
    expect(labelFor('submitted', 'buyer', 'en')).toBe('Submitted')
    expect(labelFor('submitted', 'seller', 'en')).toBe('New')
    expect(labelFor('countered_by_seller', 'buyer', 'en')).toBe('Counter received')
    expect(labelFor('countered_by_seller', 'seller', 'en')).toBe('Countered')
    expect(labelFor('countered_by_buyer', 'buyer', 'en')).toBe('Countered')
    expect(labelFor('countered_by_buyer', 'seller', 'en')).toBe('Updated')
    expect(labelFor('info_requested', 'buyer', 'en')).toBe('Action needed')
    expect(labelFor('withdrawn', 'buyer', 'en')).toBe('Cancelled')
    expect(labelFor('withdrawn', 'seller', 'en')).toBe('Withdrawn')
  })

  it('hides draft from the seller and lost from the buyer', () => {
    expect(labelFor('draft', 'seller', 'en')).toBeNull()
    expect(labelFor('lost', 'buyer', 'en')).toBeNull()
    expect(labelFor('lost', 'seller', 'en')).toBe('Lost')
  })

  it('localises every visible label into Arabic (AC-21.1)', () => {
    for (const s of STATES) {
      const meta = STATE_META[s]
      if (meta.buyerLabel) expect(meta.buyerLabel.ar.length).toBeGreaterThan(0)
      if (meta.sellerLabel) expect(meta.sellerLabel.ar.length).toBeGreaterThan(0)
    }
  })

  it('never exposes an internal state name as a label', () => {
    for (const s of STATES) {
      expect(STATE_META[s].buyerLabel?.en).not.toBe(s)
      expect(STATE_META[s].sellerLabel?.en).not.toBe(s)
    }
  })

  it('names whose turn it is for every non-terminal state (G3)', () => {
    for (const s of NON_TERMINAL_STATES) expect(STATE_META[s].turn).not.toBeNull()
  })

  it('leaves no turn on a terminal state', () => {
    for (const s of STATES) if (isTerminal(s)) expect(STATE_META[s].turn).toBeNull()
  })
})

describe('FR-3.3 — permitted transitions', () => {
  it('allows submission only by the buyer, from draft', () => {
    expect(canTransition('draft', 'submitted', 'buyer')).toBe(true)
    expect(canTransition('draft', 'submitted', 'seller')).toBe(false)
  })

  it('allows the seller to open, respond, accept, decline and ask for info', () => {
    expect(canTransition('submitted', 'viewed', 'seller')).toBe(true)
    expect(canTransition('submitted', 'countered_by_seller', 'seller')).toBe(true)
    expect(canTransition('viewed', 'countered_by_seller', 'seller')).toBe(true)
    expect(canTransition('submitted', 'accepted', 'seller')).toBe(true)
    expect(canTransition('viewed', 'declined', 'seller')).toBe(true)
    expect(canTransition('countered_by_buyer', 'info_requested', 'seller')).toBe(true)
  })

  it('lets the system auto-accept and auto-decline (US-19)', () => {
    expect(canTransition('submitted', 'accepted', 'system')).toBe(true)
    expect(canTransition('submitted', 'declined', 'system')).toBe(true)
  })

  it('routes an information request back through countered_by_buyer (AC-11.3)', () => {
    expect(canTransition('info_requested', 'countered_by_buyer', 'buyer')).toBe(true)
    expect(canTransition('info_requested', 'accepted', 'buyer')).toBe(false)
  })

  it('lets the buyer accept, counter and decline a seller counter', () => {
    expect(canTransition('countered_by_seller', 'accepted', 'buyer')).toBe(true)
    expect(canTransition('countered_by_seller', 'countered_by_buyer', 'buyer')).toBe(true)
    expect(canTransition('countered_by_seller', 'declined', 'buyer')).toBe(true)
  })

  // Order by order: there is no template state left to reach, from anywhere.
  it('has no acceptance that writes the price forward', () => {
    expect(STATES).not.toContain('accepted_as_template')
    expect(TRANSITIONS.some((t) => t.trigger.includes('template'))).toBe(false)
  })

  it('offers withdraw in exactly the states AC-12.1 lists', () => {
    const withdrawable: RequestState[] = [
      'submitted', 'viewed', 'info_requested', 'countered_by_seller', 'countered_by_buyer',
    ]
    for (const s of withdrawable) expect(canTransition(s, 'withdrawn', 'buyer')).toBe(true)
    // AC-12.3 — never after acceptance.
    expect(canTransition('accepted', 'withdrawn', 'buyer')).toBe(false)
    // An unsent draft is discarded, not withdrawn.
    expect(canTransition('draft', 'withdrawn', 'buyer')).toBe(false)
  })

  it('expires every live state, and only by the system (FR-3.5)', () => {
    for (const s of NON_TERMINAL_STATES) {
      if (s === 'draft') continue
      expect(canTransition(s, 'expired', 'system')).toBe(true)
      expect(canTransition(s, 'expired', 'buyer')).toBe(false)
      expect(canTransition(s, 'expired', 'seller')).toBe(false)
    }
  })

  it('marks a request lost only from declined or expired, and only by the system (EC-43)', () => {
    expect(canTransition('declined', 'lost', 'system')).toBe(true)
    expect(canTransition('expired', 'lost', 'system')).toBe(true)
    expect(canTransition('accepted', 'lost', 'system')).toBe(false)
    expect(canTransition('declined', 'lost', 'seller')).toBe(false)
  })
})

describe('FR-3.3 — everything not in the table is 409', () => {
  it('rejects every unlisted (from, to) pair', () => {
    const permitted = new Set(TRANSITIONS.map((t) => `${t.from}→${t.to}`))
    let rejected = 0
    for (const from of STATES) {
      for (const to of STATES) {
        if (from === to) continue
        if (permitted.has(`${from}→${to}`)) continue
        const result = attemptTransition(from, to, 'buyer')
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.status).toBe(409)
        rejected += 1
      }
    }
    expect(rejected).toBeGreaterThan(0)
  })

  it('rejects a permitted transition attempted by the wrong actor, with a reason naming them', () => {
    const result = attemptTransition('submitted', 'viewed', 'buyer')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(409)
      expect(result.reason).toContain('buyer')
    }
  })

  it('never reopens a terminal request (AC-22.3)', () => {
    for (const from of STATES) {
      if (!isTerminal(from)) continue
      for (const to of STATES) {
        if (to === 'lost') continue
        expect(canTransition(from, to)).toBe(false)
      }
    }
  })

  it('guarantees every state reaches a terminal one (G5)', () => {
    // Reachability, not a direct edge: `draft` terminates only by being submitted first,
    // because an unsent draft is governed by the FR-2.8 retention window rather than by
    // the SLA clock. Every other live state has a direct escape.
    const reachesTerminal = (start: RequestState): boolean => {
      const seen = new Set<RequestState>([start])
      const queue: RequestState[] = [start]
      while (queue.length > 0) {
        const current = queue.shift() as RequestState
        if (isTerminal(current)) return true
        for (const t of TRANSITIONS.filter((x) => x.from === current)) {
          if (!seen.has(t.to)) { seen.add(t.to); queue.push(t.to) }
        }
      }
      return false
    }
    for (const s of STATES) expect(reachesTerminal(s)).toBe(true)

    for (const s of NON_TERMINAL_STATES) {
      if (s === 'draft') continue
      const escapes = TRANSITIONS.filter((t) => t.from === s && isTerminal(t.to))
      expect(escapes.length).toBeGreaterThan(0)
    }
  })
})
