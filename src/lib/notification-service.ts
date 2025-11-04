/**
 * Notification Service
 * 
 * Tự động gửi thông báo khi:
 * 1. Sắp hết hàng (low stock)
 * 2. Cần đặt hàng (reorder point)
 * 3. Prediction accuracy thấp
 * 4. Đầu tháng (chạy predictions mới)
 */

import { prisma } from './prisma'

export interface Notification {
  type: 'LOW_STOCK' | 'REORDER_NEEDED' | 'PREDICTION_ALERT' | 'MONTHLY_REMINDER'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  message: string
  productId?: string
  productName?: string
  data?: any
}

/**
 * Check low stock và tạo notifications
 */
export async function checkLowStock(): Promise<Notification[]> {
  const notifications: Notification[] = []

  // Lấy products sắp hết hàng
  // Note: We need to check against actual minStockLevel and reorderPoint values
  // Since we can't use field references in where clause, we'll fetch and filter
  const allInventoryItems = await prisma.inventoryItem.findMany({
    include: {
      product: {
        select: {
          id: true,
          name: true,
          unit: true
        }
      }
    }
  })

  // Filter items where availableQuantity <= minStockLevel or <= reorderPoint
  const lowStockProducts = allInventoryItems.filter(item => 
    item.availableQuantity <= item.minStockLevel || 
    item.availableQuantity <= item.reorderPoint
  )

  for (const item of lowStockProducts) {
    const percentage = (item.availableQuantity / item.minStockLevel) * 100

    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
    if (percentage < 20) priority = 'HIGH'
    else if (percentage < 50) priority = 'MEDIUM'
    else priority = 'LOW'

    notifications.push({
      type: 'LOW_STOCK',
      priority,
      title: `⚠️ Sắp hết hàng: ${item.product.name}`,
      message: `Còn ${item.availableQuantity} ${item.product.unit}. Mức tối thiểu: ${item.minStockLevel}`,
      productId: item.product.id,
      productName: item.product.name,
      data: {
        currentStock: item.availableQuantity,
        minStock: item.minStockLevel,
        percentage: Math.round(percentage)
      }
    })
  }

  return notifications
}

/**
 * Check predictions và suggest reorder
 */
export async function checkReorderNeeded(): Promise<Notification[]> {
  const notifications: Notification[] = []

  // Generate predictions cho tất cả products
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      inventoryItem: true
    }
  })

  for (const product of products) {
    if (!product.inventoryItem) continue

    // Get latest prediction
    const latestPrediction = await prisma.inventoryPrediction.findFirst({
      where: {
        productId: product.id,
        timeframe: 'MONTH'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!latestPrediction) continue

    const currentStock = product.inventoryItem.availableQuantity
    const predictedDemand = latestPrediction.predictedDemand
    const recommendedOrder = latestPrediction.recommendedOrder || 0

    // Nếu recommended order > 0 → Cần đặt hàng
    if (recommendedOrder > 0 && currentStock < predictedDemand * 1.2) {
      notifications.push({
        type: 'REORDER_NEEDED',
        priority: 'MEDIUM',
        title: `📦 Cần đặt hàng: ${product.name}`,
        message: `Dự đoán tháng sau bán ${Math.round(predictedDemand)} ${product.unit}. Hiện còn ${currentStock}. Nên đặt ${Math.round(recommendedOrder)} ${product.unit}.`,
        productId: product.id,
        productName: product.name,
        data: {
          currentStock,
          predictedDemand: Math.round(predictedDemand),
          recommendedOrder: Math.round(recommendedOrder),
          confidence: latestPrediction.confidence
        }
      })
    }
  }

  return notifications
}

/**
 * Check prediction accuracy
 */
export async function checkPredictionAccuracy(): Promise<Notification[]> {
  const notifications: Notification[] = []

  // Get predictions với accuracy thấp
  const poorPredictions = await prisma.inventoryPrediction.findMany({
    where: {
      accuracy: { not: null, lt: 70 },
      validatedAt: { not: null }
    },
    include: {
      product: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      validatedAt: 'desc'
    },
    take: 5
  })

  if (poorPredictions.length > 0) {
    const avgAccuracy = poorPredictions.reduce((sum, p) => sum + (p.accuracy || 0), 0) / poorPredictions.length

    notifications.push({
      type: 'PREDICTION_ALERT',
      priority: 'HIGH',
      title: '⚠️ Độ chính xác AI thấp',
      message: `${poorPredictions.length} sản phẩm có accuracy < 70% (TB: ${avgAccuracy.toFixed(1)}%). Cần review model.`,
      data: {
        products: poorPredictions.map(p => ({
          name: p.product.name,
          accuracy: p.accuracy
        })),
        averageAccuracy: avgAccuracy
      }
    })
  }

  return notifications
}

/**
 * Monthly reminder để chạy predictions
 */
export async function checkMonthlyReminder(): Promise<Notification[]> {
  const notifications: Notification[] = []
  const today = new Date()
  const dayOfMonth = today.getDate()

  // Nếu là ngày 1 hoặc 2 của tháng
  if (dayOfMonth <= 2) {
    // Check xem đã chạy prediction tháng này chưa
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const recentPredictions = await prisma.inventoryPrediction.findMany({
      where: {
        predictionDate: { gte: startOfMonth },
        timeframe: 'MONTH'
      }
    })

    if (recentPredictions.length === 0) {
      notifications.push({
        type: 'MONTHLY_REMINDER',
        priority: 'MEDIUM',
        title: '📅 Đầu tháng rồi!',
        message: `Đã sang tháng ${today.getMonth() + 1}. Hãy chạy predictions cho tháng này để có đề xuất đặt hàng chính xác.`,
        data: {
          month: today.getMonth() + 1,
          year: today.getFullYear()
        }
      })
    }
  }

  return notifications
}

/**
 * Get all notifications
 */
export async function getAllNotifications(): Promise<Notification[]> {
  const [
    lowStock,
    reorder,
    accuracy,
    monthly
  ] = await Promise.all([
    checkLowStock(),
    checkReorderNeeded(),
    checkPredictionAccuracy(),
    checkMonthlyReminder()
  ])

  return [
    ...lowStock,
    ...reorder,
    ...accuracy,
    ...monthly
  ].sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

/**
 * Save notification to database
 */
export async function saveNotification(notification: Notification) {
  // Save to database
  const userId = await prisma.user.findFirst({
    where: { role: 'MANAGER' },
    select: { id: true }
  })

  if (!userId) return

  await prisma.notification.create({
    data: {
      userId: userId.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      isRead: false,
      data: notification.data || {}
    }
  })
}

/**
 * Send notification (email, push, etc.)
 */
export async function sendNotification(notification: Notification) {
  // Save to database first
  await saveNotification(notification)

  // TODO: Send email
  // TODO: Send push notification
  // TODO: Send SMS (if critical)

  console.log(`📬 Notification sent: ${notification.title}`)
}
