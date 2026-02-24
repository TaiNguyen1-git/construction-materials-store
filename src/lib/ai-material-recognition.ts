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
  isConstructionMaterial: boolean // New flag
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        isConstructionMaterial: features.category !== 'unknown',
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
      Look closely at the shape, holes, texture, and color to identify the exact material type.

      IDENTIFICATION RULES:
      
      1. BRICK (category: 'brick') - Rectangular blocks, usually terracotta/red color:
         - "gạch ống" or "gạch block Tuynel": Has MULTIPLE HOLLOW HOLES running through it (4, 6, or 8 holes). Terracotta red color with ribbed/grooved surface. Common for building walls.
         - "gạch đinh" or "gạch thẻ": SOLID brick, smaller size (~8x8x18cm or 6x10x20cm), no holes or only 2 small holes. Used for walls.
         - "gạch lát nền" or "gạch ceramic": Flat, smooth glazed surface. For flooring/tiling.
         - "gạch block bê tông": Gray cement color, hollow, larger and heavier than clay bricks.
      
      2. STONE (category: 'stone') - Crushed rocks/aggregate:
         - "đá mi": Grain size 0-5mm. Very fine like dust or ash.
         - "đá 1x2": Grain size 10-20mm. Individual stones visible as chunks.
         - "đá 4x6": Grain size 4-6cm. Larger crushed rocks.
      
      3. SAND (category: 'sand') - Fine granular material:
         - "cát xây tô" or "cát vàng": Yellow/brown fine sand.
         - "cát bê tông": Coarser sand for concrete.
      
      4. CEMENT (category: 'cement') - Bags or powder:
         - Look for brand names: INSEE, Hà Tiên, Holcim, etc.
      
      5. STEEL (category: 'steel') - Metal bars/rods:
         - "thép": Round or deformed steel bars, ribbed texture.
         
      Return a JSON object:
      - visualScaleReasoning: Explain your identification (e.g., "This is a terracotta brick with 6 hollow holes and ribbed surface, confirming it is gạch ống Tuynel").
      - category: 'cement', 'brick', 'stone', 'sand', 'steel', 'unknown'
      - specificName: Exact Vietnamese name from rules above (e.g., "gạch ống Tuynel", "đá 1x2", "xi măng INSEE").
      - colors: array of colors observed.
      - texture: 'smooth', 'rough', 'grainy', 'metallic', 'ribbed'
      - shape: 'rectangular', 'cylindrical', 'irregular', 'granular'
      
      Return ONLY the JSON object.
    `

    try {
      const aiResponse = await AIService.analyzeImage(imageData, prompt)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let features: any = {}

      try {
        const cleanedText = aiResponse.replace(/```json\s*|\s*```/g, '').trim()
        features = JSON.parse(cleanedText)
      } catch {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) features = JSON.parse(jsonMatch[0])
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      if (Object.keys(categoryFilter).length === 0) {
        return [] // Fix: Return empty if no category matched instead of everything
      }
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      if (category === 'unknown') return [] // Fix: No complementary products for unknown categories
      const complementaryCategories = complementaryMap[category] || []

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      isConstructionMaterial: features.category !== 'unknown',
      matchedProducts,
      features,
      suggestions: this.generateSuggestions(materialType, matchedProducts)
    }
  }
}

export const aiRecognition = AIRecognitionService
