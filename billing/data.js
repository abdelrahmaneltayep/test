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
  /** Bahrain VAT. Declared here because the ledger needs it to split a receipt. */
  const VAT_RATE = 0.10

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
  const opt = (o) => ({
    filing: (o && o.filing) || DEFAULTS.filing,
    risk: (o && o.risk) || DEFAULTS.risk,
    today: (o && o.today) || null,
  })

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
      cycle: { id: '1042-jan', label: '8–18 Jan 2026', from: '2026-01-08', to: '2026-01-18' }, nextPayoutDate: '2026-01-19' , address: 'Unit 12, Block 601, Sitra Industrial Area, Kingdom of Bahrain', vatNumber: '220001234500002'},
    { id: '1067', name: 'Manama Packaging Co.', rateCardId: 'rc-v1', arrearsCeiling: ARREARS_CEILING,
      cycle: { id: '1067-jan', label: '8–18 Jan 2026', from: '2026-01-08', to: '2026-01-18' }, nextPayoutDate: '2026-01-19' , address: 'Warehouse 4, Road 3705, Manama 337, Kingdom of Bahrain', vatNumber: '220002345600002'},
    { id: '1088', name: 'Sitra Industrial Tools', rateCardId: 'rc-v1', arrearsCeiling: ARREARS_CEILING,
      cycle: { id: '1088-jan', label: '8–22 Jan 2026', from: '2026-01-08', to: '2026-01-22' }, nextPayoutDate: '2026-01-23' , address: 'Plot 88, Sitra Industrial Area, Kingdom of Bahrain', vatNumber: '220003456700002'},
    { id: '1103', name: 'Riffa Building Materials', rateCardId: 'rc-v1', arrearsCeiling: ARREARS_CEILING,
      cycle: { id: '1103-jan', label: '8–18 Jan 2026', from: '2026-01-08', to: '2026-01-18' }, nextPayoutDate: '2026-01-19' , address: 'Shop 21, Riffa Souq, Riffa 901, Kingdom of Bahrain', vatNumber: '220004567800002'},
    /*
     * EXAMPLE DATA — added to make the `held` state reachable.
     *
     * Every seller in the brief has all deliveries confirmed, so `held` computed to 0.000
     * everywhere and one of the four headline states could not be reviewed at all. Marking
     * an existing order unconfirmed was not an option: it would move a payable the
     * acceptance tests name. So the state gets its own seller, and nothing specified moves.
     */
    /*
     * EXAMPLE DATA — added so `partially_paid` has an example.
     *
     * A partial payment collects cash, which moves the seller's payable and shrinks their
     * awaiting. On #1088 that would have broken acceptance test 10, so the state gets a
     * seller of its own. Each example seller demonstrates exactly one thing the brief's
     * own four could not reach.
     */
    { id: '1134', name: 'Seef Steel Fabricators', rateCardId: 'rc-v1', arrearsCeiling: ARREARS_CEILING, exampleData: true,
      cycle: { id: '1134-jan', label: '8–22 Jan 2026', from: '2026-01-08', to: '2026-01-22' }, nextPayoutDate: '2026-01-23', address: 'Workshop 14, Seef Industrial Area, Manama 428, Kingdom of Bahrain', vatNumber: '220006789000002' },
    { id: '1121', name: 'Muharraq Cold Store', rateCardId: 'rc-v1', arrearsCeiling: ARREARS_CEILING, exampleData: true,
      cycle: { id: '1121-jan', label: '8–20 Jan 2026', from: '2026-01-08', to: '2026-01-20' }, nextPayoutDate: '2026-01-21', address: 'Cold Store 6, Muharraq Port Road, Muharraq 201, Kingdom of Bahrain', vatNumber: '220005678900002' },
  ]
  const seller = (id) => SELLERS.find((s) => s.id === id)

  /** Fictional, and deliberately obvious as examples. Buyer↔order assignment is example data. */
  const BUYERS = [
    { id: 'B-201', name: 'Awali Contracting W.L.L.', vatNumber: '220000123400002', creditLimit: bhd(500), policy: 'warn_only',
      address: 'Building 214, Road 1502, Awali 951, Kingdom of Bahrain' },
    { id: 'B-202', name: 'Budaiya Trading Est.', vatNumber: '220000556600002', creditLimit: bhd(250), policy: 'require_approval',
      address: 'Shop 7, Budaiya Highway, Budaiya 540, Kingdom of Bahrain' },
    /* EXAMPLE DATA — the buyer who part-pays, and the one account on `warn_only`. */
    { id: 'B-204', name: 'Seef Retail Group', vatNumber: '220000991100002', creditLimit: bhd(500), policy: 'warn_only',
      address: 'Level 3, Seef Mall Avenue, Seef 428, Kingdom of Bahrain', exampleData: true },
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
      // Example data: the evidence a real adjustment would carry. Nothing computes from it.
      evidence: 'RET-1007-goods-received-note.pdf',
      note: 'Partial return against ORD-1007. Reverses value and commission together.' }),

    // ── #1067 — funded discount and the payout cap ──
    O({ id: 'ORD-2001', sellerId: '1067', buyerId: 'B-201', date: '2026-01-12', grossValue: bhd(90), paymentRoute: 'highbase', deliveryConfirmedAt: '2026-01-13',
      discount: { amount: bhd(9), funder: 'highbase', reason: '10% price match, funded by Highbase', evidence: 'PM-2001-competitor-quote.pdf' } }),
    O({ id: 'ORD-2002', sellerId: '1067', buyerId: 'B-202', date: '2026-01-14', grossValue: bhd(200), paymentRoute: 'seller', deliveryConfirmedAt: '2026-01-15' }),

    // ── #1088 — credit orders, the fourth state ──
    O({ id: 'ORD-3001', sellerId: '1088', buyerId: 'B-203', date: '2026-01-14', grossValue: bhd(300), paymentRoute: 'highbase',
      terms: 'credit', dueDate: '2026-02-19', deliveryConfirmedAt: '2026-01-20' }),
    O({ id: 'ORD-3002', sellerId: '1088', buyerId: 'B-202', date: '2026-01-16', grossValue: bhd(120), paymentRoute: 'seller', deliveryConfirmedAt: '2026-01-17' }),
    O({ id: 'ORD-3003', sellerId: '1088', buyerId: 'B-201', date: '2026-01-18', grossValue: bhd(60), paymentRoute: 'highbase', deliveryConfirmedAt: '2026-01-19' }),

    // ── #1134 — the partially-paid case. EXAMPLE DATA, see the seller note above. ──
    O({ id: 'ORD-6001', sellerId: '1134', buyerId: 'B-204', date: '2026-01-13', grossValue: bhd(300), paymentRoute: 'highbase',
      terms: 'credit', dueDate: '2026-02-18', deliveryConfirmedAt: '2026-01-19',
      note: 'Credit terms, half paid. The paid half is payable; the rest is still awaiting the buyer.' }),
    O({ id: 'ORD-6002', sellerId: '1134', buyerId: 'B-204', date: '2026-01-17', grossValue: bhd(100), paymentRoute: 'highbase', deliveryConfirmedAt: '2026-01-18' }),

    // ── #1121 — the held case. EXAMPLE DATA, see the seller note above. ──
    O({ id: 'ORD-5001', sellerId: '1121', buyerId: 'B-201', date: '2026-01-18', grossValue: bhd(200), paymentRoute: 'highbase',
      deliveryConfirmedAt: null, note: 'Collected by Highbase, delivery not yet confirmed — the cash is held.' }),
    O({ id: 'ORD-5002', sellerId: '1121', buyerId: 'B-202', date: '2026-01-15', grossValue: bhd(80), paymentRoute: 'highbase', deliveryConfirmedAt: '2026-01-16' }),

    // ── #1103 — the structural failure case ──
    O({ id: 'ORD-4001', sellerId: '1103', buyerId: 'B-203', date: '2026-01-09', grossValue: bhd(2000), paymentRoute: 'seller', deliveryConfirmedAt: '2026-01-10' }),
    O({ id: 'ORD-4002', sellerId: '1103', buyerId: 'B-203', date: '2026-01-12', grossValue: bhd(1800), paymentRoute: 'seller', deliveryConfirmedAt: '2026-01-13' }),
    O({ id: 'ORD-4003', sellerId: '1103', buyerId: 'B-202', date: '2026-01-16', grossValue: bhd(1500), paymentRoute: 'seller', deliveryConfirmedAt: '2026-01-17' }),
  ]

  const ordersFor = (sellerId) => ORDERS.filter((o) => o.sellerId === sellerId)
  const ordersForBuyer = (buyerId) => ORDERS.filter((o) => o.buyerId === buyerId)
  const order = (id) => ORDERS.find((o) => o.id === id)

  /**
   * Payments received from buyers, recorded VAT-inclusive because that is what a buyer
   * actually hands over. The ledger needs the ex-VAT half of it — the VAT is collected on
   * behalf of the NBR and is not the seller's money — so `collected()` divides it back out.
   *
   * EXAMPLE DATA. A partial payment is the only way `partially_paid` can exist, and it had
   * to land on a seller whose figures no acceptance test names.
   */
  const PAYMENTS = [
    { id: 'RCPT-9001', orderId: 'ORD-6001', buyerId: 'B-204', date: '2026-01-22', amount: bhd(165), exampleData: true },
  ]
  const paymentsFor = (orderId) => PAYMENTS.filter((p) => p.orderId === orderId)

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

  /**
   * How much of this order's cash has actually reached Highbase, ex-VAT.
   *
   * Collection is a proportion rather than a yes/no, because a buyer on credit terms can
   * pay half. An immediate order is collected in full at the point of sale; a guaranteed
   * credit order is fronted in full at delivery; an unguaranteed one is collected only as
   * far as the buyer has paid.
   */
  function collected(o, k) {
    if (o.terms !== 'credit') return buyerPays(o)
    if (k.risk === 'guarantor' && o.deliveryConfirmedAt) return buyerPays(o)
    const received = sum(paymentsFor(o.id).map((p) => p.amount))
    return received ? Math.min(round3(received / (1 + VAT_RATE)), buyerPays(o)) : 0
  }

  /** What share of the order has been collected. Drives the commission that has accrued. */
  const collectedRatio = (o, k) => (buyerPays(o) ? collected(o, k) / buyerPays(o) : 0)

  /** Fully collected — the test the invoice status and the awaiting state both turn on. */
  const isCollected = (o, k) => collected(o, k) >= buyerPays(o)

  /**
   * Commission accrues on collection, not on delivery — and pro rata, because half the
   * cash has earned half the commission. A credit order nobody has paid for has earned
   * Highbase nothing to net against, which is what makes `awaiting` its own state rather
   * than a flavour of payable.
   */
  // Measured on the ratio rather than the amount, for the same reason: a return has
  // collected −150.000 against a buyerPays of −150.000, which is a ratio of 1.
  const commissionAccrues = (o, k) => collectedRatio(o, k) > 0
  const accruedCommission = (o, card, k) => round3(commissionOn(o, card) * collectedRatio(o, k))

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
      /*
       * `!== 0`, not `> 0`. A return's buyerPays is negative, so a positive-only guard
       * silently drops the reversal — the whole event the reconciliation control exists
       * to catch. Whether cash moved is a question about zero, not about sign.
       */
      const cashIn = collected(ord, k)
      if (ord.paymentRoute === 'highbase' && cashIn !== 0) {
        push({
          type: ord.kind === 'return' ? 'P6' : 'P1',
          orderId: ord.id, date: ord.date, leg: 'cash',
          amount: flip * cashIn,
          partial: cashIn < buyerPays(ord),
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
        const comm = accruedCommission(ord, card, k)
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
    // The remainder, not the order. Once a buyer has part-paid, only the unpaid half is
    // still awaiting them — the paid half has already become payable.
    const awaitingGross = sum(awaitingOrders.map((o) => buyerPays(o) - collected(o, k)))
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
      // Pro rata, matching what has accrued. Comparing a part-collected order against its
      // full commission would report a timing fact as a discrepancy.
      const expected = accruedCommission(o, card, k)
      const actual = sum(ps.filter((p) => p.orderId === o.id && p.commissionCharge !== undefined).map((p) => p.commissionCharge))
      return { orderId: o.id, orderValue: o.grossValue, expected, actual, delta: actual - expected, ok: actual === expected }
    })

    const expectedTotal = sum(inScope.map((o) => accruedCommission(o, card, k)))
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
      /*
       * What the buyer still owes, from their invoices — not from `collected()`.
       *
       * `collected()` answers a different question: in guarantor mode it reports a credit
       * order as collected because Highbase fronted the seller, which is true of the
       * seller's position and false of the buyer's. Reading it here would show a buyer who
       * has part-paid as owing the full amount, and one Highbase has guaranteed as owing
       * nothing.
       *
       * VAT-inclusive, unlike the seller's `awaiting`. The two are different debts: the
       * seller is owed the goods value, the buyer owes the goods value plus the tax.
       */
      const open = invoices(b.id, k).filter((inv) => inv.terms === 'credit' && inv.status === 'open')
      const outstanding = sum(open.map((inv) => inv.amountOutstanding))
      return {
        buyerId: b.id, name: b.name, orders: open.map((inv) => inv.orderId),
        outstanding, limit: b.creditLimit, policy: b.policy, overLimit: outstanding > b.creditLimit,
      }
    }).filter((r) => r.orders.length > 0 && r.outstanding > 0)
    return { applicable: true, rows, total: sum(rows.map((r) => r.outstanding)) }
  }

  // ── Invoices, VAT and credit ─────────────────────────────────────────────
  /*
   * The reference date, and why it is a parameter rather than `new Date()`.
   *
   * Every invoice sub-state and every aging bucket is a statement about now. Reading the
   * wall clock would make this prototype tell a different story every week and none of
   * them reproducible — and a screenshot taken in February could not be compared with one
   * taken in March. So "today" is data, and the demo can move it.
   */
  const TODAY = '2026-01-24'
  /**
   * A simplified tax invoice is permitted at or under this **taxable amount** — the
   * consideration before VAT, not the total the buyer pays.
   *
   * The distinction is not academic on this book: ORD-1006 is priced at exactly 500.000
   * and reaches 550.000 with VAT. Measured on the total it needs the full eleven fields;
   * measured on the taxable amount it does not, and the taxable amount is the rule.
   */
  const SIMPLIFIED_INVOICE_MAX = bhd(500)
  const DUE_SOON_DAYS = 7

  const daysBetween = (from, to) =>
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000)

  /**
   * One invoice per order, derived — never stored beside the order it bills.
   *
   * INVARIANT 2 lives here as much as in `buyerView`: an invoice carries the taxable
   * amount, the VAT and the total payable, and nothing about commission. The buyer is
   * billed for goods; what Highbase charges the seller for arranging the sale is not a
   * line the buyer is party to, so it is not a field on the object they read.
   */
  function invoices(buyerId, o_) {
    const k = opt(o_)
    const today = k.today || TODAY
    const list = (buyerId ? ordersForBuyer(buyerId) : ORDERS)
      .filter((o) => o.kind !== 'return')
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))

    return list.map((o, i) => {
      const s = seller(o.sellerId)
      const b = buyer(o.buyerId)
      const taxable = buyerPays(o)
      const vat = round3(taxable * VAT_RATE)
      const total = taxable + vat
      // Credit terms carry the agreed due date; anything else is due on receipt.
      const dueDate = o.terms === 'credit' ? o.dueDate : o.date
      const collected = isCollected(o, k)
      const credits = ORDERS.filter((x) => x.reverses === o.id)
      const creditNote = credits.length ? sum(credits.map((x) => -buyerPays(x))) : 0

      const amountPaid = sum(paymentsFor(o.id).map((x) => x.amount))
      const amountOutstanding = Math.max(total - amountPaid, 0)

      /*
       * Status, then sub-status — and deliberately independent of the risk model.
       *
       * `collected()` cannot answer this. In guarantor mode it reports a delivered credit
       * order as collected, because Highbase has fronted the seller — which would mark the
       * buyer's invoice paid while the buyer still owes every fil of it. What settles an
       * invoice is the buyer paying it, and nothing else.
       */
      let status = 'open'
      if (!o.deliveryConfirmedAt) status = 'draft'
      else if (o.terms !== 'credit') status = 'paid'
      else if (amountPaid >= total) status = 'paid'


      /*
       * `partially_paid` outranks the timing states deliberately. An invoice that is
       * half paid and three days from due is, to the person chasing it, a part-payment
       * first — the timing is the second sentence, and it is still on the row as the age.
       */
      let subStatus = null
      if (status === 'open') {
        const days = daysBetween(today, dueDate)
        if (amountPaid > 0) subStatus = 'partially_paid'
        else if (days < 0) subStatus = 'overdue'
        else if (days <= DUE_SOON_DAYS) subStatus = 'due_soon'
        else subStatus = 'not_yet_due'
      }

      return {
        number: 'INV-2026-' + String(i + 1).padStart(4, '0'),
        orderId: o.id, buyerId: o.buyerId, sellerId: o.sellerId,
        supplier: { name: s.name, address: s.address, vatNumber: s.vatNumber },
        customer: { name: b.name, address: b.address, vatNumber: b.vatNumber },
        issueDate: o.date,
        supplyDate: o.deliveryConfirmedAt || o.date,
        dueDate,
        description: (o.terms === 'credit' ? 'Goods supplied on 30-day terms' : 'Goods supplied'),
        discount: o.discount ? o.discount.amount : 0,
        grossValue: o.grossValue,
        taxableAmount: taxable, vatRate: VAT_RATE, vatAmount: vat, totalPayable: total,
        creditNote,
        paymentRoute: o.paymentRoute, terms: o.terms,
        amountPaid, amountOutstanding,
        status, subStatus,
        daysToDue: daysBetween(today, dueDate),
        /** Measured on the taxable amount. See SIMPLIFIED_INVOICE_MAX. */
        simplifiedPermitted: taxable <= SIMPLIFIED_INVOICE_MAX,
      }
    })
  }

  /** FR — open-item aging, measured from the due date, never balance-forward. */
  const AGING_BUCKETS = [
    { key: 'current', label: 'Current', from: -Infinity, to: 0 },
    { key: 'd1_30', label: '1–30', from: 1, to: 30 },
    { key: 'd31_60', label: '31–60', from: 31, to: 60 },
    { key: 'd61_90', label: '61–90', from: 61, to: 90 },
    { key: 'd90', label: '90+', from: 91, to: Infinity },
  ]

  function statement(buyerId, o_) {
    const k = opt(o_)
    const today = k.today || TODAY
    const open = invoices(buyerId, k).filter((inv) => inv.status === 'open')
    const buckets = AGING_BUCKETS.map((b) => {
      const rows = open.filter((inv) => {
        const overdueBy = daysBetween(inv.dueDate, today)
        return overdueBy >= b.from && overdueBy <= b.to
      })
      // What is still owed, not what was billed. An invoice half paid ages for its
      // remainder; carrying its full value into a bucket overstates the debt.
      return { key: b.key, label: b.label, rows, total: sum(rows.map((r) => r.amountOutstanding)) }
    })
    return { today, open, buckets, total: sum(open.map((r) => r.amountOutstanding)) }
  }

  /**
   * The credit account, and what the policy would do at checkout.
   *
   * Four policies, escalating. The screen has to answer "what happens when I go over",
   * and the honest answer depends entirely on which of the four is set — so the function
   * returns the behaviour rather than the screen hard-coding one.
   */
  const CREDIT_POLICIES = ['ignore', 'warn_only', 'require_approval', 'enforce_hold']

  function creditAccount(buyerId, o_) {
    const k = opt(o_)
    const b = buyer(buyerId)
    const open = invoices(buyerId, k).filter((inv) => inv.status === 'open')
    const exposure = sum(open.map((inv) => inv.amountOutstanding))
    const available = Math.max(b.creditLimit - exposure, 0)
    return {
      buyerId, limit: b.creditLimit, exposure, available,
      overLimit: exposure > b.creditLimit,
      policy: b.policy, openInvoices: open.map((i) => i.number),
      utilisation: b.creditLimit ? exposure / b.creditLimit : 0,
      /** What checkout does when a new order would take exposure past the limit. */
      atLimit: {
        ignore: 'Checkout proceeds. The limit is recorded but not enforced.',
        warn_only: 'Checkout shows a warning and proceeds. Nothing is blocked.',
        require_approval: 'Checkout holds the order for Highbase approval before it is confirmed.',
        enforce_hold: 'Credit terms are withdrawn at checkout. The order can still be placed on immediate payment.',
      }[b.policy],
    }
  }

  /**
   * Price-match requests. Example data — a request that has not been accepted creates no
   * posting, which is why these can be seeded without moving any figure in the ledger.
   *
   * The accepted one is not seeded: it is derived from ORD-2001's funded discount, because
   * that request did produce a posting and inventing a second record of it would be the
   * same duplication the reconciliation control exists to catch.
   */
  const PRICE_MATCH_REQUESTS = [
    { id: 'PM-3310', buyerId: 'B-203', sellerId: '1042', orderId: 'ORD-1006', date: '2026-01-16',
      claimedPrice: bhd(470), evidence: 'competitor-quote-jan.pdf', state: 'under_review', exampleData: true },
    { id: 'PM-3311', buyerId: 'B-203', sellerId: '1103', orderId: 'ORD-4001', date: '2026-01-10',
      claimedPrice: bhd(1900), evidence: 'supplier-invoice-scan.jpg', state: 'declined',
      declineReason: 'The quoted supplier is not comparable — different pack size.', exampleData: true },
    { id: 'PM-3312', buyerId: 'B-203', sellerId: '1042', orderId: 'ORD-1004', date: '2026-01-22',
      claimedPrice: bhd(37), evidence: 'price-list-jan.pdf', state: 'submitted', exampleData: true },
    /*
     * Accepted but not yet credited — a real intermediate state, and one that can be
     * seeded safely: the supplier has agreed, the credit has not been issued, so no
     * posting exists yet. `credit_issued` is never seeded, because that state does imply
     * a posting and inventing a second record of one is the duplication the
     * reconciliation control exists to catch.
     */
    { id: 'PM-3313', buyerId: 'B-203', sellerId: '1103', orderId: 'ORD-4002', date: '2026-01-19',
      claimedPrice: bhd(1740), evidence: 'competitor-invoice-0119.pdf', state: 'accepted', exampleData: true },
  ]

  const PRICE_MATCH_STATES = ['submitted', 'under_review', 'accepted', 'declined', 'credit_issued']

  function priceMatches(buyerId) {
    const derived = ORDERS
      .filter((o) => o.buyerId === buyerId && o.discount && o.discount.funder === 'highbase' && o.discount.amount > 0)
      .map((o) => ({
        id: 'PM-' + o.id.replace(/\D/g, ''), buyerId, sellerId: o.sellerId, orderId: o.id, date: o.date,
        claimedPrice: buyerPays(o), evidence: o.discount.evidence,
        state: 'credit_issued', creditAmount: o.discount.amount, exampleData: false,
      }))
    return derived
      .concat(PRICE_MATCH_REQUESTS.filter((r) => r.buyerId === buyerId))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }

  // ── Ops and Finance ──────────────────────────────────────────────────────
  /*
   * Highbase admin is two roles, not one. Ops issues and corrects — rate cards,
   * adjustments, price-match credits. Finance approves and pays — the reconciliation
   * control, settlement runs, arrears invoicing. The separation is the control: the same
   * person cannot both write a credit and release the money for it.
   */
  const ADMIN_ROLES = ['ops', 'finance']

  /**
   * The adjustments queue, derived from the ledger rather than kept as a second list.
   *
   * Every adjustment already exists as an event on an order — a return, a funded discount.
   * Seeding a separate queue would create a second source of truth that could disagree
   * with the postings, which is the exact failure the reconciliation control exists to
   * catch. So the queue is a view.
   *
   * Break-even: a credit routes for approval when the discount rate exceeds the commission
   * rate, because past that point Highbase is paying more to win the order than the order
   * pays Highbase. Below it the credit posts silently; above it somebody signs.
   */
  function adjustments(o_) {
    const k = opt(o_)
    const rows = []
    for (const ord of ORDERS) {
      const s = seller(ord.sellerId)
      const card = rateCard(s.rateCardId)
      const commission = commissionOn(ord, card)

      if (ord.kind === 'return') {
        rows.push({
          id: ord.id, type: 'return', orderId: ord.reverses, sellerId: ord.sellerId,
          amount: ord.grossValue, funder: null, reason: ord.note, evidence: ord.evidence || null,
          date: ord.date, issuedBy: 'ops',
          // A return reverses what was already agreed; there is nothing to approve.
          requiresApproval: false,
          state: k.filing === 'as_filed' ? 'flagged' : 'posted',
          flag: k.filing === 'as_filed' ? 'Sign error — commission charged instead of credited' : null,
        })
      }

      if (ord.discount && ord.discount.amount > 0 && ord.discount.funder === 'highbase') {
        const discountRate = ord.grossValue ? ord.discount.amount / ord.grossValue : 0
        const overBreakEven = discountRate > card.rate
        rows.push({
          id: 'ADJ-' + ord.id, type: 'price_match_credit', orderId: ord.id, sellerId: ord.sellerId,
          amount: ord.discount.amount, funder: ord.discount.funder,
          reason: ord.discount.reason, evidence: ord.discount.evidence || null,
          date: ord.date, issuedBy: 'ops',
          discountRate, commissionRate: card.rate, overBreakEven,
          requiresApproval: overBreakEven,
          state: overBreakEven ? 'awaiting_approval' : 'posted',
          net: commission - ord.discount.amount,
        })
      }
    }
    return rows
  }

  /**
   * Separation of duties, as a function rather than as a note in a spec.
   *
   * Finance approves; Ops issues. The issuer can never be the approver, which is why the
   * check compares roles rather than just asking whether the actor is Finance — if Ops
   * ever gains an approval path, this still refuses their own adjustment.
   */
  function canApprove(adj, actor) {
    if (!adj.requiresApproval) return { allowed: false, reason: 'Nothing to approve — this posts without a signature.' }
    if (actor !== 'finance') return { allowed: false, reason: 'Only Finance approves. Ops issues and corrects.' }
    if (actor === adj.issuedBy) return { allowed: false, reason: 'The issuer cannot approve their own adjustment.' }
    return { allowed: true, reason: null }
  }

  /**
   * What the mis-filed return actually did, leg by leg.
   *
   * The reconciliation control sees only the commission leg — 9.000 — while the balance
   * moves by 291.000. That gap is not a flaw in the control; it is the shape of this class
   * of error, and a screen that shows only one of the two numbers teaches the reader the
   * wrong lesson about what the control can and cannot catch.
   */
  function errorAnatomy(sellerId, orderId) {
    const legs = (filing) => {
      const ps = postingsFor(sellerId, { filing }).filter((p) => p.orderId === orderId)
      return {
        cash: sum(ps.filter((p) => p.leg === 'cash').map((p) => p.amount)),
        commission: sum(ps.filter((p) => p.leg === 'accrual').map((p) => p.amount)),
      }
    }
    const filed = legs('as_filed')
    const right = legs('corrected')
    const cashDelta = filed.cash - right.cash
    const commissionDelta = filed.commission - right.commission
    const card = rateCard(seller(sellerId).rateCardId)
    return {
      orderId, filed, corrected: right,
      cashDelta, commissionDelta, total: cashDelta + commissionDelta,
      /* The cash leg outweighs the commission leg by exactly 1/rate — which is why a
         commission-only control catches the small half of every error of this shape. */
      leverage: commissionDelta ? Math.abs(cashDelta / commissionDelta) : 0,
      impliedByRate: card.rate ? 1 / card.rate : 0,
    }
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
    ADMIN_ROLES, adjustments, canApprove, errorAnatomy,
    TODAY, VAT_RATE, SIMPLIFIED_INVOICE_MAX, AGING_BUCKETS, CREDIT_POLICIES, PRICE_MATCH_STATES,
    invoices, statement, creditAccount, priceMatches, daysBetween,
    seller, buyer, order, rateCard, ordersFor, ordersForBuyer,
    PAYMENTS, paymentsFor, collected, collectedRatio, accruedCommission,
    commissionBase, commissionOn, buyerPays, isCollected, commissionAccrues,
    postingsFor, balance, collectionMix, standing,
    reconcile, reconcileAll, overstatement, highbaseMargin, fundedDiscountRatio,
    settlementRun, buyerExposure, buyerView,
  }
})
