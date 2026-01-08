import { describe, it, expect, beforeEach } from 'vitest'
import {
    checkRateLimit,
    sanitizeInput,
    sanitizeObject
} from '@/lib/api-security'

describe('API Security Utils', () => {
    describe('checkRateLimit', () => {
        // Note: Rate limit uses in-memory store so tests need unique keys
        const getUniqueKey = () => `test_key_${Date.now()}_${Math.random()}`

        it('should allow first request', () => {
            const key = getUniqueKey()
            const result = checkRateLimit(key, 10, 60000)

            expect(result.allowed).toBe(true)
            expect(result.remaining).toBe(9)
        })

        it('should decrement remaining count on each request', () => {
            const key = getUniqueKey()

            checkRateLimit(key, 10, 60000)
            const result = checkRateLimit(key, 10, 60000)

            expect(result.allowed).toBe(true)
            expect(result.remaining).toBe(8)
        })

        it('should block when limit is exceeded', () => {
            const key = getUniqueKey()

            // Make max requests
            for (let i = 0; i < 5; i++) {
                checkRateLimit(key, 5, 60000)
            }

            // This should be blocked
            const result = checkRateLimit(key, 5, 60000)

            expect(result.allowed).toBe(false)
            expect(result.remaining).toBe(0)
        })

        it('should reset after window expires', async () => {
            const key = getUniqueKey()

            // Make max requests with very short window
            for (let i = 0; i < 3; i++) {
                checkRateLimit(key, 3, 100) // 100ms window
            }

            // Wait for window to expire
            await new Promise(resolve => setTimeout(resolve, 150))

            // Should be allowed again
            const result = checkRateLimit(key, 3, 100)

            expect(result.allowed).toBe(true)
            expect(result.remaining).toBe(2)
        })
    })

    describe('sanitizeInput', () => {
        it('should escape HTML special characters', () => {
            const input = '<script>alert("xss")</script>'
            const result = sanitizeInput(input)

            expect(result).not.toContain('<')
            expect(result).not.toContain('>')
            expect(result).toContain('&lt;')
            expect(result).toContain('&gt;')
        })

        it('should escape quotes', () => {
            const input = 'test "quoted" and \'single\''
            const result = sanitizeInput(input)

            expect(result).not.toContain('"')
            expect(result).not.toContain("'")
            expect(result).toContain('&quot;')
            expect(result).toContain('&#x27;')
        })

        it('should trim whitespace', () => {
            const input = '  test  '
            const result = sanitizeInput(input)

            expect(result).toBe('test')
        })

        it('should handle normal strings unchanged', () => {
            const input = 'normal string with no special chars'
            const result = sanitizeInput(input)

            expect(result).toBe('normal string with no special chars')
        })
    })

    describe('sanitizeObject', () => {
        it('should sanitize string values in object', () => {
            const input = {
                name: '<script>alert("xss")</script>',
                email: 'test@example.com',
                count: 42
            }

            const result = sanitizeObject(input)

            expect(result.name).not.toContain('<')
            expect(result.email).toBe('test@example.com')
            expect(result.count).toBe(42)
        })

        it('should sanitize nested objects', () => {
            const input = {
                user: {
                    name: '<b>Test</b>',
                    profile: {
                        bio: '<script>evil()</script>'
                    }
                }
            }

            const result = sanitizeObject(input)

            expect(result.user.name).not.toContain('<')
            expect(result.user.profile.bio).not.toContain('<')
        })

        it('should sanitize arrays', () => {
            const input = {
                tags: ['<tag1>', 'normal', '<tag2>'],
                nested: [{ name: '<test>' }]
            }

            const result = sanitizeObject(input)

            expect(result.tags[0]).not.toContain('<')
            expect(result.tags[1]).toBe('normal')
            expect(result.nested[0].name).not.toContain('<')
        })

        it('should handle null and undefined', () => {
            const input = {
                name: 'test',
                empty: null,
                missing: undefined
            }

            const result = sanitizeObject(input)

            expect(result.name).toBe('test')
            expect(result.empty).toBe(null)
            expect(result.missing).toBe(undefined)
        })
    })
})
