import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { updateContractorTrustScore } from '@/lib/trust-score'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const body = await request.json()
        const userId = request.headers.get('x-user-id')

        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const { rating, comment, title, projectId, priceAccuracy, materialQuality } = body

        if (!rating || !comment) {
            return NextResponse.json(
                createErrorResponse('Vui lòng nhập điểm đánh giá và nhận xét', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Create the review with Flow 5 metrics
        const review = await (prisma as any).contractorReview.create({
            data: {
                contractorId: id,
                reviewerId: userId,
                projectId: projectId || null,
                rating,
                priceAccuracy: priceAccuracy || 5,
                materialQuality: materialQuality || 5,
                title: title || null,
                comment,
                isApproved: true,
                isHidden: false
            }
        })

        // Flow 5: Trigger Trust Score update
        await updateContractorTrustScore(id)

        return NextResponse.json(
            createSuccessResponse(review, 'Cảm ơn bạn đã đánh giá. Điểm tín nhiệm của nhà thầu đã được cập nhật.')
        )

    } catch (error: any) {
        console.error('Submit review error:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ', 'INTERNAL_ERROR'), { status: 500 })
    }
}
