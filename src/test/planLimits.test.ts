import { describe, it, expect } from 'vitest'
import {
  PLAN_BRANCH_LIMITS, PLAN_UPGRADE_PATH,
  getPlanLimit, getNextPlan, isAtSoftWarning, isAtHardLimit, getUsagePct,
} from '@/config/planLimits'

describe('PLAN_BRANCH_LIMITS', () => {
  it('returns correct limits', () => {
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

describe('isAtSoftWarning', () => {
  it('true at exactly 80%', () => {
    expect(isAtSoftWarning('basic', 4)).toBe(true)   // 4/5
    expect(isAtSoftWarning('plus',  8)).toBe(true)   // 8/10
    expect(isAtSoftWarning('pro',  16)).toBe(true)   // 16/20
  })
  it('false below 80%', () => {
    expect(isAtSoftWarning('basic', 3)).toBe(false)
    expect(isAtSoftWarning('plus',  7)).toBe(false)
  })
  it('false at hard limit', () => {
    expect(isAtSoftWarning('basic', 5)).toBe(false)
    expect(isAtSoftWarning('plus', 10)).toBe(false)
  })
  it('always false for special', () => {
    expect(isAtSoftWarning('special', 999)).toBe(false)
  })
})

describe('isAtHardLimit', () => {
  it('true at limit', () => {
    expect(isAtHardLimit('basic', 5)).toBe(true)
    expect(isAtHardLimit('plus', 10)).toBe(true)
    expect(isAtHardLimit('pro', 20)).toBe(true)
  })
  it('false below limit', () => {
    expect(isAtHardLimit('basic', 4)).toBe(false)
    expect(isAtHardLimit('plus',  9)).toBe(false)
  })
  it('always false for special', () => {
    expect(isAtHardLimit('special', 999)).toBe(false)
  })
})

describe('getUsagePct', () => {
  it('returns correct ratio', () => {
    expect(getUsagePct('basic', 4)).toBeCloseTo(0.8)
    expect(getUsagePct('pro',  20)).toBeCloseTo(1.0)
  })
  it('returns 0 for special', () => {
    expect(getUsagePct('special', 999)).toBe(0)
  })
})

describe('getPlanLimit / getNextPlan', () => {
  it('returns null for special', () => { expect(getPlanLimit('special')).toBeNull() })
  it('getNextPlan basic→plus', () => { expect(getNextPlan('basic')).toBe('plus') })
})
