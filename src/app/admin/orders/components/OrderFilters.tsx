import React from 'react'
import { Customer, OrderFilters as OrderFiltersType } from '../types'

interface OrderFiltersProps {
  filters: OrderFiltersType
  searchInput: string
  setSearchInput: (val: string) => void
  setFilters: (val: any) => void
  customers: Customer[]
  getStatusLabel: (status: string) => string
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  filters,
  searchInput,
  setSearchInput,
  setFilters,
  customers,
  getStatusLabel
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      {/* Search Row */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">🔍 Tìm kiếm</label>
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nhập mã đơn hàng, SĐT, hoặc tên khách hàng..."
            className="w-full border border-gray-300 rounded-md pl-10 pr-10 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchInput && searchInput !== filters.search && (
          <p className="text-xs text-gray-400 mt-1">⏳ Đang chờ tìm kiếm...</p>
        )}
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng Thái</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất Cả Trạng Thái</option>
            <optgroup label="Đang Chờ">
              <option value="PENDING_CONFIRMATION">⏰ Chờ Xác Nhận</option>
              <option value="PENDING">📋 Chờ Xử Lý</option>
              <option value="CONFIRMED_AWAITING_DEPOSIT">💳 Chờ Đặt Cọc</option>
            </optgroup>
            <optgroup label="Đang Xử Lý">
              <option value="DEPOSIT_PAID">✅ Đã Cọc</option>
              <option value="CONFIRMED">✔️ Đã Xác Nhận</option>
              <option value="PROCESSING">⚙️ Đang Chuẩn Bị</option>
              <option value="SHIPPED">🚚 Đang Giao Hàng</option>
            </optgroup>
            <optgroup label="Hoàn Thành">
              <option value="DELIVERED">📦 Đã Giao</option>
              <option value="COMPLETED">🎉 Hoàn Thành</option>
            </optgroup>
            <optgroup label="Đã Hủy">
              <option value="CANCELLED">❌ Đã Hủy</option>
              <option value="RETURNED">↩️ Đã Trả Hàng</option>
            </optgroup>
          </select>
        </div>

        {/* Customer Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loại Khách Hàng</label>
          <select
            value={filters.customerType}
            onChange={(e) => setFilters({ ...filters, customerType: e.target.value, customerId: '', page: 1 })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất Cả</option>
            <option value="REGISTERED">👤 Khách Đăng Ký</option>
            <option value="GUEST">🚶 Khách Vãng Lai</option>
          </select>
        </div>

        {/* Registered Customer Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Khách Hàng Đăng Ký</label>
          <select
            value={filters.customerId}
            onChange={(e) => setFilters({ ...filters, customerId: e.target.value, page: 1 })}
            disabled={filters.customerType === 'GUEST'}
            className={`w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 ${filters.customerType === 'GUEST' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <option value="">Tất Cả Khách Đăng Ký</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.email})
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchInput('')
              setFilters({ status: '', customerId: '', customerType: '', search: '', page: 1 })
            }}
            className="w-full px-4 py-2 border border-blue-200 bg-blue-50 rounded-md text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 font-bold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Xóa Bộ Lọc
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.status || filters.customerType || filters.search || filters.customerId) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Đang lọc:</span>
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                🔍 "{filters.search}"
                <button onClick={() => {
                  setSearchInput('')
                  setFilters({ ...filters, search: '', page: 1 })
                }} className="ml-1 hover:text-blue-600">×</button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {getStatusLabel(filters.status)}
                <button onClick={() => setFilters({ ...filters, status: '', page: 1 })} className="ml-1 hover:text-purple-600">×</button>
              </span>
            )}
            {filters.customerType && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {filters.customerType === 'GUEST' ? '🚶 Khách vãng lai' : '👤 Khách đăng ký'}
                <button onClick={() => setFilters({ ...filters, customerType: '', page: 1 })} className="ml-1 hover:text-green-600">×</button>
              </span>
            )}
            {filters.customerId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                👤 {customers.find(c => c.id === filters.customerId)?.name || 'Khách hàng'}
                <button onClick={() => setFilters({ ...filters, customerId: '', page: 1 })} className="ml-1 hover:text-yellow-600">×</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderFilters
