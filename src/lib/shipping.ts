/**
 * Shipping Calculator Module
 * Tính phí vận chuyển tự động dựa trên khoảng cách (Haversine formula)
 * 
 * Phương án A: Haversine (miễn phí, serverside, < 1ms)
 * - Tính khoảng cách đường chim bay × 1.3 (hệ số đường thực tế)
 * - Tra bảng giá theo bậc khoảng cách
 * - Áp dụng chính sách miễn phí (đơn > 5 triệu hoặc ≤ 5km)
 */

// ═══════════════════════════════════════════════════════════
// STORE COORDINATES (Cửa hàng Vật liệu Xây dựng Thành Tài)
// B34, tổ 29, KP5, Phường Trấn Biên, TP Biên Hòa, Đồng Nai
// ═══════════════════════════════════════════════════════════

export const STORE_LOCATION = {
    lat: parseFloat(process.env.STORE_LAT || '10.9573'),
    lng: parseFloat(process.env.STORE_LNG || '106.8428'),
    name: 'Cửa hàng VLXD Thành Tài',
    address: 'B34, tổ 29, KP5, P. Trấn Biên, TP. Biên Hòa, Đồng Nai'
}

// ═══════════════════════════════════════════════════════════
// BẢNG GIÁ VẬN CHUYỂN (Shipping Rate Table)
// ═══════════════════════════════════════════════════════════

export interface ShippingTier {
    minKm: number      // Khoảng cách tối thiểu (km)
    maxKm: number      // Khoảng cách tối đa (km), Infinity cho bậc cuối
    fee: number         // Phí (VNĐ), -1 = liên hệ
    label: string       // Mô tả
}

export const SHIPPING_TIERS: ShippingTier[] = [
    { minKm: 0,   maxKm: 5,    fee: 0,       label: 'Nội thành gần — Miễn phí' },
    { minKm: 5,   maxKm: 10,   fee: 30000,   label: 'Nội thành xa' },
    { minKm: 10,  maxKm: 20,   fee: 50000,   label: 'Ngoại thành gần' },
    { minKm: 20,  maxKm: 40,   fee: 100000,  label: 'Ngoại thành' },
    { minKm: 40,  maxKm: 70,   fee: 200000,  label: 'Liên huyện' },
    { minKm: 70,  maxKm: Infinity, fee: -1,  label: 'Liên tỉnh — Liên hệ' },
]

// Chính sách miễn phí vận chuyển
export const FREE_SHIPPING_THRESHOLD = 5_000_000  // Đơn > 5 triệu → miễn phí
export const FREE_SHIPPING_DISTANCE = 5           // ≤ 5km → miễn phí

// Hệ số đường thực tế (đường chim bay × 1.3 ≈ đường đi thực tế)
const ROAD_FACTOR = 1.3

// ═══════════════════════════════════════════════════════════
// HAVERSINE FORMULA
// ═══════════════════════════════════════════════════════════

/**
 * Tính khoảng cách giữa 2 điểm GPS bằng công thức Haversine
 * @returns Khoảng cách tính bằng km (đường chim bay)
 */
export function haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371 // Bán kính Trái Đất (km)

    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
}

// ═══════════════════════════════════════════════════════════
// SHIPPING FEE CALCULATOR
// ═══════════════════════════════════════════════════════════

export interface ShippingCalculation {
    distanceKm: number           // Khoảng cách thực tế ước tính (km)
    distanceStraight: number     // Khoảng cách đường chim bay (km)
    baseFee: number              // Phí cơ bản theo bậc (VNĐ)
    finalFee: number             // Phí sau khi áp chính sách (VNĐ)
    isFreeShipping: boolean      // Có miễn phí không
    freeReason?: string          // Lý do miễn phí
    tier: ShippingTier           // Bậc giá được áp dụng
    requiresContact: boolean     // Cần liên hệ (quá xa)
}

/**
 * Tính phí vận chuyển từ cửa hàng đến công trình
 * @param destLat Vĩ độ điểm giao
 * @param destLng Kinh độ điểm giao
 * @param orderTotal Tổng tiền đơn hàng (để check miễn phí)
 */
export function calculateShippingFee(
    destLat: number,
    destLng: number,
    orderTotal: number = 0
): ShippingCalculation {
    // 1. Tính khoảng cách
    const distanceStraight = haversineDistance(
        STORE_LOCATION.lat, STORE_LOCATION.lng,
        destLat, destLng
    )

    // 2. Ước tính khoảng cách đường thực tế
    const distanceKm = Math.round(distanceStraight * ROAD_FACTOR * 10) / 10

    // 3. Tìm bậc giá phù hợp
    const tier = SHIPPING_TIERS.find(t => distanceKm >= t.minKm && distanceKm < t.maxKm)
        || SHIPPING_TIERS[SHIPPING_TIERS.length - 1]

    // 4. Check liên hệ
    if (tier.fee === -1) {
        return {
            distanceKm,
            distanceStraight: Math.round(distanceStraight * 10) / 10,
            baseFee: 0,
            finalFee: 0,
            isFreeShipping: false,
            tier,
            requiresContact: true
        }
    }

    const baseFee = tier.fee

    // 5. Check chính sách miễn phí
    let isFreeShipping = false
    let freeReason: string | undefined

    if (distanceKm <= FREE_SHIPPING_DISTANCE) {
        isFreeShipping = true
        freeReason = `Khoảng cách ≤ ${FREE_SHIPPING_DISTANCE}km`
    } else if (orderTotal >= FREE_SHIPPING_THRESHOLD) {
        isFreeShipping = true
        freeReason = `Đơn hàng ≥ ${(FREE_SHIPPING_THRESHOLD / 1_000_000).toFixed(0)} triệu`
    }

    return {
        distanceKm,
        distanceStraight: Math.round(distanceStraight * 10) / 10,
        baseFee,
        finalFee: isFreeShipping ? 0 : baseFee,
        isFreeShipping,
        freeReason,
        tier,
        requiresContact: false
    }
}

/**
 * Lấy bảng giá vận chuyển (cho UI hiển thị)
 */
export function getShippingRateTable(): ShippingTier[] {
    return SHIPPING_TIERS
}

/**
 * Format phí vận chuyển cho hiển thị
 */
export function formatShippingFee(fee: number): string {
    if (fee === 0) return 'Miễn phí'
    if (fee === -1) return 'Liên hệ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fee)
}
