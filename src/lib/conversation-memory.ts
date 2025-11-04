/**
 * Conversation Memory Service
 * Stores and retrieves user conversation history and preferences
 */

import { prisma } from '@/lib/prisma'

export interface UserPreferences {
  favoriteProducts?: string[]
  favoriteCategories?: string[]
  projectType?: 'residential' | 'commercial' | 'industrial' | 'diy'
  usualQuantity?: 'small' | 'medium' | 'bulk'
  priceRange?: 'budget' | 'mid' | 'premium'
  deliveryPreference?: 'pickup' | 'delivery'
  communicationStyle?: 'brief' | 'detailed'
}

export interface ConversationSummary {
  totalConversations: number
  commonQueries: string[]
  productInterests: string[]
  lastInteraction: Date
  satisfactionScore?: number
}

export class ConversationMemoryService {
  /**
   * Get user's conversation context
   */
  static async getUserContext(customerId: string) {
    try {
      // Get user's basic info
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true
            }
          },
          orders: {
            include: {
              orderItems: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      categoryId: true
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      })

      if (!customer || !customer.user) return null

      // Analyze order history to infer preferences
      const preferences = this.inferPreferences(customer.orders)
      const summary = this.buildConversationSummary(customer.orders)

      return {
        customerId: customer.id,
        name: customer.user.name,
        email: customer.user.email,
        phone: customer.user.phone,
        type: this.inferCustomerType(customer.orders),
        preferences,
        summary,
        loyaltyTier: this.calculateLoyaltyTier(customer.orders),
        totalOrders: customer.orders.length
      }
    } catch (error) {
      console.error('Failed to get user context:', error)
      return null
    }
  }

  /**
   * Infer user preferences from order history
   */
  private static inferPreferences(orders: any[]): UserPreferences {
    if (orders.length === 0) {
      return {}
    }

    // Analyze favorite products
    const productCounts = new Map<string, number>()
    const categoryCounts = new Map<string, number>()
    let totalQuantity = 0
    let totalAmount = 0

    orders.forEach(order => {
      order.orderItems.forEach((item: any) => {
        // Count products
        const count = productCounts.get(item.product.id) || 0
        productCounts.set(item.product.id, count + item.quantity)

        // Count categories
        const catCount = categoryCounts.get(item.product.categoryId) || 0
        categoryCounts.set(item.product.categoryId, catCount + item.quantity)

        totalQuantity += item.quantity
        totalAmount += item.price * item.quantity
      })
    })

    // Get top favorite products
    const favoriteProducts = Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId]) => productId)

    // Get top categories
    const favoriteCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([categoryId]) => categoryId)

    // Infer quantity preference
    const avgQuantityPerOrder = totalQuantity / orders.length
    let usualQuantity: 'small' | 'medium' | 'bulk'
    if (avgQuantityPerOrder < 20) usualQuantity = 'small'
    else if (avgQuantityPerOrder < 100) usualQuantity = 'medium'
    else usualQuantity = 'bulk'

    // Infer price range
    const avgOrderValue = totalAmount / orders.length
    let priceRange: 'budget' | 'mid' | 'premium'
    if (avgOrderValue < 1000000) priceRange = 'budget'
    else if (avgOrderValue < 5000000) priceRange = 'mid'
    else priceRange = 'premium'

    return {
      favoriteProducts,
      favoriteCategories,
      usualQuantity,
      priceRange
    }
  }

  /**
   * Build conversation summary
   */
  private static buildConversationSummary(orders: any[]): ConversationSummary {
    // Extract common patterns from order history
    const productNames = new Map<string, number>()
    
    orders.forEach(order => {
      order.orderItems.forEach((item: any) => {
        const count = productNames.get(item.product.name) || 0
        productNames.set(item.product.name, count + 1)
      })
    })

    const commonQueries = Array.from(productNames.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)

    const productInterests = Array.from(productNames.keys()).slice(0, 10)

    return {
      totalConversations: orders.length,
      commonQueries,
      productInterests,
      lastInteraction: orders[0]?.createdAt || new Date()
    }
  }

  /**
   * Infer customer type from order patterns
   */
  private static inferCustomerType(orders: any[]): 'retail' | 'wholesale' | 'contractor' {
    if (orders.length === 0) return 'retail'

    const totalQuantity = orders.reduce((sum, order) => {
      return sum + order.orderItems.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0)
    }, 0)

    const avgQuantity = totalQuantity / orders.length

    if (avgQuantity > 500) return 'contractor'
    if (avgQuantity > 100) return 'wholesale'
    return 'retail'
  }

  /**
   * Calculate loyalty tier
   */
  private static calculateLoyaltyTier(orders: any[]): string {
    const totalOrders = orders.length
    const totalAmount = orders.reduce((sum, order) => {
      return sum + order.orderItems.reduce((itemSum: any, item: any) => 
        itemSum + (item.price * item.quantity), 0)
    }, 0)

    if (totalOrders >= 20 || totalAmount >= 50000000) return 'PLATINUM'
    if (totalOrders >= 10 || totalAmount >= 20000000) return 'GOLD'
    if (totalOrders >= 5 || totalAmount >= 5000000) return 'SILVER'
    return 'BRONZE'
  }

  /**
   * Store conversation interaction
   */
  static async recordInteraction(
    customerId: string,
    query: string,
    response: string,
    sessionId: string,
    metadata?: any
  ) {
    try {
      // Store in a simple JSON structure for now
      // In production, you might want a dedicated ConversationHistory model
      
      // For now, we'll use a simple approach
      // This can be enhanced with a proper conversation table later
      
      return {
        success: true,
        customerId,
        query,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Failed to record interaction:', error)
      return { success: false, error }
    }
  }

  /**
   * Get recent conversation history for a session
   */
  static async getSessionHistory(sessionId: string, limit: number = 10) {
    // Simple in-memory storage for now
    // In production, implement proper session storage
    return []
  }

  /**
   * Build context string for AI prompt
   */
  static formatContextForPrompt(context: any): string {
    if (!context) return 'New customer, no history'

    const parts: string[] = []

    // Customer info
    parts.push(`Customer: ${context.name || 'Unknown'}`)
    parts.push(`Type: ${context.type || 'retail'}`)
    parts.push(`Loyalty: ${context.loyaltyTier || 'BRONZE'}`)
    parts.push(`Total Orders: ${context.totalOrders || 0}`)

    // Preferences
    if (context.preferences) {
      const prefs = context.preferences
      if (prefs.favoriteProducts && prefs.favoriteProducts.length > 0) {
        parts.push(`Favorite Products: ${prefs.favoriteProducts.slice(0, 3).join(', ')}`)
      }
      if (prefs.usualQuantity) {
        parts.push(`Usual Quantity: ${prefs.usualQuantity}`)
      }
      if (prefs.priceRange) {
        parts.push(`Price Range: ${prefs.priceRange}`)
      }
    }

    // Summary
    if (context.summary) {
      if (context.summary.commonQueries && context.summary.commonQueries.length > 0) {
        parts.push(`Common Interests: ${context.summary.commonQueries.slice(0, 3).join(', ')}`)
      }
    }

    return parts.join('\n')
  }

  /**
   * Get personalized greeting
   */
  static getPersonalizedGreeting(context: any): string {
    if (!context) return 'Xin chào!'

    const greetings = [
      `Chào ${context.name || 'bạn'}!`,
      `Xin chào ${context.name || 'anh/chị'}!`,
    ]

    let greeting = greetings[Math.floor(Math.random() * greetings.length)]

    // Add contextual info
    if (context.loyaltyTier === 'PLATINUM' || context.loyaltyTier === 'GOLD') {
      greeting += ` Cảm ơn ${context.name} đã tin tưởng VietHoa.`
    }

    if (context.summary?.commonQueries && context.summary.commonQueries.length > 0) {
      const lastProduct = context.summary.commonQueries[0]
      greeting += ` Tôi thấy ${context.name} thường quan tâm ${lastProduct}.`
    }

    return greeting
  }

  /**
   * Suggest next actions based on history
   */
  static suggestNextActions(context: any): string[] {
    if (!context || !context.preferences) {
      return [
        'Xem sản phẩm nổi bật',
        'Tính toán vật liệu',
        'Tư vấn dự án'
      ]
    }

    const suggestions: string[] = []

    // Suggest reorder if has favorites
    if (context.preferences.favoriteProducts && context.preferences.favoriteProducts.length > 0) {
      suggestions.push('Đặt lại sản phẩm thường dùng')
    }

    // Suggest based on project type
    if (context.preferences.projectType) {
      suggestions.push(`Xem vật liệu cho ${context.preferences.projectType}`)
    }

    // Suggest based on quantity
    if (context.preferences.usualQuantity === 'bulk') {
      suggestions.push('Xem giá sỉ và ưu đãi')
    }

    // Default suggestions
    suggestions.push('Tính toán vật liệu cho dự án mới')
    suggestions.push('Xem sản phẩm mới')

    return suggestions.slice(0, 4)
  }
}

// Export singleton instance
export const conversationMemory = ConversationMemoryService
