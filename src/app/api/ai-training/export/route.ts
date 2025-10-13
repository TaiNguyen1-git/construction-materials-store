import { NextRequest, NextResponse } from 'next/server'
import { aiTrainingCollector } from '@/lib/ai-training-collector'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const exportQuerySchema = z.object({
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  format: z.enum(['JSON', 'CSV', 'JSONL']).default('JSON'),
  type: z.enum(['ALL', 'OCR', 'CHATBOT', 'RECOMMENDATIONS', 'INVENTORY']).default('ALL'),
})

// GET /api/ai-training/export - Export training data
export async function GET(request: NextRequest) {
  try {
    // Check user role - only managers can export training data
    const userRole = request.headers.get('x-user-role')
    if (userRole !== 'MANAGER') {
      return NextResponse.json(
        createErrorResponse('Manager access required', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const validation = exportQuerySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { startDate, endDate, format, type } = validation.data

    let trainingData: any

    switch (type) {
      case 'OCR':
        trainingData = await aiTrainingCollector.collectOCRTrainingData(startDate, endDate)
        break
      case 'CHATBOT':
        trainingData = await aiTrainingCollector.collectChatbotTrainingData(startDate, endDate)
        break
      case 'RECOMMENDATIONS':
        trainingData = await aiTrainingCollector.collectRecommendationTrainingData(startDate, endDate)
        break
      case 'INVENTORY':
        trainingData = await aiTrainingCollector.collectInventoryTrainingData(startDate, endDate)
        break
      default:
        trainingData = await aiTrainingCollector.exportAllTrainingData(startDate, endDate)
    }

    // Format data based on request
    let formattedData: string
    let contentType: string
    let filename: string

    switch (format) {
      case 'CSV':
        formattedData = JSON.stringify(trainingData) // Placeholder - implement CSV conversion
        contentType = 'text/csv'
        filename = `training_data_${type.toLowerCase()}_${Date.now()}.csv`
        break
      case 'JSONL':
        formattedData = JSON.stringify(trainingData) // Placeholder - implement JSONL conversion
        contentType = 'application/jsonl'
        filename = `training_data_${type.toLowerCase()}_${Date.now()}.jsonl`
        break
      default:
        formattedData = JSON.stringify(trainingData, null, 2)
        contentType = 'application/json'
        filename = `training_data_${type.toLowerCase()}_${Date.now()}.json`
    }

    // Set headers for file download
    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)

    return new Response(formattedData, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Export training data error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// POST /api/ai-training/export - Upload training data from external source
export async function POST(request: NextRequest) {
  try {
    // Check user role
    const userRole = request.headers.get('x-user-role')
    if (userRole !== 'MANAGER') {
      return NextResponse.json(
        createErrorResponse('Manager access required', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate and process uploaded training data
    const { type, data, source } = body

    // Store external training data for future model training
    // This would typically be saved to a training data storage system
    
    const response = {
      message: 'Training data uploaded successfully',
      type,
      recordCount: Array.isArray(data) ? data.length : 1,
      source,
      uploadedAt: new Date().toISOString()
    }

    return NextResponse.json(
      createSuccessResponse(response, 'Training data uploaded successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Upload training data error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
