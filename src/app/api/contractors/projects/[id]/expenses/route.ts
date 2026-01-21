import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })

        const { amount, category, notes } = await request.json()
        if (!amount) return NextResponse.json(createErrorResponse('Số tiền là bắt buộc', 'VALIDATION_ERROR'), { status: 400 })

        const customer = await prisma.customer.findFirst({ where: { userId: payload.userId } })
        if (!customer) return NextResponse.json(createErrorResponse('Contractor not found', 'NOT_FOUND'), { status: 404 })

        // 1. Create the detailed expense record
        const expense = await (prisma as any).projectExpense.create({
            data: {
                projectId,
                contractorId: customer.id,
                amount: parseFloat(amount),
                category: category || 'OTHER',
                notes: notes || '',
            }
        })

        // 2. Update actualCost on project
        await (prisma as any).constructionProject.update({
            where: { id: projectId },
            data: {
                actualCost: { increment: parseFloat(amount) },
                updatedAt: new Date()
            }
        })

        return NextResponse.json(createSuccessResponse(expense, 'Đã ghi nhận chi phí thành công'))
    } catch (error: any) {
        console.error('Expense Recording Error:', error)
        return NextResponse.json(createErrorResponse(error.message, 'SERVER_ERROR'), { status: 500 })
    }
}
