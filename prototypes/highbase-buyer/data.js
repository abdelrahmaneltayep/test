/* Highbase buyer journey — mock data. Names follow "Brand · Product · Size · Pack". Prices in BHD per pack.
   (proposal) everything here is sample data shaped like the live catalogue; nothing is a real listing. */
window.HB = (function () {
  'use strict';
  var C = function (slug, en, ar, kids, icon) { return { slug: slug, en: en, ar: ar, kids: kids || [], icon: icon || 'package' }; };
  var CATS = [
    C('foods', 'Foods', 'الأطعمة', [
      C('dairy', 'Dairy, Eggs & Cheese', 'الألبان والبيض والجبن', [C('fresh-milk', 'Fresh Milk', 'حليب طازج'), C('cheese', 'Cheese', 'جبن'), C('yoghurt', 'Yoghurt & Laban', 'زبادي ولبن'), C('eggs', 'Eggs', 'بيض'), C('butter', 'Butter & Cream', 'زبدة وقشطة')]),
      C('bakery', 'Bakery & Grains', 'المخبوزات والحبوب', [C('bread', 'Bread', 'خبز'), C('rice-pasta', 'Rice & Pasta', 'أرز ومعكرونة'), C('flour-sugar', 'Flour & Sugar', 'دقيق وسكر')]),
      C('meat', 'Meat & Poultry', 'اللحوم والدواجن', [C('chicken', 'Chicken', 'دجاج'), C('beef-lamb', 'Beef & Lamb', 'لحم بقري وضأن')]),
      C('pantry', 'Pantry & Cooking', 'المؤن والطبخ', [C('oils', 'Oils & Ghee', 'زيوت وسمن'), C('canned', 'Canned & Sauces', 'معلبات وصلصات'), C('spices', 'Spices', 'بهارات')])
    ], 'store'),
    C('beverages', 'Beverages', 'المشروبات', [
      C('water', 'Water', 'مياه', [C('still-water', 'Still Water', 'مياه عادية'), C('sparkling', 'Sparkling Water', 'مياه غازية')]),
      C('soft-drinks', 'Soft Drinks & Juices', 'المشروبات الغازية والعصائر', [C('cola', 'Cola & Sodas', 'كولا ومشروبات غازية'), C('juices', 'Juices', 'عصائر'), C('energy', 'Energy Drinks', 'مشروبات الطاقة')]),
      C('hot-drinks', 'Tea & Coffee', 'شاي وقهوة', [C('tea', 'Tea', 'شاي'), C('coffee', 'Coffee', 'قهوة')])
    ], 'coupon'),
    C('cleaning', 'Cleaning & Household', 'التنظيف والمنزل', [
      C('kitchen', 'Kitchen Cleaning', 'تنظيف المطبخ', [C('dish', 'Dishwashing', 'غسيل الأطباق'), C('surface', 'Surface Cleaners', 'منظفات الأسطح')]),
      C('laundry', 'Laundry', 'الغسيل', [C('detergent', 'Detergents', 'مساحيق غسيل'), C('softener', 'Softeners', 'منعمات')]),
      C('paper', 'Paper & Disposables', 'الورقيات والمستهلكات', [C('tissues', 'Tissues & Towels', 'مناديل ومناشف'), C('bags', 'Bags & Wraps', 'أكياس وأغلفة')])
    ], 'home')
  ];
  var BY = {}, PATH = {};
  (function walk(list, path) { list.forEach(function (c) { var p = path.concat(c); BY[c.slug] = c; PATH[c.slug] = p; c.level = path.length; c.parent = path.length ? path[path.length - 1].slug : null; walk(c.kids, p); }); })(CATS, []);

  var SUPPLIERS = [
    { id: 's1', name: 'Gulf Dairy Trading', mine: true, rating: 4.8, delivery: 1, min: 20, fee: 1.5, phone: '+973 1770 2200' },
    { id: 's2', name: 'Al Manar Foods', mine: true, rating: 4.6, delivery: 1, min: 15, fee: 1.0, phone: '+973 1736 4410' },
    { id: 's3', name: 'Bahrain Fresh Co.', mine: false, rating: 4.5, delivery: 2, min: 25, fee: 2.0, phone: '+973 1759 0033' },
    { id: 's4', name: 'Awal Beverages Distribution', mine: true, rating: 4.7, delivery: 1, min: 30, fee: 0, phone: '+973 1721 8800' },
    { id: 's5', name: 'Seef Packaging & Supplies', mine: false, rating: 4.3, delivery: 2, min: 10, fee: 1.5, phone: '+973 1758 1122' },
    { id: 's6', name: 'Nader Household Supplies', mine: false, rating: 4.4, delivery: 1, min: 20, fee: 1.0, phone: '+973 1729 7700' }
  ];
  var SBY = {}; SUPPLIERS.forEach(function (s) { SBY[s.id] = s; });

  /* logo: six files exist in img/brands, six point at missing files on purpose so the fallback tile shows. */
  var BRANDS = [
    { id: 'almarai', name: 'Almarai', logo: 'img/brands/almarai.svg', popular: true }, { id: 'nadec', name: 'Nadec', logo: 'img/brands/nadec.svg', popular: true },
    { id: 'puck', name: 'Puck', logo: 'img/brands/puck.svg', popular: true }, { id: 'lurpak', name: 'Lurpak', logo: 'img/brands/lurpak.svg', popular: false },
    { id: 'kraft', name: 'Kraft', logo: 'img/brands/kraft.svg', popular: false }, { id: 'nestle', name: 'Nestlé', logo: 'img/brands/nestle.svg', popular: true },
    { id: 'pepsi', name: 'Pepsi', logo: 'img/brands/pepsi.svg', popular: true }, { id: 'alain', name: 'Al Ain', logo: 'img/brands/al-ain.svg', popular: false },
    { id: 'lipton', name: 'Lipton', logo: 'img/brands/lipton.svg', popular: true }, { id: 'fairy', name: 'Fairy', logo: 'img/brands/fairy.svg', popular: true },
    { id: 'persil', name: 'Persil', logo: 'img/brands/persil.svg', popular: false }, { id: 'fine', name: 'Fine', logo: 'img/brands/fine.svg', popular: false }
  ];
  var BBY = {}; BRANDS.forEach(function (b) { BBY[b.id] = b; });

  /* id, leaf, brand, name, pack, units, unit, price, supplier, tiers, moq, stock('in'|'out:<date>'), off, ordered */
  var P = function (id, leaf, brand, name, pack, units, unit, price, sup, o) {
    o = o || {};
    return { id: id, leaf: leaf, brand: brand, name: name, pack: pack, units: units, unit: unit, price: price, sup: sup, tiers: o.tiers || null, moq: o.moq || 1, stock: o.stock || 'in', off: o.off || 0, ordered: !!o.ordered, desc: o.desc || '' };
  };
  var PRODUCTS = [
    P('p01', 'fresh-milk', 'almarai', 'Almarai Fresh Milk 1L', 'Carton of 12 × 1L', 12, 'L', 7.800, 's1', { tiers: [[10, 7.500], [25, 7.200]], moq: 2, ordered: true, desc: 'Full-fat fresh cow’s milk, pasteurised and homogenised. Keep chilled at 4 °C.' }),
    P('p02', 'fresh-milk', 'nadec', 'Nadec Fresh Milk 1L', 'Carton of 12 × 1L', 12, 'L', 7.400, 's3', { tiers: [[10, 7.100]], moq: 2, off: 10 }),
    P('p03', 'fresh-milk', 'almarai', 'Almarai Low Fat Milk 2L', 'Carton of 6 × 2L', 12, 'L', 7.950, 's1', { ordered: true }),
    P('p04', 'fresh-milk', 'nadec', 'Nadec Skimmed Milk 1L', 'Carton of 12 × 1L', 12, 'L', 7.200, 's3', { stock: 'out:12 Oct' }),
    P('p05', 'fresh-milk', 'nestle', 'Nestlé Nido Full Cream Milk Powder 2.25kg', 'Case of 6 × 2.25kg', 13.5, 'kg', 42.600, 's2', { tiers: [[5, 41.000]], moq: 1 }),
    P('p06', 'fresh-milk', 'almarai', 'Almarai Fresh Milk 200ml', 'Carton of 24 × 200ml', 4.8, 'L', 5.280, 's1', { off: 15, ordered: true }),
    P('p07', 'cheese', 'puck', 'Puck Cream Cheese Spread 500g', 'Case of 12 × 500g', 6, 'kg', 14.400, 's2', { tiers: [[10, 13.800]], ordered: true }),
    P('p08', 'cheese', 'kraft', 'Kraft Cheddar Cheese Slices 200g', 'Case of 24 × 200g', 4.8, 'kg', 15.360, 's2', { off: 12 }),
    P('p09', 'cheese', 'almarai', 'Almarai Halloumi 250g', 'Case of 12 × 250g', 3, 'kg', 10.200, 's1', { moq: 2 }),
    P('p10', 'cheese', 'puck', 'Puck Mozzarella Shredded 1kg', 'Case of 6 × 1kg', 6, 'kg', 17.700, 's2', { tiers: [[8, 16.900]], ordered: true, desc: 'Low-moisture shredded mozzarella for pizza and baking. Shelf life 90 days chilled.' }),
    P('p11', 'yoghurt', 'almarai', 'Almarai Fresh Laban 1L', 'Carton of 12 × 1L', 12, 'L', 6.600, 's1', { ordered: true }),
    P('p12', 'yoghurt', 'nadec', 'Nadec Plain Yoghurt 170g', 'Tray of 24 × 170g', 4.08, 'kg', 5.520, 's3', { off: 8 }),
    P('p13', 'yoghurt', 'almarai', 'Almarai Greek Yoghurt 150g', 'Tray of 12 × 150g', 1.8, 'kg', 4.800, 's1', {}),
    P('p14', 'yoghurt', 'nadec', 'Nadec Laban Up 250ml', 'Carton of 24 × 250ml', 6, 'L', 5.760, 's3', { stock: 'out:9 Oct' }),
    P('p15', 'eggs', 'alain', 'Al Ain White Eggs Large', 'Tray of 30', 30, 'egg', 1.650, 's3', { tiers: [[20, 1.550]], moq: 4, ordered: true }),
    P('p16', 'eggs', 'alain', 'Al Ain Brown Eggs Medium', 'Tray of 30', 30, 'egg', 1.800, 's3', {}),
    P('p17', 'butter', 'lurpak', 'Lurpak Unsalted Butter 200g', 'Case of 20 × 200g', 4, 'kg', 24.000, 's2', { off: 10 }),
    P('p18', 'butter', 'almarai', 'Almarai Fresh Cream 1L', 'Carton of 12 × 1L', 12, 'L', 13.200, 's1', { tiers: [[6, 12.600]] }),
    P('p19', 'bread', 'fine', 'Fine Arabic Bread Large', 'Bag of 10 bundles', 60, 'pc', 2.400, 's2', { ordered: true }),
    P('p20', 'bread', 'kraft', 'Kraft Burger Buns 4"', 'Case of 8 × 6', 48, 'pc', 6.720, 's2', {}),
    P('p21', 'rice-pasta', 'alain', 'Al Ain Basmati Rice 20kg', 'Bag of 20kg', 20, 'kg', 9.750, 's2', { tiers: [[10, 9.300], [30, 8.900]], moq: 2, ordered: true }),
    P('p22', 'rice-pasta', 'nestle', 'Nestlé Maggi Noodles 77g', 'Case of 48 × 77g', 48, 'pc', 8.160, 's2', {}),
    P('p23', 'flour-sugar', 'fine', 'Fine All-Purpose Flour 10kg', 'Bag of 10kg', 10, 'kg', 3.900, 's2', { off: 5 }),
    P('p24', 'chicken', 'alain', 'Al Ain Whole Chicken 1.1kg', 'Case of 10 × 1.1kg', 11, 'kg', 14.300, 's3', { moq: 2 }),
    P('p25', 'beef-lamb', 'alain', 'Al Ain Beef Mince 500g', 'Case of 12 × 500g', 6, 'kg', 19.800, 's3', { stock: 'out:14 Oct' }),
    P('p26', 'oils', 'nestle', 'Nestlé Sunflower Oil 5L', 'Case of 4 × 5L', 20, 'L', 18.900, 's2', { tiers: [[5, 18.200]], ordered: true }),
    P('p27', 'canned', 'nestle', 'Nestlé Tomato Paste 800g', 'Case of 12 × 800g', 9.6, 'kg', 7.200, 's2', {}),
    P('p28', 'spices', 'fine', 'Fine Black Pepper Ground 1kg', 'Bag of 1kg', 1, 'kg', 4.350, 's2', { off: 10 }),
    P('p29', 'still-water', 'alain', 'Al Ain Water 500ml', 'Shrink of 24 × 500ml', 12, 'L', 1.680, 's4', { tiers: [[20, 1.560], [50, 1.440]], moq: 5, ordered: true }),
    P('p30', 'still-water', 'alain', 'Al Ain Water 1.5L', 'Shrink of 12 × 1.5L', 18, 'L', 1.920, 's4', { ordered: true }),
    P('p31', 'sparkling', 'pepsi', 'Pepsi Aquafina Sparkling 330ml', 'Case of 24 × 330ml', 7.92, 'L', 4.560, 's4', {}),
    P('p32', 'cola', 'pepsi', 'Pepsi Cola 330ml', 'Case of 24 × 330ml', 7.92, 'L', 5.280, 's4', { tiers: [[10, 5.040]], off: 10, ordered: true }),
    P('p33', 'cola', 'pepsi', 'Pepsi Diet 1.5L', 'Case of 6 × 1.5L', 9, 'L', 3.300, 's4', {}),
    P('p34', 'juices', 'almarai', 'Almarai Orange Juice 1L', 'Carton of 12 × 1L', 12, 'L', 8.400, 's1', { off: 15 }),
    P('p35', 'juices', 'nadec', 'Nadec Mango Nectar 200ml', 'Carton of 27 × 200ml', 5.4, 'L', 4.860, 's3', {}),
    P('p36', 'energy', 'pepsi', 'Pepsi Sting Energy 250ml', 'Case of 24 × 250ml', 6, 'L', 6.240, 's4', { stock: 'out:11 Oct' }),
    P('p37', 'tea', 'lipton', 'Lipton Yellow Label Tea Bags 100', 'Case of 12 × 100 bags', 1200, 'bag', 15.600, 's2', { tiers: [[6, 15.000]], ordered: true }),
    P('p38', 'coffee', 'nestle', 'Nestlé Nescafé Classic 200g', 'Case of 12 × 200g', 2.4, 'kg', 22.800, 's2', { off: 8 }),
    P('p39', 'dish', 'fairy', 'Fairy Dishwashing Liquid Lemon 1L', 'Case of 12 × 1L', 12, 'L', 11.400, 's6', { tiers: [[10, 10.800]], ordered: true }),
    P('p40', 'surface', 'fairy', 'Fairy Multi-Surface Cleaner 2L', 'Case of 6 × 2L', 12, 'L', 8.100, 's6', {}),
    P('p41', 'detergent', 'persil', 'Persil Powder Detergent 5kg', 'Case of 4 × 5kg', 20, 'kg', 14.800, 's6', { off: 12 }),
    P('p42', 'softener', 'persil', 'Persil Fabric Softener 2L', 'Case of 6 × 2L', 12, 'L', 9.600, 's6', {}),
    P('p43', 'tissues', 'fine', 'Fine Facial Tissues 200 sheets', 'Case of 30 boxes', 30, 'box', 10.500, 's5', { tiers: [[10, 9.900]], ordered: true }),
    P('p44', 'tissues', 'fine', 'Fine Kitchen Towel Rolls', 'Case of 24 rolls', 24, 'roll', 7.200, 's5', {}),
    P('p45', 'bags', 'fine', 'Fine Garbage Bags 50 gallon', 'Case of 10 × 15 bags', 150, 'bag', 6.300, 's5', { ordered: true })
  ];
  var PBY = {}; PRODUCTS.forEach(function (p) { PBY[p.id] = p; });

  var BUYER = { company: 'Al Noor Cafeteria', branch: 'Seef Mall branch', phone: '+973 3312 4455', address: 'Building 2845, Road 2831, Seef 428, Manama', docs: true, email: 'orders@alnoor.bh' };
  var LAST_ORDER = { id: 'HB-48211', date: '3 Oct 2026', items: [['p01', 2], ['p11', 1], ['p15', 4], ['p29', 5]] };
  var RECENT = ['almarai milk', 'paper cups', 'fairy'];
  var POPULAR_CATS = ['fresh-milk', 'cheese', 'still-water', 'tissues'];

  var descendants = function (slug) { var out = []; (function w(c) { if (!c.kids.length) out.push(c.slug); c.kids.forEach(w); })(BY[slug]); return out; };
  var productsIn = function (slug) { var leaves = descendants(slug); return PRODUCTS.filter(function (p) { return leaves.indexOf(p.leaf) >= 0; }); };
  return { CATS: CATS, BY: BY, PATH: PATH, SUPPLIERS: SUPPLIERS, SBY: SBY, BRANDS: BRANDS, BBY: BBY, PRODUCTS: PRODUCTS, PBY: PBY, BUYER: BUYER, LAST_ORDER: LAST_ORDER, RECENT: RECENT, POPULAR_CATS: POPULAR_CATS, descendants: descendants, productsIn: productsIn };
})();
