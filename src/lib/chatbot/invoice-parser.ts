/**
 * Invoice Parser - Parse invoice data from OCR text
 */

import { OCRResult } from './ocr-processor'

export interface ParsedInvoice {
  // Invoice metadata
  invoiceNumber?: string
  invoiceDate?: Date
  dueDate?: Date
  
  // Supplier information
  supplierName?: string
  supplierAddress?: string
  supplierTaxId?: string
  supplierPhone?: string
  
  // Line items
  items: Array<{
    name: string
    quantity?: number
    unit?: string
    unitPrice?: number
    totalPrice?: number
  }>
  
  // Totals
  subtotal?: number
  taxRate?: number
  taxAmount?: number
  totalAmount?: number
  
  // Payment
  paymentMethod?: string
  paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL'
  
  // Metadata
  confidence: number
  rawText: string
}

/**
 * Parse invoice from OCR result
 */
export function parseInvoice(ocrResult: OCRResult): ParsedInvoice {
  const { text, lines, confidence } = ocrResult
  
  const invoice: ParsedInvoice = {
    items: [],
    confidence,
    rawText: text
  }
  
  // Parse invoice number
  const invoiceNumMatch = text.match(/(?:hóa đơn|hoá đơn|invoice|receipt|phiếu|số|no\.?)[:\s]*([A-Z0-9\-\/]+)/i)
  if (invoiceNumMatch) {
    invoice.invoiceNumber = invoiceNumMatch[1].trim()
  }
  
  // Parse date (multiple formats)
  const datePatterns = [
    /(?:ngày|date)[:\s]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/
  ]
  
  for (const pattern of datePatterns) {
    const dateMatch = text.match(pattern)
    if (dateMatch) {
      const day = parseInt(dateMatch[1])
      const month = parseInt(dateMatch[2]) - 1
      const year = parseInt(dateMatch[3])
      invoice.invoiceDate = new Date(year, month, day)
      break
    }
  }
  
  // Parse supplier name
  const supplierPatterns = [
    /(?:công ty|cty|dntn|tnhh)[:\s]*(.+?)(?:\n|$)/i,
    /(?:nhà cung cấp|supplier|vendor)[:\s]*(.+?)(?:\n|$)/i
  ]
  
  for (const pattern of supplierPatterns) {
    const supplierMatch = text.match(pattern)
    if (supplierMatch) {
      invoice.supplierName = supplierMatch[1].trim()
      break
    }
  }
  
  // If no pattern match, use first line that contains company keywords
  if (!invoice.supplierName) {
    const companyLine = lines.find(line => 
      line.match(/công ty|cty|dntn|tnhh|corp|company/i) && line.length < 100
    )
    if (companyLine) {
      invoice.supplierName = companyLine.trim()
    }
  }
  
  // Parse tax ID
  const taxIdMatch = text.match(/(?:mst|mã số thuế|tax id|tin)[:\s]*(\d{10,13})/i)
  if (taxIdMatch) {
    invoice.supplierTaxId = taxIdMatch[1]
  }
  
  // Parse phone
  const phoneMatch = text.match(/(?:đt|điện thoại|phone|tel)[:\s]*([\d\s\-\.()]{9,15})/i)
  if (phoneMatch) {
    invoice.supplierPhone = phoneMatch[1].replace(/[\s\-\.()]/g, '')
  }
  
  // Parse line items (complex - look for product patterns)
  const items = parseLineItems(lines)
  invoice.items = items
  
  // Parse totals
  const totals = parseTotals(text, lines)
  Object.assign(invoice, totals)
  
  // Parse payment method
  const paymentMatch = text.match(/(?:thanh toán|payment)[:\s]*(tiền mặt|chuyển khoản|credit|cash|transfer|cod)/i)
  if (paymentMatch) {
    invoice.paymentMethod = normalizePaymentMethod(paymentMatch[1])
  }
  
  // Determine payment status
  if (text.match(/đã thanh toán|paid|completed/i)) {
    invoice.paymentStatus = 'PAID'
  } else if (text.match(/chưa thanh toán|unpaid|pending/i)) {
    invoice.paymentStatus = 'UNPAID'
  }
  
  return invoice
}

/**
 * Parse line items from invoice lines
 */
function parseLineItems(lines: string[]): Array<{
  name: string
  quantity?: number
  unit?: string
  unitPrice?: number
  totalPrice?: number
}> {
  const items: Array<any> = []
  
  // Common construction material keywords
  const materialKeywords = [
    'xi măng', 'cement', 'thép', 'steel', 'gạch', 'brick',
    'cát', 'sand', 'đá', 'stone', 'sơn', 'paint',
    'ngói', 'tile', 'tôn', 'sheet'
  ]
  
  for (const line of lines) {
    const lower = line.toLowerCase()
    
    // Check if line contains material keywords
    const hasMaterial = materialKeywords.some(kw => lower.includes(kw))
    if (!hasMaterial) continue
    
    // Extract quantity, unit, prices
    const item: any = { name: '' }
    
    // Pattern: [Quantity] [Unit] [Product Name] [Unit Price] [Total]
    // Example: 100 bao Xi măng PC40 120,000 12,000,000
    const itemPattern = /(\d+(?:\.\d+)?)\s*([a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]+)\s+(.+?)(?:\s+(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?))?(?:\s+(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?))?$/i
    
    const match = line.match(itemPattern)
    if (match) {
      item.quantity = parseFloat(match[1])
      item.unit = match[2]
      item.name = match[3].trim()
      
      if (match[4]) {
        item.unitPrice = parseNumber(match[4])
      }
      if (match[5]) {
        item.totalPrice = parseNumber(match[5])
      }
    } else {
      // Fallback: just extract product name and any numbers
      item.name = line.trim()
      
      const numbers = line.match(/\d+(?:[.,]\d{3})*(?:[.,]\d{2})?/g)
      if (numbers && numbers.length > 0) {
        const parsedNumbers = numbers.map(parseNumber)
        
        // Heuristic: small number = quantity, large = price
        const sorted = [...parsedNumbers].sort((a, b) => a - b)
        
        if (sorted[0] < 1000) {
          item.quantity = sorted[0]
        }
        
        if (sorted.length > 1) {
          item.unitPrice = sorted[sorted.length - 2]
          item.totalPrice = sorted[sorted.length - 1]
        } else {
          item.totalPrice = sorted[sorted.length - 1]
        }
      }
    }
    
    if (item.name) {
      items.push(item)
    }
  }
  
  return items
}

