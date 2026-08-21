/**
 * The two master flows: everything a buyer can hit, and everything a seller can hit.
 *
 * Laid out as vertical swimlanes rather than the left-to-right rails the per-story flows
 * use. A flow that handles every case runs to thirty-odd nodes; horizontally that is four
 * thousand pixels of scroll, and the handoffs — the thing these exist to show — end up off
 * screen from each other. Vertically the lane a node sits in *is* the actor, so a handoff
 * is a lane crossing you can see without reading a single label.
 *
 * Every branch traces to the PRD. Where a case is an edge case rather than a path the user
 * chooses, it is still drawn, because "handle all cases" is the brief.
 */

import type { Actor, NodeKind } from './flowsData'

export type Lane = 0 | 1 | 2 // Buyer · System · Seller

export interface LaneNode {
  id: string
  lane: Lane
  /** Two parallel tracks per lane, for branches that run alongside each other. */
  slot: 0 | 1
  row: number
  kind: NodeKind
  actor: Actor
  label: string
  ref?: string
}

export interface LaneEdge { from: string; to: string; label?: string }

export interface MasterFlow {
  id: string
  role: 'buyer' | 'seller'
  title: string
  caption: string
  nodes: LaneNode[]
  edges: LaneEdge[]
  /** Cases that are guarantees rather than paths — true everywhere, drawn nowhere. */
  alsoTrue: string[]
}

export const LANE_NAMES = ['Buyer', 'System', 'Seller'] as const
export const LANE_ACTORS: Actor[] = ['buyer', 'system', 'seller']

