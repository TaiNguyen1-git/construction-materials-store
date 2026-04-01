'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'
import FormattedNumberInput from '@/components/FormattedNumberInput'
import { Package, Building, Plus, Tag, Upload, X } from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'
import FormModal from '@/components/FormModal'

import {
  Product, Category, Supplier
} from './types'

import ProductSection from './components/ProductSection'
import SupplierSection from './components/SupplierSection'

export default function ProductsSuppliersPage() {
  const [expandedSections, setExpandedSections] = useState({
    products: true,
    suppliers: false
  })

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [totalProductItems, setTotalProductItems] = useState(0)
  const [productsLoading, setProductsLoading] = useState(true)
  const [productSearch, setProductSearch] = useState('')
  const [productPage, setProductPage] = useState(1)
  const [productPageSize] = useState(20)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [productFormLoading, setProductFormLoading] = useState(false)

  const [productForm, setProductForm] = useState({
    name: '', sku: '', price: 0, unit: '', categoryId: '',
    supplierId: '', minStockLevel: 0, isActive: true,
    images: [] as string[], description: ''
  })

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [totalSupplierItems, setTotalSupplierItems] = useState(0)
  const [suppliersLoading, setSuppliersLoading] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [supplierPage, setSupplierPage] = useState(1)
  const [supplierPageSize] = useState(20)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)
  const [supplierFormLoading, setSupplierFormLoading] = useState(false)

  const [supplierForm, setSupplierForm] = useState({
    name: '', contactPerson: '', email: '', phone: '',
    address: '', city: '', creditLimit: 0, isActive: true
  })

  // Categories state
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalSuppliers: 0,
    activeSuppliers: 0,
    lowStockProducts: 0,
    totalInventoryValue: 0
  })

  useEffect(() => {
    fetchStats()
    fetchCategories()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts()
    }, 300)
    return () => clearTimeout(timer)
  }, [productPage, productSearch])

  useEffect(() => {
    if (expandedSections.suppliers) {
      const timer = setTimeout(() => {
        fetchSuppliers()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [expandedSections.suppliers, supplierPage, supplierSearch])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const fetchStats = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/stats/products')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setStats(data.data)
        }
      }
    } catch (err) { console.error('Lỗi tải thống kê:', err) }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetchWithAuth('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(Array.isArray(data.data) ? data.data : [])
      }
    } catch (err) { console.error(err) }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    setAddingCategory(true)
    try {
      const res = await fetchWithAuth('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName.trim() })
      })
      if (res.ok) {
        const data = await res.json()
        setCategories([...categories, data.data])
        setProductForm(p => ({ ...p, categoryId: data.data.id }))
        setNewCategoryName('')
        setShowAddCategory(false)
        toast.success('Thêm danh mục thành công!')
      }
    } catch { toast.error('Lỗi khi thêm danh mục') }
    finally { setAddingCategory(false) }
  }

  const fetchProducts = async () => {
    try {
      setProductsLoading(true)
      const params = new URLSearchParams()
      params.append('page', productPage.toString())
      params.append('limit', productPageSize.toString())
      params.append('isActive', 'all')
      if (productSearch) {
        params.append('search', productSearch)
      }

      const res = await fetchWithAuth(`/api/products?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.data?.data || data.data || [])
        setTotalProductItems(data.data?.pagination?.total || data.pagination?.total || 0)
      }
    } catch { toast.error('Lỗi tải sản phẩm') }
    finally { setProductsLoading(false) }
  }

  const fetchSuppliers = async () => {
    try {
      setSuppliersLoading(true)
      const params = new URLSearchParams()
      params.append('page', supplierPage.toString())
      params.append('limit', supplierPageSize.toString())
      if (supplierSearch) {
        params.append('search', supplierSearch)
      }

      const res = await fetchWithAuth(`/api/suppliers?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setSuppliers(Array.isArray(data.data) ? data.data : [])
        setTotalSupplierItems(data.pagination?.total || 0)
      }
    } catch { toast.error('Lỗi tải nhà cung cấp') }
    finally { setSuppliersLoading(false) }
  }

  const [uploadingImage, setUploadingImage] = useState(false)
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload')
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetchWithAuth('/api/upload', {
        method: 'POST',
        body: formData,
        // FormData handles Content-Type
      })
      if (res.ok) {
        const data = await res.json()
        setProductForm(f => ({ ...f, images: [...f.images, data.fileUrl] }))
        toast.success('Đã tải ảnh lên thành công!')
      }
    } catch { toast.error('Lỗi khi tải ảnh lên') }
    finally { setUploadingImage(false) }
  }

  const removeImage = (index: number) => {
    setProductForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }))
  }

  // --- CRUD HANDLERS ---
  const openProductModal = (product?: Product) => {
    if (suppliers.length === 0) fetchSuppliers()
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name, sku: product.sku, price: product.price, unit: product.unit,
        categoryId: product.category.id, supplierId: product.supplierId || '',
        minStockLevel: product.inventoryItem?.minStockLevel || 0, isActive: product.isActive,
        images: (product as any).images || [], description: (product as any).description || ''
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        name: '', sku: '', price: 0, unit: '', categoryId: '', supplierId: '',
        minStockLevel: 0, isActive: true, images: [], description: ''
      })
    }
    setShowProductModal(true)
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProductFormLoading(true)
    try {
      const res = await fetchWithAuth(editingProduct ? `/api/products/${editingProduct.id}` : '/api/products', {
        method: editingProduct ? 'PUT' : 'POST',
        body: JSON.stringify(productForm)
      })
      if (res.ok) {
        toast.success(editingProduct ? 'Cập nhật thành công' : 'Thêm thành công')
        setShowProductModal(false)
        fetchProducts()
      }
    } catch { toast.error('Lỗi lưu sản phẩm') }
    finally { setProductFormLoading(false) }
  }

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return
    try {
      const res = await fetchWithAuth(`/api/products/${deletingProduct.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Đã ngừng bán sản phẩm')
        setDeletingProduct(null)
        fetchProducts()
        fetchStats()
      }
    } catch { toast.error('Lỗi xóa sản phẩm') }
  }

  const openSupplierModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setSupplierForm({
        name: supplier.name, contactPerson: supplier.contactPerson || '',
        email: supplier.email || '', phone: supplier.phone || '',
        address: supplier.address || '', city: supplier.city || '',
        creditLimit: supplier.creditLimit, isActive: supplier.isActive
      })
    } else {
      setEditingSupplier(null)
      setSupplierForm({
        name: '', contactPerson: '', email: '', phone: '', address: '', city: '', creditLimit: 0, isActive: true
      })
    }
    setShowSupplierModal(true)
  }

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSupplierFormLoading(true)
    try {
      const res = await fetchWithAuth(editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers', {
        method: editingSupplier ? 'PUT' : 'POST',
        body: JSON.stringify(supplierForm)
      })
      if (res.ok) {
        toast.success(editingSupplier ? 'Cập nhật thành công' : 'Thêm thành công')
        setShowSupplierModal(false)
        fetchSuppliers()
      }
    } catch { toast.error('Lỗi lưu nhà cung cấp') }
    finally { setSupplierFormLoading(false) }
  }

  const handleDeleteSupplier = async () => {
    if (!deletingSupplier) return
    try {
      const res = await fetchWithAuth(`/api/suppliers/${deletingSupplier.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Xóa nhà cung cấp thành công')
        setDeletingSupplier(null)
        fetchSuppliers()
      }
    } catch { toast.error('Lỗi xóa nhà cung cấp') }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Sản Phẩm & Nhà Cung Cấp</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý toàn bộ sản phẩm và nhà cung cấp</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Tổng Sản Phẩm</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
            <div className="text-xs text-green-600 mt-1">{stats.activeProducts} đang bán</div>
          </div>
          <Package className="w-8 h-8 text-blue-600" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Nhà Cung Cấp</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalSuppliers}</div>
            <div className="text-xs text-green-600 mt-1">{stats.activeSuppliers} đang hợp tác</div>
          </div>
          <Building className="w-8 h-8 text-green-600" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Sắp Hết Hàng</div>
            <div className="text-2xl font-bold text-red-600">
              {stats.lowStockProducts}
            </div>
          </div>
          <Package className="w-8 h-8 text-red-600" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Giá Trị Tồn Kho</div>
            <div className="text-xl font-bold text-purple-600">
              {stats.totalInventoryValue.toLocaleString('vi-VN')}đ
            </div>
          </div>
          <Package className="w-8 h-8 text-purple-600" />
        </div>
      </div>

      <ProductSection
        products={products} loading={productsLoading} expanded={expandedSections.products}
        onToggle={() => toggleSection('products')} onRefresh={fetchProducts}
        onAdd={() => openProductModal()} onEdit={openProductModal} onDelete={setDeletingProduct}
        search={productSearch} onSearchChange={(val) => { setProductSearch(val); setProductPage(1); }}
        page={productPage} onPageChange={setProductPage} pageSize={productPageSize}
        totalItems={totalProductItems}
      />

      <SupplierSection
        suppliers={suppliers} loading={suppliersLoading} expanded={expandedSections.suppliers}
        onToggle={() => toggleSection('suppliers')}
        onAdd={() => openSupplierModal()} onEdit={openSupplierModal} onDelete={setDeletingSupplier}
        search={supplierSearch} onSearchChange={(val) => { setSupplierSearch(val); setSupplierPage(1); }}
        page={supplierPage} onPageChange={setSupplierPage} pageSize={supplierPageSize}
        totalItems={totalSupplierItems}
      />

      {/* PRODUCT MODAL */}
      <FormModal
        isOpen={showProductModal} onClose={() => setShowProductModal(false)}
        title={editingProduct ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm'} onSubmit={handleProductSubmit}
        loading={productFormLoading}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
              <input type="text" required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">SKU</label>
              <input type="text" required value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Giá Niêm Yết</label>
              <FormattedNumberInput value={productForm.price} onChange={val => setProductForm({ ...productForm, price: val })} suffix="đ" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Đơn vị</label>
              <input type="text" required value={productForm.unit} onChange={e => setProductForm({ ...productForm, unit: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="bao, viên, m3..." />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 flex justify-between">
                Danh mục
                <button type="button" onClick={() => setShowAddCategory(true)} className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1">
                  <Plus size={12} /> Thêm mới
                </button>
              </label>
              <select required value={productForm.categoryId} onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="">Chọn danh mục</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nhà cung cấp</label>
              <select required value={productForm.supplierId} onChange={e => setProductForm({ ...productForm, supplierId: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="">Chọn nhà cung cấp</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mức tồn kho tối thiểu</label>
              <input type="number" required value={productForm.minStockLevel} onChange={e => setProductForm({ ...productForm, minStockLevel: parseInt(e.target.value) || 0 })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div className="flex items-center pt-6">
              <input id="isActive" type="checkbox" checked={productForm.isActive} onChange={e => setProductForm({ ...productForm, isActive: e.target.checked })} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 font-medium">Đang kinh doanh</label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
            <textarea
              rows={3}
              value={productForm.description}
              onChange={e => setProductForm({ ...productForm, description: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Thông số kỹ thuật, ứng dụng, tiêu chuẩn..."
            />
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wider">Hình ảnh sản phẩm</label>
            
            {/* Image Preview Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-4">
              {productForm.images.length > 0 ? productForm.images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl border-2 border-white shadow-sm overflow-hidden bg-white group ring-1 ring-slate-200">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600">
                    <X size={10} strokeWidth={3} />
                  </button>
                  {idx === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-[8px] text-white text-center font-black py-0.5 uppercase tracking-tighter">
                      Ảnh chính
                    </div>
                  )}
                </div>
              )) : (
                <div className="col-span-full py-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-white/50 text-slate-400">
                  <Package className="w-8 h-8 mb-2 opacity-20" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Chưa có ảnh nào</span>
                </div>
              )}
            </div>

            {/* Input Selection Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/50 rounded-lg w-fit mb-4">
              <button 
                type="button" 
                onClick={() => setInputMode('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${inputMode === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Upload size={14} /> Tải từ máy
              </button>
              <button 
                type="button" 
                onClick={() => setInputMode('url')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${inputMode === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Tag size={14} /> Dán từ Link
              </button>
            </div>

            {inputMode === 'upload' ? (
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  onChange={handleImageUpload} 
                  disabled={uploadingImage} 
                />
                <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all ${uploadingImage ? 'bg-slate-100 border-slate-300' : 'bg-white border-blue-200 group-hover:border-blue-400 group-hover:bg-blue-50/30'}`}>
                  <Upload className={`w-8 h-8 mb-2 ${uploadingImage ? 'text-slate-400 animate-pulse' : 'text-blue-500'}`} />
                  <span className="text-[11px] font-bold text-slate-600">
                    {uploadingImage ? 'Đang xử lý file...' : 'Nhấp hoặc kéo ảnh vào đây để tải lên'}
                  </span>
                  <p className="mt-1 text-[9px] text-slate-400">Chấp nhận JPG, PNG, WebP (Tối đa 10MB)</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={productForm.images.join('\n')}
                  onChange={e => setProductForm({ ...productForm, images: e.target.value.split('\n').map(s => s.trim()).filter(s => !!s) })}
                  className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-[11px] font-medium text-slate-600 bg-white"
                  placeholder="Nhập đường dẫn ảnh sản phẩm...&#10;Dán mỗi link trên một dòng mới"
                />
                <p className="text-[9px] text-amber-600 font-bold italic px-1">
                  * Hệ thống sẽ tự động cập nhật danh sách ảnh phía trên theo thời gian thực.
                </p>
              </div>
            )}
          </div>
        </div>
      </FormModal>

      {/* SUPPLIER MODAL */}
      <FormModal
        isOpen={showSupplierModal} onClose={() => setShowSupplierModal(false)}
        title={editingSupplier ? 'Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp'} onSubmit={handleSupplierSubmit}
        loading={supplierFormLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên nhà cung cấp</label>
            <input type="text" required value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Người liên hệ</label>
              <input type="text" value={supplierForm.contactPerson} onChange={e => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Điện thoại</label>
              <input type="tel" value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hạn mức tín dụng</label>
              <FormattedNumberInput value={supplierForm.creditLimit} onChange={val => setSupplierForm({ ...supplierForm, creditLimit: val })} suffix="đ" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Thành phố</label>
              <input type="text" value={supplierForm.city} onChange={e => setSupplierForm({ ...supplierForm, city: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div className="flex items-center pt-6">
              <input id="supplierActive" type="checkbox" checked={supplierForm.isActive} onChange={e => setSupplierForm({ ...supplierForm, isActive: e.target.checked })} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label htmlFor="supplierActive" className="ml-2 block text-sm text-gray-900">Đang hoạt động</label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
            <input type="text" value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
        </div>
      </FormModal>

      {/* QUICK ADD CATEGORY MODAL */}
      <FormModal
        isOpen={showAddCategory} onClose={() => setShowAddCategory(false)}
        title="Thêm danh mục mới" onSubmit={handleAddCategory} loading={addingCategory}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Tên danh mục</label>
          <input type="text" required value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="VD: Gạch, Cát, Đá..." />
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deletingProduct} onClose={() => setDeletingProduct(null)}
        title="Dừng bán sản phẩm" description={`Bạn có chắc muốn dừng bán sản phẩm ${deletingProduct?.name}? Sản phẩm sẽ không hiện trên trang cửa hàng.`}
        onConfirm={handleDeleteProduct}
      />

      <ConfirmDialog
        isOpen={!!deletingSupplier} onClose={() => setDeletingSupplier(null)}
        title="Xóa nhà cung cấp" description={`Bạn có chắc muốn xóa nhà cung cấp ${deletingSupplier?.name}? Hành động này không thể hoàn tác.`}
        onConfirm={handleDeleteSupplier}
      />
    </div>
  )
}
