/** All data here is mocked for the prototype. Nothing is fetched. */

export interface Branch { id: string; name: string; city: string; provider: 'salla' | 'private'; sub: SubProvider }
export type SubProvider = '' | 'carrier' | 'own' | 'both';

export const BRANCHES: Branch[] = [
  { id: 'b1', name: 'فرع الرياض',      city: 'الرياض · العليا',   provider: 'salla', sub: '' },
  { id: 'b2', name: 'فرع جدة',         city: 'جدة · الروضة',      provider: 'salla', sub: '' },
  { id: 'b3', name: 'فرع مكة المكرمة', city: 'مكة · العزيزية',    provider: 'salla', sub: '' },
];

export const SUB_PROVIDERS: { value: SubProvider; label: string }[] = [
  { value: '',        label: 'اختر المزود' },
  { value: 'carrier', label: 'شركة شحن خارجية' },
  { value: 'own',     label: 'مناديب متجري' },
  { value: 'both',    label: 'كلاهما معًا' },
];

/** The three Quick Delivery promise requirements own couriers cannot meet alone. */
export const REQUIREMENTS = [
  { id: 'status',   title: 'تحديث حالة الطلب',          desc: 'تصل حالة الطلب لسلة وللعميل لحظة بلحظة' },
  { id: 'verify',   title: 'التحقق من الطلب قبل الخروج', desc: 'التأكد أن الطلب الصحيح غادر الفرع قبل طباعة البوليصة' },
  { id: 'tracking', title: 'التتبع المباشر للمندوب',     desc: 'يرى العميل مندوبه، وترى أسطولك على الخريطة' },
];

export const TAYAAR_CAPABILITIES = [
  'إسناد وإدارة مندوبيك الخاصين',
  'التحقق من كل طلب بالباركود قبل الطباعة',
  'إدارة عدة متاجر من حساب واحد',
  'تحديثات حالة مباشرة على الطلب',
  'تتبع كل مندوب على خريطة لحظية',
  'بدون أي إعداد خارجي — كل شيء داخل سلة',
];

export interface PartnerApp {
  id: string; name: string; monogram: string; category: 'shipping' | 'payments' | 'marketing';
  tagline: string; rating: number; installs: number; price: string; recommended?: boolean;
}

export const PARTNER_APPS: PartnerApp[] = [
  { id: 'tayaar',   name: 'طيّار',      monogram: 'ط', category: 'shipping',  tagline: 'إدارة مناديبك الخاصين وتتبعهم مباشرة', rating: 4.7, installs: 1840, price: 'من 5 ر.س', recommended: true },
  { id: 'shipper',  name: 'شحن بلس',    monogram: 'ش', category: 'shipping',  tagline: 'مقارنة أسعار شركات الشحن تلقائيًا',   rating: 4.3, installs: 920,  price: 'من 15 ر.س' },
  { id: 'trackme',  name: 'تتبّع',       monogram: 'ت', category: 'shipping',  tagline: 'صفحة تتبع مخصّصة بهوية متجرك',        rating: 4.1, installs: 610,  price: 'مجاني' },
  { id: 'paylater', name: 'قسّطها',      monogram: 'ق', category: 'payments',  tagline: 'الدفع الآجل داخل صفحة الدفع',         rating: 4.6, installs: 2300, price: 'عمولة' },
  { id: 'wallet',   name: 'محفظتي',      monogram: 'م', category: 'payments',  tagline: 'محفظة رقمية لعملائك',                 rating: 4.0, installs: 480,  price: 'من 9 ر.س' },
  { id: 'smsblast', name: 'رسائلي',      monogram: 'ر', category: 'marketing', tagline: 'حملات رسائل نصية للعملاء',            rating: 4.4, installs: 1520, price: 'من 20 ر.س' },
  { id: 'loyal',    name: 'ولاء',        monogram: 'و', category: 'marketing', tagline: 'برنامج نقاط ومكافآت',                 rating: 4.5, installs: 1130, price: 'من 25 ر.س' },
];

export const CATEGORIES = [
  { value: 'all',       label: 'كل التطبيقات' },
  { value: 'shipping',  label: 'الشحن والتوصيل' },
  { value: 'payments',  label: 'المدفوعات' },
  { value: 'marketing', label: 'التسويق' },
];

export interface PendingOrder { id: string; customer: string; branch: string; waitingMinutes: number; total: number }

export const PENDING_ORDERS: PendingOrder[] = [
  { id: '48211', customer: 'نورة العتيبي', branch: 'فرع الرياض', waitingMinutes: 12, total: 245 },
  { id: '48209', customer: 'فهد الشمري',   branch: 'فرع الرياض', waitingMinutes: 7,  total: 180 },
  { id: '48204', customer: 'سارة القحطاني', branch: 'فرع جدة',    waitingMinutes: 3,  total: 320 },
];
