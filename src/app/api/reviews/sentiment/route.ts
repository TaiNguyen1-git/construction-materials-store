import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeSentiment, analyzeSentimentBatch } from '@/lib/ml-services'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * POST /api/reviews/sentiment
 * Analyze sentiment of a review text
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { text, reviewId, batch } = body

        // Batch analysis
        if (batch && Array.isArray(batch)) {
            const result = await analyzeSentimentBatch(batch.map((r: { text?: string }) => r.text || String(r)))
            return NextResponse.json(createSuccessResponse(result))
        }

        // Single analysis
        if (!text) {
            return NextResponse.json(
                createErrorResponse('Missing text field', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const sentiment = await analyzeSentiment(text)

        if (!sentiment) {
            // Fallback to simple rule-based sentiment if ML service unavailable
            const fallbackSentiment = simpleSentimentAnalysis(text)
            return NextResponse.json(createSuccessResponse({
                ...fallbackSentiment,
                source: 'fallback'
            }))
        }

        // If reviewId provided, update the ProductReview with sentiment data (if field exists)
        if (reviewId) {
            // ProductReview doesn't have sentimentScore field in current schema
            // Just log for now
            console.log(`Sentiment analyzed for review ${reviewId}: ${sentiment.sentiment}`)
        }

        return NextResponse.json(createSuccessResponse({
            ...sentiment,
            source: 'ml-service'
        }))

    } catch (error) {
        console.error('Sentiment analysis error:', error)
        return NextResponse.json(
            createErrorResponse('Sentiment analysis failed', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

/**
 * Simple fallback sentiment analysis when ML service is unavailable
 */
function simpleSentimentAnalysis(text: string) {
    const positiveWords = ['tốt', 'tuyệt vời', 'nhanh', 'hài lòng', 'uy tín', 'chất lượng', 'đẹp', 'ổn', 'ok']
    const negativeWords = ['tệ', 'chậm', 'xấu', 'thất vọng', 'lừa đảo', 'hỏng', 'hư', 'dở']

    const textLower = text.toLowerCase()
    let score = 0

    positiveWords.forEach(word => {
        if (textLower.includes(word)) score += 0.2
    })

    negativeWords.forEach(word => {
        if (textLower.includes(word)) score -= 0.3
    })

    // Clamp score between -1 and 1
    score = Math.max(-1, Math.min(1, score))

    let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL'
    if (score > 0.2) sentiment = 'POSITIVE'
    else if (score < -0.2) sentiment = 'NEGATIVE'

    return {
        sentiment,
        score: Math.round(score * 1000) / 1000,
        confidence: 0.5,
        aspects: {},
        keywords: { positive: [], negative: [] }
    }
}
