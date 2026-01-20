/**
 * API: List Public Verified Contractors
 * GET /api/contractors/public?city=...&skill=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')
        const skill = searchParams.get('skill')
        const limit = parseInt(searchParams.get('limit') || '12')

        const contractors = await prisma.contractorProfile.findMany({
            where: {
                isVerified: true,
                ...(city && { city }),
                ...(skill && { skills: { has: skill } })
            },
            take: limit,
            orderBy: {
                avgRating: 'desc'
            },
            include: {
                customer: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: contractors
        })

    } catch (error) {
        console.error('Error fetching public contractors:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi tải danh sách đối tác' } },
            { status: 500 }
        )
    }
}
