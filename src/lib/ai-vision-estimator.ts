/**
 * AI Vision Estimator Service
 * Analyzes floor plan images and calculates material requirements
 * Uses Gemini Vision (multimodal) for image understanding
 * Standards based on TCVN and latest Circulars (Thông tư 12/2021/TT-BXD, 09/2024/TT-BXD, 01/2025/TT-BXD)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

// Initialize Gemini client
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null

// TCVN Construction material standards (Vietnamese market)
// Based on Norm 1776/BXD & Typical Market Yields
const CONSTRUCTION_STANDARDS = {
    // Basic Materials per m2 of Floor Area (Simplified for general estimation)
    nhà_cấp_4: {
        bricks: 75,      // gạch ống 8x8x18 per m2 floor (includes walls)
        cement: 75,      // kg per m2 floor (foundation + walls + plaster)
        sand: 0.15,      // m3 per m2 floor
        stone_1x2: 0.08, // m3 per m2 floor
        steel: 25,       // kg per m2 floor (simple foundation)
    },
    nhà_phố: {
        bricks: 85,      // More walls/compartments
        cement: 90,      // More structural concrete
        sand: 0.18,
        stone_1x2: 0.12,
        steel: 55,       // Frame structure (cột, dầm, sàn)
    },
    biệt_thự: {
        bricks: 100,
        cement: 120,
        sand: 0.22,
        stone_1x2: 0.18,
        steel: 85,       // Heavy structure & details
    },
    // Working items
    painting: {
        primer_m2_per_liter: 10,
        paint_m2_per_liter: 8, // 2 coats
        wastage: 1.1,
    },
    flooring: {
        cement_leveling_kg_m2: 15, // 3-5cm thickness
        sand_leveling_m3_m2: 0.03,
        tile_wastage: 1.08,
        grout_kg_m2: 0.5,
    }
}

export interface RoomDimension {
    name: string
    length: number
    width: number
    height?: number
    area: number
}

export interface MaterialEstimate {
    productName: string
    productId?: string
    quantity: number
    unit: string
    reason: string
    price?: number
}

export interface EstimatorResult {
    success: boolean
    projectType: string
    buildingStyle?: 'nhà_cấp_4' | 'nhà_phố' | 'biệt_thự'
    rooms: RoomDimension[]
    totalArea: number
    materials: MaterialEstimate[]
    totalEstimatedCost: number
    confidence: number
    validationStatus: 'verified' | 'outlier' | 'warning'
    validationMessage?: string
    rawAnalysis?: string
    error?: string
}

// Retry helper
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        try { return await fn() } catch (e) { if (i === maxRetries - 1) throw e; await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i))) }
    }
    throw new Error('Retry failed')
}

/**
 * Analyze floor plan image using Gemini Vision
 */
