
'use client'

import { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { AlertTriangle, TrendingUp, DollarSign, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react'

interface RiskAnalysis {
    customerId: string
    name: string
    currentDebt: number
    creditLimit: number
    riskScore: number // 0-100
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN'
    warning: string
    suggestedLimit: number
}

export default function CreditRiskPage() {
    const [data, setData] = useState<RiskAnalysis[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchData = async () => {
        try {
            const res = await fetchWithAuth('/api/customers/credit-risk')
            if (res.ok) {
                const json = await res.json()
                setData(json.data || [])
            } else {
                toast.error('Không thể tải dữ liệu đánh giá rủi ro')
            }
        } catch (error) {
            console.error(error)
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleRefresh = () => {
        setRefreshing(true)
        fetchData()
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
    }

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    if (loading) {
        return <div className="p-8 flex justify-center"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Đánh Giá Tín Dụng & Rủi Ro</h1>
                    <p className="text-sm text-gray-500 mt-1">AI phân tích lịch sử thanh toán để cảnh báo nợ xấu</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-red-600">Khách Hàng Rủi Ro Cao</p>
                        <h3 className="text-3xl font-bold text-red-900 mt-2">
                            {data.filter(i => i.riskLevel === 'HIGH' || i.riskLevel === 'CRITICAL').length}
                        </h3>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-blue-600">Tổng Nợ Đang Theo Dõi</p>
                        <h3 className="text-3xl font-bold text-blue-900 mt-2">
                            {formatCurrency(data.reduce((acc, curr) => acc + curr.currentDebt, 0))}
                        </h3>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
                <div className="bg-green-50 p-6 rounded-xl border border-green-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-green-600">Dư Nợ An Toàn</p>
                        <h3 className="text-3xl font-bold text-green-900 mt-2">
                            {data.filter(i => i.riskLevel === 'LOW').length} <span className="text-sm font-normal text-green-700">khách hàng</span>
                        </h3>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Chi Tiết Đánh Giá</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {data.map((item) => (
                        <li key={item.customerId} className="p-6 hover:bg-gray-50 transition duration-150 ease-in-out">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex-1 min-w-[200px]">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                            {item.name.charAt(0)}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                            <div className="text-sm text-gray-500">ID: {item.customerId.substring(0, 8)}...</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-[150px]">
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nợ Hiện Tại</div>
                                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(item.currentDebt)}</div>
                                    <div className="text-xs text-gray-400">Hạn mức: {formatCurrency(item.creditLimit)}</div>
                                </div>

                                <div className="flex-1 min-w-[150px]">
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Điểm Rủi Ro (AI)</div>
                                    <div className="flex items-center">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[100px]">
                                            <div
                                                className={`h-2.5 rounded-full ${item.riskScore > 70 ? 'bg-red-600' : item.riskScore > 40 ? 'bg-yellow-400' : 'bg-green-500'}`}
                                                style={{ width: `${item.riskScore}%` }}>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold">{item.riskScore}/100</span>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-[120px]">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRiskColor(item.riskLevel)}`}>
                                        {item.riskLevel === 'CRITICAL' && <ShieldAlert className="w-3 h-3 mr-1 self-center" />}
                                        {item.riskLevel}
                                    </span>
                                </div>

                                <div className="flex-1 min-w-[250px]">
                                    {item.warning && (
                                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                                            <span className="font-bold">Cảnh báo AI:</span> {item.warning}
                                        </div>
                                    )}
                                    {item.suggestedLimit < item.creditLimit && (
                                        <div className="text-xs text-orange-600 mt-1">
                                             Đề xuất giảm hạn mức xuống {formatCurrency(item.suggestedLimit)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                    {data.length === 0 && (
                        <li className="p-8 text-center text-gray-500">Chưa có dữ liệu đánh giá</li>
                    )}
                </ul>
            </div>
        </div>
    )
}
