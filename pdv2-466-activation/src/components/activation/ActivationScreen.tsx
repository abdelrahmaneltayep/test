import { useState } from 'react';
import { AlertBox, Button, Tag } from '../twilight';
import {
  ButtonsGroup, Card, FactChip, FieldLabel, MintPill, RadioCard,
  RowToggle, Select, TagsInput, UnitInput,
} from '../twilight/fields';
import { excludedBranches, ksaBranches, type MerchantState } from '../../domain/merchantState';
import { buildPlan } from '../../domain/activationPlan';

/**
 * The live Quick Delivery activation screen, transcribed from production.
 *
 * SI-311 / SI-323 own this layout — the three cards, their copy, and the
 * "confirm, not configure" posture are NOT ours to change.
 *
 * PDV2-466 adds exactly four things, each marked ⟨466⟩ below:
 *   1. the provider disclosure (which carrier sits behind بوليصات سلة)
 *   2. the KSA-only branch filter, with exclusions made visible
 *   3. an on-demand "what will be set up" disclosure — deliberately NOT a
 *      numbered plan on the page, because listing steps up front is configuring
 *   4. the auto-setup that runs when إطلاق الخدمة is pressed
 */

export type Provider = 'salla' | 'private';

export function ActivationScreen({ state, onLaunch, launchBlocked, blockerNote, extras }:
  {
    state: MerchantState;
    onLaunch: () => void;
    launchBlocked: boolean;
    blockerNote?: string;
    /** ⟨466⟩ slots injected by the container, so this file stays layout-only. */
    extras?: { providerDisclosure?: React.ReactNode; beforeLaunch?: React.ReactNode };
  }) {
  const [provider, setProvider] = useState<Provider>('salla');
  const [perBranchRadius, setPerBranchRadius] = useState(false);
  const [perBranchProvider, setPerBranchProvider] = useState(false);
  const [subProvider, setSubProvider] = useState('اختر المزود');
  const [radius, setRadius] = useState('25');
  const [prep, setPrep] = useState('30-60 دقيقة');
  const [deliver, setDeliver] = useState('60-120 دقيقة');
  const [days, setDays] = useState('all');

  const ksa = ksaBranches(state);
  const excluded = excludedBranches(state);
  const plan = buildPlan(state);

  return (
    <div className="space-y-5">
      {/* ── Card 1 · origin + provider ─────────────────────────── */}
      <Card title="من أين ستنطلق شحناتك؟" desc="اختر الفروع والمستودعات، ثم حدّد مزود التوصيل السريع.">
        <div className="mb-5">
          <FieldLabel required>الفرع أو المستودع</FieldLabel>
          <div className="mt-1.5">
            <TagsInput items={ksa.map((b) => ({ id: b.id, label: b.name }))} />
          </div>
          {/* ⟨466⟩ KSA-only filter — the exclusion is stated, never silent. */}
          {excluded.length > 0 && (
            <p className="mt-2 text-[12px] text-dark-200">
              لا تظهر {excluded.length} فروع خارج السعودية — التوصيل السريع متاح للفروع السعودية فقط:
              {' '}{excluded.map((b) => b.name).join('، ')}
            </p>
          )}
          {ksa.length === 0 && (
            <div className="mt-3">
              <AlertBox theme="warning" icon="⚠️" title="لا توجد فروع داخل السعودية"
                action={<Button theme="default" size="sm" outlined>إضافة فرع</Button>}>
                أضف فرعاً داخل السعودية لتتمكّن من تفعيل التوصيل السريع.
              </AlertBox>
            </div>
          )}
        </div>

        <FieldLabel>مزود التوصيل السريع</FieldLabel>
        <div className="mt-1.5 space-y-2.5">
          <RadioCard
            name="provider" value="salla" checked={provider === 'salla'} onSelect={() => setProvider('salla')}
            title={<>بوليصات سلة <MintPill>موصى به</MintPill><MintPill>جاهز فورًا</MintPill></>}
            desc="وصّل طلبات عملائك خلال ساعتين في 23 مدينة — تختار سلة أفضل مزود لكل طلب تلقائيًا.">
            <div className="mt-3 flex flex-wrap gap-2">
              <FactChip icon="⏱">بدون عقود أو إعداد إضافي</FactChip>
              <FactChip icon="🗺">تغطي 43 مدينة</FactChip>
              <FactChip icon="⏱">متوسط التوصيل 60 دقيقة</FactChip>
            </div>
            {/* ⟨466⟩ 1 — disclose the carrier behind the abstraction. */}
            {extras?.providerDisclosure}
          </RadioCard>

          <RadioCard
            name="provider" value="private" checked={provider === 'private'} onSelect={() => setProvider('private')}
            title="توصيل خاص"
            desc="اختر شركات شحن خارجية أو مناديب متجرك، أو كليهما معًا.">
            <div className="mt-4 space-y-4">
              <RowToggle id="per-branch-provider" checked={perBranchProvider} onChange={setPerBranchProvider}
                label="تخصيص المزود لكل فرع"
                desc="فقط إذا كانت فروعك تعتمد على شركات شحن أو مناديب مختلفين." />
              <Select id="sub-provider" required
                label="مزود التوصيل السريع"
                hint="اختر شركات شحن خارجية أو مناديب متجرك، أو كليهما معًا."
                value={subProvider} onChange={setSubProvider}
                options={['اختر المزود', 'شركة شحن خارجية', 'مناديب متجري', 'كلاهما معًا']} />
            </div>
          </RadioCard>
        </div>
      </Card>

      {/* ── Card 2 · coverage ──────────────────────────────────── */}
      <Card title="إلى أي مدى تصل خدمتك؟" desc="حدّد نطاق التوصيل السريع حول الفرع — يمكنك تعديله لاحقًا.">
        <RowToggle id="per-branch-radius" checked={perBranchRadius} onChange={setPerBranchRadius}
          label="تخصيص النطاق لكل فرع" desc="فقط إذا كانت فروعك تخدم مسافات مختلفة." />
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <span aria-hidden="true"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-gray-400 text-lg">🗺</span>
          <div className="min-w-[220px] flex-1">
            <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold">
              النطاق الحالي: {radius} كم <MintPill>موصى به</MintPill>
            </p>
            <p className="mt-0.5 text-[12px] text-dark-200">
              توصي سلة بنطاق 25 كم لتحقيق أفضل أداء للتوصيل السريع.
            </p>
          </div>
          <UnitInput id="radius" value={radius} unit="كم" onChange={setRadius} label="النطاق بالكيلومتر" />
        </div>
      </Card>

      {/* ── Card 3 · the delivery promise ──────────────────────── */}
      <Card title="وعد التوصيل لعملائك" desc="اضبط وعد التوصيل بما يناسب سرعة تجهيز طلباتك وأوقات عملك.">
        <div className="space-y-5">
          <Select id="prep" required label="مدة تجهيز الطلب" value={prep} onChange={setPrep}
            options={['15-30 دقيقة', '30-60 دقيقة', '60-90 دقيقة']} />
          <Select id="deliver" required label="مدة التوصيل" value={deliver} onChange={setDeliver}
            options={['30-60 دقيقة', '60-120 دقيقة', '120-180 دقيقة']} />

          <div>
            <FieldLabel hint="حدّد الأوقات التي يظهر خلالها وعد التوصيل للعملاء خلال اليوم.">
              متى يتوفر التوصيل السريع
            </FieldLabel>
            <div className="mt-1.5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="from"><FieldLabel required>من</FieldLabel></label>
                <input id="from" defaultValue="9:00 ص"
                  className="mt-1.5 w-full rounded-xl border border-gray-500 bg-white px-4 py-3 text-[13.5px]" />
              </div>
              <div>
                <label htmlFor="to"><FieldLabel required>إلى</FieldLabel></label>
                <input id="to" defaultValue="11:00 م"
                  className="mt-1.5 w-full rounded-xl border border-gray-500 bg-white px-4 py-3 text-[13.5px]" />
              </div>
            </div>
          </div>

          <div>
            <FieldLabel required>أيام التوصيل السريع</FieldLabel>
            <div className="mt-1.5">
              <ButtonsGroup value={days} onChange={setDays}
                options={[{ value: 'all', label: 'كل أيام الاسبوع' }, { value: 'custom', label: 'تخصيص الأيام' }]} />
            </div>
          </div>
        </div>
      </Card>

      {/* ⟨466⟩ 3 — what will be set up, disclosed on demand. */}
      {extras?.beforeLaunch}

      {/* ── Launch bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-6 shadow-sm">
        <p className="min-w-[220px] flex-1 text-[13px] text-dark-200">
          جاهز للانطلاق؟ يمكنك تعديل إعدادات التوصيل السريع لاحقًا.
          {provider === 'salla' && (
            <span className="mt-1 block text-[12px]">
              سنجهّز {plan.length} إعدادات تلقائيًا عند الإطلاق.
            </span>
          )}
        </p>
        <Button theme="secondary" size="lg" disabled={launchBlocked} onClick={onLaunch}>
          <span aria-hidden="true">🚀</span> إطلاق الخدمة
        </Button>
      </div>
      {blockerNote && (
        <p role="status" className="text-[12.5px] font-semibold [color:var(--xx-fallback-warning-fg)]">{blockerNote}</p>
      )}
    </div>
  );
}

/** ⟨466⟩ 1 — the carrier behind بوليصات سلة, and its current state. */
export function ProviderDisclosure({ state, onResolveRoutes, routesResolved }:
  { state: MerchantState; onResolveRoutes: () => void; routesResolved: boolean }) {
  return (
    <div className="mt-4 rounded-xl border border-gray-400 bg-gray-100 p-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary text-[11px] font-bold text-white">M</span>
        <p className="min-w-[180px] flex-1 text-[12.5px]">
          المزوّد الحالي لهذه المدن: <b>مرسول</b>
        </p>
        {state.mrsool === 'active' && <Tag theme="success">مفعّل على متجرك</Tag>}
        {state.mrsool === 'inactive' && <Tag theme="info">سيُفعَّل تلقائيًا</Tag>}
        {state.mrsool === 'conflicting-routes' && <Tag theme="warning">مسارات متعارضة</Tag>}
      </div>

      {state.mrsool === 'conflicting-routes' && (
        <div className="mt-3">
          {routesResolved ? (
            <AlertBox theme="secondary" icon="✓" title="سنستبدل مساراتك الحالية">
              وافقت على تطبيق مسارات التوصيل السريع الافتراضية.
            </AlertBox>
          ) : (
            <AlertBox theme="warning" icon="⚠️" title="مسارات مرسول الحالية تتعارض مع التوصيل السريع"
              action={<Button theme="default" size="sm" onClick={onResolveRoutes}>استبدال المسارات والمتابعة</Button>}>
              لا يمكن الإطلاق قبل أن تختار ما يحدث لمساراتك الحالية.
            </AlertBox>
          )}
        </div>
      )}
    </div>
  );
}
