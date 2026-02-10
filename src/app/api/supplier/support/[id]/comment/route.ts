import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { disputeService } from '@/lib/dispute-service'

// POST /api/supplier/support/[id]/comment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { content, supplierId } = body

        if (!content || !supplierId) {
            return NextResponse.json(createErrorResponse('Thiếu thông tin bắt buộc'), { status: 400 })
        }

        // Get supplier info to find userId
        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
            select: { userId: true, name: true }
        })

        if (!supplier || !supplier.userId) {
            return NextResponse.json(createErrorResponse('Không tìm thấy thông tin tài khoản'), { status: 404 })
        }

        // Verify the dispute belongs to the supplier
        const dispute = await (prisma as any).dispute.findUnique({
            where: { id, supplierId }
        })

        if (!dispute) {
            return NextResponse.json(createErrorResponse('Yêu cầu không tồn tại'), { status: 404 })
        }

        const comment = await disputeService.addComment({
            disputeId: id,
            authorId: supplier.userId,
            content
        })

        // Also update the dispute status if it was WAITING
        if (dispute.status === 'WAITING') {
            await (prisma as any).dispute.update({
                where: { id },
                data: { status: 'IN_PROGRESS', updatedAt: new Date() }
            })
        } else {
            await (prisma as any).dispute.update({
                where: { id },
                data: { updatedAt: new Date() }
            })
        }

        return NextResponse.json(createSuccessResponse(comment, 'Đã gửi phản hồi'))
    } catch (error) {
        console.error('Create ticket comment error:', error)
        return NextResponse.json(createErrorResponse('Server error'), { status: 500 })
    }
}
