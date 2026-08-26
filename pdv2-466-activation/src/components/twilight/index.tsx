/**
 * Thin React wrappers over Salla Twilight components.
 *
 * Each wrapper names the Twilight element it stands for and the props it maps to.
 * They render plain markup here (the Twilight runtime is not loaded in this
 * prototype) but the surface is 1:1, so swapping the body for <s-button …> etc.
 * is a mechanical change — nothing above this layer needs to move.
 *
 * NOTE ON COLOUR: warning/info have no published hex. Wrappers accept the theme
 * NAME and, only in this prototype, fall back to --xx-fallback-* variables.
 * Production passes the theme straight through to Twilight and uses no hex.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

/* ── <s-button> ──────────────────────────────────────────────── */
export type ButtonTheme = 'default' | 'secondary' | 'danger' | 'warning' | 'info' | 'white' | 'transparent' | 'feature';
const BTN: Record<ButtonTheme, string> = {
  default:     'bg-primary text-white border-transparent hover:brightness-110',
  secondary:   'bg-secondary text-primary border-transparent hover:brightness-95',
  danger:      'bg-danger text-white border-transparent hover:brightness-95',
  warning:     'border-transparent text-white [background:var(--xx-fallback-warning-fg)]',
  info:        'border-transparent text-white [background:var(--xx-fallback-info-fg)]',
  white:       'bg-white text-primary border-gray-500 hover:border-primary',
  transparent: 'bg-transparent text-primary border-transparent underline px-1',
  feature:     'bg-gradient-to-bl from-[#7B4DD8] to-[#5B34B0] text-white border-transparent',
};
export function Button({ theme = 'default', outlined, size = 'md', loading, children, ...r }:
  ButtonHTMLAttributes<HTMLButtonElement> & { theme?: ButtonTheme; outlined?: boolean; size?: 'sm'|'md'|'lg'; loading?: boolean; children: ReactNode }) {
  const sz = size === 'sm' ? 'px-3 py-1.5 text-[12.5px]' : size === 'lg' ? 'px-6 py-3 text-[15px]' : 'px-4 py-2.5 text-[13.5px]';
  const outline = outlined ? 'bg-white !text-primary border-primary' : '';
  return (
    <button {...r} disabled={r.disabled || loading} aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition
        disabled:opacity-45 disabled:cursor-not-allowed ${BTN[theme]} ${outline} ${sz} ${r.className ?? ''}`}>
      {loading && <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />}
      {children}
    </button>
  );
}

/* ── <s-tag> ─────────────────────────────────────────────────── */
export type TagTheme = 'default' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
const TAG: Record<TagTheme, string> = {
  default:   'bg-gray-200 text-dark-200 border-gray-400',
  secondary: 'bg-secondary-100 text-primary border-secondary',
  success:   'text-white border-transparent [background:var(--success)]',
  danger:    'text-white border-transparent [background:var(--danger)]',
  warning:   '[background:var(--xx-fallback-warning-bg)] [color:var(--xx-fallback-warning-fg)] [border-color:var(--xx-fallback-warning-bd)]',
  info:      '[background:var(--xx-fallback-info-bg)] [color:var(--xx-fallback-info-fg)] [border-color:var(--xx-fallback-info-bd)]',
};
export const Tag = ({ theme = 'default', children }: { theme?: TagTheme; children: ReactNode }) => (
  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11.5px] font-semibold ${TAG[theme]}`}>{children}</span>
);

/* ── <s-alert-box> ───────────────────────────────────────────── */
export type AlertTheme = 'default' | 'secondary' | 'danger' | 'warning' | 'info';
const ALERT: Record<AlertTheme, string> = {
  default:   'bg-primary-100 border-primary-400/30 text-primary',
  secondary: 'bg-secondary-100 border-secondary text-primary',
  danger:    'bg-[#FEF1F1] border-danger/30 [color:#C9333A]',
  warning:   '[background:var(--xx-fallback-warning-bg)] [border-color:var(--xx-fallback-warning-bd)] [color:var(--xx-fallback-warning-fg)]',
  info:      '[background:var(--xx-fallback-info-bg)] [border-color:var(--xx-fallback-info-bd)] [color:var(--xx-fallback-info-fg)]',
};
export function AlertBox({ theme = 'default', icon, title, children, action }:
  { theme?: AlertTheme; icon?: ReactNode; title?: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div role={theme === 'danger' ? 'alert' : undefined} aria-live="polite"
      className={`flex gap-3 rounded-xl border p-4 ${ALERT[theme]}`}>
      {icon && <span aria-hidden="true" className="shrink-0 leading-6">{icon}</span>}
      <div className="min-w-0 flex-1">
        {title && <h4 className="text-[13.5px] font-bold">{title}</h4>}
        {children && <div className="mt-0.5 text-[12.5px] leading-relaxed">{children}</div>}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}

/* ── <s-panel> ───────────────────────────────────────────────── */
export const Panel = ({ title, desc, children, footer }:
  { title?: ReactNode; desc?: ReactNode; children: ReactNode; footer?: ReactNode }) => (
  <section className="rounded-xl border border-gray-400 bg-white shadow-sm">
    {(title || desc) && (
      <header className="border-b border-gray-400 px-5 py-4">
        {title && <h2 className="text-[15px] font-bold">{title}</h2>}
        {desc && <p className="mt-0.5 text-[12.5px] text-dark-200">{desc}</p>}
      </header>
    )}
    <div className="p-5">{children}</div>
    {footer && <footer className="border-t border-gray-400 bg-gray-100 px-5 py-4">{footer}</footer>}
  </section>
);

/* ── <s-toggle> ──────────────────────────────────────────────── */
export function Toggle({ checked, onChange, label, desc, id, disabled }:
  { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string; id: string; disabled?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <button type="button" id={id} role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-[21px] w-[38px] shrink-0 rounded-full transition-colors disabled:opacity-40
          ${checked ? 'bg-primary' : 'bg-gray-500'}`}>
        <span aria-hidden="true"
          className={`absolute top-[2.5px] h-4 w-4 rounded-full bg-white shadow transition-[inset-inline-start]
            ${checked ? 'start-[19.5px]' : 'start-[2.5px]'}`} />
      </button>
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-[13px] font-semibold">{label}</span>
        {desc && <span className="mt-0.5 block text-[12px] text-dark-200">{desc}</span>}
      </label>
    </div>
  );
}

/* ── <s-progress-bar> ────────────────────────────────────────── */
export function ProgressBar({ label, desc, percentage, showPercentage = true }:
  { label: string; desc?: string; percentage: number; showPercentage?: boolean }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold">{label}</span>
        {showPercentage && <span className="tabular text-[12px] text-dark-200">{percentage}%</span>}
      </div>
      <div role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-gray-400">
        <span className="block h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${percentage}%` }} />
      </div>
      {desc && <span className="text-[12px] text-dark-200">{desc}</span>}
    </div>
  );
}

/* ── <s-icon> — directional icons mirror, universal ones don't ─ */
export const Icon = ({ name, mirror }: { name: string; mirror?: boolean }) => (
  <span aria-hidden="true" className={`inline-block leading-none ${mirror ? 'rtl:-scale-x-100' : ''}`}>{name}</span>
);
