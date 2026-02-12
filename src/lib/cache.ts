import { logger, logCache } from './logger'

// In-memory cache for development/production without Redis
const memoryCache = new Map<string, { value: any; expires?: number }>()

// Clean expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expires && entry.expires < now) {
      memoryCache.delete(key)
    }
  }
}, 60000) // Clean every minute

// Cache service using in-memory storage
export class CacheService {
  static async get<T = any>(key: string): Promise<T | null> {
    try {
      const entry = memoryCache.get(key)
      if (!entry) {
        logCache.miss(key)
        return null
      }

      // Check if expired
      if (entry.expires && entry.expires < Date.now()) {
        memoryCache.delete(key)
        logCache.miss(key)
        return null
      }

      logCache.hit(key)
      return entry.value as T
    } catch (error: any) {
      return null
    }
  }

  static async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const expires = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined
      memoryCache.set(key, { value, expires })
      logCache.set(key, ttlSeconds)
    } catch (error: any) {
      // Silently skip cache on error
    }
  }

  static async del(key: string): Promise<void> {
    try {
      if (memoryCache.has(key)) {
        memoryCache.delete(key)
        logCache.invalidate(key)
      }
    } catch (error: any) {
      // Silently skip cache on error
    }
  }

  /**
   * Delete all keys starting with a prefix
   */
  static async delByPrefix(prefix: string): Promise<void> {
    try {
      let count = 0
      for (const key of memoryCache.keys()) {
        if (key.startsWith(prefix)) {
          memoryCache.delete(key)
          count++
        }
      }
      if (count > 0) {
        logger.info(`Invalidated ${count} cache keys with prefix: ${prefix}`, { type: 'cache' })
      }
    } catch (error: any) {
      logger.error(`Error deleting cache by prefix: ${prefix}`, { error: error.message })
    }
  }

  static async flush(): Promise<void> {
    try {
      const size = memoryCache.size
      memoryCache.clear()
      logger.info(`Memory cache flushed (${size} keys wiped)`, { type: 'cache' })
    } catch (error: any) {
      // Silently skip cache on error
    }
  }
}

export default CacheService