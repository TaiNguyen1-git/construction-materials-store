'use client'

import { useState, useEffect } from 'react'
import {
    ShieldCheck, CheckCircle2, XCircle, Clock,
    MapPin, Phone, Mail, Award, Loader2,
    ExternalLink, Briefcase, User, Building,
    AlertCircle, Building2, CheckCircle, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

type VerifyType = 'contractor' | 'supplier'

export default function PartnerVerification() {
    // Contractor verification state
    const [ctFilter, setCtFilter] = useState<'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED'>('PENDING_REVIEW')
    const [ctProfiles, setCtProfiles] = useState<any[]>([])
    const [ctLoading, setCtLoading] = useState(true)
    const [selectedProfile, setSelectedProfile] = useState<any>(null)
    const [actionLoading, setActionLoading] = useState(false)

    // Supplier verification state
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [suppLoading, setSuppLoading] = useState(true)

    const [activeType, setActiveType] = useState<VerifyType>('contractor')

    useEffect(() => {
        fetchContractorProfiles()
        fetchPendingSuppliers()
    }, [ctFilter])

    const fetchContractorProfiles = async () => {
        setCtLoading(true)
        try {
            const res = await fetch(`/api/admin/contractors/profiles?status=${ctFilter}`)
            if (res.ok) {
                const data = await res.json()
                setCtProfiles(data.data)
            }
        } catch (err) {
            toast.error('Lỗi khi tải danh sách hồ sơ')
        } finally {
            setCtLoading(false)
        }
    }

    const fetchPendingSuppliers = async () => {
        setSuppLoading(true)
        try {
            const res = await fetch('/api/admin/suppliers')
            const data = await res.json()
            if (data.success) setSuppliers(data.data.filter((s: any) => !s.isActive))
        } catch (error) {
            toast.error('Lỗi khi tải danh sách NCC chờ duyệt')
        } finally {
            setSuppLoading(false)
        }
    }

    const handleVerifyContractor = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/admin/contractors/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId: id, status })
            })
            if (res.ok) {
                toast.success(status === 'VERIFIED' ? 'Đã xác thực nhà thầu' : 'Đã từ chối hồ sơ')
                fetchContractorProfiles()
                setSelectedProfile(null)
            } else {
                toast.error('Lỗi khi cập nhật trạng thái')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setActionLoading(false)
        }
    }

    const handleSupplierAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            const res = await fetch('/api/admin/suppliers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                fetchPendingSuppliers()
            } else {
                toast.error(data.error?.message || 'Cập nhật thất bại')
            }
        } catch (error) {
            toast.error('Lỗi hệ thống')
        }
    }

    const pendingCtCount = ctFilter === 'PENDING_REVIEW' ? ctProfiles.length : 0

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    onClick={() => setActiveType('contractor')}
                    className={`p-6 rounded-[28px] border-2 transition-all text-left ${activeType === 'contractor'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200'
                        : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                    <div className="flex items-center gap-4 mb-3">
                        <div className={`p-3 rounded-2xl ${activeType === 'contractor' ? 'bg-white/20' : 'bg-blue-50'}`}>
                            <Briefcase className={`w-6 h-6 ${activeType === 'contractor' ? 'text-white' : 'text-blue-600'}`} />
                        </div>
                        <div>
                            <p className={`font-black text-lg ${activeType === 'contractor' ? 'text-white' : 'text-slate-900'}`}>Hồ sơ Nhà thầu</p>
                            <p className={`text-sm ${activeType === 'contractor' ? 'text-blue-100' : 'text-slate-500'}`}>Xét duyệt năng lực, cấp tích xanh</p>
                        </div>
                    </div>
                    <div className={`text-3xl font-black ${activeType === 'contractor' ? 'text-white' : 'text-blue-600'}`}>
                        {ctLoading ? '...' : ctProfiles.length}
                        <span className={`text-sm ml-2 font-bold ${activeType === 'contractor' ? 'text-blue-100' : 'text-slate-400'}`}>hồ sơ chờ xem</span>
                    </div>
                </button>
                <button
                    onClick={() => setActiveType('supplier')}
                    className={`p-6 rounded-[28px] border-2 transition-all text-left ${activeType === 'supplier'
                        ? 'bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-200'
                        : 'bg-white border-slate-200 hover:border-orange-300'}`}>
                    <div className="flex items-center gap-4 mb-3">
                        <div className={`p-3 rounded-2xl ${activeType === 'supplier' ? 'bg-white/20' : 'bg-orange-50'}`}>
                            <Building2 className={`w-6 h-6 ${activeType === 'supplier' ? 'text-white' : 'text-orange-500'}`} />
                        </div>
                        <div>
                            <p className={`font-black text-lg ${activeType === 'supplier' ? 'text-white' : 'text-slate-900'}`}>Nhà cung cấp mới</p>
                            <p className={`text-sm ${activeType === 'supplier' ? 'text-orange-100' : 'text-slate-500'}`}>Phê duyệt đăng ký, kích hoạt tài khoản</p>
                        </div>
                    </div>
                    <div className={`text-3xl font-black ${activeType === 'supplier' ? 'text-white' : 'text-orange-500'}`}>
                        {suppLoading ? '...' : suppliers.length}
                        <span className={`text-sm ml-2 font-bold ${activeType === 'supplier' ? 'text-orange-100' : 'text-slate-400'}`}>chờ phê duyệt</span>
                    </div>
                </button>
            </div>

            {/* Contractor verification panel */}
            {activeType === 'contractor' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Filter + List */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                            {['PENDING_REVIEW', 'VERIFIED', 'REJECTED'].map((s) => (
                                <button key={s} onClick={() => { setCtFilter(s as any); setSelectedProfile(null) }}
                                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${ctFilter === s
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : 'text-slate-500 hover:bg-slate-50'}`}>
                                    {s === 'PENDING_REVIEW' ? 'Chờ duyệt' : s === 'VERIFIED' ? 'Đã duyệt' : 'Từ chối'}
                                </button>
                            ))}
                        </div>

                        {ctLoading ? (
                            <div className="flex items-center justify-center py-16 bg-white rounded-3xl border border-slate-100">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : ctProfiles.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
                                <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-400 font-medium text-sm">Không có hồ sơ nào</p>
                            </div>
                        ) : (
                            ctProfiles.map((p) => (
                                <div key={p.id} onClick={() => setSelectedProfile(p)}
                                    className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${selectedProfile?.id === p.id
                                        ? 'bg-white border-blue-500 shadow-xl shadow-blue-50'
                                        : 'bg-white border-transparent hover:border-slate-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg">
                                            {p.displayName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{p.displayName}</h3>
                                            <p className="text-xs text-slate-500">{p.companyName || 'Cá nhân'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg"><Briefcase className="w-3 h-3" />{p.experienceYears} năm KN</span>
                                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg"><MapPin className="w-3 h-3" />{p.city}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Detail panel */}
                    <div className="lg:col-span-2">
                        {selectedProfile ? (
                            <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 sticky top-8">
                                <div className="bg-blue-600 p-10 text-white">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[28px] flex items-center justify-center text-white text-4xl font-black border border-white/30">
                                                {selectedProfile.displayName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h2 className="text-3xl font-black">{selectedProfile.displayName}</h2>
                                                    {selectedProfile.isVerified && <CheckCircle2 className="w-6 h-6 fill-white text-blue-600" />}
                                                </div>
                                                <p className="text-blue-100 flex items-center gap-2 font-medium">
                                                    <Building className="w-4 h-4" />
                                                    {selectedProfile.companyName || 'Hoạt động độc lập'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Thông tin liên hệ</h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3 text-slate-700 font-bold">
                                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center"><Phone className="w-5 h-5 text-slate-400" /></div>
                                                        {selectedProfile.phone || 'Chưa cập nhật'}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-slate-700 font-bold">
                                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center"><Mail className="w-5 h-5 text-slate-400" /></div>
                                                        {selectedProfile.email || 'Chưa cập nhật'}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-slate-700 font-bold">
                                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-slate-400" /></div>
                                                        {selectedProfile.address}, {selectedProfile.district}, {selectedProfile.city}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Kỹ năng chuyên môn</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedProfile.skills?.map((s: string) => (
                                                        <span key={s} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-black">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Hồ sơ & Chứng chỉ</h4>
                                                <div className="space-y-3">
                                                    {selectedProfile.documents?.length > 0 ? (
                                                        selectedProfile.documents.map((doc: string, idx: number) => (
                                                            <a key={idx} href={doc} target="_blank"
                                                                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                                                                <div className="flex items-center gap-3">
                                                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                                                    <span className="font-bold text-slate-700 text-sm">Tài liệu #{idx + 1}</span>
                                                                </div>
                                                                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                                                            </a>
                                                        ))
                                                    ) : (
                                                        <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                                                            <XCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                                            <p className="text-sm text-slate-400">Chưa có tài liệu đính kèm</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-orange-50 rounded-3xl p-5 border border-orange-100">
                                                <div className="flex gap-4">
                                                    <Award className="w-10 h-10 text-orange-500 shrink-0" />
                                                    <div>
                                                        <h5 className="font-black text-orange-800">Trust Score dự kiến</h5>
                                                        <p className="text-2xl font-black text-orange-600">{selectedProfile.trustScore || 80}/100</p>
                                                        <p className="text-xs text-orange-700 mt-1 opacity-80">Kích hoạt sau khi xác thực.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedProfile.onboardingStatus === 'PENDING_REVIEW' && (
                                        <div className="mt-10 flex gap-4">
                                            <button onClick={() => handleVerifyContractor(selectedProfile.id, 'REJECTED')} disabled={actionLoading}
                                                className="flex-1 py-4 bg-slate-100 text-red-600 font-black rounded-3xl hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                                                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><XCircle className="w-5 h-5" /> Từ chối hồ sơ</>}
                                            </button>
                                            <button onClick={() => handleVerifyContractor(selectedProfile.id, 'VERIFIED')} disabled={actionLoading}
                                                className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Xác thực & Cấp tích xanh</>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <User className="w-10 h-10 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Chọn hồ sơ để xem</h3>
                                <p className="text-slate-400 max-w-xs mt-2 text-sm">Kiểm tra tài liệu năng lực trước khi xác thực.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Supplier approval panel */}
            {activeType === 'supplier' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            Nhà cung cấp chờ phê duyệt ({suppliers.length})
                        </h3>
                        <button onClick={fetchPendingSuppliers} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <RefreshCw size={16} className={`text-slate-400 ${suppLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {suppLoading ? (
                        <div className="flex items-center justify-center py-16 bg-white rounded-3xl border border-slate-100">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                        </div>
                    ) : suppliers.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
                            <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                            <p className="text-slate-400 font-bold">Không có NCC nào chờ phê duyệt</p>
                        </div>
                    ) : (
                        suppliers.map(supplier => (
                            <div key={supplier.id} className="bg-white rounded-[28px] border border-orange-100 p-6 shadow-sm">
                                <div className="flex items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 font-black text-xl">
                                            {supplier.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 text-lg">{supplier.name}</h4>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                                                <span className="flex items-center gap-1"><Mail size={13} />{supplier.email}</span>
                                                {supplier.city && <span className="flex items-center gap-1"><MapPin size={13} />{supplier.city}</span>}
                                            </div>
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">MST: {supplier.taxId}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <button
                                            onClick={() => handleSupplierAction(supplier.id, 'approve')}
                                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2">
                                            <CheckCircle size={15} /> Phê duyệt
                                        </button>
                                        <button
                                            onClick={() => handleSupplierAction(supplier.id, 'reject')}
                                            className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-black hover:bg-red-100 transition-all flex items-center gap-2">
                                            <XCircle size={15} /> Từ chối
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
