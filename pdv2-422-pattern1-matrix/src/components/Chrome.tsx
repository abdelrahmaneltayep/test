import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/store';

/* ── Toast ──────────────────────────────────────────────────── */
export function ToastHost() {
  const toast = useStore((s) => s.toast);
  const clear = useStore((s) => s.clearToast);
  return (
    <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.id} initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex max-w-lg items-center gap-3 rounded-md border px-4 py-2.5 text-[13px] font-semibold shadow-lg
              ${toast.tone === 'error' ? 'border-salla-danger-500/30 bg-salla-danger-50 text-salla-danger-700'
                                       : 'border-salla-success-500/30 bg-salla-success-50 text-salla-success-700'}`}>
            <span aria-hidden="true">{toast.tone === 'error' ? '⚠️' : '✅'}</span>
            <span className="flex-1">{toast.msg}</span>
            <button type="button" onClick={clear} aria-label="إغلاق" className="text-lg leading-none opacity-60 hover:opacity-100">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Confetti (canvas, one-shot, respects reduced motion) ───── */
const C = ['#00AD6B', '#C7EEDF', '#004D40', '#3D7A6E', '#F5A623'];
export function Confetti() {
  const fire = useStore((s) => s.confetti);
  const stop = useStore((s) => s.stopConfetti);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!fire) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { stop(); return; }
    const cv = ref.current; const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = (cv.width = cv.offsetWidth * dpr), h = (cv.height = cv.offsetHeight * dpr);
    ctx.scale(dpr, dpr);
    const P = Array.from({ length: 80 }, () => ({
      x: w / dpr / 2, y: h / dpr / 3, vx: (Math.random() - .5) * 9, vy: Math.random() * -11 - 3,
      s: Math.random() * 6 + 3, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
      c: C[Math.floor(Math.random() * C.length)],
    }));
    let raf = 0, fr = 0;
    const tick = () => {
      fr++; ctx.clearRect(0, 0, w, h);
      P.forEach((p) => {
        p.vy += .32; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, 1 - fr / 100); ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore();
      });
      if (fr < 100) raf = requestAnimationFrame(tick); else stop();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fire, stop]);
  if (!fire) return null;
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[190] h-full w-full" />;
}
