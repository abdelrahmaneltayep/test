/* Highbase — subcategory pages. Data and pure logic, shared by app.js (browser)
   and test.js (node). No DOM here, so the breadcrumb and section rules are testable. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HBModel = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // The tree, (live) from the 4 Oct 2026 recording of the staging mega menu.
  // Level 0 and the two expanded branches are verbatim; the other branches are
  // (proposal) fillers so every top-level category has somewhere to go.
  // img: a few categories carry an image key; the rest have none, on purpose,
  // so the placeholder case is always visible.
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
        T('butter-margarine', 'Butter & Margarine', 'زبدة ومارجرين'),
        T('eggs', 'Eggs', 'بيض', [], 'egg')
      ], 'milk'),
      T('bakery', 'Bakery', 'المخبوزات', [
        T('bread', 'Bread', 'خبز'), T('pastries', 'Pastries', 'معجنات'), T('cakes', 'Cakes', 'كيك')
      ], 'bread'),
      T('delicatessen', 'Delicatessen', 'الأطعمة الجاهزة', [
        T('cold-cuts', 'Cold Cuts', 'لحوم باردة'), T('olives-pickles', 'Olives & Pickles', 'زيتون ومخللات')
      ]),
      T('fruits-vegetables', 'Fruits & Vegetables', 'الفواكه والخضروات', [
        T('fresh-fruit', 'Fresh Fruit', 'فواكه طازجة'), T('fresh-vegetables', 'Fresh Vegetables', 'خضروات طازجة'), T('herbs', 'Herbs', 'أعشاب')
      ], 'apple'),
      T('fresh-meat-poultry', 'Fresh Meat & Poultry', 'اللحوم والدواجن الطازجة', [
        T('beef', 'Beef', 'لحم بقري'), T('lamb', 'Lamb', 'لحم ضأن'), T('chicken', 'Chicken', 'دجاج')
      ]),
      T('seafood', 'Seafood', 'المأكولات البحرية', [
        T('fresh-fish', 'Fresh Fish', 'سمك طازج'), T('shellfish', 'Shellfish', 'قشريات')
      ]),
      T('ready-meals', 'Ready Meals', 'وجبات جاهزة'),           // no children → sibling pills
      T('fresh-juice-salads', 'Fresh Juice & Salads', 'عصائر وسلطات طازجة') // no children
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

  // index: slug → node, parent links, level
  var BY = {};
  (function walk(nodes, parent, level) {
    nodes.forEach(function (n) { n.parent = parent; n.level = level; BY[n.slug] = n; walk(n.children, n, level + 1); });
  })(TREE, null, 0);

  // Products (proposal): deterministic per leaf so counts are stable. Names take
  // the leaf's English name; the two leaves seen in the recording use its items.
  var SEEN = {
    'fresh-milk': ['Almarai Full Fat Milk 1ltr', 'Milk Dairy Brand 1ltr', 'Milk Dairy Brand 500ml', 'Nadec Low Fat Fresh Milk 2ltr', 'Al Rawabi Fresh Milk 1ltr'],
    'cheese': ['Lorem Ipsum Blue Cheese', 'Kiri Cream Cheese 24 Portions', 'Almarai Cheddar Slices 200g', 'Puck Feta Cheese 500g'],
    'yoghurt-chilled-desserts': ['Almarai Yogurt Cup Mango 125g', 'Nadec Greek Yoghurt 170g', 'Al Safi Laban Up 1ltr']
  };
  var hash = function (s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  var leafProducts = function (n) {
    if (n._p) return n._p;
    var names = SEEN[n.slug] || (function () { var k = 3 + hash(n.slug) % 6, out = []; for (var i = 0; i < k; i++) out.push(n.en + ' ' + ['Pack', 'Box', 'Carton', 'Tray', 'Bundle', 'Case', 'Jar', 'Bag'][(hash(n.slug) + i) % 8] + ' ' + (i + 1)); return out; })();
    n._p = names.map(function (name, i) {
      var h = hash(n.slug + i);
      return { id: n.slug + '-' + i, name: name, unit: ['box', 'pack', 'unit', 'carton'][h % 4], price: 0.5 + (h % 40) / 10, coupon: h % 3 === 0, img: h % 2 === 0, tone: ['#dbeafe', '#fde68a', '#fecaca', '#d1fae5', '#e9d5ff'][h % 5] };
    });
    return n._p;
  };
  var products = function (n) { return n.children.length ? n.children.reduce(function (a, c) { return a.concat(products(c)); }, []) : leafProducts(n); };
  var count = function (n) { return products(n).length; };

  var name = function (n, lang) { return lang === 'ar' ? n.ar : n.en; };

  // Breadcrumb: Home > every ancestor (link) > current (plain text). Never the title twice.
  var breadcrumb = function (n, lang) {
    var items = [], p = n;
    while (p) { items.unshift({ slug: p.slug, name: name(p, lang), current: p === n }); p = p.parent; }
    items.unshift({ slug: '', name: lang === 'ar' ? 'الرئيسية' : 'Home', current: false });
    return items;
  };

  // What the navigation section under the title shows for a given page.
  //  cards    — this category has children: one card per child
  //  pills    — no children: sibling pills under the parent, current marked
  //  none     — a top-level category with no children (only data could cause it)
  var section = function (n) {
    if (n.children.length) return { kind: 'cards', items: n.children, parent: n };
    if (n.parent) return { kind: 'pills', items: n.parent.children, parent: n.parent, current: n };
    return { kind: 'none', items: [], parent: null };
  };

  // Canonical URL kept: /{locale}/storefront/products?filter[category]={slug}
  var url = function (slug, lang) { return '/bh-' + (lang === 'ar' ? 'ar' : 'en') + '/storefront/products' + (slug ? '?filter[category]=' + encodeURIComponent(slug) : ''); };

  return { TREE: TREE, BY: BY, products: products, count: count, name: name, breadcrumb: breadcrumb, section: section, url: url };
});
