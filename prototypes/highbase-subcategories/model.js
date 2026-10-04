/* Highbase — subcategory pages. Data and pure logic, shared by app.js (browser)
   and test.js (node). No DOM here, so the rules are testable. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./products.json'));
  else root.HBModel = factory(root.HB_PRODUCTS || []);
})(typeof self !== 'undefined' ? self : this, function (SEED) {
  'use strict';

  // The tree, (live) from the 4 Oct 2026 recording of the staging mega menu: level 0 and the
  // Fresh Foods & Dairy branch are verbatim; other branches are (proposal) fillers.
  // img: a few categories carry an image key; the rest have none, on purpose, so the
  // placeholder case is always visible.
  var T = function (slug, en, ar, children, img) { return { slug: slug, en: en, ar: ar, children: children || [], img: img || null }; };
  var TREE = [
    T('fresh-foods-dairy', 'Fresh Foods & Dairy', 'الأطعمة الطازجة والألبان', [
      T('dairy-eggs-cheese', 'Dairy, Eggs & Cheese', 'الألبان والبيض والجبن', [
        T('fresh-milk', 'Fresh Milk', 'حليب طازج', [], 'milk'),
        T('long-life-milk', 'Long Life Milk', 'حليب طويل الأجل', [], 'carton'),
        T('dairy-alternatives', 'Dairy Alternatives', 'بدائل الألبان'),
        T('laban-flavoured-milk', 'Laban & Flavoured Milk', 'لبن وحليب بنكهات'),
        T('yoghurt-chilled-desserts', 'Yoghurt & Chilled Desserts', 'زبادي وحلويات مبردة', [], 'cup'),
        T('fresh-cream', 'Fresh Cream', 'قشطة طازجة'),
        T('cheese', 'Cheese', 'جبن', [], 'cheese'),
        T('butter-margarine', 'Butter & Margarine', 'زبدة ومارجرين', [], 'butter'),
        T('eggs', 'Eggs', 'بيض', [], 'egg')
      ], 'milk'),
      T('bakery', 'Bakery', 'المخبوزات', [
        T('bread', 'Bread', 'خبز', [], 'bread'), T('pastries', 'Pastries', 'معجنات'), T('cakes', 'Cakes', 'كيك')
      ], 'bread'),
      T('delicatessen', 'Delicatessen', 'اللحوم الباردة', [], 'deli'),             // no children → sibling pills
      T('fruits-vegetables', 'Fruits & Vegetables', 'الفواكه والخضار', [
        T('fresh-fruit', 'Fruits', 'فواكه', [], 'grape'), T('fresh-vegetables', 'Vegetables', 'خضار', [], 'leaf'), T('herbs', 'Herbs', 'أعشاب')
      ], 'leaf'),
      T('fresh-meat-poultry', 'Fresh Meat & Poultry', 'اللحوم والدواجن', [
        T('fresh-chicken', 'Fresh Chicken', 'دجاج طازج', [], 'chicken'), T('frozen-chicken', 'Frozen Chicken', 'دجاج مجمّد'), T('beef', 'Beef', 'لحم بقري', [], 'meat'), T('lamb', 'Lamb', 'لحم ضأن')
      ], 'chicken'),
      T('seafood', 'Seafood', 'المأكولات البحرية', [], 'fish'),
      T('ready-meals', 'Ready Meals', 'وجبات جاهزة'),
      T('fresh-juice-salads', 'Fresh Juice & Salads', 'العصائر والسلطات', [], 'juice')
    ], 'milk'),
    T('foods', 'Foods', 'الأغذية', [
      T('rice-pasta', 'Rice & Pasta', 'أرز ومعكرونة', [T('rice', 'Rice', 'أرز'), T('pasta', 'Pasta', 'معكرونة')]),
      T('snacks', 'Snacks', 'وجبات خفيفة', [T('chips', 'Chips', 'رقائق'), T('biscuits', 'Biscuits', 'بسكويت')]),
      T('beverages', 'Beverages', 'مشروبات', [T('water', 'Water', 'مياه'), T('soft-drinks', 'Soft Drinks', 'مشروبات غازية')]),
      T('canned', 'Canned Food', 'معلبات')
    ]),
    T('baby-products', 'Baby Products', 'منتجات الأطفال', [T('diapers', 'Diapers', 'حفاضات'), T('baby-food', 'Baby Food', 'طعام الأطفال')]),
    T('care-beauty', 'Care & Beauty', 'العناية والجمال', [T('hair-care', 'Hair Care', 'العناية بالشعر'), T('skin-care', 'Skin Care', 'العناية بالبشرة')]),
    T('pharmacy-wellness', 'Pharmacy & Wellness', 'الصيدلية والعافية', [T('vitamins', 'Vitamins', 'فيتامينات'), T('first-aid', 'First Aid', 'إسعافات أولية')]),
    T('cleaning-laundry', 'Cleaning & Laundry Essentials', 'مستلزمات التنظيف والغسيل', [T('detergents', 'Detergents', 'منظفات'), T('cleaning-tools', 'Cleaning Tools', 'أدوات تنظيف')]),
    T('packaging-disposables', 'Packaging & Disposables', 'التغليف والمستهلكات', [T('bags', 'Bags', 'أكياس'), T('cups-plates', 'Cups & Plates', 'أكواب وأطباق')]),
    T('electrical-lighting', 'Electrical & Lighting', 'الكهربائيات والإضاءة', [T('bulbs', 'Bulbs', 'مصابيح'), T('batteries', 'Batteries', 'بطاريات')]),
    T('pet-supplies', 'Pet Supplies', 'مستلزمات الحيوانات الأليفة', [T('pet-food', 'Pet Food', 'طعام الحيوانات'), T('pet-care', 'Pet Care', 'العناية بالحيوانات')])
  ];
  var BY = {};
  (function walk(nodes, parent, level) { nodes.forEach(function (n) { n.parent = parent; n.level = level; BY[n.slug] = n; walk(n.children, n, level + 1); }); })(TREE, null, 0);

  // Products: the Fresh Foods branch carries the 26 illustrative products from the proposal
  // (names, packs, prices, tiers, suppliers); other leaves get generated fillers so every
  // page has something to show. All of it is (proposal) content.
  var hash = function (s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  var SUPS = ['Bahrain Food Distributors', 'Trans Gulf Foods', 'Gulf Dairy Trading', 'Al Watania Poultry'];
  var filler = function (n) {
    var k = 2 + hash(n.slug) % 4, out = [];
    for (var i = 0; i < k; i++) { var h = hash(n.slug + i); out.push({ id: n.slug + '-' + i, leaf: n.slug, name: n.en + ' ' + ['Pack', 'Box', 'Carton', 'Case'][h % 4] + ' ' + (i + 1), brand: ['Unbranded', 'Nestlé', 'Almarai', 'Kraft'][h % 4], sup: SUPS[h % 4], pk: (6 + h % 18) + ' × 1', pu: 'carton', pus: 'cartons', price: 1 + (h % 200) / 10, unit: [6 + h % 18, 'piece'], moq: 1 + h % 3, tiers: h % 2 ? [[5 + h % 6, +((1 + (h % 200) / 10) * 0.95).toFixed(3)]] : [], storage: 'Ambient', origin: 'Bahrain', mine: h % 3 !== 0, again: h % 4 === 0, off: h % 5 === 0 ? 10 : 0, glyph: null, tone: '#eef2f6', rank: 1 + h % 12, isNew: h % 6 === 0, dl: 1 + h % 2, left: 0 }); }
    return out;
  };
  var ALL = SEED.slice(); var seeded = {}; SEED.forEach(function (p) { seeded[p.leaf] = true; });
  Object.keys(BY).forEach(function (s) { var n = BY[s]; if (!n.children.length && !seeded[s]) ALL = ALL.concat(filler(n)); });
  var leafSet = function (n) { var out = {}; (function w(x) { if (!x.children.length) out[x.slug] = true; x.children.forEach(w); })(n); return out; };
  var products = function (n) { var L = leafSet(n); return ALL.filter(function (p) { return L[p.leaf]; }); };
  var count = function (n) { return products(n).length; };
  var byId = function (id) { for (var i = 0; i < ALL.length; i++) if (ALL[i].id === id) return ALL[i]; return null; };

  var name = function (n, lang) { return lang === 'ar' ? n.ar : n.en; };
  var breadcrumb = function (n, lang) { var items = [], p = n; while (p) { items.unshift({ slug: p.slug, name: name(p, lang), current: p === n }); p = p.parent; } items.unshift({ slug: '', name: lang === 'ar' ? 'الرئيسية' : 'Home', current: false }); return items; };
  var section = function (n) { if (n.children.length) return { kind: 'cards', items: n.children, parent: n }; if (n.parent) return { kind: 'pills', items: n.parent.children, parent: n.parent, current: n }; return { kind: 'none', items: [], parent: null }; };
  var url = function (slug, lang) { return '/bh-' + (lang === 'ar' ? 'ar' : 'en') + '/storefront/products' + (slug ? '?filter[category]=' + encodeURIComponent(slug) : ''); };

  /* ---------- filters and sort (pure) ---------- */
  var SETS = ['supplier', 'brand', 'deal'];
  var VAL = { supplier: function (p) { return [p.sup]; }, brand: function (p) { return [p.brand]; }, deal: function (p) { var d = []; if (p.off) d.push('offer'); if (p.tiers.length) d.push('bulk'); return d; } };
  var blank = function () { return { supplier: [], brand: [], deal: [], min: '', max: '', again: false, mine: false }; };
  var clone = function (f) { return { supplier: f.supplier.slice(), brand: f.brand.slice(), deal: f.deal.slice(), min: f.min, max: f.max, again: f.again, mine: f.mine }; };
  var activeCount = function (f) { return SETS.reduce(function (n, k) { return n + f[k].length; }, 0) + (f.min !== '' ? 1 : 0) + (f.max !== '' ? 1 : 0) + (f.again ? 1 : 0) + (f.mine ? 1 : 0); };
  // products of node n matching every facet except `skip` (used for the counts beside each option)
  var apply = function (n, f, skip) {
    return products(n).filter(function (p) {
      for (var i = 0; i < SETS.length; i++) { var k = SETS[i]; if (skip !== k && f[k].length) { var vs = VAL[k](p), hit = false; for (var j = 0; j < vs.length; j++) if (f[k].indexOf(vs[j]) >= 0) hit = true; if (!hit) return false; } }
      if (skip !== 'min' && f.min !== '' && p.price < +f.min) return false;
      if (skip !== 'max' && f.max !== '' && p.price > +f.max) return false;
      if (skip !== 'again' && f.again && !p.again) return false;
      if (skip !== 'mine' && f.mine && !p.mine) return false;
      return true;
    });
  };
  var sort = function (list, key) {
    var l = list.slice();
    if (key === 'best') l.sort(function (a, b) { return (b.again - a.again) || (a.rank - b.rank); });
    if (key === 'priceAsc') l.sort(function (a, b) { return a.price - b.price; });
    if (key === 'unitAsc') l.sort(function (a, b) { return a.price / a.unit[0] - b.price / b.unit[0]; });
    if (key === 'newest') l.sort(function (a, b) { return (b.isNew - a.isNew) || (a.rank - b.rank); });
    return l;
  };
  var options = function (n, f, key) { var vals = []; products(n).forEach(function (p) { VAL[key](p).forEach(function (v) { if (vals.indexOf(v) < 0) vals.push(v); }); }); var b = apply(n, f, key); return vals.map(function (v) { return { value: v, n: b.filter(function (p) { return VAL[key](p).indexOf(v) >= 0; }).length }; }); };
  var priceFor = function (p, q) { var pr = p.price; p.tiers.forEach(function (t) { if (q >= t[0]) pr = t[1]; }); return pr; };

  return { TREE: TREE, BY: BY, ALL: ALL, products: products, count: count, byId: byId, name: name, breadcrumb: breadcrumb, section: section, url: url, SETS: SETS, VAL: VAL, blank: blank, clone: clone, activeCount: activeCount, apply: apply, sort: sort, options: options, priceFor: priceFor };
});
