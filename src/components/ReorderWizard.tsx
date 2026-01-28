'use client'

/**
 * Smart Procurement Wizard Component
 * AI-powered reorder recommendations with supplier optimization
 */

import { useState, useEffect } from 'react'
import {
    Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
    Loader2, ShoppingCart, ChevronRight, Sparkles, Building2,
    Clock, Star, DollarSign, Truck, Filter, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Supplier {
    id: string
    name: string
    unitPrice: number
    leadTimeDays: number
    rating: number
    totalCost: number
}

interface Recommendation {
    productId: string
    productName: string
    sku: string
    currentStock: number
    reorderPoint: number
    suggestedQuantity: number
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    bestSupplier: Supplier | null
    alternativeSuppliers: Supplier[]
    prediction?: {
        expectedDemand: number
        confidence: number
        timeframe: string
    }
    savingsOpportunity?: number
}

interface WizardData {
    recommendations: Recommendation[]
    summary: {
        totalProducts: number
        criticalCount: number
        highCount: number
        mediumCount: number
        lowCount: number
        totalEstimatedCost: number
        potentialSavings: number
    }
    generatedAt: string
}

export default function ReorderWizard() {
    const [data, setData] = useState<WizardData | null>(null)
    const [loading, setLoading] = useState(true)

    const [urgencyFilter, setUrgencyFilter] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | ''>('')
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        fetchData()
    }, [urgencyFilter])

    const fetchData = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (urgencyFilter) params.set('urgency', urgencyFilter)

            const res = await fetch(`/api/procurement/wizard?${params}`)
            if (!res.ok) throw new Error('Failed to fetch')

            const json = await res.json()
            setData(json.data)
        } catch (err) {
            toast.error('Lỗi khi tải gợi ý')
        } finally {
            setLoading(false)
        }
    }

    const toggleItem = (productId: string) => {
        setSelectedItems(prev => {
            const next = new Set(prev)
            if (next.has(productId)) {
                next.delete(productId)
            } else {
                next.add(productId)
            }
            return next
        })
    }

    const selectAll = () => {
        if (!data) return
        setSelectedItems(new Set(data.recommendations.map(r => r.productId)))
    }

    const createPurchaseOrders = async () => {
        if (selectedItems.size === 0) {
            toast.error('Vui lòng chọn ít nhất 1 sản phẩm')
            return
        }

        setCreating(true)
        try {
            // Group by supplier
            const bySupplier: {
                [key: string]: {
                    supplierId: string;
                    supplierName: string;
                    items: {
                        productId: string;
                        productName: string;
                        quantity: number;
                        unitPrice: number;
                    }[]
                }
            } = {}

            data?.recommendations
                .filter(r => selectedItems.has(r.productId) && r.bestSupplier)
                .forEach(r => {
                    const supplierId = r.bestSupplier!.id
                    if (!bySupplier[supplierId]) {
                        bySupplier[supplierId] = {
                            supplierId,
                            supplierName: r.bestSupplier!.name,
                            items: []
                        }
                    }
                    bySupplier[supplierId].items.push({
                        productId: r.productId,
                        productName: r.productName,
                        quantity: r.suggestedQuantity,
                        unitPrice: r.bestSupplier!.unitPrice
                    })
                })


            // Create POs for each supplier
            const results = []
            for (const [supplierId, orderData] of Object.entries(bySupplier)) {
                const res = await fetch('/api/procurement', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        supplierId,
                        items: orderData.items,
                        source: 'WIZARD'
                    })
                })

                if (res.ok) {
                    results.push(await res.json())
                }
            }

            if (results.length > 0) {
                toast.success(`Đã tạo ${results.length} đơn đặt hàng!`)
                setSelectedItems(new Set())
                fetchData()
            } else {
                toast.error('Không thể tạo đơn đặt hàng')
            }
        } catch (err) {
            toast.error('Lỗi khi tạo đơn đặt hàng')
        } finally {
            setCreating(false)
        }
    }

    const getUrgencyConfig = (urgency: string) => {
        switch (urgency) {
            case 'CRITICAL':
                return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: '🔴' }
            case 'HIGH':
                return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', icon: '🟠' }
            case 'MEDIUM':
                return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', icon: '🟡' }
            default:
                return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: '🟢' }
        }
    }

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Đang phân tích kho hàng...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black">Trợ lý Nhập hàng Thông minh</h1>
                            <p className="text-blue-100">Gợi ý dựa trên AI và phân tích dữ liệu bán hàng</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                        <p className="text-3xl font-black text-red-600">{data.summary.criticalCount}</p>
                        <p className="text-sm text-red-600 font-medium">🔴 Cần gấp</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
                        <p className="text-3xl font-black text-orange-600">{data.summary.highCount}</p>
                        <p className="text-sm text-orange-600 font-medium">🟠 Ưu tiên cao</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                        <p className="text-3xl font-black text-blue-600">
                            {(data.summary.totalEstimatedCost / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-sm text-blue-600 font-medium">💰 Dự tính chi</p>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                        <p className="text-3xl font-black text-green-600">
                            {(data.summary.potentialSavings / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-sm text-green-600 font-medium">✨ Tiết kiệm</p>
                    </div>
                </div>
            )}

            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-gray-400" />

                    <select
                        value={urgencyFilter}
                        onChange={(e) => setUrgencyFilter(e.target.value as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | '')}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >

                        <option value="">Tất cả mức độ</option>
                        <option value="CRITICAL">🔴 Cần gấp</option>
                        <option value="HIGH">🟠 Ưu tiên cao</option>
                        <option value="MEDIUM">🟡 Trung bình</option>
                        <option value="LOW">🟢 Thấp</option>
                    </select>

                    <button
                        onClick={selectAll}
                        className="text-blue-600 font-bold text-sm hover:underline"
                    >
                        Chọn tất cả
                    </button>
                </div>

                {selectedItems.size > 0 && (
                    <button
                        onClick={createPurchaseOrders}
                        disabled={creating}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
                    >
                        {creating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <ShoppingCart className="w-5 h-5" />
                                Tạo đơn đặt hàng ({selectedItems.size})
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Recommendations List */}
            <div className="space-y-4">
                {data?.recommendations.map((item) => {
                    const urgencyConfig = getUrgencyConfig(item.urgency)
                    const isSelected = selectedItems.has(item.productId)

                    return (
                        <div
                            key={item.productId}
                            className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleItem(item.productId)}
                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-1 transition-colors ${isSelected
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'border-gray-300 hover:border-blue-400'
                                            }`}
                                    >
                                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                    </button>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`${urgencyConfig.bg} ${urgencyConfig.text} px-2 py-0.5 rounded-full text-xs font-bold`}>
                                                {urgencyConfig.icon} {item.urgency === 'CRITICAL' ? 'CẦN GẤP' : item.urgency}
                                            </span>
                                            <span className="text-gray-400 text-xs font-mono">{item.sku}</span>
                                        </div>

                                        <h3 className="font-bold text-gray-900 text-lg mb-2">{item.productName}</h3>

                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Package className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600">Tồn kho: <span className="font-bold text-red-600">{item.currentStock}</span></span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <TrendingDown className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600">Điểm đặt hàng: {item.reorderPoint}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <ShoppingCart className="w-4 h-4 text-blue-500" />
                                                <span className="text-blue-600 font-bold">Đề xuất nhập: {item.suggestedQuantity}</span>
                                            </div>
                                        </div>

                                        {/* AI Prediction */}
                                        {item.prediction && (
                                            <div className="mt-3 bg-purple-50 rounded-lg p-3 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-purple-600" />
                                                <span className="text-sm text-purple-700">
                                                    AI dự báo: <span className="font-bold">{item.prediction.expectedDemand}</span> đơn vị
                                                    trong <span className="font-bold">{item.prediction.timeframe === 'WEEK' ? '1 tuần' : item.prediction.timeframe === 'MONTH' ? '1 tháng' : '1 quý'}</span>
                                                    <span className="text-purple-500 ml-2">({Math.round(item.prediction.confidence * 100)}% tin cậy)</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Best Supplier */}
                                    {item.bestSupplier && (
                                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-right shrink-0">
                                            <p className="text-xs text-green-600 font-medium mb-1">NCC TỐT NHẤT</p>
                                            <p className="font-bold text-gray-900">{item.bestSupplier.name}</p>
                                            <div className="flex items-center justify-end gap-1 text-sm mt-2">
                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                <span className="font-bold">{item.bestSupplier.rating.toFixed(1)}</span>
                                            </div>
                                            <p className="text-xl font-black text-green-700 mt-2">
                                                {item.bestSupplier.totalCost.toLocaleString('vi-VN')}đ
                                            </p>
                                            <div className="flex items-center justify-end gap-1 text-xs text-gray-500 mt-1">
                                                <Truck className="w-3 h-3" />
                                                {item.bestSupplier.leadTimeDays} ngày
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Alternative Suppliers */}
                                {item.alternativeSuppliers.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 font-medium mb-2">NCC THAY THẾ:</p>
                                        <div className="flex gap-3">
                                            {item.alternativeSuppliers.map(supplier => (
                                                <div key={supplier.id} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                                                    <span className="font-medium">{supplier.name}</span>
                                                    <span className="text-gray-400 mx-2">•</span>
                                                    <span className="text-gray-600">{supplier.totalCost.toLocaleString('vi-VN')}đ</span>
                                                    <span className="text-gray-400 mx-2">•</span>
                                                    <span className="text-yellow-600">⭐ {supplier.rating.toFixed(1)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Savings Opportunity */}
                                {item.savingsOpportunity && item.savingsOpportunity > 10000 && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                                        <DollarSign className="w-4 h-4" />
                                        <span>Tiềm năng tiết kiệm: <span className="font-bold">{item.savingsOpportunity.toLocaleString('vi-VN')}đ</span> khi chọn đúng NCC</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {data?.recommendations.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">Kho hàng đầy đủ!</h3>
                        <p className="text-gray-500">Không có sản phẩm nào cần nhập thêm lúc này.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
