interface Option { value: string; label: string }

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  label: string;
  id: string;
  required?: boolean;
  hint?: string;
}

export function Dropdown({ value, onChange, options, label, id, required, hint }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold">
        {required && <span aria-hidden="true" className="text-salla-danger-500">* </span>}
        {label}
        {hint && <span className="mt-0.5 block text-[12.5px] font-normal text-salla-text-tertiary">{hint}</span>}
      </label>
      <select
        id={id}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="salla-select w-full cursor-pointer appearance-none rounded-lg border
                   border-salla-border-strong bg-white px-3.5 py-3 text-[13.5px] focus:border-salla-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
