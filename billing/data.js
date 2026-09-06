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
   * Every amount in this file is an integer number of fils. 1 BHD = 1000 fils, and BHD is
   * a three-decimal currency, so fils are exactly the display precision — there is no
   * rounding between what is stored and what is shown.
   *
   * Nothing here is a float. 0.1 + 0.2 problems in a ledger do not surface as a wrong
   * pixel; they surface as a reconciliation that is off by a millifil and an accountant
   * who stops trusting the report.
   */
  const FILS = 1000

  /** BHD from a decimal literal, for seed data only. `bhd(50)` → 50000 fils. */
  function bhd(n) {
    return Math.round(n * FILS)
  }

  /**
   * Round half away from zero, to whole fils — which is three decimals in BHD.
   *
   * Away from zero rather than toward positive infinity: a commission of 4.4995 and a
   * credit of −4.4995 should be the same size, and half-up-toward-infinity makes the
   * credit smaller than the charge it reverses. On this seed data nothing lands on a half
   * fil, so the choice is documentation rather than arithmetic — but it is the kind of
   * thing that is decided once or argued about forever.
   */
  function round3(x) {
    return x < 0 ? -Math.round(-x) : Math.round(x)
  }

  /**
   * The one money formatter. Three decimals, always — no locale shortening, no trimming
   * of trailing zeros, no bare "81" where "81.000" is meant. Test 9 exists because a
   * number that is sometimes 81 and sometimes 81.000 is two numbers to a reader.
   */
  function money(fils, opts) {
    const o = opts || {}
    const neg = fils < 0
    const abs = Math.abs(fils)
    const whole = Math.floor(abs / FILS)
    const frac = String(abs % FILS).padStart(3, '0')
    const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const sign = neg ? '−' : o.signed ? '+' : ''
    return sign + grouped + '.' + frac + (o.currency ? ' BHD' : '')
  }

  /** A percentage for display, one decimal. Shares of a book, not money. */
  function pct(numerator, denominator, dp) {
    if (!denominator) return '0.0%'
    const d = dp === undefined ? 1 : dp
    return (Math.round((numerator / denominator) * 100 * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d) + '%'
  }

  // ── Postings ─────────────────────────────────────────────────────────────
  /*
   * Six kinds of movement, and one sign convention that holds everywhere:
   *
   *     POSITIVE MEANS HIGHBASE OWES THE SELLER.
   *
   * Every sign error this prototype is built to expose is a violation of that one line.
   */
  const POSTING = {
    P1: { code: 'P1', label: 'Cash collected by Highbase', sign: '+' },
    P2: { code: 'P2', label: 'Highbase-funded discount', sign: '+' },
    P3: { code: 'P3', label: 'Commission', sign: '−' },
    P4: { code: 'P4', label: 'Fixed fee / subscription', sign: '−' },
    P5: { code: 'P5', label: 'Payout to seller', sign: '−' },
    P6: { code: 'P6', label: 'Return reversal', sign: '±' },
  }

  // ── Rate cards ───────────────────────────────────────────────────────────
  /*
   * Versioned, because the ledger has to be able to say which terms priced a given order
   * — "3% today" is not an answer to "why was this order charged 15.000 in June".
   *
   * Two of these are in open conflict, and that is seeded on purpose: the ledger prices
   * every order at flat 3%, while the product's own Subscription Settings screen
   * advertises 10% on a seller's first order and 0% after. Both are live claims about the
   * same contract. The prototype shows them side by side and refuses to pick one, because
   * picking one silently is how a pricing dispute becomes a pricing incident.
   */
  const RATE_CARDS = [
    {
      id: 'rc-v1',
      version: 'v1',
      label: 'Flat 3%',
      model: 'flat',
      rate: 0.03,
      effectiveFrom: '2025-01-01',
      source: 'Ledger — the terms every posting in this book was priced with',
      status: 'applied',
    },
    {
      id: 'rc-sub',
      version: 'v2 (draft)',
      label: '10% first order, 0% thereafter',
      model: 'first_order_then_zero',
      rate: 0.10,
      subsequentRate: 0,
      effectiveFrom: '2025-11-01',
      source: 'Product — Subscription Settings screen, shown to sellers at signup',
      status: 'advertised',
    },
  ]

  const rateCard = (id) => RATE_CARDS.find((r) => r.id === id)

  // ── Sellers ──────────────────────────────────────────────────────────────
  const SELLERS = [
    {
      id: '1042',
      name: 'Gulf Metal Supplies',
      rateCardId: 'rc-v1',
      cycle: { id: '1042-jan', label: '8–18 Jan 2026', from: '2026-01-08', to: '2026-01-18' },
      nextPayoutDate: '2026-01-19',
      arrearsCeiling: bhd(50),
    },
    {
      id: '1067',
      name: 'Manama Packaging Co.',
      rateCardId: 'rc-v1',
      cycle: { id: '1067-jan', label: '8–18 Jan 2026', from: '2026-01-08', to: '2026-01-18' },
      nextPayoutDate: '2026-01-19',
      arrearsCeiling: bhd(50),
    },
  ]

  const seller = (id) => SELLERS.find((s) => s.id === id)

  // ── Orders — the source documents ────────────────────────────────────────
  /*
   * Orders are kept separate from postings, and that separation is what makes the
   * reconciliation control possible at all.
   *
   * An order record says what happened in the world: a sale of 400.000, or a return of
   * 150.000. A posting says what was written in the book about it. The planted bug is a
   * posting that disagrees with its order — and a control that read only the postings
   * could never see it, because the postings are internally consistent. They are just
   * consistent about the wrong event.
   */
  const ORDERS = [
    // Seller #1042 — the reconciliation case.
    { id: 'ORD-1001', sellerId: '1042', date: '2026-01-08', kind: 'order', value: bhd(50), collectedBy: 'highbase', discount: 0, discountFunder: null },
    { id: 'ORD-1002', sellerId: '1042', date: '2026-01-09', kind: 'order', value: bhd(100), collectedBy: 'seller', discount: 0, discountFunder: null },
    { id: 'ORD-1003', sellerId: '1042', date: '2026-01-10', kind: 'order', value: bhd(75), collectedBy: 'highbase', discount: 0, discountFunder: null },
    { id: 'ORD-1004', sellerId: '1042', date: '2026-01-11', kind: 'order', value: bhd(40), collectedBy: 'seller', discount: 0, discountFunder: null },
    { id: 'ORD-1005', sellerId: '1042', date: '2026-01-12', kind: 'order', value: bhd(25), collectedBy: 'seller', discount: 0, discountFunder: null },
    { id: 'ORD-1006', sellerId: '1042', date: '2026-01-15', kind: 'order', value: bhd(500), collectedBy: 'seller', discount: 0, discountFunder: null },
    { id: 'ORD-1007', sellerId: '1042', date: '2026-01-15', kind: 'order', value: bhd(400), collectedBy: 'highbase', discount: 0, discountFunder: null },
    {
      id: 'RET-1007', sellerId: '1042', date: '2026-01-17', kind: 'return', value: bhd(-150),
      collectedBy: 'highbase', discount: 0, discountFunder: null, reverses: 'ORD-1007',
      note: 'Partial return against ORD-1007. Reverses value and commission together.',
    },

    // Seller #1067 — the funded-discount case.
    {
      id: 'ORD-2001', sellerId: '1067', date: '2026-01-12', kind: 'order', value: bhd(90),
      collectedBy: 'highbase', discount: bhd(9), discountFunder: 'highbase',
      note: '10% price match, funded by Highbase.',
    },
    { id: 'ORD-2002', sellerId: '1067', date: '2026-01-14', kind: 'order', value: bhd(200), collectedBy: 'seller', discount: 0, discountFunder: null },
  ]

  const ordersFor = (sellerId) => ORDERS.filter((o) => o.sellerId === sellerId)
  const order = (id) => ORDERS.find((o) => o.id === id)

  // ── Payouts already made ─────────────────────────────────────────────────
  const PAYOUTS = [
    { id: 'PAY-1042-1', sellerId: '1042', date: '2026-01-09', amount: bhd(45.5), runId: 'run-1042-a' },
    { id: 'PAY-1042-2', sellerId: '1042', date: '2026-01-11', amount: bhd(70), runId: 'run-1042-b' },
    { id: 'PAY-1042-3', sellerId: '1042', date: '2026-01-13', amount: bhd(0.8), runId: 'run-1042-c' },
  ]

  // ── The pricing rules, as code ───────────────────────────────────────────

  /**
   * What commission is charged on.
   *
   * A Highbase-funded discount does not reduce the base. The seller shipped 90.000 of
   * goods and was made whole for 90.000; charging them commission on 81.000 would be
   * Highbase discounting its own revenue to pay for its own marketing twice. A
   * seller-funded discount is different — that one is a real price reduction and the base
   * follows it down.
   */
  function commissionBase(o) {
    return o.discountFunder === 'highbase' ? o.value : o.value - o.discount
  }

  /** Commission charged on an order, positive = charged to the seller. */
  function commissionOn(o, card) {
    return round3(commissionBase(o) * card.rate)
  }

  /** What the buyer hands over, whoever collects it. */
  function buyerPays(o) {
    return o.value - o.discount
  }

  // ── Filing — turning orders into postings ────────────────────────────────
  /*
   * Two filings of the same book. `corrected` is what the rules above produce.
   * `as_filed` is what is actually in the ledger today: RET-1007 was keyed as a positive
   * receivable with commission charged rather than credited — a return booked as a sale.
   *
   * The bug lives here, in the filing, and nowhere else. Every screen reads whichever
   * filing the demo is set to, so flipping the toggle moves every number on every surface
   * at once, which is the honest way to show what one mis-keyed row costs.
   */
  const MODES = ['as_filed', 'corrected']

  function postingsFor(sellerId, mode) {
    const s = seller(sellerId)
    const card = rateCard(s.rateCardId)
    const out = []
    let seq = 0
    const push = (p) => out.push(Object.assign({ seq: ++seq, sellerId, rateCardId: card.id }, p))

    for (const o of ordersFor(sellerId)) {
      const misfiled = mode === 'as_filed' && o.kind === 'return'
      // A return filed as a sale: the cash leg keeps the sign of a receipt, and the
      // commission leg is charged instead of credited.
      const cashSign = misfiled ? -1 : 1
      const commSign = misfiled ? -1 : 1

      if (o.collectedBy === 'highbase') {
        push({
          type: o.kind === 'return' ? 'P6' : 'P1',
          orderId: o.id, date: o.date,
          amount: cashSign * buyerPays(o),
          leg: 'cash',
          held: false,
          label: o.kind === 'return' ? 'Return reversal — cash' : 'Cash collected by Highbase',
        })
      }

      if (o.discount > 0 && o.discountFunder === 'highbase') {
        push({
          type: 'P2', orderId: o.id, date: o.date,
          amount: o.discount, leg: 'accrual',
          label: 'Highbase-funded discount',
        })
      }

      // Commission is charged on every order, always — including the ones where the
      // seller took the money, which is exactly where Highbase ends up exposed.
      const comm = commissionOn(o, card)
      push({
        type: o.kind === 'return' ? 'P6' : 'P3',
        orderId: o.id, date: o.date,
        amount: -(commSign * comm), leg: 'accrual',
        commissionCharge: commSign * comm,
        label: o.kind === 'return' ? 'Return reversal — commission' : 'Commission',
      })
    }

    for (const p of PAYOUTS.filter((x) => x.sellerId === sellerId)) {
      push({ type: 'P5', orderId: null, date: p.date, amount: -p.amount, leg: 'cash', payoutId: p.id, runId: p.runId, label: 'Payout to seller' })
    }

    return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.seq - b.seq))
  }

  // ── The balance, in three states ─────────────────────────────────────────

  const sum = (xs) => xs.reduce((a, b) => a + b, 0)

  /**
   * The whole point of the module.
   *
   * A single balance answers "what does the book say" and hides "can we actually pay it".
   * Three states answer both. Payable is cash Highbase is holding and may release; held is
   * cash it holds but must not release yet; owed is money that exists only as a claim,
   * because the seller already took the cash it would have been netted from.
   */
  function balance(sellerId, mode) {
    const ps = postingsFor(sellerId, mode)
    const cash = ps.filter((p) => p.leg === 'cash')
    const accruals = ps.filter((p) => p.leg === 'accrual')

    const heldCash = sum(cash.filter((p) => p.held).map((p) => p.amount))
    const cashBacked = sum(cash.map((p) => p.amount))
    const releasable = cashBacked - heldCash
    const accrued = sum(accruals.map((p) => p.amount))

    /*
     * THE PAYOUT RULE. Never release more than the cash actually held, net the negative
     * accruals first, and never push a seller below zero.
     *
     * `Math.min(accrued, 0)` is the load-bearing half: positive accruals — a funded
     * discount Highbase owes but has not put cash behind — do not increase what can be
     * paid out. Seller #1067 is the worked example, and the 0.300 gap it leaves is the
     * reason the rule is written this way rather than as a bare subtraction.
     */
    const payable = Math.max(releasable + Math.min(accrued, 0), 0)

    // What the seller is owed on the book, ignoring whether the cash exists to pay it.
    const bookOwed = cashBacked + accrued
    const unfunded = Math.max(bookOwed - payable, 0)

    // Commission on orders where the seller collected the cash — the part Highbase has no
    // cash to net against, and must recover by netting later or by invoice.
    const owedToHighbase = sum(
      accruals
        .filter((p) => p.commissionCharge > 0 && order(p.orderId) && order(p.orderId).collectedBy === 'seller')
        .map((p) => p.commissionCharge),
    )

    return {
      sellerId, mode,
      payable, held: heldCash, owedToHighbase,
      cashBacked, releasable, accrued, bookOwed, unfunded,
      /** The single flat figure today's statement shows. Kept so the two can be compared. */
      statedBalance: bookOwed,
      collected: sum(cash.filter((p) => p.type !== 'P5').map((p) => p.amount)),
      paidOut: -sum(cash.filter((p) => p.type === 'P5').map((p) => p.amount)),
      commissionKept: -sum(accruals.filter((p) => p.commissionCharge !== undefined).map((p) => p.amount)),
      postings: ps,
    }
  }

  /** Who collected the money — the fact that decides everything downstream. */
  function collectionMix(sellerId) {
    const os = ordersFor(sellerId)
    const net = sum(os.map((o) => o.value))
    const byHighbase = sum(os.filter((o) => o.collectedBy === 'highbase').map((o) => o.value))
    const bySeller = sum(os.filter((o) => o.collectedBy === 'seller').map((o) => o.value))
    const gross = sum(os.filter((o) => o.kind === 'order').map((o) => o.value))
    const returned = sum(os.filter((o) => o.kind === 'return').map((o) => o.value))
    return {
      gross, returned, net, byHighbase, bySeller,
      highbaseShare: net ? byHighbase / net : 0,
      sellerShare: net ? bySeller / net : 0,
    }
  }

  // ── The reconciliation control ───────────────────────────────────────────
  /**
   * One query over the whole book: does the commission charged equal the rate times the
   * order value it was charged on?
   *
   * It is checked per order and in total. The total tells you the book is wrong; the
   * per-order rows tell you which row to open, which is the difference between a control
   * that produces an investigation and one that produces an argument.
   */
  function reconcile(sellerId, mode) {
    const s = seller(sellerId)
    const card = rateCard(s.rateCardId)
    const ps = postingsFor(sellerId, mode)

    const rows = ordersFor(sellerId).map((o) => {
      const expected = commissionOn(o, card)
      const actual = sum(
        ps.filter((p) => p.orderId === o.id && p.commissionCharge !== undefined).map((p) => p.commissionCharge),
      )
      return { orderId: o.id, orderValue: o.value, expected, actual, delta: actual - expected, ok: actual === expected }
    })

    const expectedTotal = round3(sum(ordersFor(sellerId).map((o) => commissionBase(o))) * card.rate)
    const actualTotal = sum(rows.map((r) => r.actual))

    return {
      sellerId, mode, rate: card.rate,
      orderValueTotal: sum(ordersFor(sellerId).map((o) => o.value)),
      expectedTotal, actualTotal,
      delta: actualTotal - expectedTotal,
      passes: actualTotal === expectedTotal,
      rows,
      offenders: rows.filter((r) => !r.ok),
    }
  }

  /** What the mis-filing costs, stated against the corrected book. */
  function overstatement(sellerId) {
    const filed = balance(sellerId, 'as_filed')
    const right = balance(sellerId, 'corrected')
    const mix = collectionMix(sellerId)
    const commission = reconcile(sellerId, 'corrected').expectedTotal
    const amount = filed.statedBalance - right.statedBalance
    return {
      stated: filed.statedBalance,
      correct: right.statedBalance,
      amount,
      shareOfBook: mix.net ? amount / mix.net : 0,
      timesCommission: commission ? amount / commission : 0,
    }
  }

  /** Highbase's own position on an order: commission earned less discount it funded. */
  function highbaseMargin(orderId) {
    const o = order(orderId)
    const card = rateCard(seller(o.sellerId).rateCardId)
    const earned = commissionOn(o, card)
    const funded = o.discountFunder === 'highbase' ? o.discount : 0
    return { orderId, earned, funded, net: earned - funded }
  }

  /**
   * Funded-discount spend against commission earned. Above 1.00 the platform is paying
   * more to win the order than the order pays it, which is a decision someone should be
   * making on purpose.
   */
  function fundedDiscountRatio(sellerId) {
    const card = rateCard(seller(sellerId).rateCardId)
    const os = ordersFor(sellerId)
    const funded = sum(os.filter((o) => o.discountFunder === 'highbase').map((o) => o.discount))
    const earned = sum(os.map((o) => commissionOn(o, card)))
    return { funded, earned, ratio: earned ? funded / earned : 0 }
  }

  return {
    FILS, bhd, round3, money, pct, sum,
    POSTING, MODES, RATE_CARDS, SELLERS, ORDERS, PAYOUTS,
    seller, order, rateCard, ordersFor,
    commissionBase, commissionOn, buyerPays,
    postingsFor, balance, collectionMix, reconcile, overstatement,
    highbaseMargin, fundedDiscountRatio,
  }
})
