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

// Gemini client — initialized once
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null

const MODEL_FALLBACKS = [
    'gemini-2.5-flash', 
    'gemini-2.5-flash-lite', 
    'gemini-2.5-pro',
    'gemini-2-flash',
    'gemini-2-flash-lite'
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
    projectType: 'general' | 'flooring' | 'painting' | 'tiling' = 'general'
): Promise<EstimatorResult> {
    if (!genAI) return errorResult(projectType, 'AI service not configured.')

    try {
        const images = Array.isArray(base64Images) ? base64Images : [base64Images]
        
        // ── STEP 1: CALCULATE HASH FOR DETERMINISM ──
        const combinedBase64 = images.join('|')
        const promptVersion = "v3_strict_style_and_dims"
        const inputHash = crypto.createHash('sha256').update(combinedBase64 + projectType + promptVersion).digest('hex')

        // ── STEP 2: CHECK CACHE ──
        const cached = await prisma.aiEstimateCache.findUnique({
            where: { hash: inputHash }
        })
        if (cached) return cached.result as any

        const imageParts = images.map(img => ({
            inlineData: {
                mimeType: 'image/jpeg',
                data: img.replace(/^data:image\/\w+;base64,/, '')
            }
        }))

        const aiPrompt = `
You are a senior construction engineer. Analyze the provided floor plan with high precision:

1. DIMENSION EXTRACTION (CRITICAL): 
   - Look for text labels with numbers (e.g., "3000", "4500", "15500", "20000"). These are millimeters. Convert to meters (divide by 1000).
   - Identify the "Total Land Width" vs "Total Land Length" from the outermost dimension lines.
   - Identify "Built Area" length by excluding yards (Sân trước, Sân sau).

2. ROOM ANALYSIS: 
   - Detect every room (Phòng khách, Bếp, Phòng ngủ, WC, etc.).
   - FOR EACH ROOM: 
     - "length" (m) and "width" (m).
     - "x" (m) and "z" (m): This is the relative position of the ROOM CENTER compared to the center of the house.
     - IMPORTANT: If rooms are side-by-side horizontally, they should have different X values. If they are one after another vertically, they should have different Z values.
   - For this Villa drawing: Group rooms based on the grid (e.g. Sảnh/PK/Bếp are on the left lane, the other rooms are on the middle/right lanes).

Return ONLY JSON:
{
  "buildingStyle": "nhà_cấp_4" | "nhà_phố" | "biệt_thự",
  "roofType": "bê_tông" | "mái_thái" | "mái_tôn",
  "rooms": [{ "name": "string", "length": float, "width": float, "x": float, "z": float }],
  "totalArea": float,
  "confidence": float,
  "notes": "string"
}`

        const responseText = await callGemini(aiPrompt, imageParts)
        const rawData = parseGeminiEstimatorJSON(responseText)

        // Map and validate raw data to ensure non-zero values
        const rooms: RoomDimension[] = (rawData.rooms || []).map((r: any) => ({
            name: r.name || 'Phòng',
            length: Number(r.length) > 0 ? Number(r.length) : 3,
            width: Number(r.width) > 0 ? Number(r.width) : 3,
            area: (Number(r.length) * Number(r.width)) || (Number(r.area) > 0 ? Number(r.area) : 9),
            x: r.x || 0,
            z: r.z || 0,
            height: 3.2,
        }))
        const totalArea = Number(rawData.totalArea) > 0 ? Number(rawData.totalArea) : rooms.reduce((sum, r) => sum + r.area, 0)

        const materials = calculateMaterials(
            totalArea, projectType, rooms,
            rawData.buildingStyle || 'nhà_cấp_4',
            rawData.wallPerimeter || totalArea * 1.2,
            rawData.roofType || 'bê_tông'
        )
        const enriched = await enrichMaterialsWithProducts(materials)
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
    projectType: 'general' | 'flooring' | 'painting' | 'tiling' = 'general'
): Promise<EstimatorResult> {
    if (!genAI) return errorResult(projectType, 'AI service not configured.')

    try {
        // ── STEP 1: CALCULATE HASH FOR DETERMINISM ──
        const inputHash = crypto.createHash('sha256').update(description + projectType + "v3").digest('hex')

        // ── STEP 2: CHECK CACHE ──
        const cached = await prisma.aiEstimateCache.findUnique({
            where: { hash: inputHash }
        })
        if (cached) return cached.result as any

        const aiPrompt = `
Bạn là một kiến trúc sư chuyên nghiệp. Hãy phân tích bản vẽ mặt bằng và trích xuất thông tin BIM:

1. Phân tích các phòng: Tên, Chiều dài (L), Chiều rộng (W).
2. TỌA ĐỘ (CỰC KỲ QUAN TRỌNG): 
   - Xác định vị trí (x, z) của TÂM mỗi phòng so với tâm tổng thể của ngôi nhà (đơn vị mét).
   - Nếu bản vẽ có nhiều phòng cạnh nhau theo chiều ngang, chúng phải có tọa độ X khác nhau.
   - Nếu bản vẽ có nhiều phòng xếp theo chiều dọc, chúng phải có tọa độ Z khác nhau.
   - KHÔNG xếp tất cả phòng thành 1 hàng dọc nếu bản vẽ là biệt thự/nhà vườn.
3. Xác định loại kiến trúc: "nhà_cấp_4", "nhà_phố" hoặc "biệt_thự".
4. Xác định loại mái: "bê_tông", "mái_thái" hoặc "mái_tôn".

Định dạng JSON:
{
  "buildingStyle": "biệt_thự",
  "roofType": "mái_thái",
  "rooms": [
    { "name": "Sảnh chính", "length": 3, "width": 6, "x": -2, "z": 8 },
    { "name": "Phòng khách", "length": 6, "width": 6, "x": -2, "z": 4 },
    { "name": "Phòng thờ", "length": 4, "width": 4, "x": 3, "z": 4 }
  ],
  "totalArea": 120,
  "confidence": 0.95
}

CHỈ trả về JSON.`

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
                    notes: 'Phân tích từ regex (AI không trả về JSON hợp lệ)'
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

        const finalResult: EstimatorResult = {
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
        rawAnalysis: `${notes} | Roof: ${roofType}`
    }
}
