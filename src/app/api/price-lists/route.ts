/**
 * Price Lists API - SME Feature 3
 * 
 * Endpoints:
 * - GET /api/price-lists - Danh sách bảng giá
 * - POST /api/price-lists - Tạo/Cập nhật bảng giá
 * - GET /api/price-lists/calculate - Tính giá cho sản phẩm
 */

import { NextRequest, NextResponse } from 'next/server'
import { pricingEngine } from '@/lib/pricing-engine'
import { prisma } from '@/lib/prisma'

// GET /api/price-lists
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const productId = searchParams.get('productId')
        const customerId = searchParams.get('customerId')
        const quantity = searchParams.get('quantity')

        if (type === 'calculate' && productId) {
            // Tính giá cho sản phẩm
            const qty = quantity ? parseFloat(quantity) : 1
            const price = await pricingEngine.getEffectivePrice(
                productId,
                customerId || undefined,
                qty
            )
            return NextResponse.json(price)
        }

        if (type === 'calculate-order' && customerId) {
            // Tính giá cho nhiều sản phẩm
            const itemsParam = searchParams.get('items')
            if (!itemsParam) {
                return NextResponse.json(
                    { error: 'Thiếu items' },
                    { status: 400 }
                )
            }

            const items = JSON.parse(itemsParam)
            const prices = await pricingEngine.getPricesForOrder(customerId, items)
            return NextResponse.json(prices)
        }

        // Lấy danh sách bảng giá
        const priceLists = await prisma.priceList.findMany({
            orderBy: { priority: 'desc' }
        })

        return NextResponse.json(priceLists)
    } catch (error) {
        console.error('Price Lists GET API error:', error)
        return NextResponse.json(
            { error: 'Lỗi xử lý yêu cầu' },
            { status: 500 }
        )
    }
}

// POST /api/price-lists - Tạo hoặc cập nhật bảng giá
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { action } = body

        if (action === 'seed-defaults') {
            // Tạo bảng giá mặc định
            const count = await pricingEngine.seedDefaultPriceLists()
            return NextResponse.json({
                success: true,
                message: `Đã tạo ${count} bảng giá mặc định`
            })
        }

        // Tạo/Cập nhật bảng giá
        const { code, name, description, discountPercent, customerTypes, priority, validFrom, validTo } = body

        if (!code || !name || discountPercent === undefined || !customerTypes?.length) {
            return NextResponse.json(
                { error: 'Thiếu thông tin bắt buộc: code, name, discountPercent, customerTypes' },
                { status: 400 }
            )
        }

        const priceList = await pricingEngine.upsertPriceList({
            code,
            name,
            description,
            discountPercent,
            customerTypes,
            priority,
            validFrom: validFrom ? new Date(validFrom) : undefined,
            validTo: validTo ? new Date(validTo) : undefined
        })

        return NextResponse.json(priceList)
    } catch (error) {
        console.error('Price Lists POST API error:', error)
        return NextResponse.json(
            { error: 'Lỗi xử lý yêu cầu' },
            { status: 500 }
        )
    }
}

// PUT /api/price-lists - Cập nhật trạng thái
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, isActive, priority } = body

        if (!id) {
            return NextResponse.json(
                { error: 'Thiếu id' },
                { status: 400 }
            )
        }

        const priceList = await prisma.priceList.update({
            where: { id },
            data: {
                isActive: isActive !== undefined ? isActive : undefined,
                priority: priority !== undefined ? priority : undefined
            }
        })

        return NextResponse.json(priceList)
    } catch (error) {
        console.error('Price Lists PUT API error:', error)
        return NextResponse.json(
            { error: 'Lỗi xử lý yêu cầu' },
            { status: 500 }
        )
    }
}

// DELETE /api/price-lists
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Thiếu id' },
                { status: 400 }
            )
        }

        await prisma.priceList.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Price Lists DELETE API error:', error)
        return NextResponse.json(
            { error: 'Lỗi xử lý yêu cầu' },
            { status: 500 }
        )
    }
}
