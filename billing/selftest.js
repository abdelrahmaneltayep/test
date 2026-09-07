/**
 * Acceptance tests — §8 of the brief, as runnable assertions.
 *
 * These run on load in every surface and headless in Node. They are the reason the model
 * was built before any screen: a prototype whose numbers are wrong is worse than no
 * prototype, because it gets believed.
 *
 * Each test derives the figure it is defending. Nothing here compares a literal to the
 * same literal — where a test names 227.500, the left-hand side came out of the postings.
 *
 * The three invariants are enforced here as assertions over the model rather than as
 * copy, and two of them are checked at the data boundary rather than on a rendered page:
 * a rule that only holds if every future screen remembers it is not an invariant.
 */
;(function (root, factory) {
  const HB = root.HB || (typeof require !== 'undefined' ? require('./data.js') : null)
  const S = root.HBStrings || (typeof require !== 'undefined' ? require('./strings.js') : null)
  const api = factory(HB, S)
  root.HBTest = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function (HB, S) {
  'use strict'

  const M = (f) => HB.money(f)

  function run(opts) {
    const o = opts || {}
    const R = []
    const check = (n, name, got, want, note) =>
      R.push({ n: String(n), name, pass: got === want, got, want, note })

    // ══ Reconciliation ══════════════════════════════════════════════════════
    const b1042 = HB.balance('1042')
    check(1, 'Seller #1042 payable is exactly 227.500', M(b1042.payable), '227.500')

    const mix = HB.collectionMix('1042')
    const commission = HB.reconcile('1042').expectedTotal
    check(2, 'Identity 375.000 − 31.200 − 116.300 = 227.500 holds',
      M(mix.online - commission - b1042.paidOut), M(b1042.payable),
      M(mix.online) + ' − ' + M(commission) + ' − ' + M(b1042.paidOut))

    check(3.1, 'Seller-collected share is 63.9%', HB.pct(mix.direct, mix.net), '63.9%')
    check(3.2, 'Unsecured commission is 19.950', M(b1042.dues), '19.950')

    const filed = HB.balance('1042', { filing: 'as_filed' })
    const over = HB.overstatement('1042')
    check(4.1, 'As filed, the stated balance is 518.500', M(filed.statedBalance), '518.500')
    check(4.2, 'The overstatement is 291.000', M(over.amount), '291.000',
      HB.pct(over.shareOfBook, 1) + ' of the book · ' + over.timesCommission.toFixed(2) + '× commission earned')

    const recFiled = HB.reconcile('1042', { filing: 'as_filed' })
    const recRight = HB.reconcile('1042')
    check(5.1, 'Control FAILS as filed', recFiled.passes, false,
      'expected ' + M(recFiled.expectedTotal) + ' · actual ' + M(recFiled.actualTotal) + ' · delta ' + HB.money(recFiled.delta, { signed: true }))
    check(5.2, 'Control PASSES corrected', recRight.passes, true,
      'expected ' + M(recRight.expectedTotal) + ' · actual ' + M(recRight.actualTotal))

    const allFiled = HB.reconcileAll({ filing: 'as_filed' })
    check(6.1, 'Across the whole book, exactly one offender', allFiled.offenders.length, 1)
    check(6.2, 'The offender is RET-1007 by name', allFiled.offenders[0] && allFiled.offenders[0].orderId, 'RET-1007',
      allFiled.offenders[0] ? 'expected ' + M(allFiled.offenders[0].expected) + ' · actual ' + M(allFiled.offenders[0].actual) : '')

    // ══ Payout rule ═════════════════════════════════════════════════════════
    const b1067 = HB.balance('1067')
    check(7.1, 'Seller #1067 payable caps at 81.000', M(b1067.payable), '81.000',
      'book owes ' + M(b1067.bookOwed) + ' · cash held ' + M(b1067.cashBacked))
    check(7.2, 'Seller #1067 reports 0.300 unfunded', M(b1067.unfunded), '0.300')

    const m2001 = HB.highbaseMargin('ORD-2001')
    check(8, "Highbase's net on ORD-2001 is −6.300", M(m2001.net), '−6.300',
      'earned ' + M(m2001.earned) + ' · funded ' + M(m2001.funded))

    const b1103 = HB.balance('1103')
    check(9.1, 'Seller #1103 payable is 0.000', M(b1103.payable), '0.000')
    check(9.2, 'Seller #1103 dues are 159.000', M(b1103.dues), '159.000',
      'cash held ' + M(b1103.cashBacked) + ' — none of it recoverable by netting')

    // ══ Fourth state ════════════════════════════════════════════════════════
    const b1088 = HB.balance('1088')
    check(10.1, 'Seller #1088 awaiting is 300.000 gross', M(b1088.awaitingGross), '300.000')
    check(10.2, 'Seller #1088 awaiting is 291.000 net', M(b1088.awaitingNet), '291.000')
    /*
     * 54.600, not the 56.400 the brief first stated. The brief derived it as
     * "60.00 − 3.60 netted dues", which nets the dues on ORD-3002 but omits ORD-3003's
     * own commission — and ORD-3003 is Highbase-collected and immediate, so it accrues
     * like any other:
     *
     *     60.000 cash − 3.600 (ORD-3002 dues) − 1.800 (ORD-3003 commission) = 54.600
     *
     * The brief has been corrected to match its own formula, which is the one #1042's
     * anchor case depends on. See BRIEF-CORRECTIONS.md.
     */
    check(10.3, 'Seller #1088 payable is 54.600', M(b1088.payable), '54.600',
      M(b1088.cashBacked) + ' cash − 3.600 dues − 1.800 commission')

    const agentRun = HB.settlementRun('1088', { risk: 'agent' })
    const guarantorRun = HB.settlementRun('1088', { risk: 'guarantor' })
    check(11.1, 'Agent mode excludes ORD-3001 from the run', agentRun.included.indexOf('ORD-3001'), -1,
      'carried with reason: ' + (agentRun.carried.find((c) => c.orderId === 'ORD-3001') || {}).reason)
    check(11.2, 'Guarantor mode includes ORD-3001 at delivery', guarantorRun.included.indexOf('ORD-3001') >= 0, true,
      'net release ' + M(guarantorRun.net) + ' vs ' + M(agentRun.net) + ' in agent mode')

    check(12.1, 'Agent label is "Awaiting buyer"', S.stateLabel('awaiting', 'agent'), 'Awaiting buyer')
    check(12.2, 'Guarantor label is "Guaranteed — due"', S.stateLabel('awaiting', 'guarantor'), 'Guaranteed — due')

    // ══ Standing ════════════════════════════════════════════════════════════
    const grades = {}
    for (const s of HB.SELLERS) grades[s.id] = HB.standing(s.id)
    check(13.1, '#1042 stands good', grades['1042'].grade, 'good')
    check(13.2, '#1067 stands watch', grades['1067'].grade, 'watch')
    check(13.3, '#1088 stands watch', grades['1088'].grade, 'watch')
    check(13.4, '#1103 stands suspended', grades['1103'].grade, 'suspended')

    const trigger = (id) => (grades[id].triggers[0] || {}).input
    check(14.1, '#1067 is triggered by discount ratio', trigger('1067'), 'discountRatio',
      grades['1067'].inputs.discountRatio.value.toFixed(3) + ' ≥ 1.000')
    check(14.2, '#1088 is triggered by online share', trigger('1088'), 'onlineShare',
      HB.pct(grades['1088'].inputs.onlineShare.value, 1) + ' < 30.0%')
    check(14.3, '#1103 is triggered by arrears ratio', trigger('1103'), 'arrearsRatio',
      grades['1103'].inputs.arrearsRatio.value.toFixed(3) + ' ≥ 1.000')
    check(14.4, 'Every non-good standing names a cause',
      HB.SELLERS.every((s) => grades[s.id].grade === 'good' || grades[s.id].triggers.length > 0), true)

    // ══ Invariants ══════════════════════════════════════════════════════════
    /*
     * 1 — a seller is never charged commission on a discount Highbase funded. Checked over
     * every order in the book, in both risk modes, rather than over the one seeded example.
     */
    const funded = HB.ORDERS.filter((o) => o.discount && o.discount.funder === 'highbase')
    const badBase = funded.filter((o) => HB.commissionBase(o) !== o.grossValue)
    check(15, 'Invariant 1 — funded discounts never reduce the commission base', badBase.length, 0,
      funded.length + ' funded order(s) checked')

    /*
     * 2 — a buyer never sees commission. Enforced at the boundary: `buyerView` is the only
     * shape a buyer screen may read, and the check walks it for the concept rather than
     * trusting a template. The DOM half runs once a buyer surface exists.
     */
    const leaked = []
    const walk = (v, path) => {
      if (v === null || v === undefined) return
      if (typeof v === 'object') {
        for (const key of Object.keys(v)) {
          if (/commission|rate_?card|rateCard|margin|payable|dues/i.test(key)) leaked.push(path + '.' + key)
          walk(v[key], path + '.' + key)
        }
      }
    }
    for (const b of HB.BUYERS) walk(HB.buyerView(b.id), b.id)
    check(16.1, 'Invariant 2 — the buyer projection carries no commission', leaked.length, 0, leaked.join(' '))
    if (typeof document !== 'undefined' && document.body && document.body.dataset.role === 'buyer') {
      const text = document.body.innerText || ''
      check(16.2, 'Invariant 2 — no buyer screen renders commission', /commission/i.test(text), false)
    } else {
      R.push({ n: '16.2', name: 'Invariant 2 — no buyer screen renders commission', skip: true, note: 'runs on the buyer surface' })
    }

    /*
     * 3 — Finance never pays out more than the cash held. Checked for every seller in
     * every combination of the two modes, because a rule that holds in the demo path and
     * not in the other three is not a rule.
     */
    const breaches = []
    for (const s of HB.SELLERS) {
      for (const filing of HB.FILINGS) {
        for (const risk of HB.RISK_MODES) {
          const run = HB.settlementRun(s.id, { filing, risk })
          if (run.net > run.cashBacked) breaches.push(s.id + '/' + filing + '/' + risk + ' ' + M(run.net) + ' > ' + M(run.cashBacked))
        }
      }
    }
    check(17, 'Invariant 3 — no run releases more than the cash held', breaches.length, 0,
      HB.SELLERS.length * 4 + ' seller/mode combinations checked')

    /*
     * Separation of duties (§6 screen 15). Not one of the eighteen, but the same kind of
     * rule and checked the same way: over every adjustment in every mode, an approval by
     * the issuer must be impossible. Ops issues; Finance approves; nobody does both.
     */
    const dutyBreaches = []
    for (const filing of HB.FILINGS) {
      for (const risk of HB.RISK_MODES) {
        for (const adj of HB.adjustments({ filing, risk })) {
          for (const who of HB.ADMIN_ROLES) {
            const v = HB.canApprove(adj, who)
            if (v.allowed && who === adj.issuedBy) dutyBreaches.push(adj.id + ' approved by its issuer ' + who)
            if (v.allowed && who !== 'finance') dutyBreaches.push(adj.id + ' approved by ' + who)
          }
        }
      }
    }
    check(17.2, 'Separation of duties — the issuer can never approve', dutyBreaches.length, 0,
      HB.adjustments().length + ' adjustment(s) × ' + (HB.FILINGS.length * HB.RISK_MODES.length) + ' modes × ' + HB.ADMIN_ROLES.length + ' roles')

    /*
     * The RET-1007 error decomposes into two legs, and the leverage between them is not a
     * coincidence — it is 1/rate. Pinning it means the claim on the control screen stays
     * true if the rate card ever changes.
     */
    const anat = HB.errorAnatomy('1042', 'RET-1007')
    check(17.3, 'The cash leg outweighs the commission leg by exactly 1/rate',
      anat.leverage.toFixed(4), anat.impliedByRate.toFixed(4),
      'cash ' + HB.money(anat.cashDelta, { signed: true }) + ' · commission ' + HB.money(anat.commissionDelta, { signed: true }) + ' · total ' + HB.money(anat.total, { signed: true }))

    /*
     * Invoicing. The threshold is measured on the taxable amount, before VAT — and
     * ORD-1006 is the case that proves it rather than merely illustrating it: priced at
     * exactly 500.000, it lands at 550.000 with VAT, so the two readings put it on
     * opposite sides. Pinned here because a boundary this close is one someone will
     * "correct" back on a fast read.
     */
    const inv1006 = HB.invoices('B-203').find((i) => i.orderId === 'ORD-1006')
    check(19.1, 'The simplified threshold is measured on the taxable amount', inv1006.simplifiedPermitted, true,
      'taxable ' + M(inv1006.taxableAmount) + ' at the limit · total ' + M(inv1006.totalPayable) + ' over it')
    const inv4002 = HB.invoices('B-203').find((i) => i.orderId === 'ORD-4002')
    check(19.2, 'Above the threshold the full invoice is mandatory', inv4002.simplifiedPermitted, false,
      'taxable ' + M(inv4002.taxableAmount))
    check(19.3, 'VAT is charged at 10% of the taxable amount',
      M(inv4002.vatAmount), M(HB.round3(inv4002.taxableAmount * 0.10)),
      M(inv4002.taxableAmount) + ' + ' + M(inv4002.vatAmount) + ' = ' + M(inv4002.totalPayable))

    /*
     * A part-payment has to be consistent in three places at once, or the prototype tells
     * three different stories about the same 165.000: the buyer's invoice, the seller's
     * accrued commission, and what is still awaiting the buyer.
     */
    const partial = HB.invoices('B-204').find((i) => i.orderId === 'ORD-6001')
    check(20.1, 'A part-paid invoice reads partially_paid', partial.subStatus, 'partially_paid',
      M(partial.amountPaid) + ' of ' + M(partial.totalPayable))
    check(20.2, 'Its outstanding balance is the remainder', M(partial.amountOutstanding), '165.000')
    const b1134 = HB.balance('1134')
    check(20.3, 'Half collected accrues half the commission', M(HB.accruedCommission(HB.order('ORD-6001'), HB.rateCard('rc-v1'), {})), '4.500',
      'full commission would be 9.000')
    check(20.4, 'The paid half becomes cash, the rest stays awaiting',
      M(b1134.cashBacked) + ' / ' + M(b1134.awaitingGross), '250.000 / 150.000',
      'payable ' + M(b1134.payable))
    check(20.5, 'The buyer’s exposure is the outstanding amount, not the invoice total',
      M(HB.creditAccount('B-204').exposure), '165.000')

    /*
     * Two fixes worth pinning, both the same mistake at different depths: reading
     * `collected()` — which is risk-mode aware because it describes the seller's position
     * — to answer a question about what the buyer owes.
     */
    check(20.6, 'An invoice’s status does not change with the risk model',
      HB.invoices('B-204', { risk: 'guarantor' }).map((i) => i.status).join(','),
      HB.invoices('B-204', { risk: 'agent' }).map((i) => i.status).join(','),
      'a guarantee is between Highbase and the seller; the buyer still owes what they owe')
    const gEx = HB.buyerExposure({ risk: 'guarantor' })
    check(20.7, 'Buyer exposure counts what the buyer has actually paid',
      M((gEx.rows.find((r) => r.buyerId === 'B-204') || {}).outstanding), '165.000',
      'the full order is 330.000; 165.000 of it is paid')
    check(20.8, 'Agent mode carries no buyer exposure at all', HB.buyerExposure({ risk: 'agent' }).applicable, false)

    // ── 18 — three decimals, always ────────────────────────────────────────
    const shapes = [0, 1, 999, 1000, -1000, 45500, 1190000, -4500, 81000, 227500, 5300000]
    const badFormat = shapes.map((f) => HB.money(f)).filter((s) => !/^−?[\d,]+\.\d{3}$/.test(s))
    check(18.1, 'The formatter always emits exactly 3 decimals', badFormat.length, 0, badFormat.join(' '))

    if (typeof document !== 'undefined') {
      const nodes = Array.from(document.querySelectorAll('[data-money]'))
      const bad = nodes.map((n) => n.textContent.trim())
        .filter((t) => t && !/^[−+]?[\d,]+\.\d{3}(\s?BHD)?$/.test(t))
      check(18.2, 'Every money value on the page renders 3 decimals', bad.length, 0,
        nodes.length + ' checked' + (bad.length ? ' · ' + bad.slice(0, 5).join(' | ') : ''))
    } else {
      R.push({ n: '18.2', name: 'Every money value on the page renders 3 decimals', skip: true, note: 'no DOM — runs in the browser' })
    }

    const failed = R.filter((r) => !r.skip && !r.pass)
    if (!o.quiet) print(R, failed)
    return { results: R, failed, ok: failed.length === 0 }
  }

  function print(R, failed) {
    const line = (r) => {
      const tag = r.skip ? 'skip' : r.pass ? 'pass' : 'FAIL'
      const got = r.skip ? '' : r.pass ? String(r.got) : 'got ' + JSON.stringify(r.got) + ', expected ' + JSON.stringify(r.want)
      return ['  ' + tag, r.n.padEnd(5), r.name.padEnd(56), got, r.note ? '· ' + r.note : ''].join(' ')
    }
    const out = ['', 'Highbase Billing — acceptance tests', ''].concat(R.map(line))
    out.push('',
      R.filter((r) => r.pass).length + ' passed · ' + failed.length + ' failed · ' +
      R.filter((r) => r.skip).length + ' skipped', '')
    if (typeof console !== 'undefined') console.log(out.join('\n'))
  }

  return { run, print }
})
