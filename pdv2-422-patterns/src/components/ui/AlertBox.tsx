import type { ReactNode } from 'react';

type Variant = 'info' | 'success' | 'warning' | 'danger';

const STYLES: Record<Variant, string> = {
  info:    'bg-salla-info-50 border-[#C9E0F8] text-salla-info-700',
  success: 'bg-salla-success-50 border-[#B6F2DF] text-salla-success-700',
  warning: 'bg-salla-warning-50 border-[#F0D8AE] text-salla-warning-700',
  danger:  'bg-salla-danger-50 border-[#F8C9CB] text-salla-danger-700',
};

interface Props {
  variant?: Variant;
  icon?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  live?: boolean;
  className?: string;
}

export function AlertBox({ variant = 'info', icon, title, children, actions, live, className = '' }: Props) {
  return (
    <div
      role={variant === 'danger' ? 'alert' : undefined}
      aria-live={live ? 'polite' : undefined}
      className={`flex gap-3 rounded-lg border p-4 ${STYLES[variant]} ${className}`}
    >
      {icon && <span aria-hidden="true" className="shrink-0 leading-6">{icon}</span>}
      <div className="min-w-0 flex-1">
        {title && <h4 className="mb-0.5 text-sm font-bold">{title}</h4>}
        {children && <div className="text-[13px] leading-relaxed">{children}</div>}
        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
