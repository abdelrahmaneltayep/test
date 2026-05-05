import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { type PlanTier } from '@/config/planLimits'
import styles from './UpgradeTooltip.module.css'

interface Props {
  currentPlan: PlanTier
  currentCount: number
  planLimit: number
  targetPlan: PlanTier
  isAtLimit: boolean
  children: ReactNode
  onUpgradeClick: (url: string) => void
}

type TooltipContent = { text: string; linkLabel: string }

const PLAN_NAMES: Record<string, string> = { plus: 'بلس', pro: 'برو', special: 'اسبيشل' }

function buildContent(plan: PlanTier, count: number, limit: number, target: PlanTier, atLimit: boolean): TooltipContent | null {
  if (count / limit < 0.8) return null
  const name = PLAN_NAMES[target] ?? target
  const remaining = limit - count
  if (atLimit) {
    const texts: Record<string, string> = {
      basic: `وصلت للحد الأقصى. ترقّى إلى بلس لإضافة المزيد من الفروع.`,
      plus:  `وصلت للحد الأقصى. ترقّى إلى برو للحصول على 20 فرع.`,
      pro:   `وصلت للحد الأقصى. اسبيشل = فروع غير محدودة.`,
    }
    return { text: texts[plan] ?? '', linkLabel: 'ترقية الآن ←' }
  }
  const texts: Record<string, string> = {
    basic: `هذا آخر فرع مجاني في باقتك! باقة ${name} تعطيك حتى 10 فروع.`,
    plus:  `تبقّى ${remaining} فروع فقط في باقتك. برو يوسّع لك السعة إلى 20 فرع.`,
    pro:   `تبقّى ${remaining} فروع فقط! اسبيشل يعطيك فروع غير محدودة.`,
  }
  return { text: texts[plan] ?? '', linkLabel: `تعرّف على ${name} ←` }
}

export function UpgradeTooltip({ currentPlan, currentCount, planLimit, targetPlan, isAtLimit, children, onUpgradeClick }: Props) {
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const content = buildContent(currentPlan, currentCount, planLimit, targetPlan, isAtLimit)

  const show = useCallback(() => {
    if (!content) return
    setVisible(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(false), 5000)
  }, [content])

  const hide = useCallback(() => {
    setVisible(false)
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
  }, [])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  function handleLink(e: React.MouseEvent) {
    e.stopPropagation()
    onUpgradeClick(`/upgrade?plan=${targetPlan}&source=branch_limit_tooltip`)
    hide()
  }

  return (
    <div className={styles.wrapper} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {visible && content && (
        <div className={styles.tooltip} role="tooltip" aria-live="polite">
          <p className={styles.text}>{content.text}</p>
          <button className={styles.link} onClick={handleLink} type="button">{content.linkLabel}</button>
        </div>
      )}
    </div>
  )
}
