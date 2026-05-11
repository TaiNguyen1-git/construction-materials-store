import { 
  PurchaseRequestSource, 
  PurchaseRequestStatus, 
  PurchaseOrderStatus,
  Prisma
} from '@prisma/client'
import { prisma } from './prisma'

export class ProcurementService {
  /**
   * Automatically splits a confirmed customer order into multiple Purchase Orders (POs)
   * grouped by Supplier.
   */
  static async splitOrderToPurchaseOrders(orderId: string, adminId: string = 'SYSTEM') {
    try {
      // 1. Fetch the order with all necessary relations
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      })

      if (!order || order.orderItems.length === 0) {
        console.warn(`[ProcurementService] Order ${orderId} not found or has no items.`)
        return
      }

      // 2. Group items by SupplierId
      const itemsBySupplier: Record<string, any[]> = {}
      
      for (const item of order.orderItems) {
        const supplierId = item.product.supplierId
        if (!supplierId) {
          console.warn(`[ProcurementService] Product ${item.product.id} has no supplier assigned. Skipping PO creation for this item.`)
          continue
        }

        if (!itemsBySupplier[supplierId]) {
          itemsBySupplier[supplierId] = []
        }
        itemsBySupplier[supplierId].push(item)
      }

      // 3. Create PO for each supplier group
      const poResults = []

