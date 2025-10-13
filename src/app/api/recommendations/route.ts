import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { CacheService } from '@/lib/cache'
import { mlRecommendations } from '@/lib/ml-recommendations'

const recommendationQuerySchema = z.object({
  customerId: z.string().optional(),
  productId: z.string().optional(),
  type: z.enum(['RELATED', 'FREQUENTLY_BOUGHT_TOGETHER', 'CUSTOMER_BASED', 'REORDER', 'ML_HYBRID']).default('RELATED'),
  limit: z.string().optional().default('10').transform(val => parseInt(val)),
  includeOutOfStock: z.string().optional().transform(val => val !== 'false'),
  useML: z.string().optional().transform(val => val === 'true').default(true), // Enable ML by default
})

// Mock recommendation algorithms (in production, these would use ML models)
async function getRelatedProducts(productId: string, limit: number): Promise<any[]> {
  // Get the product and its category
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true }
  })

  if (!product) return []

  // Find products in the same category, excluding the current product
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: productId },
      isActive: true
    },
    include: {
      category: true,
      inventoryItem: true,
      _count: {
        select: { orderItems: true }
      }
    },
    orderBy: [
      { _count: { orderItems: 'desc' } }, // Most ordered first
      { price: 'asc' } // Then by price
    ],
    take: limit
  })

  return relatedProducts.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    unit: p.unit,
    images: p.images,
    category: p.category.name,
    inStock: p.inventoryItem ? p.inventoryItem.availableQuantity > 0 : false,
    orderCount: p._count.orderItems,
    recommendationScore: 0.9,
    reason: 'Related product'
  }))
}

async function getFrequentlyBoughtTogether(productId: string, limit: number): Promise<any[]> {
  // Find orders that contain this product
  const orders = await prisma.order.findMany({
    where: {
      orderItems: {
        some: {
          productId: productId
        }
      },
      status: 'COMPLETED'
    },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              category: true,
              inventoryItem: true
            }
          }
        }
      }
    },
    take: 50 // Limit to recent 50 orders for performance
  })

  // Count how often other products appear with this product
  const productCounts = new Map<string, { count: number, product: any }>()
  
  orders.forEach(order => {
    order.orderItems.forEach(item => {
      if (item.productId !== productId) {
        const current = productCounts.get(item.productId)
        if (current) {
          productCounts.set(item.productId, {
            count: current.count + 1,
            product: item.product
          })
        } else {
          productCounts.set(item.productId, {
            count: 1,
            product: item.product
          })
        }
      }
    })
  })

  // Convert to array and sort by frequency
  const sortedProducts = Array.from(productCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)

  return sortedProducts.map(({ count, product }) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    unit: product.unit,
    images: product.images,
    category: product.category.name,
    inStock: product.inventoryItem ? product.inventoryItem.availableQuantity > 0 : false,
    orderCount: count,
    recommendationScore: Math.min(1, count / 10), // Normalize score
    reason: 'Frequently bought together'
  }))
}

async function getCustomerBasedRecommendations(customerId: string, limit: number): Promise<any[]> {
  // Find customer's order history
  const orders = await prisma.order.findMany({
    where: {
      customerId: customerId,
      status: 'COMPLETED'
    },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              category: true,
              inventoryItem: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10 // Last 10 orders
  })

  // Get all products the customer has bought
  const customerProducts = new Set<string>()
  orders.forEach(order => {
    order.orderItems.forEach(item => {
      customerProducts.add(item.productId)
    })
  })

  // Find other customers who bought similar products
  const similarCustomers = await prisma.order.findMany({
    where: {
      customerId: { not: customerId },
      orderItems: {
        some: {
          productId: { in: Array.from(customerProducts) }
        }
      },
      status: 'COMPLETED'
    },
    include: {
      customer: {
        select: { id: true }
      },
      orderItems: {
        include: {
          product: {
            include: {
              category: true,
              inventoryItem: true
            }
          }
        }
      }
    },
    take: 50 // Limit for performance
  })

  // Count products bought by similar customers (excluding ones the customer already bought)
  const productCounts = new Map<string, { count: number, product: any }>()
  
  similarCustomers.forEach(order => {
    order.orderItems.forEach(item => {
      if (!customerProducts.has(item.productId)) {
        const current = productCounts.get(item.productId)
        if (current) {
          productCounts.set(item.productId, {
            count: current.count + 1,
            product: item.product
          })
        } else {
          productCounts.set(item.productId, {
            count: 1,
            product: item.product
          })
        }
      }
    })
  })

  // Convert to array and sort by frequency
  const sortedProducts = Array.from(productCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)

  return sortedProducts.map(({ count, product }) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    unit: product.unit,
    images: product.images,
    category: product.category.name,
    inStock: product.inventoryItem ? product.inventoryItem.availableQuantity > 0 : false,
    orderCount: count,
    recommendationScore: Math.min(1, count / 5), // Normalize score
    reason: 'Recommended for you'
  }))
}

