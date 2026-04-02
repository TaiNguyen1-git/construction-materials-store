'use client'

import React from 'react'
import { Building, Search, Plus, ChevronUp, ChevronDown, User, Mail, Phone, MapPin, Star, Edit, Trash2 } from 'lucide-react'
import { Supplier } from '../types'
import Pagination from '@/components/Pagination'
import { TableSkeleton } from '@/components/admin/skeletons/AdminSkeletons'

interface SupplierSectionProps {
    suppliers: Supplier[]
    loading: boolean
    expanded: boolean
    onToggle: () => void
    onAdd: () => void
    onEdit: (supplier: Supplier) => void
    onDelete: (supplier: Supplier) => void
    search: string
    onSearchChange: (val: string) => void
    page: number
    onPageChange: (page: number) => void
    pageSize: number
    totalItems: number
}

export default function SupplierSection({
    suppliers,
    loading,
    expanded,
    onToggle,
    onAdd,
    onEdit,
    onDelete,
    search,
    onSearchChange,
    page,
    onPageChange,
    pageSize,
    totalItems
}: SupplierSectionProps) {
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedSuppliers = suppliers

    return (
        <div className="bg-white rounded-lg shadow">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
            >
                <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Nhà Cung Cấp</h2>
                    <span className="text-sm text-gray-500">({totalItems} nhà cung cấp)</span>
                </div>
                {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded && (
                <div className="border-t p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="Tìm kiếm nhà cung cấp..."
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={onAdd}
                            className="ml-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Thêm NCC
                        </button>
                    </div>

                    {loading ? (
                        <TableSkeleton rows={8} />
                    ) : (
                        <>
                            <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
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
                                                            onClick={() => onEdit(supplier)}
                                                            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => onDelete(supplier)}
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

                            {totalPages > 1 && (
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    totalItems={totalItems}
                                    itemsPerPage={pageSize}
                                    onPageChange={onPageChange}
                                    loading={loading}
                                />
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
