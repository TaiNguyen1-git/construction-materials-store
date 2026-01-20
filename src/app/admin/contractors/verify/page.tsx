'use client'

/**
 * Admin Contractor Verification Page
 * Review pending profiles and verify contractors
 */

import { useState, useEffect } from 'react'
import {
    ShieldCheck, CheckCircle2, XCircle, Clock,
    MapPin, Phone, Mail, Award, Loader2,
    ExternalLink, Search, Filter, Briefcase,
    User, Building
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminVerificationPage() {
    const [loading, setLoading] = useState(true)
    const [profiles, setProfiles] = useState<any[]>([])
    const [filter, setFilter] = useState<'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED'>('PENDING_REVIEW')
    const [selectedProfile, setSelectedProfile] = useState<any>(null)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        fetchProfiles()
    }, [filter])

    const fetchProfiles = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/contractors/profiles?status=${filter}`)
            if (res.ok) {
                const data = await res.json()
                setProfiles(data.data)
            }
        } catch (err) {
            toast.error('Lỗi khi tải danh sách hồ sơ')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/admin/contractors/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId: id, status })
            })

            if (res.ok) {
                toast.success(status === 'VERIFIED' ? 'Đã xác thực nhà thầu' : 'Đã từ chối hồ sơ')
                fetchProfiles()
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

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-blue-600" />
                            Xác thực nhà thầu
                        </h1>
                        <p className="text-gray-500 mt-1">Duyệt hồ sơ năng lực và cấp tích xanh cho đối tác</p>
                    </div>

                    <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                        {['PENDING_REVIEW', 'VERIFIED', 'REJECTED'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s as any)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === s
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {s === 'PENDING_REVIEW' ? 'Chờ duyệt' : s === 'VERIFIED' ? 'Đã duyệt' : 'Đã từ chối'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* List Section */}
                    <div className="lg:col-span-1 space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : profiles.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">Không có hồ sơ nào mục này</p>
                            </div>
                        ) : (
                            profiles.map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedProfile(p)}
                                    className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${selectedProfile?.id === p.id
                                            ? 'bg-white border-blue-500 shadow-xl shadow-blue-50'
                                            : 'bg-white border-transparent hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl">
                                            {p.displayName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{p.displayName}</h3>
                                            <p className="text-xs text-gray-500">{p.companyName || 'Cá nhân'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                            <Briefcase className="w-3 h-3" />
                                            {p.experienceYears} năm KN
                                        </span>
                                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                            <MapPin className="w-3 h-3" />
                                            {p.city}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* detail Section */}
                    <div className="lg:col-span-2">
                        {selectedProfile ? (
                            <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 sticky top-8">
                                {/* Profile Header */}
                                <div className="bg-blue-600 p-10 text-white relative">
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[32px] flex items-center justify-center text-white text-4xl font-black border border-white/30">
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
                                        {/* Left: Info */}
                                        <div className="space-y-8">
                                            <div>
                                                <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">Thông tin liên hệ</h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3 text-gray-700 font-bold">
                                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center"><Phone className="w-5 h-5 text-gray-400" /></div>
                                                        {selectedProfile.phone || 'Chưa cập nhật'}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-gray-700 font-bold">
                                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center"><Mail className="w-5 h-5 text-gray-400" /></div>
                                                        {selectedProfile.email || 'Chưa cập nhật'}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-gray-700 font-bold">
                                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-gray-400" /></div>
                                                        {selectedProfile.address}, {selectedProfile.district}, {selectedProfile.city}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">Mô tả năng lực</h4>
                                                <p className="text-gray-600 leading-relaxed font-medium">
                                                    {selectedProfile.bio || 'Chưa có mô tả chi tiết.'}
                                                </p>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">Kỹ năng chuyên môn</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedProfile.skills.map((s: string) => (
                                                        <span key={s} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-black">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Documents */}
                                        <div className="space-y-8">
                                            <div>
                                                <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">Hồ sơ & Chứng chỉ</h4>
                                                <div className="space-y-3">
                                                    {selectedProfile.documents?.length > 0 ? (
                                                        selectedProfile.documents.map((doc: string, idx: number) => (
                                                            <a
                                                                key={idx}
                                                                href={doc}
                                                                target="_blank"
                                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                                                    <span className="font-bold text-gray-700">Tài liệu năng lực #{idx + 1}</span>
                                                                </div>
                                                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                                            </a>
                                                        ))
                                                    ) : (
                                                        <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl text-center">
                                                            <XCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                                            <p className="text-sm text-gray-400 font-medium">Chưa có tài liệu đính kèm</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100">
                                                <div className="flex gap-4">
                                                    <Award className="w-10 h-10 text-orange-500 shrink-0" />
                                                    <div>
                                                        <h5 className="font-black text-orange-800">Trust Score Dự kiến</h5>
                                                        <p className="text-2xl font-black text-orange-600">{selectedProfile.trustScore || 80}/100</p>
                                                        <p className="text-xs text-orange-700 mt-1 opacity-80">Điểm này sẽ được kích hoạt sau khi xác thực thành công.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {selectedProfile.onboardingStatus === 'PENDING_REVIEW' && (
                                        <div className="mt-12 flex gap-4">
                                            <button
                                                onClick={() => handleVerify(selectedProfile.id, 'REJECTED')}
                                                disabled={actionLoading}
                                                className="flex-1 py-5 bg-gray-100 text-red-600 font-black rounded-3xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><XCircle className="w-5 h-5" /> Từ chối hồ sơ</>}
                                            </button>
                                            <button
                                                onClick={() => handleVerify(selectedProfile.id, 'VERIFIED')}
                                                disabled={actionLoading}
                                                className="flex-[2] py-5 bg-blue-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Xác thực & Cấp tích xanh</>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                    <User className="w-10 h-10 text-gray-200" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Chọn một hồ sơ để xem chi tiết</h3>
                                <p className="text-gray-400 max-w-xs mt-2 font-medium">Kiểm tra kỹ các tài liệu năng lực trước khi tiến hành xác thực đối tác.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
