import { useEffect, useRef } from 'react'
import { type PlanTier } from '@/config/planLimits'
import { hasAtLimitToastBeenShown, markAtLimitToastShown } from '@/utils/dismissal'
import styles from './BranchUsageCounter.module.css'

interface Props {
  currentPlan: PlanTier
  currentCount: number
  planLimit: number | null
  onToastRequest?: (message: string) => void
}

type ColorState = 'green' | 'amber' | 'red' | 'teal'

function getColorState(plan: PlanTier, currentCount: number, planLimit: number | null): ColorState {
  if (plan === 'special' || planLimit === null) return 'teal'
  const pct = currentCount / planLimit
  if (pct >= 1) return 'red'
  if (pct >= 0.8) return 'amber'
  return 'green'
}

const COLOR_CLASS: Record<ColorState, string> = {
  green: styles.green,
  amber: styles.amber,
  red: styles.red,
  teal: styles.teal,
}

export function BranchUsageCounter({ currentPlan, currentCount, planLimit, onToastRequest }: Props) {
  const colorState = getColorState(currentPlan, currentCount, planLimit)
  const isUnlimited = currentPlan === 'special' || planLimit === null
  const pct = isUnlimited ? 0 : Math.min(1, currentCount / planLimit!)
  const firedToastRef = useRef(false)

  useEffect(() => {
    if (colorState === 'red' && !firedToastRef.current && !hasAtLimitToastBeenShown()) {
      firedToastRef.current = true
      markAtLimitToastShown()
      onToastRequest?.('وصلت للحد الأقصى من الفروع')
    }
  }, [colorState, onToastRequest])

  return (
    <div className={`${styles.counter} ${COLOR_CLASS[colorState]}`} aria-label="مؤشر استخدام الفروع">
      {isUnlimited ? (
        <span className={styles.unlimitedLabel}>∞ فروع غير محدودة</span>
      ) : (
        <>
          <div className={styles.labelRow}>
            <span className={styles.label}>
              {currentCount} / {planLimit} فروع نشطة
            </span>
            <span className={styles.pctLabel}>{Math.round(pct * 100)}%</span>
          </div>
          <div className={styles.track} role="progressbar" aria-valuenow={currentCount} aria-valuemin={0} aria-valuemax={planLimit!}>
            <div
              className={`${styles.fill} ${colorState === 'amber' ? styles.pulse : ''}`}
              style={{ width: `${pct * 100}%` }}
            />
          </div>
        </>
      )}
    </div>
  )
}
