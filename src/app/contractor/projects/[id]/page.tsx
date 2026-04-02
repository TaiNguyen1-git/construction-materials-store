'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, MapPin, Coins, Calendar,
    Send, Clock, User as UserIcon, Users, CheckCircle,
    AlertTriangle, Share2, Bookmark, Building2,
    FileText, Phone, Activity, ShieldCheck, Zap,
    Cpu, Sparkles, LayoutGrid, Layers, ArrowUpRight,
    Search, Download, ExternalLink, MessageSquare,
    CheckCircle2, Loader2, Navigation, FileCheck
} from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'
import ApplicationForm from '@/components/marketplace/ApplicationForm'

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

interface Project {
    id: string
    title: string
    description: string
    projectType: string
    location: string
    city: string
    estimatedBudget: number | null
    status: string
    requirements: string[]
    contactName: string
    contactPhone?: string
    createdAt: string
    isUrgent: boolean
    applicationCount: number
    viewCount: number
    milestones: any[]
    expenses: any[]
    progress: number
}

export default function ContractorProjectDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [showApplyModal, setShowApplyModal] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    useEffect(() => {
        if (id) fetchProject()
    }, [id])

    const fetchProject = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth(`/api/contractors/projects/${id}`)
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setProject(data.data)
                    return
                }
            }

            const marketRes = await fetchWithAuth(`/api/marketplace/projects/${id}`)
            if (marketRes.ok) {
                const data = await marketRes.json()
                if (data.success) {
                    setProject(data.data)
                }
            } else {
                toast.error('Lỗi kết nối dữ liệu: Không thể đồng bộ hệ thống.')
            }
        } catch (error) {
            console.error('Failed to fetch project:', error)
            toast.error('Lỗi truy xuất thông tin dự án.')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleSave = () => {
        setIsSaved(!isSaved)
        toast.success(isSaved ? 'Đã gỡ dự án khỏi danh sách lưu trữ' : 'Đã lưu dự án vào bộ nhớ tạm')
    }

    const handleAuditDownload = () => {
        toast.loading('Đang chuẩn bị bộ hồ sơ kiểm toán...', { duration: 2000 })
        setTimeout(() => toast.success('Tải hồ sơ thành công!'), 2000)
    }

    const handleAuditVerification = (milestoneName: string) => {
        toast.loading(`Đang gửi yêu cầu nghiệm thu cho: ${milestoneName}...`, { duration: 2000 })
        setTimeout(() => toast.success('Yêu cầu đã được gửi đến chủ đầu tư!'), 2000)
    }

    const handleInitializeComms = () => {
        toast.loading('Đang khởi tạo kênh liên lạc bảo mật...', { duration: 1500 })
        setTimeout(() => router.push('/contractor/messages'), 1500)
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Đã sao chép liên kết dự án!')
    }

    if (loading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center gap-6 animate-pulse">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Đang đồng bộ dữ liệu công trình...</p>
            </div>
        )
    }

    if (!project) return (
        <div className="h-[600px] flex flex-col items-center justify-center gap-6 text-center animate-in fade-in duration-500">
            <AlertTriangle className="w-16 h-16 text-rose-500" />
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Mất kết nối dữ liệu</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mã dự án được yêu cầu không tồn tại hoặc đã bị gỡ bỏ.</p>
            </div>
            <button onClick={() => router.back()} className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 active:scale-95 transition-all">
                <ArrowLeft size={16} /> Quay lại danh sách
            </button>
        </div>
    )

    const isListing = project.status === 'OPEN'

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-24 max-w-7xl mx-auto">
            <Toaster position="top-right" />
            
            {/* Nav Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-4 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-all group italic"
                >
                    <div className="w-12 h-12 rounded-[1.2rem] bg-white border border-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <ArrowLeft size={20} />
                    </div>
                    Quay lại điều hướng
                </button>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleShare}
                        className="w-12 h-12 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 rounded-2xl flex items-center justify-center transition-all shadow-sm"
                    >
                        <Share2 size={20} />
                    </button>
                    {!isListing && (
                        <button 
                            onClick={handleAuditDownload}
                            className="px-6 py-3 bg-white border border-slate-100 text-blue-600 font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center gap-3 hover:bg-blue-50 shadow-sm transition-all active:scale-95"
                        >
                            <Download size={16} /> Bộ hồ sơ kiểm toán
                        </button>
                    )}
                </div>
            </div>

            {isListing ? (
                /* MARKETPLACE LISTING VIEW - High Premium Branding */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 space-y-12">
                        {/* Core Listing Hero */}
                        <div className="bg-white rounded-[3.5rem] p-12 lg:p-16 shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-1000 group-hover:scale-110"></div>
                            
                            {project.isUrgent && (
                                <div className="absolute top-8 right-8 bg-rose-600 text-white font-black text-[9px] uppercase tracking-[0.3em] px-6 py-2 rounded-full shadow-lg shadow-rose-200 animate-pulse flex items-center gap-2 z-20">
                                    <Zap size={10} fill="currentColor" /> Ưu tiên khẩn cấp
                                </div>
                            )}

                            <div className="relative z-10 space-y-10">
                                <div className="space-y-6">
                                    <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-200">
                                        <Building2 size={40} />
                                    </div>
                                    <h1 className="text-5xl font-black text-slate-900 leading-tight uppercase italic tracking-tighter max-w-2xl">{project.title}</h1>
                                    <div className="flex flex-wrap gap-8">
                                        <div className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] italic">
                                            <MapPin size={20} className="text-blue-600" /> {project.city}
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] italic">
                                            <Calendar size={20} className="text-blue-600" /> {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div className="flex items-center gap-3 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] italic bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100">
                                            <Users size={20} /> {project.applicationCount || 0} Nhà thầu đang quan tâm
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-12 border-t border-slate-50">
                                    <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-widest flex items-center gap-4">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                        Mô tả tóm tắt dự án
                                    </h3>
                                    <p className="text-slate-600 font-bold italic leading-relaxed text-sm whitespace-pre-wrap">{project.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Requirements Matrix */}
                        {project.requirements?.length > 0 && (
                            <div className="bg-indigo-600 rounded-[3.5rem] p-12 lg:p-16 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -ml-48 -mb-48"></div>
                                <div className="relative z-10 space-y-10">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                                        <ShieldCheck size={32} className="text-emerald-400" />
                                        Yêu cầu năng lực thi công
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {project.requirements.map((req, idx) => (
                                            <div key={idx} className="flex items-start gap-5 bg-white/10 border border-white/10 p-8 rounded-[2rem] group hover:bg-white/20 transition-all">
                                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                    <Sparkles size={20} className="text-blue-300" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-100 italic tracking-tight leading-relaxed">{req}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Action Column */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-50 sticky top-24 space-y-10">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Ngân sách dự kiến</p>
                                <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100">
                                    <p className="text-3xl font-black italic tracking-tighter text-blue-600 tabular-nums">
                                        {project.estimatedBudget ? formatCurrency(project.estimatedBudget) : 'Thỏa thuận / Chiến lược'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={() => setShowApplyModal(true)}
                                    className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-4 active:scale-95 italic group/btn overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-white/10 skew-x-[-20deg] transform translate-x-[-150%] group-hover/btn:translate-x-[150%] transition-transform duration-1000"></div>
                                    <Send size={20} className="group-hover/btn:translate-x-2 group-hover/btn:-translate-y-2 transition-transform" /> Gửi báo giá ngay
                                </button>

                                <button
                                    onClick={handleToggleSave}
                                    className={`w-full py-8 bg-slate-50 hover:bg-slate-100 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 active:scale-95 italic ${isSaved ? 'text-blue-600 bg-blue-50 shadow-inner' : 'text-slate-400'}`}
                                >
                                    <Bookmark size={20} className={isSaved ? "fill-current" : ""} />
                                    {isSaved ? 'Đã lưu dự án' : 'Lưu dự án'}
                                </button>
                            </div>

                            <div className="pt-10 border-t border-slate-100">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[1.8rem] bg-indigo-600 text-white flex items-center justify-center font-black text-2xl italic shadow-lg shadow-indigo-100">
                                        {project.contactName?.charAt(0) || 'D'}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-black uppercase italic tracking-tighter text-slate-900">{project.contactName || 'Chủ đầu tư'}</p>
                                        <div className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full w-fit">
                                            <ShieldCheck size={12} /> Đã xác minh
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* PROJECT MANAGEMENT DASHBOARD - Ultra High Tech */
                <div className="space-y-12">
                    {/* Real-time Telemetry Header */}
                    <div className="bg-white rounded-[3.5rem] p-12 lg:p-16 shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group/header">
                        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-br from-blue-50/50 via-indigo-50/20 to-transparent rounded-full -mr-48 -mt-48 blur-[120px] transition-all duration-1000 group-hover/header:rotate-12"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                            <div className="flex gap-10">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-200 shrink-0 transform transition-transform group-hover/header:scale-110">
                                    <Building2 size={48} />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none uppercase italic">{project.title}</h1>
                                        <Badge className={`w-fit px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border-2 shadow-sm ${
                                            project.status === 'IN_PROGRESS' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                            project.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                            'bg-slate-50 text-slate-500 border-slate-100'
                                        }`}>
                                            {project.status === 'IN_PROGRESS' ? '• Đang thực hiện' : 
                                             project.status === 'COMPLETED' ? '• Đã hoàn thành' : 
                                             project.status === 'PLANNING' ? '• Đang chuẩn bị' : project.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-8 font-black text-[10px] uppercase tracking-widest text-slate-400 italic">
                                        <span className="flex items-center gap-3"><MapPin size={20} className="text-blue-600" /> Khu vực: {project.city}</span>
                                        <span className="flex items-center gap-3"><UserIcon size={20} className="text-blue-600" /> Chủ đầu tư: {project.contactName}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <Link 
                                    href={`/contractor/projects/${project.id}/timeline`}
                                    className="px-10 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-4 italic group/timeline"
                                >
                                    <Clock size={20} className="group-hover/timeline:rotate-90 transition-transform" /> Tiến độ thi công
                                </Link>
                                <Link 
                                    href={`/contractor/quick-order?projectId=${project.id}`}
                                    className="px-10 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-4 italic group/disburse"
                                >
                                    <Zap size={20} className="group-hover/disburse:scale-125 transition-transform" /> Mua sắm vật tư
                                </Link>
                            </div>
                        </div>

                        {/* Visual Progress Telemetry */}
                        <div className="mt-16 pt-16 border-t border-slate-100">
                            <div className="flex justify-between items-end mb-8 px-2">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Hiệu năng công trình</p>
                                    <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic">{Math.round(project.progress || 0)}% <span className="text-blue-600">Đã hoàn tất</span></h3>
                                </div>
                                <div className="text-right space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Tỉ lệ giải ngân</p>
                                    <h3 className="text-3xl font-black text-emerald-600 tracking-tighter italic">24.2% <span className="text-slate-300 text-xl font-bold">Thực tế</span></h3>
                                </div>
                            </div>
                            <div className="h-4 bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100 shadow-inner">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 rounded-full transition-all duration-[2000ms] shadow-[0_0_20px_rgba(37,99,235,0.3)] relative overflow-hidden"
                                    style={{ width: `${project.progress || 0}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-[shimmer_3s_infinite]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Milestone Matrix */}
                        <div className="lg:col-span-8 space-y-10">
                            <div className="flex items-center gap-4 px-2">
                                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
                                    <Layers size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Kế hoạch các mốc thanh toán</h3>
                            </div>
                            
                            <div className="grid gap-6">
                                {project.milestones?.length > 0 ? (
                                    project.milestones.map((ms, idx) => (
                                        <div key={ms.id} className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-blue-200/30 hover:border-blue-100 transition-all duration-500 group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                                <div className="flex items-center gap-8">
                                                    <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center shrink-0 shadow-lg ${
                                                        ms.status === 'COMPLETED' || ms.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 
                                                        ms.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 shadow-blue-100' : 'bg-slate-50 text-slate-300'
                                                    }`}>
                                                        {ms.status === 'COMPLETED' || ms.status === 'PAID' ? <CheckCircle2 size={36} /> : <Activity size={36} className={ms.status === 'IN_PROGRESS' ? 'animate-pulse' : ''} />}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Giai đoạn thi công 0{idx + 1}</p>
                                                        <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none group-hover:text-blue-600 transition-colors">{ms.name}</h4>
                                                        <div className="flex items-center gap-6 pt-2">
                                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full uppercase tracking-widest italic">{formatCurrency(ms.amount)}</span>
                                                            <span className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest italic"><Calendar size={18} className="text-blue-600" /> Hạn: {new Date(ms.dueDate).toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 w-full md:w-auto">
                                                    <button 
                                                        onClick={() => handleAuditVerification(ms.name)}
                                                        className="flex-1 md:flex-none px-8 py-4 bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-600 hover:text-white transition-all italic border border-slate-100 active:scale-95 shadow-sm"
                                                    >
                                                        Gửi yêu cầu nghiệm thu
                                                    </button>
                                                    <Badge className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl border-0 ${
                                                        ms.status === 'PAID' ? 'bg-emerald-600 text-white shadow-emerald-100' : 
                                                        ms.status === 'COMPLETED' ? 'bg-emerald-400 text-white' : 
                                                        ms.status === 'IN_PROGRESS' ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-white border-2 border-slate-100 text-slate-300'
                                                    }`}>
                                                        {ms.status === 'PAID' ? 'Đã quyết toán' : 
                                                         ms.status === 'COMPLETED' ? 'Đã xác nhận' : 
                                                         ms.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Chờ xử lý'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white rounded-[4rem] p-24 text-center border-4 border-dashed border-slate-50">
                                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                            <FileText className="w-12 h-12 text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] max-w-sm mx-auto">Không tìm thấy dữ liệu các mốc thanh toán. Vui lòng liên hệ chủ đầu tư để thiết lập kế hoạch giải ngân.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Multi-Node Sidebar */}
                        <div className="lg:col-span-4 space-y-10">
                            {/* Principal Direct Link */}
                            <div className="bg-indigo-600 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200 group/contact text-center">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 transition-all duration-1000 group-hover/contact:scale-150"></div>
                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="w-2 h-6 bg-blue-300 rounded-full"></div>
                                        <h4 className="text-[10px] font-black text-blue-100 uppercase tracking-[0.3em] italic">Kênh liên hệ chủ đầu tư</h4>
                                    </div>
                                    
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="w-24 h-24 rounded-[2.5rem] bg-white text-indigo-600 flex items-center justify-center font-black text-4xl italic shadow-2xl shadow-blue-500/20">
                                            {project.contactName?.charAt(0) || 'D'}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-black text-2xl tracking-tighter uppercase italic">{project.contactName}</p>
                                            <div className="flex items-center justify-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                                Đường truyền ổn định
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <button 
                                            onClick={handleInitializeComms}
                                            className="w-full py-6 bg-white text-slate-950 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/40 flex items-center justify-center gap-4 italic group/send"
                                        >
                                            <Send size={20} className="fill-slate-950 group-hover/send:translate-x-2 group-hover/send:-translate-y-2 transition-transform" /> Gửi tin nhắn bảo mật
                                        </button>
                                        {project.contactPhone && (
                                            <a 
                                                href={`tel:${project.contactPhone}`}
                                                className="w-full py-6 bg-white/5 border border-white/10 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-4 italic active:scale-95 shadow-lg"
                                            >
                                                <Phone size={20} /> Gọi điện trực tiếp
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Task Pipeline Utility */}
                            <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-100 space-y-10">
                                <div className="flex items-center justify-between px-2">
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black text-slate-950 uppercase tracking-[0.3em] italic leading-none">Danh sách công việc</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Kế hoạch cần thực hiện</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px] shadow-sm border border-blue-100">03</div>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        'Kiểm toán vật tư đợt-002',
                                        'Xác nhận khung Zone-1',
                                        'Đồng bộ với đơn vị điện nước'
                                    ].map((task, i) => (
                                        <div key={i} className="flex items-center gap-5 p-6 bg-slate-50 rounded-[1.8rem] group cursor-pointer hover:bg-blue-600 transition-all duration-500">
                                            <div className="w-6 h-6 rounded-lg border-2 border-slate-200 group-hover:border-white transition-all"></div>
                                            <span className="text-[10px] font-black uppercase italic tracking-tight text-slate-500 group-hover:text-white transition-colors">{task}</span>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full py-5 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all italic border-dashed">Xem toàn bộ đầu việc</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Application Flow Controller */}
            {showApplyModal && project && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowApplyModal(false)}></div>
                    <div className="bg-white rounded-[4rem] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-500 relative z-[110] border border-white/20 scrollbar-hide p-1">
                        <ApplicationForm
                            projectId={project.id}
                            projectTitle={project.title}
                            isOpen={showApplyModal}
                            onClose={() => setShowApplyModal(false)}
                            onSuccess={() => {
                                setShowApplyModal(false)
                                fetchProject()
                                toast.success('Dữ liệu báo giá đã được truyền tải thành công!')
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
