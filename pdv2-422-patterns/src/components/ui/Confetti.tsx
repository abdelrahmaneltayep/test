import { useEffect, useRef } from 'react';

const COLORS = ['#00AD6B', '#A3FFE5', '#004A57', '#348D9D', '#E8A33D'];

/**
 * One-shot particle burst for happy moments (ST3 activation).
 * Canvas rather than DOM nodes — cheaper, and no layout thrash.
 * Skipped entirely when the viewer prefers reduced motion.
 */
export function Confetti({ fire, onDone }: { fire: boolean; onDone?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!fire) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { onDone?.(); return; }

    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = (canvas.width = canvas.offsetWidth * dpr);
    const h = (canvas.height = canvas.offsetHeight * dpr);
    ctx.scale(dpr, dpr);

    const parts = Array.from({ length: 90 }, () => ({
      x: w / dpr / 2,
      y: h / dpr / 3,
      vx: (Math.random() - 0.5) * 9,
      vy: Math.random() * -11 - 3,
      size: Math.random() * 6 + 3,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    let raf = 0;
    let frame = 0;
    const tick = () => {
      frame += 1;
      ctx.clearRect(0, 0, w, h);
      parts.forEach((p) => {
        p.vy += 0.32;          // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - frame / 110);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (frame < 110) raf = requestAnimationFrame(tick);
      else onDone?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fire, onDone]);

  if (!fire) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[190] h-full w-full"
    />
  );
}
