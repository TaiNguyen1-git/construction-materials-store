import { NextRequest, NextResponse } from 'next/server'
import { getFengshuiAdvice } from '@/lib/fengshui-ai'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { checkRateLimit, getRateLimitIdentifier, RateLimitConfigs, formatRateLimitError } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
        const rateLimitId = getRateLimitIdentifier(ip, undefined, 'ai_fengshui')
        const rateLimitResult = await checkRateLimit(rateLimitId, RateLimitConfigs.AI_API.GUEST)

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                createErrorResponse(formatRateLimitError(rateLimitResult), 'RATE_LIMIT_EXCEEDED'),
                { status: 429 }
            )
        }

        const { year, direction, projectType } = await request.json()

        if (!year || !direction) {
            return NextResponse.json(createErrorResponse('Vui lòng nhập năm sinh và hướng nhà', 'VALIDATION_ERROR'), { status: 400 })
        }

        const advice = await getFengshuiAdvice(parseInt(year), direction, projectType || 'Tổng quát')

        return NextResponse.json(createSuccessResponse({ advice }))
    } catch (error: any) {
        console.error('Fengshui API Error:', error)
        return NextResponse.json(createErrorResponse('Lỗi hệ thống khi tư vấn phong thủy', 'INTERNAL_ERROR'), { status: 500 })
    }
}
