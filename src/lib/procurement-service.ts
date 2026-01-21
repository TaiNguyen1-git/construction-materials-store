/**
 * Procurement Service - SME Feature 2: Nhập hàng Thông minh
 * 
 * Service quản lý đề xuất và yêu cầu nhập hàng tự động.
 * Dựa trên tồn kho, dự báo bán hàng, và so sánh nhà cung cấp.
 */

import { prisma } from './prisma'

export interface PurchaseSuggestion {
    productId: string
    productName: string
    productSku: string
    categoryName: string
    currentStock: number
    reorderPoint: number
    suggestedQty: number
    avgDailySales: number
    daysUntilStockout: number
    priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
    bestSupplier?: {
        id: string
        name: string
        unitPrice: number
        leadTimeDays: number
    }
    estimatedCost: number
}

export interface SupplierComparison {
    supplierId: string
    supplierName: string
    unitPrice: number
    leadTimeDays: number
    minOrderQty: number
    rating: number
    isPreferred: boolean
    totalCost: number // unitPrice * quantity
    deliveryDate: Date
}

export class ProcurementService {
    /**
     * Tạo danh sách gợi ý nhập hàng
     */
    static async generatePurchaseSuggestions(): Promise<PurchaseSuggestion[]> {
        // Lấy tất cả sản phẩm với thông tin tồn kho
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: {
                category: true,
                inventoryItem: true
            }
        })

        const suggestions: PurchaseSuggestion[] = []

        for (const product of products) {
            if (!product.inventoryItem) continue

            const inventory = product.inventoryItem
            const currentStock = inventory.availableQuantity
            const reorderPoint = inventory.reorderPoint
            const minStock = inventory.minStockLevel
            const maxStock = inventory.maxStockLevel || reorderPoint * 3

            // Tính trung bình bán hàng/ngày trong 30 ngày qua
            const avgDailySales = await this.calculateAvgDailySales(product.id, 30)

            // Tính số ngày cho đến khi hết hàng
            const daysUntilStockout = avgDailySales > 0
                ? Math.floor(currentStock / avgDailySales)
                : 999

            // Chỉ gợi ý nếu tồn kho dưới điểm đặt hàng
            if (currentStock > reorderPoint) continue

            // Tính số lượng cần nhập = Max stock - Current stock
            const suggestedQty = Math.ceil(maxStock - currentStock)

            // Xác định mức độ ưu tiên
            let priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
            if (currentStock <= 0) {
                priority = 'URGENT'
            } else if (currentStock <= minStock) {
                priority = 'HIGH'
            } else if (daysUntilStockout <= 7) {
                priority = 'MEDIUM'
            } else {
                priority = 'LOW'
            }

            // Tìm nhà cung cấp tốt nhất
            const bestSupplier = await this.findBestSupplier(product.id, suggestedQty)

            const estimatedCost = bestSupplier
                ? bestSupplier.unitPrice * suggestedQty
                : (product.costPrice || product.price * 0.7) * suggestedQty

            suggestions.push({
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                categoryName: product.category.name,
                currentStock,
                reorderPoint,
                suggestedQty,
                avgDailySales,
                daysUntilStockout,
                priority,
                bestSupplier: bestSupplier ? {
                    id: bestSupplier.supplierId,
                    name: bestSupplier.supplierName,
                    unitPrice: bestSupplier.unitPrice,
                    leadTimeDays: bestSupplier.leadTimeDays
                } : undefined,
                estimatedCost
            })
        }

        // Sắp xếp theo ưu tiên
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
        return suggestions.sort((a, b) =>
            priorityOrder[a.priority] - priorityOrder[b.priority]
        )
    }

    /**
     * Tính trung bình bán hàng/ngày
     */
    static async calculateAvgDailySales(
        productId: string,
        days: number
    ): Promise<number> {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const result = await prisma.orderItem.aggregate({
            where: {
                productId,
                order: {
                    status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED'] },
                    createdAt: { gte: startDate }
                }
            },
            _sum: { quantity: true }
        })

        const totalSold = result._sum.quantity || 0
        return totalSold / days
    }

    /**
     * Tính điểm đặt hàng động (Dynamic Reorder Point)
     * Công thức: (Avg Daily Sales * Lead Time) + Safety Stock
     */
    static async calculateDynamicReorderPoint(
        productId: string
    ): Promise<number> {
        const avgDailySales = await this.calculateAvgDailySales(productId, 30)

        // Lấy lead time từ nhà cung cấp ưu tiên
        const preferredSupplier = await prisma.supplierProduct.findFirst({
            where: { productId, isPreferred: true, isActive: true }
        })
        const leadTime = preferredSupplier?.leadTimeDays || 7

        // Safety stock = 20% của lead time demand
        const safetyStock = avgDailySales * leadTime * 0.2

        return Math.ceil((avgDailySales * leadTime) + safetyStock)
    }

    /**
     * So sánh các nhà cung cấp cho một sản phẩm
     */
    static async compareSuppliers(
        productId: string,
        quantity: number
    ): Promise<SupplierComparison[]> {
        const supplierProducts = await prisma.supplierProduct.findMany({
            where: {
                productId,
                isActive: true,
                minOrderQty: { lte: quantity }
            },
            include: {
                supplier: true
            }
        })

        const today = new Date()

        return supplierProducts.map(sp => {
            const deliveryDate = new Date(today)
            deliveryDate.setDate(deliveryDate.getDate() + sp.leadTimeDays)

            return {
                supplierId: sp.supplierId,
                supplierName: sp.supplier.name,
                unitPrice: sp.unitPrice,
                leadTimeDays: sp.leadTimeDays,
                minOrderQty: sp.minOrderQty,
                rating: sp.averageRating,
                isPreferred: sp.isPreferred,
                totalCost: sp.unitPrice * quantity,
                deliveryDate
            }
        }).sort((a, b) => {
            // Ưu tiên: Preferred > Price > Rating > Lead Time
            if (a.isPreferred && !b.isPreferred) return -1
            if (!a.isPreferred && b.isPreferred) return 1
            if (a.totalCost !== b.totalCost) return a.totalCost - b.totalCost
            if (a.rating !== b.rating) return b.rating - a.rating
            return a.leadTimeDays - b.leadTimeDays
        })
    }

    /**
     * Tìm nhà cung cấp tốt nhất cho sản phẩm
     */
    static async findBestSupplier(
        productId: string,
        quantity: number
    ): Promise<SupplierComparison | null> {
        const suppliers = await this.compareSuppliers(productId, quantity)
        return suppliers.length > 0 ? suppliers[0] : null
    }

    /**
     * Tạo yêu cầu nhập hàng
     */
    static async createPurchaseRequest(
        productId: string,
        requestedQty: number,
        supplierId?: string,
        source: 'SYSTEM' | 'MANUAL' = 'MANUAL',
        notes?: string
    ) {
        // Lấy thông tin tồn kho hiện tại
        const inventory = await prisma.inventoryItem.findFirst({
            where: { productId }
        })

        if (!inventory) {
            throw new Error('Không tìm thấy thông tin tồn kho sản phẩm')
        }

        // Tính toán chi phí ước tính
        let estimatedCost: number | undefined
        if (supplierId) {
            const supplierProduct = await prisma.supplierProduct.findUnique({
                where: {
                    supplierId_productId: { supplierId, productId }
                }
            })
            if (supplierProduct) {
                estimatedCost = supplierProduct.unitPrice * requestedQty
            }
        }

        // Xác định priority dựa trên tình trạng tồn kho
        let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM'
        if (inventory.availableQuantity <= 0) {
            priority = 'URGENT'
        } else if (inventory.availableQuantity <= inventory.minStockLevel) {
            priority = 'HIGH'
        } else if (inventory.availableQuantity <= inventory.reorderPoint) {
            priority = 'MEDIUM'
        } else {
            priority = 'LOW'
        }

        // Tạo mã yêu cầu
        const requestNumber = `PR-${Date.now().toString(36).toUpperCase()}`

        const request = await prisma.purchaseRequest.create({
            data: {
                requestNumber,
                productId,
                supplierId,
                requestedQty,
                currentStock: inventory.availableQuantity,
                reorderPoint: inventory.reorderPoint,
                estimatedCost,
                source,
                status: 'PENDING',
                priority,
                notes
            }
        })

        return request
    }

    /**
     * Duyệt yêu cầu nhập hàng
     */
    static async approveRequest(
        requestId: string,
        approvedBy: string
    ) {
        const request = await prisma.purchaseRequest.update({
            where: { id: requestId },
            data: {
                status: 'APPROVED',
                approvedBy,
                approvedAt: new Date()
            }
        })

        return request
    }

    /**
     * Chuyển yêu cầu thành đơn đặt hàng (Purchase Order)
     */
    static async convertToPurchaseOrder(
        requestId: string,
        createdBy: string
    ) {
        const request = await prisma.purchaseRequest.findUnique({
            where: { id: requestId }
        })

        if (!request) {
            throw new Error('Không tìm thấy yêu cầu nhập hàng')
        }

        if (request.status !== 'APPROVED') {
            throw new Error('Yêu cầu chưa được duyệt')
        }

        if (!request.supplierId) {
            throw new Error('Chưa chọn nhà cung cấp')
        }

        // Lấy thông tin giá từ nhà cung cấp
        const supplierProduct = await prisma.supplierProduct.findUnique({
            where: {
                supplierId_productId: {
                    supplierId: request.supplierId,
                    productId: request.productId
                }
            }
        })

        const unitPrice = supplierProduct?.unitPrice || request.estimatedCost! / request.requestedQty
        const totalPrice = unitPrice * request.requestedQty

        // Tạo Purchase Order
        const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}`

        const purchaseOrder = await prisma.purchaseOrder.create({
            data: {
                orderNumber,
                supplierId: request.supplierId,
                status: 'DRAFT',
                totalAmount: totalPrice,
                taxAmount: 0,
                shippingAmount: 0,
                discountAmount: 0,
                netAmount: totalPrice,
                createdBy,
                purchaseItems: {
                    create: {
                        productId: request.productId,
                        quantity: request.requestedQty,
                        unitPrice,
                        totalPrice
                    }
                }
            }
        })

        // Cập nhật trạng thái request
        await prisma.purchaseRequest.update({
            where: { id: requestId },
            data: {
                status: 'CONVERTED',
                purchaseOrderId: purchaseOrder.id
            }
        })

        return purchaseOrder
    }

    /**
     * Cập nhật điểm đặt hàng cho tất cả sản phẩm
     * (Chạy theo schedule, ví dụ hàng tuần)
     */
    static async updateAllReorderPoints(): Promise<number> {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: { inventoryItem: true }
        })

        let updated = 0

        for (const product of products) {
            if (!product.inventoryItem) continue

            const newReorderPoint = await this.calculateDynamicReorderPoint(product.id)

            if (newReorderPoint !== product.inventoryItem.reorderPoint) {
                await prisma.inventoryItem.update({
                    where: { id: product.inventoryItem.id },
                    data: { reorderPoint: newReorderPoint }
                })
                updated++
            }
        }

        return updated
    }

    /**
     * Tự động tạo yêu cầu nhập hàng cho sản phẩm dưới ngưỡng
     * (Chạy theo schedule)
     */
    static async autoGeneratePurchaseRequests(): Promise<number> {
        const suggestions = await this.generatePurchaseSuggestions()
        let created = 0

        for (const suggestion of suggestions) {
            // Chỉ tự động tạo cho URGENT và HIGH
            if (suggestion.priority !== 'URGENT' && suggestion.priority !== 'HIGH') {
                continue
            }

            // Kiểm tra xem đã có request pending chưa
            const existingRequest = await prisma.purchaseRequest.findFirst({
                where: {
                    productId: suggestion.productId,
                    status: { in: ['PENDING', 'APPROVED'] }
                }
            })

            if (existingRequest) continue

            await this.createPurchaseRequest(
                suggestion.productId,
                suggestion.suggestedQty,
                suggestion.bestSupplier?.id,
                'SYSTEM',
                `Tự động tạo: Tồn kho ${suggestion.currentStock}, Điểm đặt hàng ${suggestion.reorderPoint}`
            )

            created++
        }

        return created
    }
}

export const procurementService = ProcurementService
