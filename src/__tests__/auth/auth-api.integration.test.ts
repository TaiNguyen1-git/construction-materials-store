/**
 * Authentication API Integration Tests
 * 
 * These tests verify the auth API endpoints work correctly.
 * Run with: npm test -- --grep "Auth API"
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Test user data
const TEST_USER = {
    email: 'test-auth-api@example.com',
    password: 'TestPassword123!',
    name: 'Test User',
}

describe('Auth API Integration', () => {
    let testUserId: string | null = null

    // Setup: Create test user
    beforeAll(async () => {
        // Clean up any existing test user
        await prisma.user.deleteMany({
            where: { email: TEST_USER.email }
        })

        // Create test user
        const hashedPassword = await bcrypt.hash(TEST_USER.password, 12)
        const user = await prisma.user.create({
            data: {
                email: TEST_USER.email,
                password: hashedPassword,
                name: TEST_USER.name,
                role: 'CUSTOMER',
                isActive: true,
            }
        })
        testUserId = user.id
    })

    // Cleanup
    afterAll(async () => {
        // Delete test sessions
        if (testUserId) {
            await prisma.userSession.deleteMany({
                where: { userId: testUserId }
            })
        }

        // Delete test user
        await prisma.user.deleteMany({
            where: { email: TEST_USER.email }
        })

        await prisma.$disconnect()
    })

    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tab-Id': 'test-tab-1',
                },
                body: JSON.stringify({
                    email: TEST_USER.email,
                    password: TEST_USER.password,
                }),
            })

            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.user).toBeDefined()
            expect(data.user.email).toBe(TEST_USER.email)
            expect(data.token).toBeDefined()
            expect(data.sessionId).toBeDefined()

            // Password should NOT be in response
            expect(data.user.password).toBeUndefined()
        })

        it('should reject invalid password', async () => {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: TEST_USER.email,
                    password: 'WrongPassword123!',
                }),
            })

            const data = await response.json()

            expect(response.status).toBe(401)
            expect(data.success).toBe(false)
            expect(data.error).toContain('không đúng')
        })

        it('should reject non-existent user', async () => {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: 'nonexistent@example.com',
                    password: 'Password123!',
                }),
            })

            const data = await response.json()

            expect(response.status).toBe(401)
            expect(data.success).toBe(false)
        })

        it('should create session in database', async () => {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tab-Id': 'test-tab-session',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                },
                body: JSON.stringify({
                    email: TEST_USER.email,
                    password: TEST_USER.password,
                }),
            })

            const data = await response.json()

            expect(data.sessionId).toBeDefined()

            // Verify session exists in database
            const session = await prisma.userSession.findUnique({
                where: { id: data.sessionId }
            })

            expect(session).not.toBeNull()
            expect(session?.isActive).toBe(true)
            expect(session?.deviceInfo).toContain('Windows')
        })
    })

    describe('POST /api/auth/logout', () => {
        it('should logout and invalidate session', async () => {
            // First, login to get a session
            const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: TEST_USER.email,
                    password: TEST_USER.password,
                }),
            })

            const loginData = await loginResponse.json()
            const sessionId = loginData.sessionId
            const token = loginData.token

            // Now logout
            const logoutResponse = await fetch('http://localhost:3000/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ sessionId }),
            })

            const logoutData = await logoutResponse.json()

            expect(logoutResponse.status).toBe(200)
            expect(logoutData.success).toBe(true)

            // Verify session is deactivated
            const session = await prisma.userSession.findUnique({
                where: { id: sessionId }
            })

            expect(session?.isActive).toBe(false)
        })
    })

    describe('POST /api/auth/logout-all', () => {
        it('should deactivate all user sessions', async () => {
            // Login from multiple "tabs"
            const loginPromises = ['tab1', 'tab2', 'tab3'].map(tabId =>
                fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Tab-Id': tabId,
                    },
                    body: JSON.stringify({
                        email: TEST_USER.email,
                        password: TEST_USER.password,
                    }),
                }).then(r => r.json())
            )

            const loginResults = await Promise.all(loginPromises)
            const token = loginResults[0].token

            // Count active sessions before
            const activeSessionsBefore = await prisma.userSession.count({
                where: { userId: testUserId!, isActive: true }
            })

            expect(activeSessionsBefore).toBeGreaterThanOrEqual(3)

            // Logout all
            const logoutResponse = await fetch('http://localhost:3000/api/auth/logout-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            })

            const logoutData = await logoutResponse.json()

            expect(logoutResponse.status).toBe(200)
            expect(logoutData.success).toBe(true)

            // Count active sessions after
            const activeSessionsAfter = await prisma.userSession.count({
                where: { userId: testUserId!, isActive: true }
            })

            expect(activeSessionsAfter).toBe(0)
        })
    })

    describe('GET /api/auth/sessions', () => {
        it('should list active sessions', async () => {
            // Login first
            const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tab-Id': 'list-test-tab',
                },
                body: JSON.stringify({
                    email: TEST_USER.email,
                    password: TEST_USER.password,
                }),
            })

            const loginData = await loginResponse.json()
            const token = loginData.token

            // Get sessions
            const sessionsResponse = await fetch('http://localhost:3000/api/auth/sessions', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            const sessionsData = await sessionsResponse.json()

            expect(sessionsResponse.status).toBe(200)
            expect(sessionsData.success).toBe(true)
            expect(Array.isArray(sessionsData.sessions)).toBe(true)
            expect(sessionsData.sessions.length).toBeGreaterThan(0)

            // Current session should be marked
            const currentSession = sessionsData.sessions.find((s: any) => s.isCurrent)
            expect(currentSession).toBeDefined()
        })
    })

    describe('DELETE /api/auth/sessions/:id', () => {
        it('should revoke a specific session', async () => {
            // Login twice to create two sessions
            const login1 = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tab-Id': 'revoke-test-1',
                },
                body: JSON.stringify({
                    email: TEST_USER.email,
                    password: TEST_USER.password,
                }),
            }).then(r => r.json())

            const login2 = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tab-Id': 'revoke-test-2',
                },
                body: JSON.stringify({
                    email: TEST_USER.email,
                    password: TEST_USER.password,
                }),
            }).then(r => r.json())

            // Use token from first session to revoke the second
            const revokeResponse = await fetch(`http://localhost:3000/api/auth/sessions/${login2.sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${login1.token}`,
                },
            })

            const revokeData = await revokeResponse.json()

            expect(revokeResponse.status).toBe(200)
            expect(revokeData.success).toBe(true)

            // Verify session is deactivated
            const session = await prisma.userSession.findUnique({
                where: { id: login2.sessionId }
            })

            expect(session?.isActive).toBe(false)
        })

        it('should not allow revoking other users sessions', async () => {
            // Create another user
            const otherUserPassword = await bcrypt.hash('OtherPassword123!', 12)
            const otherUser = await prisma.user.create({
                data: {
                    email: 'other-user-test@example.com',
                    password: otherUserPassword,
                    name: 'Other User',
                    role: 'CUSTOMER',
                }
            })

            // Create a session for other user
            const otherSession = await prisma.userSession.create({
                data: {
                    userId: otherUser.id,
                    tokenHash: 'test-hash',
                    expiresAt: new Date(Date.now() + 3600000),
                }
            })

            // Login as test user
            const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: TEST_USER.email,
                    password: TEST_USER.password,
                }),
            }).then(r => r.json())

            // Try to revoke other user's session
            const revokeResponse = await fetch(`http://localhost:3000/api/auth/sessions/${otherSession.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${loginResponse.token}`,
                },
            })

            expect(revokeResponse.status).toBe(403)

            // Cleanup
            await prisma.userSession.delete({ where: { id: otherSession.id } })
            await prisma.user.delete({ where: { id: otherUser.id } })
        })
    })

    describe('Rate Limiting', () => {
        it('should block after too many failed login attempts', async () => {
            // This test is more of a documentation of expected behavior
            // In practice, rate limiting uses IP-based tracking

            const attempts = []
            for (let i = 0; i < 7; i++) {
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Forwarded-For': '192.168.1.100', // Simulate same IP
                    },
                    body: JSON.stringify({
                        email: TEST_USER.email,
                        password: 'WrongPassword' + i,
                    }),
                })
                attempts.push(response.status)
            }

            // After 5 failed attempts, should start getting 429
            const rateLimitCount = attempts.filter(s => s === 429).length
            expect(rateLimitCount).toBeGreaterThan(0)
        })
    })
})

// Export for vitest
export { }
