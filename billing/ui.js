/**
 * Shared components. One drawer, one table, one money renderer, for all three surfaces.
 *
 * The money renderer matters more than it looks. Every amount on every screen goes through
 * `money()`, which stamps `data-money` on the element it returns — which is what lets
 * acceptance test 18 walk the rendered page and prove nothing shows two decimals or four.
 * A formatter you can bypass is a formatter that gets bypassed.
 */
;(function (root, factory) {
  const api = factory(root.HB, root.HBStrings, root)
  root.HBUI = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function (HB, S, root) {
  'use strict'

  // ── DOM helper ───────────────────────────────────────────────────────────
  function el(tag, props, children) {
    const node = document.createElement(tag)
    for (const k in props || {}) {
      const v = props[k]
      if (v === null || v === undefined || v === false) continue
      if (k === 'class') node.className = v
      else if (k === 'text') node.textContent = v
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v)
      else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v)
      else node.setAttribute(k, v === true ? '' : v)
    }
    for (const c of [].concat(children || [])) {
      if (c === null || c === undefined || c === false) continue
      node.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)))
    }
    return node
  }
  const frag = (children) => {
    const f = document.createDocumentFragment()
    for (const c of [].concat(children || [])) if (c !== null && c !== undefined && c !== false) f.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)))
    return f
  }

  // ── Money ────────────────────────────────────────────────────────────────
  function money(fils, opts) {
    const o = opts || {}
    const node = el('span', { 'data-money': '', class: o.class || null })
    node.textContent = HB.money(fils, { currency: o.currency, signed: o.signed })
    // 'auto' colours both directions — right for a ledger movement, wrong for an order
    // value, where a positive number is not a credit and green would imply one.
    if (o.tone === 'auto') node.classList.add(fils < 0 ? 'neg' : fils > 0 ? 'pos' : 'muted')
    else if (o.tone === 'negative') { if (fils < 0) node.classList.add('neg') }
    else if (o.tone) node.classList.add(o.tone)
    return node
  }
  const moneyText = (fils, opts) => HB.money(fils, opts || {})

  // ── Chips ────────────────────────────────────────────────────────────────
  const postingChip = (code) => el('span', { class: 'hb-code hb-code--' + code, title: HB.POSTING[code].label }, code)
  const pill = (text, tone) => el('span', { class: 'hb-pill' + (tone ? ' hb-pill--' + tone : '') }, text)
  const routePill = (route) => route === 'highbase' ? pill(S.ledger.highbase, 'blue') : pill(S.ledger.direct, 'orange')
  const termsPill = (terms) => terms === 'credit' ? pill(S.ledger.credit, 'navy') : pill(S.ledger.immediate)

  /** The standing grade, wherever it appears — wallet, admin exposure, run detail. */
  const standingBadge = (grade) =>
    el('span', { class: 'hb-standing hb-standing--' + grade },
      [el('span', { class: 'hb-standing-dot', 'aria-hidden': 'true' }), S.standing[grade]])

  // ── Tables ───────────────────────────────────────────────────────────────
  /**
   * Columns declare their own alignment and rendering, so no caller writes a `<td>`. Rows
   * that represent an order are keyboard-reachable and open the drawer on Enter as well as
   * on click — a row only a mouse can reach is a row half the reviewers cannot open.
   */
  function table(spec) {
    const wrap = el('div', { class: 'hb-tablewrap' })
    const t = el('table', { class: 'hb-table' + (spec.compact ? ' hb-table--compact' : '') })
    t.appendChild(el('thead', {}, el('tr', {}, spec.columns.map((c) =>
      el('th', { class: c.num ? 'num' : null, scope: 'col' }, c.label)))))

    const body = el('tbody')
    for (const row of spec.rows) {
      const clickable = spec.onRowClick && spec.rowKey && spec.rowKey(row)
      const tr = el('tr', clickable ? {
        'data-click': '', tabindex: '0', role: 'button',
        'aria-label': spec.rowLabel ? spec.rowLabel(row) : undefined,
        onclick: () => spec.onRowClick(row),
        onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); spec.onRowClick(row) } },
      } : {})
      for (const c of spec.columns) tr.appendChild(el('td', { class: c.num ? 'num' : null }, c.cell(row)))
      body.appendChild(tr)
    }
    t.appendChild(body)

    if (spec.foot) {
      t.appendChild(el('tfoot', {}, el('tr', {}, spec.foot.map((f) =>
        el('td', { class: f.num ? 'num' : null, colspan: f.span || null }, f.cell)))))
    }
    wrap.appendChild(t)
    return wrap
  }

  // ── Empty, loading, error ────────────────────────────────────────────────
  const empty = (title, note, action) =>
    el('div', { class: 'hb-empty' }, [
      el('div', { class: 'hb-empty-mark', 'aria-hidden': 'true' }, '—'),
      el('h3', {}, title), el('p', {}, note), action || null,
    ])
  const loading = (rows) =>
    el('div', { class: 'hb-card-body', 'aria-busy': 'true', 'aria-label': S.common.loading },
      Array.from({ length: rows || 4 }, (_, i) =>
        el('div', { class: 'hb-skeleton', style: { width: [92, 78, 85, 64, 71][i % 5] + '%' } })))
  const errorState = () => empty(S.common.errorTitle, S.common.errorNote)

  // ── Cards ────────────────────────────────────────────────────────────────
  function card(opts) {
    return el('section', { class: 'hb-card' }, [
      opts.title ? el('div', { class: 'hb-card-head' }, [
        el('div', {}, [el('h2', {}, opts.title), opts.note ? el('p', { class: 'hb-sub' }, opts.note) : null]),
        opts.actions ? el('div', { style: { marginInlineStart: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' } }, opts.actions) : null,
      ]) : null,
      opts.flush ? opts.body : el('div', { class: 'hb-card-body' }, opts.body),
      opts.foot ? el('div', { class: 'hb-card-foot' }, opts.foot) : null,
    ])
  }

  const note = (label, body) => el('div', { class: 'hb-note' }, [el('b', {}, label + ' — '), body])
  const banner = (tone, strongText, body) =>
    el('div', { class: 'hb-banner hb-banner--' + tone }, [
      el('div', {}, [strongText ? el('strong', {}, strongText) : null, body ? el('div', {}, body) : null]),
    ])

  /** A computation shown as a computation, not as a result. */
  function calc(rows, expr) {
    return el('div', { class: 'hb-calc' }, [
      /*
       * A movement is coloured and signed; a balance is neither. Showing "+518.500" in
       * green for a stated balance reads as money arriving, when the number is the whole
       * position — and on this screen it is the wrong position.
       */
      ...rows.map((r) => el('div', { class: 'hb-calc-row' + (r.rule ? ' hb-calc-row--rule' : '') }, [
        el('span', {}, r.label),
        money(r.value, {
          currency: true,
          tone: r.rule || r.plain ? null : 'auto',
          signed: !r.rule && !r.plain && r.value > 0,
        }),
      ])),
      expr ? el('div', { class: 'hb-calc-expr' }, expr) : null,
    ])
  }

  /** A ratio against its threshold — the shape every standing input is shown in. */
  function ratio(opts) {
    const tripped = opts.dir === 'below' ? opts.value < opts.threshold : opts.value >= opts.threshold
    const scale = Math.max(opts.value, opts.threshold) * 1.25 || 1
    return el('div', { class: 'hb-ratio' + (tripped ? ' hb-ratio--trip' : '') }, [
      el('div', { class: 'hb-ratio-head' }, [
        el('b', {}, opts.display), el('span', { class: 'hb-ratio-name' }, opts.label),
        tripped ? el('span', { style: { marginInlineStart: 'auto' } }, pill(opts.dir === 'below' ? 'Below floor' : 'Over limit', 'red')) : null,
      ]),
      el('div', { class: 'hb-ratio-bar' }, [
        el('div', { class: 'hb-ratio-fill', style: { width: Math.min(100, (opts.value / scale) * 100) + '%' } }),
        el('div', { class: 'hb-ratio-mark', style: { left: Math.min(100, (opts.threshold / scale) * 100) + '%' }, title: 'Threshold' }),
      ]),
      el('div', { class: 'hb-ratio-foot' }, [el('span', {}, opts.foot), el('span', {}, opts.thresholdLabel)]),
    ])
  }

  // ── Drawer ───────────────────────────────────────────────────────────────
  /*
   * One drawer for all three surfaces. Esc closes it, focus moves in on open and returns
   * to whatever opened it on close, and the scrim ignores a click that began inside — a
   * drawer that closes because you dragged a selection past its edge loses the thing the
   * reviewer was reading.
   */
  let live = null

  function drawer(opts) {
    closeDrawer()
    const opener = document.activeElement
    const panel = el('div', {
      class: 'hb-drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title, tabindex: '-1',
    }, [
      el('div', { class: 'hb-drawer-head' }, [
        el('div', {}, [el('h2', {}, opts.title), opts.subtitle ? el('p', { class: 'hb-sub' }, opts.subtitle) : null]),
        el('button', { class: 'hb-drawer-close', 'aria-label': S.common.close, onclick: () => closeDrawer() }, '✕'),
      ]),
      el('div', { class: 'hb-drawer-body' }, opts.body),
    ])

    let downInside = false
    const scrim = el('div', {
      class: 'hb-scrim',
      onmousedown: (e) => { downInside = panel.contains(e.target) },
      onclick: (e) => { if (e.target === scrim && !downInside) closeDrawer() },
    }, panel)

    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeDrawer() } }
    document.addEventListener('keydown', onKey)
    document.body.appendChild(scrim)
    document.body.style.overflow = 'hidden'
    panel.focus()
    live = { scrim, onKey, opener }
    return live
  }

  function closeDrawer() {
    if (!live) return
    document.removeEventListener('keydown', live.onKey)
    live.scrim.remove()
    document.body.style.overflow = ''
    if (live.opener && live.opener.focus) live.opener.focus()
    live = null
  }

  // ── Modes ────────────────────────────────────────────────────────────────
  /*
   * Both unresolved decisions live in the URL query rather than in a variable, so a link
   * to a screen carries the assumptions it was taken under. "Look at the wallet" and "look
   * at the wallet as a guarantor" are different claims and need different links.
   */
  function modes() {
    const q = new URLSearchParams(location.search)
    const filing = q.get('filing') === 'as_filed' ? 'as_filed' : 'corrected'
    const risk = q.get('risk') === 'guarantor' ? 'guarantor' : 'agent'
    // Every invoice sub-state and aging bucket is a statement about now, so "now" is a
    // parameter too — otherwise the same screen tells a different story every week.
    const today = /^\d{4}-\d{2}-\d{2}$/.test(q.get('today') || '') ? q.get('today') : HB.TODAY
    return { filing, risk, today }
  }
  /**
   * Go somewhere. Two builds, two mechanisms, one call site.
   *
   * The multi-file build navigates: four pages, and the browser does the work. The single
   * file cannot rely on that — a link whose path is unchanged is treated as a
   * same-document navigation and the scripts never re-run, and inside an artifact iframe a
   * full navigation is riskier still. So the bundle rewrites the URL and restarts itself
   * in place. The URL is identical either way, which is what keeps a link shareable
   * between the two builds.
   */
  function navigate(url) {
    if (root.HB_SINGLE && typeof root.HBBoot === 'function') {
      history.replaceState(null, '', url)
      root.HBBoot()
      return
    }
    location.href = url
  }

  function setMode(key, value) {
    const url = new URL(location.href)
    const dflt = key === 'filing' ? 'corrected' : key === 'risk' ? 'agent' : HB.TODAY
    if (value === dflt) url.searchParams.delete(key)
    else url.searchParams.set(key, value)
    navigate(url.toString())
  }
  /** Carry the current modes onto an outbound link, so they survive navigation. */
  function href(hash) {
    const qs = new URLSearchParams(location.search).toString()
    return (qs ? '?' + qs : '') + (hash ? '#' + hash : '')
  }

  /**
   * A link to another surface, carrying the current modes.
   *
   * One function because there are two builds. The multi-file version navigates to a
   * sibling page; the single file carries all four surfaces and selects one with `role`.
   * Every cross-surface link goes through here so neither build has to know about the
   * other's shape.
   */
  function pageHref(role, hash) {
    const q = new URLSearchParams(location.search)
    if (root.HB_SINGLE) {
      /*
       * An absolute URL, and an explicit role on every link including the picker's.
       *
       * Two problems, one fix. A relative `?query` link to the same path navigated — the
       * address bar changed — without re-executing the page's scripts, so the surface
       * never started; and dropping the role for the picker produced a link to the bare
       * path, which is the current document minus its query and does not reload at all.
       * Building the whole URL is what `setMode` already does, and it is the form that
       * demonstrably reloads.
       */
      const url = new URL(location.href)
      url.search = ''
      for (const [k2, v2] of q) url.searchParams.set(k2, v2)
      url.searchParams.set('role', role === 'index' ? 'picker' : role)
      url.hash = hash ? '#' + hash : ''
      return url.toString()
    }
    q.delete('role')
    const qs = q.toString()
    const page = { index: 'index.html', buyer: 'buyer.html', seller: 'seller.html', admin: 'admin.html' }[role]
    return page + (qs ? '?' + qs : '') + (hash ? '#' + hash : '')
  }

  function segmented(options, current, onChange) {
    return el('div', { class: 'hb-seg' }, options.map((o) =>
      el('button', {
        type: 'button', 'aria-pressed': String(o.value === current), 'data-tone': o.tone || null,
        onclick: () => onChange(o.value),
      }, o.label)))
  }

  const filingToggle = () => {
    const m = modes()
    return segmented([
      { value: 'corrected', label: S.common.corrected },
      { value: 'as_filed', label: S.common.asFiled, tone: 'bad' },
    ], m.filing, (v) => setMode('filing', v))
  }

  const riskToggle = () => {
    const m = modes()
    return el('div', { class: 'hb-risk' }, [
      el('span', { class: 'hb-filter-label' }, S.risk.label),
      segmented([
        { value: 'agent', label: S.risk.agent },
        { value: 'guarantor', label: S.risk.guarantor },
      ], m.risk, (v) => setMode('risk', v)),
    ])
  }

  /**
   * The reference date, as a control.
   *
   * Every invoice sub-state and every aging bucket on the buyer surface is a statement
   * about now, and the seed contains one credit invoice. Rather than inventing five more
   * invoices to show five states, the reviewer moves the date and watches the one real
   * invoice pass through them — which is also how the states actually occur.
   */
  function todayControl() {
    const m = modes()
    return el('div', { class: 'hb-risk' }, [
      el('span', { class: 'hb-filter-label' }, S.common.asAt),
      el('input', {
        type: 'date', class: 'hb-input hb-input--date', value: m.today,
        'aria-label': S.common.asAt,
        onchange: (e) => { if (e.target.value) setMode('today', e.target.value) },
      }),
    ])
  }

  /**
   * The as-filed warning, scoped to whoever is being looked at.
   *
   * Saying "figures on this screen are overstated" on a seller whose book contains no
   * mis-filed row is itself a false statement, and a warning that cries wolf on four
   * screens out of five is a warning nobody reads on the fifth.
   */
  function filingWarning(sellerId) {
    if (modes().filing !== 'as_filed') return null
    const rec = sellerId ? HB.reconcile(sellerId, modes()) : HB.reconcileAll(modes())
    return rec.passes
      ? banner('warn', null, S.common.asFiledClean)
      : banner('bad', null, S.common.asFiledWarn)
  }

  /**
   * Which assumptions are not the default, named across the top of every screen.
   *
   * The toggles already show the state, but a toggle is something you look at when you go
   * looking. This is for the screenshot that ends up in a deck: a reader who was not the
   * one who set the mode should not have to notice a highlighted segment to know they are
   * looking at the mis-filed book, or at the guarantor product.
   */
  function modeStrip() {
    const m = modes()
    const off = []
    if (m.filing === 'as_filed') off.push({ label: S.common.asFiled, tone: 'bad', key: 'filing', back: 'corrected' })
    if (m.risk === 'guarantor') off.push({ label: S.risk.guarantor, tone: 'warn', key: 'risk', back: 'agent' })
    if (m.today !== HB.TODAY) off.push({ label: S.common.asAt + ' ' + m.today, tone: 'info', key: 'today', back: HB.TODAY })
    if (off.length === 0) return null
    return el('div', { class: 'hb-modestrip hb-modestrip--' + off[0].tone },
      [el('span', { class: 'hb-modestrip-mark', 'aria-hidden': 'true' }, '●')]
        .concat(off.map((o) => el('strong', {}, o.label)))
        .concat([
          el('span', {}, S.common.nonDefault),
          el('button', {
            class: 'hb-btn hb-btn--quiet hb-btn--sm', style: { marginInlineStart: 'auto' },
            onclick: () => { for (const o of off) setMode(o.key, o.back) },
          }, S.common.resetModes),
        ]))
  }

  /**
   * Loading and error, on demand.
   *
   * A static prototype has nothing to wait for, so these states would never appear — and a
   * state nobody can see is a state nobody reviews. They are reachable by flag instead,
   * from the sidebar, so the design for "this did not load" gets looked at before it is
   * needed rather than after.
   */
  const demoState = () => {
    const v = new URLSearchParams(location.search).get('state')
    return v === 'loading' || v === 'error' ? v : null
  }

  /** The risk model is undecided, and every surface says so rather than implying a choice. */
  const riskBanner = () => {
    const m = modes()
    return el('div', { class: 'hb-riskbanner' }, [
      el('b', {}, S.risk.label + ': ' + S.risk[m.risk] + ' · ' + S.risk.unresolved),
      el('span', {}, m.risk === 'agent' ? S.risk.agentNote : S.risk.guarantorNote),
    ])
  }

  // ── Chrome ───────────────────────────────────────────────────────────────
  function shell(opts) {
    const app = el('div', { class: 'hb-app' })
    const nav = el('nav', { class: 'hb-nav', 'aria-label': opts.persona + ' navigation' })
    for (const group of opts.nav) {
      if (group.label) nav.appendChild(el('div', { class: 'hb-nav-label' }, group.label))
      for (const item of group.items) {
        nav.appendChild(el('a', { href: href(item.href), 'data-nav': item.href }, [
          el('span', { class: 'hb-nav-ico', 'aria-hidden': 'true' }, item.icon), item.label,
        ]))
      }
    }

    app.appendChild(el('aside', { class: 'hb-side' }, [
      el('a', { class: 'hb-brand', href: pageHref('index') }, [
        el('span', { class: 'hb-brand-mark', 'aria-hidden': 'true' }, 'H'), S.brand,
      ]),
      el('div', { class: 'hb-persona' }, [opts.persona, el('strong', {}, opts.personaName)]),
      nav,
      el('div', { class: 'hb-side-foot' }, [
        el('button', {
          class: 'hb-toggle', 'aria-pressed': 'false', 'data-notes': '',
          onclick: (e) => {
            const on = document.body.classList.toggle('hb-notes-on')
            e.currentTarget.setAttribute('aria-pressed', String(on))
            try { sessionStorage.setItem('hb-notes', on ? '1' : '0') } catch (_) {}
          },
        }, S.common.designNotes),
        el('div', { class: 'hb-statelinks' }, [
          el('span', {}, S.common.showState),
          el('a', { href: stateHref('loading') }, S.common.loading),
          el('a', { href: stateHref('error') }, S.common.errorShort),
        ]),
      ]),
    ]))

    const title = el('h1', {}, opts.title)
    const sub = el('p', { class: 'hb-top-sub', style: { margin: 0 } }, '')
    const content = el('main', { class: 'hb-content', id: 'main' })

    app.appendChild(el('div', { class: 'hb-main' }, [
      modeStrip(),
      el('header', { class: 'hb-top' }, [
        el('div', {}, [title, sub]),
        el('div', { class: 'hb-top-right' }, [
          riskToggle(),
          el('span', { class: 'hb-filter-label', style: { marginInlineStart: '6px' } }, S.common.filing),
          filingToggle(),
        ]),
      ]),
      content,
    ]))

    // A skip link, because the navy sidebar is a lot of links to tab through before the
    // first figure on the page.
    document.body.insertBefore(
      el('a', { class: 'hb-skip', href: '#main' }, S.common.skipToContent), document.body.firstChild)
    document.body.appendChild(app)
    try {
      if (sessionStorage.getItem('hb-notes') === '1') {
        document.body.classList.add('hb-notes-on')
        document.querySelector('[data-notes]').setAttribute('aria-pressed', 'true')
      }
    } catch (_) {}

    return {
      content,
      setTitle(t, s) { title.textContent = t; sub.textContent = s || '' },
      setActive(h) {
        for (const a of nav.querySelectorAll('a')) {
          if (a.getAttribute('data-nav') === h) a.setAttribute('aria-current', 'page')
          else a.removeAttribute('aria-current')
        }
      },
    }
  }

  // ── Router ───────────────────────────────────────────────────────────────
  function router(routes, opts) {
    const fallback = (opts && opts.fallback) || Object.keys(routes)[0]
    function parse() {
      const raw = (location.hash || '').replace(/^#/, '')
      const parts = (raw.startsWith('/') ? raw : '/' + raw).split('/').filter(Boolean)
      for (const pattern in routes) {
        const pp = pattern.split('/').filter(Boolean)
        if (pp.length !== parts.length) continue
        const params = {}
        let ok = true
        for (let i = 0; i < pp.length; i++) {
          if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(parts[i])
          else if (pp[i] !== parts[i]) { ok = false; break }
        }
        if (ok) return { pattern, params }
      }
      return null
    }
    function go() {
      closeDrawer()
      const match = parse()
      if (!match) {
        if (!location.hash) { location.replace(href(fallback.replace(/^\//, ''))); return }
        opts.render(null, {})
        return
      }
      opts.render(match.pattern, match.params)
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    /*
     * One hashchange listener at a time. The bundle restarts an app in place when the role
     * changes, and without this each restart would leave the previous surface's router
     * still listening — every hash change then rendering two screens into one body.
     */
    if (root.__hbRoute) window.removeEventListener('hashchange', root.__hbRoute)
    root.__hbRoute = go
    window.addEventListener('hashchange', go)
    return { go, parse }
  }

  // ── Lifecycle drawer ─────────────────────────────────────────────────────
  /**
   * Six stages, in the order the money actually moves.
   *
   * Stage 2 is the one the whole module turns on, so it is drawn as the key stage rather
   * than as another tick: the payment route decides whether the commission on this order
   * is a deduction or a debt, and every number downstream follows from it. Today that
   * decision is not recorded as a billing fact at all — here it is recorded first.
   *
   * `role` controls what the reader is allowed to see. The buyer gets the same six stages
   * with the commission and discount-funding stages withheld, because commission is a
   * Highbase↔seller relationship (invariant 2) and the drawer is shared code.
   */
  function lifecycle(orderId, ctx) {
    const L = S.lifecycle
    const c = ctx || {}
    const m = modes()
    const role = c.role || 'seller'
    const o = HB.order(orderId)
    const s = HB.seller(o.sellerId)
    const b = HB.buyer(o.buyerId)
    const cardRate = HB.rateCard(s.rateCardId)
    const ps = HB.postingsFor(o.sellerId, m).filter((p) => p.orderId === o.id)

    const trueComm = HB.commissionOn(o, cardRate)
    const filedComm = HB.sum(ps.filter((p) => p.commissionCharge !== undefined).map((p) => p.commissionCharge))
    const accrued = HB.commissionAccrues(o, m)
    const misfiled = accrued && filedComm !== trueComm

    const stage = (x) => el('div', { class: 'hb-stage hb-stage--' + (x.tone || 'done') }, [
      el('div', { class: 'hb-stage-rail' }, [
        el('div', { class: 'hb-stage-dot', 'aria-hidden': 'true' }, x.mark || '✓'),
        el('div', { class: 'hb-stage-line' }),
      ]),
      el('div', { class: 'hb-stage-body' }, [
        el('div', { class: 'hb-stage-title' }, [x.title, x.pill || null, x.amount ? el('span', { class: 'hb-stage-amount' }, x.amount) : null]),
        x.meta ? el('div', { class: 'hb-stage-meta' }, x.meta) : null,
        x.note ? el('div', { class: 'hb-stage-note' }, x.note) : null,
      ]),
    ])

    const stages = []

    stages.push(stage({
      title: o.kind === 'return' ? S.common.return : L.placed,
      meta: o.date + ' · ' + o.id + ' · ' + (role === 'buyer' ? s.name : b.name),
      amount: money(o.grossValue, { currency: true, tone: 'auto' }),
      note: o.note || null,
    }))

    stages.push(stage({
      tone: 'key', mark: '!',
      title: L.route,
      pill: frag([routePill(o.paymentRoute), ' ', termsPill(o.terms)]),
      amount: money(HB.buyerPays(o), { currency: true }),
      meta: L.routeKey,
      note: o.terms === 'credit'
        ? S.fill(L.routeCredit, { due: o.dueDate })
        : (o.paymentRoute === 'highbase' ? L.routeHighbase : L.routeSeller),
    }))

    // Invariant 2 — the commission and funding stages are withheld from the buyer, in the
    // shared component, so no buyer screen can render them by forgetting to.
    if (role !== 'buyer') {
      stages.push(stage({
        tone: misfiled ? 'bad' : accrued ? 'done' : 'skip',
        mark: misfiled ? '!' : accrued ? '✓' : '·',
        title: L.commission,
        amount: accrued ? money(-filedComm, { currency: true, tone: 'auto' }) : null,
        meta: accrued ? S.fill(L.commissionOn, { base: moneyText(HB.commissionBase(o), { currency: true }), rate: (cardRate.rate * 100) + '%' }) : null,
        note: misfiled
          ? 'Filed as ' + moneyText(filedComm, { signed: true }) + ' where the order value calls for ' + moneyText(trueComm, { signed: true }) + '. This is the RET-1007 sign error.'
          : !accrued ? L.commissionDeferred
            : (o.discount.funder === 'highbase'
              ? S.fill(L.commissionFunded, { gross: moneyText(o.grossValue, { currency: true }), net: moneyText(HB.buyerPays(o), { currency: true }) })
              : null),
      }))

      stages.push(o.discount.amount > 0
        ? stage({
          title: L.discount,
          pill: pill(o.discount.funder === 'highbase' ? 'Highbase-funded' : 'Seller-funded', o.discount.funder === 'highbase' ? 'blue' : 'orange'),
          amount: money(o.discount.amount, { currency: true, signed: true, tone: 'pos' }),
          note: o.discount.funder === 'highbase' ? S.fill(L.discountFunded, { amount: moneyText(o.discount.amount, { currency: true }) }) : o.discount.reason,
        })
        : stage({ tone: 'skip', mark: '·', title: L.discountNone }))
    } else if (o.discount.amount > 0) {
      stages.push(stage({
        title: L.discount,
        amount: money(o.discount.amount, { currency: true, signed: true, tone: 'pos' }),
        note: o.discount.reason,
      }))
    }

    stages.push(o.deliveryConfirmedAt
      ? stage({ title: L.delivery, meta: o.deliveryConfirmedAt })
      : stage({ tone: 'warn', mark: '·', title: L.deliveryPending, note: 'Cash on this order is held until delivery is confirmed.' }))

    /*
     * The last stage has four outcomes, not two. A seller-collected order was never in
     * Highbase's hands, so nothing about it is "released" — the seller already holds the
     * money and owes the commission on it. Calling that a release told the reader the
     * opposite of what the dues figure on their wallet says.
     */
    const reversal = HB.ORDERS.find((x) => x.reverses === o.id)
    const awaiting = o.terms === 'credit' && !HB.isCollected(o, m)
    const direct = o.paymentRoute === 'seller'
    stages.push(stage({
      tone: reversal ? 'warn' : awaiting ? 'key' : direct ? 'warn' : 'done',
      mark: reversal ? '↩' : awaiting ? '…' : direct ? '→' : '✓',
      title: reversal ? L.reversed : awaiting ? S.stateLabel('awaiting', m.risk) : direct ? L.settledDirect : L.released,
      note: reversal ? L.reversedNote
        : awaiting ? L.awaitingNote
          : direct ? L.settledDirectNote
            : (o.terms === 'credit' ? L.guaranteedNote : L.releasedNote),
    }))

    return drawer({
      title: o.id,
      subtitle: (role === 'buyer' ? s.name : b.name) + ' · ' + (o.kind === 'return' ? S.common.return : S.common.order),
      body: [
        misfiled && role !== 'buyer'
          ? banner('bad', 'Sign error on this row', 'The commission on this return was charged instead of credited, and the cash leg was booked as a receipt. See the admin reconciliation control.')
          : null,
        el('div', { class: 'hb-life', style: { marginTop: misfiled ? '14px' : 0 } }, stages),
      ],
    })
  }

  /*
   * Cross-surface links are ordinary anchors — right-clickable, copyable, correct — and in
   * the bundle a delegated listener turns the click into an in-place restart. One listener
   * rather than a handler on every link, so `pageHref` stays a pure function.
   */
  if (root.HB_SINGLE && typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
      const a = e.target.closest && e.target.closest('a[href]')
      if (!a) return
      const href = a.getAttribute('href') || ''
      if (!/[?&]role=/.test(href)) return
      e.preventDefault()
      navigate(href)
    })
  }

  /** A link to the current screen with a demo state applied, or cleared. */
  function stateHref(state) {
    const url = new URL(location.href)
    if (state) url.searchParams.set('state', state)
    else url.searchParams.delete('state')
    return url.toString()
  }

  return {
    el, frag, money, moneyText, postingChip, pill, routePill, termsPill, standingBadge,
    modeStrip, demoState, stateHref,
    table, card, note, banner, calc, ratio, empty, loading, errorState,
    drawer, closeDrawer, router, shell, segmented,
    modes, setMode, navigate, href, pageHref, filingToggle, riskToggle, todayControl, filingWarning, riskBanner, lifecycle,
  }
})
