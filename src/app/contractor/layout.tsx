'use client'

/**
 * Contractor Shared Layout
 * Centralizes authentication check, Sidebar, and Header management
 */

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import Sidebar from './components/Sidebar'
import ContractorHeader from './components/ContractorHeader'

export default function ContractorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isAuthenticated, isLoading } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    // Public pages that don't need the authenticated layout
    const isPublicPage = pathname === '/contractor' || 
                         pathname === '/contractor/login' || 
                         pathname === '/contractor/register'

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !isPublicPage) {
            router.push('/login')
        }
    }, [isAuthenticated, isLoading, router, isPublicPage])

    if (isPublicPage) {
        return <>{children}</>
    }

    // Show loading state while checking authentication
    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ContractorHeader 
                sidebarOpen={sidebarOpen} 
                setSidebarOpen={setSidebarOpen} 
            />
            <Sidebar 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
            />

            {/* Main Content Area with sidebar offset */}
            <main 
                className={`flex-1 transition-all duration-300 min-h-screen pt-[60px] ${
                    sidebarOpen ? 'lg:ml-64' : 'ml-0'
                }`}
            >
                <div className="p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
