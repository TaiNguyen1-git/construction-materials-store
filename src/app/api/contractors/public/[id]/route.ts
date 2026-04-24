/**
 * API: Get Public Contractor Detail
 * GET /api/contractors/public/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decodeId } from '@/lib/id-utils'
import jwt from 'jsonwebtoken'

const getUserRole = (request: NextRequest): string | null => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.cookies.get('access_token')?.value
    if (!token) return null
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        return decoded?.role || null
    } catch {
        return null
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authRole = getUserRole(request)
        const canViewContactInfo = !!authRole

        const { id: shortId } = await params
        const id = decodeId(shortId)

        if (!id) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
        }

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

        // Hide sensitive PII fields if user is not logged in
        if (!canViewContactInfo) {
            (contractor as any).phone = null;
            (contractor as any).email = null;
            (contractor as any).address = null;
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
