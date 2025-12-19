import { AIService } from './ai-service'

/**
 * Material Calculator Service for Chatbot Integration
 * Simplified calculator that can be called from chatbot
 */

export interface QuickCalculationInput {
  projectType?: 'HOUSE' | 'VILLA' | 'WAREHOUSE' | 'TILING' | 'WALLING' | 'CUSTOM'
  area?: number
  floors?: number
  length?: number
  width?: number
  wallType?: 'BRICK' | 'CONCRETE'
  soilType?: 'WEAK' | 'NORMAL' | 'HARD'
  constructionStyle?: 'MODERN' | 'CLASSIC' | 'OPEN'
  customQuery?: string // For AI parsing
}

export interface MaterialEstimate {
  material: string
  quantity: number
  unit: string
  estimatedCost?: number
  category: string
}

export interface QuickCalculationResult {
  materials: MaterialEstimate[]
  totalEstimatedCost: number
  summary: string
  tips: string[]
}

export class MaterialCalculatorService {
  /**
   * Quick calculation for chatbot
   * Simplified version that works with natural language
   */
  static async quickCalculate(input: QuickCalculationInput): Promise<QuickCalculationResult> {
    const {
      projectType,
      area,
      floors = 1,
      length,
      width,
      wallType = 'BRICK',
      soilType = 'NORMAL',
      constructionStyle = 'MODERN'
    } = input

    // Calculate actual area if dimensions provided
    let totalArea = area || 0
    if (length && width) {
      totalArea = length * width
    }

    if (!totalArea || totalArea <= 0) {
      throw new Error('Cần thông tin diện tích hoặc kích thước')
    }

    const materials: MaterialEstimate[] = []
    let totalCost = 0

    // Handle specific small projects
    if (projectType === 'TILING') {
      // Calculation for tiling (gạch lát)
      // 1m2 takes 1.1m2 of tiles, 0.2 bags of cement, 0.05m3 of sand
      const tileQuantity = Math.ceil(totalArea * 1.05) // +5% wastage
      materials.push({
        material: 'Gạch lát (60x60)',
        quantity: tileQuantity,
        unit: 'm²',
        estimatedCost: tileQuantity * 250000,
        category: 'Lát nền'
      })
      totalCost += tileQuantity * 250000

      const cementQuantity = Math.ceil(totalArea * 0.2)
      materials.push({
        material: 'Xi măng dán gạch',
        quantity: cementQuantity,
        unit: 'bao',
        estimatedCost: cementQuantity * 150000,
        category: 'Lát nền'
      })
      totalCost += cementQuantity * 150000

      const sandQuantity = Math.ceil(totalArea * 0.02 * 10) / 10
      materials.push({
        material: 'Cát xây dựng (Lót)',
        quantity: sandQuantity,
        unit: 'm³',
        estimatedCost: sandQuantity * 300000,
        category: 'Lát nền'
      })
      totalCost += sandQuantity * 300000

      return {
        materials,
        totalEstimatedCost: totalCost,
        summary: `Dự án lát nền/sân diện tích ${totalArea}m²`,
        tips: [
          'Chọn gạch chống trơn trượt cho sân vườn',
          'Nên mua thêm 5% gạch để dự phòng vỡ khi thi công',
          'Sử dụng keo dán gạch để có độ bền tốt nhất'
        ]
      }
    }

    if (projectType === 'WALLING') {
      // Calculation for just walls (e.g., fence)
      // Assume wall height is 2.5m if not specified
      const h = 2.5
      const bricksPerM2 = 65
      const totalWallArea = totalArea * h // Here totalArea is used as length if only one number provided? 
      // Actually if user says "30m2 wall", we use 30 as area.

      const bricksNeeded = Math.ceil(totalArea * bricksPerM2)
      materials.push({
        material: 'Gạch ống 8x8x18',
        quantity: bricksNeeded,
        unit: 'viên',
        estimatedCost: bricksNeeded * 1500,
        category: 'Xây tường'
      })
      totalCost += bricksNeeded * 1500

      const cementNeeded = Math.ceil(totalArea * 0.15)
      materials.push({
        material: 'Xi măng PC30',
        quantity: cementNeeded,
        unit: 'bao',
        estimatedCost: cementNeeded * 105000,
        category: 'Xây tường'
      })
      totalCost += cementNeeded * 105000

      const sandNeeded = Math.ceil(totalArea * 0.05 * 10) / 10
      materials.push({
        material: 'Cát xây tô',
        quantity: sandNeeded,
        unit: 'm³',
        estimatedCost: sandNeeded * 320000,
        category: 'Xây tường'
      })
      totalCost += sandNeeded * 320000

      return {
        materials,
        totalEstimatedCost: totalCost,
        summary: `Dự án xây tường diện tích ${totalArea}m²`,
        tips: [
          'Xây tường rào cần có giằng bê tông để đảm bảo chịu lực',
          'Nên tưới nước ẩm gạch trước khi xây để vữa kết dính tốt'
        ]
      }
    }

    // ===== FULL HOUSE CALCULATIONS (Default) =====
    // ===== FOUNDATION CALCULATIONS =====
    let foundationMultiplier = 1.0
    if (soilType === 'WEAK') foundationMultiplier = 1.2 // +20% for weak soil
    if (soilType === 'HARD') foundationMultiplier = 0.9 // -10% for hard soil

    const foundationVolume = totalArea * 0.4 * foundationMultiplier // 40cm depth average * multiplier
    const foundationConcrete = foundationVolume

    // Cement for foundation (8 bags per m³)
    const foundationCement = Math.ceil(foundationConcrete * 8)
    materials.push({
      material: 'Xi măng PC40 (Móng)',
      quantity: foundationCement,
      unit: 'bao',
      estimatedCost: foundationCement * 120000,
      category: 'Móng'
    })
    totalCost += foundationCement * 120000

    // Stone for foundation (0.8m³ per 1m³ concrete)
    const foundationStone = foundationConcrete * 0.8
    materials.push({
      material: 'Đá 4x6 (Móng)',
      quantity: Math.ceil(foundationStone * 10) / 10, // Round to 1 decimal
      unit: 'm³',
      estimatedCost: Math.ceil(foundationStone * 350000),
      category: 'Móng'
    })
    totalCost += Math.ceil(foundationStone * 350000)

    // Sand for foundation
    const foundationSand = foundationConcrete * 0.4
    materials.push({
      material: 'Cát xây dựng (Móng)',
      quantity: Math.ceil(foundationSand * 10) / 10,
      unit: 'm³',
      estimatedCost: Math.ceil(foundationSand * 300000),
      category: 'Móng'
    })
    totalCost += Math.ceil(foundationSand * 300000)

    // Steel for foundation (50kg per m³)
    const foundationSteel = Math.ceil(foundationConcrete * 50)
    materials.push({
      material: 'Thép D16 (Móng)',
      quantity: foundationSteel,
      unit: 'kg',
      estimatedCost: foundationSteel * 18000,
      category: 'Móng'
    })
    totalCost += foundationSteel * 18000

    // ===== WALLS CALCULATIONS =====
    // Assume 3m height per floor
    const wallHeight = 3 * floors
    const wallPerimeter = length && width ? 2 * (length + width) : Math.sqrt(totalArea) * 4
    const wallArea = wallPerimeter * wallHeight

    if (wallType === 'BRICK') {
      // Brick walls (60 bricks per m²)
      let brickMultiplier = 1.0
      if (constructionStyle === 'OPEN') brickMultiplier = 0.7 // -30% for open style (more glass)
      if (constructionStyle === 'CLASSIC') brickMultiplier = 1.1 // +10% for classic (more partitions)

      const bricksNeeded = Math.ceil(wallArea * 60 * brickMultiplier)
      materials.push({
        material: 'Gạch đỏ 6x10x20',
        quantity: bricksNeeded,
        unit: 'viên',
        estimatedCost: bricksNeeded * 2200,
        category: 'Tường'
      })
      totalCost += bricksNeeded * 2200

      // Cement for mortar (0.02m³ per m²)
      const mortarCement = Math.ceil(wallArea * 0.02 * 8) // 8 bags per m³
      materials.push({
        material: 'Xi măng PC30 (Vữa)',
        quantity: mortarCement,
        unit: 'bao',
        estimatedCost: mortarCement * 105000,
        category: 'Tường'
      })
      totalCost += mortarCement * 105000

      // Sand for mortar
      const mortarSand = Math.ceil(wallArea * 0.04 * 10) / 10
      materials.push({
        material: 'Cát vàng (Vữa)',
        quantity: mortarSand,
        unit: 'm³',
        estimatedCost: Math.ceil(mortarSand * 280000),
        category: 'Tường'
      })
      totalCost += Math.ceil(mortarSand * 280000)
    } else {
      // Concrete walls
      const concreteVolume = wallArea * 0.15 // 15cm thick
      const concreteCement = Math.ceil(concreteVolume * 9) // 9 bags per m³ for walls

      materials.push({
        material: 'Xi măng PCB40 (Tường bê tông)',
        quantity: concreteCement,
        unit: 'bao',
        estimatedCost: concreteCement * 135000,
        category: 'Tường'
      })
      totalCost += concreteCement * 135000
    }

    // ===== FLOOR/SLAB CALCULATIONS =====
    const slabArea = totalArea * floors
    const slabVolume = slabArea * 0.12 // 12cm thick slab

    const slabCement = Math.ceil(slabVolume * 8)
    materials.push({
      material: 'Xi măng PC40 (Sàn)',
      quantity: slabCement,
      unit: 'bao',
      estimatedCost: slabCement * 120000,
      category: 'Sàn'
    })
    totalCost += slabCement * 120000

    const slabStone = Math.ceil(slabVolume * 0.8 * 10) / 10
    materials.push({
      material: 'Đá 1x2 (Sàn)',
      quantity: slabStone,
      unit: 'm³',
      estimatedCost: Math.ceil(slabStone * 320000),
      category: 'Sàn'
    })
    totalCost += Math.ceil(slabStone * 320000)

    const slabSand = Math.ceil(slabVolume * 0.4 * 10) / 10
    materials.push({
      material: 'Cát rửa (Sàn)',
      quantity: slabSand,
      unit: 'm³',
      estimatedCost: Math.ceil(slabSand * 300000),
      category: 'Sàn'
    })
    totalCost += Math.ceil(slabSand * 300000)

    // ===== SUMMARY =====
    const projectDesc = projectType === 'HOUSE' ? 'Nhà phố' :
      projectType === 'VILLA' ? 'Biệt thự' :
        projectType === 'WAREHOUSE' ? 'Nhà xưởng' : 'Công trình'

    const summary = `${projectDesc} ${totalArea}m² x ${floors} tầng\n` +
      `Tổng chi phí vật liệu dự kiến: ${this.formatCurrency(totalCost)}`

    const tips = [
      `Mua thêm 5-10% vật liệu để dự phòng hư hỏng`,
      `Xi măng PC40 cho móng và sàn, PC30 cho vữa xây`,
      `Thời gian thi công dự kiến: ${this.estimateDuration(totalArea, floors)}`,
      `Nên chia làm nhiều đợt mua để kiểm soát chất lượng`,
    ]

    if (totalArea > 200) {
      tips.push(`Diện tích lớn - nên có kế hoạch vận chuyển và lưu trữ chi tiết`)
    }

    if (soilType === 'WEAK') {
      tips.push(`Đất yếu: Đã tăng 20% vật liệu móng. Nên gia cố thêm cừ tràm hoặc cọc bê tông.`)
    }

    if (soilType === 'HARD') {
      tips.push(`Đất cứng: Đã giảm 10% vật liệu móng.`)
    }

    if (constructionStyle === 'OPEN') {
      tips.push(`Phong cách mở: Đã giảm 30% gạch xây. Hãy cân nhắc chi phí kính cường lực.`)
    }

    return {
      materials,
      totalEstimatedCost: totalCost,
      summary,
      tips
    }
  }

