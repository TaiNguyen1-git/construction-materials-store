// In-memory rate limiting store
const memoryStore = new Map<string, { count: number; resetTime: number }>()

// Clean expired entries periodically
setInterval(() => {
  const now = Math.floor(Date.now() / 1000)
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetTime < now) {
      memoryStore.delete(key)
    }
  }
}, 60000) // Clean every minute

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

export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { identifier, limit, window } = options
  const key = `rate_limit:${identifier}`
  const now = Math.floor(Date.now() / 1000)
  
  try {
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
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open - allow request on error
    return {
      success: true,
      remaining: limit - 1,
      reset: now + window,
      limit,
    }
  }
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

export async function rateLimitMiddleware(
  identifier: string,
  preset: keyof typeof RateLimitPresets = 'NORMAL'
): Promise<RateLimitResult> {
  return rateLimit({
    identifier,
    ...RateLimitPresets[preset],
  })
}
