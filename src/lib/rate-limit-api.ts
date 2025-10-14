// API Route Rate Limiting (Node.js Runtime Compatible)
// This version uses in-memory storage for rate limiting

export interface RateLimitOptions {
  identifier: string  // IP address or user ID
  limit: number       // Max requests
  window: number      // Time window in seconds
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  limit: number
}

// Simple in-memory rate limiting for when Redis is not available
const memoryStore = new Map<string, { count: number; resetTime: number }>()

async function rateLimitMemory(options: RateLimitOptions): Promise<RateLimitResult> {
  const { identifier, limit, window } = options
  const key = `rate_limit:${identifier}`
  const now = Math.floor(Date.now() / 1000)
  
  const existing = memoryStore.get(key)
  
  if (!existing || existing.resetTime < now) {
    memoryStore.set(key, { count: 1, resetTime: now + window })
    return {
      success: true,
      remaining: limit - 1,
      reset: now + window,
      limit,
    }
  }
  
  if (existing.count >= limit) {
    return {
      success: false,
      remaining: 0,
      reset: existing.resetTime,
      limit,
    }
  }
  
  existing.count++
  return {
    success: true,
    remaining: limit - existing.count,
    reset: existing.resetTime,
    limit,
  }
}

export async function rateLimitAPI(options: RateLimitOptions): Promise<RateLimitResult> {
  // Use in-memory rate limiting directly
  return rateLimitMemory(options)
}

// Preset rate limit configurations
export const RateLimitPresets = {
  // Very strict for sensitive operations
  STRICT: {
    limit: 5,
    window: 60, // 5 requests per minute
  },
  // Normal for general API endpoints
  NORMAL: {
    limit: 100,
    window: 60, // 100 requests per minute
  },
  // Generous for public endpoints
  GENEROUS: {
    limit: 200,
    window: 60, // 200 requests per minute
  },
  // Login attempts
  AUTH: {
    limit: 5,
    window: 900, // 5 attempts per 15 minutes
  },
  // Password reset
  PASSWORD_RESET: {
    limit: 3,
    window: 3600, // 3 attempts per hour
  },
} as const

// Helper function to use in API routes
export async function checkRateLimit(
  identifier: string,
  preset: keyof typeof RateLimitPresets = 'NORMAL'
): Promise<RateLimitResult> {
  return rateLimitAPI({
    identifier,
    ...RateLimitPresets[preset],
  })
}

// Clean up old entries from memory store periodically
setInterval(() => {
  const now = Math.floor(Date.now() / 1000)
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetTime < now) {
      memoryStore.delete(key)
    }
  }
}, 60000) // Clean every minute
