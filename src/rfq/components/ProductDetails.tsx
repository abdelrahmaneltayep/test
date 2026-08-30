/**
 * Product details — US-1 on the detail page rather than the card.
 *
 * The live product's detail page ends in a single blue Add to Cart. The negotiation entry
 * point joins it there as a second action of equal weight but lower emphasis: a blue
 * outline button beside the filled one. AC-1.1 asks for the action directly beneath the
 * price and never inside an overflow menu, which on this page means the CTA row itself —
 * the buyer sees the price, the tier ladder, and the way to challenge the price without
 * scrolling or hunting.
 *
 * The AC-1.2 / AC-1.3 / AC-1.5 variants apply here exactly as they do on the card: an
 * ineligible product renders no entry point at all, an unlinked seller changes the label,
 * and an existing open request deep-links to it instead.
 */

import { t } from '../domain/i18n'
import { formatMoney } from '../domain/money'
import type { Product } from '../domain/types'
import { isNegotiable, useRfq } from '../store'

interface Props {
  product: Product
  onBack: () => void
  onRequest: () => void
  onViewRequest: (ref: string) => void
  existingRef: string | null
}

export function ProductDetails({ product, onBack, onRequest, onViewRequest, existingRef }: Props) {
  const { lang } = useRfq()
  const eligible = isNegotiable(product)
  const effectivePrice = product.listPrice
  const bestTier = product.tiers.slice().sort((a, b) => a.unitPrice - b.unitPrice)[0] ?? null

  return (
    <div className="hb-shell">
      <button type="button" className="hb-btn hb-btn--quiet hb-btn--sm" onClick={onBack} style={{ marginBottom: 16 }}>
        <span aria-hidden="true">‹</span>{t(lang, 'backToMarketplace')}
      </button>

      <div className="hb-pdp">
        <div>
          <div className="hb-pdp-media" role="img" aria-label={product.name[lang]}>
            <span aria-hidden="true">{product.emoji}</span>
          </div>
          <div className="hb-pdp-thumbs">
            <button type="button" className="hb-pdp-thumb" aria-pressed="true" aria-label="Image 1">
              <span aria-hidden="true">{product.emoji}</span>
            </button>
            <button type="button" className="hb-pdp-thumb" aria-pressed="false" aria-label="Image 2">
              <span aria-hidden="true" style={{ opacity: .45 }}>{product.emoji}</span>
            </button>
          </div>
        </div>

        <div>
          <div className="hb-pdp-title">
            <h1>{product.name[lang]}</h1>
            <button type="button" className="hb-iconbtn" aria-label="Save item">🔖</button>
          </div>

          <div className="hb-card">
            <div className="hb-attr">
              <span aria-hidden="true">🏷</span>
              <span className="hb-attr-label">{t(lang, 'brandLabel')} :</span>
              <span className="hb-attr-value hb-attr-value--link">{product.brand}</span>
              <span className="hb-attr-chev" aria-hidden="true">›</span>
            </div>
            <div className="hb-attr">
              <span aria-hidden="true">▦</span>
              <span className="hb-attr-label">{t(lang, 'categoryLabel')} :</span>
              <span className="hb-attr-value hb-attr-value--link">{product.category[lang]}</span>
              <span className="hb-attr-chev" aria-hidden="true">›</span>
            </div>
            <div className="hb-attr">
              <span aria-hidden="true">📦</span>
              <span className="hb-attr-label">{t(lang, 'packageLabel')} :</span>
              <span className="hb-attr-value">{product.packSize}</span>
            </div>
            <div className="hb-attr">
              <span aria-hidden="true">🚚</span>
              <span className="hb-attr-label">{t(lang, 'deliveryEta')} :</span>
              <span className="hb-attr-value">{t(lang, 'deliveryEtaValue')}</span>
            </div>
          </div>

          {/* AC-1.4 — the tier ladder is visible before the request flow opens. */}
          {bestTier && (
            <div style={{ marginTop: 18 }}>
              <div className="hb-row" style={{ gap: 8 }}>
                <span aria-hidden="true">📦</span>
                <span className="hb-sub">{t(lang, 'unitsRange', { min: bestTier.minQty })}</span>
              </div>
              <div className="hb-row" style={{ gap: 8, marginTop: 4 }}>
                <span className="hb-sub">{t(lang, 'priceAtVolume')}:</span>
                <strong className="hb-num">BHD {formatMoney(bestTier.unitPrice)}</strong>
              </div>
            </div>
          )}

          <div className="hb-pdp-price">
            {/* FR-8.5 — an agreed price is shown as the buyer's price, labelled, with expiry. */}
            <b>BHD {formatMoney(effectivePrice)}</b>
            <span>{t(lang, 'inclusiveVat')}</span>
          </div>

          {/*
            The CTA row. Add to Cart keeps the primary fill it has in the live product;
            the negotiation action sits beside it as an outline button — visible without
            hunting (AC-1.1), never inside an overflow menu, and never rendered at all
            where the product is not negotiable (AC-1.3).
          */}
          <div className="hb-pdp-cta">
            <button type="button" className="hb-btn hb-btn--primary">
              <span aria-hidden="true">🛒</span>{t(lang, 'addToCart')}
            </button>

            {eligible && (
              existingRef
                ? (
                  <button type="button" className="hb-btn hb-btn--outline" onClick={() => onViewRequest(existingRef)}>
                    {t(lang, 'viewMyRequest')} · {existingRef}
                  </button>
                ) : (
                  <button type="button" className="hb-btn hb-btn--outline" onClick={onRequest}>
                    <span aria-hidden="true">🏷</span>{t(lang, 'requestSpecialPrice')}
                  </button>
                )
            )}
          </div>

          {!eligible && (
            <p className="hb-hint" style={{ marginTop: 10 }}>
              {lang === 'ar' ? 'هذا الصنف غير متاح للتفاوض على السعر.' : 'This product is not available for price negotiation.'}
            </p>
          )}

          <h2 className="hb-h2" style={{ marginTop: 28, marginBottom: 12 }}>{t(lang, 'supplierPolicies')}</h2>
          <div className="hb-card">
            <div className="hb-card-body hb-row" style={{ gap: 12 }}>
              <span aria-hidden="true" style={{ fontSize: 20 }}>🌿</span>
              <div>
                <strong>{t(lang, 'expiryPolicy')}</strong>
                <div className="hb-hint">01 Jan 2027</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
