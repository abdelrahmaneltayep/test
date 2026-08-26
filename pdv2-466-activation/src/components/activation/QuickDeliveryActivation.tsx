import { useMemo, useReducer, useState } from 'react';
import { Button, Panel } from '../twilight';
import {
  BranchScopeList, FeesConsent, MarketLinkingNotice, ProviderConfirmCard, RouteConflictResolver,
} from './parts';
import { ActivationProgress } from './ActivationProgress';
import { ActivationResult } from './ActivationResult';
import { buildPlan, skippedReasons } from '../../domain/activationPlan';
import { initRun, reducer } from '../../domain/activationMachine';
import { runActivation } from '../../domain/runner';
import { blockerFor, ksaBranches, type MerchantState } from '../../domain/merchantState';

/**
 * The component under test.
 *
 * Its only input is MerchantState. Everything else — which steps run, what the
 * merchant is told, whether the CTA is enabled — is derived. There is no branching
 * on "which scenario are we in": scenarios are just different MerchantState values.
 */
export function QuickDeliveryActivation({ state, timings }:
  { state: MerchantState; timings?: { stepDelay: number; itemDelay: number } }) {
  const [feesConsented, setFeesConsented] = useState(false);
  const [routesResolved, setRoutesResolved] = useState(false);

  const plan = useMemo(() => buildPlan(state), [state]);
  const [run, dispatch] = useReducer(reducer, plan, initRun);
  const skipped = skippedReasons(state);
  const blocker = blockerFor(state, feesConsented, routesResolved);

  const start = () => {
    void runActivation({
      plan, state: run, dispatch,
      forcePartialFailure: state.forcePartialFailure,
      stepDelay: timings?.stepDelay, itemDelay: timings?.itemDelay,
    });
  };
  const retry = (index: number) => {
    void runActivation({
      plan, state: run, dispatch, forcePartialFailure: false, onlyStep: index,
      stepDelay: timings?.stepDelay, itemDelay: timings?.itemDelay,
    });
  };
  const reset = () => { dispatch({ type: 'retry', index: -1 }); window.location.reload(); };

  /* ── Phase: running / finished ─────────────────────────────── */
  if (run.phase === 'running') {
    return <div className="space-y-4"><ActivationProgress plan={plan} run={run} onRetry={retry} /></div>;
  }
  if (run.phase === 'succeeded' || run.phase === 'partial') {
    return (
      <div className="space-y-4">
        <ActivationResult plan={plan} run={run} onRetry={retry} onReset={reset} />
        <ActivationProgress plan={plan} run={run} onRetry={retry} />
      </div>
    );
  }

  /* ── Phase: idle — the confirm screen ──────────────────────── */
  const ksaCount = ksaBranches(state).length;
  return (
    <div className="space-y-4">
      <ProviderConfirmCard state={state} />

      {state.mrsool === 'conflicting-routes' && (
        <RouteConflictResolver resolved={routesResolved} onResolve={() => setRoutesResolved(true)} />
      )}

      <BranchScopeList state={state} />

      {ksaCount > 0 && <MarketLinkingNotice state={state} />}

      {state.feesRequireConsent && (
        <FeesConsent consented={feesConsented} onChange={setFeesConsented} />
      )}

      <Panel title="ما الذي سيحدث عند التأكيد"
        desc="هذه هي الخطوات التي سنُنفّذها نيابةً عنك — لا إعداد يدوي مطلوب.">
        <ol className="space-y-2">
          {plan.map((s, i) => (
            <li key={s.id} className="flex gap-3 rounded-lg bg-gray-200 p-3">
              <span aria-hidden="true" className="tabular grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">{i + 1}</span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold">{s.label}</span>
                <span className="block text-[11.5px] text-dark-200">{s.reason}</span>
              </span>
            </li>
          ))}
        </ol>
        {skipped.length > 0 && (
          <ul className="mt-3 space-y-1">
            {skipped.map((r) => (
              <li key={r} className="flex gap-2 text-[12px] text-dark-200"><span aria-hidden="true">✓</span>{r}</li>
            ))}
          </ul>
        )}
      </Panel>

      {blocker && <BlockerNotice blocker={blocker} />}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-400 bg-white p-5 shadow-sm">
        <p className="min-w-[200px] flex-1 text-[12.5px] text-dark-200">
          <b className="block text-[13.5px] text-dark">جاهز للتفعيل؟</b>
          {plan.length} خطوات تُنفَّذ تلقائياً · يمكنك تعديل الإعدادات لاحقاً.
        </p>
        <Button theme="secondary" size="lg" disabled={blocker !== null} onClick={start}>
          تأكيد وتفعيل التوصيل السريع
        </Button>
      </div>
    </div>
  );
}

function BlockerNotice({ blocker }: { blocker: NonNullable<ReturnType<typeof blockerFor>> }) {
  const copy = {
    'no-ksa-branches':  'لا يمكن التفعيل بدون فرع داخل السعودية.',
    'routes-conflict':  'اختر ما يحدث لمساراتك المتعارضة قبل المتابعة.',
    'fees-unconsented': 'الموافقة على الرسوم مطلوبة قبل تفعيل مرسول.',
  }[blocker];
  return <p role="status" className="text-[12.5px] font-semibold [color:var(--xx-fallback-warning-fg)]">{copy}</p>;
}
