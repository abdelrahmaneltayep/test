import { useState } from 'react';
import { SallaShell } from '../components/shell/SallaShell';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { AlertBox } from '../components/ui/AlertBox';
import { TayaarActivationDrawer } from '../components/tayaar/TayaarActivationDrawer';
import { useTayaarStore } from '../store/tayaarStore';
import { BRANCHES } from '../data/mock';
import { n, sar } from '../lib/num';

const STEPS = [
  { id: 1, title: 'الفروع',          desc: 'اختر فروع التوصيل السريع' },
  { id: 2, title: 'نطاق التغطية',    desc: 'حدّد المسافة حول كل فرع' },
  { id: 3, title: 'وعد التوصيل',     desc: 'مدة التجهيز والتوصيل' },
  { id: 4, title: 'طريقة التنفيذ',   desc: 'من يوصّل الطلبات' },
  { id: 5, title: 'المراجعة والإطلاق', desc: 'تأكيد الإعدادات' },
];

type Fulfillment = '' | 'salla' | 'own';
type OwnChoice = '' | 'tayaar' | 'later' | 'skip';

export default function Pattern3() {
  const [step, setStep] = useState(1);
  const [fulfillment, setFulfillment] = useState<Fulfillment>('');
  const [ownChoice, setOwnChoice] = useState<OwnChoice>('');
  const [drawer, setDrawer] = useState(false);
  const { activated, showToast } = useTayaarStore();

  const canNext = step !== 4 || fulfillment === 'salla' || (fulfillment === 'own' && (activated || ownChoice === 'later' || ownChoice === 'skip'));

  return (
    <SallaShell subnav={['التوصيل السريع']} active="التوصيل السريع" breadcrumb={['الشحن', 'التوصيل السريع', 'الإعداد']} width="wide">
      <h1 className="mb-1 text-[21px] font-bold">جهّز التوصيل السريع في {n(5)} خطوات</h1>
      <p className="mb-6 text-[13px] text-salla-text-tertiary">لن يستغرق الأمر أكثر من دقيقة.</p>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Stepper */}
        <nav aria-label="خطوات الإعداد">
          <ol className="rounded-[16px] bg-white p-4 shadow-sm">
            {STEPS.map((s) => {
              const done = s.id < step;
              const current = s.id === step;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => s.id <= step && setStep(s.id)}
                    disabled={s.id > step}
                    aria-current={current ? 'step' : undefined}
                    className={`flex w-full items-start gap-3 rounded-md p-2.5 text-start disabled:cursor-not-allowed disabled:opacity-50
                      ${current ? 'bg-salla-primary-50' : ''}`}
                  >
                    <span aria-hidden="true" className={`tabular grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold
                      ${done ? 'bg-salla-success-500 text-white' : current ? 'bg-salla-primary text-white' : 'bg-salla-surface-soft text-salla-text-tertiary'}`}>
                      {done ? '✓' : n(s.id)}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-[13px] font-semibold ${current ? 'text-salla-primary' : ''}`}>{s.title}</span>
                      <span className="block text-[11.5px] text-salla-text-tertiary">{s.desc}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Content */}
        <div>
          <section className="min-h-[380px] rounded-[16px] bg-white p-7 shadow-sm">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-salla-text-tertiary">الخطوة {n(step)} من {n(5)}</p>
            <h2 className="mb-5 text-[17px] font-bold">{STEPS[step - 1].title}</h2>

            {step === 1 && (
              <ul className="grid gap-2.5">
                {BRANCHES.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 rounded-lg border border-salla-border p-3.5">
                    <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded bg-salla-primary text-[11px] text-white">✓</span>
                    <span className="flex-1"><span className="block text-[13.5px] font-semibold">{b.name}</span>
                    <span className="block text-xs text-salla-text-tertiary">{b.city}</span></span>
                  </li>
                ))}
              </ul>
            )}

            {step === 2 && (
              <div className="flex flex-wrap items-center gap-4">
                <span aria-hidden="true" className="text-2xl">🗺</span>
                <p className="flex-1 text-[13.5px]">النطاق الموصى به: <b>{n(25)} كم</b> حول كل فرع.</p>
                <Chip tone="mint">✓ موصى به</Chip>
              </div>
            )}

            {step === 3 && (
              <dl className="grid gap-3 text-[13.5px]">
                <div className="flex justify-between rounded-lg bg-salla-surface-soft p-3.5"><dt>مدة تجهيز الطلب</dt><dd className="font-semibold">{n('30-60')} دقيقة</dd></div>
                <div className="flex justify-between rounded-lg bg-salla-surface-soft p-3.5"><dt>مدة التوصيل</dt><dd className="font-semibold">{n('60-120')} دقيقة</dd></div>
              </dl>
            )}

            {/* Step 4 — the checkpoint this pattern exists for. */}
            {step === 4 && (
              <div>
                <fieldset className="mb-5">
                  <legend className="mb-2.5 text-[13px] font-semibold">من يوصّل طلبات هذه الفروع؟</legend>
                  <div className="grid gap-2.5">
                    {[
                      ['salla', 'بوليصات سلة', 'تختار سلة أفضل مزود لكل طلب تلقائيًا'],
                      ['own', 'مناديب متجري', 'أوصّل الطلبات عبر مناديبي الخاصين'],
                    ].map(([v, t, d]) => (
                      <label key={v} className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${fulfillment === v ? 'border-2 border-salla-primary p-[15px]' : 'border-salla-border-strong'}`}>
                        <input type="radio" name="fulfillment" value={v} checked={fulfillment === v}
                          onChange={() => { setFulfillment(v as Fulfillment); setOwnChoice(''); }}
                          className="mt-0.5 h-[18px] w-[18px] accent-[color:var(--salla-primary)]" />
                        <span><span className="block text-[14px] font-bold">{t}</span>
                        <span className="block text-[12.5px] text-salla-text-tertiary">{d}</span></span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {fulfillment === 'own' && (activated ? (
                  <AlertBox variant="success" icon="✅" title="طيّار مفعّل — فروعك جاهزة">
                    المتطلبات الثلاثة مغطّاة، ووعد الساعتين سيظهر لعملائك.
                  </AlertBox>
                ) : (
                  <div>
                    <p className="mb-3 text-[13px] font-semibold">الخطوة التالية الموصى بها</p>
                    <div className="grid gap-2.5">
                      <button type="button" onClick={() => { setOwnChoice('tayaar'); setDrawer(true); }}
                        className="flex items-start gap-3 rounded-lg border-2 border-salla-primary bg-salla-primary-50 p-4 text-start">
                        <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-to-bl from-salla-primary to-[#348D9D] text-lg font-bold text-white">ط</span>
                        <span className="flex-1">
                          <span className="mb-0.5 flex flex-wrap items-center gap-2 text-[14.5px] font-bold">فعّل طيّار <Chip tone="mint">أسبوع مجاني</Chip></span>
                          <span className="block text-[12.5px] leading-relaxed text-salla-text-tertiary">
                            يغطي المتطلبات الثلاثة لوعد الساعتين — تحديث الحالة، التحقق قبل الخروج، والتتبع المباشر. ثم من {sar(5)} شهريًا.
                          </span>
                        </span>
                      </button>
                      {[
                        ['later', 'سأعدّ هذا لاحقًا', 'أكمل الآن، وفعّل طيّار من إعدادات الشحن لاحقًا'],
                        ['skip', 'تخطّي', 'تابع بدون وعد الساعتين على فروع مناديبي'],
                      ].map(([v, t, d]) => (
                        <button key={v} type="button" onClick={() => setOwnChoice(v as OwnChoice)}
                          className={`rounded-lg border p-4 text-start ${ownChoice === v ? 'border-2 border-salla-primary p-[15px]' : 'border-salla-border-strong hover:border-salla-primary-300'}`}>
                          <span className="block text-[13.5px] font-semibold">{t}</span>
                          <span className="block text-[12.5px] text-salla-text-tertiary">{d}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 5 && (
              <div>
                <dl className="mb-5 grid gap-2.5 text-[13.5px]">
                  {[
                    ['الفروع', `${n(BRANCHES.length)} فروع`],
                    ['النطاق', `${n(25)} كم`],
                    ['وعد التوصيل', `${n('30-60')} + ${n('60-120')} دقيقة`],
                    ['طريقة التنفيذ', fulfillment === 'own' ? (activated ? 'مناديب متجري · عبر طيّار' : 'مناديب متجري') : 'بوليصات سلة'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between rounded-lg bg-salla-surface-soft p-3.5"><dt className="text-salla-text-tertiary">{k}</dt><dd className="font-semibold">{v}</dd></div>
                  ))}
                </dl>
                <AlertBox
                  variant={fulfillment === 'own' && !activated ? 'warning' : 'success'}
                  icon={fulfillment === 'own' && !activated ? '⚠️' : '✅'}
                  title={fulfillment === 'own' && !activated ? 'سيُطلق بدون وعد الساعتين' : 'وعد الساعتين سيظهر لعملائك'}
                >
                  {fulfillment === 'own' && !activated
                    ? 'فروعك ستعمل ضمن التوصيل السريع للاستلام والتوصيل الاعتيادي.'
                    : 'كل فروعك تستوفي متطلبات الوعد.'}
                </AlertBox>
              </div>
            )}
          </section>

          <div className="mt-4 flex items-center gap-3">
            <Button variant="secondary" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>رجوع</Button>
            {step < 5 ? (
              <Button variant="primary" onClick={() => setStep((s) => Math.min(5, s + 1))} disabled={!canNext}>التالي</Button>
            ) : (
              <Button variant="mint" size="lg" onClick={() => showToast('تم إطلاق التوصيل السريع')}>🚀 إطلاق الخدمة</Button>
            )}
            {step === 4 && !canNext && (
              <p role="status" className="text-[12px] text-salla-warning-700">اختر طريقة التنفيذ للمتابعة.</p>
            )}
          </div>
        </div>
      </div>

      <TayaarActivationDrawer open={drawer} onClose={() => setDrawer(false)} />
    </SallaShell>
  );
}
