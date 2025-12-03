import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIG, CHATBOT_SYSTEM_PROMPT, OCR_SYSTEM_PROMPT } from './ai-config'

// Initialize Gemini client (if API key is provided)
const gemini = AI_CONFIG.GEMINI.API_KEY ? new GoogleGenerativeAI(AI_CONFIG.GEMINI.API_KEY) : null

// Function to get a working Gemini model
let geminiModel: any = null;
export const getGeminiModel = async () => {
  if (geminiModel) return geminiModel;

  if (!gemini) {
    throw new Error('Gemini client not initialized');
  }

  // Try different model names in order of preference
  const modelNames = [
    'models/gemini-2.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.0-pro-latest',
    'gemini-1.0-pro',
    'gemini-pro',
    'models/gemini-1.5-flash',
    'models/gemini-1.0-pro',
    'models/gemini-pro'
  ];

  // First try the model specified in the configuration
  if (AI_CONFIG.GEMINI.MODEL) {
    try {
      const model = gemini.getGenerativeModel({
        model: AI_CONFIG.GEMINI.MODEL,
        generationConfig: {
          temperature: parseFloat(AI_CONFIG.GEMINI.TEMPERATURE.toString())
        }
      });

      // Test the model with a simple prompt
      await Promise.race([
        model.generateContent("Test"),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Model test timeout')), 10000)
        )
      ]);

      geminiModel = model;
      console.log(`✅ Using Gemini model: ${AI_CONFIG.GEMINI.MODEL}`);
      return model;
    } catch (error) {
      console.log(`❌ Failed to initialize Gemini model ${AI_CONFIG.GEMINI.MODEL}:`, (error as Error).message);
    }
  }

  // If the configured model fails, try the fallback models
  for (const modelName of modelNames) {
    try {
      const model = gemini.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: parseFloat(AI_CONFIG.GEMINI.TEMPERATURE.toString())
        }
      });

      // Test the model with a simple prompt
      await Promise.race([
        model.generateContent("Test"),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Model test timeout')), 10000)
        )
      ]);

      geminiModel = model;
      console.log(`✅ Using Gemini model: ${modelName}`);
      return model;
    } catch (error) {
      console.log(`❌ Failed to initialize Gemini model ${modelName}:`, (error as Error).message);
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
    conversationHistory?: { role: string; content: string }[]
  ): Promise<ChatbotResponse> {
    try {
      if (!gemini) {
        throw new Error('Gemini client not initialized')
      }

      const model = await getGeminiModel();

      // Prepare the conversation history for Gemini
      let chatHistory = [
        {
          role: "user",
          parts: [{ text: CHATBOT_SYSTEM_PROMPT }]
        },
        {
          role: "model",
          parts: [{ text: "Tôi đã hiểu. Tôi sẽ đóng vai trò là trợ lý ảo của cửa hàng vật liệu xây dựng và hỗ trợ khách hàng nhiệt tình, chuyên nghiệp." }]
        }
      ]

      // Add conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        for (const msg of conversationHistory) {
          chatHistory.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          })
        }
      }

      // Add context information if available
      if (context) {
        chatHistory.push({
          role: "user",
          parts: [{ text: `Context information: ${JSON.stringify(context)}` }]
        })
      }

      // Start chat with history
      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      })

      // Retry logic
      let retries = 2
      let lastError = null

      while (retries >= 0) {
        try {
          // Send the current user message with timeout (increased to 45s)
          const result = await Promise.race([
            chat.sendMessage(message),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Chat message timeout')), 45000)
            )
          ]);

          const response = await (result as any).response
          const aiResponse = response.text()

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
          console.warn(`Gemini attempt failed (${retries} retries left):`, error)
          lastError = error
          retries--
          if (retries >= 0) {
            // Wait before retry (1s, then 2s)
            await new Promise(resolve => setTimeout(resolve, (2 - retries) * 1000))
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
      const model = await getGeminiModel();

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

      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Structure extraction timeout')), 20000)
        )
      ]);

      const structuredText = await (result as any).response.text()

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
      if (!gemini) {
        throw new Error('Gemini client not initialized')
      }
      const model = await getGeminiModel();

      const prompt = `
      ${OCR_SYSTEM_PROMPT}
      
      Please extract structured data from this invoice text:
      
      ${extractedText}
      
      Return only the JSON object, nothing else.
      `

      const result = await Promise.race([
        model.generateContent([prompt]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('OCR processing timeout')), 30000)
        )
      ]);

      const response = await (result as any).response
      const processedText = response.text()

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

  // Get product recommendations based on user query using Gemini
  static async getProductRecommendations(query: string, context?: any): Promise<any[]> {
    try {
      if (!gemini) {
        throw new Error('Gemini client not initialized')
      }
      const model = await getGeminiModel();

      const prompt = `
      You are a product recommendation engine for a construction materials store.
      Based on the user's query, suggest 3-5 relevant products.
      Return a JSON array of product objects with these fields:
      - name: product name
      - description: brief description
      - price: approximate price
      - unit: unit of measurement
      
      Example format:
      [
        {"name": "Cement Bags", "description": "Standard Portland cement", "price": 15.00, "unit": "bag"},
        {"name": "Steel Rebar", "description": "12mm diameter rebar", "price": 8.50, "unit": "piece"}
      ]
      
      User query: ${query}
      ${context ? `Context: ${JSON.stringify(context)}` : ''}
      
      Return only the JSON array, nothing else.
      `

      const result = await Promise.race([
        model.generateContent([prompt]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Product recommendations timeout')), 20000)
        )
      ]);

      const response = await (result as any).response
      const recommendationsText = response.text()

      // Try to parse the JSON response
      let recommendations: any[] = []
      try {
        // Remove any markdown code block markers if present
        const cleanedText = recommendationsText.replace(/```json\s*|\s*```/g, '').trim()
        recommendations = JSON.parse(cleanedText)
      } catch (parseError) {
        console.error('Failed to parse Gemini recommendations response:', parseError)
        // Try to extract JSON array from the text
        const jsonArrayMatch = recommendationsText.match(/\[.*\]/)
        if (jsonArrayMatch) {
          try {
            recommendations = JSON.parse(jsonArrayMatch[0])
          } catch (secondParseError) {
            console.error('Second parsing attempt failed:', secondParseError)
          }
        }
      }

      return Array.isArray(recommendations) ? recommendations : []
    } catch (error) {
      console.error('Gemini product recommendation error:', error)
      return []
    }
  }

  // Analyze customer sentiment using Gemini
  static async analyzeSentiment(message: string): Promise<{ sentiment: string; confidence: number }> {
    try {
      if (!gemini) {
        throw new Error('Gemini client not initialized')
      }
      const model = await getGeminiModel();

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

      const result = await Promise.race([
        model.generateContent([prompt]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Sentiment analysis timeout')), 15000)
        )
      ]);

      const response = await (result as any).response
      const sentimentText = response.text()

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
      if (!gemini) {
        throw new Error('Gemini client not initialized')
      }
      const model = await getGeminiModel();

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
      - Map "thiên" to 1000 quantity.
      - Map "chục" to 10 quantity.
      
      User message: "${message}"
      
      Return only the JSON object.
      `

      const result = await Promise.race([
        model.generateContent([prompt]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Order parsing timeout')), 15000)
        )
      ]);

      const response = await (result as any).response
      const text = response.text()

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
      if (!gemini) {
        throw new Error('Gemini client not initialized')
      }
      const model = await getGeminiModel();

      const prompt = `
      Extract construction material calculation parameters from the user's query.
      
      Return a JSON object with these fields (all optional):
      - projectType: 'HOUSE' | 'VILLA' | 'WAREHOUSE' | 'CUSTOM'
      - area: number (in m2)
      - floors: number
      - length: number (in m)
      - width: number (in m)
      - wallType: 'BRICK' | 'CONCRETE'
      - soilType: 'WEAK' | 'NORMAL' | 'HARD'
      - constructionStyle: 'MODERN' | 'CLASSIC' | 'OPEN'
      
      Rules:
      - Map "đất yếu", "ruộng", "sình", "ao" -> soilType: 'WEAK'
      - Map "đất cứng", "đồi", "đá" -> soilType: 'HARD'
      - Map "hiện đại" -> constructionStyle: 'MODERN'
      - Map "cổ điển", "tân cổ điển" -> constructionStyle: 'CLASSIC'
      - Map "không gian mở", "nhiều kính", "kính" -> constructionStyle: 'OPEN'
      - Map "nhà phố" -> projectType: 'HOUSE'
      - Map "biệt thự" -> projectType: 'VILLA'
      - Map "nhà xưởng" -> projectType: 'WAREHOUSE'
      
      User query: ${query}
      
      Return only the JSON object, nothing else.
      `

      const result = await Promise.race([
        model.generateContent([prompt]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Parameter extraction timeout')), 15000)
        )
      ]);

      const response = await (result as any).response
      const text = response.text()

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
}

export default AIService