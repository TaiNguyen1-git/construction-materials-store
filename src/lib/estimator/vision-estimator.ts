"use server";

/**
 * Vision Estimator — AI layer
 * Analyzes floor plan images and text descriptions using Gemini Vision.
 * Delegates calculation to material-calculator.ts and DB lookup to product-enricher.ts.
 */

import { GoogleGenerativeAI, Part } from '@google/generative-ai'
import { EstimatorAIResponseSchema } from '@/lib/validation'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import crypto from 'crypto'
import {
    EstimatorResult,
    RoomDimension,
    withRetry,
    errorResult,
    MaterialEstimate,
} from './estimator-types'
import { calculateMaterials, validateAgainstIndustryStandards } from './material-calculator'
import { enrichMaterialsWithProducts } from './product-enricher'
import { convertSymbolsToMaterials } from './symbol-converter'

// Gemini client — initialized once
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null

const MODEL_FALLBACKS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
    'gemini-2-flash',
    'gemini-2-flash-lite',
    'gemini-1.5-flash'
]

/** Call Gemini with a fallback chain and retry logic */
async function callGemini(prompt: string, imageParts?: Part[]): Promise<string> {
    if (!genAI) throw new Error('AI service not configured.')
    let lastError: Error | null = null

    for (const modelName of MODEL_FALLBACKS) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName })
            const parts: (string | Part)[] = imageParts ? [prompt, ...imageParts] : [prompt]
            const result = await withRetry(() => model.generateContent(parts))
            const text = result.response.text()
            if (text) return text
        } catch (err) {
            console.error(`[VisionEstimator] Model ${modelName} failed:`, err)
            lastError = err instanceof Error ? err : new Error(String(err))
        }
    }

    throw lastError || new Error('All Gemini models failed')
}

/** Extract JSON from a Gemini response string */
function parseGeminiEstimatorJSON(responseText: string) {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('AI response was not in a valid JSON format.')
    return JSON.parse(jsonMatch[0])
}

/**
 * Analyze floor plan image(s) using Gemini Vision.
 * Returns a full EstimatorResult with materials and cost.
 */
