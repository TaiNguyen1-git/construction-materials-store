import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * API for matching site material requests (strings) to actual products in the store
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { items } = body // [{ name: "xi măng", quantity: 10, unit: "bao" }]

        if (!items || !Array.isArray(items)) {
            return NextResponse.json(createErrorResponse('Invalid items', 'VALIDATION_ERROR'), { status: 400 })
        }

        const matches = await Promise.all(items.map(async (item) => {
            // Find candidates based on name
            const candidates = await prisma.product.findMany({
                where: {
                    OR: [
                        { name: { contains: item.name } },
                        { tags: { hasSome: [item.name] } }
                    ],
                    isActive: true
                },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    price: true,
                    unit: true,
                    images: true,
                    sku: true
                }
            })

            return {
                originalRequest: item,
                suggestions: candidates
            }
        }))

        return NextResponse.json(createSuccessResponse(matches))
    } catch (error) {
        console.error('Procurement match error:', error)
        return NextResponse.json(createErrorResponse('Internal error', 'SERVER_ERROR'), { status: 500 })
    }
}
