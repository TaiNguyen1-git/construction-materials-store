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

import { EstimatorAIResponseSchema } from '@/lib/validation'

interface ConstructionStandard {
    cement: number;
    sand_build: number;
    sand_fill: number;
    stone_1x2: number;
    stone_4x6: number;
    bricks: number;
    steel: number;
    electric_pipes: number;
    water_pipes: number;
}

/**
 * Enhanced ConstructionStandards with strict nested types
 */
interface ConstructionStandards {
    nhà_cấp_4: ConstructionStandard;
    nhà_phố: ConstructionStandard;
    biệt_thự: ConstructionStandard;
    flooring: {
        cement_leveling_kg_m2: number;
        sand_leveling_m3_m2: number;
        tile_wastage: number;
        grout_kg_m2: number;
    };
    painting: {
        primer_m2_per_liter: number;
        topcoat_m2_per_liter: number;
        putty_m2_per_kg: number;
    };
    [key: string]: ConstructionStandard | ConstructionStandards['flooring'] | ConstructionStandards['painting'];
}

// TCVN Construction material standards (Vietnamese market)
const CONSTRUCTION_STANDARDS: ConstructionStandards = {
    /**
     * Empirical norms for Vietnamese residential construction (Suất định mức m2 sàn)
     * Adjusted for small footprints (20-40m2) where wall density is higher.
     */
    nhà_cấp_4: {
        cement: 90,       // kg/m2 floor
        sand_build: 0.25,  // m3/m2
        sand_fill: 0.12,   // m3/m2
        stone_1x2: 0.20,   // m3/m2
        stone_4x6: 0.08,   // m3/m2
        bricks: 120,      // viên/m2 (Increased for small house density)
        steel: 50,        // kg/m2
        electric_pipes: 2.5,
        water_pipes: 1.8,
    },
    nhà_phố: {
        cement: 140,      // Increased for structural density
        sand_build: 0.45,
        sand_fill: 0.15,
        stone_1x2: 0.35,
        stone_4x6: 0.12,
        bricks: 180,      // ~7200 viên for 40m2 (Realistic for 2-story 20m2 house)
        steel: 110,       // kg/m2
        electric_pipes: 4.5,
        water_pipes: 3.5,
    },
    biệt_thự: {
        cement: 180,
        sand_build: 0.60,
        sand_fill: 0.20,
        stone_1x2: 0.50,
        stone_4x6: 0.15,
        bricks: 220,
        steel: 150,
        electric_pipes: 7.0,
        water_pipes: 6.0,
    },
    flooring: {
        cement_leveling_kg_m2: 12, // For substrate
        sand_leveling_m3_m2: 0.04,  // For substrate (approx 3-5cm thick)
        tile_wastage: 1.08,
        grout_kg_m2: 0.8, // Increased for realistic gaps
    },
    painting: {
        primer_m2_per_liter: 10,
        topcoat_m2_per_liter: 5,
        putty_m2_per_kg: 1.2,
    }
}

