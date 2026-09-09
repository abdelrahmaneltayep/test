;(function (root) {
  'use strict'

  /**
   * Shared components for the statements module.
   *
   * The order drawer is the piece that matters: one component, opened from any row on any
   * of the three surfaces, that withholds the commission stages when the reader is a
   * buyer. Building it once is what makes "no commission on a buyer screen" a property of
   * the code rather than a promise in a review.
   */

  const HBS = root.HBS
  const S = root.HBSStrings

  // ── DOM ──────────────────────────────────────────────────────────────────
  function el(tag, attrs, kids) {
    const n = document.createElement(tag)
    for (const k in attrs || {}) {
      const v = attrs[k]
      if (v === null || v === undefined || v === false) continue
      if (k === 'style' && typeof v === 'object') Object.assign(n.style, v)
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v)
      else n.setAttribute(k, v === true ? '' : v)
    }
    append(n, kids)
    return n
  }
  function append(n, kids) {
    if (kids === null || kids === undefined || kids === false) return
    if (Array.isArray(kids)) { for (const k of kids) append(n, k); return }
    n.appendChild(kids instanceof Node ? kids : document.createTextNode(String(kids)))
  }
  const clear = (n) => { while (n.firstChild) n.removeChild(n.firstChild) }

  /**
   * The one money renderer. Every amount on every screen goes through it, which is what
   * makes "always three decimals" checkable rather than hoped for — the audit walks
   * [data-money] and finds anything that did not.
   */
  function money(fils, opts) {
    const o = opts || {}
    const text = HBS.money(fils, { currency: o.currency, signed: o.signed })
    const cls = []
    if (o.tone === 'pos' || (o.tone === 'auto' && fils > 0)) cls.push('pos')
    if (o.tone === 'neg' || (o.tone === 'auto' && fils < 0)) cls.push('neg')
    if (o.muted || fils === 0) cls.push('muted')
    return el('span', { 'data-money': '', class: cls.join(' ') || null }, text)
  }

  // ── Query-string state ───────────────────────────────────────────────────
  const params = () => new URLSearchParams(location.search)
  function setParam(k, v) {
    const p = params()
    if (v === null) p.delete(k); else p.set(k, v)
    location.search = p.toString()
  }
  const getParam = (k, dflt) => params().get(k) || dflt

  /** Reporting period, carried on the URL so a link reproduces the view (BRD §7.1). */
  const period = () => {
    const p = getParam('period', 'order')
    return HBS.PERIODS.indexOf(p) < 0 ? 'order' : p
  }
  function periodSwitch() {
    const cur = period()
    return el('span', { class: 'hs-seg', role: 'group', 'aria-label': S.common.period },
      HBS.PERIODS.map((p) => el('button', {
        type: 'button', 'aria-pressed': String(p === cur), onclick: () => setParam('period', p),
      }, S.common.periods[p])))
  }

  /** BRD §12: are sellers told at the COD order, or only at settlement? Both, on a switch. */
  const notifyEarly = () => getParam('notify', 'early') === 'early'

  // ── Shell ────────────────────────────────────────────────────────────────
  function shell(opts) {
    document.body.setAttribute('data-role', opts.role)
    const nav = el('nav', { class: 'hs-nav' })
    for (const group of opts.nav) {
      nav.appendChild(el('div', { class: 'hs-nav-label' }, group.label))
      for (const item of group.items) {
        nav.appendChild(el('a', {
          href: item.href, 'aria-current': item.current ? 'page' : null,
        }, [el('span', { class: 'hs-nav-ico', 'aria-hidden': 'true' }, item.icon), item.label]))
      }
    }

    const side = el('aside', { class: 'hs-side' }, [
      el('a', { class: 'hs-brand', href: 'index.html' }, [
        el('span', { class: 'hs-brand-mark', 'aria-hidden': 'true' }, 'H'), S.brand,
      ]),
      el('div', { class: 'hs-brand-sub' }, S.brandSub),
      el('div', { class: 'hs-persona' }, [opts.personaRole, el('strong', {}, opts.personaName)]),
      nav,
      el('div', { class: 'hs-side-foot' }, [
        el('button', {
          class: 'hs-toggle', type: 'button', 'aria-pressed': 'false',
          onclick: (e) => {
            const on = document.body.classList.toggle('hs-notes-on')
            e.currentTarget.setAttribute('aria-pressed', String(on))
          },
        }, S.common.designNotes),
      ]),
    ])

    const top = el('header', { class: 'hs-top' }, [
      el('div', {}, [
        el('h1', {}, opts.title),
        opts.subtitle ? el('div', { class: 'hs-top-sub' }, opts.subtitle) : null,
      ]),
      el('div', { class: 'hs-top-right hs-noprint' }, opts.controls || []),
    ])

    const scope = el('div', { class: 'hs-scope hs-noprint' }, [
      el('b', {}, S.scope.lead), el('span', {}, S.scope.body),
    ])

    const content = el('div', { class: 'hs-content' })
    const main = el('main', { class: 'hs-main', id: 'main' }, [top, scope, content])
    document.body.appendChild(el('div', { class: 'hs-app' }, [side, main]))
    return content
  }

  // ── Building blocks ──────────────────────────────────────────────────────
  function card(o) {
    const head = (o.title || o.actions)
      ? el('div', { class: 'hs-card-head' }, [
          el('div', { style: { minWidth: '0' } }, [
            o.title ? el('h2', {}, o.title) : null,
            o.note ? el('p', { class: 'hs-sub' }, o.note) : null,
          ]),
          o.actions ? el('div', { style: { marginInlineStart: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }, class: 'hs-noprint' }, o.actions) : null,
        ])
      : null
    return el('section', { class: 'hs-card' }, [
      head,
      o.flush ? o.body : el('div', { class: 'hs-card-body' }, o.body),
      o.foot ? el('div', { class: 'hs-card-foot' }, o.foot) : null,
    ])
  }

  const figure = (o) => el('div', {
    class: 'hs-fig hs-fig--' + o.tone + (o.value === 0 ? ' hs-fig-zero' : ''),
  }, [
    el('div', { class: 'hs-fig-label' }, o.label),
    el('div', { class: 'hs-fig-value' }, money(o.value, { currency: true })),
    el('div', { class: 'hs-fig-note' }, o.note),
  ])

  const pill = (text, tone) => el('span', { class: 'hs-pill' + (tone ? ' hs-pill--' + tone : '') }, text)
  const methodPill = (m) => pill(S.method[m], m === 'cod' ? 'orange' : 'blue')

  /** The marker on a column whose definition the BRD has not settled. */
  const draft = (key) => el('span', {
    class: 'hs-draft', title: S.draftDefs[key] || S.common.draft,
    'aria-label': S.draftDefs[key] || S.common.draft,
  }, '?')

  function table(spec) {
    const wrap = el('div', { class: 'hs-tablewrap' })
    const t = el('table', {
      class: 'hs-table' + (spec.compact ? ' hs-table--compact' : '') + (spec.wide ? ' hs-table--wide' : ''),
    })
    t.appendChild(el('thead', {}, el('tr', {}, spec.columns.map((c) =>
      el('th', { class: c.num ? 'num' : null, scope: 'col' },
        [c.label, c.draft ? draft(c.draft) : null])))))

    const body = el('tbody')
    for (const row of spec.rows) {
      const clickable = spec.onRowClick && spec.rowKey && spec.rowKey(row)
      const tr = el('tr', Object.assign(
        { class: spec.rowClass ? spec.rowClass(row) : null },
        clickable ? {
          'data-click': '', tabindex: '0', role: 'button',
          'aria-label': spec.rowLabel ? spec.rowLabel(row) : undefined,
          onclick: () => spec.onRowClick(row),
          onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); spec.onRowClick(row) } },
        } : {}))
      for (const c of spec.columns) {
        tr.appendChild(el('td', {
          class: [c.num ? 'num' : null, c.wrap ? 'wrap' : null].filter(Boolean).join(' ') || null,
        }, c.cell(row)))
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

  const calc = (rows, expr) => el('div', { class: 'hs-calc' }, [
    rows.map((r) => el('div', { class: 'hs-calc-row' + (r.rule ? ' hs-calc-row--rule' : '') }, [
      el('span', {}, [r.label, r.note ? el('span', { class: 'hs-calc-note' }, ' · ' + r.note) : null]),
      r.plain ? el('span', { 'data-money': '' }, HBS.money(r.value, { currency: true }))
              : money(r.value, { currency: true, tone: r.tone || null, signed: r.signed }),
    ])),
    expr ? el('div', { class: 'hs-expr' }, expr) : null,
  ])

  const banner = (tone, strong, text) => el('div', { class: 'hs-banner hs-banner--' + tone },
    el('div', {}, [strong ? el('strong', {}, strong) : null, text]))

  const note = (title, text) => el('div', { class: 'hs-note' }, [el('b', {}, title + ' — '), text])

  const empty = (title, text) => el('div', { class: 'hs-empty' }, [
    el('div', { class: 'hs-empty-mark', 'aria-hidden': 'true' }, '—'),
    el('h3', {}, title), el('p', {}, text),
  ])

  // ── Export (BRD §4: view and export at each statement level) ─────────────
  /*
   * CSV by download, PDF by the browser's own print dialogue. The module has no server to
   * render a file on, and a print stylesheet produces a truer statement than a canvas
   * screenshot would.
   */
  function downloadCsv(filename, columns, rows) {
    const esc = (v) => {
      const s = v === null || v === undefined ? '' : String(v)
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
    }
    const lines = [columns.map((c) => esc(c.label)).join(',')]
    for (const r of rows) lines.push(columns.map((c) => esc(c.value(r))).join(','))
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = el('a', { href: url, download: filename })
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const exportButtons = (filename, columns, rows) => [
    el('button', { class: 'hs-btn hs-btn--outline hs-btn--sm', type: 'button', onclick: () => downloadCsv(filename, columns, rows) }, S.common.exportCsv),
    el('button', { class: 'hs-btn hs-btn--sm', type: 'button', onclick: () => window.print() }, S.common.exportPdf),
  ]

  // ── Drawer ───────────────────────────────────────────────────────────────
  let openScrim = null
  function closeDrawer() {
    if (!openScrim) return
    openScrim.remove(); openScrim = null
    document.body.style.overflow = ''
  }
  function drawer(title, subtitle, body) {
    closeDrawer()
    const scrim = el('div', {
      class: 'hs-scrim', onclick: (e) => { if (e.target === scrim) closeDrawer() },
    }, el('div', { class: 'hs-drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, [
      el('div', { class: 'hs-drawer-head' }, [
        el('div', {}, [el('h2', {}, title), subtitle ? el('p', { class: 'hs-sub' }, subtitle) : null]),
        el('button', { class: 'hs-drawer-close', type: 'button', 'aria-label': S.common.close, onclick: closeDrawer }, '✕'),
      ]),
      el('div', { class: 'hs-drawer-body' }, body),
    ]))
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { closeDrawer(); document.removeEventListener('keydown', esc) }
    })
    document.body.appendChild(scrim)
    document.body.style.overflow = 'hidden'
    openScrim = scrim
    const c = scrim.querySelector('.hs-drawer-close')
    if (c) c.focus()
  }

  /**
   * The order breakdown, shared by all three roles.
   *
   * `role === 'buyer'` withholds every commission stage. This is the enforcement point
   * for the BRD's rule that a buyer never sees commission (§7.2, §9): a buyer screen
   * cannot leak it by accident, because the component never builds it.
   */
  function orderBreakdown(orderId, opts) {
    const o = HBS.order(orderId)
    const st = HBS.orderStatement(o)
    const forBuyer = (opts || {}).role === 'buyer'
    const dropped = st.lines.filter((l) => l.status !== 'fulfilled')

    const lineRows = table({
      compact: true,
      columns: [
        { label: S.columns.item, wrap: true, cell: (l) => el('div', {}, [
          el('div', {}, l.name),
          el('div', { class: 'hs-sub' }, l.sku + (l.status !== 'fulfilled' ? ' · ' + (l.reason || l.status) : '')),
        ]) },
        { label: S.columns.qty, num: true, cell: (l) => String(l.qty) },
        { label: S.columns.base, num: true, cell: (l) => money(l.base) },
        { label: S.columns.vat, num: true, cell: (l) => money(l.vat) },
        { label: S.columns.discount, num: true, cell: (l) => l.discount ? money(-l.discount) : el('span', { class: 'muted' }, '—') },
        { label: S.common.total, num: true, cell: (l) => money(l.buyerPays) },
      ],
      rows: st.lines,
      rowClass: (l) => (l.status !== 'fulfilled' ? 'is-dropped' : null),
    })

    const rows = [
      { label: S.calc.base, value: st.base, plain: true, note: S.calc.baseNote },
      { label: S.fill(S.calc.vatLine, { rate: HBS.pct(st.lines.length ? st.lines[0].rate : HBS.VAT_RATE, 0) }), value: st.vat, plain: true },
      { label: S.calc.listTotal, value: st.orderTotal, plain: true, rule: true },
    ]
    if (st.hbDiscount) rows.push({ label: S.calc.discountHb, value: -st.hbDiscount, tone: 'neg', note: S.calc.couponNote })
    if (st.sellerDiscount) rows.push({ label: S.calc.discountSeller, value: -st.sellerDiscount, tone: 'neg', note: S.calc.sellerDiscNote })
    rows.push({ label: S.calc.buyerPaid, value: st.buyerPays, plain: true, rule: true })

    // Everything below this line is a seller/HB concern and is never built for a buyer.
    if (!forBuyer) {
      rows.push({ label: S.fill(S.calc.commissionLine, { rate: HBS.pct(st.rate) }), value: -st.commission, tone: 'neg' })
      if (st.hbDiscount) rows.push({ label: S.calc.couponBack, value: st.hbDiscount, tone: 'pos' })
      if (st.deduction) rows.push({ label: S.calc.deductionLine, value: -st.deduction, tone: 'neg' })
      if (o.paymentMethod === 'cod') {
        rows.push({ label: S.calc.debtRaised, value: -st.hbReceivable, tone: 'neg', rule: true })
      } else {
        rows.push({ label: S.calc.receivable, value: st.sellerReceivable, tone: 'pos', rule: true })
      }
    }

    const dropNote = dropped.length
      ? banner('warn',
          S.fill(dropped.length === 1 ? S.calc.droppedLine : S.calc.droppedLines, { n: dropped.length }),
          ' ' + S.calc.droppedNote)
      : null

    return el('div', { class: 'hs-stack' }, [
      el('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' } }, [
        methodPill(o.paymentMethod),
        pill(o.date, 'navy'),
        forBuyer ? null : pill(HBS.seller(o.sellerId).name, null),
        forBuyer ? pill(HBS.seller(o.sellerId).name, null) : pill(HBS.buyer(o.buyerId).name, null),
      ]),
      el('p', { class: 'hs-sub' }, forBuyer ? S.buyer.noCommission : S.method[o.paymentMethod + 'Note']),
      dropNote,
      el('div', {}, [el('h3', { class: 'hs-h3' }, S.columns.item), lineRows]),
      el('div', {}, [el('h3', { class: 'hs-h3' }, S.calc.title), calc(rows)]),
      o.note && !forBuyer ? note('Seed note', o.note) : null,
    ])
  }

  const openOrder = (id, opts) => drawer(
    S.fill(S.buyer.orderDetail, { id }),
    HBS.order(id) ? HBS.order(id).date : '',
    orderBreakdown(id, opts))

  /**
   * The buyer's statement table, used by the buyer surface and by the admin's view of it.
   * One definition, so the two cannot drift — and so the no-commission rule is enforced in
   * one place rather than remembered in two.
   */
  function buyerTable(st, b, role) {
    const period = st.period
    const rows = period === 'order' ? st.rows : st.groups
    const columns = period === 'order' ? [
      { label: S.columns.orderDate, cell: (r) => r.date },
      { label: S.common.order, cell: (r) => el('strong', {}, r.id) },
      { label: S.common.seller, cell: (r) => r.sellerName },
      { label: S.columns.method, cell: (r) => methodPill(r.paymentMethod) },
      { label: S.columns.base, num: true, cell: (r) => money(r.base) },
      { label: S.columns.vat, num: true, cell: (r) => money(r.vat) },
      { label: S.columns.discount, num: true, cell: (r) => r.discount ? money(-r.discount, { tone: 'neg' }) : el('span', { class: 'muted' }, '—') },
      { label: S.buyer.paid, num: true, cell: (r) => el('strong', {}, money(r.paid)) },
    ] : [
      { label: S.common.periods[period], cell: (g) => el('strong', {}, g.key) },
      { label: S.common.order, num: true, cell: (g) => String(g.rows.length) },
      { label: S.columns.base, num: true, cell: (g) => money(g.base) },
      { label: S.columns.vat, num: true, cell: (g) => money(g.vat) },
      { label: S.columns.discount, num: true, cell: (g) => money(-g.discount, { tone: g.discount ? 'neg' : null }) },
      { label: S.buyer.paid, num: true, cell: (g) => el('strong', {}, money(g.paid)) },
    ]
    return card({
      title: b.name, note: b.address, flush: true,
      actions: exportButtons(b.id + '-orders-' + period + '.csv', [
        { label: 'Date', value: (r) => r.date || r.key },
        { label: 'Order', value: (r) => r.id || '' },
        { label: 'Pre-VAT base', value: (r) => HBS.money(r.base) },
        { label: 'VAT', value: (r) => HBS.money(r.vat) },
        { label: 'Discount', value: (r) => HBS.money(r.discount) },
        { label: 'Paid', value: (r) => HBS.money(r.paid) },
      ], rows),
      body: table({
        columns, rows,
        rowKey: (r) => r.id || null,
        rowLabel: (r) => (r.id ? S.fill(S.common.openOrder, { id: r.id }) : null),
        onRowClick: (r) => r.id && openOrder(r.id, { role: role === 'admin' ? 'admin' : 'buyer' }),
      }),
      foot: el('span', { class: 'hs-sub' }, S.buyer.notCumulative),
    })
  }

  // ── Router ───────────────────────────────────────────────────────────────
  function router(routes, opts) {
    function go() {
      closeDrawer()
      const hash = location.hash.replace(/^#/, '') || opts.home
      let match = null, params = {}
      for (const pattern in routes) {
        const pp = pattern.split('/').filter(Boolean)
        const hp = hash.split('/').filter(Boolean)
        if (pp.length !== hp.length) continue
        const local = {}
        let hit = true
        for (let i = 0; i < pp.length; i++) {
          if (pp[i][0] === ':') local[pp[i].slice(1)] = decodeURIComponent(hp[i])
          else if (pp[i] !== hp[i]) { hit = false; break }
        }
        if (hit) { match = routes[pattern]; params = local; break }
      }
      opts.render(match, params, hash)
    }
    // One listener, replaced rather than stacked, so switching view twice does not render twice.
    if (root.__hsRoute) window.removeEventListener('hashchange', root.__hsRoute)
    root.__hsRoute = go
    window.addEventListener('hashchange', go)
    go()
  }

  const href = (path) => '#' + path

  root.HBSUI = {
    buyerTable,
    el, append, clear, money, shell, card, figure, pill, methodPill, draft, table, calc,
    banner, note, empty, drawer, closeDrawer, orderBreakdown, openOrder, router, href,
    periodSwitch, period, notifyEarly, setParam, getParam, exportButtons, downloadCsv,
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
