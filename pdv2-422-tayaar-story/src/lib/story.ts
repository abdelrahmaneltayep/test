import { n, sar } from './num';
import type { CaseDef } from './cases';

/**
 * The merchant's journey, told as a story.
 *
 * The protagonist is a merchant who already delivers fast with their own riders —
 * the problem is that nobody can see it. The spine of the arc is one thing:
 * whether the two-hour promise reaches the customer at checkout. Watch that
 * change and you have watched the whole feature.
 *
 * Every chapter maps to a line in the PDV2-422 brief; `source` names which.
 * No chapter carries a statistic — the brief's closing Note makes every Tayaar
 * figure a launch blocker, so the story is built to work without one.
 */
export type Promise = 'off' | 'activating' | 'on' | 'risk' | 'suspended';

export interface Chapter {
  id: string;
  act: 1 | 2 | 3;
  /** Chapter title — the merchant's moment, not the feature's name. */
  moment: string;
  /** Two sentences, merchant's side of the screen. */
  narration: string;
  /** What changed since the previous chapter. Null in chapter one. */
  delta: string | null;
  promise: Promise;
  source: string;
  /** The strip content for this beat, rendered by whichever option is selected. */
  strip: CaseDef | null;
  /** Optional branch chapters reachable from this one. */
  branchOf?: string;
}

const OFFER_TITLE = 'إدارة المناديب باحترافية مع تطبيق طيّار';
const OFFER_DESC  = 'استخدم تطبيق طيار لتوزيع الطلبات آلياً على مناديبك، تتبع مساراتهم، وضمان الوفاء بوعد الشحن السريع لعملائك.';
const ALT_TITLE   = 'طيّار جاهز لإدارة مناديبك';
const ALT_DESC    = 'نظام ذكي لإدارة أسطول المناديب، إسناد الطلبات، التتبع المباشر، والتقارير — عبر لوحة تحكم موحدة.';

const s = (o: Partial<CaseDef>): CaseDef => ({
  id: 'x', story: 'ST1', label: '', source: '', tone: 'offer', title: '', desc: '', ...o,
} as CaseDef);

export const ACTS: Record<1 | 2 | 3, { name: string; premise: string }> = {
  1: { name: 'الفجوة',   premise: 'التاجر يوصّل بسرعة فعلاً — لكن لا أحد يستطيع رؤية ذلك.' },
  2: { name: 'التحوّل',  premise: 'أدوات تجعل ما يفعله التاجر مرئياً — فيصبح الوعد قابلاً للعرض.' },
  3: { name: 'ما على المحك', premise: 'الوعد صار جزءاً من متجره. ماذا يحدث لو توقّف؟' },
};

