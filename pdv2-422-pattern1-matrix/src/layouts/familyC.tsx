import { useState } from 'react';
import { Button, Mono, SallaMono, Tag } from '../components/ui';
import { InlineError, SummaryStrip, useCrossSell } from '../components/Kit';
import { COPY } from '../lib/copy';
import { n } from '../lib/num';
import type { LayoutDef } from './types';

const Benefits = () => (
  <ul className="flex flex-wrap gap-1.5">
    {['إسناد آلي', 'تتبع مباشر', 'تقارير موحدة'].map((c) => (
      <li key={c}><Tag v="muted">✓ {c}</Tag></li>
    ))}
  </ul>
);

/* L11 — Compact card below the dropdown (v1.0 baseline) */
function L11() {
  const { surface, activating, fire, promo, trialExpired } = useCrossSell();
  if (surface === 'hidden') return null;
  if (surface === 'success' || surface === 'already') return <SummaryStrip />;
  return (
    <div className="rounded-md border border-salla-border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        <Mono />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[14px] font-bold">
            {COPY.heroTitle} <Tag v="rec">✓ {COPY.recommended}</Tag>
            {promo && <Tag v="credit">🎁 {COPY.creditOffer}</Tag>}
          </p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-salla-text-2">{COPY.heroDesc}</p>
        </div>
      </div>
      <Benefits />
      <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-salla-border pt-3">
        <Button loading={activating} onClick={() => fire()}>{trialExpired ? 'إعادة التفعيل' : COPY.ctaActivate}</Button>
        <span className="text-[11.5px] text-salla-text-2">{trialExpired ? COPY.trialExpired : `تجربة مجانية — ثم من ${n(5)} ر.س لكل فرع شهرياً`}</span>
      </div>
      <div className="mt-2"><InlineError onRetry={() => fire()} /></div>
    </div>
  );
}

/* L12 — Sticky right-rail card (desktop only) */
function L12() {
  const { surface, activating, fire } = useCrossSell();
  if (surface === 'hidden') return null;
  return (
    <div className="max-w-[280px] rounded-md border border-salla-border bg-white p-4 shadow-sm">
      {surface === 'success' || surface === 'already' ? <SummaryStrip compact /> : (
        <>
          <Mono size={36} />
          <p className="mt-2.5 text-[13.5px] font-bold">{COPY.heroTitle}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-salla-text-2">{COPY.inlineDesc}</p>
          <Button className="mt-3 w-full" loading={activating} onClick={() => fire()}>{COPY.ctaActivate}</Button>
          <div className="mt-2"><InlineError onRetry={() => fire()} /></div>
        </>
      )}
      <p className="mt-2 text-[11px] text-salla-text-2">سطح جانبي — سطح المكتب فقط</p>
    </div>
  );
}

/* L13 — Split hero framing Salla vs Tayaar */
function L13() {
  const { surface, activating, fire } = useCrossSell();
  if (surface === 'hidden') return null;
  if (surface === 'success' || surface === 'already') return <SummaryStrip />;
  return (
    <div className="grid gap-3 rounded-lg border border-salla-border bg-white p-4 sm:grid-cols-2">
      <div className="rounded-md bg-salla-soft p-3.5">
        <SallaMono size={32} />
        <p className="mt-2 text-[13.5px] font-bold">بوليصات سلة</p>
        <p className="mt-1 text-[12px] leading-relaxed text-salla-text-2">سلة تختار أفضل مزود لكل طلب تلقائياً في {n(23)} مدينة.</p>
        <Tag v="muted">جاهز فوراً</Tag>
      </div>
      <div className="rounded-md bg-salla-mint p-3.5">
        <Mono size={32} />
        <p className="mt-2 flex flex-wrap items-center gap-2 text-[13.5px] font-bold">{COPY.heroTitle} <Tag v="rec">✓ {COPY.recommended}</Tag></p>
        <p className="mt-1 text-[12px] leading-relaxed text-salla-text-2">{COPY.heroDesc}</p>
        <Button className="mt-2.5" size="sm" loading={activating} onClick={() => fire()}>فعّل تيار</Button>
        <InlineError onRetry={() => fire()} />
      </div>
    </div>
  );
}