async function getReorderRecommendations(limit: number): Promise<any[]> {
  // Find products that are low in stock but frequently ordered
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      inventoryItem: {
        availableQuantity: {
          lte: prisma.inventoryItem.fields.reorderPoint
        }
      }
    },
    include: {
      category: true,
      inventoryItem: true,
      _count: {
        select: { orderItems: true }
      }
    },
    orderBy: [
      { inventoryItem: { availableQuantity: 'asc' } }, // Lowest stock first
      { _count: { orderItems: 'desc' } } // Most ordered first
    ],
    take: limit
  })

  return products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    unit: p.unit,
    images: p.images,
    category: p.category.name,
    inStock: p.inventoryItem ? p.inventoryItem.availableQuantity > 0 : false,
    availableQuantity: p.inventoryItem?.availableQuantity || 0,
    reorderPoint: p.inventoryItem?.reorderPoint || 0,
    orderCount: p._count.orderItems,
    recommendationScore: 0.95,
    reason: 'Low stock - needs reordering'
  }))
}

async function getPopularProducts(limit: number): Promise<any[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      inventoryItem: true,
      _count: {
        select: { orderItems: true }
      }
    },
    orderBy: [
      { _count: { orderItems: 'desc' } },
      { price: 'asc' }
    ],
    take: limit
  })

  return products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    unit: p.unit,
    images: p.images,
    category: p.category.name,
    inStock: p.inventoryItem ? p.inventoryItem.availableQuantity > 0 : false,
    orderCount: p._count.orderItems,
    recommendationScore: 0.8,
    reason: 'Popular product'
  }))
}

// GET /api/recommendations - Get product recommendations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const validation = recommendationQuerySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { customerId, productId, type, limit, includeOutOfStock, useML } = validation.data

    // Create cache key based on parameters
    const cacheKey = `recommendations:${type}:${customerId || 'none'}:${productId || 'none'}:${limit}:${includeOutOfStock}:${useML ? 'ml' : 'rule'}`
    
    // Try to get from cache first
    const cachedResult = await CacheService.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json(
        createSuccessResponse(cachedResult, 'Recommendations retrieved successfully from cache'),
        { status: 200 }
      )
    }

    let recommendations: any[] = []
    let method = 'rule-based'

    // Use ML hybrid approach if enabled
    if (useML && (type === 'RELATED' || type === 'CUSTOMER_BASED' || type === 'ML_HYBRID')) {
      try {
        console.log(`🤖 Using ML-enhanced recommendations for type: ${type}`)
        
        // Get ML hybrid recommendations
        const mlScores = await mlRecommendations.getHybridRecommendations(
          productId,
          customerId,
          type === 'CUSTOMER_BASED' ? 'PERSONALIZED' : 'SIMILAR',
          limit
        )

        // Enrich with product details
        recommendations = await mlRecommendations.enrichRecommendations(mlScores)
        method = 'ml-hybrid'
        
        console.log(`✅ ML recommendations: ${recommendations.length} products`)
      } catch (mlError) {
        console.error('ML recommendations failed, falling back to rule-based:', mlError)
        // Will fallback to rule-based below
      }
    }

    // Fallback to rule-based or if ML not applicable
    if (recommendations.length === 0) {
      console.log(`📊 Using rule-based recommendations for type: ${type}`)

      switch (type) {
        case 'RELATED':
        case 'ML_HYBRID':
          if (productId) {
            recommendations = await getRelatedProducts(productId, limit)
          } else {
            recommendations = await getPopularProducts(limit)
          }
          break
        case 'FREQUENTLY_BOUGHT_TOGETHER':
          if (productId) {
            recommendations = await getFrequentlyBoughtTogether(productId, limit)
          } else {
            recommendations = await getPopularProducts(limit)
          }
          break
        case 'CUSTOMER_BASED':
          if (customerId) {
            recommendations = await getCustomerBasedRecommendations(customerId, limit)
          } else {
            recommendations = await getPopularProducts(limit)
          }
          break
        case 'REORDER':
          recommendations = await getReorderRecommendations(limit)
          break
        default:
          recommendations = await getPopularProducts(limit)
      }
    }

    // Filter out of stock items if requested
    if (!includeOutOfStock) {
      recommendations = recommendations.filter(r => r.inStock)
    }

    // Add metadata
    const response = {
      recommendations,
      metadata: {
        type,
        method, // 'ml-hybrid' or 'rule-based'
        count: recommendations.length,
        customerId: customerId || null,
        productId: productId || null
      }
    }

    // Cache the result for 5 minutes
    await CacheService.set(cacheKey, response, 300)

    return NextResponse.json(
      createSuccessResponse(response, `Recommendations generated successfully using ${method}`),
      { status: 200 }
    )

  } catch (error) {
    console.error('Get recommendations error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}