export const CHAPTERS: Chapter[] = [
  /* ══ Act 1 — the gap ══════════════════════════════════════ */
  {
    id: 'today', act: 1,
    moment: 'أنت توصّل بنفسك، وبسرعة',
    narration: 'مناديبك يخرجون من الفرع كل يوم ويصلون خلال ساعة. لكن سلة لا ترى شيئاً من ذلك — لا حالة طلب، ولا تحقّق قبل الخروج، ولا خريطة.',
    delta: null,
    promise: 'off',
    source: 'بيان المشكلة — مناديب التاجر لا يحدّثون حالة الطلب، ولا تحقّق، ولا تتبع مباشر',
    strip: null,
  },
  {
    id: 'consequence', act: 1,
    moment: 'ولهذا لا يظهر وعد الساعتين لعميلك',
    narration: 'وعد «التوصيل خلال ساعتين» تعرضه سلة نيابةً عنك عند الدفع، ولذلك تعرضه فقط حيث تستطيع التحقق منه. اخترتَ «مناديب المتجر» — والوعد بقي مطفأً.',
    delta: 'اخترتَ مناديب المتجر · الوعد غير قابل للعرض',
    promise: 'off',
    source: 'بيان المشكلة — الوعد مملوك لسلة، وتاجر واحد يخلّ به يضرّ الثقة في التجربة كاملة',
    strip: null,
  },
  {
    id: 'offer', act: 1,
    moment: 'القطعة الناقصة تظهر هنا',
    narration: 'في اللحظة نفسها التي اخترتَ فيها مناديبك، يظهر طيّار — لا كإعلان، بل كالأداة التي تجعل ما تفعله مرئياً. أسبوع مجاني يشمل التجهيز والتوصيل.',
    delta: 'ظهر عرض طيّار في سياق القرار',
    promise: 'off',
    source: 'ST1 — بطاقة طيّار السياقية عند اختيار «مناديب المتجر»',
    strip: s({
      id: 'offer', story: 'ST1', tone: 'offer', title: OFFER_TITLE, desc: OFFER_DESC,
      altTitle: ALT_TITLE, altDesc: ALT_DESC,
      tag: { text: 'تجربة مجانية لمدة أسبوع', kind: 'gift' },
      cta: { text: 'تفعيل طيّار', kind: 'activate' },
      note: `الأسبوع المجاني يشمل تجهيز الطلب والتوصيل. بعده يبدأ الاشتراك من ${sar(5)} — بدون خصم تلقائي.`,
    }),
  },

  /* ══ Act 2 — the turn ═════════════════════════════════════ */
  {
    id: 'activating', act: 2,
    moment: 'ضغطة واحدة، من مكانك',
    narration: 'لا تحويل لموقع خارجي، ولا حساب جديد، ولا بطاقة. التفعيل يحدث داخل لوحة تحكمك وأنت في منتصف الإعداد.',
    delta: 'بدأ التفعيل داخل اللوحة',
    promise: 'activating',
    source: 'ST2 — التفعيل من لوحة التحكم مباشرة، بدون تحويل لخدمة خارجية',
    strip: s({
      id: 'activating', story: 'ST2', tone: 'offer', title: OFFER_TITLE,
      desc: 'جارٍ تفعيل طيّار على متجرك — بدون تحويل لأي خدمة خارجية.',
      altTitle: ALT_TITLE, altDesc: 'جارٍ التفعيل داخل لوحة تحكمك.',
      tag: { text: 'تجربة مجانية لمدة أسبوع', kind: 'gift' },
      cta: { text: 'جارٍ التفعيل…', kind: 'activate' }, loading: true,
    }),
  },
  {
    id: 'first-courier', act: 2,
    moment: 'أول مندوب يظهر على الخريطة',
    narration: 'أسندتَ أول طلب لمندوبك من داخل سلة. للمرة الأولى، تعرف أين هو — وكذلك عميلك.',
    delta: 'المندوب مرئي · حالة الطلب تصل تلقائياً',
    promise: 'on',
    source: 'الوصف — إسناد وإدارة المناديب، وتتبع كل مندوب على خريطة لحظية',
    strip: s({
      id: 'first-courier', story: 'ST3', tone: 'success',
      title: 'أول مندوب على الخريطة',
      desc: 'أسندتَ أول طلب لمندوبك — وظهر موقعه لحظة خروجه من الفرع، لك ولعميلك.',
      tag: { text: 'التتبع المباشر يعمل', kind: 'ok' },
      cta: { text: 'فتح الخريطة', kind: 'manage' },
    }),
  },
  {
    id: 'first-verify', act: 2,
    moment: 'الباركود أوقف الطلب الخطأ',
    narration: 'قبل طباعة البوليصة، مسح مندوبك باركود الطلب. لم يتطابق — فلم يغادر الطلب الخطأ الفرع، ولم يصل لعميل لا ينتظره.',
    delta: 'تحقّق قبل الخروج · مرتجع لم يحدث',
    promise: 'on',
    source: 'الوصف — التحقق من كل طلب بالباركود قبل طباعة البوليصة',
    strip: s({
      id: 'first-verify', story: 'ST3', tone: 'success',
      title: 'الطلب الخطأ لم يغادر الفرع',
      desc: 'تحقّق الباركود قبل طباعة البوليصة أوقف طلباً غير مطابق — قبل أن يتحوّل إلى مرتجع.',
      tag: { text: 'التحقق يعمل', kind: 'ok' },
      cta: { text: 'سجل التحقق', kind: 'manage' },
    }),
  },
  {
    id: 'first-delivery', act: 2,
    moment: 'أول توصيلة يراها عميلك لحظة بلحظة',
    narration: 'وصل الطلب خلال ساعة وسبع دقائق. تابعه عميلك على الخريطة من لحظة الخروج — وظهر وعد الساعتين على متجرك للمرة الأولى.',
    delta: 'وعد الساعتين ظاهر عند الدفع لأول مرة',
    promise: 'on',
    source: 'ST3 — طيّار كطريقة تنفيذ تستوفي وعد التوصيل السريع لهذا الفرع',
    strip: s({
      id: 'first-delivery', story: 'ST3', tone: 'success',
      title: 'مناديبك يستوفون وعد الساعتين',
      desc: 'تحديث حالة الطلب، التحقق بالباركود، والتتبع المباشر — الثلاثة تعمل. الوعد يظهر لعميلك عند الدفع.',
      tag: { text: 'يستوفي وعد التوصيل', kind: 'ok' },
      cta: { text: 'إدارة طيّار', kind: 'manage' },
    }),
  },

  /* ══ Act 3 — the stakes ═══════════════════════════════════ */
  {
    id: 'week', act: 3,
    moment: 'أسبوعك الأول',
    narration: 'فروعك الثلاثة تعمل من حساب واحد، والوعد ظاهر على متجرك طوال الأسبوع. تبقّت أربعة أيام من التجربة.',
    delta: 'الفروع الثلاثة تعمل · ٤ أيام متبقية',
    promise: 'on',
    source: 'ST4 — رسالة الأيام المتبقية · الوصف: إدارة عدة متاجر من حساب واحد',
    strip: s({
      id: 'week', story: 'ST4', tone: 'neutral',
      title: 'تجربة طيّار فعّالة',
      desc: `فروعك الثلاثة تعمل من حساب واحد، ووعد الساعتين يظهر لعملائك عند الدفع.`,
      tag: { text: `${n(4)} أيام متبقية`, kind: 'ok' },
      cta: { text: 'إدارة طيّار', kind: 'manage' },
    }),
  },
  {
    id: 'ending', act: 3,
    moment: 'التجربة تنتهي غداً',
    narration: 'الآن تعرف ما الذي ستفقده — لأنك جرّبته أسبوعاً كاملاً. لن يُخصم أي مبلغ تلقائياً؛ القرار قرارك.',
    delta: 'الوعد مهدَّد · قرار مطلوب',
    promise: 'risk',
    source: 'ST4 — تنبيه قرب الانتهاء · بدون خصم تلقائي',
    strip: s({
      id: 'ending', story: 'ST4', tone: 'warning',
      title: 'تنتهي تجربة طيّار غداً',
      desc: 'استمر للحفاظ على ظهور وعد الساعتين على فروع مناديبك — بدون خصم تلقائي، القرار لك.',
      tag: { text: 'يوم واحد متبقٍ', kind: 'warn' },
      cta: { text: `الاستمرار من ${sar(5)}`, kind: 'subscribe' }, secondary: 'تذكيري لاحقاً',
    }),
  },
  {
    id: 'converted', act: 3,
    moment: 'قررتَ الاستمرار',
    narration: 'من خمسة ريالات شهرياً، بقيت أدواتك كما هي وبقي الوعد ظاهراً. ما تغيّر ليس سرعتك — بل قدرة سلة على إثباتها.',
    delta: 'اشتراك مدفوع · الوعد مستمر',
    promise: 'on',
    source: 'ST4 — نقطة الدخول المدفوعة من ٥ ر.س',
    strip: s({
      id: 'converted', story: 'ST4', tone: 'success',
      title: 'اشتراك طيّار فعّال',
      desc: 'مناديبك مغطّون بالكامل — تحديث الحالة، التحقق بالباركود، والتتبع المباشر.',
      tag: { text: 'مدفوع', kind: 'ok' },
      cta: { text: 'إدارة طيّار', kind: 'manage' },
    }),
  },
];

