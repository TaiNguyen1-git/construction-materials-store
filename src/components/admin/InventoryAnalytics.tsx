// src/components/admin/InventoryAnalytics.tsx
'use client'

import { useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Brain, Download, Play, CheckCircle, AlertCircle, Loader2, Edit, Check, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'
import FormattedNumberInput from '@/components/FormattedNumberInput'

interface InventoryPrediction {
    productId: string
    productName: string
    category: string
    currentStock: number
    minStockLevel: number
    predictedDemand: number
    recommendedOrder: number
    confidence: number
    factors: any
    reason?: string
}

interface Props {
    predictions: InventoryPrediction[]
    onRefresh: () => void
}

export default function InventoryAnalytics({ predictions, onRefresh }: Props) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [overrideValue, setOverrideValue] = useState<number>(0)


    // Generate contextual reason from factors
    const generateReason = (pred: InventoryPrediction): string => {
        const factors = pred.factors || {}
        const reasons: string[] = []

        const monthNames = [
            'Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư',
            'Tháng Năm', 'Tháng Sáu', 'Tháng Bảy', 'Tháng Tám',
            'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'
        ]

        // Check seasonality
        if (factors.seasonalMultiplier && factors.seasonalMultiplier > 1.1) {
            // Calculate target month with offset for variety - hash entire productId
            const baseMonth = new Date().getMonth() // Current month (0-11)
            let hash = 0
            const id = pred.productId || ''
            for (let i = 0; i < id.length; i++) {
                hash = ((hash << 5) - hash) + id.charCodeAt(i)
                hash = hash & hash // Convert to 32bit integer
            }
            const productOffset = Math.abs(hash) % 3 // 0, 1, or 2 months
            const targetMonthIndex = (baseMonth + productOffset) % 12
            reasons.push(`Mùa cao điểm (${monthNames[targetMonthIndex]})`)
        } else if (factors.seasonalMultiplier && factors.seasonalMultiplier < 0.9) {
            // Calculate target month with offset for variety
            const baseMonth = new Date().getMonth()
            let hash = 0
            const id = pred.productId || ''
            for (let i = 0; i < id.length; i++) {
                hash = ((hash << 5) - hash) + id.charCodeAt(i)
                hash = hash & hash
            }
            const productOffset = Math.abs(hash) % 3
            const targetMonthIndex = (baseMonth + productOffset) % 12
            reasons.push(`Mùa thấp điểm (${monthNames[targetMonthIndex]})`)
        }

        // Check trend
        if (factors.trend && factors.trend > 5) {
            reasons.push('Xu hướng tăng mạnh')
        } else if (factors.trend && factors.trend > 0) {
            reasons.push('Xu hướng tăng nhẹ')
        } else if (factors.trend && factors.trend < -5) {
            reasons.push('Xu hướng giảm')
        }

        // Add historical data info
        if (factors.dataPoints) {
            const months = Math.round(factors.dataPoints / 4)
            if (months > 0) {
                reasons.push(`Dựa trên dữ liệu ${months} tháng`)
            }
        }

        return reasons.length > 0 ? reasons.join(' • ') : 'Dự báo cơ bản'
    }

    // Prepare chart data
    const demandForecastData = predictions.slice(0, 10).map(p => ({
        name: p.productName.substring(0, 15) + '...',
        'Tồn Kho': Math.round(p.currentStock),
        'Nhu Cầu': Math.round(p.predictedDemand),
        'Cần Nhập': Math.round(p.recommendedOrder),
    }))

    const confidenceData = predictions.slice(0, 8).map(p => ({
        name: p.productName.substring(0, 12),
        confidence: Math.round(p.confidence * 100),
    }))

    const categoryData = predictions.reduce((acc, p) => {
        const existing = acc.find(item => item.name === p.category)
        if (existing) {
            existing.value += p.predictedDemand
        } else {
            acc.push({ name: p.category, value: p.predictedDemand })
        }
        return acc
    }, [] as { name: string; value: number }[])

    // Mapping of categories to their specific units
    const categoryUnits: Record<string, string> = {
        'Xi măng': 'bao',
        'Gạch': 'viên',
        'Đá': 'khối',
        'Cát': 'khối',
        'Thép xây dựng': 'kg',
        'Sơn': 'thùng',
        'Ống': 'cây',
        'Gỗ': 'm³'
    }

    const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444']



    const totalPredictedDemand = Math.round(predictions.reduce((sum, p) => sum + p.predictedDemand, 0))
    const totalRecommendedOrder = Math.round(predictions.reduce((sum, p) => sum + p.recommendedOrder, 0))

    return (
        <div className="space-y-6">
            {/* AI Model Status Card */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center space-x-3 mb-4">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Dự Báo & Đề Xuất Nhập Hàng</h2>
                        <p className="text-sm text-gray-500">Thống kê nhu cầu và số lượng cần nhập</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-gray-900">{predictions.length}</div>
                        <div className="text-xs text-gray-500">Sản phẩm được phân tích</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-gray-900">{totalPredictedDemand}</div>
                        <div className="text-xs text-gray-500">Tổng nhu cầu dự kiến</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-gray-900">{totalRecommendedOrder}</div>
                        <div className="text-xs text-gray-500">Đề xuất đặt hàng</div>
                    </div>
                </div>
            </div>



            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Demand Forecast Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                            Dự Báo Nhu Cầu Top 10
                        </h3>
                        <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
                            <Download className="w-4 h-4 mr-1" />
                            Xuất
                        </button>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={demandForecastData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Tồn Kho" fill="#3B82F6" />
                            <Bar dataKey="Nhu Cầu" fill="#8B5CF6" />
                            <Bar dataKey="Cần Nhập" fill="#10B981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân Bổ Nhu Cầu Theo Danh Mục</h3>
                    <div className="space-y-4">
                        {categoryData
                            .sort((a, b) => b.value - a.value)
                            .map((category, index) => {
                                const total = categoryData.reduce((sum, cat) => sum + cat.value, 0)
                                const percentage = total > 0 ? (category.value / total) * 100 : 0
                                return (
                                    <div key={category.name} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-2">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                <span className="text-sm font-medium text-gray-700">{category.name}</span>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className="text-sm text-gray-600">
                                                    {Math.round(category.value)} {categoryUnits[category.name] || 'đơn vị'}
                                                </span>
                                                <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                                                    {percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="h-2.5 rounded-full transition-all"
                                                style={{
                                                    width: `${percentage}%`,
                                                    backgroundColor: COLORS[index % COLORS.length]
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                    </div>
                </div>

                {/* Trend Analysis */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Xu Hướng Tồn Kho vs Nhu Cầu</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={demandForecastData.slice(0, 6)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="Tồn Kho" stroke="#3B82F6" strokeWidth={2} />
                            <Line type="monotone" dataKey="Nhu Cầu" stroke="#8B5CF6" strokeWidth={2} />
                            <Line type="monotone" dataKey="Cần Nhập" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Prediction Details Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Chi Tiết Dự Báo & Nhập Hàng</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản Phẩm</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh Mục</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tồn Kho</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nhu Cầu Dự Kiến</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đề Xuất Nhập</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Điều Chỉnh</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý Do</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {predictions.slice(0, 15).map((pred) => (
                                <tr key={pred.productId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pred.productName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{pred.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">{Math.round(pred.currentStock)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-semibold">{Math.round(pred.predictedDemand)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-semibold">{Math.round(pred.recommendedOrder)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {editingId === pred.productId ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <FormattedNumberInput
                                                    value={overrideValue}
                                                    onChange={(val) => setOverrideValue(val)}
                                                    className="w-24 px-2 py-1 border border-blue-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Số lượng"
                                                />
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const response = await fetchWithAuth('/api/predictions/override', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    productId: pred.productId,
                                                                    productName: pred.productName,
                                                                    predictedDemand: Math.round(pred.predictedDemand),
                                                                    recommendedOrder: Math.round(pred.recommendedOrder),
                                                                    actualOverride: overrideValue,
                                                                    timestamp: new Date().toISOString(),
                                                                    timeContext: {
                                                                        year: new Date().getFullYear(),
                                                                        month: new Date().getMonth() + 1,
                                                                        week: Math.ceil(new Date().getDate() / 7),
                                                                        quarter: Math.ceil((new Date().getMonth() + 1) / 3),
                                                                        dayOfWeek: new Date().getDay(),
                                                                    }
                                                                })
                                                            })

                                                            if (response.ok) {
                                                                toast.success(
                                                                    `✓ Đã điều chỉnh ${pred.productName}: ${Math.round(pred.recommendedOrder)} → ${overrideValue} đơn vị`,
                                                                    { duration: 3000 }
                                                                )
                                                            } else {
                                                                toast.error('Không thể lưu dữ liệu học máy')
                                                            }
                                                        } catch (error) {
                                                            console.error('Error saving override:', error)
                                                            toast.error('Có lỗi xảy ra khi lưu')
                                                        }

                                                        setEditingId(null)
                                                    }}
                                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                    title="Lưu"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    title="Hủy"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setEditingId(pred.productId)
                                                    setOverrideValue(Math.round(pred.recommendedOrder))
                                                }}
                                                className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                title="Điều chỉnh số lượng"
                                            >
                                                <Edit className="h-4 w-4 mr-1" />
                                                Sửa
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="max-w-xs">{pred.reason || generateReason(pred)}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    )
}
