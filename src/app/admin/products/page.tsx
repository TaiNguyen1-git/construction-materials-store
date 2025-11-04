'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Package, Building, Plus, Search, ChevronDown, ChevronUp } from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'
import FormModal from '@/components/FormModal'
import Pagination from '@/components/Pagination'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  unit: string
  category: { name: string }
  inventoryItem?: {
    quantity: number
    minStockLevel: number
  }
  isActive: boolean
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
    minStockLevel: 0,
    isActive: true
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

  useEffect(() => {
    fetchProducts()
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
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        // Handle nested data structure from API
        const productsData = data.data?.data || data.data || []
        const productsArray = Array.isArray(productsData) ? productsData : []
        console.log('Fetched products:', productsArray.length)
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
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name,
        sku: product.sku,
        price: product.price,
        unit: product.unit,
        categoryId: product.category.name, // Simplified, should use ID
        minStockLevel: product.inventoryItem?.minStockLevel || 0,
        isActive: product.isActive
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        name: '',
        sku: '',
        price: 0,
        unit: '',
        categoryId: '',
        minStockLevel: 0,
        isActive: true
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

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      })

      if (response.ok) {
        toast.success(editingProduct ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm thành công')
        closeProductModal()
        fetchProducts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Có lỗi xảy ra')
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
      const response = await fetch(`/api/products/${deletingProduct.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Xóa sản phẩm thành công')
        setDeletingProduct(null)
        fetchProducts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Không thể xóa sản phẩm')
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
      const response = await fetch('/api/suppliers')
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

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm)
      })

      if (response.ok) {
        toast.success(editingSupplier ? 'Cập nhật NCC thành công' : 'Thêm NCC thành công')
        closeSupplierModal()
        fetchSuppliers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Có lỗi xảy ra')
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
      const response = await fetch(`/api/suppliers/${deletingSupplier.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Xóa nhà cung cấp thành công')
        setDeletingSupplier(null)
        fetchSuppliers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Không thể xóa nhà cung cấp')
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
    const qty = product.inventoryItem.quantity
    const min = product.inventoryItem.minStockLevel
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
                {products.filter(p => p.inventoryItem && p.inventoryItem.quantity <= p.inventoryItem.minStockLevel).length}
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
                {products.reduce((sum, p) => sum + (p.inventoryItem?.quantity || 0) * p.price, 0).toLocaleString('vi-VN')}đ
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
              <button 
                onClick={() => openProductModal()}
                className="ml-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Thêm sản phẩm
              </button>
            </div>

            {productsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên Sản Phẩm</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh Mục</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn Vị</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn Kho</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedProducts.map((product) => {
                        const stockStatus = getStockStatus(product)
                        return (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {product.sku}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.category.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {product.price.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.unit}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {product.inventoryItem?.quantity || 0}
                              </div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                                {stockStatus.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {product.isActive ? 'Đang bán' : 'Ngừng bán'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => openProductModal(product)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Sửa
                              </button>
                              <button 
                                onClick={() => setDeletingProduct(product)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Xóa
                              </button>
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
            <Building className="h-5 w-5 text-green-600" />
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
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button 
                onClick={() => openSupplierModal()}
                className="ml-4 flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Thêm NCC
              </button>
            </div>

            {suppliersLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên NCC</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người Liên Hệ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điện Thoại</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Địa Chỉ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn Mức</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đánh Giá</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {supplier.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {supplier.contactPerson || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {supplier.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {supplier.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="max-w-xs truncate">
                            {supplier.address ? `${supplier.address}, ${supplier.city}` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {supplier.creditLimit.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {supplier.rating ? (
                            <div className="flex items-center">
                              <span className="text-yellow-500">★</span>
                              <span className="ml-1 text-sm font-medium text-gray-900">
                                {supplier.rating.toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Chưa có</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {supplier.isActive ? 'Hoạt động' : 'Ngừng'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => openSupplierModal(supplier)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Sửa
                          </button>
                          <button 
                            onClick={() => setDeletingSupplier(supplier)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Xóa
                          </button>
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
              <input
                type="number"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                required
                min="0"
                step="0.01"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh Mục</label>
              <input
                type="text"
                value={productForm.categoryId}
                onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                placeholder="Tên danh mục"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tồn Kho Tối Thiểu</label>
              <input
                type="number"
                value={productForm.minStockLevel}
                onChange={(e) => setProductForm({ ...productForm, minStockLevel: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                min="0"
              />
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
