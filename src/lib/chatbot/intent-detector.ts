/**
 * Intent Detector - Phát hiện ý định của người dùng
 * 
 * CRITICAL: Admin và Customer intents PHẢI được tách biệt hoàn toàn
 * - Customer KHÔNG BAO GIỜ được truy cập ADMIN_ intents
 * - Admin có thể có fallback riêng, không dùng chung với Customer
 * - Pattern matching phải chính xác để tránh false positives
 */

export type UserIntent =
  // ===== CUSTOMER INTENTS =====
  // Chỉ dành cho khách hàng thông thường
  | 'ORDER_CREATE'           // Muốn đặt hàng (customer tạo đơn mới)
  | 'ORDER_QUERY'            // Hỏi về đơn hàng của chính họ (tracking)
  | 'PRODUCT_SEARCH'         // Tìm sản phẩm để mua
  | 'PRICE_INQUIRY'          // Hỏi giá sản phẩm
  | 'MATERIAL_CALCULATE'     // Tính toán vật liệu cần thiết
  | 'GENERAL_INQUIRY'        // Hỏi chung chung về sản phẩm/dịch vụ
  
  // ===== ADMIN INTENTS =====
  // Chỉ dành cho MANAGER/EMPLOYEE - có security check
  | 'ADMIN_ANALYTICS'        // Thống kê, báo cáo, doanh thu
  | 'ADMIN_OCR_INVOICE'      // OCR hóa đơn nhập hàng
  | 'ADMIN_CRUD_CREATE'      // Thêm mới sản phẩm/data (MANAGER only)
  | 'ADMIN_CRUD_UPDATE'      // Cập nhật sản phẩm/data (MANAGER only)
  | 'ADMIN_CRUD_DELETE'      // Xóa sản phẩm/data (MANAGER only)
  | 'ADMIN_ORDER_MANAGE'     // Quản lý TẤT CẢ đơn hàng (duyệt, xác nhận, hủy)
  | 'ADMIN_INVENTORY_CHECK'  // Kiểm tra tồn kho toàn hệ thống
  | 'ADMIN_EMPLOYEE_QUERY'   // Hỏi về nhân viên, ca làm
  | 'ADMIN_PAYROLL_QUERY'    // Hỏi về lương, ứng lương

export interface IntentResult {
  intent: UserIntent
  confidence: number
  entities?: Record<string, any>
  requiresConfirmation?: boolean
}

/**
 * Detect user intent from message
 * 
 * @param message - User's message
 * @param isAdmin - Is user admin/manager/employee?
 * @param hasImage - Does message include image?
 * @param conversationContext - Previous conversation context
 * 
 * @returns IntentResult with detected intent and confidence
 * 
 * EXAMPLES:
 * 
 * ADMIN queries:
 * - "Doanh thu hôm nay" → ADMIN_ANALYTICS
 * - "Đơn hàng chờ xử lý" → ADMIN_ORDER_MANAGE (admin managing ALL orders)
 * - "Sản phẩm sắp hết" → ADMIN_INVENTORY_CHECK
 * - "Top bán chạy" → ADMIN_ANALYTICS
 * - "Ai nghỉ hôm nay" → ADMIN_EMPLOYEE_QUERY
 * 
 * CUSTOMER queries:
 * - "Tôi muốn mua 10 bao xi măng" → ORDER_CREATE (customer creating order)
 * - "Đơn hàng của tôi ở đâu?" → ORDER_QUERY (customer tracking THEIR order)
 * - "Tìm xi măng" → PRODUCT_SEARCH
 * - "Giá xi măng" → PRICE_INQUIRY
 * - "Tính vật liệu xây nhà 3 tầng" → MATERIAL_CALCULATE
 */