// Market Price Fallback (VND) for items NOT in store
const MARKET_PRICES: Record<string, { price: number, unit: string }> = {
    'xi măng': { price: 82000, unit: 'bao' },
    'gạch ống': { price: 1100, unit: 'viên' },
    'gạch đinh': { price: 1350, unit: 'viên' },
    'cát bê tông': { price: 420000, unit: 'm³' },
    'cát xây': { price: 320000, unit: 'm³' },
    'cát tô': { price: 340000, unit: 'm³' },
    'cát san lấp': { price: 180000, unit: 'm³' },
    'đá 1×2': { price: 450000, unit: 'm³' },
    'đá 4×6': { price: 380000, unit: 'm³' },
    'thép cuộn': { price: 18200000, unit: 'tấn' },
    'thép thanh': { price: 18500000, unit: 'tấn' },
    'sắt': { price: 18500000, unit: 'tấn' },
    'sắt hộp': { price: 21500, unit: 'kg' }, // For purlins/grilles
    'sơn': { price: 125000, unit: 'lít' },
    'bột trét': { price: 280000, unit: 'bao' },
    'chống thấm': { price: 145000, unit: 'kg' },
    'kẽm buộc': { price: 22000, unit: 'kg' },
    'đinh thép': { price: 25000, unit: 'kg' },
    'que hàn': { price: 45000, unit: 'kg' },
    'lưới mắt cáo': { price: 15000, unit: 'm' },
    'ngói': { price: 16500, unit: 'viên' },
    'tôn lạnh': { price: 85000, unit: 'm' },
    'vít bắn tôn': { price: 65000, unit: 'hộp' },
    'keo chà ron': { price: 35000, unit: 'kg' },
    'gạch lát nền': { price: 220000, unit: 'm²' }
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
    originalName?: string // The AI-generated generic name
    productId?: string
    quantity: number
    unit: string
    reason: string
    price?: number
    isInStore?: boolean
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
    fengShuiAdvice?: string
    wallPerimeter?: number
    roofType?: string
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
// ... (imports remain)
export async function analyzeFloorPlanImage(
    base64Images: string | string[],
    projectType: 'general' | 'flooring' | 'painting' | 'tiling' = 'general',
    birthYear?: string,
    houseDirection?: string
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
        const images = Array.isArray(base64Images) ? base64Images : [base64Images]
        const imageParts = images.map(img => ({
            inlineData: {
                mimeType: 'image/jpeg',
                data: img.replace(/^data:image\/\w+;base64,/, '')
            }
        }))

        let fengShuiPrompt = ''
        if (birthYear || houseDirection) {
            fengShuiPrompt = `
6. FENG SHUI ANALYSIS:
   - User Info: Birth Year: ${birthYear || 'N/A'}, House Direction: ${houseDirection || 'N/A'}
   - Determine the user's "Mệnh" (Fate) based on birth year.
   - Analyze compatibility with the house direction (if provided).
   - Suggest 3 specific Colors and Material types (e.g., Gỗ, Đá, Kim loại) that are "Tương sinh" or "Tương hợp".
   - Provide a short, encouraging advice paragraph in Vietnamese.
`
        }

        const aiPrompt = `
1. ROOM ANALYSIS: Identify all visible rooms. For EACH room, provide estimated "length" and "width" in meters. 
   - Calculate area for EACH room.
   - Sum all room areas to get the floor area.
2. TOTAL AREA: The "totalArea" field MUST be the mathematical sum of all identify room areas across all floors. Do NOT guess a round number.
3. SCALE REFERENCE: Find a door (0.9m), a kitchen counter (0.6m depth), or a dimension line (e.g., 4000 = 4.0m). Use this to calibrate.
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
  "fengShuiAdvice": "string (markdown formatted, brief advice)"
}
`

        const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3-flash']
        let lastError: Error | null = null

        let responseText = ''

        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName })
                const result = (await withRetry(() => model.generateContent([
                    aiPrompt,
                    ...imageParts
                ])))
                responseText = result.response.text()

                if (responseText) break
            } catch (err) {
                console.error(`Model ${modelName} failed, trying fallback...`, err)
                lastError = err instanceof Error ? err : new Error(String(err))
                continue
            }

        }

        if (!responseText) throw lastError || new Error('All models failed')

        // Robust JSON extraction & Validation
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            console.error('Failed to find JSON in response:', responseText)
            throw new Error('AI response was not in a valid JSON format.')
        }

        let rawData;
        try {
            rawData = JSON.parse(jsonMatch[0]);
        } catch {
            throw new Error('Failed to parse AI JSON response.');
        }

        // Validate with Zod for production-grade reliability
        const zodValidation = EstimatorAIResponseSchema.safeParse(rawData);

        if (!zodValidation.success) {
            console.warn('AI Output validation failed, applying structural fallback:', zodValidation.error.format());
        }

        // Use validated data or merge with raw for flexibility
        const data = zodValidation.success ? zodValidation.data : rawData;

        const rooms: RoomDimension[] = (data.rooms || []).map((r: { name?: string; length?: number; width?: number; area?: number }) => ({
            name: r.name || 'Phòng',
            length: r.length || 0,
            width: r.width || 0,
            area: (r.length && r.width) ? r.length * r.width : (r.area || 0),
            height: 3.2
        }))
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
            rawAnalysis: `${data.notes || ''} | Roof: ${data.roofType || 'Unknown'} `,
            fengShuiAdvice: data.fengShuiAdvice,
            wallPerimeter: data.wallPerimeter,
            roofType: data.roofType
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during analysis'
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
            error: errorMessage

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
    const materials = await calculateMaterials(
        totalArea,
        projectType,
        rooms,
        buildingStyle,
        wallPerimeter,
        roofType
    )
    const enriched = await enrichMaterialsWithProducts(materials)
    const cost = enriched.reduce((sum, m) => sum + (m.price || 0) * m.quantity, 0)
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
        fengShuiAdvice
    }
}

