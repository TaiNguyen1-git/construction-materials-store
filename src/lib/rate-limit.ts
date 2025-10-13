import { createClient, RedisClientType } from 'redis'

let redisClient: RedisClientType | null = null
let isConnected = false

const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    })

    redisClient.on('error', (err) => {
      console.error('Redis Rate Limit Error:', err)
    })
  }

  if (!isConnected) {
    try {
      await redisClient.connect()
      isConnected = true
    } catch (error) {
      console.error('Failed to connect to Redis for rate limiting:', error)
      throw error
    }
  }

  return redisClient
}

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

  try {
    const client = await getRedisClient()
    const now = Math.floor(Date.now() / 1000)
    const windowStart = now - window

    // Use Redis sorted set to track requests
    const multi = client.multi()
    
    // Remove old requests outside the window
    multi.zRemRangeByScore(key, 0, windowStart)
    
    // Count requests in current window
    multi.zCard(key)
    
    // Add current request
    multi.zAdd(key, { score: now, value: `${now}:${Math.random()}` })
    
    // Set expiration
    multi.expire(key, window)
    
    const results = await multi.exec()
    
    // Get count of requests in window (before adding current request)
    const count = results?.[1] as number || 0
    
    const remaining = Math.max(0, limit - count - 1)
    const reset = now + window

    if (count >= limit) {
      return {
        success: false,
        remaining: 0,
        reset,
        limit,
      }
    }

    return {
      success: true,
      remaining,
      reset,
      limit,
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open - allow request if Redis is down
    return {
      success: true,
      remaining: limit - 1,
      reset: Math.floor(Date.now() / 1000) + window,
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
