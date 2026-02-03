'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import {
  Save, Plus, Trash2, FileText, Receipt, X, Edit,
  Search, Filter, ChevronRight, Eye, Send, CheckCircle,
  Clock, AlertCircle, TrendingUp, DollarSign, ShoppingCart,
  History, User, Truck, BarChart2
} from 'lucide-react'
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
  name: string
  email: string
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
  const [invoiceFilters, setInvoiceFilters] = useState({ type: '', status: '', search: '' })

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
  }, [activeTab, invoiceFilters.type, invoiceFilters.status])

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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-50 text-slate-400 border-slate-100'
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100'
      case 'SENT': return 'bg-blue-50 text-blue-600 border-blue-100'
      case 'PAID': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
      case 'OVERDUE': return 'bg-red-50 text-red-600 border-red-100'
      case 'CANCELLED': return 'bg-slate-100 text-slate-500 border-slate-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return Clock
      case 'PENDING': return AlertCircle
      case 'SENT': return Send
      case 'PAID': return CheckCircle
      case 'OVERDUE': return X
      case 'CANCELLED': return Trash2
      default: return Clock
    }
  }

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      'DRAFT': 'Bản nháp',
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

  const filteredInvoices = invoices.filter(inv => {
    const searchStr = invoiceFilters.search.toLowerCase()
    return inv.invoiceNumber.toLowerCase().includes(searchStr) ||
      (inv.customer?.user?.name || inv.supplier?.name || '').toLowerCase().includes(searchStr)
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kinh Doanh & Doanh Số</h1>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Quản Lý Doanh Thu & Hóa Đơn</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'invoices' && (
            <button
              onClick={() => openInvoiceModal()}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={16} />
              Tạo Hóa Đơn
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Doanh Thu Tháng', value: invoices.filter(i => (i.invoiceType || i.type) === 'SALES' && i.status === 'PAID').reduce((sum, i) => sum + i.totalAmount, 0), icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600', sub: 'Tổng Doanh Thu' },
          { label: 'Hóa Đơn Chờ', value: invoices.filter(i => i.status === 'PENDING').length, icon: Clock, color: 'bg-amber-50 text-amber-600', sub: 'Chờ Xử Lý' },
          { label: 'Công Nợ Phải Thu', value: invoices.filter(i => (i.invoiceType || i.type) === 'SALES' && i.status === 'OVERDUE').reduce((sum, i) => sum + i.totalAmount, 0), icon: DollarSign, color: 'bg-red-50 text-red-600', sub: 'Nợ Quá Hạn' },
          { label: 'Tổng Giao Dịch', value: invoices.length, icon: BarChart2, color: 'bg-blue-50 text-blue-600', sub: 'Tổng Khối Lượng' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.sub}</span>
            </div>
            <div className="text-xl font-black text-slate-900">{stat.value.toLocaleString('vi-VN')}<span className="text-[10px] ml-1 text-slate-400 uppercase">{typeof stat.value === 'number' && stat.value > 1000 ? 'đ' : ''}</span></div>
            <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs Design */}
      <div className="flex bg-slate-100 p-1.5 rounded-[22px] w-full md:w-max">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'invoices' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
        >
          <FileText size={14} />
          Quản Lý Hóa Đơn
        </button>
        <button
          onClick={() => setActiveTab('daily-sales')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'daily-sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
        >
          <TrendingUp size={14} />
          Báo Cáo Doanh Số Ngày
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'invoices' ? (
        <div className="space-y-6">
          {/* Invoice Filter Bar */}
          <div className="p-4 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Tìm mã hóa đơn, tên khách hàng hoặc nhà cung cấp..."
                value={invoiceFilters.search}
                onChange={(e) => setInvoiceFilters({ ...invoiceFilters, search: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={invoiceFilters.type}
                onChange={(e) => setInvoiceFilters({ ...invoiceFilters, type: e.target.value })}
                className="flex-1 md:w-40 px-4 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Tất cả loại hình</option>
                <option value="SALES">Bán hàng</option>
                <option value="PURCHASE">Mua hàng</option>
              </select>
              <select
                value={invoiceFilters.status}
                onChange={(e) => setInvoiceFilters({ ...invoiceFilters, status: e.target.value })}
                className="flex-1 md:w-40 px-4 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Mọi trạng thái</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="PENDING">Đang xử lý</option>
                <option value="SENT">Đã gửi</option>
                <option value="PAID">Hoàn thành</option>
                <option value="OVERDUE">Quá hạn</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Hóa Đơn / Ngày Tạo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại Hình</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Đối Tác</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá Trị</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng Thái</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest sticky right-0 bg-[#f8fafc] z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)]">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoicesLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold italic">
                        Không tìm thấy hóa đơn nào
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => {
                      const StatusIcon = getStatusIcon(invoice.status)
                      return (
                        <tr key={invoice.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <FileText size={20} />
                              </div>
                              <div>
                                <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{invoice.invoiceNumber}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{new Date(invoice.createdAt).toLocaleDateString('vi-VN')}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest border ${(invoice.invoiceType || invoice.type) === 'SALES' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                              {(invoice.invoiceType || invoice.type) === 'SALES' ? 'Bán Hàng' : 'Nhập Hàng'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {(invoice.invoiceType || invoice.type) === 'SALES' ? <User size={12} className="text-blue-400" /> : <Truck size={12} className="text-purple-400" />}
                              <div className="text-xs font-bold text-slate-600 max-w-[150px] line-clamp-1" title={invoice.customer?.user?.name || invoice.supplier?.name || 'N/A'}>
                                {invoice.customer?.user?.name || invoice.supplier?.name || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-black text-slate-900 tracking-tight">
                              {invoice.totalAmount.toLocaleString('vi-VN')}<span className="text-[10px] ml-0.5 text-slate-400 uppercase">đ</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(invoice.status)} shadow-sm`}>
                              <StatusIcon size={12} />
                              {getStatusText(invoice.status)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-white group-hover:bg-[#f1f5f9] z-10 transition-colors shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)]">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-4">
                              <button
                                onClick={() => openInvoiceModal(invoice)}
                                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:shadow-blue-200 active:scale-95"
                                title="Xem Chi Tiết"
                              >
                                <Eye size={16} />
                              </button>
                              {['DRAFT', 'PENDING'].includes(invoice.status) && (
                                <button
                                  onClick={() => updateInvoiceStatus(invoice.id, 'SENT')}
                                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:shadow-indigo-200 active:scale-95"
                                  title="Gửi Hóa Đơn"
                                >
                                  <Send size={16} />
                                </button>
                              )}
                              {['SENT', 'OVERDUE'].includes(invoice.status) && (
                                <button
                                  onClick={() => updateInvoiceStatus(invoice.id, 'PAID')}
                                  className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg hover:shadow-emerald-200 active:scale-95"
                                  title="Thanh Toán"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => deleteInvoice(invoice.id)}
                                className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100 active:scale-95"
                                title="Xóa"
                              >
                                <Trash2 size={16} />
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
          </div>
        </div>
      ) : (
        /* Daily Sales UI */
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-8 animate-in slide-in-from-right duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-50">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-50 text-purple-600 rounded-[22px]">
                <Receipt size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Báo cáo doanh số nhanh</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Quick Daily Sales Entry</p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Ngày hạch toán</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="bg-transparent border-none text-sm font-black text-slate-900 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 items-end">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Sản phẩm / Dịch vụ</label>
                  <select
                    value={entry.productId}
                    onChange={(e) => updateEntry(index, 'productId', e.target.value)}
                    className="w-full px-4 py-3 bg-white border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Số lượng</label>
                  <FormattedNumberInput
                    value={entry.quantity || 0}
                    onChange={(val) => updateEntry(index, 'quantity', val)}
                    className="w-full px-4 py-3 bg-white border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Đơn giá bán</label>
                  <FormattedNumberInput
                    value={entry.price || 0}
                    onChange={(val) => updateEntry(index, 'price', val)}
                    className="w-full px-4 py-3 bg-white border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 text-emerald-600"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Thành tiền</label>
                  <div className="px-6 py-3 bg-white rounded-2xl text-sm font-black text-blue-600 border border-blue-50">
                    {(entry.quantity * entry.price).toLocaleString('vi-VN')} <span className="text-[10px] ml-1 uppercase">đ</span>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <button
                    onClick={() => removeEntry(index)}
                    disabled={entries.length === 1}
                    className="w-full p-3 text-slate-300 hover:text-red-500 hover:bg-white rounded-xl transition-all disabled:opacity-0"
                  >
                    <Trash2 size={20} className="mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-8 border-t border-slate-50 gap-6">
            <button
              onClick={addEntry}
              className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              Thêm dòng mới
            </button>

            <div className="flex items-center gap-8 w-full md:w-auto">
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tổng thanh toán</span>
                <span className="text-3xl font-black text-slate-900 tracking-tighter">
                  {calculateTotal().toLocaleString('vi-VN')}<span className="text-xs ml-1 text-slate-400 uppercase tracking-widest font-bold">VNĐ</span>
                </span>
              </div>
              <button
                onClick={handleDailySalesSubmit}
                disabled={salesLoading}
                className="bg-emerald-600 text-white px-10 py-5 rounded-[22px] font-black text-sm uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
              >
                <Save size={18} />
                {salesLoading ? 'Đang hạch toán...' : 'Lưu báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal Overlay */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-10 py-8 flex justify-between items-center border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{editingInvoice ? 'Chi tiết hóa đơn' : 'Lập hóa đơn mới'}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Invoice Generator System</p>
                </div>
              </div>
              <button onClick={() => setShowInvoiceModal(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleInvoiceSubmit} className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-8 rounded-[32px] border border-slate-100">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Loại chứng từ *</label>
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-100">
                      <button
                        type="button"
                        onClick={() => setInvoiceForm({ ...invoiceForm, type: 'SALES' })}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${invoiceForm.type === 'SALES' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Bán hàng
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvoiceForm({ ...invoiceForm, type: 'PURCHASE' })}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${invoiceForm.type === 'PURCHASE' ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Mua hàng
                      </button>
                    </div>
                  </div>

                  {invoiceForm.type === 'SALES' ? (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Người mua hàng *</label>
                      <select
                        value={invoiceForm.customerId}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
                        className="w-full px-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        required
                      >
                        <option value="">-- Chọn khách hàng --</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name || c.id}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nhà cung cấp hàng hóa *</label>
                      <select
                        value={invoiceForm.supplierId}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, supplierId: e.target.value })}
                        className="w-full px-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        required
                      >
                        <option value="">-- Chọn nhà cung cấp --</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Thời hạn thanh toán</label>
                    <input
                      type="date"
                      value={invoiceForm.dueDate}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                      className="w-full px-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Thuế (%)</label>
                    <input
                      type="number"
                      value={invoiceForm.tax}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, tax: Number(e.target.value) })}
                      className="w-full px-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      min={0}
                      max={100}
                    />
                  </div>
                  <div className="flex flex-col justify-end pb-1">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Status Policy</span>
                    <span className="text-[11px] font-bold text-slate-500 italic">Net 30 Payment Terms Applied</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh mục hàng hóa / Dịch vụ</h4>
                  <button
                    type="button"
                    onClick={addInvoiceItem}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm shadow-blue-50"
                  >
                    <Plus size={14} />
                    Thêm hàng hóa
                  </button>
                </div>

                <div className="space-y-3">
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 bg-slate-50/30 rounded-2xl border border-slate-100">
                      <div className="col-span-6">
                        <select
                          value={item.productId}
                          onChange={(e) => updateInvoiceItem(index, 'productId', e.target.value)}
                          className="w-full px-3 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
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
                          value={item.quantity}
                          onChange={(val) => updateInvoiceItem(index, 'quantity', val)}
                          className="w-full px-3 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none text-center"
                          placeholder="SL"
                        />
                      </div>
                      <div className="col-span-3">
                        <FormattedNumberInput
                          value={item.unitPrice}
                          onChange={(val) => updateInvoiceItem(index, 'unitPrice', val)}
                          className="w-full px-3 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none"
                          placeholder="Đơn giá"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => removeInvoiceItem(index)}
                          className="w-full p-2.5 text-slate-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start gap-8 pt-8 border-t border-slate-100">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ghi chú hạch toán</label>
                  <textarea
                    value={invoiceForm.note}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, note: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-32"
                    placeholder="Nhập thông tin ghi chú hoặc điều khoản thanh toán cụ thể..."
                  />
                </div>

                <div className="w-full md:w-80 space-y-3 bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Tạm tính</span>
                    <span>{calculateInvoiceTotal().subtotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>VAT ({invoiceForm.tax}%)</span>
                    <span>{calculateInvoiceTotal().tax.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="h-px bg-slate-200 my-2"></div>
                  <div className="flex justify-between items-center text-[10px] font-black text-blue-600 uppercase tracking-widest pt-1">
                    <span>Tổng thanh toán</span>
                    <span className="text-2xl tracking-tighter text-slate-900">{calculateInvoiceTotal().total.toLocaleString('vi-VN')}<span className="text-xs ml-0.5 text-slate-400">đ</span></span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 pb-4">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-10 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Save size={18} />
                  Lưu & Hạch toán
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
