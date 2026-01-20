/**
 * API: Get Public Contractor Detail
 * GET /api/contractors/public/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const contractor = await prisma.contractorProfile.findUnique({
            where: { id },
            include: {
                reviews: {
                    where: { isApproved: true },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                customer: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        },
                        receivedQuotes: {
                            where: { status: 'ACCEPTED' },
                            take: 5,
                            orderBy: { createdAt: 'desc' },
                            select: {
                                id: true,
                                createdAt: true
                            }
                        }
                    }
                }
            }
        })

        if (!contractor || !contractor.isVerified) {
            return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: contractor
        })

    } catch (error) {
        console.error('Error fetching public contractor detail:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi tải thông tin đối tác' } },
            { status: 500 }
        )
    }
}
