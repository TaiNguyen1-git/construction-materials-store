import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const type = searchParams.get('type') || undefined
        const customerId = searchParams.get('customerId') || undefined
        const startDate = searchParams.get('startDate') || undefined
        const endDate = searchParams.get('endDate') || undefined

        const where: any = {}
        if (type) where.type = type
        if (customerId) where.customerId = customerId
        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) where.createdAt.gte = new Date(startDate)
            if (endDate) where.createdAt.lte = new Date(endDate)
        }

        const [transactions, total] = await Promise.all([
            prisma.loyaltyTransaction.findMany({
                where,
                include: {
                    customer: {
                        include: {
                            user: {
                                select: { name: true, email: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.loyaltyTransaction.count({ where }),
        ])

        const formatted = transactions.map(t => ({
            id: t.id,
            customerId: t.customerId,
            customerName: t.customer?.user?.name || 'N/A',
            customerEmail: t.customer?.user?.email || 'N/A',
            type: t.type,
            points: t.points,
            balanceAfter: t.balanceAfter,
            description: t.description,
            referenceType: t.referenceType,
            referenceId: t.referenceId,
            performedBy: t.performedBy,
            createdAt: t.createdAt,
        }))

        return NextResponse.json(
            createSuccessResponse({
                transactions: formatted,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }
            }, 'Lấy lịch sử giao dịch thành công'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Error fetching loyalty transactions:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
