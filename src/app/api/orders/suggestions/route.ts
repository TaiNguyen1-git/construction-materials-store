import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { getUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const user = await getUser()
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('query') || ''

        if (query.length < 2) {
            return NextResponse.json(createSuccessResponse([], 'Query too short'))
        }

        // Determine the customer ID if logged in
        let customerId: string | null = null
        if (user?.userId) {
            const customer = await prisma.customer.findUnique({
                where: { userId: user.userId }
            })
            customerId = customer?.id || null
        }

        const isObjectId = /^[0-9a-fA-F]{24}$/.test(query)

        // Search for orders
        const orders = await prisma.order.findMany({
            where: {
                AND: [
                    customerId ? { customerId } : { id: 'none' }, // Only show user's orders if logged in
                    {
                        OR: [
                            { orderNumber: { contains: query, mode: 'insensitive' } },
                            ...(isObjectId ? [{ id: { equals: query } }] : [])
                        ]
                    }
                ]
            },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                createdAt: true
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse(orders, 'Suggestions retrieved'))
    } catch (error) {
        console.error('Order suggestions error:', error)
        return NextResponse.json(createErrorResponse('Failed to fetch suggestions', 'INTERNAL_ERROR'), { status: 500 })
    }
}
