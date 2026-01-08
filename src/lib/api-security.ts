/**
 * API Security Utilities
 * - Rate limiting (in-memory for demo)
 * - Request validation helpers
 */

interface RateLimitEntry {
    count: number
    resetTime: number
}

// In-memory store for rate limiting (for demo purposes)
// In production, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Simple rate limiter
 * @param key Unique identifier (e.g., IP, sessionId, userId)
 * @param maxRequests Maximum requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
    key: string,
    maxRequests: number = 30,
    windowMs: number = 60000 // 1 minute default
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now()
    const entry = rateLimitStore.get(key)

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
        cleanupExpiredEntries()
    }

    if (!entry || now > entry.resetTime) {
        // New window
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs
        })
        return {
            allowed: true,
            remaining: maxRequests - 1,
            resetIn: windowMs
        }
    }

    if (entry.count >= maxRequests) {
        // Rate limit exceeded
        return {
            allowed: false,
            remaining: 0,
            resetIn: entry.resetTime - now
        }
    }

    // Increment counter
    entry.count++
    rateLimitStore.set(key, entry)

    return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetIn: entry.resetTime - now
    }
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries() {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key)
        }
    }
}

/**
 * Get rate limit key from request
 * Uses session ID, user ID, or IP as fallback
 */
export function getRateLimitKey(request: Request, prefix: string = 'api'): string {
    // Try to get session ID from body or headers
    const sessionId = request.headers.get('x-session-id')
    const userId = request.headers.get('x-user-id')
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown'

    if (userId) return `${prefix}:user:${userId}`
    if (sessionId) return `${prefix}:session:${sessionId}`
    return `${prefix}:ip:${ip}`
}

/**
 * Create rate limit error response
 */
export function rateLimitResponse(resetIn: number) {
    return {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${Math.ceil(resetIn / 1000)} giây.`
        }
    }
}

/**
 * Validate request size
 * @param request Request object
 * @param maxSizeBytes Maximum allowed size in bytes
 */
export async function validateRequestSize(
    request: Request,
    maxSizeBytes: number = 5 * 1024 * 1024 // 5MB default
): Promise<{ valid: boolean; error?: string }> {
    const contentLength = request.headers.get('content-length')

    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
        return {
            valid: false,
            error: `Request quá lớn. Tối đa ${Math.round(maxSizeBytes / 1024 / 1024)}MB.`
        }
    }

    return { valid: true }
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') return input

    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim()
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const result: any = {}

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            result[key] = sanitizeInput(value)
        } else if (Array.isArray(value)) {
            result[key] = value.map(item =>
                typeof item === 'string' ? sanitizeInput(item) :
                    typeof item === 'object' && item !== null ? sanitizeObject(item) : item
            )
        } else if (typeof value === 'object' && value !== null) {
            result[key] = sanitizeObject(value)
        } else {
            result[key] = value
        }
    }

    return result as T
}
