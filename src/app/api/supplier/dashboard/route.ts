/**
 * Supplier Dashboard API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

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

        // Get purchase orders for this supplier
        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where: { supplierId },
            include: {
                items: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        })

        // Calculate stats
        const allOrders = await prisma.purchaseOrder.findMany({
            where: { supplierId }
        })

        const stats = {
            totalOrders: allOrders.length,
            pendingOrders: allOrders.filter(o => o.status === 'PENDING' || o.status === 'ORDERED').length,
            totalRevenue: allOrders
                .filter(o => o.status === 'RECEIVED')
                .reduce((sum, o) => sum + o.totalAmount, 0),
            pendingPayments: allOrders
                .filter(o => o.paymentStatus !== 'PAID')
                .reduce((sum, o) => sum + o.totalAmount, 0)
        }

        // Format recent orders
        const recentOrders = purchaseOrders.flatMap(po =>
            po.items.map(item => ({
                orderNumber: po.orderNumber,
                productName: item.product.name,
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
