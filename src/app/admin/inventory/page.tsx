// src/app/admin/inventory/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'
import {
  RefreshCw, AlertTriangle, CheckCircle, Package, ShoppingCart,
  ChevronDown, ChevronUp, Sparkles, Filter, Search, Plus,
  Truck, ArrowRight, BarChart3, Settings, Boxes, LayoutGrid, X,
  History, Download, ArrowUpRight, ArrowDownRight, User
} from 'lucide-react'
import Pagination from '@/components/Pagination'
import InventoryAnalytics from '@/components/admin/InventoryAnalytics'
import InventoryManagement from '@/components/admin/InventoryManagement'
import SmartInventoryAlerts from '@/components/admin/SmartInventoryAlerts'

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
  const [activeTab, setActiveTab] = useState<'stock' | 'alerts' | 'analytics' | 'management'>('stock')

  const [filters, setFilters] = useState({ category: '', status: '', lowStock: false, timeframe: 'MONTH' })
  const pageSize = 20
  const [stockPage, setStockPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

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
        fetchWithAuth('/api/products?limit=1000'),
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
    toast.success('Dữ liệu đã được cập nhật')
  }

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetchWithAuth('/api/inventory/movements', { method: 'POST', body: JSON.stringify(adjustForm) })
      if (res.ok) {
        toast.success('Đã lưu điều chỉnh kho thành công')
        setShowAdjustModal(false)
        setAdjustForm({ productId: '', type: 'ADJUSTMENT', quantity: 0, reason: '' })
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Thất bại')
      }
    } catch (e) {
      console.error(e)
      toast.error('Có lỗi xảy ra')
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.stock <= 0) return { color: 'bg-red-50 text-red-600 border-red-100', text: 'Hết Hàng', icon: AlertTriangle }
    if (product.stock <= product.minStock) return { color: 'bg-amber-50 text-amber-600 border-amber-100', text: 'Sắp Hết', icon: AlertTriangle }
    return { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', text: 'Ổn Định', icon: CheckCircle }
  }

  const formatCurrency = (v: number | undefined | null) => (!v || isNaN(v) ? '0đ' : `${Math.round(v).toLocaleString('vi-VN')}đ`)

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchSearch) return false
    if (filters.category && (p.category as any)?.name !== filters.category && p.category !== filters.category) return false
    if (filters.status && p.status !== filters.status) return false
    if (filters.lowStock && p.stock > p.minStock) return false
    return true
  })

  const totalStock = filteredProducts.length
  const paginatedStock = filteredProducts.slice((stockPage - 1) * pageSize, stockPage * pageSize)

  const lowStockProducts = products.filter(p => p.stock <= p.minStock)
  const urgentRecommendations = recommendations.filter(r => r.priority === 'URGENT')

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang Tải Kho...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="bg-blue-500 text-white p-2 rounded-2xl shadow-lg shadow-blue-200"><Boxes size={24} /></span>
            Quản Lý Kho Hàng
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Giám Sát Chuỗi Cung Ứng Thời Gian Thực</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-blue-100 text-blue-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-blue-200 hover:bg-blue-200 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAdjustModal(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus size={16} />
            Điều chỉnh tồn kho
          </button>
        </div>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Tổng Hạng Mục SKU', value: products.length, icon: Package, color: 'bg-blue-50 text-blue-600', sub: 'Danh Mục Đang Hoạt Động', trend: 'Còn Hàng: 94%' },
          { label: 'Cảnh Báo Hết Hàng', value: lowStockProducts.length, icon: AlertTriangle, color: 'bg-red-50 text-red-600', sub: 'Thấp Hơn Mức Tối Thiểu', trend: 'Cần Xử Lý Ngay' },
          { label: 'Yêu Cầu Khẩn Cấp', value: urgentRecommendations.length, icon: ShoppingCart, color: 'bg-amber-50 text-amber-600', sub: 'Cảnh Báo Mua Hàng', trend: 'Gợi Ý Tự Động' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon size={24} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.sub}</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{stat.value}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</div>
              <div className={`text-[9px] font-black uppercase ${i === 1 && lowStockProducts.length > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                {stat.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-[22px] w-full md:w-max border border-slate-200/50">
        {[
          { id: 'stock', label: 'Tổng Quan Tồn Kho', icon: LayoutGrid },
          { id: 'alerts', label: 'Cảnh Báo Thông Minh', icon: Sparkles },
          { id: 'analytics', label: 'Phân Tích Sức Mua', icon: BarChart3 },
          { id: 'management', label: 'Cơ Chế Vận Hành', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Tab Content */}
      <div className="animate-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'stock' && (
          <div className="space-y-6">
            {/* Layered Filters */}
            <div className="p-4 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm mã SKU, tên vật liệu hoặc quy cách..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filters.category}
                  onChange={e => setFilters({ ...filters, category: e.target.value })}
                  className="px-6 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">Mọi danh mục</option>
                  {Array.from(new Set(products.map(p => typeof p.category === 'string' ? p.category : (p.category as any)?.name || ''))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button
                  onClick={() => setFilters({ category: '', status: '', lowStock: !filters.lowStock, timeframe: filters.timeframe })}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${filters.lowStock ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                    }`}
                >
                  Low Stock Focus
                </button>
              </div>
            </div>

            {/* Master Inventory Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-4 text-left">Hàng Hóa / SKU</th>
                      <th className="px-6 py-4 text-left">Phân Loại</th>
                      <th className="px-4 py-4 text-right">Tồn Kho</th>
                      <th className="px-4 py-4 text-center">Định Mức</th>
                      <th className="px-4 py-4 text-center">Status</th>
                      <th className="px-4 py-4 text-right">Tổng Giá Trị</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedStock.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-24 text-center text-slate-400 font-bold uppercase tracking-widest italic italic">Không tìm thấy dữ liệu tồn kho phù hợp</td>
                      </tr>
                    ) : (
                      paginatedStock.map(product => {
                        const stockStatus = getStockStatus(product)
                        return (
                          <tr key={product.id} className="hover:bg-blue-50/20 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                  <Package size={18} />
                                </div>
                                <div>
                                  <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{product.name}</div>
                                  <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest mt-0.5">#{product.sku}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 py-1 bg-slate-100 rounded-lg">{typeof product.category === 'string' ? product.category : (product.category as any)?.name || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-4 text-right whitespace-nowrap">
                              <div className={`text-sm font-black ${product.stock <= product.minStock ? 'text-red-600' : 'text-slate-900'}`}>{product.stock} đv</div>
                              <div className="text-[9px] text-slate-300 font-bold uppercase tracking-widest italic">{product.stock > product.minStock ? 'Ổn Định' : 'Cần Nhập Hàng'}</div>
                            </td>
                            <td className="px-4 py-4 text-center whitespace-nowrap">
                              <div className="text-xs font-bold text-slate-400 bg-slate-50 inline-block px-3 py-1 rounded-full">{product.minStock} (Tối thiểu)</div>
                            </td>
                            <td className="px-4 py-4 text-center whitespace-nowrap">
                              <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${stockStatus.color}`}>
                                {stockStatus.text}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right whitespace-nowrap">
                              <div className="text-sm font-black text-slate-900">{formatCurrency((product.stock || 0) * (product.price || 0))}</div>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { setSelectedProduct(product); setAdjustForm({ ...adjustForm, productId: product.id }); setShowAdjustModal(true) }}
                                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                >
                                  Điều Chỉnh
                                  <ArrowRight size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {/* Custom Pagination Style */}
              <div className="p-6 bg-slate-50/50 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing page {stockPage} of {Math.ceil(totalStock / pageSize)}</span>
                <Pagination
                  currentPage={stockPage}
                  totalPages={Math.ceil(totalStock / pageSize)}
                  totalItems={totalStock}
                  itemsPerPage={pageSize}
                  onPageChange={setStockPage}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && <SmartInventoryAlerts />}
        {activeTab === 'analytics' && <InventoryAnalytics predictions={predictions} onRefresh={fetchData} />}
        {activeTab === 'management' && <InventoryManagement recommendations={recommendations} movements={movements} />}
      </div>

      {/* Premium Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-xl shadow-2xl rounded-[40px] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Điều Chỉnh Tồn Kho</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cập Nhật Thủ Công Thông Số Tồn Kho</p>
              </div>
              <button onClick={() => setShowAdjustModal(false)} className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-2xl border border-slate-100 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="p-10 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chọn Sản Phẩm</label>
                  <select
                    value={adjustForm.productId}
                    onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
                    className="w-full bg-slate-100/50 border-none rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    required
                  >
                    <option value="">-- Chọn Sản Phẩm --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name.toUpperCase()} (AVL: {p.stock})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Loại Điều Chỉnh</label>
                    <select
                      value={adjustForm.type}
                      onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value as 'IN' | 'OUT' | 'ADJUSTMENT' })}
                      className="w-full bg-slate-100/50 border-none rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      required
                    >
                      <option value="IN">Nhập Kho (Tăng)</option>
                      <option value="OUT">Xuất Kho (Giảm)</option>
                      <option value="ADJUSTMENT">Cân Bằng (Đặt lại)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Số Lượng</label>
                    <input
                      type="number"
                      value={adjustForm.quantity || ''}
                      onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                      className="w-full bg-slate-100/50 border-none rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      min={1}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lý Do Điều Chỉnh</label>
                  <textarea
                    value={adjustForm.reason}
                    onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                    className="w-full bg-slate-100/50 border-none rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none min-h-[100px]"
                    placeholder="Nhập lý do điều chỉnh..."
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowAdjustModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Hủy</button>
                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95">Xác Nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}