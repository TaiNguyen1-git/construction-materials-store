import { NextRequest, NextResponse } from 'next/server'
import { LoyaltyService } from '@/lib/loyalty-service'
import { prisma } from '@/lib/prisma'

// GET /api/loyalty/vouchers - Get available voucher options
export async function GET() {
    try {
        const voucherOptions = LoyaltyService.getVoucherOptions()

        return NextResponse.json({
            success: true,
            voucherOptions
        })
    } catch (error: any) {
        console.error('Error getting voucher options:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to get voucher options' },
            { status: 500 }
        )
    }
}

import { getUser } from '@/lib/auth'

// POST /api/loyalty/vouchers - Redeem points for voucher
export async function POST(request: NextRequest) {
    try {
        const user = await getUser()

        if (!user || user.role !== 'CUSTOMER') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized or not a customer' },
                { status: 401 }
            )
        }

        // Find customer by userId
        const customer = await prisma.customer.findFirst({
            where: { userId: user.userId }
        })

        if (!customer) {
            return NextResponse.json(
                { success: false, error: 'Customer record not found' },
                { status: 404 }
            )
        }

        const customerId = customer.id

        const { voucherValue } = await request.json()

        if (!voucherValue) {
            return NextResponse.json(
                { success: false, error: 'Voucher value is required' },
                { status: 400 }
            )
        }

        // Redeem points for voucher
        const result = await LoyaltyService.redeemPointsForVoucher(customerId, voucherValue)

        return NextResponse.json({
            success: true,
            ...result
        })
    } catch (error: any) {
        console.error('Error redeeming voucher:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to redeem voucher' },
            { status: 500 }
        )
    }
}
