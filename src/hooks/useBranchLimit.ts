import { useState, useCallback } from 'react'
import { type PlanTier, isAtSoftWarning, isAtHardLimit, getUsagePct, getNextPlan, getPlanLimit } from '@/config/planLimits'
import { isBannerDismissalActive, setBannerDismissed, clearBannerDismissal } from '@/utils/dismissal'

export function useBranchLimit(plan: PlanTier, initialCount: number) {
  const planLimit = getPlanLimit(plan)
  const [currentCount, setCurrentCount] = useState(initialCount)
  const [showModal, setShowModal] = useState(false)
  const [dismissed, setDismissed] = useState(() => isBannerDismissalActive())

  const atHardLimit = isAtHardLimit(plan, currentCount)
  const atSoftWarning = isAtSoftWarning(plan, currentCount)
  const usagePct = getUsagePct(plan, currentCount)
  const nextPlan = getNextPlan(plan)

  const showBanner = plan !== 'special' && (atSoftWarning || atHardLimit) && (!dismissed || atHardLimit)

  const dismissBanner = useCallback(() => {
    setBannerDismissed()
    setDismissed(true)
  }, [])

  const handleAddClick = useCallback(() => {
    if (atHardLimit) { setShowModal(true); return false }
    return true
  }, [atHardLimit])

  const closeModal = useCallback(() => setShowModal(false), [])

  const onBranchAdded = useCallback(() => {
    setCurrentCount((c) => {
      const next = c + 1
      if (planLimit !== null && next >= planLimit) {
        clearBannerDismissal()
        setDismissed(false)
      }
      return next
    })
  }, [planLimit])

  const onBranchDeleted = useCallback(() => setCurrentCount((c) => Math.max(0, c - 1)), [])

  return {
    currentCount, planLimit, nextPlan,
    isAtSoftWarning: atSoftWarning, isAtHardLimit: atHardLimit, usagePct,
    showBanner, showModal,
    dismissBanner, handleAddClick, closeModal, onBranchAdded, onBranchDeleted,
  }
}
