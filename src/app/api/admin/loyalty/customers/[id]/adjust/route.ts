import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// POST: Điều chỉnh điểm cho khách hàng (có ghi audit log)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        if (!body.points || !body.reason) {
            return NextResponse.json(
                createErrorResponse('Vui lòng nhập số điểm và lý do', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const customer = await prisma.customer.findUnique({
            where: { id }
        })

        if (!customer) {
            return NextResponse.json(
                createErrorResponse('Không tìm thấy khách hàng', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        const points = parseInt(body.points)
        const newBalance = (customer.loyaltyPoints || 0) + points

        if (newBalance < 0) {
            return NextResponse.json(
                createErrorResponse('Số điểm sau điều chỉnh không được âm', 'INSUFFICIENT_POINTS'),
                { status: 400 }
            )
        }

        // Update customer points
        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: {
                loyaltyPoints: newBalance,
                ...(points > 0 ? { totalPointsEarned: { increment: points } } : {}),
            }
        })

        // Determine new tier
        let newTier = updatedCustomer.loyaltyTier
        const totalEarned = updatedCustomer.totalPointsEarned || 0
        if (totalEarned >= 10000) newTier = 'DIAMOND'
        else if (totalEarned >= 5000) newTier = 'PLATINUM'
        else if (totalEarned >= 2500) newTier = 'GOLD'
        else if (totalEarned >= 1000) newTier = 'SILVER'
        else newTier = 'BRONZE'

        if (newTier !== updatedCustomer.loyaltyTier) {
            await prisma.customer.update({
                where: { id },
                data: { loyaltyTier: newTier }
            })
        }

        // Create audit transaction
        await prisma.loyaltyTransaction.create({
            data: {
                customerId: id,
                type: 'ADJUST',
                points,
                balanceAfter: newBalance,
                description: body.reason,
                referenceType: 'ADMIN',
                performedBy: body.adminId || null,
            }
        })

        return NextResponse.json(
            createSuccessResponse({
                previousPoints: customer.loyaltyPoints,
                newPoints: newBalance,
                adjustment: points,
                newTier,
            }, 'Điều chỉnh điểm thành công'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Error adjusting points:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
