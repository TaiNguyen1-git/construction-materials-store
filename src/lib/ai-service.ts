
import { GoogleGenAI } from '@google/genai'
import { AI_CONFIG, CHATBOT_SYSTEM_PROMPT, OCR_SYSTEM_PROMPT } from './ai-config'
import { ADMIN_SYSTEM_PROMPT } from './ai-prompts-admin'

// Initialize Gemini client (if API key is provided)
const client = AI_CONFIG.GEMINI.API_KEY ? new GoogleGenAI({ apiKey: AI_CONFIG.GEMINI.API_KEY }) : null

// Function to find a working Gemini model name
let workingModelName: string | null = null;
export const getWorkingModelConfig = async () => {
  if (workingModelName) return { client, modelName: workingModelName };

  if (!client) {
    throw new Error('Gemini client not initialized');
  }

  // Try different model names in order of preference
  const modelNames = [
    'gemini-2.5-flash',     // User requested (Newest)
    'gemini-2.0-flash-exp', // Experimental
    'gemini-1.5-flash',     // Standard
    'gemini-1.5-flash-001', // Specific version
    'gemini-1.5-flash-002', // Newer specific version
    'gemini-1.5-flash-8b',  // Lightweight
    'gemini-1.5-pro',
    'gemini-1.5-pro-001',
    'gemini-1.5-pro-002',
    'gemini-1.0-pro'
  ];

  // First try the model specified in the configuration
  if (AI_CONFIG.GEMINI.MODEL) {
    try {
      // Test the model with a simple prompt
      await client.models.generateContent({
        model: AI_CONFIG.GEMINI.MODEL,
        contents: [{ role: 'user', parts: [{ text: 'Test' }] }],
        config: {
          temperature: parseFloat(AI_CONFIG.GEMINI.TEMPERATURE.toString())
        }
      });

      workingModelName = AI_CONFIG.GEMINI.MODEL;
      console.log(`✅ Using configured Gemini model: ${workingModelName}`);
      return { client, modelName: workingModelName };
    } catch (error: any) {
      console.log(`⚠️ Configured model ${AI_CONFIG.GEMINI.MODEL} failed (Status ${error.status || 'unknown'}), trying fallbacks...`);
      // If 429, we might accept it as "working" but rate limited, but better to find one that works now?
      // Actually, if 2.5 returns 429, it exists. We should probably stick with it if it's the user preference, 
      // but if we want reliability, maybe fallback.
      // For now, if it throws, we try next.
    }
  }

  // If the configured model fails, try the fallback models
  for (const modelName of modelNames) {
    try {
      console.log(`Testing connection to ${modelName}...`);
      await client.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: 'Test' }] }],
        config: {
          temperature: parseFloat(AI_CONFIG.GEMINI.TEMPERATURE.toString())
        }
      });

      workingModelName = modelName;
      console.log(`✅ Using Gemini model: ${modelName}`);
      return { client, modelName };
    } catch (error: any) {
      console.log(`❌ Failed to initialize Gemini model ${modelName}:`, error.message || error.status);
      // Special case: 429 means it exists but we are out of quota. 
      // We might want to use it anyway if it is the best model? 
      // No, for reliability we should keep searching for a 200 OK one.
      continue;
    }
  }

  throw new Error('No working Gemini model found');
};

// Define types for chatbot responses
export interface ChatbotResponse {
  response: string
  suggestions: string[]
  productRecommendations?: any[]
  confidence: number
}

// Define types for OCR responses
export interface OCRResponse {
  extractedText: string
  processedData: any
  confidence: number
}

export class AIService {
  // Generate chatbot response using Gemini
  static async generateChatbotResponse(
    message: string,
    context?: any,
    conversationHistory?: { role: string; content: string }[],
    isAdmin: boolean = false
  ): Promise<ChatbotResponse> {
    try {
      const { client, modelName } = await getWorkingModelConfig();
      if (!client) throw new Error('Client init failed');

      // Select system prompt based on user role
      const systemPrompt = isAdmin ? ADMIN_SYSTEM_PROMPT : CHATBOT_SYSTEM_PROMPT
      const welcomeCtx = isAdmin
        ? "Tôi là trợ lý ảo Business Intelligence (BI) của hệ thống quản trị, sẵn sàng hỗ trợ phân tích dữ liệu và quản lý vận hành."
        : "Tôi đã hiểu. Tôi sẽ đóng vai trò là trợ lý ảo của cửa hàng vật liệu xây dựng và hỗ trợ khách hàng nhiệt tình, chuyên nghiệp."

      // Prepare the conversation history for Gemini
      let contents: any[] = [
        {
          role: "user",
          parts: [{ text: systemPrompt }]
        },
        {
          role: "model",
          parts: [{ text: welcomeCtx }]
        }
      ]

      // Add conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        for (const msg of conversationHistory) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          })
        }
      }

