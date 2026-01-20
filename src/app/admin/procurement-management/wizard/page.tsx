'use client'

/**
 * Smart Procurement Wizard Page
 * Admin page for AI-powered reorder recommendations
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import ReorderWizard from '@/components/ReorderWizard'

export default function ProcurementWizardPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link
                        href="/admin/procurement-management"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại Quản lý Mua hàng
                    </Link>
                </div>

                {/* Main Content */}
                <Suspense fallback={
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Sparkles className="w-10 h-10 text-blue-600 mx-auto mb-4 animate-pulse" />
                            <p className="text-gray-500 font-medium">Đang khởi tạo trợ lý...</p>
                        </div>
                    </div>
                }>
                    <ReorderWizard />
                </Suspense>
            </div>
        </div>
    )
}
