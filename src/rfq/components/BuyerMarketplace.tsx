/**
 * Buyer Marketplace — US-1, US-6.
 *
 * The product card follows the live HIGHBASE anatomy: unit chip and save control over the
 * image, a Wholesale tag, the name, the blue price band with its orange label, the tier
 * band, the supplier line, then the actions. The entry point stays on the card, because
 * that is where the buyer feels the friction (§6.6 Decision 1) — and it repeats on the
 * detail page, which is where a buyer who is actually weighing a price ends up.
 */

import { useState } from 'react'
import { t, type Lang } from '../domain/i18n'
import { formatMoney } from '../domain/money'
import { isNegotiable, PRODUCTS, useRfq } from '../store'
import { requestGate, type GateReason } from '../domain/guardrails'
import { STATE_META, isTerminal } from '../domain/states'
import type { Product } from '../domain/types'
import { CartMark, InfoTip, TagMark } from './ui'
import { ProductDetails } from './ProductDetails'
import { RequestFlow } from './RequestFlow'

const LIVE_STATES = ['draft', 'accepted', 'declined', 'expired', 'withdrawn', 'lost']

export function BuyerMarketplace({ onGoToRequests }: { onGoToRequests: () => void }) {
  const { state, dispatch, lang } = useRfq()
  const [active, setActive] = useState<Product | null>(null)
  const [detail, setDetail] = useState<Product | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const draftLines = state.draft?.lines ?? []

  /** AC-1.5 — an open request already containing this SKU changes the action. */
  function openRequestFor(sku: string) {
    return state.requests.find(
      (r) => !LIVE_STATES.includes(r.state) && r.lines.some((l) => l.sku === sku),
    )
  }

  /** Every live request this buyer holds — the count FR-2.6 caps. */
  const openCount = state.requests.filter((r) => !LIVE_STATES.includes(r.state)).length

  /**
   * FR-2.6 — the two limits, answered per SKU. Both were configured and neither was ever
   * read, so a buyer would have met them for the first time as a control that did nothing.
   * The card now says which limit it is and what clears it, before the drawer opens.
   */
  function gateFor(sku: string): GateReason | null {
    /*
      Counted from when the request was *decided*, not when it was sent. A negotiation that
      ran three weeks and closed yesterday is a decision from yesterday, and dating the
      cooldown from its submission would let the buyer ask again the same afternoon.
      The last history entry is when it closed.
    */
    const terminal = state.requests
      .filter((r) => isTerminal(r.state) && r.lines.some((l) => l.sku === sku))
      .map((r) => new Date(r.history[r.history.length - 1]?.at ?? r.submittedAt ?? 0))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
    return requestGate({ openRequestCount: openCount, lastTerminalAt: terminal, now: state.now })
  }

  function startRequest(product: Product) {
    if (!state.draft) dispatch({ type: 'start_draft' })
    setDetail(null)
    setActive(product)
  }

  if (detail) {
    const existing = openRequestFor(detail.sku)
    return (
      <>
        <ProductDetails
          product={detail}
          onBack={() => setDetail(null)}
          onRequest={() => startRequest(detail)}
          onViewRequest={() => onGoToRequests()}
          existingRef={existing?.ref ?? null}
        />
        {active && <Flow product={active} onClose={() => setActive(null)} onToast={setToast} onDone={onGoToRequests} />}
      </>
    )
  }

  return (
    <div className="hb-shell">
      <div style={{ marginBottom: 18 }}>
        <h1 className="hb-h1">{lang === 'ar' ? 'السوق' : 'Marketplace'}</h1>
        <p className="hb-pagesub">{t(lang, 'marketplaceSubtitle')}</p>
      </div>

      {toast && <div className="hb-banner hb-banner--good" style={{ marginBottom: 16 }}>{toast}</div>}

      <div className="hb-grid">
        {PRODUCTS.map((p) => {
          const existing = openRequestFor(p.sku)
          const eligible = isNegotiable(p)
          const bestTier = p.tiers.slice().sort((a, b) => a.unitPrice - b.unitPrice)[0] ?? null
          const compact = state.cardCta === 'compact'
          const besidePrice = state.cardCta === 'beside_price'
          const underPrice = state.cardCta === 'under_price'
          // Beside the price there is no room for a sentence either, so both of the
          // narrow layouts use the short labels and the marks.
          const shortLabels = compact || besidePrice

          /*
            One button, placed differently. AC-1.3 — where the product is not negotiable
            nothing is rendered in its place; a disabled control would only frustrate.

            The info icon rides with it, and only before a request exists: it explains why
            a buyer would go and find an invoice, which is a question about starting, not
            about the one they already sent. It also stays out of the beside-price layout,
            where the button shares a row with the price and there is no room for a third
            thing without crushing one of the first two — the same reasoning that gives that
            layout the short labels.
          */
          const tip = eligible && !existing && !besidePrice ? (
            <InfoTip
              lang={lang}
              title={shortLabels ? undefined : t(lang, 'incentiveTitle')}
              body={t(lang, shortLabels ? 'incentiveShort' : 'incentiveBody')}
            />
          ) : null

          /*
            The after state is a status, not a link.
            It used to be an outline button reading "View my request · REF", which is an
            action where the buyer wanted a fact: they had already pressed the button, and
            what the card owed them next was confirmation that the ask landed. So the
            control now leads with a tag — and the tag tells the truth about whose turn it
            is, because a card still saying "requested" while the supplier waits on an
            answer would be the one lie this surface is able to tell.

            It stays one clickable control rather than a tag plus a separate link: the way
            back to the request is the only thing a buyer wants from this card once the ask
            is in, and two controls for one intention is a card that got busier for nothing.
          */
          const existingLine = existing?.lines.find((l) => l.sku === p.sku) ?? null
          const needsBuyer = existing ? STATE_META[existing.state].turn === 'buyer' : false
          const stateTag = needsBuyer ? 'cardNeedsYou'
            : existingLine?.route === 'case_2' ? 'cardQuoteRequested' : 'cardMatchRequested'
          /*
            Beside the price is a placement for the *before* state and only that: its whole
            point is to set the action against the number it challenges. Once the ask is in
            there is nothing left to challenge, and the tag is wider than the button it
            replaces — enough to wrap out of the row and land between the two price bands,
            splitting the ladder. So the after state drops below the ladder there, which is
            where a status belongs anyway.
          */
          const stateBelowLadder = underPrice || (besidePrice && existing !== undefined)

          const gate = eligible && !existing ? gateFor(p.sku) : null

          const requestCta = eligible ? (
            existing ? (
              <button
                type="button"
                className="hb-prod-state"
                onClick={onGoToRequests}
                title={`${t(lang, 'viewMyRequest')} · ${existing.ref}`}
              >
                <span className={`hb-prod-state-tag hb-prod-state-tag--${needsBuyer ? 'action' : 'ok'}`}>
                  <TagMark />{t(lang, stateTag)}
                </span>
                {/* The reference identifies which request; where the layout has no room
                    for it, the button's title still carries it. */}
                {!compact && <span className="hb-prod-state-ref">{existing.ref}</span>}
              </button>
            ) : (
              <button
                type="button"
                className={`hb-btn hb-btn--outline${besidePrice ? ' hb-btn--sm' : ' hb-btn--block'}`}
                // E-2 — a control that cannot do its job says why, in its own tooltip and
                // in a line beneath it. Disabling it silently is the version of this that
                // sends the buyer to support.
                disabled={gate !== null}
                title={gate ? gateMessage(gate, lang) : undefined}
                onClick={() => startRequest(p)}
              >
                {gate ? gateShort(gate, lang)
                  : shortLabels
                    ? <><TagMark />{t(lang, 'requestShort')}</>
                    : <><span aria-hidden="true">🏷</span>{t(lang, 'requestSpecialPrice')}</>}
              </button>
            )
          ) : null

          return (
            <div className="hb-card hb-prod" key={p.sku}>
              <div className="hb-prod-media">
                <span className="hb-prod-unit">{p.unitOfMeasure[lang]}</span>
                <button type="button" className="hb-prod-save" aria-label="Save item">🔖</button>
                <span aria-hidden="true">{p.emoji}</span>
                <span className="hb-prod-tag"><span aria-hidden="true">📦</span>{t(lang, 'wholesale')}</span>
              </div>

              <div className="hb-prod-body">
                <button
                  type="button" className="hb-prod-name"
                  style={{ background: 'none', border: 'none', padding: 0, textAlign: 'start', cursor: 'pointer', font: 'inherit' }}
                  onClick={() => setDetail(p)}
                >
                  {p.name[lang]}
                </button>

                {/*
                  AC-1.1 asks for the negotiation action directly beneath the price. The
                  third layout takes that one step further and sets it *against* the price,
                  in the same row as the number it challenges — which is the moment the
                  buyer feels the friction (§6.6 Decision 1). The price band keeps the width
                  it needs and the button holds its own; below the card's minimum the row
                  wraps rather than crushing either.
                */}
                <div className={besidePrice ? 'hb-priceband-row' : undefined}>
                  <div className="hb-priceband">
                    <span className="hb-priceband-label">{t(lang, 'listPrice')}</span>
                    <span className="hb-priceband-value">
                      <small>BHD</small>{formatMoney(p.listPrice)}
                    </span>
                  </div>
                  {besidePrice && !existing && requestCta}
                </div>

                {/* AC-1.4 — the tier ladder is visible before the request flow opens. */}
                {bestTier && (
                  <div className="hb-priceband hb-priceband--tier">
                    <span className="hb-priceband-label">{t(lang, 'unitsRange', { min: bestTier.minQty })}</span>
                    <span className="hb-priceband-value"><small>BHD</small>{formatMoney(bestTier.unitPrice)}</span>
                  </div>
                )}

                {/*
                  Under the price ladder rather than at the foot of the card: the action
                  belongs to the number it challenges, and keeping it above the supplier
                  line means the price block reads as price, alternatives, then "ask for
                  better". It sits after the tier band, not between the two bands, so the
                  ladder stays whole and the CTA lands in the same place on every card
                  whether or not the product has tiers (AC-1.4).
                */}
                {stateBelowLadder && <div className="hb-cta-with-tip">{requestCta}{tip}</div>}

                <div className="hb-prod-supplier">
                  {t(lang, 'supplier')}: <b>{state.requests[0]?.sellerName ?? ''}</b>
                </div>

                {/*
                  AC-1.1 — the negotiation action sits directly beneath the price, not in
                  an overflow menu. AC-1.3 — where the product is not negotiable nothing
                  is rendered in its place; a disabled control would only frustrate.

                  Two layouts, switchable from the demo bar. Stacked, each action gets the
                  full width and its full sentence. Compact, they share one row: the cart
                  keeps the width it needs for a verb, and the request action shrinks to a
                  mark and one word — which is what makes the pair fit at card width without
                  either wrapping. The reference moves to a line under the row in that
                  layout, because "View request · SPR-2608-0001" cannot survive the squeeze
                  and dropping the reference would lose the one thing that identifies which
                  request is already open.
                */}
                <div className={`hb-prod-actions${compact ? ' hb-prod-actions--compact' : ''}`}>
                  <div className="hb-prod-ctarow">
                    <button type="button" className="hb-btn hb-btn--primary hb-btn--block">
                      {compact
                        ? <><CartMark />{t(lang, 'addToCartShort')}</>
                        : <><span aria-hidden="true">🛒</span>{t(lang, 'addToCart')}</>}
                    </button>
                    {!besidePrice && !underPrice && (
                      <div className="hb-cta-with-tip">{requestCta}{tip}</div>
                    )}
                  </div>

                  {/*
                    Where the tag has no room for the reference beside it, it goes on its
                    own line — losing it would cost the one thing that says which request
                    this card is pointing at.
                  */}
                  {compact && existing && eligible && (
                    <div className="hb-hint hb-prod-ctaref">{existing.ref}</div>
                  )}
                  {gate && !shortLabels && (
                    <div className="hb-hint hb-prod-gate">{gateMessage(gate, lang)}</div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* AC-6.2 — a persistent indicator, visible while browsing, linking back. */}
      {draftLines.length > 0 && !active && (
        <div className="hb-sticky-draft">
          <button
            type="button" className="hb-btn hb-btn--primary"
            onClick={() => setActive(PRODUCTS.find((p) => p.sku === draftLines[0].sku) ?? PRODUCTS[0])}
          >
            {t(lang, draftLines.length === 1 ? 'itemInRequest' : 'itemsInRequest', { n: draftLines.length })}{' '}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {active && <Flow product={active} onClose={() => setActive(null)} onToast={setToast} onDone={onGoToRequests} />}
    </div>
  )
}

function Flow({ product, onClose, onToast, onDone }: {
  product: Product
  onClose: () => void
  onToast: (m: string) => void
  onDone: () => void
}) {
  const { dispatch, lang } = useRfq()
  return (
    <RequestFlow
      product={product}
      onClose={onClose}
      onTierAccepted={(unitPrice) => {
        // AC-2.2 — taking the published tier closes the flow without creating a request.
        onClose()
        dispatch({ type: 'discard_draft' })
        onToast(lang === 'ar'
          ? `تم اعتماد السعر المعلن ${formatMoney(unitPrice, { withCurrency: true, lang })} — لا حاجة لطلب.`
          : `Taken at the published price of ${formatMoney(unitPrice, { withCurrency: true, lang })} — no request needed.`)
      }}
      onSubmitted={() => { onClose(); onDone() }}
    />
  )
}

/** FR-2.6 — the gate in full, and in the words the buyer needs to act on it. */
function gateMessage(gate: GateReason, lang: Lang): string {
  if (gate.kind === 'too_many_open') return t(lang, 'gateTooManyOpen', { open: gate.open, max: gate.max })
  // One day is its own sentence rather than "1 days"; the prototype has no plural helper
  // and the one place it shows is worth a second string.
  return gate.daysLeft === 1
    ? t(lang, 'gateCooldownOne')
    : t(lang, 'gateCooldown', { days: gate.daysLeft })
}

/** The same fact at button length, for a label that has to fit a card. */
function gateShort(gate: GateReason, lang: Lang): string {
  if (gate.kind === 'too_many_open') return t(lang, 'gateTooManyOpenShort')
  return gate.daysLeft === 1
    ? t(lang, 'gateCooldownShortOne')
    : t(lang, 'gateCooldownShort', { days: gate.daysLeft })
}
