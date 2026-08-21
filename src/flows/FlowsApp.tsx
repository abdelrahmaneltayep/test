/**
 * The flow sheet: one figure per PRD user story, grouped by the role that owns it.
 *
 * Built to be handed to a PM, so the page answers the two questions a PM asks of a flow
 * set before any individual flow — which role owns this, and where does it hand off — and
 * flags the three places the prototype has already moved past the document.
 */

import { useMemo, useState } from 'react'
import { ACTOR_LABELS, FLOWS, GROUPS, type Group } from './flowsData'
import { FlowDiagram } from './FlowDiagram'

type RoleFilter = 'all' | Group
type PhaseFilter = 'all' | 'P1' | 'P2'
type Theme = 'system' | 'light' | 'dark'

export function FlowsApp() {
  const [role, setRole] = useState<RoleFilter>('all')
  const [phase, setPhase] = useState<PhaseFilter>('all')
  const [theme, setTheme] = useState<Theme>('system')

  const shown = useMemo(() => FLOWS.filter(
    (f) => (role === 'all' || f.group === role) && (phase === 'all' || f.phase === phase),
  ), [role, phase])

  const counts = useMemo(() => ({
    buyer: FLOWS.filter((f) => f.group === 'buyer').length,
    seller: FLOWS.filter((f) => f.group === 'seller').length,
    cross: FLOWS.filter((f) => f.group === 'cross').length,
    p1: FLOWS.filter((f) => f.phase === 'P1').length,
    p2: FLOWS.filter((f) => f.phase === 'P2').length,
    diverge: FLOWS.filter((f) => f.divergence).length,
  }), [])

  function applyTheme(next: Theme) {
    setTheme(next)
    const root = document.documentElement
    if (next === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', next)
  }

  return (
    <div className="f-wrap">
      <header className="f-masthead">
        <div className="f-kicker">HIGHBASE · Special Price Request &amp; RFQ · User flows</div>
        <h1 className="f-h1">Every user story as a flow, and who is holding the request at each step</h1>
        <p className="f-lede">
          Twenty-three flows, one per user story in the PRD, grouped by the role that owns them.
          Inside each diagram the colour of a step says <em>who acts</em> — so a handoff between buyer
          and seller reads as a colour change rather than something to work out from the labels.
        </p>
        <p className="f-lede">
          Blocked outcomes are drawn in red, which is a separate signal from the three role colours:
          it marks the places the system stops the flow rather than the person deciding to.
          Three flows carry an amber note where the prototype has already moved past the document.
        </p>
        <div className="f-byline">
          Source: docs/HIGHBASE-Special-Price-RFQ-PRD.md · {FLOWS.length} flows ·{' '}
          {counts.buyer} buyer · {counts.seller} seller · {counts.cross} both · {counts.diverge} diverge from the PRD
        </div>

        <div className="f-legend">
          {(['buyer', 'seller', 'system', 'either'] as const).map((a) => (
            <span className="f-legend-item" key={a}>
              <span className={`f-swatch f-swatch--${a}`} />{ACTOR_LABELS[a]}
            </span>
          ))}
          <span className="f-legend-item"><span className="f-swatch f-swatch--stop" />Blocked by the system</span>
          <span className="f-legend-item">
            {/* Drawn rather than clipped: a clipped CSS border renders as a broken outline. */}
            <svg width="24" height="14" viewBox="0 0 24 14" aria-hidden="true" className="f-swatch-svg">
              <path d="M4,1 H20 L23,7 L20,13 H4 L1,7 Z" />
            </svg>
            Decision point
          </span>
        </div>
      </header>

      <div className="f-controls">
        <div className="f-ctrl">
          <span>Role</span>
          <button type="button" className="f-btn" aria-pressed={role === 'all'} onClick={() => setRole('all')}>All {FLOWS.length}</button>
          <button type="button" className="f-btn" aria-pressed={role === 'buyer'} onClick={() => setRole('buyer')}>Buyer {counts.buyer}</button>
          <button type="button" className="f-btn" aria-pressed={role === 'seller'} onClick={() => setRole('seller')}>Seller {counts.seller}</button>
          <button type="button" className="f-btn" aria-pressed={role === 'cross'} onClick={() => setRole('cross')}>Both {counts.cross}</button>
        </div>
        <div className="f-ctrl">
          <span>Phase</span>
          <button type="button" className="f-btn" aria-pressed={phase === 'all'} onClick={() => setPhase('all')}>All</button>
          <button type="button" className="f-btn" aria-pressed={phase === 'P1'} onClick={() => setPhase('P1')}>P1 {counts.p1}</button>
          <button type="button" className="f-btn" aria-pressed={phase === 'P2'} onClick={() => setPhase('P2')}>P2 {counts.p2}</button>
        </div>
        <div className="f-ctrl" style={{ marginInlineStart: 'auto' }}>
          <button type="button" className="f-btn" onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {shown.length === 0 && <p className="f-empty">No flows match that combination.</p>}

      {GROUPS.map((g) => {
        const flows = shown.filter((f) => f.group === g.id)
        if (flows.length === 0) return null
        return (
          <section className="f-group" id={g.id} key={g.id}>
            <div className="f-group-head">
              <h2>{g.label}</h2>
              <p>{g.blurb}</p>
            </div>

            {flows.map((flow) => (
              <figure className="f-figure" key={flow.id}>
                <div className="f-fig-head">
                  <span className="f-fig-id">{flow.id}</span>
                  <h3 className="f-fig-title">{flow.title}</h3>
                  <span className="f-fig-phase">{flow.phase}</span>
                </div>
                <div className="f-canvas"><FlowDiagram flow={flow} /></div>
                <figcaption className="f-figcaption">{flow.caption}</figcaption>
                {flow.divergence && (
                  <p className="f-divergence">
                    <b>Prototype has moved on</b>
                    {flow.divergence}
                  </p>
                )}
              </figure>
            ))}
          </section>
        )
      })}
    </div>
  )
}
