/**
 * Material Calculator Service for Chatbot Integration
 * Simplified calculator that can be called from chatbot
 */

export interface QuickCalculationInput {
  projectType?: 'HOUSE' | 'VILLA' | 'WAREHOUSE' | 'CUSTOM'
  area?: number
  floors?: number
  length?: number
  width?: number
  wallType?: 'BRICK' | 'CONCRETE'
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
    const { projectType, area, floors = 1, length, width, wallType = 'BRICK' } = input

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

    // ===== FOUNDATION CALCULATIONS =====
    const foundationVolume = totalArea * 0.4 // 40cm depth average
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
      const bricksNeeded = Math.ceil(wallArea * 60)
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
