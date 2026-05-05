/**
 * Solution 5 — Post-Dismissal Re-engagement Nudge
 *
 * API client for the three nudge endpoints:
 *   POST /api/nudges/branch-limit/dismiss
 *   POST /api/nudges/branch-limit/cancel
 *   GET  /api/nudges/branch-limit/status
 */

export type DismissedFrom = 'banner' | 'modal'
export type ReengagementChannel = 'email' | 'whatsapp' | 'inapp' | 'banner'

export interface NudgeStatusResponse {
  dismissed_at: string | null
  reengagement_sent: Array<{ channel: ReengagementChannel; sent_at: string }>
  upgraded: boolean
}

export async function dismissNudge(merchantId: string, dismissedFrom: DismissedFrom): Promise<void> {
  await fetch('/api/nudges/branch-limit/dismiss', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchant_id: merchantId,
      dismissed_from: dismissedFrom,
      timestamp: new Date().toISOString(),
    }),
  })
}

export async function cancelNudge(merchantId: string): Promise<void> {
  await fetch('/api/nudges/branch-limit/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant_id: merchantId }),
  })
}

export async function getNudgeStatus(merchantId: string): Promise<NudgeStatusResponse> {
  const res = await fetch(`/api/nudges/branch-limit/status?merchant_id=${encodeURIComponent(merchantId)}`)
  if (!res.ok) throw new Error('Failed to fetch nudge status')
  return res.json() as Promise<NudgeStatusResponse>
}
