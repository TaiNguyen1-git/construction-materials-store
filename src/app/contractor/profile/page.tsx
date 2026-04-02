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
                return <span className="px-5 py-2 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Verified</span>
            case 'rejected':
                return <span className="px-5 py-2 bg-rose-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20">Rejected</span>
            default:
                return <span className="px-5 py-2 bg-amber-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20">Awaiting audit</span>
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
            {/* Architectural Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
                        <Fingerprint className="w-10 h-10 text-indigo-600" />
                        Infrastructure Identity
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Quản lý danh tính doanh nghiệp & Hồ sơ năng lực B2B</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center gap-3 shadow-xl shadow-slate-200 active:scale-95"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                        {saving ? 'Syncing...' : 'Sync Vault'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-[600px] bg-white rounded-[3.5rem] border border-slate-100 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Accessing Institutional Data...</p>
                    </div>
                </div>
            ) : (
                <div className="grid lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-10">
                        {/* Core Identity Information Block */}
                        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-12 space-y-12 animate-in slide-in-from-bottom-5 duration-700">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-4">
                                        <Building2 className="w-7 h-7 text-indigo-600" />
                                        Corporate Matrix
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin thực thể pháp lý</p>
                                </div>
                                <ShieldCheck className="w-10 h-10 text-emerald-500 opacity-20" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {[
                                    { label: 'Institutional Name', name: 'companyName', value: profile.companyName, icon: Building2 },
                                    { label: 'Fiscal Tax ID', name: 'taxId', value: profile.taxId, icon: Award },
                                    { label: 'Commercial Principal', name: 'representativeName', value: profile.representativeName, icon: User },
                                    { label: 'Corporate Tier', name: 'businessType', value: profile.businessType, icon: Zap, type: 'select', options: ['contractor', 'developer', 'retailer'] }
                                ].map((field, i) => (
                                    <div key={i} className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{field.label}</label>
                                        <div className="relative group">
                                            <field.icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                            {field.type === 'select' ? (
                                                <select
                                                    name={field.name}
                                                    value={field.value}
                                                    onChange={handleChange}
                                                    className="w-full pl-16 pr-6 py-4.5 bg-slate-50 border-transparent rounded-[1.8rem] text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 outline-none transition-all font-bold uppercase italic tracking-tighter"
                                                >
                                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    name={field.name}
                                                    value={field.value}
                                                    onChange={handleChange}
                                                    className="w-full pl-16 pr-6 py-4.5 bg-slate-50 border-transparent rounded-[1.8rem] text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 outline-none transition-all font-bold italic tracking-tighter uppercase"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {[
                                    { label: 'Commercial Email', name: 'email', value: profile.email, icon: Mail },
                                    { label: 'Verified Phone', name: 'phone', value: profile.phone, icon: Phone }
                                ].map((field, i) => (
                                    <div key={i} className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{field.label}</label>
                                        <div className="relative group">
                                            <field.icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                            <input
                                                type="text"
                                                name={field.name}
                                                value={field.value}
                                                onChange={handleChange}
                                                className="w-full pl-16 pr-6 py-4.5 bg-slate-50 border-transparent rounded-[1.8rem] text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 outline-none transition-all font-bold italic tracking-tighter"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Administrative Center / HQ</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-6 top-6 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                    <textarea
                                        name="address"
                                        value={profile.address}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full pl-16 pr-6 py-5 bg-slate-50 border-transparent rounded-[2.5rem] text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 outline-none transition-all font-bold italic tracking-tighter uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Professional Spotlight Block */}
                        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-12 space-y-12 animate-in slide-in-from-bottom-5 duration-1000">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-4">
                                        <Zap className="w-7 h-7 text-amber-500 fill-current" />
                                        Operational Spotlight
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hồ sơ năng lực & Thế mạnh thi công</p>
                                </div>
                                <Award className="w-10 h-10 text-amber-500 opacity-20" />
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">High-Impact Headline</label>
                                    <input
                                        type="text"
                                        name="highlightBio"
                                        value={profile.highlightBio}
                                        onChange={handleChange}
                                        placeholder="MISSION STATEMENT / UNIQUE VALUE PROPOSITION..."
                                        className="w-full px-10 py-5 bg-slate-50 border-transparent rounded-[2rem] text-sm focus:bg-white focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/20 outline-none transition-all font-black italic tracking-tighter uppercase"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Yearly Tenacity</label>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                name="yearsExperience"
                                                value={profile.yearsExperience}
                                                onChange={handleChange}
                                                className="w-full px-10 py-5 bg-slate-50 border-transparent rounded-[2rem] text-2xl focus:bg-white focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/20 outline-none transition-all font-black italic tracking-tighter tabular-nums"
                                            />
                                            <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Years in Field</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Technical Proficiencies</label>
                                        <input
                                            type="text"
                                            placeholder="DELINEATE WITH COMMAS..."
                                            className="w-full px-10 py-5 bg-slate-50 border-transparent rounded-[2rem] text-sm focus:bg-white focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/20 outline-none transition-all font-black italic tracking-tight uppercase"
                                            onBlur={(e) => {
                                                const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                                setProfile(prev => ({ ...prev, skills }))
                                            }}
                                            defaultValue={profile.skills?.join(', ')}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Executive Narrative</label>
                                    <textarea
                                        name="detailedBio"
                                        value={profile.detailedBio}
                                        onChange={handleChange}
                                        rows={6}
                                        className="w-full px-10 py-8 bg-slate-50 border-transparent rounded-[3rem] text-sm focus:bg-white focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/20 outline-none transition-all font-bold leading-relaxed italic placeholder:text-slate-200"
                                        placeholder="DEEP DIVE INTO OPERATIONAL EXCELLENCE & STRATEGIC ADVANTAGES..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-10">
                        {/* Legal Accountability Vault */}
                        <div className="bg-slate-900 rounded-[3.5rem] p-12 space-y-10 shadow-2xl text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                            
                            <div className="relative z-10 space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                                        <ShieldCheck className="w-7 h-7 text-indigo-400" />
                                        Legal Vault
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tài liệu pháp lý & Kiểm định</p>
                                </div>

                                {/* Upload Trigger */}
                                <div className="border border-white/10 bg-white/5 rounded-[2.5rem] p-8 text-center space-y-6 group/upload cursor-pointer hover:bg-white/10 transition-all duration-500 border-dashed relative">
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
                                            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
                                        ) : (
                                            <Upload className="w-12 h-12 text-slate-700 group-hover/upload:text-indigo-400 transition-colors mx-auto" />
                                        )}
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">{uploadingDoc ? 'TRANSMITTING...' : 'INJECT PROTOCOL'}</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">PDF / IMAGE • MAX 10MB</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Documents Registry */}
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar-dark">
                                    {documents.length === 0 ? (
                                        <div className="text-center py-20 opacity-20">
                                            <FileText className="w-12 h-12 mx-auto mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Vault Empty</p>
                                        </div>
                                    ) : (
                                        documents.map((doc) => (
                                            <div key={doc.id} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 space-y-4 group/doc hover:bg-white/10 transition-all">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover/doc:text-indigo-400 transition-colors">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-black uppercase tracking-tighter truncate text-slate-300">{doc.name}</p>
                                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{doc.type} • {new Date(doc.uploadedAt).toLocaleDateString('vi-VN')}</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => deleteDocument(doc.id)}
                                                        className="p-2 text-slate-700 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    {getStatusBadge(doc.status)}
                                                    <a
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-10 h-10 bg-white/5 hover:bg-indigo-600 rounded-xl flex items-center justify-center transition-all group/eye"
                                                    >
                                                        <Eye size={16} className="text-slate-500 group-hover/eye:text-white" />
                                                    </a>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Social & Digital Presence Block */}
                        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-10 space-y-10">
                            <div className="space-y-2">
                                <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                                    <Globe className="w-6 h-6 text-blue-500" />
                                    Digital Hub
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kênh truyền thông & Website</p>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Corporate Website</label>
                                <div className="relative group">
                                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="url"
                                        name="website"
                                        value={profile.website}
                                        onChange={handleChange}
                                        className="w-full pl-16 pr-6 py-4.5 bg-slate-50 border-transparent rounded-[1.8rem] text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 outline-none transition-all font-bold italic tracking-tighter text-blue-600"
                                        placeholder="HTTPS://WWW.MATRIX.ORG"
                                    />
                                </div>
                            </div>

                            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col items-center justify-center gap-6 text-center shadow-xl shadow-slate-200 group cursor-pointer overflow-hidden relative active:scale-95 transition-all">
                                <div className="absolute top-0 left-0 w-full h-full bg-blue-600/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                                <div className="relative z-10 flex flex-col items-center gap-4">
                                    <ArrowUpRight className="w-10 h-10 text-blue-400" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] italic">Open External Portfolio</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
