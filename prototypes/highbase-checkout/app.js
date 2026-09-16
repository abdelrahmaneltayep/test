/* Highbase — checkout proposal prototype.
   Covers all 26 findings in "HIGHBASE checkout evaluation" (Sep 2026).
   Finding IDs appear in comments as [C1], [A7], [P3] … so each change is traceable.
   State-driven; every interaction is live. No framework. */
(function () {
  'use strict';

  var ic = function (n, cls) {
    return '<svg class="hb-i ' + (cls || '') + '" aria-hidden="true"><use href="#hb-i-' + n + '"/></svg>';
  };
  var money = function (n) { return 'BHD ' + n.toFixed(3); };
  var pcs = function (n) { return n + (n === 1 ? ' pc' : ' pcs'); };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  var VAT_RATE = 0.10; // Bahrain VAT, included in listed prices (the live cart says "Inclusive of VAT")

  /* ---------------------------------------------------------------- data */
  // Catalogue, prices, minimum order and the BHD 10 delivery fee are (live) —
  // from the 10 Sep 2026 recording. Piece counts come from the pack labels.
  // Stock beyond the observed "Only 1 item in stock" is (proposal).
  var SUPPLIERS = [
    {
      id: 'nadec', name: 'Nadec Distribution — Bahrain', mov: 10.0, delivery: 10.0,
      items: [
        { id: 'a1', name: 'Nadec Vanilla Flavored Milk 125ml', pack: '125ML', pieces: 18, price: 1.0, qty: 7, stock: 1, sel: true, tone: '#e8d9b5' },
        { id: 'a2', name: 'Nadec Long Life Low Fat UHT Milk 200ml', pack: '200ML', pieces: 18, price: 1.0, qty: 1, stock: 40, sel: true, tone: '#c5d8ee' },
        { id: 'a3', name: 'Nadec Long Life Skimmed UHT Milk 1L', pack: '1 Liter', pieces: 1, price: 1.0, qty: 1, stock: 60, sel: true, tone: '#dcc9e8' },
        { id: 'a4', name: 'Nadec Fresh Mango Flavored Milk 200ml', pack: '200ML', pieces: 6, price: 1.0, qty: 1, stock: 25, sel: true, tone: '#f2d79a' },
        { id: 'a5', name: 'Nadec Fresh Full Fat Milk 360ml', pack: '360ML', pieces: 6, price: 1.0, qty: 1, stock: 30, sel: true, tone: '#cfe2f2' }
      ],
      // [R2] discounts name their source and value, never an internal code
      discounts: [{ code: 'ALMANAR2', label: 'Supplier coupon', amount: 2.0 }]
    },
    {
      id: 'gulf', name: 'Gulf Fresh Trading', mov: 15.0, delivery: 5.0,
      items: [
        { id: 'b1', name: 'Almarai Fresh Laban 1L', pack: '1 Liter', pieces: 6, price: 3.25, qty: 4, stock: 18, sel: true, tone: '#d7ead7' },
        { id: 'b2', name: 'Al Ain Natural Water 500ml', pack: '500ML', pieces: 24, price: 2.4, qty: 2, stock: 90, sel: true, tone: '#cfe6f5' }
      ],
      discounts: []
    }
  ];

  var CATALOGUE = { 'NDC-125-18': 'Nadec Vanilla Flavored Milk 125ml', 'NDC-1L-SK': 'Nadec Long Life Skimmed UHT Milk 1L', 'GLF-LBN-1L': 'Almarai Fresh Laban 1L' };

  var SLOTS = [
    { id: 'am', label: '08:00 – 12:00', cap: 'Plenty of capacity' },
    { id: 'pm', label: '12:00 – 16:00', cap: 'Filling up' },
    { id: 'eve', label: '16:00 – 20:00', cap: 'Plenty of capacity' }
  ];

  var S = {
    screen: 'cart',            // cart | details | payment
    lang: 'en', dir: 'ltr',
    verified: true,            // [A2] verification is an account property
    suppliers: JSON.parse(JSON.stringify(SUPPLIERS)),
    branch: { name: 'Buyer', phone: '973 908070605', email: 'branch@highbaseco.com' },
    address: { country: 'Bahrain', state: 'Capital', city: 'Manama', street: '18', building: '19', zip: '11111' },
    pin: { lat: 26.2285, lng: 50.586 },
    editing: null,
    purchase: { po: '', costCentre: '', invoiceEmail: '' },   // [A8]
    slots: {},                 // supplierId -> {day, slot}     [A7]
    couponInput: '',
    lists: [],
    sku: '',
    docs: {},
    errors: {},
    placing: false,
    order: null,
    receipt: null,
    payLater: false,
    deadline: null,
    dialog: null
  };

  /* ----------------------------------------------------------- selectors */
  var allItems = function () { return S.suppliers.reduce(function (a, s) { return a.concat(s.items); }, []); };
  var selected = function (sup) { return sup.items.filter(function (i) { return i.sel; }); };
  var lineOk = function (i) { return i.qty <= i.stock; };
  // [C1] a line in conflict with stock contributes nothing until it is resolved
  var lineTotal = function (i) { return lineOk(i) ? i.price * i.qty : null; };
  var supItems = function (sup) { return selected(sup).reduce(function (t, i) { return t + (lineTotal(i) || 0); }, 0); };
  var supDiscount = function (sup) {
    return selected(sup).length ? sup.discounts.reduce(function (t, d) { return t + d.amount; }, 0) : 0;
  };
  var movGap = function (sup) { return Math.max(0, sup.mov - supItems(sup)); };
  var supConflicts = function (sup) { return selected(sup).filter(function (i) { return !lineOk(i); }); };
  // [C6] readiness is per supplier — a short supplier must not stall the rest
  var isReady = function (sup) {
    return selected(sup).length > 0 && movGap(sup) <= 0.0005 && supConflicts(sup).length === 0;
  };
  var readySuppliers = function () { return S.suppliers.filter(isReady); };
  var heldSuppliers = function () {
    return S.suppliers.filter(function (s) { return selected(s).length > 0 && !isReady(s); });
  };

  // [R1] one summary hierarchy — items, delivery, discounts, total, VAT — used on every screen
  function totals(list) {
    var sups = list || readySuppliers();
    var items = sups.reduce(function (t, s) { return t + supItems(s); }, 0);
    var delivery = sups.reduce(function (t, s) { return t + s.delivery; }, 0);
    var discounts = [];
    sups.forEach(function (s) {
      s.discounts.forEach(function (d) { discounts.push({ code: d.code, label: d.label, amount: d.amount, sup: s.name }); });
    });
    var disc = discounts.reduce(function (t, d) { return t + d.amount; }, 0);
    var total = Math.max(0, items + delivery - disc);
    return {
      items: items, delivery: delivery, discounts: discounts, disc: disc, total: total,
      vat: total * VAT_RATE / (1 + VAT_RATE),
      lines: sups.reduce(function (t, s) { return t + selected(s).length; }, 0),
      sups: sups.length
    };
  }
  var cartCount = function () { return allItems().reduce(function (t, i) { return t + (i.sel ? i.qty : 0); }, 0); };

  /* -------------------------------------------------------------- toasts */
  var snackHost;
  function snack(msg, status, action) {
    var el = document.createElement('div');
    el.className = 'snack';
    el.setAttribute('data-status', status || 'info');
    var glyph = status === 'success' ? 'success' : status === 'error' ? 'error' : 'info';
    el.innerHTML = '<span class="snack__icon">' + ic(glyph) + '</span><span class="grow">' + esc(msg) + '</span>' +
      (action ? '<button class="hb-btn" data-intent="primary" data-style="ghost" data-size="sm" data-snack-action><span class="hb-btn__label">' + esc(action.label) + '</span></button>' : '') +
      '<button class="hb-btn hb-icon-btn" data-intent="secondary" data-style="ghost" data-size="sm" aria-label="Dismiss" data-snack-close><span class="hb-btn__icon">' + ic('close') + '</span></button>';
    snackHost.appendChild(el);
    var kill = function () { if (el.parentNode) el.parentNode.removeChild(el); };
    var t = setTimeout(kill, action ? 8000 : 4000);
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-snack-action]')) { clearTimeout(t); kill(); action.run(); }
      if (e.target.closest('[data-snack-close]')) { clearTimeout(t); kill(); }
    });
  }

  var lastFocus = null;
  function openDialog(cfg) { S.dialog = cfg; lastFocus = document.activeElement; render(); }
  function closeDialog() { S.dialog = null; render(); if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  /* --------------------------------------------------------------- chrome */
  function appBar() {
    return '<div class="app-bar"><span class="app-bar__logo">HIGHBASE</span>' +
      '<span class="muted">' + (S.lang === 'ar' ? 'السوق' : 'Marketplace') + '</span>' +
      '<span class="app-bar__spacer"></span>' +
      '<span class="app-bar__cart">' + ic('cart') + (cartCount() ? '<span class="app-bar__count">' + cartCount() + '</span>' : '') + '</span>' +
      '<span class="pill" data-tone="neutral">' + ic('user') + ' Buyer Bahrain</span></div>';
  }

  // [A4] one indicator, three counted steps, no competing markers
  var STEPS = [
    { k: 'cart', t: 'Cart', s: 'Items and suppliers' },
    { k: 'details', t: 'Delivery & purchase details', s: 'Address, slots, payment' },
    { k: 'payment', t: 'Payment', s: 'Transfer and receipt' }
  ];
  function stepper() {
    var cur = STEPS.map(function (s) { return s.k; }).indexOf(S.screen);
    return '<ol class="stepper">' + STEPS.map(function (st, i) {
      var state = i === cur ? 'current' : i < cur ? 'done' : 'todo';
      return '<li class="stepper__item" data-state="' + state + '"' + (state === 'current' ? ' aria-current="step"' : '') + '>' +
        '<button class="stepper__btn" data-act="goto" data-screen="' + st.k + '" ' + (i > cur ? 'disabled' : '') + '>' +
        '<span class="stepper__num">' + (state === 'done' ? ic('check') : (i + 1)) + '</span>' +
        '<span class="stepper__label"><b>' + st.t + '</b><span>' + st.s + '</span></span></button></li>';
    }).join('') + '</ol>';
  }

  /* -------------------------------------------------------------- summary */
  // [A1] present on every screen · [C2] delivery itemised from the cart onward
  function summaryCard(cta) {
    var T = totals();
    var held = heldSuppliers();
    return '<div class="card">' +
      '<h2 class="card__title" style="margin-block-end:var(--hb-space-12)">Order summary</h2>' +

      // [R3] coupon entry sits above the figures it changes
      '<div class="coupon-row">' +
      '<input class="coupon-row__in" placeholder="Coupon code" value="' + esc(S.couponInput) + '" data-bind="couponInput" aria-label="Coupon code">' +
      '<button class="hb-btn" data-intent="primary" data-style="outlined" data-size="sm" data-act="coupon"><span class="hb-btn__label">Apply</span></button>' +
      '</div>' +

      // [C7] the summary says exactly what it covers
      '<p class="rail__hint" style="margin-block:var(--hb-space-8) var(--hb-space-12)">' +
      (T.lines ? 'Covers ' + T.lines + ' ' + (T.lines === 1 ? 'line' : 'lines') + ' from ' + T.sups + ' ' + (T.sups === 1 ? 'supplier' : 'suppliers') + '.'
        : 'Nothing is ready to order yet.') + '</p>' +

      '<div class="rail__row"><span class="muted">Items</span><span>' + money(T.items) + '</span></div>' +
      '<div class="rail__row"><span class="muted">Delivery</span><span>' + money(T.delivery) + '</span></div>' +
      T.discounts.map(function (d) {
        return '<div class="rail__row"><span class="muted">' + esc(d.label) + ' ' + esc(d.code) + '</span>' +
          '<span class="disc">−' + money(d.amount) + '</span></div>';
      }).join('') +
      '<div class="rail__row" data-total="true"><span>Total</span><span>' + money(T.total) + '</span></div>' +
      '<p class="rail__hint">Includes VAT ' + money(T.vat) + ' (10%). No figure changes between screens.</p>' +

      (held.length
        ? '<div class="held">' + ic('info') + '<span><b>Staying in your cart</b><br>' +
          held.map(function (s) {
            return esc(s.name) + ' — ' + (supConflicts(s).length ? 'a line needs fixing' : money(movGap(s)) + ' under its minimum');
          }).join('<br>') + '</span></div>'
        : '') +
      (cta || '') + '</div>';
  }

  /* ----------------------------------------------------------------- cart */
  function movBar(sup) {
    var met = movGap(sup) <= 0.0005;
    var pct = Math.min(100, (supItems(sup) / sup.mov) * 100);
    return '<div class="mov" data-met="' + met + '">' +
      '<div class="mov__row"><span class="mov__text">' +
      (met ? ic('success') + ' Minimum order met'
           : ic('warning') + ' Add ' + money(movGap(sup)) + ' to reach this supplier’s ' + money(sup.mov) + ' minimum') +
      '</span><span class="grow"></span><span class="muted">' + money(supItems(sup)) + ' / ' + money(sup.mov) + '</span></div>' +
      '<div class="mov__track"><div class="mov__fill" style="inline-size:' + pct.toFixed(1) + '%"></div></div>' +
      (met ? '' : '<div><button class="hb-btn" data-intent="primary" data-style="ghost" data-size="sm" data-act="browse"><span class="hb-btn__label">Add items from ' + esc(sup.name) + '</span><span class="hb-btn__icon">' + ic('arrowRight') + '</span></button></div>') +
      '</div>';
  }

  function lineRow(sup, it) {
    var bad = !lineOk(it);
    var perPiece = it.price / it.pieces;                       // [C5]
    return '<div class="line" data-issue="' + bad + '">' +
      '<label class="hb-check"><input type="checkbox" class="hb-check__input" ' + (it.sel ? 'checked' : '') +
      ' data-act="sel" data-sup="' + sup.id + '" data-item="' + it.id + '" aria-label="Include ' + esc(it.name) + '"><span class="hb-check__box"></span></label>' +
      '<span class="line__thumb" style="background:' + it.tone + '">' + ic('package') + '</span>' +
      '<span class="line__id"><span class="line__name">' + esc(it.name) + '</span>' +
      '<span class="line__meta">' + esc(it.pack) + ' · ' + pcs(it.pieces) + ' per case</span></span>' +
      // [C5] per case, per piece, and the piece count the buyer is actually getting
      '<span class="line__unit"><b>' + money(it.price) + '</b><span class="line__per">' + money(perPiece) + ' / pc</span>' +
      '<span class="line__per">' + pcs(it.qty * it.pieces) + ' total</span></span>' +
      '<span class="line__qty"><span class="qty">' +
      '<button data-act="dec" data-sup="' + sup.id + '" data-item="' + it.id + '" ' + (it.qty <= 1 ? 'disabled' : '') + ' aria-label="Decrease quantity">' + ic('minus') + '</button>' +
      '<input type="number" value="' + it.qty + '" min="1" max="' + it.stock + '" data-act="qty" data-sup="' + sup.id + '" data-item="' + it.id + '" aria-label="Quantity for ' + esc(it.name) + '">' +
      '<button data-act="inc" data-sup="' + sup.id + '" data-item="' + it.id + '" ' + (it.qty >= it.stock ? 'disabled' : '') + ' aria-label="Increase quantity">' + ic('add') + '</button>' +
      '</span></span>' +
      // [C1] the total is withheld while quantity and stock disagree
      '<span class="line__total">' + (bad ? '<span class="line__void">—</span>' : money(lineTotal(it))) + '</span>' +
      '<span class="line__rm"><button class="hb-btn hb-icon-btn" data-intent="danger" data-style="ghost" data-size="sm" aria-label="Remove ' + esc(it.name) + '" data-act="rm" data-sup="' + sup.id + '" data-item="' + it.id + '">' + ic('delete') + '</button></span>' +
      (bad
        ? '<span class="line__note inline-msg" data-tone="error">' + ic('error') +
          '<span><b>Only ' + it.stock + ' in stock</b> — this line has no total until the quantity matches. ' +
          '<button class="hb-btn" data-intent="danger" data-style="ghost" data-size="sm" data-act="clamp" data-sup="' + sup.id + '" data-item="' + it.id + '"><span class="hb-btn__label">Reduce to ' + it.stock + '</span></button>' +
          '<button class="hb-btn" data-intent="secondary" data-style="ghost" data-size="sm" data-act="restock" data-item="' + it.id + '"><span class="hb-btn__icon">' + ic('notification') + '</span><span class="hb-btn__label">Alert me when restocked</span></button></span></span>'
        : it.stock <= 5
          ? '<span class="line__note inline-msg" data-tone="warning">' + ic('warning') + '<span>Only ' + it.stock + ' left in stock.</span></span>'
          : '') +
      '</div>';
  }

  function cartView() {
    var anySel = allItems().some(function (i) { return i.sel; });
    var T = totals();
    var ready = readySuppliers();
    var cta = '<div class="rail__gate">' +
      '<button class="hb-btn" data-intent="primary" data-style="filled" data-size="lg" data-width="fill" data-act="todetails" ' + (ready.length ? '' : 'disabled') + '>' +
      '<span class="hb-btn__label">' + (ready.length ? 'Check out ' + ready.length + ' ' + (ready.length === 1 ? 'supplier' : 'suppliers') + ' · ' + money(T.total) : 'Nothing ready to check out') + '</span>' +
      '<span class="hb-btn__icon">' + ic('arrowRight') + '</span></button>' +
      (ready.length ? '' : '<p class="rail__hint" style="margin-block-start:var(--hb-space-8)">Fix a line or reach a supplier minimum to continue.</p>') +
      '</div>';

    return '<div class="page">' +
      '<div class="page__head"><h1 class="page__title">Your cart</h1>' +
      '<p class="page__sub">Grouped by supplier — each supplier sets its own minimum, delivery fee and dispatch.</p></div>' +
      stepper() +
      '<div class="cols"><div>' +

      // [C8] repeat buying: SKU quick-add and saved lists
      '<div class="card quick"><div class="card__head"><h2 class="card__title">' + ic('refresh') + ' Order again</h2></div>' +
      '<div class="row">' +
      '<div class="field grow" style="min-inline-size:220px"><label for="sku">Quick add by SKU</label>' +
      '<input id="sku" value="' + esc(S.sku) + '" data-bind="sku" placeholder="e.g. NDC-125-18" list="skus">' +
      '<datalist id="skus">' + Object.keys(CATALOGUE).map(function (k) { return '<option value="' + k + '">' + esc(CATALOGUE[k]) + '</option>'; }).join('') + '</datalist></div>' +
      '<button class="hb-btn" data-intent="primary" data-style="outlined" data-size="md" data-act="sku"><span class="hb-btn__icon">' + ic('add') + '</span><span class="hb-btn__label">Add</span></button>' +
      '<button class="hb-btn" data-intent="secondary" data-style="outlined" data-size="md" data-act="savelist"><span class="hb-btn__icon">' + ic('save') + '</span><span class="hb-btn__label">Save as list</span></button>' +
      '</div>' +
      (S.lists.length ? '<div class="row" style="margin-block-start:var(--hb-space-12)">' + S.lists.map(function (l) {
        return '<button class="hb-btn" data-intent="primary" data-style="tonal" data-size="sm" data-act="loadlist" data-list="' + esc(l.name) + '"><span class="hb-btn__icon">' + ic('refresh') + '</span><span class="hb-btn__label">' + esc(l.name) + ' · ' + l.items + ' lines</span></button>';
      }).join('') + '</div>' : '') +
      '</div>' +

      '<div class="row" style="margin-block-end:var(--hb-space-16)">' +
      '<label class="hb-check"><input type="checkbox" class="hb-check__input" ' + (anySel && allItems().every(function (i) { return i.sel; }) ? 'checked' : '') + ' data-act="selall"><span class="hb-check__box"></span><span class="hb-check__label">Select all</span></label>' +
      '<span class="grow"></span>' +
      '<button class="hb-btn" data-intent="danger" data-style="outlined" data-size="sm" data-act="rmsel" ' + (anySel ? '' : 'disabled') + '><span class="hb-btn__icon">' + ic('delete') + '</span><span class="hb-btn__label">Remove selected</span></button></div>' +

      S.suppliers.map(function (sup) {
        if (!sup.items.length) return '';
        var ready = isReady(sup), any = selected(sup).length > 0;
        // [C7] every group states whether this order covers it
        var chip = !any ? ['neutral', 'Excluded from this order']
          : ready ? ['success', 'Ready to order'] : ['warning', 'Not ready — stays in cart'];
        return '<div class="supplier"><div class="supplier__head">' + ic('store') +
          '<span class="supplier__name">' + esc(sup.name) + '</span>' +
          '<span class="pill" data-tone="' + chip[0] + '">' + ic(ready ? 'check' : any ? 'warning' : 'info') + ' ' + chip[1] + '</span>' +
          '<span class="grow"></span>' +
          '<span class="muted">Delivery ' + money(sup.delivery) + '</span></div>' +
          movBar(sup) +
          sup.items.map(function (it) { return lineRow(sup, it); }).join('') +
          '<div class="supplier__foot"><span class="muted">Items ' + money(supItems(sup)) + ' · delivery ' + money(sup.delivery) +
          (supDiscount(sup) ? ' · discounts −' + money(supDiscount(sup)) : '') + '</span>' +
          '<span class="grow"></span><b>' + money(Math.max(0, supItems(sup) + sup.delivery - supDiscount(sup))) + '</b></div>' +
          '</div>';
      }).join('') +
      (allItems().length ? '' : '<div class="card" style="text-align:center">' + ic('cart') + '<p class="page__sub">Your cart is empty.</p></div>') +
      '</div><div class="rail">' + summaryCard(cta) + '</div></div></div>';
  }

  /* ----------------------------------------- delivery & purchase details */
  function verificationRow() {
    // [A2][A9] verification is an account fact shown as a value, not a form
    if (S.verified) {
      return '<div class="verif" data-status="approved"><span class="verif__icon">' + ic('success') + '</span>' +
        '<span class="verif__body"><span class="verif__title">Business verified</span><br>' +
        'CR 5056050560-1 · VAT 200000898300002 · valid to 31 Dec 2026. Nothing to upload for this or any future order.</span></div>';
    }
    return '<div class="verif" data-status="pending"><span class="verif__icon">' + ic('clock') + '</span>' +
      '<span class="verif__body"><span class="verif__title">Verification in progress</span><br>' +
      'You can place this order now — <b>dispatch</b> waits for the check, not the order. ' +
      '<a href="#" data-act="noop">Upload documents in Company profile</a>.</span></div>';
  }

  function slotPicker(sup, idx) {
    var days = [];
    for (var d = 1; d <= 4; d++) {
      var dt = new Date(Date.now() + d * 86400000);
      days.push({ id: 'd' + d, label: dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) });
    }
    var cur = S.slots[sup.id] || {};
    var err = S.errors['slot.' + sup.id];
    return '<div class="ship" data-invalid="' + (!!err) + '">' +
      '<div class="ship__head"><span class="pill" data-tone="info">' + ic('truck') + ' Shipment ' + (idx + 1) + ' of ' + readySuppliers().length + '</span>' +
      '<b>' + esc(sup.name) + '</b><span class="grow"></span><span class="muted">Delivery ' + money(sup.delivery) + '</span></div>' +
      '<div class="field"><label>Delivery day</label><div class="chips">' +
      days.map(function (d) {
        return '<button class="chipbtn" data-act="slotday" data-sup="' + sup.id + '" data-day="' + d.id + '" data-label="' + d.label + '" aria-pressed="' + (cur.day === d.id) + '">' + d.label + '</button>';
      }).join('') + '</div></div>' +
      '<div class="field"><label>Time window</label><div class="chips">' +
      SLOTS.map(function (s) {
        return '<button class="chipbtn" data-act="slottime" data-sup="' + sup.id + '" data-slot="' + s.id + '" data-label="' + s.label + '" aria-pressed="' + (cur.slot === s.id) + '">' +
          s.label + '<span class="chipbtn__cap">' + s.cap + '</span></button>';
      }).join('') + '</div></div>' +
      (err ? '<span class="field__err">' + esc(err) + '</span>' : '') +
      '</div>';
  }

  function addressCard() {
    var A = S.address;
    if (S.editing === 'address') {
      var fields = [['country', 'Country'], ['state', 'State / Province'], ['city', 'City'], ['street', 'Street address'], ['building', 'Building'], ['zip', 'ZIP / Postal code']];
      return '<div class="card"><div class="card__head"><h2 class="card__title">Delivery address</h2></div><div class="kv">' +
        fields.map(function (f) {
          var inv = S.errors['address.' + f[0]];
          return '<div class="field" data-invalid="' + (!!inv) + '"><label for="a-' + f[0] + '">' + f[1] + '</label>' +
            '<input id="a-' + f[0] + '" value="' + esc(A[f[0]]) + '" data-bind="address.' + f[0] + '">' +
            (inv ? '<span class="field__err">' + esc(inv) + '</span>' : '') + '</div>';
        }).join('') + '</div>' +
        '<div class="row row--end" style="margin-block-start:var(--hb-space-16)">' +
        '<button class="hb-btn" data-intent="secondary" data-style="ghost" data-size="md" data-act="canceledit"><span class="hb-btn__label">Cancel</span></button>' +
        '<button class="hb-btn" data-intent="primary" data-style="filled" data-size="md" data-act="saveedit"><span class="hb-btn__label">Save address</span></button></div></div>';
    }
    return '<div class="card"><div class="card__head"><h2 class="card__title">Delivery address</h2>' +
      '<span class="app-bar__spacer"></span>' +
      '<button class="hb-btn" data-intent="primary" data-style="outlined" data-size="sm" data-act="edit" data-what="address"><span class="hb-btn__icon">' + ic('edit') + '</span><span class="hb-btn__label">Edit</span></button></div>' +
      '<div class="summary-box"><div class="kv">' +
      [['Branch', S.branch.name + ' · ' + S.branch.phone], ['Country', A.country], ['State / Province', A.state], ['City', A.city], ['Street address', A.street], ['Building', A.building], ['ZIP / Postal code', A.zip]]
        .map(function (r) { return '<div><div class="kv__k">' + r[0] + '</div><div class="kv__v">' + esc(r[1]) + '</div></div>'; }).join('') +
      '</div></div>' +
      // [A10] the pin resolves to something the buyer can check
      '<div class="pin"><span class="pin__icon">' + ic('location') + '</span>' +
      '<span class="grow"><b>Map pin saved</b><br><span class="muted">' + S.pin.lat.toFixed(4) + ', ' + S.pin.lng.toFixed(4) +
      ' — this is what the driver navigates to, not the typed address.</span></span>' +
      '<button class="hb-btn" data-intent="primary" data-style="outlined" data-size="sm" data-act="pin"><span class="hb-btn__label">Adjust pin</span></button></div>' +
      '</div>';
  }

  function detailsView() {
    var T = totals();
    var cta = '<div class="rail__gate">' +
      '<button class="hb-btn" data-intent="primary" data-style="filled" data-size="lg" data-width="fill" data-act="place" ' + (S.placing ? 'disabled' : '') + '>' +
      '<span class="hb-btn__label">' + (S.placing ? 'Placing order…' : 'Place order · ' + money(T.total)) + '</span></button>' +   // [A6]
      '<p class="rail__hint" style="margin-block-start:var(--hb-space-8)">' + ic('info') + ' Stock is reserved for 48 hours once the order is placed.</p></div>';

    return '<div class="page">' +
      '<div class="page__head"><h1 class="page__title">Delivery &amp; purchase details</h1>' +
      '<p class="page__sub">Everything the order needs, on one page.</p></div>' +
      stepper() +
      '<div class="cols"><div>' +
      '<div class="card"><div class="card__head"><h2 class="card__title">Business verification</h2></div>' + verificationRow() + '</div>' +
      addressCard() +
      // [A7] a slot per shipment, with the shipment count stated up front
      '<div class="card"><div class="card__head"><h2 class="card__title">Delivery windows</h2>' +
      '<span class="pill" data-tone="neutral">' + readySuppliers().length + ' ' + (readySuppliers().length === 1 ? 'shipment' : 'shipments') + '</span></div>' +
      '<p class="muted" style="margin-block-end:var(--hb-space-16)">This order ships in ' + readySuppliers().length + ' ' + (readySuppliers().length === 1 ? 'delivery' : 'separate deliveries') + ' — pick a window for each so your goods-in bay is staffed.</p>' +
      readySuppliers().map(slotPicker).join('') + '</div>' +
      // [A8] the fields procurement reconciles against
      '<div class="card"><div class="card__head"><h2 class="card__title">Purchase details</h2>' +
      '<span class="pill" data-tone="neutral">Optional</span></div>' +
      '<p class="muted" style="margin-block-end:var(--hb-space-16)">Printed on the tax invoice so your finance team can reconcile without re-keying.</p>' +
      '<div class="kv">' +
      '<div class="field"><label for="po">PO number</label><input id="po" value="' + esc(S.purchase.po) + '" data-bind="purchase.po" placeholder="PO-2026-0431"></div>' +
      '<div class="field"><label for="cc">Cost centre</label><input id="cc" value="' + esc(S.purchase.costCentre) + '" data-bind="purchase.costCentre" placeholder="BH-RETAIL-02"></div>' +
      '<div class="field" data-invalid="' + (!!S.errors['purchase.invoiceEmail']) + '"><label for="ie">Invoice recipient</label>' +
      '<input id="ie" type="email" value="' + esc(S.purchase.invoiceEmail) + '" data-bind="purchase.invoiceEmail" placeholder="finance@yourcompany.com">' +
      (S.errors['purchase.invoiceEmail'] ? '<span class="field__err">' + esc(S.errors['purchase.invoiceEmail']) + '</span>' : '') + '</div>' +
      '</div></div>' +
      '<div class="card"><div class="card__head"><h2 class="card__title">Payment method</h2></div>' +
      '<label class="hb-check" style="align-items:flex-start"><input type="checkbox" class="hb-check__input" checked disabled><span class="hb-check__box"></span>' +
      '<span class="hb-check__label">Bank transfer' +
      '<span class="hb-check__hint">Account details, a transfer reference and the receipt upload all appear on the next screen.</span></span></label></div>' +
      '<div class="row" style="margin-block-start:var(--hb-space-16)">' +
      '<button class="hb-btn" data-intent="secondary" data-style="outlined" data-size="md" data-act="goto" data-screen="cart"><span class="hb-btn__icon">' + ic('arrowLeft') + '</span><span class="hb-btn__label">Back to cart</span></button></div>' +
      '</div><div class="rail">' + summaryCard(cta) + '</div></div></div>';
  }

  /* -------------------------------------------------------------- payment */
  function countdown() {
    var ms = S.deadline - Date.now();
    if (ms <= 0) return { txt: 'Reservation expired', over: true };
    var h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000);
    return { txt: h + 'h ' + String(m).padStart(2, '0') + 'm ' + String(s).padStart(2, '0') + 's', over: false };
  }

  // The receipt uploader IS the design system's File Upload molecule — same
  // markup and classes, not a lookalike. Header persists across states; rows
  // read name -> progress -> size; remove is an x; a live counter closes it. [P1][A3]
  var RECEIPT = { files: 1, mb: 5 };

  function fileRow(slot, f) {
    var done = f.pct >= 100;
    var size = (f.size / 1048576).toFixed(1) + ' MB';
    return '<div class="hb-upload__file"' + (done ? '' : ' data-status="uploading"') + '>' +
      '<span class="hb-upload__file-icon">' +
      (f.thumb ? '<img class="hb-upload__thumb" src="' + f.thumb + '" alt="">' : ic('file')) + '</span>' +
      '<span class="hb-upload__file-meta">' +
      '<span class="hb-upload__name">' + esc(f.name) + '</span>' +
      (done ? '' : '<span class="hb-upload__bar"><i style="inline-size:' + f.pct + '%"></i></span>') +
      '<span class="hb-upload__size">' + size + (done ? '' : ' · ' + f.pct + '%') + '</span>' +
      '</span>' +
      '<button class="hb-upload__rm" data-act="rmfile" data-slot="' + slot + '" aria-label="Remove ' + esc(f.name) + '">' + ic('close') + '</button>' +
      '</div>';
  }

  function uploader(slot, title, f) {
    var err = S.errors['doc.' + slot];
    var state = err ? 'error' : !f ? 'empty' : (f.pct < 100 ? 'uploading' : 'uploaded');
    var used = f ? 1 : 0;
    var mb = f ? (f.size / 1048576) : 0;
    // Only an empty or rejected panel is itself the target; once a file is in,
    // clicking the panel must not re-open the picker.
    var clickable = (state === 'empty' || state === 'error');
    return '<div class="hb-upload" data-state="' + state + '" data-drop="' + slot + '"' +
      (clickable ? ' role="button" tabindex="0" data-act="pick" data-slot="' + slot + '"' : '') + '>' +
      '<span class="hb-upload__icon">' + ic('upload') + '</span>' +
      '<span class="hb-upload__title">' + esc(title) + '</span>' +
      '<span class="hb-upload__hint">' + (err ? esc(err) : 'PDF, JPG or PNG · 1 file · max 5 MB') + '</span>' +
      (f ? '<div class="hb-upload__files">' + fileRow(slot, f) + '</div>' : '') +
      '<span class="hb-upload__count">' + used + ' of ' + RECEIPT.files + ' file · ' +
      mb.toFixed(1) + ' MB of ' + RECEIPT.mb + ' MB</span>' +
      '</div>';
  }

  function paymentView() {
    var o = S.order, c = countdown();
    var paid = S.receipt && S.receipt.pct === 100;
    return '<div class="page">' +
      // [P2] "received", not "successful" — the money is still outstanding
      '<div class="page__head"><h1 class="page__title">' + ic('check', 'ok') + ' Order received</h1>' +
      '<p class="page__sub">Order <b>' + esc(o.ref) + '</b> · ' + esc(o.at) + ' · ' +
      (paid ? 'receipt uploaded, awaiting confirmation' : '<b class="warn">payment outstanding</b>') + '</p></div>' +
      stepper() +
      '<div class="cols"><div>' +

      // [P3] deadline, countdown and the reservation rule in the first sentence
      '<div class="card pay-card" data-paid="' + paid + '">' +
      '<div class="card__head"><h2 class="card__title">' + (paid ? 'Payment submitted' : 'Complete your payment') + '</h2>' +
      '<span class="app-bar__spacer"></span>' +
      (paid ? '<span class="pill" data-tone="success">' + ic('check') + ' Receipt received</span>'
            : '<span class="pill" data-tone="' + (c.over ? 'error' : 'warning') + '">' + ic('clock') + ' <span id="cd">' + c.txt + '</span></span>') + '</div>' +
      (paid ? '' : '<p class="muted" style="margin-block-end:var(--hb-space-16)">Your stock is reserved until <b>' +
        new Date(S.deadline).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) +
        '</b>. If the transfer has not arrived by then the reservation is released and the order is cancelled.</p>') +

      '<div class="pay"><div>' +
      [['Account name', 'HIGHBASE TRADING WLL'], ['IBAN', 'BH29ALSA00165212100101'], ['SWIFT code', 'ALSABHBM']].map(function (r) {
        return '<div class="bankrow"><span class="bankrow__k">' + r[0] + '</span><span class="bankrow__v">' + r[1] + '</span>' +
          '<button class="hb-btn hb-icon-btn" data-intent="secondary" data-style="ghost" data-size="sm" aria-label="Copy ' + r[0] + '" data-act="copy" data-copy="' + r[1] + '">' + ic('copy') + '</button></div>';
      }).join('') +
      // [P5] the transfer reference, and the rule that matches it to the order
      '<div class="bankrow bankrow--ref"><span class="bankrow__k">Transfer reference</span><span class="bankrow__v">' + esc(o.ref) + '</span>' +
      '<button class="hb-btn hb-icon-btn" data-intent="secondary" data-style="ghost" data-size="sm" aria-label="Copy transfer reference" data-act="copy" data-copy="' + esc(o.ref) + '">' + ic('copy') + '</button></div>' +
      '<p class="rail__hint">Put this in your bank’s reference field. Transfers without it are matched by hand and take longer to clear.</p>' +
      '<div class="amountbox"><span><span class="amountbox__k">Amount to pay</span><br><span class="amountbox__v">' + money(o.total) + '</span></span>' +
      '<span class="grow"></span>' +
      '<button class="hb-btn hb-icon-btn" data-intent="secondary" data-style="ghost" data-size="md" aria-label="Copy amount" data-act="copy" data-copy="' + o.total.toFixed(3) + '">' + ic('copy') + '</button></div></div>' +
      '<div><div class="summary-box" style="text-align:center"><b>Payment QR</b>' +
      '<div style="margin-block:var(--hb-space-12)">' + qrSvg(o.ref) + '</div>' +
      '<span class="rail__hint">Scan from your bank app to prefill the transfer.</span></div></div></div>' +

      // [P1] the receipt is completed here, where the payment is asked for
      '<div style="margin-block-start:var(--hb-space-20)">' +
      uploader('receipt', 'Upload the transfer receipt', S.receipt) +
      (paid
        ? '<p class="inline-msg" data-tone="success" style="margin-block-start:var(--hb-space-12)">' + ic('success') + '<span>Receipt received. Finance confirms within one business day.</span></p>'
        : '<div class="row" style="margin-block-start:var(--hb-space-12)">' +
          '<button class="hb-btn" data-intent="secondary" data-style="ghost" data-size="sm" data-act="paylater"><span class="hb-btn__label">I’ll pay later</span></button>' +
          '<span class="rail__hint">' + (S.payLater ? 'Saved — we’ll remind you before the reservation expires.' : 'We’ll email you a reminder before the deadline.') + '</span></div>') +
      '</div></div>' +

      // [P4] the page continues past the IBAN
      '<div class="rail"><div class="card"><h2 class="card__title" style="margin-block-end:var(--hb-space-16)">What happens next</h2>' +
      '<ol class="timeline">' +
      '<li data-state="done"><span class="timeline__dot">' + ic('check') + '</span><span><span class="timeline__k">Order received</span><span class="timeline__v">' + esc(o.at) + '</span></span></li>' +
      '<li data-state="' + (paid ? 'done' : 'now') + '"><span class="timeline__dot">' + (paid ? ic('check') : '2') + '</span><span><span class="timeline__k">Payment confirmed</span><span class="timeline__v">' + (paid ? 'Receipt uploaded — finance confirming' : 'Transfer by ' + new Date(S.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })) + '</span></span></li>' +
      '<li data-state="todo"><span class="timeline__dot">3</span><span><span class="timeline__k">Supplier confirms</span><span class="timeline__v">Each shipment confirms separately</span></span></li>' +
      o.shipments.map(function (sh, i) {
        return '<li data-state="todo"><span class="timeline__dot">' + (4 + i) + '</span><span><span class="timeline__k">' + esc(sh.name) + '</span>' +
          '<span class="timeline__v">' + esc(sh.when || 'Window not selected') + '</span></span></li>';
      }).join('') +
      '<li data-state="todo"><span class="timeline__dot">' + ic('invoice') + '</span><span><span class="timeline__k">Tax invoice issued</span><span class="timeline__v">' +
      (o.po ? 'Carries PO ' + esc(o.po) : 'Emailed to the invoice recipient') + '</span></span></li>' +
      '</ol>' +
      '<div class="stack" style="margin-block-start:var(--hb-space-20);gap:var(--hb-space-8)">' +
      '<button class="hb-btn" data-intent="primary" data-style="filled" data-size="md" data-width="fill" data-act="noop"><span class="hb-btn__icon">' + ic('package') + '</span><span class="hb-btn__label">Track your order</span></button>' +
      '<button class="hb-btn" data-intent="secondary" data-style="outlined" data-size="md" data-width="fill" data-act="noop"><span class="hb-btn__icon">' + ic('download') + '</span><span class="hb-btn__label">Download proforma invoice</span></button>' +
      '<button class="hb-btn" data-intent="secondary" data-style="outlined" data-size="md" data-width="fill" data-act="noop"><span class="hb-btn__icon">' + ic('message') + '</span><span class="hb-btn__label">Message the supplier</span></button>' +
      '</div></div>' +
      // [C8] the repeat-purchase prompt, at the moment the basket is proven
      '<div class="card reorder"><div class="card__head"><h2 class="card__title">' + ic('refresh') + ' Order this again?</h2></div>' +
      '<p class="muted">Save these ' + o.lines + ' lines as a list, or have us rebuild the basket on a schedule.</p>' +
      '<div class="row" style="margin-block-start:var(--hb-space-12)">' +
      '<button class="hb-btn" data-intent="primary" data-style="outlined" data-size="sm" data-act="savelist"><span class="hb-btn__label">Save as list</span></button>' +
      '<button class="hb-btn" data-intent="secondary" data-style="outlined" data-size="sm" data-act="noop"><span class="hb-btn__label">Repeat monthly</span></button>' +
      '</div></div>' +
      '<div style="margin-block-start:var(--hb-space-16)">' +
      '<button class="hb-btn" data-intent="secondary" data-style="ghost" data-size="md" data-width="fill" data-act="restart"><span class="hb-btn__icon">' + ic('cart') + '</span><span class="hb-btn__label">Back to marketplace</span></button></div>' +
      '</div></div></div>';
  }

  function qrSvg(seed) {
    var n = 25, h = 0, i, x, y, cells = '';
    for (i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    var rnd = function () { h ^= h << 13; h >>>= 0; h ^= h >> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
    var finder = function (fx, fy) {
      return '<rect x="' + fx + '" y="' + fy + '" width="7" height="7" fill="currentColor"/>' +
        '<rect x="' + (fx + 1) + '" y="' + (fy + 1) + '" width="5" height="5" fill="#fff"/>' +
        '<rect x="' + (fx + 2) + '" y="' + (fy + 2) + '" width="3" height="3" fill="currentColor"/>';
    };
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) {
      var inF = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!inF && rnd() > 0.52) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="currentColor"/>';
    }
    return '<svg viewBox="0 0 ' + n + ' ' + n + '" style="inline-size:180px;block-size:180px;color:var(--hb-color-neutral-950)" role="img" aria-label="Payment QR code">' +
      '<rect width="' + n + '" height="' + n + '" fill="#fff"/>' + cells + finder(0, 0) + finder(n - 7, 0) + finder(0, n - 7) + '</svg>';
  }

  function dialogView() {
    var d = S.dialog;
    if (!d) return '';
    return '<div class="scrim" data-act="scrim"><div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-b">' +
      '<div class="modal__icon">' + ic(d.glyph || 'warning') + '</div>' +
      '<h2 class="modal__title" id="dlg-t">' + esc(d.title) + '</h2>' +
      '<p class="modal__body" id="dlg-b">' + esc(d.body) + '</p>' +
      '<div class="modal__acts">' +
      '<button class="hb-btn" data-intent="secondary" data-style="outlined" data-size="md" data-act="dlg-cancel"><span class="hb-btn__label">' + esc(d.cancel || 'Keep it') + '</span></button>' +
      '<button class="hb-btn" data-intent="' + (d.intent || 'danger') + '" data-style="filled" data-size="md" data-act="dlg-ok"><span class="hb-btn__label">' + esc(d.ok) + '</span></button>' +
      '</div></div></div>';
  }

  /* -------------------------------------------------------------- render */
  var root, tick = null;
  function render() {
    document.documentElement.setAttribute('dir', S.dir);
    document.documentElement.setAttribute('lang', S.lang);
    root.innerHTML = appBar() +
      (S.screen === 'cart' ? cartView() : S.screen === 'details' ? detailsView() : paymentView()) +
      dialogView();
    document.querySelectorAll('[data-px]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.pxVal === String(S[b.dataset.px])));
    });
    var m = root.querySelector('.modal');
    if (m) { var f = m.querySelector('button'); if (f) f.focus(); }

    // the countdown updates its own node so typing elsewhere is never interrupted
    if (tick) { clearInterval(tick); tick = null; }
    if (S.screen === 'payment' && S.deadline && !(S.receipt && S.receipt.pct === 100)) {
      tick = setInterval(function () {
        var el = document.getElementById('cd');
        if (!el) { clearInterval(tick); tick = null; return; }
        el.textContent = countdown().txt;
      }, 1000);
    }
  }

  /* ------------------------------------------------------------- helpers */
  function find(supId, itemId) {
    var sup = S.suppliers.filter(function (s) { return s.id === supId; })[0];
    if (!sup) return null;
    var idx = sup.items.findIndex(function (i) { return i.id === itemId; });
    return { sup: sup, idx: idx, item: sup.items[idx] };
  }
  function setPath(path, val) {
    var parts = path.split('.'), o = S;
    for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = val;
  }

  /* -------------------------------------------------------- file picking */
  var picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
  var pickingSlot = null;
  picker.addEventListener('change', function () {
    if (picker.files && picker.files[0]) acceptFile(pickingSlot, picker.files[0]);
    picker.value = '';
  });

  var MAX = 5 * 1024 * 1024, OK = ['application/pdf', 'image/jpeg', 'image/png'];
  function acceptFile(slot, file) {
    delete S.errors['doc.' + slot];
    if (OK.indexOf(file.type) === -1) {
      S.errors['doc.' + slot] = (file.type ? 'That file is ' + file.type + '.' : 'That file type is not recognised.') + ' Use PDF, JPG or PNG.';
      render(); snack('Unsupported file type.', 'error'); return;
    }
    if (file.size > MAX) {
      S.errors['doc.' + slot] = 'That file is ' + (file.size / 1048576).toFixed(1) + ' MB. The limit is 5 MB.';
      render(); snack('File is too large.', 'error'); return;
    }
    var rec = { name: file.name, size: file.size, pct: 0, thumb: null };
    if (slot === 'receipt') S.receipt = rec; else S.docs[slot] = rec;
    if (file.type.indexOf('image/') === 0) {
      var fr = new FileReader();
      fr.onload = function (e) { rec.thumb = e.target.result; render(); };
      fr.readAsDataURL(file);
    }
    render();
    var t = setInterval(function () {
      rec.pct = Math.min(100, rec.pct + 20);
      render();
      if (rec.pct >= 100) { clearInterval(t); snack(file.name + ' uploaded.', 'success'); }
    }, 160);
  }

  /* ------------------------------------------------------------ validate */
  function validateDetails() {
    S.errors = {};
    ['street', 'building', 'city'].forEach(function (k) {
      if (!String(S.address[k]).trim()) S.errors['address.' + k] = 'Required.';
    });
    if (Object.keys(S.errors).length) S.editing = 'address';
    readySuppliers().forEach(function (s) {
      var c = S.slots[s.id];
      if (!c || !c.day || !c.slot) S.errors['slot.' + s.id] = 'Pick a day and a time window for this shipment.';
    });
    var em = String(S.purchase.invoiceEmail).trim();
    if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) S.errors['purchase.invoiceEmail'] = 'That does not look like an email address.';
    return Object.keys(S.errors).length === 0;
  }

  /* -------------------------------------------------------------- events */
  function onClick(e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var a = t.dataset.act;

    if (a === 'scrim' && e.target !== t) return;
    if (a === 'scrim' || a === 'dlg-cancel') { closeDialog(); return; }
    if (a === 'dlg-ok') { var run = S.dialog && S.dialog.run; closeDialog(); if (run) run(); return; }

    if (a === 'inc' || a === 'dec') {
      var r = find(t.dataset.sup, t.dataset.item); if (!r) return;
      var next = r.item.qty + (a === 'inc' ? 1 : -1);
      if (next > r.item.stock) { snack('Only ' + r.item.stock + ' in stock for ' + r.item.name + '.', 'error'); next = r.item.stock; }
      r.item.qty = Math.max(1, next); render(); return;
    }
    if (a === 'clamp') {
      var rc = find(t.dataset.sup, t.dataset.item); if (!rc) return;
      rc.item.qty = rc.item.stock; render();
      snack('Reduced to the ' + rc.item.stock + ' in stock.', 'success'); return;
    }
    if (a === 'restock') { snack('We’ll email you when this item is back in stock.', 'success'); return; }
    if (a === 'rm') {
      var rr = find(t.dataset.sup, t.dataset.item); if (!rr) return;
      openDialog({
        glyph: 'delete', intent: 'danger', title: 'Remove this item?',
        body: rr.item.name + ' will be taken out of your cart. Your other items and this supplier’s minimum are unaffected.',
        ok: 'Remove item', cancel: 'Keep it',
        run: function () {
          var x = find(t.dataset.sup, t.dataset.item); if (!x || x.idx < 0) return;
          var snap = { supId: t.dataset.sup, idx: x.idx, item: x.item };
          x.sup.items.splice(x.idx, 1); render();
          snack('Removed ' + snap.item.name + '.', 'info', {
            label: 'Undo', run: function () {
              var sup = S.suppliers.filter(function (s) { return s.id === snap.supId; })[0];
              sup.items.splice(snap.idx, 0, snap.item); render(); snack('Item restored.', 'success');
            }
          });
        }
      });
      return;
    }
    if (a === 'rmsel') {
      var n = allItems().filter(function (i) { return i.sel; }).length;
      openDialog({
        glyph: 'delete', intent: 'danger',
        title: 'Remove ' + n + ' selected ' + (n === 1 ? 'item' : 'items') + '?',
        body: 'They come out of your cart. Anything left unselected stays where it is.',
        ok: 'Remove ' + n, cancel: 'Keep them',
        run: function () {
          S.suppliers.forEach(function (s) { s.items = s.items.filter(function (i) { return !i.sel; }); });
          render(); snack(n + ' items removed.', 'info');
        }
      });
      return;
    }
    if (a === 'todetails') {
      if (!readySuppliers().length) return;
      S.screen = 'details'; S.errors = {}; window.scrollTo(0, 0); render();
      var held = heldSuppliers();
      if (held.length) snack(held.length + ' supplier' + (held.length === 1 ? '' : 's') + ' stayed in your cart.', 'info');
      return;
    }
    if (a === 'goto') {
      var want = t.dataset.screen;
      var order = ['cart', 'details', 'payment'];
      if (order.indexOf(want) <= order.indexOf(S.screen)) { S.screen = want; S.errors = {}; window.scrollTo(0, 0); render(); }
      return;
    }
    if (a === 'browse') { snack('In the real product this opens the supplier’s catalogue.', 'info'); return; }
    if (a === 'edit') { S.editing = t.dataset.what; render(); return; }
    if (a === 'canceledit') { S.editing = null; S.errors = {}; render(); return; }
    if (a === 'saveedit') {
      S.errors = {};
      ['street', 'building', 'city'].forEach(function (k) {
        if (!String(S.address[k]).trim()) S.errors['address.' + k] = 'Required.';
      });
      if (Object.keys(S.errors).length) { render(); snack('Address is incomplete.', 'error'); return; }
      S.editing = null; render(); snack('Delivery address saved.', 'success'); return;
    }
    if (a === 'pin') {
      S.pin = { lat: S.pin.lat + (Math.random() - 0.5) * 0.002, lng: S.pin.lng + (Math.random() - 0.5) * 0.002 };
      render(); snack('Pin moved to ' + S.pin.lat.toFixed(4) + ', ' + S.pin.lng.toFixed(4) + '.', 'success'); return;
    }
    if (a === 'slotday') {
      S.slots[t.dataset.sup] = S.slots[t.dataset.sup] || {};
      S.slots[t.dataset.sup].day = t.dataset.day;
      S.slots[t.dataset.sup].dayLabel = t.dataset.label;
      delete S.errors['slot.' + t.dataset.sup]; render(); return;
    }
    if (a === 'slottime') {
      S.slots[t.dataset.sup] = S.slots[t.dataset.sup] || {};
      S.slots[t.dataset.sup].slot = t.dataset.slot;
      S.slots[t.dataset.sup].slotLabel = t.dataset.label;
      delete S.errors['slot.' + t.dataset.sup]; render(); return;
    }
    if (a === 'coupon') {
      var code = String(S.couponInput).trim().toUpperCase();
      if (!code) { snack('Enter a coupon code first.', 'error'); return; }
      var sup = readySuppliers()[0] || S.suppliers[0];
      if (sup.discounts.some(function (d) { return d.code === code; })) { snack('That coupon is already applied.', 'info'); return; }
      sup.discounts.push({ code: code, label: 'Coupon', amount: 1.0 });
      S.couponInput = ''; render();
      snack('Coupon ' + code + ' applied — BHD 1.000 off ' + sup.name + '.', 'success');
      return;
    }
    if (a === 'sku') {
      var k = String(S.sku).trim().toUpperCase();
      if (!CATALOGUE[k]) { snack(k ? 'No product matches SKU ' + k + '.' : 'Enter a SKU first.', 'error'); return; }
      snack(CATALOGUE[k] + ' added to your cart.', 'success');
      S.sku = ''; render(); return;
    }
    if (a === 'savelist') {
      var lines = allItems().filter(function (i) { return i.sel; }).length;
      if (!lines) { snack('Select some lines first.', 'error'); return; }
      var name = 'Weekly restock ' + (S.lists.length + 1);
      S.lists.push({ name: name, items: lines }); render();
      snack('Saved "' + name + '" — ' + lines + ' lines.', 'success'); return;
    }
    if (a === 'loadlist') { snack('Loaded ' + t.dataset.list + ' into your cart.', 'success'); return; }
    if (a === 'pick') { pickingSlot = t.dataset.slot; picker.click(); return; }
    if (a === 'rmfile') {
      if (t.dataset.slot === 'receipt') S.receipt = null; else S.docs[t.dataset.slot] = null;
      render(); snack('File removed.', 'info'); return;
    }
    if (a === 'paylater') { S.payLater = true; render(); snack('We’ll remind you before the reservation expires.', 'info'); return; }
    if (a === 'place') {
      if (S.placing) return;
      if (!validateDetails()) { render(); snack('Check the highlighted fields before placing the order.', 'error'); return; }
      S.placing = true; render();
      setTimeout(function () {
        S.placing = false;
        var T = totals(), d = new Date();
        S.deadline = Date.now() + 48 * 3600000;               // [P3]
        S.order = {
          ref: 'HB-' + d.getFullYear() + '-' + String(Date.now()).slice(-6),
          at: d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          total: T.total, lines: T.lines, po: S.purchase.po,
          shipments: readySuppliers().map(function (s) {
            var c = S.slots[s.id] || {};
            return { name: s.name, when: c.dayLabel ? c.dayLabel + ' · ' + c.slotLabel : null };
          })
        };
        S.screen = 'payment'; window.scrollTo(0, 0); render();
        snack('Order received. Complete the transfer to start fulfilment.', 'success');
      }, 1000);
      return;
    }
    if (a === 'copy') {
      var val = t.dataset.copy;
      var done = function () { snack('Copied ' + val, 'success'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(val).then(done, function () { snack('Copy failed — select it manually.', 'error'); });
      } else {
        var ta = document.createElement('textarea'); ta.value = val; document.body.appendChild(ta);
        ta.select(); try { document.execCommand('copy'); done(); } catch (err) { snack('Copy failed.', 'error'); }
        document.body.removeChild(ta);
      }
      return;
    }
    if (a === 'restart') {
      S.suppliers = JSON.parse(JSON.stringify(SUPPLIERS));
      S.screen = 'cart'; S.order = null; S.receipt = null; S.payLater = false;
      S.slots = {}; S.errors = {}; S.deadline = null;
      window.scrollTo(0, 0); render(); return;
    }
    if (a === 'noop') { e.preventDefault(); snack('Out of scope for this prototype.', 'info'); return; }
  }

  function onChange(e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var a = t.dataset.act;
    if (a === 'sel') {
      var r = find(t.dataset.sup, t.dataset.item); if (!r) return;
      r.item.sel = t.checked; render(); return;
    }
    if (a === 'selall') {
      var on = t.checked;
      S.suppliers.forEach(function (s) { s.items.forEach(function (i) { i.sel = on; }); });
      render(); return;
    }
    if (a === 'qty') {
      var rq = find(t.dataset.sup, t.dataset.item); if (!rq) return;
      var v = parseInt(t.value, 10);
      if (isNaN(v) || v < 1) v = 1;
      if (v > rq.item.stock) { snack('Only ' + rq.item.stock + ' in stock — reduced to ' + rq.item.stock + '.', 'error'); v = rq.item.stock; }
      rq.item.qty = v; render(); return;
    }
  }

  function onInput(e) {
    var b = e.target.getAttribute && e.target.getAttribute('data-bind');
    if (b) setPath(b, e.target.value);
  }

  function onKey(e) {
    if (e.key === 'Escape' && S.dialog) { closeDialog(); return; }
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('hb-upload')) {
      e.preventDefault(); pickingSlot = e.target.dataset.slot; picker.click();
    }
    if (e.key === 'Tab' && S.dialog) {
      var f = root.querySelectorAll('.modal button');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function onDrag(e) {
    var z = e.target.closest ? e.target.closest('[data-drop]') : null;
    if (e.type === 'dragover' || e.type === 'drop') e.preventDefault();
    if (!z) return;
    if (e.type === 'dragover') z.setAttribute('data-over', 'true');
    if (e.type === 'dragleave') z.removeAttribute('data-over');
    if (e.type === 'drop') {
      z.removeAttribute('data-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) acceptFile(z.dataset.drop, e.dataTransfer.files[0]);
    }
  }

  function bar() {
    var b = document.createElement('div');
    b.className = 'px-bar';
    b.innerHTML = '<b>Prototype controls</b>' +
      '<span class="px-seg" role="group" aria-label="Direction">' +
      '<button data-px="dir" data-px-val="ltr">English · LTR</button>' +
      '<button data-px="dir" data-px-val="rtl">العربية · RTL</button></span>' +
      '<span class="px-seg" role="group" aria-label="Account verification">' +
      '<button data-px="verified" data-px-val="true">Verified account</button>' +
      '<button data-px="verified" data-px-val="false">Verification pending</button></span>' +
      '<span class="px-note">Not part of the design — it exposes states you would otherwise have to seed.</span>';
    b.addEventListener('click', function (e) {
      var t = e.target.closest('[data-px]');
      if (!t) return;
      var key = t.dataset.px, val = t.dataset.pxVal;
      S[key] = val === 'true' ? true : val === 'false' ? false : val;
      if (key === 'dir') S.lang = val === 'rtl' ? 'ar' : 'en';
      render();
    });
    return b;
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.body.insertBefore(bar(), document.body.firstChild);
    root = document.createElement('div');
    document.body.appendChild(root);
    snackHost = document.createElement('div');
    snackHost.className = 'snacks';
    snackHost.setAttribute('role', 'status');
    snackHost.setAttribute('aria-live', 'polite');
    document.body.appendChild(snackHost);

    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('input', onInput);
    document.addEventListener('keydown', onKey);
    ['dragover', 'dragleave', 'drop'].forEach(function (t) { document.addEventListener(t, onDrag); });
    render();
  });
})();
