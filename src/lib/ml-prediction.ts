/**
 * ML Prediction Service
 * Uses Statistical Forecasting (replaced Gemini due to rate limits)
 * 
 * Algorithms: Holt-Winters, Exponential Smoothing, Moving Average, Linear Regression
 */

import { prisma } from '@/lib/prisma'
import { statisticalForecasting } from './stats-forecasting'

interface PredictionResult {
  predictedDemand: number
  confidence: number
  factors: {
    model_type: string
    reasoning: string
    trend: string
  }
  timeframe: string
  methodBreakdown?: any[]
}

export class MLPredictionService {

  /**
   * Check if we have enough data to predict
   */
  async hasTrainedModel(productId: string): Promise<boolean> {
    const count = await prisma.orderItem.count({
      where: {
        productId,
        order: {
          status: { in: ['DELIVERED', 'SHIPPED'] }
        }
      }
    })
    return count >= 3 // Minimum 3 data points for forecasting
  }

  /**
   * Train model - Analyzes data quality
   */
  async trainModel(productId: string): Promise<{ success: boolean; metrics?: any; error?: string }> {
    try {
      const history = await this.getHistoricalData(productId, 90)

      if (history.length < 3) {
        return {
          success: false,
          error: 'Not enough data (minimum 3 records needed)',
          metrics: { dataPoints: history.length }
        }
      }

      // Calculate data quality metrics
      const values = history.map(h => h.value)
      const mean = values.reduce((s, v) => s + v, 0) / values.length
      const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length
      const cv = mean > 0 ? Math.sqrt(variance) / mean : 1

      return {
        success: true,
        metrics: {
          dataPoints: history.length,
          meanDemand: Math.round(mean * 10) / 10,
          coefficientOfVariation: Math.round(cv * 100) / 100,
          dataQuality: cv < 0.3 ? 'high' : cv < 0.6 ? 'medium' : 'low',
          lastUpdated: new Date().toISOString(),
          modelType: 'Statistical Ensemble'
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Make prediction using Statistical Forecasting
   */
  async predict(
    productId: string,
    timeframe: 'WEEK' | 'MONTH' | 'QUARTER' = 'MONTH'
  ): Promise<PredictionResult | null> {
    try {
      // Calculate periods ahead based on timeframe
      const periodsAhead = timeframe === 'WEEK' ? 7 : timeframe === 'MONTH' ? 30 : 90

      // Fetch historical sales data
      const history = await this.getHistoricalData(productId, 90)

      if (history.length < 3) {
        console.log(`⚠️ Not enough history for product ${productId}`)
        return {
          predictedDemand: 0,
          confidence: 0.3,
          factors: {
            model_type: 'Fallback (Insufficient Data)',
            reasoning: `Chỉ có ${history.length} điểm dữ liệu, cần tối thiểu 3`,
            trend: 'stable'
          },
          timeframe
        }
      }

      // Use Statistical Forecasting
      const forecast = await statisticalForecasting.forecast(
        history,
        periodsAhead,
        7 // Weekly seasonality
      )

      return {
        predictedDemand: forecast.predictedDemand,
        confidence: forecast.confidence,
        factors: {
          model_type: `Statistical Ensemble (${forecast.methodBreakdown.length} models)`,
          reasoning: forecast.reasoning,
          trend: forecast.trend
        },
        timeframe,
        methodBreakdown: forecast.methodBreakdown
      }

    } catch (error) {
      console.error('Prediction error:', error)
      return null
    }
  }

  /**
   * Get historical demand data
   */
  private async getHistoricalData(productId: string, days: number = 90) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const orderItems = await prisma.orderItem.findMany({
      where: {
        productId,
        order: {
          status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING'] },
          createdAt: { gte: startDate }
        }
      },
      select: {
        quantity: true,
        order: {
          select: { createdAt: true }
        }
      },
      orderBy: {
        order: { createdAt: 'asc' }
      }
    })

    // Aggregate by date
    const dailyDemand = new Map<string, number>()

    for (const item of orderItems) {
      const date = item.order.createdAt.toISOString().split('T')[0]
      dailyDemand.set(date, (dailyDemand.get(date) || 0) + item.quantity)
    }

    return Array.from(dailyDemand.entries()).map(([date, value]) => ({
      date,
      value
    }))
  }

  /**
   * Get model metrics
   */
  async getModelMetrics(productId: string): Promise<any | null> {
    const trainResult = await this.trainModel(productId)

    return {
      ...trainResult.metrics,
      type: 'Statistical Ensemble',
      algorithms: [
        'Simple Moving Average',
        'Exponential Moving Average',
        'Holt Double Exponential',
        'Holt-Winters (Seasonal)',
        'Linear Regression',
        'Weighted Recent Average'
      ]
    }
  }

  /**
   * Batch prediction for multiple products
   */
  async batchPredict(
    productIds: string[],
    timeframe: 'WEEK' | 'MONTH' | 'QUARTER' = 'MONTH'
  ): Promise<Map<string, PredictionResult | null>> {
    const results = new Map<string, PredictionResult | null>()

    for (const productId of productIds) {
      const prediction = await this.predict(productId, timeframe)
      results.set(productId, prediction)
    }

    return results
  }
}

// Singleton instance
export const mlPredictionService = new MLPredictionService()
