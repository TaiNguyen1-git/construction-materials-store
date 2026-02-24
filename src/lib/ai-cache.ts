/**
 * AI Cache Service — Redis-backed with in-memory fallback
 *
 * Drop-in replacement for the old Map-based cache.
 * Redis persistence means cache survives server restarts and
 * is shared across all Serverless function instances (Vercel).
 *
 * TTL strategy:
 *   - Greeting / static responses  → 24 h  (never changes)
 *   - Product / price queries       →  1 h  (refreshed by RAG init)
 *   - Admin analytics queries       → 15 min
 */
import { redis, isRedisConfigured } from './redis'
import crypto from 'crypto'

// ─── TTL constants ─────────────────────────────────────────────────────────────
export const AI_CACHE_TTL = {
    STATIC: 60 * 60 * 24,       // 24 h — greetings, FAQs
    PRODUCT: 60 * 60,            // 1 h  — pricing / product info
    ADMIN: 60 * 15,              // 15 m — analytics
    DEFAULT: 60 * 60,            // 1 h  — everything else
} as const

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildKey(prompt: string, context?: unknown): string {
    const raw = `${prompt.toLowerCase().trim().replace(/\s+/g, ' ')}|${context ? JSON.stringify(context) : ''}`
    // Short SHA-256 prefix keeps keys human-readable in Redis CLI
    const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 12)
    return `ai_cache:${hash}`
}

// ─── In-memory fallback (same as before) ──────────────────────────────────────
const memCache = new Map<string, { value: unknown; expiresAt: number }>()

function memGet<T>(key: string): T | null {
    const e = memCache.get(key)
    if (!e) return null
    if (Date.now() > e.expiresAt) { memCache.delete(key); return null }
    return e.value as T
}

function memSet(key: string, value: unknown, ttlSeconds: number): void {
    memCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
}

// ─── Public API ────────────────────────────────────────────────────────────────

export class AICacheService {
    /**
     * Look up a cached AI response.
     * Returns null on miss (or Redis error → falls back to memory).
     */
    static async get<T = unknown>(prompt: string, context?: unknown): Promise<T | null> {
        const key = buildKey(prompt, context)

        if (isRedisConfigured()) {
            try {
                const cached = await redis.get<T>(key)
                if (cached !== null && cached !== undefined) {
                    console.log(`[AICache] Redis HIT — ${key}`)
                    return cached
                }
            } catch (err) {
                console.warn('[AICache] Redis get failed, falling back to memory:', err)
            }
        }

        // Memory fallback
        const memResult = memGet<T>(key)
        if (memResult !== null) console.log(`[AICache] Memory HIT — ${key}`)
        return memResult
    }

    /**
     * Store an AI response.
     * @param ttlSeconds  Seconds until expiry. Defaults to AI_CACHE_TTL.DEFAULT.
     */
    static async set(
        prompt: string,
        response: unknown,
        ttlSeconds: number = AI_CACHE_TTL.DEFAULT,
        context?: unknown
    ): Promise<void> {
        const key = buildKey(prompt, context)

        if (isRedisConfigured()) {
            try {
                await redis.set(key, response, { ex: ttlSeconds })
                console.log(`[AICache] Redis SET — ${key} (TTL ${ttlSeconds}s)`)
                return
            } catch (err) {
                console.warn('[AICache] Redis set failed, falling back to memory:', err)
            }
        }

        memSet(key, response, ttlSeconds)
    }

    /**
     * Invalidate a specific cached response (e.g., after product price update).
     */
    static async invalidate(prompt: string, context?: unknown): Promise<void> {
        const key = buildKey(prompt, context)
        memCache.delete(key)

        if (isRedisConfigured()) {
            try {
                await redis.del(key)
            } catch (err) {
                console.warn('[AICache] Redis del failed:', err)
            }
        }
    }

    /**
     * Invalidate all AI cache entries (e.g., after a product catalogue update).
     * WARNING: this scans Redis keys — use sparingly on large datasets.
     */
    static async invalidateAll(): Promise<void> {
        memCache.clear()

        if (isRedisConfigured()) {
            try {
                // Upstash supports SCAN — iterate and delete ai_cache:* keys
                let cursor = 0
                do {
                    const scanResult = await redis.scan(cursor, { match: 'ai_cache:*', count: 100 }) as unknown as [number, string[]]
                    const [nextCursor, keys] = scanResult
                    cursor = Number(nextCursor)
                    if (keys.length > 0) {
                        await Promise.all((keys as string[]).map((k: string) => redis.del(k)))
                    }
                } while (cursor !== 0)
                console.log('[AICache] All Redis AI cache entries invalidated')
            } catch (err) {
                console.warn('[AICache] Redis invalidateAll failed:', err)
            }
        }
    }

    // ── Legacy sync API (backward-compat, delegates to memory only) ────────────

    /** @deprecated Use async get() instead */
    static getSync(prompt: string, context?: unknown): unknown | null {
        return memGet(buildKey(prompt, context))
    }

    /** @deprecated Use async set() instead */
    static setSync(prompt: string, response: unknown, ttlMs: number = 3_600_000, context?: unknown): void {
        memSet(buildKey(prompt, context), response, Math.round(ttlMs / 1000))
    }

    /** @deprecated Use async invalidate() instead */
    static clear(prompt?: string): void {
        if (prompt) {
            memCache.delete(buildKey(prompt))
        } else {
            memCache.clear()
        }
    }
}

export const aiCache = AICacheService
