/**
 * Conversation State Manager - Manages multi-step conversation flows
 * Uses Redis in production, falls back to in-memory for development
 */

// In-memory conversation state storage
const conversationCache = new Map<string, any>()

export type ConversationFlow =
  | 'ORDER_CREATION'      // Creating order from material list
  | 'OCR_INVOICE'         // OCR invoice processing
  | 'CRUD_CONFIRMATION'   // CRUD action confirmation
  | 'PAYMENT_SELECTION'   // Payment method selection
  | 'NONE'                // No active flow

export interface ConversationState {
  sessionId: string
  flow: ConversationFlow
  step: number
  data: Record<string, any>
  createdAt: Date
  expiresAt: Date
}

// In-memory store (fallback when Redis not available)
// Removed - using conversationCache

// Auto-cleanup expired states every 5 minutes (only for in-memory)
let cleanupInterval: NodeJS.Timeout | null = null

// Start cleanup only once for in-memory mode
if (!cleanupInterval) {
  cleanupInterval = setInterval(() => {
    // Clean up expired sessions from memory
    const now = Date.now()
    for (const [key, state] of conversationCache.entries()) {
      if (state.expiresAt && state.expiresAt.getTime() < now) {
        conversationCache.delete(key)
      }
    }
  }, 5 * 60 * 1000)

  // Cleanup on module unload (for HMR)
  if (typeof process !== 'undefined' && process.on) {
    process.on('exit', () => {
      if (cleanupInterval) clearInterval(cleanupInterval)
    })
  }
}

/**
 * Get conversation state key for Redis
 */
function getStateKey(sessionId: string): string {
  return `conv_state:${sessionId}`
}

/**
 * Get conversation state
 */
export async function getConversationState(sessionId: string): Promise<ConversationState | null> {
  const key = getStateKey(sessionId)

  // Use in-memory only
  const state = conversationCache.get(key)

  if (state) {
    // Check expiration
    if (state.expiresAt && state.expiresAt.getTime() < Date.now()) {
      conversationCache.delete(key)
      return null
    }
    return state
  }

  return null
}

/**
 * Set conversation state
 */
export async function setConversationState(
  sessionId: string,
  flow: ConversationFlow,
  step: number,
  data: Record<string, any>,
  ttlMinutes: number = 30
): Promise<ConversationState> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000)

  const state: ConversationState = {
    sessionId,
    flow,
    step,
    data,
    createdAt: now,
    expiresAt
  }

  const key = getStateKey(sessionId)

  // Save to in-memory
  conversationCache.set(key, state)
  setTimeout(() => conversationCache.delete(key), ttlMinutes * 60 * 1000)

  return state
}

/**
 * Update conversation state
 */
export async function updateConversationState(
  sessionId: string,
  updates: Partial<ConversationState>
): Promise<ConversationState | null> {
  const current = await getConversationState(sessionId)

  if (!current) {
    return null
  }

  const updated: ConversationState = {
    ...current,
    ...updates,
    // Reset expiration on update
    expiresAt: new Date(Date.now() + 30 * 60 * 1000)
  }

  const key = getStateKey(sessionId)
  conversationCache.set(key, updated)

  return updated
}

/**
 * Clear conversation state
 */
export async function clearConversationState(sessionId: string): Promise<void> {
  const key = getStateKey(sessionId)

  conversationCache.delete(key)
}

/**
 * Check if in active flow
 */
export async function isInActiveFlow(sessionId: string): Promise<boolean> {
  const state = await getConversationState(sessionId)
  return state !== null && state.flow !== 'NONE'
}

/**
 * Get current flow
 */
export async function getCurrentFlow(sessionId: string): Promise<ConversationFlow> {
  const state = await getConversationState(sessionId)
  return state?.flow || 'NONE'
}

/**
 * Advance to next step
 */
export async function advanceStep(sessionId: string): Promise<ConversationState | null> {
  const state = await getConversationState(sessionId)

  if (!state) {
    return null
  }

  return await updateConversationState(sessionId, {
    step: state.step + 1
  })
}

/**
 * Get flow data
 */
export async function getFlowData(sessionId: string): Promise<Record<string, any>> {
  const state = await getConversationState(sessionId)
  return state?.data || {}
}

/**
 * Update flow data
 */
