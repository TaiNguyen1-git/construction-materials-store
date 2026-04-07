'use client'

import React, { useState, useEffect } from 'react'
import {
    Users, Building2, Shield,
    ArrowLeft, Plus,
    Info,
    Loader2, ChevronRight, Activity, Cpu, Sparkles, Save
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/lib/api-client'
import { toast, Toaster } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'

export default function ContractorOrganizationPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const router = useRouter()

    const [organizations, setOrganizations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [createData, setCreateData] = useState({ name: '', taxCode: '', address: '' })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (user && isAuthenticated) {
            fetchOrganizations()
        }
    }, [user, isAuthenticated])

    const fetchOrganizations = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth('/api/organizations')
            const data = await res.json()
            if (res.ok) {
                setOrganizations(data.data || [])
            }
        } catch (err) {
            toast.error('Không thể đồng bộ danh sách tổ chức.')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        const toastId = toast.loading('Đang khởi tạo tổ chức...')
        try {
            const res = await fetchWithAuth('/api/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createData)
            })
            if (res.ok) {
                toast.success('Đã khởi tạo tổ chức thành công!', { id: toastId })
                setShowCreateModal(false)
                setCreateData({ name: '', taxCode: '', address: '' })
                fetchOrganizations()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Lỗi: Tên tổ chức không hợp lệ.', { id: toastId })
            }
        } catch (err) {
            toast.error('Lỗi kết nối: Vui lòng thử lại.', { id: toastId })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            <Toaster position="top-right" />
            
            {/* Standard Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 sm:px-0">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-primary" />
                        Tổ chức & Công ty
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Quản lý mạng lưới và phân quyền nhân sự B2B</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/contractor/dashboard"
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-primary rounded-xl transition-all shadow-sm active:scale-90"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95"
                    >
                        <Plus size={18} /> Thêm tổ chức
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                        <Shield size={32} />
                    </div>
                    <div className="space-y-1 flex-1">
                        <h4 className="text-sm font-bold text-indigo-200 uppercase tracking-wider mb-1 flex items-center gap-2">
                             Quản trị Pháp nhân
                        </h4>
                        <p className="text-base font-semibold text-white/90 leading-relaxed">
                            Thiết lập tổ chức để quản lý dòng tiền tập trung, phê duyệt vật tư từ các thành viên trong đội thợ và tham gia đấu thầu các dự án quy mô lớn.
                        </p>
                    </div>
                </div>
            </div>

            {/* Organizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-8 border border-slate-50 h-56 animate-pulse shadow-sm"></div>
                    ))
                ) : organizations.length > 0 ? (
                    organizations.map((org) => (
                        <div key={org.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-primary border border-slate-100 font-bold text-2xl group-hover:bg-primary group-hover:text-white transition-all">
                                        {org.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{org.name}</h3>
                                        <div className="flex items-center gap-3">
                                            <Badge className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-none ${org.userRole === 'OWNER' ? 'bg-indigo-600/10 text-indigo-600 border-indigo-200' :
                                                org.userRole === 'ADMIN' ? 'bg-blue-600/10 text-blue-600 border-blue-200' :
                                                    'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                {org.userRole === 'OWNER' ? 'Chủ sở hữu' : org.userRole === 'ADMIN' ? 'Quản trị viên' : 'Thành viên'}
                                            </Badge>
                                            <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                                                <Users size={14} className="text-primary/60" />
                                                {org.memberCount} Thành viên
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mã số thuế</p>
                                        <p className="text-sm font-bold text-slate-700">{org.taxCode || 'Chưa cập nhật'}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trụ sở</p>
                                        <p className="text-sm font-bold text-slate-700 truncate">{org.address || 'Hồ Chí Minh'}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <Link href={`/contractor/organization/${org.id}`} className="flex-1">
                                        <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2">
                                            <Users size={16} /> Nhân sự
                                        </button>
                                    </Link>
                                    <Link href={`/contractor/organization/${org.id}/approvals`} className="flex-1">
                                        <button className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                            <Shield size={16} className="text-indigo-600" /> Duyệt Vật tư
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-32 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                            <Building size={40} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-900">Chưa có tổ chức nào</h3>
                            <p className="text-sm text-slate-400 font-medium">Khởi tạo tổ chức để vận hành đội nhóm chuyên nghiệp hơn.</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-all active:scale-95"
                        >
                            Thiết lập Tổ chức ngay
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => !submitting && setShowCreateModal(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 bg-slate-900 text-white">
                            <h3 className="text-xl font-bold uppercase tracking-tight">Thêm Tổ chức mới</h3>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Tên Tổ chức / Công ty</label>
                                    <input
                                        type="text"
                                        required
                                        value={createData.name}
                                        onChange={e => setCreateData({ ...createData, name: e.target.value })}
                                        placeholder="Vd: Công ty Xây Dựng Số 1"
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Mã số thuế</label>
                                    <input
                                        type="text"
                                        value={createData.taxCode}
                                        onChange={e => setCreateData({ ...createData, taxCode: e.target.value })}
                                        placeholder="010xxxxxxx"
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Địa chỉ trụ sở</label>
                                    <input
                                        type="text"
                                        value={createData.address}
                                        onChange={e => setCreateData({ ...createData, address: e.target.value })}
                                        placeholder="Vd: Số 123 Đường Láng, Hà Nội"
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-200 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                                    Lưu tổ chức
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

const Building = ({ className, size }: { className?: string, size?: number }) => (
    <svg className={className} width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>
)
