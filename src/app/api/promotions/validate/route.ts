import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function POST(request: NextRequest) {
  try {
    const { code, orderAmount } = await request.json()

    if (!code) {
      return NextResponse.json(createErrorResponse('Mã khuyến mãi không được để trống', 'MISSING_CODE'), { status: 400 })
    }

    const promotion = await prisma.promotion.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!promotion) {
      return NextResponse.json(createErrorResponse('Mã khuyến mãi không hợp lệ', 'INVALID_CODE'), { status: 404 })
    }

    if (!promotion.isActive) {
      return NextResponse.json(createErrorResponse('Mã khuyến mãi đã bị vô hiệu hóa', 'INACTIVE_CODE'), { status: 400 })
    }

    const now = new Date()
    if (now < promotion.startDate) {
      return NextResponse.json(createErrorResponse('Chương trình khuyến mãi chưa bắt đầu', 'NOT_STARTED'), { status: 400 })
    }

    if (now > promotion.endDate) {
      return NextResponse.json(createErrorResponse('Mã khuyến mãi đã hết hạn', 'EXPIRED_CODE'), { status: 400 })
    }

    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      return NextResponse.json(createErrorResponse('Mã khuyến mãi đã hết lượt sử dụng', 'LIMIT_REACHED'), { status: 400 })
    }

    if (orderAmount < promotion.minOrderAmount) {
      return NextResponse.json(createErrorResponse(`Đơn hàng tối thiểu ${promotion.minOrderAmount.toLocaleString()}đ để sử dụng mã này`, 'MIN_AMOUNT_NOT_MET'), { status: 400 })
    }

    // Calculate discount
    let discountAmount = 0
    if (promotion.discountType === 'PERCENTAGE') {
      discountAmount = (orderAmount * promotion.discountValue) / 100
      if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
        discountAmount = promotion.maxDiscountAmount
      }
    } else {
      discountAmount = promotion.discountValue
    }

    return NextResponse.json(createSuccessResponse({
      id: promotion.id,
      code: promotion.code,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      discountAmount: Math.round(discountAmount)
    }, 'Mã khuyến mãi hợp lệ'))
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
  }
}
