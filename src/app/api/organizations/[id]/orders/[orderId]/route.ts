import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; orderId: string }> }
) {
    try {
        const { id, orderId } = await params
        const payload = verifyTokenFromRequest(req)
        const userId = payload?.userId
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { action } = body

        // Check permission (OWNER/ADMIN only)
        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: id,
                    userId
                }
            }
        })

        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        })

        if (!order || order.organizationId !== id) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
        }

        let updateData: any = {}

        if (action === 'approve') {
            updateData = {
                b2bApprovalStatus: 'APPROVED',
                status: 'PENDING', // Ready for processing
                confirmedBy: userId,
                confirmedAt: new Date()
            }
        } else if (action === 'reject') {
            updateData = {
                b2bApprovalStatus: 'REJECTED',
                status: 'CANCELLED',
                cancelReason: 'Organization Admin Rejected'
            }
        } else {
            return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: updateData
        })

        return NextResponse.json({ success: true, data: updatedOrder })

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
