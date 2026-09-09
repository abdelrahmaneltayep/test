;(function (root) {
  'use strict'

  /**
   * Seller surface.
   *
   * The statement is cumulative — that is the BRD's stated structural difference from the
   * buyer's (§7.2), and it is why the balance column exists at all. Everything on screen
   * comes out of HBS.ledger(); nothing is totalled here.
   */

  const HBS = root.HBS
  const S = root.HBSStrings
  const U = root.HBSUI
  const el = U.el

  function start() {
    const sellerId = U.getParam('seller', 'S-200')
    const s = HBS.seller(sellerId)
    const p = HBS.plan(s.planId)

    const sellerPicker = el('select', {
      class: 'hs-select', 'aria-label': S.common.seller,
      onchange: (e) => U.setParam('seller', e.target.value),
    }, HBS.SELLERS.map((x) => el('option', { value: x.id, selected: x.id === sellerId ? '' : null }, x.name)))

    const nav = [{
      label: 'Statements',
      items: [
        { href: U.href('/statement'), label: S.seller.statement, icon: '≡' },
        { href: U.href('/dues'), label: S.seller.dues, icon: '◑' },
      ],
    }, {
      label: 'Account',
      items: [{ href: U.href('/plan'), label: S.seller.plan, icon: '%' }],
    }]

    U.router({
      '/statement': { title: S.seller.statement, sub: S.seller.statementSub, nav: '/statement', view: statement },
      '/dues': { title: S.seller.dues, sub: S.seller.duesSub, nav: '/dues', view: dues },
      '/plan': { title: S.seller.plan, sub: S.seller.planSub, nav: '/plan', view: planView },
    }, {
      home: '/statement',
      render(route, params) {
        U.clear(document.body)
        const r = route || { title: S.common.notFound, sub: '', nav: null, view: () => U.empty(S.common.notFound, S.common.notFoundNote) }
        const content = U.shell({
          role: 'seller',
          personaRole: S.common.seller, personaName: s.name,
          title: r.title, subtitle: s.name + ' · ' + HBS.CADENCES[s.cadence].label,
          nav: nav.map((g) => ({ label: g.label, items: g.items.map((i) => Object.assign({}, i, { current: i.href === '#' + r.nav })) })),
          controls: [
            el('span', { class: 'hs-filter-label' }, S.common.seller), sellerPicker,
            el('span', { class: 'hs-filter-label' }, S.common.period), U.periodSwitch(),
          ],
        })
        content.appendChild(r.view(params))
      },
    })

    // ── The statement ─────────────────────────────────────────────────────
    function statement() {
      const l = HBS.ledger(sellerId)
      const c = HBS.cycle(sellerId)
      const period = U.period()
      const grouped = HBS.group(l.rows, period)

      const figures = el('div', { class: 'hs-figures' }, [
        U.figure({ tone: 'pay', label: S.figures.balance, value: Math.max(l.balance, 0), note: S.figures.balanceNote }),
        U.figure({ tone: 'due', label: S.figures.dues, value: U.notifyEarly() ? l.outstanding : c.sellerDue, note: S.figures.duesNote }),
        U.figure({ tone: 'info', label: S.figures.paymentDue, value: c.hbPaymentDue, note: S.figures.paymentDueNote }),
        U.figure({ tone: 'hold', label: S.figures.recovered, value: c.recovered, note: S.figures.recoveredNote }),
      ])

      // The BRD §8 column schema, in its own order, with the [Draft] columns marked.
      const columns = period === 'order' ? [
        { label: S.columns.orderDate, cell: (r) => r.date },
        { label: S.common.order, cell: (r) => el('strong', {}, r.id) },
        { label: S.columns.method, cell: (r) => U.methodPill(r.paymentMethod) },
        { label: S.columns.orderTotal, num: true, cell: (r) => U.money(r.orderTotal) },
        { label: S.columns.sellerReceivable, num: true, cell: (r) => U.money(r.sellerReceivable) },
        { label: S.columns.hbReceivable, draft: 'hbReceivable', num: true, cell: (r) => U.money(r.hbReceivable, { tone: r.hbReceivable ? 'neg' : null }) },
        { label: S.columns.commission, num: true, cell: (r) => U.money(r.commission) },
        { label: S.columns.deduction, draft: 'deduction', num: true, cell: (r) => U.money(r.deduction) },
        { label: S.columns.netPayable, draft: 'netPayable', num: true, cell: (r) => U.money(r.netPayable, { tone: 'auto', signed: true }) },
        { label: S.columns.offset, num: true, cell: (r) => U.money(r.offset) },
        { label: S.columns.balance, draft: 'balance', num: true, cell: (r) => el('strong', {}, U.money(r.balance, { tone: 'auto' })) },
      ] : [
        { label: S.common.periods[period], cell: (g) => el('strong', {}, g.key) },
        { label: S.common.order, num: true, cell: (g) => String(g.rows.length) },
        { label: S.columns.orderTotal, num: true, cell: (g) => U.money(g.orderTotal) },
        { label: S.columns.sellerReceivable, num: true, cell: (g) => U.money(g.sellerReceivable) },
        { label: S.columns.hbReceivable, draft: 'hbReceivable', num: true, cell: (g) => U.money(g.hbReceivable, { tone: g.hbReceivable ? 'neg' : null }) },
        { label: S.columns.commission, num: true, cell: (g) => U.money(g.commission) },
        { label: S.columns.deduction, draft: 'deduction', num: true, cell: (g) => U.money(g.deduction) },
        { label: S.columns.netPayable, draft: 'netPayable', num: true, cell: (g) => U.money(g.netPayable, { tone: 'auto', signed: true }) },
        { label: S.columns.balance, draft: 'balance', num: true, cell: (g) => el('strong', {}, U.money(g.balance, { tone: 'auto' })) },
      ]

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
        { label: 'Balance', value: (r) => HBS.money(r.balance) },
      ]

      return el('div', { class: 'hs-stack' }, [
        U.note('Cumulative by design',
          'The BRD names this as the structural difference from the buyer statement (§7.2): a balance carried forward order over order, like an account ledger.'),
        figures,
        l.outstanding > 0
          ? U.banner('warn', S.seller.debtHeading + ': ' + HBS.money(l.outstanding, { currency: true }) + '. ',
              U.notifyEarly() ? S.seller.notifyOn : S.seller.notifyOff)
          : U.banner('good', S.seller.noDebt + '. ', S.seller.noDebtNote),
        U.card({
          title: S.seller.statement,
          note: S.seller.cumulative,
          flush: true,
          actions: U.exportButtons(sellerId + '-statement-' + period + '.csv', csvCols, grouped),
          body: U.table({
            wide: period === 'order',
            columns,
            rows: grouped,
            rowKey: (r) => r.id || null,
            rowLabel: (r) => (r.id ? S.fill(S.common.openOrder, { id: r.id }) : null),
            onRowClick: (r) => r.id && U.openOrder(r.id, { role: 'seller' }),
          }),
          foot: el('span', { class: 'hs-sub' },
            'Every figure is derived from the order lines. Columns marked ? carry a definition the BRD has not settled.'),
        }),
      ])
    }

    // ── Dues: the backdated COD debt, and how it clears ────────────────────
    function dues() {
      const l = HBS.ledger(sellerId)
      const debts = l.rows.filter((r) => r.hbReceivable > 0)
      const clears = l.rows.filter((r) => r.offset > 0)

      const notifySwitch = el('span', { class: 'hs-seg', role: 'group', 'aria-label': S.seller.notifyLabel },
        [['early', 'At the COD order'], ['settlement', 'At settlement']].map(([v, label]) =>
          el('button', {
            type: 'button', 'aria-pressed': String(U.notifyEarly() === (v === 'early')),
            onclick: () => U.setParam('notify', v),
          }, label)))

      return el('div', { class: 'hs-stack' }, [
        U.note('An open question, built both ways',
          'The BRD asks whether a seller is told when a backdated debt is created, or only sees it at settlement (§12). The switch below shows each reading.'),
        el('div', { class: 'hs-figures' }, [
          U.figure({ tone: 'due', label: S.figures.dues, value: l.outstanding, note: S.figures.duesNote }),
          U.figure({ tone: 'hold', label: S.figures.recovered, value: HBS.sum(l.rows.map((r) => r.offset)), note: S.figures.recoveredNote }),
        ]),
        U.card({
          title: 'When you see it',
          note: S.seller.notifyOpen,
          body: el('div', { style: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' } }, [
            el('span', { class: 'hs-filter-label' }, S.seller.notifyLabel), notifySwitch,
            el('span', { class: 'hs-sub', style: { margin: '0' } }, U.notifyEarly() ? S.seller.notifyOn : S.seller.notifyOff),
          ]),
        }),
        U.card({
          title: S.seller.debtHeading,
          flush: debts.length > 0,
          body: debts.length === 0
            ? U.empty(S.seller.noDebt, S.seller.noDebtNote)
            : U.table({
                compact: true,
                columns: [
                  { label: S.columns.orderDate, cell: (r) => r.date },
                  { label: S.common.order, cell: (r) => el('strong', {}, r.id) },
                  { label: S.columns.orderTotal, num: true, cell: (r) => U.money(r.orderTotal) },
                  { label: S.columns.commission, num: true, cell: (r) => U.money(r.commission) },
                  { label: S.columns.deduction, draft: 'deduction', num: true, cell: (r) => U.money(r.deduction) },
                  { label: S.columns.hbReceivable, draft: 'hbReceivable', num: true, cell: (r) => el('strong', {}, U.money(r.hbReceivable, { tone: 'neg' })) },
                ],
                rows: debts,
                rowKey: (r) => r.id,
                rowLabel: (r) => S.fill(S.common.openOrder, { id: r.id }),
                onRowClick: (r) => U.openOrder(r.id, { role: 'seller' }),
              }),
        }),
        U.card({
          title: S.seller.nettingTitle,
          note: S.seller.nettingNote,
          body: clears.length === 0
            ? U.empty('Nothing netted yet', 'A prepaid order has not arrived to clear this debt against.')
            : el('div', { class: 'hs-stack' }, clears.map((r) => U.calc([
                { label: 'Order ' + r.id + ' — ' + S.calc.receivable, value: r.sellerReceivable, plain: true },
                { label: S.calc.offsetLine, value: -r.offset, tone: 'neg' },
                { label: S.calc.payoutLine, value: r.payout, rule: true, tone: r.payout > 0 ? 'pos' : null },
              ], r.payout === 0
                ? 'The debt was larger than this order could cover. The payout floors at 0.000 and ' +
                  HBS.money(r.outstandingAfter, { currency: true }) + ' stays outstanding.'
                : null))),
        }),
      ])
    }

    // ── The plan that prices the orders ────────────────────────────────────
    function planView() {
      const l = HBS.ledger(sellerId)
      const rates = {}
      for (const r of l.rows) rates[r.rate] = (rates[r.rate] || 0) + 1

      return el('div', { class: 'hs-stack' }, [
        U.note('Pulled from the Subscription Plan module',
          'The BRD is explicit that commission is per seller and per branch, and can step at a volume threshold (§7.5). It is not a platform-wide constant.'),
        U.card({
          title: p.name,
          note: p.note,
          body: el('dl', { class: 'hs-kv' }, [
            el('dt', {}, 'Plan'), el('dd', {}, p.name),
            el('dt', {}, 'Fixed fee per cycle'), el('dd', {}, U.money(p.fixedFeePerCycle, { currency: true })),
            el('dt', {}, 'Settlement cadence'), el('dd', {}, HBS.CADENCES[s.cadence].label),
            el('dt', {}, 'VAT number'), el('dd', {}, s.vatNumber),
          ]),
        }),
        U.card({
          title: 'Rate tiers',
          note: 'The rate that applies to an order depends on how many units had already shipped when it was placed.',
          flush: true,
          body: U.table({
            compact: true,
            columns: [
              { label: 'From units shipped', num: true, cell: (t) => String(t.fromUnits) },
              { label: S.columns.rate, num: true, cell: (t) => HBS.pct(t.rate) },
              { label: 'Orders priced at this rate', num: true, cell: (t) => String(rates[t.rate] || 0) },
            ],
            rows: p.tiers,
          }),
        }),
        s.branches && s.branches.length > 1 ? U.card({
          title: 'Branches',
          note: 'A branch can carry its own agreement, and then it prices its own orders.',
          flush: true,
          body: U.table({
            compact: true,
            columns: [
              { label: 'Branch', cell: (b) => b.name },
              { label: 'Plan', cell: (b) => HBS.plan(b.planId).name },
              { label: 'Base rate', num: true, cell: (b) => HBS.pct(HBS.plan(b.planId).tiers[0].rate) },
            ],
            rows: s.branches,
          }),
        }) : null,
      ])
    }
  }

  // Registered as a named app so one bundled page can start whichever surface the URL
  // asks for; the multi-file build has no HBS_SINGLE and still starts itself.
  root.HBSApps = root.HBSApps || {}
  root.HBSApps.seller = start
  if (!root.HBS_SINGLE) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
    else start()
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
