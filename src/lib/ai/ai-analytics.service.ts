// AI Analytics Service — sentiment analysis, demand forecasting, and credit risk

import { getWorkingModelConfig, GeminiResponse, parseGeminiJSON } from './ai-client'

/** Analyze customer message sentiment */
export async function analyzeSentiment(message: string): Promise<{ sentiment: string; confidence: number }> {
    try {
        const { client, modelName } = await getWorkingModelConfig()
        if (!client) throw new Error('Client init failed')

        const prompt = `
    Analyze the sentiment of the following customer message.
    Return a JSON object with:
    - sentiment: "positive", "negative", or "neutral"
    - confidence: a number between 0 and 1
    
    Example: {"sentiment": "positive", "confidence": 0.95}
    
    Customer message: ${message}
    
    Return only the JSON object, nothing else.
    `

        const result = await client.models.generateContent({
            model: modelName!,
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })

        const text = (result as GeminiResponse).text || '{}'
        const parsed = parseGeminiJSON<{ sentiment?: string; confidence?: number }>(text, {})

        return {
            sentiment: parsed.sentiment || 'neutral',
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
        }
    } catch (error) {
        console.error('[AnalyticsService] analyzeSentiment error:', error)
        return { sentiment: 'neutral', confidence: 0.5 }
    }
}

/** Forecast product demand using historical data and AI */
export async function forecastDemand(data: {
    productId: string
    productName: string
    historicalData: Array<{ month: string; sales: number; stock: number }>
    currentStock: number
    leadTimeDays: number
}): Promise<{
    predictedDemand: number
    reorderPoint: number
    recommendedOrderQuantity: number
    confidence: number
    reasoning: string
}> {
    try {
        const { client, modelName } = await getWorkingModelConfig()
        if (!client) throw new Error('Client init failed')

        const prompt = `
    You are an inventory management AI. Analyze the following sales data for "${data.productName}" 
    and provide demand forecasting.
    
    Historical Data (last months):
    ${JSON.stringify(data.historicalData, null, 2)}
    
    Current Situation:
    - Current Stock: ${data.currentStock} units
    - Lead Time: ${data.leadTimeDays} days
    
    Please provide:
    1. predictedDemand: Expected units needed for next month
    2. reorderPoint: Stock level at which to trigger reorder
    3. recommendedOrderQuantity: How many units to order
    4. confidence: Your confidence level (0-1)
    5. reasoning: Brief explanation in Vietnamese
    
    Return ONLY a JSON object with these exact fields.
    `

        const result = await client.models.generateContent({
            model: modelName!,
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })

        const text = (result as GeminiResponse).text || '{}'
        const parsed = parseGeminiJSON<Record<string, unknown>>(text, {})

        return {
            predictedDemand: (parsed.predictedDemand as number) || 0,
            reorderPoint: (parsed.reorderPoint as number) || 0,
            recommendedOrderQuantity: (parsed.recommendedOrderQuantity as number) || 0,
            confidence: (parsed.confidence as number) || 0.5,
            reasoning: (parsed.reasoning as string) || 'Không đủ dữ liệu để phân tích.'
        }
    } catch (error) {
        console.error('[AnalyticsService] forecastDemand error:', error)
        return {
            predictedDemand: 0,
            reorderPoint: 0,
            recommendedOrderQuantity: 0,
            confidence: 0,
            reasoning: 'Không thể dự đoán do lỗi hệ thống.'
        }
    }
}

/** Analyze credit risk for a B2B customer */
export async function analyzeCreditRisk(data: {
    customerId: string
    customerName: string
    orderHistory: Array<{ amount: number; paidOnTime: boolean; date: string }>
    totalDebt: number
    creditLimit: number
    paymentDays: number[]
}): Promise<{
    riskScore: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    recommendation: string
    suggestedCreditLimit: number
}> {
    try {
        const { client, modelName } = await getWorkingModelConfig()
        if (!client) throw new Error('Client init failed')

        const prompt = `
    Analyze the credit risk for B2B customer "${data.customerName}".
    
    Customer Data:
    - Total Outstanding Debt: ${data.totalDebt.toLocaleString()}đ
    - Current Credit Limit: ${data.creditLimit.toLocaleString()}đ
    - Average Payment Days: ${data.paymentDays.length > 0 ? Math.round(data.paymentDays.reduce((a, b) => a + b, 0) / data.paymentDays.length) : 'N/A'} days
    - Payment History: ${data.orderHistory.filter(o => o.paidOnTime).length}/${data.orderHistory.length} on time
    
    Provide a credit risk assessment:
    1. riskScore: 0-100 (0=no risk, 100=highest risk)
    2. riskLevel: "LOW", "MEDIUM", "HIGH", or "CRITICAL"
    3. recommendation: brief Vietnamese advice (1-2 sentences)
    4. suggestedCreditLimit: recommended new credit limit in VND
    
    Return ONLY a JSON object with these exact fields.
    `

        const result = await client.models.generateContent({
            model: modelName!,
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })

        const text = (result as GeminiResponse).text || '{}'
        const parsed = parseGeminiJSON<Record<string, unknown>>(text, {})

        const riskLevel = (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(parsed.riskLevel as string)
            ? parsed.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
            : 'MEDIUM')

        return {
            riskScore: (parsed.riskScore as number) || 50,
            riskLevel,
            recommendation: (parsed.recommendation as string) || 'Cần xem xét thêm lịch sử thanh toán.',
            suggestedCreditLimit: (parsed.suggestedCreditLimit as number) || data.creditLimit
        }
    } catch (error) {
        console.error('[AnalyticsService] analyzeCreditRisk error:', error)
        return {
            riskScore: 50,
            riskLevel: 'MEDIUM',
            recommendation: 'Không thể phân tích rủi ro lúc này.',
            suggestedCreditLimit: data.creditLimit
        }
    }
}

/** Get smart product recommendations using RAG + AI */
export async function getProductRecommendations(query: string): Promise<Record<string, unknown>[]> {
    try {
        const { RAGService } = await import('../rag-service')
        const ragResults = await RAGService.getProductRecommendations(query, 5)

        if (ragResults.length === 0) {
            const { prisma } = await import('../prisma')
            const fallbackProducts = await prisma.product.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 3
            })

            return fallbackProducts.map(p => ({
                name: p.name,
                description: p.description || '',
                price: p.price,
                unit: p.unit,
                isInStore: true
            }))
        }

        return ragResults.map(p => ({
            name: p.name,
            description: p.description || '',
            price: p.pricing.basePrice,
            unit: p.pricing.unit,
            category: p.category,
            brand: p.brand,
            isInStore: p.supplier === 'Store Inventory'
        }))
    } catch (error) {
        console.error('[AnalyticsService] getProductRecommendations error:', error)
        return []
    }
}
