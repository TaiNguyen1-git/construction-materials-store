import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 Testing Prisma in API route...')
    
    // Test 1: Simple count
    const productCount = await prisma.product.count()
    console.log('✅ Product count:', productCount)
    
    // Test 2: Find all products
    const allProducts = await prisma.product.findMany()
    console.log('✅ Products found:', allProducts.length)
    
    // Test 3: Find with relations
    const productsWithRelations = await prisma.product.findMany({
      include: {
        category: true,
        inventoryItem: true
      },
      take: 5
    })
    console.log('✅ Products with relations:', productsWithRelations.length)
    
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
