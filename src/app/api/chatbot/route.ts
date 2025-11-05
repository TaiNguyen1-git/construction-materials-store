import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { AIService } from '@/lib/ai-service'
import { isAIEnabled } from '@/lib/ai-config'
import { RAGService } from '@/lib/rag-service'
import { buildEnhancedPrompt, buildUserMessage, type ChatContext } from '@/lib/ai-prompts-enhanced'
import { conversationMemory } from '@/lib/conversation-memory'
import { aiRecognition } from '@/lib/ai-material-recognition'
import { mlRecommendations } from '@/lib/ml-recommendations'
import { materialCalculator } from '@/lib/material-calculator-service'
import { ADMIN_WELCOME_MESSAGE, CUSTOMER_WELCOME_MESSAGE } from '@/lib/ai-prompts-admin'

// ===== NEW IMPORTS =====
import { detectIntent, requiresManagerRole } from '@/lib/chatbot/intent-detector'
import { extractEntities, parseOrderItems } from '@/lib/chatbot/entity-extractor'
import { processImageOCR, validateInvoiceImage } from '@/lib/chatbot/ocr-processor'
import { parseInvoice, formatInvoiceForChat, validateInvoice } from '@/lib/chatbot/invoice-parser'
import { executeAction } from '@/lib/chatbot/action-handler'
import { executeAnalyticsQuery } from '@/lib/chatbot/analytics-engine'
import {
  getConversationState,
  setConversationState,
  clearConversationState,
  processFlowResponse,
  startOrderCreationFlow,
  startOCRInvoiceFlow,
  startCRUDConfirmationFlow,
  getFlowData,
  updateFlowData
} from '@/lib/chatbot/conversation-state'
import { checkRateLimit, getRateLimitIdentifier, RateLimitConfigs, formatRateLimitError } from '@/lib/rate-limiter'

const chatMessageSchema = z.object({
  message: z.string().optional(),
  image: z.string().optional(),
  customerId: z.string().optional(),
  sessionId: z.string().min(1, 'Session ID is required'),
  userRole: z.string().optional(),
  isAdmin: z.boolean().optional(),
  context: z.object({
    currentPage: z.string().optional(),
    productId: z.string().optional(),
    categoryId: z.string().optional(),
  }).optional(),
}).refine(data => data.message || data.image, {
  message: 'Either message or image is required'
})

