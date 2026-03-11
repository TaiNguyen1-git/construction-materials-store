'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, MapPin, DollarSign, Calendar, Phone, Mail, User,
    Send, Clock, Users, Eye, CheckCircle, AlertTriangle, Settings, Share2, ShoppingBag,
    Trophy, Star, Target, ArrowRight
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'
import ApplicationForm from '@/components/marketplace/ApplicationForm'
import AIMaterialStandards from '@/components/marketplace/AIMaterialStandards'
import Footer from '@/components/Footer'

interface Project {
    id: string
    title: string
    description: string
    projectType: string
    location: string
    district: string | null
    city: string
    estimatedBudget: number | null
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

    useEffect(() => {
        if (projectId) fetchProject()
    }, [projectId])

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/marketplace/projects/${projectId}`)
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setProject(data.data)
                    const customerId = localStorage.getItem('customer_id')
                    const token = localStorage.getItem('access_token')
                    if (token && customerId) {
                        if (data.data.customerId === customerId) setIsOwner(true)
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch project:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApplyStandards = async (materials: string) => {
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`/api/marketplace/projects/${projectId}`, {
                method: 'PATCH',
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
                                    projectTitle={project.title}
                                    onApplyStandards={handleApplyStandards}
                                />
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
                        <div className="p-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h1>
                            <div className="flex flex-wrap gap-4 mb-8 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {project.city}</span>
                                <span className="flex items-center gap-1 font-bold text-blue-600"><DollarSign className="w-4 h-4" /> {project.estimatedBudget?.toLocaleString()}đ</span>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <ApplicationForm
                                projectId={project.id}
                                projectTitle={project.title}
                                isOpen={showApplyModal}
                                onClose={() => setShowApplyModal(false)}
                                onSuccess={() => {
                                    setShowApplyModal(false)
                                    fetchProject()
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    )
}