      for (const [supplierId, items] of Object.entries(itemsBySupplier)) {
        // Calculate totals for this supplier's portion
        const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
        const taxAmount = subtotal * 0.1 // Assuming 10% VAT default for POs
        const netAmount = subtotal + taxAmount

        // Generate a unique PO number
        const poNumber = `PO-${order.orderNumber}-${supplierId.slice(-4).toUpperCase()}`

        const purchaseOrder = await prisma.purchaseOrder.create({
          data: {
            orderNumber: poNumber,
            supplierId: supplierId,
            parentOrderId: order.id,
            status: PurchaseOrderStatus.DRAFT,
            totalAmount: subtotal,
            taxAmount: taxAmount,
            netAmount: netAmount,
            createdBy: adminId,
            notes: `Auto-generated from Order #${order.orderNumber}`,
            purchaseItems: {
              create: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.unitPrice * item.quantity,
                notes: item.notes
              }))
            }
          }
        })

        poResults.push(purchaseOrder)
        console.log(`[ProcurementService] Created PO ${poNumber} for Supplier ${supplierId}`)
      }

      return poResults
    } catch (error) {
      console.error('[ProcurementService] Error splitting order:', error)
      throw error
    }
  }

  // ─── Instance Methods (used by /api/procurement route) ───────────────────────

  async generatePurchaseSuggestions() {
    try {
      const allLowStock = await prisma.inventoryItem.findMany({
        where: { availableQuantity: { lte: 10 } },
        include: { product: { select: { id: true, name: true, sku: true, supplierId: true } } },
        take: 50
      })

      return allLowStock.map(item => ({
        productId: item.productId,
        productName: item.product?.name,
        productSku: item.product?.sku,
        currentStock: item.availableQuantity,
        suggestedQty: Math.max(50 - (item.availableQuantity ?? 0), 10),
        supplierId: item.product?.supplierId
      }))
    } catch (error) {
      console.error('[ProcurementService] generatePurchaseSuggestions error:', error)
      return []
    }
  }

  async compareSuppliers(productId: string, quantity: number) {
    try {
      const supplierProducts = await prisma.supplierProduct.findMany({
        where: { productId, isActive: true },
        include: { supplier: { select: { id: true, name: true, email: true } } },
        orderBy: { unitPrice: 'asc' }
      })

      return supplierProducts.map(sp => ({
        supplierId: sp.supplierId,
        supplierName: sp.supplier?.name,
        unitPrice: sp.unitPrice,
        totalCost: sp.unitPrice * quantity,
        leadTimeDays: sp.leadTimeDays,
        minOrderQty: sp.minOrderQty,
        isPreferred: sp.isPreferred
      }))
    } catch (error) {
      console.error('[ProcurementService] compareSuppliers error:', error)
      return []
    }
  }

  async createPurchaseRequest(
    productId: string,
    requestedQty: number,
    supplierId?: string,
    source: PurchaseRequestSource = PurchaseRequestSource.MANUAL,
    notes?: string
  ) {
    const [product, inventory] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.inventoryItem.findUnique({ where: { productId } })
    ])

    const estimatedCost = (product?.costPrice || product?.price || 0) * requestedQty
    const requestNumber = `PR-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    return prisma.purchaseRequest.create({
      data: {
        requestNumber,
        productId,
        requestedQty,
        supplierId: supplierId || null,
        currentStock: inventory?.availableQuantity || 0,
        reorderPoint: inventory?.reorderPoint || 0,
        source: source,
        notes: notes || null,
        estimatedCost,
        status: PurchaseRequestStatus.PENDING
      }
    })
  }

  async autoGeneratePurchaseRequests() {
    try {
      const lowStockItems = await prisma.inventoryItem.findMany({
        where: { availableQuantity: { lte: 5 } },
        include: { product: true },
        take: 20
      })

      let created = 0
      for (const item of lowStockItems) {
        const existing = await prisma.purchaseRequest.findFirst({
          where: { productId: item.productId, status: { in: [PurchaseRequestStatus.PENDING, PurchaseRequestStatus.APPROVED] } }
        })
        if (!existing) {
          await this.createPurchaseRequest(item.productId, 50, undefined, PurchaseRequestSource.SYSTEM)
          created++
        }
      }
      return created
    } catch (error) {
      console.error('[ProcurementService] autoGeneratePurchaseRequests error:', error)
      return 0
    }
  }

  async approveRequest(requestId: string, approvedBy: string) {
    return prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { status: PurchaseRequestStatus.APPROVED, approvedBy, approvedAt: new Date() }
    })
  }

  async convertToPurchaseOrder(requestId: string, createdBy: string) {
    // Define a type that includes the product relation
    type PurchaseRequestWithProduct = Prisma.PurchaseRequestGetPayload<{
      include: { product: true }
    }>

    const request = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      include: { product: true }
    }) as PurchaseRequestWithProduct | null

    if (!request) throw new Error('Purchase request not found')
    if (!request.supplierId) throw new Error('Supplier not assigned to request')

    const orderCount = await prisma.purchaseOrder.count()
    const poNumber = `PO-${String(orderCount + 1).padStart(6, '0')}`

    const unitPrice = request.estimatedCost
      ? request.estimatedCost / request.requestedQty
      : (request.product?.costPrice || request.product?.price || 0)

    const subtotal = unitPrice * request.requestedQty
    const taxAmount = subtotal * 0.1
    const netAmount = subtotal + taxAmount

    const po = await prisma.purchaseOrder.create({
      data: {
        orderNumber: poNumber,
        supplierId: request.supplierId,
        status: PurchaseOrderStatus.DRAFT,
        totalAmount: subtotal,
        taxAmount,
        netAmount,
        createdBy,
        purchaseItems: {
          create: [{
            productId: request.productId,
            quantity: request.requestedQty,
            unitPrice,
            totalPrice: subtotal
          }]
        }
      }
    })

    await prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { status: PurchaseRequestStatus.CONVERTED }
    })

    return po
  }

  async updateAllReorderPoints() {
    try {
      const items = await prisma.inventoryItem.findMany({ take: 500 })
      let updated = 0

      for (const item of items) {
        const newReorderPoint = Math.max(Math.ceil((item.quantity ?? 50) * 0.1), 5)
        await prisma.inventoryItem.update({
          where: { id: item.id },
          data: { reorderPoint: newReorderPoint }
        })
        updated++
      }
      return updated
    } catch (error) {
      console.error('[ProcurementService] updateAllReorderPoints error:', error)
      return 0
    }
  }
}

// Singleton instance for use in API routes
export const procurementService = new ProcurementService()
