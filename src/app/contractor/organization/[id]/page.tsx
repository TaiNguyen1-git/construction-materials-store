'use client'

import React, { useState, useEffect } from 'react'
import {
    Users, UserPlus, Shield, ArrowLeft,
    Trash2, Mail, ShieldCheck, UserCog,
    Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { fetchWithAuth } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'

export default function ContractorOrganizationDetailsPage() {
    const { id } = useParams()
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()

    const [org, setOrg] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviting, setInviting] = useState(false)
    const [currentUserRole, setCurrentUserRole] = useState<string>('BUYER')

    useEffect(() => {
        if (id && !authLoading && isAuthenticated) {
            fetchOrgDetails()
        }
    }, [id, authLoading, isAuthenticated])

    const fetchOrgDetails = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth(`/api/organizations/${id}`)
            const data = await res.json()
            if (res.ok) {
                setOrg(data.data)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const me = data.data.members.find((m: any) => m.userId === user?.id)
                if (me) setCurrentUserRole(me.role)
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
                body: JSON.stringify({ action: 'invite', email: inviteEmail, role: 'BUYER' })
            })
            if (res.ok) {
                toast.success('Đã thêm thành viên mới!')
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        )
    }

    const isAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

    return (
        <div className="space-y-10 max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="space-y-4">
                        <Link href="/contractor/organization" className="inline-flex items-center text-slate-500 hover:text-blue-600 font-bold text-xs uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 transition-all hover:border-blue-200 active:scale-95">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại danh sách
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <Users className="w-8 h-8 text-blue-600" /> {org?.name}
                            </h1>
                            <p className="text-slate-500 font-medium mt-1">Quản lý và cấp quyền cho các thành viên trong tổ chức.</p>
                        </div>

                        {!isAuthenticated && !authLoading && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm font-bold flex items-center gap-3">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                Vui lòng đăng nhập lại để xem thông tin tổ chức.
                                <Link href="/login" className="ml-auto underline">Đăng nhập ngay</Link>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Members List */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Thành viên ({org?.members?.length || 0})</h3>
                                    <Users size={20} className="text-slate-300" />
                                </div>

                                <div className="divide-y divide-slate-50">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {org?.members?.map((member: any) => (
                                        <div key={member.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 border border-slate-200">
                                                    {member.user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900">{member.user.name}</p>
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
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Invitation Panel */}
                        <div className="space-y-6">
                            {isAdmin ? (
                                <div className="bg-white rounded-[40px] p-8 border border-blue-100 shadow-sm relative overflow-hidden">
                                    <div className="relative z-10 space-y-6">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-2">
                                            <UserPlus size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Mời Thành Viên</h3>
                                            <p className="text-xs text-slate-500 font-medium mt-1">Gửi lời mời tham gia tổ chức qua email.</p>
                                        </div>

                                        <form onSubmit={handleInvite} className="space-y-4">
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={inviteEmail}
                                                    onChange={e => setInviteEmail(e.target.value)}
                                                    placeholder="email@vidu.com"
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={inviting}
                                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi lời mời'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-100 rounded-[40px] p-8 text-center space-y-4">
                                    <Shield size={40} className="mx-auto text-slate-400" />
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bạn không có quyền quản trị</p>
                                    <p className="text-xs text-slate-400">Chỉ vai trò Chủ sở hữu và Quản trị viên mới có thể mời hoặc xóa thành viên.</p>
                                </div>
                            )}

                            {/* Role Definitions */}
                            <div className="bg-white rounded-[40px] p-8 border border-slate-100 space-y-6">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cấp bậc vai trò</h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 shrink-0">
                                            <ShieldCheck size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 uppercase">Chủ sở hữu (Owner)</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Toàn quyền kiểm soát và thanh toán.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                                            <UserCog size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 uppercase">Quản trị (Admin)</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Quản lý thành viên và duyệt đơn hàng.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 uppercase">Mua hàng (Buyer)</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Được quyền tạo yêu cầu mua hàng.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
        </div>
    )
}
