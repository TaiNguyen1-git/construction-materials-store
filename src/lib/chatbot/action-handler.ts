/**
 * Action Handler - Handle CRUD operations via chatbot
 * MANAGER role required for all operations
 */

import { prisma } from '@/lib/prisma'
import { ExtractedEntities } from './entity-extractor'

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'QUERY'
export type EntityType = 'product' | 'order' | 'employee' | 'invoice' | 'customer' | 'supplier'

export interface ActionRequest {
  action: ActionType
  entityType: EntityType
  entities: ExtractedEntities
  rawMessage: string
  userId: string
  userRole: string
}

export interface ActionResult {
  success: boolean
  message: string
  data?: any
  requiresConfirmation?: boolean
  confirmationPrompt?: string
  error?: string
}

/**
 * Execute admin action
 */
export async function executeAction(request: ActionRequest): Promise<ActionResult> {
  // Check permissions
  if (request.userRole !== 'MANAGER') {
    return {
      success: false,
      message: '⛔ Chỉ MANAGER mới có quyền thực hiện thao tác này.',
      error: 'INSUFFICIENT_PERMISSIONS'
    }
  }

  // Route to appropriate handler
  switch (request.entityType) {
    case 'product':
      return handleProductAction(request)
    case 'order':
      return handleOrderAction(request)
    case 'employee':
      return handleEmployeeAction(request)
    case 'invoice':
      return handleInvoiceAction(request)
    case 'customer':
      return handleCustomerAction(request)
    default:
      return {
        success: false,
        message: `❌ Entity type "${request.entityType}" không được hỗ trợ.`,
        error: 'UNSUPPORTED_ENTITY'
      }
  }
}

// ─── Audit Logging ───────────────────────────────────────────────────────────────

/**
 * Write a non-blocking audit record to the DB.
 * Failures are logged but never throw so callers are unaffected.
 */
async function auditLog(params: {
  action: 'ADMIN_OVERRIDE' | 'ORDER_CREATE' | 'ORDER_CANCEL'
  entityType: string
  entityId?: string
  actorRole: string
  actorId: string
  details: string
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action as any, // Cast to any because Prisma enum is strict but we want flexibility if possible, or just use the enum
        entityType: params.entityType,
        entityId: params.entityId,
        actorId: params.actorId && params.actorId.length === 24 ? params.actorId : undefined, // MongoDB ObjectId check
        actorRole: params.actorRole,
        newValue: { details: params.details },
      }
    })
  } catch (err) {
    // Non-critical — never block the main flow
    console.warn('[AuditLog] Failed to write audit record:', err)
  }
}

/**
 * Handle product CRUD operations
 */
