import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'
import { z } from 'zod'

const promotionSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().nonnegative().default(0),
  maxDiscountAmount: z.number().positive().nullable().optional(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  usageLimit: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true)
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenPayload = verifyTokenFromRequest(request)
    if (!tokenPayload || !['MANAGER', 'EMPLOYEE'].includes(tokenPayload.role)) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    const promotion = await prisma.promotion.findUnique({
      where: { id: params.id }
    })

    if (!promotion) {
      return NextResponse.json(createErrorResponse('Not found', 'NOT_FOUND'), { status: 404 })
    }

    return NextResponse.json(createSuccessResponse(promotion))
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenPayload = verifyTokenFromRequest(request)
    if (!tokenPayload || !['MANAGER', 'EMPLOYEE'].includes(tokenPayload.role)) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    const body = await request.json()
    const validation = promotionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.format()), { status: 400 })
    }

    const { code } = validation.data
    const existing = await prisma.promotion.findFirst({
      where: { 
        code,
        id: { not: params.id }
      }
    })
    
    if (existing) {
      return NextResponse.json(createErrorResponse('Mã khuyến mãi đã tồn tại', 'ALREADY_EXISTS'), { status: 400 })
    }

    const promotion = await prisma.promotion.update({
      where: { id: params.id },
      data: validation.data
    })

    return NextResponse.json(createSuccessResponse(promotion, 'Updated successfully'))
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenPayload = verifyTokenFromRequest(request)
    if (!tokenPayload || !['MANAGER', 'EMPLOYEE'].includes(tokenPayload.role)) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    // Check if used in any orders
    const orderCount = await prisma.order.count({
      where: { promotionId: params.id }
    })

    if (orderCount > 0) {
      // If used, just deactivate it instead of deleting
      await prisma.promotion.update({
        where: { id: params.id },
        data: { isActive: false }
      })
      return NextResponse.json(createSuccessResponse(null, 'Mã đã được vô hiệu hóa thay vì xóa do đã có đơn hàng sử dụng'))
    }

    await prisma.promotion.delete({
      where: { id: params.id }
    })

    return NextResponse.json(createSuccessResponse(null, 'Deleted successfully'))
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
  }
}
