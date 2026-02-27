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
import { pushNotificationToFirebase, cleanupOldFirebaseNotifications } from './firebase-notifications'
import { NotificationType, Priority } from '@prisma/client'

export interface Notification {
  type: 'LOW_STOCK' | 'REORDER_NEEDED' | 'PREDICTION_ALERT' | 'MONTHLY_REMINDER' | 'ORDER_NEW' | 'ORDER_UPDATE' | 'QUOTE_NEW' | 'QUOTE_UPDATE' | 'KYC_PENDING' | 'SMART_REORDER' | 'STOCK_UPDATE' | 'PROJECT_MATCH' | 'PAYMENT_UPDATE' | 'FRAUD_ALERT'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  message: string
  productId?: string
  productName?: string
  orderId?: string
  orderNumber?: string
  data?: Record<string, unknown>
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
          sku: true,
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

    // Send email alerts (non-blocking)
    const stockAlertData = {
      productName: item.product.name,
      sku: item.product.sku || item.product.id,
      currentStock: item.availableQuantity,
      minStock: item.minStockLevel
    }

    import('@/lib/email-service').then(({ EmailService }) => {
      // Email to employee for all low stock
      EmailService.sendStockAlertToEmployee(stockAlertData)
        .catch(err => console.error('Stock alert email to employee error:', err))

      // Email to admin only for critical (< 20% of min stock)
      if (percentage < 20) {
        EmailService.sendCriticalStockAlertToAdmin(stockAlertData)
          .catch(err => console.error('Critical stock alert email to admin error:', err))
      }
    }).catch(err => console.error('Email import error:', err))
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
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      priority: notification.priority as Priority,
      read: false,
      referenceId: notification.orderId || notification.productId,
      referenceType: notification.orderId ? 'ORDER' : notification.productId ? 'PRODUCT' : null,
      metadata: (notification.data || {}) as any
    }
  })

  // 2. Push to Firebase (user's personal path) — single call only
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

  // 3. Auto-cleanup old notifications in Firebase
  cleanupOldFirebaseNotifications(userId, 100).catch(() => { })
}

/**
 * Save notification to database for all managers
 */
export async function saveNotificationForAllManagers(notification: Notification) {
  // 1. Get all managers
  const managers = await prisma.user.findMany({
    where: { role: 'MANAGER' },
    select: { id: true }
  })

  if (managers.length === 0) return

  // 2. Save to database for all managers
  await prisma.notification.createMany({
    data: managers.map(manager => ({
      userId: manager.id,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      priority: notification.priority as Priority,
      read: false,
      referenceId: notification.orderId || notification.productId,
      referenceType: notification.orderId ? 'ORDER' : notification.productId ? 'PRODUCT' : null,
      metadata: (notification.data || {}) as any
    }))
  })

  // 3. Push to each manager's personal Firebase path (not shared system channel)
  const managerIds = managers.map(m => m.id)
  const firebasePayload = {
    userRole: 'MANAGER' as const,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    priority: notification.priority as 'HIGH' | 'MEDIUM' | 'LOW',
    read: false,
    createdAt: new Date().toISOString(),
    data: notification.data,
    referenceId: notification.orderId || notification.productId,
    referenceType: notification.orderId ? 'ORDER' : notification.productId ? 'PRODUCT' : undefined
  }

  for (const managerId of managerIds) {
    pushNotificationToFirebase({
      ...firebasePayload,
      userId: managerId
    }).catch(err => console.error('Firebase push error (non-critical):', err))

    // Auto-cleanup
    cleanupOldFirebaseNotifications(managerId, 100).catch(() => { })
  }
}

import { notificationSender } from './sms-service'

/**
 * Save notification to database (for backward compatibility)
 */
export async function saveNotification(notification: Notification) {
  await saveNotificationForAllManagers(notification)
}

/**
 * Send notification (email, push, etc.)
 * Multi-channel notification delivery
 */
