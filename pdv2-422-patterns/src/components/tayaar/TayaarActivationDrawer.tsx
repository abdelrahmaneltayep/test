import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { AlertBox } from '../ui/AlertBox';
import { useTayaarStore } from '../../store/tayaarStore';
import { n, sar } from '../../lib/num';
import { TAYAAR_CAPABILITIES } from '../../data/mock';

interface Props {
  open: boolean;
  onClose: () => void;
  onActivated?: () => void;
}

/**
 * ST2 — the one activation surface. Every pattern opens THIS component;
 * none of them re-implement activation.
 */
export function TayaarActivationDrawer({ open, onClose, onActivated }: Props) {
  const { activating, activationError, activate } = useTayaarStore();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !activating) onClose(); };
    document.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, activating]);

  const handleActivate = async () => {
    const ok = await activate();
    if (ok) { onActivated?.(); onClose(); }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[160] flex">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !activating && onClose()}
            className="absolute inset-0 bg-[rgba(0,20,24,.5)]"
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="تفعيل تجربة طيّار المجانية"
            tabIndex={-1}
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.26 }}
            className="relative ms-auto flex h-full w-full max-w-[480px] flex-col bg-white shadow-drawer"
          >
            <div className="flex items-start gap-3 border-b border-salla-border p-6">
              <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-to-bl from-salla-primary to-[#348D9D] text-lg font-bold text-white">ط</span>
              <div className="flex-1">
                <h2 className="text-[17px] font-bold">بدء أسبوع طيّار المجاني</h2>
                <p className="mt-0.5 text-[12.5px] text-salla-text-tertiary">تفعيل مباشر داخل لوحة تحكمك — بدون تحويل لأي خدمة خارجية.</p>
              </div>
              <button type="button" onClick={onClose} disabled={activating} aria-label="إغلاق" className="text-2xl leading-none text-salla-text-tertiary disabled:opacity-40">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activationError && (
                <AlertBox variant="danger" icon="⚠️" title="تعذّر تفعيل التجربة" live className="mb-4">
                  <p>{activationError}</p>
                  <p className="mt-1.5">لم نسجّل أي اشتراك أو تجربة على متجرك. لن نُبقي متجرك في حالة نصف مفعّلة أبدًا.</p>
                </AlertBox>
              )}

              <dl className="mb-5 grid gap-3 rounded-lg bg-salla-surface-soft p-4 text-[13px]">
                {[
                  ['ما الذي يشمله', 'تجهيز الطلب + التوصيل'],
                  ['المدة', `${n(7)} أيام كاملة`],
                  ['تنتهي في', `${n(31)} أغسطس ${n(2026)}`],
                  ['وسيلة دفع الآن', 'غير مطلوبة'],
                  ['بعد التجربة', `من ${sar(5)} شهريًا`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-salla-text-tertiary">{k}</dt>
                    <dd className="text-start font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>

              <h3 className="mb-2.5 text-sm font-bold">ما الذي تحصل عليه</h3>
              <ul className="mb-5 grid gap-2">
                {TAYAAR_CAPABILITIES.map((c) => (
                  <li key={c} className="flex gap-2.5 text-[12.5px] text-salla-text-secondary">
                    <span aria-hidden="true" className="font-bold text-salla-success-500">✓</span>{c}
                  </li>
                ))}
              </ul>

              <AlertBox variant="info" icon="ℹ️" title={`ماذا يحدث في اليوم ${n(7)}`}>
                لن يُخصم أي مبلغ تلقائيًا. إن اخترت عدم الاستمرار، تبقى فروعك ضمن التوصيل السريع للاستلام
                والتوصيل الاعتيادي، ويتوقف وعد «التوصيل خلال ساعتين» بعد مهلة {n(48)} ساعة.
              </AlertBox>
            </div>

            <div className="flex gap-2.5 border-t border-salla-border bg-salla-surface-soft p-5">
              <Button variant="mint" size="lg" loading={activating} onClick={handleActivate}>
                {activating ? 'جارٍ التفعيل…' : activationError ? 'إعادة المحاولة' : 'تفعيل التجربة الآن'}
              </Button>
              <Button variant="secondary" size="lg" onClick={onClose} disabled={activating}>إلغاء</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
