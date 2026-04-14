import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const limit = parseInt(searchParams.get('limit') || '4')

    if (!categoryId) {
      return NextResponse.json(createErrorResponse('Category ID is required', 'VALIDATION_ERROR'), { status: 400 })
    }

    // Get products from the same category
    // Prioritize products with active discounts or marked as clearance
    const products = await prisma.product.findMany({
      where: {
        categoryId,
        isActive: true,
      },
      include: {
        category: true,
      },
      // Fetch more than limit to perform internal prioritization if needed
      take: limit * 2, 
      orderBy: [
        { isFeatured: 'desc' }, 
        { updatedAt: 'desc' }
      ]
    })

    // Return the top ones based on limit
    return NextResponse.json(createSuccessResponse(products.slice(0, limit)))
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
  }
}
