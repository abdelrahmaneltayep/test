export type AnalyticsEvent = {
  event: string
  properties: Record<string, string | number | boolean>
  merchant_id: string
  timestamp: string
}

declare global {
  interface Window {
    sallaAnalytics?: {
      track: (event: AnalyticsEvent) => void
    }
  }
}

let _merchantId = 'unknown'

export function initAnalytics(merchantId: string) {
  _merchantId = merchantId
}

export function track(event: string, properties: Record<string, string | number | boolean> = {}) {
  const payload: AnalyticsEvent = {
    event,
    properties,
    merchant_id: _merchantId,
    timestamp: new Date().toISOString(),
  }
  if (typeof window !== 'undefined' && window.sallaAnalytics?.track) {
    window.sallaAnalytics.track(payload)
  } else {
    // eslint-disable-next-line no-console
    console.debug('[Analytics]', payload)
  }
}
