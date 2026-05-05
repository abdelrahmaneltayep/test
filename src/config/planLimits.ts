export type PlanTier = 'basic' | 'plus' | 'pro' | 'special'

export const PLAN_BRANCH_LIMITS: Record<PlanTier, number | null> = {
  basic: 5,
  plus: 10,
  pro: 20,
  special: null, // null = unlimited
}

export const PLAN_UPGRADE_PATH: Record<PlanTier, PlanTier> = {
  basic: 'plus',
  plus: 'pro',
  pro: 'special',
  special: 'special',
}

export const PLAN_SOFT_WARNING_THRESHOLD = 0.8

export function getPlanLimit(plan: PlanTier): number | null {
  return PLAN_BRANCH_LIMITS[plan]
}

export function getNextPlan(plan: PlanTier): PlanTier {
  return PLAN_UPGRADE_PATH[plan]
}

export function isAtSoftWarning(plan: PlanTier, currentCount: number): boolean {
  const limit = getPlanLimit(plan)
  if (limit === null || plan === 'special') return false
  const pct = currentCount / limit
  return pct >= PLAN_SOFT_WARNING_THRESHOLD && currentCount < limit
}

export function isAtHardLimit(plan: PlanTier, currentCount: number): boolean {
  const limit = getPlanLimit(plan)
  if (limit === null || plan === 'special') return false
  return currentCount >= limit
}

export function getUsagePct(plan: PlanTier, currentCount: number): number {
  const limit = getPlanLimit(plan)
  if (limit === null) return 0
  return currentCount / limit
}
