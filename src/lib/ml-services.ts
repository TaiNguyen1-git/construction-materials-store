/**
 * ML Services Client
 * Wrapper để gọi các ML services từ Render
 */

const ML_SERVICES_URL = process.env.ML_SERVICES_URL || process.env.PROPHET_SERVER_URL || 'http://localhost:5000'

/**
 * Generic fetch wrapper for ML services
 */
async function callML<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
        const response = await fetch(`${ML_SERVICES_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        })

        const data = await response.json()
        return data
    } catch (error) {
        console.error(`ML Service error [${endpoint}]:`, error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'ML service unavailable'
        }
    }
}

// =============================================================================
// SENTIMENT ANALYSIS
// =============================================================================

export interface SentimentResult {
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
    score: number
    confidence: number
    aspects: Record<string, { sentiment: string; score: number; mentions: number }>
    keywords: { positive: string[]; negative: string[] }
}

export async function analyzeSentiment(text: string): Promise<SentimentResult | null> {
    const result = await callML<{ data: SentimentResult }>('/sentiment/analyze', {
        method: 'POST',
        body: JSON.stringify({ text }),
    })

    return result.success ? result.data?.data || null : null
}

export async function analyzeSentimentBatch(texts: string[]) {
    return callML('/sentiment/batch', {
        method: 'POST',
        body: JSON.stringify({ texts }),
    })
}

// =============================================================================
// CUSTOMER CHURN PREDICTION
// =============================================================================

export interface ChurnPrediction {
    customerId: string
    churnProbability: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    riskFactors: Array<{ factor: string; impact: string; score: number }>
    recommendation: string
    rfmScores: {
        recency_risk: number
        frequency_risk: number
        monetary_risk: number
        trend_risk: number
        engagement_risk: number
    }
}

export interface CustomerChurnData {
    customer_id: string
    last_order_date?: string
    orders_12m: number
    total_spent_12m: number
    recent_3m_spent?: number
    previous_3m_spent?: number
    has_reviews?: boolean
    avg_rating_given?: number
}

export async function predictChurn(customerData: CustomerChurnData): Promise<ChurnPrediction | null> {
    const result = await callML<{ data: ChurnPrediction }>('/churn/predict', {
        method: 'POST',
        body: JSON.stringify(customerData),
    })

    return result.success ? result.data?.data || null : null
}

export async function getAtRiskCustomers(minProbability = 0.6, limit = 50) {
    return callML(`/churn/at-risk?minProbability=${minProbability}&limit=${limit}`)
}

// =============================================================================
// DYNAMIC PRICING
// =============================================================================

export interface PriceRecommendation {
    productId: string
    productName: string
    currentPrice: number
    recommendedPrice: number
    priceChange: string
    factors: {
        demand: { value: number; reason: string }
        inventory: { value: number; reason: string }
        competitor: { value: number; reason: string }
        time: { value: number; reason: string }
        combined: number
    }
    projections: {
        expectedDemand: number
        expectedRevenue: number
        expectedProfit: number
        confidence: number
    }
}

export interface ProductPricingData {
    productId: string
    productName: string
    basePrice: number
    cost?: number
    category?: string
    currentStock?: number
    avgDailySales?: number
    demandIndex?: number
    competitorPrice?: number
}

export async function getRecommendedPrice(product: ProductPricingData): Promise<PriceRecommendation | null> {
    const result = await callML<{ data: PriceRecommendation }>('/pricing/recommend', {
        method: 'POST',
        body: JSON.stringify(product),
    })

    return result.success ? result.data?.data || null : null
}

export async function getBatchPriceRecommendations(products: ProductPricingData[]) {
    return callML('/pricing/batch-update', {
        method: 'POST',
        body: JSON.stringify({ products }),
    })
}

// =============================================================================
// CONTRACTOR MATCHING
// =============================================================================

export interface ContractorMatch {
    contractorId: string
    displayName: string
    score: number
    textSimilarity: number
    profileScore: number
    locationScore: number
    reasons: string[]
}

export interface ProjectMatchRequest {
    title: string
    description: string
    requirements: string[]
    city?: string
    district?: string
}

export interface ContractorData {
    id: string
    displayName: string
    skills: string[]
    bio?: string
    city?: string
    district?: string
    avgRating?: number
    experienceYears?: number
    completedJobs?: number
    isVerified?: boolean
}

export async function matchContractors(
    project: ProjectMatchRequest,
    contractors: ContractorData[],
    limit = 10
): Promise<ContractorMatch[]> {
    const result = await callML<{ data: { recommendations: ContractorMatch[] } }>('/contractors/match', {
        method: 'POST',
        body: JSON.stringify({ project, contractors, limit }),
    })

    return result.success ? result.data?.data?.recommendations || [] : []
}

// =============================================================================
// MARKET TRENDS
// =============================================================================

export interface MarketTrend {
    category: string
    period: string
    summary: {
        trend: 'UP' | 'DOWN' | 'STABLE' | 'NO_DATA'
        changePercent: number
        currentAvgPrice: number
        previousAvgPrice: number
    }
    signals: {
        technical: string
        news: string
        combined: string
    }
}

export async function getMarketTrends(category = 'all', period = 30): Promise<MarketTrend | null> {
    const result = await callML<{ data: MarketTrend }>(`/market/trends?category=${category}&period=${period}`)

    return result.success ? result.data?.data || null : null
}

export async function forecastMarketPrices(prices: number[], periods = 30) {
    return callML('/market/forecast', {
        method: 'POST',
        body: JSON.stringify({ prices, periods }),
    })
}

export async function getMarketAlerts() {
    return callML('/market/alerts')
}

// =============================================================================
// SEMANTIC SEARCH
// =============================================================================

export interface SemanticSearchResult {
    productId: string
    name: string
    category: string
    price: number
    score: number
    scoreBreakdown: {
        semantic: number
        keyword: number
        boost: number
    }
    matchedTerms: string[]
    highlight: string
}

export interface SearchFilters {
    category?: string
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
}

export async function semanticSearch(
    query: string,
    limit = 20,
    filters?: SearchFilters
): Promise<SemanticSearchResult[]> {
    const result = await callML<{ results: SemanticSearchResult[] }>('/search/semantic', {
        method: 'POST',
        body: JSON.stringify({ query, limit, filters, expandSynonyms: true }),
    })

    return result.success ? result.data?.results || [] : []
}

export async function indexProductsForSearch(products: Array<{
    id: string
    name: string
    description?: string
    category?: string
    brand?: string
    price?: number
}>) {
    return callML('/search/index', {
        method: 'POST',
        body: JSON.stringify({ products }),
    })
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

export async function checkMLHealth(): Promise<{ status: string; services: Record<string, boolean> } | null> {
    const result = await callML<{ status: string; services: Record<string, boolean> }>('/health')
    return result.success ? result.data || null : null
}
