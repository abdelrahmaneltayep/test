import { NavLink } from 'react-router-dom';
import { LAYOUTS, LAYOUT_FAMILIES } from '../layouts';
import { useStore } from '../store/store';

const VERDICT: Record<string, { label: string; sr: string; cls: string }> = {
  MVP:   { label: '⭐', sr: 'ترشيح: MVP',        cls: 'text-salla-success-700' },
  ship:  { label: '●',  sr: 'ترشيح: للشحن',      cls: 'text-salla-primary' },
  ab:    { label: '◐',  sr: 'ترشيح: اختبار A/B', cls: 'text-salla-info-700' },
  nice:  { label: '○',  sr: 'ترشيح: جيد أن يوجد', cls: 'text-salla-text-2' },
  defer: { label: '·',  sr: 'ترشيح: مؤجّل',      cls: 'text-salla-text-3' },
};

export function Navigator() {
  const failureRate = useStore((s) => s.failureRate);
  const setFailureRate = useStore((s) => s.setFailureRate);

  return (
    <aside className="shrink-0 border-b border-salla-border bg-white lg:sticky lg:top-0 lg:h-screen lg:w-[250px] lg:overflow-y-auto lg:border-b-0 lg:border-e">
      <div className="border-b border-salla-border p-4">
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-salla-text-2">PDV2-422 · النمط ١</p>
        <h1 className="mt-1 text-[13.5px] font-bold leading-snug">٢٠ تخطيطاً × ٢٠ تدفقاً</h1>
      </div>

      <NavLink to="/" end className={({ isActive }) =>
        `block border-b border-salla-border px-4 py-2.5 text-[12.5px] font-semibold ${isActive ? 'bg-salla-primary text-white' : 'text-salla-primary'}`}>
        ▤ مصفوفة المقارنة
      </NavLink>

      <nav aria-label="التخطيطات" className="p-2.5">
        {(['A', 'B', 'C', 'D'] as const).map((fam) => (
          <div key={fam} className="mb-2">
            <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-salla-text-2">
              {fam} · {LAYOUT_FAMILIES[fam]}
            </p>
            {LAYOUTS.filter((l) => l.family === fam).map((l) => (
              <NavLink key={l.id} to={`/${l.id.toLowerCase()}`}
                className={({ isActive }) =>
                  `flex items-start gap-2 rounded-md px-2 py-1.5 ${isActive ? 'bg-salla-primary text-white' : 'text-salla-text-2 hover:bg-salla-soft'}`}>
                {({ isActive }) => (
                  <>
                    <span className={`w-8 shrink-0 text-[11px] font-bold ${isActive ? 'text-white/80' : 'text-salla-text-3'}`}>{l.id}</span>
                    <span className="min-w-0 flex-1 text-[12px] leading-snug">{l.name}</span>
                    <span className={`shrink-0 text-[11px] ${isActive ? 'text-white' : VERDICT[l.verdict].cls}`}>
                      <span aria-hidden="true">{VERDICT[l.verdict].label}</span>
                      <span className="sr-only">{VERDICT[l.verdict].sr}</span>
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="mx-3 rounded-md bg-salla-soft p-3 text-[11px] leading-relaxed text-salla-text-2">
        <p className="mb-1 font-bold text-salla-text">الترشيح</p>
        <p><span className="text-salla-success-700">⭐</span> MVP · <span className="text-salla-primary">●</span> للشحن · <span className="text-salla-info-700">◐</span> اختبار A/B</p>
        <p><span>○</span> جيد أن يوجد · <span className="text-salla-text-3">·</span> مؤجّل</p>
      </div>

      <div className="m-3 rounded-md border border-dashed border-salla-border p-3">
        <label htmlFor="fr" className="block text-[10.5px] font-bold text-salla-text-2">أدوات المطوّر · نسبة الفشل</label>
        <div className="mt-2 flex items-center gap-2">
          <input id="fr" type="range" min={0} max={100} step={10} value={Math.round(failureRate * 100)}
            onChange={(e) => setFailureRate(+e.target.value / 100)}
            className="h-1 flex-1 accent-[color:var(--salla-primary)]" />
          <span className="tabular w-9 text-[11px] font-semibold">{Math.round(failureRate * 100)}%</span>
        </div>
      </div>
    </aside>
  );
}