export async function analyzeFloorPlanImage(
    base64Images: string | string[],
    projectType: 'general' | 'flooring' | 'painting' | 'tiling' = 'general',
    budgetTier: 'economy' | 'standard' | 'premium' = 'standard',
    fileName?: string
): Promise<EstimatorResult> {
    if (!genAI) return errorResult(projectType, 'AI service not configured.')

    try {
        const images = Array.isArray(base64Images) ? base64Images : [base64Images]
        
        // ── STEP 1: CALCULATE HASH FOR DETERMINISM ──
        const combinedBase64 = images.join('|')
        const promptVersion = "v6_filename_meta_multi_floor"
        const inputHash = crypto.createHash('sha256').update(combinedBase64 + projectType + promptVersion + (fileName || '')).digest('hex')

        // ── STEP 2: CHECK CACHE ──
        const cached = await prisma.aiEstimateCache.findUnique({
            where: { hash: inputHash }
        })
        if (cached) return cached.result as any

        const imageParts = images.map(img => {
            const isPdf = img.startsWith('data:application/pdf') || img.length > 1000 && img.substring(0, 30).includes('pdf')
            return {
                inlineData: {
                    mimeType: isPdf ? 'application/pdf' : 'image/jpeg',
                    data: img.replace(/^data:(image\/\w+|application\/pdf);base64,/, '')
                }
            }
        })

        let metaCues = ""
        if (fileName) {
            metaCues = `\nCRITICAL CONTEXT FROM UPLOADED FILENAME:
   - The user uploaded a file named: "${fileName}"
   - Use any cues from the filename (such as "nhacap4", "200m2", "3tang", "5x20", "nha_pho") to guide and override your visual classification. For instance, if the filename says "3tang", the building style is likely "nhà_phố" with 3 floors. If the filename says "5x20", the footprint is likely 100m² and the dimensions of the overall bounding box are 5m x 20m. Combine these filename text cues with the visual plan drawing for maximum accuracy!\n`
        }

        const aiPrompt = `
You are a senior construction engineer and expert architect. Analyze the provided floor plan image with high precision:
${metaCues}
1. DIMENSION EXTRACTION (CRITICAL FAIL-SAFE):
   - Look closely for text labels with numbers (e.g., "3000", "4500", "15500", "20000"). These are millimeters. Convert to meters (divide by 1000).
   - If NO explicit dimensions are readable, use PROPORTIONAL REFERENCE OBJECT SCALING:
     * Locate standard architectural symbols to deduce dimensions: a double bed is roughly 1.6m x 2.0m, a single bedroom door is 0.9m wide, a double entrance door is 1.6m wide, and a standard toilet is 0.7m x 0.8m.
     * Estimate lengths and widths proportionally based on these reference scales.
   - If NO reference symbols or numbers are present, apply STANDARD VIETNAMESE RESIDENTIAL TYPOLOGIES:
     * Bedroom (Phòng ngủ): ~12m2 to 15m2 (e.g., 4m x 3m or 4m x 3.5m)
     * Living Room (Phòng khách): ~18m2 to 20m2 (e.g., 5m x 4m)
     * Kitchen & Dining (Phòng bếp): ~12m2 to 15m2 (e.g., 4m x 3m)
     * Toilet/Bathroom (WC): ~4m2 (e.g., 2m x 2m)
     * Hallway/Entrance (Sảnh/Hành lang): ~6m2 to 8m2

2. ROOM SPATIAL MAPPING:
   - MULTI-FLOOR DETECTION: Identify if the drawing contains multiple levels (Tầng trệt, Lầu 1, Tầng hầm).
   - For EACH ROOM:
     - "floor": 0 (Ground), 1 (Floor 1), 2 (Floor 2), -1 (Basement).
     - "x_pct", "z_pct" (0-100): Position relative to the building's bounding box on that specific floor.
   - For "nhà_phố": Ensure floors align vertically.

Return ONLY JSON:
{
  "buildingStyle": "nhà_cấp_4" | "nhà_phố" | "biệt_thự",
  "roofType": "bê_tông" | "mái_thái" | "mái_tôn",
  "rooms": [{ "name": "string", "length": float, "width": float, "x_pct": float, "z_pct": float, "floor": int }],
  "symbols": [
    { "type": "door" | "window" | "column" | "socket", "count": int, "label": "string" },
    { "type": "material_area", "material": "tiles" | "paint", "area": float, "label": "string" }
  ],
  "totalArea": float,
  "notes": "A friendly Vietnamese message explaining if dimensions were parsed exactly, estimated using reference objects (e.g., beds/doors), or calculated using standard room norms because dimensions were missing. Encourage them to verify/adjust below."
}
Note: If the document is a PDF, analyze all pages. Extract quantity of doors/windows if visible.`

        const responseText = await callGemini(aiPrompt, imageParts)
        const rawData = parseGeminiEstimatorJSON(responseText)

        // Map and validate raw data using Percentage Mapping
        const rawRooms = rawData.rooms || []
        
        // Tính toán kích thước tổng thể giả định dựa trên tổng chiều dài/rộng các phòng
        const estTotalWidth = Math.sqrt(Number(rawData.totalArea) || 100) * 1.2
        const estTotalLength = (Number(rawData.totalArea) || 100) / estTotalWidth

        const rooms: RoomDimension[] = rawRooms.map((r: any, idx: number) => {
            const length = Number(r.length) > 0 ? Number(r.length) : 3
            const width = Number(r.width) > 0 ? Number(r.width) : 3
            
            // Chuyển đổi % sang mét (0% -> -Total/2, 100% -> +Total/2)
            let x = 0
            let z = 0
            
            if (r.x_pct !== undefined && r.z_pct !== undefined) {
                x = (Number(r.x_pct) - 50) * (estTotalWidth / 100)
                z = (Number(r.z_pct) - 50) * (estTotalLength / 100)
            } else {
                // Fallback nếu AI không trả về %
                x = (idx % 3) * 6 - 6
                z = Math.floor(idx / 3) * 5
            }

            return {
                name: r.name || 'Phòng',
                length,
                width,
                area: (length * width) || (Number(r.area) > 0 ? Number(r.area) : 9),
                x,
                z,
                floor: Number(r.floor) || 0,
                height: 3.2,
            }
        })
        const totalArea = Number(rawData.totalArea) > 0 ? Number(rawData.totalArea) : rooms.reduce((sum, r) => sum + r.area, 0)

        const materials = calculateMaterials(
            totalArea, projectType, rooms,
            rawData.buildingStyle || 'nhà_cấp_4',
            rawData.wallPerimeter || totalArea * 1.2,
            rawData.roofType || 'bê_tông',
            budgetTier
        )

        // ── STEP 2.5: SYMBOL CONVERSION ──
        const symbolMaterials = convertSymbolsToMaterials(rawData.symbols || [])
        materials.push(...symbolMaterials)

        const enriched = await enrichMaterialsWithProducts(materials, budgetTier)
        const cost = enriched.reduce((sum, m) => sum + (m.price || 0) * m.quantity, 0)
        const validation = validateAgainstIndustryStandards(totalArea, enriched)

        const finalResult: EstimatorResult = {
            success: true,
            projectType,
            buildingStyle: rawData.buildingStyle || 'nhà_cấp_4',
            rooms,
            totalArea,
            materials: enriched,
            totalEstimatedCost: cost,
            confidence: rawData.confidence || 0.8,
            validationStatus: validation.status,
            validationMessage: validation.message,
            rawAnalysis: `${rawData.notes || ''} | Roof: ${rawData.roofType || 'Unknown'}`,
            wallPerimeter: rawData.wallPerimeter,
            roofType: rawData.roofType,
            symbols: rawData.symbols,
        }

        // ── STEP 3: SAVE TO CACHE ──
        await prisma.aiEstimateCache.create({
            data: {
                hash: inputHash,
                result: finalResult as unknown as Prisma.InputJsonValue
            }
        }).catch(e => console.error('[VisionEstimator] Failed to save cache:', e))

        return finalResult
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error during analysis'
        console.error('[VisionEstimator] analyzeFloorPlanImage error:', error)
        return errorResult(projectType, msg)
    }
}

