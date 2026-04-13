// API client helper with authentication
export const getAuthHeaders = (): HeadersInit => {
  if (typeof window === 'undefined') return {}

  // 🛡️ SECURITY: Only send headers if auth is explicitly active
  // This prevents "Zombie Sessions" where old tokens in localStorage are sent after logout
  if (localStorage.getItem('auth_active') !== 'true') {
    return {}
  }

  // Check both sessionStorage and localStorage for token
  let token = sessionStorage.getItem('access_token')
  if (!token) {
    token = localStorage.getItem('access_token')
  }

  if (!token || token === 'null' || token === 'undefined') {
    return {}
  }

  // Get user info to provide x-user-id
  let user = null
  try {
    const userStr = localStorage.getItem('user')
    user = userStr ? JSON.parse(userStr) : null
  } catch (e) {
    console.warn('Failed to parse user from localStorage')
  }

  return {
    'Authorization': `Bearer ${token}`,
    'x-auth-token': token,
    ...(user?.id && { 'x-user-id': user.id })
  }
}

import authService from '@/lib/auth-service'

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  })

  let response = await fetch(url, {
    ...options,
    headers: getHeaders(),
    credentials: 'include', // 🔐 Essential for cookie-based auth
  })

  if (response.status === 401) {
    try {
      // Try to refresh the token
      const refreshed = await authService.refreshToken()

      if (refreshed) {
        // Token was refreshed, retry the request with NEW headers
        response = await fetch(url, {
          ...options,
          headers: getHeaders(),
          credentials: 'include', // 🔐 Essential for cookie-based auth
        })
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
    }
  }

  return response
}
