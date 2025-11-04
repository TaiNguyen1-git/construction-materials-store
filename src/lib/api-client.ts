// API client helper with authentication
export const getAuthHeaders = (): HeadersInit => {
  if (typeof window === 'undefined') return {}
  
  const token = localStorage.getItem('access_token')
  if (!token) return {}
  
  return {
    'Authorization': `Bearer ${token}`,
  }
}

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}