async function calculateMaterials(
    area: number,
    type: string,
    rooms: RoomDimension[],
    style: 'nhà_cấp_4' | 'nhà_phố' | 'biệt_thự',
    wallPerimeter: number,
    _roofType: string
): Promise<MaterialEstimate[]> {
    const materials: MaterialEstimate[] = []
    const std = (CONSTRUCTION_STANDARDS as Record<string, ConstructionStandard | object>)[style] as ConstructionStandard || CONSTRUCTION_STANDARDS.nhà_cấp_4


    if (type === 'general') {
        const totalBricks = Math.ceil(area * std.bricks)
        materials.push({
            productName: 'Gạch ống 8×8×18cm (Xây tường)',
            quantity: Math.ceil(totalBricks * 0.8),
            unit: 'viên',
            reason: `Dự toán xây tường gạch ống (~80% tổng gạch cho ${style})`
        })
        materials.push({
            productName: 'Gạch đinh 4×8×18cm (Gia cố chân tường/bể)',
            quantity: Math.ceil(totalBricks * 0.2),
            unit: 'viên',
            reason: `Gạch đinh dùng cho chân tường, móng, bể tự hoại (~20%)`
        })

        const totalCementKg = area * std.cement
        materials.push({
            productName: 'Xi măng bê tông (Portland)',
            quantity: Math.ceil((totalCementKg * 0.4) / 50),
            unit: 'bao',
            reason: `Hạng mục đổ bê tông móng, cột, dầm, sàn (40%)`
        })
        materials.push({
            productName: 'Xi măng xây tô (Loại 1)',
            quantity: Math.ceil((totalCementKg * 0.6) / 50),
            unit: 'bao',
            reason: `Vữa xây trát và hoàn thiện (60%)`
        })

        const totalSteelTons = (area * std.steel) / 1000
        materials.push({
            productName: 'Thép cuộn Phi 6-8 (Làm đai/Sàn)',
            quantity: Number((totalSteelTons * 0.35).toFixed(2)),
            unit: 'tấn',
            reason: `Thép cuộn dùng làm đai kết cấu và thép sàn`
        })
        materials.push({
            productName: 'Thép thanh vằn Phi 10-25 (Cột/Dầm)',
            quantity: Number((totalSteelTons * 0.65).toFixed(2)),
            unit: 'tấn',
            reason: `Thép cây chịu lực chính cho khung nhà`
        })

        const totalSandM3 = area * std.sand_build
        materials.push({
            productName: 'Cát bê tông (Cát vàng hạt lớn)',
            quantity: Number((totalSandM3 * 0.4).toFixed(1)),
            unit: 'm³',
            reason: `Cát sạch dùng để trộn bê tông`
        })
        materials.push({
            productName: 'Cát tô sạch (Mịn)',
            quantity: Number((totalSandM3 * 0.6).toFixed(1)),
            unit: 'm³',
            reason: `Cát mịn dùng cho công tác trát tường`
        })
        materials.push({
            productName: 'Cát san lấp (Nền móng)',
            quantity: Number((area * std.sand_fill).toFixed(1)),
            unit: 'm³',
            reason: `Dùng cho tôn nền và đệm móng chống lún`
        })

        materials.push({
            productName: 'Đá 1×2 (Bê tông)',
            quantity: Number((area * std.stone_1x2).toFixed(1)),
            unit: 'm³',
            reason: `Cốt liệu đá cho bê tông các hạng mục chịu lực`
        })
        materials.push({
            productName: 'Đá 4×6 (Bê tông lót)',
            quantity: Number((area * std.stone_4x6).toFixed(1)),
            unit: 'm³',
            reason: `Lớp bê tông lót móng và chống úng`
        })

        // Essential Hardware items
        materials.push({
            productName: 'Kẽm buộc (1ly)',
            quantity: Math.ceil(area * 0.08),
            unit: 'kg',
            reason: `Phụ kiện buộc cố định thép sàn và cột`
        })
        materials.push({
            productName: 'Đinh thép (tổng hợp)',
            quantity: Math.ceil(area * 0.04),
            unit: 'kg',
            reason: `Dùng đóng cốp pha và giàn giáo gỗ`
        })
        materials.push({
            productName: 'Que hàn điện (Hồ quang)',
            quantity: Math.ceil(area * 0.02),
            unit: 'kg',
            reason: `Hàn các mối liên kết sắt hộp và thép kết cấu`
        })

        // Sắt hộp cho Lan can & Khung bảo vệ (Estimated for urban/townhouses)
        if (style !== 'nhà_cấp_4') {
            materials.push({
                productName: 'Sắt hộp kẽm (Lan can/Khung)',
                quantity: Math.ceil(area * 1.5), // Approx kg per m2 floor for rails
                unit: 'kg',
                reason: `Ước tính cho lan can cầu thang, ban công và khung bảo vệ`
            })
        }

        // Finishing VLXD
        materials.push({
            productName: 'Bột trét tường nội/ngoại thất',
            quantity: Math.ceil((area * 3.0) / 1.2 / 40),
            unit: 'bao',
            reason: `Lớp bả phẳng bề mặt trước khi sơn`
        })
        materials.push({
            productName: 'Sơn lót kháng kiềm',
            quantity: Math.ceil((area * 3.0) / 10),
            unit: 'lít',
            reason: `Sơn bảo vệ bề mặt tường chống ẩm mốc`
        })
        materials.push({
            productName: 'Lưới mắt cáo (Chống nứt)',
            quantity: Math.ceil(area * 0.6),
            unit: 'm',
            reason: `Gia cố các góc tường và vị trí tiếp giáp đà - tường`
        })
        materials.push({
            productName: 'Phụ gia chống thấm (Sika/Waterproofing)',
            quantity: Math.ceil(area * 0.1),
            unit: 'kg',
            reason: `Dùng cho khu vực ban công, sân thượng và toilet`
        })

        // ROOFING SYSTEM
        if (_roofType === 'mái_thái') {
            materials.push({
                productName: 'Ngói lợp (Mái thái)',
                quantity: Math.ceil(area * 10),
                unit: 'viên',
                reason: `Ước tính số lượng ngói dựa trên diện tích sàn (10 viên/m2)`
            })
            materials.push({
                productName: 'Sắt hộp mạ kẽm (Xà gồ mái)',
                quantity: Math.ceil(area * 4.5), // Approx kg/m2 floor for roof frame
                unit: 'kg',
                reason: `Hệ khung kèo, xà gồ thép cho mái lợp ngói`
            })
            materials.push({
                productName: 'Vít bắn ngói/tôn',
                quantity: 1,
                unit: 'hộp',
                reason: `Vít chuyên dụng lắp đặt hệ mái`
            })
        } else if (_roofType === 'mái_tôn') {
            materials.push({
                productName: 'Tôn lạnh màu (Mái tôn)',
                quantity: Math.ceil(area * 1.2), // Incl. overlap
                unit: 'm',
                reason: `Tôn lợp mái và máng xối`
            })
            materials.push({
                productName: 'Sắt hộp mạ kẽm (Xà gồ mái)',
                quantity: Math.ceil(area * 3.5),
                unit: 'kg',
                reason: `Hệ xà gồ thép chịu lực cho mái tôn`
            })
            materials.push({
                productName: 'Vít bắn tôn (Ron cao su)',
                quantity: 1,
                unit: 'hộp',
                reason: `Vít bắn tôn chống dột`
            })
        }
    }
    else if (type === 'flooring') {
        const floorStd = CONSTRUCTION_STANDARDS.flooring
        materials.push({
            productName: 'Gạch lát nền 60×60cm',
            quantity: Math.ceil((area / 0.36) * floorStd.tile_wastage),
            unit: 'viên',
            reason: `Diện tích ${area.toFixed(1)} m² + 8 % hao hụt thi công`
        })
        materials.push({
            productName: 'Cát vàng (Cán nền)',
            quantity: Number((area * floorStd.sand_leveling_m3_m2).toFixed(1)),
            unit: 'm³',
            reason: `Lớp cát đệm cán nền dày ~4cm`
        })
        materials.push({
            productName: 'Xi măng dán gạch/leveling',
            quantity: Math.ceil((area * floorStd.cement_leveling_kg_m2) / 50),
            unit: 'bao',
            reason: `Lớp vữa lót / dán gạch(${floorStd.cement_leveling_kg_m2}kg / m²)`
        })
        materials.push({
            productName: 'Keo chà ron',
            quantity: Math.ceil(area * floorStd.grout_kg_m2),
            unit: 'kg',
            reason: `Định mức ~${floorStd.grout_kg_m2} kg / m² cho mạch gạch`
        })
    } else if (type === 'painting') {
        const paintStd = CONSTRUCTION_STANDARDS.painting
        const wallArea = area * 3.0 // Rough estimated wall area ratio to floor
        materials.push({
            productName: 'Sơn lót chống kiềm',
            quantity: Math.ceil(wallArea / paintStd.primer_m2_per_liter),
            unit: 'lít',
            reason: `Sơn lót 1 lớp cho diện tích tường ~${wallArea.toFixed(0)} m²`
        })
        materials.push({
            productName: 'Sơn phủ màu nội thất',
            quantity: Math.ceil(wallArea / paintStd.topcoat_m2_per_liter),
            unit: 'lít',
            reason: `Sơn phủ 2 lớp cho diện tích tường ~${wallArea.toFixed(0)} m²`
        })
        materials.push({
            productName: 'Bột trét tường (Putty)',
            quantity: Math.ceil(wallArea / paintStd.putty_m2_per_kg),
            unit: 'kg',
            reason: `Lớp bả hoàn thiện bề mặt tường`
        })
    }

    return materials
}

