import { describe, it, expect } from 'vitest'
import {
  PLAN_BRANCH_LIMITS,
  PLAN_UPGRADE_PATH,
  getPlanLimit,
  getNextPlan,
  isAtSoftWarning,
  isAtHardLimit,
  getUsagePct,
} from '@/config/planLimits'

describe('PLAN_BRANCH_LIMITS', () => {
  it('returns correct limits for each plan', () => {
    expect(PLAN_BRANCH_LIMITS.basic).toBe(5)
    expect(PLAN_BRANCH_LIMITS.plus).toBe(10)
    expect(PLAN_BRANCH_LIMITS.pro).toBe(20)
    expect(PLAN_BRANCH_LIMITS.special).toBeNull()
  })
})

describe('PLAN_UPGRADE_PATH', () => {
  it('maps each plan to the next tier', () => {
    expect(PLAN_UPGRADE_PATH.basic).toBe('plus')
    expect(PLAN_UPGRADE_PATH.plus).toBe('pro')
    expect(PLAN_UPGRADE_PATH.pro).toBe('special')
    expect(PLAN_UPGRADE_PATH.special).toBe('special')
  })
})

describe('getPlanLimit', () => {
  it('returns null for special', () => {
    expect(getPlanLimit('special')).toBeNull()
  })
  it('returns numeric limits', () => {
    expect(getPlanLimit('basic')).toBe(5)
    expect(getPlanLimit('plus')).toBe(10)
    expect(getPlanLimit('pro')).toBe(20)
  })
})

describe('getNextPlan', () => {
  it('returns correct upgrade target', () => {
    expect(getNextPlan('basic')).toBe('plus')
    expect(getNextPlan('plus')).toBe('pro')
    expect(getNextPlan('pro')).toBe('special')
    expect(getNextPlan('special')).toBe('special')
  })
})

describe('isAtSoftWarning', () => {
  it('returns true at exactly 80% threshold', () => {
    expect(isAtSoftWarning('basic', 4)).toBe(true)   // 4/5 = 80%
    expect(isAtSoftWarning('plus', 8)).toBe(true)    // 8/10 = 80%
    expect(isAtSoftWarning('pro', 16)).toBe(true)    // 16/20 = 80%
  })

  it('returns false below 80% threshold', () => {
    expect(isAtSoftWarning('basic', 3)).toBe(false)  // 3/5 = 60%
    expect(isAtSoftWarning('plus', 7)).toBe(false)   // 7/10 = 70%
    expect(isAtSoftWarning('pro', 15)).toBe(false)   // 15/20 = 75%
  })

  it('returns false at hard limit (100%)', () => {
    expect(isAtSoftWarning('basic', 5)).toBe(false)
    expect(isAtSoftWarning('plus', 10)).toBe(false)
    expect(isAtSoftWarning('pro', 20)).toBe(false)
  })

  it('always returns false for special plan', () => {
    expect(isAtSoftWarning('special', 999)).toBe(false)
  })
})

describe('isAtHardLimit', () => {
  it('returns true when at or above limit', () => {
    expect(isAtHardLimit('basic', 5)).toBe(true)
    expect(isAtHardLimit('plus', 10)).toBe(true)
    expect(isAtHardLimit('pro', 20)).toBe(true)
    // Over limit (shouldn't happen but must not crash)
    expect(isAtHardLimit('basic', 6)).toBe(true)
  })

  it('returns false below limit', () => {
    expect(isAtHardLimit('basic', 4)).toBe(false)
    expect(isAtHardLimit('plus', 9)).toBe(false)
    expect(isAtHardLimit('pro', 19)).toBe(false)
  })

  it('always returns false for special plan', () => {
    expect(isAtHardLimit('special', 999)).toBe(false)
  })
})

describe('getUsagePct', () => {
  it('returns correct ratio', () => {
    expect(getUsagePct('basic', 4)).toBeCloseTo(0.8)
    expect(getUsagePct('plus', 5)).toBeCloseTo(0.5)
    expect(getUsagePct('pro', 20)).toBeCloseTo(1.0)
  })

  it('returns 0 for special plan', () => {
    expect(getUsagePct('special', 999)).toBe(0)
  })
})
