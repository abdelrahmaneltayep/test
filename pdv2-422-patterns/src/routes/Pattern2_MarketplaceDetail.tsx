import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SallaShell } from '../components/shell/SallaShell';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { AlertBox } from '../components/ui/AlertBox';
import { TayaarActivationDrawer } from '../components/tayaar/TayaarActivationDrawer';
import { PARTNER_APPS, TAYAAR_CAPABILITIES } from '../data/mock';
import { useTayaarStore } from '../store/tayaarStore';
import { n } from '../lib/num';

const SUBNAV = ['كل التطبيقات', 'تطبيقاتي', 'الشحن والتوصيل', 'المدفوعات', 'التسويق'];

export default function Pattern2Detail() {
  const { appId } = useParams();
  const app = PARTNER_APPS.find((a) => a.id === appId);
  const [drawer, setDrawer] = useState(false);
  const activated = useTayaarStore((s) => s.activated);
  const isTayaar = app?.id === 'tayaar';

  if (!app) {
    return (
      <SallaShell subnav={SUBNAV} active="كل التطبيقات" width="wide">
        <AlertBox variant="warning" title="التطبيق غير موجود">
          <Link to="/pattern-2" className="underline">العودة لمتجر التطبيقات</Link>
        </AlertBox>
      </SallaShell>
    );
  }

  return (
    <SallaShell subnav={SUBNAV} active="كل التطبيقات" breadcrumb={['سلة', 'متجر التطبيقات', app.name]} width="wide">
      <Link to="/pattern-2" className="mb-4 inline-block text-[13px] text-salla-primary underline">‹ كل التطبيقات</Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-6 flex flex-wrap items-start gap-4 rounded-[16px] bg-white p-7 shadow-sm">
            <span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-[14px] bg-gradient-to-bl from-salla-primary to-[#348D9D] text-2xl font-bold text-white">
              {app.monogram}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="flex flex-wrap items-center gap-2 text-[21px] font-bold">
                {app.name}
                {app.recommended && <Chip tone="mint">✓ موصى به من سلة</Chip>}
              </h1>
              <p className="mt-1 text-[13px] text-salla-text-tertiary">{app.tagline}</p>
              <div className="tabular mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-salla-text-tertiary">
                <span>★ {n(app.rating)} تقييم</span>
                <span>{n(app.installs.toLocaleString('en-US'))} تثبيت</span>
                <span>{app.price}</span>
              </div>
            </div>
          </div>

          <section className="mb-6 rounded-[16px] bg-white p-7 shadow-sm">
            <h2 className="mb-3 text-[15px] font-bold">لقطات من التطبيق</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {['خريطة المناديب', 'التحقق بالباركود', 'حالة الطلبات'].map((label, i) => (
                <div key={label} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-salla-border-strong bg-salla-surface-soft text-center">
                  <span aria-hidden="true" className="text-2xl">{['🗺', '📷', '📦'][i]}</span>
                  <span className="px-2 text-[12px] text-salla-text-tertiary">{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-salla-text-tertiary">لقطات بديلة — النموذج الأولي لا يستخدم أصولًا محمية بحقوق.</p>
          </section>

          <section className="rounded-[16px] bg-white p-7 shadow-sm">
            <h2 className="mb-3 text-[15px] font-bold">الوصف</h2>
            {isTayaar ? (
              <>
                <p className="mb-4 text-[13.5px] leading-relaxed text-salla-text-secondary">
                  طيّار تطبيق من سلة لإدارة مناديبك الخاصين — يغطي المتطلبات الثلاثة التي يحتاجها فرعك
                  ليعرض وعد «التوصيل خلال ساعتين»: تحديث حالة الطلب، التحقق من الطلب قبل الخروج،
                  والتتبع المباشر للمندوب.
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {TAYAAR_CAPABILITIES.map((c) => (
                    <li key={c} className="flex gap-2 text-[12.5px] text-salla-text-secondary">
                      <span aria-hidden="true" className="font-bold text-salla-success-500">✓</span>{c}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-md bg-salla-surface-soft p-3 text-[12px] text-salla-text-tertiary">
                  التزام {n(90)}٪ بوعد الساعتين على فروع المناديب <span className="font-semibold">— قيد التحقق</span>
                </p>
              </>
            ) : (
              <p className="text-[13.5px] leading-relaxed text-salla-text-secondary">{app.tagline}. وصف تجريبي لغرض النموذج الأولي.</p>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <div className="rounded-[16px] bg-white p-6 shadow-sm">
            <p className="mb-1 text-[12.5px] text-salla-text-tertiary">السعر</p>
            <p className="mb-4 text-[19px] font-bold">{app.price}</p>
            {isTayaar && activated ? (
              <AlertBox variant="success" icon="✅" title="مفعّل على متجرك">تجربتك المجانية جارية.</AlertBox>
            ) : (
              <Button
                variant="mint" size="lg" className="w-full"
                onClick={() => (isTayaar ? setDrawer(true) : useTayaarStore.getState().showToast('التثبيت متاح لطيّار فقط في هذا النموذج', 'error'))}
              >
                {isTayaar ? 'ابدأ أسبوع مجاني' : 'تثبيت'}
              </Button>
            )}
            <p className="mt-3 text-[11.5px] leading-relaxed text-salla-text-tertiary">
              التثبيت يفتح نفس لوحة التفعيل المستخدمة في النمط 1 — سطح تفعيل واحد لكل الأنماط.
            </p>
          </div>
        </aside>
      </div>

      <TayaarActivationDrawer open={drawer} onClose={() => setDrawer(false)} />
    </SallaShell>
  );
}
