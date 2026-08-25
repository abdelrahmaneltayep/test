import type { ReactNode } from 'react';

interface Props {
  checked: boolean;
  onSelect: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  name: string;
  value: string;
}

/** Salla provider-style selectable card. Real radio semantics under the styling. */
export function RadioCard({ checked, onSelect, title, description, children, name, value }: Props) {
  return (
    <div
      className={`rounded-lg border bg-white transition-colors
        ${checked ? 'border-2 border-salla-primary p-[15px]' : 'border-salla-border-strong p-4 hover:border-salla-primary-300'}`}
    >
      <label className="flex cursor-pointer gap-3">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onSelect}
          className="mt-1 h-[18px] w-[18px] shrink-0 accent-[color:var(--salla-primary)]"
        />
        <span className="min-w-0 flex-1">
          <span className="mb-1 flex flex-wrap items-center gap-2 text-[14.5px] font-bold">{title}</span>
          {description && <span className="block text-[12.5px] leading-relaxed text-salla-text-tertiary">{description}</span>}
        </span>
      </label>
      {checked && children}
    </div>
  );
}
