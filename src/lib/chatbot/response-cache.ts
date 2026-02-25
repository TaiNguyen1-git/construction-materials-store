/**
 * AI Response Cache — Server-side deduplication layer
 * 
 * Caches AI responses for similar queries to avoid redundant Gemini API calls.
 * Uses Redis when available, falls back to in-memory Map.
 * 
 * Strategy:
 * - Normalize user message → generate cache key
 * - If cache hit within TTL → return cached response (0 AI tokens used)
 * - If cache miss → call AI → store result → return
 * 
 * This can reduce AI API calls by 30-50% for common questions.
 */

import { redis, isRedisConfigured } from '../redis'
import { getEmbedding } from '../ai/ai-client'

// ─── Math Utils ────────────────────────────────────────────────────────────────

function dotProduct(vecA: number[], vecB: number[]): number {
    return vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
}

function magnitude(vec: number[]): number {
    return Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0))
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dot = dotProduct(vecA, vecB)
    const magA = magnitude(vecA)
    const magB = magnitude(vecB)
    if (magA === 0 || magB === 0) return 0
    return dot / (magA * magB)
}

// ─── Configuration ──────────────────────────────────────────────────────────────

const CACHE_TTL_SECONDS = 30 * 60  // 30 minutes for general queries
const PRICE_CACHE_TTL = 60 * 60    // 1 hour for price queries (prices don't change that fast)
const MAX_MEMORY_CACHE = 200       // Max entries in memory fallback

// ─── In-memory fallback ─────────────────────────────────────────────────────────

interface CacheEntry {
    response: string
    suggestions: string[]
    confidence: number
    productRecommendations?: unknown[]
    cachedAt: number
    ttl: number
    embedding?: number[]
}

const memoryCache = new Map<string, CacheEntry>()
const SEMANTIC_THRESHOLD = 0.92 // Similarity threshold (0-1)
const MAX_SEMANTIC_ENTRIES = 50  // Compare against last 50 unique queries

// ─── Normalize message for cache key ────────────────────────────────────────────

function normalizeForCache(message: string): string {
    return message
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s]/gi, '')     // Remove special chars
        .replace(/\s+/g, ' ')             // Collapse whitespace
        .trim()
        .substring(0, 200)                // Cap length for key
}

/**
 * Generate a cache key from user message + role context
 */
function getCacheKey(message: string, isAdmin: boolean): string {
    const normalized = normalizeForCache(message)
    const prefix = isAdmin ? 'ai:admin:' : 'ai:chat:'
    return `${prefix}${normalized}`
}

/**
 * Determine TTL based on query type
 */
function getTTL(message: string): number {
    const lower = message.toLowerCase()
    // Price queries can be cached longer (products don't change price every minute)
    if (lower.includes('giá') || lower.includes('bao nhiêu') || lower.includes('price')) {
        return PRICE_CACHE_TTL
    }
    return CACHE_TTL_SECONDS
}

// ─── Public API ─────────────────────────────────────────────────────────────────

export interface CachedResponse {
    response: string
    suggestions: string[]
    confidence: number
    productRecommendations?: unknown[]
    fromCache: true
}

/**
 * Try to get a cached AI response for the given message.
 * Returns null if no cache hit.
 */
