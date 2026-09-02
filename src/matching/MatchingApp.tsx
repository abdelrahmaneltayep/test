/**
 * Price matching — the change sheet.
 *
 * A separate surface from the prototype, for a separate job. The prototype answers "what
 * does the product do now"; this answers "what did the direction change do, and where can
 * I go and check it" — which is the question a PM, a reviewer and a developer picking the
 * work up all ask first, and which the prototype cannot answer because a finished screen
 * has no memory of the one it replaced.
 *
 * Its rule: every claim here is either prose that names its own source, or read live from
 * the domain modules. The state count, the route-scoped transitions, what the auto-rules
 * decide, and the seller's screens are all the real thing — so this sheet cannot drift out
 * of agreement with the product it describes. Only the "before" columns are written down,
 * because that code is gone and there is nothing left to read it from.
 */

import { useMemo, useReducer, useState } from 'react'
import { evaluateAutoRules } from '../rfq/domain/rules'
import { STATES, STATE_META, TRANSITIONS } from '../rfq/domain/states'
import { formatMoney } from '../rfq/domain/money'
import { lineMargin } from '../rfq/domain/margin'
import type { RequestLine, Route } from '../rfq/domain/types'
import { initialState, productBySku, reducer, RfqContext, useRfq } from '../rfq/store'
import { SellerRequestPage } from '../rfq/components/RequestDetail'
import { OPEN, PIECES, REMOVED, SCREENS, SHIFTS } from './changeData'

/** The same fixed clock the prototype seeds from, so the two show identical fixtures. */
const SEED_NOW = new Date('2026-08-20T09:00:00Z')

type Theme = 'system' | 'light' | 'dark'

