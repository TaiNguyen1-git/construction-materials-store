import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { KNOWLEDGE_BASE } from '@/lib/knowledge-base'
import { mlRecommendations } from '@/lib/ml-recommendations'

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

    // Strategy 1: ML-Powered Frequently bought together (Collaborative Filtering)
    const mlScores = await mlRecommendations.getFrequentlyBoughtTogether(productIds, limit)
    const mlRecommendationsData = await mlRecommendations.enrichRecommendations(mlScores)
    const frequentlyBoughtTogether = mlRecommendationsData.map((p: any) => ({
      ...p,
      badge: '🔥 ML Gợi ý',
      confidence: 0.95
    }))

    // Strategy 2: Complementary products based on knowledge base
    const complementaryProducts = await getComplementaryProducts(cartProducts, limit)

    // Strategy 3: AI Smart Recommendations (Gemini)
    // This is crucial when we don't have enough order history or strict KB matches
    let aiRecommendations: any[] = []
    if (frequentlyBoughtTogether.length < 2 && complementaryProducts.length < 2) {
      try {
        const { default: AIService } = await import('@/lib/ai-service')
        const aiResults = await AIService.getSmartRecommendations({
          cartItems: cartProducts.map(p => ({
            name: p.name,
            category: p.category.name,
            price: p.price
          }))
        })

        // Map AI results to DB products
        for (const rec of aiResults) {
          const dbProduct = await prisma.product.findFirst({
            where: {
              name: { contains: rec.name.split(' ')[0] }, // Fuzzy match
              isActive: true,
              id: { notIn: productIds }
            },
            include: {
              category: true,
              inventoryItem: true,
              productReviews: {
                where: { isPublished: true },
                select: { rating: true }
              }
            }
          })

          if (dbProduct) {
            aiRecommendations.push({
              id: dbProduct.id,
              name: dbProduct.name,
              price: dbProduct.price,
              unit: dbProduct.unit,
              images: dbProduct.images,
              category: dbProduct.category.name,
              inStock: dbProduct.inventoryItem ? dbProduct.inventoryItem.availableQuantity > 0 : false,
              rating: calculateAverageRating(dbProduct.productReviews),
              reviewCount: dbProduct.productReviews.length,
              reason: rec.reason || 'Sản phẩm tương tự',
              badge: '✨ AI Gợi ý',
              confidence: 0.9,
              wholesalePrice: dbProduct.wholesalePrice,
              minWholesaleQty: dbProduct.minWholesaleQty
            })
          }
        }
      } catch (error) {
        console.error('Gemini cart recommendation error:', error)
      }
    }

    // Combine and deduplicate recommendations
    const allRecommendations = [
      ...aiRecommendations,
      ...complementaryProducts,
      ...frequentlyBoughtTogether
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
            mlRecommendations: frequentlyBoughtTogether.length,
            complementaryProducts: complementaryProducts.length,
            aiRecommendations: aiRecommendations.length
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
 * Find complementary products based on knowledge base commonCombinations
 * Enhanced with fuzzy matching, category-based recommendations, and fallbacks
 */
async function getComplementaryProducts(
  cartProducts: any[],
  limit: number
) {
  // Extract all commonCombinations from cart products via knowledge base
  const allCombinations: string[] = []
  const cartCategoryIds = [...new Set(cartProducts.map(p => p.categoryId))]

  for (const cartProduct of cartProducts) {
    // Try multiple matching strategies for knowledge base lookup
    const kbProduct = KNOWLEDGE_BASE.find(kb => {
      const cartName = cartProduct.name.toLowerCase()
      const kbName = kb.name.toLowerCase()

      // 1. Exact partial match
      if (cartName.includes(kbName) || kbName.includes(cartName)) return true

      // 2. Match by first significant word (e.g., "Xi măng" -> match "Xi măng INSEE PC40")
      const cartFirstWords = cartName.split(' ').slice(0, 2).join(' ')
      const kbFirstWords = kbName.split(' ').slice(0, 2).join(' ')
      if (cartFirstWords === kbFirstWords || cartName.includes(kbFirstWords) || kbName.includes(cartFirstWords)) return true

      // 3. Category-based match
      const categoryName = cartProduct.category?.name?.toLowerCase() || ''
      if (kb.category.toLowerCase() === categoryName) return true

      return false
    })

    if (kbProduct && kbProduct.commonCombinations && kbProduct.commonCombinations.length > 0) {
      allCombinations.push(...kbProduct.commonCombinations)
    }
  }

  // Remove duplicates
  const uniqueCombinations = [...new Set(allCombinations)]

  if (uniqueCombinations.length > 0) {
    // Search for products matching these combinations
    const products = await prisma.product.findMany({
      where: {
        AND: [
          { isActive: true },
          { id: { notIn: cartProducts.map(p => p.id) } },
          {
            OR: uniqueCombinations.map(combo => ({
              OR: [
                { name: { contains: combo, mode: 'insensitive' as const } },
                { description: { contains: combo, mode: 'insensitive' as const } },
                { category: { name: { contains: combo, mode: 'insensitive' as const } } }
              ]
            }))
          }
        ]
      },
      include: {
        category: true,
        inventoryItem: true,
        productReviews: {
          where: { isPublished: true },
          select: { rating: true }
        }
      },
      take: limit * 3 // Get more to filter
    })

    if (products.length > 0) {

      // Sort by stock availability and rating
      const sorted = products
        .map(product => ({
          ...product,
          avgRating: calculateAverageRating(product.productReviews),
          inStock: product.inventoryItem ? product.inventoryItem.availableQuantity > 0 : false
        }))
        .sort((a, b) => {
          // Prioritize in-stock products
          if (a.inStock !== b.inStock) return a.inStock ? -1 : 1
          // Then by rating
          return b.avgRating - a.avgRating
        })
        .slice(0, limit)

      return sorted.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        images: product.images,
        category: product.category.name,
        inStock: product.inStock,
        availableQuantity: product.inventoryItem?.availableQuantity || 0,
        rating: product.avgRating,
        reviewCount: product.productReviews.length,
        reason: 'Sản phẩm bổ sung',
        badge: '🔧 Cần thiết',
        confidence: 0.95,
        wholesalePrice: product.wholesalePrice,
        minWholesaleQty: product.minWholesaleQty
      }))
    }
  }

  // FALLBACK: If no KB match, get related products from same or related categories

  const relatedProducts = await prisma.product.findMany({
    where: {
      AND: [
        { isActive: true },
        { id: { notIn: cartProducts.map(p => p.id) } },
        // Either same category or popular products
        {
          OR: [
            { categoryId: { in: cartCategoryIds } },
            { category: { name: { in: ['Xi măng', 'Cát', 'Đá', 'Gạch', 'Thép'] } } }
          ]
        }
      ]
    },
    include: {
      category: true,
      inventoryItem: true,
      productReviews: {
        where: { isPublished: true },
        select: { rating: true }
      }
    },
    orderBy: [
      { createdAt: 'desc' }
    ],
    take: limit
  })

  return relatedProducts.map(product => ({
    id: product.id,
    name: product.name,
    price: product.price,
    unit: product.unit,
    images: product.images,
    category: product.category.name,
    inStock: product.inventoryItem ? product.inventoryItem.availableQuantity > 0 : false,
    availableQuantity: product.inventoryItem?.availableQuantity || 0,
    rating: calculateAverageRating(product.productReviews),
    reviewCount: product.productReviews.length,
    reason: 'Sản phẩm liên quan',
    badge: '⭐ Phổ biến',
    confidence: 0.7,
    wholesalePrice: product.wholesalePrice,
    minWholesaleQty: product.minWholesaleQty
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
