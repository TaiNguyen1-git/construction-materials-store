'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
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

    useEffect(() => {
        fetchContractors()
    }, [filterSkill])

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

    const filteredContractors = contractors.filter(c =>
        c.displayName.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
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
                                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden group"
                            >
                                {/* Header */}
                                <div className="p-6">
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

                                {/* Footer */}
                                <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
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
        </div>
    )
}
