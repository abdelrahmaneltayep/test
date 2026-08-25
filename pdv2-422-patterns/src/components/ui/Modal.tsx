import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  labelledBy?: string;
}

export function Modal({ open, onClose, title, children, footer }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[150] grid place-items-center bg-[rgba(0,20,24,.5)] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[18px] bg-white shadow-drawer"
      >
        <div className="flex items-start gap-3 p-6 pb-0">
          <h3 className="flex-1 text-[17px] font-bold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="text-2xl leading-none text-salla-text-tertiary">×</button>
        </div>
        <div className="p-6 pt-4 text-[13.5px] leading-relaxed">{children}</div>
        {footer && <div className="flex gap-2.5 rounded-b-[18px] border-t border-salla-border bg-salla-surface-soft p-5">{footer}</div>}
      </div>
    </div>
  );
}