export const BUYER_FLOW: MasterFlow = {
  id: 'FLOW-B',
  role: 'buyer',
  title: 'Buyer — every case',
  caption:
    'From spotting a price worth challenging to an order, a decline, or a request that never gets answered. Every branch a buyer can end up on, including the ones the system decides for them.',
  nodes: [
    { id: 'b1', lane: 0, slot: 0, row: 0, kind: 'start', actor: 'buyer', label: 'Views a product card' },
    { id: 'b2', lane: 1, slot: 0, row: 1, kind: 'decision', actor: 'system', label: 'Eligible to negotiate?', ref: 'FR-2.1' },
    { id: 'b3', lane: 1, slot: 1, row: 2, kind: 'stop', actor: 'system', label: 'No entry point rendered', ref: 'AC-1.3' },
    { id: 'b4', lane: 1, slot: 0, row: 2, kind: 'decision', actor: 'system', label: 'Request already covers it?' },
    { id: 'b5', lane: 0, slot: 1, row: 3, kind: 'end', actor: 'buyer', label: 'Deep-links to that request', ref: 'AC-1.5' },
    { id: 'b6', lane: 0, slot: 0, row: 3, kind: 'step', actor: 'buyer', label: 'Enters quantity', ref: 'AC-2.1' },
    { id: 'b7', lane: 1, slot: 0, row: 4, kind: 'decision', actor: 'system', label: 'Meets the minimum?' },
    { id: 'b8', lane: 1, slot: 1, row: 5, kind: 'stop', actor: 'system', label: 'Blocked · minimum stated', ref: 'AC-2.3' },
    { id: 'b9', lane: 1, slot: 0, row: 5, kind: 'decision', actor: 'system', label: 'A tier already covers it?', ref: 'FR-2.3' },
    { id: 'b10', lane: 0, slot: 1, row: 6, kind: 'end', actor: 'buyer', label: 'Takes the tier · no request', ref: 'AC-2.2' },
    { id: 'b11', lane: 0, slot: 0, row: 6, kind: 'decision', actor: 'buyer', label: 'Which route?', ref: 'AC-3.1' },
    { id: 'b12', lane: 0, slot: 0, row: 7, kind: 'step', actor: 'buyer', label: 'Target price, supplier, proof', ref: 'AC-4.1' },
    { id: 'b13', lane: 0, slot: 1, row: 7, kind: 'step', actor: 'buyer', label: 'Quantity, frequency, note', ref: 'AC-5.1' },
    { id: 'b14', lane: 1, slot: 0, row: 8, kind: 'step', actor: 'system', label: 'Checked · if down, flagged', ref: 'FR-7.3 · EC-27' },
    { id: 'b15', lane: 0, slot: 0, row: 9, kind: 'decision', actor: 'buyer', label: 'Add another item?', ref: 'AC-6.1' },
    { id: 'b16', lane: 0, slot: 1, row: 10, kind: 'step', actor: 'buyer', label: 'Same seller · 20 lines max', ref: 'AC-6.4 · AC-6.5' },
    { id: 'b17', lane: 0, slot: 0, row: 10, kind: 'step', actor: 'buyer', label: 'Reviews totals · sends', ref: 'AC-7.2' },
    { id: 'b18', lane: 1, slot: 0, row: 11, kind: 'decision', actor: 'system', label: 'Ask below the floor?', ref: 'FR-3.4f' },
    { id: 'b19', lane: 1, slot: 1, row: 12, kind: 'end', actor: 'system', label: 'Auto-declined · nothing disclosed', ref: 'AC-19.5' },
    { id: 'b20', lane: 1, slot: 0, row: 12, kind: 'decision', actor: 'system', label: 'Auto-accept, checks clean?', ref: 'AC-19.4' },
    { id: 'b21', lane: 1, slot: 1, row: 13, kind: 'end', actor: 'system', label: 'Auto-accepted · order created', ref: 'AC-19.2' },
    { id: 'b22', lane: 2, slot: 0, row: 13, kind: 'step', actor: 'seller', label: 'Seller queue · SLA running', ref: 'FR-3.4a' },
    { id: 'b23', lane: 1, slot: 0, row: 14, kind: 'decision', actor: 'system', label: 'Seller answers in time?' },
    { id: 'b24', lane: 0, slot: 1, row: 14, kind: 'step', actor: 'buyer', label: 'Withdraws while waiting', ref: 'AC-12.2' },
    { id: 'b25', lane: 1, slot: 1, row: 15, kind: 'stop', actor: 'system', label: 'Expired unanswered', ref: 'FR-3.4a' },
    { id: 'b26', lane: 2, slot: 0, row: 15, kind: 'decision', actor: 'seller', label: 'What did the seller send?' },
    { id: 'b27', lane: 0, slot: 1, row: 16, kind: 'step', actor: 'buyer', label: 'Action needed · fixes proof', ref: 'AC-11.3' },
    { id: 'b28', lane: 1, slot: 1, row: 17, kind: 'end', actor: 'system', label: 'Accepted as asked · order created' },
    { id: 'b29', lane: 0, slot: 0, row: 16, kind: 'step', actor: 'buyer', label: 'Counter received · 3 columns', ref: 'AC-9.1' },
    { id: 'b30', lane: 0, slot: 0, row: 17, kind: 'decision', actor: 'buyer', label: 'Buyer decides', ref: 'AC-10.1' },
    { id: 'b31', lane: 0, slot: 0, row: 18, kind: 'step', actor: 'buyer', label: 'Accepts · binding', ref: 'AC-10.7' },
    { id: 'b32', lane: 2, slot: 1, row: 18, kind: 'decision', actor: 'seller', label: 'Rounds remaining?', ref: 'FR-3.4c' },
    { id: 'b33', lane: 1, slot: 0, row: 19, kind: 'end', actor: 'system', label: 'Order created at agreed prices', ref: 'FR-4.7' },
    { id: 'b34', lane: 2, slot: 0, row: 19, kind: 'step', actor: 'seller', label: 'Round +1 · seller’s turn', ref: 'AC-10.5' },
    { id: 'b35', lane: 2, slot: 1, row: 20, kind: 'stop', actor: 'system', label: 'Counter withdrawn · max 5', ref: 'AC-10.4' },
    { id: 'b36', lane: 0, slot: 0, row: 20, kind: 'step', actor: 'buyer', label: 'Declines · cost named first', ref: 'AC-10.6' },
    { id: 'b37', lane: 1, slot: 0, row: 21, kind: 'end', actor: 'system', label: 'Still purchasable at list price', ref: 'AC-22.1' },
    { id: 'b38', lane: 0, slot: 0, row: 22, kind: 'end', actor: 'buyer', label: 'Re-requests · new, linked', ref: 'AC-22.3' },
  ],
  edges: [
    { from: 'b1', to: 'b2' },
    { from: 'b2', to: 'b3', label: 'no' }, { from: 'b2', to: 'b4', label: 'yes' },
    { from: 'b4', to: 'b5', label: 'yes' }, { from: 'b4', to: 'b6', label: 'no' },
    { from: 'b6', to: 'b7' }, { from: 'b7', to: 'b8', label: 'no' }, { from: 'b8', to: 'b6', label: 're-enter' },
    { from: 'b7', to: 'b9', label: 'yes' },
    { from: 'b9', to: 'b10', label: 'yes' }, { from: 'b9', to: 'b11', label: 'no' },
    { from: 'b11', to: 'b12', label: 'match' }, { from: 'b11', to: 'b13', label: 'quote' },
    { from: 'b12', to: 'b14' }, { from: 'b14', to: 'b15' }, { from: 'b13', to: 'b15' },
    { from: 'b15', to: 'b16', label: 'yes' }, { from: 'b16', to: 'b6', label: 'next line' },
    { from: 'b15', to: 'b17', label: 'no' },
    { from: 'b17', to: 'b18' },
    { from: 'b18', to: 'b19', label: 'yes' }, { from: 'b18', to: 'b20', label: 'no' },
    { from: 'b20', to: 'b21', label: 'yes' }, { from: 'b20', to: 'b22', label: 'no' },
    { from: 'b22', to: 'b23' }, { from: 'b22', to: 'b24', label: 'withdraws' },
    { from: 'b23', to: 'b25', label: 'no' }, { from: 'b23', to: 'b26', label: 'yes' },
    { from: 'b26', to: 'b27', label: 'needs info' }, { from: 'b27', to: 'b23', label: 'SLA restarts' },
    { from: 'b26', to: 'b28', label: 'accepted' }, { from: 'b26', to: 'b29', label: 'countered' },
    { from: 'b29', to: 'b30' },
    { from: 'b30', to: 'b31', label: 'accept' }, { from: 'b31', to: 'b33' },
    { from: 'b30', to: 'b32', label: 'counter' },
    { from: 'b32', to: 'b34', label: 'yes' }, { from: 'b34', to: 'b23', label: 'seller’s turn' },
    { from: 'b32', to: 'b35', label: 'no' },
    { from: 'b30', to: 'b36', label: 'decline' },
    { from: 'b36', to: 'b37' }, { from: 'b19', to: 'b37' }, { from: 'b25', to: 'b37' }, { from: 'b24', to: 'b37' },
    { from: 'b37', to: 'b38', label: 'try again' },
  ],
  alsoTrue: [
    'Sending the same draft twice creates one request and returns the same reference (EC-2, AC-7.6).',
    'Every transition writes a history entry in the same transaction, and notification failure never rolls it back (A4, EC-11).',
    'No state on this flow places a hold on stock, cart or order creation (AC-22.2).',
    'Cost, margin, floor and rule values never appear in anything the buyer receives (FR-4.8, AC-19.5).',
    'The whole flow works in Arabic, right to left, at 360 px (FR-11).',
  ],
}

