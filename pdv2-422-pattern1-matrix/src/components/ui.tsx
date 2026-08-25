import type { ButtonHTMLAttributes, ReactNode } from 'react';

/* ── Button ─────────────────────────────────────────────────── */
type BV = 'primary' | 'mint' | 'secondary' | 'link' | 'danger';
const BTN: Record<BV, string> = {
  primary:  'bg-salla-primary text-white hover:bg-salla-primary-700 border-transparent',
  mint:     'bg-salla-mint text-salla-primary-700 hover:brightness-95 border-transparent',
  secondary:'bg-white text-salla-primary border-salla-border hover:border-salla-primary',
  link:     'bg-transparent text-salla-primary underline border-transparent px-1',
  danger:   'bg-salla-danger-500 text-white border-transparent hover:brightness-95',
};
export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...r }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BV; size?: 'sm'|'md'|'lg'; loading?: boolean; children: ReactNode }) {
  const sz = size === 'sm' ? 'px-3 py-1.5 text-[12.5px]' : size === 'lg' ? 'px-6 py-3 text-[15px]' : 'px-4 py-2.5 text-[13.5px]';
  return (
    <button {...r} disabled={disabled || loading} aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-md border font-semibold transition
        disabled:opacity-45 disabled:cursor-not-allowed ${BTN[variant]} ${sz} ${className}`}>
      {loading && <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />}
      {children}
    </button>
  );
}

/* ── Tag ────────────────────────────────────────────────────── */
type TV = 'rec' | 'credit' | 'muted' | 'danger' | 'info';
const TAG: Record<TV, string> = {
  rec:    'bg-salla-success-50 text-salla-success-700 border-salla-success-500/40',
  credit: 'bg-salla-warning-50 text-salla-warning-700 border-salla-warning-500/50',
  muted:  'bg-salla-soft text-salla-text-3 border-salla-border',
  danger: 'bg-salla-danger-50 text-salla-danger-700 border-salla-danger-500/40',
  info:   'bg-salla-info-50 text-salla-info-700 border-salla-info-500/40',
};
export const Tag = ({ v = 'rec', children }: { v?: TV; children: ReactNode }) => (
  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11.5px] font-semibold ${TAG[v]}`}>{children}</span>
);

/* ── AlertBox ───────────────────────────────────────────────── */
type AV = 'info' | 'success' | 'warning' | 'danger';
const ALERT: Record<AV, string> = {
  info:    'bg-salla-info-50 border-salla-info-500/30 text-salla-info-700',
  success: 'bg-salla-success-50 border-salla-success-500/30 text-salla-success-700',
  warning: 'bg-salla-warning-50 border-salla-warning-500/40 text-salla-warning-700',
  danger:  'bg-salla-danger-50 border-salla-danger-500/30 text-salla-danger-700',
};
export function AlertBox({ v = 'info', icon, title, children, actions, className = '' }:
  { v?: AV; icon?: ReactNode; title?: ReactNode; children?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div role={v === 'danger' ? 'alert' : undefined} aria-live="polite"
      className={`flex gap-2.5 rounded-md border p-3 ${ALERT[v]} ${className}`}>
      {icon && <span aria-hidden="true" className="shrink-0 leading-5">{icon}</span>}
      <div className="min-w-0 flex-1">
        {title && <p className="text-[13px] font-bold">{title}</p>}
        {children && <div className="text-[12.5px] leading-relaxed">{children}</div>}
        {actions && <div className="mt-2 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* ── Tayaar monogram ────────────────────────────────────────── */
export const Mono = ({ size = 40 }: { size?: number }) => (
  <span aria-hidden="true" style={{ width: size, height: size, fontSize: size * 0.42 }}
    className="grid shrink-0 place-items-center rounded-md bg-gradient-to-bl from-salla-primary to-[#3D7A6E] font-bold text-white">ت</span>
);
export const SallaMono = ({ size = 26 }: { size?: number }) => (
  <span aria-hidden="true" style={{ width: size, height: size, fontSize: size * 0.42 }}
    className="grid shrink-0 place-items-center rounded-md bg-salla-primary font-bold text-white">س</span>
);

/* ── Checkbox row ───────────────────────────────────────────── */
export function CheckRow({ checked, onChange, disabled, title, desc, tag, id, loading }:
  { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; title: ReactNode; desc?: ReactNode; tag?: ReactNode; id: string; loading?: boolean }) {
  return (
    <label htmlFor={id} className={`flex items-start gap-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <input id={id} type="checkbox" checked={checked} disabled={disabled || loading}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded accent-[color:var(--salla-primary)]" />
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold">
          {title}{tag}{loading && <span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border-2 border-salla-primary/30 border-t-salla-primary" />}
        </span>
        {desc && <span className="mt-0.5 block text-[12.5px] leading-relaxed text-salla-text-2">{desc}</span>}
      </span>
    </label>
  );
}