// POST /api/chatbot - Process chatbot message
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const body = await request.json()
    
    const validation = chatMessageSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { message, image, customerId, sessionId, context, isAdmin, userRole } = validation.data
    
    // Apply rate limiting
    let rateLimitConfig = RateLimitConfigs.CHATBOT
    let rateLimitEndpoint = 'chatbot'
    
    if (image && isAdmin) {
      // OCR is expensive, use stricter limits
      rateLimitConfig = RateLimitConfigs.OCR
      rateLimitEndpoint = 'ocr'
    } else if (isAdmin) {
      // Admin queries (analytics, CRUD)
      rateLimitConfig = RateLimitConfigs.ANALYTICS
      rateLimitEndpoint = 'admin'
    }
    
    const rateLimitId = getRateLimitIdentifier(ip, customerId, rateLimitEndpoint)
    const rateLimitResult = await checkRateLimit(rateLimitId, rateLimitConfig)
    
    if (!rateLimitResult.allowed) {
      const resetAt = rateLimitResult.resetAt || Date.now() + 60000
      const resetDate = new Date(resetAt)
      
      return NextResponse.json(
        createSuccessResponse({
          message: formatRateLimitError({ ...rateLimitResult, resetAt }),
          suggestions: ['Thử lại sau', 'Liên hệ hỗ trợ'],
          confidence: 1.0,
          sessionId,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200,
          headers: {
            'X-RateLimit-Limit': rateLimitConfig.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetDate.toISOString()
          }
        }
      )
    }

    // ===== WELCOME MESSAGES =====
    if (message === 'admin_hello' && isAdmin) {
      return NextResponse.json(
        createSuccessResponse({
          message: ADMIN_WELCOME_MESSAGE.message,
          suggestions: ADMIN_WELCOME_MESSAGE.suggestions,
          productRecommendations: [],
          confidence: 1.0,
          sessionId,
          timestamp: new Date().toISOString()
        }),
        { status: 200 }
      )
    }

    if (message === 'hello' && !isAdmin) {
      return NextResponse.json(
        createSuccessResponse({
          message: CUSTOMER_WELCOME_MESSAGE.message,
          suggestions: CUSTOMER_WELCOME_MESSAGE.suggestions,
          productRecommendations: [],
          confidence: 1.0,
          sessionId,
          timestamp: new Date().toISOString()
        }),
        { status: 200 }
      )
    }

    // ===== CHECK ACTIVE CONVERSATION FLOW =====
    const activeState = getConversationState(sessionId)
    
    if (activeState && message) {
      const flowResult = processFlowResponse(sessionId, message)
      
      if (flowResult.isCancelled) {
        return NextResponse.json(
          createSuccessResponse({
            message: '❌ Đã hủy thao tác.',
            suggestions: ['Bắt đầu lại', 'Trợ giúp'],
            confidence: 1.0,
            sessionId,
            timestamp: new Date().toISOString()
          })
        )
      }
      
      if (flowResult.isConfirmed && activeState.flow === 'ORDER_CREATION') {
        return await handleOrderCreation(sessionId, customerId, activeState)
      }
      
      if (flowResult.isConfirmed && activeState.flow === 'OCR_INVOICE') {
        return await handleOCRInvoiceSave(sessionId, activeState)
      }
      
      if (flowResult.isConfirmed && activeState.flow === 'CRUD_CONFIRMATION') {
        return await handleCRUDExecution(sessionId, activeState, userRole || '')
      }
      
      if (flowResult.nextPrompt) {
        return NextResponse.json(
          createSuccessResponse({
            message: flowResult.nextPrompt,
            suggestions: ['Xác nhận', 'Hủy'],
            confidence: 1.0,
            sessionId,
            timestamp: new Date().toISOString()
          })
        )
      }
    }

    // ===== OCR INVOICE FLOW (Admin + Image) =====
    if (isAdmin && image) {
      return await handleOCRInvoiceFlow(sessionId, image, message)
    }

    // ===== IMAGE RECOGNITION FLOW (Customer + Image) =====
    if (!isAdmin && image) {
      return await handleCustomerImageRecognition(sessionId, image, message, customerId)
    }

    // ===== TEXT-ONLY FLOWS =====
    if (!message) {
      return NextResponse.json(
        createErrorResponse('Message is required', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    // Get conversation history
    const conversationHistory = await getConversationHistory(sessionId)

    // Extract entities
    const entities = extractEntities(message)

    // Detect intent
    const intentResult = detectIntent(message, isAdmin, false, {
      hasCalculation: conversationHistory.some(h => h.role === 'assistant' && h.content.includes('tính toán')),
      hasProductList: conversationHistory.some(h => h.role === 'assistant' && h.content.includes('danh sách'))
    })

    console.log(`Intent: ${intentResult.intent} (confidence: ${intentResult.confidence})`)

    // ===== SECURITY: Prevent customer from accessing admin intents =====
    if (!isAdmin && intentResult.intent.startsWith('ADMIN_')) {
      return NextResponse.json(
        createSuccessResponse({
          message: '⛔ Bạn không có quyền truy cập chức năng này.\n\n💡 Chức năng này chỉ dành cho quản trị viên.',
          suggestions: ['Tìm sản phẩm', 'Tính vật liệu', 'Giá cả'],
          confidence: 1.0,
          sessionId,
          timestamp: new Date().toISOString()
        }),
        { status: 403 }
      )
    }

    // ===== ADMIN FLOWS =====
    if (isAdmin) {
      // Analytics queries
      if (intentResult.intent === 'ADMIN_ANALYTICS') {
        const analyticsResult = await executeAnalyticsQuery(message, entities)
        
        // Determine suggestions based on whether there's data
        let suggestions: string[] = []
        if (analyticsResult.success && analyticsResult.data?.hasData === false) {
          // No data - suggest alternatives
          suggestions = ['Báo cáo tháng này', 'Báo cáo năm nay', 'Doanh thu hôm nay', 'Trợ giúp']
        } else if (analyticsResult.success && analyticsResult.data) {
          // Has data - show report actions
          suggestions = ['Xuất báo cáo', 'Chi tiết hơn', 'So sánh kỳ trước']
        } else {
          // Error or unknown query
          suggestions = ['Thử lại', 'Trợ giúp']
        }
        
        return NextResponse.json(
          createSuccessResponse({
            message: analyticsResult.message,
            suggestions,
            confidence: analyticsResult.success ? 0.9 : 0.5,
            sessionId,
            timestamp: new Date().toISOString(),
            data: analyticsResult.data
          })
        )
      }

      // Order management
      if (intentResult.intent === 'ADMIN_ORDER_MANAGE') {
        return await handleAdminOrderManagement(message, entities, sessionId)
      }

      // Inventory check
      if (intentResult.intent === 'ADMIN_INVENTORY_CHECK') {
        return await handleAdminInventoryCheck(message, entities, sessionId)
      }

      // Employee queries
      if (intentResult.intent === 'ADMIN_EMPLOYEE_QUERY') {
        const analyticsResult = await executeAnalyticsQuery(message, entities)
        
        return NextResponse.json(
          createSuccessResponse({
            message: analyticsResult.message,
            suggestions: ['Xem chi tiết', 'Chấm công', 'Phân công'],
            confidence: analyticsResult.success ? 0.9 : 0.5,
            sessionId,
            timestamp: new Date().toISOString(),
            data: analyticsResult.data
          })
        )
      }

      // Payroll queries
      if (intentResult.intent === 'ADMIN_PAYROLL_QUERY') {
        const analyticsResult = await executeAnalyticsQuery(message, entities)
        
        return NextResponse.json(
          createSuccessResponse({
            message: analyticsResult.message,
            suggestions: ['Chi tiết lương', 'Xuất bảng lương', 'Duyệt ứng'],
            confidence: analyticsResult.success ? 0.9 : 0.5,
            sessionId,
            timestamp: new Date().toISOString(),
            data: analyticsResult.data
          })
        )
      }

      // CRUD operations
      if (
        intentResult.intent === 'ADMIN_CRUD_CREATE' ||
        intentResult.intent === 'ADMIN_CRUD_UPDATE' ||
        intentResult.intent === 'ADMIN_CRUD_DELETE'
      ) {
        // Check MANAGER permission
        if (requiresManagerRole(intentResult.intent) && userRole !== 'MANAGER') {
          return NextResponse.json(
            createSuccessResponse({
              message: '⛔ Chỉ MANAGER mới có quyền thực hiện thao tác này.',
              suggestions: ['Quay lại'],
              confidence: 1.0,
              sessionId,
              timestamp: new Date().toISOString()
            })
          )
        }

        const actionResult = await executeAction({
          action: entities.action || 'CREATE',
          entityType: entities.entityType || 'product',
          entities,
          rawMessage: message,
          userId: customerId || '',
          userRole: userRole || 'EMPLOYEE'
        })

        if (actionResult.requiresConfirmation) {
          // Start confirmation flow
          startCRUDConfirmationFlow(sessionId, {
            action: entities.action || 'CREATE',
            entityType: entities.entityType || 'product',
            entityData: actionResult.data,
            previewMessage: actionResult.message
          })

          return NextResponse.json(
            createSuccessResponse({
              message: actionResult.message + '\n\n⚠️ Xác nhận thực hiện?',
              suggestions: ['Xác nhận', 'Hủy'],
              confidence: 0.9,
              sessionId,
              timestamp: new Date().toISOString()
            })
          )
        }

        return NextResponse.json(
          createSuccessResponse({
            message: actionResult.message,
            suggestions: actionResult.success ? 
              ['Tiếp tục', 'Xem chi tiết'] : 
              ['Thử lại', 'Trợ giúp'],
            confidence: actionResult.success ? 0.9 : 0.5,
            sessionId,
            timestamp: new Date().toISOString()
          })
        )
      }

      // ===== ADMIN FALLBACK =====
      // If admin but no specific intent matched, use admin-specific fallback
      const adminFallback = await generateChatbotResponse(message, context, conversationHistory, true)
      
      return NextResponse.json(
        createSuccessResponse({
          message: adminFallback.response,
          suggestions: adminFallback.suggestions,
          confidence: adminFallback.confidence,
          sessionId,
          timestamp: new Date().toISOString()
        })
      )
    }

    // ===== CUSTOMER FLOWS =====

    // Order creation intent
    if (intentResult.intent === 'ORDER_CREATE') {
      // Try to parse order items from message
      const parsedItems = parseOrderItems(message)
      
      if (parsedItems.length > 0) {
        // Direct order from message
        startOrderCreationFlow(sessionId, parsedItems, !!customerId)

        const needsInfo = !customerId
        
        return NextResponse.json(
          createSuccessResponse({
            message: '🛒 **Xác nhận đặt hàng**\n\n' +
                     'Danh sách sản phẩm:\n' +
                     parsedItems.map((item, idx) => 
                       `${idx + 1}. ${item.productName}: ${item.quantity} ${item.unit}`
                     ).join('\n') +
                     '\n\n✅ Xác nhận đặt hàng?' +
                     (needsInfo ? '\n\n⚠️ *Bạn chưa đăng nhập. Chúng tôi sẽ hỏi thông tin giao hàng sau khi xác nhận.*' : '\n\n💡 *Hệ thống sẽ tự động tìm sản phẩm phù hợp trong kho*'),
            suggestions: needsInfo ? ['Xác nhận', 'Đăng nhập', 'Hủy'] : ['Xác nhận', 'Chỉnh sửa', 'Hủy'],
            confidence: intentResult.confidence,
            sessionId,
            timestamp: new Date().toISOString()
          })
        )
      }
      
      // Check if there's a recent material calculation
      const recentCalc = conversationHistory.reverse().find(h => 
        h.role === 'assistant' && (
          h.content.includes('Xi măng') || 
          h.content.includes('Gạch') ||
          h.content.includes('Cát') ||
          h.content.includes('Đá')
        )
      )

      if (recentCalc) {
        // Parse material list from calculation
        // (Simplified - in production, store calculation data in state)
        const items = [
          { productName: 'Xi măng PC40', quantity: 180, unit: 'bao' },
          { productName: 'Gạch ống', quantity: 12000, unit: 'viên' }
        ]

        startOrderCreationFlow(sessionId, items)

        return NextResponse.json(
          createSuccessResponse({
            message: '🛒 **Xác nhận đặt hàng**\n\n' +
                     'Danh sách vật liệu từ tính toán:\n' +
                     items.map((item, idx) => 
                       `${idx + 1}. ${item.productName}: ${item.quantity} ${item.unit}`
                     ).join('\n') +
                     '\n\n✅ Xác nhận đặt hàng?',
            suggestions: ['Xác nhận', 'Chỉnh sửa', 'Hủy'],
            confidence: 0.9,
            sessionId,
            timestamp: new Date().toISOString()
          })
        )
      } else {
        return NextResponse.json(
          createSuccessResponse({
            message: '❓ Bạn muốn đặt hàng gì? Vui lòng cho tôi biết cụ thể:\n\n' +
                     '📝 **Ví dụ:**\n' +
                     '- "Tôi muốn mua 10 bao xi măng"\n' +
                     '- "Đặt 20 viên gạch và 5 m³ cát"\n' +
                     '- "50 bao xi măng PC40 Insee"\n\n' +
                     'Hoặc bạn có thể tính toán vật liệu trước!',
            suggestions: ['Tính toán vật liệu', 'Xem sản phẩm', 'Ví dụ'],
            confidence: 0.7,
            sessionId,
            timestamp: new Date().toISOString()
          })
        )
      }
    }

    // Product search
    if (intentResult.intent === 'PRODUCT_SEARCH') {
      try {
        // Extract product name from message
        const productKeywords = message.toLowerCase()
          .replace(/tìm|search|có|bán|sell|muốn|cần|mua|đặt/g, '')
          .trim()
        
        // Search products
        const products = await prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: productKeywords, mode: 'insensitive' } },
              { description: { contains: productKeywords, mode: 'insensitive' } },
              { tags: { hasSome: [productKeywords] } }
            ],
            isActive: true
          },
          include: {
            category: true,
            inventoryItem: true,
            productReviews: {
              where: { isPublished: true },
              select: { rating: true }
            }
          },
          take: 5
        })

        if (products.length > 0) {
          const productList = products.map((p, idx) => {
            const avgRating = p.productReviews.length > 0
              ? (p.productReviews.reduce((sum, r) => sum + r.rating, 0) / p.productReviews.length).toFixed(1)
              : 'Chưa có đánh giá'
            const inStock = p.inventoryItem ? p.inventoryItem.availableQuantity > 0 : false
            const stockText = inStock 
              ? `✅ Còn ${p.inventoryItem?.availableQuantity || 0} ${p.unit}` 
              : '❌ Hết hàng'
            
            return `${idx + 1}. **${p.name}**\n` +
                   `   - Giá: ${p.price.toLocaleString()}đ/${p.unit}\n` +
                   `   - ${stockText}\n` +
                   `   - Đánh giá: ${avgRating} ⭐ (${p.productReviews.length} reviews)\n` +
                   `   - Danh mục: ${p.category.name}`
          }).join('\n\n')

          return NextResponse.json(
            createSuccessResponse({
              message: `🔍 **Tìm thấy ${products.length} sản phẩm:**\n\n${productList}\n\n` +
                       `💡 Nhấn "Xem chi tiết" để xem thêm thông tin hoặc "Đặt hàng" để mua ngay!`,
              suggestions: ['Xem chi tiết', 'Đặt hàng', 'So sánh giá'],
              productRecommendations: products.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                unit: p.unit,
                image: p.images[0] || '/placeholder.png',
                inStock: p.inventoryItem ? p.inventoryItem.availableQuantity > 0 : false
              })),
              confidence: 0.90,
              sessionId,
              timestamp: new Date().toISOString()
            })
          )
        } else {
          return NextResponse.json(
            createSuccessResponse({
              message: `❌ Không tìm thấy sản phẩm **"${productKeywords}"**\n\n` +
                       `💡 **Gợi ý:**\n` +
                       `- Thử tìm với từ khóa khác (vd: "xi măng", "gạch ống")\n` +
                       `- Xem danh mục sản phẩm\n` +
                       `- Liên hệ tư vấn: 1900-xxxx`,
              suggestions: ['Xem tất cả sản phẩm', 'Tư vấn', 'Tìm khác'],
              confidence: 0.80,
              sessionId,
              timestamp: new Date().toISOString()
            })
          )
        }
      } catch (error) {
        console.error('Product search error:', error)
      }
    }

    // Material calculation
    if (intentResult.intent === 'MATERIAL_CALCULATE') {
      try {
        const calcInput = materialCalculator.parseQuery(message)
        
        if (calcInput) {
          const calcResult = await materialCalculator.quickCalculate(calcInput)
          const formattedResponse = materialCalculator.formatForChat(calcResult)
          
          return NextResponse.json(
            createSuccessResponse({
              message: formattedResponse,
              suggestions: ['Đặt hàng ngay', 'Điều chỉnh', 'Tính lại'],
              confidence: 0.92,
              sessionId,
              timestamp: new Date().toISOString(),
              calculationData: calcResult
            })
          )
        } else {
          // Cannot parse - ask for clarification
          return NextResponse.json(
            createSuccessResponse({
              message: `🏗️ **Tính toán vật liệu xây dựng**\n\n` +
                       `Vui lòng cho tôi biết thêm thông tin:\n` +
                       `- Diện tích cần xây: bao nhiêu m²?\n` +
                       `- Loại công trình: nhà, tường, sàn,...?\n` +
                       `- Số tầng (nếu có)\n\n` +
                       `📝 **Ví dụ:**\n` +
                       `- "Tính vật liệu cho nhà 100m² x 3 tầng"\n` +
                       `- "Tính xi măng cho sàn 50m²"\n` +
                       `- "Cần bao nhiêu gạch cho tường 30m²"`,
              suggestions: ['Ví dụ', 'Tư vấn'],
              confidence: 0.70,
              sessionId,
              timestamp: new Date().toISOString()
            })
          )
        }
      } catch (error) {
        console.error('Calculation error:', error)
      }
    }

    // Price inquiry
    if (intentResult.intent === 'PRICE_INQUIRY') {
      try {
        // Extract product name
        const productKeywords = message.toLowerCase()
          .replace(/giá|price|bao nhiêu|tiền|cost/g, '')
          .trim()
        
        const products = await prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: productKeywords, mode: 'insensitive' } },
              { description: { contains: productKeywords, mode: 'insensitive' } }
            ],
            isActive: true
          },
          include: { category: true, inventoryItem: true },
          take: 3
        })

        if (products.length > 0) {
          const priceList = products.map((p, idx) => 
            `${idx + 1}. **${p.name}**: ${p.price.toLocaleString()}đ/${p.unit}`
          ).join('\n')

          return NextResponse.json(
            createSuccessResponse({
              message: `💰 **Bảng giá:**\n\n${priceList}\n\n` +
                       `💡 Giá đã bao gồm VAT. Liên hệ để được báo giá số lượng lớn!`,
              suggestions: ['Đặt hàng', 'So sánh', 'Xem chi tiết'],
              confidence: 0.90,
              sessionId,
              timestamp: new Date().toISOString()
            })
          )
        }
      } catch (error) {
        console.error('Price inquiry error:', error)
      }
    }

    // ===== FALLBACK: Use existing chatbot logic =====
    const botResponse = await generateChatbotResponse(message, context, conversationHistory, isAdmin)

    // Log interaction (with error handling)
    try {
      await prisma.customerInteraction.create({
        data: {
          customerId,
          sessionId,
          interactionType: 'CHATBOT',
          productId: context?.productId,
          query: message,
          response: botResponse.response,
          metadata: {
            confidence: botResponse.confidence,
            suggestions: botResponse.suggestions,
            productRecommendations: botResponse.productRecommendations,
            intent: intentResult.intent,
            entities,
            context
          },
          ipAddress: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })
    } catch (logError) {
      // Log error but don't fail the response
      console.error('Failed to log interaction:', logError)
    }

    return NextResponse.json(
      createSuccessResponse({
        message: botResponse.response,
        suggestions: botResponse.suggestions,
        productRecommendations: botResponse.productRecommendations,
        confidence: botResponse.confidence,
        sessionId,
        timestamp: new Date().toISOString()
      })
    )

  } catch (error) {
    console.error('Chatbot error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// ===== HELPER FUNCTIONS =====

async function handleAdminOrderManagement(message: string, entities: any, sessionId: string) {
  try {
    const lower = message.toLowerCase()
    
    // Check for pending orders
    if (lower.includes('chờ') || lower.includes('pending')) {
      const pendingOrders = await prisma.order.findMany({
        where: {
          status: 'PENDING_CONFIRMATION'
        },
        include: {
          customer: {
            include: { user: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      
      let responseMsg = `📦 **Đơn Hàng Chờ Xử Lý**\n\n`
      
      if (pendingOrders.length === 0) {
        responseMsg += `✅ Không có đơn hàng chờ xử lý!\n\nTất cả đơn đã được xử lý.`
        
        return NextResponse.json(
          createSuccessResponse({
            message: responseMsg,
            suggestions: ['Xem tất cả đơn', 'Doanh thu hôm nay'],
            confidence: 1.0,
            sessionId,
            timestamp: new Date().toISOString()
          })
        )
      }
      
      responseMsg += `Có **${pendingOrders.length}** đơn hàng cần xác nhận:\n\n`
      
      pendingOrders.slice(0, 5).forEach((order, idx) => {
        const isNew = Date.now() - order.createdAt.getTime() < 30 * 60 * 1000 // < 30 mins
        const customerName = order.customerType === 'GUEST' 
          ? order.guestName 
          : order.customer?.user.name || 'N/A'
        
        responseMsg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
        responseMsg += `${idx + 1}. **${order.orderNumber}** ${isNew ? '⏰ MỚI' : ''}\n`
        responseMsg += `\n👤 Khách hàng: ${customerName} ${order.customerType === 'GUEST' ? '(Khách vãng lai)' : ''}\n`
        responseMsg += `💰 Tổng tiền: **${order.netAmount.toLocaleString('vi-VN')}đ**\n`
        responseMsg += `🕐 Thời gian: ${formatRelativeTime(order.createdAt)}\n`
        responseMsg += `📦 Thanh toán: ${order.paymentMethod}\n`
      })
      responseMsg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      
      if (pendingOrders.length > 5) {
        responseMsg += `... và ${pendingOrders.length - 5} đơn khác\n\n`
      }
      
      const avgWaitTime = pendingOrders.length > 0 
        ? Math.round(pendingOrders.reduce((sum, o) => sum + (Date.now() - o.createdAt.getTime()), 0) / pendingOrders.length / 60000)
        : 0
      
      responseMsg += `⏱️ Thời gian chờ TB: ${avgWaitTime} phút\n`
      responseMsg += `💡 Ưu tiên xử lý đơn mới nhất trước!`
      
      return NextResponse.json(
        createSuccessResponse({
          message: responseMsg,
          suggestions: ['Xem chi tiết đơn đầu', 'Xác nhận tất cả', 'Làm mới'],
          confidence: 1.0,
          sessionId,
          timestamp: new Date().toISOString(),
          data: { pendingOrders: pendingOrders.slice(0, 5) }
        })
      )
    }
    
    // Check for recent orders or all orders
    if (lower.includes('mới nhất') || lower.includes('latest') || lower.includes('tất cả đơn')) {
      const limit = lower.includes('tất cả đơn') ? 20 : 5
      const recentOrders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          customer: {
            include: { user: true }
          }
        }
      })
      
      let responseMsg = lower.includes('tất cả đơn') 
        ? `📦 **Tất Cả Đơn Hàng** (${recentOrders.length} đơn gần nhất)\n\n`
        : `📦 **Đơn Hàng Mới Nhất**\n\n`
      
      if (recentOrders.length === 0) {
        responseMsg += `❌ Không có đơn hàng nào.\n\n`
        
        return NextResponse.json(
          createSuccessResponse({
            message: responseMsg,
            suggestions: ['Đơn chờ xử lý', 'Doanh thu hôm nay'],
            confidence: 1.0,
            sessionId,
            timestamp: new Date().toISOString()
          })
        )
      }
      
      recentOrders.forEach((order, idx) => {
        const customerName = order.customerType === 'GUEST' 
          ? order.guestName 
          : order.customer?.user.name || 'N/A'
        
        responseMsg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
        responseMsg += `${idx + 1}. **${order.orderNumber}**\n`
        responseMsg += `\n${getStatusEmoji(order.status)} **${getStatusLabel(order.status)}**\n`
        responseMsg += `👤 Khách hàng: ${customerName}\n`
        responseMsg += `💰 Tổng tiền: **${order.netAmount.toLocaleString('vi-VN')}đ**\n`
        responseMsg += `🕐 Thời gian: ${formatRelativeTime(order.createdAt)}\n`
      })
      responseMsg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      
      if (lower.includes('tất cả đơn') && recentOrders.length === 20) {
        responseMsg += `💡 Đang hiển thị 20 đơn hàng gần nhất. Vào trang quản lý để xem thêm.\n\n`
      }
      
      return NextResponse.json(
        createSuccessResponse({
          message: responseMsg,
          suggestions: ['Đơn chờ xử lý', 'Doanh thu hôm nay', 'Chi tiết hơn'],
          confidence: 1.0,
          sessionId,
          timestamp: new Date().toISOString(),
          data: { orders: recentOrders }
        })
      )
    }
    
    // Default - suggest actions
    return NextResponse.json(
      createSuccessResponse({
        message: `📦 **Quản Lý Đơn Hàng**\n\n` +
                 `Tôi có thể giúp bạn:\n\n` +
                 `- Xem đơn hàng chờ xử lý\n` +
                 `- Xem đơn hàng mới nhất\n` +
                 `- Thống kê đơn hàng theo ngày\n` +
                 `- Tìm đơn hàng theo mã\n\n` +
                 `💡 Thử hỏi: "Đơn hàng chờ xử lý" hoặc "Đơn hàng mới nhất"`,
        suggestions: ['Đơn chờ xử lý', 'Đơn mới nhất', 'Doanh thu hôm nay'],
        confidence: 0.8,
        sessionId,
        timestamp: new Date().toISOString()
      })
    )
  } catch (error: any) {
    console.error('Order management error:', error)
    return NextResponse.json(
      createSuccessResponse({
        message: `❌ Lỗi khi truy vấn đơn hàng: ${error.message}`,
        suggestions: ['Thử lại', 'Trợ giúp'],
        confidence: 0.5,
        sessionId,
        timestamp: new Date().toISOString()
      })
    )
  }
}

async function handleAdminInventoryCheck(message: string, entities: any, sessionId: string) {
  try {
    const lower = message.toLowerCase()
    
    // Get all inventory items
    const inventoryItems = await prisma.inventoryItem.findMany({
      include: {
        product: {
          select: {
            name: true,
            unit: true,
            price: true
          }
        }
      }
    })
    
    // Calculate low stock items
    const lowStockItems = inventoryItems.filter(item => {
      const safetyStock = item.safetyStockLevel || 0
      return item.availableQuantity <= safetyStock && safetyStock > 0
    })
    
    // Calculate critical items (out of stock or near zero)
    const criticalItems = lowStockItems.filter(item => 
      item.availableQuantity <= (item.safetyStockLevel || 0) * 0.3
    )
    
    // Calculate warning items
    const warningItems = lowStockItems.filter(item => 
      item.availableQuantity > (item.safetyStockLevel || 0) * 0.3 &&
      item.availableQuantity <= item.safetyStockLevel!
    )
    
    let responseMsg = `⚠️ **Cảnh Báo Tồn Kho**\n\n`
    
    if (lowStockItems.length === 0) {
      responseMsg += `✅ Tất cả sản phẩm đều đủ hàng!\n\nKhông có sản phẩm nào dưới mức an toàn.`
      
      return NextResponse.json(
        createSuccessResponse({
          message: responseMsg,
          suggestions: ['Xem tồn kho', 'Doanh thu hôm nay'],
          confidence: 1.0,
          sessionId,
          timestamp: new Date().toISOString()
        })
      )
    }
    
    if (criticalItems.length > 0) {
      responseMsg += `🔴 **KHẨN CẤP** - Cần đặt hàng ngay (${criticalItems.length} sản phẩm):\n\n`
      
      criticalItems.slice(0, 5).forEach((item, idx) => {
        const daysLeft = item.availableQuantity > 0 && item.safetyStockLevel 
          ? Math.floor(item.availableQuantity / (item.safetyStockLevel * 0.1)) 
          : 0
        
        responseMsg += `${idx + 1}. **${item.product.name}**\n`
        responseMsg += `   📦 Còn: ${item.availableQuantity} ${item.product.unit}\n`
        responseMsg += `   ⚡ Mức an toàn: ${item.safetyStockLevel} ${item.product.unit}\n`
        responseMsg += `   ⏰ ${daysLeft <= 0 ? 'HẾT HÀNG' : `Còn ~${daysLeft} ngày`}\n\n`
      })
    }
    
    if (warningItems.length > 0) {
      responseMsg += `🟡 **CẢNH BÁO** - Sắp hết (${warningItems.length} sản phẩm):\n\n`
      
      warningItems.slice(0, 3).forEach((item, idx) => {
        responseMsg += `${idx + 1}. **${item.product.name}**: Còn ${item.availableQuantity} ${item.product.unit}\n`
      })
      
      if (warningItems.length > 3) {
        responseMsg += `... và ${warningItems.length - 3} sản phẩm khác\n`
      }
    }
    
    // Calculate estimated order value
    const estimatedValue = criticalItems.reduce((sum, item) => {
      const reorderQty = (item.reorderQuantity || item.safetyStockLevel || 100)
      return sum + (reorderQty * item.product.price)
    }, 0)
    
    responseMsg += `\n💰 Ước tính giá trị cần đặt: ~${estimatedValue.toLocaleString('vi-VN')}đ\n\n`
    responseMsg += `🎯 **Hành động:**\n`
    responseMsg += `✅ Liên hệ nhà cung cấp ngay\n`
    responseMsg += `✅ Cập nhật thông báo trên website\n`
    responseMsg += `✅ Xem lịch sử nhập hàng`
    
    return NextResponse.json(
      createSuccessResponse({
        message: responseMsg,
        suggestions: ['Xem chi tiết', 'Liên hệ NCC', 'Cập nhật tồn kho'],
        confidence: 1.0,
        sessionId,
        timestamp: new Date().toISOString(),
        data: {
          criticalCount: criticalItems.length,
          warningCount: warningItems.length,
          estimatedValue,
          criticalItems: criticalItems.slice(0, 5).map(i => ({
            productName: i.product.name,
            available: i.availableQuantity,
            safetyLevel: i.safetyStockLevel,
            unit: i.product.unit
          }))
        }
      })
    )
  } catch (error: any) {
    console.error('Inventory check error:', error)
    return NextResponse.json(
      createSuccessResponse({
        message: `❌ Lỗi khi kiểm tra tồn kho: ${error.message}`,
        suggestions: ['Thử lại', 'Trợ giúp'],
        confidence: 0.5,
        sessionId,
        timestamp: new Date().toISOString()
      })
    )
  }
}

function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  return `${days} ngày trước`
}

function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    'PENDING': '⏰',
    'PENDING_CONFIRMATION': '⏰',
    'CONFIRMED': '✅',
    'PROCESSING': '🔄',
    'SHIPPED': '🚚',
    'COMPLETED': '✅',
    'CANCELLED': '❌'
  }
  return emojis[status] || '📦'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'PENDING': 'Chờ xử lý',
    'PENDING_CONFIRMATION': 'Chờ xác nhận',
    'CONFIRMED': 'Đã xác nhận',
    'PROCESSING': 'Đang xử lý',
    'SHIPPED': 'Đang giao',
    'COMPLETED': 'Hoàn thành',
    'CANCELLED': 'Đã hủy'
  }
  return labels[status] || status
}

