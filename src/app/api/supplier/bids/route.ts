import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        // Fetch all PENDING purchase requests that suppliers can bid on
        const requests = await prisma.purchaseRequest.findMany({
            where: {
                status: 'PENDING'
            },
            include: {
                bids: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Enhance with product names (simulated since productId is a string)
        const products = await prisma.product.findMany({
            where: {
                id: { in: requests.map(r => r.productId) }
            },
            select: { id: true, name: true, sku: true }
        })

        const data = requests.map(req => ({
            ...req,
            product: products.find(p => p.id === req.productId)
        }))

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { purchaseRequestId, supplierId, bidPrice, deliveryDays, notes } = body

        if (!purchaseRequestId || !supplierId || !bidPrice) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check if supplier already bid
        const existingBid = await prisma.supplierBid.findFirst({
            where: {
                purchaseRequestId,
                supplierId
            }
        })

        let bid
        if (existingBid) {
            bid = await prisma.supplierBid.update({
                where: { id: existingBid.id },
                data: { bidPrice, deliveryDays, notes, status: 'PENDING' }
            })
        } else {
            bid = await prisma.supplierBid.create({
                data: {
                    purchaseRequestId,
                    supplierId,
                    bidPrice,
                    deliveryDays,
                    notes,
                    status: 'PENDING'
                }
            })
        }

        return NextResponse.json({ success: true, data: bid })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
