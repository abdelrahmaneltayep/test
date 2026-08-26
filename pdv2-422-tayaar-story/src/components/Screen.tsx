import type { ReactNode } from 'react';
import { Tag } from './atoms';
import { n } from '../lib/num';

/**
 * The real "من أين ستنطلق شحناتك السريعة؟" section, transcribed from the
 * reference designs. The Tayaar strip is the only thing that varies.
 */
export function ProviderSection({ strip, compact }: { strip: ReactNode; compact?: boolean }) {
  return (
    <section className={`rounded-lg bg-white ${compact ? 'p-4' : 'p-6'} shadow-sm`}>
      <h2 className="text-[16px] font-bold">من أين ستنطلق شحناتك السريعة؟</h2>
      <p className="mb-5 mt-1 text-[12.5px] text-salla-text-2">اختر الفرع والمزود المسؤول عن التوصيل.</p>

      <div className="mb-4">
        <span className="mb-1.5 block text-[12.5px] font-semibold">
          اختر الفرع/المستودع <span aria-hidden="true" className="text-salla-danger-500">*</span>
        </span>
        <ul className="flex min-h-[42px] flex-wrap items-center gap-2 rounded-md border border-salla-border px-3 py-2">
          {['فرع الرياض', 'فرع جدة', 'فرع مكة المكرمة'].map((b) => (
            <li key={b} className="flex items-center gap-1.5 rounded-full border border-salla-success-500/30 bg-salla-success-50 px-2.5 py-0.5 text-[12px] text-salla-success-700">
              {b}<span aria-hidden="true">×</span>
            </li>
          ))}
          <span aria-hidden="true" className="me-auto text-salla-text-2">⊗</span>
        </ul>
      </div>

      <span className="mb-1.5 block text-[12.5px] font-semibold">مزود خدمة الشحن السريع</span>

      <div className="rounded-md border border-salla-border p-4">
        <div className="flex gap-3">
          <input type="radio" name="prov" readOnly aria-label="الشحن السريع — بوليصات سلة"
            className="mt-0.5 h-[17px] w-[17px] accent-[color:var(--salla-primary)]" />
          <div>
            <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold">
              الشحن السريع <Tag kind="ok">✓ موصى به · جاهز فوراً</Tag><Tag kind="ok">✓ بوليصات سلة</Tag>
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-salla-text-2">
              توصيل طلبات عملائك خلال ساعتين في {n(23)} مدينة — سلة تختار أفضل مزود لكل طلب تلقائياً دون الحاجة لإدارة شركات شحن متعددة.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2.5 rounded-md border-2 border-salla-primary p-[15px]">
        <div className="flex gap-3">
          <input type="radio" name="prov" defaultChecked readOnly aria-label="شحن خاص بمتجرك"
            className="mt-0.5 h-[17px] w-[17px] accent-[color:var(--salla-primary)]" />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold">شحن خاص بمتجرك</p>
            <p className="mt-1 text-[12px] text-salla-text-2">شركة شحن خارجية - مناديب المتجر او كليهما معاً.</p>

            <div className="mt-4 flex items-start gap-3">
              <span aria-hidden="true" className="relative mt-0.5 h-[20px] w-[36px] shrink-0 rounded-full bg-salla-border">
                <span className="absolute start-[2.5px] top-[2.5px] h-[15px] w-[15px] rounded-full bg-white shadow" />
              </span>
              <span>
                <span className="block text-[12.5px] font-semibold">تخصيص لكل فرع مستقل</span>
                <span className="block text-[11.5px] text-salla-text-2">إعدادات مختلفة لكل فرع</span>
              </span>
            </div>

            <div className="mt-4">
              <label htmlFor="prov-sel" className="block text-[12.5px] font-semibold">
                شركة شحن خارجية/مناديب المتجر <span aria-hidden="true" className="text-salla-danger-500">*</span>
              </label>
              <p className="mb-1.5 text-[11.5px] text-salla-text-2">اختر شركة شحن خارجية / مندوب متجر او كليهما معاً.</p>
              <select id="prov-sel" defaultValue="own"
                className="salla-select w-full appearance-none rounded-md border border-salla-border bg-white px-3.5 py-2.5 text-[13px]">
                <option value="">اختر</option>
                <option value="carrier">شركة شحن خارجية</option>
                <option value="own">مناديب المتجر</option>
                <option value="both">كلاهما معاً</option>
              </select>
            </div>

            {/* ── the only thing that varies ── */}
            <div className="mt-3.5">{strip}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
