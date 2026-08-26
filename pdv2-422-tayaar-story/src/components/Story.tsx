import { AnimatePresence, motion } from 'framer-motion';
import { ACTS, CHAPTERS, PROMISE_META, type Chapter } from '../lib/story';
import { n } from '../lib/num';

/** The spine of the arc — does the customer see the two-hour promise? */
export function PromiseThread({ chapter }: { chapter: Chapter }) {
  const m = PROMISE_META[chapter.promise];
  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-md border border-salla-border bg-white px-3.5 py-2.5">
      <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${m.dot}`} />
      <span className={`text-[12.5px] font-bold ${m.tone}`}>{m.label}</span>
      <span className="me-auto text-[11px] text-salla-text-2">ما يراه العميل عند الدفع</span>
    </div>
  );
}

/** Chapter rail — acts as chapters, with the promise state visible on each. */
export function ChapterRail({ current, onPick }: { current: string; onPick: (id: string) => void }) {
  return (
    <nav aria-label="فصول الرحلة" className="flex gap-1.5 overflow-x-auto pb-1">
      {CHAPTERS.map((c, i) => {
        const active = c.id === current;
        const m = PROMISE_META[c.promise];
        return (
          <button key={c.id} type="button" onClick={() => onPick(c.id)}
            aria-current={active ? 'step' : undefined}
            className={`group flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-start transition
              ${active ? 'border-salla-primary bg-salla-primary text-white'
                       : 'border-salla-border bg-white text-salla-text-2 hover:border-salla-primary'}`}>
            <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${active ? 'bg-white/70' : m.dot}`} />
            <span className="text-[11.5px] font-semibold">{n(i + 1)}</span>
            <span className="max-w-[130px] truncate text-[11.5px]">{c.moment}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** The narration panel — the merchant's side of the screen. */
export function Narration({ chapter, index }: { chapter: Chapter; index: number }) {
  const act = ACTS[chapter.act];
  return (
    <AnimatePresence mode="wait">
      <motion.div key={chapter.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        className="rounded-lg bg-white p-5 shadow-sm">
        <p className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-salla-text-2">
          <span className="rounded bg-salla-soft px-1.5 py-0.5">الفصل {n(chapter.act)} · {act.name}</span>
          {chapter.branchOf && <span className="rounded bg-salla-warning-50 px-1.5 py-0.5 text-salla-warning-700">مسار بديل</span>}
          {!chapter.branchOf && <span>المشهد {n(index + 1)} من {n(CHAPTERS.length)}</span>}
        </p>
        <h2 className="text-[19px] font-bold leading-snug">{chapter.moment}</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-salla-text-2">{chapter.narration}</p>
        {chapter.delta && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-salla-soft px-2.5 py-1.5 text-[12px] font-semibold">
            <span aria-hidden="true">→</span>{chapter.delta}
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
