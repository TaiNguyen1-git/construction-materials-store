'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, AlertTriangle, DollarSign, Package, User, Calendar } from 'lucide-react'

interface PurchaseRecommendation {
  productId: string
  productName: string
  category: string
  currentStock: number
  minStockLevel: number
  predictedDemand: number
  recommendedQuantity: number
  urgencyScore: number
  priority: 'NORMAL' | 'HIGH' | 'URGENT'
  reasons: string[]
  estimatedCost: number
  lastUnitPrice: number
  supplier?: {
    id: string
    name: string
    contactPerson?: string
    email?: string
    phone?: string
  }
  prediction: {
    confidence: number
    timeframe: string
    factors: any
  }
  lastPurchaseDate?: string
  daysWithoutPurchase?: number
}

interface SupplierGroup {
  supplier: any
  items: PurchaseRecommendation[]
  totalCost: number
}

export default function PurchaseRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<PurchaseRecommendation[]>([])
  const [supplierGroups, setSupplierGroups] = useState<SupplierGroup[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    timeframe: 'MONTH',
    minConfidence: '0.7',
    priorityType: '',
    budget: '',
    supplierId: ''
  })
  const [suppliers, setSuppliers] = useState<any[]>([])

  useEffect(() => {
    fetchRecommendations()
    fetchSuppliers()
  }, [filters])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString())
      })

      const response = await fetch(`/api/recommendations/purchase?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setRecommendations(data.data.recommendations || [])
        setSupplierGroups(data.data.supplierGroups || [])
        setSummary(data.data.summary || {})
      }
    } catch (error) {
      console.error('Error fetching purchase recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      const data = await response.json()
      if (data.success) {
        setSuppliers(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'NORMAL': { label: 'Bình thường', color: 'bg-gray-100 text-gray-800' },
      'HIGH': { label: 'Cao', color: 'bg-orange-100 text-orange-800' },
      'URGENT': { label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' },
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig['NORMAL']
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getUrgencyColor = (urgencyScore: number) => {
    if (urgencyScore >= 80) return 'text-red-600'
    if (urgencyScore >= 50) return 'text-orange-600'
    if (urgencyScore >= 20) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const createPurchaseOrder = async (supplierId: string, items: PurchaseRecommendation[]) => {
    // Simulate creating purchase order
    const orderData = {
      supplierId,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.recommendedQuantity,
        unitPrice: item.lastUnitPrice
      })),
      totalAmount: items.reduce((sum, item) => sum + item.estimatedCost, 0)
    }

    alert(`Tạo đơn đặt hàng cho ${items[0].supplier?.name} với ${items.length} sản phẩm, tổng ${formatCurrency(orderData.totalAmount)}`)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Đề xuất Đặt hàng</h1>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Khung thời gian</label>
              <select
                value={filters.timeframe}
                onChange={(e) => setFilters({...filters, timeframe: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="WEEK">Tuần</option>
                <option value="MONTH">Tháng</option>
                <option value="QUARTER">Quý</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Độ tin cậy tối thiểu</label>
              <select
                value={filters.minConfidence}
                onChange={(e) => setFilters({...filters, minConfidence: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="0.5">50%</option>
                <option value="0.6">60%</option>
                <option value="0.7">70%</option>
                <option value="0.8">80%</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại ưu tiên</label>
              <select
                value={filters.priorityType}
                onChange={(e) => setFilters({...filters, priorityType: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Tất cả</option>
                <option value="URGENT">Khẩn cấp</option>
                <option value="LOW_STOCK">Hết hàng</option>
                <option value="PREDICTED_DEMAND">Dự đoán nhu cầu</option>
                <option value="SEASONAL">Mùa vụ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
              <select
                value={filters.supplierId}
                onChange={(e) => setFilters({...filters, supplierId: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Tất cả</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngân sách (VND)</label>
              <input
                type="number"
                value={filters.budget}
                onChange={(e) => setFilters({...filters, budget: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Không giới hạn"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tổng sản phẩm</div>
                <div className="text-2xl font-bold">{summary.totalItems || 0}</div>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Khẩn cấp</div>
                <div className="text-2xl font-bold text-red-600">{summary.urgentItems || 0}</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Nhà cung cấp</div>
                <div className="text-2xl font-bold text-green-600">{summary.uniqueSuppliers || 0}</div>
              </div>
              <User className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Tổng chi phí ước tính</div>
                <div className="text-lg font-bold text-purple-600">
                  {formatCurrency(summary.totalEstimatedCost || 0)}
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Groups */}
      {supplierGroups.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Nhóm theo Nhà cung cấp</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {supplierGroups.map((group, index) => (
              <div key={index} className="bg-white rounded-lg border p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{group.supplier.name}</h3>
                    <div className="text-sm text-gray-500">
                      {group.supplier.contactPerson && `${group.supplier.contactPerson} • `}
                      {group.supplier.phone}
                    </div>
                  </div>
                  <button
                    onClick={() => createPurchaseOrder(group.supplier.id, group.items)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Tạo đơn hàng
                  </button>
                </div>
                
                <div className="space-y-2">
                  {group.items.slice(0, 3).map((item) => (
                    <div key={item.productId} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-gray-500">
                          Số lượng: {item.recommendedQuantity} • {getPriorityBadge(item.priority)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.estimatedCost)}</div>
                      </div>
                    </div>
                  ))}
                  
                  {group.items.length > 3 && (
                    <div className="text-sm text-gray-500 text-center">
                      +{group.items.length - 3} sản phẩm khác
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center font-medium">
                    <span>{group.items.length} sản phẩm</span>
                    <span>{formatCurrency(group.totalCost)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Chi tiết Đề xuất</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đề xuất</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ưu tiên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi phí</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhà cung cấp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lý do</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recommendations.map((item) => (
                  <tr key={item.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                        <div className="text-sm text-gray-500">{item.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium">{item.currentStock}</div>
                        <div className="text-gray-500">Min: {item.minStockLevel}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium">{item.recommendedQuantity}</div>
                        <div className="text-gray-500">Dự đoán: {item.predictedDemand}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {getPriorityBadge(item.priority)}
                        <div className={`text-xs ${getUrgencyColor(item.urgencyScore)}`}>
                          Score: {item.urgencyScore}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium">{formatCurrency(item.estimatedCost)}</div>
                        <div className="text-gray-500">{formatCurrency(item.lastUnitPrice)}/đơn vị</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.supplier ? (
                        <div className="text-sm">
                          <div className="font-medium">{item.supplier.name}</div>
                          {item.lastPurchaseDate && (
                            <div className="text-gray-500">
                              {item.daysWithoutPurchase} ngày trước
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Chưa có NCC</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600">
                        {item.reasons.slice(0, 2).map((reason, idx) => (
                          <div key={idx} className="mb-1">{reason}</div>
                        ))}
                        {item.reasons.length > 2 && (
                          <div className="text-gray-400">+{item.reasons.length - 2} lý do khác</div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {recommendations.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Không có đề xuất đặt hàng nào
                <div className="mt-2 text-sm">Thử điều chỉnh bộ lọc để xem thêm kết quả</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
