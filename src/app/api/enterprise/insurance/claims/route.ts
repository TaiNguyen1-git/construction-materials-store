/**
 * API: Insurance Claims
 * POST - File a claim
 * PATCH - Review claim
 */

import { NextRequest, NextResponse } from 'next/server'
import { InsuranceService } from '@/lib/insurance-service'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const fileClaimSchema = z.object({
    insuranceId: z.string(),
    incidentDate: z.string().transform(s => new Date(s)),
    description: z.string().min(10),
    damageType: z.string(),
    estimatedLoss: z.number().positive(),
    claimAmount: z.number().positive(),
    photos: z.array(z.string()).optional(),
    documents: z.array(z.string()).optional()
})

const reviewClaimSchema = z.object({
    claimId: z.string(),
    decision: z.enum(['APPROVED', 'REJECTED']),
    approvedAmount: z.number().optional(),
    reviewNotes: z.string().optional()
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validation = fileClaimSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Dữ liệu không hợp lệ', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const result = await InsuranceService.fileClaim(validation.data)

        if (!result.success) {
            return NextResponse.json(
                createErrorResponse(result.error || 'Lỗi gửi yêu cầu bồi thường', 'INTERNAL_ERROR'),
                { status: 400 }
            )
        }

        return NextResponse.json(
            createSuccessResponse({
                claimId: result.claimId,
                claimNumber: result.claimNumber
            }, 'Đã gửi yêu cầu bồi thường thành công'),
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Claim API error:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const validation = reviewClaimSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Dữ liệu không hợp lệ', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const { claimId, decision, approvedAmount, reviewNotes } = validation.data

        const result = await InsuranceService.reviewClaim(
            claimId,
            userId,
            decision,
            { approvedAmount, reviewNotes }
        )

        if (!result.success) {
            return NextResponse.json(
                createErrorResponse(result.error || 'Lỗi xử lý yêu cầu', 'INTERNAL_ERROR'),
                { status: 400 }
            )
        }

        return NextResponse.json(
            createSuccessResponse({ success: true }, `Yêu cầu bồi thường đã được ${decision === 'APPROVED' ? 'duyệt' : 'từ chối'}`)
        )
    } catch (error: any) {
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
