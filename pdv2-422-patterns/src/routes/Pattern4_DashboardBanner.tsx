import { useState } from 'react';
import { SallaShell } from '../components/shell/SallaShell';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { TayaarActivationDrawer } from '../components/tayaar/TayaarActivationDrawer';
import { useTayaarStore } from '../store/tayaarStore';
import { n, sar } from '../lib/num';

const KPIS = [
  { label: 'طلبات اليوم',      value: '47',     delta: '+12%' },
  { label: 'مبيعات اليوم',     value: '8,240',  delta: '+8%', suffix: 'ر.س' },
  { label: 'متوسط قيمة الطلب', value: '175',    delta: '−3%', suffix: 'ر.س' },
  { label: 'بانتظار التجهيز',  value: '9',      delta: '' },
];

const CHART = [32, 41, 28, 55, 47, 62, 47];
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function Pattern4() {
  const [variant, setVariant] = useState<'compact' | 'expanded'>('expanded');
  const [drawer, setDrawer] = useState(false);
  const { bannerDismissed, dismissBanner, snoozeBanner, isBannerSnoozed, activated } = useTayaarStore();

  const snoozed = isBannerSnoozed();
  const showBanner = !bannerDismissed && !snoozed && !activated;
  const max = Math.max(...CHART);

  return (
    <SallaShell subnav={['نظرة عامة', 'الطلبات', 'المنتجات', 'العملاء']} active="نظرة عامة" width="wide">
      {/* Prototype-only control */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-salla-border-strong bg-white p-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-salla-text-tertiary">شكل الشريط</span>
        {(['compact', 'expanded'] as const).map((v) => (
          <button key={v} type="button" onClick={() => setVariant(v)}
            className={`rounded-md border px-2.5 py-1 text-[12px] ${variant === v ? 'border-salla-primary bg-salla-primary text-white' : 'border-salla-border-strong'}`}>
            {v === 'compact' ? 'مضغوط' : 'موسّع'}
          </button>
        ))}
        {(bannerDismissed || snoozed) && (
          <button type="button" onClick={() => { try { localStorage.removeItem('pdv2422.banner.snoozeUntil'); } catch { /* ignore */ } useTayaarStore.setState({ bannerDismissed: false }); }}
            className="ms-auto text-[12px] text-salla-primary underline">
            إعادة إظهار الشريط {snoozed && '(مؤجَّل حاليًا)'}
          </button>
        )}
      </div>

      {showBanner && variant === 'compact' && (
        <div role="region" aria-label="عرض طيّار" aria-live="polite"
          className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-[#C9E0F8] bg-salla-info-50 px-4 py-3">
          <span aria-hidden="true">🚀</span>
          <p className="flex-1 text-[13px] text-salla-info-700">
            <b>اعرف طيّار</b> — إدارة مناديبك مباشرة من داخل سلة · جرّب مجانًا لأسبوع
          </p>
          <Button size="sm" variant="primary" onClick={() => setDrawer(true)}>ابدأ التجربة</Button>
          <button type="button" onClick={snoozeBanner} className="text-[12px] text-salla-info-700 underline">ذكّرني لاحقًا</button>
          <button type="button" onClick={dismissBanner} aria-label="إغلاق العرض" className="text-lg leading-none text-salla-info-700/60 hover:text-salla-info-700">×</button>
        </div>
      )}

      {showBanner && variant === 'expanded' && (
        <div role="region" aria-label="عرض طيّار" aria-live="polite"
          className="mb-5 rounded-[16px] border border-[#B6F2DF] bg-gradient-to-bl from-salla-secondary-50 to-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-4">
            <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-gradient-to-bl from-salla-primary to-[#348D9D] text-xl font-bold text-white">ط</span>
            <div className="min-w-0 flex-1">
              <h2 className="mb-1 flex flex-wrap items-center gap-2 text-[16px] font-bold">
                اعرف طيّار — إدارة مناديبك من داخل سلة <Chip tone="mint">أسبوع مجاني</Chip>
              </h2>
              <p className="text-[13px] leading-relaxed text-salla-text-secondary">
                تطبيق من سلة يتيح لك إسناد مناديبك، التحقق من كل طلب بالباركود، وتتبعهم على خريطة لحظية.
              </p>
              <ul className="mt-3.5 flex flex-wrap gap-2">
                {['تحديث حالة الطلب', 'تحقق بالباركود', 'تتبع مباشر'].map((c) => (
                  <li key={c}><Chip tone="mint">✓ {c}</Chip></li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button variant="mint" onClick={() => setDrawer(true)}>ابدأ أسبوع مجاني</Button>
                <button type="button" onClick={snoozeBanner} className="text-[12.5px] text-salla-primary underline">ذكّرني لاحقًا</button>
                <span className="text-[11.5px] text-salla-text-tertiary">بعد التجربة من {sar(5)} شهريًا</span>
              </div>
            </div>
            <button type="button" onClick={dismissBanner} aria-label="إغلاق العرض" className="text-xl leading-none text-salla-text-tertiary hover:text-salla-text-primary">×</button>
          </div>
        </div>
      )}

      {snoozed && !activated && (
        <p className="mb-5 rounded-md bg-salla-surface-soft p-3 text-[12px] text-salla-text-tertiary">
          العرض مؤجَّل {n(24)} ساعة — محفوظ في localStorage، ويبقى مؤجّلًا بعد إعادة تحميل الصفحة.
        </p>
      )}

      <h1 className="mb-5 text-[21px] font-bold">نظرة عامة</h1>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-[14px] bg-white p-5 shadow-sm">
            <p className="text-[12.5px] text-salla-text-tertiary">{k.label}</p>
            <p className="tabular mt-1 text-[22px] font-bold">
              {n(k.value)} {k.suffix && <span className="text-[13px] font-normal text-salla-text-tertiary">{k.suffix}</span>}
            </p>
            {k.delta && (
              <p className={`tabular mt-1 text-[12px] font-semibold ${k.delta.startsWith('+') ? 'text-salla-success-700' : 'text-salla-danger-700'}`}>
                {n(k.delta)}
              </p>
            )}
          </div>
        ))}
      </div>

      <section className="rounded-[16px] bg-white p-7 shadow-sm">
        <h2 className="mb-5 text-[15px] font-bold">الطلبات خلال الأسبوع</h2>
        <div className="flex h-44 items-end gap-3" role="img" aria-label={`مخطط الطلبات الأسبوعي، أعلى قيمة ${n(max)} طلبًا`}>
          {CHART.map((v, i) => (
            <div key={DAYS[i]} className="flex flex-1 flex-col items-center gap-2">
              <span className="tabular text-[11px] text-salla-text-tertiary">{n(v)}</span>
              <div className="w-full rounded-t-md bg-salla-primary/85" style={{ height: `${(v / max) * 100}%` }} />
              <span className="text-[11px] text-salla-text-tertiary">{DAYS[i]}</span>
            </div>
          ))}
        </div>
      </section>

      <TayaarActivationDrawer open={drawer} onClose={() => setDrawer(false)} />
    </SallaShell>
  );
}
