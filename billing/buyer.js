/**
 * Buyer dashboard — checkout, invoices, statement, credit account, price match.
 *
 * INVARIANT 2 governs this whole file: commission is a Highbase↔seller relationship and
 * nothing here may show it. That is enforced twice over — every figure comes from
 * `HB.invoices` / `HB.statement` / `HB.creditAccount` / `HB.buyerView`, none of which
 * carry a commission field, and the shared lifecycle drawer is opened with role 'buyer',
 * which withholds the commission and funding stages in the component rather than trusting
 * this file to leave them out.
 */
;(function (HB, S, U) {
  'use strict'

  const el = U.el

  /* Which buyer's account this is, like the seller surface's switcher. */
  function buyerId() {
    const q = new URLSearchParams(location.search).get('buyer')
    return HB.BUYERS.some((b) => b.id === q) ? q : 'B-203'
  }
  const BUYER_ID = buyerId()

  function buyerSwitch() {
    return el('div', { class: 'hb-risk' }, [
      el('span', { class: 'hb-filter-label' }, S.personas.buyer),
      el('select', {
        class: 'hb-input hb-input--date', 'aria-label': S.personas.buyer,
        onchange: (e) => {
          const url = new URL(location.href)
          if (e.target.value === 'B-203') url.searchParams.delete('buyer')
          else url.searchParams.set('buyer', e.target.value)
          location.href = url.toString()
        },
      }, HB.BUYERS.map((b) => el('option', { value: b.id, selected: b.id === BUYER_ID || null },
        b.name + (b.exampleData ? ' · example' : '')))),
    ])
  }

  const NAV = [
    { label: 'Orders', items: [
      { href: '/checkout', label: S.nav.checkout, icon: '⊕' },
      { href: '/price-match', label: S.nav.priceMatch, icon: '⚑' },
    ] },
    { label: S.nav.money, items: [
      { href: '/invoices', label: S.nav.invoices, icon: '☰' },
      { href: '/statement', label: S.nav.statement, icon: '▤' },
      { href: '/credit', label: S.nav.credit, icon: '◑' },
    ] },
  ]

  const shell = U.shell({
    persona: S.personas.buyer, personaName: HB.buyer(BUYER_ID).name,
    title: S.invoices.title, nav: NAV,
  })

  // The reference date belongs beside the other modes: this surface is almost entirely
  // statements about now.
  document.querySelector('.hb-top-right').prepend(U.todayControl())
  document.querySelector('.hb-top-right').prepend(buyerSwitch())

  const openOrder = (id) => U.lifecycle(id, { role: 'buyer' })
  const invoiceOf = (number) => HB.invoices(BUYER_ID, U.modes()).find((i) => i.number === number)

  /** The status pill, with its timing sub-state where it has one. */
  function statusPill(inv) {
    const tone = inv.status === 'paid' ? 'green'
      : inv.status === 'draft' ? 'navy'
        : inv.subStatus === 'overdue' ? 'red'
          : inv.subStatus === 'due_soon' ? 'orange' : 'blue'
    return U.frag([
      U.pill(S.invoices[inv.status], tone),
      inv.subStatus ? U.frag([' ', el('span', { class: 'hb-sub', style: { margin: 0, fontSize: '12px' } }, S.invoices[inv.subStatus])]) : null,
    ])
  }

  // ── Checkout — the decision that drives everything ───────────────────────
  /*
   * The heaviest screen in the module, and today the choice it captures is not recorded as
   * a billing fact at all. Both options are shown with what they actually mean rather than
   * as a radio pair, because the buyer is choosing who holds their money and when — and
   * neither of those is obvious from the words "pay Highbase".
   */
  const draft = { route: 'highbase', terms: 'immediate', amount: HB.bhd(420) }

  function checkout() {
    const m = U.modes()
    const credit = HB.creditAccount(BUYER_ID, m)
    const vat = HB.round3(draft.amount * HB.VAT_RATE)
    const total = draft.amount + vat
    const creditEligible = draft.route === 'highbase'
    const wouldExceed = draft.terms === 'credit' && total > credit.available

    // Choosing to pay the supplier directly takes credit terms with it — Highbase cannot
    // extend credit on money it never touches.
    if (!creditEligible && draft.terms === 'credit') draft.terms = 'immediate'

    const choice = (group, value, label, note, disabled) => {
      const on = draft[group] === value
      return el('button', {
        type: 'button', class: 'hb-choice' + (on ? ' hb-choice--on' : ''),
        'aria-pressed': String(on), disabled: disabled || false,
        onclick: () => { draft[group] = value; render() },
      }, [
        el('span', { class: 'hb-choice-mark', 'aria-hidden': 'true' }, on ? '●' : '○'),
        el('span', {}, [el('strong', {}, label), el('span', { class: 'hb-choice-note' }, note)]),
      ])
    }

    return U.frag([
      U.note('Recorded, not inferred',
        'paymentRoute and terms become stored fields on the order. Today they are reconstructed afterwards from which column has a number in it, which is how an order collected by the seller ends up looking like cash Highbase is holding.'),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,.8fr)', gap: '18px', alignItems: 'start' } }, [
        el('div', { class: 'hb-stack' }, [
          U.card({
            title: S.checkout.route, note: S.checkout.note,
            body: el('div', { class: 'hb-choices' }, [
              choice('route', 'highbase', S.checkout.routeHighbase, S.checkout.routeHighbaseNote),
              choice('route', 'seller', S.checkout.routeSeller, S.checkout.routeSellerNote),
            ]),
          }),
          U.card({
            title: S.checkout.terms,
            body: [
              el('div', { class: 'hb-choices' }, [
                choice('terms', 'immediate', S.checkout.termsImmediate, S.checkout.termsImmediateNote),
                choice('terms', 'credit', S.checkout.termsCredit,
                  creditEligible ? S.checkout.termsCreditNote : S.checkout.termsUnavailable + ' — ' + S.checkout.routeSellerNote,
                  !creditEligible),
              ]),
              wouldExceed
                ? el('div', { style: { marginTop: '14px' } }, U.banner('bad', S.checkout.exceedsTitle, S.fill(S.checkout.exceeds, {
                  available: U.moneyText(credit.available, { currency: true }), needed: U.moneyText(total, { currency: true }),
                }) + ' ' + credit.atLimit))
                : null,
            ],
          }),
        ]),

        el('div', { class: 'hb-stack' }, [
          U.card({
            title: S.checkout.summary,
            body: [
              U.calc([
                { label: S.checkout.subtotal, value: draft.amount, plain: true },
                { label: S.fill(S.checkout.vat, { rate: HB.pct(HB.VAT_RATE, 1, 0) }), value: vat, plain: true },
                { label: S.checkout.total, value: total, rule: true },
              ]),
              el('dl', { class: 'hb-kv', style: { marginTop: '14px' } }, [
                el('dt', {}, S.checkout.due),
                el('dd', {}, draft.terms === 'credit' ? S.fill(S.checkout.dueBy, { date: '30 days after delivery' }) : S.checkout.dueOnDelivery),
                el('dt', {}, S.checkout.creditImpact),
                el('dd', {}, draft.terms === 'credit' ? U.money(total, { currency: true }) : el('span', { class: 'muted' }, '—')),
              ]),
              el('p', { class: 'hb-sub' }, draft.terms === 'credit' ? '' : S.checkout.creditImpactNone),
            ],
            foot: el('button', { class: 'hb-btn hb-btn--primary hb-btn--block', disabled: wouldExceed }, S.checkout.place),
          }),
          U.card({
            title: S.checkout.recorded, note: S.checkout.recordedNote,
            body: el('div', { class: 'hb-calc-expr' },
              'paymentRoute: ' + JSON.stringify(draft.route) + '\n' +
              'terms:        ' + JSON.stringify(draft.terms) + '\n' +
              'dueDate:      ' + (draft.terms === 'credit' ? '"delivery + 30 days"' : 'null')),
          }),
        ]),
      ]),
    ])
  }

  // ── Invoices ─────────────────────────────────────────────────────────────
  function invoicesList() {
    const m = U.modes()
    const rows = HB.invoices(BUYER_ID, m).slice().reverse()

    return U.frag([
      U.note('Status, then timing',
        'draft → open → paid, and an open invoice carries one of four timing sub-states derived from its due date against today. Move the reference date in the header and the sub-state moves with it.'),
      U.card({
        title: S.invoices.title, note: S.invoices.note, flush: rows.length > 0,
        body: rows.length === 0
          ? U.empty(S.invoices.empty, S.invoices.emptyNote)
          : U.table({
            columns: [
              { label: S.invoices.colNumber, cell: (i) => el('a', { href: U.href('/invoices/' + i.number) }, i.number) },
              { label: S.invoices.colSupplier, cell: (i) => i.supplier.name },
              { label: S.ledger.colRoute, cell: (i) => U.routePill(i.paymentRoute) },
              { label: S.ledger.colTerms, cell: (i) => U.termsPill(i.terms) },
              { label: S.invoices.colIssued, cell: (i) => i.issueDate },
              { label: S.invoices.colDue, cell: (i) => i.dueDate },
              { label: S.invoices.colTotal, num: true, cell: (i) => U.money(i.totalPayable, { currency: true }) },
              /* Outstanding is its own column rather than a footnote on the total: on a
                 part-paid invoice the total is no longer the number anyone acts on. */
              { label: S.invoices.colOutstanding, num: true, cell: (i) =>
                i.amountPaid > 0 || i.status === 'open'
                  ? U.money(i.amountOutstanding, { currency: true, tone: i.amountOutstanding > 0 ? 'neg' : null })
                  : el('span', { class: 'muted' }, '—') },
              { label: S.invoices.colStatus, cell: (i) => statusPill(i) },
            ],
            rows,
            rowKey: (i) => i.number,
            rowLabel: (i) => 'Open ' + i.number,
            onRowClick: (i) => { location.hash = '/invoices/' + i.number },
          }),
      }),
    ])
  }

  function invoiceDetail(number) {
    const inv = invoiceOf(number)
    if (!inv) {
      return U.card({
        title: S.invoices.title,
        body: U.empty(S.common.notFound, S.common.notFoundNote,
          el('a', { class: 'hb-btn hb-btn--outline hb-btn--sm', href: U.href('/invoices'), style: { marginTop: '12px' } }, '← ' + S.invoices.title)),
      })
    }
    const rate = HB.pct(inv.vatRate, 1, 0)

    return U.frag([
      U.note('The mandatory fields',
        'A Bahrain tax invoice must carry the supplier’s name, address and VAT number, the customer’s details, a sequential number, the issue and supply dates, a description, the taxable amount, the VAT amount and the total payable. All eleven are below.'),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,.75fr)', gap: '18px', alignItems: 'start' } }, [
        U.card({
          title: S.fill(S.invoices.detailTitle, { number: inv.number }),
          note: S.invoices.taxInvoice,
          actions: [statusPill(inv)],
          body: [
            el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '18px', marginBottom: '18px' } }, [
              party(S.invoices.supplier, inv.supplier),
              party(S.invoices.customer, inv.customer),
            ]),
            el('dl', { class: 'hb-kv', style: { marginBottom: '18px' } }, [
              el('dt', {}, S.invoices.number), el('dd', {}, inv.number),
              el('dt', {}, S.invoices.issueDate), el('dd', {}, inv.issueDate),
              el('dt', {}, S.invoices.supplyDate), el('dd', {}, inv.supplyDate),
              el('dt', {}, S.invoices.dueDate), el('dd', {}, inv.dueDate),
            ]),
            el('h3', { class: 'hb-h3' }, S.invoices.lineItems),
            U.table({
              compact: true,
              columns: [
                { label: S.invoices.description, cell: (r) => r.label },
                { label: '', num: true, cell: (r) => U.money(r.value, { tone: r.value < 0 ? 'neg' : null }) },
              ],
              rows: [{ label: inv.description + ' · ' + inv.orderId, value: inv.grossValue }]
                .concat(inv.discount > 0 ? [{ label: S.invoices.discountLine, value: -inv.discount }] : [])
                .concat(inv.creditNote > 0 ? [{ label: S.invoices.creditNote, value: -inv.creditNote }] : []),
            }),
            el('div', { style: { marginTop: '14px' } }, U.calc(
              [
                { label: S.invoices.taxable, value: inv.taxableAmount, plain: true },
                { label: S.fill(S.invoices.vatAmount, { rate }), value: inv.vatAmount, plain: true },
                { label: S.invoices.total, value: inv.totalPayable, rule: true },
              ].concat(inv.amountPaid > 0 ? [
                { label: S.invoices.paid, value: -inv.amountPaid },
                { label: S.invoices.outstanding, value: inv.amountOutstanding, rule: true },
              ] : []))),
          ],
          foot: el('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' } }, [
            inv.status === 'open'
              ? el('button', { class: 'hb-btn hb-btn--primary' },
                inv.amountPaid > 0 ? S.fill(S.invoices.payBalance, { amount: U.moneyText(inv.amountOutstanding, { currency: true }) }) : S.invoices.payNow)
              : el('span', { class: 'hb-sub', style: { margin: 0 } },
                inv.paymentRoute === 'seller' ? S.invoices.directNote : S.invoices.paidNote),
            inv.status === 'open' ? el('span', { class: 'hb-sub', style: { margin: 0 } }, S.invoices.payNote) : null,
          ]),
        }),

        el('div', { class: 'hb-stack' }, [
          U.card({
            title: 'Simplified invoice',
            body: [
              U.banner(inv.simplifiedPermitted ? 'info' : 'warn', null,
                S.fill(inv.simplifiedPermitted ? S.invoices.simplified : S.invoices.notSimplified, {
                  taxable: U.moneyText(inv.taxableAmount, { currency: true }),
                  max: U.moneyText(HB.SIMPLIFIED_INVOICE_MAX, { currency: true }),
                })),
              /* Said plainly, because this invoice is the case where it matters: 500.000
                 taxable and 550.000 payable land on opposite sides of the threshold. */
              el('p', { class: 'hb-sub', style: { marginTop: '10px' } }, S.invoices.simplifiedBasis),
            ],
          }),
          U.card({
            title: S.lifecycle.title,
            body: [
              el('p', { class: 'hb-sub', style: { marginTop: 0 } },
                'The same drawer the supplier and Highbase see, with the stages that are not yours withheld.'),
              el('button', { class: 'hb-btn hb-btn--outline', onclick: () => openOrder(inv.orderId) }, 'Open ' + inv.orderId + ' →'),
            ],
          }),
        ]),
      ]),
    ])
  }

  const party = (label, p) =>
    el('div', {}, [
      el('div', { class: 'hb-filter-label' }, label),
      el('div', { style: { fontWeight: '700', marginTop: '4px' } }, p.name),
      el('div', { class: 'hb-sub', style: { marginTop: '2px' } }, p.address),
      el('div', { class: 'hb-sub' }, S.invoices.vatNumber + ' ' + p.vatNumber),
    ])

  // ── Statement ────────────────────────────────────────────────────────────
  function statement() {
    const m = U.modes()
    const st = HB.statement(BUYER_ID, m)

    const age = (inv) => {
      const over = HB.daysBetween(inv.dueDate, st.today)
      return over > 0 ? S.fill(S.statement.daysOverdue, { n: over })
        : over === 0 ? S.statement.dueToday
          : S.fill(S.statement.daysToDue, { n: -over })
    }

    return U.frag([
      U.note('Open-item, aged from the due date',
        'Every open invoice is listed on its own line and aged individually. A balance-forward statement would roll them into one carried figure, and the buyer could no longer tell which invoice is late.'),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' } },
        st.buckets.map((b) =>
          el('div', { class: 'hb-card', style: { padding: '14px 16px', opacity: b.rows.length ? '1' : '.6' } }, [
            el('div', { class: 'hb-filter-label' }, b.label),
            el('div', { style: { fontSize: '20px', fontWeight: '700', marginTop: '2px', color: b.rows.length ? (b.key === 'current' ? 'var(--ink)' : 'var(--red)') : 'var(--ink-3)' } },
              U.money(b.total, { currency: true })),
            el('div', { class: 'hb-sub', style: { marginTop: '2px' } }, b.rows.length ? b.rows.length + ' invoice' + (b.rows.length === 1 ? '' : 's') : S.statement.bucketEmpty),
          ]))),

      U.card({
        title: S.statement.title,
        note: S.statement.note + ' ' + S.fill(S.statement.asAt, { date: st.today }),
        actions: [U.pill(S.statement.totalOpen + ' ' + U.moneyText(st.total, { currency: true }), st.total > 0 ? 'orange' : 'green')],
        flush: st.open.length > 0,
        body: st.open.length === 0
          ? U.empty(S.statement.empty, S.statement.emptyNote)
          : U.table({
            columns: [
              { label: S.statement.colInvoice, cell: (i) => el('a', { href: U.href('/invoices/' + i.number) }, i.number) },
              { label: S.invoices.colSupplier, cell: (i) => i.supplier.name },
              { label: S.statement.colDue, cell: (i) => i.dueDate },
              { label: S.statement.colAge, cell: (i) => age(i) },
              { label: S.invoices.colStatus, cell: (i) => statusPill(i) },
              { label: S.statement.colAmount, num: true, cell: (i) => U.money(i.amountOutstanding, { currency: true }) },
            ],
            rows: st.open,
            rowKey: (i) => i.number,
            rowLabel: (i) => 'Open ' + i.number,
            onRowClick: (i) => { location.hash = '/invoices/' + i.number },
          }),
      }),
    ])
  }

  // ── Credit account ───────────────────────────────────────────────────────
  function credit() {
    const m = U.modes()
    const c = HB.creditAccount(BUYER_ID, m)
    const invs = HB.invoices(BUYER_ID, m).filter((i) => c.openInvoices.indexOf(i.number) >= 0)

    return U.frag([
      U.note('Four policies, escalating',
        'The screen has to answer "what happens if I go over", and the honest answer depends entirely on which policy is set — so the behaviour is derived from the account rather than written into the copy.'),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' } }, [
        tile(S.credit.limit, c.limit, null),
        tile(S.credit.exposure, c.exposure, c.overLimit ? 'bad' : 'warn'),
        tile(S.credit.available, c.available, c.available > 0 ? 'good' : 'bad'),
      ]),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '18px', alignItems: 'start' } }, [
        U.card({
          title: S.credit.title, note: S.credit.note,
          body: [
            U.ratio({
              label: S.fill(S.credit.utilisation, { pct: HB.pct(c.utilisation, 1) }),
              value: c.utilisation, threshold: 1, dir: 'above',
              display: HB.pct(c.utilisation, 1),
              foot: U.moneyText(c.exposure, { currency: true }) + ' of ' + U.moneyText(c.limit, { currency: true }),
              thresholdLabel: 'limit',
            }),
            el('p', { class: 'hb-sub', style: { marginTop: '14px' } },
              c.available > 0 ? S.fill(S.credit.headroom, { amount: U.moneyText(c.available, { currency: true }) }) : S.credit.noHeadroom),
            c.overLimit ? el('div', { style: { marginTop: '12px' } }, U.banner('bad', S.credit.overLimit, c.atLimit)) : null,
          ],
        }),
        U.card({
          title: S.credit.policyTitle,
          actions: [U.pill(S.credit.policies[c.policy], c.policy === 'enforce_hold' ? 'red' : c.policy === 'require_approval' ? 'orange' : 'navy')],
          body: [
            el('p', { class: 'hb-sub', style: { marginTop: 0 } }, S.fill(S.credit.policyNote, { policy: S.credit.policies[c.policy] })),
            U.banner(c.policy === 'enforce_hold' ? 'warn' : 'info', null, c.atLimit),
            el('div', { style: { marginTop: '16px' } }, [
              el('h3', { class: 'hb-h3' }, S.credit.openInvoices),
              invs.length === 0
                ? el('p', { class: 'hb-sub', style: { margin: 0 } }, S.statement.empty)
                : el('ul', { class: 'hb-sub', style: { margin: 0, paddingInlineStart: '18px' } },
                  invs.map((i) => el('li', {}, [
                    el('a', { href: U.href('/invoices/' + i.number) }, i.number), ' · ',
                    U.money(i.amountOutstanding, { currency: true }),
                    i.amountPaid > 0 ? ' outstanding of ' : ' · due ',
                    i.amountPaid > 0 ? U.moneyText(i.totalPayable, { currency: true }) + ' · due ' + i.dueDate : i.dueDate,
                  ]))),
            ]),
          ],
        }),
      ]),
    ])
  }

  function tile(label, value, tone) {
    return el('div', { class: 'hb-card', style: { padding: '14px 16px' } }, [
      el('div', { class: 'hb-filter-label' }, label),
      el('div', {
        style: { fontSize: '24px', fontWeight: '700', letterSpacing: '-.02em', marginTop: '2px',
          color: tone === 'bad' ? 'var(--red)' : tone === 'good' ? 'var(--green)' : tone === 'warn' ? 'var(--orange-t)' : 'var(--ink)' },
      }, U.money(value, { currency: true })),
    ])
  }

  // ── Price match ──────────────────────────────────────────────────────────
  /*
   * The copy here is the design. A price match is a request, not a discount, and the
   * buyer has to know that before they act on it — so the conditional sits above the form
   * rather than in small print beneath the submit button.
   */
  function priceMatch() {
    const rows = HB.priceMatches(BUYER_ID)
    const orders = HB.buyerView(BUYER_ID).orders.filter((o) => o.kind !== 'return')

    const stateTone = { credit_issued: 'green', accepted: 'green', declined: 'red', under_review: 'orange', submitted: 'blue' }

    return U.frag([
      U.note('Conditional, and said so',
        'The discount is not the buyer’s until the supplier accepts. Copy that promises a saving and then withdraws it costs more trust than the saving was worth.'),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(0,.9fr) minmax(0,1.1fr)', gap: '18px', alignItems: 'start' } }, [
        U.card({
          title: S.priceMatch.formTitle, note: S.priceMatch.note,
          body: [
            U.banner('warn', S.priceMatch.conditional, S.priceMatch.conditionalNote),
            el('div', { style: { marginTop: '18px', display: 'grid', gap: '14px' } }, [
              field(S.priceMatch.order, el('select', { class: 'hb-input' },
                orders.map((o) => el('option', { value: o.id }, o.id + ' · ' + o.sellerName + ' · ' + HB.money(o.amountDue, { currency: true }))))),
              field(S.priceMatch.claimed, el('input', { class: 'hb-input', inputmode: 'decimal', placeholder: '0.000' })),
              field(S.priceMatch.evidence, el('label', { class: 'hb-drop' }, [
                el('span', { class: 'hb-drop-cta' }, S.priceMatch.upload),
                el('span', { class: 'hb-sub', style: { margin: 0 } }, S.priceMatch.uploadHint),
                el('input', { type: 'file', accept: '.pdf,image/*', style: { display: 'none' } }),
              ]), S.priceMatch.evidenceNote),
            ]),
          ],
          foot: el('button', { class: 'hb-btn hb-btn--primary' }, S.priceMatch.submit),
        }),

        el('div', { class: 'hb-stack' }, [
          U.card({
            title: S.priceMatch.requests, flush: rows.length > 0,
            body: rows.length === 0
              ? U.empty(S.priceMatch.empty, S.priceMatch.emptyNote)
              : U.table({
                compact: true,
                columns: [
                  { label: S.priceMatch.colId, cell: (r) => el('strong', {}, r.id) },
                  { label: S.priceMatch.colOrder, cell: (r) => r.orderId },
                  { label: S.priceMatch.colDate, cell: (r) => r.date },
                  { label: S.priceMatch.colClaimed, num: true, cell: (r) => U.money(r.claimedPrice, { currency: true }) },
                  { label: S.priceMatch.colState, cell: (r) => U.pill(S.priceMatch[r.state], stateTone[r.state]) },
                ],
                rows,
                rowKey: (r) => r.id,
                rowLabel: (r) => 'Open ' + r.id,
                onRowClick: (r) => openRequest(r),
              }),
          }),
          U.card({
            title: S.priceMatch.trackTitle,
            body: el('div', { class: 'hb-life' }, HB.PRICE_MATCH_STATES.map((st, i) =>
              el('div', { class: 'hb-stage hb-stage--' + (st === 'declined' ? 'bad' : st === 'credit_issued' ? 'done' : 'skip') }, [
                el('div', { class: 'hb-stage-rail' }, [
                  el('div', { class: 'hb-stage-dot', 'aria-hidden': 'true' }, st === 'declined' ? '✕' : st === 'credit_issued' ? '✓' : String(i + 1)),
                  el('div', { class: 'hb-stage-line' }),
                ]),
                el('div', { class: 'hb-stage-body' }, [
                  el('div', { class: 'hb-stage-title' }, S.priceMatch[st]),
                  el('div', { class: 'hb-stage-note' }, {
                    submitted: 'Your evidence reaches Highbase.',
                    under_review: 'Highbase checks the evidence and puts it to the supplier.',
                    accepted: 'The supplier agrees to the price.',
                    declined: 'The supplier does not agree. Your original price stands and your order is unchanged.',
                    credit_issued: 'Highbase funds the difference and credits it to your order.',
                  }[st]),
                ]),
              ]))),
          }),
        ]),
      ]),
    ])
  }

  const field = (label, control, note) =>
    el('label', { class: 'hb-field' }, [
      el('span', { class: 'hb-filter-label' }, label),
      control,
      note ? el('span', { class: 'hb-sub', style: { margin: '2px 0 0' } }, note) : null,
    ])

  function openRequest(r) {
    U.drawer({
      title: r.id,
      subtitle: S.priceMatch[r.state] + ' · ' + r.orderId,
      body: [
        r.state === 'declined' ? U.banner('bad', S.priceMatch.declinedReason, r.declineReason) : null,
        r.state === 'credit_issued'
          ? U.banner('good', null, S.fill(S.priceMatch.creditIssued, { amount: U.moneyText(r.creditAmount, { currency: true }) }))
          : null,
        el('dl', { class: 'hb-kv', style: { marginTop: '14px' } }, [
          el('dt', {}, S.priceMatch.colOrder), el('dd', {}, r.orderId),
          el('dt', {}, S.priceMatch.colDate), el('dd', {}, r.date),
          el('dt', {}, S.priceMatch.colClaimed), el('dd', {}, U.money(r.claimedPrice, { currency: true })),
          el('dt', {}, S.priceMatch.evidence), el('dd', {}, r.evidence || '—'),
        ]),
        r.exampleData ? el('p', { class: 'hb-sub', style: { marginTop: '14px' } }, S.common.exampleData) : null,
        el('div', { style: { marginTop: '18px' } },
          el('button', { class: 'hb-btn hb-btn--outline', onclick: () => { U.closeDrawer(); openOrder(r.orderId) } }, 'Open ' + r.orderId + ' →')),
      ],
    })
  }

  // ── Routing ──────────────────────────────────────────────────────────────
  const routes = {
    '/checkout': { title: S.checkout.title, nav: '/checkout', view: checkout },
    '/invoices': { title: S.invoices.title, nav: '/invoices', view: invoicesList },
    '/invoices/:number': { title: S.invoices.title, nav: '/invoices', view: (p) => invoiceDetail(p.number), titleOf: (p) => S.fill(S.invoices.detailTitle, { number: p.number }) },
    '/statement': { title: S.statement.title, nav: '/statement', view: statement },
    '/credit': { title: S.credit.title, nav: '/credit', view: credit },
    '/price-match': { title: S.priceMatch.title, nav: '/price-match', view: priceMatch },
  }

  let current = { pattern: '/invoices', params: {} }

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
    shell.setTitle(r.titleOf ? r.titleOf(current.params) : r.title,
      HB.buyer(BUYER_ID).name + ' · as at ' + U.modes().today)
    shell.setActive(r.nav)
    try {
      shell.content.appendChild(el('div', { class: 'hb-stack' }, [r.view(current.params)]))
    } catch (err) {
      shell.content.appendChild(U.errorState())
      if (typeof console !== 'undefined') console.error(err)
    }
  }

  U.router(routes, {
    fallback: '/invoices',
    render: (pattern, params) => { current = { pattern: pattern, params: params }; render() },
  }).go()

  // Invariant 2 gets its DOM half here: the test scans the rendered buyer page.
  if (window.HBTest) window.HBTest.run()
})(window.HB, window.HBStrings, window.HBUI)
