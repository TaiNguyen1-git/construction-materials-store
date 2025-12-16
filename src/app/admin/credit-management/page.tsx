'use client'

/**
 * Credit Management Page - SME Feature 1
 * Trang quản lý công nợ và kiểm soát tín dụng
 */

import { useState, useEffect } from 'react'
import {
    CreditCard,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    Users,
    TrendingUp,
    Search,
    Filter,
    RefreshCw
} from 'lucide-react'

interface DebtAgingReport {
    customerId: string
    customerName: string
    customerType: string
    totalDebt: number
    current: number
    days1to30: number
    days31to60: number
    days61to90: number
    over90: number
    creditLimit: number
    creditHold: boolean
}

interface CreditApproval {
    id: string
    customerId: string
    customer: {
        user: { name: string }
    }
    requestedAmount: number
    currentDebt: number
    creditLimit: number
    reason: string
    status: string
    createdAt: string
}

export default function CreditManagementPage() {
    const [activeTab, setActiveTab] = useState<'aging' | 'approvals' | 'config'>('aging')
    const [agingReport, setAgingReport] = useState<DebtAgingReport[]>([])
    const [pendingApprovals, setPendingApprovals] = useState<CreditApproval[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        loadData()
    }, [activeTab])

    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'aging') {
                const res = await fetch('/api/credit?type=aging-report')
                const data = await res.json()
                setAgingReport(data)
            } else if (activeTab === 'approvals') {
                const res = await fetch('/api/credit?type=pending-approvals')
                const data = await res.json()
                setPendingApprovals(data)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        }
        setLoading(false)
    }

    const handleApproval = async (approvalId: string, approved: boolean) => {
        try {
            await fetch('/api/credit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'process-approval',
                    approvalId,
                    approved,
                    approvedBy: 'admin' // TODO: Get from session
                })
            })
            loadData()
        } catch (error) {
            console.error('Error processing approval:', error)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    // Calculate summary stats
    const totalDebt = agingReport.reduce((sum, r) => sum + r.totalDebt, 0)
    const overdueDebt = agingReport.reduce((sum, r) => sum + r.days1to30 + r.days31to60 + r.days61to90 + r.over90, 0)
    const criticalDebt = agingReport.reduce((sum, r) => sum + r.over90, 0)
    const holdCount = agingReport.filter(r => r.creditHold).length

    const filteredReport = agingReport.filter(r =>
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Công nợ</h1>
                    <p className="text-gray-500">Kiểm soát tín dụng và theo dõi tuổi nợ khách hàng</p>
                </div>
                <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <RefreshCw className="w-4 h-4" />
                    Làm mới
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tổng công nợ</p>
                            <p className="text-xl font-bold">{formatCurrency(totalDebt)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Nợ quá hạn</p>
                            <p className="text-xl font-bold">{formatCurrency(overdueDebt)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Nợ xấu (90+ ngày)</p>
                            <p className="text-xl font-bold text-red-600">{formatCurrency(criticalDebt)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Users className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Đang khóa TN</p>
                            <p className="text-xl font-bold">{holdCount} khách hàng</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b">
                <nav className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('aging')}
                        className={`pb-3 px-1 border-b-2 font-medium ${activeTab === 'aging'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Báo cáo Tuổi nợ
                    </button>
                    <button
                        onClick={() => setActiveTab('approvals')}
                        className={`pb-3 px-1 border-b-2 font-medium flex items-center gap-2 ${activeTab === 'approvals'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Chờ duyệt
                        {pendingApprovals.length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {pendingApprovals.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`pb-3 px-1 border-b-2 font-medium ${activeTab === 'config'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Cấu hình
                    </button>
                </nav>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    {/* Aging Report Tab */}
                    {activeTab === 'aging' && (
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            {/* Search */}
                            <div className="p-4 border-b">
                                <div className="flex gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm khách hàng..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Trong hạn</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">1-30 ngày</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">31-60 ngày</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">61-90 ngày</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase text-red-600">90+ ngày</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng nợ</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredReport.map((row) => (
                                            <tr key={row.customerId} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium">{row.customerName}</p>
                                                        <p className="text-sm text-gray-500">{row.customerType}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-green-600">{formatCurrency(row.current)}</td>
                                                <td className="px-4 py-3 text-right text-yellow-600">{formatCurrency(row.days1to30)}</td>
                                                <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(row.days31to60)}</td>
                                                <td className="px-4 py-3 text-right text-red-500">{formatCurrency(row.days61to90)}</td>
                                                <td className="px-4 py-3 text-right text-red-700 font-bold">{formatCurrency(row.over90)}</td>
                                                <td className="px-4 py-3 text-right font-bold">{formatCurrency(row.totalDebt)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {row.creditHold ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                                            <XCircle className="w-3 h-3" />
                                                            Đã khóa
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Bình thường
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredReport.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    Không có dữ liệu công nợ
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pending Approvals Tab */}
                    {activeTab === 'approvals' && (
                        <div className="space-y-4">
                            {pendingApprovals.length === 0 ? (
                                <div className="bg-white rounded-xl p-12 text-center text-gray-500 border">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                                    <p>Không có yêu cầu nào đang chờ duyệt</p>
                                </div>
                            ) : (
                                pendingApprovals.map((approval) => (
                                    <div key={approval.id} className="bg-white rounded-xl p-6 shadow-sm border">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg">{approval.customer.user.name}</h3>
                                                <p className="text-gray-500 mt-1">{approval.reason}</p>
                                                <div className="mt-3 flex gap-4 text-sm">
                                                    <span>Yêu cầu: <strong>{formatCurrency(approval.requestedAmount)}</strong></span>
                                                    <span>Nợ hiện tại: <strong>{formatCurrency(approval.currentDebt)}</strong></span>
                                                    <span>Hạn mức: <strong>{formatCurrency(approval.creditLimit)}</strong></span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(approval.createdAt).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApproval(approval.id, true)}
                                                    className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Duyệt
                                                </button>
                                                <button
                                                    onClick={() => handleApproval(approval.id, false)}
                                                    className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Từ chối
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Config Tab */}
                    {activeTab === 'config' && (
                        <div className="bg-white rounded-xl p-6 shadow-sm border">
                            <h3 className="font-semibold mb-4">Cấu hình luật công nợ</h3>
                            <p className="text-gray-500">Tính năng đang phát triển...</p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
