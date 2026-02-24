import { redis, isRedisConfigured } from './redis'

/**
 * Rate limiter for API endpoints
 * Uses Upstash Redis for global scalability, falls back to in-memory only if not configured
 */

export interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  max: number       // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Check if request is allowed based on rate limit
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now()
  const key = `rate:${identifier}`

  // USE REDIS IF CONFIGURED (Production Scalable approach)
  if (isRedisConfigured()) {
    try {
      // Use Redis INCR and PEXPIRE for atomic rate limiting
      const current = await redis.incr(key)

      if (current === 1) {
        // First request in window, set expiry
        await redis.pexpire(key, config.windowMs)

        return {
          allowed: true,
          remaining: config.max - 1,
          resetAt: now + config.windowMs
        }
      }

      // Check if allowed
      const allowed = current <= config.max
      const ttl = await redis.pttl(key)
      const resetAt = ttl > 0 ? now + ttl : now + config.windowMs

      return {
        allowed,
        remaining: Math.max(0, config.max - current),
        resetAt
      }
    } catch (err) {
      console.error('[RateLimiter] Redis error, falling back to memory:', err)
      // Fall through to memory fallback
    }
  }

  // FALLBACK: Simple in-memory rate limiter
  let entry = rateLimitStore.get(key)
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + config.windowMs
    }
    rateLimitStore.set(key, entry)
    return {
      allowed: true,
      remaining: config.max - 1,
      resetAt: entry.resetAt
    }
  }

  entry.count++
  return {
    allowed: entry.count <= config.max,
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
