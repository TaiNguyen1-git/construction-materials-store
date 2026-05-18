/**
 * Product Enricher — matches calculated materials to real DB products
 * and fills in market price fallbacks for items not in inventory.
 */

import { prisma } from '@/lib/prisma'
import { MaterialEstimate, MARKET_PRICES } from './estimator-types'

/** Maps a material name to a specific DB search keyword */
function getSearchName(productName: string): string {
    const lower = productName.toLowerCase()
    if (productName.includes('1×2')) return '1×2'
    if (productName.includes('4×6')) return '4×6'
    if (lower.includes('xi măng')) return 'Xi măng'
    if (lower.includes('thép cuộn')) return 'Thép cuộn'
    if (lower.includes('thép thanh')) return 'Thép thanh'
    if (lower.includes('sắt hộp')) return 'Sắt hộp'
    if (lower.includes('tôn')) return 'Tôn'
    if (lower.includes('gạch ống')) return 'Gạch ống'
    if (lower.includes('gạch đinh')) return 'Gạch đinh'
    return productName.split('(')[0].trim()
}

/** Convert units when a DB product uses a different unit than the estimate */
function convertUnit(quantity: number, fromUnit: string | undefined, toUnit: string | undefined): number {
    const f = fromUnit?.toLowerCase()
    const t = toUnit?.toLowerCase()
    if (!f || !t || f === t) return quantity

    // Steel conversions (tấn <-> kg, cây)
    if (f === 'tấn' && t === 'kg') return quantity * 1000
    if (f === 'kg' && t === 'tấn') return quantity / 1000
    if (f === 'tấn' && t === 'cây') return quantity * 135  // 1 ton has ~135 steel bars (Phi 10/12 average)
    if (f === 'cây' && t === 'tấn') return quantity / 135
    if (f === 'kg' && t === 'cây') return quantity / 7.2    // 1 Phi 10 bar weighs ~7.2kg
    if (f === 'cây' && t === 'kg') return quantity * 7.2

    // Sand conversions (m³ <-> kg, bao)
    if (f === 'm³' && t === 'kg') return quantity * 1500   // 1 m3 dry sand weighs ~1500kg
    if (f === 'kg' && t === 'm³') return quantity / 1500
    if (f === 'm³' && t === 'bao') return quantity * 30    // 1 m3 of sand = ~30 bags of 50kg
    if (f === 'bao' && t === 'm³') return quantity / 30

    // Cement conversions (bao <-> kg)
    if (f === 'bao' && t === 'kg') return quantity * 50    // 1 bag = 50kg
    if (f === 'kg' && t === 'bao') return quantity / 50

    return quantity
}

/** Round quantities based on unit type */
function roundQuantity(quantity: number, unit: string): number {
    if (['viên', 'bao', 'máy', 'bộ', 'mét', 'kg', 'cây'].includes(unit.toLowerCase())) {
        return Math.ceil(quantity)
    }
    return Math.round(quantity * 10) / 10 // m³, tấn → 1 decimal
}

/**
 * Enriches a list of calculated materials with:
 * 1. Real product IDs and prices from the database
 * 2. Market price fallbacks for items not in inventory
 * 3. Unit conversion and quantity deduplication
 */
export async function enrichMaterialsWithProducts(
    materials: MaterialEstimate[],
    budgetTier: 'economy' | 'standard' | 'premium' = 'standard'
): Promise<MaterialEstimate[]> {
    const productMap = new Map<string, MaterialEstimate>()

    // Parallel DB lookups
    const enrichedResults = await Promise.all(materials.map(async (m) => {
        const searchName = getSearchName(m.productName)

        // First: specific keyword match with price ordering based on tier
        let product = await prisma.product.findFirst({
            where: {
                name: { contains: searchName, mode: 'insensitive' },
                isActive: true,
            },
            orderBy: { price: budgetTier === 'premium' ? 'desc' : (budgetTier === 'economy' ? 'asc' : 'asc') }
        })

        // Fallback: first word match
        if (!product) {
            const firstWord = m.productName.split(' ')[0]
            product = await prisma.product.findFirst({
                where: {
                    name: { contains: firstWord, mode: 'insensitive' },
                    isActive: true,
                },
                orderBy: { price: budgetTier === 'premium' ? 'desc' : 'asc' }
            })
        }

        return { material: m, product }
    }))

    // Merge results (deduplicating by product ID or name)
    for (const { material: m, product } of enrichedResults) {
        const key = product ? product.id : m.productName
        const existing = productMap.get(key)
        const finalQty = product
            ? convertUnit(m.quantity, m.unit, product.unit)
            : m.quantity

        // Pre-calculate market fallback price just in case DB price is missing or 0
        let fallbackPrice = 0
        const lowerName = m.productName.toLowerCase()
        const sortedMarketKeys = Object.keys(MARKET_PRICES).sort((a, b) => b.length - a.length)
        
        for (const key of sortedMarketKeys) {
            const fallback = MARKET_PRICES[key]
            if (lowerName.includes(key)) {
                const targetUnit = product ? product.unit : m.unit
                const conversionFactor = convertUnit(1, fallback.unit, targetUnit)
                fallbackPrice = fallback.price / (conversionFactor || 1)
                break
            }
        }

        if (existing) {
            existing.quantity += finalQty
            const newReason = m.reason.split('(')[0].trim()
            if (!existing.reason.includes(newReason)) {
                existing.reason += ` & ${m.reason}`
            }
        } else {
            if (product) {
                productMap.set(key, {
                    ...m,
                    productId: product.id,
                    productName: product.name,
                    sku: product.sku,
                    originalName: m.productName,
                    quantity: finalQty,
                    price: product.price || fallbackPrice || 0, // Fallback to market price if product has 0 or null price
                    unit: product.unit,
                    isInStore: true,
                })
            } else {
                productMap.set(key, {
                    ...m,
                    originalName: m.productName,
                    price: fallbackPrice,
                    isInStore: false,
                })
            }
        }
    }

    // Final rounding pass
    return Array.from(productMap.values()).map(m => ({
        ...m,
        quantity: roundQuantity(m.quantity, m.unit),
    }))
}
