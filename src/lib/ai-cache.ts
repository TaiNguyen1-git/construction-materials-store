/**
 * Simple AI Cache Service
 * Reduces API costs and latency for recurring questions
 */
export class AICacheService {
    private static cache = new Map<string, {
        response: any,
        expiresAt: number
    }>();

    private static DEFAULT_TTL = 1000 * 60 * 60; // 1 hour

    /**
     * Generate a cache key from input prompt and options
     */
    private static generateKey(prompt: string, context?: any): string {
        const contextStr = context ? JSON.stringify(context) : '';
        // Normalize prompt to improve hits
        const normalizedPrompt = prompt.toLowerCase().trim().replace(/\s+/g, ' ');
        return `${normalizedPrompt}_${contextStr}`;
    }

    /**
     * Get cached response if available and not expired
     */
    static get(prompt: string, context?: any): any | null {
        const key = this.generateKey(prompt, context);
        const cached = this.cache.get(key);

        if (cached) {
            if (Date.now() < cached.expiresAt) {
                return cached.response;
            } else {
                this.cache.delete(key);
            }
        }
        return null;
    }

    /**
     * Set cached response with optional TTL
     */
    static set(prompt: string, response: any, ttlMs: number = this.DEFAULT_TTL, context?: any): void {
        const key = this.generateKey(prompt, context);
        this.cache.set(key, {
            response,
            expiresAt: Date.now() + ttlMs
        });
    }

    /**
     * Clear cache for a specific prompt or entirely
     */
    static clear(prompt?: string): void {
        if (prompt) {
            this.cache.delete(this.generateKey(prompt));
        } else {
            this.cache.clear();
        }
    }
}

export const aiCache = AICacheService;
