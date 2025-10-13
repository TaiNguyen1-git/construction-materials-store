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

const chatMessageSchema = z.object({
  message: z.string().optional(), // Optional if image is provided
  image: z.string().optional(), // Base64 image
  customerId: z.string().optional(),
  sessionId: z.string().min(1, 'Session ID is required'),
  context: z.object({
    currentPage: z.string().optional(),
    productId: z.string().optional(),
    categoryId: z.string().optional(),
  }).optional(),
}).refine(data => data.message || data.image, {
  message: 'Either message or image is required'
})

// Generate chatbot response using AI or fallback to mock
async function generateChatbotResponse(
  message: string, 
  context?: any,
  conversationHistory?: { role: string; content: string }[]
): Promise<{
  response: string;
  suggestions: string[];
  productRecommendations?: any[];
  confidence: number;
  materialCalculation?: any;
}> {
  // Use real AI with RAG if enabled, otherwise fallback to mock
  if (isAIEnabled()) {
    try {
      // ===== ENHANCED PROMPTS + RAG =====
      // Build enhanced context with conversation memory
      const chatContext: ChatContext = {
        customerContext: context?.customerId 
          ? await conversationMemory.getUserContext(context.customerId)
          : undefined,
        currentPage: context?.currentPage,
        sessionContext: {
          previousQueries: conversationHistory?.slice(-5).map(h => h.content) || [],
          language: 'vi'
        }
      }

      // Get relevant context from knowledge base
      const augmentedMessage = await RAGService.generateAugmentedPrompt(message, conversationHistory)
      
      // Build enhanced system prompt
      const enhancedSystemPrompt = buildEnhancedPrompt(message, chatContext)
      const userMessage = buildUserMessage(message, chatContext)
      
      // Get AI response with enhanced context
      const aiResponse = await AIService.generateChatbotResponse(
        enhancedSystemPrompt + '\n\n' + augmentedMessage, 
        context, 
        conversationHistory
      )
      
      // Get product recommendations from knowledge base
      const knowledgeProducts = await RAGService.getProductRecommendations(message, 3)
      
      // Format knowledge base products for response
      const knowledgeBasedRecommendations = knowledgeProducts.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.pricing.basePrice,
        unit: p.pricing.unit,
        description: p.description,
        inStock: true // Assume in stock
      }))
      
      // Merge with AI recommendations
      const allRecommendations = [
        ...knowledgeBasedRecommendations,
        ...(aiResponse.productRecommendations || [])
      ]
      
      // Deduplicate by name
      const uniqueRecommendations = allRecommendations.filter((item, index, self) =>
        index === self.findIndex(t => t.name === item.name)
      ).slice(0, 5)
      
      return {
        ...aiResponse,
        productRecommendations: uniqueRecommendations,
        confidence: Math.min(0.98, aiResponse.confidence + 0.1) // RAG increases confidence
      }
    } catch (error) {
      console.error('AI service error, falling back to mock:', error)
      // Fallback to mock response
    }
  }
  
  // Mock AI response function (in production, this would integrate with OpenAI or similar)
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const lowerMessage = message.toLowerCase()
  const lowerMessageVi = message.toLowerCase() // Preserve Vietnamese
  
  // ===== TRY RAG FIRST FOR PRODUCT QUERIES =====
  try {
    const relevantProducts = await RAGService.retrieveContext(message, 2)
    if (relevantProducts.length > 0) {
      const product = relevantProducts[0]
      const formattedResponse = RAGService.formatProductForChat(product)
      
      // Get cross-sell products
      const crossSell = await RAGService.getCrossSellProducts(product.id)
      
      return {
        response: formattedResponse,
        suggestions: [
          'Xem thêm chi tiết',
          'Tính toán vật liệu',
          crossSell.length > 0 ? `Xem ${crossSell[0].name}` : 'Sản phẩm khác',
          'Liên hệ tư vấn'
        ],
        productRecommendations: [
          {
            id: product.id,
            name: product.name,
            brand: product.brand,
            price: product.pricing.basePrice,
            unit: product.pricing.unit
          },
          ...crossSell.slice(0, 2).map(p => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            price: p.pricing.basePrice,
            unit: p.pricing.unit
          }))
        ],
        confidence: 0.95
      }
    }
  } catch (ragError) {
    console.log('RAG search failed, falling back to mock:', ragError)
  }

  // Price inquiry (Vietnamese & English)
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much') ||
      lowerMessageVi.includes('giá') || lowerMessageVi.includes('bao nhiêu') || lowerMessageVi.includes('chi phí')) {
    if (lowerMessage.includes('cement') || lowerMessageVi.includes('xi măng') || lowerMessageVi.includes('xi mang')) {
      return {
        response: "Giá xi măng của chúng tôi tùy loại và số lượng ạ:\n\n" +
          "• **Xi măng PC30** (vữa xây): 105.000đ/bao 50kg\n" +
          "• **Xi măng PC40** (bê tông): 120.000đ/bao 50kg\n" +
          "• **Xi măng PCB40** (bê tông cao cấp): 135.000đ/bao 50kg\n\n" +
          "Đặt từ 100 bao trở lên được **giảm 10%**. Bạn cần bao nhiêu bao để mình báo giá chi tiết nhé?",
        suggestions: ["Báo giá số lượng lớn", "Xem các loại xi măng", "Tính tổng chi phí"],
        confidence: 0.95
      }
    } else if (lowerMessage.includes('steel') || lowerMessage.includes('rebar') || 
               lowerMessageVi.includes('thép') || lowerMessageVi.includes('sắt')) {
      return {
        response: "Giá thép phụ thuộc vào đường kính và chiều dài ạ:\n\n" +
          "• **Thép D6-D8**: 16.000đ/kg\n" +
          "• **Thép D10-D12**: 17.500đ/kg\n" +
          "• **Thép D16-D18**: 18.500đ/kg\n" +
          "• **Thép D20-D25**: 19.000đ/kg\n\n" +
          "Chiều dài tiêu chuẩn 6m hoặc 12m. Bạn cần quy cách nào để mình tư vấn chi tiết?",
        suggestions: ["Xem catalog thép", "Giá sỉ", "Kiểm tra tồn kho"],
        confidence: 0.92
      }
    } else if (lowerMessageVi.includes('gạch')) {
      return {
        response: "Có nhiều loại gạch với giá khác nhau ạ:\n\n" +
          "• **Gạch 4 lỗ** 8x8x18cm: 2.200đ/viên\n" +
          "• **Gạch đặc**: 3.500đ/viên\n" +
          "• **Gạch block 10cm**: 8.500đ/viên\n" +
          "• **Gạch ốp lát** 60x60cm: 85.000đ/m²\n\n" +
          "Bạn cần gạch loại nào để mình tư vấn cụ thể hơn nhé?",
        suggestions: ["Gạch xây tường", "Gạch lát nền", "Gạch block"],
        confidence: 0.93
      }
    } else {
      return {
        response: "Tôi sẵn sàng báo giá cho bạn! Bạn muốn biết giá của vật liệu nào ạ? Chúng tôi có:\n\n" +
          "🧱 Xi măng, thép, cát, đá, gạch\n" +
          "🏠 Ngói, tôn, ván ép\n" +
          "🎨 Sơn, bột trét, chống thấm\n" +
          "🔧 Công cụ và vật tư khác\n\n" +
          "Cho mình biết bạn cần vật liệu gì nhé!",
        suggestions: ["Xi măng", "Thép", "Gạch", "Cát & Đá", "Danh mục sản phẩm"],
        confidence: 0.85
      }
    }
  }
  
  // Stock/availability inquiry
  if (lowerMessage.includes('stock') || lowerMessage.includes('available') || lowerMessage.includes('in stock')) {
    return {
      response: "I can check our current stock levels for you. We update our inventory in real-time. Which specific products are you looking for? You can also browse our online catalog to see current availability.",
      suggestions: ["Check cement stock", "Check steel availability", "View all products"],
      confidence: 0.90
    }
  }
  
  // Store hours inquiry
  if (lowerMessage.includes('hours') || lowerMessage.includes('open') || lowerMessage.includes('close') || lowerMessage.includes('time')) {
    return {
      response: "Our store hours are Monday-Friday: 7:00 AM - 6:00 PM, Saturday: 8:00 AM - 4:00 PM, Sunday: Closed. We also offer 24/7 online ordering with next-day pickup available.",
      suggestions: ["Place online order", "Schedule pickup", "Contact us"],
      confidence: 0.98
    }
  }
  
  // Delivery inquiry
  if (lowerMessage.includes('delivery') || lowerMessage.includes('shipping') || lowerMessage.includes('deliver')) {
    return {
      response: "Yes, we offer delivery services! Free delivery for orders over $500 within 10 miles. For smaller orders or longer distances, delivery fees apply. Delivery is typically within 1-2 business days. Would you like to check delivery options for your location?",
      suggestions: ["Check delivery cost", "Schedule delivery", "View delivery areas"],
      confidence: 0.94
    }
  }
  
  // Product recommendations
  if (lowerMessage.includes('recommend') || lowerMessage.includes('best') || lowerMessage.includes('need')) {
    if (lowerMessage.includes('foundation') || lowerMessage.includes('concrete')) {
      return {
        response: "For foundation work, I recommend our premium concrete mix and steel rebar for reinforcement. You'll also need gravel for the base and waterproofing materials. Would you like me to create a foundation materials package for you?",
        suggestions: ["Foundation package", "Calculate quantities", "Get quote"],
        productRecommendations: [
          { name: "Premium Concrete Mix", price: 25.00, unit: "bag" },
          { name: "Steel Rebar 12mm", price: 8.50, unit: "piece" },
          { name: "Waterproof Membrane", price: 45.00, unit: "roll" }
        ],
        confidence: 0.88
      }
    } else {
      return {
        response: "I'd be happy to recommend the right materials for your project! Could you tell me more about what you're building or working on? For example, are you doing foundation work, roofing, walls, or something else?",
        suggestions: ["Foundation materials", "Roofing supplies", "Wall materials"],
        confidence: 0.82
      }
    }
  }
  
  // Greeting (Vietnamese & English)
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') ||
      lowerMessageVi.includes('xin chào') || lowerMessageVi.includes('chào') || lowerMessageVi.includes('hello')) {
    return {
      response: "Xin chào! Chào mừng bạn đến với SmartBuild AI. Tôi là trợ lý ảo, sẵn sàng giúp bạn tìm vật liệu phù hợp cho công trình. Bạn đang cần tư vấn gì ạ?",
      suggestions: ["Tính toán vật liệu", "Xem sản phẩm", "Kiểm tra giá", "Thông tin cửa hàng"],
      confidence: 0.96
    }
  }
  
  // Material calculation request
  if (lowerMessageVi.includes('tính') && (lowerMessageVi.includes('vật liệu') || lowerMessageVi.includes('xi măng') || lowerMessageVi.includes('gạch'))) {
    return {
      response: "Tuyệt vời! Tôi có thể giúp bạn tính toán chính xác vật liệu cần thiết. Để tính toán tốt nhất, cho tôi biết:\n\n" +
        "🏠 **Loại công trình**: Nhà phố / Biệt thự / Nhà xưởng / Chung cư?\n" +
        "📏 **Diện tích**: Bao nhiêu m²?\n" +
        "🏗️ **Số tầng**: Bao nhiêu tầng?\n" +
        "🧱 **Loại tường**: Gạch / Bê tông?\n" +
        "🏠 **Loại mái**: Ngói / Tôn / Bê tông?\n\n" +
        "Hoặc bạn có thể vào mục **Tính toán vật liệu** trên website để nhập đầy đủ thông tin nhé!",
      suggestions: ["Nhà phố 100m²", "Biệt thự 200m²", "Nhà xưởng 500m²", "Tính toán chi tiết"],
      confidence: 0.95
    }
  }
  
  // Order inquiry
  if (lowerMessage.includes('order') || lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
    return {
      response: "Great! You can place orders online through our website or visit our store. We accept cash, card, and bank transfers. For large orders, we also offer credit terms for registered customers. What would you like to order?",
      suggestions: ["Browse products", "Create account", "Contact sales"],
      confidence: 0.91
    }
  }
  
  // Default response
  return {
    response: "I'm here to help with information about our construction materials, pricing, availability, store hours, and delivery options. Could you please rephrase your question or let me know what specific information you're looking for?",
    suggestions: ["View products", "Check prices", "Store hours", "Delivery info"],
    confidence: 0.75
  }
}

