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
import { t } from '../domain/i18n'
import { formatMoney } from '../domain/money'
import { isNegotiable, PRODUCTS, useRfq } from '../store'
import type { Product } from '../domain/types'
import { CartMark, EyeMark, TagMark } from './ui'
import { ProductDetails } from './ProductDetails'
import { RequestFlow } from './RequestFlow'

const LIVE_STATES = ['draft', 'accepted', 'accepted_as_template', 'declined', 'expired', 'withdrawn', 'lost']

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

  /** FR-8.7 — a SKU covered by an active template is not offered the entry point. */
  function templateFor(sku: string) {
    return state.priceList.find((e) => e.sku === sku && e.active)
  }

  function startRequest(product: Product) {
    if (!state.draft) dispatch({ type: 'start_draft' })
    setDetail(null)
    setActive(product)
  }

  if (detail) {
    const existing = openRequestFor(detail.sku)
    const template = templateFor(detail.sku)
    return (
      <>
        <ProductDetails
          product={detail}
          onBack={() => setDetail(null)}
          onRequest={() => startRequest(detail)}
          onViewRequest={() => onGoToRequests()}
          existingRef={existing?.ref ?? null}
          templatePrice={template?.price ?? null}
          templateUntil={template?.validUntil ?? null}
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
          const template = templateFor(p.sku)
          const eligible = isNegotiable(p)
          const bestTier = p.tiers.slice().sort((a, b) => a.unitPrice - b.unitPrice)[0] ?? null
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

                <div className="hb-priceband">
                  <span className="hb-priceband-label">{t(lang, 'listPrice')}</span>
                  <span className="hb-priceband-value">
                    <small>BHD</small>{formatMoney(template?.price ?? p.listPrice)}
                  </span>
                </div>

                {/* AC-1.4 — the tier ladder is visible before the request flow opens. */}
                {bestTier && !template && (
                  <div className="hb-priceband hb-priceband--tier">
                    <span className="hb-priceband-label">{t(lang, 'unitsRange', { min: bestTier.minQty })}</span>
                    <span className="hb-priceband-value"><small>BHD</small>{formatMoney(bestTier.unitPrice)}</span>
                  </div>
                )}

                {/* FR-8.5 — an agreed price reads as the buyer's price, with its expiry. */}
                {template && (
                  <div className="hb-pill hb-pill--good hb-pill--round" style={{ alignSelf: 'flex-start' }}>
                    {lang === 'ar' ? `سعر متفق عليه حتى ${template.validUntil}` : `Agreed price until ${template.validUntil}`}
                  </div>
                )}

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
                <div className={`hb-prod-actions${state.compactCardCta ? ' hb-prod-actions--compact' : ''}`}>
                  <div className="hb-prod-ctarow">
                    <button type="button" className="hb-btn hb-btn--primary hb-btn--block">
                      {state.compactCardCta
                        ? <><CartMark />{t(lang, 'addToCartShort')}</>
                        : <><span aria-hidden="true">🛒</span>{t(lang, 'addToCart')}</>}
                    </button>

                    {eligible && !template && (
                      existing
                        ? (
                          <button type="button" className="hb-btn hb-btn--outline hb-btn--block" onClick={onGoToRequests}>
                            {state.compactCardCta
                              ? <><EyeMark />{t(lang, 'viewRequestShort')}</>
                              : <>{t(lang, 'viewMyRequest')} · {existing.ref}</>}
                          </button>
                        ) : (
                          <button type="button" className="hb-btn hb-btn--outline hb-btn--block" onClick={() => startRequest(p)}>
                            {state.compactCardCta
                              ? <><TagMark />{t(lang, 'requestShort')}</>
                              : <><span aria-hidden="true">🏷</span>{t(lang, 'requestSpecialPrice')}</>}
                          </button>
                        )
                    )}
                  </div>

                  {state.compactCardCta && eligible && !template && existing && (
                    <div className="hb-hint hb-prod-ctaref">{existing.ref}</div>
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
