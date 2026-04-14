/**
 * Estimator shared types, constants, and construction standards
 * Based on TCVN / Thông tư 12/2021/TT-BXD, 09/2024/TT-BXD, 01/2025/TT-BXD
 */

export interface ConstructionStandard {
    cement: number
    sand_build: number
    sand_fill: number
    stone_1x2: number
    stone_4x6: number
    bricks: number
    steel: number
    electric_pipes: number
    water_pipes: number
}

export interface ConstructionStandards {
    nhà_cấp_4: ConstructionStandard
    nhà_phố: ConstructionStandard
    biệt_thự: ConstructionStandard
    flooring: {
        cement_leveling_kg_m2: number
        sand_leveling_m3_m2: number
        tile_wastage: number
        grout_kg_m2: number
    }
    painting: {
        primer_m2_per_liter: number
        topcoat_m2_per_liter: number
        putty_m2_per_kg: number
    }
    [key: string]: ConstructionStandard | ConstructionStandards['flooring'] | ConstructionStandards['painting']
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
    originalName?: string
    productId?: string
    sku?: string
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
    wallPerimeter?: number
    roofType?: string
}

// ─── TCVN Construction material standards ─────────────────────────────────────
// Empirical norms for Vietnamese residential construction (Suất định mức m2 sàn)
export const CONSTRUCTION_STANDARDS: ConstructionStandards = {
    nhà_cấp_4: {
        cement: 90,         // kg/m2 floor
        sand_build: 0.25,   // m3/m2
        sand_fill: 0.12,    // m3/m2
        stone_1x2: 0.20,    // m3/m2
        stone_4x6: 0.08,    // m3/m2
        bricks: 120,        // viên/m2
        steel: 50,          // kg/m2
        electric_pipes: 2.5,
        water_pipes: 1.8,
    },
    nhà_phố: {
        cement: 140,
        sand_build: 0.45,
        sand_fill: 0.15,
        stone_1x2: 0.35,
        stone_4x6: 0.12,
        bricks: 180,
        steel: 110,
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
        cement_leveling_kg_m2: 12,
        sand_leveling_m3_m2: 0.04,
        tile_wastage: 1.08,
        grout_kg_m2: 0.8,
    },
    painting: {
        primer_m2_per_liter: 10,
        topcoat_m2_per_liter: 5,
        putty_m2_per_kg: 1.2,
    },
}

// Market Price Fallback (VND) for items NOT in the store inventory
export const MARKET_PRICES: Record<string, { price: number; unit: string }> = {
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
    'sắt hộp': { price: 21500, unit: 'kg' },
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
    'gạch lát nền': { price: 220000, unit: 'm²' },
}

// Simple exponential-backoff retry helper
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn()
        } catch (e) {
            if (i === maxRetries - 1) throw e
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
        }
    }
    throw new Error('withRetry: exhausted retries')
}

// Reusable error result builder
export function errorResult(projectType: string, message: string): EstimatorResult {
    return {
        success: false,
        projectType,
        rooms: [],
        totalArea: 0,
        materials: [],
        totalEstimatedCost: 0,
        confidence: 0,
        validationStatus: 'warning',
        error: message,
    }
}
