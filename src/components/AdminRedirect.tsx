'use client'

/**
 * AdminRedirect Component
 * Redirects admin/employee users to their dashboard when they visit regular user pages
 * This handles the case when an admin opens a new browser tab while logged in
 */

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

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
    const [hasChecked, setHasChecked] = useState(false)

    useEffect(() => {
        // Only run on client and only once per navigation
        if (typeof window === 'undefined' || hasChecked) {
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

        // Check if user is an admin/employee
        try {
            const userData = localStorage.getItem('user') || sessionStorage.getItem('user')
            if (!userData) {
                setHasChecked(true)
                return
            }

            const user = JSON.parse(userData)

            // Check if user is MANAGER or EMPLOYEE role
            if (user.role === 'MANAGER' || user.role === 'EMPLOYEE') {
                // Use replace to avoid adding to browser history
                router.replace('/admin')
                return
            }
        } catch {
            // Silent fail - don't expose errors in production
        }

        setHasChecked(true)
    }, [pathname, router, hasChecked])

    // Reset check when pathname changes
    useEffect(() => {
        setHasChecked(false)
    }, [pathname])

    // Don't show anything, just handle redirect silently
    return null
}
