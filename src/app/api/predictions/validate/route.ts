import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// POST /api/predictions/validate - Validate predictions
export async function POST(request: NextRequest) {
  try {
    // Get all predictions that haven't been validated yet
    const predictions = await prisma.inventoryPrediction.findMany({
      where: {
        actualDemand: null,
        targetDate: {
          lte: new Date() // Target date has passed
        }
      }
    })

    let validatedCount = 0

    for (const prediction of predictions) {
      // Calculate actual demand from orders
      const startDate = new Date(prediction.predictionDate)
      const endDate = new Date(prediction.targetDate)

      const orders = await prisma.orderItem.aggregate({
        where: {
          productId: prediction.productId,
          order: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            status: {
              not: 'CANCELLED'
            }
          }
        },
        _sum: {
          quantity: true
        }
      })

      const actualDemand = orders._sum.quantity || 0

      // Calculate accuracy metrics
      const predicted = prediction.predictedDemand
      const actual = actualDemand
      
      const error = Math.abs(predicted - actual)
      const percentageError = actual > 0 ? (error / actual) * 100 : 0
      const accuracy = Math.max(0, 100 - percentageError)

      // Update prediction with actual data
      await prisma.inventoryPrediction.update({
        where: { id: prediction.id },
        data: {
          actualDemand,
          accuracy,
          error,
          validatedAt: new Date()
        }
      })

      validatedCount++
    }

    return NextResponse.json(
      createSuccessResponse({
        validated: validatedCount,
        message: `Đã validate ${validatedCount} predictions`
      }, 'Validation complete'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
