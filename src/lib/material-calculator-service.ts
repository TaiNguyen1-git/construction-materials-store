import { AIService } from './ai-service'
import { prisma } from './prisma'

/**
 * Material Calculator Service for Chatbot Integration
 * Simplified calculator that can be called from chatbot
 */

// Price cache to avoid repeated DB queries within same calculation
interface PriceCache {
  [keyword: string]: { price: number; unit: string; productName: string } | null
}

// Mapping from material calculation names to database search keywords
const MATERIAL_KEYWORDS: Record<string, string[]> = {
  'Xi măng PC40': ['xi măng', 'PC40', 'INSEE', 'Hà Tiên'],
  'Xi măng PC30': ['xi măng', 'PC30'],
  'Xi măng trắng': ['xi măng trắng', 'xi măng'],
  'Đá 4x6': ['đá 4x6', 'đá xây dựng', 'đá'],
  'Đá 1x2': ['đá 1x2', 'đá', 'đá xây dựng'],
  'Cát xây dựng': ['cát xây', 'cát', 'cát vàng'],
  'Cát xây': ['cát xây', 'cát'],
  'Cát mịn': ['cát mịn', 'cát'],
  'Thép': ['thép', 'sắt'],
  'Gạch ống': ['gạch ống', 'gạch block', 'gạch'],
  'Gạch đinh': ['gạch đinh', 'gạch thẻ', 'gạch đỏ'],
  'Sơn nước': ['sơn', 'sơn nước'],
  'Tôn': ['tôn', 'tôn lạnh', 'tôn mạ kẽm'],
  'Xà gồ': ['xà gồ', 'thép hộp']
}

// Default prices as fallback (updated to 2024 market prices)
const DEFAULT_PRICES: Record<string, number> = {
  'Xi măng PC40': 95000,      // per bao
  'Xi măng PC30': 90000,      // per bao
  'Xi măng trắng': 95000,     // per bao
  'Đá 4x6': 350000,           // per m³
  'Đá 1x2': 350000,           // per m³
  'Cát xây dựng': 280000,     // per m³
  'Cát xây': 280000,          // per m³
  'Cát mịn': 300000,          // per m³
  'Thép D8': 16000,           // per kg
  'Thép D10': 16000,          // per kg
  'Thép D12': 16000,          // per kg
  'Thép D16': 16000,          // per kg
  'Gạch ống': 1200,           // per viên
  'Gạch đinh': 1500,          // per viên
  'Sơn nước': 850000,         // per thùng 18L
  'Tôn': 120000,              // per m²
  'Xà gồ': 25000              // per kg
}

/**
 * Look up product price from database
 */
async function getProductPrice(
  materialName: string,
  priceCache: PriceCache
): Promise<{ price: number; unit: string; productName: string }> {
  // Check cache first
  if (priceCache[materialName] !== undefined) {
    return priceCache[materialName] || {
      price: getDefaultPrice(materialName),
      unit: 'đơn vị',
      productName: materialName
    }
  }

  try {
    // Get search keywords for this material
    const keywords = MATERIAL_KEYWORDS[materialName] || [materialName.split(' ')[0]]

    // Search database
    for (const keyword of keywords) {
      const product = await prisma.product.findFirst({
        where: {
          name: { contains: keyword, mode: 'insensitive' },
          isActive: true
        },
        select: {
          name: true,
          price: true,
          unit: true
        },
        orderBy: { price: 'asc' } // Get cheapest option
      })

      if (product) {
        const result = {
          price: Number(product.price),
          unit: product.unit,
          productName: product.name
        }
        priceCache[materialName] = result
        return result
      }
    }

    // Not found in DB - use default
    priceCache[materialName] = null
    return {
      price: getDefaultPrice(materialName),
      unit: 'đơn vị',
      productName: materialName
    }
  } catch (error) {
    console.error(`[PRICE_LOOKUP] Error looking up ${materialName}:`, error)
    priceCache[materialName] = null
    return {
      price: getDefaultPrice(materialName),
      unit: 'đơn vị',
      productName: materialName
    }
  }
}

/**
 * Get default price for material (fallback)
 */
