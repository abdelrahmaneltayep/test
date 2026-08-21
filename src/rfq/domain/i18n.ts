/**
 * Localisation — PRD §4.11 FR-11.1 … FR-11.3.
 *
 * Every user-facing string in all three surfaces lives here in both languages, including
 * validation messages, empty states and history entries. History is stored as a structured
 * event plus parameters and localised at render time; a pre-rendered localised string is
 * never persisted (FR-11.3 / AC-13.4).
 */

import type { HistoryEvent } from './types'

export type Lang = 'en' | 'ar'

type Dict = Record<string, { en: string; ar: string }>

export const STRINGS: Dict = {
  // ── Application chrome (matched to the live product) ──────────────────────
  navCategories: { en: 'Categories', ar: 'الفئات' },
  navBrands: { en: 'Brands', ar: 'العلامات التجارية' },
  navSearch: { en: 'Search by name, category or brand', ar: 'ابحث بالاسم أو الفئة أو العلامة' },
  navRewards: { en: 'My rewards', ar: 'مكافآتي' },
  navCart: { en: 'Cart', ar: 'السلة' },
  navMessages: { en: 'Messages', ar: 'الرسائل' },
  navAlerts: { en: 'Notifications', ar: 'التنبيهات' },
  navDashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
  navOverview: { en: 'Overview', ar: 'نظرة عامة' },
  navComms: { en: 'Communication & Networking', ar: 'التواصل والعلاقات' },
  navPurchasing: { en: 'Purchasing', ar: 'المشتريات' },
  navSelling: { en: 'Selling', ar: 'المبيعات' },
  navMessagesCenter: { en: 'Messages & Quotes Center', ar: 'مركز الرسائل والعروض' },
  navVendorList: { en: 'Vendor List', ar: 'قائمة الموردين' },
  navBuyerList: { en: 'Buyer List', ar: 'قائمة المشترين' },
  navPurchaseOrders: { en: 'Purchase Orders', ar: 'أوامر الشراء' },
  navRfqs: { en: 'RFQs', ar: 'طلبات التسعير' },
  navQuotations: { en: 'Quotations', ar: 'عروض الأسعار' },
  navSpecialPrice: { en: 'Special Price Requests', ar: 'طلبات الأسعار الخاصة' },
  navPriceLists: { en: 'Customer Price Lists', ar: 'قوائم أسعار العملاء' },
  branchLabel: { en: 'Branch: FreshMart Convenience', ar: 'الفرع: فريش مارت' },
  roleSalesRep: { en: 'Sales Representative', ar: 'مندوب مبيعات' },
  wholesale: { en: 'Wholesale', ar: 'جملة' },
  addToCart: { en: 'Add to Cart', ar: 'أضف إلى السلة' },
  viewDetails: { en: 'View details', ar: 'عرض التفاصيل' },
  backToMarketplace: { en: 'Back to marketplace', ar: 'العودة إلى السوق' },
  inclusiveVat: { en: 'Inclusive of VAT', ar: 'شامل الضريبة' },
  brandLabel: { en: 'Brand', ar: 'العلامة التجارية' },
  categoryLabel: { en: 'Category', ar: 'الفئة' },
  packageLabel: { en: 'Package', ar: 'التغليف' },
  deliveryEta: { en: 'Delivery ETA', ar: 'وقت التوصيل' },
  deliveryEtaValue: { en: 'Within 3 hours (working days)', ar: 'خلال ٣ ساعات (أيام العمل)' },
  supplierPolicies: { en: 'Supplier Policies', ar: 'سياسات المورّد' },
  expiryPolicy: { en: 'Expiry Policy / Shelf Life', ar: 'سياسة الصلاحية' },
  unitsRange: { en: '{min}+ units', ar: '{min}+ وحدة' },
  priceAtVolume: { en: 'Price at this volume', ar: 'السعر عند هذه الكمية' },
  buyerSubtitle: { en: 'Prices you have asked suppliers to improve', ar: 'الأسعار التي طلبت من المورّدين تحسينها' },
  sellerSubtitle: { en: 'Requests buyers have sent you, newest deadline first', ar: 'طلبات المشترين مرتبة حسب أقرب مهلة' },
  marketplaceSubtitle: { en: 'Wholesale catalogue from your linked suppliers', ar: 'كتالوج الجملة من مورّديك المرتبطين' },

  // ── Marketplace entry point (US-1) ────────────────────────────────────────
  requestSpecialPrice: { en: 'Request special price', ar: 'اطلب سعراً خاصاً' },
  requestMyPrice: { en: 'Request my price', ar: 'اطلب سعري الخاص' },
  viewMyRequest: { en: 'View my request', ar: 'عرض طلبي' },
  volumeTiers: { en: 'Volume pricing', ar: 'أسعار الكميات' },
  perUnit: { en: 'per unit', ar: 'للوحدة' },
  linkRequired: { en: 'You are not linked to this supplier yet — we will request the link first.', ar: 'لست مرتبطاً بهذا المورّد بعد — سنطلب الارتباط أولاً.' },

  // ── Step 1, quantity (US-2) ───────────────────────────────────────────────
  quantityLabel: { en: 'Quantity (cases)', ar: 'الكمية (كراتين)' },
  equalsUnits: { en: 'equals {units} {uom}', ar: 'تعادل {units} {uom}' },
  tierAvailableTitle: { en: 'A published price already covers this quantity', ar: 'يوجد سعر معلن يغطي هذه الكمية بالفعل' },
  tierAvailableBody: { en: 'At {qty} cases the price is {price} per unit — better than the {list} you are seeing.', ar: 'عند {qty} كرتون يكون السعر {price} للوحدة — أفضل من {list} المعروض لك.' },
  useThisPrice: { en: 'Use this price', ar: 'استخدم هذا السعر' },
  continue: { en: 'Continue', ar: 'متابعة' },
  back: { en: 'Back', ar: 'رجوع' },

  // ── Step 2, route (US-3) ──────────────────────────────────────────────────
  routeStepTitle: { en: 'What would you like to ask for?', ar: 'ما الذي تريد طلبه؟' },
  case1Title: { en: 'I have a price to match', ar: 'لديّ سعر أريد مطابقته' },
  case1Body: { en: 'State your target price and attach the invoice or quote that shows it.', ar: 'حدّد السعر المستهدف وأرفق الفاتورة أو عرض السعر الذي يثبته.' },
  case2Title: { en: 'Ask the seller to quote', ar: 'اطلب من البائع تسعير الكمية' },
  case2Body: { en: 'No competing price needed — the supplier prices your volume.', ar: 'لا حاجة لسعر منافس — يقوم المورّد بتسعير كميتك.' },

  // ── Step 3a, Case 1 (US-4) ────────────────────────────────────────────────
  targetPrice: { en: 'Your target price per unit', ar: 'السعر المستهدف للوحدة' },
  competitorName: { en: 'Supplier offering that price', ar: 'المورّد صاحب هذا السعر' },
  competitorSku: { en: 'Their SKU or reference (optional)', ar: 'رقم الصنف لديهم (اختياري)' },
  documentDate: { en: 'Document date (optional)', ar: 'تاريخ المستند (اختياري)' },
  documentDateHint: { en: 'We read this from the document — set it only if we got it wrong.', ar: 'نقرأ التاريخ من المستند — حدّده فقط إذا كانت القراءة خاطئة.' },
  uploadProof: { en: 'Attach the invoice, quote or screenshot', ar: 'أرفق الفاتورة أو عرض السعر أو لقطة الشاشة' },
  uploadHint: { en: 'PDF, JPG, PNG, WEBP or HEIC · up to 10 MB · camera or gallery', ar: 'PDF أو JPG أو PNG أو WEBP أو HEIC · حتى ١٠ ميجابايت · من الكاميرا أو المعرض' },
  extractedConfirm: { en: 'extracted — please confirm', ar: 'مستخرج — يرجى التأكيد' },
  extractionConflict: { en: 'You typed {typed}; the document reads {extracted}. Which is correct?', ar: 'أدخلت {typed}؛ والمستند يقرأ {extracted}. أيهما الصحيح؟' },
  keepTyped: { en: 'Keep what I typed', ar: 'اعتمد ما أدخلته' },
  useExtracted: { en: 'Use the document value', ar: 'اعتمد قيمة المستند' },
  whatWeCannotMatch: { en: 'What we cannot match', ar: 'ما لا يمكننا مطابقته' },

  // ── Step 3b, Case 2 (US-5) ────────────────────────────────────────────────
  frequency: { en: 'How often will you order this?', ar: 'كم مرة ستطلب هذا الصنف؟' },
  freqOneOff: { en: 'One-off', ar: 'مرة واحدة' },
  freqWeekly: { en: 'Weekly', ar: 'أسبوعياً' },
  freqFortnightly: { en: 'Fortnightly', ar: 'كل أسبوعين' },
  freqMonthly: { en: 'Monthly', ar: 'شهرياً' },
  noteToSeller: { en: 'Note to the supplier (optional)', ar: 'ملاحظة للمورّد (اختياري)' },

  // ── Step 4, review (US-6, US-7) ───────────────────────────────────────────
  itemsInRequest: { en: '{n} items in this request', ar: '{n} أصناف في هذا الطلب' },
  itemInRequest: { en: '1 item in this request', ar: 'صنف واحد في هذا الطلب' },
  product: { en: 'Product', ar: 'الصنف' },
  quantity: { en: 'Quantity', ar: 'الكمية' },
  listPrice: { en: 'List price', ar: 'السعر المعلن' },
  askedPrice: { en: 'You asked', ar: 'ما طلبته' },
  quoteRequested: { en: 'Quote requested', ar: 'بانتظار التسعير' },
  lineTotalAtList: { en: 'At list', ar: 'بالسعر المعلن' },
  lineTotalAtAsked: { en: 'At your price', ar: 'بسعرك' },
  requestTotal: { en: 'Request total', ar: 'إجمالي الطلب' },
  estimatedSaving: { en: 'Estimated saving', ar: 'التوفير التقديري' },
  excludesQuoteLines: { en: 'excludes lines awaiting a quote', ar: 'لا يشمل الأصناف بانتظار التسعير' },
  sendRequest: { en: 'Send request', ar: 'إرسال الطلب' },
  removeLine: { en: 'Remove', ar: 'حذف' },
  editLine: { en: 'Edit', ar: 'تعديل' },
  completeFormFirst: { en: 'Complete the highlighted fields to send.', ar: 'أكمل الحقول المحددة للإرسال.' },
  submittedTitle: { en: 'Request sent', ar: 'تم إرسال الطلب' },
  slaPromise: { en: 'Most suppliers reply within 24 hours.', ar: 'يرد معظم المورّدين خلال ٢٤ ساعة.' },
  goToMyRequests: { en: 'Go to my requests', ar: 'الذهاب إلى طلباتي' },
  yourReference: { en: 'Your reference', ar: 'رقم طلبك' },

  // ── Buyer dashboard (US-8 … US-13) ────────────────────────────────────────
  myRequests: { en: 'My requests', ar: 'طلباتي' },
  reference: { en: 'Reference', ar: 'الرقم' },
  supplier: { en: 'Supplier', ar: 'المورّد' },
  lines: { en: 'Items', ar: 'الأصناف' },
  submittedOn: { en: 'Submitted', ar: 'تاريخ الإرسال' },
  status: { en: 'Status', ar: 'الحالة' },
  timeRemaining: { en: 'Time remaining', ar: 'الوقت المتبقي' },
  totalAsked: { en: 'Total asked', ar: 'إجمالي المطلوب' },
  allStatuses: { en: 'All statuses', ar: 'كل الحالات' },
  searchPlaceholder: { en: 'Search by reference or product', ar: 'ابحث برقم الطلب أو اسم الصنف' },
  emptyListTitle: { en: 'No requests yet', ar: 'لا توجد طلبات بعد' },
  emptyListBody: { en: 'A request lets you ask a supplier for a better price on one or more products, and track their answer here.', ar: 'يتيح لك الطلب أن تسأل المورّد سعراً أفضل لصنف أو أكثر، وتتابع رده هنا.' },
  browseMarketplace: { en: 'Browse the marketplace', ar: 'تصفح السوق' },
  original: { en: 'Original', ar: 'السعر الأصلي' },
  sellerOffers: { en: 'Seller offers', ar: 'عرض البائع' },
  outcome: { en: 'Outcome', ar: 'النتيجة' },
  accept: { en: 'Accept', ar: 'قبول' },
  counter: { en: 'Counter', ar: 'عرض مقابل' },
  decline: { en: 'Decline', ar: 'رفض' },
  withdraw: { en: 'Withdraw request', ar: 'سحب الطلب' },
  reRequest: { en: 'Re-request', ar: 'إعادة الطلب' },
  offerExpiresIn: { en: 'Offer expires in', ar: 'ينتهي العرض خلال' },
  offerExpiredOn: { en: 'This offer expired on {date}', ar: 'انتهت صلاحية هذا العرض في {date}' },
  roundCapReached: { en: 'Maximum {n} rounds reached.', ar: 'تم الوصول للحد الأقصى {n} جولات.' },
  matched: { en: 'Matched your price', ar: 'طابق سعرك' },
  beaten: { en: 'Beat your price', ar: 'تجاوز سعرك' },
  declinedOutcome: { en: 'Declined', ar: 'مرفوض' },
  counteredOutcome: { en: 'Counter-offered', ar: 'عرض مقابل' },
  pendingOutcome: { en: 'Awaiting response', ar: 'بانتظار الرد' },
  comments: { en: 'Comments', ar: 'التعليقات' },
  history: { en: 'History', ar: 'السجل' },
  actionNeededBanner: { en: 'The supplier needs more information before they can price this.', ar: 'يحتاج المورّد معلومات إضافية قبل التسعير.' },
  replaceFile: { en: 'Replace the file', ar: 'استبدال الملف' },
  resubmit: { en: 'Resubmit', ar: 'إعادة الإرسال' },
  confirmDeclineTitle: { en: 'Decline this offer?', ar: 'رفض هذا العرض؟' },
  confirmDeclineBody: { en: 'The negotiation ends. These items stay available to order at list price.', ar: 'تنتهي المفاوضة. وتبقى هذه الأصناف متاحة للطلب بالسعر المعلن.' },
  stillPurchasable: { en: 'These items remain available at list price.', ar: 'تبقى هذه الأصناف متاحة بالسعر المعلن.' },
  cancel: { en: 'Cancel', ar: 'إلغاء' },

  // ── Seller dashboard (US-14 … US-19) ──────────────────────────────────────
  sellerQueue: { en: 'Price requests', ar: 'طلبات الأسعار' },
  tabSpecialPrice: { en: 'Special price', ar: 'سعر خاص' },
  tabRfq: { en: 'RFQ', ar: 'طلب تسعير' },
  tabSent: { en: 'Sent', ar: 'المُرسل' },
  buyer: { en: 'Buyer', ar: 'المشتري' },
  askedVsList: { en: 'Asked vs list', ar: 'المطلوب مقابل المعلن' },
  marginAfterAsk: { en: 'Margin after the ask', ar: 'الهامش بعد الطلب' },
  proof: { en: 'Proof', ar: 'الإثبات' },
  slaRemaining: { en: 'SLA left', ar: 'المتبقي من المهلة' },
  roundsUsed: { en: 'Rounds', ar: 'الجولات' },
  costNotConfigured: { en: 'Cost is not configured for one or more items, so margin cannot be shown.', ar: 'التكلفة غير مُعدّة لصنف أو أكثر، لذا لا يمكن عرض الهامش.' },
  quoteOnlyLines: { en: '{n} line(s) awaiting a quote', ar: '{n} صنف بانتظار التسعير' },
  bandHealthy: { en: 'Healthy', ar: 'جيد' },
  bandThin: { en: 'Thin', ar: 'ضعيف' },
  bandBelowFloor: { en: 'Below floor', ar: 'تحت الحد الأدنى' },
  counterPrice: { en: 'Counter price', ar: 'السعر المقابل' },
  percentOffList: { en: '% off list', ar: '٪ خصم من المعلن' },
  lineMargin: { en: 'Line margin', ar: 'هامش الصنف' },
  requestMargin: { en: 'Request margin', ar: 'هامش الطلب' },
  sendResponse: { en: 'Send response', ar: 'إرسال الرد' },
  unresolvedLines: { en: 'Resolve every line before sending. Unresolved: {skus}', ar: 'يجب حسم كل الأصناف قبل الإرسال. غير محسوم: {skus}' },
  floorBlocked: { en: 'This price is below the floor of {floor} for {sku}.', ar: 'هذا السعر أقل من الحد الأدنى {floor} للصنف {sku}.' },
  floorOverride: { en: 'Override the floor', ar: 'تجاوز الحد الأدنى' },
  floorOverrideReason: { en: 'Reason for the override (required, recorded)', ar: 'سبب التجاوز (إلزامي، ويُسجَّل)' },
  offerValidFor: { en: 'Offer valid for', ar: 'صلاحية العرض' },
  days: { en: 'days', ar: 'يوم' },
  requestMoreInfo: { en: 'Request more info', ar: 'طلب معلومات إضافية' },
  infoReasonLabel: { en: 'Why are you sending it back?', ar: 'لماذا تُعيد الطلب؟' },
  reasonIllegible: { en: 'Illegible', ar: 'غير مقروء' },
  reasonExpired: { en: 'Expired document', ar: 'مستند منتهي' },
  reasonSkuMismatch: { en: 'SKU mismatch', ar: 'الصنف غير مطابق' },
  reasonWrongSupplier: { en: 'Wrong supplier', ar: 'مورّد غير صحيح' },
  reasonIncomplete: { en: 'Incomplete document', ar: 'مستند غير مكتمل' },
  reasonOther: { en: 'Other', ar: 'أخرى' },
  infoRequestsExhausted: { en: 'You have used both information requests on this one. A decision is required now.', ar: 'استخدمت طلبَي المعلومات على هذا الطلب. المطلوب الآن قرار.' },
  sameAsLastTime: { en: 'Same as last time ({price})', ar: 'مثل المرة السابقة ({price})' },
  thisOrderOnly: { en: 'This order only', ar: 'هذا الطلب فقط' },
  saveAsTemplate: { en: 'Save as template', ar: 'حفظ كقالب سعر' },
  validFrom: { en: 'Valid from', ar: 'ساري من' },
  validUntil: { en: 'Valid until', ar: 'ساري حتى' },
  minQty: { en: 'Minimum quantity', ar: 'أقل كمية' },
  maxQty: { en: 'Maximum quantity', ar: 'أقصى كمية' },
  templateConflict: { en: 'A price already exists for this buyer and product. Replace it or supersede it — it will not be overwritten silently.', ar: 'يوجد سعر محفوظ لهذا المشتري وهذا الصنف. استبدله أو اجعله بديلاً — لن يُستبدل تلقائياً.' },
  replaceEntry: { en: 'Replace', ar: 'استبدال' },
  supersedeEntry: { en: 'Supersede', ar: 'إحلال' },
  proofFreshness: { en: 'Freshness', ar: 'حداثة المستند' },
  proofIdentity: { en: 'Product identity', ar: 'مطابقة الصنف' },
  proofDuplicate: { en: 'Duplicate', ar: 'التكرار' },
  buyerTyped: { en: 'Buyer typed', ar: 'ما أدخله المشتري' },
  documentSays: { en: 'Document says', ar: 'ما يقوله المستند' },
  checksNotRun: { en: 'Checks could not run — review the document manually.', ar: 'تعذّر تشغيل الفحوص — راجع المستند يدوياً.' },
  duplicateSeenBefore: { en: 'This document was submitted before, on {date}.', ar: 'سبق تقديم هذا المستند بتاريخ {date}.' },

  // ── Row actions on the buyer's request list (US-8) ────────────────────────
  actionsColumn: { en: 'Actions', ar: 'الإجراءات' },
  reviewOffer: { en: 'Review offer', ar: 'مراجعة العرض' },
  addInformation: { en: 'Add information', ar: 'إضافة المعلومات' },
  cancelRequest: { en: 'Cancel', ar: 'إلغاء' },
  requestAgain: { en: 'Request again', ar: 'اطلب مرة أخرى' },
  noActionYet: { en: 'Waiting on the supplier', ar: 'بانتظار المورّد' },

  // ── Row actions on the seller's queue (US-14) ─────────────────────────────
  viewRequest: { en: 'View', ar: 'عرض' },
  acceptDisabledQuoteOnly: { en: 'This request has no asked price to accept — open it and quote a price.', ar: 'لا يوجد سعر مطلوب لقبوله — افتح الطلب وقدّم سعراً.' },
  confirmSellerAcceptTitle: { en: 'Accept this price?', ar: 'قبول هذا السعر؟' },
  confirmSellerAcceptBody: { en: 'You accept the buyer\u2019s asked price for this order. It applies once and is not saved to their price list.', ar: 'أنت تقبل السعر الذي طلبه المشتري لهذا الطلب. ينطبق مرة واحدة ولا يُحفظ في قائمة أسعاره.' },
  confirmSellerDeclineTitle: { en: 'Decline this request?', ar: 'رفض هذا الطلب؟' },
  confirmSellerDeclineBody: { en: 'Every item resolves at its list price and the negotiation ends. The buyer can still order at that price, and can send a new request.', ar: 'تُحسم كل الأصناف بسعرها المعلن وتنتهي المفاوضة. ويظل بإمكان المشتري الطلب بهذا السعر وإرسال طلب جديد.' },
  belowFloorWarning: { en: 'The asked price is below your floor on {sku}. Open the request to override it with a reason.', ar: 'السعر المطلوب أقل من حدك الأدنى في {sku}. افتح الطلب لتجاوزه مع ذكر السبب.' },

  // ── Inbox — Feature Flow Draft §8 ─────────────────────────────────────────
  navInbox: { en: 'Inbox', ar: 'صندوق الوارد' },
  // §8 names the three categories; the Inbox uses those names rather than the shorter
  // queue labels, because "Sent" only reads correctly beside the other two in full.
  inboxTabSpecial: { en: 'Special Price Request', ar: 'طلب سعر خاص' },
  inboxTabRfq: { en: 'RFQ', ar: 'طلب تسعير' },
  inboxTabSent: { en: 'Sent', ar: 'المُرسل' },
  inboxTitle: { en: 'Inbox', ar: 'صندوق الوارد' },
  inboxSubtitleBuyer: { en: 'Every move your suppliers have made on your requests', ar: 'كل ما فعله مورّدوك على طلباتك' },
  inboxSubtitleSeller: { en: 'Every move your buyers have made on their requests', ar: 'كل ما فعله مشتروك على طلباتهم' },
  inboxEmptyTitle: { en: 'Nothing in this category', ar: 'لا شيء في هذه الفئة' },
  inboxEmptyBody: { en: 'Actions taken on your requests land here as they happen.', ar: 'تظهر هنا الإجراءات على طلباتك فور حدوثها.' },
  inboxUnread: { en: 'Needs you', ar: 'يحتاج إجراءك' },
  inboxOpenThread: { en: 'Open request', ar: 'فتح الطلب' },
  outcomeAccepted: { en: 'Accepted', ar: 'تم القبول' },
  outcomeRejected: { en: 'Rejected', ar: 'مرفوض' },
  outcomeCountered: { en: 'Price changed', ar: 'تعديل السعر' },
  outcomeInfo: { en: 'Information', ar: 'معلومات' },
  outcomeSent: { en: 'Sent', ar: 'مُرسل' },
  outcomeClosed: { en: 'Closed', ar: 'مُغلق' },

  // ── Orders — Feature Flow Draft §7, §9, §10 ───────────────────────────────
  navFinalOrders: { en: 'Final Orders', ar: 'الطلبات النهائية' },
  ordersTitle: { en: 'Orders', ar: 'الطلبات' },
  ordersSubtitleBuyer: { en: 'Standard orders, plus every negotiated order once its price is settled', ar: 'الطلبات العادية، وكل طلب تفاوضي بعد استقرار سعره' },
  ordersSubtitleSeller: { en: 'What these buyers are actually ordering, and at which price', ar: 'ما يطلبه المشترون فعلياً، وبأي سعر' },
  tabPendingOrders: { en: 'Pending', ar: 'قيد الانتظار' },
  tabFinalOrders: { en: 'Final Orders', ar: 'الطلبات النهائية' },
  tabCancelledOrders: { en: 'Cancelled', ar: 'ملغاة' },
  orderRef: { en: 'Order', ar: 'الطلب' },
  orderStatus: { en: 'Status', ar: 'الحالة' },
  orderPending: { en: 'Pending', ar: 'قيد الانتظار' },
  orderFinal: { en: 'Final', ar: 'نهائي' },
  orderCancelled: { en: 'Cancelled', ar: 'ملغى' },
  orderItems: { en: 'Items', ar: 'الأصناف' },
  originalPrice: { en: 'Original price', ar: 'السعر الأصلي' },
  agreedPrice: { en: 'Agreed price', ar: 'السعر المتفق عليه' },
  priceChange: { en: 'Change', ar: 'الفرق' },
  noPriceChange: { en: 'No change', ar: 'لا تغيير' },
  negotiatedBadge: { en: 'Special price negotiation', ar: 'مفاوضة سعر خاص' },
  standardOrder: { en: 'Standard order', ar: 'طلب عادي' },
  invoiceSubmitted: { en: 'Invoice / quote submitted', ar: 'أُرفقت فاتورة أو عرض سعر' },
  noInvoiceSubmitted: { en: 'No document submitted', ar: 'لم يُرفق مستند' },
  awaitingSeller: { en: 'Waiting for the supplier to respond. You can cancel until they do.', ar: 'بانتظار رد المورّد. يمكنك الإلغاء حتى ذلك الحين.' },
  awaitingBuyerCounter: { en: 'The supplier changed the price. Accept it to place the order, or cancel.', ar: 'عدّل المورّد السعر. اقبله لإتمام الطلب أو ألغِه.' },
  awaitingBuyerReverted: { en: 'The supplier kept the original price. Accept it to place the order at that price, or cancel.', ar: 'أبقى المورّد السعر الأصلي. اقبله لإتمام الطلب بهذا السعر أو ألغِه.' },
  orderSettledNoAction: { en: 'The supplier accepted your price. Nothing is needed from you — the order proceeds.', ar: 'قبل المورّد سعرك. لا يلزمك شيء — يمضي الطلب في مساره.' },
  confirmOrder: { en: 'Accept and place order', ar: 'اقبل وأتمم الطلب' },
  cancelOrder: { en: 'Cancel order', ar: 'إلغاء الطلب' },
  orderNegotiationLog: { en: 'Negotiation history', ar: 'سجل المفاوضة' },
  adminView: { en: 'HB Admin view', ar: 'عرض إدارة المنصة' },
  adminViewNote: { en: 'HIGHBASE administrators see this order\u2019s full negotiation history, including the document that was submitted, so a price change can be followed up after the fact.', ar: 'ترى إدارة هايبيس سجل المفاوضة الكامل لهذا الطلب، بما في ذلك المستند المرفق، لمتابعة أي تغيير في السعر لاحقاً.' },
  adminViewNoteNoProof: { en: 'HIGHBASE administrators see this order\u2019s full negotiation history, so a price change can be followed up after the fact. No document was submitted with this request.', ar: 'ترى إدارة هايبيس سجل المفاوضة الكامل لهذا الطلب لمتابعة أي تغيير في السعر لاحقاً. ولم يُرفق أي مستند مع هذا الطلب.' },
  attachmentOnRecord: { en: 'Document on record', ar: 'المستند المحفوظ' },
  ordersEmptyTitle: { en: 'No orders here', ar: 'لا توجد طلبات هنا' },
  ordersEmptyBody: { en: 'Orders appear here once you place them.', ar: 'تظهر الطلبات هنا بعد إتمامها.' },
  savedVsList: { en: 'Saved against list price', ar: 'الوفر مقابل السعر المعلن' },
  acceptAsTemplate: { en: 'Accept & apply as template', ar: 'اقبل واحفظه كقالب' },
  acceptThisOrderOnly: { en: 'Accept (this order only)', ar: 'اقبل (هذا الطلب فقط)' },

  // ── Cross-cutting ─────────────────────────────────────────────────────────
  minQuantityBlocked: { en: 'Minimum quantity for this product is {min} cases.', ar: 'أقل كمية لهذا الصنف هي {min} كرتون.' },
  quantityInvalid: { en: 'Enter a whole number of cases greater than zero.', ar: 'أدخل عدداً صحيحاً من الكراتين أكبر من صفر.' },
  targetAboveList: { en: 'Your target price must be below the list price of {list}.', ar: 'يجب أن يكون السعر المستهدف أقل من السعر المعلن {list}.' },
  targetImplausible: { en: 'That is more than half off the list price. You can still send it, and the supplier will see it flagged.', ar: 'هذا أكثر من نصف السعر المعلن. يمكنك إرساله، وسيظهر للمورّد موسوماً للمراجعة.' },
  priceRequired: { en: 'Enter a target price.', ar: 'أدخل السعر المستهدف.' },
  supplierRequired: { en: 'Name the supplier offering that price.', ar: 'اذكر المورّد صاحب هذا السعر.' },
  fileRequired: { en: 'Attach the document that shows that price.', ar: 'أرفق المستند الذي يُظهر هذا السعر.' },
  maxLinesReached: { en: 'A request holds up to {max} items.', ar: 'يتسع الطلب حتى {max} صنفاً.' },
  differentSeller: { en: 'That product is from a different supplier. Start a second request for it — this one stays as it is.', ar: 'هذا الصنف من مورّد آخر. ابدأ طلباً ثانياً له — ويبقى هذا الطلب كما هو.' },
  language: { en: 'العربية', ar: 'English' },
}

