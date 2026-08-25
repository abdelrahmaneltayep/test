import type { ReactNode } from 'react';

type Tone = 'mint' | 'warning' | 'danger' | 'info' | 'muted' | 'feature';

const TONES: Record<Tone, string> = {
  mint:    'bg-salla-secondary-50 text-salla-success-700 border-[#B6F2DF]',
  warning: 'bg-salla-warning-50 text-salla-warning-700 border-[#F0D8AE]',
  danger:  'bg-salla-danger-50 text-salla-danger-700 border-[#F8C9CB]',
  info:    'bg-salla-info-50 text-salla-info-700 border-[#C9E0F8]',
  muted:   'bg-salla-surface-soft text-salla-text-tertiary border-salla-border',
  feature: 'bg-[#F3EEFC] text-[#5B34B0] border-[#E0D3F7]',
};

export function Chip({ tone = 'muted', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
