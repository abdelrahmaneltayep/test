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
    f: null, recent: H.RECENT.slice(), events: [], coupon: '', pay: 'bank', orders: [], placing: false, orderErr: false, pdpQty: 1, pdpTab: 'desc', matchOpen: false,
    signup: { step: 1, phone: '', code: '', name: '', branch: '', touched: {} }, signin: { mode: 'password', email: '', pw: '', show: false, loading: false, err: null, reset: false, resetSent: false },
    brandQ2: '', rewardTab: 'active', readAll: false, msgOpen: false, thread: null, coOpen: {}, under: 'home', notifPerm: false };
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
      stub: 'This page is built in the next step of the prototype.', pack: 'Pack', packs: 'packs', cur: 'BHD', cartTip: function (n, t) { return n + ' items · BHD ' + t; },
      landingH: 'Wholesale for your shop, restaurant or kitchen — delivered in Bahrain.', landingP: 'HIGHBASE connects your business with local suppliers. Order online, track deliveries, reorder in seconds.', browse: 'Browse products', supCount: function (n) { return n + ' suppliers in Bahrain'; }, promise: 'Next-day delivery on most orders', featured: 'Featured this week', listPriceNote: 'List prices shown. Wholesale prices after sign-up.',
      su: { title: 'Create your business account', s1: 'Your mobile number', s2: 'Enter the code', s3: 'Your business', phone: 'Mobile number', phoneHelp: 'We send a one-time code by SMS.', code: 'One-time code', codeHelp: function (p) { return 'Sent to ' + p + '. Try 1234 in this prototype.'; }, name: 'Business name', branch: 'Branch name', branchHelp: 'Deliveries go here. You can add more branches later.', cont: 'Continue', create: 'Create account', docs: 'You can add company documents (CR, VAT) later, before your first order is confirmed.', back: 'Back', resend: 'Resend code', have: 'Already have an account?', errPhone: 'Enter 8 digits after +973, for example 3312 4455.', errCode: 'That code is not right. Check the SMS or resend.', errName: 'Enter your business name.', errBranch: 'Enter a branch name, for example “Seef branch”.', step: function (n) { return 'Step ' + n + ' of 3'; }, done: 'Welcome to HIGHBASE' },
      si: { title: 'Sign in', email: 'Email', pw: 'Password', show: 'Show password', hide: 'Hide password', forgot: 'Forgot password?', btn: 'Sign in', loading: 'Signing in…', code: 'Sign in with a code', pwMode: 'Sign in with a password', errEmail: 'Enter the email you registered with.', errPw: function (e) { return 'The password for ' + e + ' is wrong. Try again or reset it.'; }, errBlank: 'Enter your password.', noAcc: 'New to HIGHBASE?', reset: 'Reset your password', resetText: 'We will email a reset link to', send: 'Send reset link', sent: 'Reset link sent. This is what the email looks like:', emailSubject: 'Reset your HIGHBASE password', emailBody: 'Hi Al Noor Cafeteria, tap the button below to choose a new password. The link works for 30 minutes.', emailBtn: 'Choose a new password', backSignin: 'Back to sign in', hint: 'Use orders@alnoor.bh with any password except “wrong” in this prototype.' },
      br: { title: 'Brands', popular: 'Popular brands', search: 'Search brands', all: 'All brands A–Z', none: 'No brands match' },
      se: { title: function (q) { return 'Results for “' + q + '”'; }, bySup: function (s) { return 'Products from ' + s; }, offersTitle: 'This week’s offers', none: function (q) { return 'No products for “' + q + '”'; }, noneText: 'Check the spelling, try a shorter word, or browse a category.', request: 'Request this product', suggestions: 'You might mean' },
      pd: { supplier: 'Supplier', rating: 'rating', msg: 'Message supplier', perPack: 'per pack', perUnit: 'per unit', tiers: 'Quantity prices', qty: 'Quantity', range: 'Quantity', price: 'Price per pack', inStock: 'In stock · ships tomorrow', inStock2: 'In stock · ships in 2 days', addToCart: 'Add to cart', inCart: function (n) { return n + ' in cart'; }, match: 'Match my price', desc: 'Description', specs: 'Specifications', policies: 'Supplier policies', same: 'From the same supplier', similar: 'Similar products', brand: 'Brand', pack: 'Pack', units: 'Units per pack', storage: 'Storage', origin: 'Origin', shelf: 'Shelf life', refund: 'Refunds', refundText: 'Report damaged or missing items within 24 hours of delivery for a credit note.', deliveryP: 'Delivery', deliveryText: function (d, f) { return (d === 1 ? 'Next-day delivery' : 'Delivery in ' + d + ' days') + ' to your branch · BHD ' + f.toFixed(3) + ' per order'; }, terms: 'Payment terms', termsText: 'Bank transfer or cash on delivery. Pay later available to approved buyers.', matchTitle: 'Match my price', matchText: 'Tell the supplier the price you pay today. They reply within one working day.', matchField: 'Your current price per pack', matchSend: 'Send request', matchSent: 'Request sent to', noDesc: 'Standard wholesale pack from the supplier’s catalogue.' },
      ca: { title: 'Your cart', empty: 'Your cart is empty', emptyText: 'Browse categories or reorder from your last order.', min: function (m, left) { return 'BHD ' + m.toFixed(3) + ' minimum · BHD ' + left.toFixed(3) + ' to go'; }, minOk: function (m) { return 'BHD ' + m.toFixed(3) + ' minimum reached'; }, fee: function (f) { return f ? 'Delivery BHD ' + f.toFixed(3) : 'Free delivery'; }, unit: 'Unit price', qty: 'Qty', line: 'Line total', remove: 'Remove', coupon: 'Coupon code', applyC: 'Apply', couponOn: function (c, l) { return c + ' applied · ' + l; }, couponBad: 'That code is not valid or has expired.', summary: 'Order summary', items: 'Items', discounts: 'Discounts', delivery: 'Delivery', vat: 'VAT 10%', total: 'Total', checkout: 'Proceed to checkout', couponLine: function (c) { return 'Coupon ' + c; } },
      co: { title: 'Checkout', delivery: 'Delivery', change: 'Change', items: 'Items', payment: 'Payment', bank: 'Bank transfer', bankText: 'Pay within 3 days of confirmation. Details on the order page.', cod: 'Cash on delivery', codText: 'Pay the driver on delivery.', later: 'Pay later', laterText: '30 days, with your approved suppliers.', laterNo: function (names) { return 'Not available for ' + names + ' — those suppliers have not set credit terms for you.'; }, docs: 'Company documents verified', docsAdd: 'Add company documents', place: 'Place order', placing: 'Placing order…', err: 'We couldn’t place your order. Nothing was charged.', retry: 'Retry', support: 'Contact support', show: 'Show items', hideI: 'Hide items', n: function (n) { return n + ' items'; } },
      or: { title: function (id) { return 'Order ' + id; }, placed: 'Placed', confirmed: 'Confirmed', out: 'Out for delivery', delivered: 'Delivered', thanks: 'Thanks — your order is placed.', pay: 'Payment', payBank: function (d) { return 'Bank transfer · pay by ' + d; }, payCod: 'Cash on delivery · pay the driver', payLater: function (d) { return 'Pay later · due ' + d; }, iban: 'IBAN', copy: 'Copy IBAN', copied: 'IBAN copied', ref: 'Reference', remind: 'We’ll remind you once before the payment deadline.', again: 'Order again', invoice: 'Download invoice', downloading: function (f) { return f + ' is downloading'; }, items: 'Items', total: 'Total', by: function (s) { return 'Delivered by ' + s; } },
      rw: { title: 'Rewards', tabs: { active: 'Active', reached: 'Reached', used: 'Used', expired: 'Expired' }, reached: function (c) { return 'Reached · coupon ' + c + ' · Use at checkout'; }, used: function (o) { return 'Used on order ' + o; }, expired: function (d) { return 'Expired ' + d; }, of: function (a, b) { return 'BHD ' + a.toFixed(3) + ' of BHD ' + b.toFixed(3); }, ofN: function (a, b) { return a + ' of ' + b; }, none: 'Nothing here yet', useNow: 'Use at checkout' },
      nt: { title: 'Notifications', markAll: 'Mark all as read', viewOrder: 'View order', settings: 'Notification settings', permTitle: 'Browser notifications', permText: 'Get a notification when an order is confirmed or out for delivery. We ask the browser only when you switch this on.', permOn: 'Allowed for this browser', empty: 'No notifications yet' },
      ms: { title: 'Messages', lastMsg: 'Last message', typeMsg: 'Write a message', send: 'Send', open: 'Open chat', back: 'All conversations' },
      chat: 'Chat with us', accountTitle: 'Account', addr: 'Delivery address', phone: 'Phone' },
    ar: { home: 'الرئيسية', categories: 'الأقسام', brands: 'العلامات التجارية', allCategories: 'كل الأقسام', rewards: 'المكافآت', cart: 'السلة', messages: 'الرسائل', notifications: 'الإشعارات', account: 'الحساب', branch: 'الفرع', menu: 'القائمة', close: 'إغلاق', signin: 'تسجيل الدخول', signup: 'إنشاء حساب', guest: 'زائر',
      search: 'ابحث بالاسم أو القسم أو العلامة', recent: 'عمليات البحث الأخيرة', popular: 'أقسام شائعة', products: 'منتجات', suppliers: 'موردون', seeAll: function (q) { return 'عرض كل النتائج لـ «' + q + '»'; }, clear: 'مسح',
      shopAll: function (c) { return 'تسوق كل ' + c; }, viewAll: 'عرض الكل', orderAgain: 'اطلب مجددًا', lastOrder: function (id, d) { return 'طلبك الأخير ' + id + ' · ' + d; }, reorder: 'إعادة الطلب', reorderN: function (n) { return 'إعادة طلب ' + n + ' أصناف'; }, offers: 'عروض هذا الأسبوع', shopCats: 'تسوق حسب القسم', yourSuppliers: 'موردوك', allBrands: 'كل العلامات',
      delivery: function (d) { return d === 1 ? 'التوصيل غدًا' : 'التوصيل خلال ' + d + ' أيام'; }, tomorrow: 'غدًا', days: function (d) { return d + ' أيام'; }, minOrder: function (n) { return 'الحد الأدنى ' + n.toFixed(3) + ' د.ب'; }, shop: 'تسوق', rating: 'التقييم',
      moreIn: function (p) { return 'المزيد في ' + p; }, inCat: function (c) { return 'منتجات ' + c; }, filters: 'التصفية', clearAll: 'مسح الكل', apply: 'عرض النتائج', price: 'نطاق السعر', min: 'الأدنى', max: 'الأعلى', brand: 'العلامة', supplier: 'المورد', mySuppliers: 'موردوي فقط', orderedBefore: 'طلبته من قبل', searchBrands: 'ابحث في العلامات',
      sortBy: 'ترتيب حسب', sort: { relevance: 'الأكثر صلة', priceAsc: 'السعر: من الأقل', priceDesc: 'السعر: من الأعلى', name: 'الاسم', ordered: 'ما طلبته من قبل أولًا' }, count: function (n) { return n + ' منتج'; }, noMatch: 'لا توجد منتجات مطابقة', noMatchText: 'جرّب إزالة أحد الفلاتر أو توسيع نطاق السعر.',
      add: 'أضف', added: 'أُضيف إلى السلة', viewCart: 'عرض السلة', qtyUpdated: 'تم تحديث الكمية', removed: 'أُزيل من السلة', addedN: function (n) { return 'أُضيف ' + n + ' أصناف إلى السلة'; }, perUnit: function (p, u) { return p + ' د.ب / ' + u; }, from: function (p, q) { return 'من ' + p + ' د.ب عند ' + q + '+'; }, moq: function (n, u) { return 'الحد الأدنى ' + n + ' ' + u; }, outUntil: function (d) { return 'غير متوفر حتى ' + d; }, signToOrder: 'سجّل للطلب', save: 'حفظ لاحقًا', savedTip: 'محفوظ · اضغط للإزالة', wasPrice: 'سعر القائمة',
      guestTitle: 'سجّل لتطلب', guestLines: ['أسعار الجملة من كل مورد', 'ادفع لاحقًا بشروط ائتمان المورد', 'التوصيل إلى فرعك، عادةً في اليوم التالي'], guestBtn: 'أنشئ حساب أعمال', haveAccount: 'لدي حساب بالفعل', listPrice: 'سعر القائمة',
      footerBlurb: 'هاي بيس للتجارة ذ.م.م — منصة الجملة للتجارة المحلية في الخليج.', quick: 'روابط سريعة', contact: 'تواصل معنا', about: 'من نحن', terms: 'الشروط والأحكام', privacy: 'سياسة الخصوصية', help: 'مركز المساعدة', downloadApp: 'حمّل تطبيقنا', copyright: '© 2026 هاي بيس. جميع الحقوق محفوظة.', message: 'اترك لنا رسالة',
      stub: 'تُبنى هذه الصفحة في الخطوة التالية من النموذج.', pack: 'عبوة', packs: 'عبوات', cur: 'د.ب', cartTip: function (n, t) { return n + ' أصناف · ' + t + ' د.ب'; },
      landingH: 'جملة لمتجرك أو مطعمك أو مطبخك — توصيل داخل البحرين.', landingP: 'هاي بيس يربط عملك بالموردين المحليين. اطلب عبر الإنترنت، تتبّع التوصيل، وأعد الطلب في ثوانٍ.', browse: 'تصفح المنتجات', supCount: function (n) { return n + ' موردين في البحرين'; }, promise: 'توصيل في اليوم التالي لمعظم الطلبات', featured: 'مختارات هذا الأسبوع', listPriceNote: 'الأسعار المعروضة أسعار القائمة. أسعار الجملة بعد التسجيل.',
      su: { title: 'أنشئ حساب أعمالك', s1: 'رقم جوالك', s2: 'أدخل الرمز', s3: 'نشاطك التجاري', phone: 'رقم الجوال', phoneHelp: 'نرسل رمزًا لمرة واحدة عبر SMS.', code: 'رمز التحقق', codeHelp: function (p) { return 'أُرسل إلى ' + p + '. جرّب 1234 في هذا النموذج.'; }, name: 'اسم النشاط', branch: 'اسم الفرع', branchHelp: 'يصل التوصيل إلى هنا. يمكنك إضافة فروع لاحقًا.', cont: 'متابعة', create: 'إنشاء الحساب', docs: 'يمكنك إضافة مستندات الشركة (السجل التجاري، ضريبة القيمة المضافة) لاحقًا قبل تأكيد طلبك الأول.', back: 'رجوع', resend: 'إعادة إرسال الرمز', have: 'لديك حساب؟', errPhone: 'أدخل 8 أرقام بعد +973، مثل 3312 4455.', errCode: 'الرمز غير صحيح. تحقق من الرسالة أو أعد الإرسال.', errName: 'أدخل اسم النشاط.', errBranch: 'أدخل اسم الفرع، مثل «فرع السيف».', step: function (n) { return 'الخطوة ' + n + ' من 3'; }, done: 'أهلًا بك في هاي بيس' },
      si: { title: 'تسجيل الدخول', email: 'البريد الإلكتروني', pw: 'كلمة المرور', show: 'إظهار كلمة المرور', hide: 'إخفاء كلمة المرور', forgot: 'نسيت كلمة المرور؟', btn: 'تسجيل الدخول', loading: 'جارٍ تسجيل الدخول…', code: 'الدخول برمز', pwMode: 'الدخول بكلمة المرور', errEmail: 'أدخل البريد الذي سجّلت به.', errPw: function (e) { return 'كلمة المرور لـ ' + e + ' غير صحيحة. حاول مجددًا أو أعد تعيينها.'; }, errBlank: 'أدخل كلمة المرور.', noAcc: 'جديد في هاي بيس؟', reset: 'إعادة تعيين كلمة المرور', resetText: 'سنرسل رابط إعادة التعيين إلى', send: 'إرسال الرابط', sent: 'أُرسل الرابط. هكذا تبدو الرسالة:', emailSubject: 'إعادة تعيين كلمة مرور هاي بيس', emailBody: 'مرحبًا كافتيريا النور، اضغط الزر أدناه لاختيار كلمة مرور جديدة. الرابط صالح لمدة 30 دقيقة.', emailBtn: 'اختيار كلمة مرور جديدة', backSignin: 'العودة لتسجيل الدخول', hint: 'استخدم orders@alnoor.bh مع أي كلمة مرور عدا “wrong” في هذا النموذج.' },
      br: { title: 'العلامات التجارية', popular: 'علامات شائعة', search: 'ابحث في العلامات', all: 'كل العلامات أ–ي', none: 'لا توجد علامات مطابقة' },
      se: { title: function (q) { return 'نتائج «' + q + '»'; }, bySup: function (s) { return 'منتجات من ' + s; }, offersTitle: 'عروض هذا الأسبوع', none: function (q) { return 'لا توجد منتجات لـ «' + q + '»'; }, noneText: 'تحقق من الإملاء أو جرّب كلمة أقصر أو تصفح الأقسام.', request: 'اطلب هذا المنتج', suggestions: 'ربما تقصد' },
      pd: { supplier: 'المورد', rating: 'التقييم', msg: 'راسل المورد', perPack: 'للعبوة', perUnit: 'للوحدة', tiers: 'أسعار الكميات', qty: 'الكمية', range: 'الكمية', price: 'سعر العبوة', inStock: 'متوفر · يُشحن غدًا', inStock2: 'متوفر · يُشحن خلال يومين', addToCart: 'أضف إلى السلة', inCart: function (n) { return n + ' في السلة'; }, match: 'طابق سعري', desc: 'الوصف', specs: 'المواصفات', policies: 'سياسات المورد', same: 'من نفس المورد', similar: 'منتجات مشابهة', brand: 'العلامة', pack: 'العبوة', units: 'الوحدات في العبوة', storage: 'التخزين', origin: 'المنشأ', shelf: 'مدة الصلاحية', refund: 'الاسترجاع', refundText: 'أبلغ عن الأصناف التالفة أو الناقصة خلال 24 ساعة من التوصيل للحصول على إشعار دائن.', deliveryP: 'التوصيل', deliveryText: function (d, f) { return (d === 1 ? 'توصيل في اليوم التالي' : 'توصيل خلال ' + d + ' أيام') + ' إلى فرعك · ' + f.toFixed(3) + ' د.ب للطلب'; }, terms: 'شروط الدفع', termsText: 'تحويل بنكي أو الدفع عند الاستلام. الدفع لاحقًا متاح للمشترين المعتمدين.', matchTitle: 'طابق سعري', matchText: 'أخبر المورد بالسعر الذي تدفعه اليوم. يرد خلال يوم عمل واحد.', matchField: 'سعرك الحالي للعبوة', matchSend: 'إرسال الطلب', matchSent: 'أُرسل الطلب إلى', noDesc: 'عبوة جملة قياسية من كتالوج المورد.' },
      ca: { title: 'سلتك', empty: 'سلتك فارغة', emptyText: 'تصفح الأقسام أو أعد طلبك الأخير.', min: function (m, left) { return 'الحد الأدنى ' + m.toFixed(3) + ' د.ب · بقي ' + left.toFixed(3) + ' د.ب'; }, minOk: function (m) { return 'تم بلوغ الحد الأدنى ' + m.toFixed(3) + ' د.ب'; }, fee: function (f) { return f ? 'التوصيل ' + f.toFixed(3) + ' د.ب' : 'توصيل مجاني'; }, unit: 'سعر الوحدة', qty: 'الكمية', line: 'الإجمالي', remove: 'إزالة', coupon: 'رمز القسيمة', applyC: 'تطبيق', couponOn: function (c, l) { return 'تم تطبيق ' + c + ' · ' + l; }, couponBad: 'الرمز غير صالح أو منتهٍ.', summary: 'ملخص الطلب', items: 'الأصناف', discounts: 'الخصومات', delivery: 'التوصيل', vat: 'ضريبة 10%', total: 'الإجمالي', checkout: 'متابعة الدفع', couponLine: function (c) { return 'قسيمة ' + c; } },
      co: { title: 'إتمام الطلب', delivery: 'التوصيل', change: 'تغيير', items: 'الأصناف', payment: 'الدفع', bank: 'تحويل بنكي', bankText: 'ادفع خلال 3 أيام من التأكيد. التفاصيل في صفحة الطلب.', cod: 'الدفع عند الاستلام', codText: 'ادفع للسائق عند التسليم.', later: 'الدفع لاحقًا', laterText: '30 يومًا مع مورديك المعتمدين.', laterNo: function (names) { return 'غير متاح لـ ' + names + ' — لم يحدد هؤلاء الموردون شروط ائتمان لك.'; }, docs: 'مستندات الشركة موثّقة', docsAdd: 'أضف مستندات الشركة', place: 'تأكيد الطلب', placing: 'جارٍ تأكيد الطلب…', err: 'تعذّر تأكيد طلبك. لم يُخصم أي مبلغ.', retry: 'إعادة المحاولة', support: 'تواصل مع الدعم', show: 'عرض الأصناف', hideI: 'إخفاء الأصناف', n: function (n) { return n + ' أصناف'; } },
      or: { title: function (id) { return 'الطلب ' + id; }, placed: 'تم الطلب', confirmed: 'مؤكد', out: 'قيد التوصيل', delivered: 'تم التسليم', thanks: 'شكرًا — تم تسجيل طلبك.', pay: 'الدفع', payBank: function (d) { return 'تحويل بنكي · ادفع قبل ' + d; }, payCod: 'الدفع عند الاستلام · ادفع للسائق', payLater: function (d) { return 'الدفع لاحقًا · الاستحقاق ' + d; }, iban: 'IBAN', copy: 'نسخ IBAN', copied: 'تم نسخ IBAN', ref: 'المرجع', remind: 'سنذكّرك مرة واحدة قبل موعد الدفع.', again: 'اطلب مجددًا', invoice: 'تنزيل الفاتورة', downloading: function (f) { return 'جارٍ تنزيل ' + f; }, items: 'الأصناف', total: 'الإجمالي', by: function (s) { return 'التوصيل من ' + s; } },
      rw: { title: 'المكافآت', tabs: { active: 'نشطة', reached: 'مكتملة', used: 'مستخدمة', expired: 'منتهية' }, reached: function (c) { return 'مكتملة · قسيمة ' + c + ' · استخدمها عند الدفع'; }, used: function (o) { return 'استُخدمت في الطلب ' + o; }, expired: function (d) { return 'انتهت ' + d; }, of: function (a, b) { return a.toFixed(3) + ' من ' + b.toFixed(3) + ' د.ب'; }, ofN: function (a, b) { return a + ' من ' + b; }, none: 'لا شيء هنا بعد', useNow: 'استخدمها عند الدفع' },
      nt: { title: 'الإشعارات', markAll: 'تعليم الكل كمقروء', viewOrder: 'عرض الطلب', settings: 'إعدادات الإشعارات', permTitle: 'إشعارات المتصفح', permText: 'احصل على إشعار عند تأكيد الطلب أو خروجه للتوصيل. نطلب الإذن من المتصفح فقط عند تفعيل هذا الخيار.', permOn: 'مسموح لهذا المتصفح', empty: 'لا توجد إشعارات بعد' },
      ms: { title: 'الرسائل', lastMsg: 'آخر رسالة', typeMsg: 'اكتب رسالة', send: 'إرسال', open: 'فتح المحادثة', back: 'كل المحادثات' },
      chat: 'تحدث معنا', accountTitle: 'الحساب', addr: 'عنوان التوصيل', phone: 'الهاتف' }
  };
  var t = function (k) { return T[S.lang][k]; };
  var cname = function (c) { return S.lang === 'ar' && c.ar ? c.ar : c.en; };
  var fmt = function (n) { return n.toFixed(3); };
  var money = function (n) { return '<span class="num ltr">' + t('cur') + ' ' + fmt(n) + '</span>'; };

  /* ---------- money: the one source of truth ---------- */
  var linePrice = function (p, qty) { var price = p.price; if (p.tiers) p.tiers.forEach(function (tr) { if (qty >= tr[0]) price = tr[1]; }); return price; };
  var listPrice = function (p) { return p.off ? p.price / (1 - p.off / 100) : p.price; };
  var cartItems = function () { return Object.keys(S.cart).filter(function (id) { return S.cart[id] > 0; }).map(function (id) { var p = H.PBY[id], q = S.cart[id]; return { p: p, qty: q, unit: linePrice(p, q), total: linePrice(p, q) * q }; }); };
  var COUPONS = { NADEC10: { pct: 10, brand: 'nadec', label: '10% off Nadec' }, FRESH5: { pct: 5, label: '5% off everything' } };
  var couponFor = function (p) { var c = COUPONS[S.coupon]; if (!c) return 0; if (c.brand && c.brand !== p.brand) return 0; return c.pct; };
  var totals = function () {
    var items = cartItems(), sub = 0, disc = 0, sups = {};
    items.forEach(function (it) { var pct = couponFor(it.p); it.coupon = pct ? Math.round(it.total * pct / 100 * 1000) / 1000 : 0; it.net = it.total - it.coupon; sub += it.net; disc += (listPrice(it.p) - it.unit) * it.qty + it.coupon; sups[it.p.sup] = (sups[it.p.sup] || 0) + it.net; });
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
  window.addEventListener('hashchange', function () { S.f = blankFilters(); S.msgOpen = false; S.thread = null; S.matchOpen = false; S.pdpQty = 1; S.pdpTab = 'desc'; S.orderErr = false; if (parse().name !== 'search') S.search.q = ''; S.mega.open = false; S.drawer = false; S.search.open = false; S.sheet = null; S.loading = true; render(); window.scrollTo(0, 0); app.scrollTo(0, 0); setTimeout(function () { S.loading = false; render(); }, 350); });

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
    switch (r.name) {
      case 'home': return pageHome(); case 'category': return pageCategory(r); case 'landing': return pageLanding(); case 'signup': return pageSignup(); case 'signin': return pageSignin();
      case 'brands': return pageBrands(); case 'search': return pageSearch(); case 'product': return pageProduct(); case 'cart': return pageCart(); case 'checkout': return pageCheckout();
      case 'order': return pageOrder(); case 'rewards': return pageRewards(); case 'notifications': return pageNotifications(); case 'account': return pageAccount();
      case 'messages': return pageHome();
    }
    return pageStub(STUBS[r.name] || r.name);
  };


  /* ---------- extra mock data for the account pages (proposal) ---------- */
  var ORDERS_SEED = [{ id: 'HB-48211', date: '3 Oct 2026', items: H.LAST_ORDER.items, pay: 'bank', status: 3, deadline: '6 Oct 2026' }];
  var REWARDS = [
    { id: 'r1', name: 'Spend BHD 100 with Gulf Dairy Trading', get: '5% off your next Gulf Dairy order', kind: 'money', now: 74.4, goal: 100, state: 'active' },
    { id: 'r2', name: 'Three orders this month', get: 'Coupon FRESH5 — 5% off everything', kind: 'count', now: 3, goal: 3, state: 'reached', coupon: 'FRESH5' },
    { id: 'r3', name: 'Try a Nadec product', get: 'Coupon NADEC10 — 10% off Nadec', kind: 'count', now: 1, goal: 1, state: 'reached', coupon: 'NADEC10' },
    { id: 'r4', name: 'Order from three suppliers', get: 'Free delivery on one order', kind: 'count', now: 3, goal: 3, state: 'used', order: 'HB-48190' },
    { id: 'r5', name: 'September welcome bonus', get: 'BHD 5 off orders over BHD 50', kind: 'money', now: 32, goal: 50, state: 'expired', date: '30 Sep 2026' }
  ];
  var NOTIFS = function () {
    var out = [{ order: 'HB-48211', events: [['3 Oct, 10:12', 'Order placed · 4 items · BHD 21.219'], ['3 Oct, 10:40', 'Gulf Dairy Trading confirmed your order'], ['3 Oct, 11:02', 'Invoice INV-48211 is ready'], ['4 Oct, 08:15', 'Out for delivery · driver Hamad'], ['4 Oct, 10:30', 'Delivered to Seef Mall branch']] }];
    S.orders.forEach(function (o) { out.unshift({ order: o.id, events: [[o.date, 'Order placed · ' + o.items.length + ' items · BHD ' + fmt(o.total)]] }); });
    return out;
  };
  var THREADS = [{ sup: 's1', last: 'Your order HB-48211 was delivered. Anything missing?', at: '4 Oct', unread: true, msgs: [['sup', 'Good morning! Your order HB-48211 is out for delivery, driver Hamad.', '08:15'], ['me', 'Thanks, please ask him to call the kitchen door.', '08:20'], ['sup', 'Your order HB-48211 was delivered. Anything missing?', '10:32']] },
    { sup: 's2', last: 'We can do BHD 13.600 on Puck cream cheese at 10 cases.', at: '1 Oct', unread: false, msgs: [['me', 'Can you match BHD 13.500 on Puck Cream Cheese 500g?', '1 Oct'], ['sup', 'We can do BHD 13.600 on Puck cream cheese at 10 cases.', '1 Oct']] },
    { sup: 's4', last: 'New Pepsi 330ml promo this week, 10% off.', at: '29 Sep', unread: false, msgs: [['sup', 'New Pepsi 330ml promo this week, 10% off.', '29 Sep']] }];

  /* ---------- landing (guest) ---------- */
  var pageLanding = function () {
    var feat = ['p01', 'p21', 'p29', 'p39', 'p07', 'p32'].map(function (id) { return H.PBY[id]; });
    return '<div class="wrap page landing">' + crumbs([[t('home'), '#home'], [t('browse'), '']]) + '<section class="land"><h1 class="land__h">' + t('landingH') + '</h1><p class="land__p">' + t('landingP') + '</p>' + btn(t('browse'), { href: '#category/foods', size: 'xl', width: true, cls: 'land__cta' }) + '<ul class="land__facts"><li>' + ic('store') + esc(t('supCount')(H.SUPPLIERS.length)) + '</li><li>' + ic('truck') + esc(t('promise')) + '</li></ul></section>' +
      '<section class="sec"><div class="sec__head"><h2 class="sec__title">' + t('featured') + '</h2></div><div class="grid grid--land">' + feat.map(function (p) { return '<a class="landp" href="#product/' + p.id + '">' + ph(p.name, { icon: 'image' }) + '<b>' + esc(p.name) + '</b><span>' + esc(p.pack) + '</span><span class="landp__price">' + esc(t('listPrice')) + ' ' + money(listPrice(p)) + '</span></a>'; }).join('') + '</div><p class="note">' + t('listPriceNote') + '</p></section></div>';
  };

  /* ---------- sign-up ---------- */
  var field = function (o) { return '<div class="hb-field hb-textfield" data-state="' + (o.err ? 'error' : o.val ? 'typing' : 'default') + '"><label class="hb-field__label" for="' + o.id + '">' + o.label + (o.req ? '<span class="hb-field__req">*</span>' : '') + '</label><div class="hb-field__control">' + (o.prefix ? '<span class="hb-field__affix ltr">' + o.prefix + '</span>' : '') + '<input id="' + o.id + '" class="hb-field__input ' + (o.cls || '') + '" type="' + (o.type || 'text') + '" inputmode="' + (o.mode || 'text') + '" value="' + attr(o.val || '') + '" placeholder="' + attr(o.ph || '') + '" data-act="' + o.act + '" data-f="' + o.id + '" autocomplete="' + (o.auto || 'off') + '"' + (o.extra || '') + '>' + (o.suffix || '') + '</div>' + (o.err ? '<span class="hb-field__msg" role="alert">' + ic('error', 'hb-field__msg-icon') + esc(o.err) + '</span>' : o.help ? '<span class="hb-field__msg">' + esc(o.help) + '</span>' : '') + '</div>'; };
  var suErr = function (k) { var u = S.signup, v = u[k]; if (!u.touched[k]) return ''; if (k === 'phone') return /^\d{8}$/.test(v.replace(/\s/g, '')) ? '' : t('su').errPhone; if (k === 'code') return v === '1234' ? '' : t('su').errCode; if (k === 'name') return v.trim() ? '' : t('su').errName; if (k === 'branch') return v.trim() ? '' : t('su').errBranch; return ''; };
  var pageSignup = function () {
    var u = S.signup, s = t('su'), body;
    if (u.step === 4) body = '<div class="auth__done">' + '<svg class="hb-il" data-size="md" role="img" aria-label=""><use href="#hb-il-success"/></svg>' + '<h2 class="sec__title">' + s.done + '</h2><p>' + esc(u.name) + ' · ' + esc(u.branch) + '</p>' + btn(t('browse'), { href: '#home', width: true, act: 'become-buyer' }) + '</div>';
    else if (u.step === 1) body = field({ id: 'phone', label: s.phone, req: true, val: u.phone, prefix: '+973', mode: 'numeric', type: 'tel', ph: '3312 4455', act: 'su-input', err: suErr('phone'), help: s.phoneHelp, cls: 'ltr', auto: 'tel' }) + btn(s.cont, { act: 'su-next', width: true });
    else if (u.step === 2) body = field({ id: 'code', label: s.code, req: true, val: u.code, mode: 'numeric', ph: '••••', act: 'su-input', err: suErr('code'), help: s.codeHelp('+973 ' + u.phone), cls: 'ltr', auto: 'one-time-code' }) + btn(s.cont, { act: 'su-next', width: true }) + '<div class="auth__links"><button type="button" class="link" data-act="su-back">' + s.back + '</button><button type="button" class="link" data-act="su-resend">' + s.resend + '</button></div>';
    else body = field({ id: 'name', label: s.name, req: true, val: u.name, ph: 'Al Noor Cafeteria', act: 'su-input', err: suErr('name'), auto: 'organization' }) + field({ id: 'branch', label: s.branch, req: true, val: u.branch, ph: 'Seef branch', act: 'su-input', err: suErr('branch'), help: s.branchHelp }) + '<div class="hb-alert hb-inline-alert" data-status="info" role="note"><span class="hb-alert__icon">' + ic('info') + '</span><span class="hb-alert__body">' + s.docs + '</span></div>' + btn(s.create, { act: 'su-next', width: true }) + '<div class="auth__links"><button type="button" class="link" data-act="su-back">' + s.back + '</button></div>';
    return '<div class="wrap page">' + crumbs([[t('home'), '#home'], [t('signup'), '']]) + '<div class="auth"><div class="hb-card auth__card"><span class="eyebrow">' + (u.step < 4 ? s.step(u.step) : '') + '</span><h1 class="title">' + (u.step === 1 ? s.s1 : u.step === 2 ? s.s2 : u.step === 3 ? s.s3 : s.title) + '</h1><ol class="steps" aria-hidden="true">' + [1, 2, 3].map(function (n) { return '<li data-on="' + (u.step >= n) + '"></li>'; }).join('') + '</ol><form class="auth__form" data-act="su-form" novalidate>' + body + '</form>' + (u.step < 4 ? '<p class="auth__foot">' + s.have + ' <a href="#signin">' + t('signin') + '</a></p>' : '') + '</div></div></div>';
  };

  /* ---------- sign-in ---------- */
  var pageSignin = function () {
    var i = S.signin, s = t('si'), body;
    if (i.reset) body = '<p>' + s.resetText + ' <b class="ltr">' + esc(i.email || 'orders@alnoor.bh') + '</b></p>' + (i.resetSent ? '<p class="note">' + s.sent + '</p><div class="email"><div class="email__head"><span class="email__logo">HIGHBASE</span><span>' + s.emailSubject + '</span></div><p>' + s.emailBody + '</p>' + btn(s.emailBtn, { href: '#signin', size: 'md' }) + '<span class="email__foot">HIGHBASE TRADING W.L.L · Seef, Kingdom of Bahrain</span></div>' : btn(s.send, { act: 'si-reset-send', width: true })) + '<div class="auth__links"><button type="button" class="link" data-act="si-reset-back">' + s.backSignin + '</button></div>';
    else if (i.mode === 'code') body = field({ id: 'siphone', label: t('su').phone, req: true, val: i.phone || '', prefix: '+973', mode: 'numeric', type: 'tel', ph: '3312 4455', act: 'si-input', cls: 'ltr' }) + btn(s.code, { act: 'si-code-send', width: true, extra: i.loading ? ' disabled aria-busy="true"' : '' }) + '<div class="auth__links"><button type="button" class="link" data-act="si-mode" data-v="password">' + s.pwMode + '</button></div>';
    else body = field({ id: 'email', label: s.email, req: true, type: 'email', mode: 'email', val: i.email, ph: 'orders@alnoor.bh', act: 'si-input', err: i.err === 'email' ? s.errEmail : '', cls: 'ltr', auto: 'email' }) +
      field({ id: 'pw', label: s.pw, req: true, type: i.show ? 'text' : 'password', val: i.pw, act: 'si-input', err: i.err === 'pw' ? s.errPw(i.email) : i.err === 'blank' ? s.errBlank : '', auto: 'current-password', cls: 'ltr', suffix: iconBtn(i.show ? 'hide' : 'view', i.show ? s.hide : s.show, { act: 'si-show', size: 'sm', extra: ' aria-pressed="' + i.show + '"' }) }) +
      '<div class="auth__links" style="justify-content:flex-end"><button type="button" class="link" data-act="si-reset">' + s.forgot + '</button></div>' +
      btn(i.loading ? s.loading : s.btn, { act: 'si-submit', type: 'submit', width: true, extra: i.loading ? ' disabled aria-busy="true"' : '' }) + '<div class="auth__links"><button type="button" class="link" data-act="si-mode" data-v="code">' + s.code + '</button></div><p class="note">' + s.hint + '</p>';
    return '<div class="wrap page">' + crumbs([[t('home'), '#home'], [t('signin'), '']]) + '<div class="auth"><div class="hb-card auth__card"><h1 class="title">' + (i.reset ? s.reset : s.title) + '</h1><form class="auth__form" data-act="si-form" novalidate>' + body + '</form>' + (i.reset ? '' : '<p class="auth__foot">' + s.noAcc + ' <a href="#signup">' + t('signup') + '</a></p>') + '</div></div></div>';
  };

  /* ---------- brands ---------- */
  var AR_LETTER = { almarai: 'أ', nadec: 'ن', puck: 'ب', lurpak: 'ل', kraft: 'ك', nestle: 'ن', pepsi: 'ب', alain: 'أ', lipton: 'ل', fairy: 'ف', persil: 'ب', fine: 'ف' };
  var pageBrands = function () {
    var q = (S.route.q.q || S.brandQ2 || '').toLowerCase(), s = t('br');
    var list = H.BRANDS.filter(function (b) { return !q || b.name.toLowerCase().indexOf(q) >= 0; });
    var letter = function (b) { return S.lang === 'ar' ? AR_LETTER[b.id] : b.name[0].toUpperCase(); };
    var groups = {}; list.forEach(function (b) { var L = letter(b); (groups[L] = groups[L] || []).push(b); });
    var letters = Object.keys(groups).sort(function (x, y) { return x.localeCompare(y, S.lang); });
    var tile = function (b) { return '<a class="brand" href="#search?brand=' + b.id + '">' + blogo(b) + '<span>' + esc(b.name) + '</span></a>'; };
    return '<div class="wrap page">' + crumbs([[t('home'), '#home'], [s.title, '']]) + '<div class="toolbar"><h1 class="title">' + s.title + '</h1><span class="hb-search brands__search" data-state="' + (q ? 'typing' : 'default') + '"><span class="hb-search__icon">' + ic('search') + '</span><input class="hb-search__input" type="search" placeholder="' + attr(s.search) + '" aria-label="' + attr(s.search) + '" value="' + attr(S.route.q.q || S.brandQ2 || '') + '" data-act="brand-q"></span></div>' +
      (q ? '' : '<section class="sec"><div class="sec__head"><h2 class="sec__title">' + s.popular + '</h2></div><div class="brands-row">' + H.BRANDS.filter(function (b) { return b.popular; }).map(tile).join('') + '</div></section>') +
      '<section class="sec"><div class="sec__head"><h2 class="sec__title">' + s.all + '</h2><nav class="azbar" aria-label="A–Z">' + letters.map(function (L) { return '<a href="#brands" data-act="az" data-l="' + attr(L) + '">' + L + '</a>'; }).join('') + '</nav></div>' + (letters.length ? letters.map(function (L) { return '<div class="azgroup" id="az-' + encodeURIComponent(L) + '"><h3 class="azgroup__h">' + L + '</h3><div class="brands-row">' + groups[L].map(tile).join('') + '</div></div>'; }).join('') : '<div class="hb-empty"><span class="hb-empty__title">' + s.none + '</span></div>') + '</section></div>';
  };

  /* ---------- search results ---------- */
  var pageSearch = function () {
    var q = S.route.q, s = t('se'), title, list, bc;
    if (q.supplier && H.SBY[q.supplier]) { title = s.bySup(H.SBY[q.supplier].name); list = H.PRODUCTS.filter(function (p) { return p.sup === q.supplier; }); }
    else if (q.brand && H.BBY[q.brand]) { title = H.BBY[q.brand].name; list = H.PRODUCTS.filter(function (p) { return p.brand === q.brand; }); }
    else if (q.offers) { title = s.offersTitle; list = H.PRODUCTS.filter(function (p) { return p.off; }); }
    else { var qq = (q.q || '').trim(); title = s.title(qq); list = qq ? suggest(qq).products : []; S.search.q = qq; }
    bc = [[t('home'), '#home'], [title, '']];
    if (!list.length) { var alt = Object.keys(H.BY).map(function (k) { return H.BY[k]; }).filter(function (c) { return !c.kids.length; }).slice(0, 4); return '<div class="wrap page">' + crumbs(bc) + '<h1 class="title">' + esc(title) + '</h1><section class="sec"><div class="hb-empty"><span class="hb-empty__art"><svg class="hb-il" data-size="lg" role="img" aria-label=""><use href="#hb-il-empty-search"/></svg></span><span class="hb-empty__title">' + esc(s.none(q.q || '')) + '</span><span class="hb-empty__text">' + s.noneText + '</span><span class="hb-empty__actions">' + btn(s.request, { href: '#messages', style: 'outlined', intent: 'secondary', size: 'md', icon: 'message' }) + '</span></div><div class="sec__head" style="justify-content:center"><span class="recent__h">' + s.suggestions + '</span></div><div class="pills" style="justify-content:center">' + H.POPULAR_CATS.map(function (c) { return chip(esc(cname(H.BY[c])), { href: catHref(c) }); }).join('') + '</div></section></div>'; }
    return '<div class="wrap page">' + crumbs(bc) + '<h1 class="title">' + esc(title) + '</h1><section class="sec">' + listing(list) + '</section></div>';
  };

  /* ---------- product page ---------- */
  var pageProduct = function () {
    var p = H.PBY[S.route.parts[0]]; if (!p) return pageStub('Product'); var s = t('pd'), sup = H.SBY[p.sup], b = H.BBY[p.brand], leaf = H.BY[p.leaf], out = p.stock !== 'in', q = S.cart[p.id] || 0;
    var bc = [[t('home'), '#home']].concat(H.PATH[p.leaf].map(function (c) { return [cname(c), catHref(c.slug)]; })).concat([[p.name, '']]);
    var qty = Math.max(S.pdpQty, p.moq), price = linePrice(p, qty);
    var tiers = p.tiers ? [[1, p.tiers[0][0] - 1, p.price]].concat(p.tiers.map(function (tr, i) { return [tr[0], p.tiers[i + 1] ? p.tiers[i + 1][0] - 1 : null, tr[1]]; })) : null;
    var buy = '<div class="hb-card buy"><div class="buy__price"><span class="pc__amount"><span class="cur">' + t('cur') + '</span><span class="num ltr">' + fmt(price) + '</span>' + (p.off ? '<span class="pc__was num ltr">' + fmt(listPrice(p)) + '</span>' : '') + '<span class="buy__per">' + s.perPack + '</span></span><span class="pc__unit">' + esc(t('perUnit')(fmt(price / p.units), p.unit)) + ' ' + s.perUnit + '</span></div>' +
      (tiers ? '<table class="tiers"><caption class="sr-only">' + s.tiers + '</caption><thead><tr><th>' + s.range + '</th><th>' + s.price + '</th></tr></thead><tbody>' + tiers.map(function (tr) { var on = qty >= tr[0] && (tr[1] === null || qty <= tr[1]); return '<tr data-on="' + on + '"><td>' + tr[0] + (tr[1] === null ? '+' : '–' + tr[1]) + ' ' + t('packs') + '</td><td class="num ltr">' + t('cur') + ' ' + fmt(tr[2]) + '</td></tr>'; }).join('') + '</tbody></table>' : '') +
      '<ul class="buy__facts">' + (p.moq > 1 ? '<li>' + ic('package') + esc(t('moq')(p.moq, t('packs'))) + '</li>' : '') + '<li data-stock="' + (out ? 'out' : 'in') + '">' + ic(out ? 'clock' : 'check') + (out ? esc(t('outUntil')(p.stock.split(':')[1])) : (sup.delivery === 1 ? s.inStock : s.inStock2)) + '</li></ul>' +
      (out ? '' : guest() ? btn(t('signToOrder'), { act: 'guest-add', width: true, icon: 'cart', extra: ' data-id="' + p.id + '" data-event="add_to_cart" data-source="pdp"' }) :
        '<div class="buy__row"><div class="hb-atc" data-state="stepper"><button type="button" class="hb-btn hb-icon-btn hb-atc__step" data-intent="secondary" data-style="ghost" data-size="md" data-act="pdp-dec" aria-label="−"><span class="hb-btn__icon">' + ic('minus') + '</span></button><input class="hb-atc__value num" type="number" min="' + p.moq + '" value="' + qty + '" aria-label="' + attr(s.qty) + '" data-act="pdp-qty"><button type="button" class="hb-btn hb-icon-btn hb-atc__step" data-intent="secondary" data-style="ghost" data-size="md" data-act="pdp-inc" aria-label="+"><span class="hb-btn__icon">' + ic('add') + '</span></button></div>' + btn(s.addToCart, { act: 'pdp-add', icon: 'cart', width: true, extra: ' data-id="' + p.id + '" data-event="add_to_cart" data-source="pdp"' }) + '</div>' + (q ? '<span class="note">' + esc(s.inCart(q)) + ' · <a href="#cart">' + t('viewCart') + '</a></span>' : '')) +
      (out ? '' : '<button type="button" class="link" data-act="match" data-event="match_price_opened" data-id="' + p.id + '">' + s.match + '</button>') + '</div>';
    var supCard = '<div class="hb-card supcard"><span class="hb-avatar" data-shape="square" data-size="48">' + sup.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</span><div class="supcard__body"><span class="eyebrow">' + s.supplier + '</span><a href="#search?supplier=' + sup.id + '"><b>' + esc(sup.name) + '</b></a><span>' + stars(sup.rating) + ' ' + s.rating + ' · ' + esc(t('delivery')(sup.delivery)) + '</span></div>' + btn(s.msg, { href: '#messages?thread=' + sup.id, style: 'outlined', intent: 'secondary', size: 'md', icon: 'message' }) + '</div>';
    var tab = function (k, label) { return '<button type="button" class="hb-tab" role="tab" aria-selected="' + (S.pdpTab === k) + '" data-act="pdp-tab" data-v="' + k + '">' + label + '</button>'; };
    var tabBody = S.pdpTab === 'desc' ? '<p>' + esc(p.desc || s.noDesc) + '</p>' : S.pdpTab === 'specs' ? '<table class="specs"><tbody>' + [[s.brand, b.name], [s.pack, p.pack], [s.units, p.units + ' ' + p.unit], [s.storage, p.leaf === 'fresh-milk' || p.leaf === 'cheese' || p.leaf === 'yoghurt' || p.leaf === 'butter' || p.leaf === 'chicken' || p.leaf === 'beef-lamb' ? 'Chilled 0–4 °C' : 'Ambient, dry'], [s.origin, b.id === 'almarai' || b.id === 'nadec' ? 'Saudi Arabia' : b.id === 'alain' ? 'UAE' : 'Imported'], [s.shelf, '90 days']].map(function (r) { return '<tr><th>' + r[0] + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</tbody></table>' : '<dl class="pol"><dt>' + s.refund + '</dt><dd>' + s.refundText + '</dd><dt>' + s.deliveryP + '</dt><dd>' + esc(s.deliveryText(sup.delivery, sup.fee)) + '</dd><dt>' + s.terms + '</dt><dd>' + s.termsText + '</dd></dl>';
    var same = H.PRODUCTS.filter(function (x) { return x.sup === p.sup && x.id !== p.id; }).slice(0, 4), similar = H.PRODUCTS.filter(function (x) { return x.leaf === p.leaf && x.id !== p.id; }).concat(H.PRODUCTS.filter(function (x) { return H.BY[x.leaf].parent === leaf.parent && x.leaf !== p.leaf; })).slice(0, 4);
    return '<div class="wrap page">' + crumbs(bc) + '<div class="pdp"><div class="gallery"><div class="gallery__main">' + ph(p.name, { icon: 'image' }) + (p.off ? '<span class="hb-chip pc__off" data-style="tonal" data-size="sm" data-tone="offer"><span class="hb-chip__label ltr">−' + p.off + '%</span></span>' : '') + '</div><div class="gallery__thumbs">' + [1, 2, 3].map(function (n) { return '<span class="ph ph--sq" aria-hidden="true">' + ic('image') + '</span>'; }).join('') + '</div></div>' +
      '<div class="pdp__main"><h1 class="title">' + esc(p.name) + '</h1><span class="pc__pack">' + esc(p.pack) + ' · ' + esc(b.name) + '</span>' + supCard + '<div class="hb-tabs" role="tablist">' + tab('desc', s.desc) + tab('specs', s.specs) + tab('pol', s.policies) + '</div><div class="tabbody">' + tabBody + '</div></div>' + buy + '</div>' +
      (same.length ? '<section class="sec"><div class="sec__head"><h2 class="sec__title">' + s.same + '</h2><a class="sec__link" href="#search?supplier=' + sup.id + '">' + t('viewAll') + '</a></div><div class="row scroll">' + cards(same) + '</div></section>' : '') +
      (similar.length ? '<section class="sec"><div class="sec__head"><h2 class="sec__title">' + s.similar + '</h2><a class="sec__link" href="' + catHref(p.leaf) + '">' + t('viewAll') + '</a></div><div class="row scroll">' + cards(similar) + '</div></section>' : '') +
      (S.matchOpen ? '<div class="sheet-layer" data-act="sheet-close"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="m-t" data-stop><span class="sheet__grab"></span><h2 class="sheet__title" id="m-t">' + s.matchTitle + '</h2><p>' + s.matchText + '</p><form data-act="match-form" class="auth__form">' + field({ id: 'mprice', label: s.matchField, prefix: t('cur'), mode: 'decimal', ph: fmt(p.price * 0.95), act: 'noop', cls: 'ltr' }) + btn(s.matchSend, { type: 'submit', width: true }) + '</form></div></div>' : '') + '</div>';
  };

  /* ---------- cart ---------- */
  var summary = function (tt, o) {
    o = o || {}; var s = t('ca'), c = COUPONS[S.coupon];
    var row = function (l, v, cls) { return '<div class="sum__row ' + (cls || '') + '"><span>' + l + '</span><span>' + v + '</span></div>'; };
    return '<div class="hb-card sum"><h2 class="sec__title">' + s.summary + '</h2>' + (o.err ? '<div class="hb-alert hb-inline-alert" data-status="error" role="alert"><span class="hb-alert__icon">' + ic('error') + '</span><span class="hb-alert__body"><b>' + t('co').err + '</b><span class="hb-alert__actions" style="margin-block-start:var(--hb-space-8)">' + btn(t('co').retry, { act: 'place', size: 'sm' }) + btn(t('co').support, { href: '#messages', style: 'ghost', intent: 'secondary', size: 'sm' }) + '</span></span></div>' : '') +
      row(s.items + ' (' + tt.count + ')', money(tt.sub + tt.disc - (c ? tt.items.reduce(function (a, it) { return a + it.coupon; }, 0) : 0) - tt.items.reduce(function (a, it) { return a + (listPrice(it.p) - it.unit) * it.qty; }, 0) + tt.items.reduce(function (a, it) { return a + (listPrice(it.p) - it.unit) * it.qty; }, 0))) + (tt.disc ? row(s.discounts + (c ? ' · ' + S.coupon : ''), '−' + money(tt.disc), 'sum__disc') : '') + row(s.delivery, tt.delivery ? money(tt.delivery) : s.fee(0)) + row(s.vat, money(tt.vat)) + row(s.total, money(tt.total), 'sum__total') +
      (o.cta || '') + '</div>';
  };
  var pageCart = function () {
    var s = t('ca'), tt = totals();
    if (!tt.lines) return '<div class="wrap page">' + crumbs([[t('home'), '#home'], [s.title, '']]) + '<h1 class="title">' + s.title + '</h1><section class="sec"><div class="hb-empty"><span class="hb-empty__art"><svg class="hb-il" data-size="lg" role="img" aria-label=""><use href="#hb-il-empty-cart"/></svg></span><span class="hb-empty__title">' + s.empty + '</span><span class="hb-empty__text">' + s.emptyText + '</span><span class="hb-empty__actions">' + btn(t('browse'), { href: '#category/foods', size: 'md' }) + (guest() ? '' : btn(t('orderAgain'), { href: '#order/HB-48211', style: 'outlined', intent: 'secondary', size: 'md' })) + '</span></div></section></div>';
    var groups = {}; tt.items.forEach(function (it) { (groups[it.p.sup] = groups[it.p.sup] || []).push(it); });
    var g = Object.keys(groups).map(function (sid) { var sup = H.SBY[sid], sum = tt.bySupplier[sid], left = Math.max(0, sup.min - sum); return '<div class="hb-card cgroup"><div class="cgroup__head"><span class="hb-avatar" data-shape="square" data-size="32">' + sup.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</span><div><b>' + esc(sup.name) + '</b><span class="cgroup__min" data-ok="' + !left + '">' + esc(left ? s.min(sup.min, left) : s.minOk(sup.min)) + ' · ' + esc(s.fee(sup.fee)) + '</span></div><span class="cgroup__del">' + ic('truck') + ' ' + esc(t('delivery')(sup.delivery)) + '</span></div>' +
      groups[sid].map(function (it) { var p = it.p; return '<div class="line" data-id="' + p.id + '">' + ph(p.name, { cls: 'line__img' }) + '<div class="line__body"><a class="pc__name" href="#product/' + p.id + '">' + esc(p.name) + '</a><span class="pc__pack">' + esc(p.pack) + '</span><span class="line__unit">' + s.unit + ' ' + money(it.unit) + (it.unit < p.price ? ' <span class="fact">' + esc(t('from')(fmt(it.unit), p.tiers[0][0])) + '</span>' : '') + '</span>' + (it.coupon ? '<span class="line__coupon">' + esc(s.couponLine(S.coupon)) + ' −' + money(it.coupon) + '</span>' : '') + '</div><div class="line__qty"><label class="sr-only" for="q-' + p.id + '">' + s.qty + '</label>' + atc(p) + '</div><div class="line__total"><span class="line__l">' + s.line + '</span>' + money(it.net) + '</div>' + iconBtn('delete', s.remove, { act: 'remove', intent: 'danger', extra: ' data-id="' + p.id + '"' }) + '</div>'; }).join('') + '</div>'; }).join('');
    var coupon = '<form class="coupon" data-act="coupon-form"><div class="hb-field hb-textfield" data-state="' + (S.couponErr ? 'error' : S.coupon ? 'typing' : 'default') + '"><label class="hb-field__label" for="coupon">' + s.coupon + '</label><div class="hb-field__control"><input id="coupon" class="hb-field__input ltr" value="' + attr(S.couponDraft || S.coupon) + '" placeholder="FRESH5" data-act="coupon-input" autocomplete="off"></div>' + (S.couponErr ? '<span class="hb-field__msg" role="alert">' + ic('error', 'hb-field__msg-icon') + s.couponBad + '</span>' : S.coupon ? '<span class="hb-field__msg" style="color:var(--hb-color-on-success-container)">' + ic('success', 'hb-field__msg-icon') + esc(s.couponOn(S.coupon, COUPONS[S.coupon].label)) + '</span>' : '') + '</div>' + btn(s.applyC, { type: 'submit', style: 'outlined', intent: 'secondary', size: 'lg' }) + '</form>';
    return '<div class="wrap page">' + crumbs([[t('home'), '#home'], [s.title, '']]) + '<h1 class="title">' + s.title + '</h1><div class="cartgrid"><div class="cart__left">' + g + coupon + '</div>' + summary(tt, { cta: btn(s.checkout + ' · ' + t('cur') + ' ' + fmt(tt.total), { href: '#checkout', width: true, extra: ' data-event="checkout_started"' }) }) + '</div></div>';
  };

  /* ---------- checkout ---------- */
  var pageCheckout = function () {
    var s = t('co'), tt = totals(), b = H.BUYER; if (!tt.lines) return pageCart();
    var groups = {}; tt.items.forEach(function (it) { (groups[it.p.sup] = groups[it.p.sup] || []).push(it); });
    var noLater = Object.keys(groups).filter(function (sid) { return !H.SBY[sid].mine; }).map(function (sid) { return H.SBY[sid].name; });
    var radio = function (v, label, text, extra) { return '<label class="hb-radio payopt" data-on="' + (S.pay === v) + '"><input type="radio" name="pay" class="hb-radio__input" value="' + v + '"' + (S.pay === v ? ' checked' : '') + ' data-act="pay"><span class="hb-radio__circle"></span><span class="payopt__body"><b>' + label + '</b><span>' + text + '</span>' + (extra || '') + '</span></label>'; };
    var cards3 = '<div class="hb-card co"><div class="co__head"><h2 class="sec__title">' + s.delivery + '</h2><a class="link" href="#account">' + s.change + '</a></div><div class="addrline">' + ic('location') + '<div><b>' + esc(b.company) + ' · ' + esc(b.branch) + '</b><span>' + esc(b.address) + '</span><span class="ltr">' + esc(b.phone) + '</span></div></div></div>' +
      '<div class="hb-card co"><div class="co__head"><h2 class="sec__title">' + s.items + ' · ' + s.n(tt.count) + '</h2></div>' + Object.keys(groups).map(function (sid) { var sup = H.SBY[sid], open = !!S.coOpen[sid]; return '<div class="cogroup"><button type="button" class="cogroup__head" data-act="co-toggle" data-sid="' + sid + '" aria-expanded="' + open + '"><span class="hb-avatar" data-shape="square" data-size="32">' + sup.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</span><span class="cogroup__name"><b>' + esc(sup.name) + '</b><span>' + s.n(groups[sid].length) + ' · ' + esc(t('delivery')(sup.delivery)) + ' · ' + money(tt.bySupplier[sid]) + '</span></span><span>' + (open ? s.hideI : s.show) + '</span><span data-mirror>' + ic(open ? 'chevronUp' : 'chevronDown') + '</span></button>' + (open ? '<ul class="colist">' + groups[sid].map(function (it) { return '<li>' + ph(it.p.name, { cls: 'line__img' }) + '<span><b>' + esc(it.p.name) + '</b><span>' + it.qty + ' × ' + esc(it.p.pack) + '</span></span><span>' + money(it.net) + '</span></li>'; }).join('') + '</ul>' : '') + '</div>'; }).join('') + '</div>' +
      '<div class="hb-card co"><div class="co__head"><h2 class="sec__title">' + s.payment + '</h2></div><div class="payopts">' + radio('bank', s.bank, s.bankText) + radio('cod', s.cod, s.codText) + radio('later', s.later, s.laterText, noLater.length ? '<span class="payopt__warn">' + ic('alert') + esc(s.laterNo(noLater.join(', '))) + '</span>' : '') + '</div><div class="docs">' + ic(b.docs ? 'success' : 'upload') + (b.docs ? s.docs + ' ✓' : '<a href="#account">' + s.docsAdd + '</a>') + '</div></div>';
    var cta = '<div class="sticky-cta">' + btn(S.placing ? s.placing : s.place + ' · ' + t('cur') + ' ' + fmt(tt.total), { act: 'place', width: true, size: 'xl', extra: S.placing ? ' disabled aria-busy="true"' : '' }) + '</div>';
    return '<div class="wrap page">' + crumbs([[t('home'), '#home'], [t('ca').title, '#cart'], [s.title, '']]) + '<h1 class="title">' + s.title + '</h1><div class="cartgrid"><div class="cart__left">' + cards3 + '</div><div class="rail">' + summary(tt, { err: S.orderErr }) + cta + '</div></div></div>';
  };
  var placeOrder = function () {
    if (S.placing) return; S.placing = true; S.orderErr = false; render();
    setTimeout(function () {
      S.placing = false;
      if (S.fail) { S.orderErr = true; track('order_failed', { reason: 'simulated_server_error', total: totals().total }); render(); var r = app.querySelector('.sum .hb-alert'); if (r) r.scrollIntoView({ block: 'center' }); return; }
      var tt = totals(), id = 'HB-' + (48211 + S.orders.length + 1), payLater = S.pay === 'later';
      var o = { id: id, date: 'Today, ' + new Date().toLocaleTimeString(S.lang === 'ar' ? 'ar-BH' : 'en-GB', { hour: '2-digit', minute: '2-digit' }), items: tt.items.map(function (it) { return [it.p.id, it.qty]; }), total: tt.total, pay: S.pay, status: 0, deadline: payLater ? '6 Nov 2026' : '9 Oct 2026', coupon: S.coupon };
      S.orders.push(o); track('order_placed', { order: id, total: tt.total, items: tt.lines, payment: S.pay }); S.cart = {}; S.coupon = ''; S.couponDraft = ''; go('#order/' + id);
    }, 900);
  };

  /* ---------- order ---------- */
  var findOrder = function (id) { var o = S.orders.filter(function (x) { return x.id === id; })[0] || ORDERS_SEED.filter(function (x) { return x.id === id; })[0]; return o; };
  var pageOrder = function () {
    var s = t('or'), id = S.route.parts[0], o = findOrder(id); if (!o) return pageStub(s.title(id));
    var items = o.items.map(function (it) { var p = H.PBY[it[0]]; return { p: p, qty: it[1], net: linePrice(p, it[1]) * it[1] }; }), groups = {}; items.forEach(function (it) { (groups[it.p.sup] = groups[it.p.sup] || []).push(it); });
    var total = o.total || (items.reduce(function (a, it) { return a + it.net; }, 0) * 1.1 + 1.5);
    var steps = [s.placed, s.confirmed, s.out, s.delivered];
    return '<div class="wrap page">' + crumbs([[t('home'), '#home'], [s.title(o.id), '']]) + (o.status === 0 ? '<div class="hb-alert hb-inline-alert" data-status="success" role="status"><span class="hb-alert__icon">' + ic('success') + '</span><span class="hb-alert__body">' + s.thanks + '</span></div>' : '') + '<div class="sec__head"><h1 class="title">' + s.title(o.id) + ' <span class="note" style="margin:0">· ' + esc(o.date) + '</span></h1><span style="display:flex;gap:var(--hb-space-8)">' + btn(s.again, { act: 'order-again', icon: 'refresh', size: 'md', extra: ' data-oid="' + o.id + '" data-event="reorder_clicked"' }) + btn(s.invoice, { act: 'invoice', icon: 'download', size: 'md', style: 'outlined', intent: 'secondary', extra: ' data-oid="' + o.id + '"' }) + '</span></div>' +
      '<ol class="status">' + steps.map(function (st, i) { return '<li data-on="' + (i <= o.status) + '"><span class="status__dot">' + (i < o.status ? ic('check') : i + 1) + '</span><span>' + st + '</span></li>'; }).join('') + '</ol>' +
      '<div class="cartgrid"><div class="cart__left"><div class="hb-card co"><div class="co__head"><h2 class="sec__title">' + s.pay + '</h2></div><p><b>' + (o.pay === 'bank' ? s.payBank(o.deadline) : o.pay === 'cod' ? s.payCod : s.payLater(o.deadline)) + '</b></p>' + (o.pay === 'bank' ? '<div class="iban"><span><span class="eyebrow">' + s.iban + '</span><b class="ltr num">BH67 BBKU 0000 1234 5678 90</b></span><span><span class="eyebrow">' + s.ref + '</span><b class="ltr">' + o.id + '</b></span>' + btn(s.copy, { act: 'copy-iban', icon: 'copy', size: 'md', style: 'outlined', intent: 'secondary' }) + '</div>' : '') + '<p class="note">' + ic('notification') + ' ' + s.remind + '</p></div>' +
      '<div class="hb-card co"><div class="co__head"><h2 class="sec__title">' + s.items + '</h2></div>' + Object.keys(groups).map(function (sid) { var sup = H.SBY[sid]; return '<div class="cogroup"><div class="cogroup__head" style="cursor:default"><span class="hb-avatar" data-shape="square" data-size="32">' + sup.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</span><span class="cogroup__name"><b>' + esc(sup.name) + '</b><span>' + esc(s.by(sup.name)) + ' · ' + esc(t('delivery')(sup.delivery)) + '</span></span></div><ul class="colist">' + groups[sid].map(function (it) { return '<li>' + ph(it.p.name, { cls: 'line__img' }) + '<span><a href="#product/' + it.p.id + '"><b>' + esc(it.p.name) + '</b></a><span>' + it.qty + ' × ' + esc(it.p.pack) + '</span></span><span>' + money(it.net) + '</span></li>'; }).join('') + '</ul></div>'; }).join('') + '</div></div>' +
      '<div class="rail"><div class="hb-card sum"><h2 class="sec__title">' + t('ca').summary + '</h2><div class="sum__row sum__total"><span>' + s.total + '</span><span>' + money(total) + '</span></div></div></div></div></div>';
  };

  /* ---------- rewards ---------- */
  var pageRewards = function () {
    var s = t('rw'), tabs = ['active', 'reached', 'used', 'expired'], list = REWARDS.filter(function (r) { return r.state === S.rewardTab; });
    return '<div class="wrap page">' + crumbs([[t('home'), '#home'], [s.title, '']]) + '<h1 class="title">' + s.title + '</h1><div class="hb-tabs" role="tablist" style="margin-block:var(--hb-space-16)">' + tabs.map(function (k) { return '<button type="button" class="hb-tab" role="tab" aria-selected="' + (S.rewardTab === k) + '" data-act="rw-tab" data-v="' + k + '">' + s.tabs[k] + ' (' + REWARDS.filter(function (r) { return r.state === k; }).length + ')</button>'; }).join('') + '</div>' +
      (list.length ? '<div class="rewards">' + list.map(function (r) { var pct = Math.min(100, Math.round(r.now / r.goal * 100)); return '<div class="hb-card reward" data-state="' + r.state + '"><span class="ico">' + ic('gift') + '</span><div class="reward__body"><b>' + esc(r.name) + '</b><span>' + esc(r.get) + '</span><div class="bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + pct + '%"></span></div><span class="reward__meta">' + (r.state === 'reached' ? '<b class="fact">' + ic('check') + esc(s.reached(r.coupon)) + '</b>' : r.state === 'used' ? esc(s.used(r.order)) : r.state === 'expired' ? esc(s.expired(r.date)) : esc(r.kind === 'money' ? s.of(r.now, r.goal) : s.ofN(r.now, r.goal)) + ' · ' + pct + '%') + '</span></div>' + (r.state === 'reached' ? btn(s.useNow, { href: '#cart', size: 'md', act: 'use-coupon', extra: ' data-c="' + r.coupon + '"' }) : '') + '</div>'; }).join('') + '</div>' : '<div class="hb-empty"><span class="hb-empty__title">' + s.none + '</span></div>') + '</div>';
  };

  /* ---------- notifications ---------- */
  var pageNotifications = function () {
    var s = t('nt'), groups = NOTIFS(), hasOrder = true;
    return '<div class="wrap page">' + crumbs([[t('home'), '#home'], [s.title, '']]) + '<div class="sec__head"><h1 class="title">' + s.title + '</h1>' + btn(s.markAll, { act: 'read-all', size: 'md', style: 'ghost', intent: 'secondary', icon: 'check' }) + '</div><div class="cartgrid"><div class="cart__left">' + groups.map(function (g) { return '<div class="hb-card ngroup" data-read="' + S.readAll + '"><div class="co__head"><b>' + esc(t('or').title(g.order)) + '</b><a class="link" href="#order/' + g.order + '">' + s.viewOrder + '</a></div><ul class="nlist">' + g.events.map(function (e) { return '<li><span class="nlist__dot"></span><span><span>' + esc(e[1]) + '</span><small>' + esc(e[0]) + '</small></span></li>'; }).join('') + '</ul></div>'; }).join('') + '</div>' +
      '<div class="rail"><div class="hb-card co"><div class="co__head"><h2 class="sec__title">' + s.settings + '</h2></div>' + (hasOrder ? '<label class="hb-switch"><input type="checkbox" role="switch" class="hb-switch__input" data-act="notif-perm"' + (S.notifPerm ? ' checked' : '') + '><span class="hb-switch__track"></span><span class="hb-switch__label"><b>' + s.permTitle + '</b><br><span class="note" style="margin:0">' + s.permText + '</span></span></label>' + (S.notifPerm ? '<span class="fact" style="margin-block-start:var(--hb-space-12)">' + ic('check') + s.permOn + '</span>' : '') : '') + '</div></div></div></div>';
  };

  /* ---------- messages drawer ---------- */
  var msgDrawer = function () {
    if (!S.msgOpen) return ''; var s = t('ms'), th = S.thread ? THREADS.filter(function (x) { return x.sup === S.thread; })[0] : null;
    return '<div class="drawer drawer--end"><div class="drawer__scrim" data-act="msg-close"></div><div class="drawer__panel" role="dialog" aria-label="' + attr(s.title) + '"><div class="drawer__head">' + (th ? '<button type="button" class="link" data-act="msg-back">' + ic('arrowLeft', 'mirror') + ' ' + s.back + '</button>' : '<b>' + s.title + '</b>') + iconBtn('close', t('close'), { act: 'msg-close', size: 'lg' }) + '</div>' +
      (th ? '<div class="chat"><div class="chat__sup"><span class="hb-avatar" data-shape="square" data-size="40">' + H.SBY[th.sup].name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</span><b>' + esc(H.SBY[th.sup].name) + '</b></div><ul class="chat__msgs">' + th.msgs.map(function (m) { return '<li data-who="' + m[0] + '"><span>' + esc(m[1]) + '</span><small>' + esc(m[2]) + '</small></li>'; }).join('') + '</ul><form class="chat__form" data-act="chat-form"><input class="hb-field__input" placeholder="' + attr(s.typeMsg) + '" aria-label="' + attr(s.typeMsg) + '" data-sup="' + th.sup + '">' + btn(s.send, { type: 'submit', size: 'md', icon: 'arrowRight' }) + '</form></div>'
        : '<ul class="threads">' + THREADS.map(function (x) { var sup = H.SBY[x.sup]; return '<li><button type="button" class="thread" data-act="msg-open" data-sup="' + x.sup + '" data-unread="' + x.unread + '"><span class="hb-avatar" data-shape="square" data-size="40">' + sup.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</span><span class="thread__body"><b>' + esc(sup.name) + '</b><span>' + esc(x.last) + '</span></span><small>' + esc(x.at) + '</small></button></li>'; }).join('') + '</ul>') + '</div></div>';
  };

  /* ---------- account (minimal, reached from the header chip) ---------- */
  var pageAccount = function () { var b = H.BUYER; return '<div class="wrap page">' + crumbs([[t('home'), '#home'], [t('accountTitle'), '']]) + '<h1 class="title">' + t('accountTitle') + '</h1><div class="cartgrid"><div class="cart__left"><div class="hb-card co"><div class="addrline">' + ic('location') + '<div><b>' + esc(b.company) + ' · ' + esc(b.branch) + '</b><span>' + esc(b.address) + '</span><span class="ltr">' + esc(b.phone) + '</span><span class="ltr">' + esc(b.email) + '</span></div></div><div class="docs">' + ic('success') + t('co').docs + ' ✓</div></div></div></div></div>'; };

  var chatFab = function () { return S.route.name === 'landing' ? '' : '<button type="button" class="chat-fab" data-act="msg-toggle" aria-label="' + attr(t('chat')) + '">' + ic('message') + '<span>' + t('chat') + '</span></button>'; };

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
    if (S.route.name === 'messages') { S.msgOpen = true; if (S.route.q.thread) S.thread = S.route.q.thread; }
    if (S.route.name === 'checkout' && !S.coTracked) { S.coTracked = true; track('checkout_started', { total: totals().total, items: totals().lines }); } if (S.route.name !== 'checkout') S.coTracked = false;
    app.innerHTML = header() + '<main id="main">' + page() + '</main>' + footer() + drawer() + msgDrawer() + sheet() + chatFab();
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
      case 'become-buyer': S.user = 'buyer'; persist(); break;
      case 'su-next': e.preventDefault(); suNext(); break;
      case 'su-back': S.signup.step = Math.max(1, S.signup.step - 1); render(); break;
      case 'su-resend': toast(t('su').codeHelp('+973 ' + S.signup.phone), 'info'); break;
      case 'si-show': S.signin.show = !S.signin.show; render(); $('pw') && $('pw').focus(); break;
      case 'si-mode': S.signin.mode = el.getAttribute('data-v'); S.signin.err = null; render(); break;
      case 'si-reset': S.signin.reset = true; S.signin.resetSent = false; render(); break;
      case 'si-reset-back': S.signin.reset = false; render(); break;
      case 'si-reset-send': S.signin.resetSent = true; render(); break;
      case 'si-code-send': S.signin.loading = true; render(); setTimeout(function () { S.signin.loading = false; S.signup.step = 2; S.signup.phone = S.signin.phone || '3312 4455'; go('#signup'); }, 700); break;
      case 'si-submit': e.preventDefault(); siSubmit(); break;
      case 'az': e.preventDefault(); var tgt = app.querySelector('#az-' + encodeURIComponent(el.getAttribute('data-l'))); if (tgt) tgt.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
      case 'pdp-tab': S.pdpTab = el.getAttribute('data-v'); render(); break;
      case 'pdp-inc': S.pdpQty = Math.max(S.pdpQty, H.PBY[S.route.parts[0]].moq) + 1; render(); break;
      case 'pdp-dec': S.pdpQty = Math.max(H.PBY[S.route.parts[0]].moq, S.pdpQty - 1); render(); break;
      case 'pdp-add': setQty(id, (S.cart[id] || 0) + Math.max(S.pdpQty, H.PBY[id].moq), 'pdp'); render(); break;
      case 'match': track('match_price_opened', { product: id }); S.matchOpen = true; render(); break;
      case 'remove': setQty(id, 0); render(); break;
      case 'co-toggle': var sid = el.getAttribute('data-sid'); S.coOpen[sid] = !S.coOpen[sid]; render(); break;
      case 'place': placeOrder(); break;
      case 'order-again': var oo = findOrder(el.getAttribute('data-oid')); oo.items.forEach(function (it) { S.cart[it[0]] = (S.cart[it[0]] || 0) + it[1]; }); track('reorder_clicked', { order: oo.id, items: oo.items.length }); toast(t('addedN')(oo.items.length), 'success', { label: t('viewCart'), href: '#cart' }); render(); break;
      case 'invoice': toast(t('or').downloading('invoice-' + el.getAttribute('data-oid') + '.pdf'), 'info'); break;
      case 'copy-iban': try { navigator.clipboard.writeText('BH67BBKU000012345678 90'.replace(' ', '')); } catch (x) {} toast(t('or').copied, 'success'); break;
      case 'rw-tab': S.rewardTab = el.getAttribute('data-v'); render(); break;
      case 'use-coupon': S.coupon = el.getAttribute('data-c'); S.couponDraft = S.coupon; break;
      case 'read-all': S.readAll = true; render(); break;
      case 'msg-toggle': S.msgOpen = !S.msgOpen; S.thread = null; render(); break;
      case 'msg-close': S.msgOpen = false; S.thread = null; if (S.route.name === 'messages') { go('#home'); } else render(); break;
      case 'msg-open': S.thread = el.getAttribute('data-sup'); THREADS.forEach(function (x) { if (x.sup === S.thread) x.unread = false; }); render(); break;
      case 'msg-back': S.thread = null; render(); break;
      case 'f-remove': var k = el.getAttribute('data-k'), v = el.getAttribute('data-v'); if (k === 'price') { S.f.min = ''; S.f.max = ''; } else if (k === 'mine' || k === 'ordered') S.f[k] = false; else S.f[k] = S.f[k].filter(function (x) { return x !== v; }); track('filter_applied', { filter: k, removed: v || true }); render(); break;
    }
  });
  app.addEventListener('change', function (e) {
    var el = e.target, a = el.getAttribute('data-act'); if (!a) return;
    if (a === 'f-check') { var k = el.getAttribute('data-f'); if (el.checked) S.f[k].push(el.value); else S.f[k] = S.f[k].filter(function (x) { return x !== el.value; }); track('filter_applied', { filter: k, value: el.value, on: el.checked }); render(); }
    if (a === 'f-switch') { S.f[el.getAttribute('data-f')] = el.checked; track('filter_applied', { filter: el.getAttribute('data-f'), on: el.checked }); render(); }
    if (a === 'qty') { setQty(el.getAttribute('data-id'), +el.value); if (S.route.name === 'cart') render(); }
    if (a === 'pay') { S.pay = el.value; render(); }
    if (a === 'notif-perm') { S.notifPerm = el.checked; if (el.checked && window.Notification && Notification.requestPermission) { try { Notification.requestPermission(); } catch (x) {} } render(); }
  });
  var priceTimer = null;
  app.addEventListener('input', function (e) {
    var el = e.target, a = el.getAttribute('data-act');
    if (el.id === 'q') { S.search.q = el.value; S.search.open = true; var f = el.closest('form'); var old = f.querySelector('.sdrop'); var tmp = document.createElement('div'); tmp.innerHTML = searchDrop(); if (old) old.replaceWith(tmp.firstChild); else f.appendChild(tmp.firstChild); var clr = f.querySelector('.hb-search__clear'); f.querySelector('.hb-search').setAttribute('data-state', el.value ? 'typing' : 'default'); if (el.value && !clr) f.querySelector('.hb-search').insertAdjacentHTML('beforeend', '<button type="button" class="hb-search__clear" data-act="search-clear" aria-label="' + attr(t('clear')) + '">' + ic('clear') + '</button>'); if (!el.value && clr) clr.remove(); return; }
    if (a === 'f-price') { S.f[el.getAttribute('data-f')] = el.value; clearTimeout(priceTimer); priceTimer = setTimeout(function () { var k = el.getAttribute('data-f'), v = el.value; track('filter_applied', { filter: 'price', bound: k, value: v }); render(); var n = app.querySelector('[data-act="f-price"][data-f="' + k + '"]'); if (n) { n.focus(); n.value = v; } }, 500); }
    if (a === 'su-input') { var k = el.getAttribute('data-f'); S.signup[k] = el.value; S.signup.touched[k] = true; var fld = el.closest('.hb-field'), err = suErr(k); fld.setAttribute('data-state', err ? 'error' : el.value ? 'typing' : 'default'); var m = fld.querySelector('.hb-field__msg'); var help = k === 'phone' ? t('su').phoneHelp : k === 'code' ? t('su').codeHelp('+973 ' + S.signup.phone) : k === 'branch' ? t('su').branchHelp : ''; var html = err ? ic('error', 'hb-field__msg-icon') + esc(err) : esc(help); if (m) { m.innerHTML = html; m.setAttribute('role', err ? 'alert' : ''); } else if (html) fld.insertAdjacentHTML('beforeend', '<span class="hb-field__msg"' + (err ? ' role="alert"' : '') + '>' + html + '</span>'); return; }
    if (a === 'si-input') { var kk = el.getAttribute('data-f'); if (kk === 'siphone') S.signin.phone = el.value; else S.signin[kk] = el.value; if (S.signin.err) { S.signin.err = null; render(); var n2 = $(kk); if (n2) { n2.focus(); } } return; }
    if (a === 'coupon-input') { S.couponDraft = el.value.toUpperCase(); S.couponErr = false; return; }
    if (a === 'brand-q') { S.brandQ2 = el.value; if (S.route.q.q) { S.route.q = {}; } var m2 = app.querySelector('main'); var tmp3 = document.createElement('div'); tmp3.innerHTML = pageBrands(); m2.innerHTML = tmp3.innerHTML; var inp = app.querySelector('[data-act="brand-q"]'); if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } return; }
    if (a === 'f-brandq') { S.brandQ = el.value; var list = el.closest('.fgroup').querySelector('.flist'); var tmp2 = document.createElement('div'); tmp2.innerHTML = filterPanel(false); list.innerHTML = tmp2.querySelector('.flist').innerHTML; }
  });
  app.addEventListener('focusin', function (e) { if (e.target.id === 'q' && !S.search.open) { S.search.open = true; render(); var q = $('q'); if (q) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (x) {} } } });
  app.addEventListener('submit', function (e) {
    var f = e.target.closest('form[data-act]'); if (!f) return; e.preventDefault(); var a = f.getAttribute('data-act');
    if (a === 'search-submit') submitSearch($('q').value);
    else if (a === 'su-form') suNext();
    else if (a === 'si-form') { if (S.signin.reset) { S.signin.resetSent = true; render(); } else if (S.signin.mode === 'code') { S.signin.loading = true; render(); setTimeout(function () { S.signin.loading = false; S.signup.step = 2; S.signup.phone = S.signin.phone || '3312 4455'; go('#signup'); }, 700); } else siSubmit(); }
    else if (a === 'coupon-form') { var c = (S.couponDraft || '').toUpperCase().trim(); if (COUPONS[c]) { S.coupon = c; S.couponErr = false; track('filter_applied', { filter: 'coupon', value: c }); } else { S.coupon = ''; S.couponErr = !!c; } render(); }
    else if (a === 'match-form') { S.matchOpen = false; toast(t('pd').matchSent + ' ' + H.SBY[H.PBY[S.route.parts[0]].sup].name, 'success'); render(); }
    else if (a === 'chat-form') { var inp = f.querySelector('input'), th = THREADS.filter(function (x) { return x.sup === inp.getAttribute('data-sup'); })[0]; if (inp.value.trim()) { th.msgs.push(['me', inp.value.trim(), S.lang === 'ar' ? 'الآن' : 'now']); th.last = inp.value.trim(); render(); } }
  });
  var suNext = function () { var u = S.signup, keys = u.step === 1 ? ['phone'] : u.step === 2 ? ['code'] : ['name', 'branch']; keys.forEach(function (k) { u.touched[k] = true; }); var bad = keys.filter(function (k) { return suErr(k); }); if (bad.length) { render(); var n = $(bad[0]); if (n) n.focus(); return; } if (u.step === 3) { H.BUYER.company = u.name.trim(); H.BUYER.branch = u.branch.trim(); H.BUYER.docs = false; S.user = 'buyer'; persist(); } u.step += 1; render(); var nx = app.querySelector('.auth__form input'); if (nx) nx.focus(); };
  var siSubmit = function () { var i = S.signin; if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.email)) { i.err = 'email'; render(); $('email').focus(); return; } if (!i.pw) { i.err = 'blank'; render(); $('pw').focus(); return; } i.loading = true; i.err = null; render(); setTimeout(function () { i.loading = false; if (i.pw === 'wrong') { i.err = 'pw'; render(); $('pw').focus(); } else { S.user = 'buyer'; persist(); go('#home'); } }, 900); };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && (S.mega.open || S.search.open || S.sortOpen || S.sheet || S.drawer)) { closeOverlays(); S.sheet = null; S.drawer = false; render(); } });
  app.addEventListener('mouseover', function (e) { var el = e.target.closest('[data-slug-hover]'); if (!el || !S.mega.open) return; var lvl = +el.getAttribute('data-lvl-hover'), slug = el.getAttribute('data-slug-hover'); if (lvl === 0 && S.mega.l0 !== slug) { S.mega.l0 = slug; S.mega.l1 = H.BY[slug].kids[0].slug; render(); } else if (lvl === 1 && S.mega.l1 !== slug) { S.mega.l1 = slug; render(); } });
  var submitSearch = function (q) { q = (q || '').trim(); if (!q) return; S.recent = [q].concat(S.recent.filter(function (r) { return r !== q; })).slice(0, 5); S.search.q = q; S.search.open = false; track('search_submitted', { query: q }); go('#search?q=' + encodeURIComponent(q)); };

  /* never prompt the browser for push permission (rule 1): nothing here calls Notification.requestPermission */
  if (!location.hash) location.hash = '#home';
  S.loading = true; render(); setTimeout(function () { S.loading = false; render(); }, 350);
})();
