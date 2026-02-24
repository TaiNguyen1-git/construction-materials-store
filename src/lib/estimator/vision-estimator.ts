"use server";

/**
 * Vision Estimator — AI layer
 * Analyzes floor plan images and text descriptions using Gemini Vision.
 * Delegates calculation to material-calculator.ts and DB lookup to product-enricher.ts.
 */

import { GoogleGenerativeAI, Part } from '@google/generative-ai'
import { EstimatorAIResponseSchema } from '@/lib/validation'
import {
    EstimatorResult,
    RoomDimension,
    withRetry,
    errorResult,
    MaterialEstimate,
} from './estimator-types'
import { calculateMaterials, validateAgainstIndustryStandards } from './material-calculator'
import { enrichMaterialsWithProducts } from './product-enricher'

// Gemini client — initialized once
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null

const MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3-flash']

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
    birthYear?: string,
    houseDirection?: string
): Promise<EstimatorResult> {
    if (!genAI) return errorResult(projectType, 'AI service not configured.')

    try {
        const images = Array.isArray(base64Images) ? base64Images : [base64Images]
        const imageParts = images.map(img => ({
            inlineData: {
                mimeType: 'image/jpeg',
                data: img.replace(/^data:image\/\w+;base64,/, '')
            }
        }))

        const fengShuiPrompt = (birthYear || houseDirection)
            ? `\n6. FENG SHUI ANALYSIS:
   - User Info: Birth Year: ${birthYear || 'N/A'}, House Direction: ${houseDirection || 'N/A'}
   - Determine the user's "Mệnh" based on birth year.
   - Analyze compatibility with the house direction (if provided).
   - Suggest 3 Colors and Material types that are "Tương sinh" or "Tương hợp".
   - Provide a short encouraging advice paragraph in Vietnamese.`
            : ''

        const aiPrompt = `
1. ROOM ANALYSIS: Identify all visible rooms. For EACH room, provide estimated "length" and "width" in meters.
   - Calculate area for EACH room.
   - Sum all room areas to get the floor area.
2. TOTAL AREA: The "totalArea" MUST be the mathematical sum of all room areas. Do NOT guess a round number.
3. SCALE REFERENCE: Find a door (0.9m), kitchen counter (0.6m depth), or dimension line. Use this to calibrate.
4. BUILDING STYLE: Categorize as "nhà_cấp_4", "nhà_phố", or "biệt_thự".
5. WALLS: Estimate total "wallPerimeter" for all floors combined in meters.
6. ROOF: Identify "roofType" (bê_tông, mái_thái, mái_tôn).
${fengShuiPrompt}

Return ONLY JSON:
{
  "buildingStyle": "nhà_cấp_4" | "nhà_phố" | "biệt_thự",
  "roofType": "bê_tông" | "mái_thái" | "mái_tôn",
  "rooms": [{ "name": "string", "length": float, "width": float }],
  "totalArea": float,
  "wallPerimeter": float,
  "confidence": float,
  "notes": "string",
  "fengShuiAdvice": "string (markdown, brief)"
}`

        const responseText = await callGemini(aiPrompt, imageParts)
        const rawData = parseGeminiEstimatorJSON(responseText)

        // Zod schema validation for production reliability
        const zodResult = EstimatorAIResponseSchema.safeParse(rawData)
        if (!zodResult.success) {
            console.warn('[VisionEstimator] Zod validation failed, using raw:', zodResult.error.format())
        }
        const data = zodResult.success ? zodResult.data : rawData

        const rooms: RoomDimension[] = (data.rooms || []).map((r: { name?: string; length?: number; width?: number; area?: number }) => ({
            name: r.name || 'Phòng',
            length: r.length || 0,
            width: r.width || 0,
            area: (r.length && r.width) ? r.length * r.width : (r.area || 0),
            height: 3.2,
        }))
        const totalArea = data.totalArea || rooms.reduce((sum, r) => sum + r.area, 0)

        const materials = calculateMaterials(
            totalArea, projectType, data.rooms || [],
            data.buildingStyle || 'nhà_cấp_4',
            data.wallPerimeter || totalArea * 0.8,
            data.roofType || 'bê_tông'
        )
        const enriched = await enrichMaterialsWithProducts(materials)
        const cost = enriched.reduce((sum, m) => sum + (m.price || 0) * m.quantity, 0)
        const validation = validateAgainstIndustryStandards(totalArea, enriched)

        return {
            success: true,
            projectType,
            buildingStyle: data.buildingStyle,
            rooms: data.rooms || [],
            totalArea,
            materials: enriched,
            totalEstimatedCost: cost,
            confidence: data.confidence || 0.8,
            validationStatus: validation.status,
            validationMessage: validation.message,
            rawAnalysis: `${data.notes || ''} | Roof: ${data.roofType || 'Unknown'}`,
            fengShuiAdvice: data.fengShuiAdvice,
            wallPerimeter: data.wallPerimeter,
            roofType: data.roofType,
        }
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
    birthYear?: string,
    houseDirection?: string
): Promise<EstimatorResult> {
    if (!genAI) return errorResult(projectType, 'AI service not configured.')

    try {
        const fengShuiPrompt = (birthYear || houseDirection)
            ? `\n5. FENG SHUI ANALYSIS:
    - User Info: Birth Year: ${birthYear || 'N/A'}, House Direction: ${houseDirection || 'N/A'}
    - Determine the user's "Mệnh" based on birth year.
    - Analyze compatibility with the house direction (if provided).
    - Suggest 3 Colors and Material types that are "Tương sinh" or "Tương hợp".
    - Return advice as a SHORT string in "fengShuiAdvice" field (Vietnamese).`
            : ''

        const aiPrompt = `
Bạn là một kỹ sư xây dựng chuyên nghiệp Việt Nam và Chuyên gia Phong thuỷ. Phân tích mô tả dự án sau và trích xuất thông tin:

Mô tả: "${description}"

Hãy xác định:
1. Các phòng/khu vực và kích thước (dài x rộng), ước lượng nếu không rõ.
2. Loại nhà: "nhà_cấp_4", "nhà_phố", hoặc "biệt_thự" (mặc định là nhà_cấp_4 nếu không rõ).
3. Loại mái: "bê_tông", "mái_thái", hoặc "mái_tôn".
4. Ước tính tổng chu vi tường (m).
${fengShuiPrompt}

VÍ DỤ đầu ra:
{
  "buildingStyle": "nhà_cấp_4",
  "roofType": "mái_tôn",
  "rooms": [
    { "name": "Sân", "length": 6, "width": 8 },
    { "name": "Phòng khách", "length": 5, "width": 4 }
  ],
  "totalArea": 68,
  "wallPerimeter": 40,
  "confidence": 0.85,
  "notes": "Dự án lát nền sân và phòng khách",
  "fengShuiAdvice": "Mệnh Thổ hợp màu nâu, vàng."
}

CHỈ trả về JSON, không có text giải thích.`

        let responseText: string
        try {
            responseText = await callGemini(aiPrompt)
        } catch {
            responseText = ''
        }

        let data: {
            buildingStyle?: 'nhà_cấp_4' | 'nhà_phố' | 'biệt_thự'
            roofType?: string
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
                data = {
                    buildingStyle: 'nhà_cấp_4',
                    roofType: 'bê_tông',
                    rooms,
                    totalArea,
                    wallPerimeter: Math.sqrt(totalArea) * 4,
                    confidence: 0.6,
                    notes: 'Phân tích từ regex (AI không trả về JSON hợp lệ)',
                    fengShuiAdvice: birthYear ? 'Vui lòng thử lại để nhận tư vấn phong thủy chi tiết.' : undefined,
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

        const materials = calculateMaterials(
            totalArea, projectType, rooms,
            data.buildingStyle || 'nhà_cấp_4',
            data.wallPerimeter || totalArea * 0.8,
            data.roofType || 'bê_tông'
        )
        const enriched = await enrichMaterialsWithProducts(materials)
        const cost = enriched.reduce((sum, m) => sum + (m.price || 0) * m.quantity, 0)
        const validation = validateAgainstIndustryStandards(totalArea, enriched)

        return {
            success: true,
            projectType,
            buildingStyle: data.buildingStyle,
            rooms,
            totalArea,
            materials: enriched,
            totalEstimatedCost: cost,
            confidence: data.confidence || 0.75,
            validationStatus: validation.status,
            validationMessage: validation.message,
            rawAnalysis: data.notes || `Phân tích từ mô tả: "${description.substring(0, 100)}..."`,
            fengShuiAdvice: data.fengShuiAdvice,
        }
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
    fengShuiAdvice?: string,
    confidence: number = 1.0,
    notes: string = ''
): Promise<EstimatorResult> {
    const materials: MaterialEstimate[] = calculateMaterials(
        totalArea, projectType, rooms, buildingStyle, wallPerimeter, roofType
    )
    const enriched = await enrichMaterialsWithProducts(materials)
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
        rawAnalysis: `${notes} | Roof: ${roofType}`,
        fengShuiAdvice,
    }
}
