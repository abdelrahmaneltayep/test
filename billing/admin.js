/**
 * Highbase admin — settlement runs, the reconciliation control, adjustments, rate cards
 * and exposure.
 *
 * Two roles share this surface. Ops issues and corrects; Finance approves and pays. The
 * actor switch is not a demo convenience — the approve action changes with it, because the
 * separation of duties is the control. Hiding the action from Ops would teach nobody why
 * it is hidden; refusing it, with the reason, teaches exactly that.
 */
;(function (root) {
  root.HBApps = root.HBApps || {}
  /*
   * A named app rather than an IIFE that runs itself, so the four surfaces can be bundled
   * into one file and the right one started on demand. The multi-file build calls this at
   * the foot of its own page; the single-file build picks by role.
   */
  root.HBApps.admin = function (HB, S, U) {
    'use strict'

  const el = U.el

  const NAV = [
    { label: S.nav.control, items: [
      { href: '/control', label: S.nav.reconciliation, icon: '⚖' },
      { href: '/adjustments', label: S.nav.adjustments, icon: '±' },
    ] },
    { label: S.nav.settlement, items: [
      { href: '/runs', label: S.nav.runs, icon: '↗' },
      { href: '/rate-cards', label: S.nav.rateCards, icon: '%' },
    ] },
    { label: S.nav.exposure, items: [
      { href: '/exposure', label: S.nav.sellerExposure, icon: '▤' },
      { href: '/buyers', label: S.nav.buyerExposure, icon: '◇' },
    ] },
  ]

  /** Ops or Finance, carried in the query string like the other two modes. */
  function actor() {
    return new URLSearchParams(location.search).get('actor') === 'finance' ? 'finance' : 'ops'
  }
  function actorToggle() {
    return el('div', { class: 'hb-risk' }, [
      el('span', { class: 'hb-filter-label' }, S.admin.actorShort),
      U.segmented([
        { value: 'ops', label: S.admin.ops },
        { value: 'finance', label: S.admin.finance },
      ], actor(), (v) => {
        const url = new URL(location.href)
        if (v === 'ops') url.searchParams.delete('actor')
        else url.searchParams.set('actor', v)
        location.href = url.toString()
      }),
    ])
  }

  const shell = U.shell({
    persona: S.personas.admin, personaName: S.admin[actor()],
    title: S.control.title, nav: NAV,
  })

  // The actor switch belongs beside the other two modes in the header.
  document.querySelector('.hb-top-right').prepend(actorToggle())

  const openOrder = (id) => U.lifecycle(id, { role: 'admin' })

  // ── Reconciliation control — the proof screen ────────────────────────────
  function control() {
    const m = U.modes()
    const all = HB.reconcileAll(m)
    const inScope = HB.sum(all.each.map((r) => r.rows.length))

    const offenderRows = all.offenders.map((o) => Object.assign({}, o, { seller: HB.seller(o.sellerId) }))
    const anatomy = offenderRows.length ? HB.errorAnatomy(offenderRows[0].sellerId, offenderRows[0].orderId) : null
    const over = offenderRows.length ? HB.overstatement(offenderRows[0].sellerId, m) : null

    return U.frag([
      U.note('One query, named rows',
        'The total says the book is wrong; the per-order rows say which row to open. That is the difference between a control that starts an investigation and one that starts an argument.'),

      el('div', { class: 'hb-banner hb-banner--' + (all.passes ? 'good' : 'bad'), style: { alignItems: 'center' } }, [
        el('div', { style: { flex: '1' } }, [
          el('strong', {}, all.passes ? S.control.passes : S.control.fails),
          el('div', {}, all.passes ? S.control.passesNote : S.control.failsNote),
          el('div', { class: 'hb-calc-expr', style: { marginTop: '10px', background: 'rgba(255,255,255,.6)' } }, S.control.query),
        ]),
      ]),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' } }, [
        statTile(S.control.expected, all.expectedTotal, null),
        statTile(S.control.actual, all.actualTotal, all.delta !== 0 ? 'bad' : null),
        statTile(S.control.delta, all.delta, all.delta !== 0 ? 'bad' : 'good', { signed: true }),
        statTile(S.control.inScope, null, null, null, inScope + ' orders'),
      ]),

      U.card({
        title: S.control.offenders,
        note: S.fill(S.control.inScopeNote, { n: inScope }),
        flush: offenderRows.length > 0,
        body: offenderRows.length === 0
          ? U.empty(S.control.offendersNone, S.control.offendersNoneNote)
          : U.table({
            columns: [
              { label: S.control.colSeller, cell: (r) => r.seller.name + ' · #' + r.sellerId },
              { label: S.control.colOrder, cell: (r) => el('strong', {}, r.orderId) },
              { label: S.control.colValue, num: true, cell: (r) => U.money(r.orderValue, { tone: 'negative' }) },
              { label: S.control.expected, num: true, cell: (r) => U.money(r.expected, { tone: 'auto', signed: r.expected > 0 }) },
              { label: S.control.actual, num: true, cell: (r) => U.money(r.actual, { tone: 'auto', signed: r.actual > 0 }) },
              { label: S.control.delta, num: true, cell: (r) => U.money(r.delta, { signed: true, tone: 'auto' }) },
            ],
            rows: offenderRows,
            rowKey: (r) => r.orderId,
            rowLabel: (r) => 'Open ' + r.orderId,
            onRowClick: (r) => openOrder(r.orderId),
          }),
      }),

      anatomy ? el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px', alignItems: 'start' } }, [
        U.card({
          title: S.control.anatomy + ' — ' + anatomy.orderId, note: S.control.anatomyNote,
          body: [
            U.calc([
              { label: S.control.cashLeg, value: anatomy.cashDelta },
              { label: S.control.commissionLeg, value: anatomy.commissionDelta },
              { label: S.control.bothLegs, value: anatomy.total, rule: true },
            ]),
            el('p', { class: 'hb-sub', style: { marginTop: '12px' } },
              S.fill(S.control.leverage, { times: anatomy.leverage.toFixed(1), rate: HB.pct(HB.rateCard('rc-v1').rate, 1, 0) })),
            el('div', { style: { marginTop: '12px' } },
              U.banner('warn', S.control.oneDirectional, S.control.oneDirectionalNote)),
          ],
        }),
        U.card({
          title: S.control.impact,
          body: [
            el('div', { style: { fontSize: '30px', fontWeight: '700', letterSpacing: '-.02em', color: 'var(--red)' } },
              U.money(over.amount, { currency: true })),
            el('p', { class: 'hb-sub', style: { marginTop: '2px' } }, S.fill(S.control.statedVsCorrect, {
              stated: U.moneyText(over.stated, { currency: true }), correct: U.moneyText(over.correct, { currency: true }),
            })),
            el('p', { class: 'hb-sub' }, S.fill(S.control.scale, {
              share: HB.pct(over.shareOfBook, 1), times: over.timesCommission.toFixed(2),
            })),
            el('div', { style: { marginTop: '14px' } }, U.calc([
              { label: 'Stated balance, as filed', value: over.stated, plain: true },
              { label: 'Correct balance', value: over.correct, plain: true },
              { label: 'Overstatement', value: over.amount, rule: true },
            ])),
          ],
        }),
      ]) : null,

      U.card({
        title: 'Per seller', flush: true,
        body: U.table({
          compact: true,
          columns: [
            { label: S.control.colSeller, cell: (r) => HB.seller(r.sellerId).name },
            { label: S.control.expected, num: true, cell: (r) => U.money(r.expectedTotal) },
            { label: S.control.actual, num: true, cell: (r) => U.money(r.actualTotal) },
            { label: '', cell: (r) => U.pill(r.passes ? 'Reconciles' : 'Does not reconcile', r.passes ? 'green' : 'red') },
          ],
          rows: all.each,
        }),
      }),
    ])
  }

  function statTile(label, value, tone, opts, text) {
    return el('div', { class: 'hb-card', style: { padding: '14px 16px' } }, [
      el('div', { class: 'hb-filter-label' }, label),
      el('div', {
        style: { fontSize: '22px', fontWeight: '700', letterSpacing: '-.02em', marginTop: '2px',
          color: tone === 'bad' ? 'var(--red)' : tone === 'good' ? 'var(--green)' : 'var(--ink)' },
      }, value === null ? text : U.money(value, Object.assign({ currency: true }, opts || {}))),
    ])
  }

  // ── Settlement runs ──────────────────────────────────────────────────────
  function runsList() {
    const m = U.modes()
    const rows = HB.SELLERS.map((s) => {
      const run = HB.settlementRun(s.id, m)
      return { run, seller: s, standing: HB.standing(s.id, m) }
    })

    return U.frag([
      U.filingWarning(null),
      U.riskBanner(),
      U.note('Refuse, not warn',
        'Where the book asks for more than the cash on hand the run does not go out short — it does not go out. Paying it and flagging it is how a 0.300 gap becomes a support ticket and somebody else’s money.'),
      U.card({
        title: S.runs.title, note: S.runs.note, flush: true,
        body: U.table({
          columns: [
            { label: S.runs.colRun, cell: (r) => el('a', { href: U.href('/runs/' + r.run.id) }, r.run.id) },
            { label: S.runs.colSeller, cell: (r) => r.seller.name },
            { label: S.runs.colCycle, cell: (r) => r.seller.cycle.label },
            { label: 'Standing', cell: (r) => U.standingBadge(r.standing.grade) },
            { label: 'Cash held', num: true, cell: (r) => U.money(r.run.cashBacked) },
            { label: S.runs.colNet, num: true, cell: (r) => U.money(r.run.net) },
            { label: S.runs.colStatus, cell: (r) => U.pill(S.runs[r.run.refused ? 'refused' : 'pending'], r.run.refused ? 'red' : 'green') },
          ],
          rows,
          rowKey: (r) => r.run.id,
          rowLabel: (r) => 'Open run ' + r.run.id,
          onRowClick: (r) => { location.hash = '/runs/' + r.run.id },
        }),
      }),
    ])
  }

  function runDetail(runId) {
    const m = U.modes()
    const s = HB.SELLERS.find((x) => x.cycle.id === runId)
    if (!s) {
      return U.card({
        title: S.runs.title,
        body: U.empty(S.common.notFound, S.common.notFoundNote,
          el('a', { class: 'hb-btn hb-btn--outline hb-btn--sm', href: U.href('/runs'), style: { marginTop: '12px' } }, '← ' + S.runs.title)),
      })
    }
    const run = HB.settlementRun(s.id, m)
    const b = HB.balance(s.id, m)
    const who = actor()
    const canPay = who === 'finance'

    return U.frag([
      U.filingWarning(s.id),
      U.note('The cash-backed test',
        'MAX(cashBacked + MIN(accrued, 0), 0). Seller #1067 is the worked example: the book owes 81.300, Highbase holds 81.000, and the 0.300 difference is a discount it has promised but not funded.'),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,.8fr)', gap: '18px', alignItems: 'start' } }, [
        U.card({
          title: S.fill(S.runs.detailTitle, { id: run.id }),
          note: s.name + ' · #' + s.id + ' · ' + s.cycle.label,
          actions: [U.standingBadge(HB.standing(s.id, m).grade)],
          body: [
            U.calc([
              { label: S.runs.grossCollected, value: run.cashCollected },
              { label: S.runs.alreadyPaid, value: -run.alreadyPaid },
              { label: S.runs.cashAvailable, value: run.cashBacked, rule: true },
              { label: S.runs.commissionNetted, value: -run.commissionNetted },
              { label: S.runs.discountsReimbursed, value: run.discountsReimbursed },
              { label: S.runs.negativeAccruals, value: Math.min(run.accrued, 0) },
              { label: S.runs.netRelease, value: run.net, rule: true },
            ], S.runs.formula + '  =  MAX(' + U.moneyText(run.cashBacked) + ' + MIN(' + U.moneyText(run.accrued) + ', 0), 0)  =  ' + U.moneyText(run.net)),
            run.refused
              ? el('div', { style: { marginTop: '14px' } }, U.banner('bad', S.runs.refusedNote, run.refusedReason))
              : null,
          ],
          foot: el('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' } }, [
            el('button', {
              class: 'hb-btn ' + (run.refused ? 'hb-btn--outline' : 'hb-btn--primary'),
              disabled: !canPay || run.refused,
              title: !canPay ? S.admin.opsNote : run.refused ? run.refusedReason : null,
            }, run.refused ? S.runs.refuse : S.runs.approve),
            el('span', { class: 'hb-sub', style: { margin: 0 } },
              !canPay ? S.admin.opsNote : run.refused ? 'Refused by the cash-backed test.' : 'Cleared by the cash-backed test.'),
          ]),
        }),

        el('div', { class: 'hb-stack' }, [
          U.card({
            title: S.runs.included, note: run.included.length + ' of ' + HB.ordersFor(s.id).length + ' orders', flush: run.included.length > 0,
            body: run.included.length === 0
              ? U.empty('Nothing to settle', 'No order in this cycle is releasable under the current risk model.')
              : U.table({
                compact: true,
                columns: [
                  { label: S.ledger.colOrder, cell: (id) => id },
                  { label: S.ledger.colRoute, cell: (id) => U.routePill(HB.order(id).paymentRoute) },
                  { label: 'Value', num: true, cell: (id) => U.money(HB.order(id).grossValue, { tone: 'negative' }) },
                ],
                rows: run.included,
                rowKey: (id) => id,
                rowLabel: (id) => 'Open ' + id,
                onRowClick: (id) => openOrder(id),
              }),
          }),
          U.card({
            title: S.runs.carried, flush: run.carried.length > 0,
            body: run.carried.length === 0
              ? U.empty(S.runs.carriedNone, 'No order is waiting on a delivery confirmation, an open return window, or a buyer.')
              : U.table({
                compact: true,
                columns: [
                  { label: S.ledger.colOrder, cell: (c) => c.orderId },
                  { label: 'Reason', cell: (c) => el('span', { class: 'hb-sub', style: { margin: 0 } }, c.reason) },
                  { label: 'Amount', num: true, cell: (c) => U.money(c.amount, { tone: 'negative' }) },
                ],
                rows: run.carried,
                rowKey: (c) => c.orderId,
                rowLabel: (c) => 'Open ' + c.orderId,
                onRowClick: (c) => c.orderId && openOrder(c.orderId),
              }),
          }),
        ]),
      ]),
    ])
  }

  // ── Adjustments ──────────────────────────────────────────────────────────
  function adjustmentsView() {
    const m = U.modes()
    const who = actor()
    const rows = HB.adjustments(m)

    return U.frag([
      U.filingWarning(null),
      U.note('Separation of duties', S.admin.separation),
      el('div', { class: 'hb-riskbanner' }, [
        el('b', {}, S.admin.actor + ': ' + S.admin[who]),
        el('span', {}, who === 'ops' ? S.admin.opsNote : S.admin.financeNote),
      ]),

      U.card({
        title: S.adjustments.title, note: S.adjustments.note, flush: rows.length > 0,
        body: rows.length === 0
          ? U.empty(S.adjustments.empty, S.adjustments.emptyNote)
          : U.table({
            columns: [
              { label: S.adjustments.colId, cell: (a) => el('strong', {}, a.id) },
              { label: S.adjustments.colType, cell: (a) => U.pill(S.adjustments[a.type], a.type === 'return' ? 'orange' : 'blue') },
              { label: S.adjustments.colOrder, cell: (a) => a.orderId },
              { label: S.adjustments.colSeller, cell: (a) => HB.seller(a.sellerId).name },
              { label: S.adjustments.colFunder, cell: (a) => a.funder ? U.pill(a.funder === 'highbase' ? 'Highbase' : 'Seller', a.funder === 'highbase' ? 'blue' : 'orange') : el('span', { class: 'muted' }, '—') },
              { label: S.adjustments.colAmount, num: true, cell: (a) => U.money(a.amount, { tone: 'auto' }) },
              { label: S.adjustments.colState, cell: (a) => U.pill(S.adjustments[a.state], a.state === 'posted' ? 'green' : a.state === 'flagged' ? 'red' : 'orange') },
              { label: S.adjustments.colEvidence, wrap: true, cell: (a) => a.evidence
                ? el('a', { href: '#', onclick: (e) => e.preventDefault(), title: S.common.exampleData }, a.evidence)
                : el('span', { class: 'muted' }, '—') },
            ],
            rows,
            rowKey: (a) => a.id,
            rowLabel: (a) => 'Open ' + a.id,
            onRowClick: (a) => openAdjustment(a, who),
          }),
      }),

      U.card({
        title: S.adjustments.breakEven, note: S.adjustments.breakEvenNote,
        body: el('div', { style: { display: 'grid', gap: '14px' } },
          rows.filter((a) => a.type !== 'return').map((a) => {
            const margin = HB.highbaseMargin(a.orderId)
            return el('div', { class: 'hb-banner hb-banner--' + (a.overBreakEven ? 'warn' : 'good') }, [
              el('div', {}, [
                el('strong', {}, a.orderId + ' · ' + HB.pct(a.discountRate, 1) + ' discount against ' + HB.pct(a.commissionRate, 1) + ' commission'),
                el('div', {}, a.overBreakEven
                  ? S.fill(S.adjustments.overBreakEven, {
                    discount: U.moneyText(a.amount, { currency: true }),
                    commission: U.moneyText(margin.earned, { currency: true }),
                    net: U.moneyText(margin.net, { currency: true }),
                  })
                  : S.adjustments.underBreakEven),
              ]),
            ])
          })),
      }),
    ])
  }

  /** The approval decision, with the reason it is refused rather than a hidden button. */
  function openAdjustment(a, who) {
    const verdict = HB.canApprove(a, who)
    const margin = a.type === 'return' ? null : HB.highbaseMargin(a.orderId)
    U.drawer({
      title: a.id,
      subtitle: S.adjustments[a.type] + ' · ' + HB.seller(a.sellerId).name,
      body: [
        a.flag ? U.banner('bad', 'Flagged', a.flag) : null,
        el('dl', { class: 'hb-kv', style: { marginTop: a.flag ? '14px' : 0 } }, [
          el('dt', {}, S.adjustments.colOrder), el('dd', {}, a.orderId),
          el('dt', {}, S.adjustments.colAmount), el('dd', {}, U.money(a.amount, { currency: true, tone: 'auto' })),
          el('dt', {}, S.adjustments.colFunder), el('dd', {}, a.funder ? (a.funder === 'highbase' ? 'Highbase' : 'Seller') : '—'),
          el('dt', {}, 'Issued by'), el('dd', {}, S.admin[a.issuedBy]),
          el('dt', {}, S.adjustments.colState), el('dd', {}, S.adjustments[a.state]),
          el('dt', {}, S.adjustments.colEvidence), el('dd', {}, a.evidence || '—'),
        ]),
        el('p', { class: 'hb-sub', style: { marginTop: '14px' } }, a.reason),
        margin ? el('div', { style: { marginTop: '14px' } }, U.calc([
          { label: 'Commission earned', value: margin.earned },
          { label: 'Discount funded', value: -margin.funded },
          { label: 'Highbase net on this order', value: margin.net, rule: true },
        ])) : null,
        el('div', { style: { marginTop: '18px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' } }, [
          el('button', { class: 'hb-btn hb-btn--primary', disabled: !verdict.allowed }, S.adjustments.approve),
          el('span', { class: 'hb-sub', style: { margin: 0, flex: '1 1 220px' } }, verdict.reason || 'Finance may approve this credit.'),
        ]),
        el('div', { style: { marginTop: '14px' } },
          el('a', { class: 'hb-btn hb-btn--quiet', href: '#', onclick: (e) => { e.preventDefault(); U.closeDrawer(); openOrder(a.orderId) } }, 'Open ' + a.orderId + ' →')),
      ],
    })
  }

  // ── Rate cards ───────────────────────────────────────────────────────────
  function rateCardsView() {
    const m = U.modes()
    const applied = HB.contractualCard()
    const advertised = HB.advertisedCard()
    const gap = HB.advertisedExposure(m)

    return U.frag([
      U.note('Settled, and what it leaves behind',
        'Flat 3% is contractual. That answers which rate applies; it does not answer what is owed to a seller who was shown the other card at signup and has been charged more than it promised. The counterfactual is below, so the number exists before anyone is asked to approve a write-off.'),

      U.banner('good', S.rateCards.contractual, S.fill(S.rateCards.contractualBanner, { label: applied.label })),

      U.card({
        title: S.rateCards.title, note: S.rateCards.note, flush: true,
        body: U.table({
          columns: [
            { label: S.rateCards.colVersion, cell: (r) => el('strong', {}, r.version) },
            { label: S.rateCards.colModel, cell: (r) => r.label },
            { label: S.rateCards.colRate, num: true, cell: (r) => (r.rate * 100).toFixed(0) + '%' },
            { label: S.rateCards.colEffective, cell: (r) => r.effectiveFrom },
            { label: S.rateCards.colStatus, cell: (r) => U.frag([
              U.pill(r.contractual ? S.rateCards.contractual : S.rateCards[r.status], r.contractual ? 'green' : 'orange'),
              r.stale ? U.frag([' ', U.pill(S.rateCards.stale, 'red')]) : null,
            ]) },
            { label: S.rateCards.colSource, cell: (r) => el('span', { class: 'hb-sub', style: { margin: 0 } }, r.source) },
          ],
          rows: HB.RATE_CARDS,
        }),
      }),

      U.card({
        title: S.rateCards.conflictTitle,
        note: S.rateCards.claimNote,
        actions: [U.pill(S.rateCards.correctionNeeded, 'orange')],
        flush: true,
        body: U.frag([
          el('div', { class: 'hb-card-body', style: { paddingBottom: '4px' } }, [
            U.banner('warn', null, S.fill(S.rateCards.conflictNote, { advertised: advertised.label })),
            el('p', { class: 'hb-sub', style: { marginTop: '12px' } }, S.rateCards.correctionNote),
          ]),
          U.table({
            columns: [
              { label: S.exposure.colSeller, cell: (r) => HB.seller(r.sellerId).name },
              { label: S.rateCards.colFirst, cell: (r) => r.firstOrderId },
              { label: S.rateCards.colWould, num: true, cell: (r) => U.money(r.wouldCharge) },
              { label: S.rateCards.colCharged, num: true, cell: (r) => U.money(r.charged) },
              { label: S.rateCards.colGap, num: true, cell: (r) => U.money(r.gap, { signed: true, tone: r.overcharged ? 'neg' : null }) },
              { label: '', cell: (r) => r.overcharged ? U.pill(S.rateCards.overcharged, 'red') : el('span', { class: 'muted' }, '—') },
            ],
            rows: gap.rows,
            rowKey: (r) => r.firstOrderId,
            rowLabel: (r) => 'Open ' + r.firstOrderId,
            onRowClick: (r) => openOrder(r.firstOrderId),
            foot: [
              { cell: S.rateCards.claimTotal, span: 4 },
              { cell: U.money(gap.total, { currency: true, tone: gap.total > 0 ? 'neg' : null }), num: true },
              { cell: '' },
            ],
          }),
        ]),
      }),
    ])
  }

  // ── Seller exposure ──────────────────────────────────────────────────────
  function exposure() {
    const m = U.modes()
    const ORDER = { suspended: 0, late: 1, watch: 2, good: 3 }
    const rows = HB.SELLERS.map((s) => {
      const b = HB.balance(s.id, m)
      const mix = HB.collectionMix(s.id, m)
      const st = HB.standing(s.id, m)
      const disc = HB.fundedDiscountRatio(s.id, m)
      return { s, b, mix, st, disc }
    }).sort((a, x) => ORDER[a.st.grade] - ORDER[x.st.grade])

    const worst = rows.find((r) => r.st.grade === 'suspended')
    const unsecured = HB.sum(rows.map((r) => r.b.dues))

    return U.frag([
      U.filingWarning(null),
      U.note('The row this model exists for',
        'A seller who collects every order himself generates commission Highbase cannot net against anything. Sorted worst first, because an exposure report ordered by seller id hides its own headline.'),

      worst ? U.banner('bad', S.exposure.alarm, S.fill(S.exposure.alarmNote, {
        dues: U.moneyText(worst.b.dues, { currency: true }), name: worst.s.name,
      })) : null,

      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' } }, [
        statTile(S.exposure.unsecuredTotal, unsecured, unsecured > 0 ? 'bad' : null),
        statTile('Sellers under watch or worse', null, null, null, String(rows.filter((r) => r.st.grade !== 'good').length) + ' of ' + rows.length),
        statTile('Cash held across the book', HB.sum(rows.map((r) => r.b.cashBacked))),
      ]),

      U.card({
        title: S.exposure.title, note: S.exposure.unsecuredNote, flush: true,
        body: U.table({
          columns: [
            { label: S.exposure.colSeller, cell: (r) => el('strong', {}, r.s.name) },
            { label: S.exposure.colStanding, cell: (r) => U.standingBadge(r.st.grade) },
            { label: S.exposure.colMix, num: true, cell: (r) => HB.pct(r.mix.onlineShare, 1) },
            { label: S.exposure.colCash, num: true, cell: (r) => U.money(r.b.cashBacked) },
            { label: S.exposure.colDues, num: true, cell: (r) => U.money(r.b.dues, { tone: r.b.dues > 0 ? 'neg' : null }) },
            { label: S.exposure.colArrears, num: true, cell: (r) => el('span', { class: r.st.inputs.arrearsRatio.value >= 1 ? 'neg' : null },
              r.st.inputs.arrearsRatio.value.toFixed(2) + ' / 1.00') },
            { label: S.exposure.colDiscount, num: true, cell: (r) => el('span', { class: r.disc.ratio >= 1 ? 'neg' : null }, r.disc.ratio.toFixed(2)) },
          ],
          rows,
          rowKey: (r) => r.s.id,
          rowLabel: (r) => 'Open the run for ' + r.s.name,
          onRowClick: (r) => { location.hash = '/runs/' + r.s.cycle.id },
        }),
      }),
    ])
  }

  // ── Buyer exposure ───────────────────────────────────────────────────────
  function buyerExposure() {
    const m = U.modes()
    const ex = HB.buyerExposure(m)

    if (!ex.applicable) {
      return U.frag([
        U.riskBanner(),
        U.note('Only one of the two products has this screen',
          'As an agent Highbase carries nothing against a buyer, so this is not an empty table — it is a screen that does not apply. Switching the risk model brings it into existence.'),
        U.card({
          title: S.exposure.buyerTitle,
          body: U.empty(S.exposure.buyerAgentTitle, S.exposure.buyerAgentNote,
            el('button', {
              class: 'hb-btn hb-btn--primary hb-btn--sm', style: { marginTop: '14px' },
              onclick: () => U.setMode('risk', 'guarantor'),
            }, 'Switch to ' + S.risk.guarantor)),
        }),
      ])
    }

    return U.frag([
      U.riskBanner(),
      U.note('Highbase’s own book',
        'In guarantor mode the seller is paid at delivery and Highbase waits for the buyer. This is the exposure that creates — money owed to Highbase, not to any seller.'),
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' } }, [
        statTile('Outstanding against buyers', ex.total, ex.total > 0 ? 'bad' : null),
        statTile('Buyers with a balance', null, null, null, String(ex.rows.length)),
      ]),
      U.card({
        title: S.exposure.buyerTitle, note: S.exposure.buyerNote, flush: true,
        body: U.table({
          columns: [
            { label: S.exposure.colBuyer, cell: (r) => el('strong', {}, r.name) },
            { label: S.ledger.colOrder, cell: (r) => r.orders.join(', ') },
            { label: S.exposure.colOutstanding, num: true, cell: (r) => U.money(r.outstanding, { currency: true }) },
            { label: S.exposure.colLimit, num: true, cell: (r) => U.money(r.limit) },
            { label: S.exposure.colPolicy, cell: (r) => U.pill(S.exposure.policy[r.policy], r.policy === 'enforce_hold' ? 'red' : r.policy === 'require_approval' ? 'orange' : 'navy') },
            { label: '', cell: (r) => r.overLimit ? U.pill(S.exposure.overLimit, 'red') : el('span', { class: 'muted' }, '—') },
          ],
          rows: ex.rows,
          rowKey: (r) => r.orders[0],
          rowLabel: (r) => 'Open ' + r.orders[0],
          onRowClick: (r) => openOrder(r.orders[0]),
        }),
      }),
    ])
  }

  // ── Routing ──────────────────────────────────────────────────────────────
  const routes = {
    '/control': { title: S.control.title, nav: '/control', view: control },
    '/adjustments': { title: S.adjustments.title, nav: '/adjustments', view: adjustmentsView },
    '/runs': { title: S.runs.title, nav: '/runs', view: runsList },
    '/runs/:id': { title: S.runs.title, nav: '/runs', view: (p) => runDetail(p.id), titleOf: (p) => S.fill(S.runs.detailTitle, { id: p.id }) },
    '/rate-cards': { title: S.rateCards.title, nav: '/rate-cards', view: rateCardsView },
    '/exposure': { title: S.exposure.title, nav: '/exposure', view: exposure },
    '/buyers': { title: S.exposure.buyerTitle, nav: '/buyers', view: buyerExposure },
  }

  let current = { pattern: '/control', params: {} }

  function render() {
    const r = routes[current.pattern]
    shell.content.textContent = ''
    if (!r) { shell.content.appendChild(U.empty(S.common.notFound, S.common.notFoundNote)); return }
    // The designed loading and error states, reachable from the sidebar. See ui.js.
    const demo = U.demoState()
    if (demo) {
      shell.content.appendChild(el('div', { class: 'hb-stack' }, [
        U.card({
          title: r.title,
          note: demo === 'loading' ? S.common.loadingNote : S.common.errorNote2,
          flush: true,
          body: demo === 'loading' ? U.loading(6) : U.errorState(),
          foot: el('a', { class: 'hb-btn hb-btn--quiet', href: U.stateHref(null) }, '← ' + S.common.backToLive),
        }),
      ]))
      return
    }
    // The role's remit is explained where it bites — on the adjustments queue and the
    // run's pay button — not repeated as a header subtitle that pushes the toggles onto
    // a second line.
    shell.setTitle(r.titleOf ? r.titleOf(current.params) : r.title,
      S.personas.admin + ' · ' + S.admin[actor()])
    shell.setActive(r.nav)
    try {
      shell.content.appendChild(el('div', { class: 'hb-stack' }, [r.view(current.params)]))
    } catch (err) {
      shell.content.appendChild(U.errorState())
      if (typeof console !== 'undefined') console.error(err)
    }
  }

  U.router(routes, {
    fallback: '/control',
    render: (pattern, params) => { current = { pattern: pattern, params: params }; render() },
  }).go()

  if (window.HBTest) window.HBTest.run()
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
