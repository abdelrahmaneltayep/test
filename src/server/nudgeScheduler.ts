/**
 * Solution 5 — Server-side Re-engagement Job Scheduler
 *
 * Runs in a Node.js backend (Express / Next.js API routes / etc.).
 * Schedules multi-channel re-engagement messages after a merchant
 * dismisses the banner or modal without upgrading.
 */

import { track } from '@/utils/analytics'
import type { DismissedFrom, ReengagementChannel } from '@/api/nudges'

export interface Merchant {
  id: string
  plan: string
  marketing_emails_enabled: boolean
  whatsapp_connected: boolean
}

export interface JobScheduler {
  schedule: (job: ScheduledJob) => string
  cancel: (jobId: string) => void
  cancelAll: (tag: string) => void
}

export interface ScheduledJob {
  delayMs: number
  tag: string
  handler: () => Promise<void>
}

interface NotificationService {
  sendInApp: (merchantId: string, message: string) => Promise<void>
  sendEmail: (merchantId: string, subject: string, body: string) => Promise<void>
  sendWhatsApp: (merchantId: string, message: string) => Promise<void>
}

const NUDGE_TAG_PREFIX = 'branch_limit_reengagement'

function nudgeTag(merchantId: string) {
  return `${NUDGE_TAG_PREFIX}:${merchantId}`
}

export async function scheduleBranchLimitReengagement(
  merchant: Merchant,
  dismissedFrom: DismissedFrom,
  dismissedAt: Date,
  scheduler: JobScheduler,
  notifier: NotificationService,
): Promise<void> {
  const tag = nudgeTag(merchant.id)

  const MS_48H = 48 * 60 * 60 * 1000
  const MS_72H = 72 * 60 * 60 * 1000
  const MS_7D = 7 * 24 * 60 * 60 * 1000

  // Step 1 — In-App Bell (48h)
  scheduler.schedule({
    delayMs: MS_48H,
    tag,
    handler: async () => {
      await notifier.sendInApp(
        merchant.id,
        'هل أنت مستعد للتوسع؟ ترقيتك جاهزة — فروع إضافية بنقرة واحدة.',
      )
      fireReengagementEvent(merchant.id, 'inapp', 48)
    },
  })

  // Step 2 — Email (48h, conditional on opt-in)
  if (merchant.marketing_emails_enabled) {
    scheduler.schedule({
      delayMs: MS_48H,
      tag,
      handler: async () => {
        await notifier.sendEmail(
          merchant.id,
          `تجار مثلك وسّعوا نشاطهم بـ ${merchant.plan}`,
          buildEmailBody(merchant.plan),
        )
        fireReengagementEvent(merchant.id, 'email', 48)
      },
    })
  }

  // Step 3 — WhatsApp (72h, conditional on WA connection)
  if (merchant.whatsapp_connected) {
    scheduler.schedule({
      delayMs: MS_72H,
      tag,
      handler: async () => {
        await notifier.sendWhatsApp(
          merchant.id,
          'لاحظنا إنك وصلت لحد الفروع. نقدر نساعدك تترقّى.',
        )
        fireReengagementEvent(merchant.id, 'whatsapp', 72)
      },
    })
  }

  // Step 4 — Persistent non-dismissible banner (7 days)
  scheduler.schedule({
    delayMs: MS_7D,
    tag,
    handler: async () => {
      // Signal the frontend to show the persistent banner via an in-app notification payload
      await notifier.sendInApp(
        merchant.id,
        JSON.stringify({ type: 'PERSISTENT_BRANCH_LIMIT_BANNER', urgency: 'عرض محدود' }),
      )
      fireReengagementEvent(merchant.id, 'banner', 7 * 24)
    },
  })

  void dismissedFrom // logged via analytics event on the client
  void dismissedAt
}

export function cancelBranchLimitReengagement(merchantId: string, scheduler: JobScheduler) {
  scheduler.cancelAll(nudgeTag(merchantId))
}

function fireReengagementEvent(merchantId: string, channel: ReengagementChannel, hoursSinceDismiss: number) {
  track('branch_limit_reengagement_sent', {
    channel,
    hours_since_dismiss: hoursSinceDismiss,
  })
  void merchantId
}

function buildEmailBody(currentPlan: string): string {
  return `
مرحبًا،

لاحظنا أنك وصلت إلى الحد الأقصى من الفروع في باقة ${currentPlan}.

تجار مثلك وسّعوا نشاطهم وزادوا مبيعاتهم بعد ترقية باقتهم.

→ ترقّى الآن: https://s.salla.sa/upgrade?source=branch_limit_reengagement_email

فريق سلة
`.trim()
}
