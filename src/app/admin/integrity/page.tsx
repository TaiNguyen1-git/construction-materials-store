'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface IntegrityStats {
    overview: {
        pendingKYC: number
        openAlerts: number
        activeRestrictions: number
        recentAuditLogs: number
    }
    alertsBySeverity: Record<string, number>
    restrictionsByType: Record<string, number>
}

interface SuspiciousActivity {
    id: string
    activityType: string
    description: string
    severity: string
    status: string
    createdAt: string
    riskScore: number
    customerId?: string
}

interface KYCDocument {
    id: string
    documentType: string
    status: string
    createdAt: string
    customer?: {
        companyName?: string
        user?: { name: string; email: string }
        contractorProfile?: { displayName: string }
    }
}

interface UserRestriction {
    id: string
    type: string
    reason: string
    isActive: boolean
    startDate: string
    endDate?: string
    appealStatus: string
    customerId: string
}

export default function IntegrityDashboard() {
    const [stats, setStats] = useState<IntegrityStats | null>(null)
    const [alerts, setAlerts] = useState<SuspiciousActivity[]>([])
    const [kycQueue, setKycQueue] = useState<KYCDocument[]>([])
    const [restrictions, setRestrictions] = useState<UserRestriction[]>([])
    const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'kyc' | 'restrictions'>('overview')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [activeTab])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'overview') {
                const res = await fetch('/api/admin/integrity?view=dashboard')
                const data = await res.json()
                if (data.success) setStats(data.data)
            } else if (activeTab === 'alerts') {
                const res = await fetch('/api/admin/integrity/alerts')
                const data = await res.json()
                if (data.success) setAlerts(data.data.alerts)
            } else if (activeTab === 'kyc') {
                const res = await fetch('/api/admin/integrity?view=kyc-queue')
                const data = await res.json()
                if (data.success) setKycQueue(data.data.documents)
            } else if (activeTab === 'restrictions') {
                const res = await fetch('/api/admin/integrity/restrictions')
                const data = await res.json()
                if (data.success) setRestrictions(data.data.restrictions)
            }
        } catch (error) {
            console.error('Failed to fetch integrity data:', error)
        }
        setLoading(false)
    }

    const handleKYCAction = async (docId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
        try {
            const res = await fetch('/api/admin/integrity/kyc', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: docId, action, rejectionReason: reason })
            })
            if (res.ok) {
                fetchData()
            }
        } catch (error) {
            console.error('KYC action failed:', error)
        }
    }

    const handleResolveAlert = async (alertId: string, action: string, resolution?: string) => {
        try {
            const res = await fetch('/api/admin/integrity/alerts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alertId, action, resolution })
            })
            if (res.ok) {
                fetchData()
            }
        } catch (error) {
            console.error('Resolve alert failed:', error)
        }
    }

    const severityColors: Record<string, string> = {
        LOW: 'bg-blue-100 text-blue-700',
        MEDIUM: 'bg-yellow-100 text-yellow-700',
        HIGH: 'bg-orange-100 text-orange-700',
        CRITICAL: 'bg-red-100 text-red-700'
    }

    const restrictionTypeLabels: Record<string, string> = {
        FULL_BAN: '🚫 Cấm hoàn toàn',
        MARKETPLACE_BAN: '🏪 Cấm Marketplace',
        WALLET_HOLD: '💰 Giữ ví',
        CREDIT_FREEZE: '❄️ Đóng băng tín dụng',
        REVIEW_BAN: '⭐ Cấm đánh giá',
        BIDDING_BAN: '📋 Cấm đấu thầu',
        PROBATION: '👁️ Thử thách'
    }

    const activityTypeLabels: Record<string, string> = {
        MULTI_ACCOUNT: '👥 Nhiều tài khoản',
        COLLUSION_BIDDING: '🤝 Thông đồng đấu thầu',
        FAKE_REVIEWS: '⭐ Đánh giá ảo',
        RAPID_WITHDRAWALS: '💸 Rút tiền bất thường',
        UNUSUAL_TRANSACTION: '💳 Giao dịch lạ',
        PRICE_MANIPULATION: '📈 Thao túng giá',
        IDENTITY_MISMATCH: '🆔 Thông tin không khớp',
        PAYMENT_FRAUD: '🔒 Gian lận thanh toán'
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                🛡️ Integrity Suite
                            </h1>
                            <p className="text-sm text-gray-500">Hệ thống Giám sát & Minh bạch</p>
                        </div>
                        <Link href="/admin" className="text-blue-600 hover:underline text-sm">
                            ← Quay lại Admin
                        </Link>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex gap-1">
                        {[
                            { id: 'overview', label: '📊 Tổng quan', count: null },
                            { id: 'alerts', label: '🚨 Cảnh báo', count: stats?.overview.openAlerts },
                            { id: 'kyc', label: '📋 Duyệt KYC', count: stats?.overview.pendingKYC },
                            { id: 'restrictions', label: '⛔ Hạn chế', count: stats?.overview.activeRestrictions }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.label}
                                {(tab.count ?? 0) > 0 && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Overview Tab */}
                        {activeTab === 'overview' && stats && (
                            <div className="space-y-6">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <div className="text-3xl font-bold text-orange-600">{stats.overview.pendingKYC}</div>
                                        <div className="text-sm text-gray-500 mt-1">KYC chờ duyệt</div>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <div className="text-3xl font-bold text-red-600">{stats.overview.openAlerts}</div>
                                        <div className="text-sm text-gray-500 mt-1">Cảnh báo mở</div>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <div className="text-3xl font-bold text-purple-600">{stats.overview.activeRestrictions}</div>
                                        <div className="text-sm text-gray-500 mt-1">Hạn chế đang có hiệu lực</div>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <div className="text-3xl font-bold text-blue-600">{stats.overview.recentAuditLogs}</div>
                                        <div className="text-sm text-gray-500 mt-1">Audit logs (24h)</div>
                                    </div>
                                </div>

                                {/* Alerts by Severity */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-semibold mb-4">Cảnh báo theo mức độ nghiêm trọng</h3>
                                    <div className="flex gap-4">
                                        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(severity => (
                                            <div key={severity} className="flex-1 text-center">
                                                <div className={`text-2xl font-bold ${severity === 'CRITICAL' ? 'text-red-600' :
                                                    severity === 'HIGH' ? 'text-orange-600' :
                                                        severity === 'MEDIUM' ? 'text-yellow-600' : 'text-blue-600'
                                                    }`}>
                                                    {stats.alertsBySeverity[severity] || 0}
                                                </div>
                                                <div className="text-xs text-gray-500 uppercase">{severity}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Restrictions by Type */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-semibold mb-4">Hạn chế theo loại</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {Object.entries(restrictionTypeLabels).map(([type, label]) => (
                                            <div key={type} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="text-xl font-bold">
                                                    {stats.restrictionsByType[type] || 0}
                                                </div>
                                                <div className="text-xs text-gray-600">{label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Alerts Tab */}
                        {activeTab === 'alerts' && (
                            <div className="space-y-4">
                                {alerts.length === 0 ? (
                                    <div className="text-center py-20 text-gray-500">
                                        ✅ Không có cảnh báo nào đang mở
                                    </div>
                                ) : (
                                    alerts.map(alert => (
                                        <div key={alert.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded ${severityColors[alert.severity]}`}>
                                                            {alert.severity}
                                                        </span>
                                                        <span className="text-sm font-medium">
                                                            {activityTypeLabels[alert.activityType] || alert.activityType}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            Risk: {alert.riskScore}%
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700">{alert.description}</p>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {new Date(alert.createdAt).toLocaleString('vi-VN')}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleResolveAlert(alert.id, 'RESOLVE', 'Đã xử lý')}
                                                        className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                                    >
                                                        ✓ Xử lý
                                                    </button>
                                                    <button
                                                        onClick={() => handleResolveAlert(alert.id, 'FALSE_POSITIVE')}
                                                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                                    >
                                                        ✗ Nhầm
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* KYC Tab */}
                        {activeTab === 'kyc' && (
                            <div className="space-y-4">
                                {kycQueue.length === 0 ? (
                                    <div className="text-center py-20 text-gray-500">
                                        ✅ Không có hồ sơ KYC nào đang chờ
                                    </div>
                                ) : (
                                    kycQueue.map(doc => (
                                        <div key={doc.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="font-medium text-lg">
                                                        {doc.customer?.contractorProfile?.displayName ||
                                                            doc.customer?.companyName ||
                                                            doc.customer?.user?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {doc.customer?.user?.email}
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                                            {doc.documentType}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleKYCAction(doc.id, 'APPROVE')}
                                                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                    >
                                                        ✓ Duyệt
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const reason = prompt('Lý do từ chối:')
                                                            if (reason) handleKYCAction(doc.id, 'REJECT', reason)
                                                        }}
                                                        className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                                    >
                                                        ✗ Từ chối
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Restrictions Tab */}
                        {activeTab === 'restrictions' && (
                            <div className="space-y-4">
                                {restrictions.length === 0 ? (
                                    <div className="text-center py-20 text-gray-500">
                                        ✅ Không có hạn chế nào đang có hiệu lực
                                    </div>
                                ) : (
                                    restrictions.map(restriction => (
                                        <div key={restriction.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-lg">
                                                            {restrictionTypeLabels[restriction.type] || restriction.type}
                                                        </span>
                                                        {restriction.appealStatus === 'PENDING' && (
                                                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                                                                Có kháng cáo
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600">{restriction.reason}</p>
                                                    <div className="mt-2 text-xs text-gray-400">
                                                        Từ {new Date(restriction.startDate).toLocaleDateString('vi-VN')}
                                                        {restriction.endDate ? ` đến ${new Date(restriction.endDate).toLocaleDateString('vi-VN')}` : ' (Vĩnh viễn)'}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        const reason = prompt('Lý do gỡ hạn chế:')
                                                        if (reason) {
                                                            await fetch('/api/admin/integrity/restrictions', {
                                                                method: 'PATCH',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    restrictionId: restriction.id,
                                                                    action: 'LIFT',
                                                                    reason
                                                                })
                                                            })
                                                            fetchData()
                                                        }
                                                    }}
                                                    className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                                                >
                                                    Gỡ bỏ
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
