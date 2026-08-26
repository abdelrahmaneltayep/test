import { n, sar } from './num';

/**
 * Every case below traces to a line in the PDV2-422 brief.
 * `story` names which ST it belongs to; `source` quotes the requirement it satisfies.
 */
export type Tone = 'offer' | 'success' | 'warning' | 'danger' | 'neutral' | 'locked';
export type CtaKind = 'activate' | 'subscribe' | 'upgrade' | 'manage' | 'retry' | 'none';

export interface CaseDef {
  id: string;
  story: 'ST1' | 'ST2' | 'ST3' | 'ST4' | 'Scope';
  label: string;              // switcher label
  source: string;             // the requirement this case exists to satisfy
  tone: Tone;
  hidden?: boolean;           // strip not rendered at all
  title: string;
  desc: string;
  tag?: { text: string; kind: 'gift' | 'ok' | 'warn' | 'danger' | 'muted' };
  cta?: { text: string; kind: CtaKind };
  secondary?: string;
  note?: string;              // small print under the strip
  loading?: boolean;
  /** Alternate headline for the product-led option (Option 2). */
  altTitle?: string;
  altDesc?: string;
}

const OFFER_TITLE = 'إدارة المناديب باحترافية مع تطبيق طيّار';
const OFFER_DESC  = 'استخدم تطبيق طيار لتوزيع الطلبات آلياً على مناديبك، تتبع مساراتهم، وضمان الوفاء بوعد الشحن السريع لعملائك.';
const ALT_TITLE   = 'طيّار جاهز لإدارة مناديبك';
const ALT_DESC    = 'نظام ذكي لإدارة أسطول المناديب، إسناد الطلبات، التتبع المباشر، والتقارير — عبر لوحة تحكم موحدة.';
const TRIAL_TAG   = { text: 'تجربة مجانية لمدة أسبوع', kind: 'gift' as const };

