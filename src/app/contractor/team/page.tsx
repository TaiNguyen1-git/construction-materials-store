'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, Copy, ExternalLink, Package, Check, X, Clock, RefreshCw, Download, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'

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
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Đang thêm vào giỏ hàng...',
                success: 'Đã thêm vật tư vào giỏ hàng!',
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
        <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
                        <Users className="w-10 h-10 text-blue-600" />
                        Team & Logistics
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Quản lý đội ngũ thợ, link báo cáo & yêu cầu vật tư</p>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-[2rem] gap-1">
                    <button
                        onClick={() => setActiveTab('REQUESTS')}
                        className={`px-8 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'REQUESTS' ? 'bg-white text-blue-600 shadow-xl shadow-blue-500/10' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Package size={16} />
                        Vật Tư
                        {data.requests.length > 0 && <span className="bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[8px]">{data.requests.length}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('LINKS')}
                        className={`px-8 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'LINKS' ? 'bg-white text-blue-600 shadow-xl shadow-blue-500/10' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Zap size={16} /> Báo cáo
                    </button>
                    <button
                        onClick={() => setActiveTab('MEMBERS')}
                        className={`px-8 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'MEMBERS' ? 'bg-white text-blue-600 shadow-xl shadow-blue-500/10' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <ShieldCheck size={16} /> B2B Org
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-50">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang đồng bộ dữ liệu...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {activeTab === 'REQUESTS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {data.requests.length === 0 ? (
                                <div className="col-span-full py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                        <Package size={40} />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Không có yêu cầu vật tư đang chờ</p>
                                </div>
                            ) : (
                                data.requests.map((req: any) => (
                                    <div key={req.id} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl transition-all group animate-in slide-in-from-bottom-5">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                                                        <Activity size={18} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{req.project?.title || 'Dự án chưa xác định'}</h3>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            Nơi gửi: <span className="text-slate-900">{req.workerName}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-black bg-slate-50 px-3 py-1.5 rounded-full text-slate-400 uppercase tracking-widest">{new Date(req.createdAt).toLocaleTimeString('vi-VN')}</span>
                                        </div>

                                        <div className="bg-slate-50 rounded-[2rem] p-8 mb-8 space-y-4">
                                            {req.items.map((item: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group-hover:scale-[1.02] transition-transform">
                                                    <span className="text-sm font-black text-slate-800 uppercase italic">{item.name}</span>
                                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
                                                        {item.quantity} {item.unit}
                                                    </span>
                                                </div>
                                            ))}
                                            {req.notes && (
                                                <div className="mt-6 p-4 border-l-4 border-orange-200 bg-orange-50/30 text-xs font-medium text-slate-600 italic">
                                                    "{req.notes}"
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-4">
                                            <button className="flex-1 py-5 bg-white border border-slate-200 text-slate-400 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-3 active:scale-95">
                                                <X size={16} /> Từ chối
                                            </button>
                                            <button
                                                onClick={() => handleApproveRequest(req.id, req.items)}
                                                className="flex-[2] py-5 bg-blue-600 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95"
                                            >
                                                <Check size={16} /> Duyệt đơn
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'LINKS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {data.projects.map((project: any) => (
                                <div key={project.id} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10 blur-3xl"></div>
                                    
                                    <div className="flex justify-between items-center mb-10">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic line-clamp-1">{project.name}</h3>
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                                    </div>

                                    <div className="bg-slate-50/50 rounded-[2.5rem] p-10 mb-10 flex flex-col items-center justify-center border border-slate-100">
                                        {project.activeToken ? (
                                            <>
                                                <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl mb-8 border border-slate-50 group-hover:rotate-2 transition-transform">
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/report/${project.activeToken}`)}`}
                                                        alt="QR Code"
                                                        className="w-40 h-40 grayscale group-hover:grayscale-0 transition-all"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleDownloadQR(project.id, project.activeToken)}
                                                    className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-3 hover:gap-5 transition-all"
                                                >
                                                    Tải mã QR <ArrowRight size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="py-10 text-center space-y-4">
                                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-200 mx-auto border-2 border-dashed border-slate-200">
                                                    <Zap size={24} />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link báo cáo chưa được kích hoạt</p>
                                            </div>
                                        )}
                                    </div>

                                    {project.activeToken ? (
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => copyLink(project.activeToken)}
                                                className="flex-1 py-5 bg-blue-600 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                            >
                                                <Copy size={16} /> Copy Link
                                            </button>
                                            <Link
                                                href={`/report/${project.activeToken}`}
                                                target="_blank"
                                                className="w-20 py-5 bg-slate-100 text-slate-600 rounded-[1.8rem] flex items-center justify-center hover:bg-slate-200 transition-all"
                                            >
                                                <ExternalLink size={18} />
                                            </Link>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleGenerateToken(project.id)}
                                            className="w-full py-5 bg-black text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                                        >
                                            <Plus size={16} /> Kích hoạt link báo cáo
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'MEMBERS' && (
                        <div className="space-y-10">
                            {organizations.length === 0 ? (
                                <div className="bg-white rounded-[4rem] p-32 text-center border border-slate-100 shadow-sm flex flex-col items-center space-y-10 group">
                                    <div className="w-32 h-32 bg-blue-50 rounded-[3rem] flex items-center justify-center text-blue-600 group-hover:rotate-12 transition-all duration-500">
                                        <ShieldCheck size={64} />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Professional B2B Network</h3>
                                        <p className="text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
                                            Thiết lập tổ chức để quản lý nhân sự, phân quyền duyệt đơn hàng và theo dõi hoạt động của đội thợ chuyên nghiệp theo mô hình doanh nghiệp B2B.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowOrgModal(true)}
                                        className="px-12 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-4"
                                    >
                                        Tạo Đội Nhóm B2B <Plus size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {organizations.map(org => (
                                        <div key={org.id} className="bg-white rounded-[3.5rem] border border-slate-100 p-12 hover:shadow-2xl transition-all relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
                                            <div className="flex items-center gap-8 mb-12">
                                                <div className="w-24 h-24 bg-slate-50 rounded-4xl flex items-center justify-center text-blue-600 font-black text-4xl border border-slate-100 group-hover:scale-110 transition-all duration-500">
                                                    {org.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{org.name}</h3>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                                        <Users size={12} className="text-blue-500" />
                                                        {org.memberCount} Thành viên chính thức
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50/50 rounded-[2.5rem] p-10 mb-10 border border-slate-100 text-center">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                                    Bạn đang quản lý tổ chức này dưới vai trò Nhà Thầu Chính. Bạn có toàn quyền quản lý nhân sự và hạn mức chi tiêu.
                                                </p>
                                            </div>

                                            <Link href={`/contractor/organization/${org.id}`} className="block">
                                                <button className="w-full py-6 bg-black text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white hover:text-black border-2 border-transparent hover:border-black transition-all flex items-center justify-center gap-4 group">
                                                    Vào Dashboard Quản lý <ArrowRight size={18} className="group-hover:translate-x-2 transition-all" />
                                                </button>
                                            </Link>
                                        </div>
                                    ))}
                                    
                                    <div 
                                        onClick={() => setShowOrgModal(true)}
                                        className="bg-slate-50 rounded-[3.5rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center py-20 px-10 text-center group cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                                    >
                                        <div className="w-20 h-20 bg-white rounded-4xl flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all mb-6">
                                            <Plus size={40} />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Tạo thêm tổ chức mới</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Mở rộng mạng lưới B2B chuyên nghiệp</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Create Organization Modal */}
            {showOrgModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">
                        <div className="p-12 bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white relative">
                            <button 
                                onClick={() => setShowOrgModal(false)}
                                className="absolute top-10 right-10 w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all"
                            >
                                <X size={20} />
                            </button>
                            <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-2">Create B2B Network</h3>
                            <p className="text-blue-100 font-bold uppercase text-[10px] tracking-[0.2em] opacity-80">Thiết lập đơn vị vận hành chuyên nghiệp</p>
                        </div>
                        
                        <form onSubmit={handleCreateOrg} className="p-12 space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tên Đội / Công ty</label>
                                    <input
                                        type="text"
                                        value={createOrgData.name}
                                        onChange={(e) => setCreateOrgData({ ...createOrgData, name: e.target.value })}
                                        placeholder="Ví dụ: Đội thi công A"
                                        className="w-full px-8 py-5 bg-slate-50 rounded-[1.8rem] font-black text-slate-900 outline-none border border-transparent focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm placeholder:text-slate-300"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Mã số thuế (Tùy chọn)</label>
                                    <input
                                        type="text"
                                        value={createOrgData.taxCode}
                                        onChange={(e) => setCreateOrgData({ ...createOrgData, taxCode: e.target.value })}
                                        placeholder="Nhập MST doanh nghiệp"
                                        className="w-full px-8 py-5 bg-slate-50 rounded-[1.8rem] font-black text-slate-900 outline-none border border-transparent focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Địa chỉ</label>
                                    <input
                                        type="text"
                                        value={createOrgData.address}
                                        onChange={(e) => setCreateOrgData({ ...createOrgData, address: e.target.value })}
                                        placeholder="Địa chỉ trụ sở chính"
                                        className="w-full px-8 py-5 bg-slate-50 rounded-[1.8rem] font-black text-slate-900 outline-none border border-transparent focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm placeholder:text-slate-300"
                                    />
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={submittingOrg}
                                className="w-full py-6 bg-blue-600 text-white rounded-[1.8rem] font-black uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/30 flex justify-center items-center gap-4 text-xs active:scale-95 disabled:opacity-50"
                            >
                                {submittingOrg ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Xác nhận tạo đơn vị'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

const Loader2 = ({ className }: { className?: string }) => <RefreshCw className={className} />
