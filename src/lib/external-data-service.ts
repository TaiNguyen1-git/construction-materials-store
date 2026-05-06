import { prisma } from './prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface WeatherData {
  temp: number
  condition: string
  rainProbability: number
  description: string
}

export interface MarketInsight {
  trend: 'UP' | 'DOWN' | 'STABLE'
  factor: number // -1.0 to 1.0 impact
  summary: string
  keywords: string[]
}

export class ExternalDataService {
  /**
   * Fetch current weather (Mocked for Demo if no API key, but structured for OpenWeather)
   */
  async getWeatherData(city: string = 'Ho Chi Minh'): Promise<WeatherData> {
    try {
      // In a real app, you would fetch from OpenWeatherMap:
      // const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}`)
      // const data = await res.json()
      
      // For Demo: Randomize a bit based on current month (May is start of rainy season in VN)
      const month = new Date().getMonth()
      const isRainySeason = month >= 4 && month <= 10
      
      const mockWeather: WeatherData = {
        temp: isRainySeason ? 28 + Math.random() * 5 : 32 + Math.random() * 4,
        condition: isRainySeason && Math.random() > 0.4 ? 'Rainy' : 'Sunny',
        rainProbability: isRainySeason ? 0.6 : 0.1,
        description: isRainySeason ? 'Khả năng có mưa rào vào chiều tối' : 'Trời nắng nóng, khô ráo'
      }

      // Log to DB
      await prisma.externalFactorLog.create({
        data: {
          type: 'WEATHER',
          source: 'MockWeatherAPI',
          value: mockWeather as any,
          impact: mockWeather.condition === 'Rainy' ? -0.2 : 0.1 // Rain slows construction
        }
      })

      return mockWeather
    } catch (error) {
      console.error('Weather Fetch Error:', error)
      return { temp: 30, condition: 'Sunny', rainProbability: 0, description: 'Dữ liệu không khả dụng' }
    }
  }

  /**
   * Analyze market using Gemini AI
   */
  async getMarketInsights(category: string = 'Vật liệu xây dựng'): Promise<MarketInsight> {
    try {
      if (!process.env.GEMINI_API_KEY) {
        // Mock fallback for demo without key
        return {
          trend: 'UP',
          factor: 0.15,
          summary: 'Nhu cầu xây dựng dân dụng đang tăng nhẹ trong quý 2.',
          keywords: ['sắt thép', 'xi măng', 'tăng giá']
        }
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const prompt = `Phân tích tình hình thị trường ${category} tại Việt Nam vào tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}. 
      Trả về kết quả dưới dạng JSON với các trường: trend (UP/DOWN/STABLE), factor (số từ -1.0 đến 1.0), summary (tóm tắt ngắn gọn), keywords (mảng từ khóa). 
      Chỉ trả về JSON.`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Clean JSON if needed
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
      const insight: MarketInsight = JSON.parse(jsonStr)

      // Log to DB
      await prisma.externalFactorLog.create({
        data: {
          type: 'MARKET_PRICE',
          source: 'Gemini_AI_Analysis',
          value: insight as any,
          impact: insight.factor
        }
      })

      return insight
    } catch (error) {
      console.error('Gemini Market Error:', error)
      return { trend: 'STABLE', factor: 0, summary: 'Thị trường ổn định', keywords: [] }
    }
  }

  /**
   * Get combined impact factor for a product
   */
  async getCombinedImpact(productId: string): Promise<number> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const logs = await prisma.externalFactorLog.findMany({
      where: { recordedAt: { gte: last24h } },
      orderBy: { recordedAt: 'desc' },
      take: 5
    })

    if (logs.length === 0) return 0

    // Average impact
    const totalImpact = logs.reduce((sum, log) => sum + (log.impact || 0), 0)
    return totalImpact / logs.length
  }
}

export const externalDataService = new ExternalDataService()
