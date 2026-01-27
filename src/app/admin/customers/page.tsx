'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'
import ConfirmDialog from '@/components/ConfirmDialog'
import FormModal from '@/components/FormModal'
import Pagination from '@/components/Pagination'
import {
  User, Mail, Phone, MapPin,
  Calendar, ShoppingBag, Edit, Trash2,
  Search, X, Users, CheckCircle, AlertCircle, Plus
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  _count?: { orders: number }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [filters, setFilters] = useState({ status: '', search: '' })
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  })

  useEffect(() => {
    fetchCustomers()
  }, [filters])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)

      const response = await fetchWithAuth(`/api/customers?${params}`)
      if (response.ok) {
        const data = await response.json()
        const customersData = data.data?.data || data.data || []
        const customersArray = Array.isArray(customersData) ? customersData : []
        setCustomers(customersArray)
      } else {
        toast.error('Không thể tải danh sách khách hàng')
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Không thể tải danh sách khách hàng')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE'
      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
      : 'bg-slate-50 text-slate-400 border-slate-100'
  }

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setForm({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || '',
        status: customer.status
      })
    } else {
      setEditingCustomer(null)
      setForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        status: 'ACTIVE'
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCustomer(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers'
      const method = editingCustomer ? 'PUT' : 'POST'

      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(form)
      })

      if (response.ok) {
        toast.success(editingCustomer ? 'Cập nhật khách hàng thành công' : 'Thêm khách hàng thành công')
        closeModal()
        fetchCustomers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error saving customer:', error)
      toast.error('Không thể lưu khách hàng')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCustomer) return

    setFormLoading(true)
    try {
      const response = await fetchWithAuth(`/api/customers/${deletingCustomer.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Xóa khách hàng thành công')
        setDeletingCustomer(null)
        fetchCustomers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Không thể xóa khách hàng')
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('Không thể xóa khách hàng')
    } finally {
      setFormLoading(false)
    }
  }

  // Client-side pagination
  const filteredCustomers = customers.filter(c => {
    const matchesStatus = !filters.status || c.status === filters.status
    const matchesSearch = !filters.search ||
      c.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      c.email.toLowerCase().includes(filters.search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const totalCustomers = filteredCustomers.length
  const totalPages = Math.ceil(totalCustomers / pageSize)
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Main Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hồ Sơ Khách Hàng</h1>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Quản Lý Vòng Đời Khách Hàng</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Thêm Khách Hàng
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng khách hàng', value: customers.length, icon: Users, color: 'bg-blue-50 text-blue-600', sub: 'Toàn hệ thống' },
          { label: 'Đang hoạt động', value: customers.filter(c => c.status === 'ACTIVE').length, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600', sub: 'Thường xuyên' },
          { label: 'Ngừng hoạt động', value: customers.filter(c => c.status === 'INACTIVE').length, icon: AlertCircle, color: 'bg-slate-50 text-slate-400', sub: 'Cần chăm sóc' },
          { label: 'Đơn hàng mới', value: customers.reduce((sum, c) => sum + (c._count?.orders || 0), 0), icon: ShoppingBag, color: 'bg-purple-50 text-purple-600', sub: 'Sức mua tổng' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.sub}</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{stat.value.toLocaleString('vi-VN')}</div>
            <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Modern Filter Bar */}
      <div className="p-4 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Tìm theo tên mẫu, email hoặc số điện thoại..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="flex-1 md:w-48 px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
          </select>
          {(filters.search || filters.status) && (
            <button
              onClick={() => setFilters({ status: '', search: '' })}
              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
              title="Xóa bộ lọc"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách Hàng</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Liên Hệ & Địa Chỉ</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn Hàng</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày Gia Nhập</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng Thái</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold italic">
                    Không tìm thấy khách hàng nào phù hợp
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-black text-xs uppercase shadow-inner group-hover:from-blue-500 group-hover:to-blue-600 group-hover:text-white transition-all">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{customer.name}</div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-bold lowercase tracking-tighter mt-0.5">
                            <Mail size={10} />
                            {customer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-600">
                          <Phone size={12} className="text-slate-400" />
                          {customer.phone || 'Chưa cập nhật'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                          <MapPin size={12} />
                          <span className="max-w-[200px] truncate">{customer.address || 'Hệ thống'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="inline-flex flex-col items-center">
                        <div className="text-[14px] font-black text-slate-900 flex items-center gap-1.5">
                          <ShoppingBag size={14} className="text-purple-400" />
                          {customer._count?.orders || 0}
                        </div>
                        <span className="text-[9px] font-black text-slate-300 uppercase mt-0.5">Giao dịch</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-slate-600 tracking-tighter">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[9px] font-black text-slate-300 uppercase mt-0.5">Ngày tạo</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-4 py-1.5 text-[9px] font-black rounded-full uppercase tracking-widest border ${getStatusColor(customer.status)}`}>
                        {customer.status === 'ACTIVE' ? 'Hoạt Động' : 'Tạm Ngưng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openModal(customer)}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-90 shadow-sm border border-blue-100 hover:border-blue-600"
                          title="Sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingCustomer(customer)}
                          className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-sm"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Container */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCustomers}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Customer Form Modal */}
      <FormModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingCustomer ? 'Sửa Khách Hàng' : 'Thêm Khách Hàng Mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên Khách Hàng *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Số Điện Thoại</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Trạng Thái</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ACTIVE">Hoạt Động</option>
                  <option value="INACTIVE">Ngừng Hoạt Động</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Địa Chỉ</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={closeModal}
              disabled={formLoading}
              className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
            >
              {formLoading ? 'Đang lưu...' : (editingCustomer ? 'Cập Nhật' : 'Thêm Mới')}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleDelete}
        title="Xóa Khách Hàng"
        message={`Bạn có chắc muốn xóa khách hàng "${deletingCustomer?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        type="danger"
        loading={formLoading}
      />
    </div>
  )
}