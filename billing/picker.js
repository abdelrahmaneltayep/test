;(function (root) {
  root.HBApps = root.HBApps || {}
  /**
   * The role picker, and where the modes are set before entering a surface.
   *
   * Its own file rather than an inline script, so the single-file build can carry it like
   * the other three instead of the bundle having a fourth shape to special-case.
   */
  root.HBApps.picker = function (HB, S, U) {
    'use strict'
      /*
       * Role picker, and the place the two unresolved decisions are set before entering a
       * surface. They ride on the query string from here, so every link out of this page
       * carries the assumptions the reviewer chose — a screenshot of a surface can be
       * traced back to the mode it was taken under.
       */
      
        const el = U.el
        const m = U.modes()

        const roleCard = (role, name, note, mark) =>
          el('a', { class: 'hb-card hb-pick-card', href: U.pageHref(role) }, [
            el('div', { class: 'hb-pick-mark', 'aria-hidden': 'true' }, mark),
            el('h2', {}, name),
            el('p', {}, note),
          ])

        // A live figure on the picker, so the modes visibly do something before you commit
        // to a surface. Both come out of data.js like everything else.
        const b1088 = HB.balance('1088', m)
        const over = HB.overstatement('1042', m)

        document.body.appendChild(el('div', { class: 'hb-pick' },
          el('div', { class: 'hb-pick-inner' }, [
            el('h1', {}, S.personas.title),
            el('p', {}, S.personas.lead),

            el('div', { class: 'hb-card', style: { padding: '16px 18px', marginBottom: '22px' } }, [
              el('div', { style: { display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center' } }, [
                U.riskToggle(),
                el('span', { class: 'hb-filter-label', style: { marginInlineStart: '6px' } }, S.common.filing),
                U.filingToggle(),
              ]),
              el('p', { class: 'hb-sub', style: { marginTop: '12px' } }, S.risk.banner),
              el('p', { class: 'hb-sub', style: { marginTop: '8px' } }, [
                'Right now: Sitra Industrial Tools releases ',
                U.money(HB.settlementRun('1088', m).net, { currency: true }),
                ' under this risk model, and the mis-filed return overstates Gulf Metal Supplies by ',
                U.money(over.amount, { currency: true }), '.',
              ]),
            ]),

            el('div', { class: 'hb-pick-grid' }, [
              roleCard('buyer', S.personas.buyer, S.personas.buyerNote, '◇'),
              roleCard('seller', S.personas.seller, S.personas.sellerNote, '◆'),
              roleCard('admin', S.personas.admin, S.personas.adminNote, '◈'),
            ]),
          ])))

        if (window.HBTest) window.HBTest.run()
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