function getDefaultPrice(materialName: string): number {
  // Try exact match first
  if (DEFAULT_PRICES[materialName]) {
    return DEFAULT_PRICES[materialName]
  }

  // Try partial match
  for (const [key, price] of Object.entries(DEFAULT_PRICES)) {
    if (materialName.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(materialName.toLowerCase())) {
      return price
    }
  }

  // Generic fallback
  if (materialName.includes('xi măng')) return 95000
  if (materialName.includes('đá')) return 350000
  if (materialName.includes('cát')) return 280000
  if (materialName.includes('thép')) return 16000
  if (materialName.includes('gạch')) return 1200
  if (materialName.includes('sơn')) return 850000

  return 100000 // Ultimate fallback
}

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
    // Based on real construction estimates for Vietnam 2024
    // Reference: 3.2-4.0 triệu/m² phần thô

    const totalFloorArea = totalArea * floors // Tổng diện tích sàn

    // ===== 1. MÓNG (FOUNDATION) =====
    let foundationMultiplier = 1.0
    if (soilType === 'WEAK') foundationMultiplier = 1.3 // +30% for weak soil (cọc/gia cố)
    if (soilType === 'HARD') foundationMultiplier = 0.9 // -10% for hard soil

    // Móng băng: 0.5m³ BT/m² sàn tầng trệt
    const foundationConcreteVolume = totalArea * 0.5 * foundationMultiplier

    const foundationCement = Math.ceil(foundationConcreteVolume * 8)
    materials.push({
      material: 'Xi măng PC40 (Móng)',
      quantity: foundationCement,
      unit: 'bao',
      estimatedCost: foundationCement * 95000,
      category: 'Móng'
    })
    totalCost += foundationCement * 95000

    const foundationStone = Math.ceil(foundationConcreteVolume * 0.8 * 10) / 10
    materials.push({
      material: 'Đá 4x6 (Móng)',
      quantity: foundationStone,
      unit: 'm³',
      estimatedCost: Math.ceil(foundationStone * 350000),
      category: 'Móng'
    })
    totalCost += Math.ceil(foundationStone * 350000)

    const foundationSand = Math.ceil(foundationConcreteVolume * 0.5 * 10) / 10
    materials.push({
      material: 'Cát xây dựng (Móng)',
      quantity: foundationSand,
      unit: 'm³',
      estimatedCost: Math.ceil(foundationSand * 280000),
      category: 'Móng'
    })
    totalCost += Math.ceil(foundationSand * 280000)

    // Thép móng: 60 kg/m³ BT
    const foundationSteel = Math.ceil(foundationConcreteVolume * 60)
    materials.push({
      material: 'Thép D12-D16 (Móng)',
      quantity: foundationSteel,
      unit: 'kg',
      estimatedCost: foundationSteel * 16000,
      category: 'Móng'
    })
    totalCost += foundationSteel * 16000

    // ===== 2. CỘT + DẦM (COLUMNS + BEAMS) =====
    // 0.12 m³ BT/m² sàn cho cột + dầm
    const columnBeamVolume = totalFloorArea * 0.12

    const columnBeamCement = Math.ceil(columnBeamVolume * 9)
    materials.push({
      material: 'Xi măng PC40 (Cột, Dầm)',
      quantity: columnBeamCement,
      unit: 'bao',
      estimatedCost: columnBeamCement * 95000,
      category: 'Khung chịu lực'
    })
    totalCost += columnBeamCement * 95000

    const columnBeamStone = Math.ceil(columnBeamVolume * 0.85 * 10) / 10
    materials.push({
      material: 'Đá 1x2 (Cột, Dầm)',
      quantity: columnBeamStone,
      unit: 'm³',
      estimatedCost: Math.ceil(columnBeamStone * 350000),
      category: 'Khung chịu lực'
    })
    totalCost += Math.ceil(columnBeamStone * 350000)

    const columnBeamSand = Math.ceil(columnBeamVolume * 0.45 * 10) / 10
    materials.push({
      material: 'Cát xây dựng (Cột, Dầm)',
      quantity: columnBeamSand,
      unit: 'm³',
      estimatedCost: Math.ceil(columnBeamSand * 280000),
      category: 'Khung chịu lực'
    })
    totalCost += Math.ceil(columnBeamSand * 280000)

    // Thép cột dầm: 100 kg/m³ BT (nhiều thép hơn móng)
    const columnBeamSteel = Math.ceil(columnBeamVolume * 100)
    materials.push({
      material: 'Thép D10-D16 (Cột, Dầm)',
      quantity: columnBeamSteel,
      unit: 'kg',
      estimatedCost: columnBeamSteel * 16000,
      category: 'Khung chịu lực'
    })
    totalCost += columnBeamSteel * 16000

    // ===== 3. SÀN BTCT (SLABS) =====
    // Sàn dày 10-12cm = 0.11 m³/m²
    const slabVolume = totalFloorArea * 0.11

    const slabCement = Math.ceil(slabVolume * 8)
    materials.push({
      material: 'Xi măng PC40 (Sàn)',
      quantity: slabCement,
      unit: 'bao',
      estimatedCost: slabCement * 95000,
      category: 'Sàn BTCT'
    })
    totalCost += slabCement * 95000

    const slabStone = Math.ceil(slabVolume * 0.8 * 10) / 10
    materials.push({
      material: 'Đá 1x2 (Sàn)',
      quantity: slabStone,
      unit: 'm³',
      estimatedCost: Math.ceil(slabStone * 350000),
      category: 'Sàn BTCT'
    })
    totalCost += Math.ceil(slabStone * 350000)

    const slabSand = Math.ceil(slabVolume * 0.45 * 10) / 10
    materials.push({
      material: 'Cát xây dựng (Sàn)',
      quantity: slabSand,
      unit: 'm³',
      estimatedCost: Math.ceil(slabSand * 280000),
      category: 'Sàn BTCT'
    })
    totalCost += Math.ceil(slabSand * 280000)

    // Thép sàn: 25 kg/m² sàn
    const slabSteel = Math.ceil(totalFloorArea * 25)
    materials.push({
      material: 'Thép D8-D10 (Sàn)',
      quantity: slabSteel,
      unit: 'kg',
      estimatedCost: slabSteel * 16000,
      category: 'Sàn BTCT'
    })
    totalCost += slabSteel * 16000

    // ===== 4. TƯỜNG XÂY (WALLS) =====
    const wallHeight = 3.3 * floors // 3.3m mỗi tầng (3m thông thủy + sàn)
    const wallPerimeter = length && width ? 2 * (length + width) : Math.sqrt(totalArea) * 4
    // Tường ngoài + tường ngăn trong ~ 1.3x chu vi
    const totalWallLength = wallPerimeter * 1.3
    const wallArea = totalWallLength * wallHeight

    // Trừ 15% cho cửa đi, cửa sổ
    let effectiveWallArea = wallArea * 0.85
    if (constructionStyle === 'OPEN') effectiveWallArea = wallArea * 0.6 // Nhiều kính
    if (constructionStyle === 'CLASSIC') effectiveWallArea = wallArea * 0.9 // Ít cửa hơn

    if (wallType === 'BRICK') {
      // Gạch ống 8x8x18: 75 viên/m² (xây 20cm)
      const bricksNeeded = Math.ceil(effectiveWallArea * 75)
      materials.push({
        material: 'Gạch ống 8x8x18',
        quantity: bricksNeeded,
        unit: 'viên',
        estimatedCost: bricksNeeded * 1200,
        category: 'Tường xây'
      })
      totalCost += bricksNeeded * 1200

      // Vữa xây: 0.03 m³/m² tường
      const mortarVolume = effectiveWallArea * 0.03
      const mortarCement = Math.ceil(mortarVolume * 7)
      materials.push({
        material: 'Xi măng PC30 (Vữa xây)',
        quantity: mortarCement,
        unit: 'bao',
        estimatedCost: mortarCement * 90000,
        category: 'Tường xây'
      })
      totalCost += mortarCement * 90000

      const mortarSand = Math.ceil(mortarVolume * 10) / 10
      materials.push({
        material: 'Cát xây (Vữa xây)',
        quantity: mortarSand,
        unit: 'm³',
        estimatedCost: Math.ceil(mortarSand * 280000),
        category: 'Tường xây'
      })
      totalCost += Math.ceil(mortarSand * 280000)
    } else {
      // Tường bê tông 15cm
      const concreteWallVolume = effectiveWallArea * 0.15
      const concreteCement = Math.ceil(concreteWallVolume * 9)
      materials.push({
        material: 'Xi măng PC40 (Tường BT)',
        quantity: concreteCement,
        unit: 'bao',
        estimatedCost: concreteCement * 95000,
        category: 'Tường bê tông'
      })
      totalCost += concreteCement * 95000
    }

    // ===== 5. TRÁT + SƠN (PLASTERING) =====
    // Diện tích trát = 2 mặt tường
    const plasterArea = effectiveWallArea * 2

    // Vữa trát: 0.015 m³/m²
    const plasterVolume = plasterArea * 0.015
    const plasterCement = Math.ceil(plasterVolume * 6)
    materials.push({
      material: 'Xi măng trắng (Trát)',
      quantity: plasterCement,
      unit: 'bao',
      estimatedCost: plasterCement * 95000,
      category: 'Hoàn thiện'
    })
    totalCost += plasterCement * 95000

    const plasterSand = Math.ceil(plasterVolume * 10) / 10
    materials.push({
      material: 'Cát mịn (Trát)',
      quantity: plasterSand,
      unit: 'm³',
      estimatedCost: Math.ceil(plasterSand * 300000),
      category: 'Hoàn thiện'
    })
    totalCost += Math.ceil(plasterSand * 300000)

    // Sơn: 0.3 lít/m² x 2 lớp
    const paintLiters = Math.ceil(plasterArea * 0.6)
    const paintBuckets = Math.ceil(paintLiters / 18) // Thùng 18L
    materials.push({
      material: 'Sơn nước nội thất (18L)',
      quantity: paintBuckets,
      unit: 'thùng',
      estimatedCost: paintBuckets * 850000,
      category: 'Hoàn thiện'
    })
    totalCost += paintBuckets * 850000

    // ===== 6. CẦU THANG (STAIRS) - nếu > 1 tầng =====
    if (floors > 1) {
      // Cầu thang BTCT: 0.4 m³ BT/tầng
      const stairVolume = (floors - 1) * 0.4
      const stairCement = Math.ceil(stairVolume * 9)
      materials.push({
        material: 'Xi măng PC40 (Cầu thang)',
        quantity: stairCement,
        unit: 'bao',
        estimatedCost: stairCement * 95000,
        category: 'Cầu thang'
      })
      totalCost += stairCement * 95000

      const stairSteel = Math.ceil(stairVolume * 120)
      materials.push({
        material: 'Thép D10-D12 (Cầu thang)',
        quantity: stairSteel,
        unit: 'kg',
        estimatedCost: stairSteel * 16000,
        category: 'Cầu thang'
      })
      totalCost += stairSteel * 16000
    }

    // ===== 7. MÁI (ROOF) =====
    const roofArea = totalArea * 1.15 // +15% cho mái dốc
    materials.push({
      material: 'Tôn lạnh mạ kẽm (0.45mm)',
      quantity: Math.ceil(roofArea),
      unit: 'm²',
      estimatedCost: Math.ceil(roofArea * 120000),
      category: 'Mái'
    })
    totalCost += Math.ceil(roofArea * 120000)

    materials.push({
      material: 'Xà gồ thép hộp (40x80)',
      quantity: Math.ceil(roofArea * 0.8),
      unit: 'kg',
      estimatedCost: Math.ceil(roofArea * 0.8 * 25000),
      category: 'Mái'
    })
    totalCost += Math.ceil(roofArea * 0.8 * 25000)

    // ===== SUMMARY =====
    const projectDesc = projectType === 'HOUSE' ? 'Nhà phố' :
      projectType === 'VILLA' ? 'Biệt thự' :
        projectType === 'WAREHOUSE' ? 'Nhà xưởng' : 'Công trình'

    // Note: costPerM2 and summary are calculated AFTER DB price enrichment below

    const tips = [
      `Mua thêm 5-10% vật liệu để dự phòng hao hụt`,
      `Xi măng PC40 cho bê tông chịu lực, PC30 cho vữa xây`,
      `Thời gian thi công dự kiến: ${this.estimateDuration(totalArea, floors)}`,
      `Chưa bao gồm: Điện nước, cửa, gạch lát nền, thiết bị vệ sinh`,
    ]

    if (soilType === 'WEAK') {
      tips.push(`⚠️ Đất yếu: Đã tăng 30% vật liệu móng. Cân nhắc gia cố cọc/cừ tràm.`)
    }

    if (constructionStyle === 'OPEN') {
      tips.push(`💡 Phong cách mở: Đã giảm gạch xây. Cần tính thêm chi phí kính cường lực.`)
    }

    // ===== ENRICH PRICES FROM DATABASE =====
    const priceCache: PriceCache = {}
    let newTotalCost = 0

    for (const mat of materials) {
      // Extract base material name (remove location suffix like "Móng", "Sàn", etc.)
      const baseName = mat.material.split(' (')[0].trim()

      const dbPrice = await getProductPrice(baseName, priceCache)

      // Recalculate cost with DB price
      mat.estimatedCost = Math.ceil(mat.quantity * dbPrice.price)
      newTotalCost += mat.estimatedCost
    }

    // Update total cost and summary with DB prices
    const costPerM2 = Math.round(newTotalCost / totalFloorArea / 1000) * 1000
    const updatedSummary = `${projectDesc} ${totalArea}m² x ${floors} tầng (Tổng sàn: ${totalFloorArea}m²)\n` +
      `Chi phí vật liệu phần thô: ${this.formatCurrency(newTotalCost)} (~${this.formatCurrency(costPerM2)}/m² sàn)`

    // Add note about price source
    tips.unshift(`💰 Giá được cập nhật từ hệ thống cửa hàng`)

    return {
      materials,
      totalEstimatedCost: newTotalCost,
      summary: updatedSummary,
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
    let response = `📊 **KẾT QUẢ TÍNH TOÁN VẬT LIỆU XÂY DỰNG**\n\n`
    response += `${result.summary}\n\n`

    // Group by category
    const byCategory: Record<string, MaterialEstimate[]> = {}
    const categoryCosts: Record<string, number> = {}

    result.materials.forEach(m => {
      if (!byCategory[m.category]) {
        byCategory[m.category] = []
        categoryCosts[m.category] = 0
      }
      byCategory[m.category].push(m)
      categoryCosts[m.category] += m.estimatedCost || 0
    })

    // Category icons
    const categoryIcons: Record<string, string> = {
      'Móng': '🏗️',
      'Khung chịu lực': '🏛️',
      'Sàn BTCT': '🧱',
      'Tường xây': '🧱',
      'Tường bê tông': '🧱',
      'Hoàn thiện': '🎨',
      'Cầu thang': '🪜',
      'Mái': '🏠',
      'Lát nền': '🪨',
      'Xây tường': '🧱'
    }

    // Display each category as a section
    response += `━━━━━━━━━━━━━━━━━━━━━━\n`
    response += `📦 **DANH SÁCH VẬT LIỆU**\n`
    response += `━━━━━━━━━━━━━━━━━━━━━━\n\n`

    Object.entries(byCategory).forEach(([category, items]) => {
      const icon = categoryIcons[category] || '📦'
      const categoryCost = categoryCosts[category]

      response += `${icon} **${category.toUpperCase()}**\n`

      items.forEach(item => {
        const unitPrice = item.estimatedCost && item.quantity > 0
          ? Math.round(item.estimatedCost / item.quantity)
          : 0
        response += `   • ${item.material}\n`
        response += `     ${item.quantity} ${item.unit} × ${this.formatCurrency(unitPrice)} = **${this.formatCurrency(item.estimatedCost || 0)}**\n`
      })

      response += `   ➤ Tổng ${category}: **${this.formatCurrency(categoryCost)}**\n\n`
    })

    // Cost summary
    response += `━━━━━━━━━━━━━━━━━━━━━━\n`
    response += `💰 **TỔNG HỢP CHI PHÍ**\n`
    response += `━━━━━━━━━━━━━━━━━━━━━━\n\n`

    Object.entries(categoryCosts).forEach(([category, cost]) => {
      response += `• ${category}: ${this.formatCurrency(cost)}\n`
    })

    response += `\n🔸 **TỔNG VẬT LIỆU: ${this.formatCurrency(result.totalEstimatedCost)}**\n`

    // Add contingency note
    const contingency10 = Math.round(result.totalEstimatedCost * 0.1)
    const contingency15 = Math.round(result.totalEstimatedCost * 0.15)
    response += `🔸 Dự phòng (10-15%): ${this.formatCurrency(contingency10)} - ${this.formatCurrency(contingency15)}\n\n`

    // Tips section
    response += `━━━━━━━━━━━━━━━━━━━━━━\n`
    response += `🛠️ **LƯU Ý**\n`
    response += `━━━━━━━━━━━━━━━━━━━━━━\n\n`
    result.tips.forEach(tip => {
      response += `• ${tip}\n`
    })

    // What's NOT included
    response += `\n⚠️ **Chưa bao gồm:** Điện nước, cửa, gạch lát, thiết bị vệ sinh, nhân công\n\n`

    // CTA
    response += `📞 *Liên hệ để được báo giá chi tiết!*`

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
