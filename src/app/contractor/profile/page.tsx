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
    Zap,
    ShieldCheck,
    Globe,
    ArrowUpRight,
    Fingerprint,
    Search
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import { useQuery, useQueryClient } from '@tanstack/react-query'

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
    const { user, isAuthenticated } = useAuth()
    const queryClient = useQueryClient()
    const [saving, setSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Local form state for editing
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
        highlightBio: '',
        detailedBio: '',
        skills: [] as string[],
        yearsExperience: '0'
    })

    const fetchProfile = async () => {
        const res = await fetchWithAuth('/api/contractors/profile')
        if (!res.ok) throw new Error('Fetch profile failed')
        const result = await res.json()
        return result.data
    }

    const { data: profileData, isLoading: loading } = useQuery({
        queryKey: ['contractor-profile'],
        queryFn: fetchProfile,
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000
    })

    useEffect(() => {
        if (profileData) {
            setProfile({
                companyName: profileData.companyName || '',
                taxId: profileData.taxId || '',
                representativeName: profileData.user?.name || '',
                email: profileData.user?.email || '',
                phone: profileData.phone || '',
                address: profileData.address || '',
                city: '', 
                district: '',
                ward: '',
                businessType: profileData.businessType || 'contractor',
                website: profileData.website || '',
                highlightBio: profileData.highlightBio || '',
                detailedBio: profileData.detailedBio || '',
                skills: profileData.skills || [],
                yearsExperience: profileData.yearsExperience?.toString() || '0'
            })
            if (profileData.documents) setDocuments(profileData.documents)
        }
    }, [profileData])

    const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([])
    const [documents, setDocuments] = useState<BusinessDocument[]>([])
    const [uploadingDoc, setUploadingDoc] = useState(false)

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
                toast.success('Hồ sơ đã được đồng bộ hóa thành công!')
                queryClient.invalidateQueries({ queryKey: ['contractor-profile'] })
            } else {
                const error = await res.json()
                toast.error(error.message || 'Lỗi truyền tải dữ liệu')
            }
        } catch (error) {
            toast.error('Giao thức mạng bị gián đoạn')
        } finally {
            setSaving(false)
        }
    }

    // Handle document upload
    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
        if (!allowedTypes.includes(file.type)) {
            toast.error('Chỉ chấp nhận định dạng PDF, JPG, PNG')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Dung lượng tệp vượt quá giới hạn 10MB')
            return
        }

        setUploadingDoc(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 2000))

            const newDoc: BusinessDocument = {
                id: Date.now().toString(),
                name: file.name,
                type: file.type.includes('pdf') ? 'PDF' : 'IMAGE',
                uploadedAt: new Date().toISOString(),
                url: URL.createObjectURL(file),
                status: 'pending'
            }

            const updatedDocs = [...documents, newDoc]
            setDocuments(updatedDocs)
            toast.success('Giao thức tải lên hoàn tất: ' + file.name)
        } catch (error) {
            toast.error('Tải lên thất bại')
        } finally {
            setUploadingDoc(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const deleteDocument = (docId: string) => {
        const updatedDocs = documents.filter(d => d.id !== docId)
        setDocuments(updatedDocs)
        toast.success('Đã gỡ bỏ tài liệu khỏi vault')
    }

    const getStatusBadge = (status: BusinessDocument['status']) => {
        switch (status) {
            case 'verified':
                return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold">Đã xác thực</span>
            case 'rejected':
                return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-md text-xs font-semibold">Từ chối</span>
            default:
                return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-semibold">Chờ duyệt</span>
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Fingerprint className="w-6 h-6 text-blue-600" />
                        Hồ sơ Doanh nghiệp
                    </h1>
                    <p className="text-sm text-slate-500">Quản lý danh tính doanh nghiệp & Hồ sơ năng lực B2B</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                        {saving ? 'Đang lưu...' : 'Lưu Hồ sơ'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-[600px] bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <p className="text-sm text-slate-500 font-medium tracking-wide">Đang tải cấu trúc dữ liệu...</p>
                    </div>
                </div>
            ) : (
                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        {/* Core Identity Information Block */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8 animate-in slide-in-from-bottom-5 duration-700">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                        <Building2 className="w-6 h-6 text-blue-600" />
                                        Thông tin Cơ bản
                                    </h2>
                                    <p className="text-sm text-slate-500">Thông tin thực thể pháp lý doanh nghiệp</p>
                                </div>
                                <ShieldCheck className="w-8 h-8 text-emerald-500 opacity-20" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { label: 'Tên Doanh nghiệp', name: 'companyName', value: profile.companyName, icon: Building2 },
                                    { label: 'Mã số thuế', name: 'taxId', value: profile.taxId, icon: Award },
                                    { label: 'Người đại diện', name: 'representativeName', value: profile.representativeName, icon: User },
                                    { label: 'Loại hình Kinh doanh', name: 'businessType', value: profile.businessType, icon: Zap, type: 'select', options: ['contractor', 'developer', 'retailer'] }
                                ].map((field, i) => (
                                    <div key={i} className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700">{field.label}</label>
                                        <div className="relative group">
                                            <field.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                            {field.type === 'select' ? (
                                                <select
                                                    name={field.name}
                                                    value={field.value}
                                                    onChange={handleChange}
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                                                >
                                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt === 'contractor' ? 'Nhà Thầu' : opt === 'developer' ? 'Chủ Đầu Tư' : 'Bán Lẻ'}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    name={field.name}
                                                    value={field.value}
                                                    onChange={handleChange}
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { label: 'Email Liên hệ', name: 'email', value: profile.email, icon: Mail },
                                    { label: 'Số điện thoại', name: 'phone', value: profile.phone, icon: Phone }
                                ].map((field, i) => (
                                    <div key={i} className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700">{field.label}</label>
                                        <div className="relative group">
                                            <field.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type="text"
                                                name={field.name}
                                                value={field.value}
                                                onChange={handleChange}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Trụ sở chính / Địa chỉ giao dịch</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                    <textarea
                                        name="address"
                                        value={profile.address}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Professional Spotlight Block */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8 animate-in slide-in-from-bottom-5 duration-1000">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                        <Award className="w-6 h-6 text-blue-600" />
                                        Hồ sơ Năng lực
                                    </h2>
                                    <p className="text-sm text-slate-500">Khẳng định giá trị & Thế mạnh thi công</p>
                                </div>
                                <Award className="w-8 h-8 text-blue-600 opacity-20" />
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Giá trị cốt lõi / Slogan</label>
                                    <input
                                        type="text"
                                        name="highlightBio"
                                        value={profile.highlightBio}
                                        onChange={handleChange}
                                        placeholder="Ví dụ: Kiến tạo không gian - Vững bền tương lai..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700">Năm Kinh nghiệm</label>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                name="yearsExperience"
                                                value={profile.yearsExperience}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all tabular-nums"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">Năm</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700">Hạng mục Chuyên môn</label>
                                        <input
                                            type="text"
                                            placeholder="Cách nhau bởi dấu phẩy..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                                            onBlur={(e) => {
                                                const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                                setProfile(prev => ({ ...prev, skills }))
                                            }}
                                            defaultValue={profile.skills?.join(', ')}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Mô tả Năng lực Chi tiết</label>
                                    <textarea
                                        name="detailedBio"
                                        value={profile.detailedBio}
                                        onChange={handleChange}
                                        rows={6}
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all resize-none"
                                        placeholder="Giới thiệu chi tiết về quy mô, năng lực và các công trình tiêu biểu..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        {/* Legal Accountability Vault */}
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 shadow-sm space-y-8 relative overflow-hidden">
                            <div className="relative z-10 space-y-6">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                                        Tài liệu Pháp lý
                                    </h2>
                                    <p className="text-sm text-slate-500">Giấy phép & Chứng nhận</p>
                                </div>

                                {/* Upload Trigger */}
                                <div className="border-2 border-slate-300 bg-white rounded-xl p-8 text-center space-y-4 group/upload cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all border-dashed relative">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleDocumentUpload}
                                        className="hidden"
                                        id="doc-vault-upload"
                                    />
                                    <label htmlFor="doc-vault-upload" className="cursor-pointer block space-y-4">
                                        {uploadingDoc ? (
                                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
                                        ) : (
                                            <Upload className="w-10 h-10 text-slate-400 group-hover/upload:text-blue-600 transition-colors mx-auto" />
                                        )}
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-700">{uploadingDoc ? 'Đang Tải Lên...' : 'Tải Tài Liệu Mới'}</p>
                                            <p className="text-xs text-slate-500">PDF hoặc Ảnh • Tối đa 10MB</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Documents Registry */}
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                    {documents.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400">
                                            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                            <p className="text-sm font-medium">Chưa có tài liệu nào</p>
                                        </div>
                                    ) : (
                                        documents.map((doc) => (
                                            <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500">
                                                            <FileText size={18} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 truncate">{doc.name}</p>
                                                            <p className="text-xs text-slate-500">{doc.type} • {new Date(doc.uploadedAt).toLocaleDateString('vi-VN')}</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => deleteDocument(doc.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors bg-slate-50 hover:bg-rose-50 rounded-md"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 mt-1">
                                                    {getStatusBadge(doc.status)}
                                                    <a
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-8 h-8 bg-slate-50 hover:bg-blue-600 text-slate-600 hover:text-white rounded-lg flex items-center justify-center transition-all"
                                                    >
                                                        <Eye size={16} />
                                                    </a>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Social & Digital Presence Block */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
                            <div className="space-y-1 pb-4 border-b border-slate-100">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                    <Globe className="w-6 h-6 text-blue-600" />
                                    Hiện diện Số
                                </h2>
                                <p className="text-sm text-slate-500">Kênh truyền thông & Website</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Website Công ty</label>
                                <div className="relative group">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="url"
                                        name="website"
                                        value={profile.website}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-blue-600"
                                        placeholder="https://www.congty.com"
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-4 text-center group cursor-pointer hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all">
                                <ArrowUpRight className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Xem Trang Hồ sơ Công khai</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
