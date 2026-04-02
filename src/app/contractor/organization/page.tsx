'use client'

import React, { useState, useEffect } from 'react'
import {
    Users, Building2, Shield,
    ArrowLeft, Plus,
    Building, Info,
    Loader2, ChevronRight, Activity, Cpu, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/lib/api-client'
import { toast, Toaster } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'

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
            toast.error('Giao thức lỗi: Không thể đồng bộ danh sách tổ chức.')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        const toastId = toast.loading('Đang khởi tạo thực thể B2B trên mạng lưới...')
        try {
            const res = await fetchWithAuth('/api/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createData)
            })
            if (res.ok) {
                toast.success('Đã kích hoạt tổ chức mới thành công!', { id: toastId })
                setShowCreateModal(false)
                setCreateData({ name: '', taxCode: '', address: '' })
                fetchOrganizations()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Lỗi: Tên tổ chức đã tồn tại hoặc không hợp lệ.', { id: toastId })
            }
        } catch (err) {
            toast.error('Lỗi kết nối vệ tinh: Vui lòng thử lại.', { id: toastId })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-12 pb-24 max-w-7xl mx-auto">
            <Toaster position="top-right" />
            
            {/* Header / Command Navigation */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/contractor/dashboard"
                            className="w-14 h-14 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-blue-600 rounded-[1.5rem] transition-all shadow-sm active:scale-90 group"
                        >
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-5 leading-none">
                            <Building2 className="w-12 h-12 text-blue-600" />
                            Mạng lưới B2B
                        </h1>
                    </div>
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] italic ml-20">Thiết lập & Điều hành tổ chức thi công chuyên nghiệp</p>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-10 py-6 bg-blue-600 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-4 active:scale-95 italic group"
                >
                    <Plus size={20} className="group-hover:rotate-180 transition-transform duration-500" /> Khởi tạo Tổ chức
                </button>
            </div>

            {/* Strategic Info Module */}
            <div className="bg-indigo-600 rounded-[3.5rem] p-12 lg:p-14 text-white relative overflow-hidden shadow-2xl shadow-indigo-200 group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-1000 group-hover:scale-125"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-inner group-hover:rotate-12 transition-transform shadow-blue-500">
                        <Cpu size={40} className="text-blue-200" />
                    </div>
                    <div className="space-y-3 flex-1">
                        <h4 className="text-[10px] font-black text-blue-300 uppercase tracking-[0.4em] italic mb-1 flex items-center gap-3">
                            <Activity size={14} className="animate-pulse" /> Vận hành thực thể (Entity Operations)
                        </h4>
                        <p className="text-lg font-bold text-slate-100 italic tracking-tight leading-relaxed">
                            Kích hoạt vai trò "Nhà thầu Pháp nhân" để quản lý dòng tiền, nhân sự tập trung và tham gia các gói đấu thầu dự án quy mô lớn. 
                            Mọi đơn hàng từ thành viên sẽ được chuyển đến bạn phê duyệt trước khi kích hoạt thanh toán.
                        </p>
                    </div>
                </div>
            </div>

            {/* Organizations Grid Marketplace */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-[3.5rem] p-14 border border-slate-50 h-64 animate-pulse shadow-sm"></div>
                    ))
                ) : organizations.length > 0 ? (
                    organizations.map((org) => (
                        <div key={org.id} className="bg-white rounded-[4rem] p-12 lg:p-14 border border-slate-50 shadow-2xl shadow-slate-200/40 group overflow-hidden relative transition-all hover:scale-[1.02]">
                            {/* Role Stripe */}
                            <div className="absolute top-0 left-0 w-3 h-full bg-blue-600"></div>
                            
                            <div className="relative z-10 space-y-12">
                                <div className="flex items-center gap-8">
                                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-blue-600 border border-slate-100 font-black text-4xl italic shadow-inner group-hover:shadow-2xl group-hover:shadow-blue-100 transition-all">
                                        {org.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{org.name}</h3>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest italic border ${org.userRole === 'OWNER' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' :
                                                org.userRole === 'ADMIN' ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100' :
                                                    'bg-slate-100 text-slate-400 border-slate-200'
                                                }`}>
                                                {org.userRole === 'OWNER' ? 'Chủ sở hữu' : org.userRole === 'ADMIN' ? 'Quản trị viên' : 'Thành viên'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic flex items-center gap-2">
                                                <Users size={14} className="text-blue-500" />
                                                {org.memberCount} Thành viên
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10 border-t border-slate-50">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Mã số thuế</p>
                                        <p className="font-black text-slate-900 italic tracking-tight">{org.taxCode || 'CHƯA XÁC THỰC'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Trụ sở chính</p>
                                        <p className="font-black text-slate-900 italic tracking-tight truncate">{org.address || 'Liên hệ để cập nhật'}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-5">
                                    <Link href={`/contractor/organization/${org.id}`} className="flex-1">
                                        <button className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3 italic">
                                            <Users size={18} /> Nhân sự & Phân quyền
                                        </button>
                                    </Link>
                                    <Link href={`/contractor/organization/${org.id}/approvals`} className="flex-1">
                                        <button className="w-full bg-white border border-slate-100 text-slate-900 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3 italic shadow-sm">
                                            <Shield size={18} className="text-indigo-600" /> Duyệt Vật tư
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-40 bg-white rounded-[4rem] border-4 border-dashed border-slate-50 flex flex-col items-center justify-center text-center space-y-10 group cursor-pointer hover:border-blue-200 hover:bg-blue-50/20 transition-all duration-700">
                        <div className="w-32 h-32 bg-slate-50 rounded-[3.5rem] flex items-center justify-center text-slate-200 group-hover:rotate-12 group-hover:scale-110 transition-all duration-700 shadow-inner">
                            <Building size={64} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Hệ thống chưa ghi nhận Tổ chức</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic max-w-lg mx-auto">Vui lòng khởi tạo một thực thể B2B để bắt đầu mô hình quản lý nhân sự chuyên nghiệp.</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 text-white px-12 py-7 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all active:scale-95 italic flex items-center gap-4"
                        >
                            <Sparkles size={20} /> Thiết lập B2B ngay
                        </button>
                    </div>
                )}
            </div>

            {/* Create Entity Shard Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => !submitting && setShowCreateModal(false)} />
                    <div className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-500">
                        <div className="p-14 bg-blue-600 text-white relative">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24"></div>
                            <h3 className="text-4xl font-black tracking-tighter uppercase italic mb-2">Khởi tạo Thực thể</h3>
                            <p className="text-blue-100 font-black uppercase text-[10px] tracking-[0.2em] italic opacity-80">Thiết lập cấu trúc vận hành cho doanh nghiệp thầu</p>
                        </div>

                        <form onSubmit={handleCreate} className="p-14 space-y-10 group/form">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-4 leading-none">Danh xưng Tổ chức (Tên công ty/đội)</label>
                                    <input
                                        type="text"
                                        required
                                        value={createData.name}
                                        onChange={e => setCreateData({ ...createData, name: e.target.value })}
                                        placeholder="Vd: Công ty Xây Dựng Số 1"
                                        className="w-full px-10 py-6 bg-slate-50 border-none rounded-[2rem] text-sm font-black italic uppercase outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all placeholder:text-slate-200"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-4 leading-none">Mã số thuế (Tùy chọn)</label>
                                    <input
                                        type="text"
                                        value={createData.taxCode}
                                        onChange={e => setCreateData({ ...createData, taxCode: e.target.value })}
                                        placeholder="010xxxxxxx"
                                        className="w-full px-10 py-6 bg-slate-50 border-none rounded-[2rem] text-sm font-black tabular-nums italic outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all placeholder:text-slate-200"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-4 leading-none">Địa chỉ kinh doanh tập trung</label>
                                    <input
                                        type="text"
                                        value={createData.address}
                                        onChange={e => setCreateData({ ...createData, address: e.target.value })}
                                        placeholder="Vd: Số 123 Đường Láng, Hà Nội"
                                        className="w-full px-10 py-6 bg-slate-50 border-none rounded-[2rem] text-sm font-black italic outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all placeholder:text-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-5 pt-4">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-10 bg-slate-50 text-slate-400 font-black rounded-[2.5rem] hover:bg-slate-100 transition-all text-[11px] uppercase tracking-[0.3em] italic active:scale-95"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] py-10 bg-blue-600 text-white font-black rounded-[2.5rem] shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-4 text-[11px] uppercase tracking-[0.3em] italic hover:bg-blue-700 active:scale-95 disabled:opacity-50 group/save"
                                >
                                    {submitting ? <Loader2 className="w-8 h-8 animate-spin" /> : <SaveIcon className="w-8 h-8 group-hover/save:scale-125 transition-transform" />}
                                    Xác nhận khởi tạo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

const SaveIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
)
