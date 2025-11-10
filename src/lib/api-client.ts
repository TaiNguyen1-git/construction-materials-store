// API client helper with authentication
export const getAuthHeaders = (): HeadersInit => {
  if (typeof window === 'undefined') return {}
  
  // Check both sessionStorage and localStorage for token
  let token = sessionStorage.getItem('access_token')
  if (!token) {
    token = localStorage.getItem('access_token')
  }
  
  if (!token) {
    console.warn('[API Client] No access token found in storage')
    return {}
  }
  
  console.log('[API Client] Using token:', token.substring(0, 20) + '...')
  return {
    'Authorization': `Bearer ${token}`,
    'x-auth-token': token,
  }
}

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}
