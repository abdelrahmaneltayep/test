/**
 * Highbase Billing Module — executive deck, English and Arabic.
 *
 * One generator, two outputs. The layout is written once and mirrored for RTL by X(),
 * so the Arabic deck is the same deck rather than a second one that drifts.
 *
 * Every figure here is derived from billing/data.js and was read out of the model, not
 * copied from the brief — three of the brief's numbers were superseded by rulings.
 */
const pptxgen = require('pptxgenjs')

const W = 13.333
const H = 7.5

// The live Highbase palette, sampled from the product for the RFQ work.
const NAVY = '021A37'
const NAVY2 = '102641'
const BLUE = '026DBD'
const ORANGE = 'FE8E00'
const GREEN = '1F9D55'
const RED = 'D0402A'
const INK = '0D2136'
const INK2 = '5B7080'
const INK3 = '93A4B4'
const LINE = 'E6EDF3'
const TG = 'E9FDEE'
const TO = 'FFF5E6'
const TR = 'FEEEE9'
const TB = 'EDF7FE'
const WASH = 'F7FAFD'

const shadow = () => ({ type: 'outer', color: '021A37', blur: 10, offset: 2, angle: 90, opacity: 0.07 })

// ── Copy ──────────────────────────────────────────────────────────────────
const EN = {
  font: 'Calibri',
  head: 'Cambria',
  rtl: false,
  file: 'Highbase-Billing-Module-EN.pptx',
  deckTitle: 'Highbase Billing Module',
  subject: 'Billing module concept review',

  s1: {
    kicker: 'PROTOTYPE REVIEW · PM & CEO',
    title: 'Highbase Billing Module',
    lead: 'Where is the money?',
    note: 'One ledger, three readers — seller, buyer, Highbase.\nEvery figure in this deck is derived from the prototype, not from the brief.',
  },
  s2: {
    n: '01', title: 'One balance, four different questions',
    body: 'The seller statement shows a single number. That number mixes cash Highbase actually holds with commission it is merely owed, and with orders nobody has collected at all.\n\nIt is not a rounding problem. On one seller, today, the single number overstates what Highbase owes by 291.000 BHD.',
    statBig: '291.000', statUnit: 'BHD', statLabel: 'overstated on one seller',
    subA: '28.0%', subAL: 'of that seller’s book',
    subB: '9.33×', subBL: 'the commission earned on the order',
  },
  s3: {
    n: '02', title: 'What the single number hides',
    items: [
      ['The seller collected the cash', 'Many orders are paid direct to the seller — cash on delivery, bank transfer. The money never passes through Highbase, so what exists is commission owed, not a balance held.'],
      ['Nobody has collected yet', 'Credit orders are delivered and invoiced but uncollected. They are neither held nor owed: they are outstanding against the buyer.'],
      ['The book contains sign errors', 'A return reversed in the order column but not the commission column. The error is one-directional — it always inflates what Highbase appears to owe.'],
    ],
  },
  s4: {
    n: '03', title: 'One question, four answers',
    sub: 'The same four states, the same four colours, on all three surfaces.',
    cards: [
      ['Your Balance', 'Cash held, net of commission and fees, released and ready to pay out', '227.500', 'Gulf Metal Supplies', GREEN, TG],
      ['Held', 'Cash held but not releasable — delivery unconfirmed, return window open', '200.000', 'example account', ORANGE, TO],
      ['Your Dues', 'Commission and fees on orders where the seller collected the cash', '159.000', 'Riffa Building Materials', RED, TR],
      ['Awaiting buyer', 'Credit orders — delivered and invoiced, not yet collected from anyone', '300.000', 'Sitra Industrial Tools', BLUE, TB],
    ],
    foot: '“Your Balance” and “Your Dues” are the Highbase team’s own words from the statement margin. Held is 0.000 across every seed seller, so the figure shown comes from an account added to make the state reachable.',
  },
  s5: {
    n: '04', title: 'What one mis-keyed row costs',
    lead: 'RET-1007 is a return booked as a sale: reversed in the order column, charged in the commission column.',
    rows: [
      ['Cash leg', '+300.000', 'the larger error by far'],
      ['Commission leg', '−9.000', 'the only leg a commission-only check sees'],
      ['Effect on the stated balance', '291.000', 'stated 518.500 against a correct 227.500'],
    ],
    kick: 'The cash error is 33.3× the commission error — which is exactly 1 ÷ 3%. That ratio is why an error of this shape is nearly invisible to a check that reads commission alone.',
  },
  s6: {
    n: '05', title: 'One query finds it, and names it',
    formula: 'sum(commission)  ===  round3( rate × sum(orderValue) )',
    body: 'The control fails as filed and passes corrected. It does not report that “a mismatch exists” — it names RET-1007, with expected against charged, the delta, and the seller it belongs to.',
    points: [
      ['Fails as filed', 'delta +9.000 on the commission leg'],
      ['Passes corrected', 'every other row reconciles'],
      ['Names the row', 'a control you cannot act on is a report'],
    ],
    ask: 'Worth deciding: this runs as a gate on every settlement cycle, not as a monthly report.',
  },
  s7: {
    n: '06', title: 'Never pay one seller with another seller’s money',
    body: 'Manama Packaging Co. is owed 81.300 by the book. Highbase holds 81.000 of his cash. The run releases the cash, reports the shortfall, and refuses — it does not warn and proceed.',
    calc: [['The book asks for', '81.300'], ['Cash actually held', '81.000'], ['Released', '81.000'], ['Reported unfunded', '0.300']],
    note: 'Highbase’s own position on that order: 2.700 commission earned against 9.000 of discount funded — −6.300 on a single order. That is a commercial decision, and it should be visible as one.',
  },
  s8: {
    n: '07', title: 'The case the whole model exists for',
    seller: 'Riffa Building Materials',
    stats: [['159.000', 'commission earned'], ['0.000', 'of his cash held'], ['1.06×', 'the arrears ceiling']],
    body: 'Every order was collected directly by the seller. Highbase has earned 159.000 and can recover none of it by netting a payout, because it holds none of his money. Standing: credit suspended.',
    foot: 'Across the seed book: 188.550 of commission is unsecured, and three of four sellers are under watch or worse.',
  },
  s9: {
    n: '08', title: 'Standing is a status, not an amount',
    body: 'Four grades from three inputs. Each seed seller trips a different one, and the seller can see exactly what would move them up or down.',
    head: ['Seller', 'Standing', 'What triggered it'],
    rows: [
      ['Gulf Metal Supplies', 'Good standing', 'nothing — all three inputs clear', GREEN],
      ['Manama Packaging Co.', 'Under watch', 'discount ratio 1.03 — funded discounts exceed commission', ORANGE],
      ['Sitra Industrial Tools', 'Under watch', 'online share 12.5% — below the 30% floor', ORANGE],
      ['Riffa Building Materials', 'Credit suspended', 'arrears ratio 1.06 — past the ceiling', RED],
    ],
  },
  s10: {
    n: '09', title: 'One ledger, two products — and this is not decided',
    left: ['Agent', 'Highbase does not guarantee', [
      'The seller waits for the buyer',
      'Credit orders never enter a payout run',
      'State reads “Awaiting buyer”',
      'Highbase carries no buyer credit risk',
    ]],
    right: ['Guarantor', 'Highbase pays at delivery', [
      'The seller is paid on delivery confirmation',
      'Credit orders enter the run at delivery',
      'State reads “Guaranteed — due”',
      'Highbase carries 300.000 of exposure on one seller alone',
    ]],
    foot: 'The prototype ships both as a switch, so the same seed data can be reviewed as two different products. It is the one decision everything downstream waits on.',
  },
  s11: {
    n: '10', title: 'Three open questions, now settled',
    items: [
      ['The rate card conflict', 'The ledger’s flat 3% is contractual. Subscription Settings advertises 10% first order / 0% thereafter — terms never applied to a single posting. That is now a defect to fix and a claim to size, not an open commercial question.'],
      ['The simplified-invoice threshold', 'Measured on the taxable amount, before VAT — not on the total payable.'],
      ['Seller #1088’s payable', '54.600, not the 56.400 written in the brief. The brief’s derived line omits that order’s own 1.800 of commission; the formula beside it gives 54.600.'],
    ],
  },
  s12: {
    n: '11', title: 'What exists today',
    body: 'A clickable prototype of all three surfaces, reading one ledger. No screen displays a total that is not computed from postings — if a figure appears twice, it came from one function.',
    stats: [['3', 'surfaces'], ['20', 'screens'], ['52', 'model assertions'], ['0', 'failures']],
    foot: 'Four browser-driven suites cover the surfaces themselves — seller, admin, buyer and the single-file build — all green.',
  },
  s13: {
    title: 'What we need from you',
    items: [
      ['Decide the risk model', 'Agent or guarantor. Payouts, exposure and half the copy wait on this one answer.'],
      ['Make the control a gate', 'Reconciliation runs before every settlement cycle and can refuse it — not a report read afterwards.'],
      ['Correct Subscription Settings', 'And size the claim from sellers who signed up on terms the ledger never applied.'],
    ],
  },
}

