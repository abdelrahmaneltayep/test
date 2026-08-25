import { Chip } from '../ui/Chip';
import { n } from '../../lib/num';

/** ST3 — the collapsed, activated state that replaces the cross-sell card. */
export function TayaarSummaryStrip({ couriersCount }: { couriersCount: number }) {
  return (
    <div className="mt-3.5 rounded-lg border border-[#B6F2DF] bg-salla-secondary-50 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-bl from-salla-primary to-[#348D9D] text-sm font-bold text-white">ط</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold text-salla-success-700">مناديبك يستوفون متطلبات وعد الساعتين</p>
          <p className="text-[12.5px] text-salla-success-700/80">
            طيّار مفعّل · {n(couriersCount)} مناديب مرتبطين · تحديث الحالة والتحقق والتتبع المباشر
          </p>
        </div>
        <Chip tone="mint">✓ عبر طيّار</Chip>
      </div>
    </div>
  );
}
