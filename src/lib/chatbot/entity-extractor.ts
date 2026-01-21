/**
 * Entity Extractor - Trích xuất thông tin từ natural language
 */

export interface ExtractedEntities {
  // Product entities
  productName?: string
  productCategory?: string
  quantity?: number
  unit?: string

  // Price entities
  price?: number
  currency?: string

  // Order entities
  orderNumber?: string
  orderStatus?: string

  // Employee entities
  employeeName?: string
  employeeId?: string

  // Date/time entities
  date?: Date
  dateRange?: { from: Date; to: Date }
  timeFrame?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year'

  // Analytics entities
  metric?: string
  aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min'

  // CRUD entities
  action?: 'create' | 'update' | 'delete'
  entityType?: 'product' | 'order' | 'employee' | 'invoice' | 'customer'
  entityId?: string

  // Numeric entities
  amount?: number
  percentage?: number
}

/**
 * Extract entities from message
 */
export function extractEntities(message: string, intent?: string): ExtractedEntities {
  const entities: ExtractedEntities = {}
  const lower = message.toLowerCase()

  // Extract quantity + unit
  const quantityMatch = lower.match(/(\d+(?:\.\d+)?)\s*(bao|m³|m2|m²|tấn|kg|tan|viên|cây|cuộn|thùng|bags?|tons?|pieces?)/i)
  if (quantityMatch) {
    entities.quantity = parseFloat(quantityMatch[1])
    entities.unit = normalizeUnit(quantityMatch[2])
  }

  // Extract price
  const priceMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:k|nghìn|triệu|tr|m|đ|đồng|vnd)/i)
  if (priceMatch) {
    const value = parseFloat(priceMatch[1])
    const unit = priceMatch[2]?.toLowerCase()

    if (unit === 'k' || unit === 'nghìn') {
      entities.price = value * 1000
    } else if (unit === 'triệu' || unit === 'tr' || unit === 'm') {
      entities.price = value * 1000000
    } else {
      entities.price = value
    }
    entities.currency = 'VND'
  }

  // Extract order number
  const orderMatch = lower.match(/#?ord[-_]?\d{8}[-_]?\d{4}|#?\d{4,}/i)
  if (orderMatch) {
    entities.orderNumber = orderMatch[0].replace('#', '')
  }

  // Extract time frame
  if (lower.includes('hôm nay') || lower.includes('today')) {
    entities.timeFrame = 'today'
    entities.date = new Date()
  } else if (lower.includes('hôm qua') || lower.includes('yesterday')) {
    entities.timeFrame = 'yesterday'
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    entities.date = yesterday
  } else if (lower.includes('tuần này') || lower.includes('this week')) {
    entities.timeFrame = 'this_week'
  } else if (lower.includes('tháng này') || lower.includes('this month')) {
    entities.timeFrame = 'this_month'
  } else if (lower.includes('năm nay') || lower.includes('this year')) {
    entities.timeFrame = 'this_year'
  }

  // Extract product category
  const categories = [
    { keywords: ['xi măng', 'cement'], value: 'cement' },
    { keywords: ['thép', 'steel', 'sắt'], value: 'steel' },
    { keywords: ['gạch', 'brick'], value: 'brick' },
    { keywords: ['cát', 'sand'], value: 'sand' },
    { keywords: ['đá', 'stone', 'gravel'], value: 'stone' },
    { keywords: ['ngói', 'tile', 'roof'], value: 'roofing' },
    { keywords: ['sơn', 'paint'], value: 'paint' },
    { keywords: ['tôn', 'sheet metal'], value: 'metal_sheet' }
  ]

  for (const cat of categories) {
    if (cat.keywords.some(kw => lower.includes(kw))) {
      entities.productCategory = cat.value
      break
    }
  }

  // Extract product name (simplified)
  const productPatterns = [
    /xi măng\s+(insee|hà tiên|holcim|hòa phát|pc\d+|pcb\d+)/i,
    /thép\s+(d\d+|tròn|vuông|hộp)/i,
    /gạch\s+(ống|đỏ|block|lát|ốp)/i,
    /sơn\s+(jotun|nippon|dulux|kova)/i
  ]

  for (const pattern of productPatterns) {
    const match = message.match(pattern)
    if (match) {
      entities.productName = match[0]
      break
    }
  }

  // Extract employee name (Vietnamese name pattern)
  const nameMatch = message.match(/(?:nhân viên|nv|employee)\s+([A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ][a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]*(?:\s+[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ][a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]*){1,3})/i)
  if (nameMatch) {
    entities.employeeName = nameMatch[1]
  }

  // Extract metric for analytics
  if (lower.includes('doanh thu') || lower.includes('revenue')) {
    entities.metric = 'revenue'
  } else if (lower.includes('đơn hàng') || lower.includes('orders')) {
    entities.metric = 'orders'
  } else if (lower.includes('khách hàng') || lower.includes('customers')) {
    entities.metric = 'customers'
  } else if (lower.includes('tồn kho') || lower.includes('inventory')) {
    entities.metric = 'inventory'
  }

  // Extract CRUD action
  if (lower.includes('thêm') || lower.includes('tạo') || lower.includes('add') || lower.includes('create')) {
    entities.action = 'create'
  } else if (lower.includes('sửa') || lower.includes('cập nhật') || lower.includes('update') || lower.includes('edit')) {
    entities.action = 'update'
  } else if (lower.includes('xóa') || lower.includes('delete') || lower.includes('remove')) {
    entities.action = 'delete'
  }

  // Extract entity type
  if (lower.includes('sản phẩm') || lower.includes('product')) {
    entities.entityType = 'product'
  } else if (lower.includes('đơn hàng') || lower.includes('order')) {
    entities.entityType = 'order'
  } else if (lower.includes('nhân viên') || lower.includes('employee')) {
    entities.entityType = 'employee'
  } else if (lower.includes('hóa đơn') || lower.includes('invoice')) {
    entities.entityType = 'invoice'
  } else if (lower.includes('khách hàng') || lower.includes('customer')) {
    entities.entityType = 'customer'
  }

  return entities
}

