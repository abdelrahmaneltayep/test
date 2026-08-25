import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useTayaarStore } from '../../store/tayaarStore';
import { NUMERALS } from '../../lib/num';

const PATTERNS = [
  { to: '/pattern-1', num: '1', name: 'بطاقة داخل التدفق',   en: 'Contextual In-Workflow Card', rank: 'primary' },
  { to: '/pattern-2', num: '2', name: 'متجر التطبيقات',       en: 'Curated Marketplace Slot',   rank: 'deferred' },
  { to: '/pattern-3', num: '3', name: 'معالج الإعداد',        en: 'Setup Wizard Checkpoint',    rank: 'deferred' },
  { to: '/pattern-4', num: '4', name: 'شريط لوحة التحكم',     en: 'Persistent Dashboard Banner', rank: 'deferred' },
  { to: '/pattern-5', num: '5', name: 'الحالة الفارغة',       en: 'Empty-State Prompt',         rank: 'primary' },
] as const;

export function PatternNavigator() {
  const [notesOpen, setNotesOpen] = useState(false);
  const failureRate = useTayaarStore((s) => s.failureRate);
  const setFailureRate = useTayaarStore((s) => s.setFailureRate);
  const reset = useTayaarStore((s) => s.reset);

  return (
    <>
      <aside className="shrink-0 border-b border-salla-border bg-white lg:sticky lg:top-0 lg:h-screen lg:w-[248px] lg:border-b-0 lg:border-e">
        <div className="flex h-full flex-col">
          <div className="border-b border-salla-border p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-salla-text-tertiary">PDV2-422</p>
            <h1 className="mt-1 text-sm font-bold leading-snug">أنماط عرض تطبيقات الشركاء</h1>
          </div>

          <nav aria-label="أنماط النموذج الأولي" className="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
            {PATTERNS.map((p) => (
              <NavLink
                key={p.to}
                to={p.to}
                className={({ isActive }) =>
                  `flex shrink-0 items-start gap-2.5 rounded-md px-3 py-2.5 text-start transition-colors lg:shrink ${
                    isActive ? 'bg-salla-primary text-white' : 'text-salla-text-secondary hover:bg-salla-surface-soft'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden="true"
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                        isActive ? 'bg-white/20' : 'bg-salla-surface-soft text-salla-text-tertiary'
                      }`}
                    >
                      {p.num}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold">{p.name}</span>
                      <span className={`block text-[10.5px] ${isActive ? 'text-white/70' : 'text-salla-text-tertiary'}`}>{p.en}</span>
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mx-3 rounded-md bg-salla-surface-soft p-3 text-[11.5px] leading-relaxed text-salla-text-secondary">
            <p className="mb-1.5 font-bold text-salla-text-primary">توصية التقييم المرجعي</p>
            <p><span className="font-semibold text-salla-success-700">أساسي</span> — النمط 1 و 5</p>
            <p><span className="font-semibold text-salla-text-tertiary">مؤجّل</span> — النمط 2 و 3 و 4</p>
          </div>

          {/* Dev toggle — demo the error state on cue. */}
          <div className="mx-3 mt-3 rounded-md border border-dashed border-salla-border-strong p-3">
            <label htmlFor="failrate" className="block text-[11px] font-bold text-salla-text-tertiary">
              أدوات المطوّر · نسبة الفشل
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                id="failrate"
                type="range"
                min={0}
                max={100}
                step={10}
                value={Math.round(failureRate * 100)}
                onChange={(e) => setFailureRate(Number(e.target.value) / 100)}
                className="h-1 flex-1 accent-[color:var(--salla-primary)]"
              />
              <span className="tabular w-9 text-start text-[11px] font-semibold">{Math.round(failureRate * 100)}%</span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="mt-2 text-[11px] text-salla-primary underline"
            >
              إعادة تعيين الحالة
            </button>
          </div>

          <div className="mt-auto border-t border-salla-border p-3">
            <button type="button" onClick={() => setNotesOpen(true)} className="text-[12px] text-salla-primary underline">
              عن هذا النموذج الأولي
            </button>
          </div>
        </div>
      </aside>

      <Modal
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        title="عن هذا النموذج الأولي"
        footer={<Button variant="primary" onClick={() => setNotesOpen(false)}>فهمت</Button>}
      >
        <p className="mb-3">
          نموذج أولي <strong>تصميمي</strong> لتذكرة <strong>PDV2-422</strong> — عرض تطبيق الشريك «طيّار» داخل
          تدفّق تفعيل التوصيل السريع. يعرض خمسة أنماط جنبًا إلى جنب كأداة قرار.
        </p>
        <p className="mb-3 rounded-md bg-salla-warning-50 p-3 text-[12.5px] text-salla-warning-700">
          <strong>ليس كودًا للإنتاج.</strong> لا توجد واجهات برمجية حقيقية ولا مصادقة ولا فوترة.
          كل «تفعيل» محاكاة مدتها 900 مللي ثانية. بيانات الفروع والطلبات وهمية.
        </p>
        <ul className="mb-3 list-inside list-disc space-y-1 text-[12.5px]">
          <li>الأرقام تُعرض بالخانات الغربية مطابقةً للوحة تحكم سلة الفعلية.</li>
          <li>رموز التصميم مأخوذة من عدة مكوّنات سلة الحقيقية.</li>
          <li>أي إحصائية عن طيّار معلّقة على تحقق فريق البيانات — تظهر مع «قيد التحقق».</li>
        </ul>
        <p className="text-[12px] text-salla-text-tertiary">
          نظام الأرقام الحالي: <strong>{NUMERALS === 'western' ? 'غربي (0-9)' : 'عربي-هندي (٠-٩)'}</strong> — يُبدَّل من <code>src/lib/num.ts</code>
        </p>
      </Modal>
    </>
  );
}
