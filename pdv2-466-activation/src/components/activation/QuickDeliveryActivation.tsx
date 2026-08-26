import { useMemo, useReducer, useState } from 'react';
import { ActivationScreen, ProviderDisclosure } from './ActivationScreen';
import { FeesConsentBlock, SetupDisclosure } from './SetupDisclosure';
import { ActivationProgress } from './ActivationProgress';
import { ActivationResult } from './ActivationResult';
import { buildPlan } from '../../domain/activationPlan';
import { initRun, reducer } from '../../domain/activationMachine';
import { runActivation } from '../../domain/runner';
import { blockerFor, type MerchantState } from '../../domain/merchantState';

/**
 * The component under test. One prop: MerchantState.
 *
 * It owns the run machine and the ⟨466⟩ additions, and hands the live screen
 * its slots. The screen itself stays layout-only, so a change to the SI-311
 * layout does not touch activation logic and vice versa.
 */
export function QuickDeliveryActivation({ state, timings }:
  { state: MerchantState; timings?: { stepDelay: number; itemDelay: number } }) {
  const [feesConsented, setFeesConsented] = useState(false);
  const [routesResolved, setRoutesResolved] = useState(false);

  const plan = useMemo(() => buildPlan(state), [state]);
  const [run, dispatch] = useReducer(reducer, plan, initRun);
  const blocker = blockerFor(state, feesConsented, routesResolved);

  const start = () => void runActivation({
    plan, state: run, dispatch, forcePartialFailure: state.forcePartialFailure,
    stepDelay: timings?.stepDelay, itemDelay: timings?.itemDelay,
  });
  const retry = (index: number) => void runActivation({
    plan, state: run, dispatch, forcePartialFailure: false, onlyStep: index,
    stepDelay: timings?.stepDelay, itemDelay: timings?.itemDelay,
  });
  const reset = () => window.location.reload();

  if (run.phase === 'running') {
    return <ActivationProgress plan={plan} run={run} onRetry={retry} />;
  }
  if (run.phase === 'succeeded' || run.phase === 'partial') {
    return (
      <div className="space-y-5">
        <ActivationResult plan={plan} run={run} onRetry={retry} onReset={reset} />
        <ActivationProgress plan={plan} run={run} onRetry={retry} />
      </div>
    );
  }

  const blockerNote = blocker && {
    'no-ksa-branches':  'لا يمكن الإطلاق بدون فرع داخل السعودية.',
    'routes-conflict':  'اختر ما يحدث لمساراتك المتعارضة قبل الإطلاق.',
    'fees-unconsented': 'الموافقة على الرسوم مطلوبة قبل تفعيل مرسول.',
  }[blocker];

  return (
    <ActivationScreen
      state={state}
      onLaunch={start}
      launchBlocked={blocker !== null}
      blockerNote={blockerNote ?? undefined}
      extras={{
        providerDisclosure: (
          <ProviderDisclosure state={state} routesResolved={routesResolved}
            onResolveRoutes={() => setRoutesResolved(true)} />
        ),
        beforeLaunch: (
          <>
            {state.feesRequireConsent && (
              <FeesConsentBlock consented={feesConsented} onChange={setFeesConsented} />
            )}
            <SetupDisclosure state={state} />
          </>
        ),
      }}
    />
  );
}
