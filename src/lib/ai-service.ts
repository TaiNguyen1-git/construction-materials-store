import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIG, CHATBOT_SYSTEM_PROMPT, OCR_SYSTEM_PROMPT } from './ai-config'
import { prisma } from './prisma'

// Initialize OpenAI client (if API key is provided)
const openai = AI_CONFIG.OPENAI.API_KEY ? new OpenAI({
  apiKey: AI_CONFIG.OPENAI.API_KEY,
}) : null

// Initialize Gemini client (if API key is provided)
const gemini = AI_CONFIG.GEMINI.API_KEY ? new GoogleGenerativeAI(AI_CONFIG.GEMINI.API_KEY) : null

// Function to get a working Gemini model
let geminiModel: any = null;
const getGeminiModel = async () => {
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

// Determine which AI service to use
const getAIService = () => {
  if (AI_CONFIG.GEMINI.API_KEY) {
    return 'gemini'
  } else if (AI_CONFIG.OPENAI.API_KEY) {
    return 'openai'
  } else {
    throw new Error('No AI service configured. Please set either GEMINI_API_KEY or OPENAI_API_KEY in your environment variables.')
  }
}

export class AIService {
  // Generate chatbot response using either OpenAI or Gemini
  static async generateChatbotResponse(
    message: string,
    context?: any,
    conversationHistory?: { role: string; content: string }[]
  ): Promise<ChatbotResponse> {
    try {
      const service = getAIService()

      if (service === 'gemini' && gemini) {
        return await this.generateChatbotResponseWithGemini(message, context, conversationHistory)
      } else if (service === 'openai' && openai) {
        return await this.generateChatbotResponseWithOpenAI(message, context, conversationHistory)
      } else {
        throw new Error('No AI service available')
      }
    } catch (error) {
      console.error('AI chatbot error:', error)
      throw new Error('Failed to generate chatbot response')
    }
  }

  // Generate chatbot response using Gemini
  private static async generateChatbotResponseWithGemini(
    message: string,
    context?: any,
    conversationHistory?: { role: string; content: string }[]
  ): Promise<ChatbotResponse> {
    try {
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
          const structuredResponse = await this.extractChatbotStructureWithGemini(aiResponse)

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

  // Generate chatbot response using OpenAI
  private static async generateChatbotResponseWithOpenAI(
    message: string,
    context?: any,
    conversationHistory?: { role: string; content: string }[]
  ): Promise<ChatbotResponse> {
    if (!openai) {
      throw new Error('OpenAI client not initialized')
    }

    try {
      // Prepare the conversation messages
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: CHATBOT_SYSTEM_PROMPT },
      ]

      // Add conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        messages.push(...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })))
      }

      // Add the current user message
      messages.push({ role: 'user', content: message })

      // Add context information if available
      if (context) {
        messages.push({
          role: 'system',
          content: `Context information: ${JSON.stringify(context)}`
        })
      }

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: AI_CONFIG.OPENAI.MODEL,
        messages,
        temperature: AI_CONFIG.OPENAI.TEMPERATURE,
        max_tokens: 500,
      })

      const aiResponse = completion.choices[0].message.content || 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này.'

      // Extract structured information from the response
      const structuredResponse = await this.extractChatbotStructureWithOpenAI(aiResponse)

      return {
        response: structuredResponse.response,
        suggestions: structuredResponse.suggestions,
        productRecommendations: structuredResponse.productRecommendations,
        confidence: completion.choices[0].finish_reason === 'stop' ? 0.95 : 0.85
      }
    } catch (error) {
      console.error('OpenAI chatbot error:', error)
      throw new Error('Failed to generate chatbot response with OpenAI')
    }
  }

  // Extract structured information from chatbot response using Gemini
  private static async extractChatbotStructureWithGemini(response: string): Promise<ChatbotResponse> {
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

  // Extract structured information from chatbot response using OpenAI
  private static async extractChatbotStructureWithOpenAI(response: string): Promise<ChatbotResponse> {
    if (!openai) {
      throw new Error('OpenAI client not initialized')
    }

    try {
      // Ask OpenAI to structure the response
      const completion = await openai.chat.completions.create({
        model: AI_CONFIG.OPENAI.MODEL,
        messages: [
          {
            role: 'system',
            content: `
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
            `
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })

      const structured = JSON.parse(completion.choices[0].message.content || '{}')

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

  // Process OCR text using either OpenAI or Gemini
  static async processOCRText(extractedText: string): Promise<OCRResponse> {
    try {
      const service = getAIService()

      if (service === 'gemini' && gemini) {
        return await this.processOCRTextWithGemini(extractedText)
      } else if (service === 'openai' && openai) {
        return await this.processOCRTextWithOpenAI(extractedText)
      } else {
        throw new Error('No AI service available')
      }
    } catch (error) {
      console.error('AI OCR processing error:', error)
      throw new Error('Failed to process OCR text')
    }
  }

  // Process OCR text using Gemini
  private static async processOCRTextWithGemini(extractedText: string): Promise<OCRResponse> {
    try {
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

  // Process OCR text using OpenAI
  private static async processOCRTextWithOpenAI(extractedText: string): Promise<OCRResponse> {
    if (!openai) {
      throw new Error('OpenAI client not initialized')
    }

    try {
      const completion = await openai.chat.completions.create({
        model: AI_CONFIG.OPENAI.MODEL,
        messages: [
          { role: 'system', content: OCR_SYSTEM_PROMPT },
          { role: 'user', content: `Please extract structured data from this invoice text:\n\n${extractedText}` }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
        max_tokens: 1000,
      })

      const processedData = JSON.parse(completion.choices[0].message.content || '{}')

      return {
        extractedText,
        processedData,
        confidence: completion.choices[0].finish_reason === 'stop' ? 0.95 : 0.85
      }
    } catch (error) {
      console.error('OpenAI OCR processing error:', error)
      throw new Error('Failed to process OCR text with OpenAI')
    }
  }

  // Get product recommendations based on user query using either OpenAI or Gemini
  static async getProductRecommendations(query: string, context?: any): Promise<any[]> {
    try {
      const service = getAIService()

      if (service === 'gemini' && gemini) {
        return await this.getProductRecommendationsWithGemini(query, context)
      } else if (service === 'openai' && openai) {
        return await this.getProductRecommendationsWithOpenAI(query, context)
      } else {
        throw new Error('No AI service available')
      }
    } catch (error) {
      console.error('Product recommendation error:', error)
      return []
    }
  }

  // Get product recommendations using Gemini
  private static async getProductRecommendationsWithGemini(query: string, context?: any): Promise<any[]> {
    try {
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

  // Get product recommendations using OpenAI
  private static async getProductRecommendationsWithOpenAI(query: string, context?: any): Promise<any[]> {
    if (!openai) {
      throw new Error('OpenAI client not initialized')
    }

    try {
      // In a real implementation, this would query your product database
      // For now, we'll simulate this with AI
      const completion = await openai.chat.completions.create({
        model: AI_CONFIG.OPENAI.MODEL,
        messages: [
          {
            role: 'system',
            content: `
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
            `
          }
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' }
      })

      const recommendations = JSON.parse(completion.choices[0].message.content || '[]')
      return Array.isArray(recommendations) ? recommendations : []
    } catch (error) {
      console.error('OpenAI product recommendation error:', error)
      return []
    }
  }

  // Analyze customer sentiment using either OpenAI or Gemini
  static async analyzeSentiment(message: string): Promise<{ sentiment: string; confidence: number }> {
    try {
      const service = getAIService()

      if (service === 'gemini' && gemini) {
        return await this.analyzeSentimentWithGemini(message)
      } else if (service === 'openai' && openai) {
        return await this.analyzeSentimentWithOpenAI(message)
      } else {
        throw new Error('No AI service available')
      }
    } catch (error) {
      console.error('Sentiment analysis error:', error)
      return { sentiment: 'neutral', confidence: 0.5 }
    }
  }

  // Analyze customer sentiment using Gemini
  private static async analyzeSentimentWithGemini(message: string): Promise<{ sentiment: string; confidence: number }> {
    try {
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

  // Analyze customer sentiment using OpenAI
  private static async analyzeSentimentWithOpenAI(message: string): Promise<{ sentiment: string; confidence: number }> {
    if (!openai) {
      throw new Error('OpenAI client not initialized')
    }

    try {
      const completion = await openai.chat.completions.create({
        model: AI_CONFIG.OPENAI.MODEL,
        messages: [
          {
            role: 'system',
            content: `
            Analyze the sentiment of the following customer message.
            Return a JSON object with:
            - sentiment: "positive", "negative", or "neutral"
            - confidence: a number between 0 and 1
            
            Example format:
            {"sentiment": "positive", "confidence": 0.95}
            `
          },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })

      return JSON.parse(completion.choices[0].message.content || '{"sentiment": "neutral", "confidence": 0.5}')
    } catch (error) {
      console.error('OpenAI sentiment analysis error:', error)
      return { sentiment: 'neutral', confidence: 0.5 }
    }
  }

  // Extract material calculation parameters from user query
  static async extractMaterialCalculationParams(query: string): Promise<any> {
    try {
      const service = getAIService()

      if (service === 'gemini' && gemini) {
        return await this.extractParamsWithGemini(query)
      } else if (service === 'openai' && openai) {
        return await this.extractParamsWithOpenAI(query)
      } else {
        throw new Error('No AI service available')
      }
    } catch (error) {
      console.error('Parameter extraction error:', error)
      return null
    }
  }

  // Extract parameters using Gemini
  private static async extractParamsWithGemini(query: string): Promise<any> {
    try {
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

  // Extract parameters using OpenAI
  private static async extractParamsWithOpenAI(query: string): Promise<any> {
    if (!openai) {
      throw new Error('OpenAI client not initialized')
    }

    try {
      const completion = await openai.chat.completions.create({
        model: AI_CONFIG.OPENAI.MODEL,
        messages: [
          {
            role: 'system',
            content: `
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
            `
          },
          { role: 'user', content: query }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })

      return JSON.parse(completion.choices[0].message.content || '{}')
    } catch (error) {
      console.error('OpenAI parameter extraction error:', error)
      return null
    }
  }
}

export default AIService