export async function updateFlowData(
  sessionId: string,
  data: Record<string, any>
): Promise<ConversationState | null> {
  const state = await getConversationState(sessionId)

  if (!state) {
    return null
  }

  return await updateConversationState(sessionId, {
    data: {
      ...state.data,
      ...data
    }
  })
}

/**
 * ORDER_CREATION flow helpers
 */

export interface OrderCreationData {
  items: Array<{
    productId?: string
    productName: string
    quantity: number
    unit: string
    unitPrice?: number
  }>
  customerInfo?: {
    name: string
    phone: string
    email?: string
    address: string
  }
  paymentMethod?: string
  deliveryMethod?: string
  notes?: string
}

export async function startOrderCreationFlow(
  sessionId: string,
  items: OrderCreationData['items'],
  hasCustomerId: boolean = false,
  existingGuestInfo?: { name?: string; phone?: string; address?: string }
): Promise<ConversationState> {
  // Check if existing guest info has all required fields
  const hasCompleteGuestInfo = existingGuestInfo &&
    existingGuestInfo.name &&
    existingGuestInfo.phone &&
    existingGuestInfo.address

  return await setConversationState(sessionId, 'ORDER_CREATION', 1, {
    items,
    currentStep: 'confirm_items',
    needsGuestInfo: !hasCustomerId && !hasCompleteGuestInfo,
    guestInfo: existingGuestInfo // Preserve any extracted guest info
  })
}

export async function getOrderCreationStep(sessionId: string): Promise<string> {
  const data = await getFlowData(sessionId)
  return data.currentStep || 'confirm_items'
}

export async function setOrderCreationStep(sessionId: string, step: string): Promise<void> {
  await updateFlowData(sessionId, { currentStep: step })
}

/**
 * OCR_INVOICE flow helpers
 */

export interface OCRInvoiceData {
  parsedInvoice: any
  confirmed: boolean
  savedInvoiceId?: string
}

export async function startOCRInvoiceFlow(
  sessionId: string,
  parsedInvoice: any
): Promise<ConversationState> {
  return await setConversationState(sessionId, 'OCR_INVOICE', 1, {
    parsedInvoice,
    confirmed: false
  })
}

/**
 * CRUD_CONFIRMATION flow helpers
 */

export interface CRUDConfirmationData {
  action: string
  entityType: string
  entityData: any
  previewMessage: string
}

export async function startCRUDConfirmationFlow(
  sessionId: string,
  data: CRUDConfirmationData
): Promise<ConversationState> {
  return await setConversationState(sessionId, 'CRUD_CONFIRMATION', 1, data)
}

/**
 * Process user response in active flow
 */
export async function processFlowResponse(
  sessionId: string,
  userMessage: string
): Promise<{
  shouldContinue: boolean
  isConfirmed?: boolean
  isCancelled?: boolean
  nextPrompt?: string
}> {
  const state = await getConversationState(sessionId)

  if (!state) {
    return { shouldContinue: false }
  }

  const lower = userMessage.toLowerCase().trim()

  // Flow-specific processing first (more specific matching)
  switch (state.flow) {
    case 'ORDER_CREATION':
      return await processOrderCreationResponse(sessionId, userMessage, state)

    case 'OCR_INVOICE':
      return await processOCRInvoiceResponse(sessionId, userMessage, state)

    case 'CRUD_CONFIRMATION':
      return await processCRUDConfirmationResponse(sessionId, userMessage, state)

    default:
      // Generic confirmation/cancellation for other flows
      if (lower.includes('hủy') || lower.includes('cancel') || lower === 'hủy') {
        await clearConversationState(sessionId)
        return {
          shouldContinue: true,
          isCancelled: true
        }
      }

      if (lower.includes('xác nhận') || lower.includes('confirm') ||
        lower === 'xác nhận' || lower === 'ok' || lower === 'đồng ý') {
        return {
          shouldContinue: true,
          isConfirmed: true
        }
      }

      return { shouldContinue: false }
  }
}

/**
 * Process ORDER_CREATION flow response
 */
