/**
 * User flows, one per PRD user story, for the Special Price Request & RFQ feature.
 *
 * Drawn from docs/HIGHBASE-Special-Price-RFQ-PRD.md as written. Where the prototype has
 * since moved past the PRD, the flow still shows the PRD and carries a `divergence` note —
 * the document is what engineering will estimate against, so it is what gets drawn.
 *
 * Node `actor` is the load-bearing encoding: it says who acts at that step, so a handoff
 * between buyer and seller reads as a colour change rather than something to infer. That
 * is G3 ("both parties always know whose turn it is") carried by the picture.
 */

export type Actor = 'buyer' | 'seller' | 'system' | 'either'
export type NodeKind = 'start' | 'step' | 'decision' | 'end' | 'stop'
export type Group = 'buyer' | 'seller' | 'cross'

export interface FlowNode {
  id: string
  col: number
  row: number
  kind: NodeKind
  actor: Actor
  label: string
  /** Short PRD reference, rendered small beneath the label. */
  ref?: string
}

export interface FlowEdge {
  from: string
  to: string
  /** A word or three. Anything longer belongs in a node. */
  label?: string
}

export interface Flow {
  id: string
  group: Group
  phase: 'P1' | 'P2'
  title: string
  /** The user story in one sentence, used as the figure caption. */
  caption: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  divergence?: string
}

