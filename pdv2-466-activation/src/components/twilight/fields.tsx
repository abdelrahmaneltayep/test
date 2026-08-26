import type { ReactNode } from 'react';

/**
 * Field primitives transcribed from the live Quick Delivery activation screen.
 * Label pattern throughout: text right-aligned, required asterisk trailing.
 */

export const FieldLabel = ({ children, required, hint }:
  { children: ReactNode; required?: boolean; hint?: ReactNode }) => (
  <>
    <span className="block text-[13px] font-semibold">
      {children}{required && <span aria-hidden="true" className="ms-1 text-danger">*</span>}
    </span>
    {hint && <span className="mb-1.5 mt-0.5 block text-[12px] text-dark-200">{hint}</span>}
  </>
);

/** <s-tags-input> — the branch/warehouse picker. Chips are mint. */
export function TagsInput({ items, onRemove, onClear }:
  { items: { id: string; label: string }[]; onRemove?: (id: string) => void; onClear?: () => void }) {
  return (
    <div className="flex min-h-[46px] flex-wrap items-center gap-2 rounded-xl border border-gray-500 bg-white px-3 py-2">
      {items.map((t) => (
        <span key={t.id}
          className="flex items-center gap-2 rounded-lg border border-secondary bg-secondary-100 px-2.5 py-1 text-[12.5px] text-primary">
          {t.label}
          <button type="button" onClick={() => onRemove?.(t.id)} aria-label={`إزالة ${t.label}`}
            className="text-[13px] leading-none opacity-70 hover:opacity-100">×</button>
        </span>
      ))}
      <button type="button" onClick={onClear} aria-label="مسح الكل"
        className="me-auto text-[15px] leading-none text-dark-200">⊗</button>
    </div>
  );
}

/** Provider option — <s-radio> styled as a selectable card. */
export function RadioCard({ checked, onSelect, name, value, title, desc, children }:
  { checked: boolean; onSelect: () => void; name: string; value: string;
    title: ReactNode; desc: ReactNode; children?: ReactNode }) {
  return (
    <div className={`rounded-xl bg-white transition-colors
      ${checked ? 'border-2 border-primary p-[15px]' : 'border border-gray-500 p-4 hover:border-primary-400'}`}>
      <label className="flex cursor-pointer gap-3">
        <input type="radio" name={name} value={value} checked={checked} onChange={onSelect}
          className="mt-1 h-[18px] w-[18px] shrink-0 accent-[color:var(--primary)]" />
        <span className="min-w-0 flex-1">
          <span className="mb-1 flex flex-wrap items-center gap-2 text-[14.5px] font-bold">{title}</span>
          <span className="block text-[12.5px] leading-relaxed text-dark-200">{desc}</span>
        </span>
      </label>
      {checked && children}
    </div>
  );
}

/** Green recommendation pill used on the provider and coverage cards. */
export const MintPill = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-secondary bg-secondary-100 px-2.5 py-0.5 text-[11.5px] font-semibold text-primary">
    <span aria-hidden="true">✓</span>{children}
  </span>
);

/** Small bordered fact chip under the recommended provider. */
export const FactChip = ({ icon, children }: { icon: string; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-400 bg-gray-100 px-2.5 py-1 text-[11.5px] text-dark-200">
    <span aria-hidden="true">{icon}</span>{children}
  </span>
);

/** Row toggle: label right, switch far left — matches the live screen. */
export function RowToggle({ checked, onChange, label, desc, id, disabled }:
  { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string; id: string; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-[13px] font-semibold">{label}</span>
        {desc && <span className="mt-0.5 block text-[12px] text-dark-200">{desc}</span>}
      </label>
      <button type="button" id={id} role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-[22px] w-[40px] shrink-0 rounded-full transition-colors disabled:opacity-40
          ${checked ? 'bg-primary' : 'bg-gray-500'}`}>
        <span aria-hidden="true"
          className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-[inset-inline-start]
            ${checked ? 'start-[21px]' : 'start-[3px]'}`} />
      </button>
    </div>
  );
}

/** <s-select> */
export function Select({ id, value, onChange, options, label, hint, required }:
  { id: string; value: string; onChange: (v: string) => void; options: string[];
    label: ReactNode; hint?: ReactNode; required?: boolean }) {
  return (
    <div>
      <label htmlFor={id}><FieldLabel required={required} hint={hint}>{label}</FieldLabel></label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className="salla-select mt-1.5 w-full appearance-none rounded-xl border border-gray-500 bg-white px-4 py-3 text-[13.5px]">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/** <s-input> with a trailing unit, e.g. the coverage radius. */
export function UnitInput({ id, value, unit, onChange, label }:
  { id: string; value: string; unit: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="relative w-full max-w-[300px]">
      {/* Value sits at the inline-start (right in RTL); the unit at the inline-end,
          matching the live screen. pe-14 keeps them from colliding. */}
      <input id={id} value={value} aria-label={label} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-500 bg-white px-4 pe-14 py-3 text-[13.5px]" />
      <span aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-[12.5px] text-dark-200">{unit}</span>
    </div>
  );
}

/** <s-buttons-group> */
export function ButtonsGroup({ value, onChange, options }:
  { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div role="group" className="flex flex-wrap gap-2.5">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} aria-pressed={value === o.value}
          className={`rounded-xl border px-5 py-2.5 text-[13px] transition
            ${value === o.value ? 'border-secondary bg-secondary font-bold text-primary' : 'border-gray-500 bg-white text-dark-200 hover:border-primary'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Page card — the three sections of the live screen. */
export const Card = ({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) => (
  <section className="rounded-2xl bg-white p-7 shadow-sm">
    <h2 className="text-[17px] font-bold">{title}</h2>
    {desc && <p className="mt-1 text-[13px] text-dark-200">{desc}</p>}
    <div className="mt-5">{children}</div>
  </section>
);
