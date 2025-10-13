/**
 * ML Prediction Service
 * Interfaces with Python Prophet models for advanced predictions
 */

import { spawn } from 'child_process'
import path from 'path'

interface ProphetPrediction {
  predictedDemand: number
  confidence: number
  factors: {
    model_type: string
    model_accuracy: number
    trained_at: string
    prediction_periods: number
    average_daily_demand: number
    trend: number
    seasonality: number
    lower_bound: number
    upper_bound: number
    interval_width: number
  }
  timeframe: string
  method: string
  dailyForecast?: Array<{
    date: string
    demand: number
    lower: number
    upper: number
  }>
}

export class MLPredictionService {
  private scriptsPath: string

  constructor() {
    this.scriptsPath = path.join(process.cwd(), 'scripts', 'ml-service')
  }

  /**
   * Check if Prophet model exists for a product
   */
  async hasTrainedModel(productId: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises')
      const modelPath = path.join(this.scriptsPath, 'models', `prophet_${productId}.pkl`)
      await fs.access(modelPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Train Prophet model for a product
   */
  async trainModel(productId: string): Promise<{ success: boolean; metrics?: any; error?: string }> {
    return new Promise((resolve) => {
      console.log(`🤖 Training Prophet model for product: ${productId}`)
      
      const python = spawn('python', [
        path.join(this.scriptsPath, 'train_prophet.py'),
        productId
      ])

      let output = ''
      let errorOutput = ''

      python.stdout.on('data', (data) => {
        const text = data.toString()
        output += text
        console.log(text)
      })

      python.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      python.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Model training completed')
          
          // Try to extract metrics from output
          try {
            const metricsMatch = output.match(/Accuracy: ([\d.]+)%/)
            const accuracy = metricsMatch ? parseFloat(metricsMatch[1]) : null
            
            resolve({
              success: true,
              metrics: accuracy ? { accuracy } : undefined
            })
          } catch {
            resolve({ success: true })
          }
        } else {
          console.error('❌ Model training failed')
          resolve({
            success: false,
            error: errorOutput || 'Training failed'
          })
        }
      })

      python.on('error', (error) => {
        console.error('❌ Failed to start Python process:', error)
        resolve({
          success: false,
          error: `Failed to start Python: ${error.message}`
        })
      })
    })
  }

  /**
   * Make prediction using trained Prophet model
   */
  async predict(
    productId: string,
    timeframe: 'WEEK' | 'MONTH' | 'QUARTER' = 'MONTH'
  ): Promise<ProphetPrediction | null> {
    return new Promise((resolve) => {
      console.log(`🔮 Predicting with Prophet: ${productId} (${timeframe})`)
      
      const python = spawn('python', [
        path.join(this.scriptsPath, 'predict_prophet.py'),
        productId,
        timeframe
      ])

      let output = ''
      let errorOutput = ''

      python.stdout.on('data', (data) => {
        output += data.toString()
      })

      python.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      python.on('close', (code) => {
        if (code === 0) {
          try {
            // Extract JSON between markers
            const startMarker = '--- PREDICTION_RESULT ---'
            const endMarker = '--- END_PREDICTION_RESULT ---'
            
            const startIndex = output.indexOf(startMarker)
            const endIndex = output.indexOf(endMarker)
            
            if (startIndex === -1 || endIndex === -1) {
              throw new Error('Could not find prediction result markers')
            }
            
            const jsonString = output.substring(
              startIndex + startMarker.length,
              endIndex
            ).trim()
            
            const prediction = JSON.parse(jsonString)
            console.log('✅ Prophet prediction successful')
            resolve(prediction)
          } catch (error) {
            console.error('❌ Failed to parse prediction:', error)
            console.error('Output:', output)
            resolve(null)
          }
        } else {
          console.error('❌ Prophet prediction failed')
          console.error('Error:', errorOutput)
          resolve(null)
        }
      })

      python.on('error', (error) => {
        console.error('❌ Failed to start Python process:', error)
        resolve(null)
      })
    })
  }

  /**
   * Get model metrics for a product
   */
  async getModelMetrics(productId: string): Promise<any | null> {
    try {
      const fs = await import('fs/promises')
      const metricsPath = path.join(
        this.scriptsPath,
        'models',
        `prophet_${productId}_metrics.json`
      )
      
      const data = await fs.readFile(metricsPath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return null
    }
  }
}

// Singleton instance
export const mlPredictionService = new MLPredictionService()
