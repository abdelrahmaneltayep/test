import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  scheduleBranchLimitReengagement,
  cancelBranchLimitReengagement,
  type Merchant,
  type JobScheduler,
  type ScheduledJob,
} from '@/server/nudgeScheduler'

function makeMerchant(overrides: Partial<Merchant> = {}): Merchant {
  return {
    id: 'test-merchant',
    plan: 'basic',
    marketing_emails_enabled: true,
    whatsapp_connected: true,
    ...overrides,
  }
}

function makeScheduler(): JobScheduler & { jobs: ScheduledJob[] } {
  const jobs: ScheduledJob[] = []
  return {
    jobs,
    schedule: vi.fn((job: ScheduledJob) => {
      jobs.push(job)
      return `job-${jobs.length}`
    }),
    cancel: vi.fn(),
    cancelAll: vi.fn(),
  }
}

function makeNotifier() {
  return {
    sendInApp: vi.fn().mockResolvedValue(undefined),
    sendEmail: vi.fn().mockResolvedValue(undefined),
    sendWhatsApp: vi.fn().mockResolvedValue(undefined),
  }
}

describe('scheduleBranchLimitReengagement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('schedules 4 jobs when merchant has email opt-in and WA connected', async () => {
    const scheduler = makeScheduler()
    const notifier = makeNotifier()
    const merchant = makeMerchant()
    await scheduleBranchLimitReengagement(merchant, 'banner', new Date(), scheduler, notifier)
    expect(scheduler.schedule).toHaveBeenCalledTimes(4)
  })

  it('schedules 3 jobs when merchant has no WhatsApp', async () => {
    const scheduler = makeScheduler()
    const notifier = makeNotifier()
    const merchant = makeMerchant({ whatsapp_connected: false })
    await scheduleBranchLimitReengagement(merchant, 'banner', new Date(), scheduler, notifier)
    expect(scheduler.schedule).toHaveBeenCalledTimes(3)
  })

  it('schedules 3 jobs when email opt-out (no WA)', async () => {
    const scheduler = makeScheduler()
    const notifier = makeNotifier()
    const merchant = makeMerchant({ marketing_emails_enabled: false, whatsapp_connected: false })
    await scheduleBranchLimitReengagement(merchant, 'modal', new Date(), scheduler, notifier)
    // in-app (48h) + persistent banner (7d) = 2 jobs; no email, no WA
    expect(scheduler.schedule).toHaveBeenCalledTimes(2)
  })

  it('uses correct delays: 48h, 48h, 72h, 7d', async () => {
    const scheduler = makeScheduler()
    const notifier = makeNotifier()
    const merchant = makeMerchant()
    await scheduleBranchLimitReengagement(merchant, 'banner', new Date(), scheduler, notifier)
    const delays = scheduler.jobs.map((j) => j.delayMs)
    expect(delays).toContain(48 * 60 * 60 * 1000) // in-app
    expect(delays).toContain(48 * 60 * 60 * 1000) // email
    expect(delays).toContain(72 * 60 * 60 * 1000) // whatsapp
    expect(delays).toContain(7 * 24 * 60 * 60 * 1000) // persistent banner
  })

  it('all jobs share the same merchant-scoped tag', async () => {
    const scheduler = makeScheduler()
    const notifier = makeNotifier()
    const merchant = makeMerchant({ id: 'abc-123' })
    await scheduleBranchLimitReengagement(merchant, 'banner', new Date(), scheduler, notifier)
    const tags = new Set(scheduler.jobs.map((j) => j.tag))
    expect(tags.size).toBe(1)
    expect([...tags][0]).toContain('abc-123')
  })
})

describe('cancelBranchLimitReengagement', () => {
  it('calls cancelAll with the merchant-scoped tag', () => {
    const scheduler = makeScheduler()
    cancelBranchLimitReengagement('merchant-xyz', scheduler)
    expect(scheduler.cancelAll).toHaveBeenCalledTimes(1)
    const calledWith = (scheduler.cancelAll as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledWith).toContain('merchant-xyz')
  })
})
