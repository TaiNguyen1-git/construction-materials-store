import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        // Count products
        const totalProducts = await prisma.product.count({
            where: { isActive: true }
        })

        // Count categories
        const totalCategories = await prisma.category.count({
            where: { isActive: true }
        })

        // Count active orders (not completed or cancelled)
        const activeOrders = await prisma.order.count({
            where: {
                status: {
                    notIn: ['DELIVERED', 'CANCELLED']
                }
            }
        })

        // Count customers
        const totalCustomers = await prisma.customer.count()

        return NextResponse.json({
            success: true,
            data: {
                totalProducts,
                totalCategories,
                activeOrders,
                totalCustomers
            }
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
