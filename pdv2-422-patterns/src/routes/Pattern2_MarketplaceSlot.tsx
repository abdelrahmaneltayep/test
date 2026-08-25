import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SallaShell } from '../components/shell/SallaShell';
import { Chip } from '../components/ui/Chip';
import { PARTNER_APPS, CATEGORIES, type PartnerApp } from '../data/mock';
import { n } from '../lib/num';

const SUBNAV = ['كل التطبيقات', 'تطبيقاتي', 'الشحن والتوصيل', 'المدفوعات', 'التسويق'];

export default function Pattern2() {
  const [category, setCategory] = useState('all');
  const recommended = PARTNER_APPS.filter((a) => a.recommended);
  const rest = PARTNER_APPS.filter((a) => !a.recommended && (category === 'all' || a.category === category));

  return (
    <SallaShell subnav={SUBNAV} active="كل التطبيقات" breadcrumb={['سلة', 'متجر التطبيقات']} width="wide">
      <h1 className="mb-1 text-[21px] font-bold">متجر تطبيقات سلة</h1>
      <p className="mb-6 text-[13px] text-salla-text-tertiary">وسّع متجرك بتطبيقات من شركاء سلة المعتمدين.</p>

      {/* The curated shelf — the pattern's whole point. */}
      <section aria-labelledby="rec-heading" className="mb-8">
        <div className="mb-3 flex items-center gap-2.5">
          <h2 id="rec-heading" className="text-[15px] font-bold">موصى به من سلة</h2>
          <Chip tone="mint">مختار بعناية</Chip>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((app) => <AppCard key={app.id} app={app} featured />)}
        </div>
      </section>

      <section aria-labelledby="all-heading">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 id="all-heading" className="text-[15px] font-bold">كل التطبيقات</h2>
          <div role="tablist" aria-label="تصفية حسب التصنيف" className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value} type="button" role="tab"
                aria-selected={category === c.value}
                onClick={() => setCategory(c.value)}
                className={`rounded-full border px-3 py-1 text-[12.5px] ${
                  category === c.value
                    ? 'border-salla-primary bg-salla-primary text-white'
                    : 'border-salla-border-strong bg-white text-salla-text-secondary hover:border-salla-primary'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((app) => <AppCard key={app.id} app={app} />)}
        </div>
        {rest.length === 0 && <p className="py-8 text-center text-[13px] text-salla-text-tertiary">لا توجد تطبيقات في هذا التصنيف.</p>}
      </section>
    </SallaShell>
  );
}

function AppCard({ app, featured }: { app: PartnerApp; featured?: boolean }) {
  return (
    <Link
      to={`/pattern-2/app/${app.id}`}
      className={`group flex flex-col rounded-[14px] border bg-white p-5 shadow-sm transition-shadow hover:shadow-md
        ${featured ? 'border-[#B6F2DF] ring-1 ring-salla-secondary' : 'border-salla-border'}`}
    >
      <div className="mb-3 flex items-start gap-3">
        <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-to-bl from-salla-primary to-[#348D9D] text-xl font-bold text-white">
          {app.monogram}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex flex-wrap items-center gap-2 text-[15px] font-bold group-hover:text-salla-primary">
            {app.name}
            {featured && <Chip tone="mint">✓ موصى به</Chip>}
          </h3>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-salla-text-tertiary">{app.tagline}</p>
        </div>
      </div>
      <div className="tabular mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-salla-border pt-3 text-[12px] text-salla-text-tertiary">
        <span>★ {n(app.rating)}</span>
        <span>{n(app.installs.toLocaleString('en-US'))} تثبيت</span>
        <span className="ms-auto font-semibold text-salla-text-primary">{app.price}</span>
      </div>
    </Link>
  );
}
