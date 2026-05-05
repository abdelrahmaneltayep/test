import { type PlanTier } from '@/config/planLimits'
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

type PlanContent = { headline: string; bullets: string[]; cta: string }

const PLAN_CONTENT: Record<string, PlanContent> = {
  basic: {
    headline: 'وصلت للحد الأقصى — 5 فروع',
    bullets: ['ضاعف عدد فروعك من 5 إلى 10', 'إدارة مخزون موحّدة عبر جميع الفروع', 'تقارير مبيعات مفصّلة لكل فرع'],
    cta: 'ترقية الآن → بلس',
  },
  plus: {
    headline: 'وصلت للحد الأقصى — 10 فروع',
    bullets: ['توسّع إلى 20 فرع ومستودع', 'حقول مخصصة لمنتجاتك وخياراتك', 'تقارير تفصيلية وأدوات تسويقية متقدمة'],
    cta: 'ترقية الآن → برو',
  },
  pro: {
    headline: 'وصلت للحد الأقصى — 20 فرع',
    bullets: ['فروع ومستودعات غير محدودة', 'دعم مخصص على مدار الساعة', 'أدوات نمو وتحليلات متقدمة'],
    cta: 'ترقية الآن → اسبيشل',
  },
}

export function HardBlockModal({ currentPlan, currentCount, planLimit, targetPlan, isOpen, onClose, onUpgradeClick }: Props) {
  if (!isOpen) return null
  const content = PLAN_CONTENT[currentPlan]

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="hbm-title">
      {/* Background click intentionally does NOT close — per spec */}
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.limitBadge}>{currentCount} / {planLimit} فرع</div>
          <h2 id="hbm-title" className={styles.headline}>{content?.headline}</h2>
        </div>
        <ul className={styles.bullets}>
          {content?.bullets.map((b) => (
            <li key={b}><span className={styles.check}>✓</span>{b}</li>
          ))}
        </ul>
        <div className={styles.actions}>
          <button className={styles.upgradeBtn} onClick={onUpgradeClick} type="button" autoFocus>
            {content?.cta}
          </button>
          <button className={styles.secondaryBtn} onClick={onClose} type="button">ليس الآن</button>
        </div>
      </div>
    </div>
  )
}
