'use client'

import { useState, useEffect } from 'react'
import {
    AlertTriangle, Package, TrendingDown, ShoppingCart,
    RefreshCw, ChevronRight, Check, X, Loader2,
    Calendar, ArrowRight, Bell, Send, Mail
} from 'lucide-react'
import toast from 'react-hot-toast'

interface InventoryAlert {
    productId: string
    productName: string
    sku: string
    categoryName: string
    currentStock: number
    minStockLevel: number
    reorderPoint: number
    avgDailySales: number
    daysUntilStockout: number
    suggestedOrderQty: number
    urgencyLevel: 'CRITICAL' | 'WARNING' | 'NORMAL'
    lastRestockDate?: string
    estimatedStockoutDate?: string
}

interface AlertSummary {
    criticalCount: number
    warningCount: number
    totalAlerts: number
    totalSuggestedOrderValue: number
    analyzedProducts: number
    daysAhead: number
}

export default function SmartInventoryAlerts() {
    const [alerts, setAlerts] = useState<InventoryAlert[]>([])
    const [summary, setSummary] = useState<AlertSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
    const [creatingOrder, setCreatingOrder] = useState(false)
    const [daysAhead, setDaysAhead] = useState(7)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [autoSend, setAutoSend] = useState(false)

    useEffect(() => {
        fetchAlerts()
    }, [daysAhead])

    const fetchAlerts = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`/api/admin/inventory/smart-alerts?daysAhead=${daysAhead}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setAlerts(data.alerts || [])
                setSummary(data.summary || null)
            } else {
                toast.error('Không thể tải dữ liệu cảnh báo')
            }
        } catch (error) {
            toast.error('Lỗi kết nối server')
        } finally {
            setLoading(false)
        }
    }

    const toggleProduct = (productId: string) => {
        const newSelected = new Set(selectedProducts)
        if (newSelected.has(productId)) {
            newSelected.delete(productId)
        } else {
            newSelected.add(productId)
        }
        setSelectedProducts(newSelected)
    }

    const selectAll = () => {
        if (selectedProducts.size === alerts.length) {
            setSelectedProducts(new Set())
        } else {
            setSelectedProducts(new Set(alerts.map(a => a.productId)))
        }
    }

    const createPurchaseOrder = async () => {
        if (selectedProducts.size === 0) {
            toast.error('Vui lòng chọn ít nhất 1 sản phẩm')
            return
        }

        setCreatingOrder(true)
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch('/api/admin/purchase-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productIds: Array.from(selectedProducts),
                    autoSend: autoSend
                })
            })

            if (res.ok) {
                const data = await res.json()
                toast.success(data.message)
                setSelectedProducts(new Set())
                setShowConfirmModal(false)
                setAutoSend(false)
            } else {
                const error = await res.json()
                toast.error(error.error || 'Không thể tạo đơn đặt hàng')
            }
        } catch (error) {
            toast.error('Lỗi kết nối server')
        } finally {
            setCreatingOrder(false)
        }
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A'
        return new Date(dateStr).toLocaleDateString('vi-VN')
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const getUrgencyStyle = (level: string) => {
        switch (level) {
            case 'CRITICAL':
                return 'bg-red-100 text-red-700 border-red-200'
            case 'WARNING':
                return 'bg-amber-100 text-amber-700 border-amber-200'
            default:
                return 'bg-green-100 text-green-700 border-green-200'
        }
    }

    const getUrgencyLabel = (level: string) => {
        switch (level) {
            case 'CRITICAL': return 'Khẩn cấp'
            case 'WARNING': return 'Cảnh báo'
            default: return 'Bình thường'
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                <p className="text-gray-500">Đang phân tích tồn kho...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-8 h-8 opacity-80" />
                            <span className="text-3xl font-black">{summary.criticalCount}</span>
                        </div>
                        <p className="text-sm font-bold opacity-90">Khẩn cấp</p>
                        <p className="text-xs opacity-70">Cần nhập ngay</p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <Bell className="w-8 h-8 opacity-80" />
                            <span className="text-3xl font-black">{summary.warningCount}</span>
                        </div>
                        <p className="text-sm font-bold opacity-90">Cảnh báo</p>
                        <p className="text-xs opacity-70">Cần lên kế hoạch</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-5 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <Package className="w-8 h-8 opacity-80" />
                            <span className="text-3xl font-black">{summary.analyzedProducts}</span>
                        </div>
                        <p className="text-sm font-bold opacity-90">Tổng sản phẩm</p>
                        <p className="text-xs opacity-70">Đã phân tích</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-5 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <ShoppingCart className="w-8 h-8 opacity-80" />
                            <span className="text-lg font-black">{formatCurrency(summary.totalSuggestedOrderValue)}</span>
                        </div>
                        <p className="text-sm font-bold opacity-90">Giá trị đề xuất</p>
                        <p className="text-xs opacity-70">Đặt hàng bổ sung</p>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-bold text-gray-700">Dự báo:</label>
                    <select
                        value={daysAhead}
                        onChange={(e) => setDaysAhead(parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={3}>3 ngày tới</option>
                        <option value={7}>7 ngày tới</option>
                        <option value={14}>14 ngày tới</option>
                        <option value={30}>30 ngày tới</option>
                    </select>

                    <button
                        onClick={fetchAlerts}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Làm mới"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                {selectedProducts.size > 0 && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            disabled={creatingOrder}
                            className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-lg"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Tạo đơn đặt hàng ({selectedProducts.size})
                        </button>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 text-white">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5" />
                                Xác Nhận Đơn Đặt Hàng
                            </h2>
                            <p className="text-green-100 text-sm mt-1">
                                {selectedProducts.size} sản phẩm sẽ được tập hợp theo nhà cung cấp
                            </p>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="text-sm font-bold text-gray-700 mb-2">Sản phẩm đã chọn:</h4>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {Array.from(selectedProducts).map(productId => {
                                        const alert = alerts.find(a => a.productId === productId)
                                        return alert ? (
                                            <div key={productId} className="text-sm text-gray-600 flex justify-between">
                                                <span>{alert.productName}</span>
                                                <span className="font-bold text-blue-600">+{alert.suggestedOrderQty}</span>
                                            </div>
                                        ) : null
                                    })}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={autoSend}
                                        onChange={(e) => setAutoSend(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 mt-0.5"
                                    />
                                    <div>
                                        <span className="font-bold text-gray-800 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-green-600" />
                                            Gửi đơn tự động cho Nhà cung cấp
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Hệ thống sẽ tự động gửi email đơn đặt hàng đến từng Nhà cung cấp tương ứng.
                                            Nếu sản phẩm chưa có NCC, hệ thống sẽ ghép theo danh mục.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {autoSend && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700">
                                        <strong>Lưu ý:</strong> Email sẽ được gửi ngay sau khi bạn xác nhận.
                                        Hãy chắc chắn thông tin Nhà cung cấp đã được cập nhật đầy đủ.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false)
                                    setAutoSend(false)
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={createPurchaseOrder}
                                disabled={creatingOrder}
                                className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 flex items-center gap-2"
                            >
                                {creatingOrder ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : autoSend ? (
                                    <Send className="w-4 h-4" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                {autoSend ? 'Tạo & Gửi Ngay' : 'Tạo Đơn'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts Table */}
            {alerts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Kho hàng ổn định!</h3>
                    <p className="text-gray-500">
                        Không có sản phẩm nào cần nhập bổ sung trong {daysAhead} ngày tới.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800">Danh sách cảnh báo ({alerts.length})</h3>
                        <button
                            onClick={selectAll}
                            className="text-sm text-blue-600 font-bold hover:underline"
                        >
                            {selectedProducts.size === alerts.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.size === alerts.length && alerts.length > 0}
                                            onChange={selectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tồn kho</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Bán/ngày</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Còn lại</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Đề xuất</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {alerts.map((alert) => (
                                    <tr
                                        key={alert.productId}
                                        className={`hover:bg-gray-50 transition-colors ${selectedProducts.has(alert.productId) ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.has(alert.productId)}
                                                onChange={() => toggleProduct(alert.productId)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{alert.productName}</p>
                                                <p className="text-xs text-gray-500">SKU: {alert.sku} • {alert.categoryName}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${alert.currentStock <= alert.minStockLevel
                                                    ? 'text-red-600'
                                                    : alert.currentStock <= alert.reorderPoint
                                                        ? 'text-amber-600'
                                                        : 'text-gray-800'
                                                    }`}>
                                                    {alert.currentStock}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    / min: {alert.minStockLevel}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm font-medium text-gray-700">
                                                {alert.avgDailySales > 0 ? alert.avgDailySales.toFixed(1) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {alert.daysUntilStockout === -1 ? (
                                                <span className="text-xs text-gray-400">∞</span>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    <span className={`text-sm font-bold ${alert.daysUntilStockout <= 3
                                                        ? 'text-red-600'
                                                        : alert.daysUntilStockout <= 7
                                                            ? 'text-amber-600'
                                                            : 'text-gray-700'
                                                        }`}>
                                                        {alert.daysUntilStockout} ngày
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-sm font-bold">
                                                +{alert.suggestedOrderQty}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getUrgencyStyle(alert.urgencyLevel)}`}>
                                                {alert.urgencyLevel === 'CRITICAL' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                {getUrgencyLabel(alert.urgencyLevel)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
