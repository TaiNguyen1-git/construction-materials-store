import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        // 1. Fetch PENDING purchase requests (from SmartBuild admin)
        const requests = await prisma.purchaseRequest.findMany({
            where: { status: 'PENDING' },
            include: { bids: true },
            orderBy: { createdAt: 'desc' }
        })

        // 2. Fetch APPROVED & PUBLIC projects (from Contractors)
        const publicProjects = await prisma.project.findMany({
            where: {
                AND: [
                    { moderationStatus: 'APPROVED' },
                    { isPublic: true }
                ]
            },
            include: {
                bids: true // This is ProjectBid, not SupplierBid, but we'll adapt
            },
            orderBy: { createdAt: 'desc' }
        })

        // Enhance purchase requests with product names
        const products = await prisma.product.findMany({
            where: {
                id: { in: requests.map(r => r.productId) }
            },
            select: { id: true, name: true, sku: true }
        })

        const mappedRequests = requests.map(req => ({
            id: req.id,
            requestNumber: req.requestNumber,
            productId: req.productId,
            requestedQty: req.requestedQty,
            priority: req.priority,
            createdAt: req.createdAt,
            status: req.status,
            deliveryAddress: 'Kho Tổng SmartBuild',
            product: products.find(p => p.id === req.productId),
            bids: req.bids,
            type: 'PURCHASE_REQUEST'
        }))

        const mappedProjects = publicProjects.map(proj => ({
            id: proj.id,
            requestNumber: `PRJ-${proj.id.slice(-6).toUpperCase()}`,
            productId: 'MARKET_PROJECT',
            requestedQty: 1, // Project bid is usually for the whole package
            priority: proj.priority,
            createdAt: proj.createdAt,
            status: proj.status,
            deadline: proj.endDate,
            deliveryAddress: proj.location || 'Địa điểm dự án',
            product: {
                name: proj.name,
                sku: proj.category || 'Dự án'
            },
            bids: [], // Map project bids if needed
            type: 'PROJECT_OPPORTUNITY'
        }))

        return NextResponse.json({ 
            success: true, 
            data: [...mappedRequests, ...mappedProjects] 
        })
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
