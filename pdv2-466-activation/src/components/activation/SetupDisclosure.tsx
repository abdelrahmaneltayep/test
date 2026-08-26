import { useState } from 'react';
import { AlertBox, Tag } from '../twilight';
import { buildPlan, skippedReasons } from '../../domain/activationPlan';
import type { MerchantState } from '../../domain/merchantState';

/**
 * ⟨466⟩ "What will be set up automatically."
 *
 * Collapsed by default, on purpose. The screen's posture is confirm-not-configure;
 * a numbered step list sitting open on the page turns the merchant back into a
 * configurer, reading and approving each line. Available to anyone who wants it,
 * absent for everyone who doesn't.
 */
export function SetupDisclosure({ state }: { state: MerchantState }) {
  const [open, setOpen] = useState(false);
  const plan = buildPlan(state);
  const skipped = skippedReasons(state);

  /**
   * Routine steps can stay collapsed. Store-level CHANGES cannot: enabling a
   * tool on the merchant's store, or linking their branches to a market, are
   * things they would reasonably object to discovering afterwards. Those are
   * named in the collapsed state; the rest is behind the disclosure.
   */
  const consequences = plan
    .filter((s) => s.id === 'enable-multi-branch' || s.id === 'link-market')
    .map((s) => (s.id === 'enable-multi-branch'
      ? 'سنفعّل أداة تعدّد الفروع لمتجرك'
      : `سنربط ${s.items?.length ?? 0} فروع بالسوق السعودي — بدون التأثير على أسواقك الأخرى`));

  return (
    <div className="rounded-2xl bg-white px-7 py-5 shadow-sm">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="flex w-full items-center gap-2 text-start">
        <span className="flex-1 text-[13.5px] font-semibold">ماذا سنجهّز نيابةً عنك؟</span>
        <Tag theme="default">{plan.length} إعدادات</Tag>
        <span aria-hidden="true" className="text-dark-200">{open ? '⌃' : '⌄'}</span>
      </button>

      {consequences.length > 0 && (
        <ul className="mt-2.5 space-y-1">
          {consequences.map((c) => (
            <li key={c} className="flex gap-2 text-[12.5px] text-dark-200">
              <span aria-hidden="true" className="text-primary">•</span>{c}
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="mt-4">
          <ul className="space-y-2">
            {plan.map((s) => (
              <li key={s.id} className="flex gap-3 rounded-xl bg-gray-200 p-3">
                <span aria-hidden="true" className="mt-0.5 text-primary">•</span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold">{s.label}</span>
                  <span className="block text-[11.5px] text-dark-200">{s.reason}</span>
                </span>
              </li>
            ))}
          </ul>
          {skipped.length > 0 && (
            <ul className="mt-3 space-y-1">
              {skipped.map((r) => (
                <li key={r} className="flex gap-2 text-[12px] text-dark-200"><span aria-hidden="true">✓</span>{r}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11.5px] text-dark-200">
            كل هذا يحدث تلقائيًا عند الإطلاق — لن تحتاج لمغادرة هذه الصفحة.
          </p>
        </div>
      )}
    </div>
  );
}

/** ⟨466⟩ conditional variant — fees consent. Gated on Partnerships; off by default. */
export function FeesConsentBlock({ consented, onChange }:
  { consented: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-2xl bg-white p-7 shadow-sm">
      <AlertBox theme="warning" icon="⚠️" title="تفعيل مرسول قد يترتّب عليه رسوم">
        <div className="space-y-3">
          <p>
            لن نُفعّل أي خدمة مدفوعة نيابةً عنك دون موافقتك.
            <strong className="mx-1">قيمة الرسوم غير محدّدة بعد</strong>
            — بانتظار تأكيد فريق الشراكات.
          </p>
          <label htmlFor="fees" className="flex cursor-pointer items-start gap-3">
            <input id="fees" type="checkbox" checked={consented} onChange={(e) => onChange(e.target.checked)}
              className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded accent-[color:var(--primary)]" />
            <span className="text-[12.5px] font-semibold">
              أوافق على تفعيل مرسول وما يترتّب عليه من رسوم
            </span>
          </label>
        </div>
      </AlertBox>
    </div>
  );
}
