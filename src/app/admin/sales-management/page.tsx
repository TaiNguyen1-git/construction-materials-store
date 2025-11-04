'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Save, Plus, Trash2, FileText, Receipt, Camera, X } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'

interface Invoice {
  id: string
  invoiceNumber: string
  type: 'SALES' | 'PURCHASE'
  customer?: { name: string; email: string }
  supplier?: { name: string; email: string }
  totalAmount: number
  status: 'PENDING' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  dueDate: string
  createdAt: string
}

interface Product {
  id: string
  name: string
  price: number
  unit: string
}

interface SaleEntry {
  productId: string
  productName: string
  quantity: number
  price: number
}

export default function SalesManagementPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'daily-sales'>('invoices')
  
  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [invoiceFilters, setInvoiceFilters] = useState({ type: '', status: '' })
  const [showOcrModal, setShowOcrModal] = useState(false)
  
  // Daily Sales state
  const [products, setProducts] = useState<Product[]>([])
  const [entries, setEntries] = useState<SaleEntry[]>([{ productId: '', productName: '', quantity: 0, price: 0 }])
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [salesLoading, setSalesLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'invoices') {
      fetchInvoices()
    } else {
      fetchProducts()
    }
  }, [activeTab, invoiceFilters])

  // Invoices functions
  const fetchInvoices = async () => {
    try {
      setInvoicesLoading(true)
      const params = new URLSearchParams()
      if (invoiceFilters.type) params.append('type', invoiceFilters.type)
      if (invoiceFilters.status) params.append('status', invoiceFilters.status)

      const response = await fetchWithAuth(`/api/invoices?${params}`)
      if (response.ok) {
        const data = await response.json()
        const invoicesData = Array.isArray(data.data) ? data.data : []
        setInvoices(invoicesData)
      } else if (response.status === 401) {
        toast.error('Đăng nhập để xem hóa đơn')
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast.error('Không thể tải danh sách hóa đơn')
    } finally {
      setInvoicesLoading(false)
    }
  }

  const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    try {
      const response = await fetchWithAuth(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast.success('Cập nhật trạng thái thành công')
        fetchInvoices()
      } else {
        toast.error('Không thể cập nhật hóa đơn')
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast.error('Không thể cập nhật hóa đơn')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'SENT': return 'bg-blue-100 text-blue-800'
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Daily Sales functions
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      if (data.success) {
        setProducts(data.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          unit: p.unit
        })))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const addEntry = () => {
    setEntries([...entries, { productId: '', productName: '', quantity: 0, price: 0 }])
  }

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, field: keyof SaleEntry, value: any) => {
    const newEntries = [...entries]
    newEntries[index] = { ...newEntries[index], [field]: value }
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value)
      if (product) {
        newEntries[index].productName = product.name
        newEntries[index].price = product.price
      }
    }
    
    setEntries(newEntries)
  }

  const handleDailySalesSubmit = async () => {
    const validEntries = entries.filter(e => e.productId && e.quantity > 0)
    if (validEntries.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 sản phẩm')
      return
    }

    setSalesLoading(true)
    try {
      const response = await fetchWithAuth('/api/daily-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleDate, entries: validEntries })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Đã lưu doanh số ngày!')
        setEntries([{ productId: '', productName: '', quantity: 0, price: 0 }])
        setSaleDate(new Date().toISOString().split('T')[0])
      } else {
        toast.error(data.error?.message || 'Lỗi khi lưu')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra!')
    } finally {
      setSalesLoading(false)
    }
  }

  const calculateTotal = () => {
    return entries.reduce((sum, e) => sum + (e.quantity * e.price), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Bán Hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Hóa đơn và doanh số hàng ngày</p>
        </div>
        {activeTab === 'invoices' && (
          <button
            onClick={() => setShowOcrModal(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <Camera className="h-4 w-4 mr-2" />
            Scan Hóa Đơn (OCR)
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'invoices'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 mr-2" />
            Hóa Đơn
          </button>
          <button
            onClick={() => setActiveTab('daily-sales')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'daily-sales'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Nhập Doanh Số Ngày
          </button>
        </nav>
      </div>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                <select
                  value={invoiceFilters.type}
                  onChange={(e) => setInvoiceFilters({ ...invoiceFilters, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                >
                  <option value="">Tất cả</option>
                  <option value="SALES">Bán hàng</option>
                  <option value="PURCHASE">Mua hàng</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={invoiceFilters.status}
                  onChange={(e) => setInvoiceFilters({ ...invoiceFilters, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
                >
                  <option value="">Tất cả</option>
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="SENT">Đã gửi</option>
                  <option value="PAID">Đã thanh toán</option>
                  <option value="OVERDUE">Quá hạn</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setInvoiceFilters({ type: '', status: '' })}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          {invoicesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã HĐ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng/NCC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn thanh toán</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-gray-500">{new Date(invoice.createdAt).toLocaleDateString('vi-VN')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            invoice.type === 'SALES' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {invoice.type === 'SALES' ? 'Bán' : 'Mua'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.customer?.name || invoice.supplier?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.customer?.email || invoice.supplier?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.totalAmount.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(invoice.dueDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">Xem</button>
                            {invoice.status === 'PENDING' && (
                              <button
                                onClick={() => updateInvoiceStatus(invoice.id, 'SENT')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Gửi
                              </button>
                            )}
                            {['PENDING', 'SENT'].includes(invoice.status) && (
                              <button
                                onClick={() => updateInvoiceStatus(invoice.id, 'PAID')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Đã thanh toán
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily Sales Tab */}
      {activeTab === 'daily-sales' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Ngày bán</label>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-4 mb-6">
            {entries.map((entry, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-5">
                  <label className="block text-sm font-medium mb-2">Sản phẩm</label>
                  <select
                    value={entry.productId}
                    onChange={(e) => updateEntry(index, 'productId', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.price.toLocaleString('vi-VN')}đ/{p.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Số lượng</label>
                  <input
                    type="number"
                    value={entry.quantity || ''}
                    onChange={(e) => updateEntry(index, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Đơn giá</label>
                  <input
                    type="number"
                    value={entry.price || ''}
                    onChange={(e) => updateEntry(index, 'price', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Thành tiền</label>
                  <div className="px-4 py-2 bg-gray-50 rounded-lg font-semibold text-blue-600">
                    {(entry.quantity * entry.price).toLocaleString('vi-VN')}đ
                  </div>
                </div>

                <div className="col-span-1">
                  <button
                    onClick={() => removeEntry(index)}
                    disabled={entries.length === 1}
                    className="w-full p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addEntry}
            className="mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm sản phẩm
          </button>

          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Tổng cộng:</span>
              <span className="text-blue-600">{calculateTotal().toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          <button
            onClick={handleDailySalesSubmit}
            disabled={salesLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {salesLoading ? 'Đang lưu...' : 'Lưu doanh số'}
          </button>
        </div>
      )}

      {/* OCR Modal */}
      {showOcrModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Scan Hóa Đơn với OCR</h3>
              <button
                onClick={() => setShowOcrModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Camera className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Tính năng OCR sẽ được tích hợp tại đây</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Chọn ảnh hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
