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

export async function GET(request: NextRequest) {
  try {
    const tokenPayload = verifyTokenFromRequest(request)
    if (!tokenPayload || !['MANAGER', 'EMPLOYEE'].includes(tokenPayload.role)) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined

    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: isActive !== undefined ? isActive : undefined
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(createSuccessResponse(promotions))
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const existing = await prisma.promotion.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json(createErrorResponse('Mã khuyến mãi đã tồn tại', 'ALREADY_EXISTS'), { status: 400 })
    }

    const promotion = await prisma.promotion.create({
      data: validation.data
    })

    return NextResponse.json(createSuccessResponse(promotion, 'Created successfully'), { status: 201 })
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
  }
}
