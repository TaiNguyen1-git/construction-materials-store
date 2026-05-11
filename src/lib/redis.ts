import { Redis } from '@upstash/redis'

// Singleton pattern for Upstash Redis client
export const isRedisConfigured = () => {
  const isConfigured = !!(process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim())
  
  if (!isConfigured && process.env.NODE_ENV === 'production') {
    console.warn('[Redis] CRITICAL: Upstash Redis is NOT configured in production. ' +
                 'Falling back to in-memory cache which is volatile in serverless environments.')
  }
  
  return isConfigured
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

