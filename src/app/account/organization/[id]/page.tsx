'use client'

import React, { useState, useEffect } from 'react'
import {
    Users, UserPlus, ArrowLeft,
    Trash2, Mail, ShieldCheck, UserCog,
    Loader2, Check, X, ShieldAlert,
    HardHat, Briefcase, Award, MapPin
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'

export default function OrganizationDetailsPage() {
    const { id } = useParams()
    const { user } = useAuth()
    const [org, setOrg] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviting, setInviting] = useState(false)
    const [inviteRole, setInviteRole] = useState<string>('BUYER')
    const [intendedUserRole, setIntendedUserRole] = useState<string>('CUSTOMER')
    const [currentUserRole, setCurrentUserRole] = useState<string>('BUYER')

    useEffect(() => {
        if (id) fetchOrgDetails()
    }, [id])

    useEffect(() => {
        if (org && user) {
            const me = org.members.find((m: any) => m.userId === user.id)
            if (me) setCurrentUserRole(me.role)
        }
    }, [org, user])

    const fetchOrgDetails = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth(`/api/organizations/${id}`)
            const data = await res.json()
            if (res.ok) {
                setOrg(data.data)
            } else {
                toast.error(data.error || 'Không thể tải thông tin tổ chức')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setInviting(true)
        try {
            const res = await fetchWithAuth(`/api/organizations/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'invite',
                    email: inviteEmail,
                    role: inviteRole,
                    intendedUserRole: intendedUserRole
                })
            })
            if (res.ok) {
                toast.success('Đã gửi lời mời!')
                setInviteEmail('')
                fetchOrgDetails()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Có lỗi xảy ra')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setInviting(false)
        }
    }

    const handleUpdateRole = async (targetUserId: string, newRole: string) => {
        try {
            const res = await fetchWithAuth(`/api/organizations/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update-role', targetUserId, role: newRole })
            })
            if (res.ok) {
                toast.success('Đã cập nhật vai trò')
                fetchOrgDetails()
            }
        } catch (err) {
            toast.error('Không thể cập nhật vai trò')
        }
    }

    const handleRemove = async (targetUserId: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi tổ chức?')) return
        try {
            const res = await fetchWithAuth(`/api/organizations/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'remove', targetUserId })
            })
            if (res.ok) {
                toast.success('Đã xóa thành viên')
                fetchOrgDetails()
            }
        } catch (err) {
            toast.error('Không thể xóa thành viên')
        }
    }

    const handleRevokeInvitation = async (invitationId: string) => {
        if (!window.confirm('Thu hồi lời mời này?')) return
        try {
            const res = await fetchWithAuth(`/api/organizations/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'revoke-invitation', invitationId })
            })
            if (res.ok) {
                toast.success('Đã thu hồi')
                fetchOrgDetails()
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        }
    }

    const handleConfirmContractor = async (profileId: string, status: string) => {
        try {
            const res = await fetchWithAuth(`/api/organizations/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'confirm-contractor', profileId, status })
            })
            if (res.ok) {
                toast.success(status === 'VERIFIED' ? 'Đã duyệt hồ sơ' : 'Đã từ chối hồ sơ')
                fetchOrgDetails()
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        )
    }

    const isAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12">
            <div className="max-w-6xl mx-auto px-6 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <Link href="/account/organization" className="inline-flex items-center text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 transition-all">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại danh sách
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                            👥 {org?.name}
                        </h1>
                        <p className="text-slate-500 font-medium">Quản lý thành viên và xem xét hồ sơ năng lực nhà thầu.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Members List */}
                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Thành viên hoạt động ({org?.members?.length || 0})</h3>
                                <Users size={20} className="text-slate-300" />
                            </div>

                            <div className="divide-y divide-slate-50">
                                {org?.members?.map((member: any) => {
                                    const profile = member.user.customer?.contractorProfile;
                                    const needsReview = profile && profile.onboardingStatus === 'PENDING_REVIEW';

                                    return (
                                        <div key={member.id} className={`p-6 hover:bg-slate-50/50 transition-colors ${needsReview ? 'bg-amber-50/30' : ''}`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 border border-slate-200">
                                                        {member.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-black text-slate-900">{member.user.name}</p>
                                                            {member.user.role === 'CONTRACTOR' && (
                                                                <HardHat size={14} className="text-blue-500" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-400 font-medium">{member.user.email}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-end">
                                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${member.role === 'OWNER' ? 'bg-purple-100 text-purple-600' :
                                                                member.role === 'ADMIN' ? 'bg-blue-100 text-blue-600' :
                                                                    'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {member.role === 'OWNER' ? 'Chủ sở hữu' : member.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}
                                                        </span>
                                                        <p className="text-[8px] text-slate-300 font-bold uppercase mt-1">Tham gia {new Date(member.joinedAt).toLocaleDateString()}</p>
                                                    </div>

                                                    {isAdmin && member.userId !== user?.id && member.role !== 'OWNER' && (
                                                        <div className="flex gap-2">
                                                            <select
                                                                value={member.role}
                                                                onChange={(e) => handleUpdateRole(member.userId, e.target.value)}
                                                                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-blue-600 cursor-pointer outline-none"
                                                            >
                                                                <option value="ADMIN">ADMIN</option>
                                                                <option value="BUYER">BUYER</option>
                                                            </select>
                                                            <button
                                                                onClick={() => handleRemove(member.userId)}
                                                                className="p-2 text-rose-300 hover:text-rose-600 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Contractor Profile Review Section */}
                                            {needsReview && isAdmin && (
                                                <div className="mt-4 p-5 bg-white border-2 border-amber-200 rounded-3xl space-y-4 animate-slide-in">
                                                    <div className="flex items-center gap-2 text-amber-600 underline decoration-2 underline-offset-4">
                                                        <ShieldAlert size={16} />
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest">Hồ sơ năng lực đang chờ duyệt</h4>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                        <div className="space-y-1">
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Đội thợ</p>
                                                            <p className="text-[11px] font-black text-slate-900">{profile.displayName}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Kinh nghiệm</p>
                                                            <p className="text-[11px] font-black text-slate-900">{profile.experienceYears} năm</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Khu vực</p>
                                                            <p className="text-[11px] font-black text-slate-900">{profile.city}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Kỹ năng</p>
                                                            <p className="text-[11px] font-black text-slate-900">{profile.skills?.join(', ') || 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                                                        <button
                                                            onClick={() => handleConfirmContractor(profile.id, 'VERIFIED')}
                                                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all"
                                                        >
                                                            <Check size={14} /> Duyệt hồ sơ
                                                        </button>
                                                        <button
                                                            onClick={() => handleConfirmContractor(profile.id, 'REJECTED')}
                                                            className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-50 hover:text-rose-500 transition-all"
                                                        >
                                                            <X size={14} /> Từ chối
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {org?.members?.length === 0 && (
                                    <div className="p-12 text-center">
                                        <p className="text-slate-400 font-medium">Chưa có thành viên nào.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pending Invitations Section */}
                        {isAdmin && org?.invitations?.length > 0 && (
                            <div className="bg-white rounded-[40px] border border-blue-50 shadow-sm overflow-hidden animate-fade-in">
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-blue-50/30">
                                    <h3 className="text-xl font-black text-blue-900 tracking-tight uppercase italic">Lời mời đang chờ ({org.invitations.length})</h3>
                                    <Mail size={20} className="text-blue-300" />
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {org.invitations.map((invite: any) => (
                                        <div key={invite.id} className="p-6 flex items-center justify-between bg-white/50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-100/50 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-100">
                                                    <Mail size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900">{invite.email}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                                                        Mời bởi {invite.invitedBy.name} • Vai trò: {invite.role}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                    CHỜ ĐĂNG KÝ
                                                </span>
                                                <button onClick={() => handleRevokeInvitation(invite.id)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors bg-white rounded-xl shadow-sm border border-slate-50">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panels */}
                    <div className="space-y-8">
                        {/* Invitation Form Panel */}
                        {isAdmin ? (
                            <div className="bg-white rounded-[40px] p-8 border border-blue-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-0 opacity-50"></div>
                                <div className="relative z-10 space-y-6">
                                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                                        <UserPlus size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Mời Thành Viên</h3>
                                        <p className="text-xs text-slate-500 font-medium mt-1">Gia tăng đội ngũ B2B của bạn.</p>
                                    </div>

                                    <form onSubmit={handleInvite} className="space-y-4">
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                                <Mail size={16} />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={inviteEmail}
                                                onChange={e => setInviteEmail(e.target.value)}
                                                placeholder="email@vidu.com"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Vai trò tổ chức</label>
                                                <select
                                                    value={inviteRole}
                                                    onChange={e => setInviteRole(e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                                                >
                                                    <option value="BUYER">Người mua (BUYER)</option>
                                                    <option value="ADMIN">Quản trị (ADMIN)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Hạng mục User</label>
                                                <select
                                                    value={intendedUserRole}
                                                    onChange={e => setIntendedUserRole(e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                                                >
                                                    <option value="CUSTOMER">Khách lẻ</option>
                                                    <option value="CONTRACTOR">Nhà thầu</option>
                                                </select>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={inviting}
                                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi lời mời ngay'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-100 rounded-[40px] p-8 text-center space-y-4">
                                <ShieldAlert size={40} className="mx-auto text-slate-400" />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Không có quyền quản trị</p>
                                <p className="text-[10px] text-slate-400">Yêu cầu OWNER hoặc ADMIN để mời thành viên.</p>
                            </div>
                        )}

                        {/* Role Definitions */}
                        <div className="bg-white rounded-[40px] p-8 border border-slate-100 space-y-6 shadow-sm">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cấp bậc và phân loại</h3>
                            <div className="space-y-5">
                                <div className="flex gap-4 group">
                                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Quyền Quản trị</p>
                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Cấp quản lý cao nhất, được phép mời, xóa thành viên và duyệt đơn.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 group">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <HardHat size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Hồ sơ Nhà thầu</p>
                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Thành viên có hồ sơ năng lực cần được Admin xác nhận trước khi làm việc.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
