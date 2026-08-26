import { AlertBox, Button, Panel, ProgressBar, Tag } from '../twilight';
import type { PlanStep } from '../../domain/activationPlan';
import {
  failedStepIndex, progressPercent, retainedSteps, type RunState,
} from '../../domain/activationMachine';

/** Per-step list with per-item results. Composed — there is no Twilight stepper. */
export function ActivationProgress({ plan, run, onRetry }:
  { plan: PlanStep[]; run: RunState; onRetry: (index: number) => void }) {
  const pct = progressPercent(run);
  const failedIdx = failedStepIndex(run);
  const kept = retainedSteps(run);

  return (
    <Panel title="جارٍ تجهيز متجرك" desc="نُنفّذ الخطوات بالترتيب — يمكنك متابعة كل خطوة.">
      <ProgressBar
        label={run.phase === 'partial' ? 'توقّف التنفيذ عند خطوة' : 'تقدّم التفعيل'}
        desc={`${run.steps.filter((s) => s.status === 'done').length} من ${run.steps.length} خطوات مكتملة`}
        percentage={pct} />

      <ol className="mt-5 space-y-2.5">
        {run.steps.map((s, i) => {
          const step = plan[i];
          const failed = s.status === 'failed';
          return (
            <li key={s.id}
              className={`rounded-lg border p-3.5 ${failed ? 'border-danger/40 bg-[#FEF1F1]' : 'border-gray-400 bg-white'}`}>
              <div className="flex flex-wrap items-center gap-3">
                <StepGlyph status={s.status} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold">
                    {s.status === 'done' ? step.doneLabel : step.label}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-dark-200">{step.reason}</p>
                </div>
                {s.status === 'running' && <Tag theme="info">جارٍ التنفيذ</Tag>}
                {s.status === 'done' && <Tag theme="success">تم</Tag>}
                {s.status === 'pending' && <Tag theme="default">بالانتظار</Tag>}
                {failed && <Tag theme="danger">فشل</Tag>}
              </div>

              {/* Per-item results — only for steps that operate per branch. */}
              {s.items && s.items.length > 0 && (
                <ul className="mt-2.5 space-y-1.5 ps-8">
                  {s.items.map((it) => (
                    <li key={it.id} className="flex flex-wrap items-center gap-2 text-[12px]">
                      <span aria-hidden="true" className={
                        it.status === 'done' ? 'text-success' : it.status === 'failed' ? 'text-danger' : 'text-dark-200'}>
                        {it.status === 'done' ? '✓' : it.status === 'failed' ? '✕' : '·'}
                      </span>
                      <span className={it.status === 'failed' ? 'font-semibold' : ''}>{it.name}</span>
                      {it.error && <span className="text-[11.5px] text-danger">— {it.error}</span>}
                    </li>
                  ))}
                </ul>
              )}

              {failed && (
                <div className="mt-3 ps-8">
                  <AlertBox theme="danger" icon="⚠️" title={s.error ?? 'فشلت هذه الخطوة'}
                    action={<Button theme="default" size="sm" onClick={() => onRetry(i)}>
                      إعادة محاولة هذه الخطوة فقط
                    </Button>}>
                    الخطوات التي اكتملت قبلها لم تُلغَ. سنعيد المحاولة على العناصر المتعثّرة وحدها.
                  </AlertBox>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Make "no rollback" legible, not just true. */}
      {run.phase === 'partial' && kept.length > 0 && (
        <div className="mt-4">
          <AlertBox theme="secondary" icon="✓" title={`${kept.length} خطوة اكتملت ولم تُلغَ`}>
            {kept.map((s) => plan[run.steps.indexOf(s)]?.doneLabel).filter(Boolean).join('، ')}.
            لن نتراجع عن أي خطوة نجحت — إعادة المحاولة تخصّ الخطوة المتعثّرة فقط
            {failedIdx >= 0 ? ` (${plan[failedIdx]?.label})` : ''}.
          </AlertBox>
        </div>
      )}
    </Panel>
  );
}

function StepGlyph({ status }: { status: RunState['steps'][number]['status'] }) {
  const base = 'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold';
  if (status === 'done')    return <span aria-hidden="true" className={`${base} bg-success text-white`}>✓</span>;
  if (status === 'failed')  return <span aria-hidden="true" className={`${base} bg-danger text-white`}>✕</span>;
  if (status === 'running') return <span aria-hidden="true" className={`${base} border-2 border-primary/30 border-t-primary animate-spin`} />;
  return <span aria-hidden="true" className={`${base} bg-gray-400 text-dark-200`}>·</span>;
}
