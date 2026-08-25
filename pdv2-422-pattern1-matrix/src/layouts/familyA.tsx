import { Button, Mono, SallaMono, Tag } from '../components/ui';
import { InlineError, SummaryStrip, useCrossSell } from '../components/Kit';
import { COPY } from '../lib/copy';
import type { LayoutDef } from './types';

/** Shared: what every layout shows once activation succeeded / is gated. */
function useShell() {
  const cs = useCrossSell();
  return cs;
}

/* L1 — Top-of-page hero banner (reference #2) */
function L1() {
  const { surface, activating, fire, promo } = useShell();
  if (surface === 'success' || surface === 'already') return <SummaryStrip />;
  if (surface === 'hidden') return null;
  return (
    <section className="rounded-lg border border-salla-border bg-white p-5">
      <div className="mb-3 flex items-start gap-3">
        <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-salla-danger-50 text-lg">🛵</span>
        <div>
          <h3 className="text-[15px] font-bold">{COPY.heroKicker}</h3>
          <p className="text-[12.5px] leading-relaxed text-salla-text-2">{COPY.heroKickerDesc}</p>
        </div>
      </div>
      <div className="rounded-md bg-salla-mint p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 rounded-md bg-white/70 px-1.5 py-1"><SallaMono size={20} /><span aria-hidden="true" className="text-[11px] text-salla-text-2">×</span><Mono size={20} /></span>
          {promo && <Tag v="credit">🎁 {COPY.creditOffer}</Tag>}
          {!promo && <Tag v="credit">🎁 {COPY.creditOffer}</Tag>}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[220px] flex-1">
            <h4 className="text-[15px] font-bold text-salla-primary-700">{COPY.heroTitle}</h4>
            <p className="text-[12.5px] leading-relaxed text-salla-text-2">{COPY.heroDesc}</p>
          </div>
          <Button variant="mint" loading={activating} onClick={() => fire()}
            className="border border-salla-primary/15">{COPY.ctaInstall}</Button>
        </div>
        <div className="mt-3"><InlineError onRetry={() => fire()} /></div>
      </div>
    </section>
  );
}

/* L2 — Slim strip under the sub-nav */
function L2() {
  const { surface, activating, fire } = useShell();
  if (surface === 'success' || surface === 'already') return <SummaryStrip compact />;
  if (surface === 'hidden') return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-salla-border bg-salla-primary-50 px-4 py-2.5">
      <Mono size={26} />
      <p className="min-w-[180px] flex-1 text-[13px] font-semibold">{COPY.oneLiner}</p>
      <Tag v="rec">✓ {COPY.recommended}</Tag>
      <Button size="sm" loading={activating} onClick={() => fire()}>{COPY.ctaActivate}</Button>
    </div>
  );
}

/* L3 — Ribbon on the Section 1 header */
function L3() {
  const { surface, activating, fire } = useShell();
  if (surface === 'success' || surface === 'already') return <SummaryStrip compact />;
  if (surface === 'hidden') return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md bg-salla-success-50 px-3 py-1.5">
      <Mono size={22} />
      <span className="text-[12.5px] font-bold text-salla-success-700">طيار — {COPY.recommended} لهذه الخطوة</span>
      <button type="button" onClick={() => fire()} disabled={activating}
        className="ms-auto rounded-full bg-salla-primary px-3 py-1 text-[12px] font-semibold text-white disabled:opacity-50">
        {activating ? '…' : 'فعّل'}
      </button>
    </div>
  );
}

/* L4 — Sticky bottom action bar */
function L4() {
  const { surface, activating, fire } = useShell();
  if (surface === 'success' || surface === 'already') return <SummaryStrip compact />;
  if (surface === 'hidden') return null;
  return (
    <div className="sticky bottom-0 z-20 flex flex-wrap items-center gap-3 rounded-md border border-salla-border bg-white px-4 py-3 shadow-lg">
      <Mono size={30} />
      <div className="min-w-[180px] flex-1">
        <p className="text-[13px] font-bold">{COPY.heroTitle}</p>
        <p className="text-[11.5px] text-salla-text-2">{COPY.oneLiner}</p>
      </div>
      <Button loading={activating} onClick={() => fire()}>فعّل تيار الآن</Button>
    </div>
  );
}

/* L5 — Divider strip between sections */
function L5() {
  const { surface, activating, fire } = useShell();
  if (surface === 'success' || surface === 'already') return <SummaryStrip compact />;
  if (surface === 'hidden') return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-dashed border-salla-border bg-salla-soft px-3 py-2">
      <span aria-hidden="true">⚡</span>
      <p className="min-w-[160px] flex-1 text-[12.5px]">الخطوة التالية الموصى بها — {COPY.inlineTitle}</p>
      <button type="button" onClick={() => fire()} disabled={activating}
        className="text-[12.5px] font-semibold text-salla-primary underline disabled:opacity-50">{COPY.ctaActivateNow}</button>
    </div>
  );
}

export const FAMILY_A: LayoutDef[] = [
  { id:'L1', family:'A', name:'بانر علوي بلون نعناعي', en:'Top-of-page teal banner', slot:'top', footprint:'٩٦ بكسل', visibility:'عالية جداً', mobile:'تكديس', effort:'S', verdict:'ab', rationale:'أعلى ظهور · مقياس حملة تسويقية', render:() => <L1 /> },
  { id:'L2', family:'A', name:'شريط أسفل الترويسة', en:'Below-header promo strip', slot:'belowHeader', footprint:'٤٨ بكسل', visibility:'عالية', mobile:'نعم', effort:'XS', verdict:'ship', rationale:'ظاهر دائماً · بصمة صغيرة', render:() => <L2 /> },
  { id:'L3', family:'A', name:'شريط على ترويسة القسم', en:'Section-header ribbon', slot:'sectionHeader', footprint:'تراكب', visibility:'متوسطة', mobile:'نعم', effort:'S', verdict:'MVP', rationale:'ملتصق بالقرار لا بالصفحة', render:() => <L3 /> },
  { id:'L4', family:'A', name:'شريط سفلي ثابت', en:'Sticky bottom action bar', slot:'stickyBottom', footprint:'٥٦ بكسل ثابت', visibility:'عالية', mobile:'تكديس', effort:'S', verdict:'defer', rationale:'يتعارض مع ودجة Intercom', render:() => <L4 /> },
  { id:'L5', family:'A', name:'شريط فاصل بين الأقسام', en:'Section-divider strip', slot:'sectionDivider', footprint:'٣٢ بكسل', visibility:'متوسطة', mobile:'نعم', effort:'XS', verdict:'nice', rationale:'توقيت طبيعي بين قرارين', render:() => <L5 /> },
];
