/**
 * Backend — Server-Side Branch Limit Enforcement
 *
 * Middleware for POST /api/branches.
 * Returns 402 with BRANCH_LIMIT_REACHED if the merchant is at their limit.
 */

import { PLAN_BRANCH_LIMITS, PLAN_UPGRADE_PATH, type PlanTier } from '@/config/planLimits'

export interface BranchLimitError {
  error: 'BRANCH_LIMIT_REACHED'
  current: number
  limit: number
  upgrade_to: PlanTier
}

export interface MerchantRepository {
  getPlan(merchantId: string): Promise<PlanTier>
}

export interface BranchRepository {
  /** Returns count of non-deleted branches (active + inactive) for the merchant */
  countByMerchant(merchantId: string): Promise<number>
}

export async function checkBranchLimit(
  merchantId: string,
  merchantRepo: MerchantRepository,
  branchRepo: BranchRepository,
): Promise<BranchLimitError | null> {
  const plan = await merchantRepo.getPlan(merchantId)
  const limit = PLAN_BRANCH_LIMITS[plan]

  // null = unlimited (Special plan) — never block
  if (limit === null) return null

  // Always fetch live count — do NOT rely on cached counter
  const count = await branchRepo.countByMerchant(merchantId)

  if (count >= limit) {
    return {
      error: 'BRANCH_LIMIT_REACHED',
      current: count,
      limit,
      upgrade_to: PLAN_UPGRADE_PATH[plan],
    }
  }

  return null
}

/**
 * Express-style middleware factory (attach to POST /api/branches).
 *
 * Usage:
 *   app.post('/api/branches', branchLimitGuard(merchantRepo, branchRepo), createBranchHandler)
 */
export function branchLimitGuard(merchantRepo: MerchantRepository, branchRepo: BranchRepository) {
  return async function middleware(
    req: { body: { merchant_id?: string } },
    res: { status: (n: number) => { json: (body: unknown) => void } },
    next: () => void,
  ) {
    const merchantId = req.body.merchant_id
    if (!merchantId) {
      res.status(400).json({ error: 'merchant_id is required' })
      return
    }

    const limitError = await checkBranchLimit(merchantId, merchantRepo, branchRepo)
    if (limitError) {
      res.status(402).json(limitError)
      return
    }

    next()
  }
}
