/**
 * Inbox — Feature Flow Draft §8.
 *
 * Three categories, exactly as the draft names them: Special Price Request, RFQ, Sent.
 * The same component serves both roles, because the draft asks for the same thing on both
 * sides — "alert both buyer and seller whenever the other party takes action" — and the
 * only thing that differs is who counts as the other party.
 *
 * Every row states its outcome in words (FR-11.5), so "see what has been accepted or
 * rejected" is answerable from the list without opening anything.
 */

import { useMemo, useState } from 'react'
import { buildInbox, type InboxCategory, type InboxItem, type InboxOutcome } from '../domain/inbox'
import { renderHistory, t, type Lang } from '../domain/i18n'
import { formatMoney } from '../domain/money'
import type { NegotiationRequest } from '../domain/types'
import { Empty } from './ui'

/** §8 — "Inbox categories: Special Price Request, RFQ, Sent", in that order. */
const CATEGORIES: { key: InboxCategory; label: string }[] = [
  { key: 'special_price', label: 'inboxTabSpecial' },
  { key: 'rfq', label: 'inboxTabRfq' },
  { key: 'sent', label: 'inboxTabSent' },
]

const OUTCOME_TONE: Record<InboxOutcome, string> = {
  accepted: 'good', rejected: 'bad', countered: 'warn',
  info: 'action', sent: 'neutral', closed: 'neutral',
}

const OUTCOME_KEY: Record<InboxOutcome, string> = {
  accepted: 'outcomeAccepted', rejected: 'outcomeRejected', countered: 'outcomeCountered',
  info: 'outcomeInfo', sent: 'outcomeSent', closed: 'outcomeClosed',
}

export function Inbox({ requests, viewer, lang, onOpen }: {
  requests: NegotiationRequest[]
  viewer: 'buyer' | 'seller'
  lang: Lang
  onOpen: (ref: string) => void
}) {
  const [category, setCategory] = useState<InboxCategory>('special_price')
  const all = useMemo(() => buildInbox(requests, viewer), [requests, viewer])
  const items = all.filter((i) => i.category === category)

  return (
    <div className="hb-card">
      <div className="hb-card-head" style={{ paddingBottom: 0, borderBottom: 'none' }}>
        <div className="hb-tabs" style={{ border: 'none' }}>
          {CATEGORIES.map((c) => {
            const unread = all.filter((i) => i.category === c.key && i.unread).length
            return (
              <button
                key={c.key} type="button" className="hb-tab"
                aria-selected={category === c.key} onClick={() => setCategory(c.key)}
              >
                {t(lang, c.label)}
                {unread > 0 && <span className="hb-tab-count hb-tab-count--action">{unread}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {items.length === 0 ? (
        <Empty title={t(lang, 'inboxEmptyTitle')} body={t(lang, 'inboxEmptyBody')} />
      ) : (
        <ul className="hb-inbox">
          {items.map((item) => (
            <InboxRow key={item.id} item={item} lang={lang} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </div>
  )
}

function InboxRow({ item, lang, onOpen }: { item: InboxItem; lang: Lang; onOpen: (ref: string) => void }) {
  const { event } = item
  return (
    <li className={`hb-inbox-item${item.unread ? ' hb-inbox-item--unread' : ''}`}>
      <button type="button" className="hb-inbox-btn" onClick={() => onOpen(item.ref)}>
        <span className="hb-inbox-mark" aria-hidden="true" />
        <span className="hb-inbox-body">
          <span className="hb-inbox-top">
            <strong>{item.counterparty}</strong>
            <span className="hb-ref">{item.ref}</span>
            <span className={`hb-pill hb-pill--${OUTCOME_TONE[item.outcome]}`}>{t(lang, OUTCOME_KEY[item.outcome])}</span>
            {item.unread && <span className="hb-pill hb-pill--action">{t(lang, 'inboxUnread')}</span>}
          </span>
          <span className="hb-inbox-line">{renderHistory(event, lang)}</span>
          <span className="hb-inbox-meta">
            {item.subject[lang]}
            {event.before !== null && event.after !== null && (
              <span className="hb-hint"> · {formatMoney(event.before)} → {formatMoney(event.after)}</span>
            )}
          </span>
        </span>
        {/* AC-13.2 — UTC, pinned LTR so it survives an RTL page. */}
        <time dir="ltr" className="hb-inbox-time">{event.at.replace('T', ' ').slice(0, 16)} UTC</time>
      </button>
    </li>
  )
}