export const SELLER_FLOW: MasterFlow = {
  id: 'FLOW-S',
  role: 'seller',
  title: 'Seller — every case',
  caption:
    'From a request landing to a sent response and whatever the buyer does with it. Includes the requests the rules answer before a rep ever sees them, and the two ways a send gets blocked.',
  nodes: [
    { id: 's1', lane: 2, slot: 0, row: 0, kind: 'start', actor: 'seller', label: 'Request submitted to me' },
    { id: 's2', lane: 1, slot: 0, row: 1, kind: 'decision', actor: 'system', label: 'Ask below the floor?', ref: 'FR-3.4f' },
    { id: 's3', lane: 1, slot: 1, row: 2, kind: 'end', actor: 'system', label: 'Auto-declined · never queued', ref: 'AC-19.1' },
    { id: 's4', lane: 1, slot: 0, row: 2, kind: 'decision', actor: 'system', label: 'Auto-accept, checks clean?', ref: 'AC-19.4' },
    { id: 's5', lane: 1, slot: 1, row: 3, kind: 'end', actor: 'system', label: 'Auto-accepted · buyer told', ref: 'AC-19.2' },
    { id: 's6', lane: 2, slot: 0, row: 3, kind: 'step', actor: 'seller', label: 'Queued · asked vs list, rounds', ref: 'AC-14.1' },
    { id: 's7', lane: 1, slot: 0, row: 4, kind: 'decision', actor: 'system', label: 'Cost configured?' },
    { id: 's8', lane: 1, slot: 1, row: 5, kind: 'step', actor: 'system', label: 'Margin “—” · row still shown', ref: 'EC-20' },
    { id: 's9', lane: 1, slot: 0, row: 5, kind: 'step', actor: 'system', label: 'Margin banded vs thresholds', ref: 'AC-14.2' },
    { id: 's10', lane: 2, slot: 0, row: 6, kind: 'decision', actor: 'seller', label: 'Opens it before SLA ends?', ref: 'FR-3.4a' },
    { id: 's11', lane: 1, slot: 1, row: 7, kind: 'stop', actor: 'system', label: 'Expired · buyer notified', ref: 'FR-3.4a' },
    { id: 's12', lane: 2, slot: 0, row: 7, kind: 'decision', actor: 'seller', label: 'Line carries proof?' },
    { id: 's13', lane: 2, slot: 1, row: 8, kind: 'step', actor: 'seller', label: 'Panel · three checks, reasons', ref: 'AC-16.1' },
    { id: 's14', lane: 2, slot: 1, row: 9, kind: 'decision', actor: 'seller', label: 'Evidence usable?' },
    { id: 's15', lane: 1, slot: 1, row: 10, kind: 'decision', actor: 'system', label: 'Info requests left?', ref: 'FR-3.4h' },
    { id: 's16', lane: 1, slot: 0, row: 11, kind: 'stop', actor: 'system', label: 'Third blocked · decide now', ref: 'AC-17.5' },
    { id: 's17', lane: 2, slot: 1, row: 11, kind: 'step', actor: 'seller', label: 'Sends back with a reason', ref: 'AC-17.2' },
    { id: 's18', lane: 0, slot: 0, row: 12, kind: 'step', actor: 'buyer', label: 'Buyer fixes it · no round used', ref: 'AC-17.4' },
    { id: 's19', lane: 2, slot: 0, row: 13, kind: 'decision', actor: 'seller', label: 'Decision on each line', ref: 'AC-15.1' },
    { id: 's20', lane: 2, slot: 0, row: 14, kind: 'step', actor: 'seller', label: 'Accepts the asked price', ref: 'FR-6.1' },
    { id: 's21', lane: 2, slot: 1, row: 14, kind: 'step', actor: 'seller', label: 'Counters · margin live', ref: 'AC-15.2' },
    { id: 's22', lane: 2, slot: 1, row: 15, kind: 'step', actor: 'seller', label: 'Declines · resolves at list', ref: 'FR-6.3' },
    { id: 's23', lane: 1, slot: 0, row: 16, kind: 'decision', actor: 'system', label: 'Every line resolved?' },
    { id: 's24', lane: 1, slot: 1, row: 17, kind: 'stop', actor: 'system', label: 'Blocked · lines named', ref: 'AC-15.4' },
    { id: 's25', lane: 1, slot: 0, row: 17, kind: 'decision', actor: 'system', label: 'Any line below floor?' },
    { id: 's26', lane: 2, slot: 1, row: 18, kind: 'decision', actor: 'seller', label: 'Holds override right?', ref: 'FR-10.3' },
    { id: 's27', lane: 1, slot: 1, row: 19, kind: 'stop', actor: 'system', label: 'Blocked · floor stated', ref: 'AC-15.5' },
    { id: 's28', lane: 2, slot: 1, row: 20, kind: 'step', actor: 'seller', label: 'Reason mandatory, recorded' },
    { id: 's29', lane: 2, slot: 0, row: 19, kind: 'step', actor: 'seller', label: 'Sets expiry · 7 days default', ref: 'AC-15.6' },
    { id: 's30', lane: 0, slot: 0, row: 21, kind: 'step', actor: 'buyer', label: 'One response sent · buyer’s turn', ref: 'AC-15.3' },
    { id: 's31', lane: 0, slot: 0, row: 22, kind: 'decision', actor: 'buyer', label: 'What does the buyer do?' },
    { id: 's32', lane: 1, slot: 1, row: 23, kind: 'stop', actor: 'system', label: 'Offer expired unanswered', ref: 'FR-3.4b' },
    { id: 's33', lane: 0, slot: 1, row: 23, kind: 'step', actor: 'buyer', label: 'Counters back · round +1', ref: 'AC-10.5' },
    { id: 's34', lane: 2, slot: 0, row: 24, kind: 'decision', actor: 'seller', label: 'Save as a template?', ref: 'AC-18.1' },
    { id: 's35', lane: 1, slot: 0, row: 25, kind: 'end', actor: 'system', label: 'Order created · this order only' },
    { id: 's36', lane: 2, slot: 1, row: 25, kind: 'decision', actor: 'seller', label: 'Entry already exists?', ref: 'AC-18.4' },
    { id: 's37', lane: 2, slot: 1, row: 26, kind: 'step', actor: 'seller', label: 'Replace or supersede', ref: 'AC-18.4' },
    { id: 's38', lane: 1, slot: 1, row: 27, kind: 'end', actor: 'system', label: 'Price list written · template active', ref: 'AC-18.3' },
    { id: 's39', lane: 1, slot: 0, row: 27, kind: 'end', actor: 'system', label: 'Declined · items stay at list', ref: 'EC-40' },
  ],
  edges: [
    { from: 's1', to: 's2' },
    { from: 's2', to: 's3', label: 'yes' }, { from: 's2', to: 's4', label: 'no' },
    { from: 's4', to: 's5', label: 'yes' }, { from: 's4', to: 's6', label: 'no' },
    { from: 's6', to: 's7' },
    { from: 's7', to: 's8', label: 'no' }, { from: 's7', to: 's9', label: 'yes' },
    { from: 's8', to: 's10' }, { from: 's9', to: 's10' },
    { from: 's10', to: 's11', label: 'no' }, { from: 's10', to: 's12', label: 'yes' },
    { from: 's12', to: 's13', label: 'yes' }, { from: 's13', to: 's14' },
    { from: 's14', to: 's15', label: 'no' },
    { from: 's15', to: 's16', label: 'none left' }, { from: 's15', to: 's17', label: 'yes' },
    { from: 's17', to: 's18' }, { from: 's18', to: 's12', label: 'resubmitted' },
    { from: 's12', to: 's19', label: 'no proof' }, { from: 's14', to: 's19', label: 'usable' },
    { from: 's16', to: 's19', label: 'must decide' },
    { from: 's19', to: 's20', label: 'accept' }, { from: 's19', to: 's21', label: 'counter' },
    { from: 's21', to: 's22', label: 'or decline' },
    { from: 's20', to: 's23' }, { from: 's22', to: 's23' },
    { from: 's23', to: 's24', label: 'no' }, { from: 's24', to: 's19', label: 'resolve them' },
    { from: 's23', to: 's25', label: 'yes' },
    { from: 's25', to: 's26', label: 'yes' }, { from: 's25', to: 's29', label: 'no' },
    { from: 's26', to: 's27', label: 'no' }, { from: 's26', to: 's28', label: 'yes' },
    { from: 's28', to: 's30' }, { from: 's29', to: 's30' },
    { from: 's30', to: 's31' },
    { from: 's31', to: 's32', label: 'nothing' }, { from: 's31', to: 's33', label: 'counters' },
    { from: 's33', to: 's19', label: 'back to me' },
    { from: 's31', to: 's34', label: 'accepts' }, { from: 's31', to: 's39', label: 'declines' },
    { from: 's34', to: 's35', label: 'no' }, { from: 's34', to: 's36', label: 'yes' },
    { from: 's36', to: 's37', label: 'yes' }, { from: 's36', to: 's38', label: 'no' },
    { from: 's37', to: 's38' },
  ],
  alsoTrue: [
    'Auto-rules are ordered: a request is never auto-accepted below floor, whatever the threshold says (EC-22).',
    'A failed proof check never auto-declines on its own — it flags the request and blocks auto-accept (FR-7.4, AC-19.4).',
    'A duplicate file warns with a date and nothing else; another buyer’s identity is never disclosed (FR-13.6, EC-33).',
    'A response is only ever sent whole — partial sends are prohibited (FR-6.6).',
    'Margin, cost and floor never leave this lane (FR-4.8, A7).',
  ],
}

export const MASTER_FLOWS = [BUYER_FLOW, SELLER_FLOW]
