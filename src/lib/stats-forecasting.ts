/**
 * Statistical Forecasting Service
 * Advanced time series forecasting using pure JavaScript/TypeScript
 * Replaces Gemini API for demand prediction
 * 
 * Implements:
 * - Simple Moving Average (SMA)
 * - Exponential Moving Average (EMA) 
 * - Double Exponential Smoothing (Holt's Method)
 * - Triple Exponential Smoothing (Holt-Winters)
 * - Linear Regression with trend
 * - Ensemble forecasting (combines all methods)
 */

interface DataPoint {
    date: Date | string
    value: number
}

interface ForecastResult {
    predictedDemand: number
    confidence: number
    trend: 'increasing' | 'decreasing' | 'stable'
    seasonality: 'high' | 'medium' | 'low' | 'none'
    reasoning: string
    methodBreakdown: {
        method: string
        prediction: number
        weight: number
    }[]
}

export class StatisticalForecastingService {

    /**
     * Main forecasting method - Ensemble of multiple algorithms
     * Combines predictions with weighted average based on data characteristics
     */
    async forecast(
        data: DataPoint[],
        periodsAhead: number = 30,
        seasonalPeriod: number = 7 // Weekly seasonality for construction materials
    ): Promise<ForecastResult> {

        if (data.length < 3) {
            return this.getDefaultForecast('Insufficient data (minimum 3 points needed)')
        }

        // Convert and sort data
        const values = this.prepareData(data)

        // Calculate data characteristics
        const stats = this.calculateStatistics(values)
        const hasSeasonality = this.detectSeasonality(values, seasonalPeriod)
        const trend = this.detectTrend(values)

        // Get predictions from each method
        const predictions: { method: string; prediction: number; weight: number }[] = []

        // 1. Simple Moving Average (good for stable data)
        const sma = this.simpleMovingAverage(values, Math.min(7, Math.floor(values.length / 2)))
        predictions.push({
            method: 'Simple Moving Average',
            prediction: sma,
            weight: trend === 'stable' ? 0.25 : 0.15
        })

        // 2. Exponential Moving Average (responds to recent changes)
        const ema = this.exponentialMovingAverage(values, 0.3)
        predictions.push({
            method: 'Exponential Moving Average',
            prediction: ema,
            weight: 0.20
        })

        // 3. Linear Regression (captures trend)
        const lr = this.linearRegressionForecast(values, periodsAhead)
        predictions.push({
            method: 'Linear Regression',
            prediction: lr,
            weight: trend !== 'stable' ? 0.25 : 0.15
        })

        // 4. Holt's Double Exponential (trend-aware)
        if (values.length >= 5) {
            const holt = this.holtDoubleExponential(values, periodsAhead)
            predictions.push({
                method: 'Holt Double Exponential',
                prediction: holt,
                weight: 0.20
            })
        }

        // 5. Holt-Winters (handles seasonality)
        if (values.length >= seasonalPeriod * 2 && hasSeasonality) {
            const hw = this.holtWinters(values, periodsAhead, seasonalPeriod)
            predictions.push({
                method: 'Holt-Winters',
                prediction: hw,
                weight: 0.25
            })
        }

        // 6. Weighted Recent Average (emphasizes recent data)
        const wra = this.weightedRecentAverage(values)
        predictions.push({
            method: 'Weighted Recent Average',
            prediction: wra,
            weight: 0.15
        })

        // Normalize weights
        const totalWeight = predictions.reduce((sum, p) => sum + p.weight, 0)
        predictions.forEach(p => p.weight = p.weight / totalWeight)

        // Calculate weighted ensemble prediction
        const ensemblePrediction = predictions.reduce(
            (sum, p) => sum + p.prediction * p.weight,
            0
        )

        // Calculate confidence based on prediction variance
        const predictionVariance = this.calculateVariance(predictions.map(p => p.prediction))
        const meanPrediction = predictions.reduce((s, p) => s + p.prediction, 0) / predictions.length
        const cv = meanPrediction > 0 ? Math.sqrt(predictionVariance) / meanPrediction : 1
        const confidence = Math.max(0.3, Math.min(0.95, 1 - cv))

        // Generate reasoning
        const reasoning = this.generateReasoning(values, trend, hasSeasonality, predictions)

        return {
            predictedDemand: Math.max(0, Math.round(ensemblePrediction * 10) / 10),
            confidence: Math.round(confidence * 100) / 100,
            trend,
            seasonality: hasSeasonality ? (cv > 0.3 ? 'high' : 'medium') : 'none',
            reasoning,
            methodBreakdown: predictions.map(p => ({
                method: p.method,
                prediction: Math.round(p.prediction * 10) / 10,
                weight: Math.round(p.weight * 100) / 100
            }))
        }
    }

