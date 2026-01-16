'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Save, Plus, Trash2, FileText, Receipt, X, Edit } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import FormattedNumberInput from '@/components/FormattedNumberInput'

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceType: 'SALES' | 'PURCHASE'
  type?: 'SALES' | 'PURCHASE'
  customer?: { id: string; user: { name: string; email: string } }
  supplier?: { id: string; name: string; email: string }
  totalAmount: number
  status: 'DRAFT' | 'PENDING' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  dueDate: string
  createdAt: string
}

interface Customer {
  id: string
  user: { name: string; email: string }
}

interface Supplier {
  id: string
  name: string
  email: string
}

interface Product {
  id: string
  name: string
  price: number
  unit: string
}

interface InvoiceItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
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

  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  // Invoice form state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [invoiceForm, setInvoiceForm] = useState({
    type: 'SALES' as 'SALES' | 'PURCHASE',
    customerId: '',
    supplierId: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    note: '',
    tax: 10
  })
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { productId: '', productName: '', quantity: 1, unitPrice: 0 }
  ])

  // Daily Sales state
  const [products, setProducts] = useState<Product[]>([])
  const [entries, setEntries] = useState<SaleEntry[]>([{ productId: '', productName: '', quantity: 0, price: 0 }])
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [salesLoading, setSalesLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'invoices') {
      fetchInvoices()
    }
    fetchProducts()
    fetchCustomers()
    fetchSuppliers()
  }, [activeTab, invoiceFilters])

  const fetchCustomers = async () => {
    try {
      const response = await fetchWithAuth('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.data?.data || data.data || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetchWithAuth('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.data?.data || data.data || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

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
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast.error('Không thể tải danh sách hóa đơn')
    } finally {
      setInvoicesLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetchWithAuth('/api/products?limit=1000')
      const data = await res.json()
      // Handle nested data structure
      const productsArray = data.data?.data || data.data || data || []
      if (Array.isArray(productsArray)) {
        setProducts(productsArray.map((p: any) => ({
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

  const openInvoiceModal = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice)
      const type = invoice.invoiceType || invoice.type || 'SALES'
      setInvoiceForm({
        type: type,
        customerId: invoice.customer?.id || '',
        supplierId: invoice.supplier?.id || '',
        dueDate: invoice.dueDate?.split('T')[0] || '',
        note: '',
        tax: 10
      })
    } else {
      setEditingInvoice(null)
      setInvoiceForm({
        type: 'SALES',
        customerId: customers[0]?.id || '',
        supplierId: '',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        note: '',
        tax: 10
      })
      setInvoiceItems([{ productId: '', productName: '', quantity: 1, unitPrice: 0 }])
    }
    setShowInvoiceModal(true)
  }

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { productId: '', productName: '', quantity: 1, unitPrice: 0 }])
  }

  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index))
    } else {
      // If it's the last item, just clear the fields instead of removing
      setInvoiceItems([{ productId: '', productName: '', quantity: 1, unitPrice: 0 }])
    }
  }

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...invoiceItems]
    newItems[index] = { ...newItems[index], [field]: value }

    if (field === 'productId') {
      const product = products.find(p => p.id === value)
      if (product) {
        newItems[index].productName = product.name
        newItems[index].unitPrice = product.price
      }
    }

    setInvoiceItems(newItems)
  }

  const calculateInvoiceTotal = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const tax = subtotal * (invoiceForm.tax / 100)
    return { subtotal, tax, total: subtotal + tax }
  }

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validItems = invoiceItems.filter(item => item.productId && item.quantity > 0 && item.unitPrice > 0)
    if (validItems.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 sản phẩm hợp lệ')
      return
    }

    try {
      const payload = {
        type: invoiceForm.type,
        customerId: invoiceForm.type === 'SALES' ? invoiceForm.customerId : undefined,
        supplierId: invoiceForm.type === 'PURCHASE' ? invoiceForm.supplierId : undefined,
        dueDate: invoiceForm.dueDate,
        note: invoiceForm.note,
        tax: invoiceForm.tax,
        invoiceItems: validItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      }

      const response = await fetchWithAuth('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success('Tạo hóa đơn thành công')
        setShowInvoiceModal(false)
        fetchInvoices()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Không thể tạo hóa đơn')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast.error('Có lỗi xảy ra')
    }
  }

  const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    try {
      const response = await fetchWithAuth(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Cập nhật trạng thái thành công')
        fetchInvoices()
      } else {
        toast.error(data.error || 'Không thể cập nhật hóa đơn')
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast.error('Không thể cập nhật hóa đơn')
    }
  }

  const deleteInvoice = async (invoiceId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) return

    try {
      const response = await fetchWithAuth(`/api/invoices/${invoiceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Xóa hóa đơn thành công')
        fetchInvoices()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Không thể xóa hóa đơn')
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error('Có lỗi xảy ra khi xóa hóa đơn')
    }
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'SENT': return 'bg-blue-100 text-blue-800'
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      'DRAFT': 'Nháp',
      'PENDING': 'Chờ xử lý',
      'SENT': 'Đã gửi',
      'PAID': 'Đã thanh toán',
      'OVERDUE': 'Quá hạn',
      'CANCELLED': 'Đã hủy'
    }
    return texts[status] || status
  }

  // Daily Sales functions
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
        <div className="flex gap-2">
          {activeTab === 'invoices' && (
            <>
              <button
                onClick={() => openInvoiceModal()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo Hóa Đơn
              </button>

            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'invoices'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <FileText className="h-4 w-4 mr-2" />
            Hóa Đơn
          </button>
          <button
            onClick={() => setActiveTab('daily-sales')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'daily-sales'
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
                  <option value="DRAFT">Nháp</option>
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
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          Chưa có hóa đơn nào. Nhấn "Tạo Hóa Đơn" để bắt đầu.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                            <div className="text-sm text-gray-500">{new Date(invoice.createdAt).toLocaleDateString('vi-VN')}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${(invoice.invoiceType || invoice.type) === 'SALES' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                              {(invoice.invoiceType || invoice.type) === 'SALES' ? 'Bán' : 'Mua'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {invoice.customer?.user?.name || invoice.supplier?.name || '-'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {invoice.customer?.user?.email || invoice.supplier?.email || ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {invoice.totalAmount.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                              {getStatusText(invoice.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('vi-VN') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => openInvoiceModal(invoice)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Xem
                              </button>

                              {['DRAFT', 'PENDING'].includes(invoice.status) && (
                                <button
                                  type="button"
                                  onClick={() => updateInvoiceStatus(invoice.id, 'SENT')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Gửi
                                </button>
                              )}
                              {['PENDING', 'SENT', 'DRAFT', 'OVERDUE'].includes(invoice.status) && (
                                <button
                                  type="button"
                                  onClick={() => updateInvoiceStatus(invoice.id, 'PAID')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Đã TT
                                </button>
                              )}
                              {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
                                <button
                                  type="button"
                                  onClick={() => updateInvoiceStatus(invoice.id, 'CANCELLED')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Hủy
                                </button>
                              )}
                              {invoice.status !== 'PAID' && (
                                <button
                                  type="button"
                                  onClick={() => deleteInvoice(invoice.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Xóa hóa đơn"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                  <FormattedNumberInput
                    value={entry.quantity || 0}
                    onChange={(val) => updateEntry(index, 'quantity', val)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Đơn giá</label>
                  <FormattedNumberInput
                    value={entry.price || 0}
                    onChange={(val) => updateEntry(index, 'price', val)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30"
                  >
                    <Trash2 className="w-5 h-5 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addEntry}
            className="mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {salesLoading ? 'Đang lưu...' : 'Lưu doanh số'}
          </button>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tạo Hóa Đơn Mới</h3>
              <button onClick={() => setShowInvoiceModal(false)}><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleInvoiceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Loại Hóa Đơn *</label>
                  <select
                    value={invoiceForm.type}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, type: e.target.value as 'SALES' | 'PURCHASE' })}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                  >
                    <option value="SALES">Bán Hàng</option>
                    <option value="PURCHASE">Mua Hàng</option>
                  </select>
                </div>

                {invoiceForm.type === 'SALES' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Khách Hàng *</label>
                    <select
                      value={invoiceForm.customerId}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="">Chọn khách hàng</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.user?.name || c.id} ({c.user?.email || ''})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nhà Cung Cấp *</label>
                    <select
                      value={invoiceForm.supplierId}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, supplierId: e.target.value })}
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="">Chọn nhà cung cấp</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hạn Thanh Toán</label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Thuế VAT (%)</label>
                  <input
                    type="number"
                    value={invoiceForm.tax}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, tax: Number(e.target.value) })}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              {/* Invoice Items */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Sản Phẩm</h4>
                <div className="space-y-3">
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <select
                          value={item.productId}
                          onChange={(e) => updateInvoiceItem(index, 'productId', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          required
                        >
                          <option value="">Chọn sản phẩm</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <FormattedNumberInput
                          value={item.quantity || 0}
                          onChange={(val) => updateInvoiceItem(index, 'quantity', val)}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="SL"
                        />
                      </div>
                      <div className="col-span-3">
                        <FormattedNumberInput
                          value={item.unitPrice || 0}
                          onChange={(val) => updateInvoiceItem(index, 'unitPrice', val)}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="Đơn giá"
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-600">
                          {(item.quantity * item.unitPrice).toLocaleString('vi-VN')}đ
                        </span>
                        <button
                          type="button"
                          onClick={() => removeInvoiceItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addInvoiceItem}
                  className="mt-3 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Thêm sản phẩm
                </button>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tạm tính:</span>
                  <span>{calculateInvoiceTotal().subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Thuế VAT ({invoiceForm.tax}%):</span>
                  <span>{calculateInvoiceTotal().tax.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Tổng cộng:</span>
                  <span className="text-blue-600">{calculateInvoiceTotal().total.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Tạo Hóa Đơn</button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  )
}
