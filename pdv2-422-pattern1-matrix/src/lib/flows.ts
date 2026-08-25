import { BASE_BRANCHES, type FlowState } from '../store/store';

export interface FlowDef { id: string; family: 'A' | 'B' | 'C' | 'D'; name: string; desc: string; state: FlowState }

const b = () => BASE_BRANCHES.map((x) => ({ ...x }));
const base: FlowState = {
  plan: 'pro', countryAvailable: true, alreadyActive: false, trialExpired: false,
  returnVisit: false, promo: false, perBranch: false, branches: b(),
  forcedError: 'none', entry: 'صفحة التوصيل السريع',
};
const f = (o: Partial<FlowState>): FlowState => ({ ...base, branches: b(), ...o });

export const FLOW_FAMILIES = {
  A: 'التفعيل لأول مرة',
  B: 'تعدد الفروع',
  C: 'الباقة والأهلية',
  D: 'الأخطاء والتعافي',
} as const;

export const FLOWS: FlowDef[] = [
  // ── A · First-time activation ───────────────────────────────
  { id: 'F1',  family: 'A', name: 'تفعيل مباشر من صفحة التوصيل السريع', desc: 'أول زيارة · اختار «شحن خاص» · نقرة واحدة', state: f({}) },
  { id: 'F2',  family: 'A', name: 'تفعيل من معالج الإعداد', desc: 'الخطوة ٤ من معالج التوصيل السريع', state: f({ entry: 'معالج الإعداد · الخطوة ٤' }) },
  { id: 'F3',  family: 'A', name: 'تفعيل في زيارة عائدة', desc: 'زار سابقاً ولم يفعّل — نسخة أليَن', state: f({ returnVisit: true, entry: 'زيارة عائدة' }) },
  { id: 'F4',  family: 'A', name: 'تفعيل عبر حملة ترويجية', desc: 'رابط بريد ‎?promo=tayaar50‎ — الرصيد المجاني مبرَز', state: f({ promo: true, entry: 'حملة بريدية' }) },
  { id: 'F5',  family: 'A', name: 'تفعيل من الحالة الفارغة في الطلبات', desc: 'تبويب «بانتظار تعيين مندوب»', state: f({ entry: 'الطلبات · بانتظار مندوب' }) },

  // ── B · Multi-branch ────────────────────────────────────────
  { id: 'F6',  family: 'B', name: 'كل الفروع — تفعيل واحد', desc: '٣ فروع محددة · التفعيل يشملها كلها', state: f({}) },
  { id: 'F7',  family: 'B', name: 'مجموعة فرعية — تفعيل محدود', desc: 'الرياض فقط عبر التخصيص لكل فرع', state: f({ perBranch: true, branches: b().map((x) => ({ ...x, provider: x.id === 'r' ? 'private' : 'salla' })) }) },
  { id: 'F8',  family: 'B', name: 'تخصيص لكل فرع مفعّل', desc: 'جدول بصف تفعيل لكل فرع', state: f({ perBranch: true }) },
  { id: 'F9',  family: 'B', name: 'فرع خارج التغطية', desc: 'مكة خارج نطاق طيّار — ٢ مؤهلان', state: f({ branches: b().map((x) => ({ ...x, eligible: x.id !== 'm' })) }) },
  { id: 'F10', family: 'B', name: 'مزودون مختلطون', desc: 'بعض الفروع بوليصات سلة وبعضها شحن خاص', state: f({ branches: b().map((x) => ({ ...x, provider: x.id === 'j' ? 'salla' : 'private' })) }) },

  // ── C · Plan / eligibility ──────────────────────────────────
  { id: 'F11', family: 'C', name: 'تاجر Pro — تفعيل مباشر', desc: 'السطح مفعّل بالكامل', state: f({ plan: 'pro' }) },
  { id: 'F12', family: 'C', name: 'تاجر Basic — ترقية ثم تفعيل', desc: 'حالة مقفلة · نقرة تفتح الترقية', state: f({ plan: 'basic' }) },
  { id: 'F13', family: 'C', name: 'الدولة غير مدعومة', desc: 'السطح مخفي · سطر معلومات فقط', state: f({ countryAvailable: false }) },
  { id: 'F14', family: 'C', name: 'مفعّل مسبقاً', desc: 'شريط الملخّص فقط + رابط الإدارة', state: f({ alreadyActive: true, branches: b().map((x) => ({ ...x, activated: true })) }) },
  { id: 'F15', family: 'C', name: 'انتهت التجربة — إعادة تفعيل', desc: 'تفعيل مدفوع من ٥ ر.س لكل فرع', state: f({ trialExpired: true }) },

  // ── D · Error & recovery ────────────────────────────────────
  { id: 'F16', family: 'D', name: 'خطأ شبكة عند التفعيل', desc: 'AlertBox مضمّن + إعادة محاولة', state: f({ forcedError: 'network' }) },
  { id: 'F17', family: 'D', name: 'خطأ خادم — دعم فني', desc: '٥٠٠ · إعادة محاولة + رابط الدعم', state: f({ forcedError: 'server' }) },
  { id: 'F18', family: 'D', name: 'نجاح جزئي', desc: 'فرعان نجحا وفرع فشل', state: f({ forcedError: 'partial' }) },
  { id: 'F19', family: 'D', name: 'تراجع خلال ٥ ثوانٍ', desc: 'نافذة إلغاء بعد التفعيل مباشرة', state: f({}) },
  { id: 'F20', family: 'D', name: 'إخفاء ثم تذكير في الطلبات', desc: 'إخفاء ٢٤ ساعة · إعادة العرض في الطلبات', state: f({ entry: 'إخفاء سابق · إعادة تذكير' }) },
];

export const FLOW_BY_ID = Object.fromEntries(FLOWS.map((x) => [x.id, x]));