export async function getCachedResponse(
    message: string,
    isAdmin: boolean = false
): Promise<CachedResponse | null> {
    const key = getCacheKey(message, isAdmin)

    // Try Redis first
    if (isRedisConfigured()) {
        try {
            const cached = await redis.get<CacheEntry>(key)
            if (cached) {
                console.log(`[ResponseCache] Redis HIT: "${message.substring(0, 50)}..."`)
                return {
                    response: cached.response,
                    suggestions: cached.suggestions,
                    confidence: cached.confidence,
                    productRecommendations: cached.productRecommendations,
                    fromCache: true
                }
            }
        } catch (err) {
            console.warn('[ResponseCache] Redis read error:', err)
            // Fall through to memory
        }
    }

    // Memory fallback
    const entry = memoryCache.get(key)
    if (entry) {
        const age = Date.now() - entry.cachedAt
        if (age < entry.ttl * 1000) {
            console.log(`[ResponseCache] Memory HIT: "${message.substring(0, 50)}..."`)
            return {
                response: entry.response,
                suggestions: entry.suggestions,
                confidence: entry.confidence,
                productRecommendations: entry.productRecommendations,
                fromCache: true
            }
        }
        // Expired, clean up
        memoryCache.delete(key)
    }

    // 2. Semantic Match Fallback
    // If not exact match, try to find a similar meaning question
    const queryEmbedding = await getEmbedding(message)
    if (!queryEmbedding) return null

    let bestMatch: { entry: CacheEntry; score: number } | null = null

    // Iterate through memory cache to find semantically similar entries
    // For production with huge data, you'd use a Vector DB, but for 50-100 items, this is fine.
    for (const [key, entry] of memoryCache.entries()) {
        if (!entry.embedding || (isAdmin && !key.startsWith('ai:admin:')) || (!isAdmin && key.startsWith('ai:admin:'))) continue

        const similarity = cosineSimilarity(queryEmbedding, entry.embedding)
        if (similarity > SEMANTIC_THRESHOLD) {
            if (!bestMatch || similarity > bestMatch.score) {
                bestMatch = { entry, score: similarity }
            }
        }
    }

    if (bestMatch) {
        console.log(`[ResponseCache] Semantic HIT (${(bestMatch.score * 100).toFixed(1)}%): "${message.substring(0, 40)}..." matching "${bestMatch.entry.response.substring(0, 40)}..."`)
        return {
            response: bestMatch.entry.response,
            suggestions: bestMatch.entry.suggestions,
            confidence: bestMatch.entry.confidence,
            productRecommendations: bestMatch.entry.productRecommendations,
            fromCache: true
        }
    }

    return null
}

/**
 * Store an AI response in cache for future deduplication.
 * Non-blocking — errors are logged but don't affect the response.
 */
export async function cacheResponse(
    message: string,
    data: {
        response: string
        suggestions: string[]
        confidence: number
        productRecommendations?: unknown[]
    },
    isAdmin: boolean = false
): Promise<void> {
    // Don't cache low-confidence or error responses
    if (data.confidence < 0.5) return
    // Don't cache very short or error-like responses
    if (data.response.length < 20) return

    const key = getCacheKey(message, isAdmin)
    const ttl = getTTL(message)

    // Get embedding to enable semantic matching later
    const embedding = await getEmbedding(message)

    const entry: CacheEntry = {
        response: data.response,
        suggestions: data.suggestions,
        confidence: data.confidence,
        productRecommendations: data.productRecommendations,
        cachedAt: Date.now(),
        ttl,
        embedding: embedding || undefined
    }

    // Store to Redis (non-blocking)
    if (isRedisConfigured()) {
        redis.set(key, entry, { ex: ttl }).catch(err => {
            console.warn('[ResponseCache] Redis write error:', err)
        })
    }

    // Always store to memory as well (backup + faster reads)
    if (memoryCache.size >= MAX_MEMORY_CACHE) {
        // Evict oldest entries
        const oldest = [...memoryCache.entries()]
            .sort((a, b) => a[1].cachedAt - b[1].cachedAt)
            .slice(0, 50)
        for (const [k] of oldest) {
            memoryCache.delete(k)
        }
    }
    memoryCache.set(key, entry)
}

/**
 * Check if a message should bypass cache (dynamic/personal queries)
 */
export function shouldBypassCache(message: string): boolean {
    const lower = message.toLowerCase()

    // Order-related queries are always dynamic
    if (lower.includes('đơn hàng') && (lower.includes('của tôi') || lower.includes('kiểm tra'))) return true
    // Account-specific queries
    if (lower.includes('tài khoản') || lower.includes('điểm tích lũy')) return true
    // Real-time inventory checks
    if (lower.includes('còn hàng không') || lower.includes('tồn kho')) return true
    // Calculation requests (unique per user)
    if (lower.includes('tính') && lower.includes('m²')) return true

    return false
}