      // Add context information if available
      if (context) {
        contents.push({
          role: "user",
          parts: [{ text: `Context information: ${JSON.stringify(context)}` }]
        })
      }

      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      // Retry logic with Model Fallback
      let attempts = 0
      const maxAttempts = 3
      let currentModel = modelName!
      let lastError = null

      while (attempts < maxAttempts) {
        try {
          const result = await client.models.generateContent({
            model: currentModel,
            contents: contents,
            config: {
              maxOutputTokens: 1000,
              temperature: 0.7
            }
          });

          const aiResponse = (result as any).text;

          if (!aiResponse) {
            throw new Error('Empty response from AI')
          }

          // Extract structured information from the response
          const structuredResponse = await this.extractChatbotStructure(aiResponse)

          return {
            response: structuredResponse.response,
            suggestions: structuredResponse.suggestions,
            productRecommendations: structuredResponse.productRecommendations,
            confidence: 0.95
          }
        } catch (error) {
          console.warn(`Gemini attempt failed with ${currentModel}:`, error)
          lastError = error
          attempts++

          // Fallback Strategy: If primary model fails, try stable model next
          if (currentModel !== 'models/gemini-1.5-flash' && attempts < maxAttempts) {
            console.log('⚠️ Primary model failed, switching to fallback: gemini-1.5-flash')
            currentModel = 'models/gemini-1.5-flash'
            continue
          }

          if (attempts < maxAttempts) {
            // Wait before retry (1s, then 2s)
            await new Promise(resolve => setTimeout(resolve, attempts * 1000))
          }
        }
      }