export const FLOWS: Flow[] = [
  {
    id: 'US-1', group: 'buyer', phase: 'P1',
    title: 'Discover that negotiation is possible',
    caption: 'A buyer sees a way to ask for a better price on the product card, without being told by a sales rep.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'buyer', label: 'Opens a product card' },
      { id: 'b', col: 1, row: 0, kind: 'decision', actor: 'system', label: 'SKU eligible?', ref: 'FR-2.1' },
      { id: 'c', col: 2, row: 1, kind: 'stop', actor: 'system', label: 'No entry point rendered at all', ref: 'AC-1.3' },
      { id: 'd', col: 2, row: 0, kind: 'decision', actor: 'system', label: 'Request already open?' },
      { id: 'e', col: 3, row: 1, kind: 'end', actor: 'buyer', label: '“View my request” deep-links to it', ref: 'AC-1.5' },
      { id: 'f', col: 3, row: 0, kind: 'step', actor: 'buyer', label: 'Action shown beneath the price', ref: 'AC-1.1' },
      { id: 'g', col: 4, row: 0, kind: 'end', actor: 'buyer', label: 'Tier ladder visible · flow opens', ref: 'AC-1.4' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c', label: 'no' }, { from: 'b', to: 'd', label: 'yes' },
      { from: 'd', to: 'e', label: 'yes' }, { from: 'd', to: 'f', label: 'no' }, { from: 'f', to: 'g' },
    ],
  },
  {
    id: 'US-2', group: 'buyer', phase: 'P1',
    title: 'State quantity before price',
    caption: 'Quantity comes first, so the seller answers the question the buyer is actually asking — is this cheaper at my volume?',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'buyer', label: 'Request form opens' },
      { id: 'b', col: 1, row: 0, kind: 'step', actor: 'buyer', label: 'Enters quantity' },
      { id: 'c', col: 2, row: 0, kind: 'decision', actor: 'system', label: 'Valid and ≥ minimum?' },
      { id: 'd', col: 3, row: 1, kind: 'stop', actor: 'system', label: 'Blocked · minimum stated numerically', ref: 'AC-2.3 · AC-2.5' },
      { id: 'e', col: 3, row: 0, kind: 'decision', actor: 'system', label: 'Tier covers this quantity?' },
      { id: 'f', col: 4, row: 1, kind: 'step', actor: 'system', label: 'Tier price shown inline' },
      { id: 'g', col: 5, row: 1, kind: 'end', actor: 'buyer', label: '“Use this price” · no request created', ref: 'AC-2.2' },
      { id: 'h', col: 4, row: 0, kind: 'end', actor: 'buyer', label: 'Continues to the route choice' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd', label: 'no' },
      { from: 'c', to: 'e', label: 'yes' }, { from: 'e', to: 'f', label: 'yes' }, { from: 'f', to: 'g' },
      { from: 'e', to: 'h', label: 'no' },
    ],
  },
  {
    id: 'US-3', group: 'buyer', phase: 'P1',
    title: 'Choose the route explicitly',
    caption: 'The buyer picks between matching a price and asking for a quote, and never guesses why a field is unavailable.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'system', label: 'Quantity accepted' },
      { id: 'b', col: 1, row: 0, kind: 'decision', actor: 'system', label: 'Phase 2 enabled?' },
      { id: 'c', col: 2, row: 1, kind: 'step', actor: 'buyer', label: 'Only the quote route exists', ref: 'AC-3.3' },
      { id: 'd', col: 2, row: 0, kind: 'decision', actor: 'buyer', label: 'Which route?', ref: 'AC-3.1' },
      { id: 'e', col: 3, row: 0, kind: 'end', actor: 'buyer', label: 'Case 1 fields · price and proof' },
      { id: 'f', col: 4, row: 1, kind: 'end', actor: 'buyer', label: 'Case 2 fields · quantity and note' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c', label: 'no' }, { from: 'b', to: 'd', label: 'yes' },
      { from: 'd', to: 'e', label: 'match' }, { from: 'd', to: 'f', label: 'quote' }, { from: 'c', to: 'f' },
    ],
    divergence: 'AC-3.2 requires no route preselected, so progression is blocked until the buyer chooses. The prototype now defaults to “I have a price to match”, so there is no unchosen state.',
  },
  {
    id: 'US-4', group: 'buyer', phase: 'P2',
    title: 'Submit a target price with proof',
    caption: 'A target price backed by an invoice, so the ask carries evidence without a phone call.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'buyer', label: 'Target price and supplier entered' },
      { id: 'b', col: 1, row: 0, kind: 'step', actor: 'buyer', label: 'Attaches invoice, quote or photo', ref: 'FR-7.1' },
      { id: 'c', col: 2, row: 0, kind: 'decision', actor: 'system', label: 'Extraction available?' },
      { id: 'd', col: 3, row: 1, kind: 'step', actor: 'system', label: 'Flagged for manual seller review', ref: 'EC-27 · AC-4.7' },
      { id: 'e', col: 3, row: 0, kind: 'step', actor: 'system', label: 'Extracted fields shown to confirm', ref: 'AC-4.3' },
      { id: 'f', col: 4, row: 0, kind: 'decision', actor: 'system', label: 'Auto-checks pass?', ref: 'FR-7.3' },
      { id: 'g', col: 5, row: 1, kind: 'step', actor: 'buyer', label: 'Warning names the failed check', ref: 'AC-4.5' },
      { id: 'h', col: 6, row: 0, kind: 'end', actor: 'buyer', label: 'Line ready to send · may submit flagged' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd', label: 'no' },
      { from: 'c', to: 'e', label: 'yes' }, { from: 'd', to: 'f' }, { from: 'e', to: 'f' },
      { from: 'f', to: 'g', label: 'fail' }, { from: 'f', to: 'h', label: 'pass' }, { from: 'g', to: 'h' },
    ],
  },
  {
    id: 'US-5', group: 'buyer', phase: 'P1',
    title: 'Ask for a quote without proof',
    caption: 'The buyer asks the seller to price a volume when there is no competing price to cite.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'buyer', label: 'Selects the quote route' },
      { id: 'b', col: 1, row: 0, kind: 'step', actor: 'system', label: 'Quantity pre-filled from US-2', ref: 'AC-5.1' },
      { id: 'c', col: 2, row: 0, kind: 'step', actor: 'buyer', label: 'Picks frequency from a fixed list', ref: 'AC-5.2' },
      { id: 'd', col: 3, row: 0, kind: 'step', actor: 'buyer', label: 'Optional note, up to 500 characters', ref: 'AC-5.3' },
      { id: 'e', col: 4, row: 0, kind: 'end', actor: 'system', label: 'No upload offered on this route', ref: 'AC-5.4' },
    ],
    edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd' }, { from: 'd', to: 'e' }],
  },
  {
    id: 'US-6', group: 'buyer', phase: 'P1',
    title: 'Build one request from several products',
    caption: 'Several SKUs join one request, so the buyer gets one decision on one basket instead of five negotiations.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'buyer', label: 'Line completed' },
      { id: 'b', col: 1, row: 0, kind: 'decision', actor: 'buyer', label: 'Add another item?', ref: 'AC-6.1' },
      { id: 'c', col: 2, row: 0, kind: 'step', actor: 'buyer', label: 'Back to the marketplace · draft kept' },
      { id: 'd', col: 3, row: 0, kind: 'decision', actor: 'system', label: 'Same seller?' },
      { id: 'e', col: 4, row: 1, kind: 'stop', actor: 'system', label: 'Prompted to start a second request', ref: 'AC-6.4' },
      { id: 'f', col: 4, row: 0, kind: 'decision', actor: 'system', label: '20 lines or fewer?' },
      { id: 'g', col: 5, row: 1, kind: 'stop', actor: 'system', label: 'Blocked · the limit is stated', ref: 'AC-6.5' },
      { id: 'h', col: 5, row: 0, kind: 'step', actor: 'system', label: 'Indicator shows N items in request', ref: 'AC-6.2' },
      { id: 'i', col: 2, row: 2, kind: 'end', actor: 'buyer', label: 'Goes to review' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c', label: 'yes' }, { from: 'b', to: 'i', label: 'no' },
      { from: 'c', to: 'd' }, { from: 'd', to: 'e', label: 'no' }, { from: 'd', to: 'f', label: 'yes' },
      { from: 'f', to: 'g', label: 'no' }, { from: 'f', to: 'h', label: 'yes' }, { from: 'h', to: 'b' },
    ],
    divergence: 'The prototype removed “Add another item”, so a request is effectively one line. Multi-line drafts arrive only through Re-request.',
  },
  {
    id: 'US-7', group: 'buyer', phase: 'P1',
    title: 'Review before submitting',
    caption: 'Original versus asked across the whole request, so the buyer knows what they are asking for before sending it.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'buyer', label: 'Opens review' },
      { id: 'b', col: 1, row: 0, kind: 'step', actor: 'system', label: 'Lines listed · list and asked totals', ref: 'AC-7.1 · AC-7.2' },
      { id: 'c', col: 2, row: 0, kind: 'decision', actor: 'buyer', label: 'Remove a line?' },
      { id: 'd', col: 3, row: 1, kind: 'decision', actor: 'system', label: 'Any lines left?' },
      { id: 'e', col: 4, row: 1, kind: 'stop', actor: 'system', label: 'Send blocked · stays a draft', ref: 'AC-7.4' },
      { id: 'f', col: 3, row: 0, kind: 'step', actor: 'buyer', label: 'Send request' },
      { id: 'g', col: 4, row: 0, kind: 'decision', actor: 'system', label: 'Draft already submitted?' },
      { id: 'h', col: 5, row: 2, kind: 'end', actor: 'system', label: 'Same reference returned · no duplicate', ref: 'AC-7.6 · EC-2' },
      { id: 'i', col: 5, row: 0, kind: 'end', actor: 'buyer', label: 'Confirmation · SLA and reference', ref: 'AC-7.5' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd', label: 'yes' },
      { from: 'c', to: 'f', label: 'no' }, { from: 'd', to: 'e', label: 'none' }, { from: 'd', to: 'f', label: 'some' },
      { from: 'f', to: 'g' }, { from: 'g', to: 'h', label: 'yes' }, { from: 'g', to: 'i', label: 'no' },
    ],
    divergence: 'The prototype has no separate review step. Its totals and line list sit inside the single request form, so AC-7.1/7.2 hold but the step itself is gone.',
  },
  {
    id: 'US-8', group: 'buyer', phase: 'P1',
    title: 'See where every request stands',
    caption: 'A list with unambiguous statuses, so the buyer knows which requests need them.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'buyer', label: 'Opens My requests' },
      { id: 'b', col: 1, row: 0, kind: 'step', actor: 'system', label: 'Buyer labels rendered, never state names', ref: 'FR-3.2 · AC-8.4' },
      { id: 'c', col: 2, row: 0, kind: 'decision', actor: 'system', label: 'Needs the buyer?' },
      { id: 'd', col: 3, row: 1, kind: 'step', actor: 'buyer', label: 'Sorted to top, visually distinct', ref: 'AC-8.2' },
      { id: 'e', col: 3, row: 0, kind: 'step', actor: 'buyer', label: 'Listed with SLA or expiry countdown' },
      { id: 'f', col: 4, row: 0, kind: 'end', actor: 'buyer', label: 'Filters by status and seller · searches', ref: 'AC-8.3' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd', label: 'yes' },
      { from: 'c', to: 'e', label: 'no' }, { from: 'd', to: 'f' }, { from: 'e', to: 'f' },
    ],
  },
  {
    id: 'US-9', group: 'buyer', phase: 'P1',
    title: 'Compare three numbers, line by line',
    caption: 'Original, asked and offered side by side, so the buyer can decide in one screen.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'buyer', label: 'Opens a countered request' },
      { id: 'b', col: 1, row: 0, kind: 'step', actor: 'system', label: 'Three columns per line', ref: 'AC-9.1' },
      { id: 'c', col: 2, row: 0, kind: 'decision', actor: 'system', label: 'Line route?' },
      { id: 'd', col: 3, row: 1, kind: 'step', actor: 'system', label: 'Quote line shows “—”, never a guess', ref: 'AC-9.2' },
      { id: 'e', col: 3, row: 0, kind: 'decision', actor: 'system', label: 'Offer expired?' },
      { id: 'f', col: 4, row: 1, kind: 'stop', actor: 'buyer', label: 'Actions disabled · Re-request offered', ref: 'AC-9.6' },
      { id: 'g', col: 4, row: 0, kind: 'end', actor: 'buyer', label: 'Totals, saving and countdown shown', ref: 'AC-9.3 · AC-9.5' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd', label: 'quote' },
      { from: 'c', to: 'e', label: 'priced' }, { from: 'd', to: 'e' }, { from: 'e', to: 'f', label: 'yes' },
      { from: 'e', to: 'g', label: 'no' },
    ],
  },
  {
    id: 'US-10', group: 'buyer', phase: 'P1',
    title: 'Accept, counter or decline',
    caption: 'The buyer acts on the seller’s offer, so the negotiation reaches an end.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'system', label: 'Counter received' },
      { id: 'b', col: 1, row: 0, kind: 'decision', actor: 'buyer', label: 'Buyer decides', ref: 'AC-10.1' },
      { id: 'c', col: 2, row: 0, kind: 'step', actor: 'buyer', label: 'Accepts · binding from here', ref: 'AC-10.7' },
      { id: 'd', col: 3, row: 0, kind: 'end', actor: 'system', label: 'Order created at agreed prices', ref: 'FR-4.7' },
      { id: 'e', col: 2, row: 1, kind: 'decision', actor: 'system', label: 'Rounds remaining?', ref: 'FR-3.4c' },
      { id: 'f', col: 3, row: 1, kind: 'end', actor: 'seller', label: 'Round +1 · SLA restarts · seller’s turn', ref: 'AC-10.5' },
      { id: 'g', col: 4, row: 2, kind: 'stop', actor: 'system', label: 'Counter withdrawn · “Maximum 5 rounds”', ref: 'AC-10.4' },
      { id: 'h', col: 2, row: 2, kind: 'step', actor: 'buyer', label: 'Declines through a confirmation', ref: 'AC-10.6' },
      { id: 'i', col: 3, row: 2, kind: 'end', actor: 'system', label: 'Declined · items stay at list price' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c', label: 'accept' }, { from: 'c', to: 'd' },
      { from: 'b', to: 'e', label: 'counter' }, { from: 'e', to: 'f', label: 'yes' }, { from: 'e', to: 'g', label: 'no' },
      { from: 'b', to: 'h', label: 'decline' }, { from: 'h', to: 'i' },
    ],
  },
  {
    id: 'US-11', group: 'buyer', phase: 'P2',
    title: 'Respond to a request for more information',
    caption: 'The buyer fixes rejected proof rather than starting over, so a bad photo does not cost them the price.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'seller', label: 'Seller asks for more information' },
      { id: 'b', col: 1, row: 0, kind: 'step', actor: 'system', label: 'Status → Action needed · SLA stops', ref: 'AC-17.3' },
      { id: 'c', col: 2, row: 0, kind: 'decision', actor: 'buyer', label: 'Responds within 72 h?', ref: 'FR-3.4d' },
      { id: 'd', col: 3, row: 1, kind: 'stop', actor: 'system', label: 'Expired · buyer notified', ref: 'AC-11.4' },
      { id: 'e', col: 3, row: 0, kind: 'step', actor: 'buyer', label: 'Replaces file or corrects fields', ref: 'AC-11.2' },
      { id: 'f', col: 4, row: 0, kind: 'end', actor: 'seller', label: 'SLA restarts · round NOT incremented', ref: 'AC-11.3' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd', label: 'no' },
      { from: 'c', to: 'e', label: 'yes' }, { from: 'e', to: 'f' },
    ],
  },
  {
    id: 'US-12', group: 'buyer', phase: 'P1',
    title: 'Withdraw a request',
    caption: 'The buyer cancels a request they no longer need, so the seller is not working on something irrelevant.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'buyer', label: 'Opens a live request' },
      { id: 'b', col: 1, row: 0, kind: 'decision', actor: 'system', label: 'State allows withdraw?', ref: 'AC-12.1' },
      { id: 'c', col: 2, row: 1, kind: 'stop', actor: 'system', label: 'Never available after acceptance', ref: 'AC-12.3' },
      { id: 'd', col: 2, row: 0, kind: 'step', actor: 'buyer', label: 'Withdraws · confirms' },
      { id: 'e', col: 3, row: 0, kind: 'end', actor: 'system', label: 'Withdrawn · seller notified · SLA stops', ref: 'AC-12.2' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c', label: 'accepted' }, { from: 'b', to: 'd', label: 'live' }, { from: 'd', to: 'e' },
    ],
  },
  {
    id: 'US-13', group: 'buyer', phase: 'P1',
    title: 'See the history of a negotiation',
    caption: 'A complete record of what was said and offered, so there is no dispute about what was agreed.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'buyer', label: 'Opens a request' },
      { id: 'b', col: 1, row: 0, kind: 'decision', actor: 'buyer', label: 'Which panel?', ref: 'AC-13.1' },
      { id: 'c', col: 2, row: 0, kind: 'step', actor: 'buyer', label: 'Comments · threaded, with attachments' },
      { id: 'd', col: 2, row: 1, kind: 'step', actor: 'system', label: 'History · actor, time, before and after', ref: 'AC-13.2' },
      { id: 'e', col: 3, row: 1, kind: 'end', actor: 'system', label: 'Localised at render · editable by nobody', ref: 'AC-13.3 · AC-13.4' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c', label: 'comments' }, { from: 'b', to: 'd', label: 'history' }, { from: 'd', to: 'e' },
    ],
  },
  {
    id: 'US-22', group: 'buyer', phase: 'P1',
    title: 'Trust that a declined price is not a declined sale',
    caption: 'The buyer can still buy after a negotiation fails, so a failed negotiation does not cost them the goods.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'system', label: 'Declined, expired or withdrawn' },
      { id: 'b', col: 1, row: 0, kind: 'step', actor: 'system', label: 'No hold on stock, cart or order', ref: 'AC-22.2' },
      { id: 'c', col: 2, row: 0, kind: 'decision', actor: 'buyer', label: 'Buyer’s next move?' },
      { id: 'd', col: 3, row: 0, kind: 'end', actor: 'buyer', label: 'Buys at list price', ref: 'AC-22.1' },
      { id: 'e', col: 3, row: 1, kind: 'step', actor: 'buyer', label: 'Re-requests' },
      { id: 'f', col: 4, row: 1, kind: 'end', actor: 'system', label: 'New request linked · old one never reopened', ref: 'AC-22.3' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd', label: 'buy' },
      { from: 'c', to: 'e', label: 'try again' }, { from: 'e', to: 'f' },
    ],
  },

  {
    id: 'US-14', group: 'seller', phase: 'P1',
    title: 'Triage the queue without opening requests',
    caption: 'The queue shows margin impact, so the seller can decide most requests in seconds.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'seller', label: 'Opens the queue' },
      { id: 'b', col: 1, row: 0, kind: 'step', actor: 'system', label: 'Asked vs list, proof, SLA, rounds', ref: 'AC-14.1' },
      { id: 'c', col: 2, row: 0, kind: 'decision', actor: 'system', label: 'Cost configured?' },
      { id: 'd', col: 3, row: 1, kind: 'step', actor: 'system', label: 'Margin “—” with reason · row still shown', ref: 'EC-20 · AC-14.6' },
      { id: 'e', col: 3, row: 0, kind: 'step', actor: 'system', label: 'Margin colour-coded vs thresholds', ref: 'AC-14.2' },
      { id: 'f', col: 4, row: 0, kind: 'decision', actor: 'system', label: 'Under 4 h of SLA?' },
      { id: 'g', col: 5, row: 1, kind: 'step', actor: 'seller', label: 'Row visually escalated', ref: 'AC-14.5' },
      { id: 'h', col: 5, row: 0, kind: 'end', actor: 'seller', label: 'Decides from the row, or opens it' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd', label: 'no' },
      { from: 'c', to: 'e', label: 'yes' }, { from: 'd', to: 'f' }, { from: 'e', to: 'f' },
      { from: 'f', to: 'g', label: 'yes' }, { from: 'f', to: 'h', label: 'no' }, { from: 'g', to: 'h' },
    ],
  },
  {
    id: 'US-15', group: 'seller', phase: 'P1',
    title: 'Decide line by line',
    caption: 'The seller accepts some lines and counters others in the same request, instead of an all-or-nothing answer.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'seller', label: 'Opens the request' },
      { id: 'b', col: 1, row: 0, kind: 'step', actor: 'seller', label: 'Accept · Counter · Decline, per line', ref: 'AC-15.1' },
      { id: 'c', col: 2, row: 0, kind: 'step', actor: 'system', label: 'Margin recalculates under 300 ms', ref: 'AC-15.2' },
      { id: 'd', col: 3, row: 0, kind: 'decision', actor: 'system', label: 'Every line resolved?' },
      { id: 'e', col: 4, row: 2, kind: 'stop', actor: 'system', label: 'Send blocked · unresolved lines named', ref: 'AC-15.4' },
      { id: 'f', col: 4, row: 0, kind: 'decision', actor: 'system', label: 'Any line below floor?' },
      { id: 'g', col: 5, row: 1, kind: 'decision', actor: 'seller', label: 'Holds override permission?', ref: 'FR-10.3' },
      { id: 'h', col: 6, row: 2, kind: 'stop', actor: 'system', label: 'Send blocked · the floor is stated', ref: 'AC-15.5' },
      { id: 'i', col: 6, row: 1, kind: 'step', actor: 'seller', label: 'Reason mandatory and recorded' },
      { id: 'j', col: 5, row: 0, kind: 'step', actor: 'seller', label: 'Sets offer expiry · 7 days default', ref: 'AC-15.6' },
      { id: 'k', col: 7, row: 0, kind: 'end', actor: 'buyer', label: 'One response sent · buyer’s turn', ref: 'AC-15.3' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd' },
      { from: 'd', to: 'e', label: 'no' }, { from: 'd', to: 'f', label: 'yes' },
      { from: 'f', to: 'g', label: 'yes' }, { from: 'f', to: 'j', label: 'no' },
      { from: 'g', to: 'h', label: 'no' }, { from: 'g', to: 'i', label: 'yes' },
      { from: 'i', to: 'k' }, { from: 'j', to: 'k' },
    ],
  },
  {
    id: 'US-16', group: 'seller', phase: 'P2',
    title: 'Verify proof without opening a PDF',
    caption: 'The proof is summarised and pre-checked, so the seller is reading a badge rather than a document.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'seller', label: 'Opens a Case 1 line' },
      { id: 'b', col: 1, row: 0, kind: 'step', actor: 'system', label: 'File, extracted and typed values', ref: 'AC-16.1' },
      { id: 'c', col: 2, row: 0, kind: 'step', actor: 'system', label: 'Freshness · identity · duplicate', ref: 'FR-7.3' },
      { id: 'd', col: 3, row: 0, kind: 'decision', actor: 'system', label: 'Hash seen before?' },
      { id: 'e', col: 4, row: 1, kind: 'step', actor: 'system', label: 'Date only · no buyer identity disclosed', ref: 'FR-13.6 · EC-33' },
      { id: 'f', col: 5, row: 0, kind: 'end', actor: 'seller', label: 'Reads pass / warn / fail with reason', ref: 'AC-16.2' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd' },
      { from: 'd', to: 'e', label: 'yes' }, { from: 'd', to: 'f', label: 'no' }, { from: 'e', to: 'f' },
    ],
  },
  {
    id: 'US-17', group: 'seller', phase: 'P2',
    title: 'Send it back for better evidence',
    caption: 'The seller asks for better proof without declining, so an unreadable photo does not cost them the order.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'seller', label: 'Proof is unusable' },
      { id: 'b', col: 1, row: 0, kind: 'decision', actor: 'system', label: 'Fewer than 2 used?', ref: 'FR-3.4h' },
      { id: 'c', col: 2, row: 1, kind: 'stop', actor: 'system', label: 'Third blocked · a decision is required', ref: 'AC-17.5' },
      { id: 'd', col: 2, row: 0, kind: 'step', actor: 'seller', label: 'Picks a reason from a fixed list', ref: 'AC-17.2' },
      { id: 'e', col: 3, row: 0, kind: 'step', actor: 'system', label: 'State → info_requested · SLA stops' },
      { id: 'f', col: 4, row: 0, kind: 'end', actor: 'buyer', label: 'Buyer window starts · round NOT incremented', ref: 'AC-17.4' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c', label: 'no' }, { from: 'b', to: 'd', label: 'yes' },
      { from: 'd', to: 'e' }, { from: 'e', to: 'f' },
    ],
  },
  {
    /*
     * US-18 as written was "make an agreed price stick" — accept once, and the price
     * follows the buyer into next month. The PM's direction is order by order and price
     * matching, so that story is gone and this is what stands in its place: the seller
     * verifying a claim they cannot counter. The id is kept so the board still lines up
     * with the PRD's numbering, and the caption says what happened rather than pretending
     * the old flow was never there.
     */
    id: 'US-18', group: 'seller', phase: 'P1',
    title: 'Verify a price match they cannot counter',
    caption: 'Replaces "make an agreed price stick". Price matching made the buyer’s verified price binding, so the seller’s moves are match, ask for better evidence, or decline with a named reason — a price now settles one order and no more.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'buyer', label: 'Proved ask arrives · route case_1' },
      { id: 'b', col: 1, row: 0, kind: 'decision', actor: 'seller', label: 'Is the document good enough?', ref: 'FR-7.3' },
      { id: 'c', col: 2, row: 1, kind: 'step', actor: 'seller', label: 'Ask for better evidence · reason from a fixed list', ref: 'AC-17.2' },
      { id: 'd', col: 2, row: 0, kind: 'decision', actor: 'seller', label: 'Can they supply it at all?' },
      { id: 'e', col: 3, row: 1, kind: 'end', actor: 'seller', label: 'Declined · named reason, shown to the buyer' },
      { id: 'f', col: 3, row: 0, kind: 'step', actor: 'system', label: 'Below floor? Stated in red · never blocked' },
      { id: 'g', col: 4, row: 0, kind: 'end', actor: 'system', label: 'Matched · binds this order only' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c', label: 'no' }, { from: 'b', to: 'd', label: 'yes' },
      { from: 'd', to: 'e', label: 'no' }, { from: 'd', to: 'f', label: 'yes' }, { from: 'f', to: 'g' },
    ],
  },
  {
    id: 'US-19', group: 'seller', phase: 'P1',
    title: 'Not answer the ones the rules can answer',
    caption: 'Rules handle the obvious cases, so reps only see the requests that need judgement.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'buyer', label: 'Request submitted' },
      { id: 'b', col: 1, row: 0, kind: 'decision', actor: 'system', label: 'Below the floor, on the quote route?', ref: 'FR-3.4f' },
      { id: 'c', col: 2, row: 1, kind: 'end', actor: 'system', label: 'Auto-declined · no rule value disclosed', ref: 'AC-19.1 · AC-19.5' },
      { id: 'd', col: 2, row: 0, kind: 'decision', actor: 'system', label: 'Any failed proof check?' },
      { id: 'e', col: 3, row: 0, kind: 'decision', actor: 'system', label: 'Within auto-accept threshold?', ref: 'FR-3.4g' },
      { id: 'f', col: 4, row: 0, kind: 'end', actor: 'system', label: 'Auto-accepted · buyer told within a minute', ref: 'AC-19.2' },
      { id: 'g', col: 4, row: 2, kind: 'end', actor: 'seller', label: 'Enters the seller queue' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c', label: 'yes' }, { from: 'b', to: 'd', label: 'no' },
      { from: 'd', to: 'g', label: 'yes' }, { from: 'd', to: 'e', label: 'no' },
      { from: 'e', to: 'f', label: 'yes' }, { from: 'e', to: 'g', label: 'no' },
    ],
  },

  {
    id: 'US-20', group: 'cross', phase: 'P1',
    title: 'Know when something needs me',
    caption: 'Either party is notified when it is their turn, so nobody has to poll the dashboard.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'system', label: 'State transition commits' },
      { id: 'b', col: 1, row: 0, kind: 'step', actor: 'system', label: 'History written in the same transaction', ref: 'A4' },
      { id: 'c', col: 2, row: 0, kind: 'step', actor: 'system', label: 'Notification emitted asynchronously', ref: 'FR-9.5' },
      { id: 'd', col: 3, row: 0, kind: 'decision', actor: 'system', label: 'Delivery succeeds?' },
      { id: 'e', col: 4, row: 1, kind: 'step', actor: 'system', label: 'Retried · transition NOT rolled back', ref: 'EC-11 · AC-20.4' },
      { id: 'f', col: 5, row: 0, kind: 'end', actor: 'either', label: 'Reference, counterparty, action, deep link', ref: 'AC-20.2' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd' },
      { from: 'd', to: 'e', label: 'no' }, { from: 'd', to: 'f', label: 'yes' }, { from: 'e', to: 'f' },
    ],
  },
  {
    id: 'US-21', group: 'cross', phase: 'P1',
    title: 'Work in Arabic, on a phone',
    caption: 'The whole flow works in the buyer’s language on their device, so they can actually use it.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'either', label: 'Switches language mid-flow' },
      { id: 'b', col: 1, row: 0, kind: 'step', actor: 'system', label: 'Direction flips · layout mirrors', ref: 'AC-21.2' },
      { id: 'c', col: 2, row: 0, kind: 'step', actor: 'system', label: 'Entered data preserved', ref: 'AC-21.5' },
      { id: 'd', col: 3, row: 0, kind: 'decision', actor: 'system', label: 'Narrow viewport?' },
      { id: 'e', col: 4, row: 1, kind: 'step', actor: 'either', label: 'Camera and gallery upload offered', ref: 'AC-21.4' },
      { id: 'f', col: 5, row: 0, kind: 'end', actor: 'either', label: 'Whole flow operable at 360 px, EN and AR' },
    ],
    edges: [
      { from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd' },
      { from: 'd', to: 'e', label: 'yes' }, { from: 'd', to: 'f', label: 'no' }, { from: 'e', to: 'f' },
    ],
  },
  {
    id: 'US-23', group: 'cross', phase: 'P1',
    title: 'Adjudicate a dispute',
    caption: 'Support gets a complete, immutable timeline, so a dispute is settled without guessing.',
    nodes: [
      { id: 'a', col: 0, row: 0, kind: 'start', actor: 'either', label: 'Support opens a request' },
      { id: 'b', col: 1, row: 0, kind: 'step', actor: 'system', label: 'The view itself is logged', ref: 'AC-23.2' },
      { id: 'c', col: 2, row: 0, kind: 'step', actor: 'either', label: 'History, comments, files · read-only', ref: 'AC-23.1' },
      { id: 'd', col: 3, row: 0, kind: 'end', actor: 'either', label: 'Exports PDF or CSV · tenant time and UTC', ref: 'AC-23.3' },
    ],
    edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd' }],
  },
]

export const GROUPS: { id: Group; label: string; blurb: string }[] = [
  { id: 'buyer', label: 'Buyer', blurb: 'Creating a request in the marketplace, then tracking and deciding in the dashboard.' },
  { id: 'seller', label: 'Seller', blurb: 'Triage, line-by-line response, proof verification and the rules that answer requests automatically.' },
  { id: 'cross', label: 'Both parties', blurb: 'Notifications, localisation and dispute adjudication — flows that belong to neither side alone.' },
]

export const ACTOR_LABELS: Record<Actor, string> = {
  buyer: 'Buyer acts',
  seller: 'Seller acts',
  system: 'System acts',
  either: 'Either party · HIGHBASE staff',
}
