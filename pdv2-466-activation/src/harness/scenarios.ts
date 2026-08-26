import type { Branch, MerchantState } from '../domain/merchantState';

/** Named stores that exercise each branch of the logic. Dev harness only. */
const branch = (id: string, name: string, city: string, country: Branch['country'], linked: boolean): Branch =>
  ({ id, name, city, country, linkedToSaudiMarket: linked, pickupEnabled: false, deliveryEnabled: false });

const FOUR_KSA = [
  branch('r', 'فرع الرياض',      'الرياض',  'SA', false),
  branch('j', 'فرع جدة',         'جدة',     'SA', false),
  branch('m', 'فرع مكة المكرمة', 'مكة',     'SA', true),
  branch('d', 'فرع الدمام',      'الدمام',  'SA', false),
];
const ONE_KSA  = [branch('r', 'فرع الرياض', 'الرياض', 'SA', true)];
const NO_KSA   = [branch('x', 'فرع دبي', 'دبي', 'AE', false), branch('y', 'فرع الكويت', 'الكويت', 'KW', false)];
const MIXED    = [...FOUR_KSA.slice(0, 2), branch('x', 'فرع دبي', 'دبي', 'AE', false)];

const base: MerchantState = {
  mrsool: 'inactive', multiMarkets: true, branches: FOUR_KSA,
  feesRequireConsent: false, forcePartialFailure: false,
};
const S = (o: Partial<MerchantState>): MerchantState => ({ ...base, ...o });

export interface Scenario { id: string; label: string; note: string; state: MerchantState }

export const SCENARIOS: Scenario[] = [
  { id: 'happy',        label: 'الحالة الأساسية',            note: 'مرسول غير مفعّل · تعدّد أسواق · ٤ فروع غير مرتبطة', state: S({}) },
  { id: 'mrsool-on',    label: 'مرسول مفعّل مسبقاً',          note: 'خطوة التفعيل تُحذف من الخطة',                       state: S({ mrsool: 'active' }) },
  { id: 'routes',       label: 'مسارات متعارضة',             note: 'يحجب المتابعة حتى يقرّر التاجر',                    state: S({ mrsool: 'conflicting-routes' }) },
  { id: 'no-markets',   label: 'بدون تعدّد الأسواق',          note: 'تفعيل أداة تعدّد الفروع بدل ربط السوق',             state: S({ multiMarkets: false }) },
  { id: 'linked',       label: 'الفروع مرتبطة مسبقاً',        note: 'خطوة الربط تُحذف من الخطة',                         state: S({ branches: FOUR_KSA.map((b) => ({ ...b, linkedToSaudiMarket: true })) }) },
  { id: 'one-branch',   label: 'فرع سعودي واحد',             note: 'الاستلام والتوصيل لا يُفعَّلان تلقائياً',            state: S({ branches: ONE_KSA }) },
  { id: 'no-branch',    label: 'لا فروع سعودية',             note: 'التفعيل محجوب — حالة فارغة',                        state: S({ branches: NO_KSA }) },
  { id: 'mixed',        label: 'فروع مختلطة',                note: 'الفروع خارج السعودية تُستبعد وتُذكر',                state: S({ branches: MIXED }) },
  { id: 'fees',         label: 'رسوم تتطلّب موافقة',          note: 'متغيّر مشروط — معطّل افتراضياً',                     state: S({ feesRequireConsent: true }) },
  { id: 'partial',      label: 'فشل جزئي',                   note: 'آخر خطوة لكل فرع تتعثّر على آخر فرع',               state: S({ forcePartialFailure: true }) },
  { id: 'partial-nomk', label: 'فشل جزئي · بدون تعدّد أسواق', note: 'يجمع أصعب مسارين',                                  state: S({ multiMarkets: false, forcePartialFailure: true }) },
];
