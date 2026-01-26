/**
 * API: Contract Signing
 * POST /api/enterprise/contracts/[id]/sign - Sign contract
 */

import { NextRequest, NextResponse } from 'next/server'
import { EContractService } from '@/lib/e-contract-service'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const signSchema = z.object({
    party: z.enum(['A', 'B']),
    method: z.enum(['OTP', 'DIGITAL_CERT', 'DRAW']),
    signatureData: z.string().optional(),
    otpCode: z.string().optional(),
    certSerialNumber: z.string().optional()
})

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const validation = signSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Dữ liệu không hợp lệ', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const { party, method, signatureData, otpCode, certSerialNumber } = validation.data

        // Get client IP
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'Unknown'

        const result = await EContractService.signContract(
            params.id,
            party,
            {
                method,
                signatureData,
                otpCode,
                certSerialNumber,
                ipAddress,
                userAgent: request.headers.get('user-agent') || undefined
            },
            userId
        )

        if (!result.success) {
            return NextResponse.json(
                createErrorResponse(result.error || 'Lỗi ký hợp đồng', 'INTERNAL_ERROR'),
                { status: 400 }
            )
        }

        return NextResponse.json(
            createSuccessResponse({
                signed: true,
                fullySignd: result.fullySignd
            }, result.fullySignd ? 'Hợp đồng đã có đầy đủ chữ ký!' : 'Đã ký thành công, chờ bên còn lại ký')
        )
    } catch (error: any) {
        console.error('Contract sign error:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

// GET - Get contract details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const contract = await EContractService.getContract(params.id)

        if (!contract) {
            return NextResponse.json(
                createErrorResponse('Không tìm thấy hợp đồng', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        return NextResponse.json(createSuccessResponse({ contract }))
    } catch (error: any) {
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
