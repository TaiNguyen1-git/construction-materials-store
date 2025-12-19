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
import { generateChatbotFallbackResponse } from '@/app/api/chatbot/fallback-responses'
import { checkRuleBasedResponse } from '@/lib/chatbot/rule-based-responses'

// ===== HELPER: Filter placeholder guest info =====
const PLACEHOLDER_NAMES = [
  'nguyễn văn a', 'nguyen van a', 'nguyễn thị a', 'nguyen thi a',
  'nguyễn văn b', 'nguyen van b', 'nguyễn thị b', 'nguyen thi b',
  'anh a', 'chị a', 'chi a', 'anh b', 'chị b', 'chi b',
  'khách hàng', 'khach hang', 'customer', 'test', 'abc'
]
const PLACEHOLDER_PHONES = [
  '0912345678', '0123456789', '0987654321', '0909090909',
  '0900000000', '0111111111', '0999999999'
]
function isPlaceholderGuestInfo(info: { name?: string; phone?: string; address?: string } | undefined): boolean {
  if (!info) return true
  const nameLower = (info.name || '').toLowerCase().trim()
  const phoneTrimmed = (info.phone || '').replace(/\s/g, '')

  // Check for placeholder names
  if (PLACEHOLDER_NAMES.some(p => nameLower === p || nameLower.includes(p))) {
    console.log('[GUEST_INFO] Detected placeholder name:', info.name)
    return true
  }
  // Check for placeholder phones
  if (PLACEHOLDER_PHONES.includes(phoneTrimmed)) {
    console.log('[GUEST_INFO] Detected placeholder phone:', info.phone)
    return true
  }
  return false
}

