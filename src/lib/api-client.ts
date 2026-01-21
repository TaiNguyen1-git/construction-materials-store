// API client helper with authentication
export const getAuthHeaders = (): HeadersInit => {
  if (typeof window === 'undefined') return {}

  // Check both sessionStorage and localStorage for token
  let token = sessionStorage.getItem('access_token')
  if (!token) {
    token = localStorage.getItem('access_token')
  }

  if (!token) {
    return {}
  }

  // Get user info to provide x-user-id
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  return {
    'Authorization': `Bearer ${token}`,
    'x-auth-token': token,
    ...(user?.id && { 'x-user-id': user.id })
  }
}

import authService from '@/lib/auth-service'

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  }

  let response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    try {
      // Try to refresh the token
      const newTokens = await authService.refreshTokenPair()

      if (newTokens && newTokens.accessToken) {
        // Retry with new token
        const newHeaders = {
          ...headers,
          'Authorization': `Bearer ${newTokens.accessToken}`,
          'x-auth-token': newTokens.accessToken,
        }

        response = await fetch(url, {
          ...options,
          headers: newHeaders,
        })
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      // If refresh fails, we just return the original 401 response
      // The UI will handle the redirect to login
    }
  }

  return response
}
