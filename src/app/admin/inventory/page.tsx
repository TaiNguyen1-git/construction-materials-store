'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'
import { 
  RefreshCw, AlertTriangle, CheckCircle, TrendingUp, Package, 
  DollarSign, Target, ShoppingCart, Calendar, ChevronDown, ChevronUp
} from 'lucide-react'
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
  
  // Pagination states
  const [stockPage, setStockPage] = useState(1)
  const [predictionPage, setPredictionPage] = useState(1)
  const [recommendationPage, setRecommendationPage] = useState(1)
  const [movementPage, setMovementPage] = useState(1)
  const [pageSize] = useState(20)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // Expand/collapse sections
  const [expandedSections, setExpandedSections] = useState({
    stock: true,
    predictions: true,
    recommendations: true,
    movements: false
  })

  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    type: 'ADJUSTMENT' as 'IN' | 'OUT' | 'ADJUSTMENT',
    quantity: 0,
    reason: ''
  })

  const [filters, setFilters] = useState({
    category: '',
    status: '',
    lowStock: false,
    timeframe: 'MONTH'
  })

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
        fetchWithAuth(`/api/recommendations/purchase?${params}`)
      ])

      if (productsRes.ok) {
        const data = await productsRes.json()
        // Ensure products is always an array - extract from nested data structure
        const productsData = data.data?.data || data.data || data || []
        const productsArray = Array.isArray(productsData) ? productsData : []
        
        // Transform products to include stock data from inventoryItem
        const transformedProducts = productsArray.map((product: any) => ({
          ...product,
          stock: product.inventoryItem?.quantity || product.inventoryItem?.availableQuantity || 0,
          minStock: product.inventoryItem?.minStockLevel || 0,
          maxStock: product.inventoryItem?.maxStockLevel || 0,
          location: product.inventoryItem?.location || 'N/A'
        }))
        
        setProducts(transformedProducts)
      }

      if (movementsRes.ok) {
        const data = await movementsRes.json()
        const movementsData = data.data || data || []
        const movementsArray = Array.isArray(movementsData) ? movementsData : []
        setMovements(movementsArray)
      }

      if (predictionsRes.ok) {
        const data = await predictionsRes.json()
        // API returns data.predictions array
        const predictionsData = data.data?.predictions || data.predictions || []
        const predictionsArray = Array.isArray(predictionsData) ? predictionsData : []
        setPredictions(predictionsArray)
      }

      if (recommendationsRes.ok) {
        const data = await recommendationsRes.json()
        // API returns recommendations array directly
        const recommendationsData = data.data?.recommendations || data.data || []
        const recommendationsArray = Array.isArray(recommendationsData) ? recommendationsData : []
        setRecommendations(recommendationsArray)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Không thể tải dữ liệu tồn kho')
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
    toast.success('Dữ liệu tồn kho đã được cập nhật')
  }

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetchWithAuth('/api/inventory/movements', {
        method: 'POST',
        body: JSON.stringify(adjustForm)
      })

      if (response.ok) {
        toast.success('Ghi nhận điều chỉnh tồn kho thành công')
        setShowAdjustModal(false)
        setAdjustForm({
          productId: '',
          type: 'ADJUSTMENT',
          quantity: 0,
          reason: ''
        })
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to record stock adjustment')
      }
    } catch (error) {
      console.error('Error recording stock adjustment:', error)
      toast.error('Failed to record stock adjustment')
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.stock <= 0) return { color: 'bg-red-100 text-red-800', text: 'Hết Hàng', icon: AlertTriangle }
    if (product.stock <= product.minStock) return { color: 'bg-yellow-100 text-yellow-800', text: 'Sắp Hết', icon: AlertTriangle }
    return { color: 'bg-green-100 text-green-800', text: 'Còn Hàng', icon: CheckCircle }
  }

  const getPriorityBadge = (priority: string) => {
    const config = {
      'NORMAL': { label: 'Bình thường', color: 'bg-gray-100 text-gray-800' },
      'HIGH': { label: 'Cao', color: 'bg-orange-100 text-orange-800' },
      'URGENT': { label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' },
    }
    const p = config[priority as keyof typeof config] || config['NORMAL']
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.color}`}>{p.label}</span>
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const formatCurrency = (value: number | undefined | null) => {
    if (!value || isNaN(value)) return '0đ'
    return `${value.toLocaleString('vi-VN')}đ`
  }

  const formatNumber = (value: number | undefined | null) => {
    if (!value || isNaN(value)) return '0'
    return value.toLocaleString('vi-VN')
  }

  const filteredProducts = products.filter(product => {
    if (filters.category && product.category !== filters.category) return false
    if (filters.status && product.status !== filters.status) return false
    if (filters.lowStock && product.stock > product.minStock) return false
    return true
  })

  // Pagination calculations
  const totalStock = filteredProducts.length
  const totalStockPages = Math.ceil(totalStock / pageSize)
  const paginatedStock = filteredProducts.slice((stockPage - 1) * pageSize, stockPage * pageSize)

  const totalPredictions = predictions.length
  const totalPredictionPages = Math.ceil(totalPredictions / pageSize)
  const paginatedPredictions = predictions.slice((predictionPage - 1) * pageSize, predictionPage * pageSize)

  const totalRecommendations = recommendations.length
  const totalRecommendationPages = Math.ceil(totalRecommendations / pageSize)
  const paginatedRecommendations = recommendations.slice((recommendationPage - 1) * pageSize, recommendationPage * pageSize)

  const totalMovements = movements.length
  const totalMovementPages = Math.ceil(totalMovements / pageSize)
  const paginatedMovements = movements.slice((movementPage - 1) * pageSize, movementPage * pageSize)

  const categories = Array.isArray(products) ? [...new Set(products.map(p => typeof p.category === 'string' ? p.category : p.category?.name || 'N/A'))] : []
  const lowStockProducts = products.filter(p => p.stock <= p.minStock)
  const urgentRecommendations = recommendations.filter(r => r.priority === 'URGENT')
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0)
  const avgPredictionConfidence = predictions.length > 0 
    ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length 
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Kho Hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý tồn kho với dự đoán & đề xuất thông minh</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={filters.timeframe}
            onChange={(e) => setFilters({ ...filters, timeframe: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
          >
            <option value="WEEK">Tuần</option>
            <option value="MONTH">Tháng</option>
            <option value="QUARTER">Quý</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Làm Mới
          </button>
          <button
            onClick={() => setShowAdjustModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Điều Chỉnh Tồn Kho
          </button>
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh Mục</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
            >
              <option value="">Tất Cả Danh Mục</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng Thái</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
            >
              <option value="">Tất Cả Trạng Thái</option>
              <option value="ACTIVE">Hoạt Động</option>
              <option value="INACTIVE">Ngừng Hoạt Động</option>
              <option value="DISCONTINUED">Ngừng Sản Xuất</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.lowStock}
                onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Chỉ Sản Phẩm Sắp Hết</span>
            </label>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ ...filters, category: '', status: '', lowStock: false, timeframe: filters.timeframe })}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Xóa Bộ Lọc
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Stock Levels */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => toggleSection('stock')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
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
                  {paginatedStock.map((product) => {
                    const stockStatus = getStockStatus(product)
                    const StatusIcon = stockStatus.icon
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.sku}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {typeof product.category === 'string' ? product.category : product.category?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StatusIcon className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">{product.stock}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.minStock}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                            {stockStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency((product.stock || 0) * (product.price || 0))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedProduct(product)
                              setAdjustForm({ ...adjustForm, productId: product.id })
                              setShowAdjustModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Stock Pagination */}
            {totalStockPages > 1 && (
              <Pagination
                currentPage={stockPage}
                totalPages={totalStockPages}
                totalItems={totalStock}
                itemsPerPage={pageSize}
                onPageChange={setStockPage}
                loading={loading}
              />
            )}
          </div>
        )}
      </div>

      {/* Section 2: AI Predictions */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => toggleSection('predictions')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Dự Đoán AI</h2>
            <span className="text-sm text-gray-500">({predictions.length} dự đoán)</span>
          </div>
          {expandedSections.predictions ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        
        {expandedSections.predictions && predictions.length > 0 && (
          <div className="border-t p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">Tổng Dự Đoán</div>
                <div className="text-2xl font-bold text-blue-700">{predictions.length}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-orange-600">Cần Đặt Hàng</div>
                <div className="text-2xl font-bold text-orange-700">
                  {predictions.filter(p => p.recommendedOrder > 0).length}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">Độ Tin Cậy TB</div>
                <div className="text-2xl font-bold text-green-700">
                  {(avgPredictionConfidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản Phẩm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dự Đoán</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Độ Tin Cậy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đề Xuất</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý Do & Phân Tích</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPredictions.map((pred) => (
                    <tr key={pred.productId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{pred.productName}</div>
                        <div className="text-sm text-gray-500">{pred.category}</div>
                        <div className="text-xs text-gray-400 mt-1">Tồn kho: {pred.currentStock}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {pred.predictedDemand} đơn vị
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(pred.confidence)}`}>
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={pred.recommendedOrder > 0 ? 'text-orange-600' : 'text-green-600'}>
                          {pred.recommendedOrder > 0 ? `${formatNumber(pred.recommendedOrder)} đơn vị` : 'Đủ hàng'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                        <div className="space-y-1">
                          <div className="text-gray-700">
                            {pred.factors?.seasonalInsight || 'Dựa trên lịch sử và xu hướng thị trường'}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {pred.factors?.isPeakMonth && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                🔥 Tháng cao điểm
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              Phương pháp: {pred.method === 'PROPHET_ML' ? 'AI Advanced' : 'Thống kê'}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Predictions Pagination */}
            {totalPredictionPages > 1 && (
              <Pagination
                currentPage={predictionPage}
                totalPages={totalPredictionPages}
                totalItems={totalPredictions}
                itemsPerPage={pageSize}
                onPageChange={setPredictionPage}
                loading={loading}
              />
            )}
          </div>
        )}
        {expandedSections.predictions && predictions.length === 0 && (
          <div className="border-t p-8 text-center text-gray-500">
            Chưa có dữ liệu dự đoán. Hệ thống cần thêm dữ liệu lịch sử để tạo dự đoán.
          </div>
        )}
      </div>

      {/* Section 3: Purchase Recommendations */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => toggleSection('recommendations')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <ShoppingCart className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Đề Xuất Mua Hàng</h2>
            <span className="text-sm text-gray-500">({recommendations.length} đề xuất)</span>
          </div>
          {expandedSections.recommendations ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        
        {expandedSections.recommendations && recommendations.length > 0 && (
          <div className="border-t p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản Phẩm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số Lượng Đề Xuất</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ưu Tiên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chi Phí Ước Tính</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà Cung Cấp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý Do</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRecommendations.map((rec) => (
                    <tr key={rec.productId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{rec.productName}</div>
                        <div className="text-sm text-gray-500">{rec.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                        {rec.recommendedQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(rec.priority)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(rec.estimatedCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rec.supplierName || 'Chưa có'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="max-w-xs truncate">{rec.reason}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recommendations Pagination */}
            {totalRecommendationPages > 1 && (
              <Pagination
                currentPage={recommendationPage}
                totalPages={totalRecommendationPages}
                totalItems={totalRecommendations}
                itemsPerPage={pageSize}
                onPageChange={setRecommendationPage}
                loading={loading}
              />
            )}
          </div>
        )}
        {expandedSections.recommendations && recommendations.length === 0 && (
          <div className="border-t p-8 text-center text-gray-500">
            Chưa có đề xuất mua hàng
          </div>
        )}
      </div>

      {/* Section 4: Stock Movements */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => toggleSection('movements')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Biến Động Tồn Kho</h2>
            <span className="text-sm text-gray-500">({movements.length} biến động)</span>
          </div>
          {expandedSections.movements ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        
        {expandedSections.movements && (
          <div className="border-t">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản Phẩm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số Lượng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý Do</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tham Chiếu</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedMovements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{movement.product.name}</div>
                        <div className="text-sm text-gray-500">{movement.product.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          movement.type === 'IN' ? 'bg-green-100 text-green-800' :
                          movement.type === 'OUT' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {movement.type === 'IN' ? 'Nhập' : movement.type === 'OUT' ? 'Xuất' : 'Điều Chỉnh'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.type === 'OUT' ? '-' : '+'}{movement.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movement.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movement.reference || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(movement.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Movements Pagination */}
            {totalMovementPages > 1 && (
              <Pagination
                currentPage={movementPage}
                totalPages={totalMovementPages}
                totalItems={totalMovements}
                itemsPerPage={pageSize}
                onPageChange={setMovementPage}
                loading={loading}
              />
            )}
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Stock Adjustment</h3>
            <form onSubmit={handleStockAdjustment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Product</label>
                <select
                  value={adjustForm.productId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku}) - Current: {product.stock}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={adjustForm.type}
                    onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                  >
                    <option value="IN">Stock In</option>
                    <option value="OUT">Stock Out</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                >
                  Record Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}