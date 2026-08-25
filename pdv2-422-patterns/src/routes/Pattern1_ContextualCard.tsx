import { useState } from 'react';
import { SallaShell } from '../components/shell/SallaShell';
import { RadioCard } from '../components/ui/Radio';
import { Dropdown } from '../components/ui/Dropdown';
import { Toggle } from '../components/ui/Toggle';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { AlertBox } from '../components/ui/AlertBox';
import { TayaarCard } from '../components/tayaar/TayaarCard';
import { TayaarSummaryStrip } from '../components/tayaar/TayaarSummaryStrip';
import { TrialBanner } from '../components/tayaar/TrialBanner';
import { TayaarActivationDrawer } from '../components/tayaar/TayaarActivationDrawer';
import { useTayaarStore, type CardState, type TrialPhase } from '../store/tayaarStore';
import { BRANCHES, SUB_PROVIDERS, type SubProvider } from '../data/mock';
import { n } from '../lib/num';

const SUBNAV = ['الشحن والتوصيل', 'إدارة التشغيل', 'التوصيل السريع', 'التقارير', 'المسارات'];

export default function Pattern1() {
  const store = useTayaarStore();
  const [provider, setProvider] = useState<'salla' | 'private'>('salla');
  const [sub, setSub] = useState<SubProvider>('');
  const [perBranch, setPerBranch] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [drawer, setDrawer] = useState(false);

  const usesOwn = provider === 'private' && (sub === 'own' || sub === 'both');

  /** Which of the six states the card is in right now. */
  const cardState: CardState = store.activated
    ? 'activated'
    : !store.countryAvailable ? 'unavailable'
    : store.plan === 'basic' ? 'locked'
    : store.activating ? 'loading'
    : store.activationError ? 'error'
    : 'default';

  /**
   * Bottom-CTA gating: launch is blocked while any own-courier branch has no
   * compliant provider. Declining is an explicit acknowledgement, which unblocks.
   */
  const ctaBlocked = usesOwn && !store.activated && !declined;

  const openDrawer = () => {
    if (store.plan === 'basic') { store.showToast('هذه الميزة متاحة في باقتَي برو والخاصة', 'error'); return; }
    setDrawer(true);
  };

  return (
    <SallaShell subnav={SUBNAV} active="التوصيل السريع" breadcrumb={['الشحن', 'التوصيل السريع']}>
      <StateSwitcher
        provider={provider} setProvider={setProvider}
        sub={sub} setSub={setSub} setDeclined={setDeclined}
      />

      <TrialBanner />

      {/* ── Section 1 ─────────────────────────────────────────────── */}
      <section className="mb-5 rounded-[16px] bg-white p-7 shadow-sm">
        <h2 className="mb-1 text-[17px] font-bold">من أين ستنطلق شحناتك؟</h2>
        <p className="mb-6 text-[13px] text-salla-text-tertiary">اختر الفروع والمستودعات، ثم حدّد مزود التوصيل السريع.</p>

        <div className="mb-5">
          <span className="mb-1.5 block text-[13px] font-semibold">
            <span aria-hidden="true" className="text-salla-danger-500">* </span>الفرع أو المستودع
          </span>
          <ul className="flex min-h-[46px] flex-wrap items-center gap-2 rounded-lg border border-salla-border-strong bg-white p-3">
            {BRANCHES.map((b) => (
              <li key={b.id} className="flex items-center gap-2 rounded-md bg-salla-surface-soft px-2.5 py-1 text-[12.5px]">
                {b.name}<span aria-hidden="true" className="text-salla-text-tertiary">×</span>
              </li>
            ))}
          </ul>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold">مزود التوصيل السريع</legend>
          <div className="grid gap-2.5">
            <RadioCard
              name="provider" value="salla"
              checked={provider === 'salla'}
              onSelect={() => { setProvider('salla'); setSub(''); setDeclined(false); }}
              title={<>بوليصات سلة <Chip tone="mint">✓ موصى به</Chip><Chip tone="mint">✓ جاهز فورًا</Chip></>}
              description={`وصّل طلبات عملائك خلال ساعتين في ${n(23)} مدينة — تختار سلة أفضل مزود لكل طلب تلقائيًا.`}
            />
            <RadioCard
              name="provider" value="private"
              checked={provider === 'private'}
              onSelect={() => { setProvider('private'); setDeclined(false); }}
              title="توصيل خاص"
              description="اختر شركات شحن خارجية أو مناديب متجرك، أو كليهما معًا."
            >
              <div className="mt-4 space-y-4">
                <Toggle
                  id="per-branch" checked={perBranch} onChange={setPerBranch}
                  label="تخصيص المزود لكل فرع"
                  description="فقط إذا كانت فروعك تعتمد على شركات شحن أو مناديب مختلفين."
                />
                <Dropdown
                  id="sub-provider" label="مزود التوصيل السريع" required
                  hint="اختر شركات شحن خارجية أو مناديب متجرك، أو كليهما معًا."
                  value={sub}
                  onChange={(v) => { setSub(v as SubProvider); setDeclined(false); }}
                  options={SUB_PROVIDERS}
                />

                {/* The cross-sell fires here — on the sub-provider, never the radio. */}
                {usesOwn && (
                  store.activated ? (
                    <TayaarSummaryStrip couriersCount={store.couriersCount} />
                  ) : declined ? (
                    <AlertBox variant="warning" icon="ℹ️" title="سيُفعَّل التوصيل السريع بدون وعد الساعتين" className="mt-3.5"
                      actions={<Button size="sm" variant="secondary" onClick={() => setDeclined(false)}>العودة وتفعيل طيّار</Button>}>
                      تبقى فروعك ضمن التوصيل السريع للاستلام والتوصيل الاعتيادي، لكن لن يظهر وعد
                      «التوصيل خلال ساعتين» لعميلك عند الدفع.
                    </AlertBox>
                  ) : (
                    <TayaarCard state={cardState} onActivate={openDrawer} onDecline={() => setDeclined(true)} branchCount={BRANCHES.length} />
                  )
                )}
              </div>
            </RadioCard>
          </div>
        </fieldset>
      </section>

      {/* ── Section 2 ─────────────────────────────────────────────── */}
      <section className="mb-5 rounded-[16px] bg-white p-7 shadow-sm">
        <h2 className="mb-1 text-[17px] font-bold">إلى أي مدى تصل خدمتك؟</h2>
        <p className="mb-5 text-[13px] text-salla-text-tertiary">حدّد نطاق التوصيل السريع حول الفرع — يمكنك تعديله لاحقًا.</p>
        <div className="flex flex-wrap items-center gap-4">
          <span aria-hidden="true" className="text-xl">🗺</span>
          <div className="min-w-[200px] flex-1">
            <p className="flex items-center gap-2 text-[13.5px] font-semibold">النطاق الحالي: {n(25)} كم <Chip tone="mint">✓ موصى به</Chip></p>
            <p className="text-xs text-salla-text-tertiary">توصي سلة بنطاق {n(25)} كم لتحقيق أفضل أداء للتوصيل السريع.</p>
          </div>
        </div>
      </section>

      {/* ── Section 3 ─────────────────────────────────────────────── */}
      <section className="mb-5 rounded-[16px] bg-white p-7 shadow-sm">
        <h2 className="mb-1 text-[17px] font-bold">وعد التوصيل لعملائك</h2>
        <p className="mb-5 text-[13px] text-salla-text-tertiary">اضبط وعد التوصيل بما يناسب سرعة تجهيز طلباتك وأوقات عملك.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Dropdown id="prep" label="مدة تجهيز الطلب" required value="30-60"
            onChange={() => {}} options={[{ value: '30-60', label: `${n('30-60')} دقيقة` }]} />
          <Dropdown id="deliver" label="مدة التوصيل" required value="60-120"
            onChange={() => {}} options={[{ value: '60-120', label: `${n('60-120')} دقيقة` }]} />
        </div>
        {usesOwn && (
          <AlertBox
            variant={store.activated ? 'success' : 'warning'}
            icon={store.activated ? '✅' : '⚠️'}
            className="mt-4"
            title={store.activated ? 'هذا الوعد سيظهر لعملائك على كل فروعك' : 'هذا الوعد لن يظهر لعملائك على فروع مناديبك'}
          >
            {store.activated
              ? 'مناديبك مغطّون عبر طيّار — تحديث الحالة، التحقق قبل الخروج، والتتبع المباشر.'
              : 'تعرض سلة هذا الوعد عند الدفع نيابةً عنك، ولذلك نعرضه فقط حيث نستطيع التحقق منه.'}
          </AlertBox>
        )}
      </section>

      {/* ── Launch ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 rounded-[16px] bg-white p-6 shadow-sm">
        <div className="flex-1 text-[13px] text-salla-text-tertiary">
          <b className="block text-sm text-salla-text-primary">جاهز للانطلاق؟</b>
          {n(BRANCHES.length)} فروع · {store.activated || !usesOwn ? 'وعد الساعتين سيظهر لعملائك' : 'بدون وعد الساعتين على فروع مناديبك'}
        </div>
        <Button variant="mint" size="lg" disabled={ctaBlocked}
          title={ctaBlocked ? 'اختر مزودًا مطابقًا لفروع مناديبك أو أكمل بدون وعد الساعتين' : undefined}>
          🚀 إطلاق الخدمة
        </Button>
      </div>
      {ctaBlocked && (
        <p role="status" className="mt-2 text-[12px] text-salla-warning-700">
          الإطلاق متوقف حتى تختار طريقة مطابقة لفروع مناديبك، أو تؤكّد المتابعة بدون وعد الساعتين.
        </p>
      )}

      <TayaarActivationDrawer open={drawer} onClose={() => setDrawer(false)} />
    </SallaShell>
  );
}

/* ── Prototype-only state switcher ─────────────────────────────── */
function StateSwitcher({ provider, setProvider, sub, setSub, setDeclined }: {
  provider: 'salla' | 'private'; setProvider: (v: 'salla' | 'private') => void;
  sub: SubProvider; setSub: (v: SubProvider) => void; setDeclined: (v: boolean) => void;
}) {
  const store = useTayaarStore();

  const jump = (fn: () => void) => { store.reset(); setDeclined(false); fn(); };

  const SCENES: [string, () => void][] = [
    ['افتراضي', () => jump(() => { setProvider('private'); setSub('own'); store.setPlan('pro'); store.setCountryAvailable(true); })],
    ['قيد التفعيل', () => jump(() => { setProvider('private'); setSub('own'); useTayaarStore.setState({ activating: true }); })],
    ['خطأ', () => jump(() => { setProvider('private'); setSub('own'); useTayaarStore.setState({ activationError: 'تعذّر تفعيل التجربة. لم يتغيّر أي شيء في إعداداتك.' }); })],
    ['باقة مقيّدة', () => jump(() => { setProvider('private'); setSub('own'); store.setPlan('basic'); })],
    ['غير متاح', () => jump(() => { setProvider('private'); setSub('own'); store.setCountryAvailable(false); })],
    ['مفعّل', () => jump(() => { setProvider('private'); setSub('own'); useTayaarStore.setState({ activated: true, trialPhase: 'started' }); })],
  ];

  const PHASES: [string, TrialPhase][] = [['بلا', 'none'], ['بدأت', 'started'], ['تنتهي', 'ending'], ['انتهت', 'ended']];

  return (
    <div className="mb-5 rounded-lg border border-dashed border-salla-border-strong bg-white p-4">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-salla-text-tertiary">حالات النموذج · النمط 1</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {SCENES.map(([label, fn]) => (
          <button key={label} type="button" onClick={fn}
            className="rounded-md border border-salla-border-strong px-2.5 py-1 text-[12px] hover:border-salla-primary hover:bg-salla-primary-50">
            {label}
          </button>
        ))}
      </div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-salla-text-tertiary">شريط التجربة · ST4</p>
      <div className="flex flex-wrap gap-2">
        {PHASES.map(([label, phase]) => (
          <button key={phase} type="button"
            onClick={() => { if (phase !== 'none') useTayaarStore.setState({ activated: true }); store.setTrialPhase(phase); setProvider('private'); setSub('own'); }}
            className={`rounded-md border px-2.5 py-1 text-[12px] ${
              store.trialPhase === phase ? 'border-salla-primary bg-salla-primary text-white' : 'border-salla-border-strong hover:bg-salla-surface-soft'
            }`}>
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2.5 text-[11.5px] text-salla-text-tertiary">
        الحالي: {provider === 'private' ? 'توصيل خاص' : 'بوليصات سلة'}{sub ? ` · ${SUB_PROVIDERS.find((s) => s.value === sub)?.label}` : ''}
      </p>
    </div>
  );
}
