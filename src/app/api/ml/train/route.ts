import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { mlPredictionService } from '@/lib/ml-prediction'
import { z } from 'zod'

const trainRequestSchema = z.object({
  productIds: z.array(z.string()).optional(),
  trainAll: z.boolean().default(false),
})

// POST /api/ml/train - Train Prophet models
export async function POST(request: NextRequest) {
  try {
    // Check user role from middleware
    const userRole = request.headers.get('x-user-role')
    if (userRole !== 'MANAGER') {
      return NextResponse.json(
        createErrorResponse('Manager access required', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = trainRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid request body', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { productIds, trainAll } = validation.data

    // Get products to train
    let products
    if (trainAll) {
      products = await prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        take: 100 // Limit for safety
      })
    } else if (productIds && productIds.length > 0) {
      products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true
        },
        select: { id: true, name: true }
      })
    } else {
      return NextResponse.json(
        createErrorResponse('Must provide productIds or set trainAll to true', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    if (products.length === 0) {
      return NextResponse.json(
        createErrorResponse('No products found to train', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    console.log(`🚀 Starting training for ${products.length} products...`)

    // Train models sequentially to avoid overwhelming the system
    const results = []
    for (const product of products) {
      console.log(`\n📦 Training model for: ${product.name} (${product.id})`)
      
      const result = await mlPredictionService.trainModel(product.id)
      
      results.push({
        productId: product.id,
        productName: product.name,
        success: result.success,
        metrics: result.metrics,
        error: result.error
      })

      // Small delay between trainings
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Summary
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    const response = {
      results,
      summary: {
        total: products.length,
        successful,
        failed,
        successRate: (successful / products.length) * 100
      }
    }

    console.log(`\n✅ Training complete: ${successful}/${products.length} successful`)

    return NextResponse.json(
      createSuccessResponse(response, 'Model training completed'),
      { status: 200 }
    )

  } catch (error) {
    console.error('ML training error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// GET /api/ml/train - Get training status and model info
export async function GET(request: NextRequest) {
  try {
    // Check user role from middleware
    const userRole = request.headers.get('x-user-role')
    if (!['MANAGER', 'EMPLOYEE'].includes(userRole || '')) {
      return NextResponse.json(
        createErrorResponse('Access denied', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (productId) {
      // Get model info for specific product
      const hasModel = await mlPredictionService.hasTrainedModel(productId)
      
      if (!hasModel) {
        return NextResponse.json(
          createSuccessResponse({
            productId,
            hasModel: false,
            message: 'No trained model found for this product'
          }),
          { status: 200 }
        )
      }

      const metrics = await mlPredictionService.getModelMetrics(productId)

      return NextResponse.json(
        createSuccessResponse({
          productId,
          hasModel: true,
          metrics
        }),
        { status: 200 }
      )
    } else {
      // Get all trained models
      const fs = await import('fs/promises')
      const path = await import('path')
      const modelsDir = path.join(process.cwd(), 'scripts', 'ml-service', 'models')

      try {
        const files = await fs.readdir(modelsDir)
        const modelFiles = files.filter(f => f.startsWith('prophet_') && f.endsWith('.pkl'))
        
        const models = []
        for (const file of modelFiles) {
          const productId = file.replace('prophet_', '').replace('.pkl', '')
          const metrics = await mlPredictionService.getModelMetrics(productId)
          
          // Get product info
          const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { name: true, isActive: true }
          })

          models.push({
            productId,
            productName: product?.name || 'Unknown',
            isActive: product?.isActive || false,
            metrics
          })
        }

        return NextResponse.json(
          createSuccessResponse({
            totalModels: models.length,
            models
          }),
          { status: 200 }
        )
      } catch {
        return NextResponse.json(
          createSuccessResponse({
            totalModels: 0,
            models: [],
            message: 'Models directory not found'
          }),
          { status: 200 }
        )
      }
    }

  } catch (error) {
    console.error('Get ML models error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