/**
 * Parse totals from invoice text
 */
function parseTotals(text: string, lines: string[]): {
  subtotal?: number
  taxRate?: number
  taxAmount?: number
  totalAmount?: number
} {
  const totals: any = {}
  
  // Parse subtotal
  const subtotalMatch = text.match(/(?:tạm tính|subtotal|sub-total)[:\s]*(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)/i)
  if (subtotalMatch) {
    totals.subtotal = parseNumber(subtotalMatch[1])
  }
  
  // Parse tax
  const taxRateMatch = text.match(/(?:vat|thuế)[:\s]*(\d+)%/i)
  if (taxRateMatch) {
    totals.taxRate = parseInt(taxRateMatch[1])
  }
  
  const taxAmountMatch = text.match(/(?:tiền thuế|tax amount)[:\s]*(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)/i)
  if (taxAmountMatch) {
    totals.taxAmount = parseNumber(taxAmountMatch[1])
  }
  
  // Parse total (look for largest number or line with "tổng")
  const totalMatch = text.match(/(?:tổng cộng|tổng|total|grand total)[:\s]*(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)/i)
  if (totalMatch) {
    totals.totalAmount = parseNumber(totalMatch[1])
  } else {
    // Fallback: find largest number in text
    const allNumbers = text.match(/\d+(?:[.,]\d{3})*(?:[.,]\d{2})?/g)
    if (allNumbers) {
      const parsed = allNumbers.map(parseNumber)
      totals.totalAmount = Math.max(...parsed)
    }
  }
  
  return totals
}

/**
 * Parse Vietnamese/English number format
 */
function parseNumber(numStr: string): number {
  // Remove thousand separators and parse
  return parseFloat(numStr.replace(/[.,]/g, ''))
}

/**
 * Normalize payment method
 */
function normalizePaymentMethod(method: string): string {
  const lower = method.toLowerCase()
  
  if (lower.includes('tiền mặt') || lower.includes('cash') || lower.includes('cod')) {
    return 'CASH'
  }
  if (lower.includes('chuyển khoản') || lower.includes('transfer') || lower.includes('bank')) {
    return 'BANK_TRANSFER'
  }
  if (lower.includes('credit') || lower.includes('card')) {
    return 'CREDIT_CARD'
  }
  if (lower.includes('qr')) {
    return 'QR_CODE'
  }
  
  return method.toUpperCase()
}

/**
 * Validate parsed invoice data
 */
export function validateInvoice(invoice: ParsedInvoice): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!invoice.invoiceNumber) {
    errors.push('Missing invoice number')
  }
  
  if (!invoice.invoiceDate) {
    errors.push('Missing invoice date')
  }
  
  if (!invoice.supplierName) {
    errors.push('Missing supplier name')
  }
  
  if (invoice.items.length === 0) {
    errors.push('No items found')
  }
  
  if (!invoice.totalAmount || invoice.totalAmount <= 0) {
    errors.push('Invalid total amount')
  }
  
  if (invoice.confidence < 0.5) {
    errors.push('OCR confidence too low (< 50%)')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Format parsed invoice for display
 */
export function formatInvoiceForChat(invoice: ParsedInvoice): string {
  let msg = '📄 **HÓA ĐƠN NHẬN DIỆN**\n\n'
  
  if (invoice.invoiceNumber) {
    msg += `🔢 Số HĐ: **${invoice.invoiceNumber}**\n`
  }
  
  if (invoice.invoiceDate) {
    msg += `📅 Ngày: ${invoice.invoiceDate.toLocaleDateString('vi-VN')}\n`
  }
  
  if (invoice.supplierName) {
    msg += `🏢 NCC: ${invoice.supplierName}\n`
  }
  
  msg += `\n📦 **Sản phẩm:**\n`
  
  if (invoice.items.length > 0) {
    invoice.items.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.name}\n`
      if (item.quantity && item.unit) {
        msg += `   Số lượng: ${item.quantity} ${item.unit}\n`
      }
      if (item.unitPrice) {
        msg += `   Đơn giá: ${item.unitPrice.toLocaleString('vi-VN')}đ\n`
      }
      if (item.totalPrice) {
        msg += `   Thành tiền: ${item.totalPrice.toLocaleString('vi-VN')}đ\n`
      }
    })
  } else {
    msg += `⚠️ Không nhận diện được sản phẩm\n`
  }
  
  msg += `\n💰 **Tổng cộng:** `
  if (invoice.totalAmount) {
    msg += `${invoice.totalAmount.toLocaleString('vi-VN')}đ\n`
  } else {
    msg += `N/A\n`
  }
  
  if (invoice.taxAmount) {
    msg += `📊 VAT: ${invoice.taxAmount.toLocaleString('vi-VN')}đ`
    if (invoice.taxRate) {
      msg += ` (${invoice.taxRate}%)`
    }
    msg += `\n`
  }
  
  msg += `\n🎯 Độ tin cậy: ${(invoice.confidence * 100).toFixed(0)}%`
  
  return msg
}
