import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'link' | 'mint' | 'danger' | 'feature';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:  'bg-salla-primary text-white hover:bg-salla-primary-700 border-transparent',
  mint:     'bg-salla-secondary text-salla-primary-700 hover:brightness-95 border-transparent',
  secondary:'bg-white text-salla-primary border-salla-border hover:border-salla-primary hover:bg-salla-primary-50',
  link:     'bg-transparent text-salla-primary underline border-transparent hover:opacity-75 px-1',
  danger:   'bg-salla-danger-500 text-white hover:brightness-95 border-transparent',
  feature:  'bg-gradient-to-l from-[#5B34B0] to-[#7B4DD8] text-white border-transparent',
};
const SIZES: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-[13px]',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-[15px]',
};

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-semibold
        transition-[background,border,opacity] disabled:opacity-45 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current/30 border-t-current"
        />
      )}
      {children}
    </button>
  );
}
