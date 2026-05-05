import { type PlanTier } from '@/config/planLimits'
import styles from './SoftWarningBanner.module.css'

interface Props {
  currentPlan: PlanTier
  currentCount: number
  planLimit: number
  targetPlan: PlanTier
  dismissible?: boolean
  onDismiss?: () => void
  onUpgradeClick: () => void
}

const MESSAGES: Record<string, (count: number, limit: number) => string> = {
  basic: (c, l) => `أضفت ${c} من أصل ${l} فروع — قرّب تكمل! الباقة بلس تعطيك حتى 10 فروع.`,
  plus:  (c, l) => `أضفت ${c} من أصل ${l} فروع — وسّع نطاقك مع باقة برو (20 فرع).`,
  pro:   (c, l) => `أضفت ${c} من أصل ${l} فرع — الباقة اسبيشل تعطيك فروع غير محدودة.`,
}

const CTA_LABELS: Record<string, string> = {
  plus: 'ترقية إلى بلس',
  pro: 'ترقية إلى برو',
  special: 'ترقية إلى اسبيشل',
}

export function SoftWarningBanner({
  currentPlan, currentCount, planLimit, targetPlan,
  dismissible = true, onDismiss, onUpgradeClick,
}: Props) {
  const message = MESSAGES[currentPlan]?.(currentCount, planLimit) ?? ''

  return (
    <div className={styles.banner} role="alert" aria-live="polite">
      <div className={styles.content}>
        <span className={styles.icon}>⚠️</span>
        <p className={styles.message}>{message}</p>
      </div>
      <div className={styles.actions}>
        <button className={styles.upgradeBtn} onClick={onUpgradeClick} type="button">
          {CTA_LABELS[targetPlan] ?? 'ترقية الباقة'}
        </button>
        {dismissible && onDismiss && (
          <button className={styles.dismissBtn} onClick={onDismiss} type="button" aria-label="إغلاق">
            ×
          </button>
        )}
      </div>
    </div>
  )
}