async function processOrderCreationResponse(
  sessionId: string,
  userMessage: string,
  state: ConversationState
): Promise<any> {
  const currentStep = state.data.currentStep
  const lowerMessage = userMessage.toLowerCase().trim()

  // EARLY HANDLING: If message is exactly "xác nhận đặt hàng" (from ChatOrderSummary button)
  // Treat as confirmation regardless of current step
  if (lowerMessage === 'xác nhận đặt hàng' || lowerMessage === 'xác nhận') {
    console.log('[ORDER_FLOW] Early confirmation detected:', lowerMessage)
    if (state.data.needsGuestInfo && !state.data.guestInfo?.phone) {
      // Need guest info first
      await setOrderCreationStep(sessionId, 'guest_info')
      await advanceStep(sessionId)
      return {
        shouldContinue: true,
        nextPrompt: '📝 **Thông tin giao hàng**\n\n' +
          'Vui lòng cung cấp:\n' +
          '- Họ tên\n' +
          '- Số điện thoại\n' +
          '- Địa chỉ nhận hàng\n\n' +
          '💡 *Ví dụ: Nguyễn Văn A, 0901234567, 123 Nguyễn Huệ, Q1, HCM*'
      }
    } else {
      // Has all info - confirm order
      return {
        shouldContinue: true,
        isConfirmed: true
      }
    }
  }

  switch (currentStep) {
    case 'confirm_items':
      // Check if user is confirming or cancelling

      // Check for cancellation first
      if (lowerMessage.includes('hủy') || lowerMessage.includes('cancel') ||
        lowerMessage === 'hủy' || lowerMessage === 'cancel') {
        clearConversationState(sessionId)
        return {
          shouldContinue: true,
          isCancelled: true
        }
      }

      // Check for confirmation - must match exactly or contain key phrases
      // Be more lenient to catch variations
      const isConfirming = lowerMessage === 'xác nhận' ||
        lowerMessage === 'confirm' ||
        lowerMessage === 'ok' ||
        lowerMessage === 'okay' ||
        lowerMessage === 'đồng ý' ||
        lowerMessage === 'có' ||
        lowerMessage === 'yes' ||
        lowerMessage.includes('xác nhận') ||
        lowerMessage.includes('confirm') ||
        (lowerMessage.includes('đặt hàng') && !lowerMessage.includes('muốn') && !lowerMessage.includes('tôi'))

      if (isConfirming) {
        // User confirmed - check if has customerId (logged in) or needs guest info
        if (state.data.needsGuestInfo) {
          // Move to collect guest info
          await setOrderCreationStep(sessionId, 'guest_info')
          await advanceStep(sessionId)
          return {
            shouldContinue: true,
            nextPrompt: '📝 **Thông tin giao hàng**\n\n' +
              'Vui lòng cung cấp:\n' +
              '- Họ tên\n' +
              '- Số điện thoại\n' +
              '- Địa chỉ nhận hàng\n\n' +
              '💡 *Ví dụ: Nguyễn Văn A, 0901234567, 123 Nguyễn Huệ, Q1, HCM*'
          }
        } else {
          // User logged in - create order immediately
          return {
            shouldContinue: true,
            isConfirmed: true
          }
        }
      }

      // If message contains numbers only or product selection keywords, might be selecting product
      // Allow main route to handle product selection
      if (lowerMessage.match(/^\d+$/) ||
        lowerMessage.includes('chọn') ||
        lowerMessage.includes('số') ||
        (lowerMessage.length > 2 && !isConfirming)) {
        // Let main route handle product selection
        return {
          shouldContinue: false
        }
      }

      // For any other message in confirm_items step, stay in flow
      // Don't let it fall through to intent detection
      return {
        shouldContinue: true,
        nextPrompt: '💡 Bạn có muốn xác nhận đặt hàng không? Hoặc bạn có thể hủy bỏ.\n\n' +
          'Vui lòng chọn:\n' +
          '- "Xác nhận" để tiếp tục\n' +
          '- "Hủy" để hủy đơn hàng'
      }

    case 'guest_info':
      // Parse guest info from message
      // Input format: "Tên, SĐT, Địa chỉ" (plain text, no brackets or quotes)
      const guestInfo = parseGuestInfo(userMessage)

      // Debug: log parsed info
      console.log('=== GUEST INFO PARSING ===')
      console.log('Original message:', userMessage)
      console.log('Parsed guest info:', JSON.stringify(guestInfo, null, 2))
      console.log('Has name:', !!guestInfo.name, guestInfo.name)
      console.log('Has phone:', !!guestInfo.phone, guestInfo.phone)
      console.log('Has address:', !!guestInfo.address, guestInfo.address)
      console.log('=========================')

      if (!guestInfo.name || !guestInfo.phone || !guestInfo.address) {
        return {
          shouldContinue: true,
          nextPrompt: '❌ Thông tin chưa đầy đủ. Vui lòng cung cấp:\n' +
            '- Họ tên\n' +
            '- Số điện thoại\n' +
            '- Địa chỉ\n\n' +
            `💡 Thông tin đã nhận:\n` +
            `- Tên: ${guestInfo.name || '(chưa có)'}\n` +
            `- SĐT: ${guestInfo.phone || '(chưa có)'}\n` +
            `- Địa chỉ: ${guestInfo.address || '(chưa có)'}\n\n` +
            '💡 Ví dụ: Nguyễn Văn A, 0901234567, 123 Nguyễn Huệ, Q1, HCM'
        }
      }

      // Save guest info to flow data
      console.log('=== SAVING GUEST INFO ===')
      console.log('SessionId:', sessionId)
      console.log('GuestInfo to save:', JSON.stringify(guestInfo, null, 2))

      await updateFlowData(sessionId, { guestInfo })

      // Verify it was saved
      const verifyData = await getFlowData(sessionId)
      console.log('=== VERIFIED SAVED DATA ===')
      console.log('Saved guestInfo:', JSON.stringify(verifyData?.guestInfo, null, 2))
      console.log('===========================')

      // Proceed to payment method selection
      await setOrderCreationStep(sessionId, 'payment_method')
      await advanceStep(sessionId)

      return {
        shouldContinue: true,
        nextPrompt: '💳 **Chọn phương thức thanh toán:**\n\n1. Chuyển khoản 100%\n2. Cọc 50%\n\n💡 *Gõ "1" hoặc "2" để chọn*'
      }

    case 'customer_info':
      // Extract customer info from message
      // (simplified - in production, use better parsing)
      await setOrderCreationStep(sessionId, 'payment_method')
      await advanceStep(sessionId)
      return {
        shouldContinue: true,
        nextPrompt: '💳 **Chọn phương thức thanh toán:**\n\n1. Chuyển khoản 100%\n2. Cọc 50%\n\n💡 *Gõ "1" hoặc "2" để chọn*'
      }

    case 'payment_method':
      // Extract payment method - Only allow "Chuyển khoản 100%" or "Cọc 50%"
      let paymentMethod = 'BANK_TRANSFER'
      let paymentType = 'FULL'
      let depositPercentage: number | undefined = undefined
      const lower = userMessage.toLowerCase()

      if (lower.includes('cọc') || lower.includes('50') || lower === '2') {
        paymentMethod = 'BANK_TRANSFER'
        paymentType = 'DEPOSIT'
        depositPercentage = 50
      } else if (lower.includes('chuyển khoản') || lower.includes('100') || lower === '1') {
        paymentMethod = 'BANK_TRANSFER'
        paymentType = 'FULL'
      } else {
        // Invalid selection - prompt again
        return {
          shouldContinue: true,
          nextPrompt: '❌ Lựa chọn không hợp lệ. Vui lòng chọn:\n\n1. Chuyển khoản 100%\n2. Cọc 50%\n\n💡 *Gõ "1" hoặc "2" để chọn*'
        }
      }

      await updateFlowData(sessionId, { paymentMethod, paymentType, depositPercentage })
      await setOrderCreationStep(sessionId, 'vat_question')
      await advanceStep(sessionId)

      return {
        shouldContinue: true,
        nextPrompt: 'Bạn có muốn xuất hóa đơn VAT không?\n\n' +
          '1. Có (Cung cấp thông tin công ty)\n' +
          '2. Không (Bỏ qua)'
      }

    case 'vat_question':
      const vatAnswer = userMessage.toLowerCase()
      if (vatAnswer.includes('có') || vatAnswer.includes('yes') || vatAnswer === '1') {
        await setOrderCreationStep(sessionId, 'vat_info')
        await advanceStep(sessionId)
        return {
          shouldContinue: true,
          nextPrompt: '📝 **Thông tin xuất hóa đơn VAT**\n\n' +
            'Vui lòng cung cấp theo định dạng:\n' +
            '**Mã số thuế, Tên công ty, Địa chỉ công ty**\n\n' +
            '💡 *Ví dụ: 0312345678, Công ty ABC, 123 Nguyễn Huệ, Q1, HCM*'
        }
      } else {
        // Skip VAT info
        await setOrderCreationStep(sessionId, 'final_confirmation')
        await advanceStep(sessionId)
        const currentPaymentMethod = state.data.paymentMethod || 'CASH'
        return {
          shouldContinue: true,
          nextPrompt: `Xác nhận tạo đơn hàng với phương thức ${currentPaymentMethod}?`
        }
      }

    case 'vat_info':
      // Parse VAT info
      const vatParts = userMessage.split(',').map(p => p.trim())
      if (vatParts.length < 3) {
        return {
          shouldContinue: true,
          nextPrompt: '❌ Thông tin chưa đầy đủ. Vui lòng cung cấp đủ 3 thông tin cách nhau bởi dấu phẩy:\n' +
            '**Mã số thuế, Tên công ty, Địa chỉ công ty**'
        }
      }

      const vatInfo = {
        taxId: vatParts[0],
        companyName: vatParts[1],
        companyAddress: vatParts.slice(2).join(', ')
      }

      await updateFlowData(sessionId, { vatInfo })
      await setOrderCreationStep(sessionId, 'final_confirmation')
      await advanceStep(sessionId)

      const finalPaymentMethod = state.data.paymentMethod || 'CASH'
      return {
        shouldContinue: true,
        nextPrompt: `Xác nhận tạo đơn hàng với phương thức ${finalPaymentMethod} và xuất hóa đơn VAT?`
      }

    case 'final_confirmation':
      // Order will be created in main chatbot route
      return {
        shouldContinue: true,
        isConfirmed: true
      }

    default:
      return { shouldContinue: false }
  }
}

