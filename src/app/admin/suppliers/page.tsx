'use client'

import { useState, useEffect } from 'react'
import {
    Building2,
    Search,
    Filter,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    Plus,
    Mail,
    Phone,
    MapPin,
    Shield,
    AlertCircle,
    Package,
    ShoppingCart,
    MessageSquare,
    ExternalLink,
    RefreshCw
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface Supplier {
    id: string
    name: string
    email: string
    phone: string
    taxId: string
    address?: string
    city?: string
    isActive: boolean
    createdAt: string
    userId?: string
    _count?: {
        products: number
        purchaseOrders: number
    }
}

export default function SuppliersManagementPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [creating, setCreating] = useState(false)
    const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null)
    const [activeMenu, setActiveMenu] = useState<string | null>(null)
    const router = useRouter()

    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        name: '',
        taxId: '',
        email: '',
        phone: '',
        address: '',
        city: ''
    })

    // Form state for new supplier
    const [formData, setFormData] = useState({
        name: '',
        taxId: '',
        email: '',
        phone: '',
        address: '',
        city: ''
    })


    {/* View Supplier Modal */ }


    useEffect(() => {
        fetchSuppliers()
        // Close menu when clicking outside - using a more reliable native event check
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Only close if we didn't click the trigger button or inside the menu
            if (!target.closest('.menu-trigger') && !target.closest('.menu-container')) {
                setActiveMenu(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchSuppliers = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/suppliers')
            const data = await res.json()
            if (data.success) {
                setSuppliers(data.data)
            } else {
                toast.error('Không thể tải danh sách nhà cung cấp')
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error)
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateSupplier = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        try {
            const res = await fetch('/api/admin/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await res.json()

            if (data.success) {
                toast.success('Thêm nhà cung cấp thành công')
                setShowCreateModal(false)
                setFormData({ name: '', taxId: '', email: '', phone: '', address: '', city: '' })
                fetchSuppliers()
            } else {
                toast.error(data.error?.message || 'Thêm thất bại')
            }
        } catch (error) {
            toast.error('Lỗi hệ thống')
        } finally {
            setCreating(false)
        }
    }

    const handleUpdateSupplier = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!viewingSupplier) return

        try {
            const res = await fetch('/api/admin/suppliers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: viewingSupplier.id,
                    action: 'update',
                    ...editForm
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Cập nhật thông tin thành công')
                setIsEditing(false)
                setViewingSupplier(data.data) // Update UI with new data
                fetchSuppliers() // Refresh list
            } else {
                toast.error(data.error?.message || 'Cập nhật thất bại')
            }
        } catch (error) {
            toast.error('Lỗi hệ thống')
        }
    }

    const handleUpdateStatus = async (id: string, action: 'approve' | 'reject' | 'deactivate') => {
        try {
            const res = await fetch('/api/admin/suppliers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                fetchSuppliers()
            } else {
                toast.error(data.error?.message || 'Cập nhật thất bại')
            }
        } catch (error) {
            toast.error('Lỗi hệ thống')
        }
    }

    const handleChat = async (otherUserId: string) => {
        if (!otherUserId) {
            toast.error('Nhà cung cấp này chưa được liên kết tài khoản')
            return
        }
        try {
            const res = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientId: otherUserId })
            })
            const data = await res.json()
            if (data.success) {
                router.push(`/admin/messages?id=${data.data.id}`)
            } else {
                toast.error('Không thể tạo cuộc hội thoại')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        }
    }

    const filteredSuppliers = suppliers.filter(supplier => {
        const matchesSearch =
            supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            supplier.taxId?.includes(searchQuery)

        if (filterStatus === 'all') return matchesSearch
        if (filterStatus === 'active') return matchesSearch && supplier.isActive
        if (filterStatus === 'pending') return matchesSearch && !supplier.isActive

        return matchesSearch
    })

    const pendingCount = suppliers.filter(s => !s.isActive).length

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Building2 className="text-blue-600" size={32} />
                        Quản Lý Nhà Cung Cấp
                    </h1>
                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        Đối tác cung ứng & Hệ thống phân phối
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchSuppliers}
                        disabled={loading}
                        className="p-3 bg-white text-slate-400 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100 shadow-sm"
                        title="Tải lại dữ liệu"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={14} />
                        Thêm mới NCC
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                            <Building2 size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng đối tác</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{suppliers.length}</div>
                    <div className="text-xs font-bold text-emerald-500 mt-2 uppercase tracking-tight flex items-center gap-1">
                        <CheckCircle size={12} /> Hệ thống ổn định
                    </div>
                </div>

                <div
                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm cursor-pointer hover:border-orange-200 transition-colors"
                    onClick={() => setFilterStatus('pending')}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-orange-50 text-orange-600">
                            <AlertCircle size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chờ phê duyệt</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{pendingCount}</div>
                    <div className="text-xs font-bold text-orange-500 mt-2 uppercase tracking-tight flex items-center gap-1">
                        <Shield size={12} /> Cần xác minh
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                            <CheckCircle size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang hoạt động</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{suppliers.filter(s => s.isActive).length}</div>
                    <div className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-tight">
                        Sẵn sàng cung ứng
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterStatus === 'all' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => setFilterStatus('active')}
                        className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterStatus === 'active' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                        Đã xác thực
                    </button>
                    <button
                        onClick={() => setFilterStatus('pending')}
                        className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterStatus === 'pending' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                        Chờ duyệt {pendingCount > 0 && `(${pendingCount})`}
                    </button>
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên, email, mã số thuế..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    />
                </div>
            </div>

            {/* Suppliers List */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-visible min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px]">
                        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
                    </div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Building2 className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">Không tìm thấy nhà cung cấp</h3>
                        <p className="text-slate-500 max-w-xs mx-auto text-sm">Chưa có dữ liệu phù hợp với bộ lọc hiện tại.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin doanh nghiệp</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Liên hệ</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Hoạt động</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredSuppliers.map((supplier) => (
                                    <tr
                                        key={supplier.id}
                                        className={`hover:bg-blue-50/30 transition-all group relative cursor-pointer ${activeMenu === supplier.id ? 'bg-blue-50/50' : ''}`}
                                        onClick={() => {
                                            setViewingSupplier(supplier)
                                            setEditForm({
                                                name: supplier.name,
                                                taxId: supplier.taxId,
                                                email: supplier.email,
                                                phone: supplier.phone || '',
                                                address: supplier.address || '',
                                                city: supplier.city || ''
                                            })
                                            setIsEditing(false)
                                        }}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-lg border border-white shadow-sm">
                                                    {supplier.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                                                        {supplier.name}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                                            MST: {supplier.taxId}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                                    <Mail size={14} className="text-slate-400" />
                                                    {supplier.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                                    <Phone size={14} className="text-slate-400" />
                                                    {supplier.phone || 'N/A'}
                                                </div>
                                                {supplier.city && (
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                                        <MapPin size={14} className="text-slate-400" />
                                                        {supplier.city}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center gap-4">
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                        <Package size={12} /> SP
                                                    </div>
                                                    <div className="font-black text-slate-900">{supplier._count?.products || 0}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                        <ShoppingCart size={12} /> Đơn
                                                    </div>
                                                    <div className="font-black text-slate-900">{supplier._count?.purchaseOrders || 0}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {supplier.isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                    <CheckCircle size={12} /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest border border-orange-100 animate-pulse">
                                                    <AlertCircle size={12} /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right relative">
                                            {!supplier.isActive ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            handleUpdateStatus(supplier.id, 'approve')
                                                        }}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                                                        title="Duyệt hồ sơ"
                                                    >
                                                        <CheckCircle size={14} /> Duyệt
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            handleUpdateStatus(supplier.id, 'reject')
                                                        }}
                                                        className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                                                        title="Từ chối"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            setActiveMenu(activeMenu === supplier.id ? null : supplier.id)
                                                        }}
                                                        className={`p-2 rounded-xl transition-all menu-trigger ${activeMenu === supplier.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                                                        title="Thao tác"
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </button>

                                                    {activeMenu === supplier.id && (
                                                        <div
                                                            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right menu-container"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tùy chọn quản lý</p>
                                                            </div>
                                                            <button
                                                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3"
                                                                onClick={() => {
                                                                    setViewingSupplier(supplier)
                                                                    setEditForm({
                                                                        name: supplier.name,
                                                                        taxId: supplier.taxId,
                                                                        email: supplier.email,
                                                                        phone: supplier.phone || '',
                                                                        address: supplier.address || '',
                                                                        city: supplier.city || ''
                                                                    })
                                                                    setIsEditing(false)
                                                                    setActiveMenu(null)
                                                                }}
                                                            >
                                                                <Building2 size={14} className="text-slate-400" />
                                                                Xem chi tiết
                                                            </button>
                                                            <button
                                                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors flex items-center gap-3"
                                                                onClick={() => {
                                                                    if (supplier.userId) handleChat(supplier.userId)
                                                                    else toast.error('NCC chưa có tài khoản hệ thống')
                                                                    setActiveMenu(null)
                                                                }}
                                                            >
                                                                <MessageSquare size={14} className="text-slate-400" />
                                                                Nhắn tin hỗ trợ
                                                            </button>
                                                            <button
                                                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-3"
                                                                onClick={() => {
                                                                    if ((supplier._count?.products || 0) > 0) {
                                                                        router.push(`/admin/inventory?supplier=${supplier.id}`)
                                                                    } else {
                                                                        toast.error('Nhà cung cấp này chưa có sản phẩm nào trên hệ thống', {
                                                                        })
                                                                    }
                                                                    setActiveMenu(null)
                                                                }}
                                                            >
                                                                <Package size={14} className="text-slate-400" />
                                                                Danh sách sản phẩm
                                                            </button>
                                                            <div className="h-px bg-slate-50 my-2 mx-4" />
                                                            <button
                                                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                                                                onClick={() => {
                                                                    if (confirm(`Bạn có chắc muốn ngưng kích hoạt nhà cung cấp "${supplier.name}"?`)) {
                                                                        handleUpdateStatus(supplier.id, 'deactivate')
                                                                    }
                                                                    setActiveMenu(null)
                                                                }}
                                                            >
                                                                <XCircle size={14} className="text-red-400" />
                                                                Ngưng kích hoạt
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* View Supplier Modal */}
            {viewingSupplier && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl p-8 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Building2 size={32} />
                                </div>
                                <div>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            className="text-2xl font-black text-slate-900 tracking-tight bg-slate-50 border-none rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    ) : (
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{viewingSupplier.name}</h3>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${viewingSupplier.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {viewingSupplier.isActive ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                            {viewingSupplier.isActive ? 'Active' : 'Pending'}
                                        </span>
                                        <span className="text-sm font-medium text-slate-400">ID: {viewingSupplier.id.slice(-6).toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingSupplier(null)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <XCircle className="w-8 h-8 text-slate-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Thông tin liên hệ</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Mail size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                                                {isEditing ? (
                                                    <input
                                                        type="email"
                                                        value={editForm.email}
                                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                        className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                ) : (
                                                    <p className="font-bold text-slate-900">{viewingSupplier.email}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Phone size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Hotline</p>
                                                {isEditing ? (
                                                    <input
                                                        type="tel"
                                                        value={editForm.phone}
                                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                                        className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                ) : (
                                                    <p className="font-bold text-slate-900">{viewingSupplier.phone || 'Chưa cập nhật'}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                <MapPin size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Địa chỉ</p>
                                                {isEditing ? (
                                                    <div className="space-y-2 mt-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Địa chỉ..."
                                                            value={editForm.address}
                                                            onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-lg bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Thành phố..."
                                                            value={editForm.city}
                                                            onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-lg bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="font-bold text-slate-900 line-clamp-2">{viewingSupplier.address || 'Chưa cập nhật'}</p>
                                                        {viewingSupplier.city && <p className="text-xs font-medium text-slate-500 mt-0.5">{viewingSupplier.city}</p>}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Thông tin pháp lý</h4>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="mb-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Mã số thuế</p>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.taxId}
                                                    onChange={e => setEditForm({ ...editForm, taxId: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                                                />
                                            ) : (
                                                <p className="text-lg font-black text-slate-900 tracking-tight">{viewingSupplier.taxId}</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ngày tham gia</p>
                                            <p className="font-bold text-slate-700">
                                                {new Date(viewingSupplier.createdAt).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tổng quan hoạt động</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                            <div className="flex items-center gap-2 mb-2 text-blue-600">
                                                <Package size={16} />
                                                <span className="text-[10px] font-black uppercase">Sản phẩm</span>
                                            </div>
                                            <p className="text-2xl font-black text-slate-900">{viewingSupplier._count?.products || 0}</p>
                                        </div>
                                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                            <div className="flex items-center gap-2 mb-2 text-indigo-600">
                                                <ShoppingCart size={16} />
                                                <span className="text-[10px] font-black uppercase">Đơn hàng</span>
                                            </div>
                                            <p className="text-2xl font-black text-slate-900">{viewingSupplier._count?.purchaseOrders || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleUpdateSupplier}
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20"
                                    >
                                        Lưu thay đổi
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setViewingSupplier(null)}
                                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                                    >
                                        Đóng
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-blue-500/20"
                                    >
                                        Chỉnh sửa thông tin
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Supplier Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Thêm Đối Tác Mới</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Tạo tài khoản nhà cung cấp thủ công</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <XCircle className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSupplier} className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5">Tên doanh nghiệp <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Nhập tên đầy đủ..."
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5">Mã số thuế <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="VD: 0312345678"
                                            value={formData.taxId}
                                            onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5">Số điện thoại</label>
                                        <input
                                            type="tel"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Liên hệ..."
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5">Email liên hệ <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="email@company.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5">Thành phố</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Tỉnh/Thành..."
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5">Địa chỉ</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Số nhà, đường..."
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-[2] py-3.5 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {creating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={16} />
                                            Xác nhận tạo mới
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
