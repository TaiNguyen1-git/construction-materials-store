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
            });

            const productIds = Array.from(new Set(requests.map(r => r.productId)));
            const supplierIds = Array.from(new Set(requests.map(r => r.supplierId).filter(Boolean))) as string[];

            const [products, suppliers] = await Promise.all([
                prisma.product.findMany({
                    where: { id: { in: productIds } },
                    select: { id: true, name: true, sku: true }
                }),
                prisma.supplier.findMany({
                    where: { id: { in: supplierIds } },
                    select: { id: true, name: true }
                })
            ]);

            const productMap = new Map(products.map(p => [p.id, p]));
            const supplierMap = new Map(suppliers.map(s => [s.id, s]));

            // Format cho frontend
            const enrichedRequests = requests.map((req: any) => {
                const product = productMap.get(req.productId);
                const supplier = req.supplierId ? supplierMap.get(req.supplierId) : null;
                return {
                    ...req,
                    productName: product?.name,
                    productSku: product?.sku,
                    supplierName: supplier?.name
                };
            })

            return NextResponse.json(enrichedRequests)
        }

        if (type === 'orders') {
            // Danh sách đơn đặt hàng (Purchase Orders)
            const status = searchParams.get('status')
            const orders = await prisma.purchaseOrder.findMany({
                where: status ? { status: status as any } : undefined,
                include: {
                    supplier: {
                        select: { name: true, email: true }
                    },
                    purchaseItems: {
                        include: {
                            product: {
                                select: { name: true, sku: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })
            return NextResponse.json(orders)
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

            const productIds = Array.from(new Set(supplierProducts.map(sp => sp.productId)));
            const products = await prisma.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, name: true, sku: true }
            });
            const productMap = new Map(products.map(p => [p.id, p]));

            // Format cho frontend
            const enriched = supplierProducts.map((sp: any) => {
                const product = productMap.get(sp.productId);
                return {
                    ...sp,
                    productName: product?.name,
                    productSku: product?.sku
                }
            })

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

        if (action === 'create-po') {
            const { supplierId, items, notes } = body
            if (!supplierId || !items) {
                return NextResponse.json(
                    { error: 'Thiếu supplierId hoặc items' },
                    { status: 400 }
                )
            }

            const po = await procurementService.createPurchaseOrder(
                supplierId,
                items,
                'WIZARD_AI',
                notes
            )

            return NextResponse.json(po)
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

        if (action === 'send-po') {
            const { poId } = body
            if (!poId) {
                return NextResponse.json({ error: 'Thiếu poId' }, { status: 400 })
            }

            const po = await prisma.purchaseOrder.findUnique({
                where: { id: poId },
                include: {
                    supplier: true,
                    purchaseItems: { include: { product: true } }
                }
            })

            if (!po) return NextResponse.json({ error: 'Không tìm thấy PO' }, { status: 404 })

            // Gửi mail và cập nhật trạng thái
            await sendPurchaseOrderEmail(po)
            return NextResponse.json({ success: true, message: 'Đã gửi đơn hàng' })
        }

        if (action === 'convert-to-po') {
            if (!requestId || !approvedBy) {
                return NextResponse.json(
                    { error: 'Thiếu requestId hoặc createdBy' },
                    { status: 400 }
                )
            }

            const po = await procurementService.convertToPurchaseOrder(requestId, approvedBy)

            // Auto-send email to supplier
            try {
                // Fetch full PO details with supplier email
                const fullPO = await prisma.purchaseOrder.findUnique({
                    where: { id: po.id },
                    include: {
                        supplier: true,
                        purchaseItems: {
                            include: {
                                product: true
                            }
                        }
                    }
                })

                if (fullPO) {
                    await sendPurchaseOrderEmail(fullPO)
                }
            } catch (error) {
                console.error('Error sending email for PO:', error)
            }

            return NextResponse.json(po)
        }

        if (action === 'update-reorder-points') {
            // Cập nhật điểm đặt hàng cho tất cả sản phẩm
            const updated = await procurementService.updateAllReorderPoints()
            return NextResponse.json({ updated, message: `Đã cập nhật ${updated} sản phẩm` })
        }

        if (action === 'assign-supplier') {
            const { requestId, supplierId } = body
            if (!requestId || !supplierId) {
                return NextResponse.json(
                    { error: 'Thiếu requestId hoặc supplierId' },
                    { status: 400 }
                )
            }

            // 1. Get current request details
            const currentRequest = await prisma.purchaseRequest.findUnique({
                where: { id: requestId },
                select: { productId: true, requestedQty: true }
            })

            if (!currentRequest) {
                return NextResponse.json({ error: 'Request not found' }, { status: 404 })
            }

            // 2. Find price from SupplierProduct or fallback to Product price
            let unitPrice = 0

            const supplierProduct = await prisma.supplierProduct.findUnique({
                where: {
                    supplierId_productId: {
                        supplierId,
                        productId: currentRequest.productId
                    }
                }
            })

            if (supplierProduct) {
                unitPrice = supplierProduct.unitPrice
            } else {
                // Fallback to product cost price or price
                const product = await prisma.product.findUnique({
                    where: { id: currentRequest.productId }
                })
                unitPrice = product?.costPrice || product?.price || 0
            }

            const estimatedCost = unitPrice * currentRequest.requestedQty

            // 3. Update request with supplier AND calculated cost
            const request = await prisma.purchaseRequest.update({
                where: { id: requestId },
                data: {
                    supplierId,
                    estimatedCost
                }
            })
            return NextResponse.json(request)
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

// Helper to send Purchase Order Email
async function sendPurchaseOrderEmail(fullPO: any) {
    const hardcodedOverride = "robertnick897@gmail.com";
    const recipientEmail = hardcodedOverride || process.env.PO_EMAIL_OVERRIDE || fullPO.supplier?.email;

    if (!recipientEmail) return;

    const nodemailer = require('nodemailer');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const itemsHtml = fullPO.purchaseItems.map((item: any) => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.product?.name || 'N/A'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.product?.sku || 'N/A'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.unitPrice)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${formatCurrency(item.totalPrice)}</td>
        </tr>
    `).join('')

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Đơn đặt hàng #${fullPO.orderNumber}</title>
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">🏗️ SmartBuild</h1>
                    <p style="margin: 10px 0 0; opacity: 0.9;">Đơn đặt hàng vật liệu xây dựng</p>
                </div>
                <div style="padding: 30px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                        <div>
                            <h2 style="margin: 0 0 10px; color: #333;">Đơn hàng #${fullPO.orderNumber}</h2>
                            <p style="margin: 0; color: #666;">Ngày: ${new Date(fullPO.orderDate || fullPO.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                    </div>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                        <h3 style="margin: 0 0 15px; color: #333; font-size: 16px;">Gửi đến: ${fullPO.supplier.name}</h3>
                        <p style="margin: 0; color: #666; line-height: 1.6;">
                            Kính gửi Quý đối tác,<br><br>
                            Chúng tôi xin đặt hàng các sản phẩm sau để bổ sung kho hàng. 
                            Vui lòng xác nhận đơn hàng và thời gian giao hàng dự kiến.
                        </p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 12px; text-align: left;">Sản phẩm</th>
                                <th style="padding: 12px; text-align: left;">SKU</th>
                                <th style="padding: 12px; text-align: center;">SL</th>
                                <th style="padding: 12px; text-align: right;">Đơn giá</th>
                                <th style="padding: 12px; text-align: right;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                    <div style="border-top: 2px solid #eee; padding-top: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #666;">Tạm tính:</span>
                            <span style="font-weight: 600;">${formatCurrency(fullPO.totalAmount)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 20px; color: #667eea; font-weight: bold;">
                            <span>Tổng cộng:</span>
                            <span>${formatCurrency(fullPO.netAmount)}</span>
                        </div>
                    </div>
                </div>
                <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px;">
                    <p style="margin: 0;">Vui lòng phản hồi lại email này để xác nhận đơn hàng.</p>
                </div>
            </div>
        </body>
        </html>
    `

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    })

    await transporter.sendMail({
        from: `"SmartBuild" <${process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: `[SmartBuild] Đơn đặt hàng #${fullPO.orderNumber}`,
        html: emailHtml
    })

    // Update Status to SENT
    await prisma.purchaseOrder.update({
        where: { id: fullPO.id },
        data: { status: 'SENT' }
    })
}
