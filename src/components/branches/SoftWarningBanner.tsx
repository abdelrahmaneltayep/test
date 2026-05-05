import { useEffect, useRef } from 'react'
import { type PlanTier } from '@/config/planLimits'
import { track } from '@/utils/analytics'
import styles from './SoftWarningBanner.module.css'

interface Props {
  currentPlan: PlanTier
  currentCount: number
  planLimit: number
  targetPlan: PlanTier
  onDismiss: () => void
  onUpgradeClick: () => void
}

const MESSAGES: Record<string, string> = {
  basic: (count: number, limit: number) =>
    `أضفت ${count} من أصل ${limit} فروع — قرّب تكمل! الباقة بلس تعطيك حتى 10 فروع.`,
  plus: (count: number, limit: number) =>
    `أضفت ${count} من أصل ${limit} فروع — وسّع نطاقك مع باقة برو (20 فرع).`,
  pro: (count: number, limit: number) =>
    `أضفت ${count} من أصل ${limit} فرع — الباقة اسبيشل تعطيك فروع غير محدودة.`,
} as unknown as Record<string, (count: number, limit: number) => string>

const CTA_LABELS: Record<string, string> = {
  plus: 'ترقية إلى بلس',
  pro: 'ترقية إلى برو',
  special: 'ترقية إلى اسبيشل',
}

export function SoftWarningBanner({
  currentPlan,
  currentCount,
  planLimit,
  targetPlan,
  onDismiss,
  onUpgradeClick,
}: Props) {
  const shownAt = useRef<number>(Date.now())

  useEffect(() => {
    shownAt.current = Date.now()
    track('branch_limit_banner_shown', {
      plan_tier: currentPlan,
      current_count: currentCount,
      max_count: planLimit,
      solution_type: '1',
    })
  }, [currentPlan, currentCount, planLimit])

  const getMessage = (MESSAGES as unknown as Record<string, (c: number, l: number) => string>)[currentPlan]
  const message = getMessage ? getMessage(currentCount, planLimit) : ''

  function handleDismiss() {
    track('branch_limit_banner_dismissed', {
      plan_tier: currentPlan,
      time_on_screen_ms: Date.now() - shownAt.current,
    })
    onDismiss()
  }

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
        <button className={styles.dismissBtn} onClick={handleDismiss} type="button" aria-label="إغلاق">
          ×
        </button>
      </div>
    </div>
  )
}