export async function sendNotification(notification: Notification, options?: {
  sendEmail?: boolean
  sendPush?: boolean
  sendSMS?: boolean
  recipientEmail?: string
  recipientPhone?: string
  zaloTemplateId?: string
  zaloTemplateData?: Record<string, string | number>
}) {
  // 1. Save to database first (always)
  await saveNotification(notification)

  // 2. Send email (for HIGH priority or explicitly requested)
  if (options?.sendEmail || notification.priority === 'HIGH') {
    try {
      const { EmailService } = await import('@/lib/email-service')

      if (options?.recipientEmail) {
        // Send to specific recipient
        await EmailService.sendGenericNotificationEmail({
          email: options.recipientEmail,
          subject: notification.title,
          message: notification.message,
          priority: notification.priority,
          actionUrl: notification.orderId
            ? `/order-tracking?orderId=${notification.orderId}`
            : notification.productId
              ? `/products/${notification.productId}`
              : undefined
        })
      } else {
        // Send to all managers for system notifications
        const managers = await prisma.user.findMany({
          where: { role: 'MANAGER' },
          select: { email: true }
        })

        for (const manager of managers) {
          EmailService.sendGenericNotificationEmail({
            email: manager.email,
            subject: notification.title,
            message: notification.message,
            priority: notification.priority,
            actionUrl: notification.orderId
              ? `/admin/orders/${notification.orderId}`
              : undefined
          }).catch(err => console.error('Email to manager error:', err))
        }
      }
    } catch (err) {
      console.error('Email notification error:', err)
    }
  }

  // 3. SMS/Zalo for critical notifications (production readiness)
  if (options?.sendSMS && notification.priority === 'HIGH' && options?.recipientPhone) {
    // If we have a Zalo template, send ZNS, otherwise send standard SMS
    if (options.zaloTemplateId) {
      const znsResult = await notificationSender.sendZaloZNS({
        phone: options.recipientPhone.replace(/^0/, '84'), // Zalo needs 84...
        templateId: options.zaloTemplateId,
        templateData: options.zaloTemplateData || {
          title: notification.title,
          message: notification.message
        }
      })
      if (!znsResult) {
        console.warn('[NotificationService] Fallback to SMS after ZNS skipped/failed')
        await notificationSender.sendSMS({
          phone: options.recipientPhone,
          message: `${notification.title}: ${notification.message}`
        })
      }
    } else {
      await notificationSender.sendSMS({
        phone: options.recipientPhone,
        message: `${notification.title}: ${notification.message}`
      })
    }
  }
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
  orderItems?: Array<{ id: string }>
}) {
  const customerName = order.customerType === 'GUEST'
    ? order.guestName || 'Khách vãng lai'
    : order.customer?.user?.name || 'Khách hàng'

  const customerPhone = order.customerType === 'GUEST'
    ? order.guestPhone
    : undefined

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

  // Send email to employee (non-blocking)
  import('@/lib/email-service').then(({ EmailService }) => {
    EmailService.sendNewOrderToEmployee({
      orderNumber: order.orderNumber,
      customerName,
      customerPhone: customerPhone || undefined,
      totalAmount: order.netAmount,
      itemCount: order.orderItems?.length || 0
    }).catch(err => console.error('Email to employee error:', err))
  }).catch(err => console.error('Email import error:', err))
}

/**
 * Create notification for order status update (for customer)
 */
export async function createOrderStatusNotificationForCustomer(order: {
  id: string
  orderNumber: string
  status: string
  customer?: { userId?: string | null } | null
}, trackingToken?: string) {
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
  let message = `Đơn hàng của bạn ${statusMessage}`

  // Add tracking link for SHIPPED status
  if (order.status === 'SHIPPED' && trackingToken) {
    // In a real app, use an env var for the base URL. For now, relative or hardcoded expectation.
    // Client handling the notification should ideally render this as a link or button.
    // We can also put it in the data payload for the frontend to handle.
    message += `. Theo dõi đơn hàng: /track/${trackingToken}`
  }

  const notification: Notification = {
    type: 'ORDER_UPDATE',
    priority: order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'HIGH' : 'MEDIUM',
    title: `📦 Cập nhật đơn hàng: ${order.orderNumber}`,
    message: message,
    orderId: order.id,
    orderNumber: order.orderNumber,
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      // Firebase fails on undefined, so we only include keys that have values
      ...(trackingToken ? { trackingToken } : {}),
      ...(trackingToken ? { trackingUrl: `/track/${trackingToken}` } : {})
    }
  }

  await saveNotificationForUser(notification, order.customer.userId)
}

/**
 * Create notification for stock update (formerly via WebSocket)
 */
export async function createStockUpdateNotification(data: {
  productId: string
  productName: string
  sku?: string
  currentStock: number
  previousStock: number
}) {
  const notification: Notification = {
    type: 'STOCK_UPDATE',
    priority: 'LOW',
    title: `🔄 Cập nhật tồn kho: ${data.productName}`,
    message: `Số lượng thay đổi: ${data.previousStock} -> ${data.currentStock}`,
    productId: data.productId,
    productName: data.productName,
    data: {
      ...data,
      timestamp: new Date().toISOString()
    }
  }

  // Stock updates are primarily for managers and employees to see live changes
  await saveNotificationForAllManagers(notification)
}

