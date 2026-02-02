'use client'

/**
 * Project Timeline Page for Contractors
 * View comprehensive timeline of project progress
 */

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Menu, User, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import Sidebar from '../../../components/Sidebar'
import ProjectTimeline from '@/components/ProjectTimeline'
import { useAuth } from '@/contexts/auth-context'

export default function ContractorProjectTimelinePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { user, logout } = useAuth()
    const { id } = use(params)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // No basic useEffect needed as user is handled by useAuth

    const handleLogout = async () => {
        await logout()
        window.location.href = '/contractor'
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                <div className="px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <Link href="/contractor/dashboard" className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                                <div className="hidden sm:block">
                                    <span className="text-xl font-bold text-gray-900">SmartBuild</span>
                                    <span className="text-blue-600 font-semibold ml-1">PRO</span>
                                </div>
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 text-gray-700 px-3 py-2 bg-gray-50 rounded-lg">
                                <User className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-sm">{user?.name}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 hover:text-red-600 rounded-lg"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="lg:ml-64 pt-[73px]">
                <div className="p-6 lg:p-8 max-w-5xl mx-auto">
                    {/* Breadcrumb */}
                    <div className="mb-6">
                        <Link
                            href={`/contractor/projects/${id}`}
                            className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại chi tiết công trình
                        </Link>
                    </div>

                    {/* Title */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-black text-gray-900">Timeline Thực hiện</h1>
                        <p className="text-gray-500">Theo dõi tiến độ chi tiết qua các giai đoạn thi công</p>
                    </div>

                    {/* Timeline Component */}
                    <ProjectTimeline projectId={id} showExportButton={true} />
                </div>
            </main>
        </div>
    )
}