async function handleOCRInvoiceFlow(sessionId: string, image: string, message?: string) {
  try {
    // Validate image
    const validation = validateInvoiceImage(image)
    if (!validation.valid) {
      return NextResponse.json(
        createSuccessResponse({
          message: `❌ ${validation.reason}`,
          suggestions: ['Thử ảnh khác', 'Trợ giúp'],
          confidence: 0.5,
          sessionId,
          timestamp: new Date().toISOString()
        })
      )
    }

    // Process OCR
    const ocrResult = await processImageOCR(image)
    
    // Parse invoice
    const parsedInvoice = parseInvoice(ocrResult)
    
    // Validate
    const invoiceValidation = validateInvoice(parsedInvoice)
    
    if (!invoiceValidation.valid) {
      return NextResponse.json(
        createSuccessResponse({
          message: `⚠️ **Nhận diện không đầy đủ**\n\n` +
                   `Lỗi:\n${invoiceValidation.errors.map(e => `- ${e}`).join('\n')}\n\n` +
                   `Vui lòng chụp lại ảnh rõ hơn hoặc nhập thủ công.`,
          suggestions: ['Chụp lại', 'Nhập thủ công'],
          confidence: parsedInvoice.confidence,
          sessionId,
          timestamp: new Date().toISOString()
        })
      )
    }

    // Format for display
    const formattedMsg = formatInvoiceForChat(parsedInvoice)
    
    // Start OCR flow
    startOCRInvoiceFlow(sessionId, parsedInvoice)

    return NextResponse.json(
      createSuccessResponse({
        message: formattedMsg + '\n\n✅ Lưu hóa đơn vào hệ thống?',
        suggestions: ['Lưu hóa đơn', 'Chỉnh sửa', 'Hủy'],
        confidence: parsedInvoice.confidence,
        sessionId,
        timestamp: new Date().toISOString(),
        ocrData: parsedInvoice
      })
    )
  } catch (error: any) {
    console.error('OCR error:', error)
    return NextResponse.json(
      createSuccessResponse({
        message: `❌ Lỗi xử lý ảnh: ${error.message}`,
        suggestions: ['Thử lại', 'Trợ giúp'],
        confidence: 0.3,
        sessionId,
        timestamp: new Date().toISOString()
      })
    )
  }
}

