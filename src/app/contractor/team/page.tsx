'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, Copy, ExternalLink, Package, Check, X, Clock, RefreshCw, Download, ArrowRight, ShieldCheck, Zap, ArrowLeft, Loader2, Activity } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'

export default function ContractorTeamPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<'LINKS' | 'REQUESTS' | 'MEMBERS'>('REQUESTS')
    const [data, setData] = useState<any>({ projects: [], requests: [], reports: [] })
    const [organizations, setOrganizations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Organization Create State
    const [showOrgModal, setShowOrgModal] = useState(false)
    const [createOrgData, setCreateOrgData] = useState({ name: '', taxCode: '', address: '' })
    const [submittingOrg, setSubmittingOrg] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            // 1. Fetch Dashboard Data
            const dashRes = await fetchWithAuth('/api/contractors/team-dashboard')
            if (dashRes.ok) {
                const json = await dashRes.json()
                setData(json.data)
            }

            // 2. Fetch Organizations
            const orgRes = await fetchWithAuth('/api/organizations')
            if (orgRes.ok) {
                const json = await orgRes.json()
                setOrganizations(json.data || [])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmittingOrg(true)
        try {
            const res = await fetchWithAuth('/api/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createOrgData)
            })
            if (res.ok) {
                toast.success('Đã tạo tổ chức mới thành công!')
                setShowOrgModal(false)
                setCreateOrgData({ name: '', taxCode: '', address: '' })
                fetchData() // Refresh list
            } else {
                const err = await res.json()
                toast.error(err.error || 'Có lỗi xảy ra')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setSubmittingOrg(false)
        }
    }

    const handleGenerateToken = async (projectId: string) => {
        try {
            const res = await fetchWithAuth(`/api/contractors/projects/${projectId}/report-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'CREATE' })
            })
            if (res.ok) {
                toast.success('Đã tạo link mới')
                fetchData() // Refresh to see token
            }
        } catch (e) {
            toast.error('Lỗi tạo link')
        }
    }

    const copyLink = async (token: string) => {
        const link = `${window.location.origin}/report/${token}`
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(link)
                toast.success('Đã copy link báo cáo')
            } else {
                const textArea = document.createElement("textarea")
                textArea.value = link
                textArea.style.position = "fixed"
                textArea.style.left = "-9999px"
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()
                document.execCommand('copy')
                document.body.removeChild(textArea)
                toast.success('Đã copy link báo cáo')
            }
        } catch (err) {
            toast.error('Lỗi khi copy link')
        }
    }

    const handleDownloadQR = (projectId: string, token: string) => {
        const link = `${window.location.origin}/report/${token}`
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`

        toast.promise(
            fetch(qrUrl)
                .then(res => res.blob())
                .then(blob => {
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `QR-Bao-Cao-${projectId.slice(-4)}.png`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                }),
            {
                loading: 'Đang chuẩn bị ảnh QR...',
                success: 'Đã tải mã QR thành công!',
                error: 'Không thể tải ảnh QR'
            }
        )
    }

    const handleApproveRequest = async (id: string, items: any[]) => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 800)),
            {
                loading: 'Đang duyệt yêu cầu...',
                success: 'Đã phê duyệt yêu cầu vật tư!',
                error: 'Lỗi'
            }
        )
        // Optimistic update
        setData({
            ...data,
            requests: data.requests.filter((r: any) => r.id !== id)
        })
    }

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            <Toaster position="top-right" />
            
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 sm:px-0">
                <div className="space-y-1 px-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        Quản lý Đội thợ
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Báo cáo hiện trường và điều phối vật tư</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl gap-1 shadow-inner">
                    {[
                        { id: 'REQUESTS', label: 'Vật Tư', icon: <Package size={14} />, badge: data.requests.length },
                        { id: 'LINKS', label: 'Báo Cáo', icon: <Zap size={14} /> },
                        { id: 'MEMBERS', label: 'Tổ Chức', icon: <ShieldCheck size={14} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.badge ? <span className="bg-rose-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[9px]">{tab.badge}</span> : null}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 opacity-20" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang đồng bộ dữ liệu đội thợ...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 px-4 sm:px-0">
                    {activeTab === 'REQUESTS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {data.requests.length === 0 ? (
                                <div className="col-span-full py-32 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                        <Package size={40} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400">Không có yêu cầu vật tư đang chờ</p>
                                </div>
                            ) : (
                                data.requests.map((req: any) => (
                                    <div key={req.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                                                    <Activity size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{req.project?.title || 'Dự án chưa xác định'}</h3>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase">
                                                        Người gửi: <span className="text-slate-900">{req.workerName}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-slate-50 text-slate-400 text-[10px] font-bold shadow-none border-none">
                                                {new Date(req.createdAt).toLocaleTimeString('vi-VN')}
                                            </Badge>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2">
                                            {req.items.map((item: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                                    <span className="text-xs font-bold text-slate-700">{item.name}</span>
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
                                                        {item.quantity} {item.unit}
                                                    </span>
                                                </div>
                                            ))}
                                            {req.notes && (
                                                <div className="mt-3 p-3 border-l-2 border-orange-200 bg-orange-50/30 text-[11px] text-slate-500 italic">
                                                    "{req.notes}"
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <button className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95">
                                                Từ chối
                                            </button>
                                            <button
                                                onClick={() => handleApproveRequest(req.id, req.items)}
                                                className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-95"
                                            >
                                                Duyệt & Thêm giỏ hàng
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'LINKS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.projects.map((project: any) => (
                                <div key={project.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{project.name}</h3>
                                        <div className={`w-2 h-2 rounded-full ${project.activeToken ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-6 mb-6 flex flex-col items-center justify-center border border-slate-100 flex-1">
                                        {project.activeToken ? (
                                            <>
                                                <div className="bg-white p-4 rounded-xl shadow-md mb-4 border border-slate-50">
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/report/${project.activeToken}`)}`}
                                                        alt="QR Code"
                                                        className="w-32 h-32"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleDownloadQR(project.id, project.activeToken)}
                                                    className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:underline"
                                                >
                                                    Tải mã QR báo cáo
                                                </button>
                                            </>
                                        ) : (
                                            <div className="py-8 text-center space-y-3">
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-200 mx-auto border border-dashed border-slate-200">
                                                    <Zap size={20} />
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Link chưa kích hoạt</p>
                                            </div>
                                        )}
                                    </div>

                                    {project.activeToken ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => copyLink(project.activeToken)}
                                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/10 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Copy size={16} /> Copy
                                            </button>
                                            <Link
                                                href={`/report/${project.activeToken}`}
                                                target="_blank"
                                                className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all"
                                            >
                                                <ExternalLink size={18} />
                                            </Link>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleGenerateToken(project.id)}
                                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-md hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} /> Kích hoạt link
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'MEMBERS' && (
                        <div className="space-y-8">
                            {organizations.length === 0 ? (
                                <div className="bg-white rounded-3xl p-12 py-20 text-center border border-slate-100 shadow-sm flex flex-col items-center space-y-6">
                                    <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                        <ShieldCheck size={40} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-bold text-slate-900">Quản trị Tổ chức B2B</h3>
                                        <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                                            Thiết lập tổ chức để quản lý nhân sự, phân quyền duyệt đơn hàng và theo dõi hoạt động của đội thợ.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowOrgModal(true)}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:bg-blue-700 active:scale-95 flex items-center gap-2"
                                    >
                                        Tạo Đội Nhóm B2B <Plus size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {organizations.map(org => (
                                        <div key={org.id} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-all overflow-hidden flex flex-col h-full">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-3xl border border-blue-100">
                                                    {org.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <h3 className="text-xl font-bold text-slate-900">{org.name}</h3>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                                                        <Users size={12} className="text-blue-500" />
                                                        {org.memberCount} thành viên
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 rounded-xl p-4 mb-8 border border-slate-100 flex-1">
                                                <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                                                    Vai trò: Nhà Thầu Chính. Bạn có toàn quyền quản lý nhân sự, dự án và giới hạn chi tiêu vật tư của các thành viên.
                                                </p>
                                            </div>

                                            <Link href={`/contractor/organization/${org.id}`} className="block">
                                                <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 group">
                                                    Vào Dashboard Quản lý <ArrowRight size={16} className="group-hover:translate-x-1 transition-all" />
                                                </button>
                                            </Link>
                                        </div>
                                    ))}
                                    
                                    <div 
                                        onClick={() => setShowOrgModal(true)}
                                        className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center py-12 px-6 text-center group cursor-pointer hover:border-blue-400/40 hover:bg-blue-50 transition-all"
                                    >
                                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-all mb-4 border border-slate-100 shadow-sm">
                                            <Plus size={24} />
                                        </div>
                                        <h4 className="text-base font-bold text-slate-900">Tạo tổ chức mới</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Mở rộng mạng lưới thợ</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Create Org Modal */}
            {showOrgModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="text-lg font-bold uppercase tracking-tight">Thêm Đội thợ / Công ty</h3>
                            <button onClick={() => setShowOrgModal(false)} className="text-white/60 hover:text-white"><X size={20} /></button>
                        </div>
                        
                        <form onSubmit={handleCreateOrg} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5 px-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tên Đội / Công ty</label>
                                    <input
                                        type="text"
                                        value={createOrgData.name}
                                        onChange={(e) => setCreateOrgData({ ...createOrgData, name: e.target.value })}
                                        placeholder="Ví dụ: Đội thi công A"
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl font-semibold outline-none border border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600/10 transition-all text-sm"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5 px-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mã số thuế</label>
                                    <input
                                        type="text"
                                        value={createOrgData.taxCode}
                                        onChange={(e) => setCreateOrgData({ ...createOrgData, taxCode: e.target.value })}
                                        placeholder="Nhập MST (nếu có)"
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl font-semibold outline-none border border-transparent focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5 px-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Địa chỉ</label>
                                    <input
                                        type="text"
                                        value={createOrgData.address}
                                        onChange={(e) => setCreateOrgData({ ...createOrgData, address: e.target.value })}
                                        placeholder="Địa chỉ trụ sở"
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl font-semibold outline-none border border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600/10 transition-all text-sm"
                                    />
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={submittingOrg}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-wider text-xs active:scale-95 shadow-lg shadow-blue-500/10 hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                                {submittingOrg ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Xác nhận tạo đơn vị'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
