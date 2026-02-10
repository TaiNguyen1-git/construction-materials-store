import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { v4 as uuidv4 } from 'uuid'
import { EmailService } from '@/lib/email-service'

// POST: Thực hiện xử lý khách hàng (Tặng điểm, voucher, dịch vụ)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { customerId, giftType, giftValue, message } = body

        if (!customerId || !giftType) {
            return NextResponse.json(
                createErrorResponse('Thông tin xử lý không đầy đủ', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: { user: { select: { email: true, name: true } } }
        })

        if (!customer) {
            return NextResponse.json(
                createErrorResponse('Không tìm thấy khách hàng', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        const customerEmail = customer.user?.email || ''
        const customerName = customer.user?.name || customer.companyName || 'Khách hàng'

        let result: any = {}

        if (giftType === 'POINTS') {
            const points = parseInt(giftValue.match(/\d+/)?.[0] || '100')
            const newBalance = (customer.loyaltyPoints || 0) + points

            // Update customer
            await prisma.customer.update({
                where: { id: customerId },
                data: {
                    loyaltyPoints: newBalance,
                    totalPointsEarned: { increment: points }
                }
            })

            // Log transaction
            await prisma.loyaltyTransaction.create({
                data: {
                    customerId: customerId,
                    type: 'ADJUST',
                    points,
                    balanceAfter: newBalance,
                    description: `[AI Care] ${points} điểm: ${message.substring(0, 100)}...`,
                    referenceType: 'ADMIN',
                }
            })
            result = { type: 'POINTS', value: points }
        }
        else if (giftType === 'VOUCHER') {
            const voucherValue = giftValue.includes('%')
                ? parseFloat(giftValue.match(/\d+/)?.[0] || '5')
                : parseFloat(giftValue.match(/\d+/)?.join('') || '500000')

            const code = `VIP-${uuidv4().substring(0, 8).toUpperCase()}`

            await prisma.loyaltyVoucher.create({
                data: {
                    customerId: customerId,
                    code,
                    value: voucherValue,
                    pointsUsed: 0,
                    status: 'UNUSED',
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                }
            })

            // Log action to transactions too with 0 points
            await prisma.loyaltyTransaction.create({
                data: {
                    customerId: customerId,
                    type: 'ADJUST',
                    points: 0,
                    balanceAfter: customer.loyaltyPoints,
                    description: `[AI Care] Tặng ${giftValue}: Mã ${code}`,
                    referenceType: 'VOUCHER',
                }
            })
            result = { type: 'VOUCHER', code, value: giftValue }
        }
        else {
            // SERVICE or others
            await prisma.loyaltyTransaction.create({
                data: {
                    customerId: customerId,
                    type: 'ADJUST',
                    points: 0,
                    balanceAfter: customer.loyaltyPoints,
                    description: `[AI Care] Kích hoạt ${giftValue}: ${message.substring(0, 100)}...`,
                    referenceType: 'ADMIN',
                }
            })
            result = { type: 'SERVICE', value: giftValue }
        }

        // Gửi email thông báo cho khách hàng
        if (customerEmail) {
            await EmailService.sendLoyaltyGift({
                email: customerEmail,
                name: customerName,
                giftType,
                giftValue,
                message
            })
        }

        return NextResponse.json(
            createSuccessResponse(result, 'Xử lý khách hàng và gửi email thành công'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Error processing customer action:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống khi xử lý', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