/**
 * Normalize unit names
 */
function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'bao': 'bao',
    'bag': 'bao',
    'bags': 'bao',
    'm³': 'm³',
    'm3': 'm³',
    'm2': 'm²',
    'm²': 'm²',
    'tấn': 'tấn',
    'tan': 'tấn',
    'ton': 'tấn',
    'tons': 'tấn',
    'kg': 'kg',
    'viên': 'viên',
    'piece': 'viên',
    'pieces': 'viên',
    'cây': 'cây',
    'cuộn': 'cuộn',
    'thùng': 'thùng'
  }

  return unitMap[unit.toLowerCase()] || unit
}

/**
 * Extract date range from natural language
 */
export function extractDateRange(message: string): { from: Date; to: Date } | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lower = message.toLowerCase()

  // Today
  if (lower.includes('hôm nay') || lower.includes('today')) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return { from: today, to: tomorrow }
  }

  // Yesterday
  if (lower.includes('hôm qua') || lower.includes('yesterday')) {
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    return { from: yesterday, to: today }
  }

  // This week
  if (lower.includes('tuần này') || lower.includes('this week')) {
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 7)
    return { from: monday, to: sunday }
  }

  // This month
  if (lower.includes('tháng này') || lower.includes('this month')) {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    lastDay.setHours(23, 59, 59, 999)
    return { from: firstDay, to: lastDay }
  }

  // Last 7 days
  if (lower.includes('7 ngày') || lower.includes('last 7 days')) {
    const from = new Date(today)
    from.setDate(today.getDate() - 7)
    return { from, to: today }
  }

  // Last 30 days
  if (lower.includes('30 ngày') || lower.includes('last 30 days')) {
    const from = new Date(today)
    from.setDate(today.getDate() - 30)
    return { from, to: today }
  }

  return null
}

/**
 * Extract product specifications from text
 */
