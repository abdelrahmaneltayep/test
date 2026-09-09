;(function (root) {
  'use strict'

  /**
   * Buyer surface.
   *
   * Two rules from the BRD shape everything here (§7.2, §9): the statement is NOT
   * cumulative — there is no running balance and no carried figure — and no commission
   * appears anywhere. Both are enforced upstream: the rows come from
   * HBS.buyerStatement(), which builds its own objects rather than filtering the seller
   * ledger, and the shared order drawer is opened with role 'buyer', which never builds a
   * commission stage.
   */

  const HBS = root.HBS
  const S = root.HBSStrings
  const U = root.HBSUI
  const el = U.el

  function start() {
    const buyerId = U.getParam('buyer', 'C-02')
    const b = HBS.buyer(buyerId)

    const buyerPicker = el('select', {
      class: 'hs-select', 'aria-label': S.common.buyer,
      onchange: (e) => U.setParam('buyer', e.target.value),
    }, HBS.BUYERS.map((x) => el('option', { value: x.id, selected: x.id === buyerId ? '' : null }, x.name)))

    const nav = [{
      label: 'Orders',
      items: [{ href: U.href('/orders'), label: S.buyer.statement, icon: '≡' }],
    }]

    U.router({
      '/orders': { title: S.buyer.statement, sub: S.buyer.statementSub, nav: '/orders', view: orders },
      '/orders/:id': { title: 'Order', sub: '', nav: '/orders', view: (p) => orderDetail(p.id) },
    }, {
      home: '/orders',
      render(route, params) {
        U.clear(document.body)
        const r = route || { title: S.common.notFound, sub: '', nav: null, view: () => U.empty(S.common.notFound, S.common.notFoundNote) }
        const content = U.shell({
          role: 'buyer',
          personaRole: S.common.buyer, personaName: b.name,
          title: params.id ? S.fill(S.buyer.orderDetail, { id: params.id }) : r.title,
          subtitle: b.name,
          nav: nav.map((g) => ({ label: g.label, items: g.items.map((i) => Object.assign({}, i, { current: i.href === '#' + r.nav })) })),
          controls: [
            el('span', { class: 'hs-filter-label' }, S.common.buyer), buyerPicker,
            el('span', { class: 'hs-filter-label' }, S.common.period), U.periodSwitch(),
          ],
        })
        content.appendChild(r.view(params))
      },
    })

    function orders() {
      const st = HBS.buyerStatement(buyerId, U.period())
      if (!st.rows.length) return U.empty(S.common.empty, 'This account has no orders yet.')
      return el('div', { class: 'hs-stack' }, [
        U.note('Not a ledger',
          'The BRD names this as the structural difference from the seller statement (§7.2): each order’s payment stands on its own, with no running account balance.'),
        el('div', { class: 'hs-figures' }, [
          U.figure({ tone: 'info', label: S.buyer.paid, value: st.total, note: 'Across ' + st.rows.length + ' orders. Not a balance — a sum of what you paid.' }),
        ]),
        U.banner('info', null, S.buyer.notCumulative),
        U.buyerTable(st, b, 'buyer'),
      ])
    }

    function orderDetail(id) {
      const o = HBS.order(id)
      if (!o || o.buyerId !== buyerId) return U.empty(S.common.notFound, S.common.notFoundNote)
      return el('div', { class: 'hs-stack' }, [
        el('a', { class: 'hs-btn hs-btn--quiet hs-noprint', href: U.href('/orders') }, S.fill(S.common.backTo, { label: S.buyer.statement })),
        U.card({
          title: S.fill(S.buyer.orderDetail, { id }),
          note: HBS.seller(o.sellerId).name + ' · ' + o.date,
          actions: [el('button', { class: 'hs-btn hs-btn--sm', type: 'button', onclick: () => window.print() }, S.common.exportPdf)],
          body: U.orderBreakdown(id, { role: 'buyer' }),
        }),
      ])
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
})(typeof globalThis !== 'undefined' ? globalThis : this)
