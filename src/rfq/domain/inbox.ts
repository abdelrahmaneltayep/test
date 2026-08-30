/**
 * Inbox — Feature Flow Draft §8.
 *
 * "Use Inbox and/or Notifications to alert both buyer and seller whenever the other party
 * takes action. Inbox lets users see what has been accepted or rejected. Inbox categories:
 * Special Price Request, RFQ, Sent."
 *
 * Nothing is stored: an inbox is a projection of the history log, which is already
 * append-only and already carries the actor and the timestamp (FR-1.5). That keeps the
 * draft's Sent category honest — Sent is not a separate outbox, it is the same events
 * read from the other side.
 */

import { STATE_META } from './states'
import type { Actor, HistoryEvent, NegotiationRequest } from './types'

export type InboxCategory = 'special_price' | 'rfq' | 'sent'

/** §8 — "see what has been accepted or rejected", so the outcome is on the row itself. */
export type InboxOutcome = 'accepted' | 'rejected' | 'countered' | 'info' | 'sent' | 'closed'

export interface InboxItem {
  id: string
  ref: string
  category: InboxCategory
  outcome: InboxOutcome
  at: string
  actor: Actor
  /** Who the viewer is looking at across the table. */
  counterparty: string
  event: HistoryEvent
  /** The products the thread is about, for a one-line summary on the row. */
  subject: { en: string; ar: string }
  unread: boolean
}

/**
 * Opening a request is not something the other party is told about, and a rule that fires
 * on submission is reported through the request itself. Everything else either party does
 * is an event the other one needs to see.
 */
const SILENT: string[] = ['RequestViewed', 'ProofUploaded', 'ProofCheckCompleted']

const OUTCOME_BY_EVENT: Record<string, InboxOutcome> = {
  RequestSubmitted: 'sent',
  SellerResponded: 'countered',
  BuyerCountered: 'countered',
  InfoRequested: 'info',
  InfoSupplied: 'info',
  RequestAccepted: 'accepted',
  RequestDeclined: 'rejected',
  RequestWithdrawn: 'closed',
  RequestExpired: 'closed',
  AutoRuleFired: 'closed',
  FloorOverridden: 'sent',
}

/** §1 — the route decides which of the two feature categories a thread belongs to. */
export function threadCategory(request: NegotiationRequest): 'special_price' | 'rfq' {
  return request.lines.some((l) => l.route === 'case_1') ? 'special_price' : 'rfq'
}

function subjectOf(request: NegotiationRequest): { en: string; ar: string } {
  const first = request.lines[0]
  if (!first) return { en: request.ref, ar: request.ref }
  const more = request.lines.length - 1
  return {
    en: more > 0 ? `${first.productName.en} +${more}` : first.productName.en,
    ar: more > 0 ? `${first.productName.ar} +${more}` : first.productName.ar,
  }
}

/**
 * Build one viewer's inbox. An event the viewer performed lands in Sent; everything else
 * lands in Special Price Request or RFQ by the thread's route — so each event appears in
 * exactly one category, and the three tabs partition the log rather than overlapping it.
 *
 * A system event is not "sent" by anybody, so both parties receive it in the feature
 * category, which is where a buyer looking for "why did this close" would go for it.
 */
export function buildInbox(
  requests: NegotiationRequest[], viewer: 'buyer' | 'seller',
): InboxItem[] {
  const items: InboxItem[] = []
  for (const request of requests) {
    // FR-3.2 — a state with no label for this viewer is not on this viewer's surfaces.
    const label = viewer === 'buyer' ? STATE_META[request.state].buyerLabel : STATE_META[request.state].sellerLabel
    if (label === null || request.state === 'draft') continue

    const category = threadCategory(request)
    const subject = subjectOf(request)
    const counterparty = viewer === 'buyer' ? request.sellerName : request.buyerName
    const last = request.history[request.history.length - 1]

    for (const e of request.history) {
      if (SILENT.includes(e.type)) continue
      const mine = e.actor === viewer
      items.push({
        id: `${request.ref}:${e.id}`,
        ref: request.ref,
        category: mine ? 'sent' : category,
        outcome: mine ? 'sent' : OUTCOME_BY_EVENT[e.type] ?? 'sent',
        at: e.at,
        actor: e.actor,
        counterparty,
        event: e,
        subject,
        // Unread is the same question the dashboards already answer: is this the latest
        // thing that happened, was it someone else, and is the thread now waiting on me.
        unread: !mine && e.id === last?.id && STATE_META[request.state].turn === viewer,
      })
    }
  }
  return items.sort((a, b) => b.at.localeCompare(a.at))
}

export function unreadCount(items: InboxItem[]): number {
  return items.filter((i) => i.unread).length
}
