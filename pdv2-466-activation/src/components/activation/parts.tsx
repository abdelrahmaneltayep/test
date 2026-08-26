import { AlertBox, Button, Panel, Tag, Toggle } from '../twilight';
import {
  excludedBranches, ksaBranches, unlinkedKsaBranches, autoEnablesFulfilment,
  type MerchantState,
} from '../../domain/merchantState';

/* ── ProviderConfirmCard — "confirm, not configure" ───────────── */
export function ProviderConfirmCard({ state }: { state: MerchantState }) {
  return (
    <Panel title="مزوّد التوصيل السريع" desc="تم اختيار المزوّد نيابةً عنك — راجِع وأكّد.">
      <div className="flex flex-wrap items-start gap-3">
        <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-[15px] font-bold text-white">M</span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[14px] font-bold">
            مرسول
            <Tag theme="secondary">المزوّد الافتراضي</Tag>
            {state.mrsool === 'active' && <Tag theme="success">مفعّل مسبقاً</Tag>}
            {state.mrsool === 'inactive' && <Tag theme="info">سيُفعَّل تلقائياً</Tag>}
            {state.mrsool === 'conflicting-routes' && <Tag theme="warning">مسارات متعارضة</Tag>}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-dark-200">
            مسارات الشحن الافتراضية تُطبَّق تلقائياً — لن تحتاج لمغادرة هذه الصفحة لإعداد المزوّد.
          </p>
        </div>
      </div>
    </Panel>
  );
}

/* ── RouteConflictResolver — blocks until the merchant decides ── */
export function RouteConflictResolver({ resolved, onResolve }:
  { resolved: boolean; onResolve: () => void }) {
  if (resolved) {
    return (
      <AlertBox theme="secondary" icon="✓" title="سيتم استبدال مساراتك الحالية">
        وافقت على تطبيق مسارات التوصيل السريع الافتراضية بدل المسارات المتعارضة.
      </AlertBox>
    );
  }
  return (
    <AlertBox theme="warning" icon="⚠️" title="مسارات الشحن الحالية تتعارض مع التوصيل السريع"
      action={<Button theme="default" size="sm" onClick={onResolve}>استبدال المسارات والمتابعة</Button>}>
      متجرك يستخدم مسارات مرسول مختلفة عن مسارات التوصيل السريع. لا يمكن المتابعة قبل أن تختار.
    </AlertBox>
  );
}

/* ── BranchScopeList — KSA only, with the exclusion made visible ─ */
export function BranchScopeList({ state }: { state: MerchantState }) {
  const ksa = ksaBranches(state);
  const excluded = excludedBranches(state);

  if (ksa.length === 0) {
    return (
      <Panel title="الفروع المشمولة">
        <AlertBox theme="warning" icon="⚠️" title="لا توجد فروع داخل السعودية"
          action={<Button theme="default" size="sm" outlined>إضافة فرع</Button>}>
          التوصيل السريع متاح للفروع داخل السعودية فقط. أضف فرعاً سعودياً لتتمكّن من التفعيل.
        </AlertBox>
      </Panel>
    );
  }

  return (
    <Panel title="الفروع المشمولة" desc="تُعرض فروع السعودية فقط — الفروع خارجها غير مؤهلة للتوصيل السريع.">
      <ul className="divide-y divide-gray-400 overflow-hidden rounded-lg border border-gray-400">
        {ksa.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center gap-3 p-3">
            <span aria-hidden="true" className="grid h-4 w-4 shrink-0 place-items-center rounded bg-primary text-[10px] text-white">✓</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold">{b.name}</span>
              <span className="block text-[11.5px] text-dark-200">{b.city}</span>
            </span>
            {b.linkedToSaudiMarket
              ? <Tag theme="success">مرتبط بالسوق السعودي</Tag>
              : <Tag theme="info">سيُربَط تلقائياً</Tag>}
          </li>
        ))}
      </ul>

      {excluded.length > 0 && (
        <p className="mt-3 text-[12px] text-dark-200">
          استُبعد {excluded.length} فرع خارج السعودية: {excluded.map((b) => b.name).join('، ')}
        </p>
      )}

      <div className="mt-4">
        {autoEnablesFulfilment(state)
          ? <AlertBox theme="info" icon="ℹ️" title="سيُفعَّل الاستلام والتوصيل تلقائياً">
              لديك أكثر من فرع، لذلك سنفعّل خيارَي الاستلام والتوصيل على الفروع المحدّدة.
            </AlertBox>
          : <AlertBox theme="default" icon="ℹ️" title="فرع واحد محدّد">
              الاستلام والتوصيل يُضبطان يدوياً عند وجود فرع واحد فقط.
            </AlertBox>}
      </div>
    </Panel>
  );
}

/* ── MarketLinkingNotice — the two-way branch on Multi-Markets ── */
export function MarketLinkingNotice({ state }: { state: MerchantState }) {
  if (state.multiMarkets) {
    const unlinked = unlinkedKsaBranches(state);
    if (unlinked.length === 0) {
      return (
        <AlertBox theme="secondary" icon="✓" title="فروعك مرتبطة بالسوق السعودي">
          لا حاجة لأي ربط إضافي — التفعيل سيقتصر على السوق السعودي.
        </AlertBox>
      );
    }
    return (
      <AlertBox theme="info" icon="ℹ️" title={`سنربط ${unlinked.length} فرع بالسوق السعودي`}>
        متجرك يستخدم تعدّد الأسواق. سنتحقّق من ارتباط الفروع بالسوق السعودي ونربط غير المرتبط منها —
        بدون التأثير على أسواقك الأخرى: {unlinked.map((b) => b.name).join('، ')}.
      </AlertBox>
    );
  }
  return (
    <AlertBox theme="info" icon="ℹ️" title="سنفعّل أداة تعدّد الفروع لمتجرك">
      متجرك لا يملك خاصية تعدّد الأسواق، لذلك سنفعّل أداة تعدّد الفروع ثم نفعّل الاستلام والتوصيل
      على الفروع المحدّدة.
    </AlertBox>
  );
}

/* ── FeesConsent — CONDITIONAL VARIANT, off by default ─────────
   Gated on an unanswered Partnerships question. SI-311's guardrail:
   never auto-enrol a merchant into a paid service without explicit
   consent and a visible cost. Cost is deliberately left blank. */
export function FeesConsent({ consented, onChange }:
  { consented: boolean; onChange: (v: boolean) => void }) {
  return (
    <AlertBox theme="warning" icon="⚠️" title="تفعيل مرسول قد يترتّب عليه رسوم">
      <div className="space-y-3">
        <p>
          لن نُفعّل أي خدمة مدفوعة نيابةً عنك دون موافقتك.
          <strong className="mx-1">قيمة الرسوم غير محدّدة بعد</strong>
          — بانتظار تأكيد فريق الشراكات.
        </p>
        <Toggle id="fees-consent" checked={consented} onChange={onChange}
          label="أوافق على تفعيل مرسول وما يترتّب عليه من رسوم"
          desc="مطلوب للمتابعة عندما تكون الرسوم مفعّلة" />
      </div>
    </AlertBox>
  );
}
