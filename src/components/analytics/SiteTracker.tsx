'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function SiteTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Don't track product pages here because they have their own tracker with productId
    if (pathname.startsWith('/products/')) return
    // Skip auth pages to avoid 401 errors when unauthenticated
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) return

    // Record page view interaction
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interactionType: 'PRODUCT_VIEW',
        query: pathname,
        metadata: { url: pathname, type: 'PAGE_VIEW' }
      })
    }).catch(() => { /* Silently ignore - user may not be authenticated */ })
  }, [pathname])

  return null
}
