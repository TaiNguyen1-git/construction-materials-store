'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function SiteTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Don't track product pages here because they have their own tracker with productId
    if (pathname.startsWith('/products/')) return

    // Record page view interaction
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interactionType: 'PRODUCT_VIEW', // Using PRODUCT_VIEW with null productId as generic view
        query: pathname,
        metadata: {
          url: pathname + (searchParams.toString() ? '?' + searchParams.toString() : ''),
          type: 'PAGE_VIEW'
        }
      })
    }).catch(err => console.error('Failed to track page view', err))
  }, [pathname, searchParams])

  return null
}