/**
 * Process OCR_INVOICE flow response
 */
async function processOCRInvoiceResponse(
  sessionId: string,
  userMessage: string,
  state: ConversationState
): Promise<any> {
  // Simple confirmation
  return {
    shouldContinue: true,
    isConfirmed: true
  }
}

/**
 * Process CRUD_CONFIRMATION flow response
 */
async function processCRUDConfirmationResponse(
  sessionId: string,
  userMessage: string,
  state: ConversationState
): Promise<any> {
  // Simple confirmation
  return {
    shouldContinue: true,
    isConfirmed: true
  }
}

/**
 * Parse guest information from message
 * Expected format: "Tên, SĐT, Địa chỉ" or natural language
 */
function parseGuestInfo(message: string): {
  name?: string
  phone?: string
  address?: string
} {
  // Clean input - remove any brackets or quotes
  let cleaned = message.trim()
    .replace(/^\[|\]$/g, '') // Remove brackets
    .replace(/^["']|["']$/g, '') // Remove quotes
    .trim()

  if (!cleaned) {
    console.log('parseGuestInfo - Empty message')
    return {}
  }

  console.log('parseGuestInfo - Input:', cleaned)

  // Split by comma
  const parts = cleaned.split(',').map(p => p.trim()).filter(p => p.length > 0)
  console.log('parseGuestInfo - Parts after split:', parts)
  console.log('parseGuestInfo - Number of parts:', parts.length)

  if (parts.length < 2) {
    console.log('parseGuestInfo - Not enough parts')
    return {}
  }

  // Vietnamese phone pattern: starts with 0, followed by 9-10 digits
  // Pattern: 0xxx or +84xxx (9-10 digits total after prefix)
  // More flexible: match any part that starts with 0 and has 9-10 more digits
  let phone = ''
  let phoneIndex = -1

  // Find phone number - most reliable identifier
  // Vietnamese phone: starts with 0, followed by 9 digits (10 digits total)
  // Example: 0918180969 = 0 + 918180969 (9 digits) = 10 digits total
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim()

    // Extract only digits from the part
    const digitsOnly = part.replace(/[^\d]/g, '')

    // Check if it looks like a Vietnamese phone number
    // Must start with 0 and have exactly 9 or 10 more digits (10-11 digits total)
    if (digitsOnly.length >= 10 && digitsOnly.length <= 11 && digitsOnly.startsWith('0')) {
      phone = digitsOnly
      phoneIndex = i
      console.log('parseGuestInfo - Found phone (digits only):', phone, 'at index:', phoneIndex, 'from part:', part)
      break
    }

    // Also check for +84 format
    if (part.includes('+84')) {
      const plus84Match = part.match(/\+84[\s\-]?(\d{9,10})/)
      if (plus84Match) {
        phone = '0' + plus84Match[1]
        phoneIndex = i
        console.log('parseGuestInfo - Found phone (+84 format):', phone, 'at index:', phoneIndex)
        break
      }
    }
  }

  // If still not found, try pattern matching with spaces/dashes
  if (!phone) {
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      // Match: 0 followed by 9-10 digits, with optional spaces/dashes
      const phoneMatch = part.match(/(0[\d\s\-]{8,12})/)
      if (phoneMatch) {
        const candidate = phoneMatch[1].replace(/[\s\-]/g, '')
        if (candidate.length >= 10 && candidate.length <= 11 && candidate.startsWith('0')) {
          phone = candidate
          phoneIndex = i
          console.log('parseGuestInfo - Found phone (pattern match):', phone, 'at index:', phoneIndex)
          break
        }
      }
    }
  }

  let name = ''
  let address = ''

  // If we found phone, use it as anchor
  if (phoneIndex >= 0) {
    // Name is everything before phone
    if (phoneIndex > 0) {
      name = parts.slice(0, phoneIndex).join(' ').trim()
      console.log('parseGuestInfo - Name (before phone):', name)
    }

    // Address is everything after phone
    if (phoneIndex < parts.length - 1) {
      address = parts.slice(phoneIndex + 1).join(', ').trim()
      console.log('parseGuestInfo - Address (after phone):', address)
    }
  } else {
    // No phone found yet - try simple heuristic
    // Format: "Name, Phone, Address..." or "Name, Address..."

    // First part is usually name
    if (parts.length >= 1 && parts[0]) {
      name = parts[0].trim()
      console.log('parseGuestInfo - Name (first part, no phone found yet):', name)
    }

    // Try to find phone in second part by extracting digits
    if (parts.length >= 2 && parts[1]) {
      const secondPartDigits = parts[1].replace(/[^\d]/g, '')
      if (secondPartDigits.length >= 10 && secondPartDigits.length <= 11 && secondPartDigits.startsWith('0')) {
        phone = secondPartDigits
        phoneIndex = 1
        console.log('parseGuestInfo - Phone (found in second part):', phone)
        // Address is everything after phone
        if (parts.length > 2) {
          address = parts.slice(2).join(', ').trim()
          console.log('parseGuestInfo - Address (after phone in second part):', address)
        }
      } else {
        // Second part is not phone - assume it's start of address
        address = parts.slice(1).join(', ').trim()
        console.log('parseGuestInfo - Address (all after first, no phone):', address)
      }
    }
  }

  // Final fallback: if we have 3+ parts and still missing info
  // Assume format: parts[0] = name, parts[1] = phone, parts[2+] = address
  if (parts.length >= 3) {
    // Ensure we have name
    if (!name && parts[0]) {
      name = parts[0].trim()
      console.log('parseGuestInfo - Name (fallback):', name)
    }

    // Ensure we have phone - try parts[1] if not found yet
    if (!phone && parts[1]) {
      const part1Digits = parts[1].replace(/[^\d]/g, '')
      if (part1Digits.length >= 10 && part1Digits.length <= 11 && part1Digits.startsWith('0')) {
        phone = part1Digits
        phoneIndex = 1
        console.log('parseGuestInfo - Phone (fallback from parts[1]):', phone)
      }
    }

    // Ensure we have address
    if (!address) {
      if (phoneIndex >= 0 && phoneIndex < parts.length - 1) {
        // Address is after phone
        address = parts.slice(phoneIndex + 1).join(', ').trim()
        console.log('parseGuestInfo - Address (fallback, after phone):', address)
      } else if (parts.length >= 2) {
        // Address is everything after name/phone
        const addressStart = phone ? 2 : (name ? 1 : 1)
        if (parts.length > addressStart) {
          address = parts.slice(addressStart).join(', ').trim()
          console.log('parseGuestInfo - Address (fallback, start from index', addressStart, '):', address)
        }
      }
    }
  }

  // Clean up
  name = name.trim()
  phone = phone.trim()
  address = address.trim()

  const result = {
    name: name || undefined,
    phone: phone || undefined,
    address: address || undefined
  }

  console.log('parseGuestInfo - Final result:', JSON.stringify(result, null, 2))

  return result
}
