import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const cartRecommendationSchema = z.object({
  productIds: z.array(z.string()).min(1, 'At least one product ID is required'),
  limit: z.number().optional().default(8),
})

/**
 * Get recommendations based on cart items
 * Similar to Shopee's cart recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = cartRecommendationSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid request', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { productIds, limit } = validation.data

    // Get cart products details
    const cartProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true }
    })

    const cartCategories = [...new Set(cartProducts.map(p => p.categoryId))]

    // Strategy 1: Frequently bought together with cart items
    const frequentlyBoughtTogether = await getFrequentlyBoughtTogether(productIds, limit)

    // Strategy 2: Similar products in same categories
    const similarProducts = await getSimilarProducts(productIds, cartCategories, limit)

    // Strategy 3: Top-rated products in cart categories
    const topRated = await getTopRatedInCategories(cartCategories, limit)

    // Combine and deduplicate recommendations
    const allRecommendations = [
      ...frequentlyBoughtTogether,
      ...similarProducts,
      ...topRated
    ]

    // Remove duplicates and cart items
    const seen = new Set(productIds)
    const unique: any[] = []

    for (const rec of allRecommendations) {
      if (!seen.has(rec.id) && unique.length < limit) {
        seen.add(rec.id)
        unique.push(rec)
      }
    }

    return NextResponse.json(
      createSuccessResponse(
        {
          recommendations: unique,
          count: unique.length,
          strategies: {
            frequentlyBoughtTogether: frequentlyBoughtTogether.length,
            similarProducts: similarProducts.length,
            topRated: topRated.length
          }
        },
        'Cart recommendations generated successfully'
      ),
      { status: 200 }
    )
  } catch (error) {
    console.error('Cart recommendations error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

/**
 * Find products frequently bought together with cart items
 */
async function getFrequentlyBoughtTogether(cartProductIds: string[], limit: number) {
  // Find orders containing any cart products
  const orders = await prisma.order.findMany({
    where: {
      orderItems: {
        some: {
          productId: { in: cartProductIds }
        }
      },
      status: { in: ['DELIVERED', 'SHIPPED'] } // Use actual OrderStatus enum values
    },
    include: {
      orderItems: {
        where: {
          productId: { notIn: cartProductIds }
        },
        include: {
          product: {
            include: {
              category: true,
              inventoryItem: true,
              productReviews: {
                where: { isPublished: true },
                select: { rating: true }
              }
            }
          }
        }
      }
    },
    take: 100
  })

  // Count product occurrences
  const productCounts = new Map<string, { count: number; product: any }>()

  orders.forEach(order => {
    order.orderItems.forEach(item => {
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
    })
  })

  // Convert to array and sort by frequency
  return Array.from(productCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ count, product }) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      images: product.images,
      category: product.category.name,
      inStock: product.inventoryItem ? product.inventoryItem.availableQuantity > 0 : true,
      availableQuantity: product.inventoryItem?.availableQuantity || 0,
      rating: calculateAverageRating(product.productReviews),
      reviewCount: product.productReviews.length,
      reason: 'Thường được mua cùng',
      badge: '🔥 Mua cùng',
      confidence: Math.min(count / 10, 1)
    }))
}

/**
 * Find similar products in the same categories
 */
async function getSimilarProducts(
  cartProductIds: string[],
  cartCategories: string[],
  limit: number
) {
  const products = await prisma.product.findMany({
    where: {
      categoryId: { in: cartCategories },
      id: { notIn: cartProductIds },
      isActive: true
    },
    include: {
      category: true,
      inventoryItem: true,
      productReviews: {
        where: { isPublished: true },
        select: { rating: true }
      },
      orderItems: {
        select: { id: true }
      }
    },
    take: limit * 2 // Get more to sort in memory
  })

  // Sort by order count in memory
  const sorted = products
    .map(product => ({
      ...product,
      orderCount: product.orderItems.length
    }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, limit)

  return sorted.map(product => ({
    id: product.id,
    name: product.name,
    price: product.price,
    unit: product.unit,
    images: product.images,
    category: product.category.name,
    inStock: product.inventoryItem ? product.inventoryItem.availableQuantity > 0 : true,
    availableQuantity: product.inventoryItem?.availableQuantity || 0,
    rating: calculateAverageRating(product.productReviews),
    reviewCount: product.productReviews.length,
    reason: 'Sản phẩm tương tự',
    badge: '✨ Gợi ý',
    confidence: 0.8
  }))
}

/**
 * Get top-rated products in cart categories
 */
async function getTopRatedInCategories(cartCategories: string[], limit: number) {
  const products = await prisma.product.findMany({
    where: {
      categoryId: { in: cartCategories },
      isActive: true,
      productReviews: {
        some: {
          isPublished: true
        }
      }
    },
    include: {
      category: true,
      inventoryItem: true,
      productReviews: {
        where: { isPublished: true },
        select: { rating: true }
      }
    },
    take: limit * 3 // Get more to filter and sort
  })

  // Calculate ratings and filter
  const withRatings = products
    .map(product => ({
      ...product,
      avgRating: calculateAverageRating(product.productReviews),
      reviewCount: product.productReviews.length
    }))
    .filter(p => p.reviewCount >= 2 && p.avgRating >= 4) // Min 2 reviews, 4+ stars
    .sort((a, b) => {
      // Sort by rating first, then review count
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating
      return b.reviewCount - a.reviewCount
    })
    .slice(0, limit)

  return withRatings.map(product => ({
    id: product.id,
    name: product.name,
    price: product.price,
    unit: product.unit,
    images: product.images,
    category: product.category.name,
    inStock: product.inventoryItem ? product.inventoryItem.availableQuantity > 0 : true,
    availableQuantity: product.inventoryItem?.availableQuantity || 0,
    rating: product.avgRating,
    reviewCount: product.reviewCount,
    reason: 'Đánh giá cao',
    badge: '⭐ Top rated',
    confidence: 0.9
  }))
}

/**
 * Calculate average rating from reviews
 */
function calculateAverageRating(reviews: { rating: number }[]): number {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10 // Round to 1 decimal
}
