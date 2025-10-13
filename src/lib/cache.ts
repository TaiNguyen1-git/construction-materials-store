import { createClient, RedisClientType } from 'redis'
import { logger, logCache } from './logger'

// Check if Redis should be enabled
const REDIS_ENABLED = process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://localhost:6379' ? true : false

let redisClient: RedisClientType | null = null
let isConnected = false
let connectionAttempted = false

// Create and connect to Redis only if enabled
const connectRedis = async () => {
  if (connectionAttempted) return
  connectionAttempted = true

  if (!REDIS_ENABLED) {
    logger.info('Redis is disabled - running without cache', { type: 'cache' })
    return
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: false // Don't retry connections
      }
    })

    // Handle Redis errors silently
    redisClient.on('error', (err) => {
      if (!isConnected) {
        logger.warn('Redis unavailable - running without cache', { type: 'cache' })
      }
    })

    await redisClient.connect()
    isConnected = true
    logger.info('Connected to Redis', { type: 'cache' })
  } catch (error: any) {
    logger.warn('Redis unavailable - running without cache', { type: 'cache' })
    isConnected = false
    redisClient = null
  }
}

// Cache service
export class CacheService {
  static async get(key: string): Promise<any> {
    try {
      if (!connectionAttempted) await connectRedis()
      if (!isConnected || !redisClient) {
        return null // Skip cache if Redis unavailable
      }
      
      const value = await redisClient.get(key)
      
      if (value) {
        logCache.hit(key)
        return JSON.parse(value)
      } else {
        logCache.miss(key)
        return null
      }
    } catch (error: any) {
      // Silently skip cache on error
      return null
    }
  }

  static async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      if (!connectionAttempted) await connectRedis()
      if (!isConnected || !redisClient) {
        return // Skip cache if Redis unavailable
      }
      
      const stringValue = JSON.stringify(value)
      if (ttlSeconds) {
        await redisClient.setEx(key, ttlSeconds, stringValue)
      } else {
        await redisClient.set(key, stringValue)
      }
      logCache.set(key, ttlSeconds)
    } catch (error: any) {
      // Silently skip cache on error
    }
  }

  static async del(key: string): Promise<void> {
    try {
      if (!connectionAttempted) await connectRedis()
      if (!isConnected || !redisClient) {
        return // Skip cache if Redis unavailable
      }
      
      await redisClient.del(key)
      logCache.invalidate(key)
    } catch (error: any) {
      // Silently skip cache on error
    }
  }

  static async flush(): Promise<void> {
    try {
      if (!connectionAttempted) await connectRedis()
      if (!isConnected || !redisClient) {
        return // Skip cache if Redis unavailable
      }
      
      await redisClient.flushAll()
      logger.info('Cache flushed', { type: 'cache' })
    } catch (error: any) {
      // Silently skip cache on error
    }
  }
}

export default CacheService