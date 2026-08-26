import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProviderSection } from './components/Screen';
import { OPTIONS, OPTION_BY_ID } from './components/Options';
import { CASES, CASE_BY_ID, STORY_GROUPS } from './lib/cases';

type View = 'single' | 'compare';

export default function App() {
  const [optId, setOptId] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [caseId, setCaseId] = useState('default');
  const [view, setView] = useState<View>('single');
  const [toast, setToast] = useState<string | null>(null);

  const opt = OPTION_BY_ID[optId];
  const kase = CASE_BY_ID[caseId];

  const act = () => {
    setToast(kase.cta?.text ?? 'إجراء');
    setTimeout(() => setToast(null), 2200);
  };

  const strip = (o: typeof opt) => (kase.hidden ? null : o.render(kase, act));

  return (
    <div className="min-h-screen">
      {/* ── Switchers ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-salla-border bg-white">
        <div className="mx-auto max-w-6xl px-5 py-3">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-[15px] font-bold">PDV2-422 — شريط طيّار داخل «شحن خاص بمتجرك»</h1>
            <p className="text-[11.5px] text-salla-text-2">٤ خيارات تصميم × {CASES.length} حالة من المستند</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* Option switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-salla-text-2">الخيار</span>
              <div role="tablist" aria-label="خيارات التصميم" className="flex flex-wrap gap-1.5">
                {OPTIONS.map((o) => (
                  <button key={o.id} type="button" role="tab" aria-selected={view === 'single' && optId === o.id}
                    onClick={() => { setOptId(o.id); setView('single'); }}
                    className={`rounded-md border px-2.5 py-1.5 text-[12px] font-semibold transition
                      ${view === 'single' && optId === o.id
                        ? 'border-salla-primary bg-salla-primary text-white'
                        : 'border-salla-border bg-white text-salla-text-2 hover:border-salla-primary'}`}>
                    {o.id} · {o.name}
                  </button>
                ))}
                <button type="button" role="tab" aria-selected={view === 'compare'}
                  onClick={() => setView('compare')}
                  className={`rounded-md border px-2.5 py-1.5 text-[12px] font-semibold transition
                    ${view === 'compare' ? 'border-salla-primary bg-salla-primary text-white'
                                         : 'border-salla-border bg-white text-salla-text-2 hover:border-salla-primary'}`}>
                  ▦ مقارنة الأربعة
                </button>
              </div>
            </div>

            {/* Case switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="case" className="text-[11px] font-bold uppercase tracking-wider text-salla-text-2">الحالة</label>
              <select id="case" value={caseId} onChange={(e) => setCaseId(e.target.value)}
                className="salla-select max-w-[260px] appearance-none rounded-md border border-salla-border bg-white px-3 py-1.5 text-[12.5px]">
                {STORY_GROUPS.map((g) => {
                  const items = CASES.filter((c) => c.story === g);
                  if (!items.length) return null;
                  return (
                    <optgroup key={g} label={g}>
                      {items.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </optgroup>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        <p className="border-t border-salla-border bg-salla-soft px-5 py-2 text-[11.5px] text-salla-text-2">
          <b className="text-salla-text">{kase.story}</b> · {kase.source}
          {view === 'single' && <> — <span className="text-salla-text">{opt.en}</span> · {opt.axis}</>}
        </p>
      </header>

      {/* ── Stage ─────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-5 py-6">
        {view === 'single' ? (
          <div className="mx-auto max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div key={optId + caseId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
                <ProviderSection strip={strip(opt)} />
              </motion.div>
            </AnimatePresence>
            {kase.hidden && (
              <p className="mt-3 rounded-md bg-salla-soft p-3 text-[12px] text-salla-text-2">
                لا يظهر أي شريط في هذه الحالة — تدفق مزود الشحن غير المناديب دون تغيير.
              </p>
            )}
          </div>
        ) : (
          /* Compare the thing that varies, at the width it actually occupies
             inside the radio card — not four copies of the identical form. */
          <div className="mx-auto max-w-[660px] space-y-5">
            <p className="rounded-md bg-white p-3 text-[12px] leading-relaxed text-salla-text-2 shadow-sm">
              النموذج المحيط مطابق في الخيارات الأربعة. المعروض أدناه هو الشريط وحده،
              بعرضه الفعلي داخل بطاقة «شحن خاص بمتجرك».
            </p>
            {OPTIONS.map((o) => (
              <section key={o.id} className="rounded-lg bg-white p-4 shadow-sm">
                <div className="mb-1 flex flex-wrap items-baseline gap-2">
                  <span className="rounded bg-salla-primary px-1.5 py-0.5 text-[11px] font-bold text-white">{o.id}</span>
                  <span className="text-[13px] font-bold">{o.name}</span>
                  <span className="text-[11px] text-salla-text-2">{o.en}</span>
                </div>
                <p className="mb-3 text-[11.5px] leading-relaxed text-salla-text-2">{o.axis}</p>
                {kase.hidden
                  ? <p className="rounded-md bg-salla-soft p-3 text-[12px] text-salla-text-2">لا يظهر شريط في هذه الحالة.</p>
                  : strip(o)}
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Feedback for the prototype's clicks — this is a design surface, not a live flow. */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4">
        <AnimatePresence>
          {toast && (
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-md bg-salla-text px-4 py-2 text-[12.5px] font-semibold text-white shadow-lg">
              «{toast}» — إجراء تجريبي، لا يوجد تفعيل حقيقي في النموذج
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
