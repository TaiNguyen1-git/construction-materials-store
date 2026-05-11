import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const feedbackSchema = z.object({
  sessionId: z.string(),
  botMessage: z.string(),
  feedback: z.enum(['up', 'down'])
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = feedbackSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { sessionId, botMessage, feedback } = validation.data

    // Find the latest interaction for this session that has this exact response
    const interaction = await prisma.customerInteraction.findFirst({
      where: {
        sessionId,
        response: botMessage,
        interactionType: 'CHATBOT'
      },
      orderBy: { createdAt: 'desc' }
    })

    if (interaction) {
      // Append feedback to metadata
      const currentMetadata = (interaction.metadata as any) || {}
      await prisma.customerInteraction.update({
        where: { id: interaction.id },
        data: {
          metadata: {
            ...currentMetadata,
            feedback
          }
        }
      })
    } else {
      // If we couldn't find the exact message, just log it as a new interaction
      await prisma.customerInteraction.create({
        data: {
          sessionId,
          interactionType: 'CHATBOT',
          query: 'USER_FEEDBACK',
          response: botMessage.substring(0, 500),
          metadata: { feedback }
        }
      })
    }

    return NextResponse.json(createSuccessResponse({ success: true }))

  } catch (error) {
    console.error('Chatbot feedback error:', error)
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
  }
}
