'use client'

import { useState, useEffect } from 'react'
import { FileText, Upload, Download, Eye, ShieldCheck, AlertCircle, Trash2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupplierDocuments() {
    const [documents, setDocuments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
        fetchDocs()
    }, [])

    const fetchDocs = async () => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch(`/api/supplier/documents?supplierId=${supplierId}`)
            const data = await res.json()
            if (data.success) setDocuments(data.data)
        } catch (error) {
            console.error('Fetch docs failed')
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (file: File, name: string) => {
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            const uploadData = await uploadRes.json()

            if (uploadData.success) {
                const supplierId = localStorage.getItem('supplier_id')
                const res = await fetch('/api/supplier/documents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        supplierId,
                        name,
                        type: file.type.includes('pdf') ? 'PDF' : 'IMAGE',
                        fileUrl: uploadData.fileUrl
                    })
                })
                if (res.ok) {
                    toast.success('Đã tải lên chứng từ')
                    fetchDocs()
                }
            }
        } catch (error) {
            toast.error('Lỗi khi tải lên')
        } finally {
            setIsUploading(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Đang tải...</div>

    const docTypes = [
        { key: 'GPKD', label: 'Giấy phép kinh doanh', desc: 'Bản quét màu chính thức' },
        { key: 'TAX', label: 'Chứng nhận đăng ký thuế', desc: 'Mã số thuế doanh nghiệp' },
        { key: 'CONTRACT', label: 'Hợp đồng nguyên tắc', desc: 'Ký kèm đóng dấu SmartBuild' },
        { key: 'COCQ', label: 'Chứng chỉ chất lượng (CO/CQ)', desc: 'Dành cho vật liệu chuyên dụng' }
    ]

    return (
        <div className="space-y-10 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trung tâm pháp lý</h1>
                    <p className="text-slate-500 font-medium mt-1">Quản lý các tài liệu pháp lý, hợp đồng và chứng chỉ chất lượng.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2 shadow-sm">
                        <ShieldCheck className="w-4 h-4" />
                        Đã xác minh 100%
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Manual Upload Section - Taking 6/12 columns */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                            <Upload className="w-5 h-5 text-blue-600" />
                            Hồ sơ bắt buộc
                        </h2>
                    </div>
                    <div className="grid gap-5">
                        {docTypes.map((dt) => {
                            const existing = documents.find(d => d.name === dt.label)
                            return (
                                <div key={dt.key} className="group relative bg-white p-7 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform" />

                                    <div className="relative flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${existing
                                                ? 'bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-50'
                                                : 'bg-slate-100 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500'
                                                }`}>
                                                <FileText className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 leading-none text-lg">{dt.label}</p>
                                                <p className="text-xs text-slate-400 font-medium mt-2">{dt.desc}</p>
                                            </div>
                                        </div>

                                        {existing ? (
                                            <div className="flex items-center gap-3">
                                                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-emerald-100">
                                                    {existing.status}
                                                </div>
                                                <a href={existing.fileUrl} target="_blank" className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all">
                                                    <Eye className="w-5 h-5" />
                                                </a>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95">
                                                {isUploading ? 'Đang tải...' : 'Tải lên ngay'}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) handleUpload(file, dt.label)
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* History/Recent Uploads - Taking 5/12 columns */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                            <Clock className="w-5 h-5 text-indigo-600" />
                            Lịch sử tài liệu
                        </h2>
                    </div>
                    <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm divide-y divide-slate-50 overflow-hidden">
                        {documents.length > 0 ? (
                            documents.map((doc) => (
                                <div key={doc.id} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-600 transition-colors shadow-sm">
                                            <span className="text-[10px] font-black leading-none">{doc.type}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{doc.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1">
                                                KHỞI TẠO: {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"
                                        title="Tải về"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                            ))
                        ) : (
                            <div className="p-20 text-center text-slate-300">
                                <ShieldCheck className="w-16 h-16 mx-auto mb-6 opacity-10" />
                                <p className="text-sm font-black uppercase tracking-[0.2em]">Cơ sở dữ liệu trống</p>
                            </div>
                        )}
                    </div>

                    {/* Security Info Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <h3 className="text-lg font-black mb-3 text-blue-400">Bảo mật dữ liệu</h3>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                Tất cả tài liệu được mã hóa 256-bit và lưu trữ trên hệ thống đám mây tiêu chuẩn Tier 3. Chỉ quản trị viên cấp cao mới có quyền phê duyệt hồ sơ.
                            </p>
                            <div className="flex gap-4 mt-6">
                                <div className="h-1 bg-blue-600 flex-1 rounded-full" />
                                <div className="h-1 bg-blue-600/30 flex-1 rounded-full" />
                                <div className="h-1 bg-blue-600/30 flex-1 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
