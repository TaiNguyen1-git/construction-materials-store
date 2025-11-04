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
   * Uses multiple strategies:
   * 1. Color analysis
   * 2. Texture detection
   * 3. Shape recognition
   * 4. Product matching from database
   */
  static async recognizeMaterial(
    imageFile: File | string
  ): Promise<RecognitionResult> {
    try {
      // Convert to base64 if File
      const imageData = typeof imageFile === 'string' 
        ? imageFile 
        : await this.fileToBase64(imageFile)

      // Step 1: Analyze image features
      const features = await this.analyzeImageFeatures(imageData)

      // Step 2: Identify material type
      const materialType = this.identifyMaterialType(features)

      // Step 3: Find matching products in database
      const matchedProducts = await this.findMatchingProducts(
        materialType,
        features
      )

      // Step 4: Calculate confidence
      const confidence = this.calculateConfidence(features, matchedProducts)

      // Step 5: Generate suggestions
      const suggestions = this.generateSuggestions(materialType, matchedProducts)

      return {
        confidence,
        materialType,
        matchedProducts,
        features,
        suggestions
      }
    } catch (error) {
      console.error('Material recognition error:', error)
      throw error
    }
  }

  /**
   * Analyze image features using multiple techniques
   */
  private static async analyzeImageFeatures(
    imageData: string
  ): Promise<MaterialFeatures> {
    // In production, this would use TensorFlow.js or Vision API
    // For now, we'll use pattern matching and heuristics

    // Simulate image analysis
    // TODO: Integrate with actual image processing library
    
    const colors = await this.extractColors(imageData)
    const texture = this.detectTexture(imageData)
    const shape = this.detectShape(imageData)

    // Determine category from colors and texture
    let category = 'unknown'
    
    // Gray colors → Likely cement or concrete
    if (colors.some(c => c.match(/#[89ABCDEF]{6}/i))) {
      category = 'cement'
    }
    // Red/orange → Bricks
    else if (colors.some(c => c.match(/#[A-F][0-5]/i))) {
      category = 'brick'
    }
    // Multi-colored rocks → Stone
    else if (colors.length > 3) {
      category = 'stone'
    }
    // Yellow/beige → Sand
    else if (colors.some(c => c.match(/#[C-F][C-F][8-C]/i))) {
      category = 'sand'
    }
    // Dark/metallic → Steel
    else if (colors.some(c => c.match(/#[0-4][0-4][0-4]/i))) {
      category = 'steel'
    }

    return {
      colors,
      texture,
      shape,
      category
    }
  }

  /**
   * Extract dominant colors from image
   */
  private static async extractColors(imageData: string): Promise<string[]> {
    // Mock implementation
    // In production: use color-thief or similar library
    
    // Simulate color extraction based on common materials
    const mockColors: Record<string, string[]> = {
      cement: ['#808080', '#A0A0A0', '#909090'],
      brick: ['#B22222', '#CD5C5C', '#8B4513'],
      stone: ['#696969', '#808080', '#A9A9A9', '#D3D3D3'],
      sand: ['#F4A460', '#DEB887', '#D2B48C'],
      steel: ['#2F4F4F', '#36454F', '#4B4B4B']
    }

    // For demo, return cement colors
    return mockColors.cement
  }

  /**
   * Detect texture type
   */
  private static detectTexture(imageData: string): string {
    // Mock implementation
    // In production: analyze pixel patterns
    
    const textures = ['smooth', 'rough', 'grainy', 'patterned', 'metallic']
    return textures[Math.floor(Math.random() * textures.length)]
  }

  /**
   * Detect shape
   */
  private static detectShape(imageData: string): string {
    // Mock implementation
    // In production: use edge detection and shape recognition
    
    const shapes = ['rectangular', 'cylindrical', 'irregular', 'powder', 'bar']
    return shapes[Math.floor(Math.random() * shapes.length)]
  }

  /**
   * Identify material type from features
   */
  private static identifyMaterialType(features: MaterialFeatures): string {
    const { category, texture, shape } = features

    // Rule-based classification
    if (category === 'cement') {
      if (shape === 'powder' || texture === 'grainy') {
        return 'Xi măng (Cement)'
      }
    }

    if (category === 'brick') {
      if (shape === 'rectangular') {
        return 'Gạch (Bricks)'
      }
    }

    if (category === 'stone') {
      if (texture === 'rough' || shape === 'irregular') {
        return 'Đá (Stone)'
      }
    }

    if (category === 'sand') {
      if (texture === 'grainy' || shape === 'powder') {
        return 'Cát (Sand)'
      }
    }

    if (category === 'steel') {
      if (shape === 'bar' || shape === 'cylindrical') {
        return 'Thép (Steel)'
      }
    }

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
      // Extract category keywords
      const keywords = materialType.toLowerCase()
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
        take: 10
      })

      // Score and sort by relevance
      const scoredProducts = products.map(product => {
        let score = 0.5 // Base score

        // Boost popular products
        const orderItemCount = product.orderItems?.length || 0
        if (orderItemCount > 10) score += 0.2
        if (orderItemCount > 50) score += 0.1

        // Boost if in stock
        if (product.inventoryItem && product.inventoryItem.availableQuantity > 0) {
          score += 0.2
        }

        return {
          ...product,
          matchScore: score,
          inStock: product.inventoryItem 
            ? product.inventoryItem.availableQuantity > 0 
            : false
        }
      })

      return scoredProducts
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5)
    } catch (error) {
      console.error('Error finding matching products:', error)
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
      confidence += 0.2
    }

    // Boost if we found matching products
    if (matchedProducts.length > 0) {
      confidence += 0.1
    }

    if (matchedProducts.length > 3) {
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
      suggestions.push(`Tìm thấy ${matchedProducts.length} sản phẩm ${materialType}`)
      
      if (materialType.includes('Xi măng')) {
        suggestions.push('Lưu ý: Kiểm tra loại PC30/PC40/PCB40 phù hợp với công trình')
        suggestions.push('Xi măng có hạn sử dụng 3 tháng từ ngày sản xuất')
      } else if (materialType.includes('Gạch')) {
        suggestions.push('Lưu ý: Chọn kích thước gạch phù hợp với thiết kế')
        suggestions.push('Nên mua dư 5-10% để dự phòng hư hỏng')
      } else if (materialType.includes('Đá')) {
        suggestions.push('Lưu ý: Kích thước đá phụ thuộc vào mục đích sử dụng')
        suggestions.push('Đá 1x2 cho bê tông, Đá 4x6 cho móng')
      }

      suggestions.push('Nhấn vào sản phẩm để xem chi tiết và đặt hàng')
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
   * Used when user types material name instead of uploading image
   */
  static async identifyFromText(query: string): Promise<RecognitionResult> {
    const lowerQuery = query.toLowerCase()

    // Determine material type from text
    let materialType = 'Vật liệu xây dựng'
    const features: MaterialFeatures = {
      colors: [],
      texture: 'unknown',
      shape: 'unknown',
      category: 'unknown'
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
