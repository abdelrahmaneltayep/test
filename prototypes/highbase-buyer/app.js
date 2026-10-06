/* Highbase buyer journey — prototype app. Hash routing, one render() per state change, vanilla JS. */
(function () {
  'use strict';
  var H = window.HB;
  var $ = function (id) { return document.getElementById(id); };
  var app = $('app'), frame = $('frame'), bar = $('px-bar'), toastsEl = $('toasts');
  var ic = function (n, cls) { return '<svg class="hb-i ' + (cls || '') + '" aria-hidden="true"><use href="#hb-i-' + n + '"/></svg>'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var attr = esc;

  /* ---------- state ---------- */
  var S = { view: 'desk', lang: 'en', user: 'buyer', fail: false, cart: {}, saved: {}, route: null, loading: false,
    mega: { open: false, l0: 'foods', l1: 'dairy' }, drawer: false, drawerCat: null, search: { q: '', open: false, hi: -1 }, sheet: null,
    f: null, recent: H.RECENT.slice(), events: [] };
  try { var saved = JSON.parse(localStorage.getItem('hb-buyer-proto') || '{}'); ['view', 'lang', 'user'].forEach(function (k) { if (saved[k]) S[k] = saved[k]; }); } catch (e) {}
  var persist = function () { try { localStorage.setItem('hb-buyer-proto', JSON.stringify({ view: S.view, lang: S.lang, user: S.user })); } catch (e) {} };
  var guest = function () { return S.user === 'guest'; };
  var mobile = function () { return S.view === 'mob' || window.innerWidth < 760; };
  var blankFilters = function () { return { min: '', max: '', brands: [], sups: [], mine: false, ordered: false, sort: 'relevance' }; };
  S.f = blankFilters();

  /* ---------- tracking (PostHog stand-in; wired through data-event attributes) ---------- */
  window.__hbEvents = S.events;
  var track = function (ev, props) { S.events.unshift({ ev: ev, props: props || {}, at: new Date().toISOString() }); if (window.posthog && window.posthog.capture) window.posthog.capture(ev, props); if (window.console && console.debug) console.debug('[event]', ev, props || {}); };

  /* ---------- copy ---------- */
  var T = {
    en: { home: 'Home', categories: 'Categories', brands: 'Brands', allCategories: 'All categories', rewards: 'Rewards', cart: 'Cart', messages: 'Messages', notifications: 'Notifications', account: 'Account', branch: 'Branch', menu: 'Menu', close: 'Close', signin: 'Sign in', signup: 'Sign up', guest: 'Guest',
      search: 'Search by name, category or brand', recent: 'Recent searches', popular: 'Popular categories', products: 'Products', suppliers: 'Suppliers', seeAll: function (q) { return 'See all results for “' + q + '”'; }, clear: 'Clear',
      shopAll: function (c) { return 'Shop all ' + c; }, viewAll: 'View all', orderAgain: 'Order again', lastOrder: function (id, d) { return 'Your last order ' + id + ' · ' + d; }, reorder: 'Reorder', reorderN: function (n) { return 'Reorder ' + n + ' items'; }, offers: 'This week’s offers', shopCats: 'Shop by category', yourSuppliers: 'Your suppliers', allBrands: 'All brands',
      delivery: function (d) { return d === 1 ? 'Delivers tomorrow' : 'Delivers in ' + d + ' days'; }, tomorrow: 'Tomorrow', days: function (d) { return d + ' days'; }, minOrder: function (n) { return 'BHD ' + n.toFixed(3) + ' minimum'; }, shop: 'Shop', rating: 'rating',
      moreIn: function (p) { return 'More in ' + p; }, inCat: function (c) { return 'Products in ' + c; }, filters: 'Filters', clearAll: 'Clear all', apply: 'Show results', price: 'Price range', min: 'Min', max: 'Max', brand: 'Brand', supplier: 'Supplier', mySuppliers: 'My suppliers only', orderedBefore: 'Ordered before', searchBrands: 'Search brands',
      sortBy: 'Sort by', sort: { relevance: 'Relevance', priceAsc: 'Price: low to high', priceDesc: 'Price: high to low', name: 'Name A–Z', ordered: 'Ordered before first' }, count: function (n) { return n === 1 ? '1 product' : n + ' products'; }, noMatch: 'No products match these filters', noMatchText: 'Try removing a filter or widening the price range.',
      add: 'Add', added: 'Added to cart', viewCart: 'View cart', qtyUpdated: 'Quantity updated', removed: 'Removed from cart', addedN: function (n) { return n + ' items added to cart'; }, perUnit: function (p, u) { return 'BHD ' + p + ' / ' + u; }, from: function (p, q) { return 'From BHD ' + p + ' at ' + q + '+'; }, moq: function (n, u) { return 'Min. ' + n + ' ' + u; }, outUntil: function (d) { return 'Out of stock until ' + d; }, signToOrder: 'Sign up to order', save: 'Save for later', savedTip: 'Saved · tap to remove', wasPrice: 'List price',
      guestTitle: 'Sign up to order', guestLines: ['Wholesale prices from every supplier', 'Pay later with supplier credit terms', 'Delivery to your branch, usually next day'], guestBtn: 'Create a business account', haveAccount: 'I already have an account', listPrice: 'List price',
      footerBlurb: 'HIGHBASE TRADING W.L.L — the wholesale platform for the Gulf’s local trade.', quick: 'Quick links', contact: 'Contact us', about: 'About us', terms: 'Terms & conditions', privacy: 'Privacy policy', help: 'Help centre', downloadApp: 'Download our app', copyright: '© 2026 HIGHBASE. All rights reserved.', message: 'Leave us a message',
      stub: 'This page is built in the next step of the prototype.', pack: 'Pack', packs: 'packs', cur: 'BHD', cartTip: function (n, t) { return n + ' items · BHD ' + t; } },
    ar: { home: 'الرئيسية', categories: 'الأقسام', brands: 'العلامات التجارية', allCategories: 'كل الأقسام', rewards: 'المكافآت', cart: 'السلة', messages: 'الرسائل', notifications: 'الإشعارات', account: 'الحساب', branch: 'الفرع', menu: 'القائمة', close: 'إغلاق', signin: 'تسجيل الدخول', signup: 'إنشاء حساب', guest: 'زائر',
      search: 'ابحث بالاسم أو القسم أو العلامة', recent: 'عمليات البحث الأخيرة', popular: 'أقسام شائعة', products: 'منتجات', suppliers: 'موردون', seeAll: function (q) { return 'عرض كل النتائج لـ «' + q + '»'; }, clear: 'مسح',
      shopAll: function (c) { return 'تسوق كل ' + c; }, viewAll: 'عرض الكل', orderAgain: 'اطلب مجددًا', lastOrder: function (id, d) { return 'طلبك الأخير ' + id + ' · ' + d; }, reorder: 'إعادة الطلب', reorderN: function (n) { return 'إعادة طلب ' + n + ' أصناف'; }, offers: 'عروض هذا الأسبوع', shopCats: 'تسوق حسب القسم', yourSuppliers: 'موردوك', allBrands: 'كل العلامات',
      delivery: function (d) { return d === 1 ? 'التوصيل غدًا' : 'التوصيل خلال ' + d + ' أيام'; }, tomorrow: 'غدًا', days: function (d) { return d + ' أيام'; }, minOrder: function (n) { return 'الحد الأدنى ' + n.toFixed(3) + ' د.ب'; }, shop: 'تسوق', rating: 'التقييم',
      moreIn: function (p) { return 'المزيد في ' + p; }, inCat: function (c) { return 'منتجات ' + c; }, filters: 'التصفية', clearAll: 'مسح الكل', apply: 'عرض النتائج', price: 'نطاق السعر', min: 'الأدنى', max: 'الأعلى', brand: 'العلامة', supplier: 'المورد', mySuppliers: 'موردوي فقط', orderedBefore: 'طلبته من قبل', searchBrands: 'ابحث في العلامات',
      sortBy: 'ترتيب حسب', sort: { relevance: 'الأكثر صلة', priceAsc: 'السعر: من الأقل', priceDesc: 'السعر: من الأعلى', name: 'الاسم', ordered: 'ما طلبته من قبل أولًا' }, count: function (n) { return n + ' منتج'; }, noMatch: 'لا توجد منتجات مطابقة', noMatchText: 'جرّب إزالة أحد الفلاتر أو توسيع نطاق السعر.',
      add: 'أضف', added: 'أُضيف إلى السلة', viewCart: 'عرض السلة', qtyUpdated: 'تم تحديث الكمية', removed: 'أُزيل من السلة', addedN: function (n) { return 'أُضيف ' + n + ' أصناف إلى السلة'; }, perUnit: function (p, u) { return p + ' د.ب / ' + u; }, from: function (p, q) { return 'من ' + p + ' د.ب عند ' + q + '+'; }, moq: function (n, u) { return 'الحد الأدنى ' + n + ' ' + u; }, outUntil: function (d) { return 'غير متوفر حتى ' + d; }, signToOrder: 'سجّل للطلب', save: 'حفظ لاحقًا', savedTip: 'محفوظ · اضغط للإزالة', wasPrice: 'سعر القائمة',
      guestTitle: 'سجّل لتطلب', guestLines: ['أسعار الجملة من كل مورد', 'ادفع لاحقًا بشروط ائتمان المورد', 'التوصيل إلى فرعك، عادةً في اليوم التالي'], guestBtn: 'أنشئ حساب أعمال', haveAccount: 'لدي حساب بالفعل', listPrice: 'سعر القائمة',
      footerBlurb: 'هاي بيس للتجارة ذ.م.م — منصة الجملة للتجارة المحلية في الخليج.', quick: 'روابط سريعة', contact: 'تواصل معنا', about: 'من نحن', terms: 'الشروط والأحكام', privacy: 'سياسة الخصوصية', help: 'مركز المساعدة', downloadApp: 'حمّل تطبيقنا', copyright: '© 2026 هاي بيس. جميع الحقوق محفوظة.', message: 'اترك لنا رسالة',
      stub: 'تُبنى هذه الصفحة في الخطوة التالية من النموذج.', pack: 'عبوة', packs: 'عبوات', cur: 'د.ب', cartTip: function (n, t) { return n + ' أصناف · ' + t + ' د.ب'; } }
  };
  var t = function (k) { return T[S.lang][k]; };
  var cname = function (c) { return S.lang === 'ar' && c.ar ? c.ar : c.en; };
  var fmt = function (n) { return n.toFixed(3); };
  var money = function (n) { return '<span class="num ltr">' + t('cur') + ' ' + fmt(n) + '</span>'; };

  /* ---------- money: the one source of truth ---------- */
  var linePrice = function (p, qty) { var price = p.price; if (p.tiers) p.tiers.forEach(function (tr) { if (qty >= tr[0]) price = tr[1]; }); return price; };
  var listPrice = function (p) { return p.off ? p.price / (1 - p.off / 100) : p.price; };
  var cartItems = function () { return Object.keys(S.cart).filter(function (id) { return S.cart[id] > 0; }).map(function (id) { var p = H.PBY[id], q = S.cart[id]; return { p: p, qty: q, unit: linePrice(p, q), total: linePrice(p, q) * q }; }); };
  var totals = function () {
    var items = cartItems(), sub = 0, disc = 0, sups = {};
    items.forEach(function (it) { sub += it.total; disc += (listPrice(it.p) - it.unit) * it.qty; sups[it.p.sup] = (sups[it.p.sup] || 0) + it.total; });
    var delivery = 0; Object.keys(sups).forEach(function (s) { delivery += H.SBY[s].fee; });
    var vat = Math.round((sub + delivery) * 0.10 * 1000) / 1000;
    return { items: items, count: items.reduce(function (a, it) { return a + it.qty; }, 0), lines: items.length, sub: sub, disc: disc, delivery: delivery, vat: vat, total: sub + delivery + vat, bySupplier: sups };
  };

  /* ---------- routing ---------- */
  var parse = function () {
    var h = (location.hash || '#home').slice(1), q = {}, qi = h.indexOf('?');
    if (qi >= 0) { h.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); }); h = h.slice(0, qi); }
    var parts = h.split('/').filter(Boolean), name = parts[0] || 'home';
    return { name: name, parts: parts.slice(1), q: q, raw: h };
  };
  var go = function (hash) { if (location.hash === hash) render(); else location.hash = hash; };
  var catHref = function (slug) { return '#category/' + H.PATH[slug].map(function (c) { return c.slug; }).join('/'); };
  window.addEventListener('hashchange', function () { S.f = blankFilters(); if (parse().name !== 'search') S.search.q = ''; S.mega.open = false; S.drawer = false; S.search.open = false; S.sheet = null; S.loading = true; render(); window.scrollTo(0, 0); app.scrollTo(0, 0); setTimeout(function () { S.loading = false; render(); }, 350); });

  /* ---------- small pieces ---------- */
  var btn = function (label, o) { o = o || {}; return '<' + (o.href ? 'a href="' + attr(o.href) + '"' : 'button type="' + (o.type || 'button') + '"') + ' class="hb-btn ' + (o.cls || '') + '" data-intent="' + (o.intent || 'primary') + '" data-style="' + (o.style || 'filled') + '" data-size="' + (o.size || 'lg') + '"' + (o.width ? ' data-width="fill"' : '') + (o.act ? ' data-act="' + o.act + '"' : '') + (o.extra || '') + '>' + (o.icon ? '<span class="hb-btn__icon">' + ic(o.icon) + '</span>' : '') + '<span class="hb-btn__label">' + label + '</span></' + (o.href ? 'a' : 'button') + '>'; };
  var iconBtn = function (icon, label, o) { o = o || {}; return '<button type="button" class="hb-btn hb-icon-btn ' + (o.cls || '') + '" data-intent="' + (o.intent || 'secondary') + '" data-style="' + (o.style || 'ghost') + '" data-size="' + (o.size || 'md') + '" aria-label="' + attr(label) + '"' + (o.act ? ' data-act="' + o.act + '"' : '') + (o.extra || '') + '><span class="hb-btn__icon">' + ic(icon) + '</span></button>'; };
  var chip = function (label, o) { o = o || {}; return '<' + (o.href ? 'a href="' + attr(o.href) + '"' : 'button type="button"') + ' class="hb-chip" data-style="' + (o.style || 'outlined') + '" data-size="' + (o.size || 'md') + '"' + (o.act ? ' data-act="' + o.act + '"' : '') + (o.extra || '') + '>' + (o.icon ? '<span class="hb-chip__icon">' + ic(o.icon) + '</span>' : '') + '<span class="hb-chip__label">' + label + '</span>' + (o.remove ? '<span class="hb-chip__icon">' + ic('close') + '</span>' : '') + '</' + (o.href ? 'a' : 'button') + '>'; };
  var badge = function (n, color) { return n ? '<span class="hb-badge" data-variant="count" data-color="' + (color || 'primary') + '">' + n + '</span>' : ''; };
  var ph = function (label, o) { o = o || {}; return '<span class="ph ' + (o.cls || '') + '" aria-hidden="true">' + (o.icon ? ic(o.icon) : '') + (o.nolabel ? '' : '<span>' + esc(label) + '</span>') + '</span>'; };
  var blogo = function (b) { var ini = b.name.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); return '<span class="blogo"><img src="' + attr(b.logo) + '" alt="" loading="lazy" onerror="this.parentNode.setAttribute(\'data-fallback\',\'1\')"><span class="blogo__fb" aria-hidden="true">' + ini + '</span></span>'; };
  var crumbs = function (items) { return '<nav class="hb-crumbs crumbs" aria-label="Breadcrumb">' + items.map(function (it, i) { var last = i === items.length - 1; return (last ? '<span class="hb-crumbs__current" aria-current="page">' + esc(it[0]) + '</span>' : '<a class="hb-crumbs__link" href="' + attr(it[1]) + '">' + esc(it[0]) + '</a><span class="hb-crumbs__sep" aria-hidden="true">·</span>'); }).join('') + '</nav>'; };
  var stars = function (r) { return ic('favourite') + ' ' + r.toFixed(1); };

  /* ---------- header ---------- */
  var LOGO = '<a href="#home" class="logo" aria-label="Highbase home"><svg viewBox="0 0 191 28" width="152" height="22"><text x="0" y="21" font-family="Public Sans" font-size="22" font-weight="700" letter-spacing="2" fill="var(--hb-color-primary-hover)">HIGHBASE</text></svg></a>';
  var act = function (kind, icon, label, count, href, color) { return '<a class="act" data-kind="' + kind + '" href="' + href + '" aria-label="' + attr(label + (count ? ', ' + count : '')) + '"' + (kind === 'cart' ? ' title="' + attr(cartTip()) + '"' : '') + '>' + ic(icon) + '<span class="act__label">' + label + '</span>' + badge(count, color) + '</a>'; };
  var cartTip = function () { var tt = totals(); return tt.count ? t('cartTip')(tt.count, fmt(tt.total)) : t('cart'); };
  var header = function () {
    var tt = totals(), b = H.BUYER;
    return '<header class="hb-header" data-view="marketplace" data-size="' + (mobile() ? 'compact' : 'expanded') + '">' +
      iconBtn('menu', t('menu'), { cls: 'menu-btn', act: 'drawer', size: 'lg' }) + LOGO +
      '<span class="hb-header__nav"><button type="button" class="hb-header__pill" data-act="mega" aria-expanded="' + S.mega.open + '" aria-haspopup="true">' + ic('grid') + '<span>' + t('categories') + '</span><span data-mirror>' + ic('chevronDown') + '</span></button><a class="hb-header__pill" href="#brands">' + ic('tag') + '<span>' + t('brands') + '</span></a></span>' +
      '<form class="hb-header__search" role="search" data-event="search_submitted" data-act="search-submit"><span class="hb-search" data-state="' + (S.search.q ? 'typing' : 'default') + '"><span class="hb-search__icon">' + ic('search') + '</span><input id="q" class="hb-search__input" type="search" autocomplete="off" placeholder="' + attr(t('search')) + '" value="' + attr(S.search.q) + '" aria-label="' + attr(t('search')) + '" aria-expanded="' + S.search.open + '" aria-controls="sdrop">' + (S.search.q ? '<button type="button" class="hb-search__clear" data-act="search-clear" aria-label="' + attr(t('clear')) + '">' + ic('clear') + '</button>' : '') + '</span>' + (S.search.open ? searchDrop() : '') + '</form>' +
      '<span class="acts">' + (guest() ? '' : act('rewards', 'gift', t('rewards'), 2, '#rewards', 'secondary')) + act('cart', 'cart', t('cart'), tt.lines, '#cart', 'primary') + (guest() ? '' : act('messages', 'message', t('messages'), 1, '#messages', 'success') + act('notifications', 'notification', t('notifications'), 3, '#notifications', 'error')) + '</span>' +
      (guest() ? '<span class="hb-header__language">' + btn(t('signin'), { href: '#signin', style: 'outlined', size: 'md' }) + '</span><span class="hb-header__language">' + btn(t('signup'), { href: '#signup', size: 'md' }) + '</span>'
        : '<a class="hb-header__account" href="#account" title="' + attr(b.company + ' · ' + b.branch) + '"><span class="hb-avatar" data-shape="square" data-size="40">' + b.company.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</span><span class="hb-header__account-lines"><span class="hb-header__account-name">' + esc(b.company) + '</span><span class="hb-header__account-branch">' + esc(b.branch) + '</span></span><span data-mirror>' + ic('chevronDown') + '</span></a>') +
      (S.mega.open && !mobile() ? mega() : '') +
      '</header>' + (S.mega.open || S.search.open ? '<div class="scrim" data-act="close-overlays"></div>' : '');
  };
  var mega = function () {
    var l0 = H.BY[S.mega.l0] || H.CATS[0], l1 = H.BY[S.mega.l1]; if (!l1 || l1.parent !== l0.slug) l1 = l0.kids[0];
    var col = function (title, items, cur, lvl) { return '<div class="mega__col"><div class="mega__h">' + title + '</div>' + items.map(function (c) { var leaf = !c.kids.length; return '<' + (leaf ? 'a href="' + catHref(c.slug) + '"' : 'button type="button" data-act="mega-pick" data-lvl="' + lvl + '" data-slug="' + c.slug + '"') + ' class="mega__item" aria-current="' + (c.slug === cur) + '"' + (leaf ? '' : ' data-slug-hover="' + c.slug + '" data-lvl-hover="' + lvl + '"') + '>' + (lvl === 0 ? ic(c.icon) : '') + '<span>' + esc(cname(c)) + '</span>' + (leaf ? '' : '<span data-mirror>' + ic('chevronRight') + '</span>') + '</' + (leaf ? 'a' : 'button') + '>'; }).join('') + (cur && lvl > 0 ? '<a class="mega__item mega__all" href="' + catHref(lvl === 1 ? l0.slug : l1.slug) + '">' + esc(t('shopAll')(cname(lvl === 1 ? l0 : l1))) + '</a>' : '') + '</div>'; };
    return '<div class="mega" id="mega">' + col(t('categories'), H.CATS, l0.slug, 0) + col(cname(l0), l0.kids, l1 ? l1.slug : '', 1) + col(l1 ? cname(l1) : '', l1 ? l1.kids : [], '', 2) + '</div>';
  };
  /* search suggestions: recent + popular when empty; grouped, typo-tolerant when typing */
  var lev = function (a, b) { var m = [], i, j; for (i = 0; i <= a.length; i++) { m[i] = [i]; } for (j = 1; j <= b.length; j++) { m[0][j] = j; } for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; };
  var matches = function (text, q) { var tl = text.toLowerCase(), words = q.toLowerCase().split(/\s+/).filter(Boolean); return words.every(function (w) { if (tl.indexOf(w) >= 0) return true; return tl.split(/[^a-z0-9؀-ۿ]+/).some(function (tw) { return tw.length > 3 && w.length > 3 && lev(tw, w) <= (w.length > 6 ? 2 : 1); }); }); };
  var suggest = function (q) {
    return { products: H.PRODUCTS.filter(function (p) { return matches(p.name + ' ' + H.BBY[p.brand].name, q); }), cats: Object.keys(H.BY).map(function (k) { return H.BY[k]; }).filter(function (c) { return matches(c.en + ' ' + (c.ar || ''), q); }), brands: H.BRANDS.filter(function (b) { return matches(b.name, q); }), sups: H.SUPPLIERS.filter(function (s) { return matches(s.name, q); }) };
  };
  var searchDrop = function () {
    var q = S.search.q.trim(), html = '<div class="sdrop" id="sdrop" role="listbox">';
    if (!q) {
      if (S.recent.length) html += '<div class="sdrop__h">' + t('recent') + '</div>' + S.recent.map(function (r) { return '<button type="button" class="sdrop__item" data-act="search-go" data-q="' + attr(r) + '">' + ic('clock') + '<span>' + esc(r) + '</span></button>'; }).join('');
      html += '<div class="sdrop__h">' + t('popular') + '</div><div class="sdrop__chips">' + H.POPULAR_CATS.map(function (s) { return chip(esc(cname(H.BY[s])), { href: catHref(s), size: 'sm' }); }).join('') + '</div>';
    } else {
      var r = suggest(q), any = false;
      var group = function (title, items, fn) { if (!items.length) return ''; any = true; return '<div class="sdrop__h">' + title + '</div>' + items.slice(0, 4).map(fn).join(''); };
      html += group(t('products'), r.products, function (p) { return '<a class="sdrop__item" href="#product/' + p.id + '">' + ic('package') + '<span>' + esc(p.name) + '</span><small>' + money(p.price) + '</small></a>'; });
      html += group(t('categories'), r.cats, function (c) { return '<a class="sdrop__item" href="' + catHref(c.slug) + '">' + ic('grid') + '<span>' + esc(cname(c)) + '</span>' + (c.parent ? '<small>' + esc(cname(H.BY[c.parent])) + '</small>' : '') + '</a>'; });
      html += group(t('brands'), r.brands, function (b) { return '<a class="sdrop__item" href="#brands?q=' + encodeURIComponent(b.name) + '">' + ic('tag') + '<span>' + esc(b.name) + '</span></a>'; });
      html += group(t('suppliers'), r.sups, function (s) { return '<a class="sdrop__item" href="#search?supplier=' + s.id + '">' + ic('store') + '<span>' + esc(s.name) + '</span></a>'; });
      html += '<button type="button" class="sdrop__item sdrop__all" data-act="search-go" data-q="' + attr(q) + '">' + ic('search') + '<span>' + esc(t('seeAll')(q)) + '</span></button>';
    }
    return html + '</div>';
  };
  var drawer = function () {
    if (!S.drawer) return '';
    var b = H.BUYER, tt = totals();
    var row = function (icon, label, href, count, color) { return '<a class="drawer__row" href="' + href + '">' + ic(icon) + '<span>' + label + '</span>' + badge(count, color) + '</a>'; };
    return '<div class="drawer"><div class="drawer__scrim" data-act="drawer-close"></div><div class="drawer__panel" role="dialog" aria-label="' + attr(t('menu')) + '"><div class="drawer__head">' + LOGO + iconBtn('close', t('close'), { act: 'drawer-close', size: 'lg' }) + '</div>' +
      (guest() ? '<div class="drawer__acct"><span class="hb-avatar" data-shape="square" data-size="40">' + ic('user') + '</span><div><b>' + t('guest') + '</b><span>' + t('signToOrder') + '</span></div></div><div style="display:flex;gap:var(--hb-space-8);padding:var(--hb-space-12) var(--hb-space-16)">' + btn(t('signin'), { href: '#signin', style: 'outlined', size: 'md', width: true }) + btn(t('signup'), { href: '#signup', size: 'md', width: true }) + '</div>'
        : '<a class="drawer__acct" href="#account"><span class="hb-avatar" data-shape="square" data-size="40">' + b.company.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</span><div><b>' + esc(b.company) + '</b><span>' + t('branch') + ': ' + esc(b.branch) + '</span></div></a>') +
      '<div class="drawer__h">' + t('categories') + '</div>' + H.CATS.map(function (c) { var open = S.drawerCat === c.slug; return '<button type="button" class="drawer__row" data-act="drawer-cat" data-slug="' + c.slug + '" aria-expanded="' + open + '">' + ic(c.icon) + '<span>' + esc(cname(c)) + '</span><span data-mirror style="margin-inline-start:auto">' + ic(open ? 'chevronUp' : 'chevronDown') + '</span></button>' + (open ? '<div class="drawer__sub"><a class="drawer__row" href="' + catHref(c.slug) + '"><b>' + esc(t('shopAll')(cname(c))) + '</b></a>' + c.kids.map(function (k) { return '<a class="drawer__row" href="' + catHref(k.slug) + '">' + esc(cname(k)) + '</a>'; }).join('') + '</div>' : ''); }).join('') +
      row('tag', t('brands'), '#brands') + '<div class="drawer__h">' + t('account') + '</div>' + (guest() ? '' : row('gift', t('rewards'), '#rewards', 2, 'secondary') + row('message', t('messages'), '#messages', 1, 'success') + row('notification', t('notifications'), '#notifications', 3, 'error')) + row('cart', t('cart'), '#cart', tt.lines, 'primary') + '</div></div>';
  };

  /* ---------- footer (DS organism) ---------- */
  var footer = function () {
    var frow = function (value, icon) { return '<span class="hb-footer__row"><span class="hb-footer__tile">' + ic(icon) + '</span><span class="hb-footer__value">' + value + '</span></span>'; };
    var link = function (label, href) { return '<a class="hb-footer__link" href="' + href + '">' + label + '</a>'; };
    return '<footer class="hb-footer" data-view="marketplace"><div class="hb-footer__regions"><div class="hb-footer__region"><svg viewBox="0 0 191 43" width="168" height="38" aria-label="Highbase"><text x="0" y="24" font-family="Public Sans" font-size="24" font-weight="700" letter-spacing="2" fill="currentColor">HIGHBASE</text><text x="0" y="40" font-family="Public Sans" font-size="9" letter-spacing="3" fill="currentColor">WHERE YOU GROW</text></svg><span class="hb-footer__blurb">' + t('footerBlurb') + '</span></div><span class="hb-footer__divider"></span>' +
      '<div class="hb-footer__region"><span class="hb-footer__heading">' + t('quick') + '</span><div class="hb-footer__link-columns"><span class="hb-footer__links">' + link(t('home'), '#home') + link(t('brands'), '#brands') + link(t('help'), '#help') + '</span><span class="hb-footer__links">' + link(t('about'), '#about') + link(t('terms'), '#terms') + link(t('privacy'), '#privacy') + '</span></div>' + btn(t('downloadApp'), { href: '#app', style: 'filled', size: 'md', icon: 'download', cls: 'hb-footer__download' }) + '</div><span class="hb-footer__divider"></span>' +
      '<div class="hb-footer__region"><span class="hb-footer__heading">' + t('contact') + '</span>' + frow('<span class="ltr">info@highbaseco.com</span>', 'mail') + frow('<span class="ltr">+973 1330 0833</span>', 'phone') + frow('HIGHBASE TRADING W.L.L, Road 2845, Seef, Kingdom of Bahrain', 'location') + frow(t('message'), 'message') + '</div></div><div class="hb-footer__bar"><span class="hb-footer__copyright">' + t('copyright') + '</span></div></footer>';
  };

  /* ---------- product card (rule 7) ---------- */
  var unitPrice = function (p) { return fmt(p.price / p.units); };
  var atc = function (p) {
    var q = S.cart[p.id] || 0, out = p.stock !== 'in';
    if (out) return '<div class="pc__why">' + esc(t('outUntil')(p.stock.split(':')[1])) + '</div>';
    if (guest()) return '<div class="hb-atc" data-state="add" data-id="' + p.id + '">' + btn(t('add'), { act: 'guest-add', icon: 'cart', width: true, size: 'lg', extra: ' data-event="add_to_cart" data-source="card" data-id="' + p.id + '"' }) + '</div>';
    if (!q) return '<div class="hb-atc" data-state="add" data-id="' + p.id + '">' + btn(t('add'), { act: 'add', icon: 'cart', width: true, size: 'lg', extra: ' data-event="add_to_cart" data-source="card" data-id="' + p.id + '"' }) + '</div>';
    var single = q <= p.moq;
    return '<div class="hb-atc" data-state="' + (single ? 'stepper-single' : 'stepper') + '" data-id="' + p.id + '">' + iconBtn(single ? 'delete' : 'minus', single ? t('removed') : '−', { cls: 'hb-atc__step', act: 'dec', intent: single ? 'danger' : 'secondary', extra: ' data-id="' + p.id + '"' }) + '<input class="hb-atc__value num" type="number" inputmode="numeric" min="0" value="' + q + '" aria-label="' + attr(t('pack')) + '" data-act="qty" data-id="' + p.id + '">' + iconBtn('add', '+', { cls: 'hb-atc__step', act: 'inc', extra: ' data-id="' + p.id + '"' }) + '</div>';
  };
  var card = function (p, o) {
    o = o || {}; var s = H.SBY[p.sup], out = p.stock !== 'in', savedOn = !!S.saved[p.id];
    return '<article class="pc ' + (o.cls || '') + '" data-id="' + p.id + '" data-stock="' + (out ? 'out' : 'in') + '">' +
      '<div class="pc__media"><a href="#product/' + p.id + '" tabindex="-1" aria-hidden="true">' + ph(p.name, { icon: 'image' }) + '</a>' + (p.off ? '<span class="hb-chip pc__off" data-style="tonal" data-size="sm" data-tone="offer"><span class="hb-chip__label ltr">−' + p.off + '%</span></span>' : '') + (guest() ? '' : '<button type="button" class="pc__save" data-act="save" data-id="' + p.id + '" aria-pressed="' + savedOn + '" aria-label="' + attr(t('save')) + '" title="' + attr(savedOn ? t('savedTip') : t('save')) + '">' + ic('bookmark') + '</button>') + '</div>' +
      '<a class="pc__name" href="#product/' + p.id + '">' + esc(p.name) + '</a>' +
      '<span class="pc__pack">' + esc(p.pack) + '</span>' +
      '<div class="pc__price"><span class="pc__amount"><span class="cur">' + t('cur') + '</span><span class="num ltr">' + fmt(p.price) + '</span>' + (p.off ? '<span class="pc__was num ltr" title="' + attr(t('wasPrice')) + '">' + fmt(listPrice(p)) + '</span>' : '') + '</span><span class="pc__unit">' + esc(t('perUnit')(unitPrice(p), p.unit)) + '</span>' + (p.tiers ? '<span class="pc__tier">' + esc(t('from')(fmt(p.tiers[p.tiers.length - 1][1]), p.tiers[0][0])) + '</span>' : '') + (p.moq > 1 ? '<span class="pc__moq">' + esc(t('moq')(p.moq, t('packs'))) + '</span>' : '') + '</div>' +
      '<div class="pc__meta"><a href="#search?supplier=' + s.id + '">' + ic('store') + esc(s.name) + '</a><span>' + ic('truck') + ' ' + esc(t('delivery')(s.delivery)) + '</span></div>' +
      atc(p) + '</article>';
  };
  var skCard = function () { return '<article class="pc pc--sk" aria-hidden="true"><span class="sk sk--img"></span><span class="sk" style="width:90%"></span><span class="sk" style="width:60%"></span><span class="sk" style="width:40%"></span><span class="sk" style="width:70%"></span><span class="sk sk--btn"></span></article>'; };
  var cards = function (list, n) { return S.loading ? Array.apply(null, Array(n || list.length || 4)).map(skCard).join('') : list.map(function (p) { return card(p); }).join(''); };
  /* patch the cart slot of every card with this id, the header badge and the sheet, without a full re-render */
  var patchCart = function (id) {
    var p = H.PBY[id];
    app.querySelectorAll('.hb-atc[data-id="' + id + '"], .pc[data-id="' + id + '"] .pc__why').forEach(function (el) { var tmp = document.createElement('div'); tmp.innerHTML = atc(p); el.replaceWith(tmp.firstChild); });
    var a = app.querySelector('.act[data-kind="cart"]'); if (a) { var tt = totals(); var b = a.querySelector('.hb-badge'); if (tt.lines) { if (!b) { a.insertAdjacentHTML('beforeend', badge(tt.lines, 'primary')); } else b.textContent = tt.lines; } else if (b) b.remove(); a.title = cartTip(); }
  };
  var setQty = function (id, q, source) {
    var p = H.PBY[id], was = S.cart[id] || 0; q = Math.max(0, Math.floor(q || 0)); if (q > 0 && q < p.moq) q = p.moq;
    if (q === was) return;
    S.cart[id] = q; if (!q) delete S.cart[id];
    if (!was && q) { track('add_to_cart', { product: id, source: source || 'card', qty: q }); toast(t('added'), 'success', { label: t('viewCart'), href: '#cart' }); }
    else if (!q) toast(t('removed'), 'info'); else toast(t('qtyUpdated'), 'info');
    patchCart(id);
  };
  var toastTimer = null;
  var toast = function (text, status, action) {
    toastsEl.innerHTML = '<div class="hb-alert hb-snackbar" data-status="' + (status || 'success') + '" role="status"><span class="hb-snackbar__group"><span class="hb-alert__icon">' + ic(status === 'success' ? 'success' : status === 'error' ? 'error' : 'info') + '</span><span class="hb-alert__body">' + esc(text) + '</span></span><span class="hb-alert__actions">' + (action ? btn(action.label, { href: action.href, intent: 'secondary', style: 'ghost', size: 'sm', extra: ' style="--btn-text:var(--a-text)"' }) : '') + '<button type="button" class="hb-btn hb-icon-btn" data-intent="secondary" data-style="ghost" data-size="sm" aria-label="' + attr(t('close')) + '" onclick="this.closest(\'.hb-snackbar\').remove()"><span class="hb-btn__icon">' + ic('close') + '</span></button></span></div>';
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastsEl.innerHTML = ''; }, 4000);
  };

  /* ---------- sheets ---------- */
  var sheet = function () {
    if (!S.sheet) return '';
    if (S.sheet === 'guest') return '<div class="sheet-layer" data-act="sheet-close"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t" data-stop><span class="sheet__grab"></span><h2 class="sheet__title" id="sh-t">' + t('guestTitle') + '</h2><ul class="sheet__list">' + t('guestLines').map(function (l) { return '<li>' + ic('check') + '<span>' + esc(l) + '</span></li>'; }).join('') + '</ul><div class="sheet__actions">' + btn(t('guestBtn'), { href: '#signup', width: true }) + btn(t('haveAccount'), { href: '#signin', style: 'ghost', intent: 'secondary', width: true }) + '</div></div></div>';
    if (S.sheet === 'filters') return '<div class="sheet-layer" data-act="sheet-close"><div class="sheet sheet--filters" role="dialog" aria-modal="true" aria-label="' + attr(t('filters')) + '" data-stop><span class="sheet__grab"></span>' + filterPanel(true) + '</div></div>';
    return '';
  };

  /* ---------- listing: filters, sort ---------- */
  var ctx = { list: [] };
  var applyFilters = function (list) {
    var f = S.f, out = list.filter(function (p) {
      if (f.min !== '' && p.price < +f.min) return false; if (f.max !== '' && p.price > +f.max) return false;
      if (f.brands.length && f.brands.indexOf(p.brand) < 0) return false; if (f.sups.length && f.sups.indexOf(p.sup) < 0) return false;
      if (f.mine && !H.SBY[p.sup].mine) return false; if (f.ordered && !p.ordered) return false; return true;
    });
    var by = { priceAsc: function (a, b) { return a.price - b.price; }, priceDesc: function (a, b) { return b.price - a.price; }, name: function (a, b) { return a.name.localeCompare(b.name); }, ordered: function (a, b) { return (b.ordered ? 1 : 0) - (a.ordered ? 1 : 0); } };
    if (by[f.sort]) out = out.slice().sort(by[f.sort]);
    return out;
  };
  var filterPanel = function (inSheet) {
    var f = S.f, list = ctx.list, brands = {}, sups = {}; list.forEach(function (p) { brands[p.brand] = 1; sups[p.sup] = 1; });
    var bq = (S.brandQ || '').toLowerCase();
    var check = function (name, val, label, on) { return '<label class="hb-check"><input type="checkbox" class="hb-check__input" data-act="f-check" data-f="' + name + '" value="' + val + '"' + (on ? ' checked' : '') + '><span class="hb-check__box"></span><span class="hb-check__label">' + esc(label) + '</span></label>'; };
    var sw = function (name, label, on) { return '<label class="hb-switch"><input type="checkbox" role="switch" class="hb-switch__input" data-act="f-switch" data-f="' + name + '"' + (on ? ' checked' : '') + '><span class="hb-switch__track"></span><span class="hb-switch__label">' + esc(label) + '</span></label>'; };
    var field = function (name, label, val) { return '<div class="hb-field hb-textfield" data-state="default"><div class="hb-field__control"><input class="hb-field__input num" type="number" inputmode="decimal" min="0" step="0.100" placeholder="' + attr(label) + '" aria-label="' + attr(label) + '" value="' + attr(val) + '" data-act="f-price" data-f="' + name + '"></div></div>'; };
    return '<aside class="filters" aria-label="' + attr(t('filters')) + '"><div class="filters__head"><span class="filters__title">' + t('filters') + '</span>' + (activeChips().length ? '<button type="button" class="hb-btn" data-intent="secondary" data-style="ghost" data-size="sm" data-act="f-clear"><span class="hb-btn__label">' + t('clearAll') + '</span></button>' : '') + '</div>' +
      '<div class="fgroup"><span class="fgroup__h">' + t('price') + '</span><div class="frange">' + field('min', t('min'), f.min) + '<span>–</span>' + field('max', t('max'), f.max) + '</div></div>' +
      '<div class="fgroup"><span class="fgroup__h">' + t('brand') + '</span><span class="hb-search" data-state="default" data-size="sm"><span class="hb-search__icon">' + ic('search') + '</span><input class="hb-search__input" type="search" placeholder="' + attr(t('searchBrands')) + '" aria-label="' + attr(t('searchBrands')) + '" value="' + attr(S.brandQ || '') + '" data-act="f-brandq"></span><div class="flist">' + H.BRANDS.filter(function (b) { return brands[b.id] && (!bq || b.name.toLowerCase().indexOf(bq) >= 0); }).map(function (b) { return check('brands', b.id, b.name, f.brands.indexOf(b.id) >= 0); }).join('') + '</div></div>' +
      '<div class="fgroup"><span class="fgroup__h">' + t('supplier') + '</span>' + (guest() ? '' : sw('mine', t('mySuppliers'), f.mine)) + '<div class="flist">' + H.SUPPLIERS.filter(function (s) { return sups[s.id]; }).map(function (s) { return check('sups', s.id, s.name, f.sups.indexOf(s.id) >= 0); }).join('') + '</div></div>' +
      (guest() ? '' : '<div class="fgroup">' + sw('ordered', t('orderedBefore'), f.ordered) + '</div>') +
      (inSheet ? '<div class="sheet__actions">' + btn(t('apply') + ' (' + applyFilters(list).length + ')', { act: 'sheet-close', width: true }) + '</div>' : '') + '</aside>';
  };
  var activeChips = function () {
    var f = S.f, out = [];
    if (f.min !== '' || f.max !== '') out.push({ k: 'price', label: t('price') + ': ' + (f.min !== '' ? f.min : '0') + '–' + (f.max !== '' ? f.max : '∞') });
    f.brands.forEach(function (b) { out.push({ k: 'brands', v: b, label: H.BBY[b].name }); }); f.sups.forEach(function (s) { out.push({ k: 'sups', v: s, label: H.SBY[s].name }); });
    if (f.mine) out.push({ k: 'mine', label: t('mySuppliers') }); if (f.ordered) out.push({ k: 'ordered', label: t('orderedBefore') });
    return out;
  };
  var sortSelect = function () {
    var opts = ['relevance', 'priceAsc', 'priceDesc', 'name'].concat(guest() ? [] : ['ordered']);
    return '<div class="hb-field hb-select"' + (S.sortOpen ? ' data-open' : '') + '><div class="hb-select__wrap"><button type="button" class="hb-field__control" data-act="sort-toggle" aria-haspopup="listbox" aria-expanded="' + !!S.sortOpen + '" style="min-height:var(--hb-space-44)"><span class="hb-select__value">' + t('sortBy') + ': ' + t('sort')[S.f.sort] + '</span><span class="hb-select__chevron">' + ic('chevronDown') + '</span></button>' + (S.sortOpen ? '<div class="hb-select__menu" role="listbox">' + opts.map(function (o) { return '<div class="hb-select__option" role="option" aria-selected="' + (S.f.sort === o) + '" data-act="sort-pick" data-v="' + o + '">' + t('sort')[o] + '</div>'; }).join('') + '</div>' : '') + '</div></div>';
  };
  var listing = function (list, titleHtml) {
    ctx.list = list; var shown = applyFilters(list), chips = activeChips();
    return '<div class="listing">' + filterPanel(false) + '<div class="sec" style="padding-block:0">' + (titleHtml || '') +
      '<div class="toolbar"><span class="toolbar__count">' + t('count')(shown.length) + '</span><span style="display:flex;gap:var(--hb-space-8);align-items:center">' + btn(t('filters') + (chips.length ? ' (' + chips.length + ')' : ''), { cls: 'filter-btn', act: 'sheet-filters', style: 'outlined', intent: 'secondary', size: 'lg', icon: 'filter' }) + sortSelect() + '</span></div>' +
      (chips.length ? '<div class="applied">' + chips.map(function (c) { return chip(esc(c.label), { style: 'tonal', size: 'sm', remove: true, act: 'f-remove', extra: ' data-k="' + c.k + '" data-v="' + (c.v || '') + '"' }); }).join('') + '</div>' : '') +
      (shown.length || S.loading ? '<div class="grid">' + cards(shown, 8) + '</div>' : '<div class="hb-empty"><span class="hb-empty__art"><svg class="hb-il" data-size="md" role="img" aria-label=""><use href="#hb-il-empty-filter"/></svg></span><span class="hb-empty__title">' + t('noMatch') + '</span><span class="hb-empty__text">' + t('noMatchText') + '</span><span class="hb-empty__actions">' + btn(t('clearAll'), { act: 'f-clear', style: 'outlined', intent: 'secondary', size: 'md' }) + '</span></div>') +
      '</div></div>';
  };

  /* ---------- pages ---------- */
  var pageHome = function () {
    var offers = H.PRODUCTS.filter(function (p) { return p.off; }).slice(0, 5), mine = H.SUPPLIERS.filter(function (s) { return s.mine; }), lo = H.LAST_ORDER;
    return '<div class="wrap page home">' + crumbs([[t('home'), '#home']]) + '<h1 class="title sr-only">' + t('home') + '</h1>' +
      '<div class="recent"><span class="recent__h">' + t('recent') + '</span>' + S.recent.map(function (r) { return chip(esc(r), { size: 'sm', icon: 'clock', act: 'search-go', extra: ' data-q="' + attr(r) + '"' }); }).join('') + '</div>' +
      (guest() ? '' : '<section class="sec"><div class="again"><div><div class="again__head"><b>' + t('orderAgain') + '</b><span>' + esc(t('lastOrder')(lo.id, lo.date)) + '</span></div><div class="again__items">' + lo.items.map(function (it) { var p = H.PBY[it[0]]; return '<a class="again__item" href="#product/' + p.id + '">' + ph(p.name.split(' ').slice(0, 2).join(' ')) + '<span><b>' + esc(p.name) + '</b>' + it[1] + ' × ' + esc(p.pack) + '</span></a>'; }).join('') + '</div></div>' + btn(t('reorderN')(lo.items.length), { act: 'reorder', icon: 'refresh', extra: ' data-event="reorder_clicked"' }) + '</div></section>') +
      '<section class="sec"><div class="sec__head"><h2 class="sec__title">' + t('offers') + '</h2><a class="sec__link" href="#search?offers=1">' + t('viewAll') + '</a></div><div class="row scroll">' + cards(offers, 5) + '</div></section>' +
      '<section class="sec sec--cats"><div class="sec__head"><h2 class="sec__title">' + t('shopCats') + '</h2></div><div class="cats">' + H.CATS.map(function (c) { return '<a class="cat" href="' + catHref(c.slug) + '">' + ph(cname(c), { cls: 'ph--sq', icon: c.icon, nolabel: true }) + '<span>' + esc(cname(c)) + '</span></a>'; }).join('') + H.CATS.reduce(function (a, c) { return a.concat(c.kids.slice(0, 1)); }, []).map(function (c) { return '<a class="cat" href="' + catHref(c.slug) + '">' + ph(cname(c), { cls: 'ph--sq', icon: 'package', nolabel: true }) + '<span>' + esc(cname(c)) + '</span></a>'; }).join('') + '</div></section>' +
      (guest() ? '' : '<section class="sec"><div class="sec__head"><h2 class="sec__title">' + t('yourSuppliers') + '</h2></div><div class="sups">' + mine.map(function (s) { return '<a class="sup" href="#search?supplier=' + s.id + '"><span class="hb-avatar" data-shape="square" data-size="48">' + s.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</span><span style="flex:1;min-width:0"><b>' + esc(s.name) + '</b><span>' + stars(s.rating) + ' · ' + esc(t('delivery')(s.delivery)) + '</span></span>' + chip(t('shop'), { size: 'sm', style: 'tonal' }) + '</a>'; }).join('') + '</div></section>') +
      '<section class="sec"><div class="sec__head"><h2 class="sec__title">' + t('brands') + '</h2><a class="sec__link" href="#brands">' + t('allBrands') + '</a></div><div class="brands-row">' + H.BRANDS.map(function (b) { return '<a class="brand" href="#brands?q=' + encodeURIComponent(b.name) + '">' + blogo(b) + '<span>' + esc(b.name) + '</span></a>'; }).join('') + '</div></section>' +
      '</div>';
  };
  var pageCategory = function (r) {
    var slug = r.parts[r.parts.length - 1], c = H.BY[slug]; if (!c) return pageStub(t('categories'));
    var path = H.PATH[slug], bc = [[t('home'), '#home']].concat(path.map(function (x) { return [cname(x), catHref(x.slug)]; }));
    var html = '<div class="wrap page">' + crumbs(bc) + '<h1 class="title">' + esc(cname(c)) + '</h1>';
    if (c.kids.length) {
      html += '<section class="sec"><div class="subcats">' + c.kids.map(function (k) { return '<a class="subcat" href="' + catHref(k.slug) + '">' + ph(cname(k), { cls: 'ph--sq', icon: 'package', nolabel: true }) + '<span>' + esc(cname(k)) + '</span></a>'; }).join('') + '</div></section>';
      html += '<section class="sec">' + listing(H.productsIn(slug), '<h2 class="sec__title">' + esc(t('inCat')(cname(c))) + '</h2>') + '</section>';
    } else {
      var parent = H.BY[c.parent];
      html += '<section class="sec" style="padding-block-start:var(--hb-space-8)"><span class="recent__h">' + esc(t('moreIn')(cname(parent))) + '</span><div class="pills">' + parent.kids.map(function (k) { return chip(esc(cname(k)), { href: catHref(k.slug), style: k.slug === slug ? 'tonal' : 'outlined', size: 'md', extra: k.slug === slug ? ' aria-current="page"' : '' }); }).join('') + '</div></section>';
      html += '<section class="sec">' + listing(H.productsIn(slug)) + '</section>';
    }
    return html + '</div>';
  };
  var pageStub = function (title, extra) { return '<div class="wrap page">' + crumbs([[t('home'), '#home'], [title, '']]) + '<h1 class="title">' + esc(title) + '</h1><section class="sec"><div class="stub">' + ic('clock') + '<span>' + t('stub') + '</span>' + (extra || '') + '</div></section></div>'; };
  var STUBS = { brands: 'Brands', search: 'Search', product: 'Product', cart: 'Cart', checkout: 'Checkout', order: 'Order', rewards: 'Rewards', notifications: 'Notifications', signup: 'Sign up', signin: 'Sign in', landing: 'Landing', messages: 'Messages', account: 'Account' };
  var page = function () {
    var r = S.route;
    if (r.name === 'home') return pageHome();
    if (r.name === 'category') return pageCategory(r);
    return pageStub(STUBS[r.name] || r.name);
  };

  /* ---------- prototype bar ---------- */
  var pxBar = function () {
    var seg = function (label, key, opts) { return '<b>' + label + '</b>' + opts.map(function (o) { return '<button type="button" data-px="' + key + '" data-v="' + o[0] + '" aria-pressed="' + (S[key] === o[0]) + '">' + o[1] + '</button>'; }).join(''); };
    var routes = ['home', 'landing', 'category/foods', 'category/foods/dairy', 'category/foods/dairy/fresh-milk', 'brands', 'search?q=milk', 'product/p01', 'cart', 'checkout', 'order/HB-48211', 'rewards', 'notifications', 'signup', 'signin'];
    bar.toggleAttribute('data-collapsed', !!S.barClosed); bar.innerHTML = '<button type="button" class="px-toggle" data-px="bar" data-v="toggle" aria-expanded="' + !S.barClosed + '">Prototype ' + (S.barClosed ? '▸' : '▾') + '</button>' + seg('View', 'view', [['desk', 'Desktop'], ['mob', 'Mobile']]) + seg('Lang', 'lang', [['en', 'EN'], ['ar', 'AR']]) + seg('User', 'user', [['guest', 'Guest'], ['buyer', 'Signed-in']]) + '<b>Order</b><button type="button" class="px-fail" data-px="fail" data-v="toggle" aria-pressed="' + S.fail + '">Simulate failure</button><b>Go</b><select data-px="go" aria-label="Go to route" style="font:inherit;border-radius:var(--hb-radius-full);padding:var(--hb-space-2) var(--hb-space-8);max-width:180px">' + routes.map(function (x) { return '<option value="' + x + '"' + (S.route && ('#' + S.route.raw + (S.route.raw === 'search' ? '?q=milk' : '')) === '#' + x ? ' selected' : '') + '>#' + x + '</option>'; }).join('') + '</select>';
  };
  bar.addEventListener('click', function (e) { var b = e.target.closest('button[data-px]'); if (!b) return; var k = b.getAttribute('data-px'), v = b.getAttribute('data-v'); if (k === 'fail') S.fail = !S.fail; else if (k === 'bar') S.barClosed = !S.barClosed; else S[k] = v; persist(); render(); });
  bar.addEventListener('change', function (e) { if (e.target.getAttribute('data-px') === 'go') go('#' + e.target.value); });

  /* ---------- render ---------- */
  var render = function () {
    S.route = parse();
    frame.classList.toggle('frame--phone', S.view === 'mob'); app.classList.toggle('m', S.view === 'mob');
    app.setAttribute('lang', S.lang); app.setAttribute('dir', S.lang === 'ar' ? 'rtl' : 'ltr'); document.documentElement.lang = S.lang; document.documentElement.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
    var y = app.scrollTop, wy = window.scrollY;
    app.innerHTML = header() + '<main id="main">' + page() + '</main>' + footer() + drawer() + sheet();
    app.scrollTop = y; window.scrollTo(0, wy);
    pxBar();
  };

  /* ---------- events (delegated) ---------- */
  var closeOverlays = function () { S.mega.open = false; S.search.open = false; S.sortOpen = false; };
  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); var sel = e.target.closest('.hb-select');
    if (!sel && S.sortOpen) { S.sortOpen = false; render(); }
    if (!el) { if (!e.target.closest('.hb-header__search') && S.search.open) { S.search.open = false; render(); } return; }
    var a = el.getAttribute('data-act'), id = el.getAttribute('data-id');
    switch (a) {
      case 'mega': S.mega.open = !S.mega.open; S.search.open = false; render(); break;
      case 'mega-pick': var lvl = +el.getAttribute('data-lvl'); if (lvl === 0) { S.mega.l0 = el.getAttribute('data-slug'); S.mega.l1 = H.BY[S.mega.l0].kids[0].slug; } else S.mega.l1 = el.getAttribute('data-slug'); render(); break;
      case 'close-overlays': closeOverlays(); render(); break;
      case 'drawer': S.drawer = true; render(); break;
      case 'drawer-close': S.drawer = false; render(); break;
      case 'drawer-cat': var sl = el.getAttribute('data-slug'); S.drawerCat = S.drawerCat === sl ? null : sl; render(); break;
      case 'search-clear': S.search.q = ''; render(); var q0 = $('q'); if (q0) q0.focus(); break;
      case 'search-go': e.preventDefault(); submitSearch(el.getAttribute('data-q')); break;
      case 'add': e.preventDefault(); setQty(id, H.PBY[id].moq, 'card'); break;
      case 'guest-add': e.preventDefault(); track('add_to_cart', { product: id, source: 'card', guest: true }); S.sheet = 'guest'; render(); break;
      case 'inc': setQty(id, (S.cart[id] || 0) + 1); break;
      case 'dec': setQty(id, (S.cart[id] || 0) <= H.PBY[id].moq ? 0 : S.cart[id] - 1); break;
      case 'save': S.saved[id] = !S.saved[id]; el.setAttribute('aria-pressed', !!S.saved[id]); el.title = S.saved[id] ? t('savedTip') : t('save'); break;
      case 'reorder': H.LAST_ORDER.items.forEach(function (it) { S.cart[it[0]] = (S.cart[it[0]] || 0) + it[1]; patchCart(it[0]); }); track('reorder_clicked', { order: H.LAST_ORDER.id, items: H.LAST_ORDER.items.length }); toast(t('addedN')(H.LAST_ORDER.items.length), 'success', { label: t('viewCart'), href: '#cart' }); break;
      case 'sheet-close': if (e.target.closest('[data-stop]') && !el.matches('.hb-btn')) return; S.sheet = null; render(); break;
      case 'sheet-filters': S.sheet = 'filters'; render(); break;
      case 'sort-toggle': S.sortOpen = !S.sortOpen; render(); break;
      case 'sort-pick': S.f.sort = el.getAttribute('data-v'); S.sortOpen = false; track('filter_applied', { filter: 'sort', value: S.f.sort }); render(); break;
      case 'f-clear': S.f = blankFilters(); S.brandQ = ''; track('filter_applied', { filter: 'clear' }); render(); break;
      case 'f-remove': var k = el.getAttribute('data-k'), v = el.getAttribute('data-v'); if (k === 'price') { S.f.min = ''; S.f.max = ''; } else if (k === 'mine' || k === 'ordered') S.f[k] = false; else S.f[k] = S.f[k].filter(function (x) { return x !== v; }); track('filter_applied', { filter: k, removed: v || true }); render(); break;
    }
  });
  app.addEventListener('change', function (e) {
    var el = e.target, a = el.getAttribute('data-act'); if (!a) return;
    if (a === 'f-check') { var k = el.getAttribute('data-f'); if (el.checked) S.f[k].push(el.value); else S.f[k] = S.f[k].filter(function (x) { return x !== el.value; }); track('filter_applied', { filter: k, value: el.value, on: el.checked }); render(); }
    if (a === 'f-switch') { S.f[el.getAttribute('data-f')] = el.checked; track('filter_applied', { filter: el.getAttribute('data-f'), on: el.checked }); render(); }
    if (a === 'qty') { setQty(el.getAttribute('data-id'), +el.value); }
  });
  var priceTimer = null;
  app.addEventListener('input', function (e) {
    var el = e.target, a = el.getAttribute('data-act');
    if (el.id === 'q') { S.search.q = el.value; S.search.open = true; var f = el.closest('form'); var old = f.querySelector('.sdrop'); var tmp = document.createElement('div'); tmp.innerHTML = searchDrop(); if (old) old.replaceWith(tmp.firstChild); else f.appendChild(tmp.firstChild); var clr = f.querySelector('.hb-search__clear'); f.querySelector('.hb-search').setAttribute('data-state', el.value ? 'typing' : 'default'); if (el.value && !clr) f.querySelector('.hb-search').insertAdjacentHTML('beforeend', '<button type="button" class="hb-search__clear" data-act="search-clear" aria-label="' + attr(t('clear')) + '">' + ic('clear') + '</button>'); if (!el.value && clr) clr.remove(); return; }
    if (a === 'f-price') { S.f[el.getAttribute('data-f')] = el.value; clearTimeout(priceTimer); priceTimer = setTimeout(function () { var k = el.getAttribute('data-f'), v = el.value; track('filter_applied', { filter: 'price', bound: k, value: v }); render(); var n = app.querySelector('[data-act="f-price"][data-f="' + k + '"]'); if (n) { n.focus(); n.value = v; } }, 500); }
    if (a === 'f-brandq') { S.brandQ = el.value; var list = el.closest('.fgroup').querySelector('.flist'); var tmp2 = document.createElement('div'); tmp2.innerHTML = filterPanel(false); list.innerHTML = tmp2.querySelector('.flist').innerHTML; }
  });
  app.addEventListener('focusin', function (e) { if (e.target.id === 'q' && !S.search.open) { S.search.open = true; render(); var q = $('q'); if (q) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (x) {} } } });
  app.addEventListener('submit', function (e) { var f = e.target.closest('form[data-act="search-submit"]'); if (f) { e.preventDefault(); submitSearch($('q').value); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && (S.mega.open || S.search.open || S.sortOpen || S.sheet || S.drawer)) { closeOverlays(); S.sheet = null; S.drawer = false; render(); } });
  app.addEventListener('mouseover', function (e) { var el = e.target.closest('[data-slug-hover]'); if (!el || !S.mega.open) return; var lvl = +el.getAttribute('data-lvl-hover'), slug = el.getAttribute('data-slug-hover'); if (lvl === 0 && S.mega.l0 !== slug) { S.mega.l0 = slug; S.mega.l1 = H.BY[slug].kids[0].slug; render(); } else if (lvl === 1 && S.mega.l1 !== slug) { S.mega.l1 = slug; render(); } });
  var submitSearch = function (q) { q = (q || '').trim(); if (!q) return; S.recent = [q].concat(S.recent.filter(function (r) { return r !== q; })).slice(0, 5); S.search.q = q; S.search.open = false; track('search_submitted', { query: q }); go('#search?q=' + encodeURIComponent(q)); };

  /* never prompt the browser for push permission (rule 1): nothing here calls Notification.requestPermission */
  if (!location.hash) location.hash = '#home';
  S.loading = true; render(); setTimeout(function () { S.loading = false; render(); }, 350);
})();
