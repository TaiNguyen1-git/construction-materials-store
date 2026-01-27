'use client'

/**
 * AdminRedirect Component
 * Redirects admin/employee users to their dashboard when they visit regular user pages
 * This handles the case when an admin opens a new browser tab while logged in
 */

import { useEffect, useState } from 'react'
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
    const [hasChecked, setHasChecked] = useState(false)

    useEffect(() => {
        // Only run on client and only once per navigation
        if (typeof window === 'undefined' || hasChecked) {
            return
        }

        // Wait for auth context to finish loading
        if (isLoading) {
            return
        }

        // If session prompt is showing, don't redirect - let user choose
        if (showSessionPrompt) {
            setHasChecked(true)
            return
        }

        // Check if current path is allowed for admins (no redirect needed)
        const isAllowedPath = ALLOWED_PATHS_FOR_ADMINS.some(
            path => pathname?.startsWith(path)
        )

        if (isAllowedPath) {
            setHasChecked(true)
            return
        }

        // Check if this tab is in guest mode (user chose to browse as guest)
        const isGuestMode = sessionStorage.getItem('guest_mode') === 'true'
        if (isGuestMode) {
            setHasChecked(true)
            return
        }

        // Only redirect if user is authenticated via context (not just localStorage)
        if (isAuthenticated && user) {
            // Check if user is MANAGER or EMPLOYEE role
            if (user.role === 'MANAGER' || user.role === 'EMPLOYEE') {
                // Use replace to avoid adding to browser history
                router.replace('/admin')
                return
            }
        }

        setHasChecked(true)
    }, [pathname, router, hasChecked, isLoading, showSessionPrompt, user, isAuthenticated])

    // Reset check when pathname changes
    useEffect(() => {
        setHasChecked(false)
    }, [pathname])

    // Don't show anything, just handle redirect silently
    return null
}

