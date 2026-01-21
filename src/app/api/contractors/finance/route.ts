/**
 * Contractor Finance API
 * Aggregates income from milestones and expenses from material orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function GET(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })

        const customer = await prisma.customer.findFirst({ where: { userId: payload.userId } })
        if (!customer) return NextResponse.json(createErrorResponse('Not found', 'NOT_FOUND'), { status: 404 })

        const contractorId = customer.id

        // 1. Get Income from Milestones
        const quotes = await prisma.quoteRequest.findMany({
            where: { contractorId },
            include: {
                milestones: true,
                project: { select: { id: true, name: true } }
            }
        })

        let totalIncoming = 0
        let totalReleased = 0
        let totalPending = 0
        const projectIncome: any[] = []

        quotes.forEach((q: any) => {
            let qTotal = 0
            if (q.milestones) {
                q.milestones.forEach((m: any) => {
                    if (m.status === 'RELEASED') totalReleased += m.amount
                    else if (m.status === 'ESCROW_PAID' || m.status === 'COMPLETED') totalIncoming += m.amount
                    else totalPending += m.amount
                    qTotal += m.amount
                })
            }
            projectIncome.push({
                id: q.id,
                projectId: q.projectId,
                title: q.project?.name || (q.metadata as any)?.projectName || 'Dự án không tên',
                totalAmount: qTotal,
                released: q.milestones ? q.milestones.filter((m: any) => m.status === 'RELEASED').reduce((s: number, m: any) => s + m.amount, 0) : 0,
                incoming: q.milestones ? q.milestones.filter((m: any) => m.status === 'ESCROW_PAID' || m.status === 'COMPLETED').reduce((s: number, m: any) => s + m.amount, 0) : 0
            })
        })

        // 2. Get Expenses from Material Orders
        const orders = await prisma.order.findMany({
            where: { customerId: contractorId }
        })

        const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0)
        const unpaidDebt = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').reduce((sum, o) => sum + o.totalAmount, 0)

        return NextResponse.json(createSuccessResponse({
            summary: {
                netWorth: totalReleased + totalIncoming - totalSpent,
                totalReleased,
                totalIncoming,
                totalPending,
                totalSpent,
                unpaidDebt
            },
            projects: projectIncome,
            recentOrders: orders.slice(0, 5)
        }))
    } catch (error) {
        console.error('Finance API error:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ', 'SERVER_ERROR'), { status: 500 })
    }
}
