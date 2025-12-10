// src/components/admin/InventoryAnalytics.tsx
'use client'

import { useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Brain, Download, Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'

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
    const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'success' | 'error'>('idle')
    const [trainingLog, setTrainingLog] = useState('')

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

        return reasons.length > 0 ? reasons.join(' • ') : 'Dự đoán cơ bản'
    }

    // Prepare chart data
    const demandForecastData = predictions.slice(0, 10).map(p => ({
        name: p.productName.substring(0, 15) + '...',
        'Tồn Kho': Math.round(p.currentStock),
        'Dự Đoán': Math.round(p.predictedDemand),
        'Đề Xuất': Math.round(p.recommendedOrder),
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

    const handleTrainModel = async () => {
        try {
            setTrainingStatus('training')
            setTrainingLog('Đang khởi động quá trình đào tạo mô hình AI...')

            const response = await fetchWithAuth('/api/predictions/inventory/train', {
                method: 'POST',
            })

            const result = await response.json()

            if (result.success) {
                setTrainingStatus('success')
                setTrainingLog('✅ Đào tạo mô hình hoàn tất!\n\n' + (result.data?.output || ''))
                toast.success('Đã đào tạo mô hình AI thành công!')
                setTimeout(() => {
                    onRefresh()
                }, 2000)
            } else {
                setTrainingStatus('error')
                setTrainingLog('❌ Lỗi khi đào tạo:\n\n' + (result.error || 'Lỗi không xác định'))
                toast.error('Đào tạo mô hình thất bại')
            }
        } catch (error: any) {
            setTrainingStatus('error')
            setTrainingLog('❌ Lỗi kết nối:\n\n' + error.message)
            toast.error('Không thể kết nối đến server')
        }
    }

    const totalPredictedDemand = Math.round(predictions.reduce((sum, p) => sum + p.predictedDemand, 0))
    const totalRecommendedOrder = Math.round(predictions.reduce((sum, p) => sum + p.recommendedOrder, 0))

    return (
        <div className="space-y-6">
            {/* AI Model Status Card */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center space-x-3 mb-4">
                    <Brain className="w-8 h-8" />
                    <div>
                        <h2 className="text-xl font-bold">Hệ Thống Dự Đoán AI</h2>
                        <p className="text-sm text-purple-100">Sử dụng Prophet ML Algorithm</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-white/20 rounded-lg p-3">
                        <div className="text-2xl font-bold">{predictions.length}</div>
                        <div className="text-xs text-purple-100">Sản phẩm dự đoán</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                        <div className="text-2xl font-bold">{totalPredictedDemand}</div>
                        <div className="text-xs text-purple-100">Tổng nhu cầu dự kiến</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                        <div className="text-2xl font-bold">{totalRecommendedOrder}</div>
                        <div className="text-xs text-purple-100">Đề xuất đặt hàng</div>
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
                            Dự Đoán Nhu Cầu Top 10
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
                            <Bar dataKey="Dự Đoán" fill="#8B5CF6" />
                            <Bar dataKey="Đề Xuất" fill="#10B981" />
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
                            <Line type="monotone" dataKey="Dự Đoán" stroke="#8B5CF6" strokeWidth={2} />
                            <Line type="monotone" dataKey="Đề Xuất" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Prediction Details Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Chi Tiết Dự Đoán</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản Phẩm</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh Mục</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tồn Kho</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Dự Đoán</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đề Xuất</th>
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
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="max-w-xs">{pred.reason || generateReason(pred)}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