/* ── Branches off the main arc ─────────────────────────────── */
export const BRANCHES: Chapter[] = [
  {
    id: 'failed', act: 2, branchOf: 'activating',
    moment: 'ماذا لو تعثّر التفعيل؟',
    narration: 'لا شيء يتغيّر. لا اشتراك مسجّل، ولا حالة نصف مفعّلة، ولا إعداد ضائع — فقط زر لإعادة المحاولة.',
    delta: 'فشل التفعيل · لا تغيير في الإعدادات',
    promise: 'off',
    source: 'ST2 — حالة الفشل: لا تُترك حالة نصف مفعّلة',
    strip: s({
      id: 'failed', story: 'ST2', tone: 'danger',
      title: 'تعذّر تفعيل طيّار',
      desc: 'لم يتغيّر أي شيء في إعداداتك ولم نسجّل أي اشتراك أو تجربة على متجرك.',
      cta: { text: 'إعادة المحاولة', kind: 'retry' }, secondary: 'لاحقاً',
    }),
  },
  {
    id: 'lapsed', act: 3, branchOf: 'ending',
    moment: 'وماذا لو لم تستمر؟',
    narration: 'فروعك تبقى ضمن التوصيل السريع ولا يتغيّر أي إعداد — لكن وعد الساعتين يتوقف عن الظهور لعميلك، لأننا لم نعد نستطيع التحقق منه.',
    delta: 'الوعد موقوف · الفروع باقية',
    promise: 'suspended',
    source: 'ST4 + سؤال مفتوح ٣ — ماذا يحدث عند انتهاء التجربة دون تحويل؟',
    strip: s({
      id: 'lapsed', story: 'ST4', tone: 'warning',
      title: 'انتهت تجربة طيّار',
      desc: 'فروعك ما زالت ضمن التوصيل السريع ولم يتغيّر أي إعداد — لكن وعد الساعتين لا يظهر لعميلك حتى تُعيد التفعيل.',
      tag: { text: 'الوعد موقوف', kind: 'danger' },
      cta: { text: `إعادة التفعيل من ${sar(5)}`, kind: 'subscribe' },
      note: 'سؤال مفتوح للـ PM — هل تُخفَّض فروع المناديب أم يُوقَف الوعد فقط؟',
    }),
  },
  {
    id: 'locked', act: 1, branchOf: 'offer',
    moment: 'وماذا لو كانت باقتك لا تشمله؟',
    narration: 'التوصيل السريع عبر مناديبك متاح في باقتَي برو والخاصة، مثل بقية التجربة. تظهر لك طريق الترقية، لا طريق مسدود.',
    delta: 'باقة غير مؤهلة · مسار ترقية',
    promise: 'off',
    source: 'النطاق — متاح لباقتَي Pro و Special',
    strip: s({
      id: 'locked', story: 'Scope', tone: 'locked', title: OFFER_TITLE,
      desc: 'التوصيل السريع عبر مناديبك متاح في باقتَي برو والخاصة، مثل بقية تجربة التوصيل السريع.',
      altTitle: ALT_TITLE, altDesc: 'متاح في باقتَي برو والخاصة.',
      tag: { text: 'برو والخاصة', kind: 'muted' },
      cta: { text: 'ترقية الباقة', kind: 'upgrade' }, secondary: 'المتابعة بدون طيّار',
    }),
  },
  {
    id: 'carrier', act: 1, branchOf: 'consequence',
    moment: 'وماذا لو اخترتَ شركة شحن خارجية؟',
    narration: 'لا شيء من هذا يظهر. شركة الشحن تحدّث الحالة بنفسها، فلا فجوة تُسدّ ولا عرض يُعرض.',
    delta: 'لا يظهر أي شريط',
    promise: 'on',
    source: 'خارج النطاق — تدفق مزودي الشحن غير المناديب دون تغيير',
    strip: null,
  },
];

export const ALL_CHAPTERS = [...CHAPTERS, ...BRANCHES];
export const CHAPTER_BY_ID = Object.fromEntries(ALL_CHAPTERS.map((c) => [c.id, c]));

export const PROMISE_META: Record<Promise, { label: string; tone: string; dot: string }> = {
  off:        { label: 'وعد الساعتين لا يظهر لعميلك', tone: 'text-salla-text-2',       dot: 'bg-salla-border' },
  activating: { label: 'جارٍ التفعيل…',                tone: 'text-salla-text-2',       dot: 'bg-salla-warning-500 animate-pulse' },
  on:         { label: 'وعد الساعتين يظهر لعميلك',     tone: 'text-salla-success-700',  dot: 'bg-salla-success-500' },
  risk:       { label: 'وعد الساعتين مهدَّد',           tone: 'text-salla-warning-700',  dot: 'bg-salla-warning-500' },
  suspended:  { label: 'وعد الساعتين موقوف',            tone: 'text-salla-danger-700',   dot: 'bg-salla-danger-500' },
};
