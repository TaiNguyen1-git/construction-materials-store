/**
 * API: Contractor Onboarding Profile Update
 * POST /api/contractor/profile/onboarding
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const user = await getUser()
        if (!user || user.role !== 'CONTRACTOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            displayName, bio, experienceYears, skills,
            companyName, city, district, address
        } = body

        // Find contractor profile
        const existingProfile = await prisma.contractorProfile.findFirst({
            where: { customer: { userId: user.userId } }
        })

        if (!existingProfile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        // Update profile
        const updatedProfile = await prisma.contractorProfile.update({
            where: { id: existingProfile.id },
            data: {
                displayName: displayName || user.email || '',
                bio,
                experienceYears: parseInt(experienceYears) || 0,
                skills,
                companyName,
                city,
                district,
                address,
                onboardingStatus: 'PENDING_REVIEW' // Mark for admin verification
            }
        })

        // Create notification for admin
        await prisma.notification.create({
            data: {
                title: '📑 Hồ sơ thầu mới chờ duyệt',
                message: `Nhà thầu ${displayName} đã hoàn tất onboarding và chờ xác thực.`,
                type: 'INFO',
                priority: 'MEDIUM',
                referenceId: updatedProfile.id,
                referenceType: 'CONTRACTOR'
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Hồ sơ đã được lưu và đang chờ xác duyệt',
            data: updatedProfile
        })

    } catch (error) {
        console.error('Error in contractor onboarding API:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi cập nhật hồ sơ onboarding' } },
            { status: 500 }
        )
    }
}
