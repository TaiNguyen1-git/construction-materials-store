import { Redis } from '@upstash/redis'

// Singleton pattern for Upstash Redis client
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

export const redis = new Redis({
  url: redisUrl || '',
  token: redisToken || '',
})
