/**
 * GET /api/chatbot/ocr-result?jobId=xxx
 *
 * Client polls this to check if an async OCR job is complete.
 * Returns:
 *   - { status: 'pending' | 'processing' }  → still working
 *   - { status: 'done', response: {...} }    → ready
 *   - { status: 'failed', error: '...' }     → error
 *   - 404 if jobId not found / expired
 */
import { NextRequest, NextResponse } from 'next/server'
import { getOCRResult } from '@/lib/ocr-queue'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
    const jobId = request.nextUrl.searchParams.get('jobId')

    if (!jobId) {
        return NextResponse.json(
            createErrorResponse('jobId is required', 'VALIDATION_ERROR'),
            { status: 400 }
        )
    }

    const result = await getOCRResult(jobId)

    if (!result) {
        return NextResponse.json(
            createErrorResponse('Job not found or expired', 'NOT_FOUND'),
            { status: 404 }
        )
    }

    return NextResponse.json(
        createSuccessResponse(result),
        { status: 200 }
    )
}