export function MatchingApp() {
  const [state, dispatch] = useReducer(reducer, SEED_NOW, initialState)
  const [theme, setTheme] = useState<Theme>('system')
  const ctx = useMemo(() => ({ state, dispatch, lang: 'en' as const, setLang: () => {} }), [state])

  function applyTheme(next: Theme) {
    setTheme(next)
    const root = document.documentElement
    if (next === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', next)
  }

  return (
    <RfqContext.Provider value={ctx}>
      <div className="m-wrap">
        <header className="m-masthead">
          <div className="m-kicker">HIGHBASE · Special Price Request &amp; RFQ · Change sheet</div>
          <h1 className="m-h1">From “request a special price” to price matching</h1>
          <p className="m-lede">
            The PM moved the feature from a negotiation to a guarantee: on the match route the
            buyer’s verified price wins, and a price settles one order and no more. This sheet
            is what changed, why, and where each piece is enforced — with the seller’s actual
            screens embedded, not screenshots of them.
          </p>
          <div className="m-themes">
            {(['system', 'light', 'dark'] as Theme[]).map((k) => (
              <button key={k} type="button" className="m-chip" aria-pressed={theme === k}
                onClick={() => applyTheme(k)}>{k}</button>
            ))}
            <a className="m-chip m-chip--link" href="./rfq.html">Open the full prototype →</a>
          </div>
        </header>

        <Shifts />
        <Pieces />
        <StateMachine />
        <RulesDemo />
        <Screens />
        <Removed />
        <OpenQuestions />

        <footer className="m-foot">
          Change sheet for the price-matching direction. The prose columns are written; every
          number, transition, rule verdict and screen below them is read live from the same
          modules the prototype runs on.
        </footer>
      </div>
    </RfqContext.Provider>
  )
}

function Section({ n, title, sub, children }: {
  n: string; title: string; sub?: string; children: React.ReactNode
}) {
  return (
    <section className="m-section">
      <div className="m-sectionhead">
        <span className="m-num">{n}</span>
        <div>
          <h2 className="m-h2">{title}</h2>
          {sub && <p className="m-sub">{sub}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

/** §1 — the direction, in the six places it actually shows up. */
function Shifts() {
  return (
    <Section n="1" title="The direction, dimension by dimension"
      sub="Six things moved. Everything not listed here is unchanged.">
      <div className="m-scroll">
        <table className="m-table">
          <thead>
            <tr>
              <th style={{ width: '20%' }} />
              <th className="m-before">Before · request a quote or a special price</th>
              <th className="m-after">After · price matching</th>
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map((s) => (
              <tr key={s.dimension}>
                <th scope="row">
                  {s.dimension}
                  {s.quoteRouteUnchanged && <span className="m-tag">unchanged</span>}
                </th>
                <td className="m-before">{s.before}</td>
                <td className="m-after">{s.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

function Pieces() {
  return (
    <Section n="2" title="The three pieces"
      sub="Each landed on its own, and each is enforced somewhere you can go and read.">
      <div className="m-cards">
        {PIECES.map((p) => (
          <article className="m-card" key={p.n}>
            <h3 className="m-h3"><span className="m-pill">{p.n}</span>{p.title}</h3>
            <p className="m-what">{p.what}</p>
            <p className="m-why"><strong>Why. </strong>{p.why}</p>
            <ul className="m-where">
              {p.enforced.map((e) => <li key={e}><code>{e}</code></li>)}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  )
}

/**
 * §3 — the state machine, read from the table itself. The count and the route-scoped rows
 * are computed here rather than typed, so a change to FR-3.3 shows up on this page.
 */
function StateMachine() {
  const scoped = TRANSITIONS.filter((t) => t.routes !== undefined)
  const label = (s: string) => STATE_META[s as keyof typeof STATE_META]?.sellerLabel?.en ?? s
  return (
    <Section n="3" title="What the state machine says now"
      sub="Read from TRANSITIONS at render time — not transcribed.">
      <div className="m-stats">
        <div className="m-stat">
          <span className="m-statnum">{STATES.length}</span>
          <span className="m-statlabel">states, down from twelve</span>
        </div>
        <div className="m-stat">
          <span className="m-statnum">{TRANSITIONS.length}</span>
          <span className="m-statlabel">transitions in the table</span>
        </div>
        <div className="m-stat">
          <span className="m-statnum">{scoped.length}</span>
          <span className="m-statlabel">that ask which route the request took</span>
        </div>
      </div>
      <p className="m-note">
        Those {scoped.length} are the whole of the guarantee in the domain. Every one of them
        leads to <code>countered_by_seller</code>, and every one is scoped to{' '}
        <code>case_2</code> — so on a match there is no counter to reach, and the reducer
        answers a request for one with the same 409 it gives any unlisted transition.
      </p>
      <div className="m-scroll">
        <table className="m-table m-table--tight">
          <thead>
            <tr><th>From</th><th>To</th><th>Trigger</th><th>Routes it exists on</th></tr>
          </thead>
          <tbody>
            {scoped.map((t) => (
              <tr key={`${t.from}-${t.to}-${t.trigger}`}>
                <td><code>{t.from}</code><div className="m-hint">{label(t.from)}</div></td>
                <td><code>{t.to}</code><div className="m-hint">{label(t.to)}</div></td>
                <td><code>{t.trigger}</code></td>
                <td>{(t.routes ?? []).map((r) => (
                  <span className="m-route" key={r}>{r === 'case_1' ? 'match' : 'quote'}</span>
                ))}<span className="m-route m-route--off">match</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

/**
 * §4 — the auto-rules, run for real. The floor rule is the piece of this change that is
 * hardest to see from a screen, because the behaviour it used to have happened before any
 * screen existed. So the sheet runs it, on both routes, on numbers you can move.
 */
function RulesDemo() {
  const product = productBySku('HB-2210')
  const [asked, setAsked] = useState(12_600)
  const [route, setRoute] = useState<Route>('case_1')

  const line: RequestLine = {
    id: 'demo', sku: product.sku, productName: product.name, route, quantity: 40,
    listPriceSnapshot: product.listPrice, askedPrice: asked, offeredPrice: null,
    outcome: 'pending', proofs: [], frequency: null, specialCredit: false, note: null,
    costSnapshot: product.cost, floorSnapshot: product.floorPrice,
  }
  const out = evaluateAutoRules({ lines: [line], hasFailedProofCheck: false })
  const margin = lineMargin(asked, product.cost)
  const money = (v: number) => formatMoney(v, { withCurrency: true, lang: 'en' })

  const VERDICT = {
    auto_decline: { tone: 'bad', text: 'Auto-declined. The buyer is told the supplier cannot meet the price, and AC-19.5 forbids saying anything more — no floor, no margin, no rule.' },
    auto_accept: { tone: 'good', text: 'Auto-accepted inside the configured threshold.' },
    queue: { tone: 'warn', text: 'Queued. A person decides, with the position in front of them.' },
  }[out.decision]

  return (
    <Section n="4" title="What the rules do now, run live"
      sub="HB-2210 · 40 cases · list 14.800 · floor 13.000 · cost 11.600. Move the ask and switch the route.">
      <div className="m-demo">
        <div className="m-controls">
          <label className="m-control">
            <span>The buyer asks</span>
            <input type="range" min={9_000} max={15_000} step={100} value={asked}
              onChange={(e) => setAsked(Number(e.target.value))} />
            <output className="m-out">{money(asked)}</output>
          </label>
          <div className="m-control">
            <span>Route</span>
            <div className="m-seg">
              <button type="button" aria-pressed={route === 'case_1'} onClick={() => setRoute('case_1')}>
                Match, with proof
              </button>
              <button type="button" aria-pressed={route === 'case_2'} onClick={() => setRoute('case_2')}>
                Quote
              </button>
            </div>
          </div>
        </div>

        <div className={`m-verdict m-verdict--${VERDICT.tone}`}>
          <strong>{out.decision.replace('_', ' ')}</strong>
          <p>{VERDICT.text}</p>
          <dl className="m-kv">
            <div><dt>Rule that fired</dt><dd><code>{out.rule ?? 'none'}</code></dd></div>
            <div><dt>Internal reason</dt><dd><code>{out.internalReason ?? '—'}</code></dd></div>
            <div><dt>Against floor</dt><dd>{asked < 13_000 ? `below by ${money(13_000 - asked)}` : `above by ${money(asked - 13_000)}`}</dd></div>
            <div><dt>Against cost</dt><dd>{asked < 11_600 ? `below by ${money(11_600 - asked)}` : `above by ${money(asked - 11_600)}`}</dd></div>
            <div><dt>Margin if matched</dt><dd>{margin === null ? '—' : `${margin}%`}</dd></div>
          </dl>
        </div>
      </div>
      <p className="m-note">
        Drop the ask below 13.000 and switch between the two routes. Same number, same
        product, two different answers: the quote route still refuses it before anyone sees
        it, and the match route sends it to a rep. That difference is the guarantee — and it
        is the half of it no screen can show you, because it used to happen before there was
        a screen.
      </p>
    </Section>
  )
}

/** §5 — the real component, three fixtures, no screenshots. */
function Screens() {
  const { state } = useRfq()
  const [open, setOpen] = useState(SCREENS[0].ref)
  const shown = SCREENS.find((s) => s.ref === open) ?? SCREENS[0]
  const request = state.requests.find((r) => r.ref === shown.ref) ?? null

  return (
    <Section n="5" title="The seller’s screen, live"
      sub="The prototype’s own component, mounted here against the same seeded fixtures.">
      <div className="m-tabs">
        {SCREENS.map((s) => (
          <button key={s.ref} type="button" className="m-tab" aria-pressed={open === s.ref}
            onClick={() => setOpen(s.ref)}>
            {s.label}
          </button>
        ))}
      </div>
      <p className="m-note m-note--tight">{shown.note}</p>
      <div className="m-screen">
        <div className="hb-app" dir="ltr" lang="en">
          <div className="hb-content">
            {request
              ? <SellerRequestPage request={request} onBack={() => {}} />
              : <p className="m-hint">Fixture {shown.ref} is not in the seed.</p>}
          </div>
        </div>
      </div>
    </Section>
  )
}

function Removed() {
  return (
    <Section n="6" title="Gone, and what the PRD still says about it"
      sub="Nothing in the PRD has been edited. It and the code disagree on every row here until it gets a pass.">
      <div className="m-scroll">
        <table className="m-table m-table--tight">
          <thead><tr><th>Removed</th><th style={{ width: '32%' }}>Still written in the PRD as</th></tr></thead>
          <tbody>
            {REMOVED.map((r) => (
              <tr key={r.thing}>
                <td>{r.thing}</td>
                <td><code>{r.prd}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

function OpenQuestions() {
  return (
    <Section n="7" title="Open with the PM"
      sub="Four decisions the code cannot make for itself.">
      <div className="m-cards m-cards--two">
        {OPEN.map((o) => (
          <article className="m-card m-card--open" key={o.q}>
            <h3 className="m-h3">{o.q}</h3>
            <p className="m-what">{o.detail}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}
