import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { AIService } from '@/lib/ai-service'

// GET /api/recommendations/ai - Get AI-powered product recommendations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || ''
    const limit = parseInt(searchParams.get('limit') || '6')
    const customerId = searchParams.get('customerId') || undefined

    // Get user preferences if customerId is provided
    let userPreferences: any = null
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          orders: {
            include: {
              orderItems: {
                include: {
                  product: {
                    include: {
                      category: true
                    }
                  }
                }
              }
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (customer) {
        // Extract preferences from order history
        const categories = customer.orders.flatMap(order =>
          order.orderItems.map(item => item.product.category.name)
        )
        const categoryCounts = categories.reduce((acc: any, cat) => {
          acc[cat] = (acc[cat] || 0) + 1
          return acc
        }, {})

        userPreferences = {
          favoriteCategories: Object.keys(categoryCounts)
            .sort((a, b) => categoryCounts[b] - categoryCounts[a])
            .slice(0, 3),
          orderCount: customer.orders.length,
          totalSpent: customer.orders.reduce((sum, order) => sum + order.netAmount, 0)
        }
      }
    }

    // Use AI to generate recommendations
    const aiQuery = query || 
      (userPreferences?.favoriteCategories?.length 
        ? `Gợi ý sản phẩm vật liệu xây dựng phù hợp với ${userPreferences.favoriteCategories.join(', ')}`
        : 'Gợi ý sản phẩm vật liệu xây dựng phổ biến và chất lượng cao')

    const recommendations = await AIService.getProductRecommendations(aiQuery, {
      customerId,
      preferences: userPreferences,
      limit
    })

    // If AI returns product IDs, fetch full product details
    if (recommendations && recommendations.length > 0) {
      const productIds = recommendations
        .map((r: any) => typeof r === 'string' ? r : r.id)
        .filter((id: any) => id && typeof id === 'string')

      if (productIds.length > 0) {
        const products = await prisma.product.findMany({
          where: {
            id: { in: productIds },
            isActive: true
          },
          include: {
            category: true,
            inventoryItem: true,
            _count: {
              select: { orderItems: true }
            }
          },
          take: limit
        })

        // Sort by recommendation score if available
        const scoredProducts = products.map(product => {
          const rec = recommendations.find((r: any) => 
            (typeof r === 'string' ? r : r.id) === product.id
          )
          return {
            ...product,
            recommendationScore: rec?.score || rec?.confidence || 0.8,
            recommendationReason: rec?.reason || 'AI Recommended'
          }
        })

        return NextResponse.json(
          createSuccessResponse({
            products: scoredProducts.sort((a, b) => 
              b.recommendationScore - a.recommendationScore
            ),
            method: 'ai',
            query: aiQuery
          }),
          { status: 200 }
        )
      }
    }

    // Fallback to popular products if AI returns no results
    const popularProducts = await prisma.product.findMany({
      where: {
        isActive: true
      },
      include: {
        category: true,
        inventoryItem: true,
        _count: {
          select: { orderItems: true }
        }
      },
      orderBy: {
        orderItems: {
          _count: 'desc'
        }
      },
      take: limit
    })

    return NextResponse.json(
      createSuccessResponse({
        products: popularProducts.map(p => ({
          ...p,
          recommendationScore: 0.7,
          recommendationReason: 'Popular Product'
        })),
        method: 'fallback',
        query: aiQuery
      }),
      { status: 200 }
    )

  } catch (error: any) {
    console.error('AI recommendations error:', error)
    return NextResponse.json(
      createErrorResponse('Failed to get AI recommendations', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

