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

        // 1. Get All Projects for this contractor
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { contractorId: contractorId },
                    { customerId: contractorId }
                ]
            }
        })

        // 2. Get Income from Milestones (via QuoteRequests)
        const quotes = await prisma.quoteRequest.findMany({
            where: { contractorId },
            include: { milestones: true }
        })

        // 3. Get Expenses from Material Orders
        const orders = await prisma.order.findMany({
            where: { customerId: contractorId }
        })

        // 4. Map everything together
        const projectFinanceMap = new Map()

        // Initialize with real projects
        projects.forEach(p => {
            projectFinanceMap.set(p.id, {
                id: p.id,
                title: p.name,
                totalAmount: Number(p.budget) || 0,
                released: 0,
                incoming: 0,
                expenses: 0
            })
        })

        // Aggregate Income
        quotes.forEach((q: any) => {
            const pId = q.projectId || 'uncategorized'
            if (!projectFinanceMap.has(pId)) {
                projectFinanceMap.set(pId, {
                    id: pId,
                    title: (q.metadata as any)?.projectName || 'Dự án vãng lai',
                    totalAmount: 0,
                    released: 0,
                    incoming: 0,
                    expenses: 0
                })
            }

            const entry = projectFinanceMap.get(pId)
            if (q.milestones) {
                q.milestones.forEach((m: any) => {
                    if (m.status === 'RELEASED') entry.released += m.amount
                    else if (m.status === 'ESCROW_PAID' || m.status === 'COMPLETED' || m.status === 'FUNDED') {
                        entry.incoming += m.amount
                    }
                })
            }
        })

        // Aggregate Expenses
        orders.forEach((o: any) => {
            const pId = o.projectId || 'uncategorized'
            if (projectFinanceMap.has(pId)) {
                projectFinanceMap.get(pId).expenses += o.totalAmount
            }
        })

        const projectIncome = Array.from(projectFinanceMap.values())

        // Calculate Totals
        const totalReleased = projectIncome.reduce((s, p) => s + p.released, 0)
        const totalIncoming = projectIncome.reduce((s, p) => s + p.incoming, 0)
        const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0)
        const unpaidDebt = orders
            .filter(o => o.paymentStatus !== 'PAID' && o.status !== 'CANCELLED')
            .reduce((sum, o) => sum + (o.remainingAmount || (o.totalAmount - (o.depositAmount || 0))), 0)

        // Only return projects that have some financial activity or are the contractor's own projects
        const filteredProjects = projectIncome.filter(p =>
            p.id !== 'uncategorized' || p.released > 0 || p.incoming > 0 || p.expenses > 0
        )

        return NextResponse.json(createSuccessResponse({
            summary: {
                netWorth: totalReleased + totalIncoming - totalSpent,
                totalReleased,
                totalIncoming,
                totalSpent,
                unpaidDebt: unpaidDebt  // This matches the "Financial Hub" debt view
            },
            projects: filteredProjects,
            recentOrders: orders.slice(0, 5)
        }))
    } catch (error) {
        console.error('Finance API error:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ', 'SERVER_ERROR'), { status: 500 })
    }
}
