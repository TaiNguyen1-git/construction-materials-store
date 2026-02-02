'use client'

/**
 * Contractor Profile Page
 * Edit business info, upload documents, manage account settings
 */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    FileText,
    Upload,
    Save,
    Camera,
    AlertCircle,
    CheckCircle,
    Loader2,
    Trash2,
    Eye,
    Download,
    X,
    Star,
    Award,
    Briefcase,
    Zap
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'

interface BusinessDocument {
    id: string
    name: string
    type: string
    uploadedAt: string
    url: string
    status: 'pending' | 'verified' | 'rejected'
}

interface FeaturedProject {
    id: number
    title: string
    image: string
    year: string
}

export default function ContractorProfilePage() {
    const { user } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Profile form state
    const [profile, setProfile] = useState({
        companyName: '',
        taxId: '',
        representativeName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        ward: '',
        businessType: '',
        website: '',
        // Spotlight fields
        highlightBio: '',
        detailedBio: '',
        skills: [] as string[],
        yearsExperience: '0'
    })

    const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([])

    // Documents state
    const [documents, setDocuments] = useState<BusinessDocument[]>([])
    const [uploadingDoc, setUploadingDoc] = useState(false)

    // Load profile data
    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true)
            try {
                const res = await fetchWithAuth('/api/contractors/profile')

                if (res.ok) {
                    const result = await res.json()
                    if (result.success && result.data) {
                        const data = result.data
                        setProfile({
                            companyName: data.companyName || '',
                            taxId: data.taxId || '',
                            representativeName: data.user?.name || '',
                            email: data.user?.email || '',
                            phone: data.phone || '',
                            address: data.address || '',
                            city: '', // These would normally come from structured address
                            district: '',
                            ward: '',
                            businessType: data.businessType || 'contractor',
                            website: data.website || '',
                            highlightBio: data.highlightBio || '',
                            detailedBio: data.detailedBio || '',
                            skills: data.skills || [],
                            yearsExperience: data.yearsExperience?.toString() || '0'
                        })
                        // Load documents
                        if (data.documents) setDocuments(data.documents)
                    }
                }
            } catch (error) {
                console.error('Failed to load profile:', error)
                toast.error('Không thể tải thông tin hồ sơ')
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            loadProfile()
        }
    }, [user])

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setProfile(prev => ({ ...prev, [name]: value }))
    }

    // Save profile
    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetchWithAuth('/api/contractors/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    companyName: profile.companyName,
                    taxId: profile.taxId,
                    phone: profile.phone,
                    address: profile.address,
                    website: profile.website,
                    businessType: profile.businessType,
                    yearsExperience: parseInt(profile.yearsExperience),
                    skills: profile.skills,
                    highlightBio: profile.highlightBio,
                    detailedBio: profile.detailedBio
                })
            })

            if (res.ok) {
                toast.success('Đã cập nhật thông tin hồ sơ!')
            } else {
                const error = await res.json()
                toast.error(error.message || 'Cập nhật thất bại')
            }
        } catch (error) {
            toast.error('Lỗi kết nối server')
        } finally {
            setSaving(false)
        }
    }

    // Handle document upload
    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
        if (!allowedTypes.includes(file.type)) {
            toast.error('Chỉ chấp nhận file PDF, JPG, PNG')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File không được vượt quá 5MB')
            return
        }

        setUploadingDoc(true)
        try {
            // Simulate upload - in production, call /api/contractor/documents
            await new Promise(resolve => setTimeout(resolve, 1500))

            const newDoc: BusinessDocument = {
                id: Date.now().toString(),
                name: file.name,
                type: file.type.includes('pdf') ? 'PDF' : 'Image',
                uploadedAt: new Date().toISOString(),
                url: URL.createObjectURL(file), // In production, use actual uploaded URL
                status: 'pending'
            }

            const updatedDocs = [...documents, newDoc]
            setDocuments(updatedDocs)
            localStorage.setItem('contractor-documents', JSON.stringify(updatedDocs))

            toast.success('Đã tải lên: ' + file.name)
        } catch (error) {
            toast.error('Tải lên thất bại')
        } finally {
            setUploadingDoc(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    // Delete document
    const deleteDocument = (docId: string) => {
        const updatedDocs = documents.filter(d => d.id !== docId)
        setDocuments(updatedDocs)
        localStorage.setItem('contractor-documents', JSON.stringify(updatedDocs))
        toast.success('Đã xóa tài liệu')
    }

    // Get status badge
    const getStatusBadge = (status: BusinessDocument['status']) => {
        switch (status) {
            case 'verified':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Đã xác minh
                    </span>
                )
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        <X className="w-3 h-3" />
                        Từ chối
                    </span>
                )
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Đang chờ
                    </span>
                )
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className={`flex-1 pt-[73px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-6 lg:p-8 max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <User className="w-7 h-7 text-blue-600" />
                            Hồ Sơ Doanh Nghiệp
                        </h1>
                        <p className="text-gray-500 mt-1">Quản lý thông tin và giấy tờ doanh nghiệp</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Business Info */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    Thông Tin Doanh Nghiệp
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tên Công Ty *
                                        </label>
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={profile.companyName}
                                            onChange={handleChange}
                                            placeholder="VD: Công ty TNHH Xây Dựng ABC"
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mã Số Thuế *
                                        </label>
                                        <input
                                            type="text"
                                            name="taxId"
                                            value={profile.taxId}
                                            onChange={handleChange}
                                            placeholder="VD: 0123456789"
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Người Đại Diện *
                                        </label>
                                        <input
                                            type="text"
                                            name="representativeName"
                                            value={profile.representativeName}
                                            onChange={handleChange}
                                            placeholder="Họ và tên người đại diện"
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Loại Hình Kinh Doanh
                                        </label>
                                        <select
                                            name="businessType"
                                            value={profile.businessType}
                                            onChange={handleChange}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Chọn loại hình</option>
                                            <option value="contractor">Nhà thầu xây dựng</option>
                                            <option value="developer">Chủ đầu tư</option>
                                            <option value="retailer">Đại lý bán lẻ</option>
                                            <option value="other">Khác</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email *
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={profile.email}
                                                onChange={handleChange}
                                                placeholder="email@company.com"
                                                className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Số Điện Thoại *
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={profile.phone}
                                                onChange={handleChange}
                                                placeholder="0901 234 567"
                                                className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Địa Chỉ *
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                            <textarea
                                                name="address"
                                                value={profile.address}
                                                onChange={handleChange}
                                                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                                                rows={2}
                                                className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            name="website"
                                            value={profile.website}
                                            onChange={handleChange}
                                            placeholder="https://www.company.com"
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Đang lưu...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                Lưu Thông Tin
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Profile Spotlight (Flow 4) */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    Tâm Điểm Hồ Sơ (Spotlight)
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Khẩu hiệu/Tâm điểm (Ngắn gọn)
                                        </label>
                                        <input
                                            type="text"
                                            name="highlightBio"
                                            value={profile.highlightBio}
                                            onChange={handleChange}
                                            placeholder="VD: Chuyên thầu xây trọn gói uy tín tại Đồng Nai"
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Giới thiệu chi tiết
                                        </label>
                                        <textarea
                                            name="detailedBio"
                                            value={profile.detailedBio}
                                            onChange={handleChange}
                                            rows={4}
                                            placeholder="Mô tả kỹ năng, thế mạnh và những giá trị bạn mang lại cho khách hàng..."
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Số năm kinh nghiệm
                                            </label>
                                            <input
                                                type="number"
                                                name="yearsExperience"
                                                value={profile.yearsExperience}
                                                onChange={handleChange}
                                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Chuyên môn chính (ngăn cách bởi dấu phẩy)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="VD: Xây nhà phố, Biệt thự, Sửa chữa..."
                                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                                                onBlur={(e) => {
                                                    const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                                    setProfile(prev => ({ ...prev, skills }))
                                                }}
                                                defaultValue={profile.skills?.join(', ')}
                                            />
                                        </div>
                                    </div>

                                    {/* Featured Projects Showcase */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                <Briefcase className="w-4 h-4 text-gray-500" />
                                                Công trình tiêu biểu
                                            </h3>
                                            <button
                                                onClick={() => setFeaturedProjects([...featuredProjects, { id: Date.now(), title: '', image: '', year: '' }])}
                                                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                            >
                                                <Zap className="w-3 h-3" /> Thêm công trình
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {featuredProjects.map((proj, idx) => (
                                                <div key={proj.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative group">
                                                    <button
                                                        onClick={() => setFeaturedProjects(featuredProjects.filter(p => p.id !== proj.id))}
                                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <div className="grid md:grid-cols-12 gap-4">
                                                        <div className="md:col-span-4 aspect-video bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300">
                                                            <Camera className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                        <div className="md:col-span-8 space-y-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Tên công trình/dự án"
                                                                className="w-full bg-transparent border-0 border-b border-gray-200 focus:ring-0 focus:border-blue-500 text-sm font-medium"
                                                                value={proj.title}
                                                                onChange={(e) => {
                                                                    const next = [...featuredProjects]
                                                                    next[idx].title = e.target.value
                                                                    setFeaturedProjects(next)
                                                                }}
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Năm hoàn thành & địa điểm"
                                                                className="w-full bg-transparent border-0 border-b border-gray-200 focus:ring-0 focus:border-blue-500 text-xs"
                                                                value={proj.year}
                                                                onChange={(e) => {
                                                                    const next = [...featuredProjects]
                                                                    next[idx].year = e.target.value
                                                                    setFeaturedProjects(next)
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Cập Nhật Spotlight
                                    </button>
                                </div>
                            </div>

                            {/* Documents Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Giấy Tờ Pháp Lý
                                </h2>

                                <p className="text-sm text-gray-500 mb-4">
                                    Tải lên các giấy tờ: Giấy phép kinh doanh, Giấy chứng nhận đăng ký thuế, CMND/CCCD người đại diện...
                                </p>

                                {/* Upload Area */}
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center mb-6">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleDocumentUpload}
                                        className="hidden"
                                        id="doc-upload"
                                    />
                                    <label
                                        htmlFor="doc-upload"
                                        className="cursor-pointer"
                                    >
                                        {uploadingDoc ? (
                                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
                                        ) : (
                                            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                        )}
                                        <p className="text-gray-600 font-medium">
                                            {uploadingDoc ? 'Đang tải lên...' : 'Nhấn hoặc kéo thả file vào đây'}
                                        </p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            PDF, JPG, PNG - Tối đa 5MB
                                        </p>
                                    </label>
                                </div>

                                {/* Documents List */}
                                {documents.length > 0 ? (
                                    <div className="space-y-3">
                                        {documents.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                                            >
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {doc.type} • {new Date(doc.uploadedAt).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                                {getStatusBadge(doc.status)}
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Xem"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </a>
                                                    <button
                                                        onClick={() => deleteDocument(doc.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 py-6">
                                        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>Chưa có giấy tờ nào được tải lên</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

