import { prisma } from './prisma'
import { OrderStatus, Prisma } from '@prisma/client'
import { logger } from './logger'
import { redis } from './redis'

export interface PurchaseItem {
  productId: string
  quantity: number
  conversionFactor?: number | null
}

export class PurchaseService {
  /**
   * Bước 0: Kiểm tra tính trùng lặp (Idempotency)
   * Sử dụng Redis với cơ chế Graceful Fallback nếu Redis lỗi
   */
  static async checkIdempotency(key: string): Promise<boolean> {
    if (!key) return true
    
    try {
      const redisKey = `idempotency:order:${key}`
      const result = await redis.set(redisKey, 'processing', { nx: true, ex: 600 })
      return result === 'OK'
    } catch (error) {
      logger.error('Redis Idempotency Check Error - Falling back to allowing request', { error, key })
      return true // Fallback: Cho phép tiếp tục nếu Redis sập
    }
  }

  static async markIdempotencySuccess(key: string, orderId: string) {
    if (!key) return
    try {
      const redisKey = `idempotency:order:${key}`
      await redis.set(redisKey, `success:${orderId}`, { ex: 3600 })
    } catch (error) {
       logger.error('Redis Mark Success Error', { error, key })
    }
  }

  /**
   * Bước 1: Kiểm tra và Giữ chỗ kho (Có xử lý quy đổi đơn vị và dọn dẹp đơn quá hạn)
   */
  static async reserveStock(
    tx: Prisma.TransactionClient,
    items: PurchaseItem[],
    userIdOrGuest: string,
    orderNumber: string
  ) {
    for (const item of items) {
      // ITEM 3: Handle precision - Ensure we work with numbers properly
      const factor = Number(item.conversionFactor) || 1
      const quantity = Number(item.quantity)
      const totalBaseQuantity = Number((quantity * factor).toFixed(3)) // Round to 3 decimal places for materials

      if (totalBaseQuantity <= 0) continue

      // 1. Kiểm tra kho hiện tại
      let inventory = await tx.inventoryItem.findUnique({
        where: { productId: item.productId },
        include: { product: true }
      })

      if (!inventory) {
        throw new Error(`STOCK_ERROR:Sản phẩm không có trong hệ thống kho`)
      }

      // 2. ITEM 1: LOGIC THÔNG MINH CHO SERVER FREE 
      // Chỉ dọn dẹp các đơn PENDING mà CHƯA có minh chứng thanh toán
      if (inventory.availableQuantity < totalBaseQuantity) {
        await this.releaseExpiredStockForProduct(tx, item.productId)
        
        const refreshedInv = await tx.inventoryItem.findUnique({
          where: { productId: item.productId },
          include: { product: true }
        })
        if (refreshedInv) inventory = refreshedInv
      }

      // 3. Thực hiện giữ chỗ (Atomic Update)
      const updateResult = await tx.inventoryItem.updateMany({
        where: {
          productId: item.productId,
          availableQuantity: { gte: totalBaseQuantity }
        },
        data: {
          availableQuantity: { decrement: totalBaseQuantity },
          reservedQuantity: { increment: totalBaseQuantity }
        }
      })

      if (updateResult.count === 0) {
        if (inventory.availableQuantity <= 0.001) { // Precision check
          throw new Error(`STOCK_ERROR:Sản phẩm "${inventory.product.name}" đã hết hàng`)
        } else {
          throw new Error(
            `STOCK_ERROR:Sản phẩm "${inventory.product.name}" chỉ còn ${inventory.availableQuantity} trong kho (bạn cần ${totalBaseQuantity})`
          )
        }
      }

      // 4. Ghi nhận lịch sử biến động kho
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          inventoryId: inventory.id,
          movementType: 'OUT',
          quantity: totalBaseQuantity,
          previousStock: inventory.availableQuantity,
          newStock: Number((inventory.availableQuantity - totalBaseQuantity).toFixed(3)),
          reason: `Đặt hàng ${orderNumber}`,
          referenceType: 'ORDER',
          referenceId: '', 
          performedBy: userIdOrGuest
        }
      })
    }
  }

  /**
   * Thu hồi kho từ các đơn hàng đã quá hạn của một sản phẩm cụ thể
   */
  private static async releaseExpiredStockForProduct(
    tx: Prisma.TransactionClient,
    productId: string
  ) {
    const now = new Date()
    
    const expiredOrders = await tx.order.findMany({
      where: {
        status: { in: ['PENDING', 'PENDING_CONFIRMATION', 'CONFIRMED_AWAITING_DEPOSIT'] } as any,
        qrExpiresAt: { lt: now },
        // ITEM 1: Tránh hủy các đơn đã upload minh chứng (đang chờ duyệt)
        depositProof: null, 
        orderItems: { some: { productId } }
      },
      include: { orderItems: true }
    })

    for (const order of expiredOrders) {
      await this.cancelOrderAndReleaseStock(tx, order.id, 'Hệ thống tự động hủy do quá hạn thanh toán và không có minh chứng', 'SYSTEM')
    }
  }

  /**
   * ITEM 4: Hủy đơn hàng và hoàn kho với State Machine protection
   */
  static async cancelOrderAndReleaseStock(
    tx: Prisma.TransactionClient, 
    orderId: string, 
    reason: string,
    performedBy: string = 'ADMIN'
  ) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true }
    })

    // ITEM 4 CHECK: Chỉ hoàn kho nếu đơn chưa giao/chưa chuẩn bị xong
    const allowInventoryRelease = ['PENDING', 'PENDING_CONFIRMATION', 'CONFIRMED_AWAITING_DEPOSIT', 'CONFIRMED'].includes(order?.status || '')

    if (!order || order.status === 'CANCELLED') return

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
        cancelledAt: new Date()
      }
    })

    if (!allowInventoryRelease) {
      logger.warn(`Order ${order.orderNumber} cancelled but stock NOT released due to current status: ${order.status}`)
      return
    }

    for (const item of order.orderItems) {
      const factor = Number(item.conversionFactor) || 1
      const totalBaseQuantity = Number((item.quantity * factor).toFixed(3))

      const inv = await tx.inventoryItem.findUnique({
        where: { productId: item.productId }
      })

      if (inv) {
        await tx.inventoryItem.update({
          where: { productId: item.productId },
          data: {
            availableQuantity: { increment: totalBaseQuantity },
            reservedQuantity: { decrement: totalBaseQuantity }
          }
        })

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            inventoryId: inv.id,
            movementType: 'IN',
            quantity: totalBaseQuantity,
            previousStock: inv.availableQuantity,
            newStock: Number((inv.availableQuantity + totalBaseQuantity).toFixed(3)),
            reason: `Hủy đơn hàng: ${reason}`,
            referenceType: 'ORDER',
            referenceId: order.id,
            performedBy
          }
        })
      }
    }
  }

  /**
   * ITEM 1: Gia hạn thời gian giữ kho khi khách upload minh chứng
   */
  static async extendReservationOnProofUpload(tx: Prisma.TransactionClient, orderId: string, proofUrl: string) {
    const order = await tx.order.findUnique({ where: { id: orderId } })
    if (!order) return

    // Gia hạn thêm 24h để Admin xem xét
    const newExpiry = new Date()
    newExpiry.setHours(newExpiry.getHours() + 24)

    await tx.order.update({
      where: { id: orderId },
      data: {
        depositProof: proofUrl,
        qrExpiresAt: newExpiry
      }
    })
    
    logger.info(`Reservation extended for order ${order.orderNumber} due to proof upload`)
  }
}
