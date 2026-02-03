'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'
import FormattedNumberInput from '@/components/FormattedNumberInput'
import { Package, Building, Plus, Search, ChevronDown, ChevronUp, Tag, Edit, Trash2, Star, Mail, Phone, MapPin, User } from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'
import FormModal from '@/components/FormModal'
import Pagination from '@/components/Pagination'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  unit: string
  category: { id: string; name: string }
  supplier?: { id: string; name: string } | null
  supplierId?: string | null
  inventoryItem?: {
    quantity: number
    availableQuantity?: number
    minStockLevel: number
  }
  isActive: boolean
}

interface Category {
  id: string
  name: string
}

interface Supplier {
  id: string
  name: string
  contactPerson: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  creditLimit: number
  currentBalance: number
  rating: number | null
  isActive: boolean
}

export default function ProductsSuppliersPage() {
  const [expandedSections, setExpandedSections] = useState({
    products: true,
    suppliers: false
  })

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productSearch, setProductSearch] = useState('')
  const [productPage, setProductPage] = useState(1)
  const [productPageSize] = useState(20)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [productFormLoading, setProductFormLoading] = useState(false)

  // Product Form
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    price: 0,
    unit: '',
    categoryId: '',
    supplierId: '' as string,
    minStockLevel: 0,
    isActive: true,
    images: [] as string[],
    description: ''
  })

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [supplierPage, setSupplierPage] = useState(1)
  const [supplierPageSize] = useState(20)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)
  const [supplierFormLoading, setSupplierFormLoading] = useState(false)

  // Supplier Form
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    creditLimit: 0,
    isActive: true
  })

  // Categories state for dropdown
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetchWithAuth('/api/categories')
      if (response.ok) {
        const data = await response.json()
        const categoriesData = data.data || []
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Quick add category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Vui lòng nhập tên danh mục')
      return
    }
    setAddingCategory(true)
    try {
      const response = await fetchWithAuth('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName.trim() })
      })
      if (response.ok) {
        const data = await response.json()
        const newCat = data.data
        toast.success('Thêm danh mục thành công!')
        setCategories([...categories, newCat])
        setProductForm({ ...productForm, categoryId: newCat.id })
        setNewCategoryName('')
        setShowAddCategory(false)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error?.message || 'Không thể thêm danh mục')
      }
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('Lỗi khi thêm danh mục')
    } finally {
      setAddingCategory(false)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (expandedSections.suppliers && suppliers.length === 0) {
      fetchSuppliers()
    }
  }, [expandedSections.suppliers])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Products functions
  const fetchProducts = async () => {
    try {
      setProductsLoading(true)
      // Fetch all products (no limit) for accurate total count
      const response = await fetchWithAuth('/api/products?limit=1000&isActive=all')
      if (response.ok) {
        const data = await response.json()
        // Handle nested data structure from API
        const productsData = data.data?.data || data.data || []
        const productsArray = Array.isArray(productsData) ? productsData : []
        setProducts(productsArray)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Không thể tải sản phẩm')
    } finally {
      setProductsLoading(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  )

  // Paginate products
  const totalProducts = filteredProducts.length
  const totalProductPages = Math.ceil(totalProducts / productPageSize)
  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * productPageSize,
    productPage * productPageSize
  )

  // Product CRUD Functions
  const openProductModal = (product?: Product) => {
    // Ensure suppliers are loaded when opening product modal
    if (suppliers.length === 0) {
      fetchSuppliers()
    }
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name,
        sku: product.sku,
        price: product.price,
        unit: product.unit,
        categoryId: product.category.id,
        supplierId: product.supplierId || '',
        minStockLevel: product.inventoryItem?.minStockLevel || 0,
        isActive: product.isActive,
        images: (product as any).images || [],
        description: (product as any).description || ''
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        name: '',
        sku: '',
        price: 0,
        unit: '',
        categoryId: '',
        supplierId: '',
        minStockLevel: 0,
        isActive: true,
        images: [],
        description: ''
      })
    }
    setShowProductModal(true)
  }

  const closeProductModal = () => {
    setShowProductModal(false)
    setEditingProduct(null)
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProductFormLoading(true)

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(productForm)
      })

      if (response.ok) {
        toast.success(editingProduct ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm thành công')
        closeProductModal()
        fetchProducts()
      } else {
        const errorData = await response.json()
        const errorMessage = typeof errorData.error === 'string'
          ? errorData.error
          : errorData.error?.message || errorData.message || 'Có lỗi xảy ra'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Không thể lưu sản phẩm')
    } finally {
      setProductFormLoading(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return

    setProductFormLoading(true)
    try {
      const response = await fetchWithAuth(`/api/products/${deletingProduct.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'Đã ngừng bán sản phẩm')
        setDeletingProduct(null)
        fetchProducts()
      } else {
        const errorData = await response.json()
        const errorMessage = typeof errorData.error === 'string'
          ? errorData.error
          : errorData.error?.message || errorData.message || 'Không thể xóa sản phẩm'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Không thể xóa sản phẩm')
    } finally {
      setProductFormLoading(false)
    }
  }

  // Suppliers functions
  const fetchSuppliers = async () => {
    try {
      setSuppliersLoading(true)
      const response = await fetchWithAuth('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        // Ensure suppliers is always an array
        const suppliersData = Array.isArray(data.data) ? data.data : []
        setSuppliers(suppliersData)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      toast.error('Không thể tải nhà cung cấp')
    } finally {
      setSuppliersLoading(false)
    }
  }

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    (s.contactPerson && s.contactPerson.toLowerCase().includes(supplierSearch.toLowerCase()))
  )

  // Paginate suppliers
  const totalSuppliers = filteredSuppliers.length
  const totalSupplierPages = Math.ceil(totalSuppliers / supplierPageSize)
  const paginatedSuppliers = filteredSuppliers.slice(
    (supplierPage - 1) * supplierPageSize,
    supplierPage * supplierPageSize
  )

  // Supplier CRUD Functions
  const openSupplierModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setSupplierForm({
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        creditLimit: supplier.creditLimit,
        isActive: supplier.isActive
      })
    } else {
      setEditingSupplier(null)
      setSupplierForm({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        creditLimit: 0,
        isActive: true
      })
    }
    setShowSupplierModal(true)
  }

  const closeSupplierModal = () => {
    setShowSupplierModal(false)
    setEditingSupplier(null)
  }

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSupplierFormLoading(true)

    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers'
      const method = editingSupplier ? 'PUT' : 'POST'

      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(supplierForm)
      })

      if (response.ok) {
        toast.success(editingSupplier ? 'Cập nhật NCC thành công' : 'Thêm NCC thành công')
        closeSupplierModal()
        fetchSuppliers()
      } else {
        const errorData = await response.json()
        const errorMessage = typeof errorData.error === 'string'
          ? errorData.error
          : errorData.error?.message || errorData.message || 'Có lỗi xảy ra'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error saving supplier:', error)
      toast.error('Không thể lưu nhà cung cấp')
    } finally {
      setSupplierFormLoading(false)
    }
  }

  const handleDeleteSupplier = async () => {
    if (!deletingSupplier) return

    setSupplierFormLoading(true)
    try {
      const response = await fetchWithAuth(`/api/suppliers/${deletingSupplier.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Xóa nhà cung cấp thành công')
        setDeletingSupplier(null)
        fetchSuppliers()
      } else {
        const errorData = await response.json()
        const errorMessage = typeof errorData.error === 'string'
          ? errorData.error
          : errorData.error?.message || errorData.message || 'Không thể xóa nhà cung cấp'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast.error('Không thể xóa nhà cung cấp')
    } finally {
      setSupplierFormLoading(false)
    }
  }

  const getStockStatus = (product: Product) => {
    if (!product.inventoryItem) return { text: 'Chưa có', color: 'bg-gray-100 text-gray-800' }
    // Use availableQuantity first, fallback to quantity
    const qty = product.inventoryItem.availableQuantity ?? product.inventoryItem.quantity ?? 0
    const min = product.inventoryItem.minStockLevel || 0
    if (qty <= 0) return { text: 'Hết hàng', color: 'bg-red-100 text-red-800' }
    if (qty <= min) return { text: 'Sắp hết', color: 'bg-yellow-100 text-yellow-800' }
    return { text: 'Còn hàng', color: 'bg-green-100 text-green-800' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Sản Phẩm & Nhà Cung Cấp</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý toàn bộ sản phẩm và nhà cung cấp</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Tổng Sản Phẩm</div>
              <div className="text-2xl font-bold text-gray-900">{products.length}</div>
              <div className="text-xs text-green-600 mt-1">
                {products.filter(p => p.isActive).length} đang bán
              </div>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Nhà Cung Cấp</div>
              <div className="text-2xl font-bold text-gray-900">{suppliers.length}</div>
              <div className="text-xs text-green-600 mt-1">
                {suppliers.filter(s => s.isActive).length} đang hợp tác
              </div>
            </div>
            <Building className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Sản Phẩm Sắp Hết</div>
              <div className="text-2xl font-bold text-red-600">
                {products.filter(p => p.inventoryItem && (p.inventoryItem.availableQuantity ?? p.inventoryItem.quantity ?? 0) <= p.inventoryItem.minStockLevel).length}
              </div>
            </div>
            <Package className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Giá Trị Tồn Kho</div>
              <div className="text-xl font-bold text-purple-600">
                {products.reduce((sum, p) => sum + (p.inventoryItem?.availableQuantity ?? p.inventoryItem?.quantity ?? 0) * p.price, 0).toLocaleString('vi-VN')}đ
              </div>
            </div>
            <Package className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Section 1: Products */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => toggleSection('products')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <Package className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Sản Phẩm</h2>
            <span className="text-sm text-gray-500">({products.length} sản phẩm)</span>
          </div>
          {expandedSections.products ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {expandedSections.products && (
          <div className="border-t p-4">
            {/* Search & Actions */}
            <div className="flex justify-between items-center mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  type="button"
                  onClick={() => { setProductsLoading(true); fetchProducts() }}
                  disabled={productsLoading}
                  className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <svg className={`h-4 w-4 mr-1 ${productsLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Làm mới
                </button>
                <button
                  onClick={() => openProductModal()}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Thêm sản phẩm
                </button>
              </div>
            </div>

            {productsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU & Ảnh</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên Sản Phẩm</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh Mục</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá Niêm Yết</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn Vị</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tồn Kho</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng Thái</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                      {paginatedProducts.map((product) => {
                        const stockStatus = getStockStatus(product)
                        const images = (product as any).images || []
                        return (
                          <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-blue-200 transition-colors">
                                  {images[0] ? (
                                    <img src={images[0]} alt="" className="w-full h-full object-contain p-1" />
                                  ) : (
                                    <Package className="w-5 h-5 text-slate-300" />
                                  )}
                                </div>
                                <span className="text-xs font-black text-slate-500 font-mono tracking-tighter bg-slate-100 px-2 py-1 rounded">
                                  {product.sku}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                {product.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <Tag className="w-3 h-3 text-blue-400" />
                                {product.category.name}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm font-black text-slate-900 tracking-tight">
                                {product.price.toLocaleString('vi-VN')}<span className="text-[10px] ml-0.5 text-slate-400">₫</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="text-xs font-bold text-slate-400 uppercase">{product.unit}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                                  {product.inventoryItem?.availableQuantity ?? product.inventoryItem?.quantity ?? 0}
                                  <span className="text-[10px] font-bold text-slate-400">SP</span>
                                </div>
                                <span className={`inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-widest ${stockStatus.color.replace('bg-', 'text-').replace('-100', '-600')}`}>
                                  <span className={`w-1 h-1 rounded-full ${stockStatus.color.replace('bg-', 'bg-').replace('-100', '-500')}`}></span>
                                  {stockStatus.text}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest border ${product.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                }`}>
                                {product.isActive ? 'Đang bán' : 'Ngừng bán'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openProductModal(product)}
                                  className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                                  title="Chỉnh sửa"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => setDeletingProduct(product)}
                                  className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                  title="Xóa"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Products Pagination */}
                {totalProductPages > 1 && (
                  <Pagination
                    currentPage={productPage}
                    totalPages={totalProductPages}
                    totalItems={totalProducts}
                    itemsPerPage={productPageSize}
                    onPageChange={setProductPage}
                    loading={productsLoading}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Suppliers */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => toggleSection('suppliers')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <Building className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Nhà Cung Cấp</h2>
            <span className="text-sm text-gray-500">({suppliers.length} nhà cung cấp)</span>
          </div>
          {expandedSections.suppliers ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {expandedSections.suppliers && (
          <div className="border-t p-4">
            {/* Search & Actions */}
            <div className="flex justify-between items-center mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  placeholder="Tìm kiếm nhà cung cấp..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => openSupplierModal()}
                className="ml-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Thêm NCC
              </button>
            </div>

            {suppliersLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhà Cung Cấp</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Liên Hệ</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Vị Trí</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Hạn Mức Tín Dụng</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Đánh Giá</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng Thái</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                      {paginatedSuppliers.map((supplier) => (
                        <tr key={supplier.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                              {supplier.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                              Partner Code: {supplier.id.slice(0, 8)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                <User size={12} className="text-slate-400" />
                                {supplier.contactPerson || 'Trống'}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                <Mail size={10} />
                                {supplier.email || 'N/A'}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                <Phone size={10} />
                                {supplier.phone || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                              <MapPin size={12} className="text-blue-400" />
                              <div className="max-w-[150px] truncate">
                                {supplier.city || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-black text-slate-900 tracking-tight">
                              {supplier.creditLimit.toLocaleString('vi-VN')}<span className="text-[10px] ml-0.5 text-slate-400">₫</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {supplier.rating ? (
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg">
                                <Star size={12} className="text-amber-500 fill-amber-500" />
                                <span className="text-xs font-black text-amber-700">
                                  {supplier.rating.toFixed(1)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Chưa có</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest border ${supplier.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                              }`}>
                              {supplier.isActive ? 'Hoạt động' : 'Tạm dừng'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openSupplierModal(supplier)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                                title="Chỉnh sửa"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => setDeletingSupplier(supplier)}
                                className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                title="Xóa"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Suppliers Pagination */}
                {totalSupplierPages > 1 && (
                  <Pagination
                    currentPage={supplierPage}
                    totalPages={totalSupplierPages}
                    totalItems={totalSuppliers}
                    itemsPerPage={supplierPageSize}
                    onPageChange={setSupplierPage}
                    loading={suppliersLoading}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <FormModal
        isOpen={showProductModal}
        onClose={closeProductModal}
        title={editingProduct ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
        size="lg"
      >
        <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên Sản Phẩm *</label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input
                type="text"
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá *</label>
              <FormattedNumberInput
                value={productForm.price}
                onChange={(val) => setProductForm({ ...productForm, price: val })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                placeholder="Nhập giá"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn Vị *</label>
              <input
                type="text"
                value={productForm.unit}
                onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                placeholder="VD: kg, m3, bao..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh Mục *</label>
              <div className="flex gap-2">
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-bold"
                  title="Thêm danh mục mới"
                >
                  +
                </button>
              </div>
              {/* Mini form thêm danh mục */}
              {showAddCategory && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md border">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nhập tên danh mục mới"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={addingCategory}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
                    >
                      {addingCategory ? '...' : 'Thêm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddCategory(false); setNewCategoryName('') }}
                      className="px-3 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tồn Kho Tối Thiểu</label>
              <FormattedNumberInput
                value={productForm.minStockLevel || 0}
                onChange={(val) => setProductForm({ ...productForm, minStockLevel: val })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhà Cung Cấp</label>
              <select
                value={productForm.supplierId}
                onChange={(e) => setProductForm({ ...productForm, supplierId: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.filter(s => s.isActive).map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Chọn NCC để tự động đặt hàng khi sắp hết</p>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={productForm.isActive}
                onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Đang Bán</span>
            </label>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô Tả</label>
            <textarea
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
              rows={3}
              placeholder="Mô tả sản phẩm..."
            />
          </div>

          {/* Image URLs and Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh Sản Phẩm</label>

            {/* File Upload */}
            <div className="mb-3 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = e.target.files
                  if (files) {
                    Array.from(files).forEach(file => {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        const base64 = event.target?.result as string
                        setProductForm(prev => ({ ...prev, images: [...prev.images, base64] }))
                      }
                      reader.readAsDataURL(file)
                    })
                  }
                  e.target.value = '' // Reset input
                }}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-600">Bấm để upload ảnh từ máy</span>
                <span className="text-xs text-gray-400 mt-1">Hỗ trợ JPG, PNG, GIF</span>
              </label>
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Hoặc nhập URL ảnh:</p>
              {productForm.images.map((img, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={img.startsWith('data:') ? '(Ảnh upload)' : img}
                    onChange={(e) => {
                      const newImages = [...productForm.images]
                      newImages[idx] = e.target.value
                      setProductForm({ ...productForm, images: newImages })
                    }}
                    disabled={img.startsWith('data:')}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white disabled:bg-gray-100"
                    placeholder="https://example.com/image.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = productForm.images.filter((_, i) => i !== idx)
                      setProductForm({ ...productForm, images: newImages })
                    }}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Xóa
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setProductForm({ ...productForm, images: [...productForm.images, ''] })}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Thêm URL ảnh
              </button>
            </div>

            {/* Preview */}
            {productForm.images.length > 0 && productForm.images.filter(img => img).length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Xem trước ({productForm.images.filter(img => img).length} ảnh):</p>
                <div className="flex flex-wrap gap-2">
                  {productForm.images.filter(img => img).map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img}
                        alt={`Preview ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                        onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = productForm.images.filter((_, i) => i !== productForm.images.indexOf(img))
                          setProductForm({ ...productForm, images: newImages })
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={closeProductModal}
              disabled={productFormLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={productFormLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {productFormLoading ? 'Đang lưu...' : (editingProduct ? 'Cập Nhật' : 'Thêm Mới')}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Supplier Form Modal */}
      <FormModal
        isOpen={showSupplierModal}
        onClose={closeSupplierModal}
        title={editingSupplier ? 'Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
        size="lg"
      >
        <form onSubmit={handleSupplierSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên Nhà Cung Cấp *</label>
            <input
              type="text"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Người Liên Hệ</label>
              <input
                type="text"
                value={supplierForm.contactPerson}
                onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số Điện Thoại</label>
              <input
                type="tel"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thành Phố</label>
              <input
                type="text"
                value={supplierForm.city}
                onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa Chỉ</label>
            <textarea
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hạn Mức Tín Dụng</label>
            <input
              type="number"
              value={supplierForm.creditLimit}
              onChange={(e) => setSupplierForm({ ...supplierForm, creditLimit: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
              min="0"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={supplierForm.isActive}
                onChange={(e) => setSupplierForm({ ...supplierForm, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Đang Hợp Tác</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={closeSupplierModal}
              disabled={supplierFormLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={supplierFormLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {supplierFormLoading ? 'Đang lưu...' : (editingSupplier ? 'Cập Nhật' : 'Thêm Mới')}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Delete Product Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDeleteProduct}
        title="Xóa Sản Phẩm"
        message={`Bạn có chắc muốn xóa sản phẩm "${deletingProduct?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        type="danger"
        loading={productFormLoading}
      />

      {/* Delete Supplier Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingSupplier}
        onClose={() => setDeletingSupplier(null)}
        onConfirm={handleDeleteSupplier}
        title="Xóa Nhà Cung Cấp"
        message={`Bạn có chắc muốn xóa nhà cung cấp "${deletingSupplier?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        type="danger"
        loading={supplierFormLoading}
      />
    </div>
  )
}
