'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'
import ConfirmDialog from '@/components/ConfirmDialog'
import FormModal from '@/components/FormModal'
import Pagination from '@/components/Pagination'

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
        // Handle nested data structure
        const customersData = data.data?.data || data.data || []
        const customersArray = Array.isArray(customersData) ? customersData : []
        console.log('Fetched customers:', customersArray.length)
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

  const updateCustomerStatus = async (customerId: string, status: string) => {
    try {
      const response = await fetchWithAuth(`/api/customers/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast.success(`Khách hàng đã ${status === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hóa'}`)
        fetchCustomers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Không thể cập nhật khách hàng')
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error('Không thể cập nhật khách hàng')
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Khách Hàng</h1>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Thêm Khách Hàng
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm Kiếm</label>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
            />
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
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', search: '' })}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Xóa Bộ Lọc
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách Hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liên Hệ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn Hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày Tham Gia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {customer.phone && <div className="text-sm text-gray-900">{customer.phone}</div>}
                      {customer.address && <div className="text-sm text-gray-500">{customer.address}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer._count?.orders || 0} đơn hàng
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(customer.status)}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openModal(customer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => setDeletingCustomer(customer)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* Customer Form Modal */}
      <FormModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingCustomer ? 'Sửa Khách Hàng' : 'Thêm Khách Hàng Mới'}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên Khách Hàng *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số Điện Thoại</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa Chỉ</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng Thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
            >
              <option value="ACTIVE">Hoạt Động</option>
              <option value="INACTIVE">Ngừng Hoạt Động</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={closeModal}
              disabled={formLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
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