/* L14 — Edge tab that expands on hover/tap */
function L14() {
  const { surface, activating, fire } = useCrossSell();
  const [open, setOpen] = useState(false);
  if (surface === 'hidden') return null;
  if (surface === 'success' || surface === 'already') return <SummaryStrip compact />;
  return (
    <div className="flex justify-end">
      <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        {open ? (
          <div className="w-[280px] rounded-md border border-salla-border bg-white p-4 shadow-lg">
            <Mono size={32} />
            <p className="mt-2 text-[13.5px] font-bold">{COPY.heroTitle}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-salla-text-2">{COPY.inlineDesc}</p>
            <Button className="mt-3 w-full" size="sm" loading={activating} onClick={() => fire()}>{COPY.ctaActivate}</Button>
            <InlineError onRetry={() => fire()} />
          </div>
        ) : (
          <button type="button" onClick={() => setOpen(true)} aria-expanded={false}
            className="flex h-24 w-10 flex-col items-center justify-center gap-1 rounded-s-md bg-salla-primary text-white">
            <Mono size={20} />
            <span className="text-[10px] [writing-mode:vertical-rl]">طيّار</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* L15 — Helper card just above the launch CTA */
function L15() {
  const { surface, activating, fire } = useCrossSell();
  if (surface === 'hidden') return null;
  if (surface === 'success' || surface === 'already') return <SummaryStrip compact />;
  return (
    <div className="rounded-md border border-salla-warning-500/40 bg-salla-warning-50 p-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <span aria-hidden="true" className="text-lg">⚡</span>
        <div className="min-w-[200px] flex-1">
          <p className="text-[13px] font-bold text-salla-warning-700">قبل الإطلاق — فعّل طيار لضمان الوفاء بالوعد</p>
          <p className="text-[12px] leading-relaxed text-salla-warning-700/85">{COPY.inlineDesc}</p>
        </div>
        <Button size="sm" loading={activating} onClick={() => fire()}>{COPY.ctaActivateNow}</Button>
      </div>
      <div className="mt-2"><InlineError onRetry={() => fire()} /></div>
    </div>
  );
}

export const FAMILY_C: LayoutDef[] = [
  { id:'L11', family:'C', name:'بطاقة مدمجة تحت القائمة', en:'Compact card below dropdown', slot:'belowDropdown', footprint:'١٨٠ بكسل', visibility:'متوسطة', mobile:'نعم', effort:'S', verdict:'ship', rationale:'خط الأساس من v1.0 — وزن متوسط', render:() => <L11 /> },
  { id:'L12', family:'C', name:'بطاقة جانبية ثابتة', en:'Right-side sticky card', slot:'rail', footprint:'عمود ٢٨٠', visibility:'عالية', mobile:'لا', effort:'M', verdict:'defer', rationale:'سطح مكتب فقط · لا يعمل على الجوال', render:() => <L12 /> },
  { id:'L13', family:'C', name:'بطاقة بطل مقسومة', en:'Split hero card', slot:'top', footprint:'٢٠٠ بكسل', visibility:'عالية جداً', mobile:'تكديس', effort:'M', verdict:'defer', rationale:'تأطير القرار — ليست لمن اختار شحن خاص أصلاً', render:() => <L13 /> },
  { id:'L14', family:'C', name:'لوحة جانبية عائمة', en:'Floating side panel', slot:'edge', footprint:'لسان ٤٠', visibility:'منخفضة', mobile:'تكديس', effort:'M', verdict:'defer', rationale:'وزن بصري أدنى · إتاحة دائمة', render:() => <L14 /> },
  { id:'L15', family:'C', name:'بطاقة في قسم الإطلاق', en:'Card in launch section', slot:'launch', footprint:'٩٦ بكسل', visibility:'عالية', mobile:'نعم', effort:'S', verdict:'MVP', rationale:'يعترض لحظة الإطلاق — أعلى نية', render:() => <L15 /> },
];
