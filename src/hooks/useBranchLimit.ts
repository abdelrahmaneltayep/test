import { useState, useCallback } from 'react'
import { type PlanTier, isAtSoftWarning, isAtHardLimit, getUsagePct, getNextPlan } from '@/config/planLimits'
import { isBannerDismissalActive, setBannerDismissed, clearBannerDismissal } from '@/utils/dismissal'

export interface BranchLimitState {
  currentPlan: PlanTier
  currentCount: number
  planLimit: number | null
  nextPlan: PlanTier
  isAtSoftWarning: boolean
  isAtHardLimit: boolean
  usagePct: number
  showBanner: boolean
  showModal: boolean
}

export function useBranchLimit(plan: PlanTier, initialCount: number, planLimit: number | null) {
  const [currentCount, setCurrentCount] = useState(initialCount)
  const [showModal, setShowModal] = useState(false)
  const [dismissed, setDismissed] = useState(() => isBannerDismissalActive())

  const atHardLimit = isAtHardLimit(plan, currentCount)
  const atSoftWarning = isAtSoftWarning(plan, currentCount)
  const usagePct = getUsagePct(plan, currentCount)
  const nextPlan = getNextPlan(plan)

  // Banner shows when in soft warning zone AND not dismissed, OR when at hard limit (dismissal ignored)
  const showBanner = plan !== 'special' && (atSoftWarning || atHardLimit) && (!dismissed || atHardLimit)

  const dismissBanner = useCallback(() => {
    setBannerDismissed()
    setDismissed(true)
  }, [])

  const handleAddClick = useCallback(() => {
    if (atHardLimit) {
      setShowModal(true)
      return false
    }
    return true
  }, [atHardLimit])

  const closeModal = useCallback(() => setShowModal(false), [])

  const onBranchAdded = useCallback(() => {
    setCurrentCount((c) => {
      const next = c + 1
      // If transitioning to hard limit, force banner re-show (clear dismissal)
      if (planLimit !== null && next >= planLimit) {
        clearBannerDismissal()
        setDismissed(false)
      }
      return next
    })
  }, [planLimit])

  const onBranchDeleted = useCallback(() => {
    setCurrentCount((c) => Math.max(0, c - 1))
  }, [])

  return {
    currentCount,
    planLimit,
    nextPlan,
    isAtSoftWarning: atSoftWarning,
    isAtHardLimit: atHardLimit,
    usagePct,
    showBanner,
    showModal,
    dismissBanner,
    handleAddClick,
    closeModal,
    onBranchAdded,
    onBranchDeleted,
  }
}
