/**
 * Buyer Marketplace — US-1, US-6.
 *
 * The entry point stays on the product card, because that is where the buyer feels the
 * friction (§6.6 Decision 1). What it *builds* is one order-level request.
 */

import { useState } from 'react'
import { t } from '../domain/i18n'
import { formatMoney } from '../domain/money'
import { isNegotiable, PRODUCTS, useRfq } from '../store'
import type { Product } from '../domain/types'
import { RequestFlow } from './RequestFlow'
import { Money } from './ui'

export function BuyerMarketplace({ onGoToRequests }: { onGoToRequests: () => void }) {
  const { state, dispatch, lang } = useRfq()
  const [active, setActive] = useState<Product | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const draftLines = state.draft?.lines ?? []

  /** AC-1.5 — an open request already containing this SKU changes the action. */
  function openRequestFor(sku: string) {
    return state.requests.find(
      (r) => !['accepted', 'accepted_as_template', 'declined', 'expired', 'withdrawn', 'lost'].includes(r.state)
        && r.lines.some((l) => l.sku === sku),
    )
  }

  /** FR-8.7 — a SKU covered by an active template is not offered the entry point. */
  function templateFor(sku: string) {
    return state.priceList.find((e) => e.sku === sku && e.active)
  }

  return (
    <div className="hb-shell">
      <div style={{ marginBottom: 16 }}>
        <h1 className="hb-h1">{lang === 'ar' ? 'السوق' : 'Marketplace'}</h1>
        <p className="hb-sub">{state.requests[0]?.sellerName ?? ''}</p>
      </div>

      {toast && <div className="hb-banner hb-banner--good" style={{ marginBottom: 14 }}>{toast}</div>}

      <div className="hb-grid">
        {PRODUCTS.map((p) => {
          const existing = openRequestFor(p.sku)
          const template = templateFor(p.sku)
          const eligible = isNegotiable(p)
          return (
            <div className="hb-card" key={p.sku}>
              <div className="hb-product">
                <div>
                  <div className="hb-product-name">{p.name[lang]}</div>
                  <div className="hb-hint">{p.sku} · {p.packSize}</div>
                </div>

                <div className="hb-price">
                  {formatMoney(template?.price ?? p.listPrice, { withCurrency: true, lang })}
                  <span className="hb-hint" style={{ fontWeight: 400 }}> / {p.unitOfMeasure[lang]}</span>
                </div>

                {/* FR-8.5 — an agreed price is labelled as one, with its expiry. */}
                {template && (
                  <div className="hb-pill hb-pill--good" style={{ alignSelf: 'flex-start' }}>
                    {lang === 'ar' ? `سعر متفق عليه حتى ${template.validUntil}` : `Agreed price until ${template.validUntil}`}
                  </div>
                )}

                {/* AC-1.4 — the tier ladder is visible before the request flow opens. */}
                {p.tiers.length > 0 && (
                  <div className="hb-tier-ladder">
                    <strong>{t(lang, 'volumeTiers')}</strong>
                    {p.tiers.map((tier) => (
                      <div key={tier.minQty}>
                        {tier.minQty}+ → <Money value={tier.unitPrice} lang={lang} /> {t(lang, 'perUnit')}
                      </div>
                    ))}
                  </div>
                )}

                {/*
                  AC-1.3 — an ineligible product renders no action at all. A disabled
                  control is deliberately not shown in its place: there is nothing the
                  buyer could do to make this SKU negotiable.
                */}
                {eligible && !template && (
                  existing
                    ? (
                      <button type="button" className="hb-btn hb-btn--secondary" onClick={onGoToRequests}>
                        {t(lang, 'viewMyRequest')} · {existing.ref}
                      </button>
                    ) : (
                      <button
                        type="button" className="hb-btn hb-btn--primary"
                        onClick={() => {
                          if (!state.draft) dispatch({ type: 'start_draft' })
                          setActive(p)
                        }}
                      >
                        {t(lang, 'requestSpecialPrice')}
                      </button>
                    )
                )}
                {!eligible && (
                  <div className="hb-hint">
                    {lang === 'ar' ? 'غير متاح للتفاوض' : 'Not available for negotiation'}
                  </div>
                )}
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
            {t(lang, 'itemsInRequest', { n: draftLines.length })} →
          </button>
        </div>
      )}

      {active && (
        <RequestFlow
          product={active}
          onClose={() => setActive(null)}
          onTierAccepted={(unitPrice) => {
            // AC-2.2 — taking the published tier closes the flow without creating a request.
            setActive(null)
            dispatch({ type: 'discard_draft' })
            setToast(lang === 'ar'
              ? `تم اعتماد السعر المعلن ${formatMoney(unitPrice, { withCurrency: true, lang })} — لا حاجة لطلب.`
              : `Taken at the published price of ${formatMoney(unitPrice, { withCurrency: true, lang })} — no request needed.`)
          }}
          onAddAnother={() => setActive(null)}
          onSubmitted={() => { setActive(null); onGoToRequests() }}
        />
      )}
    </div>
  )
}
