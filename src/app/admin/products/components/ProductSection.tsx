'use client'

import React from 'react'
import { Package, Search, Plus, ChevronUp, ChevronDown, Tag, Edit, Trash2 } from 'lucide-react'
import { Product, getStockStatus } from '../types'
import Pagination from '@/components/Pagination'

interface ProductSectionProps {
    products: Product[]
    loading: boolean
    expanded: boolean
    onToggle: () => void
    onRefresh: () => void
    onAdd: () => void
    onEdit: (product: Product) => void
    onDelete: (product: Product) => void
    search: string
    onSearchChange: (val: string) => void
    page: number
    onPageChange: (page: number) => void
    pageSize: number
    totalItems: number
}

export default function ProductSection({
    products,
    loading,
    expanded,
    onToggle,
    onRefresh,
    onAdd,
    onEdit,
    onDelete,
    search,
    onSearchChange,
    page,
    onPageChange,
    pageSize,
    totalItems
}: ProductSectionProps) {
    // Data is now paginated and filtered on the server
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedProducts = products

    return (
        <div className="bg-white rounded-lg shadow">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
            >
                <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Sản Phẩm</h2>
                    <span className="text-sm text-gray-500">({totalItems} sản phẩm)</span>
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
                                placeholder="Tìm kiếm sản phẩm..."
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <button
                                type="button"
                                onClick={onRefresh}
                                disabled={loading}
                                className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                <svg className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Làm mới
                            </button>
                            <button
                                onClick={onAdd}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Thêm sản phẩm
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
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
                                                                onClick={() => onEdit(product)}
                                                                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                                                                title="Chỉnh sửa"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => onDelete(product)}
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