export function detectIntent(
  message: string, 
  isAdmin: boolean = false,
  hasImage: boolean = false,
  conversationContext?: any
): IntentResult {
  const lower = message.toLowerCase()
  
  // ===== ADMIN INTENTS =====
  // ONLY processed if isAdmin = true
  if (isAdmin) {
    // OCR Invoice (with image)
    if (hasImage && (
      lower.includes('hóa đơn') || 
      lower.includes('hoá đơn') ||
      lower.includes('invoice') ||
      lower.includes('phiếu') ||
      lower.includes('bill')
    )) {
      return {
        intent: 'ADMIN_OCR_INVOICE',
        confidence: 0.95,
        requiresConfirmation: true
      }
    }
    
    // Analytics queries
    if (
      lower.includes('doanh thu') || 
      lower.includes('revenue') ||
      lower.includes('bán được') ||
      lower.includes('bán bao nhiêu') ||
      lower.includes('tổng') ||
      lower.includes('thống kê') ||
      lower.includes('báo cáo') ||
      lower.includes('report') ||
      lower.includes('bán chạy') ||
      lower.includes('top sản phẩm') ||
      lower.includes('best selling') ||
      lower.includes('khách hàng mới') ||
      lower.includes('new customer') ||
      lower.includes('khách hàng vip') ||
      lower.includes('vip customer') ||
      lower.includes('tuần này') ||
      lower.includes('this week') ||
      lower.includes('hôm nay') ||
      lower.includes('today')
    ) {
      return {
        intent: 'ADMIN_ANALYTICS',
        confidence: 0.90
      }
    }
    
    // Employee queries
    if (
      lower.includes('nhân viên') ||
      lower.includes('employee') ||
      lower.includes('ai nghỉ') ||
      lower.includes('ai làm') ||
      lower.includes('ca làm') ||
      lower.includes('shift')
    ) {
      return {
        intent: 'ADMIN_EMPLOYEE_QUERY',
        confidence: 0.88
      }
    }
    
    // Payroll queries
    if (
      lower.includes('lương') ||
      lower.includes('salary') ||
      lower.includes('ứng lương') ||
      lower.includes('advance') ||
      lower.includes('payroll')
    ) {
      return {
        intent: 'ADMIN_PAYROLL_QUERY',
        confidence: 0.88
      }
    }
    
    // CRUD - CREATE
    if (
      lower.includes('thêm') || 
      lower.includes('tạo') ||
      lower.includes('add') ||
      lower.includes('create') ||
      lower.includes('new')
    ) {
      return {
        intent: 'ADMIN_CRUD_CREATE',
        confidence: 0.85,
        requiresConfirmation: true
      }
    }
    
    // CRUD - UPDATE
    if (
      lower.includes('cập nhật') ||
      lower.includes('sửa') ||
      lower.includes('chỉnh') ||
      lower.includes('update') ||
      lower.includes('edit') ||
      lower.includes('modify') ||
      lower.includes('change')
    ) {
      return {
        intent: 'ADMIN_CRUD_UPDATE',
        confidence: 0.85,
        requiresConfirmation: true
      }
    }
    
    // CRUD - DELETE
    if (
      lower.includes('xóa') ||
      lower.includes('delete') ||
      lower.includes('remove')
    ) {
      return {
        intent: 'ADMIN_CRUD_DELETE',
        confidence: 0.90,
        requiresConfirmation: true
      }
    }
    
    // Order management (Admin-specific patterns only)
    if (
      lower.includes('chờ xử lý') ||
      lower.includes('pending') ||
      lower.includes('xác nhận đơn') ||
      lower.includes('duyệt đơn') ||
      lower.includes('confirm order') ||
      (lower.includes('đơn hàng') && (lower.includes('xác nhận') || lower.includes('duyệt') || lower.includes('từ chối') || lower.includes('chờ') || lower.includes('mới nhất') || lower.includes('recent'))) ||
      (lower.includes('đơn') && (lower.includes('chờ') || lower.includes('duyệt') || lower.includes('xác nhận') || lower.includes('xử lý')))
    ) {
      return {
        intent: 'ADMIN_ORDER_MANAGE',
        confidence: 0.88
      }
    }
    
    // Inventory check
    if (
      lower.includes('tồn kho') ||
      lower.includes('inventory') ||
      lower.includes('stock') ||
      lower.includes('sắp hết') ||
      lower.includes('low stock') ||
      lower.includes('còn lại')
    ) {
      return {
        intent: 'ADMIN_INVENTORY_CHECK',
        confidence: 0.90
      }
    }
  }
  
  // ===== CUSTOMER INTENTS =====
  
  // Comparison/Advisory (check early to avoid false PRODUCT_SEARCH)
  if (
    (lower.includes('hay') && (lower.includes('tốt hơn') || lower.includes('better'))) ||
    lower.includes('so sánh') ||
    lower.includes('compare') ||
    lower.includes('khác nhau') ||
    lower.includes('difference') ||
    lower.includes('nên dùng') ||
    lower.includes('nên chọn')
  ) {
    return {
      intent: 'GENERAL_INQUIRY',
      confidence: 0.85
    }
  }
  
  // Price inquiry (check BEFORE order creation to avoid conflicts)
  if (
    lower.includes('giá') || 
    lower.includes('price') ||
    (lower.includes('bao nhiêu') && (lower.includes('tiền') || lower.includes('1 bao') || lower.includes('1 viên') || lower.includes('1 m'))) ||
    lower.includes('how much') ||
    lower.includes('cost') ||
    /\d+k\s*à/i.test(message) ||
    lower.includes('rẻ hơn') ||
    lower.includes('cheaper')
  ) {
    return {
      intent: 'PRICE_INQUIRY',
      confidence: 0.85
    }
  }
  
  // Material calculation (check BEFORE order to handle "cần bao nhiêu" correctly)
  if (
    // Direct calculation requests
    (lower.includes('tính') && (lower.includes('vật liệu') || lower.includes('material') || lower.includes('m²') || lower.includes('m2'))) ||
    (lower.includes('cần bao nhiêu') && (lower.includes('m²') || lower.includes('m2') || lower.includes('cho'))) ||
    (lower.includes('cần gì') && (lower.includes('để') || lower.includes('cho') || lower.includes('m²') || lower.includes('m2'))) ||
    (lower.includes('làm') && (lower.includes('m²') || lower.includes('m2')) && lower.includes('cần')) ||
    // Construction project mentions
    ((lower.includes('xây') || lower.includes('build') || lower.includes('làm') || lower.includes('dựng')) && 
     (lower.includes('nhà') || lower.includes('tường') || lower.includes('sàn') || lower.includes('house') || lower.includes('wall') || lower.includes('floor'))) ||
    // Floor/area mentions
    (/\d+\s*(tầng|floor|m²|m2)/i.test(message) && (lower.includes('xây') || lower.includes('cần') || lower.includes('làm')))
  ) {
    return {
      intent: 'MATERIAL_CALCULATE',
      confidence: 0.90
    }
  }
  
  // Order query (Customer-specific: tracking their own orders)
  if (
    ((lower.includes('đơn hàng') || lower.includes('order')) &&
     (lower.includes('của tôi') || lower.includes('my') || lower.includes('tôi đã') || 
      lower.includes('theo dõi') || lower.includes('track') || lower.includes('kiểm tra') || 
      lower.includes('check') || lower.includes('ở đâu') || lower.includes('where') || /#\d+/.test(message))) ||
    // Question about past orders: "tôi đã đặt hàng chưa"
    (lower.includes('tôi đã') && (lower.includes('đặt') || lower.includes('mua')) && 
     (lower.includes('chưa') || lower.includes('?'))) ||
    // Customer asking about order status
    (lower.includes('đơn') && (lower.includes('của tôi') || lower.includes('đến đâu') || lower.includes('status')))
  ) {
    return {
      intent: 'ORDER_QUERY',
      confidence: 0.88
    }
  }
  
  // Order creation - Enhanced detection
  // Case 1: After calculation/product list
  if (
    (lower.includes('đặt') || lower.includes('mua') || lower.includes('order') || lower.includes('buy')) &&
    (conversationContext?.hasCalculation || conversationContext?.hasProductList)
  ) {
    return {
      intent: 'ORDER_CREATE',
      confidence: 0.92,
      requiresConfirmation: true
    }
  }
  
  // Case 2: Direct order with quantity and product (e.g., "tôi muốn mua 10 bao xi măng")
  if (
    (lower.includes('đặt') || lower.includes('mua') || lower.includes('order') || lower.includes('buy')) &&
    /(\d+)\s*(bao|m³|m2|m²|tấn|kg|viên|cây|cuộn|thùng)/i.test(message) &&
    /(xi măng|xi mang|cement|cát|cat|sand|gạch|gach|brick|sắt|sat|thép|thep|steel|đá|da|stone|sơn|son|paint|tôn|ton|ngói|ngoi)/i.test(message) &&
    !lower.includes('bao nhiêu tiền')
  ) {
    return {
      intent: 'ORDER_CREATE',
      confidence: 0.88,
      requiresConfirmation: true
    }
  }
  
  // Case 3: Order without items (need clarification) - "đặt hàng", "mua hàng"
  if (
    (lower.includes('đặt hàng') || lower.includes('mua hàng') || 
     (lower.includes('tôi muốn') && (lower.includes('đặt') || lower.includes('mua'))) ||
     (lower.includes('tôi cần') && (lower.includes('đặt') || lower.includes('mua')))) &&
    !/(\d+)\s*(bao|m³|m2|m²|tấn|kg|viên|cây|cuộn|thùng)/i.test(message)
  ) {
    return {
      intent: 'ORDER_CREATE',
      confidence: 0.70,
      requiresConfirmation: true
    }
  }
  
  // Case 4: Implicit order (quantity + product without "mua/đặt")
  if (
    !lower.includes('giá') && 
    !lower.includes('price') &&
    !lower.includes('tính') &&
    !lower.includes('bao nhiêu') &&
    !lower.includes('cần') &&
    /(\d+)\s*(bao|m³|m2|m²|tấn|kg|viên|cây|cuộn|thùng)/i.test(message) &&
    /(xi măng|xi mang|cement|cát|cat|sand|gạch|gach|brick|sắt|sat|thép|thep|steel|đá|da|stone|sơn|son|paint|tôn|ton|ngói|ngoi)/i.test(message)
  ) {
    return {
      intent: 'ORDER_CREATE',
      confidence: 0.75,
      requiresConfirmation: true
    }
  }
  
  // Product search - ENHANCED to detect specific product mentions
  // But avoid very generic questions
  if (
    (lower.includes('tìm') ||
     lower.includes('search') ||
     (lower.includes('có') && !(/^có\s*(không|ko)?\s*$/i.test(message.trim()))) || // avoid "có không"
     lower.includes('bán') ||
     lower.includes('sell') ||
     (lower.includes('muốn') && !/^(tôi|em|anh|chị)?\s*muốn\s*(đặt|mua)\s*$/i.test(message.trim())) ||
     (lower.includes('cần') && !lower.includes('tư vấn')) || // avoid "cần tư vấn"
     lower.includes('mua') ||
     lower.includes('đặt') ||
     // Specific materials
     /\b(xi măng|xi mang|cement|cát|cat|sand|gạch|gach|brick|sắt|sat|thép|thep|steel|đá|da|stone|sơn|son|paint|tôn|ton|ngói|ngoi|gỗ|go|wood|thạch cao|keo|vữa|vua|ống|ong|đinh|dinh|vít|vit)\b/i.test(message)) &&
    // Not a very generic/ambiguous question
    message.trim().length > 3
  ) {
    return {
      intent: 'PRODUCT_SEARCH',
      confidence: 0.90
    }
  }
  
  // Default
  return {
    intent: 'GENERAL_INQUIRY',
    confidence: 0.70
  }
}

/**
 * Check if intent requires admin permissions
 */
export function requiresAdminPermission(intent: UserIntent): boolean {
  return intent.startsWith('ADMIN_')
}

/**
 * Check if intent requires MANAGER role specifically
 */
export function requiresManagerRole(intent: UserIntent): boolean {
  return [
    'ADMIN_CRUD_CREATE',
    'ADMIN_CRUD_UPDATE',
    'ADMIN_CRUD_DELETE',
    'ADMIN_PAYROLL_QUERY'
  ].includes(intent)
}

/**
 * Get suggested actions for intent
 */
export function getSuggestedActions(intent: UserIntent): string[] {
  const suggestions: Record<UserIntent, string[]> = {
    'ORDER_CREATE': ['Xác nhận đặt hàng', 'Chỉnh sửa', 'Hủy'],
    'ORDER_QUERY': ['Xem chi tiết', 'Theo dõi vận chuyển', 'Liên hệ hỗ trợ'],
    'PRODUCT_SEARCH': ['Xem sản phẩm', 'So sánh giá', 'Thêm vào giỏ'],
    'PRICE_INQUIRY': ['Báo giá chi tiết', 'Giảm giá số lượng lớn', 'So sánh sản phẩm'],
    'MATERIAL_CALCULATE': ['Xem danh sách', 'Đặt hàng', 'Điều chỉnh tính toán'],
    'GENERAL_INQUIRY': ['Tìm sản phẩm', 'Tính vật liệu', 'Liên hệ'],
    
    'ADMIN_ANALYTICS': ['Chi tiết hơn', 'Xuất báo cáo', 'So sánh kỳ trước'],
    'ADMIN_OCR_INVOICE': ['Lưu hóa đơn', 'Chỉnh sửa', 'Hủy'],
    'ADMIN_CRUD_CREATE': ['Xác nhận tạo', 'Xem trước', 'Hủy'],
    'ADMIN_CRUD_UPDATE': ['Xác nhận cập nhật', 'Xem thay đổi', 'Hủy'],
    'ADMIN_CRUD_DELETE': ['Xác nhận xóa', 'Hủy'],
    'ADMIN_ORDER_MANAGE': ['Xác nhận', 'Từ chối', 'Xem chi tiết'],
    'ADMIN_INVENTORY_CHECK': ['Đặt hàng NCC', 'Cập nhật tồn', 'Chi tiết'],
    'ADMIN_EMPLOYEE_QUERY': ['Xem chi tiết', 'Chấm công', 'Phân công'],
    'ADMIN_PAYROLL_QUERY': ['Chi tiết lương', 'Duyệt ứng', 'Xuất bảng lương']
  }
  
  return suggestions[intent] || []
}
