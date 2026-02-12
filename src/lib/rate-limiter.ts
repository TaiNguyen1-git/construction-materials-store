/**
 * Rate limiter for API endpoints
 * Uses Redis in production, falls back to in-memory for development
 */

// Simple in-memory rate limiter

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Check if Redis is available
 * For now, always use in-memory store
 */
function isRedisAvailable(): boolean {
  return false // Always use in-memory for simplicity
}

// Cleanup old entries every 5 minutes (only for in-memory)
setInterval(() => {
  if (!isRedisAvailable()) {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key)
      }
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  max: number       // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check if request is allowed based on rate limit
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now()
  const key = `rate:${identifier}`

  // Use in-memory only
  let entry = rateLimitStore.get(key)

  // Create or reset entry if expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1, // Start at 1 for the current request
      resetAt: now + config.windowMs
    }
    rateLimitStore.set(key, entry)

    return {
      allowed: true,
      remaining: Math.max(0, config.max - 1),
      resetAt: entry.resetAt
    }
  }

  // Increment count
  entry.count++

  // Check if allowed
  const allowed = entry.count <= config.max

  return {
    allowed,
    remaining: Math.max(0, config.max - entry.count),
    resetAt: entry.resetAt
  }
}

/**
 * Get rate limit identifier from request
 */
export function getRateLimitIdentifier(
  ip: string,
  userId?: string,
  endpoint?: string
): string {
  // Prefer userId over IP for authenticated requests
  const base = userId || ip
  return endpoint ? `${base}:${endpoint}` : base
}

/**
 * Predefined rate limit configs (2026 Enhanced)
 */
export const RateLimitConfigs = {
  // OCR is expensive, limit heavily for guests, more for auth
  OCR: {
    GUEST: { windowMs: 60 * 60 * 1000, max: 5 },  // 5 per hour
    AUTH: { windowMs: 60 * 60 * 1000, max: 50 },  // 50 per hour
  },

  // General chatbot
  CHATBOT: {
    GUEST: { windowMs: 60 * 1000, max: 15 }, // 15 msgs/min (Comfortable)
    AUTH: { windowMs: 60 * 1000, max: 100 }, // 100 msgs/min (Pro)
  },

  // Analytics queries
  ANALYTICS: {
    windowMs: 60 * 1000,
    max: 30
  },

  // CRUD operations
  CRUD: {
    windowMs: 60 * 1000,
    max: 20
  }
} as const

/**
 * Format rate limit error message
 */
export function formatRateLimitError(result: RateLimitResult): string {
  const resetIn = Math.ceil((result.resetAt - Date.now()) / 1000)

  // Validate resetIn to avoid NaN
  if (!resetIn || isNaN(resetIn) || resetIn <= 0) {
    return `⚠️ Bạn đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau 1 phút.`
  }

  const minutes = Math.floor(resetIn / 60)
  const seconds = resetIn % 60

  let timeStr = ''
  if (minutes > 0) {
    timeStr = `${minutes} phút ${seconds} giây`
  } else {
    timeStr = `${seconds} giây`
  }

  return `⚠️ Bạn đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau ${timeStr}.`
}
