/**
 * What the direction change did, as data.
 *
 * Everything here is prose — the claims that cannot be derived from the code. Anything
 * that *can* be derived (the state count, which transitions a route takes away, what the
 * auto-rules decide, the seller's actual screens) is read live from the domain modules by
 * MatchingApp, so this sheet cannot quietly go out of date with the product it describes.
 */

export interface Shift {
  dimension: string
  before: string
  after: string
  /** True where the two columns describe the same behaviour on the quote route. */
  quoteRouteUnchanged?: boolean
}

/** §1 — the direction, one row per thing that actually moved. */
export const SHIFTS: Shift[] = [
  {
    dimension: 'What the buyer sends',
    before: 'A target price with a document, or a request for a quote.',
    after: 'Unchanged. Both routes still ship, and the buyer still chooses which.',
    quoteRouteUnchanged: true,
  },
  {
    dimension: 'What the seller may answer',
    before: 'Accept · Counter · Decline · Ask for more information.',
    after: 'On a match: Match · Ask for more information · Decline. There is no counter, and no price input on the page.',
  },
  {
    dimension: 'Who decides the price',
    before: 'The seller, across up to five rounds of counters.',
    after: 'The buyer’s verified document, once the seller verifies it. Rounds still exist — on the quote route.',
  },
  {
    dimension: 'What the floor price does',
    before: 'Auto-declines the request before a person sees it, and blocks the seller from accepting.',
    after: 'Neither. It states the position in red, with the distance to it in money, and decides nothing.',
  },
  {
    dimension: 'What a decline says',
    before: 'Nothing. The buyer learns the outcome and not the reason.',
    after: 'A code from a controlled list plus a note, shown to the buyer verbatim.',
  },
  {
    dimension: 'What an accepted price binds',
    before: 'This order — or, with the second acceptance, the buyer’s price list going forward.',
    after: 'This order and no more. Order by order, per the PM.',
  },
]

export interface Piece {
  n: number
  title: string
  what: string
  why: string
  /** Where the behaviour is actually enforced, so a reviewer can go and check it. */
  enforced: string[]
}

export const PIECES: Piece[] = [
  {
    n: 1,
    title: 'The match route is a guarantee',
    what: 'A verified price wins. The seller cannot counter it, and neither the floor rule nor the floor check can refuse it on their own.',
    why: 'A guarantee that any of three separate mechanisms can silently overturn is not a guarantee. Two of those three were invisible to the buyer by design.',
    enforced: [
      'domain/states.ts — the three rows reaching countered_by_seller are scoped to case_2, so the reducer rejects a seller counter with a 409',
      'domain/rules.ts — FR-3.4f’s auto-decline is quote-route only; a below-floor match is queued for a person',
      'components/SellerDashboard.tsx — the queue confirmation no longer blocks a below-floor match',
    ],
  },
  {
    n: 2,
    title: 'A decline carries a named reason',
    what: 'A code from a controlled list and an optional note, mandatory on "other". Stored on the request, written into the history event in the same step as the transition, shown to the buyer in full.',
    why: 'The buyer arrived with evidence. "No" on its own is not an answer to evidence.',
    enforced: [
      'domain/types.ts — DeclineReason, and the field on NegotiationRequest',
      'store.ts — seller_responds carries it, and keeps it only where the request actually declined',
      'components/RequestDetail.tsx — DeclineDialog; the send button is dead until a reason is chosen',
    ],
  },
  {
    n: 3,
    title: 'The seller’s page is a verification screen',
    what: 'A verdict on the document, then the claim, then where matching leaves you — with the floor and the cost each carrying the distance to them and which side. The default move follows the verdict.',
    why: 'The page was built to answer "what price am I willing to give?". The guarantee settles that before the seller arrives; what is left is whether the claim is good.',
    enforced: [
      'components/RequestDetail.tsx — MatchVerification, above the submission rather than below it',
      'the same file — a failed automatic check promotes "Request more info" to the primary slot and steps matching down, never disabling it',
    ],
  },
]

/** What the change killed outright, and what the PRD still says about it. */
export const REMOVED = [
  { thing: 'accepted_as_template, and its four transitions', prd: 'FR-3.1 · AC-18.3' },
  { thing: 'The saved buyer price list, and the write that filled it', prd: 'FR-8.3 · FR-8.5 · FR-8.7' },
  { thing: '"Accept & apply as template", and the canCreateTemplate permission', prd: 'US-18 · AC-18.1' },
  { thing: 'The card pill that read "Agreed price until …", and the rule that hid the entry point on a covered SKU', prd: 'AC-18.4' },
  { thing: 'The seller’s counter on the match route', prd: 'FR-3.3 (written unconditionally)' },
  { thing: 'The floor auto-decline on the match route', prd: 'FR-3.4f · AC-19.1' },
  { thing: 'The floor block on an acceptance', prd: 'AC-15.5' },
]

/** Still with the PM. Recorded here because a change sheet that hides them is a sales deck. */
export const OPEN = [
  {
    q: 'Who absorbs a below-cost match?',
    detail: 'HB-2210 carries a 13.000 floor against an 11.600 cost. A verified ask under 11.600 is now matchable, and the screen says so in red before the rep confirms — but nothing decides whether the seller eats it, HIGHBASE subsidises it, or the guarantee has a floor of its own.',
  },
  {
    q: 'FR-3.4f is unreachable in Phase 1. Is that intended?',
    detail: 'The floor auto-decline only fires on a line carrying an asked price, and now only on the quote route — but AC-9.2 is explicit that a quote line names no price. The rule is live, tested and correct, and nothing in the shipped P1 shape can trigger it.',
  },
  {
    q: 'When may a verified match be refused at all?',
    detail: 'Answered "ignore now". The decline vocabulary is therefore a placeholder, shaped like AC-17.2’s and expected to be replaced. It is deliberately about the claim and the supply, never about the price.',
  },
  {
    q: 'What is the feature called now?',
    detail: 'With the RFQ route staying as is, this is price matching plus a quote route, and the two differ in every respect that matters — one is a guarantee, the other a negotiation.',
  },
]

/** The screens worth showing, and what each one is there to demonstrate. */
export const SCREENS = [
  {
    ref: 'SPR-2608-0001',
    label: 'A clean match',
    note: 'Every automatic check passed, and the ask sits above both floor and cost. Matching is the default move and the verdict says why.',
  },
  {
    ref: 'SPR-2608-0007',
    label: 'A match below the floor, on a stale document',
    note: 'The check failed, so the page leads with "Request more info" — but matching stays available and enabled, because the guarantee does not get to hide its own button. The floor is stated, not enforced.',
  },
  {
    ref: 'SPR-2608-0006',
    label: 'A quote — the route that did not change',
    note: 'Counter, the price field and the validity picker are all still here. A quote guarantees nothing, so nothing was taken away from it.',
  },
]
