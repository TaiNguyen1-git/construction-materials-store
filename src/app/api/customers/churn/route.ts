import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { predictChurn, getAtRiskCustomers, type CustomerChurnData } from '@/lib/ml-services'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * GET /api/customers/churn?customerId=xxx
 * Get churn prediction for a specific customer
 * 
 * GET /api/customers/churn?atRisk=true&minProbability=0.6&limit=50
 * Get list of at-risk customers
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const customerId = searchParams.get('customerId')
        const atRisk = searchParams.get('atRisk') === 'true'

        if (atRisk) {
            const minProbability = parseFloat(searchParams.get('minProbability') || '0.6')
            const limit = parseInt(searchParams.get('limit') || '50')

            const result = await getAtRiskCustomers(minProbability, limit)
            return NextResponse.json(createSuccessResponse(result))
        }

        if (!customerId) {
            return NextResponse.json(
                createErrorResponse('Customer ID required', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Fetch customer data from database
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                orders: {
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last 12 months
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!customer) {
            return NextResponse.json(
                createErrorResponse('Customer not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // Fetch reviews separately (ProductReview linked by customerId string)
        const reviews = await prisma.productReview.findMany({
            where: { customerId: customerId }
        })

        // Calculate customer metrics
        const now = new Date()
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

        const orders12m = customer.orders
        const recentOrders = orders12m.filter(o => new Date(o.createdAt) >= threeMonthsAgo)
        const previousOrders = orders12m.filter(o => {
            const date = new Date(o.createdAt)
            return date >= sixMonthsAgo && date < threeMonthsAgo
        })

        const customerData: CustomerChurnData = {
            customer_id: customerId,
            last_order_date: orders12m[0]?.createdAt?.toISOString(),
            orders_12m: orders12m.length,
            total_spent_12m: orders12m.reduce((sum: number, o) => sum + (o.totalAmount || 0), 0),
            recent_3m_spent: recentOrders.reduce((sum: number, o) => sum + (o.totalAmount || 0), 0),
            previous_3m_spent: previousOrders.reduce((sum: number, o) => sum + (o.totalAmount || 0), 0) || 1,
            has_reviews: reviews.length > 0,
            avg_rating_given: reviews.length > 0
                ? reviews.reduce((sum: number, r) => sum + r.rating, 0) / reviews.length
                : 0
        }

        const prediction = await predictChurn(customerData)

        if (!prediction) {
            // Fallback to simple calculation
            const fallback = calculateSimpleChurnRisk(customerData)
            return NextResponse.json(createSuccessResponse({
                ...fallback,
                source: 'fallback'
            }))
        }

        return NextResponse.json(createSuccessResponse({
            ...prediction,
            customerMetrics: customerData,
            source: 'ml-service'
        }))

    } catch (error) {
        console.error('Churn prediction error:', error)
        return NextResponse.json(
            createErrorResponse('Churn prediction failed', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

/**
 * POST /api/customers/churn
 * Predict churn for custom customer data
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const prediction = await predictChurn(body)

        if (!prediction) {
            const fallback = calculateSimpleChurnRisk(body)
            return NextResponse.json(createSuccessResponse({
                ...fallback,
                source: 'fallback'
            }))
        }

        return NextResponse.json(createSuccessResponse({
            ...prediction,
            source: 'ml-service'
        }))

    } catch (error) {
        console.error('Churn prediction error:', error)
        return NextResponse.json(
            createErrorResponse('Churn prediction failed', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

/**
 * Simple fallback churn calculation when ML service unavailable
 */
function calculateSimpleChurnRisk(data: CustomerChurnData) {
    let risk = 0.5

    // Recency risk
    if (data.last_order_date) {
        const daysSince = Math.floor(
            (Date.now() - new Date(data.last_order_date).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSince > 90) risk += 0.2
        else if (daysSince > 60) risk += 0.1
        else if (daysSince < 30) risk -= 0.1
    } else {
        risk += 0.3
    }

    // Frequency risk
    if (data.orders_12m >= 6) risk -= 0.15
    else if (data.orders_12m >= 3) risk -= 0.05
    else if (data.orders_12m <= 1) risk += 0.15

    // Trend risk
    if (data.recent_3m_spent && data.previous_3m_spent) {
        const trend = (data.recent_3m_spent - data.previous_3m_spent) / data.previous_3m_spent
        if (trend < -0.3) risk += 0.2
        else if (trend > 0.1) risk -= 0.1
    }

    // Clamp risk
    risk = Math.max(0, Math.min(1, risk))

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
    if (risk >= 0.8) riskLevel = 'CRITICAL'
    else if (risk >= 0.6) riskLevel = 'HIGH'
    else if (risk >= 0.4) riskLevel = 'MEDIUM'

    const recommendations: Record<string, string> = {
        'CRITICAL': 'Gọi điện trực tiếp + Giảm giá 20%',
        'HIGH': 'Gửi email khuyến mãi + Giảm giá 15%',
        'MEDIUM': 'Push notification + Giảm giá 10%',
        'LOW': 'Gửi newsletter thông thường'
    }

    return {
        customerId: data.customer_id,
        churnProbability: Math.round(risk * 1000) / 1000,
        riskLevel,
        riskFactors: [],
        recommendation: recommendations[riskLevel]
    }
}