  /**
   * Parse natural language query to calculation input
   */
  static parseQuery(query: string): QuickCalculationInput | null {
    const lowerQuery = query.toLowerCase()

    const input: QuickCalculationInput = {
      customQuery: query
    }

    // Detect project type
    if (lowerQuery.includes('nhà phố') || lowerQuery.includes('nha pho')) {
      input.projectType = 'HOUSE'
    } else if (lowerQuery.includes('biệt thự') || lowerQuery.includes('biet thu')) {
      input.projectType = 'VILLA'
    } else if (lowerQuery.includes('nhà xưởng') || lowerQuery.includes('nha xuong')) {
      input.projectType = 'WAREHOUSE'
    }

    // Extract numbers
    const areaMatch = lowerQuery.match(/(\d+)\s*m[²2]/)
    if (areaMatch) {
      input.area = parseInt(areaMatch[1])
    }

    const floorsMatch = lowerQuery.match(/(\d+)\s*(tầng|tang|floor)/)
    if (floorsMatch) {
      input.floors = parseInt(floorsMatch[1])
    }

    // Extract dimensions (e.g., "10x15m", "10m x 15m")
    const dimensionMatch = lowerQuery.match(/(\d+)\s*x\s*(\d+)\s*m/)
    if (dimensionMatch) {
      input.length = parseInt(dimensionMatch[1])
      input.width = parseInt(dimensionMatch[2])
    }

    // Wall type
    if (lowerQuery.includes('gạch') || lowerQuery.includes('brick')) {
      input.wallType = 'BRICK'
    } else if (lowerQuery.includes('bê tông') || lowerQuery.includes('be tong') || lowerQuery.includes('concrete')) {
      input.wallType = 'CONCRETE'
    }

    // Must have at least area or dimensions
    if (!input.area && !input.length && !input.width) {
      return null
    }

    return input
  }

