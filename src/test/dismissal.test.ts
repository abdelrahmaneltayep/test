import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  setBannerDismissed, isBannerDismissalActive, clearBannerDismissal,
  getBannerDismissedAt, hasAtLimitToastBeenShown, markAtLimitToastShown,
} from '@/utils/dismissal'

beforeEach(() => { localStorage.clear(); sessionStorage.clear() })

describe('setBannerDismissed / isBannerDismissalActive', () => {
  it('marks dismissal and considers it active immediately', () => {
    setBannerDismissed()
    expect(isBannerDismissalActive()).toBe(true)
  })
  it('considers dismissal expired after 7 days', () => {
    setBannerDismissed()
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 7 * 24 * 60 * 60 * 1000 + 1)
    expect(isBannerDismissalActive()).toBe(false)
    vi.restoreAllMocks()
  })
  it('still active just before 7 days', () => {
    const base = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(base)
    setBannerDismissed()
    vi.spyOn(Date, 'now').mockReturnValue(base + 7 * 24 * 60 * 60 * 1000 - 1)
    expect(isBannerDismissalActive()).toBe(true)
    vi.restoreAllMocks()
  })
})

describe('clearBannerDismissal', () => {
  it('removes dismissal state', () => {
    setBannerDismissed()
    clearBannerDismissal()
    expect(isBannerDismissalActive()).toBe(false)
    expect(getBannerDismissedAt()).toBeNull()
  })
})

describe('getBannerDismissedAt', () => {
  it('returns null when not set', () => { expect(getBannerDismissedAt()).toBeNull() })
  it('returns a timestamp after setting', () => {
    const before = Date.now()
    setBannerDismissed()
    const after = Date.now()
    const at = getBannerDismissedAt()
    expect(at).not.toBeNull()
    expect(at!).toBeGreaterThanOrEqual(before)
    expect(at!).toBeLessThanOrEqual(after)
  })
})

describe('at-limit toast (sessionStorage)', () => {
  it('returns false before toast is shown', () => { expect(hasAtLimitToastBeenShown()).toBe(false) })
  it('returns true after marking shown', () => {
    markAtLimitToastShown()
    expect(hasAtLimitToastBeenShown()).toBe(true)
  })
})