async function handleOCRInvoiceSave(sessionId: string, state: any) {
  try {
    const parsedInvoice = state.data.parsedInvoice
    
    // Find or create supplier if supplierName exists
    let supplierId: string | undefined = undefined
    if (parsedInvoice.supplierName) {
      const supplier = await prisma.supplier.findFirst({
        where: {
          name: { contains: parsedInvoice.supplierName, mode: 'insensitive' }
        }
      })
      
      if (supplier) {
        supplierId = supplier.id
      } else {
        // Create new supplier
        const newSupplier = await prisma.supplier.create({
          data: {
            name: parsedInvoice.supplierName,
            contactPerson: '',
            email: '',
            phone: parsedInvoice.supplierPhone || '',
            address: parsedInvoice.supplierAddress || '',
            taxId: parsedInvoice.supplierTaxId || '',
            isActive: true
          }
        })
        supplierId = newSupplier.id
      }
    }
    
    // Determine invoice status based on payment status
    let invoiceStatus: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' = 'DRAFT'
    if (parsedInvoice.paymentStatus === 'PAID') {
      invoiceStatus = 'PAID'
    } else if (parsedInvoice.paymentStatus === 'UNPAID') {
      invoiceStatus = 'SENT'
    }
    
    // Save invoice with transaction to ensure consistency
    const invoice = await prisma.$transaction(async (tx) => {
      // Create invoice
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber: parsedInvoice.invoiceNumber || `INV-${Date.now()}`,
          invoiceType: 'PURCHASE',
          supplierId: supplierId,
          issueDate: parsedInvoice.invoiceDate || new Date(),
          dueDate: parsedInvoice.dueDate,
          status: invoiceStatus,
          subtotal: parsedInvoice.subtotal || 0,
          taxAmount: parsedInvoice.taxAmount || 0,
          discountAmount: 0,
          totalAmount: parsedInvoice.totalAmount || 0,
          paidAmount: invoiceStatus === 'PAID' ? (parsedInvoice.totalAmount || 0) : 0,
          balanceAmount: invoiceStatus === 'PAID' ? 0 : (parsedInvoice.totalAmount || 0),
          paymentTerms: parsedInvoice.paymentMethod,
          notes: `OCR Imported: ${parsedInvoice.rawText?.substring(0, 500)}`
        }
      })
      
      // Create invoice items if available
      let itemsCreated = 0
      if (parsedInvoice.items && parsedInvoice.items.length > 0) {
        for (const item of parsedInvoice.items) {
          if (!item.name) continue
          
          // Try to find matching product
          const product = await tx.product.findFirst({
            where: {
              OR: [
                { name: { contains: item.name, mode: 'insensitive' } },
                { description: { contains: item.name, mode: 'insensitive' } }
              ],
              isActive: true
            }
          })
          
          if (product) {
            await tx.invoiceItem.create({
              data: {
                invoiceId: newInvoice.id,
                productId: product.id,
                description: item.name,
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                totalPrice: item.totalPrice || (item.quantity || 1) * (item.unitPrice || 0),
                discount: 0,
                taxRate: parsedInvoice.taxRate || 0,
                taxAmount: 0
              }
            })
            itemsCreated++
          }
        }
      }
      
      return { invoice: newInvoice, itemsCreated }
    })

    clearConversationState(sessionId)

    return NextResponse.json(
      createSuccessResponse({
        message: `✅ Đã lưu hóa đơn **${invoice.invoice.invoiceNumber}**\n\n` +
                 `- Nhà cung cấp: ${parsedInvoice.supplierName || 'N/A'}\n` +
                 `- Tổng tiền: ${invoice.invoice.totalAmount.toLocaleString('vi-VN')}đ\n` +
                 `- Trạng thái: ${invoice.invoice.status}\n` +
                 `- Sản phẩm: ${invoice.itemsCreated}/${parsedInvoice.items?.length || 0} matched\n\n` +
                 (invoice.itemsCreated === 0 ? 
                   `⚠️ Không match được sản phẩm nào. Vui lòng cập nhật thủ công.` :
                   invoice.itemsCreated < (parsedInvoice.items?.length || 0) ?
                   `💡 Một số sản phẩm chưa match. Vui lòng kiểm tra.` :
                   `✅ Tất cả sản phẩm đã được match!`
                 ),
        suggestions: ['Xem chi tiết', 'Tạo hóa đơn khác', 'Cập nhật sản phẩm'],
        confidence: 1.0,
        sessionId,
        timestamp: new Date().toISOString()
      })
    )
  } catch (error: any) {
    console.error('Save invoice error:', error)
    return NextResponse.json(
      createErrorResponse(`Failed to save invoice: ${error.message}`, 'DATABASE_ERROR'),
      { status: 500 }
    )
  }
}

