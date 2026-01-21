/**
 * Input Sanitization and Validation
 */

/**
 * Sanitize text input to prevent XSS and injection attacks
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Remove any script tags
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  // Remove any potential SQL injection patterns
  sanitized = sanitized.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi, '')

  // Limit length
  sanitized = sanitized.substring(0, 5000)

  // Trim whitespace
  sanitized = sanitized.trim()

  return sanitized
}

/**
 * Sanitize base64 image
 */
export function sanitizeBase64Image(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null
  }

  // Check if it's a valid data URL
  const dataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp|bmp);base64,/

  if (!dataUrlPattern.test(input)) {
    return null
  }

  // Check size (max 10MB)
  const sizeInBytes = Math.ceil((input.length * 3) / 4)
  const sizeInMB = sizeInBytes / (1024 * 1024)

  if (sizeInMB > 10) {
    return null
  }

  return input
}

/**
 * Sanitize session ID
 */
export function sanitizeSessionId(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null
  }

  // Session ID should be alphanumeric with underscores
  if (!/^chat_[a-zA-Z0-9_-]{10,50}$/.test(input)) {
    return null
  }

  return input
}

/**
 * Sanitize user role
 */
export function sanitizeUserRole(input: string): string {
  const validRoles = ['CUSTOMER', 'EMPLOYEE', 'MANAGER']

  if (!input || typeof input !== 'string') {
    return 'CUSTOMER'
  }

  const upperInput = input.toUpperCase()
  return validRoles.includes(upperInput) ? upperInput : 'CUSTOMER'
}

/**
 * Validate and sanitize chatbot request
 */
export interface SanitizedChatRequest {
  message?: string
  image?: string
  customerId?: string
  sessionId: string
  userRole: string
  isAdmin: boolean
  context?: {
    currentPage?: string
    productId?: string
    categoryId?: string
  }
}

export function sanitizeChatRequest(input: any): SanitizedChatRequest | null {
  try {
    // Sanitize session ID (required)
    const sessionId = sanitizeSessionId(input.sessionId)
    if (!sessionId) {
      return null
    }

    // Sanitize message
    const message = input.message ? sanitizeText(input.message) : undefined

    // Sanitize image
    const image = input.image ? sanitizeBase64Image(input.image) : undefined

    // Must have either message or image
    if (!message && !image) {
      return null
    }

    // Sanitize user role
    const userRole = sanitizeUserRole(input.userRole || 'CUSTOMER')
    const isAdmin = userRole === 'MANAGER' || userRole === 'EMPLOYEE'

    // Sanitize context
    let context: any = undefined
    if (input.context && typeof input.context === 'object') {
      context = {
        currentPage: input.context.currentPage ? sanitizeText(input.context.currentPage) : undefined,
        productId: input.context.productId ? sanitizeText(input.context.productId) : undefined,
        categoryId: input.context.categoryId ? sanitizeText(input.context.categoryId) : undefined
      }
    }

    return {
      message,
      image: image ?? undefined,
      customerId: input.customerId ? sanitizeText(input.customerId) : undefined,
      sessionId,
      userRole,
      isAdmin,
      context
    }
  } catch (error) {
    console.error('Sanitization error:', error)
    return null
  }
}
