'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, MapPin, Coins, Calendar, Phone, Mail, User,
    Send, Clock, Users, Eye, CheckCircle, AlertTriangle, Settings, Share2, ShoppingBag,
    Trophy, Star, Target, ArrowRight, Gavel, FileText, ChevronDown, ChevronUp,
    Loader2, Package, CreditCard
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'
import BiddingForm from '@/components/marketplace/BiddingForm'
import AIMaterialStandards from '@/components/marketplace/AIMaterialStandards'

interface Project {
    id: string
    name: string
    description: string
    projectType?: string
    location: string
    budget: number | null
    budgetType: string
    status: string
    requirements: string[]
    materialsNeeded: string[]
    contactName: string
    contactPhone: string
    contactEmail: string | null
    viewCount: number
    isUrgent: boolean
    createdAt: string
    customerId: string
    applications: any[]
}

export default function ProjectDetailClient({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [showApplyModal, setShowApplyModal] = useState(false)
    const [isOwner, setIsOwner] = useState(false)
    
    // SmartMatch AI State
    const [matchingContractors, setMatchingContractors] = useState<any[]>([])
    const [loadingMatches, setLoadingMatches] = useState(false)
    const [showMatches, setShowMatches] = useState(false)

    // Bidding State
    const [bids, setBids] = useState<any[]>([])
    const [loadingBids, setLoadingBids] = useState(false)
    const [expandedBidId, setExpandedBidId] = useState<string | null>(null)

    useEffect(() => {
        if (projectId) fetchProject()
    }, [projectId])

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}`)
            if (res.ok) {
                const data = await res.json()
                if (data) {
                    setProject(data)
                    const customerId = localStorage.getItem('customer_id')
                    const token = localStorage.getItem('access_token')
                    if (token && customerId) {
                        if (data.customerId === customerId) {
                            setIsOwner(true)
                            fetchBids()
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch project:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchBids = async () => {
        setLoadingBids(true)
        try {
            const res = await fetch(`/api/projects/${projectId}/bids`)
            if (res.ok) {
                const data = await res.json()
                if (data.success) setBids(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch bids:', error)
        } finally {
            setLoadingBids(false)
        }
    }

    const handleApplyStandards = async (materials: string) => {
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ description: (project?.description || '') + '\n\n--- TIÊU CHUẨN VẬT TƯ YÊU CẦU ---\n' + materials })
            })
            if (res.ok) {
                toast.success('Đã cập nhật tiêu chuẩn vật tư')
                fetchProject()
            }
        } catch (err) {
            toast.error('Không thể cập nhật yêu cầu vật tư')
        }
    }

    const handleFindMatches = async () => {
        setLoadingMatches(true)
        setShowMatches(true)
        try {
            const res = await fetch(`/api/marketplace/projects/${projectId}/matches`)
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setMatchingContractors(data.data.matches || [])
                }
            }
        } catch(err) {
            toast.error("Không thể tìm kiếm nhà thầu phù hợp")
        } finally {
            setLoadingMatches(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header />
                <div className="flex flex-col items-center justify-center pt-32 gap-4">
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-bold animate-pulse">Đang tải chi tiết dự án...</p>
                </div>
            </div>
        )
    }

    if (!project) return null

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />
            <Header />
            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <Link href="/projects" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
                    </Link>

                    {/* AI & Status Banner */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
                            <p className="text-gray-500 text-sm mb-1">Trạng thái dự án</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-gray-900">
                                    {project.status === 'OPEN' ? 'Đang nhận hồ sơ' : 'Đã đóng'}
                                </span>
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            </div>
                        </div>
                        {isOwner && (
                            <div className="lg:col-span-2">
                                <AIMaterialStandards
                                    projectId={project.id}
                                    projectTitle={project.name}
                                    onApplyStandards={handleApplyStandards}
                                />
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
                        <div className="p-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{project.name}</h1>
                            <div className="flex flex-wrap gap-4 mb-8 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {project.location || 'Chưa cập nhật'}</span>
                                <span className="flex items-center gap-1 font-bold text-blue-600"><Coins className="w-4 h-4" /> {project.budget?.toLocaleString()}đ</span>
                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(project.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>

                            <div className="prose max-w-none text-gray-700 mb-8 whitespace-pre-wrap">
                                <h3 className="text-lg font-bold mb-2">Mô tả dự án</h3>
                                {project.description}
                            </div>

                            {!isOwner && (
                                <button
                                    onClick={() => setShowApplyModal(true)}
                                    className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                                >
                                    <Send className="w-5 h-5" /> Ứng tuyển ngay
                                </button>
                            )}

                            {isOwner && (
                                <div className="mt-12 border-t border-gray-100 pt-12">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase italic underline underline-offset-8 decoration-blue-200">
                                                <Gavel className="text-blue-600 w-7 h-7" />
                                                Quản lý Đấu thầu ({bids.length})
                                            </h3>
                                            <p className="text-slate-500 text-sm font-medium mt-2">So sánh các gói thầu và chọn đối tác phù hợp nhất cho dự án của bạn.</p>
                                        </div>
                                        <button 
                                            onClick={fetchBids}
                                            className="p-3 bg-slate-50 hover:bg-white border border-slate-100 rounded-2xl hover:shadow-xl transition-all"
                                            title="Làm mới danh sách"
                                        >
                                            <Clock className={`w-5 h-5 text-slate-400 ${loadingBids ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>

                                    {loadingBids ? (
                                        <div className="py-20 text-center">
                                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Đang tải danh sách thầu...</p>
                                        </div>
                                    ) : bids.length > 0 ? (
                                        <div className="space-y-6">
                                            {bids.map((bid) => (
                                                <div key={bid.id} className={`bg-white border-2 rounded-[32px] overflow-hidden transition-all duration-500 ${expandedBidId === bid.id ? 'border-blue-500 shadow-2xl shadow-blue-500/10' : 'border-slate-50 hover:border-slate-200 shadow-sm'}`}>
                                                    <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-16 h-16 rounded-[20px] bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 overflow-hidden shrink-0">
                                                                {bid.contractor.contractorProfile?.avatarUrl ? (
                                                                    <img src={bid.contractor.contractorProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                                ) : bid.contractor.contractorProfile?.displayName?.charAt(0) || 'N'}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xl font-black text-slate-900 tracking-tight">{bid.contractor.contractorProfile?.displayName || bid.contractor.user.name}</h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="flex items-center gap-1 text-xs font-black text-yellow-500"><Star className="w-4 h-4 fill-yellow-500" /> {bid.contractor.contractorProfile?.avgRating || 0}</span>
                                                                    <span className="text-slate-300">•</span>
                                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{bid.contractor.contractorProfile?.totalProjects || 0} Dự án</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-12 text-center md:text-left">
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Giá gói thầu</p>
                                                                <p className="text-2xl font-black text-blue-600 tracking-tighter">{bid.amount.toLocaleString()}đ</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiến độ</p>
                                                                <p className="text-2xl font-black text-slate-800 tracking-tighter">{bid.completionDays} ngày</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <button 
                                                                onClick={() => setExpandedBidId(expandedBidId === bid.id ? null : bid.id)}
                                                                className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                                                            >
                                                                {expandedBidId === bid.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                Chi tiết
                                                            </button>
                                                            {bid.status === 'PENDING' && (
                                                                <button 
                                                                    onClick={async () => {
                                                                        if (confirm('Chấp nhận gói thầu này? Bạn sẽ không thể chọn thầu khác cho đến khi dự án hoàn thành hoặc hủy.')) {
                                                                            const res = await fetch(`/api/projects/${projectId}/bids/${bid.id}`, {
                                                                                method: 'PUT',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({ status: 'ACCEPTED' })
                                                                            });
                                                                            if (res.ok) {
                                                                                toast.success('Đã chấp nhận gói thầu!');
                                                                                fetchProject();
                                                                                fetchBids();
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-blue-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95"
                                                                >
                                                                    Chọn Thầu
                                                                </button>
                                                            )}
                                                            {bid.status === 'ACCEPTED' && (
                                                                <span className="px-8 py-3 bg-emerald-100 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-emerald-200 flex items-center gap-2">
                                                                    <CheckCircle className="w-4 h-4" /> Đã chọn
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {expandedBidId === bid.id && (
                                                        <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-500">
                                                            <div className="h-px bg-slate-50 mb-8" />
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                                                {/* BoQ Section */}
                                                                <div className="space-y-6">
                                                                    <h5 className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-widest">
                                                                        <Package className="w-4 h-4 text-blue-600" /> Bảng kê vật tư (BoQ)
                                                                    </h5>
                                                                    <div className="bg-slate-50/50 rounded-2xl overflow-hidden border border-slate-50">
                                                                        <table className="w-full text-xs">
                                                                            <thead className="bg-[#0c0f17] text-white">
                                                                                <tr>
                                                                                    <th className="px-4 py-3 text-left">Hạng mục</th>
                                                                                    <th className="px-4 py-3 text-center">SL</th>
                                                                                    <th className="px-4 py-3 text-right">Đơn giá</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-slate-100">
                                                                                {bid.boq?.map((item: any, idx: number) => (
                                                                                    <tr key={idx}>
                                                                                        <td className="px-4 py-3 font-bold text-slate-700">{item.item}</td>
                                                                                        <td className="px-4 py-3 text-center font-medium text-slate-400">{item.quantity} {item.unit}</td>
                                                                                        <td className="px-4 py-3 text-right font-black text-slate-600">{item.price.toLocaleString()}đ</td>
                                                                                    </tr>
                                                                                ))}
                                                                                {!bid.boq && <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic">Không cung cấp BoQ chi tiết</td></tr>}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>

                                                                {/* Milestones Section */}
                                                                <div className="space-y-6">
                                                                    <h5 className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-widest">
                                                                        <CreditCard className="w-4 h-4 text-blue-600" /> Lộ trình thanh toán
                                                                    </h5>
                                                                    <div className="space-y-3">
                                                                        {bid.milestones?.map((m: any, idx: number) => (
                                                                            <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">{idx + 1}</div>
                                                                                    <span className="text-sm font-bold text-slate-700">{m.name}</span>
                                                                                </div>
                                                                                <span className="text-sm font-black text-blue-600">{m.percentage}%</span>
                                                                            </div>
                                                                        ))}
                                                                        {!bid.milestones && <p className="text-center text-slate-400 italic py-4">Chưa thiết lập lộ trình thanh toán</p>}
                                                                    </div>

                                                                    <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-dashed border-blue-200">
                                                                        <h6 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><FileText className="w-3 h-3"/> Cam kết từ nhà thầu</h6>
                                                                        <p className="text-xs text-blue-800 leading-relaxed italic">"{bid.message || 'Không có cam kết đính kèm'}"</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                                                <Gavel className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <h4 className="text-lg font-black text-slate-800 tracking-tight">Chưa có gói thầu nào được nộp</h4>
                                            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">Các dự án tại SmartBuild thường nhận được thầu sau 24-48 giờ. Hãy kiên nhẫn nhé!</p>
                                        </div>
                                    )}
                                </div>
                            )}

                             {isOwner && (
                                <div className="mt-12 border-t border-gray-100 pt-8">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 leading-tight uppercase tracking-tight">
                                                <Trophy className="text-yellow-500 w-6 h-6"/>
                                                SmartMatch AI™ - Gợi ý Nhà thầu
                                            </h3>
                                            <p className="text-gray-500 text-sm font-medium mt-1">Thuật toán chấm điểm tự động các đại lý/nhà thầu phù hợp nhất với dự án này dựa trên kỹ năng, khoảng cách và độ uy tín.</p>
                                        </div>
                                        {!showMatches && (
                                            <button 
                                                onClick={handleFindMatches}
                                                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-xl shadow-blue-200 font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                                            >
                                                <Target className="w-5 h-5" /> Bắt đầu tìm kiếm
                                            </button>
                                        )}
                                    </div>

                                    {showMatches && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {loadingMatches ? (
                                                <div className="p-8 text-center bg-blue-50/50 rounded-2xl border border-blue-100">
                                                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                                                    <p className="text-blue-600 font-black uppercase tracking-widest text-xs">SmartMatch đang quét hồ sơ 500+ nhà thầu...</p>
                                                </div>
                                            ) : matchingContractors.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {matchingContractors.map((match: any, idx: number) => (
                                                        <div key={match.contractor.id} className="bg-white border border-gray-100 hover:border-blue-400 p-6 rounded-[24px] shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all relative overflow-hidden group">
                                                            {idx === 0 && (
                                                                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest z-10 shadow-sm flex items-center gap-1">
                                                                    <Star className="w-3 h-3 fill-yellow-900" />
                                                                    Top 1 Phù hợp
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-4 mb-6">
                                                                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 font-black text-2xl flex items-center justify-center border border-blue-100 shadow-inner">
                                                                    {match.contractor.displayName.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors text-lg tracking-tight">{match.contractor.displayName}</h4>
                                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5">
                                                                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {match.contractor.avgRating.toFixed(1)}</span>
                                                                        <span>•</span>
                                                                        <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md">{match.score}% Tương thích</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-2xl">
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-gray-500 font-medium">Kỹ năng cốt lõi:</span>
                                                                    <span className="font-black text-gray-900">{match.breakdown.skillMatch}/40đ</span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                                                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(match.breakdown.skillMatch/40)*100}%` }}></div>
                                                                </div>
                                                                
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-gray-500 font-medium">Khoảng cách & Vị trí:</span>
                                                                    <span className="font-black text-gray-900">{match.breakdown.locationMatch}/25đ</span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                                                                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(match.breakdown.locationMatch/25)*100}%` }}></div>
                                                                </div>
                                                                
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-gray-500 font-medium">Độ uy tín (Rating):</span>
                                                                    <span className="font-black text-gray-900">{match.breakdown.ratingMatch}/20đ</span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(match.breakdown.ratingMatch/20)*100}%` }}></div>
                                                                </div>
                                                            </div>

                                                            <button 
                                                                onClick={() => {
                                                                    toast.success(`Đã gửi thư mời báo giá đến ${match.contractor.displayName}`);
                                                                }}
                                                                className="w-full py-3.5 bg-blue-50 text-blue-700 font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
                                                            >
                                                                Mời Báo Giá <ArrowRight className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-12 text-center bg-gray-50 rounded-[32px] border border-gray-100 border-dashed">
                                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200 shadow-sm">
                                                        <AlertTriangle className="w-8 h-8 text-yellow-500" />
                                                    </div>
                                                    <h4 className="text-lg font-bold text-gray-900 mb-2">Chưa tìm thấy nhà thầu phù hợp</h4>
                                                    <p className="text-gray-500 font-medium max-w-md mx-auto">Hệ thống chưa tìm thấy nhà thầu nào có đủ các kỹ năng tương thích hoàn toàn với dự án này. Vui lòng mở rộng yêu cầu hoặc chờ các đối tác mới tham gia.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {showApplyModal && (
                    <BiddingForm
                        projectId={project.id}
                        projectTitle={project.name}
                        isOpen={showApplyModal}
                        onClose={() => setShowApplyModal(false)}
                        onSuccess={() => {
                            setShowApplyModal(false)
                            fetchProject()
                        }}
                    />
                )}
            </div>
        </div>
    )
}
