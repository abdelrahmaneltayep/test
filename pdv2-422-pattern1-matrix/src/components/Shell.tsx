import type { ReactNode } from 'react';
import { Tag } from './ui';
import { n } from '../lib/num';
import { useStore } from '../store/store';
import type { Slot } from '../layouts/types';

const SUBNAV = ['الشحن والتوصيل', 'إدارة التشغيل', 'التوصيل السريع', 'التقارير', 'المسارات'];

function Card({ title, desc, children }: { title: string; desc: string; children?: ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-[16px] font-bold">{title}</h2>
      <p className="mb-5 text-[12.5px] text-salla-text-2">{desc}</p>
      {children}
    </section>
  );
}

/**
 * The real Quick Delivery activation page, with a named slot at every anchor
 * point a layout can occupy. Each layout declares its slot; the shell puts it there.
 */
export function ActivationPage({ slot, children }: { slot: Slot; children: ReactNode }) {
  const { branches, perBranch } = useStore();
  const at = (s: Slot) => (slot === s ? <div data-slot={s}>{children}</div> : null);

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-5 px-6 text-white" style={{ background: 'var(--salla-topbar)' }}>
        <span className="flex items-center gap-2 text-[16px] font-bold">
          <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded bg-white/15 text-[12px]">س</span>سلة
        </span>
        <nav aria-label="التنقل الرئيسي" className="hidden flex-1 gap-5 text-[13px] md:flex">
          {['الرئيسية', 'الطلبات', 'المنتجات', 'التقارير'].map((t) => <a key={t} href="#" className="text-white/85 hover:text-white">{t}</a>)}
        </nav>
        <span className="ms-auto text-[12px] opacity-80 md:ms-0">وليد عيسى · سبيشل</span>
      </header>

      <nav aria-label="أقسام الشحن" className="flex h-12 items-center gap-5 overflow-x-auto border-b border-salla-border bg-white px-6 text-[13px]">
        {SUBNAV.map((t) => (
          <a key={t} href="#" aria-current={t === 'التوصيل السريع' ? 'page' : undefined}
            className={`whitespace-nowrap border-b-2 py-3.5 ${t === 'التوصيل السريع' ? 'border-salla-primary font-bold text-salla-primary' : 'border-transparent text-salla-text-2'}`}>{t}</a>
        ))}
      </nav>

      {at('belowHeader')}

      <main className="mx-auto max-w-3xl px-6 pb-16 pt-4">
        <nav aria-label="مسار التنقل" className="mb-3 flex gap-2 text-[12px] text-salla-text-2">
          <span>الشحن</span><span aria-hidden="true">›</span><span className="font-semibold text-salla-primary">التوصيل السريع</span>
        </nav>

        {at('top')}

        <div className="mt-4 space-y-4">
          <Card title="من أين ستنطلق شحناتك السريعة؟" desc="اختر الفرع والمزود المسؤول عن التوصيل.">
            {at('sectionHeader')}

            <div className="mt-3">
              <span className="mb-1.5 block text-[13px] font-semibold">
                <span aria-hidden="true" className="text-salla-danger-500">* </span>اختر الفرع/المستودع
              </span>
              <ul className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-md border border-salla-border p-2.5">
                {branches.map((b) => (
                  <li key={b.id} className="flex items-center gap-1.5 rounded-full border border-salla-success-500/30 bg-salla-success-50 px-2.5 py-0.5 text-[12px] text-salla-success-700">
                    {b.name}<span aria-hidden="true">×</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <span className="mb-1.5 block text-[13px] font-semibold">مزود خدمة الشحن السريع</span>

              <div className="rounded-md border border-salla-border p-4">
                <div className="flex gap-3">
                  <input type="radio" name="prov" readOnly aria-label="الشحن السريع — بوليصات سلة"
                    className="mt-1 h-[18px] w-[18px] accent-[color:var(--salla-primary)]" />
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-[14px] font-bold">
                      الشحن السريع <Tag v="rec">✓ {'موصى به'}</Tag><Tag v="rec">✓ جاهز فوراً</Tag><Tag v="rec">بوليصات سلة</Tag>
                    </p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-salla-text-2">
                      توصيل طلبات عملائك خلال ساعتين في {n(23)} مدينة — سلة تختار أفضل مزود لكل طلب تلقائياً دون الحاجة لإدارة شركات شحن متعددة.
                    </p>
                  </div>
                </div>
              </div>

              {at('betweenRadios')}

              <div className="mt-2.5 rounded-md border-2 border-salla-primary p-[15px]">
                <div className="flex gap-3">
                  <input type="radio" name="prov" defaultChecked readOnly aria-label="شحن خاص بمتجرك"
                    className="mt-1 h-[18px] w-[18px] accent-[color:var(--salla-primary)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold">شحن خاص بمتجرك</p>
                    <p className="mt-1 text-[12.5px] text-salla-text-2">شركة شحن خارجية - مناديب المتجر او كليهما معاً.</p>

                    <div className="mt-4 flex items-start gap-3">
                      <span aria-hidden="true" className={`mt-0.5 h-[21px] w-[38px] shrink-0 rounded-full ${perBranch ? 'bg-salla-primary' : 'bg-salla-border'} relative`}>
                        <span className={`absolute top-[2.5px] h-4 w-4 rounded-full bg-white shadow ${perBranch ? 'start-[19.5px]' : 'start-[2.5px]'}`} />
                      </span>
                      <span>
                        <span className="block text-[13px] font-semibold">تخصيص لكل فرع مستقل</span>
                        <span className="block text-[12px] text-salla-text-2">إعدادات مختلفة لكل فرع</span>
                      </span>
                    </div>

                    {slot !== 'dropdownOption' && slot !== 'overlay' && (
                      <div className="mt-4">
                        <label htmlFor="prov-sel" className="block text-[13px] font-semibold">
                          <span aria-hidden="true" className="text-salla-danger-500">* </span>شركة شحن خارجية/مناديب المتجر
                        </label>
                        <p className="mb-1.5 text-[12px] text-salla-text-2">اختر شركة شحن خارجية / مندوب متجر او كليهما معاً.</p>
                        <select id="prov-sel" defaultValue="own"
                          className="salla-select w-full appearance-none rounded-md border border-salla-border bg-white px-3.5 py-2.5 text-[13.5px]">
                          <option value="">اختر</option><option value="carrier">شركة شحن خارجية</option>
                          <option value="own">مناديب المتجر</option><option value="both">كلاهما معاً</option>
                        </select>
                      </div>
                    )}

                    <div className="mt-4">{at('dropdownOption')}{at('overlay')}{at('belowDropdown')}{at('insidePrivate')}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {at('sectionDivider')}

          <Card title="إلى أي مدى تصل خدمتك؟" desc="حدّد نطاق التوصيل السريع حول الفرع — يمكنك تعديله لاحقاً.">
            <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold">النطاق الحالي: {n(25)} كم <Tag v="rec">✓ موصى به</Tag></p>
          </Card>

          <Card title="وعد التوصيل لعملائك" desc="اضبط وعد التوصيل بما يناسب سرعة تجهيز طلباتك وأوقات عملك.">
            <dl className="grid gap-2.5 text-[13px] sm:grid-cols-2">
              <div className="rounded-md bg-salla-soft p-3"><dt className="text-salla-text-2">مدة تجهيز الطلب</dt><dd className="font-semibold">{n('30-60')} دقيقة</dd></div>
              <div className="rounded-md bg-salla-soft p-3"><dt className="text-salla-text-2">مدة التوصيل</dt><dd className="font-semibold">{n('60-120')} دقيقة</dd></div>
            </dl>
          </Card>

          {at('launch')}

          <div className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-5 shadow-sm">
            <p className="flex-1 text-[12.5px] text-salla-text-2">
              <b className="block text-[13.5px] text-salla-text">جاهز للانطلاق؟</b>
              يمكنك تعديل إعدادات التوصيل السريع لاحقاً.
            </p>
            <button type="button" className="rounded-md bg-salla-mint px-5 py-2.5 text-[13.5px] font-bold text-salla-primary-700">🚀 إطلاق الخدمة</button>
          </div>
        </div>
      </main>

      {at('stickyBottom')}
      {slot === 'rail' && <div className="fixed bottom-4 start-4 z-20 hidden lg:block">{children}</div>}
      {slot === 'edge' && <div className="fixed bottom-4 end-4 z-20">{children}</div>}
    </div>
  );
}
