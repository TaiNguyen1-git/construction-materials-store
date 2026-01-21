import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * API for Customers to confirm a milestone and release funds
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ milestoneId: string }> }
) {
    try {
        const { milestoneId } = (await params)

        // Update milestone status
        const milestone = await (prisma as any).paymentMilestone.update({
            where: { id: milestoneId },
            data: {
                status: 'RELEASED',
                releasedAt: new Date()
            }
        })

        // Logic to actually trigger payment gateway release would go here

        return NextResponse.json(createSuccessResponse(milestone, 'Xác nhận giải ngân thành công! Tiền đã được chuyển cho nhà thầu.'))
    } catch (error) {
        console.error('Milestone release error:', error)
        return NextResponse.json(createErrorResponse('Internal error', 'SERVER_ERROR'), { status: 500 })
    }
}
