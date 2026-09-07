/**
 * Seller dashboard — wallet, standing, settlement ledger, payout runs, rate card.
 *
 * Every figure comes out of HB.balance / HB.standing / HB.settlementRun / HB.reconcile.
 * Nothing is stored and nothing is written down, so the wallet and the ledger cannot drift
 * apart: they are two renderings of one computation.
 */
;(function (HB, S, U) {
  'use strict'

  const el = U.el

  /*
   * Which seller's dashboard this is. The four seed sellers are four different shapes of
   * the same model — good standing, a capped payout, credit orders, and one who collects
   * everything himself — and the wallet is where the difference is legible. Hard-coding
   * one of them would leave the other three visible only from the admin side.
   */
  function sellerId() {
    const q = new URLSearchParams(location.search).get('seller')
    return HB.SELLERS.some((s) => s.id === q) ? q : '1042'
  }
  const SELLER_ID = sellerId()

  function sellerSwitch() {
    return el('div', { class: 'hb-risk' }, [
      el('span', { class: 'hb-filter-label' }, S.personas.seller),
      el('select', {
        class: 'hb-input hb-input--date', 'aria-label': S.personas.seller,
        onchange: (e) => {
          const url = new URL(location.href)
          if (e.target.value === '1042') url.searchParams.delete('seller')
          else url.searchParams.set('seller', e.target.value)
          location.href = url.toString()
        },
      }, HB.SELLERS.map((s) => el('option', { value: s.id, selected: s.id === SELLER_ID || null },
        s.name + (s.exampleData ? ' · example' : '')))),
    ])
  }

  const NAV = [
    { label: S.nav.money, items: [
      { href: '/wallet', label: S.nav.wallet, icon: '◆' },
      { href: '/ledger', label: S.nav.ledger, icon: '☰' },
      { href: '/runs', label: S.nav.runs, icon: '↗' },
    ] },
    { label: S.nav.account, items: [
      { href: '/standing', label: S.nav.standing, icon: '◑' },
      { href: '/rate-card', label: S.nav.rateCard, icon: '%' },
    ] },
  ]

  const shell = U.shell({
    persona: S.personas.seller, personaName: HB.seller(SELLER_ID).name,
    title: S.wallet.title, nav: NAV,
  })

  document.querySelector('.hb-top-right').prepend(sellerSwitch())

  const openOrder = (id) => U.lifecycle(id, { role: 'seller' })

  // ── Wallet ───────────────────────────────────────────────────────────────
  /**
   * Four states, one question. They are read across as a single sentence — where is the
   * money? — which is why a state at zero stays on screen greyed rather than disappearing.
   * A state that only appears when it is a problem teaches the reader it is an exception.
   */
  function wallet() {
    const m = U.modes()
    const b = HB.balance(SELLER_ID, m)
    const s = HB.seller(SELLER_ID)
    const st = HB.standing(SELLER_ID, m)
    const mix = HB.collectionMix(SELLER_ID, m)

    const state = (key, value, sub) =>
      el('div', { class: 'hb-state hb-state--' + key + (value === 0 ? ' hb-state-zero' : '') }, [
        el('div', { class: 'hb-state-label' }, S.stateLabel(key, m.risk)),
        el('div', { class: 'hb-state-value' }, U.money(value, { currency: true })),
        sub ? el('div', { class: 'hb-state-sub' }, sub) : null,
        el('div', { class: 'hb-state-note' },
          key === 'held' && value === 0 ? S.states.heldEmpty
            : key === 'awaiting' && value === 0 ? S.states.awaitingEmpty
              : S.stateNote(key, m.risk)),
      ])

    return U.frag([
      U.filingWarning(SELLER_ID),
      U.riskBanner(),
      U.note('Where is the money?',
        'One balance answers "what does the book say" and hides three other questions: may we release it, can we actually pay it, and has anyone even been paid. Four states answer all four. Zero is still an answer, so an empty state stays on screen.'),

      el('div', { class: 'hb-states' }, [
        state('payable', b.payable),
        state('held', b.held),
        state('dues', b.dues),
        state('awaiting', b.awaitingGross, b.awaitingGross > 0 ? S.common.net + ' ' + U.moneyText(b.awaitingNet, { currency: true }) : null),
      ]),

      b.dues > 0 ? U.banner('warn', null, S.fill(S.wallet.duesExplain, { amount: U.moneyText(b.dues, { currency: true }) })) : null,
      b.awaitingGross > 0 ? U.banner('info', null, S.fill(S.wallet.awaitingExplain, {
        gross: U.moneyText(b.awaitingGross, { currency: true }), net: U.moneyText(b.awaitingNet, { currency: true }),
      })) : null,
      b.unfunded > 0 ? U.banner('bad', null, S.fill(S.wallet.unfundedWarn, {
        book: U.moneyText(b.bookOwed, { currency: true }), cash: U.moneyText(b.cashBacked, { currency: true }),
        gap: U.moneyText(b.unfunded, { currency: true }),
      })) : null,

      el('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)', gap: '18px', alignItems: 'start' } }, [
        U.card({
          title: S.wallet.cashPosition,
          note: (function () {
            /*
             * Orders that contributed cash, not orders that are fully settled. A
             * part-paid credit order put 150.000 into the total above; leaving it out of
             * the count made the sentence describe a different number from the one
             * beside it.
             */
            const n = HB.ordersFor(SELLER_ID).filter((o) => o.paymentRoute === 'highbase' && HB.collected(o, m) !== 0).length
            return S.fill(n === 1 ? S.wallet.collectedLineOne : S.wallet.collectedLine, {
              collected: U.moneyText(b.collected, { currency: true }), n,
            })
          })(),
          actions: [U.standingBadge(st.grade), el('a', { class: 'hb-btn hb-btn--quiet hb-btn--sm', href: U.href('/standing') }, 'Why? →')],
          body: [
            U.note('Cash position', 'The sentence a flat balance cannot say: what Highbase holds, what it kept, and what it already paid — three numbers that produce the fourth.'),
            /*
             * Held cash is a line here, not an omission. Without it the block reads
             * 280.000 − 8.400 = 71.600 and simply does not add up — which on a screen
             * whose whole job is to explain a number is worse than showing no working.
             */
            U.calc([{ label: S.runs.grossCollected, value: b.collected }]
              .concat(b.held > 0 ? [{ label: S.wallet.heldBack, value: -b.held }] : [])
              .concat([
                { label: S.runs.commissionNetted, value: -b.commissionKept },
                { label: S.runs.alreadyPaid, value: -b.paidOut },
                { label: S.states.payable, value: b.payable, rule: true },
              ])),
            el('p', { class: 'hb-sub', style: { marginTop: '12px' } }, S.fill(S.wallet.cashLine, {
              held: U.moneyText(b.cashBacked, { currency: true }),
              commission: U.moneyText(b.commissionKept, { currency: true }),
              paid: U.moneyText(b.paidOut, { currency: true }),
            })),
          ],
          foot: el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' } }, [
            el('span', { class: 'hb-filter-label' }, S.wallet.nextPayout),
            U.pill(S.fill(S.wallet.nextPayoutOn, { date: s.nextPayoutDate }), 'green'),
            el('a', { class: 'hb-btn hb-btn--quiet', href: U.href('/runs/' + s.cycle.id), style: { marginInlineStart: 'auto' } }, 'Open the pending run →'),
          ]),
        }),

        U.card({
          title: S.wallet.recent, note: S.wallet.recentNote, flush: true,
          body: U.table({
            columns: [
              { label: S.ledger.colDate, cell: (p) => p.date },
              { label: S.ledger.colType, cell: (p) => U.postingChip(p.type) },
              { label: S.ledger.colOrder, cell: (p) => p.orderId || el('span', { class: 'muted' }, p.payoutId) },
              { label: S.ledger.colAmount, num: true, cell: (p) => U.money(p.amount, { tone: 'auto', signed: p.amount > 0 }) },
            ],
            compact: true,
            rows: b.postings.slice().reverse().slice(0, 6),
            rowKey: (p) => p.orderId,
            rowLabel: (p) => 'Open ' + p.orderId,
            onRowClick: (p) => p.orderId && openOrder(p.orderId),
          }),
          foot: el('a', { class: 'hb-btn hb-btn--quiet', href: U.href('/ledger') }, S.wallet.viewLedger + ' →'),
        }),
      ]),
    ])
  }

  // ── Standing ─────────────────────────────────────────────────────────────
  /**
   * The grade, the three ratios that produced it, and what would move it.
   *
   * A grade with no named cause is a credit score, and a credit score is something a
   * seller argues with rather than fixes. So every input is shown against its threshold,
   * the ones that tripped are marked, and the advice is in the seller's own units —
   * settle this much, route this much — not in ratios they would have to invert.
   */
  function standingView() {
    const m = U.modes()
    const st = HB.standing(SELLER_ID, m)
    const s = HB.seller(SELLER_ID)
    const RULES = HB.STANDING_RULES

    const tripped = (input) => st.triggers.some((t) => t.input === input)

    const advice = st.toImprove.map((a) =>
      a.action === 'settle' ? S.fill(S.standing.settle, { amount: U.moneyText(a.amount, { currency: true }) })
        : a.action === 'route' ? S.fill(S.standing.route, { amount: U.moneyText(a.amount, { currency: true }) })
          : S.fill(S.standing.reduce, { ratio: a.ratio.toFixed(2) }))

    return U.frag([
      U.filingWarning(SELLER_ID),
      U.note('Derived, not assigned',
        'Three ratios, recomputed every time the ledger moves. The bar shows the value; the tick shows the threshold. Nothing here is a score somebody set, which is why the seller can be told exactly what moves it.'),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: '18px', alignItems: 'start' } }, [
        U.card({
          title: S.standing.detailTitle, note: S.standing.note,
          body: el('div', { style: { display: 'grid', gap: '20px' } }, [
            U.ratio({
              label: S.standing.arrearsRatio, value: st.inputs.arrearsRatio.value, threshold: RULES.watch.arrearsRatio,
              dir: 'above', display: st.inputs.arrearsRatio.value.toFixed(2),
              foot: U.moneyText(st.inputs.arrearsRatio.numerator, { currency: true }) + ' of ' + U.moneyText(st.inputs.arrearsRatio.denominator, { currency: true }) + ' ceiling',
              thresholdLabel: 'watch 0.50 · late 0.80 · suspended 1.00',
            }),
            U.ratio({
              label: S.standing.onlineShare, value: st.inputs.onlineShare.value, threshold: RULES.watch.onlineShare,
              dir: 'below', display: HB.pct(st.inputs.onlineShare.value, 1),
              foot: U.moneyText(st.inputs.onlineShare.numerator, { currency: true }) + ' of ' + U.moneyText(st.inputs.onlineShare.denominator, { currency: true }) + ' GMV',
              thresholdLabel: 'floor 30.0%',
            }),
            U.ratio({
              label: S.standing.discountRatio, value: st.inputs.discountRatio.value, threshold: RULES.watch.discountRatio,
              dir: 'above', display: st.inputs.discountRatio.value.toFixed(2),
              foot: U.moneyText(st.inputs.discountRatio.numerator, { currency: true }) + ' funded against ' + U.moneyText(st.inputs.discountRatio.denominator, { currency: true }) + ' earned',
              thresholdLabel: 'limit 1.00',
            }),
          ]),
        }),

        el('div', { class: 'hb-stack' }, [
          U.card({
            title: S.standing.title,
            body: [
              el('div', { style: { marginBottom: '14px' } }, U.standingBadge(st.grade)),
              el('h3', { class: 'hb-h3' }, S.standing.triggeredBy),
              st.triggers.length === 0
                ? el('p', { class: 'hb-sub', style: { margin: 0 } }, S.standing.noTrigger)
                : el('ul', { class: 'hb-sub', style: { margin: 0, paddingInlineStart: '18px' } },
                  st.triggers.map((t) => el('li', {}, S.fill(t.dir === 'below' ? S.standing.triggerBelow : S.standing.triggerAbove, {
                    label: S.standing[t.input],
                    value: t.input === 'onlineShare' ? HB.pct(t.value, 1) : t.value.toFixed(2),
                    threshold: t.input === 'onlineShare' ? HB.pct(t.threshold, 1) : t.threshold.toFixed(2),
                  })))),
            ],
            foot: el('div', {}, [
              el('h3', { class: 'hb-h3' }, S.standing.toImprove),
              advice.length === 0
                ? el('p', { class: 'hb-sub', style: { margin: 0 } }, S.standing.nothingToImprove)
                : el('ul', { class: 'hb-sub', style: { margin: 0, paddingInlineStart: '18px' } }, advice.map((a) => el('li', {}, a))),
            ]),
          }),
          U.card({
            title: 'The four grades',
            body: el('dl', { class: 'hb-kv' }, [
              el('dt', {}, U.standingBadge('good')), el('dd', { style: { fontWeight: '400', color: 'var(--ink-2)' } }, 'No ratio near its limit'),
              el('dt', {}, U.standingBadge('watch')), el('dd', { style: { fontWeight: '400', color: 'var(--ink-2)' } }, 'Collection floor, discount limit, or dues at half the ceiling'),
              el('dt', {}, U.standingBadge('late')), el('dd', { style: { fontWeight: '400', color: 'var(--ink-2)' } }, 'Dues at 80% of the ceiling'),
              el('dt', {}, U.standingBadge('suspended')), el('dd', { style: { fontWeight: '400', color: 'var(--ink-2)' } }, 'Dues at or over the ceiling'),
            ]),
          }),
        ]),
      ]),
    ])
  }

  // ── Settlement ledger ────────────────────────────────────────────────────
  const filters = { type: 'all', route: 'all' }

  function ledger() {
    const m = U.modes()
    const b = HB.balance(SELLER_ID, m)
    const rows = b.postings.filter((p) => {
      if (filters.type !== 'all' && p.type !== filters.type) return false
      if (filters.route !== 'all') {
        const o = p.orderId && HB.order(p.orderId)
        if (!o || o.paymentRoute !== filters.route) return false
      }
      return true
    })

    // The running total is computed over the rows in ledger order, so the last row of an
    // unfiltered ledger equals the book balance on the wallet. Two screens, one number.
    let running = 0
    const withRunning = rows.map((p) => ({ p, running: (running += p.amount) }))

    const body = rows.length === 0
      ? U.empty(S.ledger.empty, S.ledger.emptyNote,
        el('button', {
          class: 'hb-btn hb-btn--outline hb-btn--sm', style: { marginTop: '12px' },
          onclick: () => { filters.type = 'all'; filters.route = 'all'; render() },
        }, 'Clear filters'))
      : U.table({
        columns: [
          { label: S.ledger.colDate, cell: (r) => r.p.date },
          { label: S.ledger.colType, cell: (r) => U.frag([U.postingChip(r.p.type), ' ', el('span', { class: 'muted', style: { fontSize: '12px' } }, r.p.label)]) },
          { label: S.ledger.colOrder, cell: (r) => r.p.orderId || el('span', { class: 'muted' }, r.p.payoutId) },
          { label: S.ledger.colRoute, cell: (r) => (r.p.orderId ? U.routePill(HB.order(r.p.orderId).paymentRoute) : el('span', { class: 'muted' }, '—')) },
          { label: S.ledger.colTerms, cell: (r) => (r.p.orderId ? U.termsPill(HB.order(r.p.orderId).terms) : el('span', { class: 'muted' }, '—')) },
          { label: S.ledger.colRate, cell: (r) => (r.p.orderId ? U.pill(r.p.rateCardVersion, 'navy') : el('span', { class: 'muted' }, '—')) },
          { label: S.ledger.colAmount, num: true, cell: (r) => U.money(r.p.amount, { tone: 'auto', signed: r.p.amount > 0 }) },
          { label: S.ledger.runningTotal, num: true, cell: (r) => U.money(r.running, { class: 'muted' }) },
        ],
        rows: withRunning,
        rowKey: (r) => r.p.orderId,
        rowLabel: (r) => 'Open ' + r.p.orderId,
        onRowClick: (r) => r.p.orderId && openOrder(r.p.orderId),
        foot: [
          { cell: S.ledger.runningTotal, span: 6 },
          { cell: U.money(HB.sum(rows.map((r) => r.amount)), { currency: true, tone: 'auto' }), num: true },
          { cell: '' },
        ],
      })

    return U.frag([
      U.filingWarning(SELLER_ID),
      U.note('One ledger, six posting types',
        'Every row carries the code that says what kind of movement it is, the payment route, the terms, and the rate card that priced it. The running total is derived here — the last row equals the wallet’s book balance by construction.'),
      U.card({
        title: S.ledger.title, note: S.ledger.note, flush: true,
        body: U.frag([
          el('div', { class: 'hb-card-body', style: { paddingBottom: '12px' } },
            el('div', { class: 'hb-filters' }, [
              el('span', { class: 'hb-filter-label' }, S.ledger.filterType),
              U.segmented([{ value: 'all', label: S.ledger.all }].concat(Object.keys(HB.POSTING).map((c) => ({ value: c, label: c }))),
                filters.type, (v) => { filters.type = v; render() }),
              el('span', { class: 'hb-filter-label', style: { marginInlineStart: '10px' } }, S.ledger.filterRoute),
              U.segmented([
                { value: 'all', label: S.ledger.all },
                { value: 'highbase', label: S.ledger.highbase },
                { value: 'seller', label: S.ledger.direct },
              ], filters.route, (v) => { filters.route = v; render() }),
            ])),
          body,
        ]),
      }),
    ])
  }

  // ── Payout runs ──────────────────────────────────────────────────────────
  function runsList() {
    const m = U.modes()
    const s = HB.seller(SELLER_ID)
    const run = HB.settlementRun(SELLER_ID, m)
    const paid = HB.PAYOUTS.filter((p) => p.sellerId === SELLER_ID)
      .map((p) => ({ id: p.runId, cycle: s.cycle.label, status: 'paid', net: p.amount, date: p.date, href: null }))
      .reverse()
    const pending = {
      id: run.id, cycle: s.cycle.label, date: s.nextPayoutDate,
      status: run.refused ? 'refused' : run.unfunded > 0 ? 'capped' : 'pending',
      net: run.net, href: U.href('/runs/' + run.id),
    }

    return U.frag([
      U.filingWarning(SELLER_ID),
      U.note('The payout rule',
        'A run never releases more than the cash Highbase holds. The pending run is computed with MAX(cashBacked + MIN(accrued, 0), 0) — open it to see the arithmetic rather than the result.'),
      U.card({
        title: S.runs.title, note: S.runs.note, flush: true,
        body: U.table({
          columns: [
            { label: S.runs.colRun, cell: (r) => (r.href ? el('a', { href: r.href }, r.id) : r.id) },
            { label: S.runs.colCycle, cell: (r) => r.cycle },
            { label: S.ledger.colDate, cell: (r) => r.date },
            { label: S.runs.colStatus, cell: (r) => U.pill(S.runs[r.status], r.status === 'paid' ? 'navy' : r.status === 'refused' ? 'red' : r.status === 'capped' ? 'orange' : 'green') },
            { label: S.runs.colNet, num: true, cell: (r) => U.money(r.net, { currency: true }) },
          ],
          rows: [pending].concat(paid),
        }),
      }),
    ])
  }

  function runDetail(runId) {
    const m = U.modes()
    const s = HB.seller(SELLER_ID)
    if (runId !== s.cycle.id) {
      return U.card({
        title: S.runs.title,
        body: U.empty(S.common.notFound, S.common.notFoundNote,
          el('a', { class: 'hb-btn hb-btn--outline hb-btn--sm', href: U.href('/runs'), style: { marginTop: '12px' } }, '← ' + S.runs.title)),
      })
    }

    const run = HB.settlementRun(SELLER_ID, m)
    const b = HB.balance(SELLER_ID, m)
    const included = run.included.map(HB.order)

    return U.frag([
      U.filingWarning(SELLER_ID),
      U.riskBanner(),
      U.note('MAX(cashBacked + MIN(accrued, 0), 0)',
        'The net is shown as the computation, not as a result. MIN(accrued, 0) is the load-bearing half: a positive accrual — a discount Highbase owes but has not funded in cash — never increases what can be released.'),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,.85fr)', gap: '18px', alignItems: 'start' } }, [
        U.card({
          title: S.fill(S.runs.detailTitle, { id: runId }),
          note: s.cycle.label + ' · ' + S.runs[run.refused ? 'refused' : 'pending'],
          body: [
            el('h3', { class: 'hb-h3' }, S.runs.computation),
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
              : b.unfunded > 0
                ? el('div', { style: { marginTop: '14px' } }, U.banner('warn', null, S.fill(S.runs.cappedBy, { gap: U.moneyText(b.unfunded, { currency: true }) })))
                : null,
          ],
        }),

        el('div', { class: 'hb-stack' }, [
          U.card({
            title: S.runs.included, note: included.length + ' of ' + HB.ordersFor(SELLER_ID).length + ' orders in this cycle', flush: true,
            body: included.length === 0
              ? U.empty('Nothing to settle', 'No order in this cycle is releasable under the current risk model.')
              : U.table({
                columns: [
                  { label: S.ledger.colOrder, cell: (o) => o.id },
                  { label: S.ledger.colRoute, cell: (o) => U.routePill(o.paymentRoute) },
                  { label: 'Value', num: true, cell: (o) => U.money(o.grossValue, { tone: 'negative' }) },
                ],
                compact: true,
                rows: included,
                rowKey: (o) => o.id,
                rowLabel: (o) => 'Open ' + o.id,
                onRowClick: (o) => openOrder(o.id),
              }),
          }),
          U.card({
            title: S.runs.carried,
            note: run.carried.length ? 'Each with the reason it did not settle.' : null,
            flush: run.carried.length > 0,
            body: run.carried.length === 0
              ? U.empty(S.runs.carriedNone, 'No order is waiting on a delivery confirmation, an open return window, or a buyer.')
              : U.table({
                columns: [
                  { label: S.ledger.colOrder, cell: (c) => c.orderId },
                  { label: 'Reason', cell: (c) => el('span', { class: 'hb-sub', style: { margin: 0 } }, c.reason) },
                  { label: 'Amount', num: true, cell: (c) => U.money(c.amount) },
                ],
                compact: true,
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

  // ── Rate card ────────────────────────────────────────────────────────────
  function rateCardView() {
    const m = U.modes()
    const s = HB.seller(SELLER_ID)
    const applied = HB.rateCard(s.rateCardId)
    const advertised = HB.RATE_CARDS.find((r) => r.status === 'advertised')
    const orders = HB.ordersFor(SELLER_ID)
    const mix = HB.collectionMix(SELLER_ID, m)
    const commission = HB.reconcile(SELLER_ID, m).expectedTotal
    const firstOrder = orders[0]
    const wouldCharge = HB.round3(firstOrder.grossValue * advertised.rate)

    return U.frag([
      U.note('Versioned terms',
        'A rate card is versioned and dated because "3% today" is not an answer to "why was this order charged 15.000 in June". Every posting names the card that priced it.'),
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '18px', alignItems: 'start' } }, [
        U.card({
          title: S.rateCard.applied, note: S.rateCard.appliedNote,
          actions: [U.pill(applied.version, 'green')],
          body: [
            el('div', { style: { fontSize: '32px', fontWeight: '700', letterSpacing: '-.02em', marginBottom: '10px' } }, (applied.rate * 100) + '%'),
            el('dl', { class: 'hb-kv' }, [
              el('dt', {}, 'Model'), el('dd', {}, applied.label),
              el('dt', {}, 'Effective from'), el('dd', {}, applied.effectiveFrom),
              el('dt', {}, S.rateCard.commissionThisCycle), el('dd', {}, U.money(commission, { currency: true })),
              el('dt', {}, 'Applied to'), el('dd', {}, S.fill(S.rateCard.onOrders, { n: orders.length, value: U.moneyText(mix.net, { currency: true }) })),
            ]),
          ],
        }),
        U.card({
          title: S.rateCard.conflict,
          actions: [U.pill(S.rateCard.stale, 'red')],
          body: [
            U.banner('warn', advertised.label, S.fill(S.rateCard.conflictNote, {
              label: advertised.label, date: advertised.effectiveFrom, applied: applied.label,
            })),
            el('p', { class: 'hb-sub', style: { marginTop: '12px' } }, [
              'The two cards do not differ by a rounding. Flat 3% charges ',
              U.money(commission, { currency: true }),
              ' across this cycle; 10%-then-0% would charge ',
              U.money(wouldCharge, { currency: true }),
              ' on ' + firstOrder.id + ' and nothing after it. Which is contractual is unresolved, so neither is applied silently.',
            ]),
          ],
        }),
      ]),
    ])
  }

  // ── Routing ──────────────────────────────────────────────────────────────
  const routes = {
    '/wallet': { title: S.wallet.title, nav: '/wallet', view: wallet },
    '/standing': { title: S.standing.title, nav: '/standing', view: standingView },
    '/ledger': { title: S.ledger.title, nav: '/ledger', view: ledger },
    '/runs': { title: S.runs.title, nav: '/runs', view: runsList },
    '/runs/:id': { title: S.runs.title, nav: '/runs', view: (p) => runDetail(p.id), titleOf: (p) => S.fill(S.runs.detailTitle, { id: p.id }) },
    '/rate-card': { title: S.rateCard.title, nav: '/rate-card', view: rateCardView },
  }

  let current = { pattern: '/wallet', params: {} }

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
    const s = HB.seller(SELLER_ID)
    shell.setTitle(r.titleOf ? r.titleOf(current.params) : r.title, s.name + ' · #' + SELLER_ID + ' · ' + s.cycle.label)
    shell.setActive(r.nav)
    try {
      shell.content.appendChild(el('div', { class: 'hb-stack' }, [r.view(current.params)]))
    } catch (err) {
      shell.content.appendChild(U.errorState())
      if (typeof console !== 'undefined') console.error(err)
    }
    if (window.HBTest) window.HBTest.run({ quiet: true })
  }

  U.router(routes, {
    fallback: '/wallet',
    render: (pattern, params) => { current = { pattern: pattern, params: params }; render() },
  }).go()

  // The acceptance tests run on load, including the DOM half of test 18 now that a
  // surface exists to scan.
  if (window.HBTest) window.HBTest.run()
})(window.HB, window.HBStrings, window.HBUI)
