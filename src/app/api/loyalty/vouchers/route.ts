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

// POST /api/loyalty/vouchers - Redeem points for voucher
export async function POST(request: NextRequest) {
    try {
        // Get customer ID from headers (same pattern as /api/loyalty)
        let customerId = request.headers.get('x-customer-id')
        const userId = request.headers.get('x-user-id')

        if (!customerId && userId) {
            // Try to find customer by userId
            const customer = await (prisma as any).customer.findFirst({
                where: { userId }
            })
            if (customer) {
                customerId = customer.id
            }
        }

        if (!customerId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Customer ID required' },
                { status: 401 }
            )
        }

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
