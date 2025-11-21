// src/app/admin/inventory/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'
import { RefreshCw, AlertTriangle, CheckCircle, Package, ShoppingCart, ChevronDown, ChevronUp, Target } from 'lucide-react'
import Pagination from '@/components/Pagination'

interface Product {
  id: string
  name: string
  sku: string
  category: string | { id: string; name: string }
  price: number
  stock: number
  minStock: number
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
}

interface InventoryMovement {
  id: string
  product: Product
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  reason: string
  reference?: string
  createdAt: string
}

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

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [predictions, setPredictions] = useState<InventoryPrediction[]>([])
  const [recommendations, setRecommendations] = useState<PurchaseRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [activeTab, setActiveTab] = useState<'stock' | 'analytics' | 'management'>('stock')

  const [filters, setFilters] = useState({ category: '', status: '', lowStock: false, timeframe: 'MONTH' })
  const pageSize = 20
  const [stockPage, setStockPage] = useState(1)
  const [predictionPage, setPredictionPage] = useState(1)
  const [recommendationPage, setRecommendationPage] = useState(1)
  const [movementPage, setMovementPage] = useState(1)

  const [expandedSections, setExpandedSections] = useState({ stock: true, predictions: true, recommendations: true, movements: false })

  const [adjustForm, setAdjustForm] = useState({ productId: '', type: 'ADJUSTMENT' as 'IN' | 'OUT' | 'ADJUSTMENT', quantity: 0, reason: '' })

  useEffect(() => {
    fetchData()
  }, [filters.timeframe])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ timeframe: filters.timeframe })
      const [productsRes, movementsRes, predictionsRes, recommendationsRes] = await Promise.all([
        fetchWithAuth('/api/products'),
        fetchWithAuth('/api/inventory/movements'),
        fetchWithAuth(`/api/predictions/inventory?${params}`),
        fetchWithAuth(`/api/recommendations/purchase?${params}`),
      ])
      if (productsRes.ok) {
        const data = await productsRes.json()
        const productsArray = Array.isArray(data.data?.data || data.data || data) ? data.data?.data || data.data || data : []
        const transformed = productsArray.map((p: any) => ({
          ...p,
          stock: p.inventoryItem?.quantity || p.inventoryItem?.availableQuantity || 0,
          minStock: p.inventoryItem?.minStockLevel || 0,
        }))
        setProducts(transformed)
      }
      if (movementsRes.ok) setMovements((await movementsRes.json()).data || [])
      if (predictionsRes.ok) setPredictions(((await predictionsRes.json()).data?.predictions) || [])
      if (recommendationsRes.ok) setRecommendations(((await recommendationsRes.json()).data?.recommendations) || [])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
    toast.success('Data refreshed')
  }

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetchWithAuth('/api/inventory/movements', { method: 'POST', body: JSON.stringify(adjustForm) })
      if (res.ok) {
        toast.success('Adjustment recorded')
        setShowAdjustModal(false)
        setAdjustForm({ productId: '', type: 'ADJUSTMENT', quantity: 0, reason: '' })
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed')
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed')
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.stock <= 0) return { color: 'bg-red-100 text-red-800', text: 'Hết Hàng', icon: AlertTriangle }
    if (product.stock <= product.minStock) return { color: 'bg-yellow-100 text-yellow-800', text: 'Sắp Hết', icon: AlertTriangle }
    return { color: 'bg-green-100 text-green-800', text: 'Còn Hàng', icon: CheckCircle }
  }

  const formatCurrency = (v: number | undefined | null) => (!v || isNaN(v) ? '0đ' : `${v.toLocaleString('vi-VN')}đ`)

  const filteredProducts = products.filter(p => {
    if (filters.category && (p.category as any)?.name !== filters.category && p.category !== filters.category) return false
    if (filters.status && p.status !== filters.status) return false
    if (filters.lowStock && p.stock > p.minStock) return false
    return true
  })

  const totalStock = filteredProducts.length
  const paginatedStock = filteredProducts.slice((stockPage - 1) * pageSize, stockPage * pageSize)

  const lowStockProducts = products.filter(p => p.stock <= p.minStock)
  const urgentRecommendations = recommendations.filter(r => r.priority === 'URGENT')
  const avgPredictionConfidence = predictions.length ? predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab('stock')} className={activeTab === 'stock' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}>📦 Tồn Kho</button>
          <button onClick={() => setActiveTab('analytics')} className={activeTab === 'analytics' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}>📊 Phân Tích & Dự Đoán</button>
          <button onClick={() => setActiveTab('management')} className={activeTab === 'management' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-600'}>🛠️ Quản Lý</button>
        </nav>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Kho Hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý tồn kho với dự đoán & đề xuất thông minh</p>
        </div>
        <div className="flex space-x-2">
          <select value={filters.timeframe} onChange={e => setFilters({ ...filters, timeframe: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white">
            <option value="WEEK">Tuần</option>
            <option value="MONTH">Tháng</option>
            <option value="QUARTER">Quý</option>
          </select>
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Làm Mới
          </button>
          <button onClick={() => setShowAdjustModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">Điều Chỉnh Tồn Kho</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Tổng Sản Phẩm</div>
              <div className="text-2xl font-bold text-gray-900">{products.length}</div>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Sắp Hết Hàng</div>
              <div className="text-2xl font-bold text-red-600">{lowStockProducts.length}</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Đề Xuất Khẩn Cấp</div>
              <div className="text-2xl font-bold text-orange-600">{urgentRecommendations.length}</div>
            </div>
            <ShoppingCart className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Độ Chính Xác AI</div>
              <div className="text-2xl font-bold text-green-600">{(avgPredictionConfidence * 100).toFixed(0)}%</div>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh Mục</label>
                <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white">
                  <option value="">Tất Cả Danh Mục</option>
                  {Array.from(new Set(products.map(p => typeof p.category === 'string' ? p.category : (p.category as any)?.name || ''))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng Thái</label>
                <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white">
                  <option value="">Tất Cả Trạng Thái</option>
                  <option value="ACTIVE">Hoạt Động</option>
                  <option value="INACTIVE">Ngừng Hoạt Động</option>
                  <option value="DISCONTINUED">Ngừng Sản Xuất</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input type="checkbox" checked={filters.lowStock} onChange={e => setFilters({ ...filters, lowStock: e.target.checked })} className="mr-2" />
                  <span className="text-sm text-gray-700">Chỉ Sản Phẩm Sắp Hết</span>
                </label>
              </div>
              <div className="flex items-end">
                <button onClick={() => setFilters({ category: '', status: '', lowStock: false, timeframe: filters.timeframe })} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Xóa Bộ Lọc</button>
              </div>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-lg shadow">
            <button onClick={() => toggleSection('stock')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Tồn Kho Hiện Tại</h2>
                <span className="text-sm text-gray-500">({filteredProducts.length} sản phẩm)</span>
              </div>
              {expandedSections.stock ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            {expandedSections.stock && (
              <div className="border-t">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản Phẩm</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh Mục</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn Kho</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tối Thiểu</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá Trị</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedStock.map(product => {
                        const stockStatus = getStockStatus(product)
                        const Icon = stockStatus.icon as any
                        return (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.sku}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{typeof product.category === 'string' ? product.category : (product.category as any)?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Icon className="h-4 w-4 mr-1" />
                                <span className="text-sm font-medium">{product.stock}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.minStock}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>{stockStatus.text}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency((product.stock || 0) * (product.price || 0))}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button onClick={() => { setSelectedProduct(product); setAdjustForm({ ...adjustForm, productId: product.id }); setShowAdjustModal(true) }} className="text-blue-600 hover:text-blue-900">Adjust</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination total={totalStock} page={stockPage} pageSize={pageSize} onPageChange={setStockPage} />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <p>Analytics & Prediction components will be added here.</p>
        </div>
      )}

      {activeTab === 'management' && (
        <div className="space-y-6">
          <p>Management components will be added here.</p>
        </div>
      )}
    </div>
  )
}