/**
 * Analyze a text description of a project (no image).
 * Falls back to dimension regex extraction if Gemini fails.
 */
export async function estimateFromText(
    description: string,
    projectType: 'general' | 'flooring' | 'painting' | 'tiling' = 'general',
    budgetTier: 'economy' | 'standard' | 'premium' = 'standard'
): Promise<EstimatorResult> {
    if (!genAI) return errorResult(projectType, 'AI service not configured.')

    try {
        // ── STEP 1: CALCULATE HASH FOR DETERMINISM ──
        const inputHash = crypto.createHash('sha256').update(description + projectType + "v4_dynamic_nlp").digest('hex')

        // ── STEP 2: CHECK CACHE ──
        const cached = await prisma.aiEstimateCache.findUnique({
            where: { hash: inputHash }
        })
        if (cached) return cached.result as any

        const aiPrompt = `
Bạn là một kỹ sư xây dựng và kiến trúc sư chuyên nghiệp. Hãy phân tích mô tả yêu cầu công trình dưới đây và trích xuất thông tin BIM dưới định dạng JSON để bóc tách khối lượng vật tư.

MÔ TẢ YÊU CẦU CỦA NGƯỜI DÙNG:
"${description}"

HẠNG MỤC BAN ĐẦU ĐƯỢC CHỌN (Chỉ mang tính chất tham khảo):
"${projectType}"

Yêu cầu phân tích:
1. ĐỌC KỸ mô tả của người dùng và TRÍCH XUẤT ĐỘNG:
   - Các phòng, chiều dài (length), chiều rộng (width) được nêu trong mô tả. 
   - Tên phòng phải khớp với mô tả của người dùng (ví dụ: "Phòng ngủ", "Phòng khách", "Nhà bếp", "Sân thượng").
   - Tính toán tổng diện tích sàn (totalArea) chính xác bằng tổng diện tích các phòng (length * width). KHÔNG được trả về diện tích mặc định hay cố định. Nếu người dùng nhập "phòng ngủ 5x4m", totalArea phải là 20. Nếu người dùng nhập "phòng khách 6x5m và bếp 4x3m", totalArea phải là 30 + 12 = 42.
2. TỰ ĐỘNG PHÂN LOẠI HẠNG MỤC THỰC TẾ (detectedProjectType):
   - Phân tích từ mô tả của người dùng để chọn phân mục phù hợp nhất:
     * "painting" (Sơn nhà / Phòng): nếu người dùng chỉ đề cập đến sơn, quét vôi, bả trét.
     * "flooring" (Lát nền): nếu người dùng chỉ đề cập đến lát gạch nền, lót sàn gỗ, cán nền.
     * "tiling" (Ốp lát tường): nếu người dùng đề cập đến ốp gạch tường, ốp đá.
     * "general" (Xây thô / Tổng thể): nếu người dùng muốn xây dựng mới, sửa nhà thô, đổ bê tông, làm mái, v.v., hoặc mô tả chung chung.
3. Xác định loại kiến trúc ("buildingStyle"): "nhà_cấp_4", "nhà_phố" hoặc "biệt_thự" dựa trên quy mô được mô tả.
4. Xác định loại mái ("roofType"): "bê_tông", "mái_thái" hoặc "mái_tôn" nếu có đề cập.
5. TỌA ĐỘ (x, z): Xác định vị trí tương đối của tâm phòng trong mặt bằng tổng thể (đơn vị mét). Nếu chỉ có 1 phòng duy nhất, đặt x = 0, z = 0.
6. Chỉ trả về một chuỗi JSON hợp lệ duy nhất, tuyệt đối không thêm lời thoại hay văn bản giải thích ngoài JSON.

Định dạng JSON yêu cầu trả về:
{
  "buildingStyle": "nhà_cấp_4" | "nhà_phố" | "biệt_thự",
  "roofType": "bê_tông" | "mái_thái" | "mái_tôn",
  "detectedProjectType": "general" | "flooring" | "painting" | "tiling",
  "rooms": [
    { "name": "Tên phòng", "length": số, "width": số, "x": số, "z": số }
  ],
  "totalArea": số,
  "confidence": số,
  "notes": "Lời giải thích ngắn gọn bằng tiếng Việt về việc hệ thống đã tự động nhận diện hạng mục gì và diện tích bao nhiêu từ mô tả của họ"
}
`

        let responseText: string
        try {
            responseText = await callGemini(aiPrompt)
        } catch {
            responseText = ''
        }

        let data: {
            buildingStyle?: 'nhà_cấp_4' | 'nhà_phố' | 'biệt_thự'
            roofType?: string
            detectedProjectType?: 'general' | 'flooring' | 'painting' | 'tiling'
            rooms?: { name: string; length: number; width: number }[]
            totalArea?: number
            wallPerimeter?: number
            confidence?: number
            notes?: string
            fengShuiAdvice?: string
        }

        try {
            const cleaned = responseText.replace(/```json\s*|```/g, '').trim()
            data = JSON.parse(cleaned)
        } catch {
            // Regex fallback: extract dimensions from text
            const dimensionRegex = /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*m?/g
            const matches = [...description.matchAll(dimensionRegex)]

            if (matches.length > 0) {
                const rooms = matches.map((match, idx) => ({
                    name: `Khu vực ${idx + 1}`,
                    length: parseFloat(match[1].replace(',', '.')),
                    width: parseFloat(match[2].replace(',', '.')),
                }))
                const totalArea = rooms.reduce((sum, r) => sum + r.length * r.width, 0)
                
                // Trích xuất từ khoá đơn giản cho regex fallback
                let fallbackType: 'general' | 'flooring' | 'painting' | 'tiling' = 'general'
                const lowerDesc = description.toLowerCase()
                if (lowerDesc.includes('sơn') || lowerDesc.includes('bả') || lowerDesc.includes('quét')) {
                    fallbackType = 'painting'
                } else if (lowerDesc.includes('lát') || lowerDesc.includes('nền') || lowerDesc.includes('gỗ')) {
                    fallbackType = 'flooring'
                } else if (lowerDesc.includes('ốp')) {
                    fallbackType = 'tiling'
                }

                data = {
                    buildingStyle: 'nhà_cấp_4',
                    roofType: 'bê_tông',
                    detectedProjectType: fallbackType,
                    rooms,
                    totalArea,
                    wallPerimeter: Math.sqrt(totalArea) * 4,
                    confidence: 0.6,
                    notes: `Phân tích từ biểu thức chính quy regex. Hệ thống nhận diện hạng mục: ${fallbackType}.`
                }
            } else {
                throw new Error('Không thể xác định kích thước từ mô tả. Vui lòng nhập rõ hơn, ví dụ: "phòng 5x4m"')
            }
        }

        const rooms: RoomDimension[] = (data.rooms || []).map(r => ({
            ...r,
            area: r.length * r.width,
            height: 3.2,
        }))
        const totalArea = data.totalArea || rooms.reduce((sum, r) => sum + r.area, 0)

        if (totalArea <= 0) {
            return errorResult(projectType, 'Không thể xác định diện tích. Vui lòng mô tả rõ hơn (VD: "sân 6x8m").')
        }

        // Tự động sử dụng hạng mục thực tế được phát hiện bởi AI, nếu không có thì fallback về ban đầu
        const finalProjectType = data.detectedProjectType || projectType

        const materials = calculateMaterials(
            totalArea, finalProjectType, rooms,
            data.buildingStyle || 'nhà_cấp_4',
            data.wallPerimeter || totalArea * 0.8,
            data.roofType || 'bê_tông',
            budgetTier
        )
        const enriched = await enrichMaterialsWithProducts(materials, budgetTier)
        const cost = enriched.reduce((sum, m) => sum + (m.price || 0) * m.quantity, 0)
        const validation = validateAgainstIndustryStandards(totalArea, enriched)

        const finalResult: EstimatorResult = {
            success: true,
            projectType: finalProjectType,
            buildingStyle: data.buildingStyle || 'nhà_cấp_4',
            rooms,
            totalArea,
            materials: enriched,
            totalEstimatedCost: cost,
            confidence: data.confidence || 0.75,
            validationStatus: validation.status,
            validationMessage: validation.message,
            rawAnalysis: data.notes || `Phân tích từ mô tả: "${description.substring(0, 100)}..."`
        }

        // ── STEP 3: SAVE TO CACHE ──
        await prisma.aiEstimateCache.create({
            data: {
                hash: inputHash,
                result: finalResult as unknown as Prisma.InputJsonValue
            }
        }).catch(e => console.error('[VisionEstimator] Failed to save text cache:', e))

        return finalResult
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Lỗi khi phân tích mô tả.'
        console.error('[VisionEstimator] estimateFromText error:', error)
        return errorResult(projectType, msg)
    }
}