const AR = {
  font: 'Arial',
  head: 'Arial',
  rtl: true,
  file: 'Highbase-Billing-Module-AR.pptx',
  deckTitle: 'وحدة الفوترة في Highbase',
  subject: 'مراجعة مفهوم وحدة الفوترة',

  s1: {
    kicker: 'مراجعة النموذج الأولي · مدير المنتج والرئيس التنفيذي',
    title: 'وحدة الفوترة في Highbase',
    lead: 'أين المال؟',
    note: 'دفتر واحد، وثلاثة قرّاء — البائع، والمشتري، وHighbase.\nكل رقم في هذا العرض مشتق من النموذج الأولي، لا منقول من المستند.',
  },
  s2: {
    n: '01', title: 'رصيد واحد، وأربعة أسئلة مختلفة',
    body: 'يعرض كشف حساب البائع رقماً واحداً. وهذا الرقم يخلط بين نقد تحتفظ به Highbase فعلياً، وعمولة مستحقة لها فقط، وطلبات لم يحصّلها أحد بعد.\n\nوليست المسألة تقريباً حسابياً: على بائع واحد، اليوم، يضخّم هذا الرقم ما يبدو أن Highbase مدينة به بمقدار 291.000 د.ب.',
    statBig: '291.000', statUnit: 'د.ب', statLabel: 'تضخيم على بائع واحد',
    subA: '28.0%', subAL: 'من دفتر هذا البائع',
    subB: '‎9.33×', subBL: 'ضعف العمولة المكتسبة على الطلب',
  },
  s3: {
    n: '02', title: 'ما الذي يخفيه الرقم الواحد',
    items: [
      ['البائع هو من حصّل النقد', 'كثير من الطلبات تُدفع مباشرة إلى البائع — نقداً عند التسليم أو بحوالة بنكية. المال لا يمرّ عبر Highbase إطلاقاً، فما ينشأ هنا عمولة مستحقة لها، لا رصيد تحتفظ به.'],
      ['لم يحصّلها أحد بعد', 'الطلبات الآجلة سُلّمت وفوترت ولم تُحصّل. هي ليست محتجزة ولا مستحقة: إنها قائمة على المشتري.'],
      ['الدفاتر تحتوي أخطاء إشارة', 'مرتجع عُكس في عمود الطلب دون عمود العمولة. والخطأ أحادي الاتجاه — فهو يضخّم دائماً ما يبدو أن Highbase مدينة به.'],
    ],
  },
  s4: {
    n: '03', title: 'سؤال واحد، وأربع إجابات',
    sub: 'الحالات الأربع ذاتها، والألوان الأربعة ذاتها، على الواجهات الثلاث جميعاً.',
    cards: [
      ['رصيدك', 'نقد محتفظ به، بعد خصم العمولة والرسوم، مُفرج عنه وجاهز للصرف', '227.500', 'Gulf Metal Supplies', GREEN, TG],
      ['محتجز', 'نقد محتفظ به ولا يمكن الإفراج عنه — التسليم غير مؤكد، أو نافذة الإرجاع مفتوحة', '200.000', 'حساب توضيحي', ORANGE, TO],
      ['مستحقات عليك', 'عمولة ورسوم على طلبات حصّل البائع نقدها بنفسه', '159.000', 'Riffa Building Materials', RED, TR],
      ['بانتظار المشتري', 'طلبات آجلة — سُلّمت وفوترت ولم تُحصّل من أحد بعد', '300.000', 'Sitra Industrial Tools', BLUE, TB],
    ],
    foot: '«رصيدك» و«مستحقات عليك» هما تعبيرا فريق Highbase نفسه من هامش الكشف. حالة «محتجز» تساوي 0.000 لدى كل بائع في البيانات الأساسية، لذا فالرقم المعروض من حساب أُضيف خصيصاً ليجعل الحالة قابلة للمراجعة.',
  },
  s5: {
    n: '04', title: 'كم يكلّف سطر واحد أُدخل خطأً',
    lead: 'السطر RET-1007 مرتجع قُيّد كأنه عملية بيع: عُكس في عمود الطلب، وحُمّل في عمود العمولة.',
    rows: [
      ['الطرف النقدي', '‎+300.000', 'وهو الخطأ الأكبر بفارق واسع'],
      ['طرف العمولة', '‎−9.000', 'وهو الطرف الوحيد الذي يراه فحص العمولة'],
      ['الأثر على الرصيد المعلن', '291.000', 'رصيد معلن 518.500 مقابل 227.500 صحيح'],
    ],
    kick: 'الخطأ النقدي يعادل 33.3 ضعف خطأ العمولة — وهو بالضبط 1 ÷ 3٪. هذه النسبة هي سبب كون خطأ بهذا الشكل شبه خفيّ أمام فحص يقرأ العمولة وحدها.',
  },
  s6: {
    n: '05', title: 'استعلام واحد يكشفه ويسمّيه',
    formula: 'sum(commission)  ===  round3( rate × sum(orderValue) )',
    body: 'الضابط يفشل على الحالة المُقيَّدة وينجح على الحالة المصححة. وهو لا يقول إن «هناك عدم تطابق» — بل يسمّي RET-1007، مع المتوقع مقابل المحمَّل، والفارق، والبائع الذي يخصّه.',
    points: [
      ['يفشل كما هو مُقيَّد', 'فارق +9.000 على طرف العمولة'],
      ['ينجح بعد التصحيح', 'كل سطر آخر يتطابق'],
      ['يسمّي السطر', 'ضابط لا يمكن التصرف بناءً عليه هو تقرير'],
    ],
    ask: 'قرار يستحق الحسم: أن يعمل هذا كبوابة على كل دورة تسوية، لا كتقرير شهري.',
  },
  s7: {
    n: '06', title: 'لا تُدفع مستحقات بائع من أموال بائع آخر',
    body: 'الدفتر يقول إن Manama Packaging Co. مستحق له 81.300، بينما تحتفظ Highbase بـ 81.000 من نقده. دفعة التسوية تُفرج عن النقد، وتعلن العجز، وترفض إتمام الدفعة — لا تكتفي بالتحذير ثم المضي.',
    calc: [['ما يطلبه الدفتر', '81.300'], ['النقد المحتفظ به فعلياً', '81.000'], ['المُفرج عنه', '81.000'], ['العجز المعلن', '0.300']],
    note: 'أما موقف Highbase نفسها على ذلك الطلب: 2.700 عمولة مكتسبة مقابل 9.000 خصم مموَّل — أي −6.300 على طلب واحد. هذا قرار تجاري، ومن حقه أن يظهر بوصفه كذلك.',
  },
  s8: {
    n: '07', title: 'الحالة التي وُجد النموذج كله من أجلها',
    seller: 'Riffa Building Materials',
    stats: [['159.000', 'عمولة مكتسبة'], ['0.000', 'من نقده محتفظ به'], ['‎1.06×', 'من سقف المتأخرات']],
    body: 'كل طلباته حصّلها البائع مباشرة. كسبت Highbase 159.000 ولا تستطيع استرداد أي جزء منها بالمقاصة من دفعة قادمة، لأنها لا تحتفظ بشيء من نقده. التصنيف: الائتمان موقوف.',
    foot: 'على مستوى البيانات الأساسية: 188.550 من العمولة غير مضمونة، وثلاثة بائعين من أربعة تحت المراقبة أو أسوأ.',
  },
  s9: {
    n: '08', title: 'التصنيف حالة، لا مبلغ',
    body: 'أربع درجات تنتج عن ثلاثة مدخلات. كل بائع في البيانات الأساسية يتجاوز مدخلاً مختلفاً، ويستطيع البائع أن يرى تماماً ما الذي يرفعه أو يخفضه.',
    head: ['البائع', 'التصنيف', 'ما الذي أدى إليه'],
    rows: [
      ['Gulf Metal Supplies', 'وضع جيد', 'لا شيء — المدخلات الثلاثة سليمة', GREEN],
      ['Manama Packaging Co.', 'تحت المراقبة', 'نسبة الخصم 1.03 — الخصومات المموَّلة تتجاوز العمولة', ORANGE],
      ['Sitra Industrial Tools', 'تحت المراقبة', 'التحصيل الإلكتروني دون الحد الأدنى — 12.5٪ مقابل 30٪ مطلوبة', ORANGE],
      ['Riffa Building Materials', 'الائتمان موقوف', 'نسبة المتأخرات 1.06 — تجاوزت السقف', RED],
    ],
  },
  s10: {
    n: '09', title: 'دفتر واحد، ومنتجان — والقرار لم يُتخذ',
    left: ['وكيل', 'Highbase لا تضمن', [
      'البائع ينتظر المشتري',
      'الطلبات الآجلة لا تدخل أي دفعة تسوية',
      'اسم الحالة: «بانتظار المشتري»',
      'Highbase لا تتحمل مخاطر ائتمان المشتري',
    ]],
    right: ['ضامن', 'Highbase تدفع عند التسليم', [
      'يُدفع للبائع عند تأكيد التسليم',
      'الطلبات الآجلة تدخل الدفعة عند التسليم',
      'اسم الحالة: «مضمون — مستحق»',
      'Highbase تتحمل 300.000 من الانكشاف على بائع واحد',
    ]],
    foot: 'النموذج الأولي يقدّم الاثنين كمفتاح تبديل، حتى تُراجَع البيانات نفسها بوصفها منتجين مختلفين. وهو القرار الوحيد الذي ينتظره كل ما يليه.',
  },
  s11: {
    n: '10', title: 'ثلاثة أسئلة مفتوحة، حُسمت الآن',
    items: [
      ['تعارض بطاقات الأسعار', 'نسبة الـ3% الثابتة في الدفتر هي التعاقدية. أما إعدادات الاشتراك فتعلن 10% على الطلب الأول و0% بعده — وهي شروط لم تُطبَّق على أي قيد. صار هذا خللاً يُصحَّح ومطالبة تُقدَّر، لا سؤالاً تجارياً مفتوحاً.'],
      ['حد الفاتورة المبسّطة', 'يُقاس على المبلغ الخاضع للضريبة قبل ضريبة القيمة المضافة — لا على إجمالي المستحق.'],
      ['رصيد البائع ‎#1088', '54.600، لا 56.400 كما ورد في المستند. السطر المشتق في المستند يغفل عمولة الطلب نفسه البالغة 1.800؛ والمعادلة المجاورة له تعطي 54.600.'],
    ],
  },
  s12: {
    n: '11', title: 'ما هو جاهز اليوم',
    body: 'نموذج أولي قابل للنقر يغطي الواجهات الثلاث، وكلها تقرأ دفتراً واحداً. لا تعرض أي شاشة إجمالياً غير محسوب من القيود — وإذا ظهر رقم في موضعين فمصدره دالة واحدة.',
    stats: [['3', 'واجهات'], ['20', 'شاشة'], ['52', 'اختبار للنموذج'], ['0', 'حالات فشل']],
    foot: 'وأربع مجموعات اختبار تُشغَّل داخل المتصفح تغطي الواجهات نفسها — البائع، والإدارة، والمشتري، والنسخة أحادية الملف — جميعها ناجحة.',
  },
  s13: {
    title: 'ما نحتاجه منكم',
    items: [
      ['حسم نموذج المخاطر', 'وكيل أم ضامن. الدفعات والانكشاف ونصف النصوص تنتظر هذه الإجابة وحدها.'],
      ['جعل الضابط بوابة', 'أن تعمل المطابقة قبل كل دورة تسوية وأن تملك رفضها — لا أن تُقرأ تقريراً بعد وقوعها.'],
      ['تصحيح إعدادات الاشتراك', 'وتقدير حجم المطالبة من البائعين الذين اشتركوا على شروط لم يطبّقها الدفتر قط.'],
    ],
  },
}

