/**
 * API: Delivery Phase Actions
 * PATCH /api/enterprise/delivery-phases/[id] - Update status, confirm, release
 */

import { NextRequest, NextResponse } from 'next/server'
import { DeliveryPhaseService } from '@/lib/delivery-phase-service'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const updateSchema = z.object({
    action: z.enum(['UPDATE_STATUS', 'PROCESS_DEPOSIT', 'ESCROW', 'CONFIRM_RELEASE']),

    // For UPDATE_STATUS
    status: z.enum(['PENDING', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'CONFIRMED', 'CANCELLED']).optional(),
    trackingNumber: z.string().optional(),
    carrierName: z.string().optional(),
    deliveryProof: z.string().optional(),
    receiverName: z.string().optional(),
    receiverSignature: z.string().optional(),

    // For PROCESS_DEPOSIT
    paidAmount: z.number().optional(),
    paymentMethod: z.string().optional(),

    // For ESCROW
    walletId: z.string().optional(),

    // For CONFIRM_RELEASE
    recipientWalletId: z.string().optional()
})

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const validation = updateSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Dữ liệu không hợp lệ', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const { action, ...data } = validation.data
        let result: { success: boolean; error?: string }

        switch (action) {
            case 'UPDATE_STATUS':
                if (!data.status) {
                    return NextResponse.json(
                        createErrorResponse('Missing status', 'BAD_REQUEST'),
                        { status: 400 }
                    )
                }
                result = await DeliveryPhaseService.updateStatus(params.id, data.status, {
                    trackingNumber: data.trackingNumber,
                    carrierName: data.carrierName,
                    deliveryProof: data.deliveryProof,
                    receiverName: data.receiverName,
                    receiverSignature: data.receiverSignature
                })
                break

            case 'PROCESS_DEPOSIT':
                if (!data.paidAmount || !data.paymentMethod) {
                    return NextResponse.json(
                        createErrorResponse('Missing paidAmount or paymentMethod', 'BAD_REQUEST'),
                        { status: 400 }
                    )
                }
                result = await DeliveryPhaseService.processDeposit(
                    params.id,
                    data.paidAmount,
                    data.paymentMethod
                )
                break

            case 'ESCROW':
                if (!data.walletId) {
                    return NextResponse.json(
                        createErrorResponse('Missing walletId', 'BAD_REQUEST'),
                        { status: 400 }
                    )
                }
                result = await DeliveryPhaseService.escrowPhase(params.id, data.walletId)
                break

            case 'CONFIRM_RELEASE':
                if (!data.recipientWalletId) {
                    return NextResponse.json(
                        createErrorResponse('Missing recipientWalletId', 'BAD_REQUEST'),
                        { status: 400 }
                    )
                }
                result = await DeliveryPhaseService.confirmAndRelease(
                    params.id,
                    userId,
                    data.recipientWalletId
                )
                break

            default:
                return NextResponse.json(
                    createErrorResponse('Invalid action', 'BAD_REQUEST'),
                    { status: 400 }
                )
        }

        if (!result.success) {
            return NextResponse.json(
                createErrorResponse(result.error || 'Thao tác thất bại', 'INTERNAL_ERROR'),
                { status: 400 }
            )
        }

        return NextResponse.json(
            createSuccessResponse({ success: true }, 'Thao tác thành công')
        )
    } catch (error: any) {
        console.error('Delivery phase update error:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

// GET - Get phase details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const phase = await DeliveryPhaseService.getPhase(params.id)

        if (!phase) {
            return NextResponse.json(
                createErrorResponse('Không tìm thấy đợt giao', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        return NextResponse.json(createSuccessResponse({ phase }))
    } catch (error: any) {
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
