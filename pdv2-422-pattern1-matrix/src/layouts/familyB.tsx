import { useState } from 'react';
import { Button, CheckRow, Mono, Tag } from '../components/ui';
import { BranchChips, BranchTable, InlineError, SummaryStrip, useCrossSell } from '../components/Kit';
import { COPY } from '../lib/copy';
import type { LayoutDef } from './types';

/* L6 — Inline checkbox at the bottom of "شحن خاص" (reference #1) ⭐ MVP */
function L6() {
  const { surface, activating, fire, activated, plan, perBranch } = useCrossSell();
  if (surface === 'hidden') return null;
  if (surface === 'success' || surface === 'already') return <SummaryStrip />;
  if (perBranch) return <div className="space-y-2"><p className="text-[13px] font-bold">{COPY.inlineTitle}</p><BranchTable /></div>;
  return (
    <div className="space-y-2">
      <CheckRow
        id="l6" checked={activated || activating} loading={activating} disabled={plan === 'basic'}
        onChange={(v) => { if (v) fire(); }}
        title={COPY.inlineTitle}
        tag={plan === 'basic' ? <Tag v="muted">🔒 {COPY.lockedPlan}</Tag> : <Tag v="rec">✓ {COPY.recommended}</Tag>}
        desc={COPY.inlineDesc}
      />
      <BranchChips />
      <InlineError onRetry={() => fire()} />
    </div>
  );
}

/* L7 — Mini-card wedged between the two provider radios */
function L7() {
  const { surface, activating, fire } = useCrossSell();
  if (surface === 'hidden') return null;
  if (surface === 'success' || surface === 'already') return <SummaryStrip compact />;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-salla-primary/30 bg-salla-primary-50 p-3">
      <Mono size={34} />
      <div className="min-w-[180px] flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold">{COPY.heroTitle} <Tag v="rec">✓ {COPY.recommended}</Tag></p>
        <p className="text-[12px] text-salla-text-2">{COPY.oneLiner}</p>
      </div>
      <Button size="sm" loading={activating} onClick={() => fire()}>فعّل</Button>
      <div className="w-full"><InlineError onRetry={() => fire()} /></div>
    </div>
  );
}

/* L8 — Accordion revealed when "شحن خاص" is selected */
function L8() {
  const { surface, activating, fire, activated } = useCrossSell();
  const [open, setOpen] = useState(true);
  if (surface === 'hidden') return null;
  if (surface === 'success' || surface === 'already') return <SummaryStrip />;
  return (
    <div className="overflow-hidden rounded-md border border-salla-border">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="flex w-full items-center gap-2 bg-salla-soft px-3 py-2.5 text-start">
        <Mono size={24} />
        <span className="flex-1 text-[13px] font-bold">{COPY.inlineTitle}</span>
        <Tag v="rec">✓ {COPY.recommended}</Tag>
        <span aria-hidden="true" className="text-salla-text-2">{open ? '⌄' : '‹'}</span>
      </button>
      {open && (
        <div className="space-y-2.5 p-3">
          <p className="text-[12.5px] leading-relaxed text-salla-text-2">{COPY.inlineDesc}</p>
          <CheckRow id="l8" checked={activated || activating} loading={activating} onChange={(v) => { if (v) fire(); }}
            title="فعّل طيّار على مناديب هذه الفروع" />
          <InlineError onRetry={() => fire()} />
        </div>
      )}
    </div>
  );
}

/* L9 — Ribbon pinned to the "شحن خاص" radio card */
function L9() {
  const { surface, activating, fire } = useCrossSell();
  if (surface === 'hidden') return null;
  if (surface === 'success' || surface === 'already') return <SummaryStrip compact />;
  return (
    <div className="relative rounded-md border-2 border-salla-success-500/50 p-3 pt-5">
      <span className="absolute -top-2.5 start-3 rounded-full border border-salla-success-500/40 bg-salla-success-50 px-2 py-0.5 text-[11px] font-bold text-salla-success-700">
        ✓ {COPY.recommended}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-[180px] flex-1 text-[13px]">{COPY.inlineTitle}</p>
        <button type="button" onClick={() => fire()} disabled={activating}
          className="text-[12.5px] font-semibold text-salla-primary underline disabled:opacity-50">+ تفعيل طيار</button>
      </div>
      <InlineError onRetry={() => fire()} />
    </div>
  );
}

/* L10 — Tayaar as the first option inside the provider dropdown */
function L10() {
  const { surface, activating, fire, activated } = useCrossSell();
  const [val, setVal] = useState('');
  if (surface === 'hidden') return null;
  if (surface === 'success' || surface === 'already') return <SummaryStrip compact />;
  return (
    <div className="space-y-2">
      <label htmlFor="l10" className="block text-[13px] font-semibold">
        <span aria-hidden="true" className="text-salla-danger-500">* </span>شركة شحن خارجية/مناديب المتجر
      </label>
      <select id="l10" value={val} disabled={activating}
        onChange={(e) => { setVal(e.target.value); if (e.target.value === 'tayaar' && !activated) fire(); }}
        className="salla-select w-full appearance-none rounded-md border border-salla-border bg-white px-3.5 py-2.5 text-[13.5px]">
        <option value="">اختر</option>
        <option value="tayaar">طيار — {COPY.recommended} من سلة</option>
        <option value="carrier">شركة شحن خارجية</option>
        <option value="own">مناديب المتجر</option>
        <option value="both">كلاهما معاً</option>
      </select>
      {activating && <p className="text-[12px] text-salla-text-2">جارٍ تفعيل طيّار…</p>}
      <InlineError onRetry={() => fire()} />
    </div>
  );
}

export const FAMILY_B: LayoutDef[] = [
  { id:'L6',  family:'B', name:'مربع اختيار مضمّن', en:'Inline checkbox', slot:'insidePrivate', footprint:'ضئيلة', visibility:'متوسطة', mobile:'نعم', effort:'XS', verdict:'MVP', rationale:'أقل حمل إدراكي · يقرأ كترقية مجانية داخل النموذج', render:() => <L6 /> },
  { id:'L7',  family:'B', name:'بطاقة صغيرة بين الخيارين', en:'Mini-card between radios', slot:'betweenRadios', footprint:'٩٦ بكسل', visibility:'متوسطة', mobile:'نعم', effort:'S', verdict:'ship', rationale:'وضع نِدّي دون كسر دلالات الراديو', render:() => <L7 /> },
  { id:'L8',  family:'B', name:'أكورديون تحت الخيار', en:'Accordion under radio', slot:'insidePrivate', footprint:'قابل للطي', visibility:'متوسطة', mobile:'نعم', effort:'S', verdict:'ship', rationale:'كشف تدريجي · يبقي النموذج نظيفاً', render:() => <L8 /> },
  { id:'L9',  family:'B', name:'شريط زاوية على الخيار', en:'Ribbon on radio', slot:'insidePrivate', footprint:'تراكب', visibility:'متوسطة', mobile:'نعم', effort:'XS', verdict:'nice', rationale:'يرفع القيمة المُدرَكة للحاوية', render:() => <L9 /> },
  { id:'L10', family:'B', name:'خيار داخل القائمة المنسدلة', en:'Peer entry in dropdown', slot:'dropdownOption', footprint:'ضئيلة', visibility:'منخفضة', mobile:'نعم', effort:'S', verdict:'ship', rationale:'يندمج في الإجراء التالي مباشرة', render:() => <L10 /> },
];
