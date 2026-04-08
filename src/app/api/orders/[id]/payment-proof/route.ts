import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { PurchaseService } from '@/lib/purchase-service'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const paymentProofSchema = z.object({
  proofImageUrl: z.string().url('Minh chứng phải là một đường dẫn hợp lệ')
})

/**
 * POST /api/orders/[id]/payment-proof
 * Khách hàng upload minh chứng thanh toán
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const body = await request.json()
    
    const validation = paymentProofSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Dữ liệu không hợp lệ', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { proofImageUrl } = validation.data

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json(
        createErrorResponse('Không tìm thấy đơn hàng', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Chỉ cho phép upload minh chứng cho các đơn đang chờ thanh toán
    const allowedStatuses = ['PENDING', 'PENDING_CONFIRMATION', 'CONFIRMED_AWAITING_DEPOSIT']
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json(
        createErrorResponse('Đơn hàng không ở trạng thái chờ thanh toán', 'INVALID_STATE'),
        { status: 400 }
      )
    }

    // Thực hiện gia hạn và lưu minh chứng qua PurchaseService
    await prisma.$transaction(async (tx) => {
      await PurchaseService.extendReservationOnProofUpload(tx, orderId, proofImageUrl)
      
      // Tạo lịch sử order
      await tx.orderTracking.create({
        data: {
          orderId,
          status: order.status,
          description: 'Khách hàng đã tải lên minh chứng thanh toán. Thời gian giữ hàng được gia hạn thêm 24h để Admin đối soát.',
          createdBy: 'CUSTOMER'
        }
      })
    })

    return NextResponse.json(
      createSuccessResponse(null, 'Tải minh chứng thành công. Hệ thống đã gia hạn thời gian giữ hàng cho bạn.'),
      { status: 200 }
    )

  } catch (error: any) {
    logger.error('Upload payment proof error:', error)
    return NextResponse.json(
      createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
