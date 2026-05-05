import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { type PlanTier } from '@/config/planLimits'
import { track } from '@/utils/analytics'
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

type TooltipContent = {
  text: string
  linkLabel: string
}

function buildTooltipContent(
  plan: PlanTier,
  currentCount: number,
  planLimit: number,
  targetPlan: PlanTier,
  isAtLimit: boolean,
): TooltipContent | null {
  const pct = currentCount / planLimit
  if (pct < 0.8) return null

  const planNameMap: Record<string, string> = {
    plus: 'بلس',
    pro: 'برو',
    special: 'اسبيشل',
  }
  const targetName = planNameMap[targetPlan] ?? targetPlan

  if (isAtLimit) {
    const limitTexts: Record<string, string> = {
      basic: `وصلت للحد الأقصى. ترقّى إلى بلس لإضافة المزيد من الفروع.`,
      plus: `وصلت للحد الأقصى. ترقّى إلى برو للحصول على 20 فرع.`,
      pro: `وصلت للحد الأقصى. اسبيشل = فروع غير محدودة.`,
    }
    return { text: limitTexts[plan] ?? '', linkLabel: 'ترقية الآن ←' }
  }

  const remaining = planLimit - currentCount
  const warningTexts: Record<string, string> = {
    basic: `هذا آخر فرع مجاني في باقتك! باقة ${targetName} تعطيك حتى 10 فروع.`,
    plus: `تبقّى ${remaining === 1 ? 'فرع واحد' : `${remaining} فروع`} فقط في باقتك. برو يوسّع لك السعة إلى 20 فرع.`,
    pro: `تبقّى ${remaining} فروع فقط! اسبيشل يعطيك فروع غير محدودة.`,
  }
  return { text: warningTexts[plan] ?? '', linkLabel: `تعرّف على ${targetName} ←` }
}

const TOOLTIP_AUTO_DISMISS_MS = 5000

export function UpgradeTooltip({
  currentPlan,
  currentCount,
  planLimit,
  targetPlan,
  isAtLimit,
  children,
  onUpgradeClick,
}: Props) {
  const [visible, setVisible] = useState(false)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pct = currentCount / planLimit

  const content = buildTooltipContent(currentPlan, currentCount, planLimit, targetPlan, isAtLimit)
  const shouldRender = pct >= 0.8 && content !== null

  const show = useCallback(() => {
    if (!shouldRender) return
    setVisible(true)
    track('branch_limit_tooltip_shown', {
      plan_tier: currentPlan,
      usage_pct: Math.round(pct * 100),
      is_at_limit: isAtLimit,
    })
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    dismissTimer.current = setTimeout(() => setVisible(false), TOOLTIP_AUTO_DISMISS_MS)
  }, [shouldRender, currentPlan, pct, isAtLimit])

  const hide = useCallback(() => {
    setVisible(false)
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current)
      dismissTimer.current = null
    }
  }, [])

  useEffect(() => () => { if (dismissTimer.current) clearTimeout(dismissTimer.current) }, [])

  function handleLinkClick(e: React.MouseEvent) {
    e.stopPropagation()
    const url = `/upgrade?plan=${targetPlan}&source=branch_limit_tooltip`
    track('branch_limit_tooltip_clicked', { plan_tier: currentPlan, link_target: url })
    onUpgradeClick(url)
    hide()
  }

  return (
    <div
      ref={containerRef}
      className={styles.wrapper}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && content && (
        <div
          className={styles.tooltip}
          role="tooltip"
          aria-live="polite"
        >
          <p className={styles.text}>{content.text}</p>
          <button className={styles.link} onClick={handleLinkClick} type="button">
            {content.linkLabel}
          </button>
        </div>
      )}
    </div>
  )
}
