/**
 * AI Material Recognition Service
 * Identify construction materials from images
 */

import { prisma } from '@/lib/prisma'

// Material features for matching
interface MaterialFeatures {
  colors: string[] // Dominant colors
  texture: string // rough, smooth, patterned
  shape: string // rectangular, irregular, cylindrical
  size?: string // estimated dimensions
  category: string // cement, brick, stone, sand, steel
  specificName?: string // Specific name in Vietnamese (e.g., "đá mi", "xi măng Insee")
}

interface RecognitionResult {
  confidence: number
  materialType: string
  matchedProducts: any[]
  features: MaterialFeatures
  suggestions: string[]
}

export class AIRecognitionService {
  /**
   * Analyze image and identify material
   * Uses real Gemini Vision capabilities
   */
  static async recognizeMaterial(
    imageFile: File | string
  ): Promise<RecognitionResult> {
    try {
      // Convert to base64 if File
      const imageData = typeof imageFile === 'string'
        ? imageFile
        : await this.fileToBase64(imageFile)

      // Step 1: Analyze image features using Gemini Vision
      const features = await this.analyzeImageFeatures(imageData)

      // Step 2: Identify material type
      const materialType = this.identifyMaterialType(features)

      // Step 3: Find matching products in database
      const matchedProducts = await this.findMatchingProducts(
        materialType,
        features
      )

      // Step 4: Find complementary products for cross-sell
      const complementaryProducts = await this.getComplementaryProducts(features)

      // Step 5: Combine with reasons
      const allProducts = [...matchedProducts, ...complementaryProducts].slice(0, 8)

      // Step 6: Calculate confidence
      const confidence = this.calculateConfidence(features, matchedProducts)

      // Step 7: Generate suggestions
      const suggestions = this.generateSuggestions(materialType, allProducts)

      return {
        confidence,
        materialType,
        matchedProducts: allProducts,
        features,
        suggestions
      }
    } catch (error) {
      console.error('Material recognition error:', error)
      throw error
    }
  }

