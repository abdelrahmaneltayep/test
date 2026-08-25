import { useEffect, useState } from 'react';
import { AlertBox, Button, Mono, Tag } from './ui';
import { useStore, surfaceOf, type Surface } from '../store/store';
import { COPY } from '../lib/copy';
import { n } from '../lib/num';

/** Everything a layout needs to render itself, derived once. */
export function useCrossSell() {
  const s = useStore();
  const surface: Surface = surfaceOf(s as never);
  const targets = s.branches.filter((b) => b.provider === 'private' && b.eligible);
  const ineligible = s.branches.filter((b) => b.provider === 'private' && !b.eligible);
  return {
    ...s, surface, targets, ineligible,
    /** The single primary action, identical across all 20 layouts. */
    fire: (ids?: string[]) => s.activate(ids),
    canAct: surface === 'default' || surface === 'error' || surface === 'expired',
    title: s.trialExpired ? COPY.trialExpired : COPY.inlineTitle,
    desc: s.returnVisit ? COPY.returnVisit : COPY.inlineDesc,
  };
}

/** Post-activation summary strip — replaces the surface in place (PRD §2). */
export function SummaryStrip({ compact }: { compact?: boolean }) {
  const { branches, error, justActivatedAt, rollback, alreadyActive } = useStore();
  const on = branches.filter((b) => b.activated);
  const failed = branches.filter((b) => b.failed);
  const [left, setLeft] = useState(5);

  // F19 — 5-second undo window.
  useEffect(() => {
    if (!justActivatedAt) return;
    setLeft(5);
    const t = setInterval(() => {
      const gone = Math.floor((Date.now() - justActivatedAt) / 1000);
      setLeft(Math.max(0, 5 - gone));
      if (gone >= 5) clearInterval(t);
    }, 250);
    return () => clearInterval(t);
  }, [justActivatedAt]);

  return (
    <div className="rounded-md border border-salla-success-500/30 bg-salla-success-50 p-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <Mono size={compact ? 32 : 38} />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold text-salla-success-700">
            {alreadyActive ? COPY.stripTitle : COPY.stripTitle}
          </p>
          {!compact && (
            <p className="text-[12.5px] leading-relaxed text-salla-success-700/85">
              {COPY.stripDesc} · {n(on.length)} من {n(branches.length)} فروع
            </p>
          )}
        </div>
        <Tag v="rec">✓ مفعّل</Tag>
        <a href="#" className="text-[12.5px] font-semibold text-salla-primary underline">{COPY.ctaManage} ←</a>
      </div>

      {error === 'partial' && failed.length > 0 && (
        <AlertBox v="warning" icon="⚠️" className="mt-3"
          title={`${n(failed.length)} فرع لم يُفعّل`}>
          {failed.map((b) => b.name).join('، ')} — حاول لاحقاً.
        </AlertBox>
      )}

      {justActivatedAt && left > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-white/70 px-3 py-2">
          <span className="tabular text-[12px] text-salla-text-2">يمكنك التراجع خلال {n(left)} ثوانٍ</span>
          <Button size="sm" variant="secondary" onClick={rollback}>تراجع</Button>
        </div>
      )}
    </div>
  );
}

/** Inline error, always in place of the button — never a modal (PRD §2). */
export function InlineError({ onRetry }: { onRetry: () => void }) {
  const error = useStore((s) => s.error);
  if (error !== 'network' && error !== 'server') return null;
  return (
    <AlertBox v="danger" icon="⚠️" title={error === 'network' ? COPY.errNetwork : COPY.errServer}
      actions={
        <>
          <Button size="sm" variant="danger" onClick={onRetry}>{COPY.ctaRetry}</Button>
          {error === 'server' && <Button size="sm" variant="secondary" onClick={() => {}}>تواصل مع الدعم</Button>}
        </>
      } />
  );
}

/** Plan gate, country gate, and already-active — shared short-circuits. */
export function GateNotice() {
  const { surface, plan } = useCrossSell();
  if (surface === 'hidden') return <p className="text-[12.5px] text-salla-text-2">{COPY.notAvailable}</p>;
  if (surface === 'locked' && plan === 'basic')
    return <Tag v="muted">🔒 {COPY.lockedPlan}</Tag>;
  return null;
}

/** Per-branch eligibility chips, used by the multi-branch flows (F6–F10). */
export function BranchChips() {
  const { targets, ineligible, branches } = useCrossSell();
  const salla = branches.filter((b) => b.provider === 'salla');
  return (
    <div className="flex flex-wrap gap-1.5">
      {targets.map((b) => <Tag key={b.id} v="rec">✓ {b.name}</Tag>)}
      {ineligible.map((b) => <Tag key={b.id} v="credit">⚠ {b.name} — خارج التغطية</Tag>)}
      {salla.map((b) => <Tag key={b.id} v="muted">{b.name} — بوليصات سلة</Tag>)}
    </div>
  );
}

/** Per-branch activation table (F7, F8). */
export function BranchTable() {
  const { branches, fire, activating, activated } = useCrossSell();
  const [picked, setPicked] = useState<string[]>([]);
  const eligible = branches.filter((b) => b.provider === 'private' && b.eligible);
  return (
    <div className="overflow-hidden rounded-md border border-salla-border">
      {eligible.map((b) => (
        <div key={b.id} className="flex flex-wrap items-center gap-3 border-b border-salla-border p-2.5 last:border-b-0">
          <input type="checkbox" id={`bt-${b.id}`} disabled={activating || activated}
            checked={activated || activating ? b.activated || picked.includes(b.id) : picked.includes(b.id)}
            onChange={(e) => setPicked((p) => (e.target.checked ? [...p, b.id] : p.filter((x) => x !== b.id)))}
            className="h-[17px] w-[17px] rounded accent-[color:var(--salla-primary)]" />
          <label htmlFor={`bt-${b.id}`} className="flex-1 text-[13px] font-semibold">{b.name}</label>
          {activated
            ? (b.failed ? <Tag v="danger">⚠ لم يفعّل</Tag> : b.activated ? <Tag v="rec">✓ مفعّل</Tag> : <Tag v="muted">—</Tag>)
            : <Tag v="muted">غير مفعّل</Tag>}
        </div>
      ))}
      {!activated && (
        <div className="bg-salla-soft p-2.5">
          <Button size="sm" loading={activating} disabled={picked.length === 0}
            onClick={() => fire(picked)}>
            {COPY.ctaActivateNow} ({n(picked.length)})
          </Button>
        </div>
      )}
    </div>
  );
}