export function t(lang: Lang, key: keyof typeof STRINGS | string, params: Record<string, string | number> = {}): string {
  const entry = STRINGS[key as string]
  if (!entry) return String(key)
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    entry[lang],
  )
}

/**
 * FR-11.3 / AC-13.4 — history is localised here, at render time, from the stored event
 * type and its parameters. Nothing localised is ever written to the log itself.
 */
export const HISTORY_TEMPLATES: Dict = {
  RequestSubmitted: { en: '{actor} submitted the request with {lines} item(s)', ar: 'أرسل {actor} الطلب بعدد {lines} صنف' },
  RequestViewed: { en: '{actor} opened the request', ar: 'فتح {actor} الطلب' },
  SellerResponded: { en: '{actor} responded on {lines} line(s)', ar: 'رد {actor} على {lines} صنف' },
  BuyerCountered: { en: '{actor} countered — round {round}', ar: 'قدّم {actor} عرضاً مقابلاً — الجولة {round}' },
  InfoRequested: { en: '{actor} asked for more information: {reason}', ar: 'طلب {actor} معلومات إضافية: {reason}' },
  InfoSupplied: { en: '{actor} supplied the requested information', ar: 'قدّم {actor} المعلومات المطلوبة' },
  RequestAccepted: { en: '{actor} accepted the price', ar: 'قبل {actor} السعر' },
  RequestDeclined: { en: '{actor} declined', ar: 'رفض {actor}' },
  RequestExpired: { en: 'The request expired when its clock elapsed', ar: 'انتهت صلاحية الطلب بانتهاء المهلة' },
  RequestWithdrawn: { en: '{actor} withdrew the request', ar: 'سحب {actor} الطلب' },
  TemplateCreated: { en: '{actor} saved the price to the buyer price list until {validUntil}', ar: 'حفظ {actor} السعر في قائمة أسعار المشتري حتى {validUntil}' },
  ProofUploaded: { en: '{actor} attached {fileName}', ar: 'أرفق {actor} الملف {fileName}' },
  ProofCheckCompleted: { en: 'Automatic checks completed: {summary}', ar: 'اكتملت الفحوص التلقائية: {summary}' },
  AutoRuleFired: { en: 'Rule {rule} resolved the request automatically', ar: 'حسم القاعدة {rule} الطلب تلقائياً' },
  PriceChanged: { en: '{actor} changed {sku} from {before} to {after}', ar: 'غيّر {actor} سعر {sku} من {before} إلى {after}' },
  FloorOverridden: { en: '{actor} overrode the floor price: {reason}', ar: 'تجاوز {actor} الحد الأدنى للسعر: {reason}' },
}

export function renderHistory(event: HistoryEvent, lang: Lang): string {
  const template = HISTORY_TEMPLATES[event.type]
  const actor = event.actorName ?? (lang === 'ar' ? 'النظام' : 'System')
  if (!template) return event.type
  const params: Record<string, string> = { actor }
  for (const [k, v] of Object.entries(event.params)) params[k] = v === null ? '—' : String(v)
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
    template[lang],
  )
}
