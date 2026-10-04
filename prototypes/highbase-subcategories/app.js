/* Highbase — subcategory pages prototype, side-panel revision.
   Renders from HBModel; hash routing stands in for Inertia visits. Every control is live. */
(function () {
  'use strict';
  var M = window.HBModel;
  var ic = function (n, cls) { return '<svg class="hb-i ' + (cls || '') + '" aria-hidden="true"><use href="#hb-i-' + n + '"/></svg>'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fmt = function (n) { return n.toFixed(3); };
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- copy ---------- */
  var T = {
    en: { categories: 'Categories', brands: 'Brands', cart: 'Cart', home: 'Home', account: 'Account', search: 'Search by name, category or brand', filters: 'Filters', sortBy: 'Sort by', clearAll: 'Clear all', viewCart: 'View cart', best: 'Best-selling', priceAsc: 'Price: low to high', unitAsc: 'Price per unit: low to high', newest: 'Newest', offers: 'Offers', again: 'Ordered before', mine: 'My suppliers', mineHint: 'Suppliers you already order from', againHint: 'Products on a previous order', supplier: 'Supplier', brand: 'Brand', price: 'Price (BHD)', min: 'Min', max: 'Max', deals: 'Deals', offer: 'On offer', bulk: 'Bulk price', subcats: 'Subcategories', moreIn: 'More in ', allIn: 'All in ', add: 'Add', signIn: 'Sign in to order', addSupplier: 'Add supplier to order', notYours: 'Not your supplier yet. Adding it takes one step.', listPrice: 'List price', bizLock: 'Your business price after sign-in', per: 'per', delTom: 'Delivery tomorrow', del2: 'Delivery in 2 days', loadMore: 'Load more', noRes: 'No products match these filters', noResHint: 'Remove a filter or try another subcategory.', show: 'Show', apply: 'Apply', back: 'Back', remove: 'Remove', signedIn: 'Signed in. Your business prices are now shown.', supplierAdded: 'Supplier added: ', wholesale: 'Wholesale', empty: 'No products in this category yet.', searchAmong: function (n) { return 'Search among ' + n + ' products…'; }, minPrice: 'Min Price', maxPrice: 'Max Price', categoriesBtn: 'Categories', onlyMine: 'Only My Vendors', showing: function (a, b, n) { return 'Showing from ' + a + ' to ' + b + ' products out of '; }, addToCart: 'Add to Cart', matchPrice: 'Match My Price', ribbon: 'Get 5-10% Off EXTRA!', useCoupon: 'Use Coupon', moreCoupons: 'View 2 more coupons', supplierName: 'Supplier Name:', liveEmpty: 'No active products that match your filter', liveEmptyHint: 'Adjust your filters or try again later', searchCats: 'Search..',
      products: function (n) { return n + (n === 1 ? ' product' : ' products'); }, minOrder: function (n, u) { return 'Min ' + n + ' ' + u; }, left: function (n) { return 'Only ' + n + ' left'; }, tierHint: function (p, n, u) { return 'BHD ' + p + ' from ' + n + ' ' + u; }, tierReached: function (p) { return 'Tier price BHD ' + p + ' applied'; }, tierMore: function (k, u, p) { return 'Add ' + k + ' more ' + u + ' for BHD ' + p + ' each'; }, line: function (t) { return 'Line total BHD ' + t; }, added: function (q, u, n) { return 'Added ' + q + ' ' + u + ' · ' + n; }, items: function (n, s) { return n + (n === 1 ? ' item' : ' items') + ' from ' + s + (s === 1 ? ' supplier' : ' suppliers'); }, shown: function (a, b) { return 'Showing ' + a + ' of ' + b; }, off: function (p) { return p + '% off'; } },
    ar: { categories: 'الأقسام', brands: 'العلامات', cart: 'السلة', home: 'الرئيسية', account: 'حسابي', search: 'ابحث بالاسم أو الفئة أو العلامة', filters: 'التصفية', sortBy: 'الترتيب', clearAll: 'مسح الكل', viewCart: 'عرض السلة', best: 'الأكثر مبيعًا', priceAsc: 'السعر: من الأقل', unitAsc: 'سعر الوحدة: من الأقل', newest: 'الأحدث', offers: 'العروض', again: 'طلبته سابقًا', mine: 'مورّديّ', mineHint: 'الموردون الذين تطلب منهم', againHint: 'منتجات في طلب سابق', supplier: 'المورّد', brand: 'العلامة', price: 'السعر (د.ب)', min: 'من', max: 'إلى', deals: 'العروض', offer: 'خصم', bulk: 'سعر الجملة', subcats: 'الأقسام الفرعية', moreIn: 'المزيد في ', allIn: 'الكل في ', add: 'أضف', signIn: 'سجّل الدخول للطلب', addSupplier: 'أضف المورّد للطلب', notYours: 'هذا المورّد غير مضاف بعد. إضافته خطوة واحدة.', listPrice: 'السعر المعلن', bizLock: 'سعرك التجاري بعد تسجيل الدخول', per: 'لكل', delTom: 'التوصيل غدًا', del2: 'التوصيل خلال يومين', loadMore: 'عرض المزيد', noRes: 'لا توجد منتجات بهذه التصفية', noResHint: 'أزل تصفية أو جرّب قسمًا آخر.', show: 'عرض', apply: 'تطبيق', back: 'رجوع', remove: 'إزالة', signedIn: 'تم تسجيل الدخول. تظهر الآن أسعارك التجارية.', supplierAdded: 'تمت إضافة المورّد: ', wholesale: 'جملة', empty: 'لا توجد منتجات في هذه الفئة بعد.', searchAmong: function (n) { return 'ابحث ضمن ' + n + ' منتجًا…'; }, minPrice: 'أقل سعر', maxPrice: 'أعلى سعر', categoriesBtn: 'الفئات', onlyMine: 'موردوني فقط', showing: function (a, b, n) { return 'عرض من ' + a + ' إلى ' + b + ' من أصل '; }, addToCart: 'أضف إلى السلة', matchPrice: 'طابق سعري', ribbon: 'خصم إضافي 5-10%!', useCoupon: 'استخدم الكوبون', moreCoupons: 'عرض كوبونين آخرين', supplierName: 'اسم المورد:', liveEmpty: 'لا توجد منتجات نشطة تطابق التصفية', liveEmptyHint: 'عدّل التصفية أو حاول لاحقًا', searchCats: 'بحث..',
      products: function (n) { return n + ' منتج'; }, minOrder: function (n, u) { return 'الحد الأدنى ' + n + ' ' + u; }, left: function (n) { return 'بقي ' + n + ' فقط'; }, tierHint: function (p, n, u) { return p + ' د.ب عند ' + n + ' ' + u; }, tierReached: function (p) { return 'تم تطبيق سعر الكمية ' + p + ' د.ب'; }, tierMore: function (k, u, p) { return 'أضف ' + k + ' ' + u + ' ليصبح السعر ' + p + ' د.ب'; }, line: function (t) { return 'الإجمالي ' + t + ' د.ب'; }, added: function (q, u, n) { return 'تمت إضافة ' + q + ' ' + u + ' · ' + n; }, items: function (n, s) { return n + ' منتجات من ' + s + ' مورّدين'; }, shown: function (a, b) { return 'عرض ' + a + ' من ' + b; }, off: function (p) { return 'خصم ' + p + '٪'; } }
  };

  /* ---------- category and product drawings (proposal) ---------- */
  var ART = {
    milk: '<svg viewBox="0 0 64 64"><path d="M22 8h20v8l6 10v30H16V26l6-10z" fill="#fff" stroke="#0a579a" stroke-width="3" stroke-linejoin="round"/><path d="M16 36h32v12H16z" fill="#9cc9f0"/></svg>',
    carton: '<svg viewBox="0 0 64 64"><path d="M16 20l8-10h16l8 10v34H16z" fill="#fff" stroke="#0a579a" stroke-width="3"/><path d="M16 20h32" stroke="#0a579a" stroke-width="3"/><rect x="22" y="30" width="20" height="14" rx="2" fill="#188bdf"/></svg>',
    cup: '<svg viewBox="0 0 64 64"><path d="M14 18h36l-5 38H19z" fill="#ffd27a" stroke="#a1530b" stroke-width="3" stroke-linejoin="round"/><path d="M12 12h40v6H12z" fill="#fff" stroke="#a1530b" stroke-width="3"/></svg>',
    egg: '<svg viewBox="0 0 64 64"><ellipse cx="22" cy="36" rx="10" ry="13" fill="#fff" stroke="#a1530b" stroke-width="3"/><ellipse cx="42" cy="36" rx="10" ry="13" fill="#fff" stroke="#a1530b" stroke-width="3"/><path d="M8 44h48v10H8z" fill="#e8c9a0" stroke="#a1530b" stroke-width="3"/></svg>',
    cheese: '<svg viewBox="0 0 64 64"><path d="M8 44l40-24 8 8v16z" fill="#ffd27a" stroke="#a1530b" stroke-width="3" stroke-linejoin="round"/><circle cx="30" cy="40" r="3" fill="#e0a93a"/><circle cx="44" cy="36" r="2.5" fill="#e0a93a"/></svg>',
    chicken: '<svg viewBox="0 0 64 64"><path d="M14 38c0-12 10-20 22-20 9 0 14 6 14 13 0 11-10 17-22 17-8 0-14-3-14-10z" fill="#f6d2b0" stroke="#a1530b" stroke-width="3"/><path d="M48 30l8-4M48 36l8 2" stroke="#a1530b" stroke-width="3" stroke-linecap="round"/></svg>',
    meat: '<svg viewBox="0 0 64 64"><path d="M12 30c4-12 22-16 34-10s10 20-2 26-28 4-32-6z" fill="#e8747a" stroke="#8f2a31" stroke-width="3"/><ellipse cx="30" cy="33" rx="6" ry="4" fill="#fff"/></svg>',
    leaf: '<svg viewBox="0 0 64 64"><path d="M32 56V26M32 34c-12 0-18-8-18-18 12 0 18 6 18 18zM32 30c0-12 8-20 20-20 0 12-8 20-20 20z" fill="#9fd4a8" stroke="#16794c" stroke-width="3" stroke-linejoin="round"/></svg>',
    grape: '<svg viewBox="0 0 64 64"><g fill="#8b6fc7" stroke="#4b3a86" stroke-width="2.5"><circle cx="24" cy="24" r="7"/><circle cx="38" cy="24" r="7"/><circle cx="31" cy="35" r="7"/><circle cx="20" cy="37" r="6"/><circle cx="42" cy="37" r="6"/><circle cx="31" cy="48" r="6"/></g><path d="M31 17V8" stroke="#16794c" stroke-width="3" stroke-linecap="round"/></svg>',
    bread: '<svg viewBox="0 0 64 64"><path d="M10 34c0-12 10-18 22-18s22 6 22 18v16H10z" fill="#e8c38e" stroke="#a1530b" stroke-width="3" stroke-linejoin="round"/><path d="M22 30v10M32 28v12M42 30v10" stroke="#a1530b" stroke-width="2.5" stroke-linecap="round"/></svg>',
    juice: '<svg viewBox="0 0 64 64"><path d="M22 12h20v6l4 8v30H18V26l4-8z" fill="#ffb347" stroke="#a1530b" stroke-width="3" stroke-linejoin="round"/><path d="M18 34h28v10H18z" fill="#fff"/></svg>',
    butter: '<svg viewBox="0 0 64 64"><path d="M10 30l14-10h30v20L40 50H10z" fill="#fff2b3" stroke="#a1530b" stroke-width="3" stroke-linejoin="round"/><path d="M10 30h30v20M40 30l14-10" fill="none" stroke="#a1530b" stroke-width="3"/></svg>',
    fish: '<svg viewBox="0 0 64 64"><path d="M8 32c8-12 22-16 34-10l12-8v36l-12-8c-12 6-26 2-34-10z" fill="#9fd0df" stroke="#0a579a" stroke-width="3" stroke-linejoin="round"/><circle cx="20" cy="29" r="2.5" fill="#0a579a"/></svg>',
    deli: '<svg viewBox="0 0 64 64"><circle cx="30" cy="34" r="18" fill="#f3a7a7" stroke="#8f2a31" stroke-width="3"/><circle cx="30" cy="34" r="9" fill="#f8cccc"/></svg>'
  };
  var PLACEHOLDER = ic('image', 'ph');

  /* ---------- state ---------- */
  var S = { lang: 'en', view: 'desk', user: 'buyer', ver: 'a', catOpen: false, slug: 'fresh-foods-dairy', sort: 'best', f: M.blank(), draft: null, cart: {}, limit: 12, events: [], menuOpen: false, menuL0: null, menuL1: null, menuCol: 0, sheet: null, lastPageview: null, focusTitle: false };
  try { var saved = JSON.parse(localStorage.getItem('hb-subcat-proto') || '{}'); ['lang', 'view', 'user', 'ver'].forEach(function (k) { if (saved[k]) S[k] = saved[k]; }); } catch (e) {}
  var save = function () { try { localStorage.setItem('hb-subcat-proto', JSON.stringify({ lang: S.lang, view: S.view, user: S.user, ver: S.ver })); } catch (e) {} };
  var t = function (k) { return T[S.lang][k]; };
  var n = function (node) { return M.name(node, S.lang); };
  var href = function (slug) { return '#' + slug; };
  var current = function () { return M.BY[S.slug] || M.TREE[0]; };
  var isMobile = function () { return S.view === 'mob' || window.innerWidth < 760; };
  var guest = function () { return S.user === 'guest'; };

  /* ---------- tracking: PostHog stand-in. One $pageview per navigation, never per keystroke. */
  window.posthog = window.posthog || { capture: function (ev, props) { S.events.unshift({ ev: ev, props: props, at: new Date().toLocaleTimeString() }); S.events = S.events.slice(0, 30); renderLog(); } };
  var track = function (from, to, source) { window.posthog.capture('storefront_subcategory_selected', { from_category: from ? from.slug : null, to_category: to.slug, level: to.level, source: source }); };

  /* ---------- routing ---------- */
  var go = function (slug, source, fromNode) { var to = M.BY[slug]; if (!to) return; if (source) track(fromNode || current(), to, source); closeMenu(); if (location.hash !== '#' + slug) location.hash = slug; else render(); };
  window.addEventListener('hashchange', function () { S.focusTitle = true; S.slug = (location.hash || '#').slice(1) || 'fresh-foods-dairy'; if (!M.BY[S.slug]) S.slug = 'fresh-foods-dairy'; S.f = M.blank(); S.limit = 12; S.pageNo = 1; S.sheet = null; S.catOpen = false; render(); var sc = $('scroller'); if (sc && S.view === 'mob') sc.scrollTo(0, 0); else window.scrollTo({ top: 0, behavior: 'auto' }); });

  /* ---------- pieces ---------- */
  var LOGO = '<a href="#fresh-foods-dairy" class="logo" aria-label="Highbase home"><svg viewBox="0 0 191 28" width="152" height="22"><text x="0" y="21" font-family="Public Sans" font-size="22" font-weight="700" letter-spacing="2" fill="var(--hb-color-primary-700)">HIGHBASE</text></svg></a>';
  var action = function (icon, count, collapse, id) { return '<span class="hb-header__action"' + (collapse ? ' data-collapse' : '') + '><button class="hb-btn hb-icon-btn" data-intent="secondary" data-style="ghost" data-size="md" aria-label="' + icon + '"' + (id ? ' id="' + id + '"' : '') + '><span class="hb-btn__icon">' + ic(icon) + '</span></button>' + (count ? '<span class="hb-badge" data-variant="count" data-color="primary">' + count + '</span>' : '') + '</span>'; };
  var cartCount = function () { return Object.keys(S.cart).filter(function (k) { return S.cart[k] > 0; }).length; };

  var header = function () {
    return '<header class="hb-header" data-view="marketplace" data-size="expanded">' + LOGO +
      '<span class="hb-header__nav"><button class="hb-header__pill" data-mega aria-expanded="' + S.menuOpen + '" aria-controls="mega">' + ic('grid') + '<span>' + t('categories') + '</span><span data-mirror>' + ic('chevronDown') + '</span></button><button class="hb-header__pill">' + ic('tag') + '<span>' + t('brands') + '</span></button></span>' +
      '<span class="hb-header__search"><span class="hb-search" data-state="default"><span class="hb-search__icon">' + ic('search') + '</span><input class="hb-search__input" id="hdr-search" placeholder="' + t('search') + '"></span></span>' +
      '<span class="hb-header__actions">' + action('gift', '1', 1) + action('cart', cartCount() ? String(cartCount()) : '', 0, 'cart-btn') + action('message', '', 1) + action('notification', '4', 1) + '</span>' +
      '<span class="hb-header__language"><button class="hb-header__pill" data-lang>' + ic('globe') + '<span>' + (S.lang === 'ar' ? 'English' : 'العربية') + '</span></button></span>' +
      '<button class="hb-header__account" data-account><span class="hb-avatar" data-shape="square" data-size="40">' + (guest() ? ic('user') : 'AN') + '</span><span class="hb-header__account-lines"><span class="hb-header__account-name">' + (guest() ? t('signIn').replace(/ to order| للطلب/, '') : 'Al Noor Cafeteria') + '</span>' + (guest() ? '' : '<span class="hb-header__account-branch">' + (S.lang === 'ar' ? 'الفرع: Manama' : 'Branch: Manama') + '</span>') + '</span>' + (guest() ? '' : '<span data-mirror>' + ic('chevronDown') + '</span>') + '</button>' +
      mega() + '</header>';
  };
  var mega = function () {
    var cur = current(); var l0 = S.menuL0 || cur; while (l0.parent) l0 = l0.parent;
    var l1 = S.menuL1 || (l0.children.indexOf(cur.parent) >= 0 ? cur.parent : l0.children.indexOf(cur) >= 0 ? cur : l0.children[0]);
    var item = function (node, level, open, thumb) { return '<a class="mega__item" href="' + href(node.slug) + '" data-slug="' + node.slug + '" data-level="' + level + '"' + (open ? ' data-open="true"' : '') + (node === cur ? ' aria-current="page"' : '') + '>' + (thumb ? '<span class="mega__thumb">' + (ART[node.img] || PLACEHOLDER) + '</span>' : '') + '<span>' + esc(n(node)) + '</span>' + (node.children.length ? '<span data-mirror>' + ic('chevronRight') + '</span>' : '') + '</a>'; };
    var cols = ['<div class="mega__col"' + (S.menuCol === 0 ? ' data-active' : '') + '>' + M.TREE.map(function (c) { return item(c, 0, c === l0, true); }).join('') + '</div>',
      '<div class="mega__col"' + (S.menuCol === 1 ? ' data-active' : '') + '><button class="mega__back" data-megaback="0">' + ic('arrowLeft') + ' ' + esc(n(l0)) + '</button><a class="mega__all" href="' + href(l0.slug) + '" data-slug="' + l0.slug + '">' + t('allIn') + esc(n(l0)) + '</a>' + l0.children.map(function (c) { return item(c, 1, c === l1); }).join('') + '</div>',
      '<div class="mega__col"' + (S.menuCol === 2 ? ' data-active' : '') + '>' + (l1 ? '<button class="mega__back" data-megaback="1">' + ic('arrowLeft') + ' ' + esc(n(l1)) + '</button><a class="mega__all" href="' + href(l1.slug) + '" data-slug="' + l1.slug + '">' + t('allIn') + esc(n(l1)) + '</a>' + l1.children.map(function (c) { return item(c, 2); }).join('') : '') + '</div>'];
    return '<nav id="mega" class="mega" aria-label="' + t('categories') + '"' + (S.menuOpen ? '' : ' hidden') + '>' + cols.join('') + '</nav>';
  };
  var crumbs = function (cur) {
    var items = M.breadcrumb(cur, S.lang);
    return '<nav class="crumbs" aria-label="Breadcrumb"><ol class="hb-crumbs">' + items.map(function (it, i) { var sep = i ? '<span class="hb-crumbs__sep" aria-hidden="true">•</span>' : ''; return '<li>' + sep + (it.current ? '<span class="hb-crumbs__current" aria-current="page">' + esc(it.name) + '</span>' : '<a class="hb-crumbs__link" href="' + (it.slug ? href(it.slug) : '#fresh-foods-dairy') + '" data-slug="' + (it.slug || '') + '" data-source="breadcrumb">' + esc(it.name) + '</a>') + '</li>'; }).join('') + '</ol></nav>';
  };
  var card = function (node) { return '<li><a class="scard" href="' + href(node.slug) + '" data-slug="' + node.slug + '" data-source="card"><span class="scard__img" aria-hidden="true">' + PLACEHOLDER + '</span><span class="scard__name">' + esc(n(node)) + '</span></a></li>'; };
  var pill = function (node, cur) { return '<li><a class="pill" href="' + href(node.slug) + '" data-slug="' + node.slug + '" data-source="pill"' + (node === cur ? ' aria-current="page"' : '') + '>' + esc(n(node)) + '</a></li>'; };
  var subsection = function (cur) {
    var sec = M.section(cur);
    if (sec.kind === 'cards') return '<section class="subs" aria-labelledby="subs-h"><h2 class="subs__title" id="subs-h">' + t('subcats') + '</h2><ul class="subs__grid">' + sec.items.map(card).join('') + '</ul></section>';
    if (sec.kind === 'pills') return '<section class="subs" aria-labelledby="pills-h"><ul class="pills"><li class="pills__label" id="pills-h">' + t('moreIn') + esc(n(sec.parent)) + '</li>' + sec.items.map(function (s) { return pill(s, cur); }).join('') + '</ul></section>';
    return '';
  };

  /* ---------- filter panel (shared by the side panel and the mobile sheet) ---------- */
  var check = function (key, value, label, count, on) { return '<label class="hb-check fopt' + (count || on ? '' : ' fopt--dim') + '"><input type="checkbox" class="hb-check__input" data-fk="' + key + '" value="' + esc(value) + '"' + (on ? ' checked' : '') + '><span class="hb-check__box"></span><span class="hb-check__label">' + esc(label) + '</span><span class="fopt__n">' + count + '</span></label>'; };
  var toggle = function (key, label, hint, on) { return '<label class="hb-switch ftgl"><input type="checkbox" role="switch" class="hb-switch__input" data-ft="' + key + '"' + (on ? ' checked' : '') + '><span class="hb-switch__track"></span><span class="hb-switch__label">' + label + (hint ? '<small>' + hint + '</small>' : '') + '</span></label>'; };
  var group = function (title, body, open) { return '<details class="fgroup"' + (open ? ' open' : '') + '><summary>' + title + '<span data-mirror>' + ic('chevronDown') + '</span></summary><div class="fgroup__body">' + body + '</div></details>'; };
  var facets = function (f) {
    var cur = current();
    var opts = function (key, labelOf) { return M.options(cur, f, key).sort(function (a, b) { return b.n - a.n; }).map(function (o) { return check(key, o.value, labelOf ? labelOf(o.value) : o.value, o.n, f[key].indexOf(o.value) >= 0); }).join(''); };
    var price = '<div class="range"><div class="hb-field hb-textfield" data-size="sm"><div class="hb-field__control"><input class="hb-field__input" type="number" inputmode="decimal" min="0" step="0.5" placeholder="' + t('min') + '" data-fr="min" value="' + esc(f.min) + '"></div></div><span class="range__dash">–</span><div class="hb-field hb-textfield" data-size="sm"><div class="hb-field__control"><input class="hb-field__input" type="number" inputmode="decimal" min="0" step="0.5" placeholder="' + t('max') + '" data-fr="max" value="' + esc(f.max) + '"></div></div></div>';
    return group(t('price'), price, true) + group(t('brand'), opts('brand'), true) + group(t('supplier'), toggle('mine', t('mine'), t('mineHint'), f.mine) + opts('supplier'), true) + '<div class="fgroup fgroup--flat">' + toggle('again', t('again'), t('againHint'), f.again) + '</div>';
  };
  var panel = function () { var k = M.activeCount(S.f); return '<aside class="fpanel hb-card" id="fpanel" aria-label="' + t('filters') + '"><div class="fpanel__head"><h2 class="hb-card__title">' + t('filters') + '</h2>' + (k ? '<button class="hb-btn" data-intent="primary" data-style="ghost" data-size="sm" data-clearall><span class="hb-btn__label">' + t('clearAll') + '</span></button>' : '') + '</div>' + facets(S.f) + '</aside>'; };

  var SORTS = [['best', 'best'], ['priceAsc', 'priceAsc'], ['unitAsc', 'unitAsc'], ['newest', 'newest']];
  var toolbar = function () {
    var k = M.activeCount(S.f);
    var promo = function (key, label) { return '<button class="hb-chip promo" data-style="' + (S.f[key] ? 'tonal' : 'neutral') + '" data-size="lg" data-promo="' + key + '" aria-pressed="' + S.f[key] + '"><span class="hb-chip__label">' + label + '</span></button>'; };
    var promos = '<div class="promos">' + promo('again', t('again')) + '<button class="hb-chip promo" data-style="' + (S.f.deal.indexOf('offer') >= 0 ? 'tonal' : 'neutral') + '" data-size="lg" data-deal="offer" aria-pressed="' + (S.f.deal.indexOf('offer') >= 0) + '"><span class="hb-chip__label">' + t('offers') + '</span></button>' + promo('mine', t('mine')) + '</div>';
    var sortSel = '<label class="sortl"><span>' + t('sortBy') + '</span><span class="hb-field hb-textfield sortsel" data-size="sm"><span class="hb-field__control"><select id="sort" class="hb-field__input">' + SORTS.map(function (s) { return '<option value="' + s[0] + '"' + (S.sort === s[0] ? ' selected' : '') + '>' + t(s[1]) + '</option>'; }).join('') + '</select><span class="hb-field__icon" data-mirror>' + ic('chevronDown') + '</span></span></span></label>';
    var mbtns = '<div class="mbtns"><button class="hb-btn" data-intent="secondary" data-style="outlined" data-size="lg" id="open-filter"><span class="hb-btn__icon">' + ic('filter') + '</span><span class="hb-btn__label">' + t('filters') + (k ? ' <span class="hb-badge" data-variant="count" data-color="primary">' + k + '</span>' : '') + '</span></button><button class="hb-btn" data-intent="secondary" data-style="outlined" data-size="lg" id="open-sort"><span class="hb-btn__icon">' + ic('sort') + '</span><span class="hb-btn__label">' + t(SORTS.filter(function (s) { return s[0] === S.sort; })[0][1]) + '</span></button></div>';
    if (S.ver === 'c') { var base = M.apply(current(), S.f).length, search = '<span class="hb-search tool__search" data-state="default"><span class="hb-search__icon">' + ic('search') + '</span><input class="hb-search__input" id="list-search" value="' + esc(S.f.q || '') + '" placeholder="' + t('searchAmong')(base) + '"></span>'; return '<div class="tool tool--c">' + search + sortSel + mbtns + '</div>' + '<div class="tool">' + promos + '</div>'; }
    return '<div class="tool">' + mbtns + promos + '<span class="tool__sp"></span>' + sortSel + '</div>';
  };
  var applied = function () {
    var ch = []; S.f.brand.forEach(function (v) { ch.push(['brand', v, t('brand') + ': ' + v]); }); S.f.supplier.forEach(function (v) { ch.push(['supplier', v, t('supplier') + ': ' + v]); }); S.f.deal.forEach(function (v) { ch.push(['deal', v, t(v)]); });
    if (S.f.q) ch.push(['q', '', '“' + S.f.q + '”']); if (S.f.min !== '') ch.push(['min', '', t('min') + ' ' + S.f.min]); if (S.f.max !== '') ch.push(['max', '', t('max') + ' ' + S.f.max]); ['mine', 'again'].forEach(function (k) { if (S.f[k]) ch.push([k, '', t(k)]); });
    if (!ch.length) return '';
    return '<div class="applied">' + ch.map(function (c) { return '<button class="hb-chip" data-style="tonal" data-size="md" data-rm="' + c[0] + '" data-v="' + esc(c[1]) + '" aria-label="' + t('remove') + ' ' + esc(c[2]) + '"><span class="hb-chip__label">' + esc(c[2]) + '</span><span class="hb-chip__icon">' + ic('close') + '</span></button>'; }).join('') + '<button class="hb-btn" data-intent="primary" data-style="ghost" data-size="sm" data-clearall><span class="hb-btn__label">' + t('clearAll') + '</span></button></div>';
  };

  /* ---------- product card: the system's Product Card with the proposal's content ---------- */
  var product = function (p) {
    var q = S.cart[p.id] || 0, unitP = fmt(p.price / p.unit[0]);
    var media = '<div class="hb-pcard__media" style="background-color:' + p.tone + '"><div class="hb-pcard__media-top"><span class="badges">' + (p.off ? '<span class="hb-chip" data-style="tonal" data-size="sm" data-tone="offer"><span class="hb-chip__label">' + t('off')(p.off) + '</span></span>' : '') + (!guest() && p.again ? '<span class="hb-chip" data-style="tonal" data-size="sm"><span class="hb-chip__label">' + t('again') + '</span></span>' : '') + '</span><button class="hb-btn hb-icon-btn" data-intent="secondary" data-style="filled" data-size="md" aria-pressed="false" aria-label="Save"><span class="hb-btn__icon">' + ic('bookmark') + '</span></button></div><span class="pcard-art">' + (ART[p.glyph] || '<span class="pcard-ph">' + (S.lang === 'ar' ? 'صورة المنتج<br>قريبًا' : 'Product Image<br>Coming Soon') + '</span>') + '</span><div class="hb-pcard__media-bottom"><span class="hb-chip" data-style="tonal" data-size="sm"><span class="hb-chip__icon">' + ic('store') + '</span><span class="hb-chip__label">' + t('wholesale') + '</span></span></div></div>';
    var price, tier = '', act, msg = '';
    if (guest()) {
      price = '<div class="hb-pcard__row hb-pcard__price"><span class="hb-pcard__price-label">' + t('listPrice') + '</span><span class="hb-pcard__price-value"><span class="hb-pcard__amount"><span class="hb-pcard__currency">BHD</span><span class="hb-pcard__figure">' + fmt(p.price * 1.08) + '</span></span><span class="hb-pcard__per">/ ' + esc(p.pu) + '</span></span></div><div class="lock">' + ic('hide') + t('bizLock') + '</div>';
      act = '<button class="hb-btn" data-intent="primary" data-style="outlined" data-size="lg" data-width="fill" data-signin><span class="hb-btn__label">' + t('signIn') + '</span></button>';
    } else {
      var cur = M.priceFor(p, q || p.moq);
      price = '<div class="hb-pcard__row hb-pcard__price"><span class="hb-pcard__price-label">' + t('price') .replace(/ \(.*\)|\s*\(د\.ب\)/, '') + '</span><span class="hb-pcard__price-value"><span class="hb-pcard__amount"><span class="hb-pcard__currency">BHD</span><span class="hb-pcard__figure">' + fmt(q ? cur : p.price) + '</span></span><span class="hb-pcard__per">/ ' + esc(p.pu) + '</span></span></div><div class="unit">BHD ' + unitP + ' ' + t('per') + ' ' + esc(p.unit[1]) + ' · ' + esc(p.pk) + '</div>';
      if (p.tiers.length) tier = '<span class="tier">' + t('tierHint')(fmt(p.tiers[0][1]), p.tiers[0][0], p.pus) + '</span>';
      if (!p.mine) { act = '<button class="hb-btn" data-intent="primary" data-style="outlined" data-size="lg" data-width="fill" data-supplier="' + p.id + '"><span class="hb-btn__label">' + t('addSupplier') + '</span></button>'; msg = '<div class="linemsg">' + t('notYours') + '</div>'; }
      else if (!q) { act = '<span class="hb-atc" data-state="add"><button class="hb-btn" data-intent="primary" data-style="filled" data-size="lg" data-width="fill" data-add="' + p.id + '"><span class="hb-btn__icon">' + ic('cart') + '</span><span class="hb-btn__label">' + t('add') + '</span></button></span>'; msg = '<div class="linemsg">' + t('minOrder')(p.moq, p.moq > 1 ? p.pus : p.pu) + '</div>'; }
      else {
        var single = q <= p.moq;
        act = '<span class="hb-atc" data-state="' + (single ? 'stepper-single' : 'stepper') + '"><button class="hb-btn hb-icon-btn hb-atc__step" data-intent="' + (single ? 'danger' : 'secondary') + '" data-style="ghost" data-size="md" data-dec="' + p.id + '" aria-label="' + (single ? t('remove') : 'Decrease') + '"><span class="hb-btn__icon">' + ic(single ? 'delete' : 'minus') + '</span></button><input class="hb-atc__value" type="number" inputmode="numeric" min="0" value="' + q + '" data-q="' + p.id + '" id="q-' + p.id + '" aria-label="Quantity"><button class="hb-btn hb-icon-btn hb-atc__step" data-intent="secondary" data-style="ghost" data-size="md" data-inc="' + p.id + '" aria-label="Increase"><span class="hb-btn__icon">' + ic('add') + '</span></button></span>';
        var m = t('line')(fmt(q * cur)); if (p.tiers.length) { var mn = p.tiers[0][0], v = p.tiers[0][1]; m += q >= mn ? ' · <b>' + t('tierReached')(fmt(v)) + '</b>' : ' · ' + t('tierMore')(mn - q, p.pus, fmt(v)); }
        msg = '<div class="linemsg">' + m + '</div>';
      }
    }
    var meta = '<div class="meta"><span class="hb-pcard__supplier">' + ic('store') + '<span class="hb-pcard__supplier-name">' + esc(p.sup) + '</span></span><span class="hb-pcard__supplier">' + ic('truck') + '<span>' + (p.dl === 1 ? t('delTom') : t('del2')) + (p.left ? ' · <b class="warn">' + t('left')(p.left) + '</b>' : '') + '</span></span></div>';
    return '<article class="hb-pcard" data-supplier="' + (p.mine ? 'known' : 'foreign') + '">' + media + '<div class="hb-pcard__body"><span class="hb-pcard__title">' + esc(p.name) + '</span><span class="pack">' + esc(p.pk) + ' · ' + esc(p.brand) + '</span>' + price + tier + meta + '<div class="hb-pcard__actions">' + act + msg + '</div></div></article>';
  };


  /* ---------- Version B: the live page's logic + subcategory tiles + breadcrumb ---------- */
  var liveCard = function (p) {
    var unitTag = (p.pk.split('×')[1] || p.pk).trim();
    var media = '<div class="hb-pcard__media" style="background-color:' + p.tone + '"><div class="hb-pcard__media-top"><span class="tags"><span class="hb-chip" data-style="neutral" data-size="sm"><span class="hb-chip__label">' + esc(unitTag) + '</span></span><span class="hb-chip" data-style="neutral" data-size="sm"><span class="hb-chip__label">' + esc(p.pu) + '</span></span></span><button class="hb-btn hb-icon-btn" data-intent="secondary" data-style="filled" data-size="md" aria-pressed="false" aria-label="Save"><span class="hb-btn__icon">' + ic('bookmark') + '</span></button></div><span class="pcard-art">' + (ART[p.glyph] || '<span class="pcard-ph">' + (S.lang === 'ar' ? 'صورة المنتج<br>قريبًا' : 'Product Image<br>Coming Soon') + '</span>') + '</span><div class="hb-pcard__media-bottom"><span class="hb-chip" data-style="tonal" data-size="sm"><span class="hb-chip__icon">' + ic('store') + '</span><span class="hb-chip__label">' + t('wholesale') + '</span></span></div></div>';
    var coupon = p.off ? '<div class="hb-pcard__row hb-pcard__coupon"><span class="coupon__l">' + t('useCoupon') + ' <span class="hb-pcard__pill hb-pcard__coupon-pill">-' + p.off + '%</span><br>' + ic('coupon') + ' CP' + p.off + '</span><span class="hb-pcard__coupon-after">BHD ' + fmt(p.price * (1 - p.off / 100)) + '</span></div><a class="coupon__more" href="#' + S.slug + '">' + t('moreCoupons') + '</a>' : '';
    return '<article class="hb-pcard live" data-supplier="known">' + media + '<div class="hb-pcard__body"><span class="hb-pcard__title">' + esc(p.name) + '</span>' +
      '<div class="hb-pcard__row hb-pcard__price"><span class="hb-pcard__price-label">' + t('price').replace(/ \(.*\)|\s*\(د\.ب\)/, '') + '</span><span class="hb-pcard__price-value"><span class="hb-pcard__amount"><span class="hb-pcard__currency">BHD</span><span class="hb-pcard__figure">' + fmt(p.price) + '</span></span></span></div>' + coupon +
      '<div class="hb-pcard__supplier">' + ic('store') + '<span>' + t('supplierName') + '</span><span class="hb-pcard__supplier-name">' + esc(p.sup) + '</span></div>' +
      '<div class="hb-pcard__actions"><button class="hb-btn" data-intent="primary" data-style="filled" data-size="lg" data-width="fill" data-livecart="' + p.id + '"><span class="hb-btn__icon">' + ic('cart') + '</span><span class="hb-btn__label">' + t('addToCart') + '</span></button><div class="hb-pcard__match"><button class="hb-btn" data-intent="primary" data-style="outlined" data-size="lg" data-width="fill"><span class="hb-btn__label">' + t('matchPrice') + '</span></button><span class="hb-pcard__ribbon">' + t('ribbon') + '</span></div></div></div></article>';
  };
  var catPopup = function () {
    var cur = current(); var l0 = cur; while (l0.parent) l0 = l0.parent; var l1 = cur.level === 2 ? cur.parent : cur.level === 1 ? cur : null;
    var row = function (node, on) { return '<label class="hb-check catrow' + (on ? ' catrow--open' : '') + '"><input type="checkbox" class="hb-check__input" data-catnav="' + node.slug + '"' + (node === cur ? ' checked' : '') + '><span class="hb-check__box"></span><span class="hb-check__label">' + esc(n(node)) + '</span></label>'; };
    return '<div class="catpop" role="dialog" aria-label="' + t('categoriesBtn') + '"><div class="catpop__col catpop__col--first"><span class="hb-search catpop__search" data-state="default"><span class="hb-search__icon">' + ic('search') + '</span><input class="hb-search__input" placeholder="' + t('searchCats') + '"></span>' + M.TREE.map(function (c) { return row(c, c === l0); }).join('') + '</div><div class="catpop__col">' + l0.children.map(function (c) { return row(c, c === l1); }).join('') + '</div><div class="catpop__col">' + (l1 ? l1.children.map(function (c) { return row(c, false); }).join('') : '') + '</div></div>';
  };
  var pageB = function () {
    var cur = current(), f = M.blank(); f.min = S.f.min; f.max = S.f.max; f.mine = S.f.mine; var q = (S.f.q || '').trim().toLowerCase();
    var list = M.apply(cur, f).filter(function (p) { return !q || (p.name + ' ' + p.brand + ' ' + p.sup).toLowerCase().indexOf(q) >= 0; }), total = M.count(cur), per = 8, pages = Math.max(1, Math.ceil(list.length / per)), pg = Math.min(S.pageNo || 1, pages), shown = list.slice((pg - 1) * per, pg * per);
    var back = cur.parent ? '<a class="back" href="' + href(cur.parent.slug) + '" data-slug="' + cur.parent.slug + '" data-source="breadcrumb"><span data-mirror>' + ic('chevronLeft') + '</span>' + esc(n(cur.parent)) + '</a>' : '<a class="back" href="#fresh-foods-dairy"><span data-mirror>' + ic('chevronLeft') + '</span>' + t('home') + '</a>';
    var bar = '<div class="lbar" role="search"><span class="hb-search" data-state="default"><span class="hb-search__icon">' + ic('search') + '</span><input class="hb-search__input" id="list-search" value="' + esc(S.f.q || '') + '" placeholder="' + t('searchAmong')(list.length) + '"></span><input class="lbar__price" inputmode="decimal" placeholder="' + t('minPrice') + '" data-fr="min" value="' + esc(S.f.min) + '"><input class="lbar__price" inputmode="decimal" placeholder="' + t('maxPrice') + '" data-fr="max" value="' + esc(S.f.max) + '"><span class="lbar__cats"><button class="lbar__btn" data-catbtn aria-haspopup="dialog" aria-expanded="' + S.catOpen + '"><span>' + t('categoriesBtn') + '</span>' + ic('filter') + '</button>' + (S.catOpen ? catPopup() : '') + '</span></div>' +
      '<div class="lmeta"><label class="hb-switch"><input type="checkbox" role="switch" class="hb-switch__input" data-ft="mine"' + (S.f.mine ? ' checked' : '') + '><span class="hb-switch__track"></span><span class="hb-switch__label">' + t('onlyMine') + '</span></label><span class="lmeta__sep" aria-hidden="true"></span><span>' + t('showing')(list.length ? (pg - 1) * per + 1 : 0, Math.min(pg * per, list.length)) + '<b>' + list.length + '</b></span></div>';
    var grid = list.length ? '<div class="grid grid--live">' + shown.map(liveCard).join('') + '</div>' : '<div class="hb-empty" data-size="sm"><span class="hb-empty__art">' + ic('package') + '</span><span class="hb-empty__title">' + t('liveEmpty') + '</span><span class="hb-empty__text">' + t('liveEmptyHint') + '</span></div>';
    var pageBtn = function (i) { return '<button class="hb-page" data-page="' + i + '"' + (i === pg ? ' aria-current="page"' : '') + '>' + i + '</button>'; };
    var pager = pages > 1 ? '<div class="pager"><div class="hb-pagination" data-size="compact"><span class="hb-pagination__controls"><button class="hb-btn hb-icon-btn" data-intent="primary" data-style="filled" data-size="md" data-page="' + (pg - 1) + '"' + (pg === 1 ? ' disabled' : '') + ' aria-label="Previous page"><span class="hb-btn__icon" data-mirror>' + ic('arrowLeft') + '</span></button><span class="hb-pagination__strip">' + Array.apply(null, Array(pages)).map(function (_, i) { return pageBtn(i + 1); }).join('') + '</span><button class="hb-btn hb-icon-btn" data-intent="primary" data-style="filled" data-size="md" data-page="' + (pg + 1) + '"' + (pg === pages ? ' disabled' : '') + ' aria-label="Next page"><span class="hb-btn__icon" data-mirror>' + ic('arrowRight') + '</span></button></span></div></div>' : '';
    return '<div class="body body--live"><main class="page" id="main"><div class="page__head page__head--live">' + back + '<h1 class="page__title">' + esc(n(cur)) + ' <span class="page__count">' + t('products')(total) + '</span></h1>' + crumbs(cur) + '</div>' + subsection(cur) + bar + grid + pager + '</main></div>';
  };
  var page = function () {
    var cur = current(), q = (S.f.q || '').trim().toLowerCase(), list = M.sort(M.apply(cur, S.f), S.sort).filter(function (p) { return !q || (p.name + ' ' + p.brand + ' ' + p.sup).toLowerCase().indexOf(q) >= 0; }), total = M.count(cur), shown = list.slice(0, S.limit);
    var back = cur.parent ? '<a class="back" href="' + href(cur.parent.slug) + '" data-slug="' + cur.parent.slug + '" data-source="breadcrumb"><span data-mirror>' + ic('chevronLeft') + '</span>' + esc(n(cur.parent)) + '</a>' : '<a class="back" href="#fresh-foods-dairy"><span data-mirror>' + ic('chevronLeft') + '</span>' + t('home') + '</a>';
    var grid = list.length ? '<div class="grid">' + shown.map(product).join('') + '</div>' : '<div class="hb-empty" data-size="sm"><span class="hb-empty__art">' + ic('search') + '</span><span class="hb-empty__title">' + t('noRes') + '</span><span class="hb-empty__text">' + t('noResHint') + '</span><span class="hb-empty__actions"><button class="hb-btn" data-intent="primary" data-style="outlined" data-size="md" data-clearall><span class="hb-btn__label">' + t('clearAll') + '</span></button></span></div>';
    var more = list.length ? '<div class="more"><span>' + t('shown')(Math.min(S.limit, list.length), list.length) + '</span>' + (list.length > S.limit ? '<button class="hb-btn" data-intent="primary" data-style="outlined" data-size="lg" id="load-more"><span class="hb-btn__label">' + t('loadMore') + '</span></button>' : '') + '</div>' : '';
    return '<div class="body">' + panel() + '<main class="page" id="main"><div class="page__head">' + back + crumbs(cur) + '<h1 class="page__title">' + esc(n(cur)) + ' <span class="page__count">' + t('products')(total) + '</span></h1></div>' + subsection(cur) + toolbar() + applied() + grid + more + '</main></div>';
  };
  var bnav = function () { var it = function (icon, label, on) { return '<span class="bnav__item' + (on ? ' bnav__item--on' : '') + '">' + ic(icon) + '<span>' + label + '</span></span>'; }; return '<nav class="bnav" aria-label="Main">' + it('home', t('home')) + it('grid', t('categories'), true) + it('cart', t('cart')) + it('user', t('account')) + '</nav>'; };
  var cartbar = function () {
    var ids = Object.keys(S.cart).filter(function (k) { return S.cart[k] > 0; }); if (!ids.length || guest()) return '';
    var tot = ids.reduce(function (s, k) { var p = M.byId(k); return s + S.cart[k] * M.priceFor(p, S.cart[k]); }, 0), sups = {}; ids.forEach(function (k) { sups[M.byId(k).sup] = 1; });
    return '<div class="cartbar" role="region" aria-label="' + t('cart') + '"><div><div class="cartbar__t">BHD ' + fmt(tot) + '</div><div class="cartbar__s">' + t('items')(ids.length, Object.keys(sups).length) + '</div></div><button class="hb-btn cartbar__btn" data-intent="secondary" data-style="filled" data-size="lg"><span class="hb-btn__icon">' + ic('cart') + '</span><span class="hb-btn__label">' + t('viewCart') + '</span></button></div>';
  };
  var sheets = function () {
    if (!S.sheet) return '';
    var head = function (title) { return '<div class="hb-dlg-header" data-size="compact"><span class="hb-dlg-header__title">' + title + '</span><button class="hb-btn hb-icon-btn" data-intent="secondary" data-style="ghost" data-size="sm" aria-label="Close" data-close><span class="hb-btn__icon">' + ic('close') + '</span></button></div>'; };
    var body = S.sheet === 'filter'
      ? head(t('filters')) + '<div class="hb-sheet__body" id="sheet-body">' + facets(S.draft) + '</div><div class="hb-dlg-actions" data-direction="row"><button class="hb-btn" data-intent="secondary" data-style="outlined" data-size="lg" id="sheet-clear"><span class="hb-btn__label">' + t('clearAll') + '</span></button><button class="hb-btn" data-intent="primary" data-style="filled" data-size="lg" id="sheet-show"><span class="hb-btn__label">' + t('show') + ' ' + t('products')(M.apply(current(), S.draft).length) + '</span></button></div>'
      : head(t('sortBy')) + '<div class="hb-sheet__body">' + SORTS.map(function (s) { return '<label class="hb-radio sortopt"><input type="radio" name="msort" class="hb-radio__input" value="' + s[0] + '"' + (S.sort === s[0] ? ' checked' : '') + '><span class="hb-radio__circle"></span><span class="hb-radio__label">' + t(s[1]) + '</span></label>'; }).join('') + '</div>';
    return '<div class="sheet-layer" data-sheet><div class="hb-sheet" role="dialog" aria-modal="true"><div class="hb-sheet__grabber"><i></i></div>' + body + '</div></div>';
  };
  var chrome = function () {
    var seg = function (id, key, opts) { return '<span class="px-seg" role="group" aria-label="' + id + '"><b>' + id + '</b>' + opts.map(function (o) { return '<button data-set="' + key + '" data-v="' + o[0] + '" aria-pressed="' + (S[key] === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</span>'; };
    return '<div class="px-bar"><span class="px-title">Prototype</span>' + seg('Version', 'ver', [['a', 'A · Side filters'], ['b', 'B · Live + tiles'], ['c', 'C · Side filters + search']]) + seg('Preview', 'view', [['desk', 'Desktop'], ['mob', 'Mobile']]) + seg('Viewing as', 'user', [['buyer', 'Signed-in buyer'], ['guest', 'Guest']]) + seg('Language', 'lang', [['en', 'English'], ['ar', 'العربية']]) + '<span class="px-seg"><a class="px-link" href="#delicatessen">No children</a><a class="px-link" href="#fresh-milk">Lowest level</a></span></div>';
  };
  var renderLog = function () { var el = $('px-log'); if (!el) return; el.innerHTML = '<summary>PostHog events (' + S.events.length + ')</summary><ol>' + (S.events.length ? S.events.map(function (e) { return '<li><b>' + e.ev + '</b> ' + e.at + '\n' + esc(JSON.stringify(e.props)) + '</li>'; }).join('') : '<li>Nothing yet.</li>') + '</ol>'; };

  var render = function () {
    var cur = current(), mob = isMobile();
    document.documentElement.lang = S.lang; document.documentElement.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
    document.title = n(cur) + ' · Highbase';
    var frame = $('frame'); frame.className = 'frame' + (S.view === 'mob' ? ' frame--phone' : '');
    frame.innerHTML = '<div class="addr" aria-hidden="true"><span class="addr__dots"><i></i><i></i><i></i></span><span class="addr__url">staging.highbasemarket.com' + esc(M.url(cur.slug, S.lang)) + '</span></div><div class="app' + (mob ? ' m' : '') + ' ver-' + S.ver + '" id="app"><div class="scroller" id="scroller">' + header() + (S.ver === 'b' ? pageB() : page()) + '</div>' + (mob ? bnav() : '') + cartbar() + sheets() + '<div id="px-scrim" class="scrim"' + (S.menuOpen ? '' : ' hidden') + '></div><div class="toast" id="toast" hidden></div></div>';
    $('px-chrome').innerHTML = chrome();
    if (S.lastPageview !== cur.slug + S.lang) { S.lastPageview = cur.slug + S.lang; window.posthog.capture('$pageview', { path: M.url(cur.slug, S.lang), category: cur.slug, level: cur.level }); }
    renderLog();
    if (S.focusTitle) { S.focusTitle = false; var h = document.querySelector('.page__title'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
    if (S.sheet) { var f = document.querySelector('[data-sheet] button, [data-sheet] input'); if (f) f.focus(); }
  };
  var closeMenu = function () { if (!S.menuOpen) return; S.menuOpen = false; S.menuCol = 0; S.menuL0 = S.menuL1 = null; render(); };
  var toastTimer; var toast = function (msg) { var el = $('toast'); if (!el) return; el.hidden = false; el.innerHTML = '<div class="hb-alert hb-snackbar" data-status="success" role="status"><span class="hb-snackbar__group"><span class="hb-alert__icon">' + ic('check') + '</span><span class="hb-alert__body">' + esc(msg) + '</span></span><span class="hb-alert__actions"><button class="hb-btn" data-intent="secondary" data-style="ghost" data-size="sm" style="--btn-text:var(--a-text)" data-toast-link><span class="hb-btn__label">' + t('viewCart') + '</span></button></span></div>'; clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, 2800); };
  var setQty = function (id, q, focus) { var p = M.byId(id); q = Math.max(0, Math.round(q || 0)); if (q > 0 && q < p.moq) q = p.moq; var had = S.cart[id] || 0; S.cart[id] = q; render(); if (!had && q) toast(t('added')(q, q > 1 ? p.pus : p.pu, p.name)); if (focus) { var i = $('q-' + id); if (i) { i.focus(); i.select && i.select(); } } };

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var el;
    if ((el = e.target.closest('[data-set]'))) { S[el.getAttribute('data-set')] = el.getAttribute('data-v'); S.sheet = null; save(); render(); return; }
    if (e.target.closest('[data-lang]')) { S.lang = S.lang === 'ar' ? 'en' : 'ar'; save(); render(); return; }
    if (e.target.closest('[data-mega]')) { S.menuOpen = !S.menuOpen; S.menuCol = 0; render(); return; }
    if ((el = e.target.closest('[data-megaback]'))) { S.menuCol = +el.getAttribute('data-megaback'); render(); return; }
    if (e.target.id === 'px-scrim') { closeMenu(); return; }
    if (e.target.closest('[data-catbtn]')) { S.catOpen = !S.catOpen; render(); return; }
    if (S.catOpen && !e.target.closest('.catpop')) { S.catOpen = false; render(); }
    if ((el = e.target.closest('[data-page]')) && !el.disabled) { S.pageNo = +el.getAttribute('data-page'); render(); var mm = document.querySelector('.lbar'); if (mm) mm.scrollIntoView({ block: 'start' }); return; }
    if ((el = e.target.closest('[data-livecart]'))) { var lp = M.byId(el.getAttribute('data-livecart')); S.cart[lp.id] = (S.cart[lp.id] || 0) + lp.moq; render(); toast(t('added')(lp.moq, lp.moq > 1 ? lp.pus : lp.pu, lp.name)); return; }
    if ((el = e.target.closest('a[data-slug]'))) {
      var slug = el.getAttribute('data-slug'), node = M.BY[slug];
      if (el.classList.contains('mega__item') && isMobile() && node && node.children.length) { e.preventDefault(); if (node.level === 0) { S.menuL0 = node; S.menuL1 = null; S.menuCol = 1; } else { S.menuL1 = node; S.menuCol = 2; } render(); return; }
      e.preventDefault(); var source = el.classList.contains('mega__item') || el.classList.contains('mega__all') ? 'mega_menu' : el.getAttribute('data-source'); if (slug) go(slug, source); else location.hash = 'fresh-foods-dairy'; return;
    }
    if (!e.target.closest('#mega')) { if (S.menuOpen && !e.target.closest('[data-mega]')) closeMenu(); }
    if ((el = e.target.closest('[data-promo]'))) { var k = el.getAttribute('data-promo'); S.f[k] = !S.f[k]; S.limit = 12; render(); return; }
    if ((el = e.target.closest('[data-deal]'))) { var d = el.getAttribute('data-deal'), i = S.f.deal.indexOf(d); i >= 0 ? S.f.deal.splice(i, 1) : S.f.deal.push(d); S.limit = 12; render(); return; }
    if ((el = e.target.closest('[data-rm]'))) { var rk = el.getAttribute('data-rm'); if (Array.isArray(S.f[rk])) { var ri = S.f[rk].indexOf(el.getAttribute('data-v')); if (ri >= 0) S.f[rk].splice(ri, 1); } else if (rk === 'min' || rk === 'max' || rk === 'q') S.f[rk] = ''; else S.f[rk] = false; render(); return; }
    if (e.target.closest('[data-clearall]')) { S.f = M.blank(); S.limit = 12; render(); return; }
    if ((el = e.target.closest('[data-add]'))) { var pa = M.byId(el.getAttribute('data-add')); setQty(pa.id, pa.moq, true); return; }
    if ((el = e.target.closest('[data-inc]'))) { var id1 = el.getAttribute('data-inc'); setQty(id1, (S.cart[id1] || 0) + 1); return; }
    if ((el = e.target.closest('[data-dec]'))) { var id2 = el.getAttribute('data-dec'), pd = M.byId(id2), qd = (S.cart[id2] || 0) - 1; setQty(id2, qd < pd.moq ? 0 : qd); return; }
    if (e.target.closest('[data-signin]') || (guest() && e.target.closest('[data-account]'))) { S.user = 'buyer'; save(); render(); toast(t('signedIn')); return; }
    if ((el = e.target.closest('[data-supplier]'))) { var ps = M.byId(el.getAttribute('data-supplier')); M.ALL.forEach(function (x) { if (x.sup === ps.sup) x.mine = true; }); render(); toast(t('supplierAdded') + ps.sup); return; }
    if (e.target.closest('#load-more')) { S.limit += 12; render(); return; }
    if (e.target.closest('#open-filter')) { S.draft = M.clone(S.f); S.sheet = 'filter'; render(); return; }
    if (e.target.closest('#open-sort')) { S.sheet = 'sort'; render(); return; }
    if (e.target.closest('[data-close]') || (e.target.hasAttribute && e.target.hasAttribute('data-sheet'))) { S.sheet = null; S.draft = null; render(); return; }
    if (e.target.closest('#sheet-clear')) { S.draft = M.blank(); render(); return; }
    if (e.target.closest('#sheet-show')) { S.f = S.draft; S.draft = null; S.sheet = null; S.limit = 12; render(); return; }
    if (e.target.closest('[data-toast-link]')) { $('toast').hidden = true; return; }
  });
  document.addEventListener('change', function (e) {
    var el = e.target, inSheet = !!el.closest('[data-sheet]'), f = inSheet ? S.draft : S.f;
    if (el.id === 'sort') { S.sort = el.value; render(); return; }
    if (el.name === 'msort') { S.sort = el.value; S.sheet = null; render(); return; }
    if (el.hasAttribute('data-q')) { setQty(el.getAttribute('data-q'), +el.value); return; }
    if (el.hasAttribute('data-catnav')) { S.catOpen = false; go(el.getAttribute('data-catnav'), 'filter_popup'); return; }
    if (el.hasAttribute('data-fk')) { var k = el.getAttribute('data-fk'), v = el.value, i = f[k].indexOf(v); if (el.checked && i < 0) f[k].push(v); if (!el.checked && i >= 0) f[k].splice(i, 1); }
    else if (el.hasAttribute('data-ft')) f[el.getAttribute('data-ft')] = el.checked;
    else if (el.hasAttribute('data-fr')) f[el.getAttribute('data-fr')] = el.value;
    else return;
    if (!inSheet) S.limit = 12; render();
  });
  var st; document.addEventListener('input', function (e) { var el = e.target; if (el.id !== 'list-search') return; var v = el.value; clearTimeout(st); st = setTimeout(function () { S.f.q = v; S.pageNo = 1; render(); var i2 = $('list-search'); if (i2) { i2.focus(); try { i2.setSelectionRange(v.length, v.length); } catch (x) {} } }, 300); });
  var it; document.addEventListener('input', function (e) { var el = e.target; if (!el.hasAttribute || !el.hasAttribute('data-fr')) return; var inSheet = !!el.closest('[data-sheet]'), f = inSheet ? S.draft : S.f, k = el.getAttribute('data-fr'), v = el.value; clearTimeout(it); it = setTimeout(function () { if (f[k] === v) return; f[k] = v; if (!inSheet) S.limit = 12; render(); var again = document.querySelector('[data-fr="' + k + '"]' + (inSheet ? '[data-sheet] ' : '')); var n2 = inSheet ? document.querySelector('[data-sheet] [data-fr="' + k + '"]') : document.querySelector('.fpanel [data-fr="' + k + '"], .lbar [data-fr="' + k + '"]'); if (n2) { n2.focus(); try { n2.setSelectionRange && n2.setSelectionRange(n2.value.length, n2.value.length); } catch (x) {} } }, 350); });
  document.addEventListener('mouseover', function (e) { if (!S.menuOpen || isMobile()) return; var a = e.target.closest('.mega__item'); if (!a) return; var node = M.BY[a.getAttribute('data-slug')]; if (!node || !node.children.length || node.level > 1) return; if (node.level === 0 && S.menuL0 !== node) { S.menuL0 = node; S.menuL1 = null; render(); } else if (node.level === 1 && S.menuL1 !== node) { S.menuL1 = node; render(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (S.sheet) { S.sheet = null; render(); } else if (S.menuOpen) { closeMenu(); var b = document.querySelector('[data-mega]'); if (b) b.focus(); } } });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { var m = !!document.querySelector('.app.m'); if (m !== isMobile()) render(); }, 120); });

  /* ---------- boot ---------- */
  var h = (location.hash || '').slice(1); S.slug = M.BY[h] ? h : 'fresh-foods-dairy'; if (!M.BY[h]) history.replaceState(null, '', '#' + S.slug); render();
})();