function sanitizeGuestInfo(info: { name?: string; phone?: string; address?: string } | undefined): { name: string; phone: string; address: string } | undefined {
  if (!info) return undefined
  if (isPlaceholderGuestInfo(info)) return undefined
  // Only return if we have real data
  if (!info.name && !info.phone && !info.address) return undefined
  return {
    name: info.name || '',
    phone: info.phone || '',
    address: info.address || ''
  }
}

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
      rateLimitConfig = {
        windowMs: RateLimitConfigs.OCR.windowMs,
        max: 30
      } as any
      rateLimitEndpoint = 'ocr'
    } else if (isAdmin) {
      // Admin queries (analytics, CRUD)
      rateLimitConfig = {
        windowMs: RateLimitConfigs.ANALYTICS.windowMs,
        max: 30
      } as any
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

    // ===== CHECK ACTIVE CONVERSATION FLOW - MUST check BEFORE intent detection =====
    const currentState = await getConversationState(sessionId)

    if (currentState && currentState.flow === 'ORDER_CREATION') {
      const flowResponse = await processFlowResponse(sessionId, message)

      // Always handle flow response if shouldContinue
      if (flowResponse.shouldContinue) {
        // Handle next prompt first (e.g., asking for guest info)
        if (flowResponse.nextPrompt) {
          return NextResponse.json(
            createSuccessResponse({
              message: flowResponse.nextPrompt,
              suggestions: ['Tiếp tục', 'Hủy'],
              confidence: 1.0,
              sessionId,
              timestamp: new Date().toISOString()
            })
          )
        }

        // Handle confirmed orders
        if (flowResponse.isConfirmed) {
          // Order confirmed - create it (this handles both logged-in and guest)
          return await handleOrderCreation(sessionId, customerId, currentState)
        }

        // Handle cancelled orders
        if (flowResponse.isCancelled) {
          clearConversationState(sessionId)
          return NextResponse.json(
            createSuccessResponse({
              message: '❌ Đã hủy đặt hàng.\n\n💡 Bạn có thể đặt hàng lại bất cứ lúc nào.',
              suggestions: ['Tìm sản phẩm', 'Tính vật liệu', 'Giá cả'],
              confidence: 1.0,
              sessionId,
              timestamp: new Date().toISOString()
            })
          )
        }

        // If shouldContinue but no specific action, stay in flow (don't reset)
        // Show current order confirmation again
        return NextResponse.json(
          createSuccessResponse({
            message: '🛒 **Xác nhận đặt hàng**\n\n' +
              'Danh sách sản phẩm:\n' +
              (currentState.data.items || []).map((item: any, idx: number) =>
                `${idx + 1}. ${item.productName || item.name}: ${item.quantity || 1} ${item.unit || 'bao'}`
              ).join('\n') +
              '\n\n✅ Vui lòng xác nhận đặt hàng hoặc hủy bỏ.',
            suggestions: currentState.data.needsGuestInfo
              ? ['Xác nhận', 'Đăng nhập', 'Hủy']
              : ['Xác nhận', 'Hủy'],
            confidence: 1.0,
            sessionId,
            timestamp: new Date().toISOString()
          })
        )
      }

      // Check for questions/comparisons/consultation during order flow
      const questionKeywords = /(?:so sánh|khác nhau|tốt nhất|ngon nhất|tư vấn|là gì|bao nhiêu|\?|tại sao|như thế nào|loại nào|nào tốt)/i
      if (questionKeywords.test(message)) {
        // Pause order flow to answer question
        const aiResponse = await generateChatbotResponse(message, context, conversationHistory, isAdmin)

        // Append reminder to return to order
        const continuationPrompt = currentState.data.items?.length > 0
          ? `\n\n💡 **Bạn vẫn muốn tiếp tục đặt hàng chứ?**`
          : `\n\n💡 **Bạn muốn chọn sản phẩm nào?**`

        return NextResponse.json(
          createSuccessResponse({
            message: aiResponse.response + continuationPrompt,
            suggestions: ['Tiếp tục đặt hàng', 'Xem lại đơn', 'Hủy'],
            confidence: aiResponse.confidence,
            sessionId,
            timestamp: new Date().toISOString()
          })
        )
      }

      // Handle product selection in ORDER_CREATION flow (only if not handled above)
      if (currentState.data.currentStep === 'confirm_items' &&
        (message.toLowerCase().match(/^\d+$/) || (message.length > 3 && !message.toLowerCase().includes('xác nhận')))) {
        const flowData = currentState.data

        // Check if we have pending product clarifications
        if (flowData.pendingProductSelection) {
          // Parse user selection (number or product name)
          const selectedProducts: any[] = []

          for (const pending of flowData.pendingProductSelection) {
            const userChoice = message.toLowerCase().trim()
            let selectedProduct = null

            // Try to match by number (1, 2, 3...)
            const numberMatch = userChoice.match(/^(\d+)$/)
            if (numberMatch) {
              const index = parseInt(numberMatch[1]) - 1
              if (index >= 0 && index < pending.products.length) {
                selectedProduct = pending.products[index]
              }
            } else {
              // Try to match by product name
              selectedProduct = pending.products.find((p: any) =>
                p.name.toLowerCase().includes(userChoice) ||
                userChoice.includes(p.name.toLowerCase())
              )
            }

            if (selectedProduct) {
              // Update the item with selected product
              const originalItem = flowData.items.find((item: any) =>
                item.productName === pending.item.productName
              )
              if (originalItem) {
                originalItem.productName = selectedProduct.name
                originalItem.productId = selectedProduct.id
                selectedProducts.push({
                  ...originalItem,
                  selectedProduct
                })
              }
            } else {
              // No match - keep original item
              selectedProducts.push(pending.item)
            }
          }

          // Update flow data with selected products
          await updateFlowData(sessionId, {
            items: flowData.items.map((item: any) => {
              const selected = selectedProducts.find((s: any) =>
                s.productName === item.productName ||
                (s.selectedProduct && s.selectedProduct.name === item.productName)
              )
              return selected || item
            }),
            pendingProductSelection: null,
            currentStep: 'confirm_items'
          })

          // Show confirmation with selected products
          const needsInfo = !customerId
          return NextResponse.json(
            createSuccessResponse({
              message: '🛒 **Xác nhận đặt hàng**\n\n' +
                'Danh sách sản phẩm:\n' +
                selectedProducts.map((item, idx) =>
                  `${idx + 1}. ${item.selectedProduct?.name || item.productName}: ${item.quantity} ${item.unit}`
                ).join('\n') +
                '\n\n✅ Xác nhận đặt hàng?' +
                (needsInfo ? '\n\n⚠️ *Bạn chưa đăng nhập. Chúng tôi sẽ hỏi thông tin giao hàng sau khi xác nhận.*' : ''),
              suggestions: needsInfo ? ['Xác nhận', 'Đăng nhập', 'Hủy'] : ['Xác nhận', 'Chỉnh sửa', 'Hủy'],
              confidence: 1.0,
              sessionId,
              timestamp: new Date().toISOString()
            })
          )
        }
      }

      // If we're in ORDER_CREATION flow and flow response says shouldContinue,
      // we've already handled it above, so don't continue to intent detection
      // Only allow fallthrough if shouldContinue is false (for product selection handling)
      if (flowResponse.shouldContinue) {
        // Already handled above, should have returned by now
        // But if we reach here, something went wrong - prevent reset by staying in flow
        return NextResponse.json(
          createSuccessResponse({
            message: '🛒 **Xác nhận đặt hàng**\n\n' +
              'Danh sách sản phẩm:\n' +
              (currentState.data.items || []).map((item: any, idx: number) =>
                `${idx + 1}. ${item.productName || item.name}: ${item.quantity || 1} ${item.unit || 'bao'}`
              ).join('\n') +
              '\n\n✅ Vui lòng xác nhận đặt hàng hoặc hủy bỏ.',
            suggestions: currentState.data.needsGuestInfo
              ? ['Xác nhận', 'Đăng nhập', 'Hủy']
              : ['Xác nhận', 'Hủy'],
            confidence: 1.0,
            sessionId,
            timestamp: new Date().toISOString()
          })
        )
      }
    }

    // Handle other flows (OCR_INVOICE, CRUD_CONFIRMATION)
    if (currentState && currentState.flow !== 'ORDER_CREATION') {
      const flowResponse = await processFlowResponse(sessionId, message)

      if (flowResponse.shouldContinue) {
        if (flowResponse.isConfirmed && currentState.flow === 'OCR_INVOICE') {
          return await handleOCRInvoiceSave(sessionId, currentState)
        }

        if (flowResponse.isConfirmed && currentState.flow === 'CRUD_CONFIRMATION') {
          return await handleCRUDExecution(sessionId, currentState, userRole || '')
        }

        if (flowResponse.isCancelled) {
          clearConversationState(sessionId)
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

        if (flowResponse.nextPrompt) {
          return NextResponse.json(
            createSuccessResponse({
              message: flowResponse.nextPrompt,
              suggestions: ['Xác nhận', 'Hủy'],
              confidence: 1.0,
              sessionId,
              timestamp: new Date().toISOString()
            })
          )
        }
      }
    }

    // ===== RULE-BASED RESPONSES (Fast path for simple FAQs) =====
    // Only for customers, not admin (admin needs full AI capabilities)
    if (!isAdmin) {
      const ruleBasedResult = checkRuleBasedResponse(message)

      if (ruleBasedResult.matched) {
        // Handle comparison request (RAG + template-based)
        if (ruleBasedResult.requiresComparison && ruleBasedResult.comparisonProducts) {
          console.log(`[RULE-BASED] Comparison request for: ${ruleBasedResult.comparisonProducts.join(' vs ')}`)

          // Import comparison generator
          const { generateComparisonResponse } = await import('@/lib/chatbot/rule-based-responses')

          // Fetch products from knowledge base (RAG) and DB
          const comparisonData: any[] = []

          for (const productKeyword of ruleBasedResult.comparisonProducts) {
            // Try knowledge base first (has more detailed info)
            const ragProducts = await RAGService.retrieveContext(productKeyword, 1)

            if (ragProducts.length > 0) {
              const ragProduct = ragProducts[0]
              comparisonData.push({
                name: ragProduct.name,
                brand: ragProduct.brand,
                price: ragProduct.pricing.basePrice,
                unit: ragProduct.pricing.unit,
                description: ragProduct.description,
                usage: ragProduct.usage,
                quality: ragProduct.quality
              })
            } else {
              // Fallback to DB
              const dbProduct = await prisma.product.findFirst({
                where: {
                  OR: [
                    { name: { contains: productKeyword, mode: 'insensitive' } },
                    { description: { contains: productKeyword, mode: 'insensitive' } }
                  ],
                  isActive: true
                },
                select: {
                  name: true,
                  price: true,
                  unit: true,
                  description: true
                }
              })

              if (dbProduct) {
                comparisonData.push({
                  name: dbProduct.name,
                  price: dbProduct.price,
                  unit: dbProduct.unit,
                  description: dbProduct.description
                })
              }
            }
          }

          if (comparisonData.length >= 2) {
            const comparisonResponse = generateComparisonResponse(comparisonData)
            return NextResponse.json(
              createSuccessResponse({
                message: comparisonResponse,
                suggestions: ['Đặt hàng', 'Tư vấn thêm', 'Xem giá chi tiết'],
                confidence: 1.0,
                sessionId,
                timestamp: new Date().toISOString()
              })
            )
          }
          // If not enough products found, fall through to AI
          console.log(`[RULE-BASED] Comparison failed - only found ${comparisonData.length} products, falling through to AI`)
        }
        // Handle quick price lookup that needs DB data
        else if (ruleBasedResult.requiresProductLookup && ruleBasedResult.productKeyword) {
          console.log(`[RULE-BASED] Quick price lookup for: ${ruleBasedResult.productKeyword}`)

          // Fetch products matching the keyword
          const products = await prisma.product.findMany({
            where: {
              OR: [
                { name: { contains: ruleBasedResult.productKeyword, mode: 'insensitive' } },
                { category: { name: { contains: ruleBasedResult.productKeyword, mode: 'insensitive' } } }
              ],
              isActive: true
            },
            select: {
              name: true,
              price: true,
              unit: true,
              category: { select: { name: true } }
            },
            take: 5,
            orderBy: { price: 'asc' }
          })

          if (products.length > 0) {
            const priceList = products.map((p, idx) =>
              `${idx + 1}. **${p.name}**: ${p.price.toLocaleString('vi-VN')}đ/${p.unit}`
            ).join('\n')

            return NextResponse.json(
              createSuccessResponse({
                message: `💰 **Bảng giá ${ruleBasedResult.productKeyword}**\n\n${priceList}\n\n💡 Giảm 5-8% khi mua số lượng lớn!`,
                suggestions: ruleBasedResult.suggestions || ['Đặt hàng', 'Tính vật liệu', 'So sánh'],
                confidence: 1.0,
                sessionId,
                timestamp: new Date().toISOString()
              })
            )
          }
          // If no products found, fall through to AI handling
        } else {
          // Direct rule-based response (no DB lookup needed)
          console.log(`[RULE-BASED] Matched! Returning direct response.`)
          return NextResponse.json(
            createSuccessResponse({
              message: ruleBasedResult.response!,
              suggestions: ruleBasedResult.suggestions || [],
              confidence: 1.0,
              sessionId,
              timestamp: new Date().toISOString()
            })
          )
        }
      }
    }

    // Extract entities
    const entities = extractEntities(message)

    // Detect intent
    const intentResult = detectIntent(message, isAdmin, false, {
      currentPage: context?.currentPage
    })

    console.log(`[CHATBOT] Message: "${message}" | isAdmin: ${isAdmin} | Role: ${userRole} | Intent: ${intentResult.intent}`)

    // ===== SECURITY: Prevent customer from accessing admin intents =====
    if (!isAdmin && intentResult.intent.startsWith('ADMIN_')) {
      console.warn(`[CHATBOT] ACCESS DENIED. Non-admin trying to access ${intentResult.intent}`)
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
          action: (entities.action?.toUpperCase() as any) || 'CREATE',
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
      // 1. Try to parse full order request using AI (Smart Order Drafting)
      const aiOrderRequest = await AIService.parseOrderRequest(message)

      if (aiOrderRequest && aiOrderRequest.items && aiOrderRequest.items.length > 0) {
        console.log('AI Parsed Order:', aiOrderRequest)

        // Validate and enrich items with DB data
        const enrichedItems: any[] = []
        const itemsToClarify: Array<{ item: any, products: any[] }> = []

        for (const item of aiOrderRequest.items) {
          // Extract searchable keywords from colloquial product name
          const keywords = extractProductKeywords(item.productName)
          console.log(`[ORDER_CREATE] Searching for "${item.productName}" with keywords:`, keywords)

          // Build OR conditions for all keywords
          const orConditions = keywords.flatMap(kw => [
            { name: { contains: kw, mode: 'insensitive' as const } },
            { description: { contains: kw, mode: 'insensitive' as const } }
          ])

          // Search for products matching this item name using fuzzy keywords
          const matchingProducts = await prisma.product.findMany({
            where: {
              OR: orConditions,
              isActive: true
            },
            select: {
              id: true,
              name: true,
              price: true,
              unit: true,
              sku: true
            },
            take: 5
          })

          if (matchingProducts.length === 1) {
            // Exact match (or single best match)
            enrichedItems.push({
              productName: matchingProducts[0].name,
              productId: matchingProducts[0].id,
              quantity: item.quantity || 1,
              unit: matchingProducts[0].unit,
              selectedProduct: matchingProducts[0]
            })
          } else if (matchingProducts.length > 1) {
            // Multiple matches - need clarification
            itemsToClarify.push({ item, products: matchingProducts })
          } else {
            // No match found - keep original name but mark as invalid/custom
            // Or we could try RAG search here if DB search fails
            itemsToClarify.push({ item, products: [] })
          }
        }

        // If we have items that need clarification, ask user to choose
        if (itemsToClarify.length > 0) {
          const clarificationMessages: string[] = []

          for (const { item, products } of itemsToClarify) {
            if (products.length > 1) {
              clarificationMessages.push(
                `🔍 Tìm thấy **${products.length}** loại **${item.productName}**:\n\n` +
                products.map((p, idx) =>
                  `${idx + 1}. ${p.name} - ${p.price.toLocaleString('vi-VN')}đ/${p.unit}`
                ).join('\n') +
                `\n\n💡 Bạn muốn chọn loại nào? (Ví dụ: "1" hoặc "${products[0].name}")`
              )
            } else {
              clarificationMessages.push(
                `❌ Không tìm thấy sản phẩm **${item.productName}** trong hệ thống.\n` +
                `💡 Vui lòng chọn sản phẩm khác hoặc liên hệ hỗ trợ.`
              )
            }
          }

          // Start flow with what we have
          const initialItems = [...enrichedItems, ...itemsToClarify.map(x => ({
            productName: x.item.productName,
            quantity: x.item.quantity || 1,
            unit: x.item.unit || 'cái'
          }))]

          // Build guest info from AI extraction (with placeholder filter)
          const guestInfo = sanitizeGuestInfo({
            name: aiOrderRequest.customerName || '',
            phone: aiOrderRequest.phone || '',
            address: aiOrderRequest.deliveryAddress || ''
          })

          startOrderCreationFlow(sessionId, initialItems, !!customerId, guestInfo)

          // Store pending selections and VAT info
          await updateFlowData(sessionId, {
            pendingProductSelection: itemsToClarify.filter(({ products }) => products.length > 0),
            vatInfo: aiOrderRequest.vatInfo
          })

          return NextResponse.json(
            createSuccessResponse({
              message: clarificationMessages.join('\n\n'),
              suggestions: ['Chọn sản phẩm', 'Hủy'],
              confidence: 0.9,
              sessionId,
              timestamp: new Date().toISOString()
            })
          )
        }

        // All items valid - proceed to confirmation
        if (enrichedItems.length > 0) {
          // Build guest info from AI extraction (with placeholder filter)
          const guestInfoFromAI = sanitizeGuestInfo({
            name: aiOrderRequest.customerName || '',
            phone: aiOrderRequest.phone || '',
            address: aiOrderRequest.deliveryAddress || ''
          })

          startOrderCreationFlow(sessionId, enrichedItems, !!customerId, guestInfoFromAI)

          // Store VAT info if detected
          if (aiOrderRequest.vatInfo) {
            await updateFlowData(sessionId, {
              vatInfo: aiOrderRequest.vatInfo
            })
          }

          const hasGuestInfo = aiOrderRequest.customerName && aiOrderRequest.phone && aiOrderRequest.deliveryAddress
          const needsInfo = !customerId && !hasGuestInfo

          let infoSummary = ''
          if (aiOrderRequest.customerName || aiOrderRequest.phone || aiOrderRequest.deliveryAddress) {
            infoSummary = '\n\n📍 **Thông tin giao hàng:**\n' +
              `- Tên: ${aiOrderRequest.customerName || '(thiếu)'}\n` +
              `- SĐT: ${aiOrderRequest.phone || '(thiếu)'}\n` +
              `- Địa chỉ: ${aiOrderRequest.deliveryAddress || '(thiếu)'}`
          }

          if (aiOrderRequest.vatInfo) {
            infoSummary += '\n\n🧾 **Thông tin hóa đơn VAT:**\n' +
              `- Công ty: ${aiOrderRequest.vatInfo.companyName}\n` +
              `- MST: ${aiOrderRequest.vatInfo.taxId}\n` +
              `- Địa chỉ: ${aiOrderRequest.vatInfo.companyAddress}`
          }

          return NextResponse.json(
            createSuccessResponse({
              message: '🛒 **Xác nhận đặt hàng**\n\n' +
                'Danh sách sản phẩm:\n' +
                enrichedItems.map((item, idx) =>
                  `${idx + 1}. ${item.productName}: ${item.quantity} ${item.unit}`
                ).join('\n') +
                infoSummary +
                '\n\n✅ Xác nhận đặt hàng?' +
                (needsInfo ? '\n\n⚠️ *Bạn chưa đăng nhập. Chúng tôi sẽ hỏi thêm thông tin giao hàng còn thiếu sau khi xác nhận.*' : ''),
              suggestions: needsInfo ? ['Xác nhận', 'Đăng nhập', 'Hủy'] : ['Xác nhận', 'Chỉnh sửa', 'Hủy'],
              confidence: 0.95,
              sessionId,
              timestamp: new Date().toISOString()
            })
          )
        }
      }

      // Fallback to old logic if AI parsing returns nothing (e.g. just "Đặt hàng")
      const lowerMessage = message.toLowerCase().trim()
      if ((lowerMessage === 'đặt hàng' || lowerMessage === 'order' || lowerMessage.includes('đặt hàng')) &&
        !lowerMessage.match(/\d+/)) {
        // User clicked "Đặt hàng" button - try to find product from recent conversation
        const recentProductMessages = conversationHistory
          .filter((h: any) => h.role === 'assistant')
          .reverse()
          .slice(0, 5) // Check last 5 assistant messages

        // Try to get product from conversation state or recent product search
        let foundProduct: any = null

        // Method 1: Check if there's a recent product search result stored in state
        const currentState = await getConversationState(sessionId)
        if (currentState && currentState.data?.lastSearchedProduct) {
          foundProduct = currentState.data.lastSearchedProduct
        }

        // Method 2: Extract from conversation history - look for product names
        if (!foundProduct) {
          for (const msg of recentProductMessages) {
            if (msg.content) {
              // Try to match common product patterns
              const productPatterns = [
                /(Xi măng\s+[A-Z0-9\s]+)/i,
                /(Gạch\s+[A-Z0-9\s]+)/i,
                /(Cát\s+[A-Z0-9\s]+)/i,
                /(Đá\s+[A-Z0-9\s]+)/i,
                /(Sơn\s+[A-Z0-9\s]+)/i,
                /(Tôn\s+[A-Z0-9\s]+)/i,
                /(Thép\s+[A-Z0-9\s]+)/i,
              ]

              for (const pattern of productPatterns) {
                const match = msg.content.match(pattern)
                if (match) {
                  const productName = match[1].trim()
                  // Search for this product
                  foundProduct = await prisma.product.findFirst({
                    where: {
                      name: { contains: productName, mode: 'insensitive' },
                      isActive: true
                    },
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      unit: true,
                      sku: true
                    }
                  })
                  if (foundProduct) break
                }
              }
              if (foundProduct) break

              // Also try to extract from numbered list format: "1. Xi măng INSEE PC40"
              const listMatch = msg.content.match(/\d+\.\s*(?:Xi măng|Gạch|Cát|Đá|Sơn|Tôn|Thép)\s+([A-Z0-9\s]+)/i)
              if (listMatch) {
                const productName = listMatch[0].replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim()
                foundProduct = await prisma.product.findFirst({
                  where: {
                    name: { contains: productName, mode: 'insensitive' },
                    isActive: true
                  },
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    unit: true,
                    sku: true
                  }
                })
                if (foundProduct) break
              }
            }
          }
        }

        // Method 3: If still not found, get the first product from recent search results
        if (!foundProduct) {
          // Look for the most recent product search and get the first result
          for (const msg of recentProductMessages) {
            if (msg.content && msg.content.includes('Tìm thấy')) {
              // Extract first product name from search results
              const firstProductMatch = msg.content.match(/\d+\.\s*\*\*([^*]+)\*\*/)
              if (firstProductMatch) {
                const productName = firstProductMatch[1].trim()
                foundProduct = await prisma.product.findFirst({
                  where: {
                    name: { contains: productName, mode: 'insensitive' },
                    isActive: true
                  },
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    unit: true,
                    sku: true
                  }
                })
                if (foundProduct) break
              }
            }
          }
        }

        // If product found, create order with default quantity (1)
        if (foundProduct) {
          const defaultQuantity = 1
          const defaultUnit = foundProduct.unit || 'bao'

          // Start order creation flow with found product
          const orderItems = [{
            productName: foundProduct.name,
            quantity: defaultQuantity,
            unit: defaultUnit,
            productId: foundProduct.id
          }]

          startOrderCreationFlow(sessionId, orderItems, !!customerId)

          const needsInfo = !customerId

          return NextResponse.json(
            createSuccessResponse({
              message: '🛒 **Xác nhận đặt hàng**\n\n' +
                `**Sản phẩm:** ${foundProduct.name}\n` +
                `**Số lượng:** ${defaultQuantity} ${defaultUnit}\n` +
                `**Giá:** ${foundProduct.price.toLocaleString('vi-VN')}đ/${defaultUnit}\n\n` +
                '💡 *Bạn có muốn thay đổi số lượng không?*\n\n' +
                '✅ Xác nhận đặt hàng?' +
                (needsInfo ? '\n\n⚠️ *Bạn chưa đăng nhập. Chúng tôi sẽ hỏi thông tin giao hàng sau khi xác nhận.*' : ''),
              suggestions: needsInfo ? ['Xác nhận', 'Đăng nhập', 'Chỉnh sửa số lượng', 'Hủy'] : ['Xác nhận', 'Chỉnh sửa số lượng', 'Hủy'],
              confidence: 0.9,
              sessionId,
              timestamp: new Date().toISOString()
            })
          )
        }
      }

      // Try to parse order items from message
      const parsedItems = parseOrderItems(message)

      if (parsedItems.length > 0) {
        // Check if we need to clarify product variants
        const itemsToClarify: Array<{ item: any, products: any[] }> = []

        for (const item of parsedItems) {
          // Search for products matching this item name
          const matchingProducts = await prisma.product.findMany({
            where: {
              OR: [
                { name: { contains: item.productName, mode: 'insensitive' } },
                { description: { contains: item.productName, mode: 'insensitive' } }
              ],
              isActive: true
            },
            select: {
              id: true,
              name: true,
              price: true,
              unit: true,
              sku: true
            },
            take: 10
          })

          // If multiple products found, need clarification
          if (matchingProducts.length > 1) {
            itemsToClarify.push({ item, products: matchingProducts })
          } else if (matchingProducts.length === 0) {
            // No products found - might need to suggest alternatives
            itemsToClarify.push({ item, products: [] })
          }
        }

        // If we have items that need clarification, ask user to choose
        if (itemsToClarify.length > 0) {
          const clarificationMessages: string[] = []

          for (const { item, products } of itemsToClarify) {
            if (products.length > 1) {
              // Multiple variants found - ask user to choose
              clarificationMessages.push(
                `🔍 Tìm thấy **${products.length}** loại **${item.productName}**:\n\n` +
                products.map((p, idx) =>
                  `${idx + 1}. ${p.name} - ${p.price.toLocaleString('vi-VN')}đ/${p.unit}`
                ).join('\n') +
                `\n\n💡 Bạn muốn chọn loại nào? (Ví dụ: "1" hoặc "${products[0].name}")`
              )
            } else if (products.length === 0) {
              // No products found
              clarificationMessages.push(
                `❌ Không tìm thấy sản phẩm **${item.productName}** trong hệ thống.\n` +
                `💡 Vui lòng chọn sản phẩm khác hoặc liên hệ hỗ trợ.`
              )
            }
          }

          if (clarificationMessages.length > 0) {
            // Store items and pending selections for later use
            startOrderCreationFlow(sessionId, parsedItems, !!customerId)

            // Store pending product selections in flow data
            await updateFlowData(sessionId, {
              pendingProductSelection: itemsToClarify.filter(({ products }) => products.length > 0)
            })

            return NextResponse.json(
              createSuccessResponse({
                message: clarificationMessages.join('\n\n'),
                suggestions: ['Chọn sản phẩm', 'Hủy', 'Tìm sản phẩm khác'],
                confidence: intentResult.confidence,
                sessionId,
                timestamp: new Date().toISOString()
              })
            )
          }
        }

        // All items are clear - proceed with confirmation
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

      // Check if this is a button click ("Đặt hàng ngay") vs a fresh order with product details
      const lowerMsg = message.toLowerCase().trim()
      const isButtonClick = lowerMsg === 'đặt hàng ngay' || lowerMsg === 'đặt hàng' || lowerMsg === 'order now'

      // First check if there's stored calculation data - ONLY use if it's a button click
      const currentState = await getConversationState(sessionId)
      if (isButtonClick && currentState?.data?.lastCalculation && currentState.data.lastCalculation.length > 0) {
        // Use stored calculation items directly
        const items = currentState.data.lastCalculation
        const storedGuestInfo = currentState.data.guestInfo
        console.log('[ORDER_CREATE] Button click - Using stored calculation items:', items)
        console.log('[ORDER_CREATE] Using stored guestInfo:', storedGuestInfo)

        // Pass stored guest info to order flow
        startOrderCreationFlow(sessionId, items, !!customerId, storedGuestInfo)

        // Build guest info display if available
        let guestInfoDisplay = ''
        const hasCompleteGuestInfo = storedGuestInfo?.name && storedGuestInfo?.phone && storedGuestInfo?.address
        if (storedGuestInfo && (storedGuestInfo.name || storedGuestInfo.phone || storedGuestInfo.address)) {
          guestInfoDisplay = '\n\n📍 **Thông tin giao hàng:**\n' +
            `- Tên: ${storedGuestInfo.name || '(thiếu)'}\n` +
            `- SĐT: ${storedGuestInfo.phone || '(thiếu)'}\n` +
            `- Địa chỉ: ${storedGuestInfo.address || '(thiếu)'}`
        }

        return NextResponse.json(
          createSuccessResponse({
            message: '🛒 **Xác nhận đặt hàng**\n\n' +
              'Danh sách vật liệu từ tính toán:\n' +
              items.map((item: any, idx: number) =>
                `${idx + 1}. ${item.productName}: ${item.quantity} ${item.unit}`
              ).join('\n') +
              guestInfoDisplay +
              '\n\n✅ Xác nhận đặt hàng?' +
              (hasCompleteGuestInfo ? '' : '\n\n⚠️ *Bạn chưa đăng nhập. Chúng tôi sẽ hỏi thông tin giao hàng sau khi xác nhận.*'),
            suggestions: ['Xác nhận', 'Đăng nhập', 'Hủy'],
            confidence: 0.95,
            sessionId,
            timestamp: new Date().toISOString()
          })
        )
      }

      // Clear old calculation state if this is a fresh order (not button click)
      if (!isButtonClick && currentState?.data?.lastCalculation) {
        console.log('[ORDER_CREATE] Fresh order detected - clearing old calculation state')
        await clearConversationState(sessionId)
      }

      // Fallback: Check if there's a recent material calculation in history
      const recentCalc = conversationHistory.reverse().find(h =>
        h.role === 'assistant' && (
          h.content.includes('KẾT QUẢ TÍNH TOÁN') ||
          h.content.includes('DANH SÁCH VẬT LIỆU')
        )
      )

      if (recentCalc) {
        // Parse material list from calculation result dynamically
        const items: Array<{ productName: string, quantity: number, unit: string }> = []
        const calcContent = recentCalc.content

        // Parse patterns like "• Xi măng dán gạch: 8 bao" or "• Gạch lát (60x60): 42 m²"
        const materialPattern = /•\s*([^:]+):\s*([0-9.]+)\s*([^\n\(]+)/g
        let match
        while ((match = materialPattern.exec(calcContent)) !== null) {
          const productName = match[1].trim()
          const quantity = parseFloat(match[2])
          const unit = match[3].trim()
          if (productName && quantity > 0) {
            items.push({ productName, quantity, unit })
          }
        }

        // If no items parsed, try simpler pattern
        if (items.length === 0) {
          // Fallback: look for common material names
          if (calcContent.includes('Xi măng')) items.push({ productName: 'Xi măng', quantity: 10, unit: 'bao' })
          if (calcContent.includes('Gạch')) items.push({ productName: 'Gạch', quantity: 50, unit: 'm²' })
          if (calcContent.includes('Cát')) items.push({ productName: 'Cát xây dựng', quantity: 1, unit: 'm³' })
        }

        if (items.length > 0) {
          startOrderCreationFlow(sessionId, items)

          return NextResponse.json(
            createSuccessResponse({
              message: '🛒 **Xác nhận đặt hàng**\n\n' +
                'Danh sách vật liệu từ tính toán:\n' +
                items.map((item, idx) =>
                  `${idx + 1}. ${item.productName}: ${item.quantity} ${item.unit}`
                ).join('\n') +
                '\n\n✅ Xác nhận đặt hàng?' +
                '\n\n⚠️ *Bạn chưa đăng nhập. Chúng tôi sẽ hỏi thông tin giao hàng sau khi xác nhận.*',
              suggestions: ['Xác nhận', 'Đăng nhập', 'Hủy'],
              confidence: 0.9,
              sessionId,
              timestamp: new Date().toISOString()
            })
          )
        }
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

          // Store the first product in a temporary location for quick order
          // We'll use conversation history to store this instead of state
          // (State is only for active flows like ORDER_CREATION)

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
        const calcInput = await materialCalculator.parseQueryWithAI(message)

        if (calcInput) {
          const calcResult = await materialCalculator.quickCalculate(calcInput)
          const formattedResponse = materialCalculator.formatForChat(calcResult)

          // Store calculation items in conversation state for "Đặt hàng ngay" button
          const calcItems = calcResult.materials?.map(m => ({
            productName: m.material,
            quantity: m.quantity,
            unit: m.unit
          })) || []

          // Also try to extract guest info from the message for later use
          let guestInfoFromMessage: any = undefined
          try {
            const parsedInfo = await AIService.parseOrderRequest(message)
            if (parsedInfo && (parsedInfo.customerName || parsedInfo.phone || parsedInfo.deliveryAddress)) {
              guestInfoFromMessage = {
                name: parsedInfo.customerName || '',
                phone: parsedInfo.phone || '',
                address: parsedInfo.deliveryAddress || ''
              }
              console.log('[MATERIAL_CALCULATE] Extracted guest info:', guestInfoFromMessage)
            }
          } catch (e) {
            console.log('[MATERIAL_CALCULATE] Could not extract guest info:', e)
          }

          if (calcItems.length > 0) {
            await setConversationState(sessionId, 'NONE', 0, {
              lastCalculation: calcItems,
              calculationTotal: calcResult.totalEstimatedCost,
              guestInfo: guestInfoFromMessage // Store for later use
            })
          }

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
        } else {
          // If not found in DB, try RAG via fallback
          // Don't return error here, let it fall through to RAG
          console.log('Product not found in DB for price inquiry, falling back to RAG')
        }
      } catch (error) {
        console.error('Price inquiry error:', error)
      }
    }

    // ===== FALLBACK: Use RAG + AI =====
    // Use RAG to get context for the query
    const augmentedPrompt = await RAGService.generateAugmentedPrompt(message)

    // Call AI with augmented prompt
    const botResponse = await AIService.generateChatbotResponse(augmentedPrompt, context, conversationHistory)

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
            entities: entities as any, // Serialize entities as JSON
            context: context as any
          } as any,
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

    // ===== CONFIRM ALL PENDING ORDERS =====
    // Matches: "xác nhận tất cả", "confirm all", "xác nhận", "confirm", "duyệt tất cả"
    if (
      (lower.includes('xác nhận') && lower.includes('tất cả')) ||
      lower === 'xác nhận tất cả' ||
      lower.includes('confirm all') ||
      (lower.includes('duyệt') && lower.includes('tất cả')) ||
      lower === 'trạng thái pending' || // From suggestion button
      lower === 'xác nhận' || // User confirming after seeing pending orders
      lower === 'confirm' ||
      lower === 'xác nhận đơn' ||
      lower === 'duyệt đơn'
    ) {
      // Get all pending orders (both PENDING and PENDING_CONFIRMATION)
      const pendingOrders = await prisma.order.findMany({
        where: {
          status: {
            in: ['PENDING', 'PENDING_CONFIRMATION']
          }
        },
        select: {
          id: true,
          orderNumber: true,
          netAmount: true,
          guestName: true,
          customerType: true,
          status: true, // Include current status
          customer: {
            include: { user: true }
          }
        }
      })

      if (pendingOrders.length === 0) {
        return NextResponse.json(
          createSuccessResponse({
            message: '✅ **Không có đơn hàng chờ xử lý!**\n\nTất cả đơn hàng đã được xác nhận.',
            suggestions: ['Xem tất cả đơn', 'Doanh thu hôm nay', 'Trợ giúp'],
            confidence: 1.0,
            sessionId,
            timestamp: new Date().toISOString()
          })
        )
      }

      // Confirm all pending orders
      const confirmedOrders: string[] = []
      const failedOrders: string[] = []

      for (const order of pendingOrders) {
        try {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'CONFIRMED',
              updatedAt: new Date()
            }
          })

          // Create order tracking entry
          await prisma.orderTracking.create({
            data: {
              orderId: order.id,
              status: 'CONFIRMED',
              description: 'Đơn hàng được xác nhận qua chatbot (Xác nhận tất cả)',
              createdBy: 'ADMIN_CHATBOT'
            }
          })

          confirmedOrders.push(order.orderNumber)
        } catch (err) {
          console.error(`Failed to confirm order ${order.orderNumber}:`, err)
          failedOrders.push(order.orderNumber)
        }
      }

      let responseMsg = `✅ **Đã Xác Nhận Đơn Hàng**\n\n`

      if (confirmedOrders.length > 0) {
        responseMsg += `🎉 Đã xác nhận thành công **${confirmedOrders.length}** đơn hàng:\n\n`
        confirmedOrders.slice(0, 10).forEach((orderNum, idx) => {
          responseMsg += `${idx + 1}. ${orderNum} ✅\n`
        })

        if (confirmedOrders.length > 10) {
          responseMsg += `... và ${confirmedOrders.length - 10} đơn khác\n`
        }

        // Calculate total value
        const totalValue = pendingOrders
          .filter(o => confirmedOrders.includes(o.orderNumber))
          .reduce((sum, o) => sum + o.netAmount, 0)

        responseMsg += `\n💰 Tổng giá trị: **${totalValue.toLocaleString('vi-VN')}đ**\n`
      }

      if (failedOrders.length > 0) {
        responseMsg += `\n⚠️ Có **${failedOrders.length}** đơn không thể xác nhận:\n`
        failedOrders.forEach(orderNum => {
          responseMsg += `- ${orderNum} ❌\n`
        })
      }

      responseMsg += `\n💡 Các đơn hàng đã chuyển sang trạng thái "Đã xác nhận" và sẵn sàng xử lý.`

      return NextResponse.json(
        createSuccessResponse({
          message: responseMsg,
          suggestions: ['Xem đơn đã xác nhận', 'Đơn chờ xử lý', 'Doanh thu hôm nay'],
          confidence: 1.0,
          sessionId,
          timestamp: new Date().toISOString(),
          data: {
            confirmedCount: confirmedOrders.length,
            failedCount: failedOrders.length,
            confirmedOrders,
            failedOrders
          }
        })
      )
    }

    // Check for pending orders
    if (lower.includes('chờ') || lower.includes('pending')) {
      const pendingOrders = await prisma.order.findMany({
        where: {
          status: {
            in: ['PENDING', 'PENDING_CONFIRMATION']
          }
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
    // Note: safetyStockLevel and reorderQuantity may not be in schema
    // Using a default safety stock of 10% of current quantity or 10 units
    const lowStockItems = inventoryItems.filter(item => {
      const safetyStock = Math.max(10, Math.floor(item.availableQuantity * 0.1))
      return item.availableQuantity <= safetyStock && safetyStock > 0
    })

    // Calculate critical items (out of stock or near zero)
    const criticalItems = lowStockItems.filter(item => {
      const safetyStock = Math.max(10, Math.floor(item.availableQuantity * 0.1))
      return item.availableQuantity <= safetyStock * 0.3
    })

    // Calculate warning items
    const warningItems = lowStockItems.filter(item => {
      const safetyStock = Math.max(10, Math.floor(item.availableQuantity * 0.1))
      return item.availableQuantity > safetyStock * 0.3 && item.availableQuantity <= safetyStock
    })

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
        const safetyStock = Math.max(10, Math.floor(item.availableQuantity * 0.1))
        const daysLeft = item.availableQuantity > 0 && safetyStock > 0
          ? Math.floor(item.availableQuantity / (safetyStock * 0.1))
          : 0

        responseMsg += `${idx + 1}. **${item.product.name}**\n`
        responseMsg += `   📦 Còn: ${item.availableQuantity} ${item.product.unit}\n`
        responseMsg += `   ⚡ Mức an toàn: ${safetyStock} ${item.product.unit}\n`
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
      const safetyStock = Math.max(10, Math.floor(item.availableQuantity * 0.1))
      const reorderQty = Math.max(100, safetyStock * 2) // Default reorder quantity
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
          criticalItems: criticalItems.slice(0, 5).map(i => {
            const safetyStock = Math.max(10, Math.floor(i.availableQuantity * 0.1))
            return {
              productName: i.product.name,
              available: i.availableQuantity,
              safetyLevel: safetyStock,
              unit: i.product.unit
            }
          })
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

/**
 * Extract searchable keywords from colloquial Vietnamese product names
 * Maps common customer terms to database-searchable keywords
 */
function extractProductKeywords(productName: string): string[] {
  const keywords: string[] = []
  const lower = productName.toLowerCase()

  // Vietnamese colloquial aliases -> Database keywords
  // Cát variations
  if (lower.includes('cát tô') || lower.includes('cát xây tô')) {
    keywords.push('cát xây dựng', 'cát')
  } else if (lower.includes('cát san lấp') || lower.includes('cát vàng')) {
    keywords.push('cát vàng', 'cát')
  } else if (lower.includes('cát')) {
    keywords.push('cát')
  }

  // Xi măng variations
  if (lower.includes('insee')) keywords.push('INSEE')
  if (lower.includes('hà tiên')) keywords.push('Hà Tiên')
  if (lower.includes('xi măng') || lower.includes('ximang') || lower.includes('xi-măng')) {
    keywords.push('xi măng')
  }

  // Gạch variations
  if (lower.includes('gạch ống') || lower.includes('gạch ong') || lower.includes('gach ong')) {
    keywords.push('gạch ống', 'gạch')
  } else if (lower.includes('gạch đỏ') || lower.includes('gạch đinh') || lower.includes('gach dinh')) {
    keywords.push('gạch đinh', 'gạch đỏ', 'gạch')
  } else if (lower.includes('gạch') || lower.includes('gach')) {
    keywords.push('gạch')
  }

  // Đá variations  
  if (lower.includes('đá 1x2') || lower.includes('đá dăm') || lower.includes('da dam')) {
    keywords.push('đá 1x2', 'đá')
  } else if (lower.includes('đá mi') || lower.includes('đá mạt') || lower.includes('da mi')) {
    keywords.push('đá mi', 'đá')
  } else if (lower.includes('đá') || lower.includes('da ')) {
    keywords.push('đá')
  }

  // Thép/Sắt
  if (lower.includes('thép') || lower.includes('sắt') || lower.includes('sat ') || lower.includes('thep')) {
    keywords.push('thép')
  }

  // If no known keywords found, try to extract meaningful words
  if (keywords.length === 0) {
    // Split and use words longer than 2 characters
    const words = productName.split(/\s+/).filter(w => w.length > 2)
    if (words.length > 0) {
      // Take first 2 meaningful words
      keywords.push(...words.slice(0, 2))
    } else {
      // Fallback to full product name
      keywords.push(productName)
    }
  }

  return keywords
}

async function handleOrderCreation(sessionId: string, customerId: string | undefined, state: any) {
  try {
    const flowData = state.data

    // Determine if guest or registered customer
    const isGuest = !customerId
    let customerInfo: any

    if (isGuest) {
      // Guest order - use provided info
      console.log('Guest order - flowData.guestInfo:', JSON.stringify(flowData.guestInfo, null, 2))

      if (!flowData.guestInfo) {
        return NextResponse.json(
          createSuccessResponse({
            message: '❌ Thiếu thông tin giao hàng. Vui lòng cung cấp:\n' +
              '- Họ tên\n' +
              '- Số điện thoại\n' +
              '- Địa chỉ\n\n' +
              '💡 Ví dụ: Nguyễn Văn A, 0901234567, 123 Nguyễn Huệ, Q1, HCM',
            suggestions: ['Nhập lại', 'Đăng nhập'],
            confidence: 1.0,
            sessionId,
            timestamp: new Date().toISOString()
          })
        )
      }

      const guestInfo = flowData.guestInfo
      console.log('=== CHECKING GUEST INFO IN ORDER CREATION ===')
      console.log('flowData:', JSON.stringify(flowData, null, 2))
      console.log('guestInfo:', JSON.stringify(guestInfo, null, 2))
      console.log('Has name:', !!guestInfo?.name, guestInfo?.name)
      console.log('Has phone:', !!guestInfo?.phone, guestInfo?.phone)
      console.log('Has address:', !!guestInfo?.address, guestInfo?.address)
      console.log('=============================================')

      if (!guestInfo || !guestInfo.name || !guestInfo.phone || !guestInfo.address) {
        return NextResponse.json(
          createSuccessResponse({
            message: '❌ Thiếu thông tin giao hàng. Vui lòng cung cấp:\n' +
              '- Họ tên\n' +
              '- Số điện thoại\n' +
              '- Địa chỉ\n\n' +
              `💡 Thông tin hiện tại:\n` +
              `- Tên: ${guestInfo?.name || '(chưa có)'}\n` +
              `- SĐT: ${guestInfo?.phone || '(chưa có)'}\n` +
              `- Địa chỉ: ${guestInfo?.address || '(chưa có)'}\n\n` +
              '💡 Ví dụ: Nguyễn Văn A, 0901234567, 123 Nguyễn Huệ, Q1, HCM',
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

    // Create order with transaction (increased timeout for large orders)
    const result = await prisma.$transaction(async (tx) => {
      const items = flowData.items || []
      let subtotal = 0
      const orderItems: any[] = []
      let itemsMatched = 0

      // Match products and calculate totals using fuzzy keyword search
      for (const item of items) {
        const keywords = extractProductKeywords(item.productName)
        console.log(`[ORDER] Searching for: "${item.productName}" with keywords:`, keywords)

        // Search for matching product in DB using fuzzy matching
        let product = null
        for (const keyword of keywords) {
          product = await tx.product.findFirst({
            where: {
              OR: [
                { name: { contains: keyword, mode: 'insensitive' } },
                { tags: { hasSome: [keyword.toLowerCase()] } }
              ],
              isActive: true
            }
          })
          if (product) break
        }

        if (product) {
          const quantity = item.quantity || 1
          const unitPrice = product.price
          const itemSubtotal = quantity * unitPrice

          const discount = 0
          const totalPrice = itemSubtotal - discount

          orderItems.push({
            productId: product.id,
            quantity,
            unitPrice,
            totalPrice,
            discount
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

      // Calculate deposit (50% of total)
      const depositPercentage = 50
      const depositAmount = Math.round(subtotal * (depositPercentage / 100))
      const remainingAmount = subtotal - depositAmount

      // Prepare billing address (VAT Info)
      let billingAddress = undefined
      if (flowData.vatInfo) {
        billingAddress = {
          taxId: flowData.vatInfo.taxId,
          companyName: flowData.vatInfo.companyName,
          companyAddress: flowData.vatInfo.companyAddress
        }
      }

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
          billingAddress: billingAddress ? billingAddress : undefined, // Save VAT info here
          notes: isGuest
            ? 'Đơn hàng từ Chatbot AI (Khách vãng lai)'
            : 'Đơn hàng tạo từ Chatbot AI'
        }
      })

      // Create order items in batch (faster than loop)
      await tx.orderItem.createMany({
        data: orderItems.map(item => ({
          orderId: order.id,
          ...item
        }))
      })

      return {
        order,
        itemsMatched,
        totalItems: items.length
      }
    }, {
      timeout: 30000 // 30 seconds timeout for large orders
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

    // Generate VietQR Link
    // Format: https://img.vietqr.io/image/[BANK_ID]-[ACCOUNT_NO]-[TEMPLATE].png?amount=[AMOUNT]&addInfo=[CONTENT]
    // Using a placeholder bank info (Vietcombank - 970436)
    const bankId = '970436' // Vietcombank BIN
    const accountNo = '1234567890' // Placeholder account
    const template = 'compact2'
    const amount = result.order.depositAmount || 0
    const content = `COC ${result.order.orderNumber}`
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`

    return NextResponse.json(
      createSuccessResponse({
        message: `✅ Đặt hàng thành công! Mã đơn: **${result.order.orderNumber}**\n\n` +
          `📦 **Chi tiết đơn hàng:**\n` +
          `- Khách hàng: ${customerInfo.name}\n` +
          `- SĐT: ${customerInfo.phone}\n` +
          `- Tổng tiền: ${result.order.netAmount.toLocaleString('vi-VN')}đ\n` +
          `- Sản phẩm: ${result.itemsMatched}/${result.totalItems} items\n` +
          `- Đặt cọc: ${(result.order.depositAmount || 0).toLocaleString('vi-VN')}đ (50%)\n` +
          (flowData.vatInfo ? `- Xuất hóa đơn VAT: ✅\n\n` : `\n`) +
          `💳 **QUÉT MÃ ĐỂ THANH TOÁN CỌC:**\n` +
          `![QR Code](${qrUrl})\n\n` +
          `⏳ **Bước tiếp theo:**\n` +
          `1. Quét mã QR trên để thanh toán cọc.\n` +
          `2. Admin sẽ xác nhận đơn hàng và thanh toán của bạn.\n` +
          `3. ${isGuest ? 'Chúng tôi sẽ gọi điện xác nhận giao hàng.' : 'Bạn có thể theo dõi trạng thái đơn hàng.'}\n\n` +
          (isGuest
            ? `📞 Chúng tôi sẽ liên hệ qua SĐT **${customerInfo.phone}** để xác nhận!\n\n` +
            `📋 **Lưu mã đơn hàng:** ${result.order.orderNumber}\n` +
            `💡 [👉 Theo dõi đơn hàng tại đây](/order-tracking?orderNumber=${result.order.orderNumber})`
            : `👉 [Xem chi tiết đơn hàng](/account/orders/${result.order.id})`),
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
    if (interaction.query) {
      formattedHistory.push({ role: 'user', content: interaction.query })
    }
    if (interaction.response) {
      formattedHistory.push({ role: 'assistant', content: interaction.response })
    }
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
  // Try to use AI service first if enabled
  if (isAIEnabled()) {
    try {
      return await AIService.generateChatbotResponse(message, context, conversationHistory, isAdmin)
    } catch (error) {
      console.error('AI Service failed, falling back to static response:', error)
      // Fall through to static response
    }
  }

  // Use the extracted fallback response generator
  return generateChatbotFallbackResponse(message, isAdmin)
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
