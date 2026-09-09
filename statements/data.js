;(function (root, factory) {
  const api = factory()
  root.HBS = Object.assign(root.HBS || {}, api)
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict'

  /**
   * HIGHBASE Billing — statements module.
   *
   * Built from the BRD dated 7 September 2026 (Andaleeb A. Khogli), and deliberately
   * scoped to what that document says: this module DOES NOT MOVE MONEY. It is a
   * calculation and reporting layer. Every screen produces a number Finance acts on by
   * hand; nothing here triggers a transfer, and no screen claims to.
   *
   * Two consequences run through the whole file:
   *
   *   1. Credit orders are out of scope (BRD §4). They are not modelled. The BRD flags
   *      them as an open question and inventing them here would put a number in front of
   *      a stakeholder that the business has not decided on.
   *   2. A settlement cycle is *reported*, never executed (BRD §4, §11). `cycle()` returns
   *      what Finance must pay and collect. It does not clear anything.
   *
   * Classic script rather than an ES module so the prototype opens from the filesystem —
   * a module build needs a server, and a prototype that needs a server is one nobody
   * double-clicks. One global, `HBS`, plus a Node export so the tests run headless.
   */

  // ── Money ────────────────────────────────────────────────────────────────
  // Integer fils throughout. BHD is a three-decimal currency, so fils are exactly the
  // display precision and nothing is rounded between what is stored and what is shown.
  const FILS = 1000
  const bhd = (n) => Math.round(n * FILS)
  const round3 = (x) => (x < 0 ? -Math.round(-x) : Math.round(x))
  const sum = (xs) => xs.reduce((a, b) => a + b, 0)

  /** Bahrain VAT. The BRD's illustration says "90 BHD + 10 BHD VAT"; at the statutory
   *  10% that pairing is 90 + 9. The rate is what the module applies. */
  const VAT_RATE = 0.10

  /** The one money formatter. Three decimals, always. */
  function money(fils, opts) {
    const o = opts || {}
    const abs = Math.abs(fils)
    const whole = String(Math.floor(abs / FILS)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const frac = String(abs % FILS).padStart(3, '0')
    const sign = fils < 0 ? '−' : o.signed && fils > 0 ? '+' : ''
    return sign + whole + '.' + frac + (o.currency ? ' BHD' : '')
  }

  const pct = (x, dp) => (x * 100).toFixed(dp === undefined ? 1 : dp) + '%'

  // ── Reporting periods (BRD §7.1) ─────────────────────────────────────────
  const PERIODS = ['yearly', 'monthly', 'weekly', 'order']

  // ── Subscription plans (BRD §7.5) ────────────────────────────────────────
  /*
   * Commission is not a flat platform rule. The BRD is explicit: it is per seller and per
   * branch, pulled from the Subscription Plan module, and it can step at a volume
   * threshold. So a rate is a function of (plan, units sold before this order), not a
   * constant — and the statement records which rate priced each line, because "3% today"
   * is not an answer to "why was this order charged what it was".
   */
  const PLANS = [
    {
      id: 'plan-basic', name: 'Basic', fixedFeePerCycle: bhd(0),
      tiers: [{ fromUnits: 0, rate: 0.03 }],
      note: 'Platform default — 3% on the pre-VAT base.',
    },
    {
      id: 'plan-growth', name: 'Growth', fixedFeePerCycle: bhd(15),
      tiers: [{ fromUnits: 0, rate: 0.03 }, { fromUnits: 40, rate: 0.04 }],
      note: 'Steps to 4% once 40 units have shipped in the agreement year.',
    },
    {
      id: 'plan-zero-rated', name: 'Wholesale agreement', fixedFeePerCycle: bhd(0),
      tiers: [{ fromUnits: 0, rate: 0.05 }],
      note: 'Negotiated 5% agreement rate. Goods are zero-rated for VAT.',
    },
  ]
  const plan = (id) => PLANS.find((p) => p.id === id)

  /** The rate that applies to an order, given how many units the seller had already
   *  shipped before it. Tiers are read highest-threshold-first. */
  function rateFor(planId, unitsBefore) {
    const p = plan(planId)
    const tiers = p.tiers.slice().sort((a, b) => b.fromUnits - a.fromUnits)
    return (tiers.find((t) => unitsBefore >= t.fromUnits) || tiers[tiers.length - 1]).rate
  }

  // ── Sellers and branches (BRD §11: a branch is a sub-entity with its own terms) ──
  const SELLERS = [
    {
      id: 'S-100', name: 'Awal Home Goods', planId: 'plan-basic',
      cadence: 'weekly', vatNumber: '220001234500002',
      address: 'Shop 14, Road 2827, Manama 428, Kingdom of Bahrain',
      branches: [
        { id: 'B-100-1', name: 'Manama branch', planId: 'plan-basic' },
        { id: 'B-100-2', name: 'Muharraq branch', planId: 'plan-growth' },
      ],
    },
    {
      id: 'S-200', name: 'Bahrain Fresh Foods', planId: 'plan-zero-rated',
      cadence: 'five_day', vatNumber: '220004567800002',
      address: 'Unit 6, Central Market, Manama 305, Kingdom of Bahrain',
      branches: [{ id: 'B-200-1', name: 'Central Market', planId: 'plan-zero-rated' }],
      note: 'Carries the BRD §7.8 worked example.',
    },
    {
      id: 'S-300', name: 'Sitra Tools & Hardware', planId: 'plan-growth',
      cadence: 'weekly', vatNumber: '220007890100002',
      address: 'Plot 44, Sitra Industrial Area, Kingdom of Bahrain',
      branches: [{ id: 'B-300-1', name: 'Sitra yard', planId: 'plan-growth' }],
    },
  ]
  const seller = (id) => SELLERS.find((s) => s.id === id)
  const branch = (sellerId, branchId) =>
    (seller(sellerId).branches || []).find((b) => b.id === branchId) || null

  /** The plan that prices an order: the branch's if it carries its own, else the seller's. */
  const planForOrder = (o) => {
    const b = branch(o.sellerId, o.branchId)
    return (b && b.planId) || seller(o.sellerId).planId
  }

  const BUYERS = [
    { id: 'C-01', name: 'Layla Al Ansari', address: 'Flat 21, Building 930, Road 3319, Mahooz 333' },
    { id: 'C-02', name: 'Hidd Catering W.L.L.', vatNumber: '220009988700002', address: 'Unit 2, Hidd Industrial Area, Hidd 115' },
    { id: 'C-03', name: 'Yousif Trading Est.', vatNumber: '220003344500002', address: 'Shop 8, Riffa Souq, Riffa 901' },
  ]
  const buyer = (id) => BUYERS.find((b) => b.id === id)

  // ── Orders ───────────────────────────────────────────────────────────────
  /*
   * An order carries lines, and a line carries the three factors the BRD names as the
   * drivers of every statement entry (§7.3): the item price, whether that price is
   * VAT-inclusive or exclusive, and the item discount.
   *
   * `paymentMethod` is a stored field, never inferred from which column holds a number.
   * It is the fact that decides whether this order pays the seller or bills him.
   */
  const L = (o) => Object.assign({
    qty: 1, vatInclusive: false, vatRate: VAT_RATE,
    discount: { amount: 0, funder: null, reason: null },
    status: 'fulfilled',
  }, o)

  const O = (o) => Object.assign({
    shipping: 0, penalty: 0, returnFee: 0, unitsBefore: 0,
  }, o)

  const ORDERS = [
    // ── S-200 · the BRD §7.8 worked example, reproduced exactly ──
    /*
     * The BRD's example gives commission of 10 on a 200 order and 5 on a 100 order — 5%,
     * charged on the order total. Read against §7.5 (3%, on the pre-VAT base) it does not
     * reconcile: 3% of a VAT-inclusive 100 is 2.727, not 5.
     *
     * Both rules can hold at once, and only one way: the seller is on a negotiated 5%
     * agreement — which §7.5 explicitly allows — and the goods are zero-rated, so the
     * pre-VAT base *is* the order total. That is how this seller is set up. It is a
     * reading, not a fact, and it is listed in the open questions.
     */
    O({
      id: 'ORD-0001', sellerId: 'S-200', branchId: 'B-200-1', buyerId: 'C-02',
      date: '2026-09-01', paymentMethod: 'cod',
      lines: [L({ sku: 'RICE-25', name: 'Basmati rice, 25kg', price: bhd(200), vatRate: 0, qty: 1 })],
      note: 'BRD §7.8 Order A. Courier hands 200.000 to the seller; HB collects nothing.',
    }),
    O({
      id: 'ORD-0002', sellerId: 'S-200', branchId: 'B-200-1', buyerId: 'C-02',
      date: '2026-09-04', paymentMethod: 'hb_payment',
      lines: [L({ sku: 'OIL-20', name: 'Sunflower oil, 20L', price: bhd(100), vatRate: 0, qty: 1 })],
      note: 'BRD §7.8 Order B. Nets its own commission and the debt from Order A.',
    }),

    // ── S-100 · VAT treatment, discount attribution, rejected lines ──
    O({
      id: 'ORD-0010', sellerId: 'S-100', branchId: 'B-100-1', buyerId: 'C-01',
      date: '2026-09-02', paymentMethod: 'hb_payment',
      lines: [
        // The BRD's own illustration: a 90 base with VAT charged on top.
        L({ sku: 'RUG-3X2', name: 'Wool rug 3×2m', price: bhd(90), vatInclusive: false }),
      ],
    }),
    O({
      id: 'ORD-0011', sellerId: 'S-100', branchId: 'B-100-1', buyerId: 'C-03',
      date: '2026-09-03', paymentMethod: 'hb_payment',
      lines: [
        // Same money, priced the other way round: 110.000 with the VAT already inside.
        L({ sku: 'LAMP-BR', name: 'Brass floor lamp', price: bhd(110), vatInclusive: true }),
      ],
    }),
    O({
      id: 'ORD-0012', sellerId: 'S-100', branchId: 'B-100-1', buyerId: 'C-01',
      date: '2026-09-05', paymentMethod: 'hb_payment',
      lines: [
        L({ sku: 'CUSH-SET', name: 'Cushion set of 4', price: bhd(60), vatInclusive: true,
          discount: { amount: bhd(6), funder: 'hb', reason: 'HB launch coupon HB-SEP10' } }),
      ],
      note: 'HB funded the coupon, so HB absorbs it — the seller is made whole (BRD §7.6).',
    }),
    O({
      id: 'ORD-0013', sellerId: 'S-100', branchId: 'B-100-1', buyerId: 'C-03',
      date: '2026-09-06', paymentMethod: 'cod',
      lines: [
        L({ sku: 'MIRROR-L', name: 'Arched mirror, large', price: bhd(80), vatInclusive: true,
          discount: { amount: bhd(8), funder: 'seller', reason: 'Seller clearance' } }),
      ],
      note: 'Seller-funded discount. It reduces his receivable, not HB’s commission base.',
    }),
    O({
      id: 'ORD-0014', sellerId: 'S-100', branchId: 'B-100-2', buyerId: 'C-02',
      date: '2026-09-07', paymentMethod: 'hb_payment', shipping: bhd(3.5),
      lines: [
        L({ sku: 'CHAIR-OAK', name: 'Oak dining chair', price: bhd(45), vatInclusive: false, qty: 2 }),
        L({ sku: 'TABLE-OAK', name: 'Oak dining table', price: bhd(160), vatInclusive: false, status: 'rejected',
          reason: 'Damaged in transit — rejected on delivery' }),
      ],
      unitsBefore: 41,
      note: 'Rejected line carries no commission (BRD §7.7). Branch is on the Growth plan, past its volume step.',
    }),

    // ── S-300 · a COD run that builds debt, then one prepaid order that clears part of it ──
    O({
      id: 'ORD-0020', sellerId: 'S-300', branchId: 'B-300-1', buyerId: 'C-03',
      date: '2026-09-01', paymentMethod: 'cod',
      lines: [L({ sku: 'DRILL-18V', name: 'Cordless drill 18V', price: bhd(120), vatInclusive: false })],
    }),
    O({
      id: 'ORD-0021', sellerId: 'S-300', branchId: 'B-300-1', buyerId: 'C-02',
      date: '2026-09-03', paymentMethod: 'cod',
      lines: [L({ sku: 'SAW-CIRC', name: 'Circular saw', price: bhd(230), vatInclusive: false })],
    }),
    O({
      id: 'ORD-0022', sellerId: 'S-300', branchId: 'B-300-1', buyerId: 'C-01',
      date: '2026-09-08', paymentMethod: 'cod', penalty: bhd(5),
      lines: [
        L({ sku: 'TOOLBOX', name: 'Steel toolbox', price: bhd(48), vatInclusive: false }),
        L({ sku: 'GLOVES', name: 'Work gloves', price: bhd(6), vatInclusive: false, status: 'cancelled',
          reason: 'Cancelled by buyer before dispatch' }),
      ],
      note: 'Late-dispatch penalty. The BRD leaves deductions homeless; here they get a column.',
    }),
    /*
     * A seller who sells almost entirely on COD. His one prepaid order is too small to
     * absorb the debt his COD orders have built, so the netting clears what it can, pays
     * him nothing, and carries the rest — and the next COD order adds to it again. This
     * is the shape the BRD's smart offsetting has to survive, and the reason a payout is
     * floored at zero rather than allowed to run negative.
     */
    O({
      id: 'ORD-0023', sellerId: 'S-300', branchId: 'B-300-1', buyerId: 'C-02',
      date: '2026-09-10', paymentMethod: 'hb_payment',
      lines: [L({ sku: 'BIT-SET', name: 'Drill bit set', price: bhd(15), vatInclusive: false })],
      note: 'Too small to clear the accumulated debt: it nets what it can and pays out nothing.',
    }),
    O({
      id: 'ORD-0024', sellerId: 'S-300', branchId: 'B-300-1', buyerId: 'C-03',
      date: '2026-09-12', paymentMethod: 'cod',
      lines: [L({ sku: 'LADDER-3M', name: 'Aluminium ladder 3m', price: bhd(300), vatInclusive: false })],
      note: 'And the debt starts building again the moment it is nearly cleared.',
    }),
  ]

  const order = (id) => ORDERS.find((o) => o.id === id)
  const ordersFor = (sellerId) => ORDERS.filter((o) => o.sellerId === sellerId).slice().sort(byDate)
  const ordersForBuyer = (buyerId) => ORDERS.filter((o) => o.buyerId === buyerId).slice().sort(byDate)
  const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1)

  // ── Per-line arithmetic (BRD §7.3) ───────────────────────────────────────
  /**
   * A line resolved into money. `base` is the pre-VAT amount — the figure commission is
   * charged on, whichever way the price was entered.
   */
  function lineAmounts(l) {
    const gross = l.price * l.qty
    const rate = l.vatRate === undefined ? VAT_RATE : l.vatRate
    const base = l.vatInclusive ? round3(gross / (1 + rate)) : gross
    const vat = l.vatInclusive ? gross - base : round3(gross * rate)
    const discount = (l.discount && l.discount.amount) || 0
    const funder = (l.discount && l.discount.funder) || null
    return {
      gross, base, vat, rate,
      total: base + vat,                       // list price the buyer would pay undiscounted
      discount, funder,
      buyerPays: base + vat - discount,        // what the buyer actually hands over
      counts: l.status === 'fulfilled',        // rejected and cancelled lines carry no commission
    }
  }

  /**
   * The commission base for an order.
   *
   * Neither kind of discount reduces it. The BRD says an HB-funded coupon is absorbed by
   * HB, and that a seller-funded discount reduces "the seller's own receivable rather
   * than HB's commission base" — so in both cases commission is charged on the pre-VAT
   * base before any discount. Rejected and cancelled lines are excluded entirely (§7.7).
   */
  function commissionBase(o) {
    return sum(o.lines.map(lineAmounts).filter((a) => a.counts).map((a) => a.base))
  }

  /** Everything derived for one order. The single place any statement figure comes from. */
  function orderStatement(o) {
    const amounts = o.lines.map(lineAmounts)
    const live = amounts.filter((a) => a.counts)
    const dropped = amounts.filter((a) => !a.counts)

    const rate = rateFor(planForOrder(o), o.unitsBefore || 0)
    const base = sum(live.map((a) => a.base))
    const vat = sum(live.map((a) => a.vat))
    const orderTotal = sum(live.map((a) => a.total))
    const hbDiscount = sum(live.filter((a) => a.funder === 'hb').map((a) => a.discount))
    const sellerDiscount = sum(live.filter((a) => a.funder === 'seller').map((a) => a.discount))
    const buyerPays = sum(live.map((a) => a.buyerPays))
    const commission = round3(base * rate)

    // Shipping, returns and penalties. The BRD (§8) records that these have no column yet
    // and asks where they live; this module gives them one rather than folding them into
    // fixed fees, where they would stop being explicable to the seller.
    const deduction = (o.shipping || 0) + (o.penalty || 0) + (o.returnFee || 0)

    const cod = o.paymentMethod === 'cod'

    /*
     * The two directions, kept apart on purpose.
     *
     *   HB Payment — HB holds the buyer's cash, so the seller's receivable is what is
     *                left after commission and deductions. HB funded coupons are added
     *                back: the buyer paid less, and HB, not the seller, covers the gap.
     *   COD        — the courier already handed the seller everything. Nothing is
     *                receivable; what exists is a debt running the other way.
     */
    const sellerReceivable = cod ? 0 : buyerPays + hbDiscount - commission - deduction
    const hbReceivable = cod ? commission + deduction - hbDiscount : 0

    return {
      id: o.id, date: o.date, sellerId: o.sellerId, branchId: o.branchId, buyerId: o.buyerId,
      paymentMethod: o.paymentMethod, note: o.note || null,
      lines: o.lines.map((l, i) => Object.assign({}, l, amounts[i])),
      droppedCount: dropped.length,
      droppedValue: sum(dropped.map((a) => a.total)),
      rate, base, vat, orderTotal, buyerPays,
      hbDiscount, sellerDiscount, commission, deduction,
      sellerReceivable, hbReceivable,
      // "Net Payables" is one of the five definitions the BRD leaves open (§12). Stated
      // here as one signed number — positive HB owes the seller, negative the seller owes
      // HB — and labelled as a proposal wherever it is displayed.
      netPayable: sellerReceivable - hbReceivable,
    }
  }

  // ── Smart offsetting (BRD §7.8) ──────────────────────────────────────────
  /**
   * The seller's ledger, in order, with the running balance the BRD asks for (§7.2).
   *
   * The netting is the point. A COD order books a debt; the next prepaid order pays this
   * order's commission *and* whatever debt has accumulated, before anything is released.
   * A payout is never negative — if the debt is larger than the order, the remainder
   * stays outstanding and is carried to the next one.
   */
  function ledger(sellerId, opts) {
    const k = opts || {}
    const rows = []
    let balance = 0        // signed: positive HB owes the seller
    let outstanding = 0    // backdated COD debt still to be recovered

    for (const o of ordersFor(sellerId)) {
      const st = orderStatement(o)
      let offset = 0
      let payout = 0

      if (o.paymentMethod === 'hb_payment') {
        offset = Math.min(outstanding, st.sellerReceivable)
        payout = st.sellerReceivable - offset
        outstanding -= offset
      } else {
        outstanding += st.hbReceivable
      }

      balance += st.netPayable
      rows.push(Object.assign({}, st, {
        offset,                 // prior debt cleared by this order
        payout,                 // what Finance would transfer for this order
        outstandingAfter: outstanding,
        balance,
      }))
    }
    return { sellerId, rows, balance, outstanding, cadence: seller(sellerId).cadence }
  }

  /** Reporting periods (BRD §7.1). `order` is the ungrouped, per-order view. */
  function periodKey(dateStr, period) {
    const d = new Date(dateStr + 'T00:00:00Z')
    if (period === 'yearly') return String(d.getUTCFullYear())
    if (period === 'monthly') return dateStr.slice(0, 7)
    if (period === 'weekly') {
      const t = new Date(d)
      t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7)) // ISO week, Monday start
      return t.toISOString().slice(0, 10)
    }
    return dateStr
  }

  /** Group ledger rows into a period, summing the columns that are summable. */
  function group(rows, period) {
    if (period === 'order') return rows.map((r) => Object.assign({ key: r.id, rows: [r] }, r))
    const out = []
    for (const r of rows) {
      const key = periodKey(r.date, period)
      let g = out.find((x) => x.key === key)
      if (!g) {
        g = { key, rows: [], orderTotal: 0, base: 0, vat: 0, commission: 0, deduction: 0,
              hbDiscount: 0, sellerDiscount: 0, sellerReceivable: 0, hbReceivable: 0,
              netPayable: 0, offset: 0, payout: 0 }
        out.push(g)
      }
      g.rows.push(r)
      for (const f of ['orderTotal', 'base', 'vat', 'commission', 'deduction', 'hbDiscount',
                       'sellerDiscount', 'sellerReceivable', 'hbReceivable', 'netPayable',
                       'offset', 'payout']) g[f] += r[f]
      g.balance = r.balance                    // closing balance of the period
      g.outstandingAfter = r.outstandingAfter
    }
    return out
  }

  // ── Settlement cycle (BRD §7.9) ──────────────────────────────────────────
  const CADENCES = {
    weekly: { id: 'weekly', label: 'Weekly', days: 7 },
    five_day: { id: 'five_day', label: 'Every 5 days', days: 5 },
  }

  /**
   * What Finance has to do this cycle for one seller — and nothing more than that.
   *
   * This module has no gateway and executes nothing (BRD §4, §11), so a cycle is a
   * report: pay this much, collect this much. `sellerDue` only exists when a seller's
   * debt outlives every prepaid order available to net it against.
   */
  function cycle(sellerId) {
    const l = ledger(sellerId)
    const s = seller(sellerId)
    const fee = plan(s.planId).fixedFeePerCycle
    const payDue = sum(l.rows.map((r) => r.payout))
    const netPay = Math.max(payDue - fee, 0)
    return {
      sellerId, cadence: CADENCES[s.cadence],
      fixedFee: fee,
      hbPaymentDue: netPay,                    // HB pays the seller
      feeUnrecovered: Math.max(fee - payDue, 0),
      sellerDue: l.outstanding,                // the seller remits to HB
      recovered: sum(l.rows.map((r) => r.offset)),
      balance: l.balance,
      rows: l.rows,
    }
  }

  const cycleAll = () => SELLERS.map((s) => cycle(s.id))

  // ── Buyer statement (BRD §7.2, §9) ───────────────────────────────────────
  /**
   * Not cumulative, and carrying no commission — both are structural, not cosmetic.
   *
   * The returned rows are built from a separate function rather than by filtering the
   * seller's, so there is no code path on which a commission figure can reach a buyer
   * screen by being forgotten in an object.
   */
  function buyerStatement(buyerId, period) {
    const rows = ordersForBuyer(buyerId).map((o) => {
      const st = orderStatement(o)
      return {
        id: st.id, date: st.date, sellerId: st.sellerId,
        sellerName: seller(st.sellerId).name,
        paymentMethod: st.paymentMethod,
        base: st.base, vat: st.vat, orderTotal: st.orderTotal,
        discount: st.hbDiscount + st.sellerDiscount,
        paid: st.buyerPays,
        droppedCount: st.droppedCount, droppedValue: st.droppedValue,
        lines: st.lines.map((l) => ({
          sku: l.sku, name: l.name, qty: l.qty, status: l.status, reason: l.reason || null,
          base: l.base, vat: l.vat, total: l.total, discount: l.discount, buyerPays: l.buyerPays,
        })),
      }
    })
    const p = period || 'order'
    if (p === 'order') return { buyerId, period: p, rows, total: sum(rows.map((r) => r.paid)) }
    const groups = []
    for (const r of rows) {
      const key = periodKey(r.date, p)
      let g = groups.find((x) => x.key === key)
      if (!g) { g = { key, rows: [], base: 0, vat: 0, orderTotal: 0, discount: 0, paid: 0 }; groups.push(g) }
      g.rows.push(r)
      for (const f of ['base', 'vat', 'orderTotal', 'discount', 'paid']) g[f] += r[f]
    }
    return { buyerId, period: p, rows, groups, total: sum(rows.map((r) => r.paid)) }
  }

  // ── Open questions (BRD §12), carried in the data rather than in a slide ──
  /*
   * The BRD ends on six unresolved items. They are modelled here so the prototype can
   * show a reviewer exactly where a screen is standing on an undecided definition, and
   * which way this build read it. A prototype that hides its assumptions is a prototype
   * that gets signed off on them.
   */
  const OPEN_QUESTIONS = [
    {
      id: 'credit-orders', ref: '§4, §12', title: 'How are credit orders handled?',
      status: 'not_modelled',
      reading: 'Out of scope for Phase 1, so this prototype does not model them at all. No screen shows a credit state.',
    },
    {
      id: 'definitions', ref: '§8, §12',
      title: 'Final definitions of Net Payables, HB Transaction, Balance, HB Payment Due, Seller Due',
      status: 'proposed',
      reading: 'Each is implemented and labelled as a proposal. Net Payables is one signed number: positive means HB owes the seller.',
    },
    {
      id: 'cadence', ref: '§7.9, §12', title: 'Is the 5-day/weekly cadence fixed or per seller?',
      status: 'proposed',
      reading: 'Modelled as per-seller. Awal and Sitra are weekly; Bahrain Fresh Foods is on five days.',
    },
    {
      id: 'deduction', ref: '§8, §12', title: 'Where does HB Deduction live?',
      status: 'proposed',
      reading: 'Its own column. Folded into fixed fees it stops being explicable to the seller who was charged it.',
    },
    {
      id: 'labels', ref: '§12', title: 'Labels for the seller-facing summary',
      status: 'proposed',
      reading: '“Your Balance” and “Your Dues” are used. “My financial status” names a screen, not a number.',
    },
    {
      id: 'notify', ref: '§12', title: 'Are sellers told when a backdated debt is created?',
      status: 'toggle',
      reading: 'Built both ways. The switch on the seller statement shows the debt at the COD order, or only at settlement.',
    },
    {
      id: 'worked-example', ref: '§7.5 vs §7.8', title: 'The worked example does not reconcile with the 3% rule',
      status: 'reading',
      reading: 'Its commissions are 10 on 200 and 5 on 100 — 5%, charged on the order total. Modelled as a 5% agreement rate on zero-rated goods, which satisfies both clauses. Needs confirming.',
    },
    {
      id: 'hb-coupon-cod', ref: '§8', title: '“HB Receivable (incl. HB coupons)” on a COD order',
      status: 'reading',
      reading: 'Read as netting: HB owes the seller the coupon it funded, so it reduces what HB collects. The column name reads the other way and needs settling.',
    },
  ]

  return {
    FILS, VAT_RATE, PERIODS, CADENCES, PLANS, SELLERS, BUYERS, ORDERS, OPEN_QUESTIONS,
    bhd, round3, sum, money, pct,
    plan, planForOrder, rateFor, seller, branch, buyer, order,
    ordersFor, ordersForBuyer,
    lineAmounts, commissionBase, orderStatement,
    ledger, group, periodKey,
    cycle, cycleAll, buyerStatement,
  }
})
