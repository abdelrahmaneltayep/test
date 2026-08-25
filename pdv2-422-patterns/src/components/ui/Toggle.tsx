interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  id?: string;
}

export function Toggle({ checked, onChange, label, description, id }: Props) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-[21px] w-[38px] shrink-0 rounded-full transition-colors
          ${checked ? 'bg-salla-primary' : 'bg-[#DEDEDE]'}`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-[2.5px] h-4 w-4 rounded-full bg-white shadow transition-[inset-inline-start]
            ${checked ? 'start-[19.5px]' : 'start-[2.5px]'}`}
        />
      </button>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-salla-text-tertiary">{description}</span>}
      </span>
    </label>
  );
}
