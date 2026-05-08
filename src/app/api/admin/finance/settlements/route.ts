import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')

    // 1. Fetch completed Purchase Orders that haven't been settled yet
    const query: any = {
      status: 'COMPLETED',
      // We could add a 'isSettled' flag to PurchaseOrder in a real app
    }
    if (supplierId) query.supplierId = supplierId

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: query,
      include: {
        supplier: true,
        purchaseItems: { include: { product: true } }
      }
    })

    // 2. Group by Supplier and calculate totals
    const settlements: Record<string, any> = {}

    purchaseOrders.forEach(po => {
      if (!settlements[po.supplierId]) {
        settlements[po.supplierId] = {
          supplierName: po.supplier.name,
          supplierId: po.supplierId,
          totalOrders: 0,
          grossAmount: 0,
          commissionAmount: 0,
          netSettlement: 0,
          orderNumbers: []
        }
      }

      const s = settlements[po.supplierId]
      s.totalOrders += 1
      s.grossAmount += po.netAmount
      s.commissionAmount += po.netAmount * 0.05 // Assuming 5% platform fee
      s.netSettlement = s.grossAmount - s.commissionAmount
      s.orderNumbers.push(po.orderNumber)
    })

    return NextResponse.json(createSuccessResponse(Object.values(settlements)))
  } catch (error) {
    console.error('[SettlementAPI] Error:', error)
    return NextResponse.json(createErrorResponse('Failed to fetch settlements'), { status: 500 })
  }
}
