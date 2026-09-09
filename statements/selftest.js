;(function (root, factory) {
  const api = factory(root.HBS || (typeof require !== 'undefined' ? require('./data.js') : null))
  root.HBSTest = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function (HBS) {
  'use strict'

  /**
   * Acceptance tests for the statements module.
   *
   * The BRD commits to exactly one worked example (§7.8) and a handful of stated rules.
   * Those are the assertions that matter: everything else here guards a rule the document
   * states in prose, where a quiet regression would otherwise be invisible on screen.
   */

  const R = []
  const m = (v) => HBS.money(v, { currency: false })

  function ok(id, pass, detail) { R.push({ id, pass: !!pass, detail: detail === undefined ? '' : String(detail) }) }
  function eq(id, actual, expected, note) {
    ok(id, actual === expected, m(actual) + (actual === expected ? '' : ' ≠ ' + m(expected)) + (note ? ' · ' + note : ''))
  }

  function run() {
    R.length = 0

    // ── BRD §7.8 · the worked example, the one figure the document commits to ──
    const l200 = HBS.ledger('S-200')
    const a = l200.rows[0]
    const b = l200.rows[1]
    eq('7.8.1  Order A books a 10.000 HB receivable', a.hbReceivable, HBS.bhd(10))
    eq('7.8.2  Order A pays the seller nothing', a.payout, 0, 'courier paid him direct')
    eq('7.8.3  Order B commission is 5.000', b.commission, HBS.bhd(5))
    eq('7.8.4  Order B offsets the prior 10.000', b.offset, HBS.bhd(10))
    eq('7.8.5  Order B pays out 85.000', b.payout, HBS.bhd(85))
    eq('7.8.6  the debt is fully cleared', l200.outstanding, 0)

    // ── §7.5 · commission on the pre-VAT base, whichever way the price was entered ──
    const excl = HBS.orderStatement(HBS.order('ORD-0010'))   // 90.000 + VAT
    const incl = HBS.orderStatement(HBS.order('ORD-0011'))   // 110.000 VAT-inclusive
    eq('7.5.1  VAT-exclusive: base is the price', excl.base, HBS.bhd(90))
    eq('7.5.2  VAT-exclusive: commission on the base', excl.commission, HBS.bhd(2.7))
    eq('7.5.3  VAT-inclusive: VAT is taken back out', incl.base, HBS.round3(HBS.bhd(110) / 1.1))
    ok('7.5.4  commission never touches the VAT',
      excl.commission === HBS.round3(excl.base * excl.rate) &&
      incl.commission === HBS.round3(incl.base * incl.rate), 'both orders')

    // ── §7.6 · discount attribution ──
    const hbCoupon = HBS.orderStatement(HBS.order('ORD-0012'))
    ok('7.6.1  HB coupon does not reduce the commission base',
      hbCoupon.base === HBS.round3(HBS.bhd(60) / 1.1), m(hbCoupon.base))
    eq('7.6.2  HB coupon is added back to the seller’s receivable',
      hbCoupon.sellerReceivable,
      hbCoupon.buyerPays + HBS.bhd(6) - hbCoupon.commission - hbCoupon.deduction,
      'seller made whole')
    const sellerDisc = HBS.orderStatement(HBS.order('ORD-0013'))
    ok('7.6.3  seller-funded discount does not reduce the commission base',
      sellerDisc.base === HBS.round3(HBS.bhd(80) / 1.1), m(sellerDisc.base))
    eq('7.6.4  seller-funded discount is borne by the seller',
      sellerDisc.sellerDiscount, HBS.bhd(8))

    // ── §7.7 · rejected and cancelled items carry no commission ──
    const rej = HBS.orderStatement(HBS.order('ORD-0014'))
    eq('7.7.1  rejected line is excluded from the base', rej.base, HBS.bhd(90), '2 × 45.000')
    ok('7.7.2  the order says why the commission is lower',
      rej.droppedCount === 1 && rej.droppedValue > 0, rej.droppedCount + ' line dropped')
    const cancelled = HBS.orderStatement(HBS.order('ORD-0022'))
    eq('7.7.3  cancelled line is excluded too', cancelled.base, HBS.bhd(48))

    // ── §7.5 · the rate comes from the plan, and can step on volume ──
    ok('7.5.5  branch plan overrides the seller’s',
      HBS.planForOrder(HBS.order('ORD-0014')) === 'plan-growth', 'Muharraq is on Growth')
    ok('7.5.6  the volume tier applies past its threshold',
      rej.rate === 0.04, HBS.pct(rej.rate) + ' at 41 units')
    ok('7.5.7  below the threshold the base rate applies',
      HBS.rateFor('plan-growth', 10) === 0.03, HBS.pct(HBS.rateFor('plan-growth', 10)))

    // ── §7.8 · netting never pays out negative, and carries the remainder ──
    const l300 = HBS.ledger('S-300')
    ok('7.8.7  every payout is non-negative', l300.rows.every((r) => r.payout >= 0),
      l300.rows.map((r) => m(r.payout)).join(' · '))
    ok('7.8.8  debt beyond the prepaid order is carried, not lost',
      l300.outstanding > 0, m(l300.outstanding) + ' still outstanding')
    const offsetSum = HBS.sum(l300.rows.map((r) => r.offset))
    const codSum = HBS.sum(l300.rows.map((r) => r.hbReceivable))
    eq('7.8.9  recovered + outstanding = debt raised', offsetSum + l300.outstanding, codSum)

    // ── §7.2 · the seller ledger is cumulative, the buyer statement is not ──
    const cum = l300.rows.map((r) => r.balance)
    ok('7.2.1  the seller balance carries forward',
      cum.every((v, i) => i === 0 || v === cum[i - 1] + l300.rows[i].netPayable), cum.map(m).join(' → '))
    const bs = HBS.buyerStatement('C-02', 'order')
    ok('7.2.2  the buyer statement carries no running balance',
      bs.rows.every((r) => !('balance' in r)), bs.rows.length + ' orders')

    // ── §9 · no commission may reach a buyer screen ──
    const banned = ['commission', 'rate', 'hbReceivable', 'sellerReceivable', 'netPayable', 'offset', 'payout']
    let leaked = []
    for (const b of HBS.BUYERS) {
      const st = HBS.buyerStatement(b.id, 'order')
      for (const r of st.rows) leaked = leaked.concat(banned.filter((k) => k in r).map((k) => b.id + '.' + k))
    }
    ok('9.1  no commission field on any buyer row', leaked.length === 0, leaked.join(', ') || 'clean')

    // ── §7.1 · four reporting periods, all of which reconcile to the same money ──
    for (const p of ['yearly', 'monthly', 'weekly', 'order']) {
      const g = HBS.group(l300.rows, p)
      const tot = HBS.sum(g.map((x) => x.commission))
      const flat = HBS.sum(l300.rows.map((r) => r.commission))
      ok('7.1.' + p + '  grouping preserves the total', tot === flat, m(tot))
    }

    // ── §4, §11 · the module reports, it does not move money ──
    const c = HBS.cycle('S-300')
    ok('4.1  a cycle is a report, not an execution',
      typeof c.hbPaymentDue === 'number' && typeof c.sellerDue === 'number' &&
      !('execute' in c) && !('paid' in c), 'pay ' + m(c.hbPaymentDue) + ' · collect ' + m(c.sellerDue))
    ok('4.2  credit orders are not modelled',
      HBS.ORDERS.every((o) => o.paymentMethod === 'cod' || o.paymentMethod === 'hb_payment'),
      'only COD and HB Payment exist')

    // ── §7.9 · cadence is per seller ──
    ok('7.9.1  cadence is carried per seller',
      HBS.cycle('S-200').cadence.id === 'five_day' && HBS.cycle('S-300').cadence.id === 'weekly',
      'five_day · weekly')

    // ── Money formatting: three decimals, always ──
    const samples = [0, 1, HBS.bhd(85), HBS.bhd(-10), HBS.bhd(1234.5)]
    ok('fmt.1  every amount renders with 3 decimals',
      samples.every((v) => /^[−+]?[\d,]+\.\d{3}$/.test(HBS.money(v))),
      samples.map((v) => HBS.money(v)).join(' · '))

    const passed = R.filter((r) => r.pass).length
    const failed = R.length - passed
    const line = passed + ' passed · ' + failed + ' failed'
    if (typeof console !== 'undefined') {
      for (const r of R) if (!r.pass) console.error('FAIL  ' + r.id + '  ' + r.detail)
      console.log(line)
    }
    return { results: R.slice(), passed, failed, line }
  }

  return { run, results: () => R.slice() }
})
