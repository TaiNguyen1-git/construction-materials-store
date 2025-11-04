import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    console.log('Fetching product with ID:', id)

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Product ID is required' } },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        inventoryItem: {
          select: {
            availableQuantity: true,
            reservedQuantity: true,
            quantity: true,
            minStockLevel: true,
            maxStockLevel: true,
            reorderPoint: true,
            lastStockDate: true
          }
        }
      }
    })

    console.log('Product found:', product ? 'Yes' : 'No')

    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: true, data: product, message: 'Product retrieved successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching product:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to fetch product' 
        } 
      },
      { status: 500 }
    )
  }
}
