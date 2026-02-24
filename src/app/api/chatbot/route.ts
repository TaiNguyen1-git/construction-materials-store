/**
 * POST /api/chatbot  –  Route Orchestrator
 * GET  /api/chatbot  –  Chat history retrieval
 *
 * All heavy logic lives in ./handlers/*.handler.ts
 * This file is intentionally thin: validate → rate-limit → dispatch → respond
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { AIService } from '@/lib/ai-service'
import { RAGService } from '@/lib/rag-service'
import { ADMIN_WELCOME_MESSAGE, CUSTOMER_WELCOME_MESSAGE } from '@/lib/ai-prompts-admin'
import { detectIntent, type IntentResult } from '@/lib/chatbot/intent-detector'
import { extractEntities } from '@/lib/chatbot/entity-extractor'
import {
  getConversationState,
  processFlowResponse,
  clearConversationState,
  updateFlowData
} from '@/lib/chatbot/conversation-state'
import { checkRateLimit, getRateLimitIdentifier, RateLimitConfigs, formatRateLimitError } from '@/lib/rate-limiter'
import { checkRuleBasedResponse } from '@/lib/chatbot/rule-based-responses'

// ── Handlers ──────────────────────────────────────────────────────────────────
import { handleAdminOrderManagement, handleAdminInventoryCheck, handleAdminCRUD, handleAdminAnalytics } from './handlers/admin.handler'
import { handleOCRInvoiceFlow, handleOCRInvoiceSave, handleCustomerImageRecognition } from './handlers/image.handler'
import { handleOrderCreateIntent, handleOrderCreation, handleCRUDExecution } from './handlers/order-flow.handler'
import {
  handleProductSearch, handlePriceInquiry, handleMaterialCalculation,
  handleComparisonQuery, handleRuleBasedPriceLookup,
  generateChatbotResponse, getConversationHistory
} from './handlers/customer.handler'

// ─── Validation Schema ─────────────────────────────────────────────────────────

const chatMessageSchema = z.object({
  message: z.string().max(3000, 'Tin nhắn quá dài (tối đa 3000 ký tự)').optional(),
  image: z.string()
    .max(7 * 1024 * 1024, 'Kích thước ảnh quá lớn (tối đa 5MB thực tế)')
    .regex(/^data:image\/(png|jpeg|webp|jpg);base64,/, 'Định dạng ảnh không hợp lệ')
    .optional(),
  customerId: z.string().optional(),
  sessionId: z.string().min(1, 'Session ID is required'),
  userRole: z.string().optional(),
  isAdmin: z.boolean().optional(),
  context: z.object({
    currentPage: z.string().optional(),
    productId: z.string().optional(),
    categoryId: z.string().optional(),
  }).optional(),
}).refine(data => data.message || data.image, { message: 'Vui lòng nhập lời nhắn hoặc gửi ảnh' })

// ─── POST /api/chatbot ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') || 'unknown'

    const body = await request.json()
    const validation = chatMessageSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { message, image, customerId, sessionId, context, isAdmin, userRole } = validation.data
    const isGuest = !userRole || userRole === 'CUSTOMER' || !customerId || customerId.startsWith('guest_')

    // ── Rate Limiting ──────────────────────────────────────────────────────────
    let rateLimitConfig: { windowMs: number; max: number }
    let rateLimitEndpoint = 'chatbot'

    if (image) { rateLimitConfig = isGuest ? RateLimitConfigs.OCR.GUEST : RateLimitConfigs.OCR.AUTH; rateLimitEndpoint = 'ocr' }
    else if (isAdmin) { rateLimitConfig = RateLimitConfigs.ANALYTICS; rateLimitEndpoint = 'admin' }
    else { rateLimitConfig = isGuest ? RateLimitConfigs.CHATBOT.GUEST : RateLimitConfigs.CHATBOT.AUTH }

    const rateLimitId = getRateLimitIdentifier(ip, customerId, rateLimitEndpoint)
    const rateLimitResult = await checkRateLimit(rateLimitId, rateLimitConfig)

    if (!rateLimitResult.allowed) {
      const resetAt = rateLimitResult.resetAt || Date.now() + 60000
      let errorMessage = formatRateLimitError({ ...rateLimitResult, resetAt })
      if (isGuest) errorMessage += '\n\n💡 **Mẹo:** Đăng ký tài khoản ngay để nhận hạn mức nhắn tin gấp 10 lần và nhiều ưu đãi xây dựng khác!'
      return NextResponse.json(
        createSuccessResponse({ message: errorMessage, suggestions: isGuest ? ['Đăng ký ngay', 'Thử lại sau'] : ['Thử lại sau', 'Liên hệ hỗ trợ'], confidence: 1.0, sessionId, data: { isRateLimit: true, isGuest } }),
        { status: 200, headers: { 'X-RateLimit-Limit': rateLimitConfig.max.toString(), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': resetAt.toString() } }
      )
    }

    let marketingMessage = ''
    if (isGuest && rateLimitResult.remaining <= 3 && rateLimitResult.remaining > 0) {
      marketingMessage = '\n\n*(Bạn sắp hết lượt chatbot cho khách. Đăng ký để không bị gián đoạn nhé!)*'
    }

    // ── Welcome Messages ───────────────────────────────────────────────────────
    if (message === 'admin_hello' && isAdmin) {
      return NextResponse.json(createSuccessResponse({ message: ADMIN_WELCOME_MESSAGE.message, suggestions: ADMIN_WELCOME_MESSAGE.suggestions, productRecommendations: [], confidence: 1.0, sessionId, timestamp: new Date().toISOString() }))
    }
    if (message === 'hello' && !isAdmin) {
      return NextResponse.json(createSuccessResponse({ message: CUSTOMER_WELCOME_MESSAGE.message, suggestions: CUSTOMER_WELCOME_MESSAGE.suggestions, productRecommendations: [], confidence: 1.0, sessionId, timestamp: new Date().toISOString() }))
    }

    // ── Fast Path: Greetings & Small Talk ─────────────────────────────────────
    if (message && !isAdmin) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quickResponse = (AIService as any).getQuickResponse(message)
      if (quickResponse) {
        return NextResponse.json(createSuccessResponse({ message: quickResponse.response, suggestions: quickResponse.suggestions || [], productRecommendations: quickResponse.productRecommendations || [], confidence: quickResponse.confidence || 1.0, sessionId, timestamp: new Date().toISOString() }))
      }

      const ruleBased = checkRuleBasedResponse(message)
      if (ruleBased.matched && !ruleBased.requiresProductLookup && !ruleBased.requiresComparison) {
        return NextResponse.json(createSuccessResponse({ message: ruleBased.response || '', suggestions: ruleBased.suggestions || [], confidence: 1.0, sessionId, timestamp: new Date().toISOString() }))
      }
    }

    // ── Image Flows ────────────────────────────────────────────────────────────
    if (isAdmin && image) return await handleOCRInvoiceFlow(sessionId, image, message)
    if (!isAdmin && image) return await handleCustomerImageRecognition(sessionId, image, message, customerId)

    if (!message) {
      return NextResponse.json(createErrorResponse('Message is required', 'VALIDATION_ERROR'), { status: 400 })
    }

    const conversationHistory = await getConversationHistory(sessionId)

    // ── Active Flow Continuation ───────────────────────────────────────────────
    const currentState = await getConversationState(sessionId)

    if (currentState && currentState.flow === 'ORDER_CREATION') {
      const flowResponse = await processFlowResponse(sessionId, message)

      if (flowResponse.shouldContinue) {
        if (flowResponse.nextPrompt) {
          return NextResponse.json(createSuccessResponse({ message: flowResponse.nextPrompt, suggestions: ['Tiếp tục', 'Hủy'], confidence: 1.0, sessionId, timestamp: new Date().toISOString() }))
        }
        if (flowResponse.isConfirmed) return await handleOrderCreation(sessionId, customerId, currentState)
        if (flowResponse.isCancelled) {
          clearConversationState(sessionId)
          return NextResponse.json(createSuccessResponse({ message: '❌ Đã hủy đặt hàng.\n\n💡 Bạn có thể đặt hàng lại bất cứ lúc nào.', suggestions: ['Tìm sản phẩm', 'Tính vật liệu', 'Giá cả'], confidence: 1.0, sessionId, timestamp: new Date().toISOString() }))
        }

        // Pause flow to answer question, then resume
        const questionKeywords = /(?:so sánh|khác nhau|tốt nhất|ngon nhất|tư vấn|là gì|bao nhiêu|\?|tại sao|như thế nào|loại nào|nào tốt)/i
        if (questionKeywords.test(message)) {
          const aiResponse = await generateChatbotResponse(message, context, conversationHistory, !!isAdmin)
          const continuationPrompt = currentState.data.items?.length > 0 ? `\n\n💡 **Bạn vẫn muốn tiếp tục đặt hàng chứ?**` : `\n\n💡 **Bạn muốn chọn sản phẩm nào?**`
          return NextResponse.json(createSuccessResponse({ message: aiResponse.response + continuationPrompt, suggestions: ['Tiếp tục đặt hàng', 'Xem lại đơn', 'Hủy'], confidence: aiResponse.confidence, sessionId, timestamp: new Date().toISOString() }))
        }

        // Handle product selection during confirm_items step
        if (currentState.data.currentStep === 'confirm_items' &&
          (message.toLowerCase().match(/^\d+$/) || (message.length > 3 && !message.toLowerCase().includes('xác nhận')))) {
          const flowData = currentState.data
          if (flowData.pendingProductSelection) {
             
            const selectedProducts: Array<Record<string, unknown>> = []
            for (const pending of flowData.pendingProductSelection) {
              const userChoice = message.toLowerCase().trim()
              let selectedProduct = null
              const numberMatch = userChoice.match(/^(\d+)$/)
              if (numberMatch) {
                const index = parseInt(numberMatch[1]) - 1
                if (index >= 0 && index < pending.products.length) selectedProduct = pending.products[index]
              } else {
                selectedProduct = pending.products.find((p: { name: string; id: string }) => p.name.toLowerCase().includes(userChoice) || userChoice.includes(p.name.toLowerCase()))
              }
              if (selectedProduct) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const originalItem = flowData.items.find((item: any) => item.productName === pending.item.productName)
                if (originalItem) {
                  originalItem.productName = (selectedProduct as { name: string }).name
                  originalItem.productId = (selectedProduct as { id: string }).id
                  selectedProducts.push({ ...originalItem, selectedProduct })
                }
              } else {
                selectedProducts.push(pending.item)
              }
            }

            await updateFlowData(sessionId, {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              items: flowData.items.map((item: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const selected = selectedProducts.find((s: any) => s.productName === item.productName || (s.selectedProduct && (s.selectedProduct as { name: string }).name === item.productName))
                return selected || item
              }),
              pendingProductSelection: null,
              currentStep: 'confirm_items'
            })

            const needsInfo = !customerId
            return NextResponse.json(createSuccessResponse({
              message: '🛒 **Xác nhận đặt hàng**\n\nDanh sách sản phẩm:\n' +
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                selectedProducts.map((item: any, idx: number) => `${idx + 1}. ${item.selectedProduct?.name || item.productName}: ${item.quantity} ${item.unit}`).join('\n') +
                '\n\n✅ Xác nhận đặt hàng?' +
                (needsInfo ? '\n\n⚠️ *Bạn chưa đăng nhập. Chúng tôi sẽ hỏi thông tin giao hàng còn thiếu sau khi xác nhận.*' : ''),
              suggestions: needsInfo ? ['Xác nhận', 'Đăng nhập', 'Hủy'] : ['Xác nhận', 'Chỉnh sửa', 'Hủy'],
              confidence: 1.0, sessionId, timestamp: new Date().toISOString()
            }))
          }
        }

        // Stay in flow
        return NextResponse.json(createSuccessResponse({
          message: '🛒 **Xác nhận đặt hàng**\n\nDanh sách sản phẩm:\n' +
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (currentState.data.items || []).map((item: any, idx: number) => `${idx + 1}. ${item.productName || item.name}: ${item.quantity || 1} ${item.unit || 'bao'}`).join('\n') +
            '\n\n✅ Vui lòng xác nhận đặt hàng hoặc hủy bỏ.',
          suggestions: currentState.data.needsGuestInfo ? ['Xác nhận', 'Đăng nhập', 'Hủy'] : ['Xác nhận', 'Hủy'],
          confidence: 1.0, sessionId, timestamp: new Date().toISOString()
        }))
      }
    }

    // OCR / CRUD confirmation flows
    if (currentState && currentState.flow !== 'ORDER_CREATION') {
      const flowResponse = await processFlowResponse(sessionId, message)
      if (flowResponse.shouldContinue) {
        if (flowResponse.isConfirmed && currentState.flow === 'OCR_INVOICE') return await handleOCRInvoiceSave(sessionId, currentState)
        if (flowResponse.isConfirmed && currentState.flow === 'CRUD_CONFIRMATION') return await handleCRUDExecution(sessionId, currentState, userRole || '')
        if (flowResponse.isCancelled) {
          clearConversationState(sessionId)
          return NextResponse.json(createSuccessResponse({ message: '❌ Đã hủy thao tác.', suggestions: ['Bắt đầu lại', 'Trợ giúp'], confidence: 1.0, sessionId, timestamp: new Date().toISOString() }))
        }
        if (flowResponse.nextPrompt) {
          return NextResponse.json(createSuccessResponse({ message: flowResponse.nextPrompt, suggestions: ['Xác nhận', 'Hủy'], confidence: 1.0, sessionId, timestamp: new Date().toISOString() }))
        }
      }
    }

    // ── Rule-Based Fast Paths (customer only) ──────────────────────────────────
    if (!isAdmin) {
      const ruleBasedResult = checkRuleBasedResponse(message)
      if (ruleBasedResult.matched) {
        if (ruleBasedResult.requiresComparison && ruleBasedResult.comparisonProducts) {
          const result = await handleComparisonQuery(ruleBasedResult.comparisonProducts, sessionId)
          if (result) return result
        } else if (ruleBasedResult.requiresProductLookup && ruleBasedResult.productKeyword) {
          const result = await handleRuleBasedPriceLookup(ruleBasedResult.productKeyword, ruleBasedResult.suggestions || [], sessionId)
          if (result) return result
        } else {
          return NextResponse.json(createSuccessResponse({ message: ruleBasedResult.response!, suggestions: ruleBasedResult.suggestions || [], confidence: 1.0, sessionId, timestamp: new Date().toISOString() }))
        }
      }
    }

    // ── Intent Detection ───────────────────────────────────────────────────────
    const entities = extractEntities(message)
    const intentResult: IntentResult = detectIntent(message, !!isAdmin, false, { currentPage: context?.currentPage })

    // Security: block non-admins from admin intents
    if (!isAdmin && intentResult.intent.startsWith('ADMIN_')) {
      return NextResponse.json(
        createSuccessResponse({ message: '⛔ Bạn không có quyền truy cập chức năng này.\n\n💡 Chức năng này chỉ dành cho quản trị viên.', suggestions: ['Tìm sản phẩm', 'Tính vật liệu', 'Giá cả'], confidence: 1.0, sessionId, timestamp: new Date().toISOString() }),
        { status: 403 }
      )
    }

    // ── Admin Dispatch ─────────────────────────────────────────────────────────
    if (isAdmin) {
      if (intentResult.intent === 'ADMIN_ANALYTICS' || intentResult.intent === 'ADMIN_EMPLOYEE_QUERY' || intentResult.intent === 'ADMIN_PAYROLL_QUERY') {
        return await handleAdminAnalytics(message, entities, sessionId)
      }
      if (intentResult.intent === 'ADMIN_ORDER_MANAGE') return await handleAdminOrderManagement(message, entities, sessionId)
      if (intentResult.intent === 'ADMIN_INVENTORY_CHECK') return await handleAdminInventoryCheck(message, entities, sessionId)
      if (['ADMIN_CRUD_CREATE', 'ADMIN_CRUD_UPDATE', 'ADMIN_CRUD_DELETE'].includes(intentResult.intent)) {
        return await handleAdminCRUD(message, entities, intentResult, sessionId, customerId, userRole || '')
      }
      // Admin Fallback → AI
      const adminFallback = await generateChatbotResponse(message, context, conversationHistory, true)
      return NextResponse.json(createSuccessResponse({ message: adminFallback.response, suggestions: adminFallback.suggestions, confidence: adminFallback.confidence, sessionId, timestamp: new Date().toISOString() }))
    }

    // ── Customer Intent Dispatch ───────────────────────────────────────────────
    if (intentResult.intent === 'ORDER_CREATE') return await handleOrderCreateIntent(message, sessionId, customerId, conversationHistory)
    if (intentResult.intent === 'PRODUCT_SEARCH') {
      const result = await handleProductSearch(message, sessionId)
      if (result) return result
    }
    if (intentResult.intent === 'MATERIAL_CALCULATE') {
      const result = await handleMaterialCalculation(message, sessionId)
      if (result) return result
    }
    if (intentResult.intent === 'PRICE_INQUIRY') {
      const result = await handlePriceInquiry(message, sessionId)
      if (result) return result
    }

    // ── Final Fallback: RAG + AI ───────────────────────────────────────────────
    const augmentedPrompt = await RAGService.generateAugmentedPrompt(message)
    const botResponse = await AIService.generateChatbotResponse(augmentedPrompt, context, conversationHistory)

    // Log interaction (non-blocking)
    prisma.customerInteraction.create({
      data: {
        customerId, sessionId, interactionType: 'CHATBOT',
        productId: context?.productId, query: message, response: botResponse.response,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: { confidence: botResponse.confidence, suggestions: botResponse.suggestions, productRecommendations: botResponse.productRecommendations, intent: intentResult.intent, entities: entities as any, context: context as any } as any,
        ipAddress: ip, userAgent: request.headers.get('user-agent') || 'unknown'
      }
    }).catch(err => console.error('Failed to log interaction:', err))

    return NextResponse.json(createSuccessResponse({
      message: botResponse.response + marketingMessage,
      suggestions: botResponse.suggestions,
      productRecommendations: botResponse.productRecommendations,
      confidence: botResponse.confidence,
      sessionId, timestamp: new Date().toISOString()
    }))

  } catch (error) {
    console.error('Chatbot error:', error)
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
  }
}

// ─── GET /api/chatbot – Chat history ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const customerId = searchParams.get('customerId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!sessionId) {
      return NextResponse.json(createErrorResponse('Session ID is required', 'VALIDATION_ERROR'), { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { sessionId, interactionType: 'CHATBOT' }
    if (customerId) where.customerId = customerId

    const interactions = await prisma.customerInteraction.findMany({
      where, orderBy: { createdAt: 'asc' }, take: limit,
      select: { id: true, query: true, response: true, metadata: true, createdAt: true }
    })

    const chatHistory = interactions.map(interaction => ({
      id: interaction.id,
      userMessage: interaction.query,
      botMessage: interaction.response,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      suggestions: (interaction.metadata as any)?.suggestions || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      productRecommendations: (interaction.metadata as any)?.productRecommendations || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      confidence: (interaction.metadata as any)?.confidence || 0,
      timestamp: interaction.createdAt
    }))

    return NextResponse.json(createSuccessResponse(chatHistory, 'Chat history retrieved successfully'), { status: 200 })
  } catch (error) {
    console.error('Get chat history error:', error)
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
  }
}