async function enrichMaterialsWithProducts(materials: MaterialEstimate[]): Promise<MaterialEstimate[]> {
    const productMap = new Map<string, MaterialEstimate>()

    // Parallelize database lookups for significant speedup
    const enrichedResults = await Promise.all(materials.map(async (m) => {
        let searchName = m.productName.split('(')[0].trim()
        let excludeKeywords: string[] = []

        // Special mapping for more specific matching
        if (m.productName.includes('1×2')) searchName = '1×2'
        if (m.productName.includes('4×6')) searchName = '4×6'
        if (m.productName.toLowerCase().includes('xi măng')) searchName = 'Xi măng'
        if (m.productName.toLowerCase().includes('thép cuộn')) searchName = 'Thép cuộn'
        if (m.productName.toLowerCase().includes('thép thanh')) searchName = 'Thép thanh'
        if (m.productName.toLowerCase().includes('sắt hộp')) searchName = 'Sắt hộp'
        if (m.productName.toLowerCase().includes('tôn')) searchName = 'Tôn'
        if (m.productName.toLowerCase().includes('thép') && !searchName.includes('thanh') && !searchName.includes('cuộn')) searchName = 'Thép'
        if (m.productName.toLowerCase().includes('gạch ống')) searchName = 'Gạch ống'
        if (m.productName.toLowerCase().includes('gạch đinh')) searchName = 'Gạch đinh'

        let product = await prisma.product.findFirst({
            where: {
                name: { contains: searchName, mode: 'insensitive' },
                isActive: true,
                NOT: excludeKeywords.map(k => ({
                    name: { contains: k, mode: 'insensitive' }
                }))
            },
            orderBy: { price: 'asc' }
        })

        // Fallback for more general keywords if no specific match found
        if (!product) {
            const firstWord = m.productName.split(' ')[0]
            product = await prisma.product.findFirst({
                where: {
                    name: { contains: firstWord, mode: 'insensitive' },
                    isActive: true,
                    NOT: excludeKeywords.map(k => ({
                        name: { contains: k, mode: 'insensitive' }
                    }))
                },
                orderBy: { price: 'asc' }
            })
        }

        return { material: m, product }
    }))

    for (const { material: m, product } of enrichedResults) {
        const key = product ? product.id : m.productName
        const existing = productMap.get(key)

        // Unit Conversion Logic
        let finalQuantity = m.quantity
        if (product && m.unit !== product.unit) {
            // Ton to Kg
            if (m.unit === 'tấn' && product.unit?.toLowerCase() === 'kg') {
                finalQuantity = m.quantity * 1000
            }
            // Kg to Ton
            else if (m.unit?.toLowerCase() === 'kg' && product.unit === 'tấn') {
                finalQuantity = m.quantity / 1000
            }
            // Liter to ml etc. (optional, but good for base construction)
        }

        if (existing) {
            existing.quantity += finalQuantity
            if (!existing.reason.includes(m.reason.split('(')[0].trim())) {
                existing.reason += ` & ${m.reason} `
            }
        } else {
            if (product) {
                productMap.set(key, {
                    ...m,
                    productId: product.id,
                    productName: product.name,
                    originalName: m.productName,
                    quantity: finalQuantity,
                    price: product.price,
                    unit: product.unit,
                    isInStore: true
                })
            } else {
                // Find market price fallback for items NOT in store
                let fallbackPrice = 0
                const lowerName = m.productName.toLowerCase()
                for (const [markeyKey, val] of Object.entries(MARKET_PRICES)) {
                    if (lowerName.includes(markeyKey)) {
                        fallbackPrice = val.price
                        break
                    }
                }

                productMap.set(key, {
                    ...m,
                    originalName: m.productName,
                    price: fallbackPrice,
                    isInStore: false
                })
            }
        }
    }

    // Final Rounding Pass to avoid 7.1999999999
    const result = Array.from(productMap.values()).map(m => {
        // Round based on unit
        if (['viên', 'bao', 'máy', 'bộ', 'mét', 'kg'].includes(m.unit)) {
            m.quantity = Math.ceil(m.quantity)
        } else {
            // Cubic meters (m3) and Tons (tấn) round to 1 decimal
            m.quantity = Math.round(m.quantity * 10) / 10
        }
        return m
    })

    return result
}