/**
 * Recalculate a complete EstimatorResult given known dimensions.
 * Used when the user manually edits room data after initial analysis.
 */
export async function recalculateEstimate(
    totalArea: number,
    projectType: string,
    rooms: RoomDimension[],
    buildingStyle: 'nhà_cấp_4' | 'nhà_phố' | 'biệt_thự',
    wallPerimeter: number,
    roofType: string,
    budgetTier: 'economy' | 'standard' | 'premium' = 'standard',
    confidence: number = 1.0,
    notes: string = ''
): Promise<EstimatorResult> {
    const materials: MaterialEstimate[] = calculateMaterials(
        totalArea, projectType, rooms, buildingStyle, wallPerimeter, roofType, budgetTier
    )
    const enriched = await enrichMaterialsWithProducts(materials, budgetTier)
    const cost = enriched.reduce((sum: number, m: MaterialEstimate) => sum + (m.price || 0) * m.quantity, 0)
    const validation = validateAgainstIndustryStandards(totalArea, enriched)

    return {
        success: true,
        projectType,
        buildingStyle,
        rooms,
        totalArea,
        materials: enriched,
        totalEstimatedCost: cost,
        confidence,
        validationStatus: validation.status,
        validationMessage: validation.message,
        rawAnalysis: `${notes} | Roof: ${roofType}`
    }
}
