import type { ReactNode } from 'react';

/** Tayaar app icon — placeholder mark, not the real asset (pending Partnerships). */
export function TayaarIcon({ size = 40 }: { size?: number }) {
  return (
    <span aria-hidden="true" style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-[10px] bg-[#0B2B3A]">
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path d="M21.5 3.2 2.9 10.4c-.8.3-.8 1.4 0 1.7l6.5 2.3 2.3 6.5c.3.8 1.4.8 1.7 0L20.6 3.9c.2-.6-.4-1.1-1-.7Z"
          fill="#fff" />
        <path d="m9.4 14.4 4.4-4.4" stroke="#0B2B3A" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

type TagKind = 'gift' | 'ok' | 'warn' | 'danger' | 'muted';
const TAGS: Record<TagKind, string> = {
  gift:   'bg-salla-warning-50 text-salla-warning-700 border-salla-warning-500/45',
  ok:     'bg-salla-success-50 text-salla-success-700 border-salla-success-500/40',
  warn:   'bg-salla-warning-50 text-salla-warning-700 border-salla-warning-500/45',
  danger: 'bg-salla-danger-50 text-salla-danger-700 border-salla-danger-500/40',
  muted:  'bg-white/70 text-salla-text-2 border-salla-border',
};
export const Tag = ({ kind = 'muted', children }: { kind?: TagKind; children: ReactNode }) => (
  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11.5px] font-semibold ${TAGS[kind]}`}>
    {kind === 'gift' && <span aria-hidden="true">🎁</span>}
    {children}
  </span>
);

type BV = 'mint' | 'primary' | 'ghost' | 'danger';
const BTN: Record<BV, string> = {
  mint:    'bg-[#A8EBD3] text-[#0B4437] hover:brightness-95 border-transparent',
  primary: 'bg-salla-primary text-white hover:bg-salla-primary-700 border-transparent',
  ghost:   'bg-white text-salla-primary border-salla-border hover:border-salla-primary',
  danger:  'bg-salla-danger-700 text-white border-transparent hover:brightness-110',
};
export function Btn({ v = 'mint', loading, children, ...r }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { v?: BV; loading?: boolean; children: ReactNode }) {
  return (
    <button {...r} disabled={r.disabled || loading} aria-busy={loading || undefined}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-md border px-4 py-2 text-[13px]
        font-bold transition disabled:opacity-50 ${BTN[v]}`}>
      {loading && <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />}
      {children}
    </button>
  );
}
