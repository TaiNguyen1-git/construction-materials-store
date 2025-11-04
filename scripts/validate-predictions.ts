/**
 * Validate Predictions Script
 * 
 * This script compares predicted demand vs actual demand
 * and calculates accuracy metrics for inventory predictions.
 * 
 * Run: npm run validate:predictions
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function validatePredictions() {
  console.log('🔍 Starting Prediction Validation...\n')
  console.log('=' .repeat(70))

  try {
    // Get all predictions that haven't been validated yet
    const predictions = await prisma.inventoryPrediction.findMany({
      where: {
        actualDemand: null,
        targetDate: {
          lte: new Date() // Target date has passed
        }
      },
      include: {
        product: {
          select: {
            name: true,
            unit: true
          }
        }
      },
      orderBy: {
        targetDate: 'asc'
      }
    })

    if (predictions.length === 0) {
      console.log('✅ No predictions to validate!')
      console.log('   All predictions are either already validated or target date has not arrived yet.\n')
      return
    }

    console.log(`📊 Found ${predictions.length} predictions to validate\n`)

    let totalAccuracy = 0
    let validatedCount = 0

    for (const prediction of predictions) {
      console.log(`\n📦 Product: ${prediction.product.name}`)
      console.log(`📅 Target Date: ${prediction.targetDate.toLocaleDateString('vi-VN')}`)
      console.log(`⏱️  Timeframe: ${prediction.timeframe}`)

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

      console.log(`📈 Predicted: ${predicted.toFixed(2)} ${prediction.product.unit}`)
      console.log(`✅ Actual: ${actual.toFixed(2)} ${prediction.product.unit}`)
      console.log(`📊 Error: ${error.toFixed(2)} (${percentageError.toFixed(1)}%)`)
      console.log(`🎯 Accuracy: ${accuracy.toFixed(1)}%`)

      // Determine result
      let result = '✅ Excellent'
      if (accuracy < 90) result = '👍 Good'
      if (accuracy < 80) result = '⚠️  Fair'
      if (accuracy < 70) result = '❌ Poor'

      console.log(`📝 Result: ${result}`)

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

      totalAccuracy += accuracy
      validatedCount++
    }

    console.log('\n' + '='.repeat(70))
    console.log('📊 SUMMARY')
    console.log('='.repeat(70))
    console.log(`✅ Validated: ${validatedCount} predictions`)
    console.log(`📈 Average Accuracy: ${(totalAccuracy / validatedCount).toFixed(1)}%`)

    // Get overall statistics
    const allValidated = await prisma.inventoryPrediction.findMany({
      where: {
        actualDemand: { not: null }
      },
      select: {
        accuracy: true,
        timeframe: true
      }
    })

    if (allValidated.length > 0) {
      const avgAccuracy = allValidated.reduce((sum, p) => sum + (p.accuracy || 0), 0) / allValidated.length
      
      const byTimeframe = {
        WEEK: allValidated.filter(p => p.timeframe === 'WEEK'),
        MONTH: allValidated.filter(p => p.timeframe === 'MONTH'),
        QUARTER: allValidated.filter(p => p.timeframe === 'QUARTER')
      }

      console.log(`\n📊 Overall Statistics (All Time):`)
      console.log(`   Total Validated: ${allValidated.length}`)
      console.log(`   Average Accuracy: ${avgAccuracy.toFixed(1)}%`)
      
      for (const [timeframe, preds] of Object.entries(byTimeframe)) {
        if (preds.length > 0) {
          const avg = preds.reduce((sum, p) => sum + (p.accuracy || 0), 0) / preds.length
          console.log(`   ${timeframe}: ${avg.toFixed(1)}% (${preds.length} predictions)`)
        }
      }
    }

    console.log('\n✅ Validation complete!\n')

  } catch (error) {
    console.error('❌ Validation error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run validation
validatePredictions()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
