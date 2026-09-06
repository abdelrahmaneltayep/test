/**
 * Acceptance tests — §8 of the brief, as runnable assertions.
 *
 * These run on load in every surface and print to the console, and they run headless in
 * Node. They are the reason the model was built before any screen: a prototype whose
 * numbers are wrong is worse than no prototype, because it gets believed.
 *
 * Each test states the figure it is defending and derives it. Nothing here compares a
 * literal to the same literal — where a test names 227.500, the left-hand side has been
 * computed from the postings.
 */
;(function (root, factory) {
  const api = factory(root.HB || (typeof require !== 'undefined' ? require('./data.js') : null))
  root.HBTest = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function (HB) {
  'use strict'

  function run(opts) {
    const o = opts || {}
    const results = []
    const check = (n, name, got, want, note) => {
      const pass = got === want
      results.push({ n, name, pass, got, want, note })
    }

    // 1 — the headline figure, derived from postings and nothing else.
    const b1042 = HB.balance('1042', 'corrected')
    check(1, 'Seller #1042 payable is exactly 227.500', HB.money(b1042.payable), '227.500')

    // 2 — the identity, from derived values rather than literals.
    const mix = HB.collectionMix('1042')
    const commission = HB.reconcile('1042', 'corrected').expectedTotal
    const paidOut = b1042.paidOut
    check(2, 'Identity 375.000 − 31.200 − 116.300 = 227.500 holds',
      HB.money(mix.byHighbase - commission - paidOut), HB.money(b1042.payable),
      HB.money(mix.byHighbase) + ' − ' + HB.money(commission) + ' − ' + HB.money(paidOut))

    // 3 — the collection mix and the exposure it creates.
    check(3.1, 'Seller-collected share is 63.9%', HB.pct(mix.bySeller, mix.net), '63.9%')
    check(3.2, 'Unsecured commission is 19.950', HB.money(b1042.owedToHighbase), '19.950')

    // 4 — what the mis-filed return does to the stated balance.
    const filed = HB.balance('1042', 'as_filed')
    const over = HB.overstatement('1042')
    check(4.1, 'As filed, the stated balance is 518.500', HB.money(filed.statedBalance), '518.500')
    check(4.2, 'The overstatement is 291.000', HB.money(over.amount), '291.000',
      HB.pct(over.shareOfBook, 1) + ' of the book · ' + over.timesCommission.toFixed(2) + '× commission earned')

    // 5 — the control does its job in both directions. A control that only ever fails is
    //     not a control; it has to pass on a clean book or nobody trusts the alarm.
    const recFiled = HB.reconcile('1042', 'as_filed')
    const recRight = HB.reconcile('1042', 'corrected')
    check(5.1, 'Reconciliation control FAILS as filed', recFiled.passes, false,
      'expected ' + HB.money(recFiled.expectedTotal) + ' · actual ' + HB.money(recFiled.actualTotal) + ' · delta ' + HB.money(recFiled.delta, { signed: true }))
    check(5.2, 'Reconciliation control PASSES corrected', recRight.passes, true,
      'expected ' + HB.money(recRight.expectedTotal) + ' · actual ' + HB.money(recRight.actualTotal))

    // 6 — it names the row. "A mismatch exists" is not an investigation.
    check(6.1, 'The control identifies exactly one offender', recFiled.offenders.length, 1)
    check(6.2, 'The offender is RET-1007 by name', recFiled.offenders[0] && recFiled.offenders[0].orderId, 'RET-1007',
      recFiled.offenders[0] ? 'expected ' + HB.money(recFiled.offenders[0].expected) + ' · actual ' + HB.money(recFiled.offenders[0].actual) : '')

    // 7 — the payout rule, where it bites.
    const b1067 = HB.balance('1067', 'corrected')
    check(7.1, 'Seller #1067 payable caps at 81.000', HB.money(b1067.payable), '81.000',
      'book owes ' + HB.money(b1067.bookOwed) + ' · cash held ' + HB.money(b1067.cashBacked))
    check(7.2, 'Seller #1067 reports 0.300 unfunded', HB.money(b1067.unfunded), '0.300')

    // 8 — a funded discount above the commission rate is loss-making by construction.
    check(8, "Highbase's net on ORD-2001 is −6.300", HB.money(HB.highbaseMargin('ORD-2001').net), '−6.300',
      'earned ' + HB.money(HB.highbaseMargin('ORD-2001').earned) + ' · funded ' + HB.money(HB.highbaseMargin('ORD-2001').funded))

    // 9 — three decimals, always.
    //     Two parts: the formatter itself over awkward inputs, and — once a surface has
    //     rendered — every money element actually on the page. The DOM half only runs in a
    //     browser; in Node it is reported as not applicable rather than as a silent pass.
    const shapes = [0, 1, 999, 1000, -1000, 45500, 1190000, -4500, 81000, 227500]
    const badFormat = shapes.map((f) => HB.money(f)).filter((s) => !/^−?[\d,]+\.\d{3}$/.test(s))
    check(9.1, 'The formatter always emits exactly 3 decimals', badFormat.length, 0, badFormat.join(' '))

    if (typeof document !== 'undefined') {
      const nodes = Array.from(document.querySelectorAll('[data-money]'))
      const bad = nodes
        .map((n) => n.textContent.trim())
        .filter((t) => t && !/^[−+]?[\d,]+\.\d{3}(\s?BHD)?$/.test(t))
      check(9.2, 'Every money value on the page renders 3 decimals', bad.length, 0,
        nodes.length + ' checked' + (bad.length ? ' · ' + bad.slice(0, 5).join(' | ') : ''))
    } else {
      results.push({ n: 9.2, name: 'Every money value on the page renders 3 decimals', skip: true, note: 'no DOM — runs in the browser' })
    }

    const failed = results.filter((r) => !r.skip && !r.pass)
    if (!o.quiet) print(results, failed)
    return { results, failed, ok: failed.length === 0 }
  }

  function print(results, failed) {
    const line = (r) => {
      const tag = r.skip ? 'skip' : r.pass ? 'pass' : 'FAIL'
      const got = r.skip ? '' : r.pass ? String(r.got) : 'got ' + JSON.stringify(r.got) + ', want ' + JSON.stringify(r.want)
      return ['  ' + tag, String(r.n).padEnd(4), r.name.padEnd(52), got, r.note ? '· ' + r.note : ''].join(' ')
    }
    const out = ['', 'Highbase Billing — acceptance tests', ''].concat(results.map(line))
    out.push('', results.filter((r) => r.pass).length + ' passed · ' + failed.length + ' failed · ' + results.filter((r) => r.skip).length + ' skipped', '')
    const text = out.join('\n')
    if (typeof console !== 'undefined') console.log(text)
    return text
  }

  return { run, print }
})
