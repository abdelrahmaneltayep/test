/**
 * The grooming register.
 *
 * A flat read of 28 stories buries the thing the document is actually for: the twenty
 * places the draft does not answer the question. So the gaps are counted, filterable, and
 * flagged in colour, and the four that stop estimation are lifted to the top where nobody
 * can groom past them.
 */

import { useMemo, useState } from 'react'
import {
  BLOCKERS, BUILD_ORDER, EPICS, SLICING, STORIES, TRACEABILITY,
  type Gap, type Story,
} from './storiesData'

type Filter = 'all' | 'mvp' | 'phase2' | 'gaps' | 'blocking'
type Theme = 'system' | 'light' | 'dark'

/** The source is written in Markdown emphasis; render the two marks it actually uses. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
        if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

function GapPanel({ gap }: { gap: Gap }) {
  return (
    <aside className={`s-gap${gap.blocking ? ' s-gap--block' : ''}`}>
      <div className="s-gap-head">
        <span className="s-gap-badge">
          {gap.blocking ? `Spec gap ${gap.n} · blocking` : `Spec gap ${gap.n}`}
        </span>
      </div>
      <div className="s-gap-body">
        <p><RichText text={gap.body} /></p>

        {gap.quotes?.map((q) => (
          <blockquote className="s-quote" key={q}><RichText text={q} /></blockquote>
        ))}

        {gap.points && (
          <ol>
            {gap.points.map((pt) => <li key={pt}><RichText text={pt} /></li>)}
          </ol>
        )}

        {gap.readings && (
          <div className="s-readings">
            {gap.readings.map((r) => (
              <div className="s-reading" key={r.label}>
                <span className="s-reading-label">{r.label}</span>
                {r.meaning && <> — <span className="s-reading-meaning"><RichText text={r.meaning} /></span></>}
                <div style={{ marginTop: 4 }}><RichText text={r.consequence} /></div>
              </div>
            ))}
          </div>
        )}

        {gap.closer && <p><RichText text={gap.closer} /></p>}
      </div>
    </aside>
  )
}

function StoryCard({ story }: { story: Story }) {
  return (
    <article className="s-story" id={story.id}>
      <div className="s-story-head">
        <span className="s-story-id">{story.id}</span>
        <h3 className="s-story-title">{story.title}</h3>
        <div className="s-story-meta">
          <span className={`s-tag${story.phase === 'Phase 2' ? ' s-tag--phase2' : ''}`}>{story.phase}</span>
          <span className="s-tag">{story.sections}</span>
        </div>
      </div>

      <p className="s-statement">
        <b>As a</b> {story.role}, <b>I want</b> {story.want}, <b>so that</b> {story.soThat}
      </p>

      <div className="s-acs">
        <h4>Acceptance criteria</h4>
        {story.acs.map((ac, i) => (
          <div className="s-ac" key={ac}>
            <span className="s-ac-id">AC-{i + 1}</span>
            <span><RichText text={ac} /></span>
          </div>
        ))}
      </div>

      {story.note && <p className="s-note"><strong>Note</strong> — <RichText text={story.note} /></p>}
      {story.depends && <p className="s-note"><strong>Depends on</strong> — <RichText text={story.depends} /></p>}

      {story.gaps.map((g) => <GapPanel gap={g} key={g.n} />)}
    </article>
  )
}

export function StoriesApp() {
  const [filter, setFilter] = useState<Filter>('all')
  const [theme, setTheme] = useState<Theme>('system')

  const totals = useMemo(() => {
    const gaps = STORIES.flatMap((s) => s.gaps)
    return {
      stories: STORIES.length,
      epics: EPICS.length,
      gaps: gaps.length,
      blocking: gaps.filter((g) => g.blocking).length,
      mvp: STORIES.filter((s) => s.phase === 'MVP').length,
      phase2: STORIES.filter((s) => s.phase === 'Phase 2').length,
    }
  }, [])

  const shown = useMemo(() => STORIES.filter((s) => {
    if (filter === 'mvp') return s.phase === 'MVP'
    if (filter === 'phase2') return s.phase === 'Phase 2'
    if (filter === 'gaps') return s.gaps.length > 0
    if (filter === 'blocking') return s.gaps.some((g) => g.blocking)
    return true
  }), [filter])

  function applyTheme(next: Theme) {
    setTheme(next)
    const root = document.documentElement
    if (next === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', next)
  }

  const FILTERS: { key: Filter; label: string; n: number; kind?: string }[] = [
    { key: 'all', label: 'All', n: totals.stories },
    { key: 'mvp', label: 'MVP', n: totals.mvp },
    { key: 'phase2', label: 'Phase 2', n: totals.phase2 },
    { key: 'gaps', label: 'Has a gap', n: STORIES.filter((s) => s.gaps.length > 0).length, kind: 'gap' },
    { key: 'blocking', label: 'Blocking', n: STORIES.filter((s) => s.gaps.some((g) => g.blocking)).length, kind: 'block' },
  ]

  return (
    <div className="s-wrap">
      <header className="s-masthead">
        <div className="s-kicker">HIGHBASE · Special Price Request &amp; RFQ · Grooming register</div>
        <h1 className="s-h1">Twenty-eight stories, and the twenty questions the draft never answers</h1>
        <p className="s-lede">
          Every story is written from the draft as written, in the draft’s own vocabulary — nothing
          has been quietly redesigned. Where the draft is silent, ambiguous or contradicts itself,
          the story is still written and the problem is flagged where it bites, with the exact
          question that has to be answered before that story can be estimated.
        </p>
        <p className="s-lede">
          Four of those questions stop estimation outright. They are at the top, because the rest of
          this document is not safe to groom around them.
        </p>
        <div className="s-byline">
          Source: Special Price Request &amp; RFQ Feature Flow Draft · Abdelrahman Eltayep · August 2026
        </div>

        <div className="s-tiles">
          <div className="s-tile"><div className="s-tile-n">{totals.stories}</div><div className="s-tile-l">Stories</div></div>
          <div className="s-tile"><div className="s-tile-n">{totals.epics}</div><div className="s-tile-l">Epics</div></div>
          <div className="s-tile"><div className="s-tile-n">{totals.mvp}</div><div className="s-tile-l">MVP</div></div>
          <div className="s-tile"><div className="s-tile-n">{totals.phase2}</div><div className="s-tile-l">Phase 2</div></div>
          <div className="s-tile s-tile--gap"><div className="s-tile-n">{totals.gaps}</div><div className="s-tile-l">Spec gaps</div></div>
          <div className="s-tile s-tile--block"><div className="s-tile-n">{totals.blocking}</div><div className="s-tile-l">Blocking</div></div>
        </div>

        <section className="s-blockers">
          <div className="s-blockers-head">
            <h2>Blocking questions</h2>
            <p>Four of the twenty stop estimation. The other sixteen can be answered during grooming.</p>
          </div>
          {BLOCKERS.map((b) => (
            <div className="s-blocker" key={b.id}>
              <span className="s-blocker-id">{b.id}</span>
              <span className="s-blocker-q">
                <RichText text={b.question} />
                <span className="s-mono" style={{ color: 'var(--s-ink-3)' }}>
                  {' '}(gap{b.gaps.length > 1 ? 's' : ''} {b.gaps.join(', ')})
                </span>
              </span>
              <span className="s-blocker-meta">blocks {b.blocks}<br />{b.owner}</span>
            </div>
          ))}
        </section>
      </header>

      <div className="s-body">
        <nav className="s-rail" aria-label="Register controls">
          <div className="s-rail-group">
            <h3>Filter</h3>
            <div className="s-filters">
              {FILTERS.map((f) => (
                <button
                  key={f.key} type="button"
                  className={`s-chip${f.kind ? ` s-chip--${f.kind}` : ''}`}
                  aria-pressed={filter === f.key}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label} <span className="s-mono">{f.n}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="s-rail-group">
            <h3>Epics</h3>
            <div className="s-jumps">
              {EPICS.map((e) => {
                const n = shown.filter((s) => s.epic === e.id).length
                return (
                  <button
                    key={e.id} type="button" className="s-jump" disabled={n === 0}
                    style={n === 0 ? { opacity: .38, cursor: 'not-allowed' } : undefined}
                    onClick={() => document.getElementById(e.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  >
                    <span className="s-jump-id">{e.id}</span>
                    <span>{e.title}</span>
                    <span className="s-jump-n">{n}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="s-rail-group">
            <h3>Appearance</h3>
            <button type="button" className="s-themebtn" onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? 'Light' : 'Dark'}
              {theme === 'system' && <span className="s-mono" style={{ color: 'var(--s-ink-3)' }}> · now following system</span>}
            </button>
          </div>
        </nav>

        <main>
          {shown.length === 0 && <p className="s-empty">No stories match that filter.</p>}

          {EPICS.map((epic) => {
            const stories = shown.filter((s) => s.epic === epic.id)
            if (stories.length === 0) return null
            return (
              <section className="s-epic" id={epic.id} key={epic.id}>
                <div className="s-epic-head">
                  <span className="s-epic-id">{epic.id}</span>
                  <h2 className="s-epic-title">{epic.title}</h2>
                  <span className="s-epic-sections">Draft {epic.sections}</span>
                </div>
                {stories.map((s) => <StoryCard story={s} key={s.id} />)}
              </section>
            )
          })}

          <section className="s-appendix">
            <h2>Traceability</h2>
            <p>Coverage: 11 of 11 draft sections. No story exists that does not trace to the draft.</p>
            <div className="s-table-wrap">
              <table className="s-table">
                <thead>
                  <tr><th>Draft section</th><th>Covered by</th><th>Notes</th></tr>
                </thead>
                <tbody>
                  {TRACEABILITY.map((t) => (
                    <tr key={t.section}>
                      <td>{t.section}</td>
                      <td className="s-mono">{t.stories.join(' · ')}</td>
                      <td style={{ color: 'var(--s-ink-2)' }}>{t.note ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="s-appendix">
            <h2>Ticket slicing</h2>
            <p>One ticket per story is the default. Four stories are large enough to split.</p>
            <div className="s-table-wrap">
              <table className="s-table">
                <thead><tr><th>Story</th><th>Split into</th></tr></thead>
                <tbody>
                  {SLICING.map((s) => (
                    <tr key={s.story}>
                      <td className="s-mono">{s.story}</td>
                      <td>{s.parts.map((p, i) => <span key={p}>{i > 0 && ' · '}{p}</span>)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="s-appendix">
            <h2>Recommended build order</h2>
            <div className="s-order">
              {BUILD_ORDER.map((step, i) => (
                <span key={step}>{i > 0 && <i>→ </i>}{step}</span>
              ))}
            </div>
            <p>
              RFQ before Special Price Request is deliberate. The RFQ path needs no attachment and no
              external validation dependency, so it exercises the whole request → respond → accept loop
              end to end while B4 is still being answered. Special Price Request then adds only the proof
              layer on top of a loop that already works.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}
