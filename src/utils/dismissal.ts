const BANNER_DISMISSAL_KEY = 'branch_limit_banner_dismissed_at'
const DISMISSAL_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function getBannerDismissedAt(): number | null {
  try {
    const raw = localStorage.getItem(BANNER_DISMISSAL_KEY)
    return raw ? parseInt(raw, 10) : null
  } catch {
    return null
  }
}

export function setBannerDismissed() {
  try {
    localStorage.setItem(BANNER_DISMISSAL_KEY, Date.now().toString())
  } catch {
    // storage unavailable
  }
}

export function isBannerDismissalActive(): boolean {
  const at = getBannerDismissedAt()
  if (at === null) return false
  return Date.now() - at < DISMISSAL_TTL_MS
}

export function clearBannerDismissal() {
  try {
    localStorage.removeItem(BANNER_DISMISSAL_KEY)
  } catch {
    // storage unavailable
  }
}

const TOAST_SHOWN_KEY = 'branch_limit_100pct_toast_shown'

export function hasAtLimitToastBeenShown(): boolean {
  try {
    return sessionStorage.getItem(TOAST_SHOWN_KEY) === '1'
  } catch {
    return false
  }
}

export function markAtLimitToastShown() {
  try {
    sessionStorage.setItem(TOAST_SHOWN_KEY, '1')
  } catch {
    // storage unavailable
  }
}
