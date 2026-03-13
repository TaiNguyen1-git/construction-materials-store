/**
 * API: POST /api/shipping/calculate
 * Tính phí vận chuyển tự động dựa trên toạ độ GPS
 * 
 * Body: { lat: number, lng: number, orderTotal?: number }
 * Response: ShippingCalculation
 */

import { NextRequest, NextResponse } from 'next/server'
import {
    calculateShippingFee,
    getShippingRateTable,
    STORE_LOCATION,
    FREE_SHIPPING_THRESHOLD,
    FREE_SHIPPING_DISTANCE
} from '@/lib/shipping'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { lat, lng, orderTotal } = body

        if (lat == null || lng == null) {
            return NextResponse.json({
                success: false,
                message: 'Thiếu toạ độ GPS (lat, lng)'
            }, { status: 400 })
        }

        // Validate coordinates
        if (typeof lat !== 'number' || typeof lng !== 'number' ||
            lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return NextResponse.json({
                success: false,
                message: 'Toạ độ GPS không hợp lệ'
            }, { status: 400 })
        }

        const result = calculateShippingFee(lat, lng, orderTotal || 0)

        return NextResponse.json({
            success: true,
            data: result
        })

    } catch (error: any) {
        console.error('Shipping calculate error:', error)
        return NextResponse.json({
            success: false,
            message: 'Lỗi tính phí vận chuyển'
        }, { status: 500 })
    }
}

/**
 * GET /api/shipping/calculate
 * Trả về bảng giá vận chuyển + thông tin cửa hàng
 */
export async function GET() {
    return NextResponse.json({
        success: true,
        data: {
            storeLocation: STORE_LOCATION,
            rateTable: getShippingRateTable(),
            freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
            freeShippingDistance: FREE_SHIPPING_DISTANCE
        }
    })
}
