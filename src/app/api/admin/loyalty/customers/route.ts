import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
    try {
        // In a real app, verify admin permissions here
        // const userId = request.headers.get('x-user-id')
        // Check if user is admin...

        const customers = await prisma.customer.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                loyaltyPoints: 'desc'
            }
        })


        const formattedCustomers = customers.map(c => ({
            id: c.id,
            name: c.user.name,
            email: c.user.email,
            tier: c.loyaltyTier,
            points: c.loyaltyPoints,
            totalSpent: c.totalPurchases
        }))


        return NextResponse.json(
            createSuccessResponse(formattedCustomers, 'Customers retrieved successfully'),
            { status: 200 }
        )

    } catch (error) {
        console.error('Error fetching admin loyalty customers:', error)
        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
