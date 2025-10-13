import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { aiRecognition } from '@/lib/ai-material-recognition'
import { z } from 'zod'

const recognitionSchema = z.object({
  image: z.string().optional(), // Base64 image
  query: z.string().optional(), // Text query
})

// POST /api/ai/recognize - Recognize material from image or text
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = recognitionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid request data', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { image, query } = validation.data

    if (!image && !query) {
      return NextResponse.json(
        createErrorResponse('Either image or query is required', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    let result

    if (query) {
      // Text-based recognition
      console.log('🔍 Text-based material recognition:', query)
      result = await aiRecognition.identifyFromText(query)
    } else if (image) {
      // Image-based recognition
      console.log('📸 Image-based material recognition')
      result = await aiRecognition.recognizeMaterial(image)
    }

    return NextResponse.json(
      createSuccessResponse(result, 'Material recognized successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('AI recognition error:', error)
    return NextResponse.json(
      createErrorResponse('Recognition failed', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// GET /api/ai/recognize?query=xi+mang - Quick search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query) {
      return NextResponse.json(
        createErrorResponse('Query parameter is required', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    console.log('🔍 Quick material search:', query)
    const result = await aiRecognition.identifyFromText(query)

    return NextResponse.json(
      createSuccessResponse(result, 'Material identified successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('AI recognition error:', error)
    return NextResponse.json(
      createErrorResponse('Recognition failed', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
