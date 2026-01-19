import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Allow caching for 5 minutes
export const revalidate = 300

export async function GET(request: NextRequest) {
    try {
        // Run all counts in parallel for better performance
        const [totalProducts, totalCategories, activeOrders, totalCustomers] = await Promise.all([
            prisma.product.count({
                where: { isActive: true }
            }),
            prisma.category.count({
                where: { isActive: true }
            }),
            prisma.order.count({
                where: {
                    status: {
                        notIn: ['DELIVERED', 'CANCELLED']
                    }
                }
            }),
            prisma.customer.count()
        ])

        return NextResponse.json({
            success: true,
            data: {
                totalProducts,
                totalCategories,
                activeOrders,
                totalCustomers
            }
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
            }
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
