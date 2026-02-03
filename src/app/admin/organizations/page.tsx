'use client'

import { useState, useEffect } from 'react'
import {
    Building2, Users, MoreVertical, Search,
    Filter, Download, Eye, Ban, Trash2, CheckCircle,
    ChevronDown, X
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminOrganizationsPage() {
    const [organizations, setOrganizations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth('/api/admin/organizations')
            if (res.ok) {
                const json = await res.json()
                setOrganizations(json.data || [])
            } else {
                toast.error('Không thể tải danh sách tổ chức')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    const filteredOrgs = organizations.filter(org => {
        const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.taxCode?.includes(searchTerm) ||
            org.owner?.name.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && org.isActive) ||
            (statusFilter === 'blocked' && !org.isActive)

        return matchesSearch && matchesStatus
    })

    const handleView = (id: string) => {
        router.push(`/admin/organizations/${id}`)
    }

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa tổ chức "${name}"? Hành động này không thể hoàn tác.`)) {
            return
        }

        try {
            const res = await fetchWithAuth(`/api/admin/organizations/${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success('Đã xóa tổ chức thành công')
                setOrganizations(prev => prev.filter(org => org.id !== id))
            } else {
                const error = await res.json()
                toast.error(error.error || 'Không thể xóa tổ chức')
            }
        } catch (error) {
            toast.error('Lỗi khi xóa tổ chức')
        }
    }

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetchWithAuth(`/api/admin/organizations/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !currentStatus })
            })

            if (res.ok) {
                toast.success(currentStatus ? 'Đã chặn tổ chức' : 'Đã bỏ chặn tổ chức')
                setOrganizations(prev => prev.map(org =>
                    org.id === id ? { ...org, isActive: !currentStatus } : org
                ))
            } else {
                toast.error('Không thể cập nhật trạng thái')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Tổ chức (B2B)</h1>
                    <p className="text-slate-500 text-sm">Danh sách các công ty và đội nhóm trên hệ thống</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all">
                        <Download className="w-4 h-4" /> Xuất Excel
                    </button>
                    {/* <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-all shadow-lg shadow-blue-100">
                        <Plus className="w-4 h-4" /> Tạo thủ công
                    </button> */}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên công ty, MST, chủ sở hữu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto relative">
                    <button
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter !== 'all' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        {statusFilter === 'all' ? 'Bộ lọc' : (
                            statusFilter === 'active' ? 'Đang hoạt động' : 'Đã chặn'
                        )}
                        <ChevronDown className={`w-3 h-3 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showFilterDropdown && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái</div>
                            <button
                                onClick={() => { setStatusFilter('all'); setShowFilterDropdown(false) }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${statusFilter === 'all' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-600'}`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => { setStatusFilter('active'); setShowFilterDropdown(false) }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${statusFilter === 'active' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-600'}`}
                            >
                                Đang hoạt động
                            </button>
                            <button
                                onClick={() => { setStatusFilter('blocked'); setShowFilterDropdown(false) }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${statusFilter === 'blocked' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-600'}`}
                            >
                                Đã chặn
                            </button>

                            {statusFilter !== 'all' && (
                                <div className="border-t border-slate-100 mt-2 pt-2 px-2">
                                    <button
                                        onClick={() => { setStatusFilter('all'); setShowFilterDropdown(false) }}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X className="w-3 h-3" /> Xóa bộ lọc
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-xs">
                            <tr>
                                <th className="px-6 py-4">Tổ chức / Công ty</th>
                                <th className="px-6 py-4">Chủ sở hữu</th>
                                <th className="px-6 py-4 text-center">Thành viên</th>
                                <th className="px-6 py-4 text-center">Đơn hàng</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredOrgs.map((org) => (
                                <tr key={org.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                                                {org.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{org.name}</div>
                                                <div className="text-xs text-slate-500 font-medium">MST: {org.taxCode || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">{org.owner.name}</span>
                                            <span className="text-xs text-slate-500">{org.owner.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                                            <Users className="w-3 h-3" />
                                            {org.memberCount}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-700">
                                        {org.orderCount}
                                    </td>
                                    <td className="px-6 py-4">
                                        {org.isActive ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-bold text-xs border border-green-100">
                                                <CheckCircle className="w-3 h-3" /> Hoạt động
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-bold text-xs border border-red-100">
                                                <Ban className="w-3 h-3" /> Đã chặn
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleView(org.id)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(org.id, org.isActive)}
                                                className={`p-2 rounded-lg transition-colors ${org.isActive ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-green-400 hover:text-green-600 hover:bg-green-50'}`}
                                                title={org.isActive ? "Chặn tổ chức" : "Bỏ chặn tổ chức"}
                                            >
                                                {org.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(org.id, org.name)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Xóa vĩnh viễn"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredOrgs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <Building2 className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                                        <p>Không tìm thấy tổ chức nào phù hợp</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
