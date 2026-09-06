/**
 * Highbase Billing Module — the ledger, and everything derived from it.
 *
 * This file is the prototype. The three surfaces are windows onto it: nothing any screen
 * shows is stored, and no total anywhere is written down. If the seller's wallet and the
 * admin's exposure report disagree about a number, it is because they called different
 * functions here — not because two screens were maintained by hand.
 *
 * Loaded as a classic script rather than an ES module, deliberately. The brief asks for
 * both "ES modules loaded directly" and "opened directly from the filesystem", and those
 * two cannot both be true: every browser refuses `<script type="module">` over `file://`
 * because a file origin is opaque to CORS, so a module build only opens through a server.
 * A prototype that has to be served is a prototype nobody double-clicks. So: one global,
 * `HB`, and a shim that also exports to Node so the acceptance tests can run headless.
 */
;(function (root, factory) {
  const api = factory()
  root.HB = Object.assign(root.HB || {}, api)
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict'

  // ── Money ────────────────────────────────────────────────────────────────
  /*
   * Every amount here is an integer number of fils. 1 BHD = 1000 fils, and BHD is a
   * three-decimal currency, so fils are exactly the display precision — nothing is rounded
   * between what is stored and what is shown.
   *
   * Nothing is a float. 0.1 + 0.2 problems in a ledger do not surface as a wrong pixel;
   * they surface as a reconciliation off by a millifil and an accountant who stops
   * trusting the report.
   */
  const FILS = 1000
  const bhd = (n) => Math.round(n * FILS)

  /**
   * Round half away from zero, to whole fils.
   *
   * Away from zero rather than toward positive infinity: a commission of 4.4995 and a
   * credit of −4.4995 should be the same size, and half-up-toward-infinity makes the
   * credit smaller than the charge it reverses.
   */
  const round3 = (x) => (x < 0 ? -Math.round(-x) : Math.round(x))

  /** The one money formatter. Three decimals, always. */
  function money(fils, opts) {
    const o = opts || {}
    const abs = Math.abs(fils)
    const whole = String(Math.floor(abs / FILS)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const frac = String(abs % FILS).padStart(3, '0')
    const sign = fils < 0 ? '−' : o.signed ? '+' : ''
    return sign + whole + '.' + frac + (o.currency ? ' BHD' : '')
  }

  function pct(numerator, denominator, dp) {
    if (!denominator) return (0).toFixed(dp === undefined ? 1 : dp) + '%'
    const d = dp === undefined ? 1 : dp
    const p = Math.pow(10, d)
    return (Math.round((numerator / denominator) * 100 * p) / p).toFixed(d) + '%'
  }

  const sum = (xs) => xs.reduce((a, b) => a + b, 0)

  // ── Postings ─────────────────────────────────────────────────────────────
  /*
   * Six kinds of movement, one sign convention that holds everywhere:
   *
   *     POSITIVE MEANS HIGHBASE OWES THE SELLER.
   *
   * Every sign error this prototype exists to expose is a violation of that one line.
   */
  const POSTING = {
    P1: { code: 'P1', label: 'Cash collected by Highbase', sign: '+' },
    P2: { code: 'P2', label: 'Highbase-funded discount', sign: '+' },
    P3: { code: 'P3', label: 'Commission', sign: '−' },
    P4: { code: 'P4', label: 'Fixed fee / subscription', sign: '−' },
    P5: { code: 'P5', label: 'Payout to seller', sign: '−' },
    P6: { code: 'P6', label: 'Return reversal', sign: '±' },
  }

  /** The four answers to "where is the money?". Colour and label live in ui/strings. */
  const STATES = ['payable', 'held', 'dues', 'awaiting']

  /*
   * Two unresolved product questions, both modelled as modes rather than decided quietly.
   *
   *   filing   — as_filed reproduces the RET-1007 sign error that is in the book today.
   *   risk     — agent: Highbase does not guarantee, the seller waits for the buyer.
   *              guarantor: Highbase pays at delivery and carries the buyer's credit risk.
   *
   * The risk mode is not a display option. It changes which postings exist, which orders
   * enter a settlement run, and who is exposed — the same seed data producing two
   * different products, which is exactly what a reviewer needs to see before choosing one.
   */
  const FILINGS = ['as_filed', 'corrected']
  const RISK_MODES = ['agent', 'guarantor']

  const DEFAULTS = { filing: 'corrected', risk: 'agent' }
  const opt = (o) => ({ filing: (o && o.filing) || DEFAULTS.filing, risk: (o && o.risk) || DEFAULTS.risk })

  // ── Rate cards ───────────────────────────────────────────────────────────
  /*
   * Versioned, because "3% today" is not an answer to "why was this order charged 15.000
   * in June". Two of these are in open conflict, seeded on purpose: the ledger prices
   * every order at flat 3%, while the product's own Subscription Settings screen
   * advertises 10% on a seller's first order and 0% after. Both are live claims about the
   * same contract, and the prototype refuses to pick one.
   */
  const RATE_CARDS = [
    {
      id: 'rc-v1', version: 'v1', label: 'Flat 3%', model: 'flat', rate: 0.03,
      effectiveFrom: '2025-01-01', status: 'applied', stale: false,
      source: 'Ledger — the terms every posting in this book was priced with',
    },
    {
      id: 'rc-sub', version: 'v2 (draft)', label: '10% first order, 0% thereafter',
      model: 'first_order_then_zero', rate: 0.10, subsequentRate: 0,
      effectiveFrom: '2025-11-01', status: 'advertised', stale: true,
      source: 'Product — Subscription Settings, shown to sellers at signup',
    },
  ]
  const rateCard = (id) => RATE_CARDS.find((r) => r.id === id)

  // ── Standing thresholds ──────────────────────────────────────────────────
  const ARREARS_CEILING = bhd(150)
  const STANDING_RULES = {
    suspended: { arrearsRatio: 1.00 },
    late: { arrearsRatio: 0.80 },
    watch: { onlineShare: 0.30, discountRatio: 1.00, arrearsRatio: 0.50 },
  }

  // ── Sellers ──────────────────────────────────────────────────────────────
  const SELLERS = [
    { id: '1042', name: 'Gulf Metal Supplies', rateCardId: 'rc-v1', arrearsCeiling: ARREARS_CEILING,
      cycle: { id: '1042-jan', label: '8–18 Jan 2026', from: '2026-01-08', to: '2026-01-18' }, nextPayoutDate: '2026-01-19' },
    { id: '1067', name: 'Manama Packaging Co.', rateCardId: 'rc-v1', arrearsCeiling: ARREARS_CEILING,
      cycle: { id: '1067-jan', label: '8–18 Jan 2026', from: '2026-01-08', to: '2026-01-18' }, nextPayoutDate: '2026-01-19' },
    { id: '1088', name: 'Sitra Industrial Tools', rateCardId: 'rc-v1', arrearsCeiling: ARREARS_CEILING,
      cycle: { id: '1088-jan', label: '8–22 Jan 2026', from: '2026-01-08', to: '2026-01-22' }, nextPayoutDate: '2026-01-23' },
    { id: '1103', name: 'Riffa Building Materials', rateCardId: 'rc-v1', arrearsCeiling: ARREARS_CEILING,
      cycle: { id: '1103-jan', label: '8–18 Jan 2026', from: '2026-01-08', to: '2026-01-18' }, nextPayoutDate: '2026-01-19' },
  ]
  const seller = (id) => SELLERS.find((s) => s.id === id)

  /** Fictional, and deliberately obvious as examples. Buyer↔order assignment is example data. */
  const BUYERS = [
    { id: 'B-201', name: 'Awali Contracting W.L.L.', vatNumber: '220000123400002', creditLimit: bhd(500), policy: 'warn_only',
      address: 'Building 214, Road 1502, Awali 951, Kingdom of Bahrain' },
    { id: 'B-202', name: 'Budaiya Trading Est.', vatNumber: '220000556600002', creditLimit: bhd(250), policy: 'require_approval',
      address: 'Shop 7, Budaiya Highway, Budaiya 540, Kingdom of Bahrain' },
    { id: 'B-203', name: 'Hidd Marine Services', vatNumber: '220000778800002', creditLimit: bhd(1000), policy: 'enforce_hold',
      address: 'Unit 3, Hidd Industrial Area, Hidd 115, Kingdom of Bahrain' },
  ]
  const buyer = (id) => BUYERS.find((b) => b.id === id)

  // ── Orders — the source documents ────────────────────────────────────────
  /*
   * Orders are kept separate from postings, and that separation is what makes the
   * reconciliation control possible at all. An order record says what happened in the
   * world; a posting says what was written in the book about it. The planted bug is a
   * posting that disagrees with its order — and a control reading only postings could
   * never see it, because the postings are internally consistent. They are just consistent
   * about the wrong event.
   *
   * `paymentRoute` is a stored field, never inferred from which column has a number in it.
   * It is the heaviest decision in the module and today it is not recorded as a billing
   * fact at all — so here it is recorded first and everything downstream reads it.
   */
  const O = (o) => Object.assign({
    kind: 'order', terms: 'immediate', dueDate: null, deliveryConfirmedAt: null,
    discount: { amount: 0, funder: null, reason: null }, rateCardVersion: 'v1',
  }, o)

  const ORDERS = [
    // ── #1042 — the reconciliation case ──
    O({ id: 'ORD-1001', sellerId: '1042', buyerId: 'B-201', date: '2026-01-08', grossValue: bhd(50), paymentRoute: 'highbase', deliveryConfirmedAt: '2026-01-09' }),
    O({ id: 'ORD-1002', sellerId: '1042', buyerId: 'B-202', date: '2026-01-09', grossValue: bhd(100), paymentRoute: 'seller', deliveryConfirmedAt: '2026-01-10' }),
    O({ id: 'ORD-1003', sellerId: '1042', buyerId: 'B-201', date: '2026-01-10', grossValue: bhd(75), paymentRoute: 'highbase', deliveryConfirmedAt: '2026-01-11' }),
    O({ id: 'ORD-1004', sellerId: '1042', buyerId: 'B-203', date: '2026-01-11', grossValue: bhd(40), paymentRoute: 'seller', deliveryConfirmedAt: '2026-01-12' }),
    O({ id: 'ORD-1005', sellerId: '1042', buyerId: 'B-202', date: '2026-01-12', grossValue: bhd(25), paymentRoute: 'seller', deliveryConfirmedAt: '2026-01-13' }),
    O({ id: 'ORD-1006', sellerId: '1042', buyerId: 'B-203', date: '2026-01-15', grossValue: bhd(500), paymentRoute: 'seller', deliveryConfirmedAt: '2026-01-16' }),
    O({ id: 'ORD-1007', sellerId: '1042', buyerId: 'B-201', date: '2026-01-15', grossValue: bhd(400), paymentRoute: 'highbase', deliveryConfirmedAt: '2026-01-16' }),
    O({ id: 'RET-1007', sellerId: '1042', buyerId: 'B-201', date: '2026-01-17', grossValue: bhd(-150), paymentRoute: 'highbase',
      kind: 'return', reverses: 'ORD-1007', deliveryConfirmedAt: '2026-01-17',
      note: 'Partial return against ORD-1007. Reverses value and commission together.' }),

    // ── #1067 — funded discount and the payout cap ──
    O({ id: 'ORD-2001', sellerId: '1067', buyerId: 'B-201', date: '2026-01-12', grossValue: bhd(90), paymentRoute: 'highbase', deliveryConfirmedAt: '2026-01-13',
      discount: { amount: bhd(9), funder: 'highbase', reason: '10% price match, funded by Highbase' } }),
    O({ id: 'ORD-2002', sellerId: '1067', buyerId: 'B-202', date: '2026-01-14', grossValue: bhd(200), paymentRoute: 'seller', deliveryConfirmedAt: '2026-01-15' }),

    // ── #1088 — credit orders, the fourth state ──
    O({ id: 'ORD-3001', sellerId: '1088', buyerId: 'B-203', date: '2026-01-14', grossValue: bhd(300), paymentRoute: 'highbase',
      terms: 'credit', dueDate: '2026-02-19', deliveryConfirmedAt: '2026-01-20' }),
    O({ id: 'ORD-3002', sellerId: '1088', buyerId: 'B-202', date: '2026-01-16', grossValue: bhd(120), paymentRoute: 'seller', deliveryConfirmedAt: '2026-01-17' }),
    O({ id: 'ORD-3003', sellerId: '1088', buyerId: 'B-201', date: '2026-01-18', grossValue: bhd(60), paymentRoute: 'highbase', deliveryConfirmedAt: '2026-01-19' }),

    // ── #1103 — the structural failure case ──
    O({ id: 'ORD-4001', sellerId: '1103', buyerId: 'B-203', date: '2026-01-09', grossValue: bhd(2000), paymentRoute: 'seller', deliveryConfirmedAt: '2026-01-10' }),
    O({ id: 'ORD-4002', sellerId: '1103', buyerId: 'B-203', date: '2026-01-12', grossValue: bhd(1800), paymentRoute: 'seller', deliveryConfirmedAt: '2026-01-13' }),
    O({ id: 'ORD-4003', sellerId: '1103', buyerId: 'B-202', date: '2026-01-16', grossValue: bhd(1500), paymentRoute: 'seller', deliveryConfirmedAt: '2026-01-17' }),
  ]

  const ordersFor = (sellerId) => ORDERS.filter((o) => o.sellerId === sellerId)
  const ordersForBuyer = (buyerId) => ORDERS.filter((o) => o.buyerId === buyerId)
  const order = (id) => ORDERS.find((o) => o.id === id)

  const PAYOUTS = [
    { id: 'PAY-1042-1', sellerId: '1042', date: '2026-01-09', amount: bhd(45.5), runId: 'run-1042-a' },
    { id: 'PAY-1042-2', sellerId: '1042', date: '2026-01-11', amount: bhd(70), runId: 'run-1042-b' },
    { id: 'PAY-1042-3', sellerId: '1042', date: '2026-01-13', amount: bhd(0.8), runId: 'run-1042-c' },
  ]

  // ── Derivation rules ─────────────────────────────────────────────────────

  /**
   * INVARIANT 1. A Highbase-funded discount does not reduce the commission base.
   *
   * The seller shipped 90.000 of goods and was made whole for 90.000; charging commission
   * on 81.000 would have Highbase discount its own revenue to pay for its own marketing
   * twice. A seller-funded discount is a real price reduction and the base follows it down.
   */
  function commissionBase(o) {
    return o.discount && o.discount.funder === 'highbase' ? o.grossValue : o.grossValue - (o.discount ? o.discount.amount : 0)
  }

  const commissionOn = (o, card) => round3(commissionBase(o) * card.rate)
  const buyerPays = (o) => o.grossValue - (o.discount ? o.discount.amount : 0)

  /** Has anyone collected this order's cash yet? Credit orders: not until the buyer pays. */
  const isCollected = (o, k) =>
    o.terms !== 'credit' ? true : k.risk === 'guarantor' && !!o.deliveryConfirmedAt

  /**
   * Commission accrues on collection, not on delivery. A credit order that nobody has
   * been paid for yet has earned Highbase nothing to net against — which is precisely
   * what makes `awaiting` its own state rather than a flavour of payable.
   */
  const commissionAccrues = (o, k) => isCollected(o, k)

  // ── Filing — turning orders into postings ────────────────────────────────
  /*
   * Two filings of one book. `corrected` is what the rules above produce. `as_filed` is
   * what is in the ledger today: RET-1007 keyed as a positive receivable with commission
   * charged rather than credited — a return booked as a sale.
   *
   * The bug lives here and nowhere else, so flipping the toggle moves every number on
   * every surface at once. That is the honest way to show what one mis-keyed row costs.
   */
  function postingsFor(sellerId, o_) {
    const k = opt(o_)
    const s = seller(sellerId)
    const card = rateCard(s.rateCardId)
    const out = []
    let seq = 0
    const push = (p) => out.push(Object.assign({ seq: ++seq, sellerId, rateCardVersion: card.version }, p))

    for (const ord of ordersFor(sellerId)) {
      const misfiled = k.filing === 'as_filed' && ord.kind === 'return'
      const flip = misfiled ? -1 : 1

      // Cash leg. Only exists once someone has actually collected — which for a credit
      // order in agent mode is never, and in guarantor mode is at delivery, because
      // Highbase fronts the money and takes the buyer's risk onto its own book.
      if (ord.paymentRoute === 'highbase' && isCollected(ord, k)) {
        push({
          type: ord.kind === 'return' ? 'P6' : 'P1',
          orderId: ord.id, date: ord.date, leg: 'cash',
          amount: flip * buyerPays(ord),
          held: !ord.deliveryConfirmedAt,
          heldReason: ord.deliveryConfirmedAt ? null : 'Delivery not confirmed',
          guaranteed: ord.terms === 'credit',
          label: ord.kind === 'return' ? 'Return reversal — cash' : (ord.terms === 'credit' ? 'Guaranteed at delivery' : POSTING.P1.label),
        })
      }

      if (ord.discount && ord.discount.amount > 0 && ord.discount.funder === 'highbase') {
        push({ type: 'P2', orderId: ord.id, date: ord.date, leg: 'accrual', amount: ord.discount.amount, label: POSTING.P2.label })
      }

      if (commissionAccrues(ord, k)) {
        const comm = commissionOn(ord, card)
        push({
          type: ord.kind === 'return' ? 'P6' : 'P3',
          orderId: ord.id, date: ord.date, leg: 'accrual',
          amount: -(flip * comm), commissionCharge: flip * comm,
          label: ord.kind === 'return' ? 'Return reversal — commission' : POSTING.P3.label,
        })
      }
    }

    for (const p of PAYOUTS.filter((x) => x.sellerId === sellerId)) {
      push({ type: 'P5', orderId: null, date: p.date, leg: 'cash', amount: -p.amount, payoutId: p.id, runId: p.runId, label: POSTING.P5.label })
    }

    return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.seq - b.seq))
  }

  // ── The balance, in four states ──────────────────────────────────────────
  /**
   * One question — where is the money? — with four possible answers.
   *
   * A single balance answers "what does the book say" and hides "can we actually pay it",
   * "may we release it", and "has anyone even been paid". Four states answer all four.
   */
  function balance(sellerId, o_) {
    const k = opt(o_)
    const s = seller(sellerId)
    const card = rateCard(s.rateCardId)
    const ps = postingsFor(sellerId, k)
    const cash = ps.filter((p) => p.leg === 'cash')
    const accruals = ps.filter((p) => p.leg === 'accrual')

    const held = sum(cash.filter((p) => p.held).map((p) => p.amount))
    const cashBacked = sum(cash.map((p) => p.amount))
    const releasable = cashBacked - held
    const accrued = sum(accruals.map((p) => p.amount))

    /*
     * INVARIANT 3 / THE PAYOUT RULE. Never release more than the cash actually held, net
     * the negative accruals first, and never push a seller below zero.
     *
     * `Math.min(accrued, 0)` is the load-bearing half: a positive accrual — a discount
     * Highbase owes but has put no cash behind — must not increase what can be released.
     * Seller #1067 is the worked example and the 0.300 gap it leaves is why the rule is
     * written this way rather than as a bare subtraction.
     */
    const payable = Math.max(releasable + Math.min(accrued, 0), 0)

    const bookOwed = cashBacked + accrued
    const unfunded = Math.max(bookOwed - payable - held, 0)

    // Dues: commission on orders where the seller took the cash. Highbase has none of
    // this seller's money to net it against, so it is recovered later or invoiced.
    const dues = sum(
      accruals
        .filter((p) => p.commissionCharge > 0 && order(p.orderId) && order(p.orderId).paymentRoute === 'seller')
        .map((p) => p.commissionCharge),
    )

    // Awaiting: delivered, invoiced, and collected from nobody. Shown gross and net,
    // because the commission on it has not accrued and the seller should not read the
    // gross as money coming to them.
    const awaitingOrders = ordersFor(sellerId).filter((o) => o.terms === 'credit' && o.deliveryConfirmedAt && !isCollected(o, k))
    const awaitingGross = sum(awaitingOrders.map((o) => o.grossValue))
    const awaitingNet = awaitingGross - round3(awaitingGross * card.rate)

    return {
      sellerId, filing: k.filing, risk: k.risk,
      payable, held, dues, awaitingGross, awaitingNet,
      awaitingOrders: awaitingOrders.map((o) => o.id),
      cashBacked, releasable, accrued, bookOwed, unfunded,
      /** The single flat figure today's statement shows, kept so the two can be compared. */
      statedBalance: bookOwed,
      collected: sum(cash.filter((p) => p.type !== 'P5').map((p) => p.amount)),
      paidOut: -sum(cash.filter((p) => p.type === 'P5').map((p) => p.amount)),
      commissionKept: -sum(accruals.filter((p) => p.commissionCharge !== undefined).map((p) => p.amount)),
      postings: ps,
    }
  }

  /** Who collected — the fact that decides everything downstream. */
  function collectionMix(sellerId, o_) {
    const k = opt(o_)
    const os = ordersFor(sellerId)
    const net = sum(os.map((o) => o.grossValue))
    /*
     * "Online" means cash that actually reached Highbase: a Highbase-route order on credit
     * terms has not, so it does not count toward the share. Routing an order through the
     * platform and then not collecting on it leaves Highbase exactly as exposed as a
     * direct sale would have.
     */
    const online = sum(os.filter((o) => o.paymentRoute === 'highbase' && o.terms !== 'credit').map((o) => o.grossValue))
    const direct = net - online
    return {
      gross: sum(os.filter((o) => o.kind === 'order').map((o) => o.grossValue)),
      returned: sum(os.filter((o) => o.kind === 'return').map((o) => o.grossValue)),
      net, online, direct,
      onlineShare: net ? online / net : 0,
      directShare: net ? direct / net : 0,
    }
  }

  // ── Seller standing ──────────────────────────────────────────────────────
  /**
   * A status, not an amount — and derived, so a seller can be shown exactly what moves
   * them between grades rather than being told a number they cannot act on.
   *
   * `triggers` is the part the screen needs: a grade with no named cause is a credit
   * score, and a credit score is something a seller argues with rather than fixes.
   */
  function standing(sellerId, o_) {
    const k = opt(o_)
    const s = seller(sellerId)
    const b = balance(sellerId, k)
    const mix = collectionMix(sellerId, k)
    const disc = fundedDiscountRatio(sellerId, k)

    const arrearsRatio = s.arrearsCeiling ? b.dues / s.arrearsCeiling : 0
    const onlineShare = mix.onlineShare
    const discountRatio = disc.ratio

    const triggers = []
    let grade
    if (arrearsRatio >= STANDING_RULES.suspended.arrearsRatio) {
      grade = 'suspended'
      triggers.push({ input: 'arrearsRatio', value: arrearsRatio, threshold: STANDING_RULES.suspended.arrearsRatio, dir: 'above' })
    } else if (arrearsRatio >= STANDING_RULES.late.arrearsRatio) {
      grade = 'late'
      triggers.push({ input: 'arrearsRatio', value: arrearsRatio, threshold: STANDING_RULES.late.arrearsRatio, dir: 'above' })
    } else {
      if (onlineShare < STANDING_RULES.watch.onlineShare) triggers.push({ input: 'onlineShare', value: onlineShare, threshold: STANDING_RULES.watch.onlineShare, dir: 'below' })
      if (discountRatio >= STANDING_RULES.watch.discountRatio) triggers.push({ input: 'discountRatio', value: discountRatio, threshold: STANDING_RULES.watch.discountRatio, dir: 'above' })
      if (arrearsRatio >= STANDING_RULES.watch.arrearsRatio) triggers.push({ input: 'arrearsRatio', value: arrearsRatio, threshold: STANDING_RULES.watch.arrearsRatio, dir: 'above' })
      grade = triggers.length ? 'watch' : 'good'
    }

    return {
      sellerId, grade, triggers,
      inputs: {
        arrearsRatio: { value: arrearsRatio, numerator: b.dues, denominator: s.arrearsCeiling },
        onlineShare: { value: onlineShare, numerator: mix.online, denominator: mix.net },
        discountRatio: { value: discountRatio, numerator: disc.funded, denominator: disc.earned },
      },
      /** What would move this seller up, in the seller's own terms. */
      toImprove: nextGradeAdvice(grade, { arrearsRatio, onlineShare, discountRatio }, s, mix),
    }
  }

  function nextGradeAdvice(grade, r, s, mix) {
    const out = []
    if (r.arrearsRatio >= STANDING_RULES.watch.arrearsRatio) {
      const target = STANDING_RULES.watch.arrearsRatio * s.arrearsCeiling
      out.push({ input: 'arrearsRatio', action: 'settle', amount: Math.max(0, round3(r.arrearsRatio * s.arrearsCeiling - target)) })
    }
    if (r.onlineShare < STANDING_RULES.watch.onlineShare) {
      // How much more GMV must route through Highbase to clear the threshold, holding the
      // rest of the book still: (online + x) / (net + x) = threshold.
      const t = STANDING_RULES.watch.onlineShare
      const x = (t * mix.net - mix.online) / (1 - t)
      out.push({ input: 'onlineShare', action: 'route', amount: Math.max(0, round3(x)) })
    }
    if (r.discountRatio >= STANDING_RULES.watch.discountRatio) {
      out.push({ input: 'discountRatio', action: 'reduce', ratio: r.discountRatio })
    }
    return out
  }

  // ── Reconciliation control ───────────────────────────────────────────────
  /**
   * One query over the book: does the commission charged equal the rate times the order
   * value it was charged on?
   *
   * Checked per order and in total. The total says the book is wrong; the per-order rows
   * say which row to open — the difference between a control that starts an investigation
   * and one that starts an argument.
   *
   * Orders whose commission has not accrued yet are out of scope on both sides. A credit
   * order awaiting collection is a timing fact, not a discrepancy, and a control that
   * cannot tell those apart cries wolf every cycle until nobody reads it.
   */
  function reconcile(sellerId, o_) {
    const k = opt(o_)
    const s = seller(sellerId)
    const card = rateCard(s.rateCardId)
    const ps = postingsFor(sellerId, k)
    const inScope = ordersFor(sellerId).filter((o) => commissionAccrues(o, k))

    const rows = inScope.map((o) => {
      const expected = commissionOn(o, card)
      const actual = sum(ps.filter((p) => p.orderId === o.id && p.commissionCharge !== undefined).map((p) => p.commissionCharge))
      return { orderId: o.id, orderValue: o.grossValue, expected, actual, delta: actual - expected, ok: actual === expected }
    })

    const expectedTotal = round3(sum(inScope.map(commissionBase)) * card.rate)
    const actualTotal = sum(rows.map((r) => r.actual))

    return {
      sellerId, filing: k.filing, risk: k.risk, rate: card.rate,
      orderValueTotal: sum(inScope.map((o) => o.grossValue)),
      expectedTotal, actualTotal, delta: actualTotal - expectedTotal,
      passes: actualTotal === expectedTotal,
      rows, offenders: rows.filter((r) => !r.ok),
    }
  }

  /** Every seller at once — the admin's proof screen reads this. */
  function reconcileAll(o_) {
    const each = SELLERS.map((s) => reconcile(s.id, o_))
    return {
      each,
      passes: each.every((r) => r.passes),
      offenders: each.flatMap((r) => r.offenders.map((x) => Object.assign({ sellerId: r.sellerId }, x))),
      expectedTotal: sum(each.map((r) => r.expectedTotal)),
      actualTotal: sum(each.map((r) => r.actualTotal)),
      delta: sum(each.map((r) => r.delta)),
    }
  }

  /** What the mis-filing costs, stated against the corrected book. */
  function overstatement(sellerId, o_) {
    const k = opt(o_)
    const filed = balance(sellerId, { filing: 'as_filed', risk: k.risk })
    const right = balance(sellerId, { filing: 'corrected', risk: k.risk })
    const mix = collectionMix(sellerId, k)
    const commission = reconcile(sellerId, { filing: 'corrected', risk: k.risk }).expectedTotal
    const amount = filed.statedBalance - right.statedBalance
    return {
      stated: filed.statedBalance, correct: right.statedBalance, amount,
      shareOfBook: mix.net ? amount / mix.net : 0,
      timesCommission: commission ? amount / commission : 0,
    }
  }

  /** Highbase's own position on an order: commission earned less discount it funded. */
  function highbaseMargin(orderId) {
    const o = order(orderId)
    const card = rateCard(seller(o.sellerId).rateCardId)
    const earned = commissionOn(o, card)
    const funded = o.discount && o.discount.funder === 'highbase' ? o.discount.amount : 0
    return { orderId, earned, funded, net: earned - funded }
  }

  function fundedDiscountRatio(sellerId, o_) {
    const k = opt(o_)
    const card = rateCard(seller(sellerId).rateCardId)
    const os = ordersFor(sellerId)
    const funded = sum(os.filter((o) => o.discount && o.discount.funder === 'highbase').map((o) => o.discount.amount))
    const earned = sum(os.filter((o) => commissionAccrues(o, k)).map((o) => commissionOn(o, card)))
    return { funded, earned, ratio: earned ? funded / earned : 0 }
  }

  // ── Settlement runs ──────────────────────────────────────────────────────
  /**
   * The pending run for a cycle, derived rather than seeded — which is the point, because
   * it is the same MAX(...) Finance refuses a run with.
   *
   * `refused` is a real outcome, not a warning: where the book asks for more than the cash
   * on hand, the run does not go out short, it does not go out at all until someone
   * decides. Warning and paying anyway is how the 0.300 gap becomes a support ticket.
   */
  function settlementRun(sellerId, o_) {
    const k = opt(o_)
    const s = seller(sellerId)
    const b = balance(sellerId, k)
    const mix = collectionMix(sellerId, k)

    // Which orders this run actually settles. In agent mode a credit order is nobody's
    // cash yet and cannot be in a run; in guarantor mode Highbase fronts it at delivery.
    const included = ordersFor(sellerId).filter((o) => {
      if (o.terms === 'credit') return k.risk === 'guarantor' && !!o.deliveryConfirmedAt
      return true
    })
    const carried = ordersFor(sellerId)
      .filter((o) => !included.some((i) => i.id === o.id))
      .map((o) => ({
        orderId: o.id, amount: o.grossValue,
        reason: o.terms === 'credit'
          ? (o.deliveryConfirmedAt ? 'Credit terms — awaiting the buyer. Highbase does not guarantee in agent mode.' : 'Credit terms — delivery not confirmed.')
          : 'Delivery not confirmed.',
      }))
      .concat(b.postings.filter((p) => p.held).map((p) => ({ orderId: p.orderId, amount: p.amount, reason: p.heldReason })))

    return {
      id: s.cycle.id, sellerId, cycle: s.cycle, filing: k.filing, risk: k.risk,
      included: included.map((o) => o.id), carried,
      cashCollected: mix.online + (k.risk === 'guarantor' ? sum(ordersFor(sellerId).filter((o) => o.terms === 'credit' && o.deliveryConfirmedAt).map(buyerPays)) : 0),
      alreadyPaid: b.paidOut,
      cashBacked: b.cashBacked,
      commissionNetted: b.commissionKept,
      discountsReimbursed: sum(b.postings.filter((p) => p.type === 'P2').map((p) => p.amount)),
      accrued: b.accrued,
      net: b.payable,
      unfunded: b.unfunded,
      refused: b.unfunded > 0,
      refusedReason: b.unfunded > 0 ? 'The book asks for more than the cash held. Releasing it would pay this seller with another seller’s money.' : null,
    }
  }

  // ── Buyer exposure — only meaningful in guarantor mode ───────────────────
  function buyerExposure(o_) {
    const k = opt(o_)
    if (k.risk !== 'guarantor') return { applicable: false, rows: [], total: 0 }
    const rows = BUYERS.map((b) => {
      const os = ordersForBuyer(b.id).filter((o) => o.terms === 'credit' && o.deliveryConfirmedAt)
      const outstanding = sum(os.map(buyerPays))
      return { buyerId: b.id, name: b.name, orders: os.map((o) => o.id), outstanding, limit: b.creditLimit, policy: b.policy, overLimit: outstanding > b.creditLimit }
    }).filter((r) => r.orders.length > 0)
    return { applicable: true, rows, total: sum(rows.map((r) => r.outstanding)) }
  }

  // ── INVARIANT 2 — the buyer projection ───────────────────────────────────
  /**
   * The only shape a buyer surface is allowed to read.
   *
   * Commission is a Highbase↔seller relationship and no buyer screen may show it, so
   * rather than trusting every future screen not to reach for it, the buyer's data does
   * not contain it. The self-test walks this object and fails if the word appears
   * anywhere in it — an invariant enforced at the boundary rather than at the template.
   */
  function buyerView(buyerId) {
    const b = buyer(buyerId)
    return {
      buyer: { id: b.id, name: b.name, vatNumber: b.vatNumber, address: b.address, creditLimit: b.creditLimit, policy: b.policy },
      orders: ordersForBuyer(buyerId).map((o) => ({
        id: o.id, date: o.date, sellerId: o.sellerId, sellerName: seller(o.sellerId).name,
        grossValue: o.grossValue, discount: o.discount ? o.discount.amount : 0,
        amountDue: buyerPays(o), paymentRoute: o.paymentRoute, terms: o.terms,
        dueDate: o.dueDate, deliveryConfirmedAt: o.deliveryConfirmedAt, kind: o.kind,
      })),
    }
  }

  return {
    FILS, bhd, round3, money, pct, sum,
    POSTING, STATES, FILINGS, RISK_MODES, DEFAULTS,
    RATE_CARDS, SELLERS, BUYERS, ORDERS, PAYOUTS, ARREARS_CEILING, STANDING_RULES,
    seller, buyer, order, rateCard, ordersFor, ordersForBuyer,
    commissionBase, commissionOn, buyerPays, isCollected, commissionAccrues,
    postingsFor, balance, collectionMix, standing,
    reconcile, reconcileAll, overstatement, highbaseMargin, fundedDiscountRatio,
    settlementRun, buyerExposure, buyerView,
  }
})
