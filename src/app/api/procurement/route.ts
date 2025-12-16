/**
 * Procurement API - SME Feature 2
 * 
 * Endpoints:
 * - GET /api/procurement/suggestions - Gợi ý nhập hàng
 * - POST /api/procurement/request - Tạo yêu cầu nhập hàng
 * - PUT /api/procurement/request - Duyệt/Chuyển đổi yêu cầu
 * - GET /api/procurement/suppliers - So sánh nhà cung cấp
 */

import { NextRequest, NextResponse } from 'next/server'
import { procurementService } from '@/lib/procurement-service'
import { prisma } from '@/lib/prisma'

// GET /api/procurement
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const productId = searchParams.get('productId')
        const quantity = searchParams.get('quantity')

        if (type === 'suggestions') {
            // Danh sách gợi ý nhập hàng
            const suggestions = await procurementService.generatePurchaseSuggestions()
            return NextResponse.json(suggestions)
        }

        if (type === 'suppliers' && productId) {
            // So sánh nhà cung cấp cho sản phẩm
            const qty = quantity ? parseFloat(quantity) : 100
            const suppliers = await procurementService.compareSuppliers(productId, qty)
            return NextResponse.json(suppliers)
        }

        if (type === 'requests') {
            // Danh sách yêu cầu nhập hàng
            const status = searchParams.get('status')
            const requests = await prisma.purchaseRequest.findMany({
                where: status ? { status: status as any } : undefined,
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' }
                ]
            })

            // Lấy thêm thông tin sản phẩm và NCC
            const enrichedRequests = await Promise.all(
                requests.map(async (req) => {
                    const product = await prisma.product.findUnique({
                        where: { id: req.productId },
                        select: { name: true, sku: true }
                    })
                    const supplier = req.supplierId ? await prisma.supplier.findUnique({
                        where: { id: req.supplierId },
                        select: { name: true }
                    }) : null

                    return {
                        ...req,
                        productName: product?.name,
                        productSku: product?.sku,
                        supplierName: supplier?.name
                    }
                })
            )

            return NextResponse.json(enrichedRequests)
        }

        if (type === 'supplier-products') {
            // Danh sách sản phẩm của nhà cung cấp
            const supplierId = searchParams.get('supplierId')
            const where = supplierId
                ? { supplierId, isActive: true }
                : { isActive: true }

            const supplierProducts = await prisma.supplierProduct.findMany({
                where,
                include: {
                    supplier: {
                        select: { name: true }
                    }
                }
            })

            // Lấy thêm tên sản phẩm
            const enriched = await Promise.all(
                supplierProducts.map(async (sp) => {
                    const product = await prisma.product.findUnique({
                        where: { id: sp.productId },
                        select: { name: true, sku: true }
                    })
                    return {
                        ...sp,
                        productName: product?.name,
                        productSku: product?.sku
                    }
                })
            )

            return NextResponse.json(enriched)
        }

        return NextResponse.json(
            { error: 'Type không hợp lệ. Sử dụng: suggestions, suppliers, requests, supplier-products' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Procurement GET API error:', error)
        return NextResponse.json(
            { error: 'Lỗi xử lý yêu cầu' },
            { status: 500 }
        )
    }
}

// POST /api/procurement - Tạo yêu cầu nhập hàng hoặc supplier product
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { action } = body

        if (action === 'create-request') {
            const { productId, requestedQty, supplierId, notes } = body

            if (!productId || !requestedQty) {
                return NextResponse.json(
                    { error: 'Thiếu productId hoặc requestedQty' },
                    { status: 400 }
                )
            }

            const request = await procurementService.createPurchaseRequest(
                productId,
                requestedQty,
                supplierId,
                'MANUAL',
                notes
            )

            return NextResponse.json(request)
        }

        if (action === 'auto-generate') {
            // Tự động tạo yêu cầu cho các sản phẩm thiếu hàng
            const created = await procurementService.autoGeneratePurchaseRequests()
            return NextResponse.json({ created, message: `Đã tạo ${created} yêu cầu nhập hàng` })
        }

        if (action === 'add-supplier-product') {
            // Thêm liên kết NCC - Sản phẩm
            const { supplierId, productId, unitPrice, leadTimeDays, minOrderQty, isPreferred } = body

            if (!supplierId || !productId || !unitPrice) {
                return NextResponse.json(
                    { error: 'Thiếu thông tin nhà cung cấp hoặc sản phẩm' },
                    { status: 400 }
                )
            }

            const supplierProduct = await prisma.supplierProduct.upsert({
                where: {
                    supplierId_productId: { supplierId, productId }
                },
                create: {
                    supplierId,
                    productId,
                    unitPrice,
                    leadTimeDays: leadTimeDays || 3,
                    minOrderQty: minOrderQty || 1,
                    isPreferred: isPreferred || false
                },
                update: {
                    unitPrice,
                    leadTimeDays,
                    minOrderQty,
                    isPreferred
                }
            })

            return NextResponse.json(supplierProduct)
        }

        return NextResponse.json(
            { error: 'Action không hợp lệ' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Procurement POST API error:', error)
        return NextResponse.json(
            { error: 'Lỗi xử lý yêu cầu' },
            { status: 500 }
        )
    }
}

// PUT /api/procurement - Duyệt hoặc chuyển đổi yêu cầu
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { action, requestId, approvedBy } = body

        if (action === 'approve') {
            if (!requestId || !approvedBy) {
                return NextResponse.json(
                    { error: 'Thiếu requestId hoặc approvedBy' },
                    { status: 400 }
                )
            }

            const request = await procurementService.approveRequest(requestId, approvedBy)
            return NextResponse.json(request)
        }

        if (action === 'reject') {
            if (!requestId) {
                return NextResponse.json(
                    { error: 'Thiếu requestId' },
                    { status: 400 }
                )
            }

            const request = await prisma.purchaseRequest.update({
                where: { id: requestId },
                data: { status: 'REJECTED' }
            })

            return NextResponse.json(request)
        }

        if (action === 'convert-to-po') {
            if (!requestId || !approvedBy) {
                return NextResponse.json(
                    { error: 'Thiếu requestId hoặc createdBy' },
                    { status: 400 }
                )
            }

            const po = await procurementService.convertToPurchaseOrder(requestId, approvedBy)
            return NextResponse.json(po)
        }

        if (action === 'update-reorder-points') {
            // Cập nhật điểm đặt hàng cho tất cả sản phẩm
            const updated = await procurementService.updateAllReorderPoints()
            return NextResponse.json({ updated, message: `Đã cập nhật ${updated} sản phẩm` })
        }

        return NextResponse.json(
            { error: 'Action không hợp lệ' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Procurement PUT API error:', error)
        return NextResponse.json(
            { error: 'Lỗi xử lý yêu cầu' },
            { status: 500 }
        )
    }
}