/**
 * Create notification for low stock alert (formerly via WebSocket)
 */
export async function createLowStockAlertNotification(data: {
  productId: string
  productName: string
  sku?: string
  currentStock: number
  minStockLevel: number
}) {
  const isOutOfStock = data.currentStock <= 0

  const notification: Notification = {
    type: 'LOW_STOCK',
    priority: isOutOfStock ? 'HIGH' : 'MEDIUM',
    title: isOutOfStock ? `🚫 Hết hàng: ${data.productName}` : `⚠️ Sắp hết hàng: ${data.productName}`,
    message: isOutOfStock
      ? `Sản phẩm ${data.productName} đã hết hàng trong kho!`
      : `Sản phẩm ${data.productName} còn ${data.currentStock} cái. Mức tối thiểu: ${data.minStockLevel}`,
    productId: data.productId,
    productName: data.productName,
    data: {
      ...data,
      alertType: isOutOfStock ? 'out_of_stock' : 'low_stock',
      timestamp: new Date().toISOString()
    }
  }

  await saveNotificationForAllManagers(notification)
}

/**
 * Notify matching contractors when a new marketplace project is posted
 */
export async function notifyMatchingContractors(project: {
  id: string
  title: string
  projectType: string
  city: string
  district?: string | null
  estimatedBudget?: number | null
  isUrgent?: boolean
}) {
  // Mapping project types to contractor skills
  const PROJECT_TYPE_TO_SKILLS: Record<string, string[]> = {
    'NEW_CONSTRUCTION': ['CONSTRUCTION', 'MASONRY'],
    'RENOVATION': ['RENOVATION', 'CONSTRUCTION'],
    'INTERIOR': ['INTERIOR', 'CARPENTRY'],
    'EXTERIOR': ['CONSTRUCTION', 'PAINTING', 'ROOFING'],
    'FLOORING': ['FLOORING', 'TILING'],
    'PAINTING': ['PAINTING'],
    'PLUMBING': ['PLUMBING'],
    'ELECTRICAL': ['ELECTRICAL'],
    'ROOFING': ['ROOFING'],
    'OTHER': []
  }

  const requiredSkills = PROJECT_TYPE_TO_SKILLS[project.projectType] || []

  // Find contractors with matching skills or in same city
  const contractorProfiles = await prisma.contractorProfile.findMany({
    where: {
      isVerified: true,
      isAvailable: true,
      OR: [
        // Match by skills
        ...(requiredSkills.length > 0 ? [{
          skills: { hasSome: requiredSkills }
        }] : []),
        // Match by city
        ...(project.city ? [{
          city: { equals: project.city, mode: 'insensitive' as const }
        }] : [])
      ]
    },
    select: {
      customerId: true,
      displayName: true,
      skills: true,
      city: true
    }
  })

  if (contractorProfiles.length === 0) return

  // Get user IDs for the matching contractors
  const customerIds = contractorProfiles.map(p => p.customerId)
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, userId: true }
  })

  const customerUserMap = new Map(customers.map(c => [c.id, c.userId]))

  // Create notifications for each matching contractor
  for (const profile of contractorProfiles) {
    const userId = customerUserMap.get(profile.customerId)
    if (!userId) continue

    // Determine match reason
    const matchedSkills = requiredSkills.filter(s => profile.skills.includes(s))
    const sameCity = profile.city?.toLowerCase() === project.city?.toLowerCase()

    let matchReason = ''
    if (matchedSkills.length > 0 && sameCity) {
      matchReason = 'Khớp chuyên môn và vị trí'
    } else if (matchedSkills.length > 0) {
      matchReason = 'Khớp chuyên môn của bạn'
    } else if (sameCity) {
      matchReason = 'Trong khu vực của bạn'
    }

    const notification: Notification = {
      type: 'PROJECT_MATCH',
      priority: project.isUrgent ? 'HIGH' : 'MEDIUM',
      title: project.isUrgent
        ? `Dự án gấp: ${project.title}`
        : `Dự án mới phù hợp: ${project.title}`,
      message: `${matchReason}. ${project.city}${project.estimatedBudget ? ` - ${(project.estimatedBudget / 1000000).toFixed(0)} triệu` : ''}`,
      data: {
        projectId: project.id,
        projectTitle: project.title,
        projectType: project.projectType,
        city: project.city,
        estimatedBudget: project.estimatedBudget,
        isUrgent: project.isUrgent,
        matchReason
      }
    }

    await saveNotificationForUser(notification, userId, 'CUSTOMER')
  }
}
