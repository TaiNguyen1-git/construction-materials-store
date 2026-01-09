import { NextRequest, NextResponse } from 'next/server'
import { getMarketTrends, forecastMarketPrices, getMarketAlerts } from '@/lib/ml-services'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * GET /api/market/trends?category=cement&period=30
 * Get market trend analysis for a category
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category') || 'all'
        const period = parseInt(searchParams.get('period') || '30')
        const type = searchParams.get('type') // 'alerts' for market alerts

        if (type === 'alerts') {
            const alerts = await getMarketAlerts()
            return NextResponse.json(createSuccessResponse(alerts))
        }

        const trends = await getMarketTrends(category, period)

        if (!trends) {
            // Return fallback data structure
            return NextResponse.json(createSuccessResponse({
                category,
                period: `${period}d`,
                summary: {
                    trend: 'STABLE',
                    changePercent: 0,
                    currentAvgPrice: 0,
                    previousAvgPrice: 0
                },
                signals: {
                    technical: 'STABLE',
                    news: 'NEUTRAL',
                    combined: 'HOLD'
                },
                source: 'fallback'
            }))
        }

        return NextResponse.json(createSuccessResponse({
            ...trends,
            source: 'ml-service'
        }))

    } catch (error) {
        console.error('Market trends error:', error)
        return NextResponse.json(
            createErrorResponse('Market analysis failed', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

/**
 * POST /api/market/trends
 * Forecast market prices based on historical data
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { prices, periods = 30 } = body

        if (!prices || !Array.isArray(prices) || prices.length < 10) {
            return NextResponse.json(
                createErrorResponse('At least 10 price data points required', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const forecast = await forecastMarketPrices(prices, periods)

        if (!forecast) {
            // Simple linear forecast fallback
            const fallback = simpleLinearForecast(prices, periods)
            return NextResponse.json(createSuccessResponse({
                ...fallback,
                source: 'fallback'
            }))
        }

        return NextResponse.json(createSuccessResponse({
            ...forecast,
            source: 'ml-service'
        }))

    } catch (error) {
        console.error('Market forecast error:', error)
        return NextResponse.json(
            createErrorResponse('Forecast failed', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

/**
 * Simple linear forecast fallback
 */
function simpleLinearForecast(prices: number[], periods: number) {
    const n = prices.length
    const xMean = (n - 1) / 2
    const yMean = prices.reduce((a, b) => a + b, 0) / n

    // Calculate slope
    let numerator = 0
    let denominator = 0
    for (let i = 0; i < n; i++) {
        numerator += (i - xMean) * (prices[i] - yMean)
        denominator += (i - xMean) ** 2
    }
    const slope = denominator !== 0 ? numerator / denominator : 0
    const intercept = yMean - slope * xMean

    // Generate forecast
    const forecast = []
    for (let i = 0; i < periods; i++) {
        forecast.push(Math.round(intercept + slope * (n + i)))
    }

    // Calculate std for confidence interval
    const std = Math.sqrt(prices.reduce((sum, p) => sum + (p - yMean) ** 2, 0) / n)

    return {
        periods,
        forecast,
        lowerBound: forecast.map(f => Math.round(Math.max(0, f - 1.96 * std))),
        upperBound: forecast.map(f => Math.round(f + 1.96 * std)),
        model: 'LinearRegression',
        metadata: {
            dataPoints: n,
            trendDirection: slope > 0 ? 'UP' : slope < 0 ? 'DOWN' : 'STABLE'
        }
    }
}