// POST /api/chatbot - Process chatbot message (with image support)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = chatMessageSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { message, image, customerId, sessionId, context } = validation.data

    // Get conversation history for context-aware responses
    const conversationHistory = await prisma.customerInteraction.findMany({
      where: {
        sessionId,
        interactionType: 'CHATBOT',
        createdAt: {
          gte: new Date(Date.now() - 3600000) // Last 1 hour
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 10, // Last 10 messages
      select: {
        query: true,
        response: true
      }
    })

    // Format conversation history for AI
    const formattedHistory: { role: string; content: string }[] = []
    conversationHistory.forEach(interaction => {
      formattedHistory.push({ role: 'user', content: interaction.query })
      formattedHistory.push({ role: 'assistant', content: interaction.response })
    })

    let botResponse: any
    let actualQuery = message || ''
    let recognitionResult: any = null

    // ===== IMAGE RECOGNITION FLOW =====
    if (image) {
      console.log('📸 Processing image with AI recognition...')
      
      try {
        // Recognize material from image
        recognitionResult = await aiRecognition.recognizeMaterial(image)
        
        console.log(`✅ Recognized: ${recognitionResult.materialType} (${(recognitionResult.confidence * 100).toFixed(0)}%)`)
        
        // Build natural language response
        let responseText = `📸 **Tôi nhận diện được:** ${recognitionResult.materialType}\n\n`
        responseText += `🎯 **Độ tin cậy:** ${(recognitionResult.confidence * 100).toFixed(0)}%\n\n`
        
        if (recognitionResult.matchedProducts.length > 0) {
          responseText += `✅ **Tìm thấy ${recognitionResult.matchedProducts.length} sản phẩm phù hợp:**\n\n`
          
          // Get ML-enhanced recommendations for these products
          const productIds = recognitionResult.matchedProducts.map((p: any) => p.id)
          let enhancedProducts = recognitionResult.matchedProducts
          
          // Try to enhance with ML recommendations if customer ID available
          if (customerId && productIds.length > 0) {
            try {
              const mlScores = await mlRecommendations.getHybridRecommendations(
                productIds[0], // Use first product as reference
                customerId,
                'SIMILAR',
                5
              )
              enhancedProducts = await mlRecommendations.enrichRecommendations(mlScores)
              console.log('🤖 Enhanced with ML recommendations')
            } catch (mlError) {
              console.log('Using original recognition results (ML enhancement failed)')
            }
          }
          
          botResponse = {
            response: responseText,
            suggestions: recognitionResult.suggestions,
            productRecommendations: enhancedProducts,
            confidence: recognitionResult.confidence,
            recognitionData: recognitionResult.features
          }
        } else {
          responseText += '❌ Không tìm thấy sản phẩm phù hợp trong kho.\n\n'
          responseText += recognitionResult.suggestions.join('\n')
          
          botResponse = {
            response: responseText,
            suggestions: ['Thử chụp ảnh khác', 'Tìm kiếm bằng text', 'Xem danh mục sản phẩm'],
            productRecommendations: [],
            confidence: recognitionResult.confidence
          }
        }
        
        // If user also included a message, append to context
        if (message) {
          actualQuery = `[Gửi ảnh ${recognitionResult.materialType}] ${message}`
        } else {
          actualQuery = `[Gửi ảnh ${recognitionResult.materialType}]`
        }
      } catch (recognitionError) {
        console.error('AI recognition error:', recognitionError)
        botResponse = {
          response: '😅 Xin lỗi, tôi gặp khó khăn khi nhận diện ảnh này. Bạn có thể chụp lại rõ hơn hoặc nhập tên vật liệu không?',
          suggestions: ['Chụp lại ảnh', 'Tìm kiếm bằng text', 'Xem danh mục'],
          productRecommendations: [],
          confidence: 0.5
        }
        actualQuery = '[Gửi ảnh - nhận diện thất bại]'
      }
    } 
    // ===== TEXT-ONLY FLOW =====
    else {
      const lowerMessage = message?.toLowerCase() || ''
      
      // ===== MATERIAL CALCULATOR FLOW =====
      if (lowerMessage.includes('tính') && (
          lowerMessage.includes('vật liệu') ||
          lowerMessage.includes('m²') || lowerMessage.includes('m2') ||
          lowerMessage.includes('tầng') || lowerMessage.includes('tang') ||
          lowerMessage.includes('nhà') || lowerMessage.includes('nha')
      )) {
        console.log('🧮 Material calculation request detected...')
        
        try {
          const calcInput = materialCalculator.parseQuery(message!)
          
          if (calcInput) {
            const calcResult = await materialCalculator.quickCalculate(calcInput)
            const formattedResponse = materialCalculator.formatForChat(calcResult)
            
            botResponse = {
              response: formattedResponse,
              suggestions: [
                'Điều chỉnh tính toán',
                'Xem sản phẩm xi măng',
                'Xem sản phẩm gạch',
                'Tư vấn thêm'
              ],
              productRecommendations: [],
              confidence: 0.92,
              calculationData: calcResult
            }
          } else {
            botResponse = {
              response: `🧮 Tôi có thể giúp bạn tính toán vật liệu!\n\n` +
                       `Vui lòng cung cấp thông tin:\n` +
                       `• Diện tích hoặc kích thước (VD: 100m², 10x15m)\n` +
                       `• Số tầng (VD: 2 tầng)\n` +
                       `• Loại công trình (VD: nhà phố, biệt thự)\n\n` +
                       `**Ví dụ:** "Tính vật liệu nhà phố 100m² 2 tầng"`,
              suggestions: [
                'Tính nhà phố 100m²',
                'Tính biệt thự 200m² 2 tầng',
                'Tính nhà xưởng 500m²'
              ],
              productRecommendations: [],
              confidence: 0.85
            }
          }
        } catch (calcError: any) {
          console.error('Calculation error:', calcError)
          botResponse = {
            response: `❌ Lỗi tính toán: ${calcError.message}\n\n` +
                     `Vui lòng kiểm tra lại thông tin và thử lại.`,
            suggestions: ['Thử lại', 'Ví dụ tính toán'],
            productRecommendations: [],
            confidence: 0.5
          }
        }
      }
      // ===== RECOMMENDATION FLOW =====
      else if ((lowerMessage.includes('gợi ý') || lowerMessage.includes('đề xuất') || 
           lowerMessage.includes('recommend')) && customerId) {
        console.log('💡 Generating personalized recommendations...')
        
        try {
          // Get ML personalized recommendations
          const mlScores = await mlRecommendations.getHybridRecommendations(
            undefined, // No specific product
            customerId,
            'PERSONALIZED',
            5
          )
          
          const recommendations = await mlRecommendations.enrichRecommendations(mlScores)
          
          botResponse = {
            response: `💡 **Dựa trên lịch sử mua hàng của bạn**, tôi gợi ý các sản phẩm này:\n\n` +
                     `Các sản phẩm bên dưới phù hợp với nhu cầu và dự án của bạn. ` +
                     `Bạn có thể xem chi tiết hoặc hỏi tôi thêm về bất kỳ sản phẩm nào!`,
            suggestions: [
              'Chi tiết sản phẩm đầu tiên',
              'So sánh giá',
              'Tính toán vật liệu',
              'Xem thêm gợi ý'
            ],
            productRecommendations: recommendations,
            confidence: 0.9
          }
        } catch (mlError) {
          console.error('ML recommendations failed:', mlError)
          // Fallback to regular chatbot response
          botResponse = await generateChatbotResponse(message, context, formattedHistory)
        }
      }
      // ===== REGULAR CHAT FLOW =====
      else {
        botResponse = await generateChatbotResponse(message, context, formattedHistory)
      }
    }

    // Log customer interaction
    await prisma.customerInteraction.create({
      data: {
        customerId,
        sessionId,
        interactionType: 'CHATBOT',
        productId: context?.productId,
        query: actualQuery,
        response: botResponse.response,
        metadata: {
          confidence: botResponse.confidence,
          suggestions: botResponse.suggestions,
          productRecommendations: botResponse.productRecommendations,
          hasImage: !!image,
          recognitionData: recognitionResult,
          context
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    const response = {
      message: botResponse.response,
      suggestions: botResponse.suggestions,
      productRecommendations: botResponse.productRecommendations,
      confidence: botResponse.confidence,
      recognitionData: botResponse.recognitionData,
      sessionId,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(
      createSuccessResponse(response, 'Chatbot response generated successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Chatbot error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// GET /api/chatbot - Get chat history
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

    // Build where clause
    const where: any = {
      sessionId,
      interactionType: 'CHATBOT'
    }

    if (customerId) {
      where.customerId = customerId
    }

    // Get chat history
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

    // Format chat history
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