  /**
   * Parse query using AI for better understanding
   */
  static async parseQueryWithAI(query: string): Promise<QuickCalculationInput | null> {
    // First try basic regex parsing for speed
    const basicParse = this.parseQuery(query)

    // If basic parsing found area, we might just use it, but AI is better for soil/style
    // So let's call AI to get the full picture
    const aiParams = await AIService.extractMaterialCalculationParams(query)

    if (!aiParams) return basicParse

    // Merge AI params with basic params (AI takes precedence for complex fields)
    const merged: QuickCalculationInput = {
      ...basicParse,
      ...aiParams,
      customQuery: query
    }

    // EXPLICIT OVERRIDE: Force TILING projectType for obvious tiling queries
    // AI sometimes misclassifies "lát sân vườn" as full house project
    const lowerQuery = query.toLowerCase()
    if (
      (lowerQuery.includes('lát sân') || lowerQuery.includes('sân vườn') ||
        lowerQuery.includes('lát gạch') || lowerQuery.includes('lát nền') ||
        lowerQuery.includes('ốp gạch') || lowerQuery.includes('ốp tường')) &&
      !lowerQuery.includes('xây nhà') && !lowerQuery.includes('xây dựng nhà')
    ) {
      console.log('[MATERIAL_CALC] Overriding projectType to TILING for tiling query')
      merged.projectType = 'TILING'
    }

    // Ensure we have at least area or dimensions
    if (!merged.area && (!merged.length || !merged.width)) {
      return null
    }

    return merged
  }

