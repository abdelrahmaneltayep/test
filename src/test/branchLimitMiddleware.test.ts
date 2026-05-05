import { describe, it, expect, vi } from 'vitest'
import { checkBranchLimit } from '@/server/branchLimitMiddleware'
import type { MerchantRepository, BranchRepository } from '@/server/branchLimitMiddleware'
import type { PlanTier } from '@/config/planLimits'

function makeRepos(plan: PlanTier, count: number): [MerchantRepository, BranchRepository] {
  const merchantRepo: MerchantRepository = {
    getPlan: vi.fn().mockResolvedValue(plan),
  }
  const branchRepo: BranchRepository = {
    countByMerchant: vi.fn().mockResolvedValue(count),
  }
  return [merchantRepo, branchRepo]
}

describe('checkBranchLimit', () => {
  it('returns null when under limit', async () => {
    const [m, b] = makeRepos('basic', 4)
    const result = await checkBranchLimit('merchant-1', m, b)
    expect(result).toBeNull()
  })

  it('returns error when at limit (basic, 5/5)', async () => {
    const [m, b] = makeRepos('basic', 5)
    const result = await checkBranchLimit('merchant-1', m, b)
    expect(result).toMatchObject({
      error: 'BRANCH_LIMIT_REACHED',
      current: 5,
      limit: 5,
      upgrade_to: 'plus',
    })
  })

  it('returns error when at limit (plus, 10/10)', async () => {
    const [m, b] = makeRepos('plus', 10)
    const result = await checkBranchLimit('merchant-1', m, b)
    expect(result).toMatchObject({
      error: 'BRANCH_LIMIT_REACHED',
      current: 10,
      limit: 10,
      upgrade_to: 'pro',
    })
  })

  it('returns error when at limit (pro, 20/20)', async () => {
    const [m, b] = makeRepos('pro', 20)
    const result = await checkBranchLimit('merchant-1', m, b)
    expect(result).toMatchObject({
      error: 'BRANCH_LIMIT_REACHED',
      current: 20,
      limit: 20,
      upgrade_to: 'special',
    })
  })

  it('returns null for special plan regardless of count', async () => {
    const [m, b] = makeRepos('special', 9999)
    const result = await checkBranchLimit('merchant-1', m, b)
    expect(result).toBeNull()
  })

  it('fetches live count — never relies on stale data (calls branchRepo each time)', async () => {
    const merchantRepo: MerchantRepository = { getPlan: vi.fn().mockResolvedValue('basic' as PlanTier) }
    const branchRepo: BranchRepository = { countByMerchant: vi.fn().mockResolvedValue(3) }
    await checkBranchLimit('merchant-1', merchantRepo, branchRepo)
    await checkBranchLimit('merchant-1', merchantRepo, branchRepo)
    expect(branchRepo.countByMerchant).toHaveBeenCalledTimes(2)
  })
})
