/**
 * Ten layouts for the action row on a HIGHBASE product card.
 *
 * Every specimen renders in the real product's system — same tokens, same button
 * treatments, same card anatomy — so what is being compared is the arrangement and the
 * hierarchy, not the styling. Two actions appear in all ten:
 *
 *   · Add        — the cart action, icon plus a short label
 *   · Request    — "Matching my price", or "View request · REF" once one is open
 *
 * Each variant states what the arrangement buys and what it costs, because that is the
 * decision being made: how much of the card's attention the negotiation action takes from
 * the cart action.
 */

import type { ReactNode } from 'react'

export interface CtaProps {
  /** Has this buyer already got an open request covering the SKU? (AC-1.5) */
  requested: boolean
  ref: string
  lang: 'en' | 'ar'
}

const COPY = {
  add: { en: 'Add', ar: 'أضف' },
  request: { en: 'Matching my price', ar: 'مطابقة سعري' },
  requestShort: { en: 'Request price', ar: 'اطلب سعراً' },
  requestTiny: { en: 'Ask for a better price', ar: 'اطلب سعراً أفضل' },
  view: { en: 'View request', ar: 'عرض الطلب' },
  viewShort: { en: 'View', ar: 'عرض' },
  more: { en: 'More actions', ar: 'إجراءات أخرى' },
} as const

/** The negotiation label depends on state, and on how much room the layout gives it. */
function negotiate(p: CtaProps, size: 'full' | 'short' | 'tiny' = 'full') {
  if (p.requested) return size === 'full' ? `${COPY.view[p.lang]} · ${p.ref}` : COPY.viewShort[p.lang]
  return size === 'full' ? COPY.request[p.lang] : size === 'short' ? COPY.requestShort[p.lang] : COPY.requestTiny[p.lang]
}

const Cart = () => <span aria-hidden="true">🛒</span>

/** Drawn rather than emoji: it has to stay legible in white on the blue fill. */
const TagMark = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
    <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

const EyeMark = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export interface Variant {
  id: number
  name: { en: string; ar: string }
  /** What this arrangement is good for. */
  buys: string
  /** What it gives up. Every one of these gives something up. */
  costs: string
  /** Set where the layout contradicts a stated acceptance criterion. */
  conflict?: string
  /** Some layouts put a control inside the price band rather than the action row. */
  priceBandSlot?: (p: CtaProps) => ReactNode
  /** Some pin a control to the card media. */
  mediaSlot?: (p: CtaProps) => ReactNode
  render: (p: CtaProps) => ReactNode
}

