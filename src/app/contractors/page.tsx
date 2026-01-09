'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import SmartNudge from '@/components/SmartNudge'
import { Star, MapPin, Users, Briefcase, CheckCircle, Search, Filter } from 'lucide-react'

interface Contractor {
    id: string
    displayName: string
    bio: string | null
    avatar: string | null
    city: string
    district: string | null
    skills: string[]
    experienceYears: number
    teamSize: number
    isVerified: boolean
    avgRating: number
    totalReviews: number
    completedJobs: number
    isAvailable: boolean
}

const SKILL_LABELS: Record<string, string> = {
    CONSTRUCTION: 'Xây dựng',
    RENOVATION: 'Cải tạo',
    INTERIOR: 'Nội thất',
    FLOORING: 'Lát gạch/sàn',
    PAINTING: 'Sơn',
    PLUMBING: 'Ống nước',
    ELECTRICAL: 'Điện',
    ROOFING: 'Mái',
    CARPENTRY: 'Mộc',
    WELDING: 'Hàn',
    MASONRY: 'Xây',
    TILING: 'Ốp lát'
}

export default function ContractorsPage() {
    const [contractors, setContractors] = useState<Contractor[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterSkill, setFilterSkill] = useState('')

    const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null)
    const [showQuoteModal, setShowQuoteModal] = useState(false)
    const [userProjects, setUserProjects] = useState<any[]>([])
    const [quoteForm, setQuoteForm] = useState({
        details: '',
        location: '',
        budget: '',
        startDate: '',
        projectId: ''
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchContractors()
        fetchUserProjects()
    }, [filterSkill])

    const fetchUserProjects = async () => {
        try {
            const token = localStorage.getItem('access_token')
            if (!token) return
            const res = await fetch('/api/projects', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setUserProjects(data.data.projects || data.data)
                }
            }
        } catch (error) {
            console.error('Failed to fetch projects')
        }
    }

    const fetchContractors = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (filterSkill) params.append('skill', filterSkill)

            const res = await fetch(`/api/contractors?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setContractors(data.data.contractors)
                }
            }
        } catch (error) {
            console.error('Failed to fetch contractors:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenQuote = (e: React.MouseEvent, contractor: Contractor) => {
        e.preventDefault()
        setSelectedContractor(contractor)
        setShowQuoteModal(true)
    }

    const handleSubmitQuote = async () => {
        if (!quoteForm.details || !selectedContractor) {
            alert('Vui lòng nhập mô tả yêu cầu')
            return
        }

        setSubmitting(true)
        try {
            const token = localStorage.getItem('access_token')
            if (!token) {
                window.location.href = '/login?redirect=/contractors'
                return
            }

            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    contractorId: selectedContractor.id,
                    details: quoteForm.details,
                    location: quoteForm.location,
                    budget: quoteForm.budget ? parseFloat(quoteForm.budget) : undefined,
                    startDate: quoteForm.startDate || undefined,
                    projectId: quoteForm.projectId || undefined
                })
            })

            const data = await res.json()

            if (res.ok) {
                alert('Đã gửi yêu cầu báo giá thành công! Nhà thầu sẽ phản hồi sớm.')
                setShowQuoteModal(false)
                setQuoteForm({ details: '', location: '', budget: '', startDate: '', projectId: '' })
            } else {
                alert(data.message || data.error || 'Có lỗi xảy ra')
            }
        } catch (error) {
            console.error('Error sending quote:', error)
            alert('Lỗi kết nối server')
        } finally {
            setSubmitting(false)
        }
    }

    const filteredContractors = contractors.filter(c =>
        c.displayName.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* Quote Modal */}
            {showQuoteModal && selectedContractor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-gray-900">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold text-lg">Yêu cầu Báo giá PRO</h3>
                            <button onClick={() => setShowQuoteModal(false)} className="text-white/80 hover:text-white">✕</button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                            <div>
                                <p className="text-sm text-gray-500 mb-1 font-medium">Gửi tới nhà thầu:</p>
                                <div className="font-bold flex items-center gap-2 text-indigo-700">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold ring-2 ring-indigo-50">
                                        {selectedContractor.displayName.charAt(0)}
                                    </div>
                                    {selectedContractor.displayName}
                                </div>
                            </div>

                            {userProjects.length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 px-1">Chọn Dự án của bạn (Tùy chọn)</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        value={quoteForm.projectId}
                                        onChange={e => setQuoteForm({ ...quoteForm, projectId: e.target.value })}
                                    >
                                        <option value="">-- Không chọn / Dự án mới --</option>
                                        {userProjects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-gray-500 mt-1 px-1">Lưu ý: Nếu chọn dự án, thông tin nhà thầu & chi phí sẽ tự cập nhật khi bạn đồng ý báo giá.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 px-1">Yêu cầu chi tiết *</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px] text-sm"
                                    placeholder="VD: Cần lát gạch 100m2 sân vườn, cung cấp xi măng và cát..."
                                    value={quoteForm.details}
                                    onChange={e => setQuoteForm({ ...quoteForm, details: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 px-1">Ngân sách dự chi</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full border border-gray-200 rounded-xl p-2.5 pl-8 bg-gray-50 text-sm"
                                            placeholder="0"
                                            value={quoteForm.budget}
                                            onChange={e => setQuoteForm({ ...quoteForm, budget: e.target.value })}
                                        />
                                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₫</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 px-1">Vị trí thi công</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 text-sm"
                                        placeholder="Quận/Huyện..."
                                        value={quoteForm.location}
                                        onChange={e => setQuoteForm({ ...quoteForm, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 px-1">Dự kiến khởi công</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-200 rounded-xl p-2.5 bg-gray-50 text-sm"
                                    value={quoteForm.startDate}
                                    onChange={e => setQuoteForm({ ...quoteForm, startDate: e.target.value })}
                                />
                            </div>

                            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Tệp đính kèm (Bản vẽ/Hình ảnh)</label>
                                <div className="flex items-center justify-center border-2 border-dashed border-indigo-200 rounded-lg p-4 bg-white">
                                    <p className="text-[11px] text-gray-400 italic">Tính năng tải tệp đang được chuẩn bị...</p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setShowQuoteModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={handleSubmitQuote}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:bg-indigo-300 flex items-center justify-center gap-2"
                                >
                                    {submitting ? 'Đang gửi...' : 'Gửi yêu cầu PRO'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Section - Clean white */}
            <div className="bg-white border-b border-gray-200 py-8">
                <div className="max-w-6xl mx-auto px-4">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Nhà Thầu Uy Tín</h1>
                    <p className="text-gray-500 mb-6">
                        Tìm nhà thầu chuyên nghiệp, có đánh giá và xác minh
                    </p>

                    {/* Search & Filter */}
                    <div className="flex gap-3 flex-wrap">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên, địa điểm..."
                            className="flex-1 min-w-[250px] px-4 py-2.5 rounded border border-gray-300 text-gray-700 focus:border-blue-500 focus:outline-none"
                        />
                        <select
                            value={filterSkill}
                            onChange={(e) => setFilterSkill(e.target.value)}
                            className="px-4 py-2.5 rounded border border-gray-300 text-gray-700 min-w-[160px]"
                        >
                            <option value="">Tất cả chuyên môn</option>
                            {Object.entries(SKILL_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Contractors List */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredContractors.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">Chưa có nhà thầu nào</h2>
                        <p className="text-gray-500">Đăng ký làm nhà thầu để xuất hiện ở đây</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredContractors.map((contractor) => (
                            <Link
                                key={contractor.id}
                                href={`/contractors/${contractor.id}`}
                                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden group flex flex-col h-full"
                            >
                                {/* Header */}
                                <div className="p-6 flex-1">
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                                            {contractor.avatar ? (
                                                <img src={contractor.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                contractor.displayName.charAt(0).toUpperCase()
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                                    {contractor.displayName}
                                                </h3>
                                                {contractor.isVerified && (
                                                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                    <span className="ml-1 text-sm font-medium text-gray-700">
                                                        {contractor.avgRating.toFixed(1)}
                                                    </span>
                                                    <span className="ml-1 text-sm text-gray-500">
                                                        ({contractor.totalReviews} đánh giá)
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center text-gray-500 text-sm mt-1">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                {contractor.district && `${contractor.district}, `}{contractor.city}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    {contractor.bio && (
                                        <p className="mt-4 text-gray-600 text-sm line-clamp-2">{contractor.bio}</p>
                                    )}

                                    {/* Skills */}
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {contractor.skills.slice(0, 3).map((skill, i) => (
                                            <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full">
                                                {SKILL_LABELS[skill] || skill}
                                            </span>
                                        ))}
                                        {contractor.skills.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                +{contractor.skills.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="px-6 pb-4 pt-2">
                                    <button
                                        onClick={(e) => handleOpenQuote(e, contractor)}
                                        className="w-full py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        Nhận Báo Giá
                                    </button>
                                </div>

                                {/* Footer */}
                                <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center mt-auto">
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Briefcase className="w-4 h-4" />
                                            {contractor.completedJobs} dự án
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {contractor.teamSize} người
                                        </span>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${contractor.isAvailable
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {contractor.isAvailable ? 'Đang nhận việc' : 'Đang bận'}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Smart AI Nudge */}
            <SmartNudge
                pageType="contractors"
                contextData={{
                    category: filterSkill ? SKILL_LABELS[filterSkill] : undefined
                }}
            />
        </div>
    )
}