// ── Build ─────────────────────────────────────────────────────────────────
function build(T) {
  const rtl = T.rtl
  const X = (x, w) => (rtl ? W - x - w : x)
  const AL = rtl ? 'right' : 'left'
  const ALR = rtl ? 'left' : 'right'
  const body = (o) => Object.assign({ fontFace: T.font, rtlMode: rtl, isTextBox: true, align: AL }, o)
  const headOpt = (o) => Object.assign({ fontFace: T.head, rtlMode: rtl, isTextBox: true, align: AL }, o)

  const pres = new pptxgen()
  pres.layout = 'LAYOUT_WIDE'
  pres.author = 'Highbase'
  pres.title = T.deckTitle
  pres.subject = T.subject
  if (rtl) pres.rtlMode = true

  /** Section header used on every content slide: a numbered navy disc and the title. */
  const header = (s, n, title) => {
    s.addShape(pres.ShapeType.ellipse, { x: X(0.62, 0.46), y: 0.52, w: 0.46, h: 0.46, fill: { color: NAVY } })
    s.addText(n, body({ x: X(0.62, 0.46), y: 0.52, w: 0.46, h: 0.46, align: 'center', valign: 'middle', fontSize: 13, bold: true, color: 'FFFFFF', margin: 0 }))
    s.addText(title, headOpt({ x: X(1.28, 11.4), y: 0.38, w: 11.4, h: 0.95, fontSize: 28, bold: true, color: NAVY, valign: 'middle', margin: 0 }))
  }

  const card = (s, o) => {
    s.addShape(pres.ShapeType.roundRect, {
      x: o.x, y: o.y, w: o.w, h: o.h, rectRadius: 0.09,
      fill: { color: o.fill || 'FFFFFF' },
      line: { color: o.line || LINE, width: 1 },
      shadow: shadow(),
    })
  }

  // ── 1 · Title ──
  let s = pres.addSlide()
  s.background = { color: NAVY }
  s.addText(T.s1.kicker, body({ x: X(0.9, 8), y: 1.5, w: 8, h: 0.3, fontSize: 12, bold: true, color: ORANGE, charSpacing: 2, margin: 0 }))
  s.addText(T.s1.title, headOpt({ x: X(0.9, 11), y: 2.0, w: 11, h: 1.0, fontSize: 48, bold: true, color: 'FFFFFF', margin: 0 }))
  s.addText(T.s1.lead, headOpt({ x: X(0.9, 11), y: 3.05, w: 11, h: 0.8, fontSize: 34, color: '7FC4F0', margin: 0 }))
  s.addShape(pres.ShapeType.rect, { x: X(0.95, 3.2), y: 4.15, w: 3.2, h: 0.02, fill: { color: NAVY2 } })
  s.addText(T.s1.note, body({ x: X(0.9, 8.6), y: 4.45, w: 8.6, h: 1.2, fontSize: 15, color: 'A9C3DA', lineSpacing: 24, margin: 0 }))
  s.addNotes('Deck derived from the prototype build, not from the brief text. Every figure was read out of data.js.')

  // ── 2 · The problem ──
  s = pres.addSlide()
  header(s, T.s2.n, T.s2.title)
  s.addText(T.s2.body, body({ x: X(0.68, 6.4), y: 1.55, w: 6.4, h: 3.4, fontSize: 16, color: INK, lineSpacing: 28, valign: 'top', margin: 0 }))
  card(s, { x: X(7.55, 5.1), y: 1.55, w: 5.1, h: 3.9, fill: WASH })
  s.addText([
    { text: T.s2.statBig, options: { fontSize: 62, bold: true, color: RED } },
    { text: ' ' + T.s2.statUnit, options: { fontSize: 20, bold: true, color: RED } },
  ], body({ x: X(7.95, 4.3), y: 1.82, w: 4.3, h: 1.35, align: 'center', valign: 'middle', margin: 0 }))
  s.addText(T.s2.statLabel, body({ x: X(7.95, 4.3), y: 3.22, w: 4.3, h: 0.35, align: 'center', fontSize: 14, color: INK2, margin: 0 }))
  s.addShape(pres.ShapeType.rect, { x: X(8.35, 3.5), y: 3.74, w: 3.5, h: 0.015, fill: { color: LINE } })
  const pair = (x, val, lab) => {
    s.addText(val, body({ x, y: 3.94, w: 2.05, h: 0.55, align: 'center', fontSize: 27, bold: true, color: NAVY, margin: 0 }))
    s.addText(lab, body({ x, y: 4.49, w: 2.05, h: 0.75, align: 'center', fontSize: 12, color: INK2, margin: 0 }))
  }
  pair(X(7.85, 2.05), T.s2.subA, T.s2.subAL)
  pair(X(10.15, 2.05), T.s2.subB, T.s2.subBL)

  // ── 3 · Three failures ──
  s = pres.addSlide()
  header(s, T.s3.n, T.s3.title)
  T.s3.items.forEach((it, i) => {
    const y = 1.62 + i * 1.72
    card(s, { x: X(0.62, 12.1), y, w: 12.1, h: 1.5 })
    s.addShape(pres.ShapeType.ellipse, { x: X(1.0, 0.62), y: y + 0.44, w: 0.62, h: 0.62, fill: { color: [TB, TO, TR][i] } })
    s.addText(String(i + 1), body({ x: X(1.0, 0.62), y: y + 0.44, w: 0.62, h: 0.62, align: 'center', valign: 'middle', fontSize: 20, bold: true, color: [BLUE, ORANGE, RED][i], margin: 0 }))
    s.addText(it[0], headOpt({ x: X(1.92, 10.4), y: y + 0.22, w: 10.4, h: 0.4, fontSize: 19, bold: true, color: NAVY, margin: 0 }))
    s.addText(it[1], body({ x: X(1.92, 10.4), y: y + 0.64, w: 10.4, h: 0.72, fontSize: 14, color: INK2, lineSpacing: 20, margin: 0 }))
  })

  // ── 4 · Four states ──
  s = pres.addSlide()
  header(s, T.s4.n, T.s4.title)
  s.addText(T.s4.sub, body({ x: X(0.68, 11.5), y: 1.5, w: 11.5, h: 0.3, fontSize: 14, color: INK2, margin: 0 }))
  T.s4.cards.forEach((c, i) => {
    const w = 2.92
    const x = X(0.62 + i * 3.06, w)
    card(s, { x, y: 1.86, w, h: 3.55, fill: c[5], line: c[4] })
    s.addText(c[0], headOpt({ x: x + 0.26, y: 2.06, w: w - 0.52, h: 0.36, fontSize: 17, bold: true, color: c[4], margin: 0 }))
    s.addText(c[2], body({ x: x + 0.26, y: 2.44, w: w - 0.52, h: 0.62, fontSize: 30, bold: true, color: NAVY, margin: 0 }))
    s.addText(c[3], body({ x: x + 0.26, y: 3.06, w: w - 0.52, h: 0.3, fontSize: 11, italic: true, color: INK2, margin: 0 }))
    s.addText(c[1], body({ x: x + 0.26, y: 3.5, w: w - 0.52, h: 1.6, fontSize: 12.5, color: INK, lineSpacing: 18, margin: 0 }))
  })
  s.addText(T.s4.foot, body({ x: X(0.68, 12.0), y: 5.45, w: 12.0, h: 0.8, fontSize: 11.5, color: INK3, lineSpacing: 17, margin: 0 }))

  // ── 5 · The cost ──
  s = pres.addSlide()
  header(s, T.s5.n, T.s5.title)
  s.addText(T.s5.lead, body({ x: X(0.68, 12.0), y: 1.5, w: 12.0, h: 0.4, fontSize: 15, color: INK, margin: 0 }))
  T.s5.rows.forEach((r, i) => {
    const y = 1.98 + i * 1.06
    const last = i === 2
    card(s, { x: X(0.62, 12.1), y, w: 12.1, h: 0.92, fill: last ? NAVY : 'FFFFFF', line: last ? NAVY : LINE })
    s.addText(r[0], headOpt({ x: X(1.0, 4.4), y: y + 0.12, w: 4.4, h: 0.68, fontSize: 17, bold: true, color: last ? 'FFFFFF' : NAVY, valign: 'middle', margin: 0 }))
    s.addText(r[2], body({ x: X(5.5, 4.4), y: y + 0.12, w: 4.4, h: 0.68, fontSize: 12.5, color: last ? '9FC4E4' : INK2, valign: 'middle', margin: 0 }))
    s.addText(r[1], body({
      x: X(10.0, 2.35), y: y + 0.12, w: 2.35, h: 0.68, align: ALR, valign: 'middle', margin: 0,
      fontSize: 24, bold: true, color: last ? 'FFFFFF' : (i === 0 ? GREEN : RED),
    }))
  })
  card(s, { x: X(0.62, 12.1), y: 5.34, w: 12.1, h: 1.12, fill: TO, line: 'F6E1BF' })
  s.addText(T.s5.kick, body({ x: X(1.0, 11.35), y: 5.48, w: 11.35, h: 0.86, fontSize: 13.5, color: 'A35C00', lineSpacing: 19, valign: 'middle', margin: 0 }))

  // ── 6 · The control ──
  s = pres.addSlide()
  header(s, T.s6.n, T.s6.title)
  card(s, { x: X(0.62, 12.1), y: 1.5, w: 12.1, h: 0.78, fill: NAVY, line: NAVY })
  s.addText(T.s6.formula, { x: X(0.62, 12.1), y: 1.5, w: 12.1, h: 0.78, align: 'center', valign: 'middle', fontFace: 'Courier New', fontSize: 18, color: '7FC4F0', isTextBox: true, margin: 0 })
  s.addText(T.s6.body, body({ x: X(0.68, 12.0), y: 2.52, w: 12.0, h: 0.85, fontSize: 15.5, color: INK, lineSpacing: 25, margin: 0 }))
  T.s6.points.forEach((p, i) => {
    const w = 3.86
    const x = X(0.62 + i * 4.02, w)
    card(s, { x, y: 3.62, w, h: 1.5 })
    s.addText(p[0], headOpt({ x: x + 0.26, y: 3.82, w: w - 0.52, h: 0.4, fontSize: 17, bold: true, color: [RED, GREEN, BLUE][i], margin: 0 }))
    s.addText(p[1], body({ x: x + 0.26, y: 4.24, w: w - 0.52, h: 0.7, fontSize: 13, color: INK2, lineSpacing: 18, margin: 0 }))
  })
  s.addText(T.s6.ask, body({ x: X(0.68, 12.0), y: 5.42, w: 12.0, h: 0.5, fontSize: 14.5, italic: true, color: NAVY, margin: 0 }))

  // ── 7 · Payout rule ──
  s = pres.addSlide()
  header(s, T.s7.n, T.s7.title)
  s.addText(T.s7.body, body({ x: X(0.68, 6.5), y: 1.5, w: 6.5, h: 1.9, fontSize: 15.5, color: INK, lineSpacing: 26, valign: 'top', margin: 0 }))
  card(s, { x: X(0.62, 6.6), y: 3.55, w: 6.6, h: 1.55, fill: TO, line: 'F6E1BF' })
  s.addText(T.s7.note, body({ x: X(0.94, 5.96), y: 3.68, w: 5.96, h: 1.3, fontSize: 13, color: 'A35C00', lineSpacing: 19, valign: 'middle', margin: 0 }))
  card(s, { x: X(7.62, 5.1), y: 1.5, w: 5.1, h: 3.6, fill: WASH })
  T.s7.calc.forEach((c, i) => {
    const y = 1.82 + i * 0.78
    const strong = i >= 2
    s.addText(c[0], body({ x: X(7.95, 2.7), y, w: 2.7, h: 0.5, fontSize: 13.5, bold: strong, color: strong ? NAVY : INK2, valign: 'middle', margin: 0 }))
    s.addText(c[1], body({ x: X(10.65, 1.75), y, w: 1.75, h: 0.5, align: ALR, fontSize: 19, bold: true, valign: 'middle', margin: 0, color: i === 3 ? RED : (i === 2 ? GREEN : NAVY) }))
    if (i === 1) s.addShape(pres.ShapeType.rect, { x: X(7.95, 4.45), y: y + 0.58, w: 4.45, h: 0.015, fill: { color: LINE } })
  })

  // ── 8 · #1103 ──
  s = pres.addSlide()
  header(s, T.s8.n, T.s8.title)
  s.addText(T.s8.seller, headOpt({ x: X(0.68, 12.0), y: 1.5, w: 12.0, h: 0.42, fontSize: 20, bold: true, color: RED, margin: 0 }))
  T.s8.stats.forEach((st, i) => {
    const w = 3.86
    const x = X(0.62 + i * 4.02, w)
    card(s, { x, y: 2.02, w, h: 1.62, fill: i === 1 ? TR : 'FFFFFF', line: i === 1 ? 'F6D5CD' : LINE })
    s.addText(st[0], body({ x: x + 0.2, y: 2.22, w: w - 0.4, h: 0.75, align: 'center', fontSize: 38, bold: true, color: i === 1 ? RED : NAVY, margin: 0 }))
    s.addText(st[1], body({ x: x + 0.2, y: 3.0, w: w - 0.4, h: 0.4, align: 'center', fontSize: 13, color: INK2, margin: 0 }))
  })
  s.addText(T.s8.body, body({ x: X(0.68, 12.0), y: 3.92, w: 12.0, h: 1.1, fontSize: 16, color: INK, lineSpacing: 27, margin: 0 }))
  card(s, { x: X(0.62, 12.1), y: 5.18, w: 12.1, h: 0.95, fill: NAVY, line: NAVY })
  s.addText(T.s8.foot, body({ x: X(1.0, 11.35), y: 5.27, w: 11.35, h: 0.78, fontSize: 14.5, color: 'FFFFFF', valign: 'middle', margin: 0 }))

  // ── 9 · Standing ──
  s = pres.addSlide()
  header(s, T.s9.n, T.s9.title)
  s.addText(T.s9.body, body({ x: X(0.68, 12.0), y: 1.46, w: 12.0, h: 0.6, fontSize: 14.5, color: INK2, lineSpacing: 21, margin: 0 }))
  const cw = [4.0, 2.7, 5.4]
  const cx = [0.62, 4.72, 7.52]
  s.addShape(pres.ShapeType.rect, { x: X(0.62, 12.3), y: 2.16, w: 12.3, h: 0.5, fill: { color: 'F4F6F6' } })
  T.s9.head.forEach((h, i) => {
    s.addText(h, body({ x: X(cx[i] + 0.22, cw[i] - 0.3), y: 2.16, w: cw[i] - 0.3, h: 0.5, fontSize: 13, bold: true, color: NAVY, valign: 'middle', margin: 0 }))
  })
  T.s9.rows.forEach((r, i) => {
    const y = 2.66 + i * 0.78
    if (i % 2 === 1) s.addShape(pres.ShapeType.rect, { x: X(0.62, 12.3), y, w: 12.3, h: 0.78, fill: { color: 'FBFCFE' } })
    s.addText(r[0], body({ x: X(cx[0] + 0.22, cw[0] - 0.3), y, w: cw[0] - 0.3, h: 0.78, fontSize: 14, bold: true, color: INK, valign: 'middle', margin: 0 }))
    s.addShape(pres.ShapeType.roundRect, { x: X(cx[1] + 0.22, 2.3), y: y + 0.19, w: 2.3, h: 0.4, rectRadius: 0.06, fill: { color: r[3] === GREEN ? TG : r[3] === ORANGE ? TO : TR }, line: { color: r[3], width: 0.75 } })
    s.addText(r[1], body({ x: X(cx[1] + 0.22, 2.3), y: y + 0.19, w: 2.3, h: 0.4, align: 'center', valign: 'middle', fontSize: 12.5, bold: true, color: r[3], margin: 0 }))
    s.addText(r[2], body({ x: X(cx[2] + 0.22, cw[2] - 0.3), y, w: cw[2] - 0.3, h: 0.78, fontSize: 13, color: INK2, valign: 'middle', margin: 0 }))
    s.addShape(pres.ShapeType.rect, { x: X(0.62, 12.3), y: y + 0.78, w: 12.3, h: 0.01, fill: { color: LINE } })
  })

  // ── 10 · Agent vs guarantor ──
  s = pres.addSlide()
  header(s, T.s10.n, T.s10.title)
  const col = (spec, x, accent, tint) => {
    card(s, { x, y: 1.5, w: 6.0, h: 3.2, fill: tint, line: accent })
    s.addText(spec[0], headOpt({ x: x + 0.32, y: 1.72, w: 5.36, h: 0.5, fontSize: 25, bold: true, color: accent, margin: 0 }))
    s.addText(spec[1], body({ x: x + 0.32, y: 2.2, w: 5.36, h: 0.36, fontSize: 14, italic: true, color: INK2, margin: 0 }))
    s.addText(spec[2].map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < spec[2].length - 1 } })),
      body({ x: x + 0.32, y: 2.66, w: 5.36, h: 2.2, fontSize: 13.5, color: INK, paraSpaceAfter: 8, lineSpacing: 19, margin: 0 }))
  }
  col(T.s10.left, X(0.62, 6.0), BLUE, TB)
  col(T.s10.right, X(6.72, 6.0), ORANGE, TO)
  s.addText(T.s10.foot, body({ x: X(0.68, 12.0), y: 4.95, w: 12.0, h: 0.8, fontSize: 14, color: INK2, lineSpacing: 21, margin: 0 }))

  // ── 11 · Decisions settled ──
  s = pres.addSlide()
  header(s, T.s11.n, T.s11.title)
  T.s11.items.forEach((it, i) => {
    const y = 1.5 + i * 1.66
    card(s, { x: X(0.62, 12.1), y, w: 12.1, h: 1.46 })
    s.addShape(pres.ShapeType.ellipse, { x: X(1.0, 0.56), y: y + 0.45, w: 0.56, h: 0.56, fill: { color: TG } })
    s.addText('✓', body({ x: X(1.0, 0.56), y: y + 0.45, w: 0.56, h: 0.56, align: 'center', valign: 'middle', fontSize: 18, bold: true, color: GREEN, margin: 0 }))
    s.addText(it[0], headOpt({ x: X(1.86, 10.5), y: y + 0.2, w: 10.5, h: 0.4, fontSize: 18, bold: true, color: NAVY, margin: 0 }))
    s.addText(it[1], body({ x: X(1.86, 10.5), y: y + 0.6, w: 10.5, h: 0.76, fontSize: 13.5, color: INK2, lineSpacing: 19, margin: 0 }))
  })

  // ── 12 · What exists ──
  s = pres.addSlide()
  header(s, T.s12.n, T.s12.title)
  s.addText(T.s12.body, body({ x: X(0.68, 12.0), y: 1.5, w: 12.0, h: 0.95, fontSize: 15.5, color: INK, lineSpacing: 25, margin: 0 }))
  T.s12.stats.forEach((st, i) => {
    const w = 2.92
    const x = X(0.62 + i * 3.06, w)
    card(s, { x, y: 2.66, w, h: 1.9, fill: i === 3 ? TG : WASH, line: i === 3 ? 'C9EED6' : LINE })
    s.addText(st[0], body({ x: x + 0.2, y: 2.9, w: w - 0.4, h: 0.9, align: 'center', fontSize: 46, bold: true, color: i === 3 ? GREEN : NAVY, margin: 0 }))
    s.addText(st[1], body({ x: x + 0.2, y: 3.84, w: w - 0.4, h: 0.45, align: 'center', fontSize: 13.5, color: INK2, margin: 0 }))
  })
  s.addText(T.s12.foot, body({ x: X(0.68, 12.0), y: 4.84, w: 12.0, h: 0.6, fontSize: 14, color: INK2, lineSpacing: 21, margin: 0 }))

  // ── 13 · Asks ──
  s = pres.addSlide()
  s.background = { color: NAVY }
  s.addText(T.s13.title, headOpt({ x: X(0.9, 11.5), y: 0.72, w: 11.5, h: 0.8, fontSize: 38, bold: true, color: 'FFFFFF', margin: 0 }))
  T.s13.items.forEach((it, i) => {
    const y = 1.98 + i * 1.6
    s.addShape(pres.ShapeType.roundRect, { x: X(0.62, 12.1), y, w: 12.1, h: 1.36, rectRadius: 0.09, fill: { color: NAVY2 }, line: { color: '1D3A59', width: 1 } })
    s.addText(String(i + 1), body({ x: X(1.0, 0.62), y: y + 0.37, w: 0.62, h: 0.62, align: 'center', valign: 'middle', fontSize: 20, bold: true, color: ORANGE, margin: 0 }))
    s.addText(it[0], headOpt({ x: X(1.86, 10.5), y: y + 0.18, w: 10.5, h: 0.42, fontSize: 19, bold: true, color: 'FFFFFF', margin: 0 }))
    s.addText(it[1], body({ x: X(1.86, 10.5), y: y + 0.6, w: 10.5, h: 0.62, fontSize: 13.5, color: 'A9C3DA', lineSpacing: 19, margin: 0 }))
  })

  return pres.writeFile({ fileName: T.file })
}

Promise.all([build(EN), build(AR)]).then((f) => console.log('wrote', f.join(' · ')))
