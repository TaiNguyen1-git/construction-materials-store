import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    
    // Test 1: Simple count
    const productCount = await prisma.product.count()
    
    // Test 2: Find all products
    const allProducts = await prisma.product.findMany()
    
    // Test 3: Find with relations
    const productsWithRelations = await prisma.product.findMany({
      include: {
        category: true,
        inventoryItem: true
      },
      take: 5
    })
    
    return NextResponse.json({
      success: true,
      data: {
        totalCount: productCount,
        productsFound: allProducts.length,
        withRelations: productsWithRelations.length,
        sampleProduct: productsWithRelations[0] || null
      }
    })
  } catch (error: any) {
    console.error('❌ Error in test endpoint:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
