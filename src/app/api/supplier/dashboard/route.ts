/**
 * Supplier Dashboard API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { PurchaseOrderStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const supplierId = searchParams.get('supplierId')

        if (!supplierId) {
            return NextResponse.json(
                createErrorResponse('Supplier ID required', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Get supplier info
        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId }
        })

        if (!supplier) {
            return NextResponse.json(
                createErrorResponse('Supplier not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // 1. Total Orders
        const totalOrders = await prisma.purchaseOrder.count({
            where: { supplierId }
        })

        // 2. Pending Orders (SENT or CONFIRMED)
        const pendingOrders = await prisma.purchaseOrder.count({
            where: {
                supplierId,
                status: {
                    in: [PurchaseOrderStatus.SENT, PurchaseOrderStatus.CONFIRMED]
                }
            }
        })

        // 3. Revenue (Status = RECEIVED) - "Assumption: Received = Payable" from original code
        const revenueAgg = await prisma.purchaseOrder.aggregate({
            _sum: {
                totalAmount: true
            },
            where: {
                supplierId,
                status: PurchaseOrderStatus.RECEIVED
            }
        })
        const totalRevenue = revenueAgg._sum.totalAmount || 0

        // 4. Pending Payments (Same logic as revenue in original code? Or should it be unchecked?)
        // Original Logic:
        // pendingPayments: allOrders.filter(o => o.status === 'RECEIVED').reduce...
        // This implies Pending Payment = Total Revenue (which assumes nothing is paid yet?)
        // Keeping logic identical to original for consistency, but using optimized query.
        const pendingPayments = totalRevenue

        const stats = {
            totalOrders,
            pendingOrders,
            totalRevenue,
            pendingPayments
        }

        // Get recent purchase orders
        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where: { supplierId },
            include: {
                purchaseItems: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        })

        // Format recent orders
        const recentOrders = purchaseOrders.flatMap((po) =>
            (po.purchaseItems || []).map((item) => ({
                orderNumber: po.orderNumber,
                productName: item.product?.name || 'N/A',
                quantity: item.quantity,
                status: po.status,
                createdAt: po.createdAt
            }))
        ).slice(0, 10)

        return NextResponse.json(
            createSuccessResponse({
                supplier: {
                    name: supplier.name,
                    email: supplier.email,
                    phone: supplier.phone
                },
                stats,
                recentOrders
            }, 'Dashboard data loaded'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Supplier dashboard error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to load dashboard', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
