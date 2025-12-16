'use client'

/**
 * ContractorRedirect Component
 * Redirects contractors to their dedicated portal when they visit regular user pages
 */

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

// Pages that contractors CAN access (don't redirect from these)
const ALLOWED_PATHS_FOR_CONTRACTORS = [
    '/contractor',
    '/login',
    '/register',
    '/api',
    '/_next',
]

export default function ContractorRedirect() {
    const pathname = usePathname()
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') {
            setIsChecking(false)
            return
        }

        // Check if current path is allowed for contractors
        const isAllowedPath = ALLOWED_PATHS_FOR_CONTRACTORS.some(
            path => pathname?.startsWith(path)
        )

        if (isAllowedPath) {
            setIsChecking(false)
            return
        }

        // Check if user is a contractor
        try {
            const userData = localStorage.getItem('user')
            if (!userData) {
                setIsChecking(false)
                return
            }

            const user = JSON.parse(userData)

            // Check if user is a contractor (has contractorVerified flag set)
            // Contractors have this field from registration/seed
            if (user.contractorVerified === true || user.contractorVerified === false) {
                console.log('[ContractorRedirect] Contractor detected on user page, redirecting to portal')
                router.replace('/contractor/dashboard')
                return
            }
        } catch (error) {
            console.error('[ContractorRedirect] Error checking contractor status:', error)
        }

        setIsChecking(false)
    }, [pathname, router])

    // Don't show anything, just handle redirect silently
    return null
}
