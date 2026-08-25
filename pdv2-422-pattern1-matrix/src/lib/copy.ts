/**
 * One shared copy set across all 20 layouts — PRD §9 Q1 recommends this so
 * activation-rate deltas are attributable to layout, not wording.
 * Strings transcribed from the two reference designs.
 */
export const COPY = {
  // Reference #1 — the inline checkbox (L6 anchor)
  inlineTitle: 'إدارة المناديب باحترافية مع تطبيق طيار',
  inlineDesc:
    'استخدم تطبيق طيار لتوزيع الطلبات آلياً على مناديبك، تتبع مساراتهم، وضمان الوفاء بوعد الشحن السريع لعملائك.',

  // Reference #2 — the hero banner (L1 anchor)
  heroKicker: 'تابع مناديبك وطلباتك بكفاءة',
  heroKickerDesc: 'لضمان التوصيل السريع لعملائك، اربط متجرك بأفضل تطبيقات إدارة الطلبات والأساطيل.',
  heroTitle: 'طيّار جاهز لإدارة مناديبك',
  heroDesc: 'نظام ذكي لإدارة أسطول المناديب، إسناد الطلبات، التتبع المباشر، والتقارير — عبر لوحة تحكم موحدة.',

  // Shared
  recommended: 'موصى به',
  creditOffer: 'عرض حصري: ٥٠ ر.س رصيد مجاني',
  ctaInstall: 'تثبيت طيّار',
  ctaActivate: 'فعّل مجاناً',
  ctaActivateNow: 'فعّل الآن',
  ctaRetry: 'حاول مرة أخرى',
  ctaManage: 'إدارة تيار',
  short: 'طيار — الخيار الموصى به · فعّل بنقرة',
  oneLiner: 'طيّار لإدارة مناديبك — فعّل بنقرة واحدة',

  // Post-activation
  toastSuccess: 'تم تفعيل طيّار — تجربتك المجانية بدأت',
  toastRollback: 'تم إلغاء تفعيل تيار',
  stripTitle: 'طيّار مفعّل على مناديبك',
  stripDesc: 'إسناد آلي للطلبات، تتبع مباشر للمناديب، وتقارير — من لوحة تحكم موحدة.',

  // Flow-specific overrides
  returnVisit: 'لا تزال تجربتك المجانية متاحة — فعّل بنقرة.',
  lockedPlan: 'متاح لباقات Pro و Special',
  notAvailable: 'طيار غير متاح في بلدك حالياً — قريباً.',
  trialExpired: 'انتهت تجربتك — فعّل من ٥ ر.س لكل فرع شهرياً',
  errNetwork: 'تعذّر الاتصال — حاول مرة أخرى',
  errServer: 'حدث خطأ من جانبنا — حاول لاحقاً أو تواصل مع الدعم',
} as const;
