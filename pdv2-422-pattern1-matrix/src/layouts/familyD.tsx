import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Mono, Tag } from '../components/ui';
import { InlineError, SummaryStrip, useCrossSell } from '../components/Kit';
import { COPY } from '../lib/copy';
import type { LayoutDef } from './types';

/* L16 — Slide-in toast fired when "شحن خاص" is picked */
function L16() {
  const { surface, activating, fire } = useCrossSell();
  const [show, setShow] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShow(false), 6000); return () => clearTimeout(t); }, []);
  if (surface === 'hidden') return null;
  if (surface === 'success' || surface === 'already') return <SummaryStrip compact />;
  return (
    <div className="min-h-[92px]">
      <AnimatePresence>
        {show ? (
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25 }} role="status"
            className="flex flex-wrap items-center gap-3 rounded-md border border-salla-border bg-white p-3 shadow-lg">
            <Mono size={30} />
            <p className="min-w-[180px] flex-1 text-[13px] font-semibold">طيار جاهز لهذه الشحنات — فعّله الآن</p>
            <Button size="sm" loading={activating} onClick={() => fire()}>فعّل</Button>
            <button type="button" onClick={() => setShow(false)} aria-label="إغلاق" className="text-lg leading-none text-salla-text-2">×</button>
            <div className="w-full"><InlineError onRetry={() => fire()} /></div>
          </motion.div>
        ) : (
          <button type="button" onClick={() => setShow(true)}
            className="text-[12.5px] text-salla-primary underline">إظهار التنبيه مجدداً</button>
        )}
      </AnimatePresence>
    </div>
  );
}

/* L17 — Non-modal dialog on first entry */
function L17() {
  const { surface, activating, fire } = useCrossSell();
  const [open, setOpen] = useState(true);
  if (surface === 'hidden') return null;
  if (surface === 'success' || surface === 'already') return <SummaryStrip compact />;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-[12.5px] text-salla-primary underline">إظهار التعريف مجدداً</button>;
  return (
    <div role="dialog" aria-label="تعريف بتطبيق طيّار" aria-modal="false"
      className="max-w-[320px] rounded-lg border border-salla-border bg-white p-4 shadow-lg">
      <div className="flex items-start gap-2.5">
        <Mono size={34} />
        <div className="flex-1">
          <p className="text-[14px] font-bold">{COPY.heroTitle}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-salla-text-2">{COPY.heroDesc}</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق" className="text-lg leading-none text-salla-text-2">×</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" loading={activating} onClick={() => fire()}>{COPY.ctaActivateNow}</Button>
        <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>أذكرني لاحقاً</Button>
      </div>
      <InlineError onRetry={() => fire()} />
    </div>
  );
}

/* L18 — Popover anchored to the provider dropdown */
function L18() {
  const { surface, activating, fire } = useCrossSell();
  const [open, setOpen] = useState(false);
  if (surface === 'hidden') return null;
  if (surface === 'success' || surface === 'already') return <SummaryStrip compact />;
  return (
    <div className="relative">
      <label htmlFor="l18" className="mb-1.5 block text-[13px] font-semibold">شركة شحن خارجية/مناديب المتجر</label>
      <select id="l18" onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="salla-select w-full appearance-none rounded-md border border-salla-border bg-white px-3.5 py-2.5 text-[13.5px]">
        <option>اختر</option><option>شركة شحن خارجية</option><option>مناديب المتجر</option>
      </select>
      {!open && <p className="mt-1.5 text-[11.5px] text-salla-text-2">ركّز على القائمة لإظهار الاقتراح</p>}
      {open && (
        <div role="tooltip" className="absolute z-10 mt-1.5 w-full rounded-md border border-salla-primary/25 bg-white p-3 shadow-lg">
          <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold"><Mono size={22} /> {COPY.short}</p>
          <Button className="mt-2.5" size="sm" loading={activating} onMouseDown={(e) => e.preventDefault()} onClick={() => fire()}>{COPY.ctaActivate}</Button>
          <InlineError onRetry={() => fire()} />
        </div>
      )}
    </div>
  );
}

/* L19 — Ambient floating pill */
function L19() {
  const { surface, activating, fire } = useCrossSell();
  const [hover, setHover] = useState(false);
  if (surface === 'hidden') return null;
  if (surface === 'success' || surface === 'already') return <SummaryStrip compact />;
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => fire()} disabled={activating}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        aria-label={COPY.oneLiner}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-salla-primary text-white shadow-lg disabled:opacity-60">
        <span aria-hidden="true">⚡</span>
      </button>
      {hover && <span role="tooltip" className="rounded-md bg-salla-text px-2.5 py-1.5 text-[12px] text-white">{COPY.oneLiner}</span>}
      <InlineError onRetry={() => fire()} />
    </div>
  );
}

/* L20 — Full-bleed section that slides in on selecting own couriers */
function L20() {
  const { surface, activating, fire, promo } = useCrossSell();
  if (surface === 'hidden') return null;
  if (surface === 'success' || surface === 'already') return <SummaryStrip />;
  return (
    <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.28 }} className="overflow-hidden rounded-lg bg-salla-mint p-6">
      <div className="flex flex-wrap items-center gap-4">
        <Mono size={52} />
        <div className="min-w-[220px] flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[17px] font-bold text-salla-primary-700">
            {COPY.heroTitle} <Tag v="rec">✓ {COPY.recommended}</Tag>
            {promo && <Tag v="credit">🎁 {COPY.creditOffer}</Tag>}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-salla-text-2">{COPY.heroDesc}</p>
        </div>
        <Button size="lg" loading={activating} onClick={() => fire()}>{COPY.ctaInstall}</Button>
      </div>
      <div className="mt-3"><InlineError onRetry={() => fire()} /></div>
    </motion.section>
  );
}

export const FAMILY_D: LayoutDef[] = [
  { id:'L16', family:'D', name:'تنبيه منزلق عند الاختيار', en:'Slide-in toast', slot:'overlay', footprint:'٤ ثوانٍ', visibility:'متوسطة', mobile:'نعم', effort:'S', verdict:'ab', rationale:'لافت دون التزام تخطيطي دائم', render:() => <L16 /> },
  { id:'L17', family:'D', name:'حوار غير حاجب عند أول دخول', en:'Non-modal first-entry dialog', slot:'overlay', footprint:'٣٢٠ بكسل', visibility:'عالية جداً', mobile:'تكديس', effort:'M', verdict:'defer', rationale:'انطباع أول قوي · يحتاج مراجعة PDPL', render:() => <L17 /> },
  { id:'L18', family:'D', name:'منبثقة على القائمة المنسدلة', en:'Dropdown popover', slot:'overlay', footprint:'تراكب', visibility:'متوسطة', mobile:'نعم', effort:'S', verdict:'ab', rationale:'يعترض التفاعل نفسه لحظة حدوثه', render:() => <L18 /> },
  { id:'L19', family:'D', name:'زر عائم في الزاوية', en:'Floating action pill', slot:'edge', footprint:'٤٠ بكسل', visibility:'منخفضة', mobile:'نعم', effort:'S', verdict:'defer', rationale:'إتاحة محيطية · التزام منخفض', render:() => <L19 /> },
  { id:'L20', family:'D', name:'قسم كامل العرض عند الاختيار', en:'Full-bleed on select', slot:'insidePrivate', footprint:'٢٤٠ بكسل', visibility:'عالية جداً', mobile:'نعم', effort:'M', verdict:'defer', rationale:'كشف تدريجي بأعلى دقة بصرية', render:() => <L20 /> },
];
