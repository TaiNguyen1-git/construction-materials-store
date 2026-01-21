/**
 * API: Get detailed contractor stats and history for Admin
 * GET /api/admin/contractors/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const profile = await prisma.contractorProfile.findUnique({
            where: { id },
            include: {
                customer: {
                    include: {
                        user: true,
                        receivedQuotes: {
                            orderBy: { createdAt: 'desc' },
                            include: {
                                milestones: true
                            }
                        }
                    }
                }
            }
        })

        if (!profile) {
            return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
        }

        // Aggregate monthly earnings for charts
        // Let's simplify and just send the quotes list, frontend can group them
        const projectHistory = profile.customer.receivedQuotes.map((q: any) => ({
            id: q.id,
            title: q.projectName || 'Dự án không tên',
            status: q.status,
            totalAmount: q.amount || q.totalAmount || 0,
            releasedAmount: (q.milestones || [])
                .filter((m: any) => m.status === 'RELEASED')
                .reduce((sum: number, m: any) => sum + m.amount, 0),
            escrowAmount: (q.milestones || [])
                .filter((m: any) => m.status === 'ESCROW_PAID')
                .reduce((sum: number, m: any) => sum + m.amount, 0),
            createdAt: q.createdAt
        }))

        return NextResponse.json({
            success: true,
            data: {
                profile: {
                    ...profile,
                    user: profile.customer.user
                },
                projectHistory,
                summary: {
                    totalProjects: projectHistory.length,
                    activeProjects: projectHistory.filter((p: any) => p.status === 'ACCEPTED').length,
                    completedProjects: projectHistory.filter((p: any) => ['ACCEPTED', 'REPLIED'].includes(p.status)).length,
                    totalEarnings: projectHistory.reduce((sum: number, p: any) => sum + p.releasedAmount, 0),
                    pendingEscrow: projectHistory.reduce((sum: number, p: any) => sum + p.escrowAmount, 0)
                }
            }
        })

    } catch (error) {
        console.error('Error fetching contractor details:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi tải thông tin chi tiết nhà thầu' } },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { creditLimit } = body

        if (creditLimit === undefined) {
            return NextResponse.json({ error: 'Thiếu thông tin hạn mức' }, { status: 400 })
        }

        const profile = await prisma.contractorProfile.findUnique({
            where: { id },
            select: { customerId: true }
        })

        if (!profile) {
            return NextResponse.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 })
        }

        const updatedCustomer = await prisma.customer.update({
            where: { id: profile.customerId },
            data: {
                creditLimit: parseFloat(creditLimit)
            }
        })

        return NextResponse.json({
            success: true,
            data: updatedCustomer
        })

    } catch (error) {
        console.error('Error updating credit limit:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi cập nhật hạn mức nợ' } },
            { status: 500 }
        )
    }
}
