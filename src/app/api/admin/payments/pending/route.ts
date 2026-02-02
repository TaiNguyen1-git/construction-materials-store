import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export const dynamic = 'force-dynamic'

// GET /api/admin/payments/pending
export async function GET(request: NextRequest) {
    try {
        const pendingPayments = await prisma.payment.findMany({
            where: {
                status: 'PENDING',
                paymentType: 'OUTGOING' // Only look for outgoing withdrawals
            },
            orderBy: {
                paymentDate: 'desc'
            }
        })

        return NextResponse.json(createSuccessResponse(pendingPayments))
    } catch (error) {
        console.error('Fetch Pending Payments Error:', error)
        return NextResponse.json(createErrorResponse('Failed to fetch pending payments', 'SERVER_ERROR'), { status: 500 })
    }
}
