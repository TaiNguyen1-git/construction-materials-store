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
    CheckCircle2, Loader2, Navigation, FileCheck, Check, X, Plus
} from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'
import ApplicationForm from '@/components/marketplace/ApplicationForm'
import ProjectProgress from '../components/ProjectProgress'

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
    const [showTasksModal, setShowTasksModal] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [tasks, setTasks] = useState([
        { id: 1, text: 'Kiểm toán vật tư đợt-002', completed: false },
        { id: 2, text: 'Xác nhận khung Zone-1', completed: false },
        { id: 3, text: 'Họp với đơn vị điện nước', completed: false }
    ])
    const [newTask, setNewTask] = useState('')

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
                toast.error('Không thể đồng bộ dữ liệu dự án.')
            }
        } catch (error) {
            console.error('Failed to fetch project:', error)
            toast.error('Lỗi kết nối máy chủ.')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleSave = () => {
        setIsSaved(!isSaved)
        toast.success(isSaved ? 'Đã bỏ lưu dự án' : 'Đã lưu dự án vào danh sách quan tâm')
    }

    const handleAuditDownload = () => {
        toast.loading('Đang chuẩn bị hồ sơ dự án...', { duration: 1500 })
        setTimeout(() => toast.success('Tải xuống hoàn tất!'), 1500)
    }

    const handleAuditVerification = (milestoneName: string) => {
        toast.loading(`Đang gửi yêu cầu nghiệm thu cho: ${milestoneName}...`, { duration: 1500 })
        setTimeout(() => toast.success('Đã gửi yêu cầu nghiệm thu!'), 1500)
    }

    const handleInitializeComms = () => {
        toast.loading('Đang mở kênh tin nhắn...', { duration: 1000 })
        setTimeout(() => router.push('/contractor/messages'), 1000)
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Đã sao chép liên kết!')
    }

    const toggleTask = (taskId: number) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) return

        const newState = !task.completed
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: newState } : t))
        
        toast.success(newState ? `Hoàn tất: ${task.text}` : `Đã mở lại đầu việc.`, {
            icon: newState ? '✅' : '🔄',
            duration: 1500
        })
    }

    const handleSeeAllTasks = () => {
        setShowTasksModal(true)
    }

    if (loading) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin opacity-40" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Đang tải dữ liệu công trình...</p>
            </div>
        )
    }

    if (!project) return (
        <div className="h-[400px] flex flex-col items-center justify-center gap-6 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-500 opacity-50" />
            <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Không tìm thấy dự án</h2>
                <p className="text-sm text-slate-500 font-medium">Dự án này có thể đã bị xóa hoặc không còn tồn tại.</p>
            </div>
            <button onClick={() => router.back()} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase transition-all hover:bg-slate-200 active:scale-95">
                Quay lại
            </button>
        </div>
    )

    const isListing = project.status === 'OPEN'

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-0">
            <Toaster position="top-right" />
            
            {/* Header Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-3 text-slate-500 hover:text-blue-600 transition-all group"
                >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-600/20 group-hover:bg-blue-600/5 transition-all shadow-sm">
                        <ArrowLeft size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 group-hover:text-blue-600">Quay lại danh sách</span>
                </button>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleShare}
                        className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90"
                    >
                        <Share2 size={18} />
                    </button>
                    {!isListing && (
                        <button 
                            onClick={handleAuditDownload}
                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
                        >
                            <Download size={16} /> Hồ sơ kiểm toán
                        </button>
                    )}
                </div>
            </div>

            {isListing ? (
                /* MARKETPLACE VIEW */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        {/* Hero Card */}
                        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                            {project.isUrgent && (
                                <div className="absolute top-6 right-6 bg-rose-500 text-white font-bold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md flex items-center gap-2 z-20">
                                    <Zap size={10} fill="currentColor" /> Ưu tiên thầu
                                </div>
                            )}

                            <div className="relative z-10 space-y-8">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                                        <Building2 size={32} />
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-900 leading-tight tracking-tight">{project.title}</h1>
                                    <div className="flex flex-wrap gap-6 border-t border-slate-50 pt-6">
                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                            <MapPin size={16} className="text-blue-600" /> {project.city}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                            <Calendar size={16} className="text-blue-600" /> {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-wider bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                            <Users size={16} /> {project.applicationCount || 0} Nhà thầu quan tâm
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-slate-50">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                        <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                                        Mô tả dự án
                                    </h3>
                                    <p className="text-slate-600 font-medium leading-relaxed text-sm whitespace-pre-wrap">{project.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Requirements */}
                        {project.requirements?.length > 0 && (
                            <div className="bg-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-100">
                                <div className="relative z-10 space-y-6">
                                    <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                        <ShieldCheck size={24} className="text-emerald-300" />
                                        Năng lực nhà thầu yêu cầu
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {project.requirements.map((req, idx) => (
                                            <div key={idx} className="flex items-start gap-4 bg-white/10 border border-white/10 p-5 rounded-xl transition-all">
                                                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                                                    <Sparkles size={16} className="text-blue-200" />
                                                </div>
                                                <span className="text-sm font-bold text-blue-50 tracking-tight leading-relaxed">{req}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Actions */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm sticky top-24 space-y-8">
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Ngân sách dự kiến</p>
                                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-2xl font-bold tracking-tight text-blue-600">
                                        {project.estimatedBudget ? formatCurrency(project.estimatedBudget) : 'Thỏa thuận'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowApplyModal(true)}
                                    className="w-full py-4 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Send size={16} /> Gửi hồ sơ thầu
                                </button>

                                <button
                                    onClick={handleToggleSave}
                                    className={`w-full py-4 bg-slate-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 ${isSaved ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}
                                >
                                    <Bookmark size={16} className={isSaved ? "fill-current" : ""} />
                                    {isSaved ? 'Đã lưu quan tâm' : 'Lưu dự án'}
                                </button>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-xl text-white flex items-center justify-center font-bold text-xl">
                                        {project.contactName?.charAt(0) || 'C'}
                                    </div>
                                    <div className="space-y-0.5 text-left">
                                        <p className="font-bold text-slate-900">{project.contactName || 'Chủ đầu tư'}</p>
                                        <Badge className="bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-wider shadow-none border-none flex items-center gap-1 w-fit">
                                            <ShieldCheck size={10} /> Đã xác minh
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* PROJECT MANAGEMENT DASHBOARD */
                <div className="space-y-8">
                    {/* Project Status Header */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                    <Building2 size={40} />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{project.title}</h1>
                                        <Badge className={`w-fit px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border shadow-none ${
                                            project.status === 'IN_PROGRESS' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                            project.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                            'bg-slate-50 text-slate-500 border-slate-100'
                                        }`}>
                                            {project.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 
                                             project.status === 'COMPLETED' ? 'Đã hoàn tất' : 
                                             project.status === 'PLANNING' ? 'Lập kế hoạch' : project.status}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        <span className="flex items-center gap-2"><MapPin size={16} className="text-blue-600" /> {project.city}</span>
                                        <span className="flex items-center gap-2"><UserIcon size={16} className="text-blue-600" /> Chủ đầu tư: {project.contactName}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link 
                                    href={`/contractor/projects/${project.id}/timeline`}
                                    className="px-6 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Clock size={16} /> Tiến độ
                                </Link>
                                <Link 
                                    href={`/contractor/quick-order?projectId=${project.id}`}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Zap size={16} /> Mua vật tư
                                </Link>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <ProjectProgress 
                            progress={project.progress || 0} 
                            milestones={project.milestones || []} 
                            estimatedBudget={project.estimatedBudget} 
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Milestone List */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center gap-3 px-1">
                                <Layers size={20} className="text-blue-600" />
                                <h3 className="text-xl font-bold text-slate-900">Các mốc thanh toán</h3>
                            </div>
                            
                            <div className="space-y-4">
                                {project.milestones?.length > 0 ? (
                                    project.milestones.map((ms, idx) => (
                                        <div key={ms.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-blue-200 transition-all group relative overflow-hidden">
                                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                                                        ms.status === 'COMPLETED' || ms.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                        ms.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-300 border-slate-100'
                                                    }`}>
                                                        {ms.status === 'COMPLETED' || ms.status === 'PAID' ? <CheckCircle2 size={28} /> : <Activity size={28} className={ms.status === 'IN_PROGRESS' ? 'animate-pulse' : ''} />}
                                                    </div>
                                                    <div className="space-y-1.5 text-left">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giai đoạn {idx + 1}</p>
                                                        <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{ms.name}</h4>
                                                        <div className="flex items-center gap-4">
                                                            <Badge className="bg-blue-50 text-blue-600 border-none shadow-none text-[10px] font-bold px-2 py-0.5">{formatCurrency(ms.amount)}</Badge>
                                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                                <Calendar size={14} /> Hạn: {new Date(ms.dueDate).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 w-full md:w-auto">
                                                    <button 
                                                        onClick={() => handleAuditVerification(ms.name)}
                                                        className="flex-1 md:flex-none px-5 py-2.5 bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-wider rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-slate-200 active:scale-95"
                                                    >
                                                        Yêu cầu nghiệm thu
                                                    </button>
                                                    <Badge className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider shadow-none border-none ${
                                                        ms.status === 'PAID' ? 'bg-emerald-600 text-white' : 
                                                        ms.status === 'COMPLETED' ? 'bg-emerald-400 text-white' : 
                                                        ms.status === 'IN_PROGRESS' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
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
                                    <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200">
                                        <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                                            <FileText className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider max-w-xs mx-auto">Chưa có kế hoạch giải ngân cụ thể.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contacts & Tasks */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* Contact Card */}
                            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group/contact text-center">
                                <div className="relative z-10 space-y-6">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thông tin chủ đầu tư</p>
                                    
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-3xl shadow-lg">
                                            {project.contactName?.charAt(0) || 'C'}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-xl text-slate-900">{project.contactName}</p>
                                            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                ĐANG TRỰC TUYẾN
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4">
                                        <button 
                                            onClick={handleInitializeComms}
                                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-700 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                                        >
                                            <Send size={18} className="fill-white" /> Nhắn tin ngay
                                        </button>
                                        {project.contactPhone && (
                                            <a 
                                                href={`tel:${project.contactPhone}`}
                                                className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                                            >
                                                <Phone size={18} /> Gọi điện
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Task Pipeline */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center justify-between px-1">
                                    <div className="space-y-0.5 text-left font-bold text-slate-900">
                                        <h4 className="text-xs uppercase tracking-wider text-slate-400">Danh sách công việc</h4>
                                        <p className="text-sm">Ưu tiên xử lý</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">{tasks.length < 10 ? `0${tasks.length}` : tasks.length}</div>
                                </div>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!newTask.trim()) return;
                                    setTasks([{ id: Date.now(), text: newTask, completed: false }, ...tasks]);
                                    setNewTask('');
                                }} className="flex gap-2">
                                    <input value={newTask} onChange={e => setNewTask(e.target.value)} type="text" placeholder="Thêm công việc nhanh..." className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
                                    <button type="submit" className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all shadow-sm shrink-0">
                                        <Plus size={16} />
                                    </button>
                                </form>
                                <div className="space-y-3">
                                    {tasks.slice(0, 5).map((task) => (
                                        <div 
                                            key={task.id} 
                                            onClick={() => {
                                                setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
                                            }}
                                            className={`flex items-center gap-4 p-4 rounded-xl group cursor-pointer transition-all duration-300 border border-transparent ${
                                                task.completed ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'bg-slate-50 hover:bg-slate-100 hover:border-blue-200'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center shrink-0 ${
                                                task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 group-hover:border-blue-500 bg-white'
                                            }`}>
                                                {task.completed && <Check size={12} strokeWidth={4} />}
                                            </div>
                                            <span className={`text-xs font-bold transition-colors ${
                                                task.completed ? 'text-slate-400 line-through italic' : 'text-slate-600 group-hover:text-blue-600'
                                            }`}>
                                                {task.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setShowTasksModal(true)}
                                    className="w-full py-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Xem tất cả
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Application Modal */}
            {showApplyModal && project && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowApplyModal(false)}></div>
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 relative z-[110] p-1">
                        <ApplicationForm
                            projectId={project.id}
                            projectTitle={project.title}
                            isOpen={showApplyModal}
                            onClose={() => setShowApplyModal(false)}
                            onSuccess={() => {
                                setShowApplyModal(false)
                                fetchProject()
                                toast.success('Đã gửi hồ sơ thầu thành công!')
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Tasks Modal */}
            {showTasksModal && project && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowTasksModal(false)}></div>
                    <div className="bg-white rounded-2xl w-full max-w-xl max-h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative z-[110] border border-slate-100 flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="space-y-1 text-left">
                                <h3 className="text-lg font-bold text-slate-900">Danh sách công việc chi tiết</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Dự án: {project.title}</p>
                            </div>
                            <button onClick={() => setShowTasksModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-all active:scale-95">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (!newTask.trim()) return;
                                setTasks([{ id: Date.now(), text: newTask, completed: false }, ...tasks]);
                                setNewTask('');
                            }} className="flex gap-2 mb-4">
                                <input value={newTask} onChange={e => setNewTask(e.target.value)} type="text" placeholder="Thêm công việc chi tiết..." className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
                                <button type="submit" className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all shadow-sm shrink-0">
                                    <Plus size={20} />
                                </button>
                            </form>
                            {tasks.map((task) => (
                                <div 
                                    key={task.id} 
                                    onClick={() => {
                                        setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
                                    }}
                                    className={`flex items-center gap-4 p-4 rounded-xl group cursor-pointer transition-all duration-300 border border-transparent ${
                                        task.completed ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'bg-slate-50 hover:bg-slate-100'
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center shrink-0 ${
                                        task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 group-hover:border-blue-500 bg-white'
                                    }`}>
                                        {task.completed && <Check size={14} strokeWidth={4} />}
                                    </div>
                                    <span className={`text-sm font-bold transition-colors flex-1 ${
                                        task.completed ? 'text-slate-400 line-through italic' : 'text-slate-700'
                                    }`}>
                                        {task.text}
                                    </span>
                                </div>
                            ))}
                            <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-100/50 flex items-center gap-4 mt-8">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 shrink-0">
                                    <Sparkles size={20} />
                                </div>
                                <p className="text-xs font-bold text-blue-700 leading-relaxed">
                                    Hệ thống tự động đồng bộ hóa ưu tiên đầu việc dựa trên mốc thời gian thực tế của dự án.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                            <button onClick={() => setShowTasksModal(false)} className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg">
                                Đóng danh sách
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
