import { useState } from 'react'
import { type PlanTier, getPlanLimit, getNextPlan } from '@/config/planLimits'
import { useBranchLimit } from '@/hooks/useBranchLimit'
import { SoftWarningBanner } from './SoftWarningBanner'
import { HardBlockModal } from './HardBlockModal'
import { BranchUsageCounter } from './BranchUsageCounter'
import { UpgradeTooltip } from './UpgradeTooltip'
import { Toast } from '@/components/ui/Toast'
import { dismissNudge } from '@/api/nudges'
import styles from './BranchesPage.module.css'

interface Branch {
  id: string
  name: string
  type: 'branch' | 'warehouse'
  city: string
  country: string
  district: string
  status: 'open' | 'closed'
}

interface Props {
  plan: PlanTier
  merchantId: string
  initialBranches: Branch[]
}

function navigateTo(url: string) {
  window.location.href = url
}

export function BranchesPage({ plan, merchantId, initialBranches }: Props) {
  const planLimit = getPlanLimit(plan)
  const nextPlan = getNextPlan(plan)

  const {
    currentCount,
    showBanner,
    showModal,
    isAtHardLimit,
    usagePct,
    dismissBanner,
    handleAddClick,
    closeModal,
  } = useBranchLimit(plan, initialBranches.length, planLimit)

  const [toast, setToast] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBranches = initialBranches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  function handleDismissBanner() {
    dismissBanner()
    void dismissNudge(merchantId, 'banner')
  }

  function handleModalDismiss() {
    closeModal()
    void dismissNudge(merchantId, 'modal')
  }

  function handleAddBranchClick() {
    if (!handleAddClick()) return
    // Navigate to branch creation form when not at limit
    navigateTo('/products/branches/new')
  }

  function handleAddWarehouseClick() {
    if (!handleAddClick()) return
    navigateTo('/products/warehouses/new')
  }

  function handleUpgrade(source: string) {
    const url = `/upgrade?plan=${nextPlan}&source=${source}`
    navigateTo(url)
  }

  const disabledTitle = isAtHardLimit ? 'وصلت للحد الأقصى — قم بالترقية لإضافة المزيد' : undefined

  return (
    <div className={styles.page} dir="rtl">
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>الفروع والمستودعات</h1>

          {/* Solution 3 — Persistent Usage Counter */}
          {plan !== 'special' && (
            <BranchUsageCounter
              currentPlan={plan}
              currentCount={currentCount}
              planLimit={planLimit}
              onToastRequest={setToast}
            />
          )}
          {plan === 'special' && (
            <BranchUsageCounter
              currentPlan="special"
              currentCount={currentCount}
              planLimit={null}
              onToastRequest={setToast}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.headerActions}>
          {/* Solution 4 — Upgrade Tooltip wraps Add buttons */}
          {plan !== 'special' && planLimit !== null ? (
            <>
              <UpgradeTooltip
                currentPlan={plan}
                currentCount={currentCount}
                planLimit={planLimit}
                targetPlan={nextPlan}
                isAtLimit={isAtHardLimit}
                onUpgradeClick={navigateTo}
              >
                <button
                  className={styles.addBtn}
                  onClick={handleAddBranchClick}
                  disabled={isAtHardLimit}
                  title={disabledTitle}
                  type="button"
                  style={isAtHardLimit ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                >
                  + إضافة فرع
                </button>
              </UpgradeTooltip>
              <UpgradeTooltip
                currentPlan={plan}
                currentCount={currentCount}
                planLimit={planLimit}
                targetPlan={nextPlan}
                isAtLimit={isAtHardLimit}
                onUpgradeClick={navigateTo}
              >
                <button
                  className={styles.addBtnSecondary}
                  onClick={handleAddWarehouseClick}
                  disabled={isAtHardLimit}
                  title={disabledTitle}
                  type="button"
                  style={isAtHardLimit ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                >
                  + إضافة مستودع
                </button>
              </UpgradeTooltip>
            </>
          ) : (
            <>
              <button className={styles.addBtn} onClick={handleAddBranchClick} type="button">
                + إضافة فرع
              </button>
              <button className={styles.addBtnSecondary} onClick={handleAddWarehouseClick} type="button">
                + إضافة مستودع
              </button>
            </>
          )}
        </div>
      </div>

      {/* Solution 1 — Soft Warning Banner */}
      {showBanner && plan !== 'special' && planLimit !== null && !isAtHardLimit && (
        <SoftWarningBanner
          currentPlan={plan}
          currentCount={currentCount}
          planLimit={planLimit}
          targetPlan={nextPlan}
          onDismiss={handleDismissBanner}
          onUpgradeClick={() => handleUpgrade('branch_limit_banner')}
        />
      )}

      {/* Hard-limit persistent banner variant (Solution 5 Step 4: non-dismissible) */}
      {showBanner && plan !== 'special' && planLimit !== null && isAtHardLimit && (
        <div className={styles.hardLimitBanner} role="alert">
          <span>⛔ وصلت للحد الأقصى من الفروع.</span>
          <button
            className={styles.hardLimitCta}
            onClick={() => handleUpgrade('branch_hard_limit_banner')}
            type="button"
          >
            ترقية الباقة الآن
          </button>
        </div>
      )}

      {/* Branch List Table */}
      <div className={styles.tableCard}>
        <div className={styles.searchRow}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="بحث"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="بحث في الفروع والمستودعات"
          />
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>الفرع/ المستودع</th>
              <th>الدولة</th>
              <th>المدينة</th>
              <th>الحي</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredBranches.map((b) => (
              <tr key={b.id}>
                <td>
                  <span className={styles.branchName}>{b.name}</span>
                  <span className={styles.branchType}>{b.type === 'branch' ? 'فرع' : 'مستودع'}</span>
                </td>
                <td>{b.country}</td>
                <td>{b.city}</td>
                <td>{b.district || '—'}</td>
                <td>
                  <span className={b.status === 'open' ? styles.statusOpen : styles.statusClosed}>
                    {b.status === 'open' ? 'مفتوح' : 'مغلق'}
                  </span>
                </td>
                <td>
                  <button className={styles.actionBtn} type="button" aria-label="تعديل">✏️</button>
                  <button className={styles.actionBtn} type="button" aria-label="خيارات">⋯</button>
                </td>
              </tr>
            ))}
            {filteredBranches.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>لا توجد نتائج</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Solution 2 — Hard-Block Modal */}
      {plan !== 'special' && planLimit !== null && (
        <HardBlockModal
          currentPlan={plan}
          currentCount={currentCount}
          planLimit={planLimit}
          targetPlan={nextPlan}
          isOpen={showModal}
          onClose={handleModalDismiss}
          onUpgradeClick={() => handleUpgrade('branch_limit_modal')}
        />
      )}

      {/* Toast notification (Solution 3 one-time at-limit toast) */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
