import { useState } from 'react'
import { type PlanTier, getPlanLimit, getNextPlan } from '@/config/planLimits'
import { useBranchLimit } from '@/hooks/useBranchLimit'
import { SoftWarningBanner } from './SoftWarningBanner'
import { HardBlockModal } from './HardBlockModal'
import { BranchUsageCounter } from './BranchUsageCounter'
import { UpgradeTooltip } from './UpgradeTooltip'
import { Toast } from '@/components/ui/Toast'
import styles from './BranchesPage.module.css'

interface Branch {
  id: string; name: string; type: 'branch' | 'warehouse'
  city: string; country: string; district: string; status: 'open' | 'closed'
}

interface Props {
  plan: PlanTier
  initialBranches: Branch[]
}

export function BranchesPage({ plan, initialBranches }: Props) {
  const planLimit = getPlanLimit(plan)
  const nextPlan = getNextPlan(plan)
  const {
    currentCount, showBanner, showModal, isAtHardLimit,
    dismissBanner, handleAddClick, closeModal, onBranchAdded, onBranchDeleted,
  } = useBranchLimit(plan, initialBranches.length)

  const [toast, setToast] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBranches = initialBranches.filter(
    (b) => b.name.includes(searchQuery) || b.city.includes(searchQuery),
  )

  function handleAdd() {
    if (!handleAddClick()) return // opens modal
    onBranchAdded()
    setToast('تمّت إضافة الفرع بنجاح')
  }

  function handleUpgrade(source: string) {
    alert(`→ /upgrade?plan=${nextPlan}&source=${source}`)
  }

  const disabledTitle = isAtHardLimit ? 'وصلت للحد الأقصى — قم بالترقية لإضافة المزيد' : undefined

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>الفروع والمستودعات</h1>
          {/* Solution 3 — Persistent Usage Counter */}
          <BranchUsageCounter
            currentPlan={plan}
            currentCount={currentCount}
            planLimit={planLimit}
            onToastRequest={setToast}
          />
        </div>

        <div className={styles.headerActions}>
          {/* Solution 4 — Upgrade Tooltip wraps Add buttons */}
          {plan !== 'special' && planLimit !== null ? (
            <>
              <UpgradeTooltip
                currentPlan={plan} currentCount={currentCount} planLimit={planLimit}
                targetPlan={nextPlan} isAtLimit={isAtHardLimit}
                onUpgradeClick={(url) => alert(`→ ${url}`)}
              >
                <button
                  className={styles.addBtn} onClick={handleAdd} type="button"
                  disabled={isAtHardLimit} title={disabledTitle}
                  style={isAtHardLimit ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                >
                  + إضافة فرع / مستودع
                </button>
              </UpgradeTooltip>
              <button
                className={styles.deleteBtn} onClick={onBranchDeleted} type="button"
                disabled={currentCount === 0} title="حذف آخر فرع (للعرض التجريبي)"
              >
                − حذف
              </button>
            </>
          ) : (
            <>
              <button className={styles.addBtn} onClick={handleAdd} type="button">+ إضافة فرع / مستودع</button>
              <button className={styles.deleteBtn} onClick={onBranchDeleted} type="button" disabled={currentCount === 0}>− حذف</button>
            </>
          )}
        </div>
      </div>

      {/* Solution 1 — Soft Warning Banner */}
      {showBanner && plan !== 'special' && planLimit !== null && !isAtHardLimit && (
        <SoftWarningBanner
          currentPlan={plan} currentCount={currentCount} planLimit={planLimit}
          targetPlan={nextPlan} dismissible onDismiss={dismissBanner}
          onUpgradeClick={() => handleUpgrade('branch_limit_banner')}
        />
      )}

      {/* Hard-limit persistent banner (non-dismissible, Solution 5 Step 4) */}
      {showBanner && plan !== 'special' && planLimit !== null && isAtHardLimit && (
        <SoftWarningBanner
          currentPlan={plan} currentCount={currentCount} planLimit={planLimit}
          targetPlan={nextPlan} dismissible={false}
          onUpgradeClick={() => handleUpgrade('branch_hard_limit_persistent')}
        />
      )}

      {/* Branch Table */}
      <div className={styles.tableCard}>
        <div className={styles.searchRow}>
          <input
            className={styles.searchInput} type="search" placeholder="بحث"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} aria-label="بحث"
          />
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>الفرع / المستودع</th><th>الدولة</th><th>المدينة</th>
              <th>الحي</th><th>الحالة</th><th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredBranches.map((b) => (
              <tr key={b.id}>
                <td>
                  <span className={styles.branchName}>{b.name}</span>
                  <span className={styles.branchType}>{b.type === 'branch' ? 'فرع' : 'مستودع'}</span>
                </td>
                <td>{b.country}</td><td>{b.city}</td><td>{b.district || '—'}</td>
                <td>
                  <span className={b.status === 'open' ? styles.statusOpen : styles.statusClosed}>
                    {b.status === 'open' ? 'مفتوح' : 'مغلق'}
                  </span>
                </td>
                <td>
                  <button className={styles.actionBtn} type="button">✏️</button>
                  <button className={styles.actionBtn} type="button">⋯</button>
                </td>
              </tr>
            ))}
            {filteredBranches.length === 0 && (
              <tr><td colSpan={6} className={styles.emptyRow}>لا توجد نتائج</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Solution 2 — Hard-Block Modal */}
      {plan !== 'special' && planLimit !== null && (
        <HardBlockModal
          currentPlan={plan} currentCount={currentCount} planLimit={planLimit}
          targetPlan={nextPlan} isOpen={showModal} onClose={closeModal}
          onUpgradeClick={() => handleUpgrade('branch_limit_modal')}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
