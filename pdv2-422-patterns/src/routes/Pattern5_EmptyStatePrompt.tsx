import { useState } from 'react';
import { SallaShell } from '../components/shell/SallaShell';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { TayaarActivationDrawer } from '../components/tayaar/TayaarActivationDrawer';
import { useTayaarStore } from '../store/tayaarStore';
import { PENDING_ORDERS } from '../data/mock';
import { n } from '../lib/num';

const TABS = ['كل الطلبات', 'بانتظار تعيين مندوب', 'قيد التوصيل', 'مكتملة'];

/** Pattern 5 fires only when all three conditions hold. */
const HAS_PRIVATE_BRANCH = true;
const WAIT_THRESHOLD_MIN = 5;

export default function Pattern5() {
  const [drawer, setDrawer] = useState(false);
  const [notNow, setNotNow] = useState(false);
  const { activated, couriersCount } = useTayaarStore();

  const stale = PENDING_ORDERS.filter((o) => o.waitingMinutes > WAIT_THRESHOLD_MIN);
  const shouldPrompt = HAS_PRIVATE_BRANCH && !activated && stale.length > 0 && !notNow;

  return (
    <SallaShell subnav={['الطلبات', 'المرتجعات', 'السلات المتروكة']} active="الطلبات" breadcrumb={['الطلبات', 'بانتظار تعيين مندوب']} width="wide">
      <h1 className="mb-1 text-[21px] font-bold">الطلبات</h1>
      <p className="mb-5 text-[13px] text-salla-text-tertiary">تابع طلباتك وعيّن المناديب.</p>

      <div role="tablist" aria-label="تصفية الطلبات" className="mb-5 flex flex-wrap gap-2 border-b border-salla-border">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={t === TABS[1]}
            className={`border-b-2 px-3 py-2.5 text-[13.5px] ${t === TABS[1] ? 'border-salla-primary font-bold text-salla-primary' : 'border-transparent text-salla-text-secondary'}`}>
            {t}{t === TABS[1] && <span className="tabular ms-2 rounded-full bg-salla-warning-50 px-2 py-0.5 text-[11px] text-salla-warning-700">{n(PENDING_ORDERS.length)}</span>}
          </button>
        ))}
      </div>

      {shouldPrompt && (
        <div aria-live="polite" className="mb-5 rounded-[16px] border border-[#F0D8AE] bg-salla-warning-50 p-7 text-center">
          <span aria-hidden="true" className="mb-3 block text-3xl">📍</span>
          <h2 className="mb-2 text-[16px] font-bold text-salla-warning-700">
            {n(stale.length)} طلبات تنتظر تعيين مندوب منذ أكثر من {n(WAIT_THRESHOLD_MIN)} دقائق
          </h2>
          <p className="mx-auto mb-5 max-w-lg text-[13px] leading-relaxed text-salla-warning-700/85">
            فعّل طيّار مجانًا لتحصل على تحقّق بالباركود وتتبّع مباشر — وتعرف أين كل طلب وأي مندوب يحمله،
            بدل المتابعة يدويًا.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="mint" onClick={() => setDrawer(true)}>فعّل طيّار مجانًا</Button>
            <Button variant="secondary" onClick={() => setNotNow(true)}>ليس الآن</Button>
          </div>
        </div>
      )}

      {activated && (
        <div aria-live="polite" className="mb-5 flex flex-wrap items-center gap-3 rounded-[16px] border border-[#B6F2DF] bg-salla-secondary-50 p-5">
          <span aria-hidden="true" className="text-xl">🗺</span>
          <p className="flex-1 text-[13.5px] font-semibold text-salla-success-700">
            طيّار مفعّل — {n(couriersCount)} مناديب متاحون للإسناد، والتتبع المباشر يعمل.
          </p>
          <Chip tone="mint">✓ تتبع مباشر</Chip>
        </div>
      )}

      <div className="overflow-x-auto rounded-[16px] bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-[13px]">
          <caption className="sr-only">الطلبات بانتظار تعيين مندوب</caption>
          <thead>
            <tr className="bg-salla-surface-soft text-[11.5px] uppercase tracking-wide text-salla-text-tertiary">
              {['رقم الطلب', 'العميل', 'الفرع', 'مدة الانتظار', 'الإجمالي', ''].map((h) => (
                <th key={h} scope="col" className="p-3.5 text-start font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PENDING_ORDERS.map((o) => (
              <tr key={o.id} className="border-t border-salla-border">
                <td className="tabular p-3.5 font-semibold">#{n(o.id)}</td>
                <td className="p-3.5">{o.customer}</td>
                <td className="p-3.5 text-salla-text-tertiary">{o.branch}</td>
                <td className="tabular p-3.5">
                  <Chip tone={o.waitingMinutes > WAIT_THRESHOLD_MIN ? 'warning' : 'muted'}>
                    {n(o.waitingMinutes)} دقيقة
                  </Chip>
                </td>
                <td className="tabular p-3.5">{n(o.total)} ر.س</td>
                <td className="p-3.5 text-end">
                  {activated
                    ? <Button size="sm" variant="secondary">تعيين مندوب</Button>
                    : <span className="text-[12px] text-salla-text-tertiary">تعيين يدوي</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {notNow && !activated && (
        <p className="mt-3 text-[12px] text-salla-text-tertiary">
          أُخفي العرض لهذه الجلسة.{' '}
          <button type="button" onClick={() => setNotNow(false)} className="text-salla-primary underline">إظهاره مجددًا</button>
        </p>
      )}

      <TayaarActivationDrawer open={drawer} onClose={() => setDrawer(false)} />
    </SallaShell>
  );
}
