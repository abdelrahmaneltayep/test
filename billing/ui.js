/**
 * Shared components. One drawer, one table, one money renderer, for all three surfaces.
 *
 * The money renderer matters more than it looks. Every amount on every screen goes through
 * `money()`, which stamps `data-money` on the element it returns — which is what lets
 * acceptance test 9 walk the rendered page and prove that nothing anywhere shows two
 * decimals or four. A formatter you can bypass is a formatter that gets bypassed.
 */
;(function (root, factory) {
  const api = factory(root.HB, root.HBStrings)
  root.HBUI = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function (HB, S) {
  'use strict'

  // ── DOM helper ───────────────────────────────────────────────────────────
  function el(tag, props, children) {
    const node = document.createElement(tag)
    for (const k in props || {}) {
      const v = props[k]
      if (v === null || v === undefined || v === false) continue
      if (k === 'class') node.className = v
      else if (k === 'html') node.innerHTML = v
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
    for (const c of [].concat(children || [])) if (c) f.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)))
    return f
  }

  // ── Money ────────────────────────────────────────────────────────────────
  /**
   * The only way an amount reaches the screen. Three decimals, tabular figures, and a
   * `data-money` hook so the page can be audited for its own formatting.
   */
  function money(fils, opts) {
    const o = opts || {}
    const node = el('span', { 'data-money': '', class: o.class || null })
    node.textContent = HB.money(fils, { currency: o.currency, signed: o.signed })
    if (o.tone === 'auto') node.classList.add(fils < 0 ? 'neg' : fils > 0 ? 'pos' : 'muted')
    else if (o.tone) node.classList.add(o.tone)
    return node
  }
  /** For places that need the string rather than a node — always the same formatter. */
  const moneyText = (fils, opts) => HB.money(fils, opts || {})

  // ── Chips ────────────────────────────────────────────────────────────────
  const postingChip = (code) =>
    el('span', { class: 'hb-code hb-code--' + code, title: HB.POSTING[code].label }, code)

  const pill = (text, tone) => el('span', { class: 'hb-pill' + (tone ? ' hb-pill--' + tone : '') }, text)

  const collectorPill = (by) =>
    by === 'highbase' ? pill(S.ledger.highbase, 'blue') : pill(S.ledger.seller, 'orange')

  // ── Tables ───────────────────────────────────────────────────────────────
  /**
   * Columns declare their own alignment and rendering, so no caller writes a `<td>`. Rows
   * that represent an order are keyboard-reachable and open the drawer on Enter as well as
   * on click — a row you can only reach with a mouse is a row half the reviewers cannot open.
   */
  function table(spec) {
    const wrap = el('div', { class: 'hb-tablewrap' })
    const t = el('table', { class: 'hb-table' })

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
      for (const c of spec.columns) {
        const v = c.cell(row)
        tr.appendChild(el('td', { class: c.num ? 'num' : null }, v))
      }
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
      el('h3', {}, title),
      el('p', {}, note),
      action || null,
    ])

  const loading = (rows) =>
    el('div', { class: 'hb-card-body', 'aria-busy': 'true', 'aria-label': S.common.loading },
      Array.from({ length: rows || 4 }, (_, i) =>
        el('div', { class: 'hb-skeleton', style: { width: [92, 78, 85, 64, 71][i % 5] + '%' } })))

  const errorState = () => empty(S.common.errorTitle, S.common.errorNote)

  // ── Cards ────────────────────────────────────────────────────────────────
  function card(opts) {
    const head = opts.title
      ? el('div', { class: 'hb-card-head' }, [
        el('div', {}, [el('h2', {}, opts.title), opts.note ? el('p', { class: 'hb-sub' }, opts.note) : null]),
        opts.actions ? el('div', { style: { marginInlineStart: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' } }, opts.actions) : null,
      ])
      : null
    return el('section', { class: 'hb-card' }, [
      head,
      opts.flush ? opts.body : el('div', { class: 'hb-card-body' }, opts.body),
      opts.foot ? el('div', { class: 'hb-card-foot' }, opts.foot) : null,
    ])
  }

  /** A design note: what rule this bit of screen implements. Hidden until toggled on. */
  const note = (label, body) =>
    el('div', { class: 'hb-note' }, [el('b', {}, label + ' — '), body])

  const banner = (tone, strongText, body) =>
    el('div', { class: 'hb-banner hb-banner--' + tone }, [
      el('div', {}, [strongText ? el('strong', {}, strongText) : null, body ? el('div', {}, body) : null]),
    ])

  // ── Drawer ───────────────────────────────────────────────────────────────
  /*
   * One drawer for all three surfaces. Esc closes it, focus moves into it on open and
   * returns to whatever opened it on close, and the scrim is inert to clicks that started
   * inside — a drawer that closes because you dragged a selection past its edge loses the
   * thing the reviewer was reading.
   */
  let openDrawer = null

  function drawer(opts) {
    closeDrawer()
    const opener = document.activeElement
    const body = el('div', { class: 'hb-drawer-body' }, opts.body)
    const panel = el('div', {
      class: 'hb-drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title, tabindex: '-1',
    }, [
      el('div', { class: 'hb-drawer-head' }, [
        el('div', {}, [
          el('h2', {}, opts.title),
          opts.subtitle ? el('p', { class: 'hb-sub' }, opts.subtitle) : null,
        ]),
        el('button', { class: 'hb-drawer-close', 'aria-label': S.common.close, onclick: () => closeDrawer() }, '✕'),
      ]),
      body,
    ])

    let downInside = false
    const scrim = el('div', {
      class: 'hb-scrim',
      onmousedown: (e) => { downInside = panel.contains(e.target) },
      onclick: (e) => { if (e.target === scrim && !downInside) closeDrawer() },
    }, panel)

    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeDrawer() }
    }
    document.addEventListener('keydown', onKey)
    document.body.appendChild(scrim)
    document.body.style.overflow = 'hidden'
    panel.focus()

    openDrawer = { scrim, onKey, opener }
    return openDrawer
  }

  function closeDrawer() {
    if (!openDrawer) return
    document.removeEventListener('keydown', openDrawer.onKey)
    openDrawer.scrim.remove()
    document.body.style.overflow = ''
    if (openDrawer.opener && openDrawer.opener.focus) openDrawer.opener.focus()
    openDrawer = null
  }

  // ── Router ───────────────────────────────────────────────────────────────
  /**
   * Hash routing, so a deep link works and a refresh keeps the view. Routes are matched by
   * segments with `:params`, which is enough for `#/runs/1042-jan` without pulling in a
   * router library the prototype would then depend on.
   */
  function router(routes, opts) {
    const fallback = (opts && opts.fallback) || Object.keys(routes)[0]

    function parse() {
      const raw = (location.hash || '').replace(/^#/, '')
      const path = raw.startsWith('/') ? raw : '/' + raw
      const parts = path.split('/').filter(Boolean)
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
        if (!location.hash) { location.replace('#' + fallback); return }
        opts.render(null, {}, empty(S.common.notFound, S.common.notFoundNote))
        return
      }
      opts.render(match.pattern, match.params)
      // A new view starts at the top; carrying the old scroll position into a shorter
      // screen strands the reader below its content.
      window.scrollTo({ top: 0, behavior: 'instant' })
    }

    window.addEventListener('hashchange', go)
    return { go, parse }
  }

  // ── Chrome ───────────────────────────────────────────────────────────────
  /**
   * The shell every surface shares: navy sidebar, sticky header, the filing toggle and the
   * design-notes switch. The filing toggle is global on purpose — flipping it has to move
   * every figure on every surface at once, because that is the claim being demonstrated.
   */
  function shell(opts) {
    const app = el('div', { class: 'hb-app' })

    const nav = el('nav', { class: 'hb-nav', 'aria-label': opts.persona + ' navigation' })
    for (const group of opts.nav) {
      if (group.label) nav.appendChild(el('div', { class: 'hb-nav-label' }, group.label))
      for (const item of group.items) {
        nav.appendChild(el('a', { href: '#' + item.href, 'data-nav': item.href }, [
          el('span', { class: 'hb-nav-ico', 'aria-hidden': 'true' }, item.icon), item.label,
        ]))
      }
    }

    app.appendChild(el('aside', { class: 'hb-side' }, [
      el('a', { class: 'hb-brand', href: 'index.html' }, [
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
      ]),
    ]))

    const title = el('h1', {}, opts.title)
    const sub = el('p', { class: 'hb-top-sub', style: { margin: 0 } }, '')
    const content = el('main', { class: 'hb-content', id: 'main' })

    app.appendChild(el('div', { class: 'hb-main' }, [
      el('header', { class: 'hb-top' }, [
        el('div', {}, [title, sub]),
        el('div', { class: 'hb-top-right' }, [
          el('span', { class: 'hb-filter-label' }, S.common.filing),
          modeToggle(),
        ]),
      ]),
      content,
    ]))

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
      setActive(href) {
        for (const a of nav.querySelectorAll('a')) {
          const on = a.getAttribute('data-nav') === href
          if (on) a.setAttribute('aria-current', 'page')
          else a.removeAttribute('aria-current')
        }
      },
    }
  }

  // ── Filing mode ──────────────────────────────────────────────────────────
  /*
   * Kept in the URL query rather than in a variable, so a link to a screen carries the
   * filing it was taken under. "Look at the wallet" and "look at the wallet as filed" are
   * different claims and need different links.
   */
  function mode() {
    const m = new URLSearchParams(location.search).get('filing')
    return m === 'as_filed' ? 'as_filed' : 'corrected'
  }

  function setMode(m) {
    const url = new URL(location.href)
    if (m === 'corrected') url.searchParams.delete('filing')
    else url.searchParams.set('filing', m)
    location.href = url.toString()
  }

  function modeToggle() {
    const cur = mode()
    const btn = (val, label, tone) => el('button', {
      type: 'button', 'aria-pressed': String(cur === val), 'data-tone': tone || null,
      onclick: () => { if (cur !== val) setMode(val) },
    }, label)
    return el('div', { class: 'hb-seg' }, [
      btn('corrected', S.common.corrected),
      btn('as_filed', S.common.asFiled, 'bad'),
    ])
  }

  /** Shown on every surface while the mis-filed ledger is being viewed. */
  const modeWarning = () =>
    mode() === 'as_filed' ? banner('bad', null, S.common.asFiledWarn) : null

  // ── Segmented filter ─────────────────────────────────────────────────────
  function segmented(options, current, onChange) {
    return el('div', { class: 'hb-seg' }, options.map((o) =>
      el('button', {
        type: 'button', 'aria-pressed': String(o.value === current),
        onclick: () => onChange(o.value),
      }, o.label)))
  }

  // ── Lifecycle drawer ─────────────────────────────────────────────────────
  /**
   * Six stages, in the order the money actually moves.
   *
   * Stage 2 is the one the whole module turns on, so it is drawn as the key stage rather
   * than as another tick: who collected the cash decides whether the commission on this
   * order is a deduction or a debt, and every other number downstream follows from it.
   */
  function lifecycle(orderId, ctx) {
    const L = S.lifecycle
    const o = HB.order(orderId)
    const s = HB.seller(o.sellerId)
    const card = HB.rateCard(s.rateCardId)
    const m = (ctx && ctx.mode) || mode()
    const ps = HB.postingsFor(o.sellerId, m).filter((p) => p.orderId === o.id)

    const comm = HB.commissionOn(o, card)
    const filedComm = HB.sum(ps.filter((p) => p.commissionCharge !== undefined).map((p) => p.commissionCharge))
    const misfiled = filedComm !== comm

    const stage = (opts) =>
      el('div', { class: 'hb-stage hb-stage--' + (opts.tone || 'done') }, [
        el('div', { class: 'hb-stage-rail' }, [
          el('div', { class: 'hb-stage-dot', 'aria-hidden': 'true' }, opts.mark || '✓'),
          el('div', { class: 'hb-stage-line' }),
        ]),
        el('div', { class: 'hb-stage-body' }, [
          el('div', { class: 'hb-stage-title' }, [opts.title, opts.pill || null, opts.amount ? el('span', { class: 'hb-stage-amount' }, opts.amount) : null]),
          opts.meta ? el('div', { class: 'hb-stage-meta' }, opts.meta) : null,
          opts.note ? el('div', { class: 'hb-stage-note' }, opts.note) : null,
        ]),
      ])

    const stages = []

    stages.push(stage({
      title: o.kind === 'return' ? L.reversed + ' — ' + S.common.return : L.placed,
      meta: o.date + ' · ' + o.id,
      amount: money(o.value, { currency: true, tone: 'auto' }),
      note: o.note || null,
    }))

    stages.push(stage({
      tone: 'key', mark: '!',
      title: L.routed,
      pill: collectorPill(o.collectedBy),
      amount: money(HB.buyerPays(o), { currency: true }),
      meta: L.routedKey,
      note: o.collectedBy === 'highbase' ? L.routedHighbase : L.routedSeller,
    }))

    stages.push(stage({
      tone: misfiled ? 'bad' : 'done',
      mark: misfiled ? '!' : '✓',
      title: L.commission,
      amount: money(-filedComm, { currency: true, tone: 'auto' }),
      meta: S.fill(L.commissionOn, { base: moneyText(HB.commissionBase(o), { currency: true }), rate: (card.rate * 100) + '%' }),
      note: misfiled
        ? 'Filed as ' + moneyText(filedComm, { signed: true }) + ' where the order value calls for ' + moneyText(comm, { signed: true }) + '. This is the RET-1007 sign error.'
        : (o.discountFunder === 'highbase'
          ? S.fill(L.commissionFunded, { gross: moneyText(o.value, { currency: true }), net: moneyText(HB.buyerPays(o), { currency: true }) })
          : null),
    }))

    stages.push(o.discount > 0
      ? stage({
        title: L.discount,
        pill: pill(o.discountFunder === 'highbase' ? 'Highbase-funded' : 'Seller-funded', o.discountFunder === 'highbase' ? 'blue' : 'orange'),
        amount: money(o.discount, { currency: true, signed: true, tone: 'pos' }),
        note: o.discountFunder === 'highbase' ? S.fill(L.discountFunded, { amount: moneyText(o.discount, { currency: true }) }) : null,
      })
      : stage({ tone: 'skip', mark: '·', title: L.discountNone }))

    // Delivery and release are not in the seed ledger as dated events — the seed carries
    // orders, postings and payouts. Rather than invent timestamps, these two stages read
    // what the postings can actually prove and say so where they cannot.
    const reversal = HB.ORDERS.find((x) => x.reverses === o.id)
    stages.push(reversal
      ? stage({ tone: 'warn', mark: '↩', title: L.delivery, meta: 'Returned in part on ' + reversal.date, note: L.reversedNote })
      : stage({ tone: 'done', title: L.delivery, meta: o.date }))

    const released = o.collectedBy === 'highbase' && !reversal
    stages.push(stage({
      tone: reversal ? 'warn' : released ? 'done' : 'skip',
      mark: reversal ? '↩' : released ? '✓' : '·',
      title: reversal ? L.reversed : L.released,
      note: reversal ? L.reversedNote : released ? L.releasedNote : L.routedSeller,
    }))

    return drawer({
      title: o.id,
      subtitle: s.name + ' · ' + (o.kind === 'return' ? S.common.return : S.common.order),
      body: [
        misfiled ? banner('bad', 'Sign error on this row', 'The commission on this return was charged instead of credited, and the cash leg was booked as a receipt. See the admin reconciliation control.') : null,
        el('div', { class: 'hb-life', style: { marginTop: misfiled ? '14px' : 0 } }, stages),
      ],
    })
  }

  return {
    el, frag, money, moneyText, postingChip, pill, collectorPill,
    table, card, note, banner, empty, loading, errorState,
    drawer, closeDrawer, router, shell, segmented,
    mode, setMode, modeToggle, modeWarning, lifecycle,
  }
})