export async function estimateFromText(
    description: string,
    projectType: 'general' | 'flooring' | 'painting' | 'tiling' = 'general',

    birthYear?: string,
    houseDirection?: string
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
        let fengShuiPrompt = ''
        if (birthYear || houseDirection) {
            fengShuiPrompt = `
        5. FENG SHUI ANALYSIS:
        - User Info: Birth Year: ${birthYear || 'N/A'}, House Direction: ${houseDirection || 'N/A'}
        - Determine the user's "Mệnh" (Fate) based on birth year.
            - Analyze compatibility with the house direction(if provided).
   - Suggest 3 specific Colors and Material types(e.g., Gỗ, Đá, Kim loại) that are "Tương sinh" or "Tương hợp".
   - Return this advice as a SHORT string in "fengShuiAdvice" field(Vietnamese).
`
        }

        const aiPrompt = `
Bạn là một kỹ sư xây dựng chuyên nghiệp Việt Nam và Chuyên gia Phong thuỷ.Phân tích mô tả dự án sau và trích xuất thông tin:

Mô tả: "${description}"

Hãy xác định:
        1. Các phòng / khu vực và kích thước(dài x rộng), ước lượng nếu không rõ.
2. Loại nhà: "nhà_cấp_4", "nhà_phố", hoặc "biệt_thự"(mặc định là nhà_cấp_4 nếu không rõ).
3. Loại mái: "bê_tông", "mái_thái", hoặc "mái_tôn".
4. Ước tính tổng chu vi tường(m).
            ${fengShuiPrompt}

VÍ DỤ đầu vào: "lát sân 6x8m, phòng khách 5x4m"
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
                                        "fengShuiAdvice": "Mệnh Thổ hợp màu nâu, vàng. Hướng Đông Nam kỵ..."
        }

CHỈ trả về JSON, không có text giải thích:
        `
        const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3-flash']
        let lastError: Error | null = null

        let responseText = ''

        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName })
                const result = (await withRetry(() => model.generateContent(aiPrompt)))
                responseText = result.response.text()

                if (responseText) break
            } catch (err) {
                console.error(`Model ${modelName} failed, trying fallback...`, err)
                lastError = err instanceof Error ? err : new Error(String(err))
                continue
            }
        }

        if (!responseText) throw lastError || new Error('All models failed')
        const cleanedText = responseText.replace(/```json | ```/g, '').trim()

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
            data = JSON.parse(cleanedText)
        } catch {
            // Fallback: Try to extract dimensions from description manually
            const dimensionRegex = /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*m?/g
            const matches = [...description.matchAll(dimensionRegex)]

            if (matches.length > 0) {
                const rooms = matches.map((match, idx) => ({
                    name: `Khu vực ${idx + 1} `,
                    length: parseFloat(match[1].replace(',', '.')),
                    width: parseFloat(match[2].replace(',', '.')),
                }))

                const totalArea = rooms.reduce((sum, r) => sum + (r.length * r.width), 0)

                data = {
                    buildingStyle: 'nhà_cấp_4',
                    roofType: 'bê_tông',
                    rooms,
                    totalArea,
                    wallPerimeter: Math.sqrt(totalArea) * 4,
                    confidence: 0.6,
                    notes: 'Phân tích từ regex (AI không trả về JSON hợp lệ)',
                    fengShuiAdvice: birthYear ? 'Vui lòng thử lại để nhận tư vấn phong thủy chi tiết.' : undefined
                }
            } else {
                throw new Error('Không thể xác định kích thước từ mô tả. Vui lòng nhập rõ hơn, ví dụ: "phòng 5x4m"')
            }
        }

        const rooms: RoomDimension[] = (data.rooms || []).map((r: { name: string; length: number; width: number }) => ({

            ...r,
            area: r.length * r.width,
            height: 3.2
        }))
        const totalArea = data.totalArea || rooms.reduce((sum, r) => sum + r.area, 0)

        if (totalArea <= 0) {
            return {
                success: false,
                projectType,
                rooms: [],
                totalArea: 0,
                materials: [],
                totalEstimatedCost: 0,
                confidence: 0,
                validationStatus: 'warning',
                error: 'Không thể xác định diện tích. Vui lòng mô tả rõ hơn (VD: "sân 6x8m").'
            }
        }

        const materials = await calculateMaterials(
            totalArea,
            projectType,
            rooms,
            data.buildingStyle || 'nhà_cấp_4',
            data.wallPerimeter || (totalArea * 0.8),
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
            fengShuiAdvice: data.fengShuiAdvice
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi khi phân tích mô tả.'
        console.error('Text estimator error:', error)

        return {
            success: false,
            projectType,
            rooms: [],
            totalArea: 0,
            materials: [],
            totalEstimatedCost: 0,
            confidence: 0,
            validationStatus: 'warning',
            error: errorMessage

        }
    }
}