export const CASES: CaseDef[] = [
  /* ── ST1 · the contextual cross-sell card ─────────────────── */
  {
    id: 'default', story: 'ST1', label: 'العرض الافتراضي',
    source: 'ST1 — بطاقة طيّار السياقية عند اختيار «مناديب المتجر»',
    tone: 'offer', title: OFFER_TITLE, desc: OFFER_DESC, altTitle: ALT_TITLE, altDesc: ALT_DESC,
    tag: TRIAL_TAG, cta: { text: 'تفعيل طيّار', kind: 'activate' },
    note: `الأسبوع المجاني يشمل تجهيز الطلب والتوصيل. بعده يبدأ الاشتراك من ${sar(5)} — بدون خصم تلقائي.`,
  },
  {
    id: 'locked', story: 'Scope', label: 'باقة غير مؤهلة',
    source: 'Scope — متاح لباقتَي Pro و Special فقط',
    tone: 'locked', title: OFFER_TITLE, desc: 'التوصيل السريع عبر مناديبك متاح في باقتَي برو والخاصة، مثل بقية تجربة التوصيل السريع.',
    altTitle: ALT_TITLE, altDesc: 'متاح في باقتَي برو والخاصة.',
    tag: { text: 'برو والخاصة', kind: 'muted' }, cta: { text: 'ترقية الباقة', kind: 'upgrade' },
    secondary: 'المتابعة بدون طيّار',
  },
  {
    id: 'installed', story: 'ST1', label: 'طيّار مفعّل مسبقاً',
    source: 'ST1 — لا يُعرض عرض على تاجر يملك التطبيق أصلاً',
    tone: 'neutral', title: 'طيّار مفعّل على متجرك', desc: 'مناديبك مرتبطون بالفعل — لا حاجة لأي إعداد إضافي لهذا الفرع.',
    tag: { text: 'مفعّل', kind: 'ok' }, cta: { text: 'إدارة طيّار', kind: 'manage' },
  },
  {
    id: 'trial-used', story: 'ST4', label: 'التجربة مُستخدَمة سابقاً',
    source: 'ST4 — نقطة الدخول المدفوعة من ٥ ر.س',
    tone: 'offer', title: OFFER_TITLE, desc: OFFER_DESC, altTitle: ALT_TITLE, altDesc: ALT_DESC,
    tag: { text: 'التجربة مُستخدَمة', kind: 'muted' },
    cta: { text: `الاشتراك من ${sar(5)}`, kind: 'subscribe' },
    note: 'استُخدمت التجربة المجانية سابقاً على هذا المتجر.',
  },
  {
    id: 'multi-branch', story: 'ST1', label: 'عدة فروع من حساب واحد',
    source: 'الوصف — إدارة عدة متاجر من حساب واحد',
    tone: 'offer', title: OFFER_TITLE,
    desc: `تفعيل واحد يغطي فروعك الثلاثة — الرياض وجدة ومكة المكرمة — من حساب واحد.`,
    altTitle: ALT_TITLE, altDesc: `حساب واحد يدير مناديب ${n(3)} فروع.`,
    tag: TRIAL_TAG, cta: { text: 'تفعيل طيّار', kind: 'activate' },
    note: `يشمل ${n(3)} فروع محددة.`,
  },

  /* ── ST2 · one-week free-trial activation ─────────────────── */
  {
    id: 'activating', story: 'ST2', label: 'جارٍ التفعيل',
    source: 'ST2 — التفعيل من لوحة التحكم مباشرة، بدون تحويل خارجي',
    tone: 'offer', title: OFFER_TITLE, desc: 'جارٍ تفعيل طيّار على متجرك — بدون تحويل لأي خدمة خارجية.',
    altTitle: ALT_TITLE, altDesc: 'جارٍ التفعيل داخل لوحة تحكمك.',
    tag: TRIAL_TAG, cta: { text: 'جارٍ التفعيل…', kind: 'activate' }, loading: true,
  },
  {
    id: 'error', story: 'ST2', label: 'فشل التفعيل',
    source: 'ST2 — حالة فشل: لا تُترك حالة نصف مفعّلة',
    tone: 'danger', title: 'تعذّر تفعيل طيّار',
    desc: 'لم يتغيّر أي شيء في إعداداتك ولم نسجّل أي اشتراك أو تجربة على متجرك.',
    cta: { text: 'إعادة المحاولة', kind: 'retry' }, secondary: 'لاحقاً',
  },

  /* ── ST3 · post-activation state ──────────────────────────── */
  {
    id: 'activated', story: 'ST3', label: 'بعد التفعيل',
    source: 'ST3 — طيّار كطريقة تنفيذ تستوفي وعد التوصيل السريع لهذا الفرع',
    tone: 'success', title: 'طيّار مفعّل — مناديبك يستوفون وعد الساعتين',
    desc: 'تحديث حالة الطلب، التحقق بالباركود قبل طباعة البوليصة، والتتبع المباشر على الخريطة — كلها تعمل الآن.',
    tag: { text: 'يستوفي وعد التوصيل', kind: 'ok' }, cta: { text: 'إدارة طيّار', kind: 'manage' },
  },

  /* ── ST4 · trial lifecycle ────────────────────────────────── */
  {
    id: 'trial-started', story: 'ST4', label: 'بدأت التجربة',
    source: 'ST4 — رسالة «بدأت التجربة»',
    tone: 'success', title: 'بدأت تجربتك المجانية',
    desc: `تنتهي في ${n(31)} أغسطس ${n(2026)} — تشمل تجهيز الطلب والتوصيل. سنذكّرك قبل انتهائها.`,
    tag: { text: `${n(7)} أيام متبقية`, kind: 'ok' }, cta: { text: 'إدارة طيّار', kind: 'manage' },
  },
  {
    id: 'trial-mid', story: 'ST4', label: 'أيام متبقية',
    source: 'ST4 — رسالة «الأيام المتبقية»',
    tone: 'neutral', title: 'تجربة طيّار فعّالة',
    desc: 'مناديبك يستوفون متطلبات وعد الساعتين، والوعد يظهر لعملائك عند الدفع.',
    tag: { text: `${n(4)} أيام متبقية`, kind: 'ok' }, cta: { text: 'إدارة طيّار', kind: 'manage' },
  },
  {
    id: 'trial-ending', story: 'ST4', label: 'تنتهي قريباً',
    source: 'ST4 — تنبيه قرب الانتهاء',
    tone: 'warning', title: 'تنتهي تجربة طيّار غداً',
    desc: `استمر للحفاظ على ظهور وعد الساعتين على فروع مناديبك — بدون خصم تلقائي، القرار لك.`,
    tag: { text: `يوم واحد متبقٍ`, kind: 'warn' },
    cta: { text: `الاستمرار من ${sar(5)}`, kind: 'subscribe' }, secondary: 'تذكيري لاحقاً',
  },
  {
    id: 'trial-ended', story: 'ST4', label: 'انتهت التجربة',
    source: 'ST4 — «انتهت التجربة» + سؤال مفتوح ٣: حماية الوعد بعد الانتهاء',
    tone: 'warning', title: 'انتهت تجربة طيّار',
    desc: 'فروعك ما زالت ضمن التوصيل السريع ولم يتغيّر أي إعداد — لكن وعد الساعتين لا يظهر لعميلك حتى تُعيد التفعيل.',
    tag: { text: 'الوعد موقوف', kind: 'danger' },
    cta: { text: `إعادة التفعيل من ${sar(5)}`, kind: 'subscribe' },
    note: 'سؤال مفتوح للـ PM — هل تُخفَّض فروع المناديب أم يُوقَف الوعد فقط؟',
  },
  {
    id: 'paid', story: 'ST4', label: 'اشتراك مدفوع',
    source: 'ST4 — نقطة الدخول المدفوعة من ٥ ر.س',
    tone: 'success', title: 'اشتراك طيّار فعّال',
    desc: 'مناديبك مغطّون بالكامل — تحديث الحالة، التحقق بالباركود، والتتبع المباشر.',
    tag: { text: 'مدفوع', kind: 'ok' }, cta: { text: 'إدارة طيّار', kind: 'manage' },
  },

  /* ── Scope · not applicable ───────────────────────────────── */
  {
    id: 'carrier', story: 'Scope', label: 'شركة شحن خارجية (لا يظهر)',
    source: 'خارج النطاق — مزودو الشحن غير المناديب دون تغيير',
    tone: 'neutral', hidden: true, title: '', desc: '',
  },
];

export const CASE_BY_ID = Object.fromEntries(CASES.map((c) => [c.id, c]));
export const STORY_GROUPS = ['ST1', 'ST2', 'ST3', 'ST4', 'Scope'] as const;
