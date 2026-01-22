/**
 * Authentication Redirect Helper
 * 
 * Handles post-login redirects with callbackUrl support and role validation.
 */

export interface User {
    id: string
    email: string
    name: string
    role: 'MANAGER' | 'EMPLOYEE' | 'CUSTOMER' | 'CONTRACTOR'
}

/**
 * Get default redirect path based on user role
 */
export function getDefaultRedirectPath(role: string): string {
    switch (role) {
        case 'MANAGER':
        case 'EMPLOYEE':
            return '/admin'
        case 'CONTRACTOR':
            return '/contractor/dashboard'
        case 'CUSTOMER':
        default:
            return '/'
    }
}

/**
 * Validate if a callback URL is compatible with user role
 */
export function isValidCallbackForRole(callbackUrl: string, role: string): boolean {
    // Must be a local path
    if (!callbackUrl.startsWith('/')) {
        return false
    }

    // Check role-path compatibility
    if (callbackUrl.startsWith('/contractor')) {
        return role === 'CONTRACTOR'
    }

    if (callbackUrl.startsWith('/admin')) {
        return role === 'MANAGER' || role === 'EMPLOYEE'
    }

    if (callbackUrl.startsWith('/supplier')) {
        // Supplier pages use a different auth system
        return false
    }

    if (callbackUrl.startsWith('/account')) {
        // Account pages accessible to all logged-in users
        return true
    }

    // Other paths (home, products, etc.) accessible to all
    return true
}

/**
 * Get the redirect URL after login
 * 
 * @param user - The logged-in user
 * @param currentUrl - Current window.location.search or full URL
 * @returns The URL to redirect to
 */
export function getPostLoginRedirectUrl(user: User, currentUrl?: string): string {
    // Try to get callbackUrl from URL params
    let callbackUrl: string | null = null

    if (currentUrl) {
        try {
            const searchParams = currentUrl.includes('?')
                ? new URLSearchParams(currentUrl.split('?')[1])
                : new URLSearchParams(currentUrl)
            callbackUrl = searchParams.get('callbackUrl')
        } catch {
            // Ignore parsing errors
        }
    } else if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        callbackUrl = urlParams.get('callbackUrl')
    }

    // Validate and use callback URL if valid
    if (callbackUrl && isValidCallbackForRole(callbackUrl, user.role)) {
        console.log(`[AUTH REDIRECT] Using callbackUrl: ${callbackUrl}`)
        return callbackUrl
    }

    // Fall back to role-based default
    const defaultPath = getDefaultRedirectPath(user.role)
    console.log(`[AUTH REDIRECT] No valid callback, using default for role ${user.role}: ${defaultPath}`)
    return defaultPath
}

/**
 * Perform post-login redirect with callback support
 * 
 * @param user - The logged-in user
 */
export function performPostLoginRedirect(user: User): void {
    const redirectUrl = getPostLoginRedirectUrl(user)
    console.log(`[AUTH REDIRECT] Redirecting ${user.role} to:`, redirectUrl)
    window.location.href = redirectUrl
}
