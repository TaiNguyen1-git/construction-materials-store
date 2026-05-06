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
import { TableSkeleton } from '@/components/admin/skeletons/AdminSkeletons'

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

export default function CustomerManagement() {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Hồ Sơ Khách Hàng</h2>
          <p className="text-xs text-slate-500 font-medium">Quản lý cơ sở dữ liệu khách hàng toàn hệ thống</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus size={14} />
          Thêm Khách Hàng
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng khách hàng', value: customers.length, icon: Users, color: 'bg-blue-50 text-blue-600', sub: 'Toàn hệ thống' },
          { label: 'Đang hoạt động', value: customers.filter(c => c.status === 'ACTIVE').length, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600', sub: 'Thường xuyên' },
          { label: 'Ngừng hoạt động', value: customers.filter(c => c.status === 'INACTIVE').length, icon: AlertCircle, color: 'bg-slate-50 text-slate-400', sub: 'Cần chăm sóc' },
          { label: 'Đơn hàng mới', value: customers.reduce((sum, c) => sum + (c._count?.orders || 0), 0), icon: ShoppingBag, color: 'bg-purple-50 text-purple-600', sub: 'Sức mua tổng' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2 rounded-xl ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.sub}</span>
            </div>
            <div className="text-xl font-black text-slate-900">{stat.value.toLocaleString('vi-VN')}</div>
            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="md:w-48 px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-blue-500/10 outline-none cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Ngừng hoạt động</option>
        </select>
      </div>

      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách Hàng</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Liên Hệ</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn Hàng</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng Thái</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                   <td colSpan={5} className="p-0">
                      <TableSkeleton rows={8} />
                   </td>
                </tr>
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold italic">
                    Không tìm thấy khách hàng nào
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black text-[10px] uppercase group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{customer.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold lowercase tracking-tight">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-slate-600">{customer.phone || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">{customer.address || 'Hệ thống'}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-sm font-black text-slate-900">{customer._count?.orders || 0}</div>
                      <div className="text-[9px] font-black text-slate-300 uppercase">Đơn</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest border ${getStatusColor(customer.status)}`}>
                        {customer.status === 'ACTIVE' ? 'Hoạt Động' : 'Ngưng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openModal(customer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={14} /></button>
                        <button onClick={() => setDeletingCustomer(customer)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50/50 border-t border-slate-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCustomers}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
            loading={loading}
          />
        </div>
      </div>

      <FormModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingCustomer ? 'Sửa Khách Hàng' : 'Thêm Khách Hàng Mới'}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tên Khách Hàng *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/10 outline-none" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/10 outline-none" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Số Điện Thoại</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/10 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Trạng Thái</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'ACTIVE' | 'INACTIVE' })} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/10 outline-none">
                <option value="ACTIVE">Hoạt Động</option>
                <option value="INACTIVE">Ngừng Hoạt Động</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Địa Chỉ</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/10 outline-none resize-none" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeModal} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-xl transition-all">Hủy</button>
            <button type="submit" disabled={formLoading} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95">{formLoading ? 'Đang lưu...' : (editingCustomer ? 'Cập Nhật' : 'Thêm Mới')}</button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleDelete}
        title="Xóa Khách Hàng"
        message={`Bạn có chắc muốn xóa khách hàng "${deletingCustomer?.name}"?`}
        confirmText="Xóa"
        type="danger"
        loading={formLoading}
      />
    </div>
  )
}
