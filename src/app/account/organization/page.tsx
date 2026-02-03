'use client'

import React, { useState, useEffect } from 'react'
import {
    Users, Building2, UserPlus, Shield,
    ArrowLeft, Plus, Mail, ShieldCheck,
    Trash2, UserCog, Building, Info,
    Loader2, CheckCircle2, XCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'

export default function OrganizationPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const router = useRouter()

    const [organizations, setOrganizations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [createData, setCreateData] = useState({ name: '', taxCode: '', address: '' })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login')
        }
    }, [authLoading, isAuthenticated, router])

    useEffect(() => {
        if (user) {
            fetchOrganizations()
        }
    }, [user])

    const fetchOrganizations = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth('/api/organizations')
            const data = await res.json()
            if (res.ok) {
                setOrganizations(data.data || [])
            }
        } catch (err) {
            toast.error('Không thể tải danh sách tổ chức')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetchWithAuth('/api/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createData)
            })
            if (res.ok) {
                toast.success('Đã tạo tổ chức mới thành công!')
                setShowCreateModal(false)
                setCreateData({ name: '', taxCode: '', address: '' })
                fetchOrganizations()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Có lỗi xảy ra')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setSubmitting(false)
        }
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50 py-20 pb-40">
            <div className="max-w-6xl mx-auto px-6 space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-6">
                        <Link href="/account" className="inline-flex items-center text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100 transition-all hover:gap-3">
                            <ArrowLeft className="h-4 w-4 mr-1 transition-all" /> Quay lại tài khoản
                        </Link>
                        <div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-4">
                                🏢 QUẢN LÝ <span className="text-indigo-600">TỔ CHỨC</span>
                            </h1>
                            <p className="text-slate-500 font-medium text-lg">Quản lý thành viên, hạn mức chi tiêu và phê duyệt đơn hàng doanh nghiệp.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-3 whitespace-nowrap"
                    >
                        <Plus size={20} /> Tạo tổ chức mới
                    </button>
                </div>

                {/* Info Alert */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2.5rem] p-8 flex gap-5 items-start relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                    <div className="bg-white p-3.5 rounded-2xl text-indigo-600 shadow-sm border border-indigo-50 relative z-10">
                        <Info size={24} />
                    </div>
                    <div className="relative z-10">
                        <h4 className="font-black text-indigo-900 text-sm uppercase tracking-widest mb-1.5 ">Về Tài Khoản SmartBuild B2B</h4>
                        <p className="text-indigo-700/80 text-sm font-medium leading-relaxed max-w-4xl">
                            Chế độ tổ chức (B2B) được thiết kế cho các công ty xây dựng và nhà thầu chuyên nghiệp.
                            Bạn có thể mời Buyers tham gia và thiết lập quy trình duyệt đơn hàng (Order Approval)
                            nhằm kiểm soát ngân sách vật tư của dự án hiệu quả nhất.
                        </p>
                    </div>
                </div>

                {/* Organizations List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {organizations.length > 0 ? (
                        organizations.map((org) => (
                            <div key={org.id} className="bg-white rounded-[2.5rem] p-10 border border-slate-50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 group overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-all group-hover:-translate-y-2 group-hover:translate-x-2">
                                    <Building size={140} />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-5 mb-8">
                                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[1.75rem] flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-100">
                                            {org.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{org.name}</h3>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${org.userRole === 'OWNER' ? 'bg-purple-100 text-purple-600' :
                                                    org.userRole === 'ADMIN' ? 'bg-indigo-100 text-indigo-600' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {org.userRole}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                    <Users size={12} /> {org.memberCount} Thành viên
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-10">
                                        <div className="flex items-center gap-4 text-sm text-slate-500 font-bold">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Shield size={16} />
                                            </div>
                                            MST: <span className="text-slate-900">{org.taxCode || 'CHƯA CẬP NHẬT'}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 font-bold">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Building2 size={16} />
                                            </div>
                                            ĐỊA CHỈ: <span className="text-slate-900 line-clamp-1">{org.address || 'CHƯA CẬP NHẬT'}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-8 border-t border-slate-50">
                                        <Link href={`/account/organization/${org.id}`} className="flex-1">
                                            <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-100 active:scale-[0.98]">
                                                Quản lý Đội Nhóm
                                            </button>
                                        </Link>
                                        <Link href={`/account/organization/${org.id}/approvals`} className="flex-1">
                                            <button className="w-full bg-white border border-slate-200 text-slate-600 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm active:scale-[0.98]">
                                                Duyệt Đơn
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 py-20 bg-white rounded-[40px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 shadow-inner">
                                <Users size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase">Bạn chưa tham gia tổ chức nào</h3>
                                <p className="text-slate-500 font-medium mt-1">Hãy tạo tổ chức mới hoặc nhờ quản trị viên gửi lời mời tham gia.</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
                            >
                                Bắt đầu ngay
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !submitting && setShowCreateModal(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
                        <div className="p-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                            <h3 className="text-3xl font-black tracking-tighter uppercase">Tạo Tổ Chức Mới</h3>
                            <p className="text-blue-100 font-medium text-sm mt-1">Thiết lập môi trường làm việc B2B cho đội nhóm của bạn.</p>
                        </div>

                        <form onSubmit={handleCreate} className="p-10 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên tổ chức / Công ty</label>
                                    <input
                                        type="text"
                                        required
                                        value={createData.name}
                                        onChange={e => setCreateData({ ...createData, name: e.target.value })}
                                        placeholder="Vd: Công ty Xây Dựng ABC"
                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mã số thuế</label>
                                    <input
                                        type="text"
                                        value={createData.taxCode}
                                        onChange={e => setCreateData({ ...createData, taxCode: e.target.value })}
                                        placeholder="Nhập MST (Nếu có)"
                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Địa chỉ trụ sở</label>
                                    <input
                                        type="text"
                                        value={createData.address}
                                        onChange={e => setCreateData({ ...createData, address: e.target.value })}
                                        placeholder="Vd: 123 Đường Láng, Hà Nội"
                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl active:scale-[0.98] transition-all text-[10px] uppercase tracking-widest"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-[10px] uppercase tracking-widest disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác nhận tạo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
