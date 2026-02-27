import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const requestId = searchParams.get('requestId')
        const supplierId = searchParams.get('supplierId')

        const bids = await prisma.supplierBid.findMany({
            where: {
                ...(requestId ? { purchaseRequestId: requestId } : {}),
                ...(supplierId ? { supplierId } : {}),
            },
            include: {
                supplier: { select: { name: true } },
                purchaseRequest: { include: { bids: true } }
            },
            orderBy: { bidPrice: 'asc' }
        })

        return NextResponse.json({ success: true, data: bids })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const payload = await verifyTokenFromRequest(req)
        if (!payload || !payload.userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { purchaseRequestId, bidPrice, deliveryDays, notes } = body

        if (!purchaseRequestId || !bidPrice || !deliveryDays) {
            return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
        }

        // Find supplier ID from user ID
        const supplier = await prisma.supplier.findFirst({
            where: { userId: payload.userId }
        })

        if (!supplier) {
            return NextResponse.json({ success: false, error: 'Only suppliers can bid' }, { status: 403 })
        }

        const bid = await prisma.supplierBid.create({
            data: {
                purchaseRequestId,
                supplierId: supplier.id,
                bidPrice,
                deliveryDays,
                notes,
                status: 'PENDING'
            }
        })

        return NextResponse.json({ success: true, data: bid })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json()
        const { bidId, status } = body

        if (!bidId || !status) {
            return NextResponse.json({ success: false, error: 'Missing bidId or status' }, { status: 400 })
        }

        const bid = await prisma.supplierBid.update({
            where: { id: bidId },
            data: { status }
        })

        // If accepted, update the purchase request
        if (status === 'ACCEPTED') {
            await prisma.purchaseRequest.update({
                where: { id: bid.purchaseRequestId },
                data: {
                    supplierId: bid.supplierId,
                    estimatedCost: bid.bidPrice,
                    status: 'APPROVED'
                }
            })

            // Reject other bids for the same request
            await prisma.supplierBid.updateMany({
                where: {
                    purchaseRequestId: bid.purchaseRequestId,
                    id: { not: bidId }
                },
                data: { status: 'REJECTED' }
            })
        }

        return NextResponse.json({ success: true, data: bid })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