      throw lastError || new Error('Failed after retries')

    } catch (error) {
      console.error('Gemini chatbot error:', error)
      // Return a friendly fallback instead of throwing generic error
      return {
        response: "Xin lỗi, hiện tại hệ thống đang quá tải. Bạn vui lòng thử lại sau giây lát hoặc liên hệ hotline để được hỗ trợ ngay nhé! 📞",
        suggestions: ["Thử lại", "Liên hệ hotline"],
        confidence: 0.1
      }
    }
  }

  // Extract structured information from chatbot response using Gemini
  private static async extractChatbotStructure(response: string): Promise<ChatbotResponse> {
    try {
      const { client, modelName } = await getWorkingModelConfig();
      if (!client) throw new Error('Client init failed');

      const prompt = `
      Extract structured information from the following chatbot response.
      Return a JSON object with these fields:
      - response: the main response text
      - suggestions: an array of 2-4 short suggestion phrases (max 5 words each)
      - productRecommendations: an array of product recommendations if mentioned (can be empty)
      
      Example format:
      {
        "response": "Main response text here",
        "suggestions": ["Suggestion 1", "Suggestion 2"],
        "productRecommendations": [{"name": "Product Name", "price": 15.99}]
      }
      
      Response to structure:
      ${response}
      
      Return only the JSON object, nothing else.
      `

      const result = await client.models.generateContent({
        model: modelName!,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const structuredText = (result as any).text || '{}';

      // Try to parse the JSON response
      let structured: any = {}
      try {
        // Remove any markdown code block markers if present
        const cleanedText = structuredText.replace(/```json\s*|\s*```/g, '').trim()
        structured = JSON.parse(cleanedText)
      } catch (parseError) {
        console.error('Failed to parse Gemini structured response:', parseError)
        // Try to extract JSON from the text
        const jsonMatch = structuredText.match(/\{.*\}/)
        if (jsonMatch) {
          try {
            structured = JSON.parse(jsonMatch[0])
          } catch (secondParseError) {
            console.error('Second parsing attempt failed:', secondParseError)
          }
        }
      }

      return {
        response: structured.response || response,
        suggestions: structured.suggestions || [],
        productRecommendations: structured.productRecommendations || [],
        confidence: 0.9
      }
    } catch (error) {
      // Fallback to basic structure
      return {
        response,
        suggestions: ['Xem sản phẩm', 'Liên hệ hỗ trợ', 'Thông tin giá cả'],
        productRecommendations: [],
        confidence: 0.7
      }
    }
  }

  // Process OCR text using Gemini
  static async processOCRText(extractedText: string): Promise<OCRResponse> {
    try {
      const { client, modelName } = await getWorkingModelConfig();
      if (!client) throw new Error('Client init failed');

      const prompt = `
      ${OCR_SYSTEM_PROMPT}
      
      Please extract structured data from this invoice text:
      
      ${extractedText}
      
      Return only the JSON object, nothing else.
      `

      const result = await client.models.generateContent({
        model: modelName!,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const processedText = (result as any).text || '{}';

      // Try to parse the JSON response
      let processedData: any = {}
      try {
        // Remove any markdown code block markers if present
        const cleanedText = processedText.replace(/```json\s*|\s*```/g, '').trim()
        processedData = JSON.parse(cleanedText)
      } catch (parseError) {
        console.error('Failed to parse Gemini OCR response:', parseError)
        // Try to extract JSON from the text
        const jsonMatch = processedText.match(/\{.*\}/)
        if (jsonMatch) {
          try {
            processedData = JSON.parse(jsonMatch[0])
          } catch (secondParseError) {
            console.error('Second parsing attempt failed:', secondParseError)
          }
        }
      }

      return {
        extractedText,
        processedData,
        confidence: 0.95
      }
    } catch (error) {
      console.error('Gemini OCR processing error:', error)
      throw new Error('Failed to process OCR text with Gemini')
    }
  }

  // Get product recommendations based on user query
  // Uses database search instead of Gemini to avoid rate limits
  static async getProductRecommendations(query: string, context?: any): Promise<any[]> {
    try {
      // Import prisma dynamically to avoid circular dependencies
      const { prisma } = await import('./prisma')

      // Search products by query
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' as any } },
            { description: { contains: query, mode: 'insensitive' as any } },
            { tags: { hasSome: query.toLowerCase().split(' ') } }
          ]
        },
        include: {
          category: true,
          _count: { select: { orderItems: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })

      return products.map(p => ({
        name: p.name,
        description: p.description || '',
        price: p.price,
        unit: p.unit,
        category: p.category?.name || 'N/A',
        popularity: p._count.orderItems
      }))
    } catch (error) {
      console.error('Product recommendation error:', error)
      return []
    }
  }

  // Analyze customer sentiment using Gemini
  static async analyzeSentiment(message: string): Promise<{ sentiment: string; confidence: number }> {
    try {
      const { client, modelName } = await getWorkingModelConfig();
      if (!client) throw new Error('Client init failed');

      const prompt = `
      Analyze the sentiment of the following customer message.
      Return a JSON object with:
      - sentiment: "positive", "negative", or "neutral"
      - confidence: a number between 0 and 1
      
      Example format:
      {"sentiment": "positive", "confidence": 0.95}
      
      Customer message: ${message}
      
      Return only the JSON object, nothing else.
      `

      const result = await client.models.generateContent({
        model: modelName!,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const sentimentText = (result as any).text || '{}';

      // Try to parse the JSON response
      let sentiment: any = { sentiment: 'neutral', confidence: 0.5 }
      try {
        // Remove any markdown code block markers if present
        const cleanedText = sentimentText.replace(/```json\s*|\s*```/g, '').trim()
        sentiment = JSON.parse(cleanedText)
      } catch (parseError) {
        console.error('Failed to parse Gemini sentiment response:', parseError)
        // Try to extract JSON from the text
        const jsonMatch = sentimentText.match(/\{.*\}/)
        if (jsonMatch) {
          try {
            sentiment = JSON.parse(jsonMatch[0])
          } catch (secondParseError) {
            console.error('Second parsing attempt failed:', secondParseError)
          }
        }
      }

      return {
        sentiment: sentiment.sentiment || 'neutral',
        confidence: parseFloat(sentiment.confidence) || 0.5
      }
    } catch (error) {
      console.error('Gemini sentiment analysis error:', error)
      return { sentiment: 'neutral', confidence: 0.5 }
    }
  }

  // Extract order details from natural language request using Gemini
  static async parseOrderRequest(message: string): Promise<any> {
    try {
      const { client, modelName } = await getWorkingModelConfig();
      if (!client) throw new Error('Client init failed');

      const prompt = `
      Extract order details from this natural Vietnamese text.
      Handle colloquialisms like "1 xe" (truck), "1 thiên" (1000 bricks), "chục" (10), "bao" (bag), "khối" (m3).
      
      Return a JSON object with:
      - items: array of { productName, quantity (number), unit }
      - deliveryAddress: string (if mentioned)
      - customerName: string (if mentioned)
      - phone: string (if mentioned)
      
      Rules:
      - If quantity is not specified but implied (e.g., "mua xi măng"), default to 1.
      - Map "xe" to unit "xe" (or "m3" if context implies volume).
      - Map "thiên" to quantity 1000 and unit "viên" (for bricks/gạch).
      - Map "chục" to quantity 10.
      - For "gạch" (bricks), default unit is "thiên" (1000 bricks) if vague, otherwise "viên".
      - For "cát" (sand) and "đá" (stone), default unit is "khối" (m3).
      - For "xi măng" (cement), default unit is "bao".
      
      User message: "${message}"
      
      Return only the JSON object.
      `

      const result = await client.models.generateContent({
        model: modelName!,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const text = (result as any).text || '{}';

      // Try to parse the JSON response
      let data: any = null
      try {
        const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim()
        data = JSON.parse(cleanedText)
      } catch (parseError) {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0])
          } catch (e) { }
        }
      }

      return data
    } catch (error) {
      console.error('Gemini order parsing error:', error)
      return null
    }
  }

  // Extract material calculation parameters from user query using Gemini
  static async extractMaterialCalculationParams(query: string): Promise<any> {
    try {
      const { client, modelName } = await getWorkingModelConfig();
      if (!client) throw new Error('Client init failed');

      const prompt = `
      Extract construction material calculation parameters from the user's query.
      
      Return a JSON object with these fields (all optional):
      - projectType: 'HOUSE' | 'VILLA' | 'WAREHOUSE' | 'CUSTOM'
      - area: number (in m2) - ONLY if user explicitly provides this
      - floors: number - ONLY if user explicitly provides this
      - length: number (in m) - ONLY if user explicitly provides this
      - width: number (in m) - ONLY if user explicitly provides this
      - wallType: 'BRICK' | 'CONCRETE'
      - soilType: 'WEAK' | 'NORMAL' | 'HARD'
      - constructionStyle: 'MODERN' | 'CLASSIC' | 'OPEN'
      
      IMPORTANT RULES:
      - DO NOT GUESS or ESTIMATE area, length, width, or floors if user does NOT explicitly provide numbers!
      - If user says "nhà cấp 4 có 2 phòng ngủ" WITHOUT mentioning m² or dimensions, DO NOT set area or length/width.
      - Only extract values that are EXPLICITLY stated in the user's query.
      - Map "đất yếu", "ruộng", "sình", "ao" -> soilType: 'WEAK'
      - Map "đất cứng", "đồi", "đá" -> soilType: 'HARD'
      - Map "hiện đại" -> constructionStyle: 'MODERN'
      - Map "cổ điển", "tân cổ điển" -> constructionStyle: 'CLASSIC'
      - Map "không gian mở", "nhiều kính", "kính" -> constructionStyle: 'OPEN'
      - Map "nhà phố", "nhà cấp 4" -> projectType: 'HOUSE'
      - Map "biệt thự" -> projectType: 'VILLA'
      - Map "nhà xưởng" -> projectType: 'WAREHOUSE'
      
      User query: ${query}
      
      Return only the JSON object.
      `

      const result = await client.models.generateContent({
        model: modelName!,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const text = (result as any).text || '{}';

      // Try to parse the JSON response
      let params: any = {}
      try {
        const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim()
        params = JSON.parse(cleanedText)
      } catch (parseError) {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            params = JSON.parse(jsonMatch[0])
          } catch (e) { }
        }
      }

      return params
    } catch (error) {
      console.error('Gemini parameter extraction extraction error:', error)
      return null
    }
  }

  // Forecast demand using Statistical Methods (replaced Gemini due to rate limits)
  static async forecastDemand(historyData: any[]): Promise<any> {
    try {
      // Import statistical forecasting service
      const { statisticalForecasting } = await import('./stats-forecasting')

      // Convert data format
      const formattedData = historyData.map(d => ({
        date: d.date,
        value: d.quantity || d.value || 0
      }))

      // Use statistical forecasting
      const result = await statisticalForecasting.forecast(formattedData, 30, 7)

      return {
        predictedDemand: result.predictedDemand,
        confidence: result.confidence,
        reasoning: result.reasoning,
        trend: result.trend,
        methodBreakdown: result.methodBreakdown
      }
    } catch (error) {
      console.error('Statistical forecasting error:', error)
      return {
        predictedDemand: 0,
        confidence: 0,
        reasoning: 'Error generating forecast',
        trend: 'stable'
      }
    }
  }

  // Get smart recommendations using Collaborative Filtering (replaced Gemini due to rate limits)
  static async getSmartRecommendations(
    context: {
      viewedProduct?: any,
      userHistory?: any[],
      cartItems?: any[]
    }
  ): Promise<any[]> {
    try {
      // Import collaborative filtering service
      const { collaborativeFiltering } = await import('./cf-recommendations')
      const { prisma } = await import('./prisma')

      let recommendations: any[] = []

      // If viewing a product, get similar products
      if (context.viewedProduct?.id) {
        const similar = await collaborativeFiltering.getSimilarProducts(context.viewedProduct.id, 5)
        const enriched = await collaborativeFiltering.enrichRecommendations(similar)
        recommendations = enriched.map((p: any) => ({
          name: p.name,
          reason: p.recommendationReason || 'Sản phẩm liên quan',
          category: p.category?.name || 'N/A'
        }))
      }

      // If user has cart items, get frequently bought together
      if (context.cartItems && context.cartItems.length > 0) {
        const cartIds = context.cartItems.map((c: any) => c.productId || c.id).filter(Boolean)
        const fbt = await collaborativeFiltering.getFrequentlyBoughtTogether(cartIds, 5)
        const enriched = await collaborativeFiltering.enrichRecommendations(fbt)
        const fbtRecs = enriched.map((p: any) => ({
          name: p.name,
          reason: p.recommendationReason || 'Thường mua cùng',
          category: p.category?.name || 'N/A'
        }))
        recommendations = [...recommendations, ...fbtRecs]
      }

      // Fallback to popular products
      if (recommendations.length === 0) {
        const popular = await collaborativeFiltering.getPopularProducts(5)
        const enriched = await collaborativeFiltering.enrichRecommendations(popular)
        recommendations = enriched.map((p: any) => ({
          name: p.name,
          reason: 'Sản phẩm bán chạy',
          category: p.category?.name || 'N/A'
        }))
      }

      return recommendations.slice(0, 5)
    } catch (error) {
      console.error('Smart recommendation error:', error)
      return []
    }
  }

  // Optimize logistics/delivery planning
  static async optimizeLogistics(
    orders: any[],
    vehicles: any[]
  ): Promise<any> {
    try {
      const { client, modelName } = await getWorkingModelConfig();
      if (!client) throw new Error('Client init failed');

      const prompt = `
      You are a Logistics Manager AI. Optimize the delivery plan for these orders using the available vehicles.
      
      Orders Pool: ${JSON.stringify(orders)}
      Available Vehicles: ${JSON.stringify(vehicles)}
      
      Task:
      - Group orders into trips to maximize vehicle capacity utilization.
      - Minimize total number of trips.
      - Consider weight constraints (e.g., a 2-ton truck cannot carry 3 tons).
      
      Return a JSON object with:
      - trips: array of objects { vehicleId, orderIds: [], totalWeight, estimatedCost }
      - efficiency: number (0-100)
      - suggestions: string[] (optimization tips)
      
      Return only the JSON object.
      `

      const result = await client.models.generateContent({
        model: modelName!,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const text = (result as any).text || '{}';

      let plan: any = {}
      try {
        const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim()
        plan = JSON.parse(cleanedText)
      } catch (e) {
        // Fallback logic could be added here
      }
      return plan;
    } catch (error) {
      console.error('Gemini logistics error:', error);
      return null;
    }
  }

  // Analyze credit risk for debt management
  static async analyzeCreditRisk(customerData: any): Promise<any> {
    try {
      const { client, modelName } = await getWorkingModelConfig();
      if (!client) throw new Error('Client init failed');

      const prompt = `
      You are a Financial Risk Analyst. Evaluate the credit risk of this construction material customer.
      
      Customer History: ${JSON.stringify(customerData)}
      
      Task:
      - Analyze payment punctuality (on-time vs late).
      - Analyze debt accumulation trend.
      
      Return a JSON object with:
      - riskScore: number (0 = Safe, 100 = High Risk)
      - riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
      - suggestedCreditLimit: number (suggested max debt amount in VND)
      - warning: string (brief reason for the score)
      
      Return only the JSON object.
      `

      const result = await client.models.generateContent({
        model: modelName!,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const text = (result as any).text || '{}';

      let analysis: any = {}
      try {
        const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim()
        analysis = JSON.parse(cleanedText)
      } catch (e) { }
      return analysis;
    } catch (error) {
      console.error('Gemini credit risk error:', error);
      return null;
    }
  }
}

export default AIService