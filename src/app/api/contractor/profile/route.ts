/**
 * API: Get Contractor Profile
 * GET /api/contractor/profile?userId=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        const customer = await (prisma as any).customer.findFirst({
            where: { userId },
            include: {
                contractorProfile: true
            }
        })

        if (!customer) {
            return NextResponse.json({
                success: true,
                data: { onboardingStatus: 'INCOMPLETE' }
            })
        }

        const profile = customer.contractorProfile

        return NextResponse.json({
            success: true,
            data: profile || { onboardingStatus: 'INCOMPLETE' }
        })

    } catch (error) {
        console.error('Error fetching contractor profile:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi tải profile' } },
            { status: 500 }
        )
    }
}
