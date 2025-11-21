// src/components/admin/InventoryManagement.tsx
'use client'

import { ShoppingCart, TrendingUp, TrendingDown, AlertTriangle, Package, ArrowUpCircle, ArrowDownCircle, Repeat } from 'lucide-react'

interface PurchaseRecommendation {
    productId: string
    productName: string
    category: string
    currentStock: number
    recommendedQuantity: number
    urgencyScore: number
    priority: 'NORMAL' | 'HIGH' | 'URGENT'
    estimatedCost: number
    lastUnitPrice: number
    supplier?: { name: string; id: string }
    reasons: string[]
}

interface InventoryMovement {
    id: string
    product: { name: string; sku: string }
    type: 'IN' | 'OUT' | 'ADJUSTMENT'
    quantity: number
    reason: string
    reference?: string
    createdAt: string
}

interface Props {
    recommendations: PurchaseRecommendation[]
    movements: InventoryMovement[]
}

export default function InventoryManagement({ recommendations, movements }: Props) {
    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'URGENT':
                return 'bg-red-100 text-red-800 border-red-200'
            case 'HIGH':
                return 'bg-orange-100 text-orange-800 border-orange-200'
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200'
        }
    }

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'IN':
                return <ArrowDownCircle className="w-5 h-5 text-green-600" />
            case 'OUT':
                return <ArrowUpCircle className="w-5 h-5 text-red-600" />
            case 'ADJUSTMENT':
                return <Repeat className="w-5 h-5 text-blue-600" />
            default:
                return <Package className="w-5 h-5 text-gray-600" />
        }
    }

    const getMovementColor = (type: string) => {
        switch (type) {
            case 'IN':
                return 'text-green-600 bg-green-50'
            case 'OUT':
                return 'text-red-600 bg-red-50'
            case 'ADJUSTMENT':
                return 'text-blue-600 bg-blue-50'
            default:
                return 'text-gray-600 bg-gray-50'
        }
    }

    const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')}đ`
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Calculate summary statistics
    const urgentCount = recommendations.filter(r => r.priority === 'URGENT').length
    const totalEstimatedCost = recommendations.reduce((sum, r) => sum + r.estimatedCost, 0)
    const totalRecommendedQty = recommendations.reduce((sum, r) => sum + r.recommendedQuantity, 0)

    const recentIn = movements.filter(m => m.type === 'IN').length
    const recentOut = movements.filter(m => m.type === 'OUT').length
    const recentAdjustments = movements.filter(m => m.type === 'ADJUSTMENT').length

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Đề Xuất Khẩn Cấp</p>
                            <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Tổng Đề Xuất</p>
                            <p className="text-2xl font-bold text-orange-600">{recommendations.length}</p>
                        </div>
                        <ShoppingCart className="w-8 h-8 text-orange-600" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Tổng Số Lượng</p>
                            <p className="text-2xl font-bold text-blue-600">{totalRecommendedQty}</p>
                        </div>
                        <Package className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Chi Phí Ước Tính</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(totalEstimatedCost)}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                </div>
            </div>

            {/* Purchase Recommendations */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <ShoppingCart className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Đề Xuất Đặt Hàng Thông Minh</h3>
                    </div>
                    <span className="text-sm text-gray-500">{recommendations.length} sản phẩm</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản Phẩm</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh Mục</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tồn Hiện Tại</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đề Xuất SL</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Chi Phí</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ưu Tiên</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý Do</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recommendations.map((rec) => (
                                <tr key={rec.productId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{rec.productName}</div>
                                        {rec.supplier && (
                                            <div className="text-xs text-gray-500">NCC: {rec.supplier.name}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{rec.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                        <span className={rec.currentStock <= 10 ? 'text-red-600' : 'text-gray-900'}>
                                            {rec.currentStock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        <span className="font-semibold text-blue-600">{rec.recommendedQuantity}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                        {formatCurrency(rec.estimatedCost)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getPriorityBadge(rec.priority)}`}>
                                            {rec.priority === 'URGENT' ? 'KHẨN CẤP' : rec.priority === 'HIGH' ? 'CAO' : 'BÌNH THƯỜNG'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <ul className="list-disc list-inside space-y-1">
                                            {rec.reasons.slice(0, 2).map((reason, idx) => (
                                                <li key={idx} className="text-xs">{reason}</li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                            {recommendations.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                        <p className="text-sm">Không có đề xuất đặt hàng nào</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stock Movements */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Biến Động Kho Gần Đây</h3>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center text-green-600">
                            <ArrowDownCircle className="w-4 h-4 mr-1" />
                            Nhập: {recentIn}
                        </span>
                        <span className="flex items-center text-red-600">
                            <ArrowUpCircle className="w-4 h-4 mr-1" />
                            Xuất: {recentOut}
                        </span>
                        <span className="flex items-center text-blue-600">
                            <Repeat className="w-4 h-4 mr-1" />
                            Điều chỉnh: {recentAdjustments}
                        </span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản Phẩm</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số Lượng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý Do</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tham Chiếu</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời Gian</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {movements.slice(0, 20).map((movement) => (
                                <tr key={movement.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            {getMovementIcon(movement.type)}
                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getMovementColor(movement.type)}`}>
                                                {movement.type === 'IN' ? 'NHẬP' : movement.type === 'OUT' ? 'XUẤT' : 'ĐIỀU CHỈNH'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{movement.product.name}</div>
                                        <div className="text-xs text-gray-500">{movement.product.sku}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                                        <span className={movement.type === 'IN' ? 'text-green-600' : movement.type === 'OUT' ? 'text-red-600' : 'text-blue-600'}>
                                            {movement.type === 'IN' ? '+' : movement.type === 'OUT' ? '-' : '±'}{movement.quantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{movement.reason}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {movement.reference || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(movement.createdAt)}
                                    </td>
                                </tr>
                            ))}
                            {movements.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        <TrendingDown className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                        <p className="text-sm">Chưa có biến động kho nào</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
