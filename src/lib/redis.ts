import { Redis } from '@upstash/redis'

/**
 * Initialize Redis client using Upstash REST API
 * This is optimized for Serverless/Edge environments (Next.js)
 */
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/**
 * Helper to check if redis is configured
 */
export function isRedisConfigured(): boolean {
    return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}
