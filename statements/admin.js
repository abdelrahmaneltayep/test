;(function (root) {
  'use strict'

  /**
   * HB Admin surface.
   *
   * Carries all three levels the BRD names (§7.2): the list of seller statements, a
   * seller's statement, and a buyer's. It adds two screens the BRD implies but does not
   * list — the cycle report Finance actually works from, and the register of definitions
   * still open — because a stakeholder review needs to see where the numbers stop being
   * agreed.
   */

  const HBS = root.HBS
  const S = root.HBSStrings
  const U = root.HBSUI
  const el = U.el

  function start() {
    const nav = [{
      label: 'Statements',
      items: [
        { href: U.href('/sellers'), label: S.admin.sellers, icon: '≡' },
        { href: U.href('/buyers'), label: S.admin.buyers, icon: '◇' },
      ],
    }, {
      label: 'Finance',
      items: [{ href: U.href('/cycle'), label: S.admin.cycle, icon: '↗' }],
    }, {
      label: 'Review',
      items: [{ href: U.href('/questions'), label: S.admin.questions, icon: '?' }],
    }]

    U.router({
      '/sellers': { title: S.admin.sellers, sub: S.admin.sellersSub, nav: '/sellers', view: sellerList },
      '/sellers/:id': { title: 'Seller statement', sub: '', nav: '/sellers', view: (p) => sellerStatement(p.id) },
      '/buyers': { title: S.admin.buyers, sub: S.admin.buyersSub, nav: '/buyers', view: buyerList },
      '/buyers/:id': { title: 'Buyer statement', sub: '', nav: '/buyers', view: (p) => buyerStatement(p.id) },
      '/cycle': { title: S.admin.cycle, sub: S.admin.cycleSub, nav: '/cycle', view: cycleView },
      '/questions': { title: S.admin.questions, sub: S.admin.questionsSub, nav: '/questions', view: questions },
    }, {
      home: '/sellers',
      render(route, params) {
        U.clear(document.body)
        const r = route || { title: S.common.notFound, sub: '', nav: null, view: () => U.empty(S.common.notFound, S.common.notFoundNote) }
        let subtitle = r.sub
        if (params.id && HBS.seller(params.id)) subtitle = HBS.seller(params.id).name
        if (params.id && HBS.buyer(params.id)) subtitle = HBS.buyer(params.id).name
        const content = U.shell({
          role: 'admin',
          personaRole: 'HB Admin', personaName: 'Finance & Ops',
          title: r.title, subtitle: subtitle,
          nav: nav.map((g) => ({ label: g.label, items: g.items.map((i) => Object.assign({}, i, { current: i.href === '#' + r.nav })) })),
          controls: [el('span', { class: 'hs-filter-label' }, S.common.period), U.periodSwitch()],
        })
        content.appendChild(r.view(params))
      },
    })

    // ── Level 1 · list of seller statements ───────────────────────────────
    function sellerList() {
      const rows = HBS.SELLERS.map((s) => {
        const l = HBS.ledger(s.id)
        const c = HBS.cycle(s.id)
        return {
          id: s.id, name: s.name, orders: l.rows.length,
          cadence: HBS.CADENCES[s.cadence].label,
          plan: HBS.plan(s.planId).name,
          balance: l.balance, outstanding: l.outstanding,
          paymentDue: c.hbPaymentDue, sellerDue: c.sellerDue, recovered: c.recovered,
        }
      })
      const totals = {
        paymentDue: HBS.sum(rows.map((r) => r.paymentDue)),
        sellerDue: HBS.sum(rows.map((r) => r.sellerDue)),
        recovered: HBS.sum(rows.map((r) => r.recovered)),
      }
      const csvCols = [
        { label: 'Seller', value: (r) => r.name },
        { label: 'Orders', value: (r) => r.orders },
        { label: 'Plan', value: (r) => r.plan },
        { label: 'Cadence', value: (r) => r.cadence },
        { label: 'Balance', value: (r) => HBS.money(r.balance) },
        { label: 'HB payment due', value: (r) => HBS.money(r.paymentDue) },
        { label: 'Seller due', value: (r) => HBS.money(r.sellerDue) },
      ]

      return el('div', { class: 'hs-stack' }, [
        el('div', { class: 'hs-figures' }, [
          U.figure({ tone: 'pay', label: S.figures.paymentDue, value: totals.paymentDue, note: 'Across every seller, this cycle.' }),
          U.figure({ tone: 'due', label: S.figures.sellerDue, value: totals.sellerDue, note: 'Backdated COD commission netting could not clear.' }),
          U.figure({ tone: 'hold', label: S.figures.recovered, value: totals.recovered, note: S.figures.recoveredNote }),
        ]),
        U.card({
          title: S.admin.sellers, note: S.admin.sellersSub, flush: true,
          actions: U.exportButtons('seller-statements.csv', csvCols, rows),
          body: U.table({
            columns: [
              { label: S.common.seller, cell: (r) => el('strong', {}, r.name) },
              { label: 'Plan', cell: (r) => U.pill(r.plan, 'navy') },
              { label: 'Cadence', cell: (r) => r.cadence },
              { label: S.common.order, num: true, cell: (r) => String(r.orders) },
              { label: S.columns.balance, draft: 'balance', num: true, cell: (r) => U.money(r.balance, { tone: 'auto', signed: true }) },
              { label: S.columns.paymentDue, draft: 'paymentDue', num: true, cell: (r) => U.money(r.paymentDue, { tone: r.paymentDue ? 'pos' : null }) },
              { label: S.columns.sellerDue, draft: 'sellerDue', num: true, cell: (r) => U.money(r.sellerDue, { tone: r.sellerDue ? 'neg' : null }) },
            ],
            rows,
            rowKey: (r) => r.id,
            rowLabel: (r) => 'Open ' + r.name,
            onRowClick: (r) => { location.hash = '/sellers/' + r.id },
          }),
        }),
      ])
    }

    // ── Level 2 · a seller's statement ────────────────────────────────────
    function sellerStatement(id) {
      const s = HBS.seller(id)
      if (!s) return U.empty(S.common.notFound, S.common.notFoundNote)
      const l = HBS.ledger(id)
      const c = HBS.cycle(id)
      const period = U.period()
      const grouped = HBS.group(l.rows, period)

      const csvCols = [
        { label: 'Order date', value: (r) => r.date || r.key },
        { label: 'Order', value: (r) => r.id || '' },
        { label: 'Method', value: (r) => (r.paymentMethod ? S.method[r.paymentMethod] : '') },
        { label: 'Order total', value: (r) => HBS.money(r.orderTotal) },
        { label: 'Seller receivable', value: (r) => HBS.money(r.sellerReceivable) },
        { label: 'HB receivable', value: (r) => HBS.money(r.hbReceivable) },
        { label: 'HB commission', value: (r) => HBS.money(r.commission) },
        { label: 'HB deduction', value: (r) => HBS.money(r.deduction) },
        { label: 'Net payables', value: (r) => HBS.money(r.netPayable) },
        { label: 'Netted', value: (r) => HBS.money(r.offset) },
        { label: 'Payout', value: (r) => HBS.money(r.payout) },
        { label: 'Balance', value: (r) => HBS.money(r.balance) },
      ]

      const columns = period === 'order' ? [
        { label: S.columns.orderDate, cell: (r) => r.date },
        { label: S.common.order, cell: (r) => el('strong', {}, r.id) },
        { label: S.columns.method, cell: (r) => U.methodPill(r.paymentMethod) },
        { label: S.columns.rate, num: true, cell: (r) => HBS.pct(r.rate) },
        { label: S.columns.orderTotal, num: true, cell: (r) => U.money(r.orderTotal) },
        { label: S.columns.sellerReceivable, num: true, cell: (r) => U.money(r.sellerReceivable) },
        { label: S.columns.hbReceivable, draft: 'hbReceivable', num: true, cell: (r) => U.money(r.hbReceivable, { tone: r.hbReceivable ? 'neg' : null }) },
        { label: S.columns.commission, num: true, cell: (r) => U.money(r.commission) },
        { label: S.columns.deduction, draft: 'deduction', num: true, cell: (r) => U.money(r.deduction) },
        { label: S.columns.netPayable, draft: 'netPayable', num: true, cell: (r) => U.money(r.netPayable, { tone: 'auto', signed: true }) },
        { label: S.columns.offset, num: true, cell: (r) => U.money(r.offset) },
        { label: S.columns.payout, num: true, cell: (r) => U.money(r.payout, { tone: r.payout ? 'pos' : null }) },
        { label: S.columns.balance, draft: 'balance', num: true, cell: (r) => el('strong', {}, U.money(r.balance, { tone: 'auto' })) },
      ] : [
        { label: S.common.periods[period], cell: (g) => el('strong', {}, g.key) },
        { label: S.common.order, num: true, cell: (g) => String(g.rows.length) },
        { label: S.columns.orderTotal, num: true, cell: (g) => U.money(g.orderTotal) },
        { label: S.columns.sellerReceivable, num: true, cell: (g) => U.money(g.sellerReceivable) },
        { label: S.columns.hbReceivable, draft: 'hbReceivable', num: true, cell: (g) => U.money(g.hbReceivable) },
        { label: S.columns.commission, num: true, cell: (g) => U.money(g.commission) },
        { label: S.columns.netPayable, draft: 'netPayable', num: true, cell: (g) => U.money(g.netPayable, { tone: 'auto', signed: true }) },
        { label: S.columns.offset, num: true, cell: (g) => U.money(g.offset) },
        { label: S.columns.payout, num: true, cell: (g) => U.money(g.payout) },
        { label: S.columns.balance, draft: 'balance', num: true, cell: (g) => el('strong', {}, U.money(g.balance, { tone: 'auto' })) },
      ]

      return el('div', { class: 'hs-stack' }, [
        el('a', { class: 'hs-btn hs-btn--quiet hs-noprint', href: U.href('/sellers') }, S.fill(S.common.backTo, { label: S.admin.sellers })),
        el('div', { class: 'hs-figures' }, [
          U.figure({ tone: 'pay', label: S.figures.balance, value: Math.max(l.balance, 0), note: S.figures.balanceNote }),
          U.figure({ tone: 'due', label: S.figures.dues, value: l.outstanding, note: S.figures.duesNote }),
          U.figure({ tone: 'info', label: S.figures.paymentDue, value: c.hbPaymentDue, note: S.figures.paymentDueNote }),
          U.figure({ tone: 'hold', label: S.figures.recovered, value: c.recovered, note: S.figures.recoveredNote }),
        ]),
        U.card({
          title: s.name, note: s.address + ' · VAT ' + s.vatNumber, flush: true,
          actions: U.exportButtons(id + '-statement-' + period + '.csv', csvCols, grouped),
          body: U.table({
            wide: period === 'order', columns, rows: grouped,
            rowKey: (r) => r.id || null,
            rowLabel: (r) => (r.id ? S.fill(S.common.openOrder, { id: r.id }) : null),
            onRowClick: (r) => r.id && U.openOrder(r.id, { role: 'admin' }),
          }),
        }),
      ])
    }

    // ── Level 3 · buyers ──────────────────────────────────────────────────
    function buyerList() {
      const rows = HBS.BUYERS.map((b) => {
        const st = HBS.buyerStatement(b.id, 'order')
        return { id: b.id, name: b.name, orders: st.rows.length, paid: st.total }
      })
      return el('div', { class: 'hs-stack' }, [
        U.note('No commission, by construction',
          'Buyer rows are built by their own function rather than filtered from the seller ledger, so a commission figure cannot reach a buyer screen by being left in an object.'),
        U.card({
          title: S.admin.buyers, note: S.admin.buyersSub, flush: true,
          actions: U.exportButtons('buyer-statements.csv', [
            { label: 'Buyer', value: (r) => r.name },
            { label: 'Orders', value: (r) => r.orders },
            { label: 'Paid', value: (r) => HBS.money(r.paid) },
          ], rows),
          body: U.table({
            compact: true,
            columns: [
              { label: S.common.buyer, cell: (r) => el('strong', {}, r.name) },
              { label: S.common.order, num: true, cell: (r) => String(r.orders) },
              { label: S.buyer.paid, num: true, cell: (r) => U.money(r.paid) },
            ],
            rows,
            rowKey: (r) => r.id,
            rowLabel: (r) => 'Open ' + r.name,
            onRowClick: (r) => { location.hash = '/buyers/' + r.id },
          }),
        }),
      ])
    }

    function buyerStatement(id) {
      const b = HBS.buyer(id)
      if (!b) return U.empty(S.common.notFound, S.common.notFoundNote)
      const st = HBS.buyerStatement(id, U.period())
      return el('div', { class: 'hs-stack' }, [
        el('a', { class: 'hs-btn hs-btn--quiet hs-noprint', href: U.href('/buyers') }, S.fill(S.common.backTo, { label: S.admin.buyers })),
        U.banner('info', null, S.buyer.notCumulative),
        U.buyerTable(st, b, 'admin'),
      ])
    }

    // ── The cycle report Finance works from ───────────────────────────────
    function cycleView() {
      const cycles = HBS.cycleAll()
      return el('div', { class: 'hs-stack' }, [
        U.banner('warn', S.admin.cycleWarn, ' The BRD puts disbursement out of scope for Phase 1 (§4): there is no gateway, and Finance triggers every transfer by hand.'),
        el('div', { class: 'hs-figures' }, [
          U.figure({ tone: 'pay', label: 'To pay out', value: HBS.sum(cycles.map((c) => c.hbPaymentDue)), note: 'Total Finance transfers this cycle.' }),
          U.figure({ tone: 'due', label: 'To collect', value: HBS.sum(cycles.map((c) => c.sellerDue)), note: 'Total Finance invoices or collects.' }),
          U.figure({ tone: 'hold', label: S.figures.recovered, value: HBS.sum(cycles.map((c) => c.recovered)), note: 'Cleared by netting — no invoice needed.' }),
        ]),
        U.card({
          title: S.admin.cycle, note: S.admin.cycleSub, flush: true,
          actions: U.exportButtons('settlement-cycle.csv', [
            { label: 'Seller', value: (c) => HBS.seller(c.sellerId).name },
            { label: 'Cadence', value: (c) => c.cadence.label },
            { label: 'Fixed fee', value: (c) => HBS.money(c.fixedFee) },
            { label: 'HB payment due', value: (c) => HBS.money(c.hbPaymentDue) },
            { label: 'Seller due', value: (c) => HBS.money(c.sellerDue) },
            { label: 'Recovered by netting', value: (c) => HBS.money(c.recovered) },
          ], cycles),
          body: U.table({
            columns: [
              { label: S.common.seller, cell: (c) => el('strong', {}, HBS.seller(c.sellerId).name) },
              { label: 'Cadence', cell: (c) => U.pill(c.cadence.label, 'navy') },
              { label: S.columns.fixedFees, num: true, cell: (c) => U.money(c.fixedFee) },
              { label: S.figures.recovered, num: true, cell: (c) => U.money(c.recovered) },
              { label: S.columns.paymentDue, draft: 'paymentDue', num: true, cell: (c) => U.money(c.hbPaymentDue, { tone: c.hbPaymentDue ? 'pos' : null }) },
              { label: S.columns.sellerDue, draft: 'sellerDue', num: true, cell: (c) => U.money(c.sellerDue, { tone: c.sellerDue ? 'neg' : null }) },
              { label: 'Finance action', wrap: true, cell: (c) => {
                const acts = []
                if (c.hbPaymentDue) acts.push('Transfer ' + HBS.money(c.hbPaymentDue, { currency: true }))
                if (c.sellerDue) acts.push('Collect ' + HBS.money(c.sellerDue, { currency: true }))
                if (c.feeUnrecovered) acts.push('Fee unrecovered: ' + HBS.money(c.feeUnrecovered, { currency: true }))
                return acts.length ? acts.join(' · ') : el('span', { class: 'muted' }, 'Nothing to do')
              } },
            ],
            rows: cycles,
            rowKey: (c) => c.sellerId,
            rowLabel: (c) => 'Open ' + HBS.seller(c.sellerId).name,
            onRowClick: (c) => { location.hash = '/sellers/' + c.sellerId },
          }),
        }),
        cycles.some((c) => c.feeUnrecovered > 0) ? U.card({
          title: 'Fixed fees this cycle could not recover',
          note: 'A subscription fee is netted out of a payout. When the payout is zero, the fee has nowhere to come from — the BRD does not say what happens next.',
          flush: true,
          body: U.table({
            compact: true,
            columns: [
              { label: S.common.seller, cell: (c) => HBS.seller(c.sellerId).name },
              { label: S.columns.fixedFees, num: true, cell: (c) => U.money(c.fixedFee) },
              { label: 'Unrecovered', num: true, cell: (c) => U.money(c.feeUnrecovered, { tone: 'neg' }) },
            ],
            rows: cycles.filter((c) => c.feeUnrecovered > 0),
          }),
        }) : null,
      ])
    }

    // ── The register of what is not yet decided ───────────────────────────
    function questions() {
      const tone = { not_modelled: 'red', proposed: 'orange', toggle: 'blue', reading: 'orange' }
      const label = { not_modelled: 'Not modelled', proposed: 'Proposal', toggle: 'Built both ways', reading: 'A reading' }
      return el('div', { class: 'hs-stack' }, [
        U.banner('info', 'Every one of these is live in the prototype. ',
          'Where the BRD leaves a definition open, this build takes a position and marks it — on the screen, next to the number. Nothing here is settled by having been drawn.'),
        el('div', { class: 'hs-q' }, HBS.OPEN_QUESTIONS.map((q) => el('div', { class: 'hs-q-item' }, [
          el('div', { style: { display: 'flex', gap: '10px', alignItems: 'baseline', flexWrap: 'wrap' } }, [
            el('h3', {}, q.title),
            U.pill(label[q.status], tone[q.status]),
            el('span', { class: 'hs-q-ref' }, 'BRD ' + q.ref),
          ]),
          el('div', { class: 'hs-q-read' }, q.reading),
        ]))),
      ])
    }

  }

  // Registered as a named app so one bundled page can start whichever surface the URL
  // asks for; the multi-file build has no HBS_SINGLE and still starts itself.
  root.HBSApps = root.HBSApps || {}
  root.HBSApps.admin = start
  if (!root.HBS_SINGLE) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
    else start()
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
