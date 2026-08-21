/**
 * The specimen sheet. One plate per variant, each holding a real HIGHBASE product card
 * with only its action row swapped.
 *
 * The controls exist because they are the conditions that actually decide between these
 * layouts: whether the buyer already has a request open (AC-1.5 changes the label and its
 * length), how wide the card is in the grid, and whether the page is running right to
 * left. Several variants that look fine at 300 px fall apart at 168 px in Arabic, and
 * that is the point of being able to switch.
 */

import { useState } from 'react'
import { CTA_VARIANTS, type CtaProps } from './ctaVariants'

type Width = 'grid' | 'narrow' | 'wide'

const SPECIMEN = {
  name: { en: 'Almarai Fresh Milk 12×1L', ar: 'حليب المراعي الطازج ١٢×١ لتر' },
  sku: 'HB-4471',
  unit: { en: 'case', ar: 'كرتون' },
  emoji: '🥛',
  listPrice: '10.250',
  tier: { qty: 120, price: '9.600' },
  ref: 'SPR-2608-0001',
}

const T = {
  listPrice: { en: 'List price', ar: 'السعر المعلن' },
  units: { en: '120+ units', ar: '120+ وحدة' },
  wholesale: { en: 'Wholesale', ar: 'جملة' },
  supplier: { en: 'Supplier', ar: 'المورّد' },
  supplierName: { en: 'Gulf Distribution Co.', ar: 'شركة الخليج للتوزيع' },
} as const

export function VariantsGallery() {
  const [requested, setRequested] = useState(false)
  const [lang, setLang] = useState<'en' | 'ar'>('en')
  const [width, setWidth] = useState<Width>('grid')

  const cta: CtaProps = { requested, ref: SPECIMEN.ref, lang }
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  return (
    /* Chrome stays LTR: it is reviewer-facing English. Only the specimens flip. */
    <div className="v-page">
      <header className="v-head">
        <div className="v-eyebrow">HIGHBASE · Product card · Action row</div>
        <h1 className="v-title">Ten ways to put Add and Request on one card</h1>
        <p className="v-standfirst">
          The same card ten times, with only the action row changed. Every specimen carries both
          actions — the cart, and the negotiation entry point that becomes <em>View request</em> once
          one is open. Switch the state, the card width and the direction: those three are what
          actually separate these, not the styling.
        </p>
      </header>

      <div className="v-controls">
        <div className="v-ctrl">
          <span>State</span>
          <button type="button" className="v-btn" aria-pressed={!requested} onClick={() => setRequested(false)}>No request yet</button>
          <button type="button" className="v-btn" aria-pressed={requested} onClick={() => setRequested(true)}>Request open</button>
        </div>
        <div className="v-ctrl">
          <span>Card width</span>
          <button type="button" className="v-btn" aria-pressed={width === 'narrow'} onClick={() => setWidth('narrow')}>168 px</button>
          <button type="button" className="v-btn" aria-pressed={width === 'grid'} onClick={() => setWidth('grid')}>232 px</button>
          <button type="button" className="v-btn" aria-pressed={width === 'wide'} onClick={() => setWidth('wide')}>300 px</button>
        </div>
        <div className="v-ctrl">
          <span>Direction</span>
          <button type="button" className="v-btn" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
          <button type="button" className="v-btn" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')}>عربي · RTL</button>
        </div>
      </div>

      <div className="v-grid">
        {CTA_VARIANTS.map((v) => (
          <article className="v-plate" key={v.id}>
            <div className="v-plate-head">
              <span className="v-num">{String(v.id).padStart(2, '0')}</span>
              <h2 className="v-name">{v.name.en}</h2>
            </div>

            <div className="v-stage">
              <div className={`hb-card hb-prod v-card-w v-card-w--${width}`} dir={dir} lang={lang}>
                <div className={`hb-prod-media${v.mediaSlot ? ' v-media-tagged' : ''}`}>
                  {v.mediaSlot?.(cta)}
                  <span className="hb-prod-unit">{SPECIMEN.unit[lang]}</span>
                  <button type="button" className="hb-prod-save" aria-label="Save item">🔖</button>
                  <span aria-hidden="true">{SPECIMEN.emoji}</span>
                  <span className="hb-prod-tag"><span aria-hidden="true">📦</span>{T.wholesale[lang]}</span>
                </div>

                <div className="hb-prod-body">
                  <div className="hb-prod-name">{SPECIMEN.name[lang]}</div>

                  <div className="hb-priceband">
                    <span className="hb-priceband-label">{T.listPrice[lang]}</span>
                    {v.priceBandSlot
                      ? v.priceBandSlot(cta)
                      : <span className="hb-priceband-value"><small>BHD</small>{SPECIMEN.listPrice}</span>}
                  </div>
                  {v.priceBandSlot && (
                    <div className="hb-priceband" style={{ marginTop: -4 }}>
                      <span className="hb-priceband-label">{T.units[lang]}</span>
                      <span className="hb-priceband-value"><small>BHD</small>{SPECIMEN.tier.price}</span>
                    </div>
                  )}
                  {!v.priceBandSlot && (
                    <div className="hb-priceband hb-priceband--tier">
                      <span className="hb-priceband-label">{T.units[lang]}</span>
                      <span className="hb-priceband-value"><small>BHD</small>{SPECIMEN.tier.price}</span>
                    </div>
                  )}

                  <div className="hb-prod-supplier">
                    {T.supplier[lang]}: <b>{T.supplierName[lang]}</b>
                  </div>

                  {v.render(cta)}
                </div>
              </div>
            </div>

            <div className="v-note">
              <div className="v-note-row">
                <span className="v-note-key">Buys</span>
                <span className="v-note-val">{v.buys}</span>
              </div>
              <div className="v-note-row">
                <span className="v-note-key">Costs</span>
                <span className="v-note-val">{v.costs}</span>
              </div>
            </div>

            {/* Flagged where the layout contradicts something already agreed. */}
            {v.conflict && (
              <div className="v-flag">
                <span aria-hidden="true">⚠</span>
                <span>{v.conflict}</span>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
