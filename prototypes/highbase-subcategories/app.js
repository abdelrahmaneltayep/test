/* Highbase — subcategory pages prototype. Renders from HBModel; hash routing stands
   in for Inertia visits (one slug per URL, Back works, reload restores). */
(function () {
  'use strict';
  var M = window.HBModel;
  var ic = function (n, cls) { return '<svg class="hb-i ' + (cls || '') + '" aria-hidden="true"><use href="#hb-i-' + n + '"/></svg>'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- category images (proposal): transparent-background drawings, as the
     brief expects PNG/WebP. Keys match model.img. Anything without a key gets the
     neutral placeholder icon, never alt text. */
  var ART = {
    milk: '<svg viewBox="0 0 64 64"><path d="M24 8h16v8l6 10v30H18V26l6-10z" fill="#eef4fb" stroke="#0b6dbe" stroke-width="2"/><rect x="18" y="34" width="28" height="12" fill="#0b6dbe"/><text x="32" y="43" font-size="7" font-family="Public Sans" font-weight="700" fill="#fff" text-anchor="middle">MILK</text></svg>',
    carton: '<svg viewBox="0 0 64 64"><path d="M16 20l8-10h16l8 10v34H16z" fill="#fff" stroke="#0a579a" stroke-width="2"/><path d="M16 20h32" stroke="#0a579a" stroke-width="2"/><rect x="22" y="30" width="20" height="14" rx="2" fill="#188bdf"/></svg>',
    cup: '<svg viewBox="0 0 64 64"><path d="M14 18h36l-4 36H18z" fill="#fe9203" stroke="#cb6a03" stroke-width="2"/><ellipse cx="32" cy="18" rx="18" ry="4" fill="#fff7d3" stroke="#cb6a03" stroke-width="2"/><rect x="22" y="30" width="20" height="10" rx="2" fill="#fff"/></svg>',
    cheese: '<svg viewBox="0 0 64 64"><path d="M8 44L56 24v20H8z" fill="#ffdb6d" stroke="#cb6a03" stroke-width="2"/><circle cx="24" cy="38" r="3" fill="#fff7d3"/><circle cx="40" cy="34" r="2.5" fill="#fff7d3"/><circle cx="34" cy="40" r="2" fill="#fff7d3"/></svg>',
    egg: '<svg viewBox="0 0 64 64"><path d="M32 8c10 0 18 14 18 26a18 18 0 11-36 0C14 22 22 8 32 8z" fill="#fff" stroke="#909ba0" stroke-width="2"/><path d="M24 30c0-6 3-12 6-14" stroke="#eaeced" stroke-width="3" stroke-linecap="round"/></svg>',
    bread: '<svg viewBox="0 0 64 64"><path d="M10 30a10 10 0 0110-10h24a10 10 0 010 20v14H20V40a10 10 0 01-10-10z" fill="#ffbf33" stroke="#a1530b" stroke-width="2"/><path d="M26 28l6 6 6-6" stroke="#a1530b" stroke-width="2" fill="none"/></svg>',
    apple: '<svg viewBox="0 0 64 64"><path d="M32 22c6-6 18-4 18 10 0 10-6 22-12 22-2 0-4-1-6-1s-4 1-6 1c-6 0-12-12-12-22 0-14 12-16 18-10z" fill="#d91811"/><path d="M32 22c0-6 3-9 7-10" stroke="#09651c" stroke-width="2" fill="none"/><path d="M34 14c4-2 8 0 8 4-4 2-8 0-8-4z" fill="#00b522"/></svg>'
  };
  var PLACEHOLDER = ic('image', 'ph');

  /* ---------- state ---------- */
  var S = { lang: 'en', slug: 'fresh-foods-dairy', events: [], menuOpen: false, menuL0: null, menuL1: null, menuCol: 0, lastPageview: null };
  try { S.lang = localStorage.getItem('hb-subcat-lang') || 'en'; } catch (e) {}
  var t = function (en, ar) { return S.lang === 'ar' ? ar : en; };
  var n = function (node) { return M.name(node, S.lang); };
  var href = function (slug) { return '#' + slug; };

  /* ---------- tracking: PostHog stand-in. One $pageview per navigation, never per keystroke. */
  window.posthog = window.posthog || { capture: function (ev, props) { S.events.unshift({ ev: ev, props: props, at: new Date().toLocaleTimeString() }); S.events = S.events.slice(0, 30); renderLog(); } };
  var track = function (from, to, source) {
    window.posthog.capture('storefront_subcategory_selected', { from_category: from ? from.slug : null, to_category: to.slug, level: to.level, source: source });
  };

  /* ---------- routing ---------- */
  var current = function () { return M.BY[S.slug] || M.TREE[0]; };
  var go = function (slug, source, fromNode) {
    var to = M.BY[slug]; if (!to) return;
    if (source) track(fromNode || current(), to, source);
    closeMenu();
    if (location.hash !== '#' + slug) location.hash = slug; // hashchange → render
    else render();
  };
  window.addEventListener('hashchange', function () { S.focusTitle = true; S.slug = (location.hash || '#').slice(1) || 'fresh-foods-dairy'; if (!M.BY[S.slug]) S.slug = 'fresh-foods-dairy'; render(); window.scrollTo({ top: 0, behavior: 'auto' }); });

  /* ---------- rendering ---------- */
  var LOGO = '<a href="#fresh-foods-dairy" class="logo" aria-label="Highbase home" style="display:inline-flex"><svg viewBox="0 0 191 28" width="152" height="22"><text x="0" y="21" font-family="Public Sans" font-size="22" font-weight="700" letter-spacing="2" fill="var(--hb-color-primary-700)">HIGHBASE</text></svg></a>';
  var action = function (icon, count, collapse) { return '<span class="hb-header__action"' + (collapse ? ' data-collapse' : '') + '><button class="hb-btn hb-icon-btn" data-intent="secondary" data-style="ghost" data-size="md" aria-label="' + icon + '"><span class="hb-btn__icon">' + ic(icon) + '</span></button>' + (count ? '<span class="hb-badge" data-variant="count" data-color="primary">' + count + '</span>' : '') + '</span>'; };

  var header = function () {
    return '<header class="hb-header" data-view="marketplace" data-size="expanded">' + LOGO +
      '<span class="hb-header__nav"><button class="hb-header__pill" data-mega aria-expanded="' + S.menuOpen + '" aria-controls="mega">' + ic('grid') + '<span>' + t('Categories', 'الفئات') + '</span><span data-mirror>' + ic('chevronDown') + '</span></button><button class="hb-header__pill">' + ic('tag') + '<span>' + t('Brands', 'العلامات التجارية') + '</span></button></span>' +
      '<span class="hb-header__search"><span class="hb-search" data-state="default"><span class="hb-search__icon">' + ic('search') + '</span><input class="hb-search__input" id="hdr-search" placeholder="' + t('Search by name, category or brand', 'ابحث بالاسم أو الفئة أو العلامة') + '"></span></span>' +
      '<span class="hb-header__actions">' + action('gift', '1', 1) + action('cart', '', 0) + action('message', '', 1) + action('notification', '4', 1) + '</span>' +
      '<span class="hb-header__language"><button class="hb-header__pill" data-lang>' + ic('globe') + '<span>' + t('العربية', 'English') + '</span></button></span>' +
      '<button class="hb-header__account"><span class="hb-avatar" data-shape="square" data-size="40">LB</span><span class="hb-header__account-lines"><span class="hb-header__account-name">' + t('Local Buyer', 'مشترٍ محلي') + '</span><span class="hb-header__account-branch">' + t('Branch: Andaleeb_Logistics', 'الفرع: Andaleeb_Logistics') + '</span></span><span data-mirror>' + ic('chevronDown') + '</span></button>' +
      mega() + '</header>';
  };

  // Mega menu: three columns kept; every entry at every level is a link to that category's page.
  var mega = function () {
    var cur = current();
    var l0 = S.menuL0 || cur.parent && cur.parent.parent || cur.parent || cur; while (l0.parent) l0 = l0.parent;
    var l1 = S.menuL1 || (l0.children.indexOf(cur.parent) >= 0 ? cur.parent : l0.children.indexOf(cur) >= 0 ? cur : l0.children[0]);
    var item = function (node, level, open, thumb) { return '<a class="mega__item" href="' + href(node.slug) + '" data-slug="' + node.slug + '" data-level="' + level + '"' + (open ? ' data-open="true"' : '') + (node === cur ? ' aria-current="page"' : '') + '>' + (thumb ? '<span class="mega__thumb">' + (ART[node.img] || PLACEHOLDER) + '</span>' : '') + '<span>' + esc(n(node)) + '</span>' + (node.children.length ? '<span data-mirror>' + ic('chevronRight') + '</span>' : '') + '</a>'; };
    var cols = [
      '<div class="mega__col"' + (S.menuCol === 0 ? ' data-active' : '') + ' role="list">' + M.TREE.map(function (c) { return item(c, 0, c === l0, true); }).join('') + '</div>',
      '<div class="mega__col"' + (S.menuCol === 1 ? ' data-active' : '') + ' role="list"><button class="mega__back" data-megaback="0">' + ic('arrowLeft') + ' ' + esc(n(l0)) + '</button><a class="mega__all" href="' + href(l0.slug) + '" data-slug="' + l0.slug + '" data-level="0">' + t('All in ', 'الكل في ') + esc(n(l0)) + '</a>' + l0.children.map(function (c) { return item(c, 1, c === l1); }).join('') + '</div>',
      '<div class="mega__col"' + (S.menuCol === 2 ? ' data-active' : '') + ' role="list">' + (l1 ? '<button class="mega__back" data-megaback="1">' + ic('arrowLeft') + ' ' + esc(n(l1)) + '</button><a class="mega__all" href="' + href(l1.slug) + '" data-slug="' + l1.slug + '" data-level="1">' + t('All in ', 'الكل في ') + esc(n(l1)) + '</a>' + l1.children.map(function (c) { return item(c, 2); }).join('') : '') + '</div>'
    ];
    return '<nav id="mega" class="mega" aria-label="' + t('Categories', 'الفئات') + '"' + (S.menuOpen ? '' : ' hidden') + '>' + cols.join('') + '</nav>';
  };

  var crumbs = function (cur) {
    var items = M.breadcrumb(cur, S.lang);
    return '<nav class="hb-crumbs crumbs" aria-label="' + t('Breadcrumb', 'مسار التنقل') + '"><ol class="hb-crumbs" style="padding:0;margin:0;list-style:none">' + items.map(function (it, i) {
      var sep = i ? '<span class="hb-crumbs__sep" aria-hidden="true">•</span>' : '';
      if (it.current) return '<li style="display:flex;align-items:center">' + sep + '<span class="hb-crumbs__current" aria-current="page">' + esc(it.name) + '</span></li>';
      return '<li style="display:flex;align-items:center">' + sep + '<a class="hb-crumbs__link" href="' + (it.slug ? href(it.slug) : '#fresh-foods-dairy') + '" data-slug="' + (it.slug || '') + '" data-source="breadcrumb">' + esc(it.name) + '</a></li>';
    }).join('') + '</ol></nav>';
  };

  var card = function (node) {
    return '<li><a class="scard" href="' + href(node.slug) + '" data-slug="' + node.slug + '" data-source="card"><span class="scard__img" aria-hidden="true">' + (ART[node.img] || PLACEHOLDER) + '</span><span class="scard__name">' + esc(n(node)) + '</span></a></li>';
  };
  var pill = function (node, cur) {
    return '<li><a class="pill" href="' + href(node.slug) + '" data-slug="' + node.slug + '" data-source="pill"' + (node === cur ? ' aria-current="page"' : '') + '>' + esc(n(node)) + '</a></li>';
  };
  var subsection = function (cur) {
    var sec = M.section(cur);
    if (sec.kind === 'cards') return '<section class="subs" aria-labelledby="subs-h"><h2 class="subs__title" id="subs-h">' + t('Subcategories', 'الفئات الفرعية') + '</h2><ul class="subs__grid">' + sec.items.map(card).join('') + '</ul></section>';
    if (sec.kind === 'pills') return '<section class="subs" aria-labelledby="pills-h"><ul class="pills"><li class="pills__label" id="pills-h">' + t('More in ', 'المزيد في ') + esc(n(sec.parent)) + '</li>' + sec.items.map(function (s) { return pill(s, cur); }).join('') + '</ul></section>';
    return '';
  };

  var product = function (p) {
    var media = p.img ? '<span class="pcard-img">' + (ART[['milk', 'cup', 'cheese', 'carton', 'egg'][p.id.length % 5]]) + '</span>' : '<span class="pcard-ph">' + t('Product Image<br>Coming Soon', 'صورة المنتج<br>قريبًا') + '</span>';
    return '<article class="hb-pcard" data-price="regular" data-coupon="' + (p.coupon ? 'single' : 'none') + '" data-cart="add" data-saved="false" data-supplier="known">' +
      '<div class="hb-pcard__media" style="background-color:' + p.tone + '20"><div class="hb-pcard__media-top"><span class="hb-chip" data-style="neutral" data-size="sm"><span class="hb-chip__label">' + p.unit + '</span></span><button class="hb-btn hb-icon-btn" data-intent="secondary" data-style="filled" data-size="md" aria-pressed="false" aria-label="' + t('Save', 'حفظ') + '"><span class="hb-btn__icon">' + ic('bookmark') + '</span></button></div>' + media + '<div class="hb-pcard__media-bottom"><span class="hb-chip" data-style="tonal" data-size="sm"><span class="hb-chip__icon">' + ic('store') + '</span><span class="hb-chip__label">' + t('Wholesale', 'جملة') + '</span></span></div></div>' +
      '<div class="hb-pcard__body"><span class="hb-pcard__title">' + esc(p.name) + '</span>' +
      '<div class="hb-pcard__row hb-pcard__price"><span class="hb-pcard__price-label">' + t('Price', 'السعر') + '</span><span class="hb-pcard__price-value"><span class="hb-pcard__amount"><span class="hb-pcard__currency">BHD</span><span class="hb-pcard__figure">' + p.price.toFixed(3) + '</span></span></span></div>' +
      (p.coupon ? '<div class="hb-pcard__row hb-pcard__coupon"><span class="hb-pcard__pill hb-pcard__coupon-pill">-12%</span><span class="hb-pcard__coupon-code">' + ic('coupon') + 'CP12</span><span class="hb-pcard__coupon-after">BHD ' + (p.price * 0.88).toFixed(3) + '</span></div>' : '') +
      '<div class="hb-pcard__supplier">' + ic('store') + '<span>' + t('Supplier Name:', 'اسم المورد:') + '</span><span class="hb-pcard__supplier-name">LS Company Demo</span></div>' +
      '<div class="hb-pcard__actions"><button class="hb-btn" data-intent="primary" data-style="filled" data-size="lg" data-width="fill"><span class="hb-btn__icon">' + ic('cart') + '</span><span class="hb-btn__label">' + t('Add to Cart', 'أضف إلى السلة') + '</span></button><div class="hb-pcard__match"><button class="hb-btn" data-intent="primary" data-style="outlined" data-size="lg" data-width="fill"><span class="hb-btn__label">' + t('Match My Price', 'طابق سعري') + '</span></button><span class="hb-pcard__ribbon">' + t('Get 5-10% Off EXTRA!', 'خصم إضافي 5-10%!') + '</span></div></div></div></article>';
  };

  var page = function () {
    var cur = current(), list = M.products(cur), count = list.length, shown = list.slice(0, 8);
    var back = cur.parent ? '<a class="back" href="' + href(cur.parent.slug) + '" data-slug="' + cur.parent.slug + '" data-source="breadcrumb"><span data-mirror>' + ic('chevronLeft') + '</span>' + esc(n(cur.parent)) + '</a>' : '<a class="back" href="#fresh-foods-dairy"><span data-mirror>' + ic('chevronLeft') + '</span>' + t('Home', 'الرئيسية') + '</a>';
    return '<main class="page" id="main">' +
      '<div class="page__head">' + back + crumbs(cur) + '<h1 class="page__title">' + esc(n(cur)) + ' <span class="page__count">' + count + ' ' + t('products', 'منتج') + '</span></h1></div>' +
      subsection(cur) +
      '<div class="filters" role="search"><span class="hb-search" data-state="default"><span class="hb-search__icon">' + ic('search') + '</span><input class="hb-search__input" id="list-search" placeholder="' + t('Search among ', 'ابحث ضمن ') + count + t(' products…', ' منتجًا…') + '"></span><input class="filters__price" id="min-price" placeholder="' + t('Min Price', 'أقل سعر') + '" inputmode="decimal"><input class="filters__price" id="max-price" placeholder="' + t('Max Price', 'أعلى سعر') + '" inputmode="decimal"><button class="filters__btn" id="filters-btn" aria-haspopup="dialog"><span>' + t('Filters', 'عوامل التصفية') + '</span>' + ic('filter') + '</button></div>' +
      '<div class="meta"><label class="hb-switch"><input type="checkbox" role="switch" class="hb-switch__input" id="only-vendors" checked><span class="hb-switch__track"></span><span class="hb-switch__label">' + t('Only My Vendors', 'موردوني فقط') + '</span></label><span class="meta__sep" aria-hidden="true"></span><span>' + t('Showing from 1 to ' + shown.length + ' products out of ', 'عرض من 1 إلى ' + shown.length + ' من أصل ') + '<b>' + count + '</b></span></div>' +
      (count ? '<div class="grid">' + shown.map(product).join('') + '</div>' : '<p class="empty">' + t('No products in this category yet.', 'لا توجد منتجات في هذه الفئة بعد.') + '</p>') +
      (count > 8 ? '<div class="pager"><div class="hb-pagination" data-size="compact"><span class="hb-pagination__controls"><button class="hb-btn hb-icon-btn" data-intent="primary" data-style="filled" data-size="md" aria-label="' + t('Previous page', 'الصفحة السابقة') + '"><span class="hb-btn__icon" data-mirror>' + ic('arrowLeft') + '</span></button><span class="hb-pagination__strip"><button class="hb-page" aria-current="page">1</button><button class="hb-page">2</button>' + (count > 16 ? '<button class="hb-page">3</button>' : '') + '</span><button class="hb-btn hb-icon-btn" data-intent="primary" data-style="filled" data-size="md" aria-label="' + t('Next page', 'الصفحة التالية') + '"><span class="hb-btn__icon" data-mirror>' + ic('arrowRight') + '</span></button></span></div></div>' : '') +
      '</main>';
  };

  var chrome = function () {
    var cur = current();
    return '<div class="px-bar"><b>Prototype</b><span class="px-seg" role="group" aria-label="Language"><button data-setlang="en" aria-pressed="' + (S.lang === 'en') + '">English</button><button data-setlang="ar" aria-pressed="' + (S.lang === 'ar') + '">العربية · RTL</button></span><span class="px-url" title="The URL this page would have in the product">' + ic('globe') + '<span>staging.highbasemarket.com' + esc(M.url(cur.slug, S.lang)) + '</span></span><span class="px-seg"><a class="px-link" href="#ready-meals">' + t('Try: no children', 'جرّب: بلا فئات فرعية') + '</a><a class="px-link" href="#fresh-milk">' + t('Try: lowest level', 'جرّب: أدنى مستوى') + '</a></span></div>';
  };
  var renderLog = function () {
    var el = document.getElementById('px-log'); if (!el) return;
    el.innerHTML = '<summary>PostHog events (' + S.events.length + ')</summary><ol>' + (S.events.length ? S.events.map(function (e) { return '<li><b>' + e.ev + '</b> ' + e.at + '\n' + esc(JSON.stringify(e.props)) + '</li>'; }).join('') : '<li>Nothing yet. Use a card, a pill, the breadcrumb or the mega menu.</li>') + '</ol>';
  };

  var render = function () {
    var cur = current();
    document.documentElement.lang = S.lang; document.documentElement.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
    document.title = n(cur) + ' · Highbase';
    document.getElementById('app').innerHTML = chrome() + header() + page();
    if (S.lastPageview !== cur.slug + S.lang) { S.lastPageview = cur.slug + S.lang; window.posthog.capture('$pageview', { path: M.url(cur.slug, S.lang), category: cur.slug, level: cur.level }); }
    renderLog();
    document.getElementById('px-scrim').hidden = !S.menuOpen;
    if (S.focusTitle) { S.focusTitle = false; var h = document.querySelector('.page__title'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
  };

  /* ---------- menu + events ---------- */
  var closeMenu = function () { if (!S.menuOpen) return; S.menuOpen = false; S.menuCol = 0; S.menuL0 = S.menuL1 = null; render(); };
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-setlang]'); if (el) { S.lang = el.getAttribute('data-setlang'); try { localStorage.setItem('hb-subcat-lang', S.lang); } catch (x) {} render(); return; }
    if (e.target.closest('[data-lang]')) { S.lang = S.lang === 'ar' ? 'en' : 'ar'; try { localStorage.setItem('hb-subcat-lang', S.lang); } catch (x) {} render(); return; }
    if (e.target.closest('[data-mega]')) { S.menuOpen = !S.menuOpen; S.menuCol = 0; render(); return; }
    var mb = e.target.closest('[data-megaback]'); if (mb) { S.menuCol = +mb.getAttribute('data-megaback'); render(); return; }
    if (e.target.id === 'px-scrim') { closeMenu(); return; }
    var a = e.target.closest('a[data-slug]');
    if (a) {
      var slug = a.getAttribute('data-slug'), node = M.BY[slug];
      // On phones the mega menu drills down; a parent with children opens its column, "All in" navigates.
      if (a.classList.contains('mega__item') && window.matchMedia('(max-width:759px)').matches && node && node.children.length && !a.classList.contains('mega__all')) {
        e.preventDefault(); if (node.level === 0) { S.menuL0 = node; S.menuL1 = null; S.menuCol = 1; } else { S.menuL1 = node; S.menuCol = 2; } render(); return;
      }
      e.preventDefault();
      var source = a.classList.contains('mega__item') || a.classList.contains('mega__all') ? 'mega_menu' : a.getAttribute('data-source');
      if (slug) go(slug, source); else location.hash = 'fresh-foods-dairy';
      return;
    }
    if (e.target.closest('#filters-btn')) { window.posthog.capture('storefront_filters_opened', { category: current().slug }); return; }
  });
  // Hover reveals columns on desktop (mirrors the live menu); no navigation on hover.
  document.addEventListener('mouseover', function (e) {
    if (!S.menuOpen || window.matchMedia('(max-width:759px)').matches) return;
    var a = e.target.closest('.mega__item'); if (!a) return;
    var node = M.BY[a.getAttribute('data-slug')]; if (!node || !node.children.length || node.level > 1) return;
    if (node.level === 0 && S.menuL0 !== node) { S.menuL0 = node; S.menuL1 = null; render(); }
    else if (node.level === 1 && S.menuL1 !== node) { S.menuL1 = node; render(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.menuOpen) { closeMenu(); document.querySelector('[data-mega]').focus(); } });

  /* ---------- boot ---------- */
  var start = function () {
    var h = (location.hash || '').slice(1);
    S.slug = M.BY[h] ? h : 'fresh-foods-dairy';
    if (!M.BY[h]) history.replaceState(null, '', '#' + S.slug);
    render();
  };
  start();
})();
