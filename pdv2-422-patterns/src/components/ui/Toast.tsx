import { AnimatePresence, motion } from 'framer-motion';
import { useTayaarStore } from '../../store/tayaarStore';

export function ToastHost() {
  const toast = useTayaarStore((s) => s.toast);
  const clear = useTayaarStore((s) => s.clearToast);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex justify-center px-4"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className={`pointer-events-auto flex max-w-lg items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold shadow-lg
              ${toast.tone === 'error'
                ? 'bg-salla-danger-50 text-salla-danger-700 border border-[#F8C9CB]'
                : 'bg-salla-success-50 text-salla-success-700 border border-[#B6F2DF]'}`}
          >
            <span aria-hidden="true">{toast.tone === 'error' ? '⚠️' : '✅'}</span>
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={clear}
              aria-label="إغلاق التنبيه"
              className="shrink-0 text-lg leading-none opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