export function extractProductSpecs(message: string): Record<string, any> {
  const specs: Record<string, any> = {}

  // Extract brand
  const brandMatch = message.match(/(?:insee|hà tiên|holcim|hòa phát|pomina|jotun|nippon|dulux|kova)/i)
  if (brandMatch) {
    specs.brand = brandMatch[0]
  }

  // Extract grade (for cement)
  const gradeMatch = message.match(/pc\d+|pcb\d+/i)
  if (gradeMatch) {
    specs.grade = gradeMatch[0].toUpperCase()
  }

  // Extract diameter (for steel)
  const diameterMatch = message.match(/d(\d+)/i)
  if (diameterMatch) {
    specs.diameter = parseInt(diameterMatch[1])
  }

  // Extract dimensions
  const dimensionMatch = message.match(/(\d+)x(\d+)(?:x(\d+))?\s*(?:cm|mm)?/i)
  if (dimensionMatch) {
    specs.dimensions = {
      length: parseInt(dimensionMatch[1]),
      width: parseInt(dimensionMatch[2]),
      height: dimensionMatch[3] ? parseInt(dimensionMatch[3]) : undefined
    }
  }

  return specs
}

export interface OrderItem {
  productName: string
  quantity: number
  unit: string
}

/**
 * Parse order items from message
 * Example: "tôi muốn mua 10 bao xi măng và 20 viên gạch"
 * Returns: [{ productName: "xi măng", quantity: 10, unit: "bao" }, { productName: "gạch", quantity: 20, unit: "viên" }]
 */
export function parseOrderItems(message: string): OrderItem[] {
  const items: OrderItem[] = []

  // First, try to split by "và", ",", ";" to handle multiple items
  // But be careful not to split product names like "xi măng"
  const segments = message.split(/\s+và\s+|,\s*(?=\d+)|;\s*(?=\d+)/)

  for (const segment of segments) {
    // Pattern: quantity + unit + product
    // Examples: "10 bao xi măng", "20 viên gạch", "5 m³ cát"
    const pattern = /(\d+(?:\.\d+)?)\s*(bao|m³|m2|m²|tấn|kg|viên|cây|cuộn|thùng|bags?|tons?|pieces?)\s+(.+?)$/i

    const match = segment.match(pattern)
    if (match) {
      const quantity = parseFloat(match[1])
      const unit = normalizeUnit(match[2])
      const productText = match[3].trim()

      // Try to identify product name
      const productName = identifyProduct(productText)

      if (productName) {
        items.push({
          productName,
          quantity,
          unit
        })
      }
    }
  }

  return items
}

/**
 * Identify product from text
 */
function identifyProduct(text: string): string | null {
  const lower = text.toLowerCase()

  // Product keywords mapping
  const productMap = [
    { keywords: ['xi măng', 'xi mang', 'cement'], name: 'Xi măng' },
    { keywords: ['cát', 'cat', 'sand'], name: 'Cát' },
    { keywords: ['gạch', 'gach', 'brick'], name: 'Gạch' },
    { keywords: ['thép', 'thep', 'steel', 'sắt', 'sat'], name: 'Thép' },
    { keywords: ['đá', 'da', 'stone', 'gravel'], name: 'Đá' },
    { keywords: ['sơn', 'son', 'paint'], name: 'Sơn' },
    { keywords: ['tôn', 'ton', 'sheet metal'], name: 'Tôn' },
    { keywords: ['ngói', 'ngoi', 'tile', 'roof'], name: 'Ngói' },
    { keywords: ['gỗ', 'go', 'wood'], name: 'Gỗ' },
    { keywords: ['thạch cao', 'gypsum'], name: 'Thạch cao' },
    { keywords: ['keo', 'glue', 'adhesive'], name: 'Keo' },
    { keywords: ['vữa', 'vua', 'mortar'], name: 'Vữa' },
    { keywords: ['ống', 'ong', 'pipe'], name: 'Ống' },
    { keywords: ['đinh', 'dinh', 'nail'], name: 'Đinh' },
    { keywords: ['vít', 'vit', 'screw'], name: 'Vít' }
  ]

  for (const product of productMap) {
    if (product.keywords.some(kw => lower.includes(kw))) {
      // Try to include brand/grade if present
      const brandMatch = text.match(/(?:insee|hà tiên|holcim|hòa phát|pc\d+|pcb\d+|d\d+)/i)
      if (brandMatch) {
        return `${product.name} ${brandMatch[0]}`
      }
      return product.name
    }
  }

  // If no match, return the text itself (cleaned)
  const cleaned = text.replace(/\s+và\s+/gi, ' ').replace(/\s+,\s+/g, ' ').trim()
  return cleaned.length > 0 && cleaned.length < 50 ? cleaned : null
}
