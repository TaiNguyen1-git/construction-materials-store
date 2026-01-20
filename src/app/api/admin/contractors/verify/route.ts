/**
 * API: Verify Contractor Profile
 * POST /api/admin/contractors/verify
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { profileId, status } = body // VERIFIED or REJECTED

        if (!profileId || !status) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 })
        }

        const updatedProfile = await (prisma as any).contractorProfile.update({
            where: { id: profileId },
            data: {
                onboardingStatus: status,
                isVerified: status === 'VERIFIED',
                trustScore: status === 'VERIFIED' ? 90 : 80 // Base score for newly verified
            },
            include: {
                customer: {
                    include: {
                        user: true
                    }
                }
            }
        })

        // Notify user
        await prisma.notification.create({
            data: {
                userId: (updatedProfile as any).customer.userId,
                title: status === 'VERIFIED' ? '✅ Hồ sơ đã được duyệt!' : '❌ Hồ sơ bị từ chối',
                message: status === 'VERIFIED'
                    ? 'Chúc mừng! Hồ sơ của bạn đã được xác thực mã định danh đối tác. Bạn đã có thể bắt đầu nhận dự án.'
                    : 'Tiếc quá! Hồ sơ của bạn chưa đạt yêu cầu xác thực. Vui lòng cập nhật lại thông tin và các chứng chỉ liên quan.',
                type: 'INFO',
                priority: status === 'VERIFIED' ? 'HIGH' : 'MEDIUM'
            }
        })

        return NextResponse.json({
            success: true,
            data: updatedProfile
        })

    } catch (error) {
        console.error('Error verifying contractor:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi xử lý xác thực' } },
            { status: 500 }
        )
    }
}
