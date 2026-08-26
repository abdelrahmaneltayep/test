import { AlertBox, Button, Panel, Tag } from '../twilight';
import type { PlanStep } from '../../domain/activationPlan';
import { failedItems, retainedSteps, type RunState } from '../../domain/activationMachine';

export function ActivationResult({ plan, run, onRetry, onReset }:
  { plan: PlanStep[]; run: RunState; onRetry: (i: number) => void; onReset: () => void }) {
  const kept = retainedSteps(run);
  const bad = failedItems(run);

  if (run.phase === 'succeeded') {
    return (
      <Panel title="تم تفعيل التوصيل السريع"
        footer={<Button theme="default" onClick={onReset}>العودة لإعدادات الشحن</Button>}>
        <AlertBox theme="secondary" icon="🎉" title="متجرك جاهز">
          {kept.map((s) => plan[run.steps.indexOf(s)]?.doneLabel).filter(Boolean).join(' · ')}.
        </AlertBox>
        <ul className="mt-4 flex flex-wrap gap-2">
          {kept.map((s) => (
            <li key={s.id}><Tag theme="success">✓ {plan[run.steps.indexOf(s)]?.doneLabel}</Tag></li>
          ))}
        </ul>
      </Panel>
    );
  }

  const failedIdx = run.steps.findIndex((s) => s.status === 'failed');
  return (
    <Panel title="اكتمل التفعيل جزئياً"
      footer={
        <div className="flex flex-wrap gap-2">
          <Button theme="default" onClick={() => onRetry(failedIdx)}>إعادة محاولة الخطوة المتعثّرة</Button>
          <Button theme="white" outlined onClick={onReset}>لاحقاً</Button>
        </div>
      }>
      <AlertBox theme="warning" icon="⚠️" title="بعض الخطوات لم تكتمل">
        متجرك ليس في حالة نصف مُعدّة: ما اكتمل ثابت، وما تعثّر وحده يحتاج إعادة محاولة.
      </AlertBox>

      {bad.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[12.5px] font-semibold">العناصر المتعثّرة</p>
          <ul className="space-y-1.5">
            {bad.map((i) => (
              <li key={i.step + i.id} className="flex flex-wrap items-center gap-2 text-[12.5px]">
                <Tag theme="danger">✕ {i.name}</Tag>
                <span className="text-dark-200">{i.error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {kept.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[12.5px] font-semibold">اكتمل ولم يُلغَ</p>
          <ul className="flex flex-wrap gap-2">
            {kept.map((s) => (
              <li key={s.id}><Tag theme="success">✓ {plan[run.steps.indexOf(s)]?.doneLabel}</Tag></li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
