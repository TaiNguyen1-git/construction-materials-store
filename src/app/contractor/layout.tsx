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
    const [isCollapsed, setIsCollapsed] = useState(false)
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
        <div className="min-h-screen bg-[#F0F2F5] flex flex-col selection:bg-primary-100 selection:text-primary-700">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-100/30 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/30 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            <ContractorHeader 
                sidebarOpen={sidebarOpen} 
                setSidebarOpen={setSidebarOpen} 
            />

            <div className="flex relative min-h-screen z-10">
                <Sidebar 
                    isOpen={sidebarOpen} 
                    onClose={() => setSidebarOpen(false)} 
                    onToggle={() => setSidebarOpen(!sidebarOpen)}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                />

                {/* Main Content Area with sidebar offset */}
                <main 
                    className={`flex-1 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-screen ${
                        sidebarOpen ? (isCollapsed ? 'lg:pl-24' : 'lg:pl-72') : 'pl-0'
                    }`}
                >
                    <div className="p-4 lg:p-10 pt-20 lg:pt-24 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="max-w-[1600px] mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
