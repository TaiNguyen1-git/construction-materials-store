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
    CheckCircle2, Loader2
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
                toast.error('Telemetry Sync Failure: Node unreachable')
            }
        } catch (error) {
            console.error('Failed to fetch project:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleSave = () => {
        setIsSaved(!isSaved)
        toast.success(isSaved ? 'Node released from memory' : 'Core node saved to local cache')
    }

    if (loading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center gap-6 animate-pulse">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Synchronizing Site Telemetry Data...</p>
            </div>
        )
    }

    if (!project) return (
        <div className="h-[600px] flex flex-col items-center justify-center gap-6 text-center">
            <AlertTriangle className="w-16 h-16 text-rose-500" />
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Node Desynchronized</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">The requested project identifier does not exist in the shard.</p>
            </div>
            <button onClick={() => router.back()} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3">
                <ArrowLeft size={16} /> Return to Matrix
            </button>
        </div>
    )

    const isListing = project.status === 'OPEN'

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-24 max-w-7xl mx-auto">
            <Toaster position="top-right" />
            
            {/* Nav Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-4 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all group italic"
                >
                    <div className="w-12 h-12 rounded-[1.2rem] bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                        <ArrowLeft size={20} />
                    </div>
                    Return to Navigation
                </button>
                <div className="flex items-center gap-3">
                    <button className="w-12 h-12 bg-white border border-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl flex items-center justify-center transition-all">
                        <Share2 size={20} />
                    </button>
                    {!isListing && (
                        <button className="px-6 py-3 bg-white border border-slate-100 text-slate-900 font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center gap-3 hover:bg-slate-50 shadow-sm">
                            <Download size={16} /> Audit Pack
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
                                <div className="absolute top-8 right-8 bg-rose-600 text-white font-black text-[9px] uppercase tracking-[0.3em] px-6 py-2 rounded-full shadow-lg shadow-rose-200 animate-pulse flex items-center gap-2">
                                    <Zap size={10} fill="currentColor" /> Critical Priority
                                </div>
                            )}

                            <div className="relative z-10 space-y-10">
                                <div className="space-y-6">
                                    <div className="w-20 h-20 bg-slate-950 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-slate-300">
                                        <Building2 size={40} />
                                    </div>
                                    <h1 className="text-5xl font-black text-slate-900 leading-tight uppercase italic tracking-tighter max-w-2xl">{project.title}</h1>
                                    <div className="flex flex-wrap gap-8">
                                        <div className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] italic">
                                            <MapPin size={20} className="text-blue-500" /> {project.city}
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] italic">
                                            <Calendar size={20} className="text-blue-500" /> {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div className="flex items-center gap-3 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] italic bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100">
                                            <Users size={20} /> {project.applicationCount || 0} Responses Detected
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-12 border-t border-slate-50">
                                    <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-widest flex items-center gap-4">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                        Executive Summary
                                    </h3>
                                    <p className="text-slate-600 font-bold italic leading-relaxed text-sm whitespace-pre-wrap">{project.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Requirements Matrix */}
                        {project.requirements?.length > 0 && (
                            <div className="bg-slate-950 rounded-[3.5rem] p-12 lg:p-16 text-white relative overflow-hidden">
                                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -ml-48 -mb-48"></div>
                                <div className="relative z-10 space-y-10">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                                        <ShieldCheck size={32} className="text-emerald-500" />
                                        Operational Requirements
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {project.requirements.map((req, idx) => (
                                            <div key={idx} className="flex items-start gap-5 bg-white/5 border border-white/10 p-8 rounded-[2rem] group hover:bg-white/10 transition-all">
                                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                    <Sparkles size={20} className="text-blue-400" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-300 italic tracking-tight">{req}</span>
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
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Budget Alpha</p>
                                <p className="text-4xl font-black italic tracking-tighter text-blue-600 tabular-nums">
                                    {project.estimatedBudget ? formatCurrency(project.estimatedBudget) : 'Strategic / Negotiable'}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={() => setShowApplyModal(true)}
                                    className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-4 active:scale-95 italic group/btn overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-white/10 skew-x-[-20deg] transform translate-x-[-150%] group-hover/btn:translate-x-[150%] transition-transform duration-1000"></div>
                                    <Send size={20} className="group-hover/btn:translate-x-2 group-hover/btn:-translate-y-2 transition-transform" /> Transmit Bid Proposal
                                </button>

                                <button
                                    onClick={handleToggleSave}
                                    className={`w-full py-8 bg-slate-50 hover:bg-slate-100 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 active:scale-95 italic ${isSaved ? 'text-blue-600 bg-blue-50 shadow-inner' : 'text-slate-400'}`}
                                >
                                    <Bookmark size={20} className={isSaved ? "fill-current" : ""} />
                                    {isSaved ? 'Node Archived' : 'Save to Matrix'}
                                </button>
                            </div>

                            <div className="pt-10 border-t border-slate-100">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[1.8rem] bg-slate-900 text-white flex items-center justify-center font-black text-2xl italic">
                                        {project.contactName?.charAt(0) || 'P'}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-black uppercase italic tracking-tighter text-slate-900">{project.contactName || 'Principal Artifact'}</p>
                                        <div className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full w-fit">
                                            <ShieldCheck size={12} /> Identity Secured
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
                                <div className="w-24 h-24 rounded-[2.5rem] bg-slate-950 text-white flex items-center justify-center shadow-2xl shadow-slate-300 shrink-0 transform transition-transform group-hover/header:scale-110">
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
                                            {project.status === 'IN_PROGRESS' ? '• Active Operation' : 
                                             project.status === 'COMPLETED' ? '• Deployment Finalized' : 
                                             project.status === 'PLANNING' ? '• Blueprint Phase' : project.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-8 font-black text-[10px] uppercase tracking-widest text-slate-400 italic">
                                        <span className="flex items-center gap-3"><MapPin size={20} className="text-blue-500" /> {project.city} Matrix</span>
                                        <span className="flex items-center gap-3"><UserIcon size={20} className="text-blue-500" /> Principal: {project.contactName}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <Link 
                                    href={`/contractor/projects/${project.id}/timeline`}
                                    className="px-10 py-6 bg-slate-900 hover:bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-4 italic group/timeline"
                                >
                                    <Clock size={20} className="group-hover/timeline:rotate-90 transition-transform" /> Operational Timeline
                                </Link>
                                <Link 
                                    href={`/contractor/quick-order?projectId=${project.id}`}
                                    className="px-10 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-4 italic group/disburse"
                                >
                                    <Zap size={20} className="group-hover/disburse:scale-125 transition-transform" /> Material Procurement
                                </Link>
                            </div>
                        </div>

                        {/* Visual Progress Telemetry */}
                        <div className="mt-16 pt-16 border-t border-slate-100">
                            <div className="flex justify-between items-end mb-8 px-2">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Aggregate Site Health</p>
                                    <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic">{Math.round(project.progress || 0)}% <span className="text-blue-600">Completion</span></h3>
                                </div>
                                <div className="text-right space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Fiscal Consumption</p>
                                    <h3 className="text-3xl font-black text-emerald-600 tracking-tighter italic">24.2% <span className="text-slate-300 text-xl font-bold">Alpha</span></h3>
                                </div>
                            </div>
                            <div className="h-4 bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100 shadow-inner">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-700 to-indigo-950 rounded-full transition-all duration-[2000ms] shadow-[0_0_20px_rgba(37,99,235,0.3)] relative overflow-hidden"
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
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
                                    <Layers size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Fiscal Milestone Matrix</h3>
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
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Vanguard Phase 0{idx + 1}</p>
                                                        <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none group-hover:text-blue-600 transition-colors">{ms.name}</h4>
                                                        <div className="flex items-center gap-6 pt-2">
                                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full uppercase tracking-widest italic">{formatCurrency(ms.amount)}</span>
                                                            <span className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest italic"><Calendar size={18} className="text-blue-400" /> {new Date(ms.dueDate).toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 w-full md:w-auto">
                                                    <button className="flex-1 md:flex-none px-8 py-4 bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-950 hover:text-white transition-all italic border border-slate-100">Audit Verification</button>
                                                    <Badge className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl border-0 ${
                                                        ms.status === 'PAID' ? 'bg-emerald-600 text-white shadow-emerald-100' : 
                                                        ms.status === 'COMPLETED' ? 'bg-emerald-400 text-white' : 
                                                        ms.status === 'IN_PROGRESS' ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-white border-2 border-slate-100 text-slate-300'
                                                    }`}>
                                                        {ms.status === 'PAID' ? 'Fiscal Clear' : 
                                                         ms.status === 'COMPLETED' ? 'Verified' : 
                                                         ms.status === 'IN_PROGRESS' ? 'Operational' : 'Idle Phase'}
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
                                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] max-w-sm mx-auto">No milestone telemetry detected for this shard. Consult principal to initialize fiscal phases.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Multi-Node Sidebar */}
                        <div className="lg:col-span-4 space-y-10">
                            {/* Principal Direct Link */}
                            <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40 group/contact">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 transition-all duration-1000 group-hover/contact:scale-150"></div>
                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                        <h4 className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em] italic">Principal Command Link</h4>
                                    </div>
                                    
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-[2.2rem] bg-white text-slate-950 flex items-center justify-center font-black text-3xl italic shadow-2xl shadow-blue-500/20">
                                            {project.contactName?.charAt(0) || 'P'}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-black text-2xl tracking-tighter uppercase italic">{project.contactName}</p>
                                            <div className="flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                Protocol Active
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <button className="w-full py-6 bg-white text-slate-950 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/40 flex items-center justify-center gap-4 italic group/send">
                                            <Send size={20} className="fill-slate-950 group-hover/send:translate-x-2 group-hover/send:-translate-y-2 transition-transform" /> Initialize Comms Shard
                                        </button>
                                        {project.contactPhone && (
                                            <a 
                                                href={`tel:${project.contactPhone}`}
                                                className="w-full py-6 bg-white/5 border border-white/10 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-4 italic active:scale-95 shadow-lg"
                                            >
                                                <Phone size={20} /> Tactical Voice Call
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Task Pipeline Utility */}
                            <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-100 space-y-10">
                                <div className="flex items-center justify-between px-2">
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black text-slate-950 uppercase tracking-[0.3em] italic leading-none">Task Pipeline</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Operational Backlog</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px] shadow-sm border border-blue-100">03</div>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        'Audit Material Batch-002',
                                        'Verify Zone-1 Framework',
                                        'Sync with Electrical Unit'
                                    ].map((task, i) => (
                                        <div key={i} className="flex items-center gap-5 p-6 bg-slate-50 rounded-[1.8rem] group cursor-pointer hover:bg-slate-950 transition-all duration-500">
                                            <div className="w-6 h-6 rounded-lg border-2 border-slate-200 group-hover:border-blue-500 transition-all"></div>
                                            <span className="text-[10px] font-black uppercase italic tracking-tight text-slate-500 group-hover:text-white transition-colors">{task}</span>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full py-5 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all italic">Expand All Ops Units</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Application Flow Controller */}
            {showApplyModal && project && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowApplyModal(false)}></div>
                    <div className="bg-white rounded-[4rem] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-500 relative z-[110] border border-white/20 scrollbar-hide p-1">
                        <ApplicationForm
                            projectId={project.id}
                            projectTitle={project.title}
                            isOpen={showApplyModal}
                            onClose={() => setShowApplyModal(false)}
                            onSuccess={() => {
                                setShowApplyModal(false)
                                fetchProject()
                                toast.success('Bid Telemetry Transmitted')
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
