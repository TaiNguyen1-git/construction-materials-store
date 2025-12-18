'use client'

import { useEffect } from 'react'
import { disableConsoleInProduction } from '@/lib/disable-console'

/**
 * Component that disables console.log in production
 * Must be rendered on the client side
 */
export default function ConsoleGuard() {
    useEffect(() => {
        disableConsoleInProduction()
    }, [])

    return null
}
