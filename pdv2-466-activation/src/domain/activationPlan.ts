import {
  autoEnablesFulfilment, ksaBranches, unlinkedKsaBranches,
  type Branch, type MerchantState,
} from './merchantState';

/**
 * The activation plan.
 *
 * Steps are DERIVED from merchant state, never hard-coded — which is why a store
 * with Mrsool already active runs a shorter plan than one without, and why a store
 * without Multi-Markets runs `enable-multi-branch` instead of `link-market`.
 *
 * Read this file to know exactly what the flow will do for any given store.
 */

export type StepId =
  | 'activate-mrsool'
  | 'apply-routes'
  | 'enable-fulfilment'
  | 'link-market'
  | 'enable-multi-branch';

export interface PlanStep {
  id: StepId;
  /** Merchant-facing label. */
  label: string;
  /** What the merchant is told happened, once done. */
  doneLabel: string;
  /** Steps that operate per branch report per-item results; others are atomic. */
  items: Branch[] | null;
  /** The API this step implies. Documented in HANDOFF.md. */
  api: string;
  /** Why this step is in (or out of) the plan for this store. */
  reason: string;
}

export function buildPlan(s: MerchantState): PlanStep[] {
  const ksa = ksaBranches(s);
  const steps: PlanStep[] = [];

  if (s.mrsool === 'inactive') {
    steps.push({
      id: 'activate-mrsool',
      label: 'تفعيل مرسول على متجرك',
      doneLabel: 'مرسول مفعّل',
      items: null,
      api: 'POST /couriers/mrsool/activate',
      reason: 'المزوّد غير مفعّل على المتجر',
    });
  }

  steps.push({
    id: 'apply-routes',
    label: 'تطبيق مسارات الشحن الافتراضية',
    doneLabel: 'المسارات مطبّقة',
    items: null,
    api: 'PUT /couriers/mrsool/routes  (preset: quick-delivery-default)',
    reason: s.mrsool === 'conflicting-routes'
      ? 'استبدال المسارات المتعارضة بعد موافقتك'
      : 'مسارات التوصيل السريع الافتراضية',
  });

  if (autoEnablesFulfilment(s)) {
    steps.push({
      id: 'enable-fulfilment',
      label: 'تفعيل الاستلام والتوصيل للفروع',
      doneLabel: 'الاستلام والتوصيل مفعّلان',
      items: ksa,
      api: 'PATCH /branches/{id}/fulfilment  { pickup: true, delivery: true }',
      reason: `أكثر من فرع محدّد (${ksa.length})`,
    });
  }

  if (s.multiMarkets) {
    const unlinked = unlinkedKsaBranches(s);
    if (unlinked.length > 0) {
      steps.push({
        id: 'link-market',
        label: 'ربط الفروع بالسوق السعودي',
        doneLabel: 'الفروع مرتبطة بالسوق السعودي',
        items: unlinked,
        api: 'POST /markets/sa/branches  { branch_ids: [...] }',
        reason: `${unlinked.length} فرع غير مرتبط بالسوق السعودي`,
      });
    }
  } else {
    steps.push({
      id: 'enable-multi-branch',
      label: 'تفعيل أداة تعدد الفروع',
      doneLabel: 'أداة تعدد الفروع مفعّلة',
      items: null,
      api: 'POST /store/tools/multi-branch/enable',
      reason: 'المتجر لا يملك خاصية تعدد الأسواق',
    });
  }

  return steps;
}

/** Steps that would run but are already satisfied — shown as "no action needed". */
export function skippedReasons(s: MerchantState): string[] {
  const out: string[] = [];
  if (s.mrsool !== 'inactive') out.push('مرسول مفعّل مسبقاً — لا حاجة لتفعيله');
  if (!autoEnablesFulfilment(s) && ksaBranches(s).length === 1)
    out.push('فرع واحد فقط — الاستلام والتوصيل يُضبطان يدوياً');
  if (s.multiMarkets && unlinkedKsaBranches(s).length === 0)
    out.push('كل الفروع مرتبطة بالسوق السعودي مسبقاً');
  return out;
}
