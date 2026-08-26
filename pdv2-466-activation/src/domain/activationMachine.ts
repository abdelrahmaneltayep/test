import type { PlanStep, StepId } from './activationPlan';

/**
 * Activation runtime.
 *
 * Honest async model, per the brief:
 *   · steps run in order, one at a time
 *   · a step that operates per branch reports a result PER BRANCH
 *   · a failure stops the run at that step — later steps never start
 *   · retry re-runs ONLY the failed step, and within it only the failed items
 *   · there is NO wholesale rollback. Steps that succeeded stay succeeded.
 *
 * That last point is the important one: the merchant does not lose the work that
 * already landed because a later step failed.
 */

export type StepStatus = 'pending' | 'running' | 'done' | 'failed';
export type ItemStatus = 'pending' | 'done' | 'failed';

export interface ItemResult { id: string; name: string; status: ItemStatus; error?: string }

export interface StepState {
  id: StepId;
  status: StepStatus;
  /** null for atomic steps. */
  items: ItemResult[] | null;
  error?: string;
}

export type RunPhase = 'idle' | 'running' | 'succeeded' | 'partial';

export interface RunState {
  phase: RunPhase;
  steps: StepState[];
  /** Index of the step currently running, or the one that failed. */
  cursor: number;
}

export function initRun(plan: PlanStep[]): RunState {
  return {
    phase: 'idle',
    cursor: 0,
    steps: plan.map((s) => ({
      id: s.id,
      status: 'pending',
      items: s.items ? s.items.map((b) => ({ id: b.id, name: b.name, status: 'pending' as const })) : null,
    })),
  };
}

export type Action =
  | { type: 'start' }
  | { type: 'step:begin'; index: number }
  | { type: 'item:done'; index: number; itemId: string }
  | { type: 'item:fail'; index: number; itemId: string; error: string }
  | { type: 'step:done'; index: number }
  | { type: 'step:fail'; index: number; error: string }
  | { type: 'finish' }
  /** Retry a single failed step. Successful items inside it are NOT re-run. */
  | { type: 'retry'; index: number };

export function reducer(state: RunState, a: Action): RunState {
  const steps = state.steps.map((s) => ({ ...s, items: s.items ? s.items.map((i) => ({ ...i })) : null }));

  switch (a.type) {
    case 'start':
      return { ...state, phase: 'running', cursor: 0 };

    case 'step:begin':
      steps[a.index].status = 'running';
      return { ...state, steps, cursor: a.index };

    case 'item:done': {
      const it = steps[a.index].items?.find((i) => i.id === a.itemId);
      if (it) it.status = 'done';
      return { ...state, steps };
    }

    case 'item:fail': {
      const it = steps[a.index].items?.find((i) => i.id === a.itemId);
      if (it) { it.status = 'failed'; it.error = a.error; }
      return { ...state, steps };
    }

    case 'step:done':
      steps[a.index].status = 'done';
      steps[a.index].error = undefined;
      return { ...state, steps };

    case 'step:fail':
      steps[a.index].status = 'failed';
      steps[a.index].error = a.error;
      // Everything after a failure stays pending — it never ran.
      return { ...state, steps, phase: 'partial', cursor: a.index };

    case 'finish':
      return { ...state, phase: steps.some((s) => s.status === 'failed') ? 'partial' : 'succeeded' };

    case 'retry':
      steps[a.index].status = 'pending';
      steps[a.index].error = undefined;
      // Only failed items are reset. Items that landed are left alone.
      steps[a.index].items?.forEach((i) => { if (i.status === 'failed') { i.status = 'pending'; i.error = undefined; } });
      return { ...state, steps, phase: 'running', cursor: a.index };

    default:
      return state;
  }
}

/* ── Selectors the UI reads ──────────────────────────────────── */

export const completedStepCount = (r: RunState) => r.steps.filter((s) => s.status === 'done').length;

export const progressPercent = (r: RunState) =>
  r.steps.length === 0 ? 0 : Math.round((completedStepCount(r) / r.steps.length) * 100);

export const failedStepIndex = (r: RunState) => r.steps.findIndex((s) => s.status === 'failed');

export const failedItems = (r: RunState) =>
  r.steps.flatMap((s) => (s.items ?? []).filter((i) => i.status === 'failed').map((i) => ({ step: s.id, ...i })));

/** Steps that landed before the failure — proof that nothing was rolled back. */
export const retainedSteps = (r: RunState) => r.steps.filter((s) => s.status === 'done');
