import type { PlanStep } from './activationPlan';
import type { Action, RunState } from './activationMachine';

/**
 * Drives the machine. Mocked timings — no network anywhere in this prototype.
 *
 * Failure injection is deterministic so the harness can demonstrate the partial
 * path on cue rather than hoping for a random roll:
 *   · `forcePartialFailure` fails the LAST per-item step, on its LAST item.
 *     That is the worst realistic case — most of the work landed, one branch didn't.
 */
export interface RunnerOpts {
  plan: PlanStep[];
  forcePartialFailure: boolean;
  dispatch: (a: Action) => void;
  /** Overridable so tests can run fast. */
  stepDelay?: number;
  itemDelay?: number;
  /** When retrying, only this step index runs. */
  onlyStep?: number;
  /** Current state, so a retry knows which items already landed. */
  state: RunState;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runActivation(o: RunnerOpts): Promise<void> {
  const { plan, dispatch, state } = o;
  const stepDelay = o.stepDelay ?? 620;
  const itemDelay = o.itemDelay ?? 260;

  // Fail the FIRST per-item step. Deliberate: it leaves later steps visibly
  // pending, which is how the "no wholesale rollback, later steps never ran"
  // property becomes observable rather than merely true.
  const failStepIdx = o.forcePartialFailure
    ? plan.findIndex((s) => s.items !== null)
    : -1;

  const indices = o.onlyStep !== undefined
    ? [o.onlyStep]
    : plan.map((_, i) => i);

  if (o.onlyStep === undefined) dispatch({ type: 'start' });

  for (const i of indices) {
    const step = plan[i];
    dispatch({ type: 'step:begin', index: i });
    await wait(stepDelay);

    if (step.items) {
      // On a retry, items that already landed are skipped entirely.
      const already = state.steps[i]?.items ?? [];
      const todo = step.items.filter((b) => {
        const prior = already.find((x) => x.id === b.id);
        return !prior || prior.status !== 'done';
      });

      let anyFailed = false;
      for (const b of todo) {
        await wait(itemDelay);
        // The injected failure only fires on the first run, never on retry.
        const shouldFail = i === failStepIdx && b.id === todo[todo.length - 1].id && o.onlyStep === undefined;
        if (shouldFail) {
          dispatch({ type: 'item:fail', index: i, itemId: b.id, error: 'تعذّر تحديث هذا الفرع' });
          anyFailed = true;
        } else {
          dispatch({ type: 'item:done', index: i, itemId: b.id });
        }
      }

      if (anyFailed) {
        dispatch({ type: 'step:fail', index: i, error: 'لم تكتمل بعض الفروع في هذه الخطوة' });
        return;   // later steps never start
      }
    }

    dispatch({ type: 'step:done', index: i });
  }

  dispatch({ type: 'finish' });
}
