import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// POST /api/payments/upgrade - Fake Upgrade for Demo (Using VietQR)
export async function POST(req: NextRequest) {
  try {
    const user = await verifyTokenFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, amount, orderId } = await req.json()

    if (!plan || !amount) {
      return NextResponse.json({ error: 'Missing plan or amount' }, { status: 400 })
    }

    // Get ContractorProfile from User
    const foundUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { customer: { include: { contractorProfile: true } } }
    })

    const contractorProfile = foundUser?.customer?.contractorProfile

    if (!contractorProfile) {
       return NextResponse.json({ error: 'Không tìm thấy hồ sơ nhà thầu' }, { status: 404 })
    }

    // Xác định thời hạn gói dựa trên plan name
    const durationMonths = plan === 'PRO_YEARLY' ? 12 : 1
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths)

    const updateData: Prisma.ContractorProfileUpdateInput = {
      subscriptionPlan: 'PRO',
      subscriptionExpiresAt: expiresAt,
      monthlyQuoteCount: 0,
      monthlyQuoteResetAt: new Date(),
    }

    // Cập nhật lên gói PRO
    await prisma.contractorProfile.update({
      where: { id: contractorProfile.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Đã nâng cấp gói PRO thành công',
      expiresAt,
    })
  } catch (error) {
    console.error('[Pricing Upgrade]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
