'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Building2, Users, ShoppingCart, ArrowLeft, Mail, Phone,
    MapPin, Calendar, CheckCircle, Ban, Trash2, Eye, X,
    ShieldCheck, UserCheck, Briefcase
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function AdminOrganizationDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [org, setOrg] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedMember, setSelectedMember] = useState<any>(null)
    const [showMemberModal, setShowMemberModal] = useState(false)

    useEffect(() => {
        if (id) fetchData()
    }, [id])

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth(`/api/organizations/${id}`)
            if (res.ok) {
                const json = await res.json()
                setOrg(json.data)
            } else {
                toast.error('Không thể tải thông tin tổ chức')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async () => {
        try {
            const res = await fetchWithAuth(`/api/admin/organizations/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !org.isActive })
            })

            if (res.ok) {
                toast.success(org.isActive ? 'Đã chặn tổ chức' : 'Đã bỏ chặn tổ chức')
                setOrg({ ...org, isActive: !org.isActive })
            } else {
                toast.error('Không thể cập nhật trạng thái')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        }
    }

    const handleDelete = async () => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa tổ chức "${org.name}"? Hành động này không thể hoàn tác.`)) {
            return
        }

        try {
            const res = await fetchWithAuth(`/api/admin/organizations/${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success('Đã xóa tổ chức thành công')
                router.push('/admin/organizations')
            } else {
                const error = await res.json()
                toast.error(error.error || 'Không thể xóa tổ chức')
            }
        } catch (error) {
            toast.error('Lỗi khi xóa tổ chức')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!org) {
        return (
            <div className="text-center py-12">
                <Building2 className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Không tìm thấy tổ chức</h2>
                <Link href="/admin/organizations" className="text-blue-600 hover:underline mt-2 inline-block">
                    Quay lại danh sách
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-500 text-sm">ID: {org.id}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${org.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {org.isActive ? 'Đang hoạt động' : 'Đã chặn'}
                        </span>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    <button
                        onClick={handleToggleStatus}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${org.isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'}`}
                    >
                        {org.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        {org.isActive ? 'Chặn tổ chức' : 'Bỏ chặn'}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg font-medium text-sm transition-all"
                    >
                        <Trash2 className="w-4 h-4" /> Xóa vĩnh viễn
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Thông tin chung</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã số thuế</p>
                                        <p className="text-slate-900 font-medium">{org.taxCode || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Địa chỉ</p>
                                        <p className="text-slate-900 font-medium">{org.address || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày tạo</p>
                                        <p className="text-slate-900 font-medium">{new Date(org.createdAt).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-900">Danh sách thành viên ({org.members.length})</h2>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-6 py-3">Họ tên / Email</th>
                                    <th className="px-6 py-3">Vai trò</th>
                                    <th className="px-6 py-3">Phân loại</th>
                                    <th className="px-6 py-3 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {org.members.map((m: any) => (
                                    <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{m.user.name}</div>
                                            <div className="text-xs text-slate-500">{m.user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.role === 'OWNER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {m.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-slate-600 font-medium">
                                                {m.user.role === 'CONTRACTOR' ? 'Nhà thầu' : 'Khách hàng'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedMember(m)
                                                    setShowMemberModal(true)
                                                }}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Thống kê</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-600">Thành viên</div>
                                        <div className="text-xl font-bold text-slate-900">{org.members.length}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                        <ShoppingCart className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-600">Đơn hàng</div>
                                        <div className="text-xl font-bold text-slate-900">{org._count.orders}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Member Detail Modal */}
            {showMemberModal && selectedMember && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                Chi tiết thành viên
                            </h3>
                            <button
                                onClick={() => setShowMemberModal(false)}
                                className="p-2 hover:bg-white rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Header Info */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-2xl font-bold border border-blue-100">
                                    {selectedMember.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900">{selectedMember.user.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedMember.role === 'OWNER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {selectedMember.role}
                                        </span>
                                        <span className="text-slate-400 text-xs">•</span>
                                        <span className="text-slate-500 text-xs font-medium">Tham gia: {new Date(selectedMember.joinedAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Grid */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        <div className="text-sm">
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Email</p>
                                            <p className="text-slate-900 font-medium">{selectedMember.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <div className="text-sm">
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Số điện thoại</p>
                                            <p className="text-slate-900 font-medium">{selectedMember.user.phone || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border border-slate-100 rounded-xl space-y-3">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                                        <div className="text-sm">
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Quyền hệ thống</p>
                                            <p className="text-slate-900 font-medium">{selectedMember.user.role}</p>
                                        </div>
                                    </div>
                                    {selectedMember.user.role === 'CONTRACTOR' && (
                                        <div className="flex items-center gap-3">
                                            <Briefcase className="w-4 h-4 text-slate-400" />
                                            <div className="text-sm">
                                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Hồ sơ nhà thầu</p>
                                                <Link
                                                    href={`/admin/contractors/${selectedMember.user.id}`}
                                                    className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                                                >
                                                    Xem hồ sơ <Eye className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setShowMemberModal(false)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
