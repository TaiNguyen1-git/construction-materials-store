import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { walletService } from '@/lib/wallet-service'

export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const customer = await prisma.customer.findFirst({
            where: { userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Customer not found', 'NOT_FOUND'), { status: 404 })
        }

        // Đảm bảo có ví
        const wallet = await walletService.ensureWallet(customer.id)

        // Lấy toàn bộ dữ liệu (transactions)
        const walletData = await walletService.getWalletData(customer.id)

        return NextResponse.json(createSuccessResponse({
            wallet: walletData,
            referralCode: customer.referralCode,
            totalReferrals: customer.totalReferrals
        }))

    } catch (error: any) {
        console.error('Get wallet error:', error)
        return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
    }
}
