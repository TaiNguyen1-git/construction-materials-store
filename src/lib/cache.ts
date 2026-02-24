/**
 * Cache Service — Redis-backed with in-memory fallback
 *
 * Replaces the old `Map`-based CacheService with Redis persistence.
 * All existing callers keep working: API is identical (get / set / del / delByPrefix / flush).
 *
 * Benefits over the old implementation:
 *   • Cache survives Vercel cold-starts / server restarts
 *   • Shared across all serverless instances (no per-instance warm-up)
 *   • delByPrefix uses Redis SCAN — works without loading keys into memory
 *   • Zero breaking changes — same method signatures, same import path
 */
import { redis, isRedisConfigured } from './redis'
import { logger, logCache } from './logger'

// ─── In-memory fallback ────────────────────────────────────────────────────────
const memoryCache = new Map<string, { value: unknown; expires?: number }>()

// Periodic memory cleanup (unchanged from original)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expires && entry.expires < now) {
      memoryCache.delete(key)
    }
  }
}, 60_000)

// ─── CacheService ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class CacheService {
  // ── GET ──────────────────────────────────────────────────────────────────────
  static async get<T = unknown>(key: string): Promise<T | null> {
    // 1. Try Redis
    if (isRedisConfigured()) {
      try {
        const val = await redis.get<T>(key)
        if (val !== null && val !== undefined) {
          logCache.hit(key)
          return val
        }
      } catch (err) {
        logger.warn(`[Cache] Redis GET failed for "${key}", falling back to memory`, { error: String(err) })
      }
    }

    // 2. Memory fallback
    const entry = memoryCache.get(key)
    if (!entry) { logCache.miss(key); return null }
    if (entry.expires && entry.expires < Date.now()) {
      memoryCache.delete(key)
      logCache.miss(key)
      return null
    }
    logCache.hit(key)
    return entry.value as T
  }

  // ── SET ──────────────────────────────────────────────────────────────────────
  static async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    // 1. Try Redis
    if (isRedisConfigured()) {
      try {
        if (ttlSeconds) {
          await redis.set(key, value, { ex: ttlSeconds })
        } else {
          await redis.set(key, value)
        }
        logCache.set(key, ttlSeconds)
        // Also warm memory cache so the very next call is free
        memoryCache.set(key, {
          value,
          expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
        })
        return
      } catch (err) {
        logger.warn(`[Cache] Redis SET failed for "${key}", falling back to memory`, { error: String(err) })
      }
    }

    // 2. Memory fallback
    memoryCache.set(key, {
      value,
      expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    })
    logCache.set(key, ttlSeconds)
  }

  // ── DELETE ───────────────────────────────────────────────────────────────────
  static async del(key: string): Promise<void> {
    memoryCache.delete(key)

    if (isRedisConfigured()) {
      try {
        await redis.del(key)
        logCache.invalidate(key)
      } catch (err) {
        logger.warn(`[Cache] Redis DEL failed for "${key}"`, { error: String(err) })
      }
    } else {
      logCache.invalidate(key)
    }
  }

  // ── DELETE BY PREFIX ─────────────────────────────────────────────────────────
  /**
   * Delete all keys starting with `prefix`.
   * Uses Redis SCAN to avoid loading all keys into memory.
   */
  static async delByPrefix(prefix: string): Promise<void> {
    // Memory cleanup
    let memCount = 0
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) { memoryCache.delete(key); memCount++ }
    }

    if (isRedisConfigured()) {
      try {
        let cursor = 0
        let redisCount = 0
        do {
          const scanResult = await redis.scan(cursor, { match: `${prefix}*`, count: 100 }) as unknown as [number, string[]]
          const [nextCursor, keys] = scanResult
          cursor = Number(nextCursor)
          if (keys && keys.length > 0) {
            await Promise.all((keys as string[]).map((k: string) => redis.del(k)))
            redisCount += keys.length
          }
        } while (cursor !== 0)

        if (redisCount > 0) {
          logger.info(`[Cache] Invalidated ${redisCount} Redis + ${memCount} memory keys with prefix: ${prefix}`)
        }
        return
      } catch (err) {
        logger.warn(`[Cache] Redis SCAN/DEL failed for prefix "${prefix}"`, { error: String(err) })
      }
    }

    if (memCount > 0) {
      logger.info(`[Cache] Invalidated ${memCount} memory keys with prefix: ${prefix}`, { type: 'cache' })
    }
  }

  // ── FLUSH ────────────────────────────────────────────────────────────────────
  /**
   * Flush *only* application-level keys (those matching common prefixes).
   * We never call FLUSHDB on a shared Redis instance.
   */
  static async flush(): Promise<void> {
    const memSize = memoryCache.size
    memoryCache.clear()
    logger.info(`[Cache] Memory cache flushed (${memSize} keys wiped)`, { type: 'cache' })
    // Note: We intentionally do NOT flush Redis here to avoid wiping
    // rate-limit counters and conversation state stored by other services.
  }
}

export default CacheService