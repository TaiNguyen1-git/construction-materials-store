import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { mlRecommendations } from '@/lib/ml-recommendations'

const similarRecommendationSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    limit: z.number().optional().default(6),
})

/**
 * Get similar product recommendations for product detail page
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validation = similarRecommendationSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Invalid request', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const { productId, limit } = validation.data

        // Get current product details
        const currentProduct = await prisma.product.findUnique({
            where: { id: productId },
            include: { category: true }
        })

        if (!currentProduct) {
            return NextResponse.json(
                createErrorResponse('Product not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // Find similar products using Hybrid ML model
        const mlScores = await mlRecommendations.getHybridRecommendations(productId, undefined, 'SIMILAR', limit)
        const enrichedRecs = await mlRecommendations.enrichRecommendations(mlScores)

        const similarProducts = enrichedRecs.map((p: any) => ({
            ...p,
            badge: p.method === 'ml' ? '✨ ML Gợi ý' : '⭐ Tương tự',
            confidence: p.recommendationScore || 0.85
        }))

        return NextResponse.json(
            createSuccessResponse(
                {
                    recommendations: similarProducts,
                    count: similarProducts.length
                },
                'Similar products retrieved successfully'
            ),
            { status: 200 }
        )
    } catch (error) {
        console.error('Similar recommendations error:', error)
        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