async function handleProductAction(request: ActionRequest): Promise<ActionResult> {
  const { action, entities, rawMessage } = request
  
  try {
    switch (action) {
      case 'CREATE': {
        // Extract product data from message
        if (!entities.productName) {
          return {
            success: false,
            message: '❌ Vui lòng cung cấp tên sản phẩm.\n\nVí dụ: "Thêm sản phẩm Xi măng Holcim PC40 giá 110k"',
            error: 'MISSING_PRODUCT_NAME'
          }
        }
        
        // Find or create category
        let categoryId: string
        if (entities.productCategory) {
          const category = await prisma.category.findFirst({
            where: { name: { contains: entities.productCategory, mode: 'insensitive' } }
          })
          categoryId = category?.id || (await prisma.category.findFirst({ where: { name: 'OTHER' } }))?.id || ''
        } else {
          const otherCategory = await prisma.category.findFirst({ where: { name: 'OTHER' } })
          categoryId = otherCategory?.id || ''
        }
        
        if (!categoryId) {
          return {
            success: false,
            message: '❌ Không tìm thấy danh mục sản phẩm. Vui lòng tạo danh mục trước.',
            error: 'CATEGORY_NOT_FOUND'
          }
        }
        
        // Create product (simplified - in production, need more fields)
        const product = await prisma.product.create({
          data: {
            name: entities.productName,
            description: `Sản phẩm được tạo qua chatbot: ${rawMessage}`,
            price: entities.price || 0,
            unit: entities.unit || 'bao',
            categoryId,
            sku: `SKU-${Date.now()}`,
            images: [],
            tags: [],
            isActive: true,
            isFeatured: false
          },
          include: {
            category: true
          }
        })
        
        auditLog({ action: 'ADMIN_OVERRIDE', entityType: 'product', entityId: product.id, actorRole: request.userRole, actorId: request.userId, details: `Chatbot: tạo sản phẩm "${product.name}" (SKU: ${product.sku})` }).catch(() => {})
        return {
          success: true,
          message: `✅ Đã tạo sản phẩm **${product.name}**\n\n` +
                   `- SKU: ${product.sku}\n` +
                   `- Giá: ${product.price.toLocaleString('vi-VN')}đ/${product.unit}\n` +
                   `- Danh mục: ${product.category.name}`,
          data: product
        }
      }
      
      case 'UPDATE': {
        // Need product ID or name to update
        const productName = entities.productName
        if (!productName) {
          return {
            success: false,
            message: '❌ Vui lòng chỉ định sản phẩm cần cập nhật.\n\nVí dụ: "Cập nhật giá Xi măng PC40 thành 115k"',
            error: 'MISSING_PRODUCT_IDENTIFIER'
          }
        }
        
        // Find product
        const product = await prisma.product.findFirst({
          where: {
            name: { contains: productName, mode: 'insensitive' }
          }
        })
        
        if (!product) {
          return {
            success: false,
            message: `❌ Không tìm thấy sản phẩm "${productName}"`,
            error: 'PRODUCT_NOT_FOUND'
          }
        }
        
        // Update fields that were provided
        const updateData: any = {}
        if (entities.price) updateData.price = entities.price
        if (entities.unit) updateData.unit = entities.unit
        
        if (Object.keys(updateData).length === 0) {
          return {
            success: false,
            message: '❌ Không có thông tin cập nhật.\n\nVí dụ: "Cập nhật giá [tên sản phẩm] thành [giá mới]"',
            error: 'NO_UPDATE_DATA'
          }
        }
        
        const updated = await prisma.product.update({
          where: { id: product.id },
          data: updateData
        })
        
        auditLog({ action: 'ADMIN_OVERRIDE', entityType: 'product', entityId: product.id, actorRole: request.userRole, actorId: request.userId, details: `Chatbot: cập nhật "${updated.name}" → ${JSON.stringify(updateData)}` }).catch(() => {})
        return {
          success: true,
          message: `✅ Đã cập nhật **${updated.name}**\n\n` +
                   (entities.price ? `- Giá mới: ${updated.price.toLocaleString('vi-VN')}đ\n` : '') +
                   (entities.unit ? `- Đơn vị: ${updated.unit}\n` : ''),
          data: updated
        }
      }
      
      case 'DELETE': {
        const productName = entities.productName
        if (!productName) {
          return {
            success: false,
            message: '❌ Vui lòng chỉ định sản phẩm cần xóa.',
            error: 'MISSING_PRODUCT_IDENTIFIER',
            requiresConfirmation: true
          }
        }
        
        // Find product
        const product = await prisma.product.findFirst({
          where: {
            name: { contains: productName, mode: 'insensitive' }
          }
        })
        
        if (!product) {
          return {
            success: false,
            message: `❌ Không tìm thấy sản phẩm "${productName}"`,
            error: 'PRODUCT_NOT_FOUND'
          }
        }
        
        // Soft delete (set isActive = false)
        await prisma.product.update({
          where: { id: product.id },
          data: { isActive: false }
        })
        
        auditLog({ action: 'ADMIN_OVERRIDE', entityType: 'product', entityId: product.id, actorRole: request.userRole, actorId: request.userId, details: `Chatbot: vô hiệu hóa sản phẩm "${product.name}"` }).catch(() => {})
        return {
          success: true,
          message: `🗑️ Đã xóa sản phẩm **${product.name}**\n\n` +
                   `Sản phẩm đã được vô hiệu hóa và sẽ không hiển thị trên website.`,
          data: { productId: product.id }
        }
      }
      
      default:
        return {
          success: false,
          message: `❌ Action "${action}" không được hỗ trợ cho sản phẩm.`,
          error: 'UNSUPPORTED_ACTION'
        }
    }
  } catch (error: any) {
    console.error('Product action error:', error)
    return {
      success: false,
      message: `❌ Lỗi khi thực hiện: ${error.message}`,
      error: 'DATABASE_ERROR'
    }
  }
}

/**
 * Handle order CRUD operations
 */
