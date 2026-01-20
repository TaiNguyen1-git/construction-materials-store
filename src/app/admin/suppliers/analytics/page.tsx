'use client'

/**
 * Supplier Analytics Dashboard Page
 * Comprehensive analytics for comparing supplier performance
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    ArrowLeft, Building2, Star, TrendingUp, TrendingDown, Minus,
    Loader2, RefreshCw, DollarSign, Truck, Package, Clock,
    ChevronRight, Award, AlertTriangle
} from 'lucide-react'

interface SupplierAnalytics {
    id: string
    name: string
    contactPerson: string | null
    isActive: boolean
    metrics: {
        totalOrders: number
        completedOrders: number
        averageOrderValue: number
        totalSpent: number
    }
    performance: {
        qualityRating: number
        deliveryRating: number
        responseRating: number
        overallRating: number
        onTimeDeliveryRate: number
        averageLeadTime: number
    }
    pricing: {
        averagePriceLevel: 'LOW' | 'MEDIUM' | 'HIGH'
        priceCompetitiveness: number
        productsCount: number
    }
    trend: {
        ratingTrend: 'UP' | 'DOWN' | 'STABLE'
        ordersTrend: 'UP' | 'DOWN' | 'STABLE'
        lastOrderDate: string | null
    }
}

export default function SupplierAnalyticsPage() {
    const [suppliers, setSuppliers] = useState<SupplierAnalytics[]>([])
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('30')
    const [sortBy, setSortBy] = useState('overallRating')

    useEffect(() => {
        fetchData()
    }, [period, sortBy])

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/suppliers/analytics?period=${period}&sortBy=${sortBy}`)
            if (!res.ok) throw new Error('Failed to fetch')

            const data = await res.json()
            setSuppliers(data.data.suppliers)
            setStats(data.data.stats)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'UP':
                return <TrendingUp className="w-4 h-4 text-green-500" />
            case 'DOWN':
                return <TrendingDown className="w-4 h-4 text-red-500" />
            default:
                return <Minus className="w-4 h-4 text-gray-400" />
        }
    }

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return 'text-green-600 bg-green-50 border-green-200'
        if (rating >= 3) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        return 'text-red-600 bg-red-50 border-red-200'
    }

    const getPriceColor = (level: string) => {
        switch (level) {
            case 'LOW':
                return 'text-green-600 bg-green-50'
            case 'MEDIUM':
                return 'text-yellow-600 bg-yellow-50'
            case 'HIGH':
                return 'text-red-600 bg-red-50'
            default:
                return 'text-gray-600 bg-gray-50'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại Dashboard
                    </Link>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-blue-600" />
                            Phân tích Nhà cung cấp
                        </h1>
                        <p className="text-gray-500 mt-1">So sánh hiệu suất và tối ưu hóa chuỗi cung ứng</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="bg-white border border-gray-200 rounded-lg px-3 py-2 font-medium text-sm"
                        >
                            <option value="7">7 ngày qua</option>
                            <option value="30">30 ngày qua</option>
                            <option value="90">90 ngày qua</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-white border border-gray-200 rounded-lg px-3 py-2 font-medium text-sm"
                        >
                            <option value="overallRating">Đánh giá cao nhất</option>
                            <option value="totalOrders">Đơn hàng nhiều nhất</option>
                            <option value="priceCompetitiveness">Giá cạnh tranh nhất</option>
                            <option value="onTimeDelivery">Giao hàng đúng hạn</option>
                        </select>

                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-600' : 'text-gray-600'}`} />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-gray-500 text-sm">Tổng NCC</p>
                            <p className="text-2xl font-black text-gray-900">{stats.totalSuppliers}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-gray-500 text-sm">Đánh giá TB</p>
                            <p className="text-2xl font-black text-gray-900 flex items-center gap-1">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                {stats.averageRating.toFixed(1)}
                            </p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                            <p className="text-green-600 text-sm">Top Performers</p>
                            <p className="text-2xl font-black text-green-700">{stats.topPerformers}</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                            <p className="text-red-600 text-sm">Cần cải thiện</p>
                            <p className="text-2xl font-black text-red-700">{stats.needsAttention}</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <p className="text-blue-600 text-sm">Tổng chi</p>
                            <p className="text-2xl font-black text-blue-700">
                                {(stats.totalSpent / 1000000).toFixed(1)}M
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && !suppliers.length && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    </div>
                )}

                {/* Suppliers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {suppliers.map((supplier, idx) => (
                        <div
                            key={supplier.id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                                idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                                                    idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400' :
                                                        'bg-gradient-to-br from-blue-500 to-blue-600'
                                            }`}>
                                            {idx < 3 ? <Award className="w-6 h-6" /> : (idx + 1)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{supplier.name}</h3>
                                            {supplier.contactPerson && (
                                                <p className="text-sm text-gray-500">{supplier.contactPerson}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`px-3 py-1 rounded-full border font-bold ${getRatingColor(supplier.performance.overallRating)}`}>
                                        <span className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-current" />
                                            {supplier.performance.overallRating}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="p-5">
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-gray-900">{supplier.metrics.totalOrders}</p>
                                        <p className="text-xs text-gray-500">Tổng đơn</p>
                                        <div className="flex justify-center mt-1">
                                            {getTrendIcon(supplier.trend.ordersTrend)}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-gray-900">
                                            {supplier.performance.onTimeDeliveryRate}%
                                        </p>
                                        <p className="text-xs text-gray-500">Đúng hạn</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-gray-900">
                                            {supplier.performance.averageLeadTime}d
                                        </p>
                                        <p className="text-xs text-gray-500">Lead time</p>
                                    </div>
                                </div>

                                {/* Rating Bars */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-16">Chất lượng</span>
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${supplier.performance.qualityRating * 20}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold">{supplier.performance.qualityRating}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-16">Giao hàng</span>
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full"
                                                style={{ width: `${supplier.performance.deliveryRating * 20}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold">{supplier.performance.deliveryRating}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-16">Phản hồi</span>
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 rounded-full"
                                                style={{ width: `${supplier.performance.responseRating * 20}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold">{supplier.performance.responseRating}</span>
                                    </div>
                                </div>

                                {/* Bottom Info */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Package className="w-4 h-4" />
                                            {supplier.pricing.productsCount} SP
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getPriceColor(supplier.pricing.averagePriceLevel)}`}>
                                            {supplier.pricing.averagePriceLevel === 'LOW' ? 'Giá tốt' :
                                                supplier.pricing.averagePriceLevel === 'MEDIUM' ? 'Giá TB' : 'Giá cao'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 text-sm">
                                        {getTrendIcon(supplier.trend.ratingTrend)}
                                        <span className="text-gray-400">
                                            {supplier.trend.lastOrderDate
                                                ? new Date(supplier.trend.lastOrderDate).toLocaleDateString('vi-VN')
                                                : 'Chưa có đơn'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {!loading && suppliers.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">Chưa có dữ liệu</h3>
                        <p className="text-gray-500">Chưa có nhà cung cấp nào để phân tích</p>
                    </div>
                )}
            </div>
        </div>
    )
}
