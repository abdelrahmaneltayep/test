/**
 * Prototype shell.
 *
 * The demo panel is prototype scaffolding, not a product surface: it switches between the
 * three surfaces, flips language and direction (FR-11.1/11.2), toggles the permissions and
 * rules a real tenant would configure, and moves the simulated server clock so the SLA,
 * expiry and sweep behaviour in FR-3.4/FR-3.5 can actually be seen in a review.
 */

import { useMemo, useReducer, useState } from 'react'
import { GUARDRAILS } from '../domain/guardrails'
import { initialState, reducer, RfqContext } from '../store'
import { BuyerDashboard } from './BuyerDashboard'
import { MarketplaceChrome } from './Chrome'
import { BuyerMarketplace } from './BuyerMarketplace'
import { SellerDashboard } from './SellerDashboard'

type Surface = 'marketplace' | 'buyer' | 'seller'

/** A fixed reference time, so the seeded fixtures render identically on every load. */
const SEED_NOW = new Date('2026-08-20T09:00:00Z')

export function App() {
  const [state, dispatch] = useReducer(reducer, SEED_NOW, initialState)
  const [lang, setLang] = useState<'en' | 'ar'>('en')
  const [surface, setSurface] = useState<Surface>('marketplace')

  const ctx = useMemo(() => ({ state, dispatch, lang, setLang }), [state, lang])
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  const SURFACES: { key: Surface; en: string; ar: string }[] = [
    { key: 'marketplace', en: 'Buyer · Marketplace', ar: 'المشتري · السوق' },
    { key: 'buyer', en: 'Buyer · Dashboard', ar: 'المشتري · لوحة الطلبات' },
    { key: 'seller', en: 'Seller · Dashboard', ar: 'البائع · لوحة الطلبات' },
  ]

  return (
    <RfqContext.Provider value={ctx}>
      <div className="hb-app" dir={dir} lang={lang}>
        <div className="hb-demo">
          <div className="hb-demo-inner">
            <span className="hb-demo-label">HIGHBASE · SPR/RFQ</span>

            <div className="hb-demo-group">
              <span>Surface</span>
              {SURFACES.map((s) => (
                <button
                  key={s.key} type="button" className="hb-demo-btn"
                  aria-pressed={surface === s.key} onClick={() => setSurface(s.key)}
                >
                  {lang === 'ar' ? s.ar : s.en}
                </button>
              ))}
            </div>

            <div className="hb-demo-group">
              <span>Language</span>
              {/* AC-21.5 — switching language mid-flow preserves everything entered. */}
              <button type="button" className="hb-demo-btn" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
              <button type="button" className="hb-demo-btn" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')}>العربية · RTL</button>
            </div>

            <div className="hb-demo-group">
              <span>Phase</span>
              {/* AC-3.3 — with Phase 2 off the Case 1 card is not rendered at all. */}
              <button type="button" className="hb-demo-btn" aria-pressed={state.phase2Enabled}
                onClick={() => dispatch({ type: 'set_flag', key: 'phase2Enabled', value: true })}>P1 + P2</button>
              <button type="button" className="hb-demo-btn" aria-pressed={!state.phase2Enabled}
                onClick={() => dispatch({ type: 'set_flag', key: 'phase2Enabled', value: false })}>P1 only</button>
            </div>

            <div className="hb-demo-group">
              <span>Auto-accept (FR-3.4g)</span>
              {[0, 3, 10].map((p) => (
                <button key={p} type="button" className="hb-demo-btn"
                  aria-pressed={state.autoAcceptPercent === p}
                  onClick={() => dispatch({ type: 'set_auto_accept', percent: p })}>
                  {p === 0 ? 'off' : `${p}%`}
                </button>
              ))}
            </div>

            <div className="hb-demo-group">
              <span>Card CTA</span>
              {/* Three layouts for the same action, switchable so they compare in place. */}
              {([
                ['stacked', 'full label'],
                ['compact', 'icon + Request'],
                ['beside_price', 'beside the price'],
                ['under_price', 'under the price'],
              ] as const).map(([layout, label]) => (
                <button
                  key={layout} type="button" className="hb-demo-btn"
                  aria-pressed={state.cardCta === layout}
                  onClick={() => dispatch({ type: 'set_card_cta', layout })}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="hb-demo-group">
              <span>Seller permissions</span>
              <button type="button" className="hb-demo-btn" aria-pressed={state.canOverrideFloor}
                onClick={() => dispatch({ type: 'set_flag', key: 'canOverrideFloor', value: !state.canOverrideFloor })}>
                floor override
              </button>
              <button type="button" className="hb-demo-btn" aria-pressed={state.canCreateTemplate}
                onClick={() => dispatch({ type: 'set_flag', key: 'canCreateTemplate', value: !state.canCreateTemplate })}>
                templates
              </button>
            </div>

            <div className="hb-demo-group">
              <span>Server clock</span>
              {/* FR-3.5 — every jump re-runs the idempotent expiry sweep. */}
              <button type="button" className="hb-demo-btn" onClick={() => dispatch({ type: 'advance_time', hours: 1 })}>+1h</button>
              <button type="button" className="hb-demo-btn" onClick={() => dispatch({ type: 'advance_time', hours: 4 })}>+4h</button>
              <button type="button" className="hb-demo-btn" onClick={() => dispatch({ type: 'advance_time', hours: 24 })}>+1d</button>
              <button type="button" className="hb-demo-btn" onClick={() => dispatch({ type: 'advance_time', hours: 24 * 8 })}>+8d</button>
              <button type="button" className="hb-demo-btn" onClick={() => dispatch({ type: 'set_now', now: SEED_NOW })}>reset</button>
            </div>

            {/* AC-21.3 — a mixed Latin/numeric run is pinned LTR inside an RTL page, so
                bidi reordering does not scramble the timestamp. */}
            <span className="hb-demo-clock" dir="ltr">
              {state.now.toISOString().replace('T', ' ').slice(0, 16)} UTC · SLA {GUARDRAILS.sellerResponseSlaHours.default}h
            </span>
          </div>
        </div>

        {surface === 'marketplace' && (
          <MarketplaceChrome lang={lang} setLang={setLang} cartCount={state.draft?.lines.length ?? 0}>
            <BuyerMarketplace onGoToRequests={() => setSurface('buyer')} />
          </MarketplaceChrome>
        )}
        {surface === 'buyer' && <BuyerDashboard onBrowse={() => setSurface('marketplace')} />}
        {surface === 'seller' && <SellerDashboard />}

        <div className="hb-shell" style={{ paddingTop: 0, paddingBottom: 28 }}>
          <p className="hb-hint">
            {lang === 'ar'
              ? 'نموذج أولي — البيانات في الذاكرة فقط. راجع مستند المتطلبات:'
              : 'Prototype — all data is in memory. See the PRD for the requirement each behaviour implements.'}
            {' '}<span dir="ltr">docs/HIGHBASE-Special-Price-RFQ-PRD.md</span>
          </p>
        </div>
      </div>
    </RfqContext.Provider>
  )
}