async function handleOrderAction(request: ActionRequest): Promise<ActionResult> {
  const { action, entities } = request
  
  try {
    switch (action) {
      case 'UPDATE': {
        const orderNumber = entities.orderNumber
        if (!orderNumber) {
          return {
            success: false,
            message: '❌ Vui lòng cung cấp số đơn hàng.\n\nVí dụ: "Xác nhận đơn #ORD-20250115-0042"',
            error: 'MISSING_ORDER_NUMBER'
          }
        }
        
        // Find order
        const order = await prisma.order.findFirst({
          where: { orderNumber }
        })
        
        if (!order) {
          return {
            success: false,
            message: `❌ Không tìm thấy đơn hàng ${orderNumber}`,
            error: 'ORDER_NOT_FOUND'
          }
        }
        
        // Determine status change based on message
        let newStatus = order.status
        const lower = request.rawMessage.toLowerCase()
        
        if (lower.includes('xác nhận') || lower.includes('confirm')) {
          newStatus = 'CONFIRMED'
        } else if (lower.includes('hủy') || lower.includes('cancel')) {
          newStatus = 'CANCELLED'
        } else if (lower.includes('hoàn thành') || lower.includes('complete') || lower.includes('giao hàng')) {
          newStatus = 'DELIVERED'
        }
        
        // Update order
        const updated = await prisma.order.update({
          where: { id: order.id },
          data: { status: newStatus }
        })
        
        auditLog({ action: 'ADMIN_OVERRIDE', entityType: 'order', entityId: order.id, actorRole: request.userRole, actorId: request.userId, details: `Chatbot: đổi trạng thái đơn ${orderNumber} từ ${order.status} → ${newStatus}` }).catch(() => {})
        return {
          success: true,
          message: `✅ Đã cập nhật đơn hàng **${orderNumber}**\n\n` +
                   `- Trạng thái: ${getStatusLabel(newStatus)}\n` +
                   `- Tổng tiền: ${updated.netAmount.toLocaleString('vi-VN')}đ`,
          data: updated
        }
      }
      
      default:
        return {
          success: false,
          message: `❌ Action "${action}" không được hỗ trợ cho đơn hàng.\n\nGợi ý: Sử dụng "Xác nhận đơn #XXX" hoặc "Hủy đơn #XXX"`,
          error: 'UNSUPPORTED_ACTION'
        }
    }
  } catch (error: any) {
    console.error('Order action error:', error)
    return {
      success: false,
      message: `❌ Lỗi: ${error.message}`,
      error: 'DATABASE_ERROR'
    }
  }
}

/**
 * Handle employee CRUD operations
 */
async function handleEmployeeAction(request: ActionRequest): Promise<ActionResult> {
  const { action, entities } = request
  
  try {
    switch (action) {
      case 'QUERY': {
        // Handle salary advance queries
        if (request.rawMessage.toLowerCase().includes('ứng lương')) {
          const employeeName = entities.employeeName
          
          if (!employeeName) {
            return {
              success: false,
              message: '❌ Vui lòng chỉ định nhân viên.\n\nVí dụ: "Ứng lương 5 triệu cho Nguyễn Văn A"',
              error: 'MISSING_EMPLOYEE_NAME'
            }
          }
          
          // Find employee
          const employee = await prisma.employee.findFirst({
            where: {
              user: {
                name: { contains: employeeName, mode: 'insensitive' }
              }
            },
            include: { user: true }
          })
          
          if (!employee) {
            return {
              success: false,
              message: `❌ Không tìm thấy nhân viên "${employeeName}"`,
              error: 'EMPLOYEE_NOT_FOUND'
            }
          }
          
          const amount = entities.amount || entities.price || 0
          
          if (amount <= 0) {
            return {
              success: false,
              message: '❌ Vui lòng chỉ định số tiền ứng.\n\nVí dụ: "Ứng lương 5 triệu cho [tên nhân viên]"',
              error: 'MISSING_AMOUNT'
            }
          }
          
          return {
            success: true,
            message: `💰 **Yêu cầu ứng lương**\n\n` +
                     `- Nhân viên: ${employee.user.name}\n` +
                     `- Số tiền: ${amount.toLocaleString('vi-VN')}đ\n\n` +
                     `⚠️ Lưu ý: Chức năng này chỉ tạo thông báo. Vui lòng vào mục Payroll để xử lý.`,
            requiresConfirmation: true,
            confirmationPrompt: 'Xác nhận tạo yêu cầu ứng lương?',
            data: {
              employeeId: employee.id,
              employeeName: employee.user.name,
              amount
            }
          }
        }
        
        return {
          success: false,
          message: '❌ Query không được hỗ trợ.',
          error: 'UNSUPPORTED_QUERY'
        }
      }
      
      default:
        return {
          success: false,
          message: `❌ Action "${action}" cho nhân viên chưa được triển khai.`,
          error: 'NOT_IMPLEMENTED'
        }
    }
  } catch (error: any) {
    console.error('Employee action error:', error)
    return {
      success: false,
      message: `❌ Lỗi: ${error.message}`,
      error: 'DATABASE_ERROR'
    }
  }
}

/**
 * Handle invoice CRUD operations
 */
async function handleInvoiceAction(request: ActionRequest): Promise<ActionResult> {
  // Invoice creation is handled separately via OCR flow
  return {
    success: false,
    message: '💡 Để tạo hóa đơn, vui lòng upload ảnh hóa đơn và tôi sẽ tự động nhận diện.',
    error: 'USE_OCR_FLOW'
  }
}

/**
 * Handle customer CRUD operations
 */
async function handleCustomerAction(request: ActionRequest): Promise<ActionResult> {
  return {
    success: false,
    message: '❌ CRUD operations cho khách hàng chưa được triển khai.',
    error: 'NOT_IMPLEMENTED'
  }
}

/**
 * Get Vietnamese label for order status
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'PENDING': 'Chờ xử lý',
    'CONFIRMED': 'Đã xác nhận',
    'PROCESSING': 'Đang xử lý',
    'SHIPPED': 'Đang giao hàng',
    'COMPLETED': 'Hoàn thành',
    'CANCELLED': 'Đã hủy'
  }
  return labels[status] || status
}
