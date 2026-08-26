import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProviderSection } from './components/Screen';
import { OPTIONS, OPTION_BY_ID } from './components/Options';
import { ChapterRail, Narration, PromiseThread } from './components/Story';
import { BRANCHES, CHAPTERS, CHAPTER_BY_ID } from './lib/story';
import { n } from './lib/num';

type OptId = 'A' | 'B' | 'C' | 'D';

export default function App() {
  const [optId, setOptId] = useState<OptId>('A');
  const [chapterId, setChapterId] = useState(CHAPTERS[0].id);
  const [compare, setCompare] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const chapter = CHAPTER_BY_ID[chapterId];
  const opt = OPTION_BY_ID[optId];
  const mainIndex = CHAPTERS.findIndex((c) => c.id === chapterId);
  const onMain = mainIndex >= 0;

  /** Branches hanging off the chapter you're standing on. */
  const branches = useMemo(() => BRANCHES.filter((b) => b.branchOf === chapterId), [chapterId]);
  const parentOf = chapter.branchOf ? CHAPTER_BY_ID[chapter.branchOf] : null;

  const go = useCallback((dir: 1 | -1) => {
    const base = onMain ? mainIndex : CHAPTERS.findIndex((c) => c.id === chapter.branchOf);
    const next = base + dir;
    if (next >= 0 && next < CHAPTERS.length) setChapterId(CHAPTERS[next].id);
    else setPlaying(false);
  }, [onMain, mainIndex, chapter.branchOf]);

  // Autoplay — for walking a room through it without touching the keyboard.
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (onMain && mainIndex === CHAPTERS.length - 1) setPlaying(false);
      else go(1);
    }, 5200);
    return () => clearTimeout(t);
  }, [playing, chapterId, onMain, mainIndex, go]);

  // Arrow keys move through the story (RTL: left = forward).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'SELECT') return;
      if (e.key === 'ArrowLeft') go(1);
      if (e.key === 'ArrowRight') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const act = () => {
    setToast('إجراء تجريبي — لا يوجد تفعيل حقيقي في النموذج');
    setTimeout(() => setToast(null), 2000);
  };
  const strip = (o: typeof opt) => (chapter.strip ? o.render(chapter.strip, act) : null);

  return (
    <div className="min-h-screen">
      {/* ── Header: option switcher + playback ─────────────────── */}
      <header className="sticky top-0 z-30 border-b border-salla-border bg-white">
        <div className="mx-auto max-w-6xl px-5 py-3">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-[15px] font-bold">رحلة التاجر مع طيّار</h1>
            <p className="text-[11.5px] text-salla-text-2">
              PDV2-422 · {n(CHAPTERS.length)} مشاهد + {n(BRANCHES.length)} مسارات بديلة × ٤ خيارات تصميم
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-salla-text-2">الخيار</span>
              <div role="tablist" aria-label="خيارات التصميم" className="flex flex-wrap gap-1.5">
                {OPTIONS.map((o) => (
                  <button key={o.id} type="button" role="tab" aria-selected={!compare && optId === o.id}
                    onClick={() => { setOptId(o.id); setCompare(false); }}
                    className={`rounded-md border px-2.5 py-1.5 text-[12px] font-semibold transition
                      ${!compare && optId === o.id ? 'border-salla-primary bg-salla-primary text-white'
                        : 'border-salla-border bg-white text-salla-text-2 hover:border-salla-primary'}`}>
                    {o.id} · {o.name}
                  </button>
                ))}
                <button type="button" role="tab" aria-selected={compare} onClick={() => setCompare(true)}
                  className={`rounded-md border px-2.5 py-1.5 text-[12px] font-semibold transition
                    ${compare ? 'border-salla-primary bg-salla-primary text-white'
                              : 'border-salla-border bg-white text-salla-text-2 hover:border-salla-primary'}`}>
                  ▦ الأربعة معاً
                </button>
              </div>
            </div>

            <div className="ms-auto flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => go(-1)}
                className="rounded-md border border-salla-border bg-white px-3 py-1.5 text-[12px] font-semibold hover:border-salla-primary">
                ← السابق
              </button>
              <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}
                className={`rounded-md border px-3 py-1.5 text-[12px] font-semibold
                  ${playing ? 'border-salla-primary bg-salla-primary text-white' : 'border-salla-border bg-white hover:border-salla-primary'}`}>
                {playing ? '⏸ إيقاف' : '▶ تشغيل'}
              </button>
              <button type="button" onClick={() => go(1)}
                className="rounded-md border border-salla-border bg-white px-3 py-1.5 text-[12px] font-semibold hover:border-salla-primary">
                التالي →
              </button>
            </div>
          </div>

          <div className="mt-3"><ChapterRail current={onMain ? chapterId : (chapter.branchOf ?? chapterId)} onPick={(id) => { setChapterId(id); setPlaying(false); }} /></div>
        </div>

        <p className="border-t border-salla-border bg-salla-soft px-5 py-2 text-[11.5px] text-salla-text-2">
          <b className="text-salla-text">المصدر</b> · {chapter.source}
        </p>
      </header>

      {/* ── Stage ──────────────────────────────────────────────── */}
      <main className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4 lg:sticky lg:top-[188px] lg:h-fit">
          <Narration chapter={chapter} index={onMain ? mainIndex : 0} />
          <PromiseThread chapter={chapter} />

          {parentOf && (
            <button type="button" onClick={() => setChapterId(parentOf.id)}
              className="w-full rounded-md border border-salla-border bg-white px-3 py-2 text-[12px] font-semibold text-salla-primary hover:border-salla-primary">
              ← العودة إلى «{parentOf.moment}»
            </button>
          )}

          {branches.length > 0 && (
            <div className="rounded-lg border border-dashed border-salla-border bg-white p-3.5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-salla-text-2">مسارات بديلة من هنا</p>
              <div className="grid gap-2">
                {branches.map((b) => (
                  <button key={b.id} type="button" onClick={() => { setChapterId(b.id); setPlaying(false); }}
                    className="rounded-md bg-salla-soft px-3 py-2 text-start text-[12.5px] font-semibold hover:bg-salla-primary-50">
                    {b.moment}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {compare ? (
            <div className="space-y-4">
              <p className="rounded-md bg-white p-3 text-[12px] leading-relaxed text-salla-text-2 shadow-sm">
                نفس المشهد في الخيارات الأربعة. النموذج المحيط مطابق — المعروض هو الشريط وحده بعرضه الفعلي.
              </p>
              {chapter.strip ? OPTIONS.map((o) => (
                <section key={o.id} className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="mb-1 flex flex-wrap items-baseline gap-2">
                    <span className="rounded bg-salla-primary px-1.5 py-0.5 text-[11px] font-bold text-white">{o.id}</span>
                    <span className="text-[13px] font-bold">{o.name}</span>
                    <span className="text-[11px] text-salla-text-2">{o.en}</span>
                  </div>
                  {strip(o)}
                </section>
              )) : (
                <p className="rounded-lg bg-white p-5 text-[13px] text-salla-text-2 shadow-sm">
                  لا يظهر شريط في هذا المشهد — لا فرق بين الخيارات هنا.
                </p>
              )}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={optId + chapterId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <ProviderSection strip={strip(opt)} />
                {!chapter.strip && (
                  <p className="mt-3 rounded-md bg-white p-3.5 text-[12.5px] leading-relaxed text-salla-text-2 shadow-sm">
                    لا يظهر أي شريط في هذا المشهد — النموذج كما هو اليوم، قبل أن تظهر القطعة الناقصة.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4">
        <AnimatePresence>
          {toast && (
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-md bg-salla-text px-4 py-2 text-[12.5px] font-semibold text-white shadow-lg">{toast}</motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
