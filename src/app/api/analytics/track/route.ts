import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const trackSchema = z.object({
  interactionType: z.enum(['PRODUCT_VIEW', 'PRODUCT_SEARCH', 'ADD_TO_CART', 'PURCHASE', 'CHATBOT', 'REVIEW', 'SUPPORT']),
  productId: z.string().optional(),
  query: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { interactionType, productId, query, metadata } = trackSchema.parse(body)

    // Extract basic session/user info
    const sessionId = request.cookies.get('chatbot_session_id')?.value || 'anonymous'
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const interaction = await prisma.customerInteraction.create({
      data: {
        sessionId,
        interactionType: interactionType as any,
        productId: productId || null,
        query: query || null,
        metadata: metadata || {},
        ipAddress,
        userAgent
      }
    })

    return createSuccessResponse(interaction, 'Interaction recorded')
  } catch (error) {
    console.error('Track interaction error:', error)
    return createErrorResponse('Failed to record interaction')
  }
}
