'use client'

/**
 * AdminRedirect Component
 * Redirects admin/employee users to their dashboard when they visit regular user pages
 * This handles the case when an admin opens a new browser tab while logged in
 */

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

// Pages that admins CAN access without redirect (don't redirect from these)
const ALLOWED_PATHS_FOR_ADMINS = [
    '/admin',       // Admin pages
    '/login',       // Login page
    '/register',    // Register page
    '/api',         // API routes
    '/_next',       // Next.js internals
    '/contractor',  // Contractor portal (separate flow)
    '/supplier',    // Supplier portal
]

export default function AdminRedirect() {
    const pathname = usePathname()
    const router = useRouter()
    const { isLoading, showSessionPrompt, user, isAuthenticated } = useAuth()

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (isLoading) return
        if (showSessionPrompt) return

        const isAllowedPath = ALLOWED_PATHS_FOR_ADMINS.some(
            path => pathname?.startsWith(path)
        )
        if (isAllowedPath) return

        const isGuestMode = sessionStorage.getItem('guest_mode') === 'true'
        if (isGuestMode) return

        if (isAuthenticated && user) {
            if (user.role === 'MANAGER' || user.role === 'EMPLOYEE') {
                router.replace('/admin')
            }
        }
    }, [pathname, router, isLoading, showSessionPrompt, user, isAuthenticated])

    return null
}
