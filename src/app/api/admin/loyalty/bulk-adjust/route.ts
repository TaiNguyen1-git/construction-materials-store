import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// POST: Điều chỉnh điểm hàng loạt
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        if (!body.points || !body.reason) {
            return NextResponse.json(
                createErrorResponse('Vui lòng nhập số điểm và lý do', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const points = parseInt(body.points)
        const targetTier = body.targetTier || null // null = all
        const customerIds: string[] = body.customerIds || []

        // Find target customers
        let where: any = {}
        if (customerIds.length > 0) {
            where.id = { in: customerIds }
        } else if (targetTier) {
            where.loyaltyTier = targetTier
        }

        const customers = await prisma.customer.findMany({
            where,
            select: { id: true, loyaltyPoints: true }
        })

        if (customers.length === 0) {
            return NextResponse.json(
                createErrorResponse('Không tìm thấy khách hàng nào để điều chỉnh', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // Process bulk adjustment
        let successCount = 0
        let failCount = 0

        for (const customer of customers) {
            try {
                const newBalance = (customer.loyaltyPoints || 0) + points
                if (newBalance < 0) {
                    failCount++
                    continue
                }

                await prisma.customer.update({
                    where: { id: customer.id },
                    data: {
                        loyaltyPoints: newBalance,
                        ...(points > 0 ? { totalPointsEarned: { increment: points } } : {}),
                    }
                })

                await prisma.loyaltyTransaction.create({
                    data: {
                        customerId: customer.id,
                        type: 'ADJUST',
                        points,
                        balanceAfter: newBalance,
                        description: `[Hàng loạt] ${body.reason}`,
                        referenceType: 'ADMIN',
                        performedBy: body.adminId || null,
                    }
                })

                successCount++
            } catch {
                failCount++
            }
        }

        return NextResponse.json(
            createSuccessResponse({
                totalTargeted: customers.length,
                successCount,
                failCount,
                pointsPerCustomer: points,
            }, `Điều chỉnh điểm cho ${successCount}/${customers.length} khách hàng thành công`),
            { status: 200 }
        )
    } catch (error) {
        console.error('Error bulk adjusting points:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