export const CTA_VARIANTS: Variant[] = [
  {
    id: 1,
    name: { en: 'Stacked, cart leads', ar: 'متراكب، السلة أولاً' },
    buys: 'Both actions get a full-width target and an unambiguous rank. Safest on a phone.',
    costs: 'Tallest of the ten — two full rows of card height on every card in the grid.',
    render: (p) => (
      <div className="hb-prod-actions">
        <button type="button" className="hb-btn hb-btn--primary hb-btn--block"><Cart />{COPY.add[p.lang]}</button>
        <button type="button" className="hb-btn hb-btn--outline hb-btn--block">{negotiate(p)}</button>
      </div>
    ),
  },
  {
    id: 2,
    name: { en: 'Equal halves', ar: 'نصفان متساويان' },
    buys: 'One row. Reads as a genuine either/or, which is what the buyer faces.',
    costs: 'Both labels truncate in a narrow column, and equal size blurs which is the default.',
    render: (p) => (
      <div className="v-row2">
        <button type="button" className="hb-btn hb-btn--primary"><Cart />{COPY.add[p.lang]}</button>
        <button type="button" className="hb-btn hb-btn--outline">{negotiate(p, 'short')}</button>
      </div>
    ),
  },
  {
    id: 3,
    name: { en: 'Split button', ar: 'زر مقسوم' },
    buys: 'One row, one object. Cart keeps full primary weight; negotiation rides along.',
    costs: 'An icon-only segment has to be learned — its meaning is not legible on first sight.',
    render: (p) => (
      <div className="v-split">
        <button type="button" className="hb-btn hb-btn--primary v-split-main"><Cart />{COPY.add[p.lang]}</button>
        <button type="button" className="hb-btn hb-btn--primary v-split-aside" aria-label={negotiate(p)} title={negotiate(p)}>
          {p.requested ? <EyeMark /> : <TagMark />}
        </button>
      </div>
    ),
  },
  {
    id: 4,
    name: { en: 'Primary plus text link', ar: 'زر رئيسي مع رابط' },
    buys: 'Cheapest in height after a single button, and the ranking is completely clear.',
    costs: 'A text link is the weakest target on the card; discovery of negotiation drops (M-L1).',
    render: (p) => (
      <div className="hb-prod-actions">
        <button type="button" className="hb-btn hb-btn--primary hb-btn--block"><Cart />{COPY.add[p.lang]}</button>
        <button type="button" className="v-link">{negotiate(p)}</button>
      </div>
    ),
  },
  {
    id: 5,
    name: { en: 'Icon cart, request leads', ar: 'أيقونة السلة، الطلب أولاً' },
    buys: 'Puts negotiation first. The right call if the strategic goal is on-platform asks (O1).',
    costs: 'Demotes the revenue action to an unlabelled icon. Hard to justify outside a pilot.',
    render: (p) => (
      <div className="v-rowIcon">
        <button type="button" className="hb-btn hb-btn--secondary v-iconsq" aria-label={COPY.add[p.lang]} title={COPY.add[p.lang]}><Cart /></button>
        <button type="button" className="hb-btn hb-btn--primary v-grow">{negotiate(p)}</button>
      </div>
    ),
  },
  {
    id: 6,
    name: { en: 'Chip in the price band', ar: 'شارة داخل شريط السعر' },
    buys: 'Puts the ask next to the number it is about, and leaves the action row to the cart.',
    costs: 'The band is already carrying the price; a third element there is easy to miss.',
    priceBandSlot: (p) => (
      <button type="button" className="v-chip">{p.requested ? COPY.viewShort[p.lang] : COPY.requestTiny[p.lang]}</button>
    ),
    render: (p) => (
      <div className="hb-prod-actions">
        <button type="button" className="hb-btn hb-btn--primary hb-btn--block"><Cart />{COPY.add[p.lang]}</button>
      </div>
    ),
  },
  {
    id: 7,
    name: { en: 'Quantity stepper', ar: 'محدّد الكمية' },
    buys: 'Matches what the live card already becomes after adding, so nothing shifts.',
    costs: 'Only correct once the item is in the cart — needs a second state to be honest.',
    render: (p) => (
      <div className="hb-prod-actions">
        <div className="v-stepper">
          <button type="button" aria-label="Remove one">−</button>
          <span className="hb-num">1</span>
          <button type="button" aria-label="Add one">+</button>
        </div>
        <button type="button" className="hb-btn hb-btn--outline hb-btn--block">{negotiate(p)}</button>
      </div>
    ),
  },
  {
    id: 8,
    name: { en: 'Segmented pair', ar: 'زوج مدمج' },
    buys: 'One bordered object, one row, and both labels stay readable at grid width.',
    costs: 'Neither half looks primary, so the card stops recommending anything.',
    render: (p) => (
      <div className="v-segment">
        <button type="button" className="v-segment-btn v-segment-btn--lead"><Cart />{COPY.add[p.lang]}</button>
        <button type="button" className="v-segment-btn">{negotiate(p, 'short')}</button>
      </div>
    ),
  },
  {
    id: 9,
    name: { en: 'Overflow menu', ar: 'قائمة إضافية' },
    buys: 'The quietest option, and the shortest. Keeps the grid to one action per card.',
    costs: 'Nobody finds it. Included as the comparison point, not as a candidate.',
    conflict: 'AC-1.1 requires the action to be visible beneath the price, never inside an overflow menu.',
    render: (p) => (
      <div className="v-rowIcon">
        <button type="button" className="hb-btn hb-btn--primary v-grow"><Cart />{COPY.add[p.lang]}</button>
        <button type="button" className="hb-btn hb-btn--secondary v-iconsq" aria-label={COPY.more[p.lang]} title={negotiate(p)}>⋯</button>
      </div>
    ),
  },
  {
    id: 10,
    name: { en: 'Corner tag on the image', ar: 'وسم على الصورة' },
    buys: 'Costs no vertical space at all, and sits where the eye already lands first.',
    costs: 'Competes with the Wholesale tag and the save control for the same corners.',
    mediaSlot: (p) => (
      <button type="button" className="v-cornertag">
        <TagMark size={12} />{p.requested ? COPY.viewShort[p.lang] : COPY.requestTiny[p.lang]}
      </button>
    ),
    render: (p) => (
      <div className="hb-prod-actions">
        <button type="button" className="hb-btn hb-btn--primary hb-btn--block"><Cart />{COPY.add[p.lang]}</button>
      </div>
    ),
  },
]
