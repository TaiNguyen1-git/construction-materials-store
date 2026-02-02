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
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12">
            <div className="max-w-6xl mx-auto px-6 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <Link href="/account" className="inline-flex items-center text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 transition-all">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại tài khoản
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                            🏢 Quản Lý Tổ Chức <span className="text-blue-600">(B2B)</span>
                        </h1>
                        <p className="text-slate-500 font-medium">Quản lý thành viên, hạn mức chi tiêu và duyệt đơn hàng doanh nghiệp.</p>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center gap-3"
                    >
                        <Plus size={18} /> Tạo tổ chức mới
                    </button>
                </div>

                {/* Info Alert */}
                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4 items-start">
                    <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                        <Info size={20} />
                    </div>
                    <div>
                        <h4 className="font-black text-amber-900 text-sm uppercase tracking-tight">Về Tài Khoản Doanh Nghiệp</h4>
                        <p className="text-amber-700 text-sm mt-1 leading-relaxed">
                            Tài khoản B2B cho phép bạn mời nhân viên tham gia mua hàng. Đơn hàng từ nhân viên (Buyer) có thể yêu cầu bạn (Owner/Admin) duyệt trước khi gửi đến hệ thống quản lý kho.
                        </p>
                    </div>
                </div>

                {/* Organizations List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {organizations.length > 0 ? (
                        organizations.map((org) => (
                            <div key={org.id} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
                                    <Building size={120} />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 font-black text-2xl">
                                            {org.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{org.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${org.userRole === 'OWNER' ? 'bg-purple-100 text-purple-600' :
                                                        org.userRole === 'ADMIN' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {org.userRole}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">• {org.memberCount} Thành viên</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-8">
                                        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                            <Shield className="w-4 h-4 text-blue-400" />
                                            Mã số thuế: {org.taxCode || 'Chưa cập nhật'}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                            <Building2 className="w-4 h-4 text-blue-400" />
                                            Địa chỉ: {org.address || 'Chưa cập nhật'}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-6 border-t border-slate-50">
                                        <Link href={`/account/organization/${org.id}`} className="flex-1">
                                            <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">
                                                Quản lý thành viên
                                            </button>
                                        </Link>
                                        <Link href={`/account/organization/${org.id}/orders`} className="flex-1">
                                            <button className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm active:scale-95">
                                                Duyệt đơn hàng
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
