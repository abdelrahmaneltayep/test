;(function (root) {
  'use strict'

  /**
   * The role picker.
   *
   * Its own file rather than an inline script, so the single-file build can carry it like
   * the other three instead of the bundle needing a fourth shape to special-case.
   */

  const HBS = root.HBS
  const S = root.HBSStrings
  const U = root.HBSUI
  const el = U.el

  function start() {
    const l = HBS.ledger('S-200')
    const orderB = l.rows[1]

    const roleCard = (role, name, note, mark) =>
      el('a', {
        class: 'hs-card hs-pick-card', href: U.pageHref(role),
        onclick: (e) => { if (root.HBS_SINGLE) { e.preventDefault(); U.goRole(role, U.pageHref(role)) } },
      }, [
        el('div', { class: 'hs-pick-mark', 'aria-hidden': 'true' }, mark),
        el('h2', {}, name),
        el('p', {}, note),
      ])

    document.body.appendChild(el('div', { class: 'hs-pick' },
      el('div', { class: 'hs-pick-inner' }, [
        el('h1', {}, S.picker.title),
        el('p', {}, S.picker.lead),

        el('div', { class: 'hs-card', style: { padding: '16px 18px', marginBottom: '22px' } }, [
          el('p', { class: 'hs-sub', style: { marginTop: '0' } }, [
            el('b', {}, S.scope.lead + ' '), S.scope.body,
          ]),
          // The BRD's worked example, computed from the seed rather than typed — the
          // quickest proof on the page that the model behind it is actually running.
          el('p', { class: 'hs-sub', style: { marginTop: '10px' } }, [
            'The BRD’s worked example (§7.8), computed rather than typed: a COD order books ',
            U.money(l.rows[0].hbReceivable, { currency: true }),
            ' of backdated commission, and the next prepaid order nets it — deducting ',
            U.money(orderB.commission + orderB.offset, { currency: true }),
            ' and releasing ', U.money(orderB.payout, { currency: true }), '.',
          ]),
        ]),

        el('div', { class: 'hs-pick-grid' }, [
          roleCard('buyer', S.picker.buyer, S.picker.buyerNote, '◇'),
          roleCard('seller', S.picker.seller, S.picker.sellerNote, '◆'),
          roleCard('admin', S.picker.admin, S.picker.adminNote, '◈'),
        ]),
      ])))

    if (root.HBSTest) root.HBSTest.run()
  }

  root.HBSApps = root.HBSApps || {}
  root.HBSApps.picker = start
  if (!root.HBS_SINGLE) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
    else start()
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
