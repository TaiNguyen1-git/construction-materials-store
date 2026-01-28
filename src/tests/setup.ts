/**
 * Vitest Setup File
 * 
 * This file runs before all tests and sets up the test environment.
 */

import { vi } from 'vitest'

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only'
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-testing-only'
// NODE_ENV is read-only, don't reassign it

// Mock BroadcastChannel for Node.js environment (not available in Node)
if (typeof globalThis.BroadcastChannel === 'undefined') {
    class MockBroadcastChannel {
        name: string
        onmessage: ((event: MessageEvent) => void) | null = null

        constructor(name: string) {
            this.name = name
        }

        postMessage(_data: unknown) {
            // No-op in test environment
        }

        addEventListener(_type: string, _listener: EventListenerOrEventListenerObject | null) {
            // No-op in test environment
        }

        removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject | null) {
            // No-op in test environment
        }

        close() {
            // No-op in test environment
        }
    }

    globalThis.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel
}

// Suppress console.log in tests unless explicitly needed
// Uncomment the following to silence console during tests:
// vi.spyOn(console, 'log').mockImplementation(() => {})
// vi.spyOn(console, 'warn').mockImplementation(() => {})

export { }
