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
  hasCustomerId: boolean = false
): Promise<ConversationState> {
  return await setConversationState(sessionId, 'ORDER_CREATION', 1, {
    items,
    currentStep: 'confirm_items',
    needsGuestInfo: !hasCustomerId
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
  
  const lower = userMessage.toLowerCase()
  
  // Check for cancellation
  if (lower.includes('hủy') || lower.includes('cancel') || lower.includes('không')) {
    await clearConversationState(sessionId)
    return {
      shouldContinue: false,
      isCancelled: true
    }
  }
  
  // Check for confirmation
  if (lower.includes('xác nhận') || lower.includes('confirm') || 
      lower.includes('đồng ý') || lower.includes('ok') || 
      lower.includes('có') || lower.includes('yes')) {
    return {
      shouldContinue: true,
      isConfirmed: true
    }
  }
  
  // Flow-specific processing
  switch (state.flow) {
    case 'ORDER_CREATION':
      return await processOrderCreationResponse(sessionId, userMessage, state)
    
    case 'OCR_INVOICE':
      return await processOCRInvoiceResponse(sessionId, userMessage, state)
    
    case 'CRUD_CONFIRMATION':
      return await processCRUDConfirmationResponse(sessionId, userMessage, state)
    
    default:
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
  
  switch (currentStep) {
    case 'confirm_items':
      // Check if has customerId (logged in) or needs guest info
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
    
    case 'guest_info':
      // Parse guest info from message
      const guestInfo = parseGuestInfo(userMessage)
      
      if (!guestInfo.name || !guestInfo.phone || !guestInfo.address) {
        return {
          shouldContinue: true,
          nextPrompt: '❌ Thông tin chưa đầy đủ. Vui lòng cung cấp:\n' +
                     '- Họ tên\n' +
                     '- Số điện thoại\n' +
                     '- Địa chỉ\n\n' +
                     '💡 Ví dụ: Nguyễn Văn A, 0901234567, 123 Nguyễn Huệ, Q1, HCM'
        }
      }
      
      // Save guest info
      await updateFlowData(sessionId, { guestInfo })
      
      // Ready to create order
      return {
        shouldContinue: true,
        isConfirmed: true
      }
    
    case 'customer_info':
      // Extract customer info from message
      // (simplified - in production, use better parsing)
      await setOrderCreationStep(sessionId, 'payment_method')
      await advanceStep(sessionId)
      return {
        shouldContinue: true,
        nextPrompt: 'Chọn phương thức thanh toán:\n1. Tiền mặt (COD)\n2. Chuyển khoản\n3. VNPay\n4. MoMo'
      }
    
    case 'payment_method':
      // Extract payment method
      let paymentMethod = 'CASH'
      const lower = userMessage.toLowerCase()
      
      if (lower.includes('chuyển khoản') || lower.includes('bank') || lower.includes('2')) {
        paymentMethod = 'BANK_TRANSFER'
      } else if (lower.includes('vnpay') || lower.includes('3')) {
        paymentMethod = 'VNPAY'
      } else if (lower.includes('momo') || lower.includes('4')) {
        paymentMethod = 'MOMO'
      }
      
      await updateFlowData(sessionId, { paymentMethod })
      await setOrderCreationStep(sessionId, 'final_confirmation')
      await advanceStep(sessionId)
      
      return {
        shouldContinue: true,
        nextPrompt: `Xác nhận tạo đơn hàng với phương thức ${paymentMethod}?`
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
  name: string
  phone: string
  address: string
} {
  // Try structured format first: "Name, Phone, Address"
  const parts = message.split(',').map(p => p.trim())
  
  if (parts.length >= 3) {
    return {
      name: parts[0],
      phone: parts[1],
      address: parts.slice(2).join(', ')
    }
  }
  
  // Try to extract phone number
  const phoneMatch = message.match(/(?:0|\+84)\d{9,10}/)
  const phone = phoneMatch ? phoneMatch[0] : ''
  
  // Try to extract name (usually at the beginning)
  const nameMatch = message.match(/^([A-Za-zÀ-ỹ\s]+?)(?=,|\d|$)/)
  const name = nameMatch ? nameMatch[1].trim() : ''
  
  // Everything else is address
  let address = message
  if (phone) {
    address = address.replace(phone, '').trim()
  }
  if (name) {
    address = address.replace(name, '').trim()
  }
  address = address.replace(/^[,\s]+|[,\s]+$/g, '')
  
  return { name, phone, address }
}