    /**
     * Prepare and validate data
     */
    private prepareData(data: DataPoint[]): number[] {
        return data
            .map(d => ({
                date: new Date(d.date),
                value: d.value
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(d => d.value)
    }

    /**
     * Calculate basic statistics
     */
    private calculateStatistics(values: number[]) {
        const n = values.length
        const mean = values.reduce((s, v) => s + v, 0) / n
        const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n
        const stdDev = Math.sqrt(variance)
        const min = Math.min(...values)
        const max = Math.max(...values)

        return { n, mean, variance, stdDev, min, max }
    }

    /**
     * Simple Moving Average
     */
    private simpleMovingAverage(values: number[], window: number): number {
        if (values.length === 0) return 0
        const w = Math.min(window, values.length)
        const recent = values.slice(-w)
        return recent.reduce((s, v) => s + v, 0) / w
    }

    /**
     * Exponential Moving Average
     */
    private exponentialMovingAverage(values: number[], alpha: number = 0.3): number {
        if (values.length === 0) return 0

        let ema = values[0]
        for (let i = 1; i < values.length; i++) {
            ema = alpha * values[i] + (1 - alpha) * ema
        }
        return ema
    }

    /**
     * Linear Regression Forecast
     */
    private linearRegressionForecast(values: number[], periodsAhead: number): number {
        const n = values.length
        if (n < 2) return values[0] || 0

        // Calculate regression coefficients
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
        for (let i = 0; i < n; i++) {
            sumX += i
            sumY += values[i]
            sumXY += i * values[i]
            sumX2 += i * i
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
        const intercept = (sumY - slope * sumX) / n

        // Forecast
        return intercept + slope * (n - 1 + periodsAhead)
    }

    /**
     * Holt's Double Exponential Smoothing
     * Handles level and trend
     */
    private holtDoubleExponential(
        values: number[],
        periodsAhead: number,
        alpha: number = 0.3,
        beta: number = 0.1
    ): number {
        const n = values.length
        if (n < 2) return values[0] || 0

        // Initialize
        let level = values[0]
        let trend = values[1] - values[0]

        // Smooth
        for (let i = 1; i < n; i++) {
            const prevLevel = level
            level = alpha * values[i] + (1 - alpha) * (level + trend)
            trend = beta * (level - prevLevel) + (1 - beta) * trend
        }

        // Forecast
        return level + periodsAhead * trend
    }

    /**
     * Holt-Winters Triple Exponential Smoothing
     * Handles level, trend, and seasonality
     */
    private holtWinters(
        values: number[],
        periodsAhead: number,
        seasonalPeriod: number = 7,
        alpha: number = 0.3,
        beta: number = 0.1,
        gamma: number = 0.2
    ): number {
        const n = values.length
        if (n < seasonalPeriod * 2) {
            return this.holtDoubleExponential(values, periodsAhead)
        }

        // Initialize seasonal indices
        const seasonal: number[] = new Array(seasonalPeriod).fill(1)
        const firstSeasonMean = values.slice(0, seasonalPeriod).reduce((s, v) => s + v, 0) / seasonalPeriod

        for (let i = 0; i < seasonalPeriod; i++) {
            seasonal[i] = values[i] / (firstSeasonMean || 1)
        }

        // Initialize level and trend
        let level = firstSeasonMean
        let trend = 0
        if (n >= seasonalPeriod * 2) {
            const secondSeasonMean = values.slice(seasonalPeriod, seasonalPeriod * 2).reduce((s, v) => s + v, 0) / seasonalPeriod
            trend = (secondSeasonMean - firstSeasonMean) / seasonalPeriod
        }

        // Smooth
        for (let i = seasonalPeriod; i < n; i++) {
            const sIndex = i % seasonalPeriod
            const prevLevel = level
            const prevSeasonal = seasonal[sIndex]

            level = alpha * (values[i] / prevSeasonal) + (1 - alpha) * (level + trend)
            trend = beta * (level - prevLevel) + (1 - beta) * trend
            seasonal[sIndex] = gamma * (values[i] / level) + (1 - gamma) * prevSeasonal
        }

        // Forecast
        const futureSeasonIndex = (n + periodsAhead - 1) % seasonalPeriod
        return (level + periodsAhead * trend) * seasonal[futureSeasonIndex]
    }

    /**
     * Weighted Recent Average - emphasizes recent data
     */
    private weightedRecentAverage(values: number[]): number {
        if (values.length === 0) return 0

        const weights = values.map((_, i) => Math.pow(1.5, i))
        const totalWeight = weights.reduce((s, w) => s + w, 0)

        return values.reduce((sum, v, i) => sum + v * weights[i], 0) / totalWeight
    }

    /**
     * Detect trend in data
     */
    private detectTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
        if (values.length < 3) return 'stable'

        const n = values.length
        const halfN = Math.floor(n / 2)

        const firstHalfMean = values.slice(0, halfN).reduce((s, v) => s + v, 0) / halfN
        const secondHalfMean = values.slice(halfN).reduce((s, v) => s + v, 0) / (n - halfN)

        const change = (secondHalfMean - firstHalfMean) / (firstHalfMean || 1)

        if (change > 0.1) return 'increasing'
        if (change < -0.1) return 'decreasing'
        return 'stable'
    }

    /**
     * Detect seasonality using autocorrelation
     */
    private detectSeasonality(values: number[], period: number): boolean {
        if (values.length < period * 2) return false

        const mean = values.reduce((s, v) => s + v, 0) / values.length

        // Calculate autocorrelation at lag = period
        let numerator = 0
        let denominator = 0

        for (let i = 0; i < values.length - period; i++) {
            numerator += (values[i] - mean) * (values[i + period] - mean)
        }

        for (let i = 0; i < values.length; i++) {
            denominator += Math.pow(values[i] - mean, 2)
        }

        const autocorr = denominator > 0 ? numerator / denominator : 0

        // Significant seasonality if autocorrelation > 0.5
        return autocorr > 0.5
    }

    /**
     * Calculate variance of predictions
     */
    private calculateVariance(values: number[]): number {
        const mean = values.reduce((s, v) => s + v, 0) / values.length
        return values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length
    }

    /**
     * Generate human-readable reasoning
     */
    private generateReasoning(
        values: number[],
        trend: string,
        hasSeasonality: boolean,
        predictions: { method: string; prediction: number; weight: number }[]
    ): string {
        const stats = this.calculateStatistics(values)
        const topMethod = predictions.reduce((best, p) => p.weight > best.weight ? p : best, predictions[0])

        let reasoning = `Phân tích ${values.length} điểm dữ liệu. `

        if (trend === 'increasing') {
            reasoning += 'Xu hướng tăng được phát hiện. '
        } else if (trend === 'decreasing') {
            reasoning += 'Xu hướng giảm được phát hiện. '
        } else {
            reasoning += 'Nhu cầu ổn định. '
        }

        if (hasSeasonality) {
            reasoning += 'Có yếu tố mùa vụ. '
        }

        reasoning += `Mô hình chính: ${topMethod.method} (${Math.round(topMethod.weight * 100)}% weight). `
        reasoning += `Trung bình lịch sử: ${Math.round(stats.mean * 10) / 10} đơn vị.`

        return reasoning
    }

    /**
     * Default forecast for insufficient data
     */
    private getDefaultForecast(reason: string): ForecastResult {
        return {
            predictedDemand: 0,
            confidence: 0.3,
            trend: 'stable',
            seasonality: 'none',
            reasoning: reason,
            methodBreakdown: []
        }
    }
}

// Export singleton
export const statisticalForecasting = new StatisticalForecastingService()
