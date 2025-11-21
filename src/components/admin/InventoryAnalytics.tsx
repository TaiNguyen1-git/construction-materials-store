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
}

interface Props {
    predictions: InventoryPrediction[]
    onRefresh: () => void
}

export default function InventoryAnalytics({ predictions, onRefresh }: Props) {
    const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'success' | 'error'>('idle')
    const [trainingLog, setTrainingLog] = useState('')

    // Prepare chart data
    const demandForecastData = predictions.slice(0, 10).map(p => ({
        name: p.productName.substring(0, 15) + '...',
        'Tồn Kho': p.currentStock,
        'Dự Đoán': p.predictedDemand,
        'Đề Xuất': p.recommendedOrder,
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

    const avgConfidence = predictions.length > 0
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
        : 0

    const totalPredictedDemand = predictions.reduce((sum, p) => sum + p.predictedDemand, 0)
    const totalRecommendedOrder = predictions.reduce((sum, p) => sum + p.recommendedOrder, 0)

    return (
        <div className="space-y-6">
            {/* AI Model Status Card */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <Brain className="w-8 h-8" />
                        <div>
                            <h2 className="text-xl font-bold">Hệ Thống Dự Đoán AI</h2>
                            <p className="text-sm text-purple-100">Sử dụng Prophet ML Algorithm</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold">{(avgConfidence * 100).toFixed(0)}%</div>
                        <div className="text-sm text-purple-100">Độ chính xác trung bình</div>
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

            {/* Training Control Panel */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Play className="w-5 h-5 mr-2 text-blue-600" />
                            Đào Tạo Mô Hình AI
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">Huấn luyện lại mô hình với dữ liệu lịch sử mới nhất</p>
                    </div>
                    <button
                        onClick={handleTrainModel}
                        disabled={trainingStatus === 'training'}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg transition-all"
                    >
                        {trainingStatus === 'training' ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Đang Đào Tạo...
                            </>
                        ) : (
                            <>
                                <Brain className="w-5 h-5 mr-2" />
                                Bắt Đầu Đào Tạo
                            </>
                        )}
                    </button>
                </div>

                {trainingLog && (
                    <div className={`mt-4 p-4 rounded-lg border ${trainingStatus === 'success' ? 'bg-green-50 border-green-200' :
                        trainingStatus === 'error' ? 'bg-red-50 border-red-200' :
                            'bg-gray-50 border-gray-200'
                        }`}>
                        <div className="flex items-start space-x-2">
                            {trainingStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                            {trainingStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                            {trainingStatus === 'training' && <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />}
                            <pre className="text-sm whitespace-pre-wrap font-mono flex-1">{trainingLog}</pre>
                        </div>
                    </div>
                )}
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

                {/* Confidence Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Độ Tin Cậy Dự Đoán (%)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={confidenceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                            <YAxis domain={[0, 100]} fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="confidence" fill="#10B981">
                                {confidenceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.confidence > 80 ? '#10B981' : entry.confidence > 60 ? '#F59E0B' : '#EF4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân Bổ Nhu Cầu Theo Danh Mục</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
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
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Độ Tin Cậy</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {predictions.slice(0, 15).map((pred) => (
                                <tr key={pred.productId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pred.productName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{pred.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">{pred.currentStock}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-semibold">{pred.predictedDemand}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-semibold">{pred.recommendedOrder}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${pred.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                                            pred.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {(pred.confidence * 100).toFixed(0)}%
                                        </span>
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
