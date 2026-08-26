import { Btn, Tag, TayaarIcon } from './atoms';
import type { CaseDef } from '../lib/cases';

export interface OptionDef {
  id: 'A' | 'B' | 'C' | 'D';
  name: string;
  en: string;
  axis: string;          // what makes it different, in one line
  render: (c: CaseDef, onAct: () => void) => JSX.Element | null;
}

/** Tone → surface treatment. Each option maps tone to its own palette. */
function toneFill(tone: CaseDef['tone']) {
  switch (tone) {
    case 'success': return 'bg-[#DFF6EC] border-salla-success-500/25';
    case 'warning': return 'bg-salla-warning-50 border-salla-warning-500/35';
    case 'danger':  return 'bg-salla-danger-50 border-salla-danger-500/30';
    case 'locked':  return 'bg-salla-soft border-salla-border';
    case 'neutral': return 'bg-salla-soft border-salla-border';
    default:        return 'bg-[#D5F3E6] border-transparent';   // the mint offer fill
  }
}
function toneOutline(tone: CaseDef['tone']) {
  switch (tone) {
    case 'success': return 'bg-white border-salla-success-500/35';
    case 'warning': return 'bg-white border-salla-warning-500/45';
    case 'danger':  return 'bg-white border-salla-danger-500/35';
    default:        return 'bg-white border-salla-border';
  }
}
const btnFor = (c: CaseDef) =>
  c.cta?.kind === 'retry' ? 'danger' : c.cta?.kind === 'upgrade' ? 'primary' : 'mint';

/** Shared inner content — the parts every option shows. */
function Body({ c, alt, showIcon }: { c: CaseDef; alt: boolean; showIcon: boolean }) {
  const title = alt && c.altTitle ? c.altTitle : c.title;
  const desc  = alt && c.altDesc  ? c.altDesc  : c.desc;
  return (
    <>
      {showIcon && <TayaarIcon size={38} />}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold leading-snug">
          {title}
          {c.tag && <Tag kind={c.tag.kind}>{c.tag.text}</Tag>}
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-salla-text-2">{desc}</p>
      </div>
    </>
  );
}

function Actions({ c, onAct }: { c: CaseDef; onAct: () => void }) {
  if (!c.cta) return null;
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Btn v={btnFor(c)} loading={c.loading} onClick={onAct}>{c.cta.text}</Btn>
      {c.secondary && (
        <button type="button" onClick={onAct} className="text-[12.5px] text-salla-primary underline">{c.secondary}</button>
      )}
    </div>
  );
}

const Note = ({ c }: { c: CaseDef }) =>
  c.note ? <p className="mt-2.5 text-[11.5px] leading-relaxed text-salla-text-2">{c.note}</p> : null;

/* ══ Option A — mint fill + app icon + capability headline ══ */
const A = (c: CaseDef, onAct: () => void) => (
  <div className={`rounded-lg border p-3.5 ${toneFill(c.tone)}`}>
    <div className="flex flex-wrap items-center gap-3">
      <Body c={c} alt={false} showIcon />
      <Actions c={c} onAct={onAct} />
    </div>
    <Note c={c} />
  </div>
);

/* ══ Option B — mint fill, no icon, product-led headline ══ */
const B = (c: CaseDef, onAct: () => void) => (
  <div className={`rounded-lg border p-3.5 ${toneFill(c.tone)}`}>
    <div className="flex flex-wrap items-center gap-3">
      <Body c={c} alt showIcon={false} />
      <Actions c={c} onAct={onAct} />
    </div>
    <Note c={c} />
  </div>
);

/* ══ Option C — white surface + border + app icon ══ */
const C = (c: CaseDef, onAct: () => void) => (
  <div className={`rounded-lg border p-3.5 shadow-sm ${toneOutline(c.tone)}`}>
    <div className="flex flex-wrap items-center gap-3">
      <Body c={c} alt={false} showIcon />
      <Actions c={c} onAct={onAct} />
    </div>
    <Note c={c} />
  </div>
);

/* ══ Option D — flush: no card, a hairline rule instead ══ */
const D = (c: CaseDef, onAct: () => void) => (
  <div className="border-t border-salla-border pt-3.5">
    <div className="flex flex-wrap items-center gap-3">
      <Body c={c} alt={false} showIcon />
      <Actions c={c} onAct={onAct} />
    </div>
    <Note c={c} />
  </div>
);

export const OPTIONS: OptionDef[] = [
  { id: 'A', name: 'تعبئة نعناعية + أيقونة', en: 'Mint fill · app icon',    axis: 'أعلى وزن بصري — الشريط يقرأ كعرض مميّز داخل النموذج', render: A },
  { id: 'B', name: 'تعبئة نعناعية بلا أيقونة', en: 'Mint fill · no icon',   axis: 'نفس الوزن، عنوان يقود بالمنتج بدل القدرة', render: B },
  { id: 'C', name: 'سطح أبيض بإطار',          en: 'White surface · bordered', axis: 'وزن متوسط — يقرأ كبطاقة تابعة لا كعرض', render: C },
  { id: 'D', name: 'مدمج بخط فاصل',           en: 'Flush · hairline rule',  axis: 'أدنى وزن — يقرأ كحقل إضافي في النموذج', render: D },
];
export const OPTION_BY_ID = Object.fromEntries(OPTIONS.map((o) => [o.id, o]));
