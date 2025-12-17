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
import { pushSystemNotification, pushNotificationToFirebase } from './firebase-notifications'

export interface Notification {
  type: 'LOW_STOCK' | 'REORDER_NEEDED' | 'PREDICTION_ALERT' | 'MONTHLY_REMINDER' | 'ORDER_NEW' | 'ORDER_UPDATE'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  message: string
  productId?: string
  productName?: string
  orderId?: string
  orderNumber?: string
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
 * Save notification to database for a specific user
 */
/**
 * Save notification to database for a specific user
 */
export async function saveNotificationForUser(notification: Notification, userId: string, userRole: string = 'CUSTOMER') {
  // 1. Save to Database
  await prisma.notification.create({
    data: {
      userId,
      type: notification.type as any,
      title: notification.title,
      message: notification.message,
      priority: notification.priority as any,
      read: false,
      referenceId: notification.orderId || notification.productId,
      referenceType: notification.orderId ? 'ORDER' : notification.productId ? 'PRODUCT' : null,
      metadata: notification.data || {}
    }
  })

  // 2. Push to Firebase Realtime Database
  await pushNotificationToFirebase({
    userId,
    userRole,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    priority: notification.priority,
    read: false,
    createdAt: new Date().toISOString(),
  })

  // 3. Push to Firebase (non-blocking, don't await)
  pushNotificationToFirebase({
    userId,
    userRole,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    priority: notification.priority,
    read: false,
    createdAt: new Date().toISOString(),
    data: notification.data,
    referenceId: notification.orderId || notification.productId,
    referenceType: notification.orderId ? 'ORDER' : notification.productId ? 'PRODUCT' : undefined
  }).catch(err => console.error('Firebase push error (non-critical):', err))
}

/**
 * Save notification to database for all managers
 */
export async function saveNotificationForAllManagers(notification: Notification) {
  // 1. Save to database for all managers
  const managers = await prisma.user.findMany({
    where: { role: 'MANAGER' },
    select: { id: true }
  })

  if (managers.length > 0) {
    // Create notifications for all managers
    await prisma.notification.createMany({
      data: managers.map(manager => ({
        userId: manager.id,
        type: notification.type as any,
        title: notification.title,
        message: notification.message,
        priority: notification.priority as any,
        read: false,
        referenceId: notification.orderId || notification.productId,
        referenceType: notification.orderId ? 'ORDER' : notification.productId ? 'PRODUCT' : null,
        metadata: notification.data || {}
      }))
    })
  }

  // 2. Push to Firebase System Channel (non-blocking, don't await)
  pushSystemNotification({
    userRole: 'MANAGER',
    type: notification.type,
    title: notification.title,
    message: notification.message,
    priority: notification.priority,
    read: false,
    createdAt: new Date().toISOString(),
    data: notification.data,
    referenceId: notification.orderId || notification.productId,
    referenceType: notification.orderId ? 'ORDER' : notification.productId ? 'PRODUCT' : undefined
  }).catch(err => console.error('Firebase push error (non-critical):', err))
}

/**
 * Save notification to database (for backward compatibility)
 */
export async function saveNotification(notification: Notification) {
  await saveNotificationForAllManagers(notification)
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

/**
 * Create notification for new order
 */
export async function createOrderNotification(order: {
  id: string
  orderNumber: string
  netAmount: number
  customerType: string
  guestName?: string | null
  guestPhone?: string | null
  customer?: { user?: { name?: string | null; email?: string | null } | null } | null
}) {
  const customerName = order.customerType === 'GUEST'
    ? order.guestName || 'Khách vãng lai'
    : order.customer?.user?.name || 'Khách hàng'

  const notification: Notification = {
    type: 'ORDER_NEW',
    priority: 'HIGH',
    title: `🛒 Đơn hàng mới: ${order.orderNumber}`,
    message: `Khách hàng ${customerName} vừa đặt hàng với tổng tiền ${order.netAmount.toLocaleString('vi-VN')}đ`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      netAmount: order.netAmount,
      customerName,
      customerType: order.customerType
    }
  }

  await saveNotificationForAllManagers(notification)
  console.log(`📬 Order notification created: ${order.orderNumber}`)
}

/**
 * Create notification for order status update (for customer)
 */
export async function createOrderStatusNotificationForCustomer(order: {
  id: string
  orderNumber: string
  status: string
  customer?: { userId?: string | null } | null
}) {
  if (!order.customer?.userId) return

  const statusMessages: Record<string, string> = {
    'PENDING_CONFIRMATION': 'đang chờ xác nhận',
    'CONFIRMED': 'đã được xác nhận',
    'PREPARING': 'đang chuẩn bị',
    'SHIPPED': 'đã gửi hàng',
    'DELIVERED': 'đã giao hàng',
    'COMPLETED': 'đã hoàn thành',
    'CANCELLED': 'đã hủy',
    'RETURNED': 'đã trả hàng'
  }

  const statusMessage = statusMessages[order.status] || order.status

  const notification: Notification = {
    type: 'ORDER_UPDATE',
    priority: 'MEDIUM',
    title: `📦 Cập nhật đơn hàng: ${order.orderNumber}`,
    message: `Đơn hàng của bạn ${statusMessage}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status
    }
  }

  await saveNotificationForUser(notification, order.customer.userId)
  console.log(`📬 Order status notification created for customer: ${order.orderNumber}`)
}