  /**
   * Analyze image features using Gemini Vision
   */
  private static async analyzeImageFeatures(
    imageData: string
  ): Promise<MaterialFeatures> {
    const { AIService } = await import('./ai-service')

    const prompt = `
      Analyze this image of construction materials with HIGH PRECISION. 
      Look closely at the grain size/chunk size relative to objects in the background (like the conveyor belt, trees, or ground).

      IDENTIFICATION RULES:
      1. CRITICAL: Distinguish between "đá mi" and "đá 1x2".
         - "đá mi": Grain size 0-5mm. Looks like a pile of dust, ash, or very fine gravel. Individual grains are barely distinguishable without zooming.
         - "đá 1x2": Grain size 10-20mm. Individual stones are clearly visible as chunks about the size of a thumb tip.
      2. Specific Name List (Pick the most accurate):
         - STONE: "đá mi" (dust/fine), "đá mi bụi", "đá 1x2" (1-2cm), "đá 4x6" (4-6cm), "đá hộc".
         - SAND: "cát xây tô" (fine sand), "cát bê tông" (coarse sand).
         - CEMENT: "xi măng" + brand.
         
      Return a JSON object:
      - visualScaleReasoning: Explain why you chose the size (e.g., "Compared to the conveyor belt texture, these grains are very fine like dust, confirming it is đá mi").
      - category: 'cement', 'brick', 'stone', 'sand', 'steel', 'unknown'
      - specificName: Exact Vietnamese name from list above.
      - colors: array of colors.
      - grainSizeMm: your estimate of the average grain diameter in mm.
      - texture: 'smooth', 'rough', 'grainy', 'metallic'
      
      Return ONLY the JSON object.
    `

    try {
      const aiResponse = await AIService.analyzeImage(imageData, prompt)
      console.log('--- Raw AI Vision Response ---')
      console.log(aiResponse)
      console.log('------------------------------')

      let features: any = {}

      try {
        const cleanedText = aiResponse.replace(/```json\s*|\s*```/g, '').trim()
        features = JSON.parse(cleanedText)
      } catch (e) {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) features = JSON.parse(jsonMatch[0])
      }

      if (features.visualScaleReasoning) {
        console.log('--- AI Vision Reasoning ---')
        console.log(features.visualScaleReasoning)
        console.log('---------------------------')
      }

      return {
        category: features.category || 'unknown',
        specificName: features.specificName || '',
        colors: features.colors || [],
        texture: features.texture || 'unknown',
        shape: features.shape || features.texture || 'unknown'
      }
    } catch (error) {
      console.error('AI Vision feature analysis error:', error)
      return {
        category: 'unknown',
        specificName: '',
        colors: [],
        texture: 'unknown',
        shape: 'unknown'
      }
    }
  }

  /**
   * Identify material type from features
   */
  private static identifyMaterialType(features: MaterialFeatures): string {
    const { category, specificName } = features

    if (specificName) return specificName.charAt(0).toUpperCase() + specificName.slice(1)

    // Fallback classification based on AI category
    if (category === 'cement') return 'Xi măng (Cement)'
    if (category === 'brick') return 'Gạch (Bricks)'
    if (category === 'stone') return 'Đá (Stone)'
    if (category === 'sand') return 'Cát (Sand)'
    if (category === 'steel') return 'Thép (Steel)'

    return 'Vật liệu xây dựng (Construction Material)'
  }

  /**
   * Find matching products in database
   */
  private static async findMatchingProducts(
    materialType: string,
    features: MaterialFeatures
  ): Promise<any[]> {
    try {
      const keywords = materialType.toLowerCase()
      const specificName = features.specificName?.toLowerCase() || ''
      let categoryFilter: any = {}

      if (keywords.includes('xi măng') || keywords.includes('cement')) {
        categoryFilter = {
          OR: [
            { name: { contains: 'xi măng', mode: 'insensitive' } },
            { name: { contains: 'cement', mode: 'insensitive' } },
            { category: { name: { contains: 'xi măng', mode: 'insensitive' } } }
          ]
        }
      } else if (keywords.includes('gạch') || keywords.includes('brick')) {
        categoryFilter = {
          OR: [
            { name: { contains: 'gạch', mode: 'insensitive' } },
            { name: { contains: 'brick', mode: 'insensitive' } },
            { category: { name: { contains: 'gạch', mode: 'insensitive' } } }
          ]
        }
      } else if (keywords.includes('đá') || keywords.includes('stone')) {
        categoryFilter = {
          OR: [
            { name: { contains: 'đá', mode: 'insensitive' } },
            { name: { contains: 'stone', mode: 'insensitive' } },
            { category: { name: { contains: 'đá', mode: 'insensitive' } } }
          ]
        }
      } else if (keywords.includes('cát') || keywords.includes('sand')) {
        categoryFilter = {
          OR: [
            { name: { contains: 'cát', mode: 'insensitive' } },
            { name: { contains: 'sand', mode: 'insensitive' } },
            { category: { name: { contains: 'cát', mode: 'insensitive' } } }
          ]
        }
      } else if (keywords.includes('thép') || keywords.includes('steel')) {
        categoryFilter = {
          OR: [
            { name: { contains: 'thép', mode: 'insensitive' } },
            { name: { contains: 'steel', mode: 'insensitive' } },
            { category: { name: { contains: 'thép', mode: 'insensitive' } } }
          ]
        }
      }

      // Query database
      const products = await prisma.product.findMany({
        where: {
          ...categoryFilter,
          isActive: true
        },
        include: {
          category: true,
          inventoryItem: true,
          orderItems: {
            select: { id: true }
          }
        },
        orderBy: [
          { price: 'asc' }
        ],
        take: 15
      })

      // Score and sort by relevance with reasons
      const scoredProducts = products.map(product => {
        let score = 0.5 // Base score
        let reason = ''
        const productName = product.name.toLowerCase()

        // Boost if specific name matches exactly or partially
        if (specificName) {
          if (productName === specificName) {
            score += 1.0 // Exact match
            reason = '✅ Khớp chính xác với ảnh bạn gửi'
          } else if (productName.includes(specificName) || specificName.includes(productName)) {
            score += 0.5 // Partial match
            reason = '🎯 Phù hợp với ảnh bạn gửi'
          }

          // Secondary specific keywords boost (for "đá mi" vs "đá 1x2")
          const subTypes = ['mi', '1x2', '1x1', '4x6', 'xây tô', 'bát tràng']
          for (const sub of subTypes) {
            if (specificName.includes(sub) && productName.includes(sub)) {
              score += 0.4
              if (!reason) reason = '🎯 Phù hợp với ảnh'
            }
          }
        }

        // Boost popular products
        const orderItemCount = product.orderItems?.length || 0
        if (orderItemCount > 10) {
          score += 0.1
          if (!reason) reason = '🔥 Bán chạy nhất'
        }

        // Boost if in stock
        if (product.inventoryItem && product.inventoryItem.availableQuantity > 0) {
          score += 0.2
          if (!reason) reason = '✨ Còn hàng, giao nhanh'
        }

        if (!reason) reason = '📦 Sản phẩm cùng loại'

        return {
          ...product,
          matchScore: score,
          reason,
          inStock: product.inventoryItem
            ? product.inventoryItem.availableQuantity > 0
            : false
        }
      })

      return scoredProducts
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 4)
    } catch (error) {
      console.error('Error finding matching products:', error)
      return []
    }
  }

  /**
   * Get complementary products for cross-selling
   */
  private static async getComplementaryProducts(features: MaterialFeatures): Promise<any[]> {
    try {
      const category = features.category

      // Define complementary categories
      const complementaryMap: Record<string, string[]> = {
        stone: ['sand', 'cement'],
        sand: ['cement', 'stone'],
        cement: ['sand', 'stone'],
        brick: ['cement', 'sand'],
        steel: ['cement']
      }

      const complementaryCategories = complementaryMap[category] || ['cement', 'sand']

      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: complementaryCategories.flatMap(cat => [
            { name: { contains: cat === 'cement' ? 'xi măng' : cat === 'sand' ? 'cát' : cat === 'stone' ? 'đá' : cat, mode: 'insensitive' as const } },
            { category: { name: { contains: cat === 'cement' ? 'xi măng' : cat === 'sand' ? 'cát' : cat === 'stone' ? 'đá' : cat, mode: 'insensitive' as const } } }
          ])
        },
        include: {
          category: true,
          inventoryItem: true,
          orderItems: {
            select: { id: true }
          }
        },
        orderBy: { price: 'asc' },
        take: 6
      })

      // Add cross-sell reasons
      const productsWithReasons = products.map(product => {
        const orderCount = product.orderItems?.length || 0
        let reason = '💡 Thường mua cùng'

        if (orderCount > 20) {
          reason = '🔥 Sản phẩm bán chạy'
        } else if (product.inventoryItem && product.inventoryItem.availableQuantity > 100) {
          reason = '📦 Còn nhiều hàng - Giá tốt'
        }

        return {
          ...product,
          matchScore: 0.3,
          reason,
          inStock: product.inventoryItem ? product.inventoryItem.availableQuantity > 0 : false
        }
      })

      return productsWithReasons.slice(0, 3)
    } catch (error) {
      console.error('Error getting complementary products:', error)
      return []
    }
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(
    features: MaterialFeatures,
    matchedProducts: any[]
  ): number {
    let confidence = 0.6 // Base confidence

    // Boost if category is clearly identified
    if (features.category !== 'unknown') {
      confidence += 0.1
    }

    // Boost if specific name was found
    if (features.specificName) {
      confidence += 0.15
    }

    // Boost if we found matching products
    if (matchedProducts.length > 0) {
      confidence += 0.1
    }

    return Math.min(confidence, 0.95)
  }

  /**
   * Generate helpful suggestions
   */
  private static generateSuggestions(
    materialType: string,
    matchedProducts: any[]
  ): string[] {
    const suggestions: string[] = []

    if (matchedProducts.length === 0) {
      suggestions.push('Không tìm thấy sản phẩm phù hợp. Thử chụp ảnh rõ hơn.')
      suggestions.push('Đảm bảo ánh sáng tốt và chụp từ nhiều góc độ.')
    } else {
      suggestions.push(`Nhấn vào sản phẩm để xem chi tiết`)

      const type = materialType.toLowerCase()
      if (type.includes('xi măng')) {
        suggestions.push('Lưu ý: Kiểm tra loại PC30/PC40 phù hợp')
      } else if (type.includes('gạch')) {
        suggestions.push('Nên mua dư 5-10% để dự phòng')
      } else if (type.includes('đá')) {
        suggestions.push('Lưu ý: Chọn đúng kích thước đá mi/1x2/4x6')
      }
    }

    return suggestions
  }

  /**
   * Convert File to base64
   */
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Quick material identification from keywords
   */
  static async identifyFromText(query: string): Promise<RecognitionResult> {
    const lowerQuery = query.toLowerCase()

    // Determine material type from text
    let materialType = 'Vật liệu xây dựng'
    const features: MaterialFeatures = {
      colors: [],
      texture: 'unknown',
      shape: 'unknown',
      category: 'unknown',
      specificName: ''
    }

    if (lowerQuery.includes('xi măng') || lowerQuery.includes('cement')) {
      materialType = 'Xi măng (Cement)'
      features.category = 'cement'
    } else if (lowerQuery.includes('gạch') || lowerQuery.includes('brick')) {
      materialType = 'Gạch (Bricks)'
      features.category = 'brick'
    } else if (lowerQuery.includes('đá') || lowerQuery.includes('stone')) {
      materialType = 'Đá (Stone)'
      features.category = 'stone'
      if (lowerQuery.includes('mi')) features.specificName = 'đá mi'
      if (lowerQuery.includes('1x2')) features.specificName = 'đá 1x2'
    } else if (lowerQuery.includes('cát') || lowerQuery.includes('sand')) {
      materialType = 'Cát (Sand)'
      features.category = 'sand'
    } else if (lowerQuery.includes('thép') || lowerQuery.includes('steel')) {
      materialType = 'Thép (Steel)'
      features.category = 'steel'
    }

    // Find matching products
    const matchedProducts = await this.findMatchingProducts(materialType, features)

    return {
      confidence: 0.85,
      materialType,
      matchedProducts,
      features,
      suggestions: this.generateSuggestions(materialType, matchedProducts)
    }
  }
}

export const aiRecognition = AIRecognitionService