  /**
   * Format result for chatbot display
   */
  static formatForChat(result: QuickCalculationResult): string {
    let response = `📊 **KẾT QUẢ TÍNH TOÁN VẬT LIỆU**\n\n`
    response += `${result.summary}\n\n`
    response += `📦 **DANH SÁCH VẬT LIỆU:**\n\n`

    // Group by category
    const byCategory: Record<string, MaterialEstimate[]> = {}
    result.materials.forEach(m => {
      if (!byCategory[m.category]) {
        byCategory[m.category] = []
      }
      byCategory[m.category].push(m)
    })

    // Display by category
    Object.entries(byCategory).forEach(([category, items]) => {
      response += `**${category}:**\n`
      items.forEach(item => {
        response += `  • ${item.material}: **${item.quantity} ${item.unit}**`
        if (item.estimatedCost) {
          response += ` (${this.formatCurrency(item.estimatedCost)})`
        }
        response += `\n`
      })
      response += `\n`
    })

    response += `💰 **TỔNG CHI PHÍ:** ${this.formatCurrency(result.totalEstimatedCost)}\n\n`
    response += `💡 **LƯU Ý:**\n`
    result.tips.forEach(tip => {
      response += `  • ${tip}\n`
    })

    return response
  }

  private static formatCurrency(amount: number): string {
    return amount.toLocaleString('vi-VN') + 'đ'
  }

  private static estimateDuration(area: number, floors: number): string {
    const baseMonths = Math.ceil((area * floors) / 50) // 50m² per month baseline
    return `${baseMonths}-${baseMonths + 2} tháng`
  }
}

export const materialCalculator = MaterialCalculatorService
