import type { MerchantState } from '../domain/merchantState';
import { SCENARIOS } from './scenarios';
import { buildPlan } from '../domain/activationPlan';

/**
 * DEV-ONLY. Not part of the component under test and not shipped.
 * Rendered outside <QuickDeliveryActivation>, which receives only MerchantState.
 * Visually fenced (dashed rail) so nobody mistakes it for product UI.
 */
export function DevHarness({ scenarioId, onPick, state }:
  { scenarioId: string; onPick: (id: string) => void; state: MerchantState }) {
  const plan = buildPlan(state);
  return (
    <aside aria-label="أدوات المطوّر — ليست جزءاً من الواجهة"
      className="rounded-xl border-2 border-dashed border-gray-500 bg-gray-100 p-4">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-dark-200">
        رِف تحكّم للنموذج فقط · ليس جزءاً من المنتج
      </p>
      <p className="mb-3 text-[11.5px] leading-relaxed text-dark-200">
        يغيّر حالة المتجر الممرَّرة للمكوّن. المكوّن نفسه لا يعرف بوجود هذا الرِف.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {SCENARIOS.map((s) => (
          <button key={s.id} type="button" onClick={() => onPick(s.id)}
            aria-pressed={scenarioId === s.id}
            className={`rounded-lg border px-2.5 py-1.5 text-start text-[12px] font-semibold transition
              ${scenarioId === s.id ? 'border-primary bg-primary text-white' : 'border-gray-500 bg-white text-dark-200 hover:border-primary'}`}>
            {s.label}
          </button>
        ))}
      </div>

      <dl className="mt-3 grid gap-x-4 gap-y-1 text-[11.5px] sm:grid-cols-2">
        <div className="flex gap-2"><dt className="text-dark-200">مرسول</dt><dd className="font-semibold">{state.mrsool}</dd></div>
        <div className="flex gap-2"><dt className="text-dark-200">تعدّد الأسواق</dt><dd className="font-semibold">{state.multiMarkets ? 'مفعّل' : 'غير مفعّل'}</dd></div>
        <div className="flex gap-2"><dt className="text-dark-200">فروع سعودية</dt><dd className="tabular font-semibold">{state.branches.filter((b) => b.country === 'SA').length}</dd></div>
        <div className="flex gap-2"><dt className="text-dark-200">رسوم</dt><dd className="font-semibold">{state.feesRequireConsent ? 'تتطلّب موافقة' : 'لا'}</dd></div>
        <div className="flex gap-2 sm:col-span-2">
          <dt className="text-dark-200">الخطة المشتقّة</dt>
          <dd className="font-semibold">{plan.map((s) => s.id).join(' → ')}</dd>
        </div>
      </dl>
    </aside>
  );
}
