'use client'

/**
 * Procurement Management Page - SME Feature 2
 * Trang quản lý nhập hàng thông minh
 */

import { useState, useEffect } from 'react'
import {
    Package,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Truck,
    ShoppingCart,
    RefreshCw,
    Plus,
    ArrowRight
} from 'lucide-react'

interface PurchaseSuggestion {
    productId: string
    productName: string
    productSku: string
    categoryName: string
    currentStock: number
    reorderPoint: number
    suggestedQty: number
    avgDailySales: number
    daysUntilStockout: number
    priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
    bestSupplier?: {
        id: string
        name: string
        unitPrice: number
        leadTimeDays: number
    }
    estimatedCost: number
}

interface PurchaseRequest {
    id: string
    requestNumber: string
    productId: string
    productName?: string
    productSku?: string
    supplierId?: string
    supplierName?: string
    requestedQty: number
    currentStock: number
    estimatedCost?: number
    source: string
    status: string
    priority: string
    createdAt: string
}

export default function ProcurementManagementPage() {
    const [activeTab, setActiveTab] = useState<'suggestions' | 'requests'>('suggestions')
    const [suggestions, setSuggestions] = useState<PurchaseSuggestion[]>([])
    const [requests, setRequests] = useState<PurchaseRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [suppliers, setSuppliers] = useState<{ id: string, name: string }[]>([])
    const [selectedItems, setSelectedItems] = useState<string[]>([])

    useEffect(() => {
        loadData()
    }, [activeTab])

    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'suggestions') {
                const res = await fetch('/api/procurement?type=suggestions')
                const data = await res.json()
                setSuggestions(data)
            } else {
                const res = await fetch('/api/procurement?type=requests')
                const data = await res.json()
                setRequests(data)
            }

            // Always load suppliers for assignment
            try {
                const sRes = await fetch('/api/suppliers?limit=100')
                const sData = await sRes.json()
                // API returns { data: [], pagination: {} }
                if (sData.data && Array.isArray(sData.data)) {
                    setSuppliers(sData.data)
                }
            } catch (err) {
                console.error('Failed to fetch suppliers', err)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        }
        setLoading(false)
    }

    const handleAssignSupplier = async (requestId: string, supplierId: string) => {
        try {
            await fetch('/api/procurement', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'assign-supplier',
                    requestId,
                    supplierId
                })
            })
            loadData()
        } catch (error) {
            console.error('Error assigning supplier:', error)
        }
    }


    const handleCreateRequest = async (suggestion: PurchaseSuggestion) => {
        try {
            await fetch('/api/procurement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create-request',
                    productId: suggestion.productId,
                    requestedQty: suggestion.suggestedQty,
                    supplierId: suggestion.bestSupplier?.id
                })
            })
            loadData()
            alert('Đã tạo yêu cầu nhập hàng!')
        } catch (error) {
            console.error('Error creating request:', error)
        }
    }

    const handleApproveRequest = async (requestId: string) => {
        try {
            await fetch('/api/procurement', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'approve',
                    requestId,
                    approvedBy: 'admin'
                })
            })
            loadData()
        } catch (error) {
            console.error('Error approving request:', error)
        }
    }

    const handleAutoGenerate = async () => {
        try {
            const res = await fetch('/api/procurement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'auto-generate' })
            })
            const data = await res.json()
            alert(data.message)
            loadData()
        } catch (error) {
            console.error('Error auto-generating:', error)
        }
    }

    const handleConvertToPO = async (requestId: string) => {
        try {
            const res = await fetch('/api/procurement', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'convert-to-po',
                    requestId,
                    approvedBy: 'admin'
                })
            })
            const data = await res.json()
            if (data.error) {
                alert(data.error)
            } else {
                alert(`Đã tạo Đơn đặt hàng: ${data.orderNumber}`)
                loadData()
            }
        } catch (error) {
            console.error('Error converting to PO:', error)
            alert('Lỗi khi tạo đơn đặt hàng')
        }
    }

    const formatCurrency = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null) return '-'
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-100 text-red-700'
            case 'HIGH': return 'bg-orange-100 text-orange-700'
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-700'
            case 'LOW': return 'bg-green-100 text-green-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'Khẩn cấp'
            case 'HIGH': return 'Cao'
            case 'MEDIUM': return 'Trung bình'
            case 'LOW': return 'Thấp'
            default: return priority
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-700'
            case 'APPROVED': return 'bg-green-100 text-green-700'
            case 'REJECTED': return 'bg-red-100 text-red-700'
            case 'CONVERTED': return 'bg-blue-100 text-blue-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Chờ duyệt'
            case 'APPROVED': return 'Đã duyệt'
            case 'REJECTED': return 'Từ chối'
            case 'CONVERTED': return 'Đã đặt hàng'
            default: return status
        }
    }

    // Stats
    const urgentCount = suggestions.filter(s => s.priority === 'URGENT').length
    const highCount = suggestions.filter(s => s.priority === 'HIGH').length
    const totalEstimatedCost = suggestions.reduce((sum, s) => sum + s.estimatedCost, 0)
    const pendingRequests = requests.filter(r => r.status === 'PENDING').length

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nhập hàng Thông minh</h1>
                    <p className="text-gray-500">Gợi ý và quản lý yêu cầu nhập hàng tự động</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleAutoGenerate}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <Plus className="w-4 h-4" />
                        Tự động tạo yêu cầu
                    </button>
                    <button
                        onClick={loadData}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Cần nhập gấp</p>
                            <p className="text-xl font-bold text-red-600">{urgentCount} sản phẩm</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ưu tiên cao</p>
                            <p className="text-xl font-bold text-orange-600">{highCount} sản phẩm</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <ShoppingCart className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Chi phí dự kiến</p>
                            <p className="text-xl font-bold">{formatCurrency(totalEstimatedCost)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Truck className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Chờ duyệt</p>
                            <p className="text-xl font-bold">{pendingRequests} yêu cầu</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b">
                <nav className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('suggestions')}
                        className={`pb-3 px-1 border-b-2 font-medium ${activeTab === 'suggestions'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Gợi ý nhập hàng
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`pb-3 px-1 border-b-2 font-medium flex items-center gap-2 ${activeTab === 'requests'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Yêu cầu nhập hàng
                        {pendingRequests > 0 && (
                            <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {pendingRequests}
                            </span>
                        )}
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
                    {/* Suggestions Tab */}
                    {activeTab === 'suggestions' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {suggestions.length === 0 ? (
                                <div className="col-span-full bg-white rounded-xl p-12 text-center text-gray-500 border">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                                    <p>Tất cả sản phẩm đều đủ hàng!</p>
                                </div>
                            ) : (
                                suggestions.map((suggestion) => (
                                    <div key={suggestion.productId} className="bg-white rounded-xl p-4 shadow-sm border">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                                                    {suggestion.priority}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-500">{suggestion.categoryName}</span>
                                        </div>

                                        <h3 className="font-semibold mb-1">{suggestion.productName}</h3>
                                        <p className="text-sm text-gray-500 mb-3">SKU: {suggestion.productSku}</p>

                                        <div className="space-y-2 text-sm mb-4">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Tồn kho:</span>
                                                <span className={suggestion.currentStock <= 0 ? 'text-red-600 font-bold' : ''}>
                                                    {suggestion.currentStock}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Điểm đặt hàng:</span>
                                                <span>{suggestion.reorderPoint}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Bán TB/ngày:</span>
                                                <span>{suggestion.avgDailySales.toFixed(1)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Hết hàng sau:</span>
                                                <span className={suggestion.daysUntilStockout <= 7 ? 'text-red-600' : ''}>
                                                    {suggestion.daysUntilStockout} ngày
                                                </span>
                                            </div>
                                        </div>

                                        <div className="border-t pt-3 mb-3">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-500">Đề xuất nhập:</span>
                                                <span className="font-bold text-blue-600">{suggestion.suggestedQty}</span>
                                            </div>
                                            {suggestion.bestSupplier && (
                                                <div className="text-sm text-gray-500">
                                                    NCC: {suggestion.bestSupplier.name} ({suggestion.bestSupplier.leadTimeDays} ngày)
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm mt-2">
                                                <span className="text-gray-500">Chi phí:</span>
                                                <span className="font-bold">{formatCurrency(suggestion.estimatedCost)}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleCreateRequest(suggestion)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Tạo yêu cầu nhập
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Requests Tab */}
                    {activeTab === 'requests' && (
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã yêu cầu</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NCC</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Chi phí</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nguồn</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ưu tiên</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {requests.map((request) => (
                                            <tr key={request.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium">{request.requestNumber}</td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p>{request.productName || 'N/A'}</p>
                                                        <p className="text-sm text-gray-500">{request.productSku}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 min-w-[150px]">
                                                    {request.supplierName ? (
                                                        request.supplierName
                                                    ) : (
                                                        <select
                                                            className="text-xs border rounded px-1 py-0.5 w-full"
                                                            onChange={(e) => handleAssignSupplier(request.id, e.target.value)}
                                                            value=""
                                                        >
                                                            <option value="" disabled>Chọn NCC...</option>
                                                            {suppliers.map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">{request.requestedQty}</td>
                                                <td className="px-4 py-3 text-right">
                                                    {request.estimatedCost ? formatCurrency(request.estimatedCost) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${request.source === 'SYSTEM' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {request.source === 'SYSTEM' ? 'Tự động' : 'Thủ công'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(request.priority)}`}>
                                                        {getPriorityLabel(request.priority)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                                                        {getStatusLabel(request.status)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {request.status === 'PENDING' && (
                                                        <div className="flex gap-1 justify-center">
                                                            <button
                                                                onClick={() => handleApproveRequest(request.id)}
                                                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                                title="Duyệt"
                                                            >
                                                                <CheckCircle className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                                title="Từ chối"
                                                            >
                                                                <XCircle className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {request.status === 'APPROVED' && (
                                                        <button
                                                            onClick={() => handleConvertToPO(request.id)}
                                                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded text-white transition-colors ${!request.supplierId ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                                                }`}
                                                            title={!request.supplierId ? 'Chưa chọn nhà cung cấp' : 'Tạo đơn đặt hàng'}
                                                        >
                                                            Tạo PO <ArrowRight className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {requests.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    Chưa có yêu cầu nhập hàng nào
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
