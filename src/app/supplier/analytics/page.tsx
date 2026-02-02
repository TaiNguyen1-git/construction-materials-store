'use client'

import { useState, useEffect } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts'
import {
    TrendingUp,
    Star,
    Award,
    Package,
    CheckCircle,
    Clock,
    Zap,
    X
} from 'lucide-react'

export default function SupplierAnalytics() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showGuideModal, setShowGuideModal] = useState(false)

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch(`/api/supplier/analytics?supplierId=${supplierId}`)
            const json = await res.json()
            if (json.success) {
                setData(json.data)
            }
        } catch (error) {
            console.error('Fetch analytics error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const revenueData = Object.entries(data?.monthlyRevenue || {}).map(([month, amount]) => {
        const monthMap: Record<string, string> = {
            'Jan': 'Thg 1', 'Feb': 'Thg 2', 'Mar': 'Thg 3', 'Apr': 'Thg 4',
            'May': 'Thg 5', 'Jun': 'Thg 6', 'Jul': 'Thg 7', 'Aug': 'Thg 8',
            'Sep': 'Thg 9', 'Oct': 'Thg 10', 'Nov': 'Thg 11', 'Dec': 'Thg 12'
        }
        return {
            month: monthMap[month as string] || month,
            amount: amount,
        }
    })

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    }

    const formatYAxis = (value: number) => {
        if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} Tỷ`;
        if (value >= 1000000) return `${(value / 1000000).toFixed(0)} Tr`;
        return `${value}`;
    }

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Phân tích & Hiệu suất</h1>
                <p className="text-gray-500">Theo dõi tăng trưởng doanh thu và chỉ số chất lượng dịch vụ của bạn.</p>
            </div>

            {/* Top Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                        <Star className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Điểm uy tín</p>
                        <p className="text-2xl font-bold text-gray-900">{data?.performance.overall.toFixed(1)}/5.0</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-xl">
                        <Award className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Chất lượng hàng</p>
                        <p className="text-2xl font-bold text-gray-900">{data?.performance.quality.toFixed(1)}/5.0</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-4">
                    <div className="p-3 bg-orange-50 rounded-xl">
                        <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Thời gian giao</p>
                        <p className="text-2xl font-bold text-gray-900">{data?.performance.delivery.toFixed(1)}/5.0</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Độ chính xác</p>
                        <p className="text-2xl font-bold text-gray-900">{data?.performance.accuracy.toFixed(1)}/5.0</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Biểu đồ doanh thu
                        </h2>
                        <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded">6 tháng gần nhất</span>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={formatYAxis}
                                    width={80}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100">
                                                    <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
                                                    <p className="text-blue-600 font-bold text-base">
                                                        {formatCurrency(payload[0].value as number)}
                                                    </p>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
                        <Package className="w-5 h-5 text-blue-600" />
                        Sản phẩm bán chạy
                    </h2>
                    <div className="space-y-6">
                        {data?.topProducts.map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {i + 1}
                                    </div>
                                    <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                                </div>
                                <span className="text-sm font-bold text-blue-600">{p.quantity} SL</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.topProducts}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="quantity"
                                >
                                    {data?.topProducts.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Performance Tips */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Zap className="w-6 h-6 text-yellow-300" />
                        Mẹo tăng doanh số
                    </h3>
                    <p className="opacity-90 max-w-xl">
                        Sản phẩm của bạn hiện có tỉ lệ hủy đơn thấp nhất hệ thống! Hãy cập nhật thêm nhiều hình ảnh thực tế và chứng chỉ chất lượng để thu hút thêm các nhà thầu lớn.
                    </p>
                </div>
                <button
                    onClick={() => setShowGuideModal(true)}
                    className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg whitespace-nowrap"
                >
                    Xem hướng dẫn tối ưu
                </button>
            </div>

            {/* Guide Modal */}
            {showGuideModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200 shadow-2xl">
                        <button
                            onClick={() => setShowGuideModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="mb-6">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <Zap className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Tối ưu hóa gian hàng</h3>
                            <p className="text-gray-500">Làm theo các bước sau để tăng 30% doanh thu</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="bg-white p-2 h-fit rounded-lg shadow-sm">
                                    <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">1. Hình ảnh chuyên nghiệp</h4>
                                    <p className="text-sm text-gray-600 mt-1">Sử dụng ít nhất 3 ảnh thật tại công trình cho mỗi sản phẩm chủ đạo.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="bg-white p-2 h-fit rounded-lg shadow-sm">
                                    <Award className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">2. Chứng thực năng lực</h4>
                                    <p className="text-sm text-gray-600 mt-1">Upload hồ sơ năng lực và các chứng chỉ ISO/TCVN vào hồ sơ NCC.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="bg-white p-2 h-fit rounded-lg shadow-sm">
                                    <Clock className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">3. Phản hồi nhanh</h4>
                                    <p className="text-sm text-gray-600 mt-1">Duy trì thời gian phản hồi tin nhắn dưới 15 phút để đạt huy hiệu "Phản hồi nhanh".</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={() => setShowGuideModal(false)}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                Đã hiểu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