export async function analyzeFloorPlanImage(
    base64Image: string,
    projectType: 'general' | 'flooring' | 'painting' | 'tiling' = 'general'
): Promise<EstimatorResult> {
    if (!genAI) return {
        success: false,
        projectType,
        rooms: [],
        totalArea: 0,
        materials: [],
        totalEstimatedCost: 0,
        confidence: 0,
        validationStatus: 'warning',
        error: 'AI service not configured.'
    }

    try {
        const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '')
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

        const prompt = `
You are a professional Vietnamese construction surveyor. Analyze this image and:
1. Identify all visible rooms and dimensions.
2. IMPORTANT: Find a scale reference (e.g., a door marked 900, a dimension line like 4000, or a scale bar). Use this to calibrate all measurements.
3. Determine the building style: "nhà_cấp_4", "nhà_phố", or "biệt_thự".
4. Estimate "Tổng chiều dài tường bao và tường ngăn" (Visible Wall Perimeter) in meters.
5. Identify the roof type (bê_tông, mái_thái, mái_tôn).

Return ONLY JSON:
{
  "buildingStyle": "nhà_cấp_4" | "nhà_phố" | "biệt_thự",
  "roofType": "bê_tông" | "mái_thái" | "mái_tôn",
  "rooms": [{ "name": "string", "length": float, "width": float }],
  "totalArea": float,
  "wallPerimeter": float, 
  "confidence": float,
  "notes": "string"
}
`
        const result = (await withRetry(() => model.generateContent([
            prompt,
            { inlineData: { mimeType: 'image/jpeg', data: imageData } }
        ]))) as any
        const responseText = result.response.text()
        const cleanedText = responseText.replace(/```json|```/g, '').trim()
        const data = JSON.parse(cleanedText)

        const rooms: RoomDimension[] = data.rooms.map((r: any) => ({ ...r, area: r.length * r.width, height: 3.2 }))
        const totalArea = data.totalArea || rooms.reduce((sum, r) => sum + r.area, 0)

        const materials = await calculateMaterials(
            totalArea,
            projectType,
            data.rooms || [],
            data.buildingStyle || 'nhà_cấp_4',
            data.wallPerimeter || (totalArea * 0.8), // Fallback: wall perimeter usually ~0.8x floor area
            data.roofType || 'bê_tông'
        )
        const enriched = await enrichMaterialsWithProducts(materials)
        const cost = enriched.reduce((sum, m) => sum + (m.price || 0) * m.quantity, 0)

        // Self-Verification Logic
        const validation = validateAgainstIndustryStandards(totalArea, enriched)

        return {
            success: true,
            projectType,
            buildingStyle: data.buildingStyle,
            rooms: data.rooms || [],
            totalArea: totalArea,
            materials: enriched,
            totalEstimatedCost: cost,
            confidence: data.confidence || 0.8,
            validationStatus: validation.status,
            validationMessage: validation.message,
            rawAnalysis: `${data.notes || ''} | Roof: ${data.roofType || 'Unknown'}`
        }
    } catch (error: any) {
        console.error('Estimator error:', error)
        return {
            success: false,
            projectType,
            rooms: [],
            totalArea: 0,
            materials: [],
            totalEstimatedCost: 0,
            confidence: 0,
            validationStatus: 'warning',
            error: error.message
        }
    }
}

/**
 * Self-Verification Logic: Checks if AI output is 'Sane' compared to historical averages
 * This allows non-experts to know if the AI is 'hallucinating' or being accurate.
 */
function validateAgainstIndustryStandards(area: number, materials: MaterialEstimate[]) {
    if (area <= 0) return { status: 'warning' as const, message: 'Diện tích không hợp lệ.' }

    // Cement check: Should be ~0.8 to 2.5 bags/m2
    const cement = materials.find(m => m.productName.includes('Xi măng'))
    if (cement) {
        const ratio = cement.quantity / area
        if (ratio < 0.5 || ratio > 3.5) {
            return {
                status: 'outlier' as const,
                message: 'Khối lượng Xi măng bất thường so với diện tích. Vui lòng kiểm tra lại ảnh hoặc đơn vị đo.'
            }
        }
    }

    // Steel check: Very basic check for outliers
    const steel = materials.find(m => m.productName.includes('Sắt thép'))
    if (steel && steel.quantity > (area * 0.15)) { // Over 150kg/m2 is villa-heavy or error
        return {
            status: 'outlier' as const,
            message: 'Khối lượng Sắt thép vượt quá định mức thông thường. Cần chuyên gia kiểm tra.'
        }
    }

    if (area > 1000) return { status: 'warning' as const, message: 'Công trình diện tích lớn, kết cấu có thể phức tạp hơn ước tính sơ bộ.' }

    return {
        status: 'verified' as const,
        message: 'Kết quả bóc tách phù hợp với định mức xây dựng dân dụng (TCVN).'
    }
}

