/**
 * Plan Guard Helper - Kiểm tra gói subscription của Contractor
 */
import { prisma } from '@/lib/prisma'

export type SubscriptionPlan = 'FREE' | 'PRO'

const PLAN_LIMITS = {
  FREE: {
    monthlyQuotes: 5,           // Số báo giá tối đa/tháng
    canBidOnProjects: false,    // Không được đấu thầu
    canUnlockContact: false,    // Không unlock SĐT chủ nhà
    canUse3DViewer: false,      // Không dùng 3D Viewer
    canExportPDF: true,         // Xuất PDF cơ bản
    canUseAI: false,            // Không dùng AI không giới hạn
  },
  PRO: {
    monthlyQuotes: Infinity,    // Không giới hạn
    canBidOnProjects: true,
    canUnlockContact: true,
    canUse3DViewer: true,
    canExportPDF: true,
    canUseAI: true,
  },
}

export interface PlanCheckResult {
  allowed: boolean
  plan: SubscriptionPlan
  reason?: string
  upgradeUrl?: string
}

export async function checkContractorPlan(
  contractorProfileId: string,
  feature: keyof typeof PLAN_LIMITS.FREE
): Promise<PlanCheckResult> {
  const profile = await prisma.contractorProfile.findUnique({
    where: { id: contractorProfileId },
    select: {
      subscriptionPlan: true,
      subscriptionExpiresAt: true,
      monthlyQuoteCount: true,
      monthlyQuoteResetAt: true,
    },
  })

  if (!profile) {
    return { allowed: false, plan: 'FREE', reason: 'Không tìm thấy hồ sơ nhà thầu.' }
  }

  // Kiểm tra plan còn hiệu lực
  const plan = (
    profile.subscriptionPlan === 'PRO' &&
    profile.subscriptionExpiresAt &&
    profile.subscriptionExpiresAt > new Date()
      ? 'PRO'
      : 'FREE'
  ) as SubscriptionPlan

  const limits = PLAN_LIMITS[plan]

  // Kiểm tra feature cụ thể
  if (feature === 'monthlyQuotes') {
    // Reset counter nếu đã qua tháng mới
    const now = new Date()
    const resetAt = profile.monthlyQuoteResetAt
    const needReset = !resetAt || resetAt.getMonth() !== now.getMonth()

    if (needReset) {
      await prisma.contractorProfile.update({
        where: { id: contractorProfileId },
        data: { monthlyQuoteCount: 0, monthlyQuoteResetAt: now },
      })
      return { allowed: true, plan }
    }

    const limit = limits.monthlyQuotes
    if (profile.monthlyQuoteCount >= limit) {
      return {
        allowed: false,
        plan,
        reason: `Bạn đã đạt giới hạn ${limit} báo giá/tháng của gói FREE.`,
        upgradeUrl: '/pricing',
      }
    }
    return { allowed: true, plan }
  }

  const allowed = Boolean(limits[feature])
  return {
    allowed,
    plan,
    reason: allowed
      ? undefined
      : `Tính năng này chỉ dành cho gói PRO.`,
    upgradeUrl: allowed ? undefined : '/pricing',
  }
}

export function getPlanLimits(plan: SubscriptionPlan) {
  return PLAN_LIMITS[plan]
}
