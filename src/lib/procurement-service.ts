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
            parentOrderId: order.id as any,
            status: 'DRAFT',
            totalAmount: subtotal,
            taxAmount: taxAmount,
            netAmount: netAmount,
            createdBy: adminId,
            notes: `Auto-generated from Order #${order.orderNumber}`,
            purchaseItems: {
              create: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice, // Usually we'd use supplier's cost price here, but using order unit price as fallback
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
}