async function handleOrderCreation(sessionId: string, customerId: string | undefined, state: any) {
  try {
    const flowData = state.data
    
    // Determine if guest or registered customer
    const isGuest = !customerId
    let customerInfo: any
    
    if (isGuest) {
      // Guest order - use provided info
      if (!flowData.guestInfo || !flowData.guestInfo.name || !flowData.guestInfo.phone) {
        return NextResponse.json(
          createSuccessResponse({
            message: '❌ Thiếu thông tin giao hàng. Vui lòng cung cấp:\n' +
                     '- Họ tên\n' +
                     '- Số điện thoại\n' +
                     '- Địa chỉ',
            suggestions: ['Nhập lại', 'Đăng nhập'],
            confidence: 1.0,
            sessionId,
            timestamp: new Date().toISOString()
          })
        )
      }
      
      customerInfo = {
        name: flowData.guestInfo.name,
        phone: flowData.guestInfo.phone,
        email: '',
        address: flowData.guestInfo.address
      }
    } else {
      // Registered customer
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { user: true }
      })

      if (!customer) {
        return NextResponse.json(
          createErrorResponse('Customer not found', 'NOT_FOUND'),
          { status: 404 }
        )
      }
      
      customerInfo = {
        name: customer.user.name,
        phone: customer.user.phone || '',
        email: customer.user.email,
        address: customer.user.address || ''
      }
    }

    // Create order with transaction
    const result = await prisma.$transaction(async (tx) => {
      const items = flowData.items || []
      let subtotal = 0
      const orderItems: any[] = []
      let itemsMatched = 0

      // Match products and calculate totals
      for (const item of items) {
        const product = await tx.product.findFirst({
          where: {
            OR: [
              { name: { contains: item.productName, mode: 'insensitive' } },
              { description: { contains: item.productName, mode: 'insensitive' } }
            ],
            isActive: true
          }
        })

        if (product) {
          const quantity = item.quantity || 1
          const unitPrice = product.price
          const itemSubtotal = quantity * unitPrice

          orderItems.push({
            productId: product.id,
            productName: product.name,
            quantity,
            unit: product.unit,
            unitPrice,
            subtotal: itemSubtotal,
            discount: 0,
            taxRate: 0,
            taxAmount: 0
          })

          subtotal += itemSubtotal
          itemsMatched++
        }
      }

      if (orderItems.length === 0) {
        throw new Error('Không tìm thấy sản phẩm nào trong hệ thống. Vui lòng thử lại.')
      }

      // Create order with PENDING_CONFIRMATION status (needs admin approval)
      const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`
      
      // Calculate deposit (30% of total)
      const depositPercentage = 30
      const depositAmount = Math.round(subtotal * (depositPercentage / 100))
      const remainingAmount = subtotal - depositAmount
      
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: isGuest ? null : customerId,
          customerType: isGuest ? 'GUEST' : 'REGISTERED',
          guestName: isGuest ? customerInfo.name : undefined,
          guestPhone: isGuest ? customerInfo.phone : undefined,
          guestEmail: isGuest ? (customerInfo.email || undefined) : undefined,
          status: 'PENDING_CONFIRMATION', // Wait for admin confirmation
          totalAmount: subtotal,
          taxAmount: 0,
          shippingAmount: 0,
          discountAmount: 0,
          netAmount: subtotal,
          paymentMethod: flowData.paymentMethod || 'BANK_TRANSFER',
          paymentStatus: 'PENDING',
          paymentType: 'DEPOSIT', // Require deposit payment
          depositPercentage,
          depositAmount,
          remainingAmount,
          shippingAddress: {
            name: customerInfo.name,
            phone: customerInfo.phone,
            address: customerInfo.address
          },
          notes: isGuest 
            ? 'Đơn hàng từ Chatbot AI (Khách vãng lai)' 
            : 'Đơn hàng tạo từ Chatbot AI'
        }
      })

      // Create order items
      for (const orderItem of orderItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            ...orderItem
          }
        })
      }

      return {
        order,
        itemsMatched,
        totalItems: items.length
      }
    })

    clearConversationState(sessionId)

    // Create notification for admin about new order
    try {
      const { createOrderNotification } = await import('@/lib/notification-service')
      const orderWithCustomer = await prisma.order.findUnique({
        where: { id: result.order.id },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  id: true
                }
              }
            }
          }
        }
      })
      if (orderWithCustomer) {
        await createOrderNotification({
          id: orderWithCustomer.id,
          orderNumber: orderWithCustomer.orderNumber,
          netAmount: orderWithCustomer.netAmount,
          customerType: orderWithCustomer.customerType,
          guestName: orderWithCustomer.guestName,
          guestPhone: orderWithCustomer.guestPhone,
          customer: orderWithCustomer.customer
        })

        // Create notification for customer about successful order (if registered)
        if (orderWithCustomer.customer?.userId) {
          const { createOrderStatusNotificationForCustomer } = await import('@/lib/notification-service')
          await createOrderStatusNotificationForCustomer({
            id: orderWithCustomer.id,
            orderNumber: orderWithCustomer.orderNumber,
            status: orderWithCustomer.status,
            customer: {
              userId: orderWithCustomer.customer.userId
            }
          })
        }
      }
    } catch (notifError: any) {
      console.error('Error creating order notification:', notifError)
    }

    return NextResponse.json(
      createSuccessResponse({
        message: `✅ Đặt hàng thành công! Mã đơn: **${result.order.orderNumber}**\n\n` +
                 `📦 **Chi tiết đơn hàng:**\n` +
                 `- Khách hàng: ${customerInfo.name}\n` +
                 `- SĐT: ${customerInfo.phone}\n` +
                 `- Tổng tiền: ${result.order.netAmount.toLocaleString('vi-VN')}đ\n` +
                 `- Sản phẩm: ${result.itemsMatched}/${result.totalItems} items\n` +
                 `- Đặt cọc: ${result.order.depositAmount.toLocaleString('vi-VN')}đ (30%)\n\n` +
                 `⏳ **Bước tiếp theo:**\n` +
                 `1. Admin sẽ xác nhận đơn hàng trong vài phút\n` +
                 `2. Sau khi xác nhận, ${isGuest ? 'chúng tôi sẽ gọi điện xác nhận' : 'bạn sẽ thấy mã QR thanh toán'}\n` +
                 `3. ${isGuest ? 'Chuyển khoản theo hướng dẫn' : 'Chuyển khoản theo QR để hoàn tất đơn'}\n\n` +
                 (isGuest 
                   ? `📞 Chúng tôi sẽ liên hệ qua SĐT **${customerInfo.phone}** để xác nhận!\n\n` +
                     `📋 **Lưu mã đơn hàng:** ${result.order.orderNumber}\n` +
                     `💡 Bạn có thể theo dõi đơn hàng tại: /order-tracking?orderNumber=${result.order.orderNumber}`
                   : `👉 Nhấn "Xem chi tiết" để theo dõi đơn hàng!`),
        suggestions: isGuest 
          ? ['Xem đơn hàng', 'Lưu mã đơn', 'Tiếp tục mua sắm'] 
          : ['Xem chi tiết', 'Tiếp tục mua sắm'],
        confidence: 1.0,
        sessionId,
        timestamp: new Date().toISOString(),
        orderData: {
          orderNumber: result.order.orderNumber,
          orderId: result.order.id,
          status: result.order.status,
          depositAmount: result.order.depositAmount,
          totalAmount: result.order.netAmount,
          isGuest,
          trackingUrl: `/order-tracking?orderNumber=${encodeURIComponent(result.order.orderNumber)}`
        }
      })
    )
  } catch (error: any) {
    console.error('Order creation error:', error)
    
    clearConversationState(sessionId)
    
    return NextResponse.json(
      createSuccessResponse({
        message: `❌ Không thể tạo đơn hàng: ${error.message}\n\nVui lòng thử lại hoặc liên hệ hỗ trợ.`,
        suggestions: ['Thử lại', 'Liên hệ hỗ trợ', 'Tiếp tục xem sản phẩm'],
        confidence: 0.5,
        sessionId,
        timestamp: new Date().toISOString()
      })
    )
  }
}

async function handleCRUDExecution(sessionId: string, state: any, userRole: string) {
  try {
    const crudData = state.data
    
    const actionResult = await executeAction({
      action: crudData.action,
      entityType: crudData.entityType,
      entities: {},
      rawMessage: '',
      userId: '',
      userRole
    })

    clearConversationState(sessionId)

    return NextResponse.json(
      createSuccessResponse({
        message: actionResult.message,
        suggestions: ['Tiếp tục', 'Quay lại'],
        confidence: actionResult.success ? 0.9 : 0.5,
        sessionId,
        timestamp: new Date().toISOString()
      })
    )
  } catch (error: any) {
    console.error('CRUD execution error:', error)
    return NextResponse.json(
      createErrorResponse(`Failed to execute action: ${error.message}`, 'EXECUTION_ERROR'),
      { status: 500 }
    )
  }
}

async function handleCustomerImageRecognition(
  sessionId: string,
  image: string,
  message: string | undefined,
  customerId: string | undefined
) {
  try {
    const recognitionResult = await aiRecognition.recognizeMaterial(image)
    
    let responseText = `📸 **Tôi nhận diện được:** ${recognitionResult.materialType}\n\n`
    responseText += `🎯 **Độ tin cậy:** ${(recognitionResult.confidence * 100).toFixed(0)}%\n\n`
    
    if (recognitionResult.matchedProducts.length > 0) {
      responseText += `✅ **Tìm thấy ${recognitionResult.matchedProducts.length} sản phẩm phù hợp:**`
      
      return NextResponse.json(
        createSuccessResponse({
          message: responseText,
          suggestions: recognitionResult.suggestions,
          productRecommendations: recognitionResult.matchedProducts,
          confidence: recognitionResult.confidence,
          sessionId,
          timestamp: new Date().toISOString()
        })
      )
    } else {
      responseText += '❌ Không tìm thấy sản phẩm phù hợp.'
      
      return NextResponse.json(
        createSuccessResponse({
          message: responseText,
          suggestions: ['Thử chụp lại', 'Tìm kiếm bằng text'],
          confidence: recognitionResult.confidence,
          sessionId,
          timestamp: new Date().toISOString()
        })
      )
    }
  } catch (error: any) {
    console.error('Image recognition error:', error)
    return NextResponse.json(
      createSuccessResponse({
        message: '❌ Không thể nhận diện ảnh. Vui lòng thử lại.',
        suggestions: ['Thử lại', 'Tìm kiếm bằng text'],
        confidence: 0.3,
        sessionId,
        timestamp: new Date().toISOString()
      })
    )
  }
}

async function getConversationHistory(sessionId: string) {
  const interactions = await prisma.customerInteraction.findMany({
    where: {
      sessionId,
      interactionType: 'CHATBOT',
      createdAt: {
        gte: new Date(Date.now() - 3600000) // Last 1 hour
      }
    },
    orderBy: { createdAt: 'asc' },
    take: 10,
    select: {
      query: true,
      response: true
    }
  })

  const formattedHistory: { role: string; content: string }[] = []
  interactions.forEach(interaction => {
    formattedHistory.push({ role: 'user', content: interaction.query })
    formattedHistory.push({ role: 'assistant', content: interaction.response })
  })
  
  return formattedHistory
}

async function generateChatbotResponse(
  message: string, 
  context?: any,
  conversationHistory?: { role: string; content: string }[],
  isAdmin: boolean = false
): Promise<{
  response: string;
  suggestions: string[];
  productRecommendations?: any[];
  confidence: number;
}> {
  const lower = message.toLowerCase()
  
  // ===== ADMIN FALLBACK =====
  if (isAdmin) {
    // Try to understand what admin wants
    if (lower.includes('giúp') || lower.includes('help') || lower.includes('làm được') || lower.includes('can do')) {
      return {
        response: `🎯 **Tôi có thể giúp bạn:**\n\n` +
                 `📊 **Phân tích & Báo cáo**\n` +
                 `- Doanh thu theo ngày/tuần/tháng\n` +
                 `- Top sản phẩm bán chạy\n` +
                 `- Thống kê khách hàng\n\n` +
                 `📦 **Quản lý Đơn hàng**\n` +
                 `- Đơn chờ xử lý\n` +
                 `- Đơn mới nhất\n` +
                 `- Tìm đơn theo mã\n\n` +
                 `⚠️ **Tồn kho & Nhập hàng**\n` +
                 `- Sản phẩm sắp hết\n` +
                 `- Cảnh báo tồn kho\n\n` +
                 `👥 **Nhân viên**\n` +
                 `- Ai nghỉ hôm nay\n` +
                 `- Lương và ứng lương\n\n` +
                 `💡 Thử hỏi cụ thể hơn hoặc chọn gợi ý bên dưới!`,
        suggestions: ['Doanh thu hôm nay', 'Đơn chờ xử lý', 'Sản phẩm sắp hết', 'Top bán chạy'],
        confidence: 0.85
      }
    }
    
    // Generic admin fallback
    return {
      response: `💡 **Tôi không hiểu câu hỏi của bạn**\n\n` +
               `Tôi có thể giúp bạn về:\n` +
               `- 📊 Thống kê & Báo cáo (doanh thu, bán hàng)\n` +
               `- 📦 Quản lý đơn hàng\n` +
               `- ⚠️ Kiểm tra tồn kho\n` +
               `- 👥 Thông tin nhân viên\n\n` +
               `Hãy thử hỏi cụ thể hơn!\n\n` +
               `**Ví dụ:**\n` +
               `- "Doanh thu hôm nay"\n` +
               `- "Đơn hàng chờ xử lý"\n` +
               `- "Sản phẩm sắp hết"`,
      suggestions: ['Doanh thu hôm nay', 'Đơn chờ xử lý', 'Sản phẩm sắp hết', 'Trợ giúp'],
      confidence: 0.70
    }
  }
  
  // ===== CUSTOMER FALLBACK =====
  
  // Help request
  if (lower.includes('giúp') || lower.includes('help') || lower.includes('làm được') || lower.includes('can do')) {
    return {
      response: `🏗️ **Tôi có thể giúp bạn:**\n\n` +
               `🔍 **Tìm kiếm sản phẩm**\n` +
               `- Tìm vật liệu xây dựng\n` +
               `- So sánh giá và chất lượng\n` +
               `- Gợi ý sản phẩm phù hợp\n\n` +
               `📐 **Tính toán vật liệu**\n` +
               `- Ước tính số lượng cần mua\n` +
               `- Tính toán chi phí\n` +
               `- Tư vấn vật liệu cho công trình\n\n` +
               `🛒 **Đặt hàng & Theo dõi**\n` +
               `- Đặt hàng trực tiếp\n` +
               `- Theo dõi đơn hàng của bạn\n` +
               `- Kiểm tra trạng thái giao hàng\n\n` +
               `📸 **Nhận diện hình ảnh**\n` +
               `- Upload ảnh để AI nhận diện vật liệu\n` +
               `- Tìm sản phẩm tương tự\n\n` +
               `💡 Hãy hỏi tôi bất cứ điều gì về vật liệu xây dựng!`,
      suggestions: ['🔍 Tìm sản phẩm', '📐 Tính vật liệu', '💰 Xem giá', '🛒 Đặt hàng'],
      confidence: 0.90
    }
  }
  
  // Price inquiry
  if (lower.includes('giá') || lower.includes('price')) {
    return {
      response: "💰 **Hỏi về giá cả**\n\nGiá xi măng dao động từ 90-110k/bao tùy thương hiệu.\n\nBạn muốn xem giá sản phẩm nào?",
      suggestions: ["Xi măng PC40", "Gạch ống", "Thép xây dựng", "Xem tất cả"],
      confidence: 0.85
    }
  }
  
  // Generic customer fallback
  return {
    response: `💬 **Xin chào!**\n\nTôi là trợ lý AI của VietHoa Construction Materials.\n\n` +
             `Tôi có thể giúp bạn:\n` +
             `🔍 Tìm kiếm vật liệu xây dựng\n` +
             `📐 Tính toán vật liệu cần thiết\n` +
             `💰 Tra cứu giá cả\n` +
             `🛒 Đặt hàng trực tuyến\n` +
             `📦 Theo dõi đơn hàng\n\n` +
             `Bạn cần tôi giúp gì?`,
    suggestions: ["🔍 Tìm sản phẩm", "📐 Tính vật liệu", "💰 Giá cả", "📸 Nhận diện ảnh"],
    confidence: 0.70
  }
}

// GET handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const customerId = searchParams.get('customerId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!sessionId) {
      return NextResponse.json(
        createErrorResponse('Session ID is required', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    const where: any = {
      sessionId,
      interactionType: 'CHATBOT'
    }

    if (customerId) {
      where.customerId = customerId
    }

    const interactions = await prisma.customerInteraction.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: {
        id: true,
        query: true,
        response: true,
        metadata: true,
        createdAt: true
      }
    })

    const chatHistory = interactions.map(interaction => ({
      id: interaction.id,
      userMessage: interaction.query,
      botMessage: interaction.response,
      suggestions: (interaction.metadata as any)?.suggestions || [],
      productRecommendations: (interaction.metadata as any)?.productRecommendations || [],
      confidence: (interaction.metadata as any)?.confidence || 0,
      timestamp: interaction.createdAt
    }))

    return NextResponse.json(
      createSuccessResponse(chatHistory, 'Chat history retrieved successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Get chat history error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
