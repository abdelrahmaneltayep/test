import { useEffect } from 'react'
import { type PlanTier } from '@/config/planLimits'
import { track } from '@/utils/analytics'
import styles from './HardBlockModal.module.css'

interface Props {
  currentPlan: PlanTier
  currentCount: number
  planLimit: number
  targetPlan: PlanTier
  isOpen: boolean
  onClose: () => void
  onUpgradeClick: () => void
}

type PlanContent = {
  headline: string
  valueStatement: string
  bullets: string[]
  cta: string
}

const PLAN_CONTENT: Record<string, PlanContent> = {
  basic: {
    headline: 'وصلت للحد الأقصى — 5 فروع',
    valueStatement: 'باقة بلس: حتى 10 فروع + مزايا متقدمة لإدارة مخزونك عبر مواقع متعددة.',
    bullets: [
      'ضاعف عدد فروعك من 5 إلى 10',
      'إدارة مخزون موحّدة عبر جميع الفروع',
      'تقارير مبيعات مفصّلة لكل فرع',
    ],
    cta: 'ترقية الآن → بلس',
  },
  plus: {
    headline: 'وصلت للحد الأقصى — 10 فروع',
    valueStatement: 'باقة برو: حتى 20 فرع + تقارير تفصيلية ومزايا حقول مخصصة لمنتجاتك.',
    bullets: [
      'توسّع إلى 20 فرع ومستودع',
      'حقول مخصصة لمنتجاتك وخياراتك',
      'تقارير تفصيلية وأدوات تسويقية متقدمة',
    ],
    cta: 'ترقية الآن → برو',
  },
  pro: {
    headline: 'وصلت للحد الأقصى — 20 فرع',
    valueStatement: 'باقة اسبيشل: فروع ومستودعات غير محدودة، دعم مخصص، وأدوات نمو متقدمة.',
    bullets: [
      'فروع ومستودعات غير محدودة',
      'دعم مخصص على مدار الساعة',
      'أدوات نمو وتحليلات متقدمة',
    ],
    cta: 'ترقية الآن → اسبيشل',
  },
}

export function HardBlockModal({
  currentPlan,
  currentCount,
  planLimit,
  targetPlan,
  isOpen,
  onClose,
  onUpgradeClick,
}: Props) {
  useEffect(() => {
    if (!isOpen) return
    track('branch_limit_modal_shown', {
      plan_tier: currentPlan,
      current_count: currentCount,
      target_plan: targetPlan,
    })
  }, [isOpen, currentPlan, currentCount, targetPlan])

  // Trap focus inside modal
  useEffect(() => {
    if (!isOpen) return
    const prev = document.activeElement as HTMLElement | null
    return () => { prev?.focus() }
  }, [isOpen])

  if (!isOpen) return null

  const content = PLAN_CONTENT[currentPlan]

  function handleUpgrade() {
    track('branch_limit_modal_cta_clicked', { plan_tier: currentPlan, cta_type: 'upgrade' })
    onUpgradeClick()
  }

  function handleDismiss() {
    track('branch_limit_modal_cta_clicked', { plan_tier: currentPlan, cta_type: 'dismiss' })
    onClose()
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="hbm-title">
      {/* Intentionally NOT closing on overlay click per spec */}
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.limitBadge}>
            {currentCount} / {planLimit} فرع
          </div>
          <h2 id="hbm-title" className={styles.headline}>
            {content?.headline}
          </h2>
          <p className={styles.valueStatement}>{content?.valueStatement}</p>
        </div>

        <ul className={styles.bullets}>
          {content?.bullets.map((b) => (
            <li key={b}>
              <span className={styles.check}>✓</span>
              {b}
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <button className={styles.upgradeBtn} onClick={handleUpgrade} type="button" autoFocus>
            {content?.cta}
          </button>
          <button className={styles.secondaryBtn} onClick={handleDismiss} type="button">
            ليس الآن
          </button>
        </div>
      </div>
    </div>
  )
}
