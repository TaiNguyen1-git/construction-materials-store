/**
 * API: List Contractor Profiles for Admin
 * GET /api/admin/contractors/profiles?status=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'PENDING_REVIEW'

        const profiles = await (prisma as any).contractorProfile.findMany({
            where: {
                onboardingStatus: status
            },
            orderBy: {
                updatedAt: 'desc'
            },
            include: {
                customer: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                phone: true
                            }
                        }
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: profiles
        })

    } catch (error) {
        console.error('Error listing contractor profiles:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi tải danh sách hồ sơ' } },
            { status: 500 }
        )
    }
}