async function calculateMaterials(
    area: number,
    type: string,
    rooms: RoomDimension[],
    style: 'nhà_cấp_4' | 'nhà_phố' | 'biệt_thự',
    wallPerimeter: number,
    roofType: string
): Promise<MaterialEstimate[]> {
    const materials: MaterialEstimate[] = []
    const std = CONSTRUCTION_STANDARDS[style] || CONSTRUCTION_STANDARDS.nhà_cấp_4

    // Apply Structural Multipliers
    const foundationFactor = style === 'nhà_phố' ? 1.5 : (style === 'biệt_thự' ? 1.8 : 1.3)
    const roofMultiplier = roofType === 'mái_thái' ? 1.4 : 1.1

    if (type === 'general') {
        // Bricks: Average 100 bricks/m2 of wall area (blending wall 10 and 20)
        const wallArea = wallPerimeter * 3.5 // 3.2m height + parapet/foundation wall
        const brickCount = Math.ceil(wallArea * 100 * 1.05)
        materials.push({
            productName: 'Gạch ống 8×8×18cm',
            quantity: brickCount,
            unit: 'viên',
            reason: `Dựa trên ước tính ~${wallPerimeter.toFixed(1)}m chu vi tường theo TT 01/2025`
        })

        // Cement: Industry avg in VN
        // Grade 1 (Simple): ~4 bags/m2
        // Grade 2 (Multi-story/Frame): ~5.5 to 6 bags/m2
        const cementRate = style === 'nhà_cấp_4' ? 4.0 : 5.8
        const cementBags = Math.ceil(area * cementRate * (style === 'biệt_thự' ? 1.2 : 1))
        materials.push({
            productName: 'Xi măng (bao 50kg)',
            quantity: cementBags,
            unit: 'bao',
            reason: `Định mức ~${cementRate} bao/m² cho dòng ${style.replace('_', ' ')} (Móng + Khung + Xây trát)`
        })

        // Steel: Highly dependent on foundation & height
        const steelTons = Number(((area * std.steel * foundationFactor) / 1000).toFixed(2))
        materials.push({
            productName: 'Sắt thép xây dựng (tổng hợp)',
            quantity: steelTons,
            unit: 'tấn',
            reason: `Hệ số móng ${foundationFactor}x diện tích sàn theo chuẩn đo bóc 01/2025`
        })
        // Sand
        materials.push({
            productName: 'Cát xây dựng',
            quantity: Number((area * std.sand).toFixed(1)),
            unit: 'm³',
            reason: `Tỷ lệ ~${std.sand}m³/m² diện tích xây dựng`
        })
        // Stone
        materials.push({
            productName: 'Đá 1×2 xây dựng',
            quantity: Number((area * std.stone_1x2).toFixed(1)),
            unit: 'm³',
            reason: `Khối lượng bê tông dự kiến ${std.stone_1x2}m³/m²`
        })
    } else if (type === 'flooring') {
        const floorStd = CONSTRUCTION_STANDARDS.flooring
        materials.push({
            productName: 'Gạch lát nền 60×60cm',
            quantity: Math.ceil((area / 0.36) * floorStd.tile_wastage),
            unit: 'viên',
            reason: `Diện tích ${area.toFixed(1)}m² + 8% hao hụt thi công`
        })
        materials.push({
            productName: 'Xi măng (bao 50kg)',
            quantity: Math.ceil((area * floorStd.cement_leveling_kg_m2) / 50),
            unit: 'bao',
            reason: `Lớp vữa lót nền dày 3-5cm (${floorStd.cement_leveling_kg_m2}kg/m²)`
        })
    }
    // ... Additional specific types (painting, tiling) can be added similarly

    return materials
}

async function enrichMaterialsWithProducts(materials: MaterialEstimate[]): Promise<MaterialEstimate[]> {
    const enriched: MaterialEstimate[] = []
    for (const m of materials) {
        const searchTerms = m.productName.split(' ')[0]
        const product = await prisma.product.findFirst({
            where: { name: { contains: searchTerms, mode: 'insensitive' }, isActive: true },
            orderBy: { price: 'asc' }
        })
        if (product) {
            enriched.push({ ...m, productId: product.id, productName: product.name, price: product.price, unit: product.unit })
        } else {
            enriched.push(m)
        }
    }
    return enriched
}

export async function estimateFromText(description: string, projectType: any = 'general'): Promise<EstimatorResult> {
    // Simplified version for demo, similar logic to image but using text prompt
    // In real app, this would use a text-only Gemini model
    return {
        success: false,
        projectType,
        rooms: [],
        totalArea: 0,
        materials: [],
        totalEstimatedCost: 0,
        confidence: 0,
        validationStatus: 'warning',
        error: 'Not implemented'
    }
}
