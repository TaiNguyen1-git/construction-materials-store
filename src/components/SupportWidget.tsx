'use client'

import { useState, useEffect, useRef } from 'react'
import { Headset, X, Send, User, Phone, Globe, Monitor, ShieldCheck, Mail, Paperclip, Image as ImageIcon, File as FileIcon, Trash2, AlertTriangle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt']
const FORBIDDEN_EXTENSIONS = ['exe', 'msi', 'bat', 'sh', 'js', 'vbs']

interface Attachment {
    fileUrl: string
    fileName: string
    fileType: string
    fileSize: number
}

export default function SupportWidget() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [step, setStep] = useState(1) // 1: Info, 2: Message, 3: Success
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const pathname = usePathname()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        message: ''
    })

    const [attachments, setAttachments] = useState<Attachment[]>([])

    // Autofill & Auto-step if logged in
    useEffect(() => {
        if (user) {
            setForm(prev => ({
                ...prev,
                name: user.name || prev.name,
                email: user.email || prev.email,
                phone: user.phone || prev.phone
            }))

            // If we have enough info, skip to step 2 when opening
            if (user.name && user.phone) {
                setStep(2)
            }
        } else {
            // Fallback to localStorage for guests
            const savedName = localStorage.getItem('user_name') || ''
            const savedPhone = localStorage.getItem('user_phone') || ''
            const savedEmail = localStorage.getItem('user_email') || ''
            setForm(prev => ({ ...prev, name: savedName, phone: savedPhone, email: savedEmail }))

            // Should stay at step 1 for guests to confirm info
        }
    }, [user, isOpen]) // Re-run when user loads or widget opens

    const getSystemInfo = () => {
        if (typeof window === 'undefined') return {}

        const ua = navigator.userAgent
        let osName = 'Unknown'
        let browserName = 'Unknown'
        let browserVersion = 'Unknown'

        // Simple OS detection
        if (ua.indexOf('Win') !== -1) osName = 'Windows'
        else if (ua.indexOf('Mac') !== -1) osName = 'MacOS'
        else if (ua.indexOf('X11') !== -1) osName = 'UNIX'
        else if (ua.indexOf('Linux') !== -1) osName = 'Linux'
        else if (ua.indexOf('Android') !== -1) osName = 'Android'
        else if (ua.indexOf('iPhone') !== -1) osName = 'iOS'

        // Simple Browser detection
        if (ua.indexOf('Chrome') !== -1) {
            browserName = 'Chrome'
            const match = ua.match(/Chrome\/([0-9.]+)/)
            if (match) browserVersion = match[1]
        } else if (ua.indexOf('Firefox') !== -1) {
            browserName = 'Firefox'
            const match = ua.match(/Firefox\/([0-9.]+)/)
            if (match) browserVersion = match[1]
        } else if (ua.indexOf('Safari') !== -1) {
            browserName = 'Safari'
        } else if (ua.indexOf('Edge') !== -1) {
            browserName = 'Edge'
        }

        // OS version (simplified)
        let osVersion = 'Unknown'
        if (osName === 'Windows') {
            if (ua.indexOf('Windows NT 10.0') !== -1) osVersion = '10/11'
            else if (ua.indexOf('Windows NT 6.3') !== -1) osVersion = '8.1'
            else if (ua.indexOf('Windows NT 6.2') !== -1) osVersion = '8'
            else if (ua.indexOf('Windows NT 6.1') !== -1) osVersion = '7'
        }

        return {
            osName,
            osVersion,
            browserName,
            browserVersion,
            screenRes: `${window.screen.width}x${window.screen.height}`,
            deviceType: /Mobi|Android/i.test(ua) ? 'mobile' : 'desktop'
        }
    }

    const validateFile = (file: File) => {
        const extension = file.name.split('.').pop()?.toLowerCase() || ''

        if (FORBIDDEN_EXTENSIONS.includes(extension)) {
            toast.error(`File .${extension} không được phép vì lý do bảo mật`)
            return false
        }

        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            toast.error(`Định dạng .${extension} không hỗ trợ`)
            return false
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error('File không được vượt quá 5MB')
            return false
        }

        return true
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        const file = files[0]
        if (!validateFile(file)) {
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/upload/secure', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()

            if (data.fileId) {
                const newAttachment: Attachment = {
                    fileUrl: `/api/files/${data.fileId}`,
                    fileName: file.name,
                    fileType: file.type.startsWith('image/') ? 'image' : 'document',
                    fileSize: file.size
                }
                setAttachments([...attachments, newAttachment])
                toast.success('Đã đính kèm file')
            } else {
                toast.error('Tải file thất bại')
            }
        } catch (error) {
            toast.error('Lỗi khi tải file')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name || !form.phone || !form.message) {
            toast.error('Vui lòng điền đầy đủ các trường bắt buộc')
            return
        }

        setLoading(true)

        try {
            const systemInfo = getSystemInfo()
            const res = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    attachments,
                    systemInfo,
                    pageUrl: window.location.href,
                    userId: localStorage.getItem('user_id')
                })
            })

            const data = await res.json()
            if (data.success) {
                setStep(3)
                // Save info for next time
                localStorage.setItem('user_name', form.name)
                localStorage.setItem('user_phone', form.phone)
                if (form.email) localStorage.setItem('user_email', form.email)
            } else {
                toast.error(data.error?.message || 'Có lỗi xảy ra')
            }
        } catch (error) {
            toast.error('Lỗi kết nối server')
        } finally {
            setLoading(false)
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    // Hide on admin routes
    if (pathname?.startsWith('/admin')) return null

    return (
        <div className="fixed bottom-24 right-6 z-[60]">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex items-center justify-center bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white w-14 h-14 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 border border-indigo-100"
                    title="Hỗ trợ khách hàng"
                >
                    <div className="bg-indigo-100 group-hover:bg-indigo-500 p-2.5 rounded-full transition-colors shadow-inner text-indigo-600 group-hover:text-white">
                        <Headset className="w-6 h-6" />
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap uppercase tracking-widest shadow-xl">
                        Trợ giúp & Hỗ trợ
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-[6px] border-y-transparent border-r-[6px] border-r-gray-900"></div>
                    </div>

                    {/* Notification Dot */}
                    <div className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 border-2 border-white"></span>
                    </div>
                </button>
            ) : (
                <div className="w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-5 text-white flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transform rotate-45 pointer-events-none"></div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                <Headset className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base leading-tight">Trung tâm Hỗ trợ</h3>
                                <p className="text-[11px] opacity-80 font-medium">Chúng tôi sẽ liên hệ trong 5-10 phút</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 p-2 rounded-full transition-colors backdrop-blur-sm"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="text-center mb-6">
                                    <p className="text-sm text-gray-600 font-medium">Chào mừng bạn đến với SmartBuild!</p>
                                    <p className="text-[11px] text-gray-400">Vui lòng để lại thông tin để bắt đầu yêu cầu hỗ trợ.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">Tên của bạn *</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                required
                                                type="text"
                                                value={form.name}
                                                onChange={e => setForm({ ...form, name: e.target.value })}
                                                placeholder="VD: Nguyễn Văn A"
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">Số điện thoại *</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                required
                                                type="tel"
                                                value={form.phone}
                                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                                placeholder="VD: 0912345678"
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">Email liên hệ</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={e => setForm({ ...form, email: e.target.value })}
                                                placeholder="example@gmail.com"
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (form.name && form.phone) setStep(2)
                                        else toast.error('Vui lòng nhập tên và số điện thoại')
                                    }}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 active:scale-95 mt-4"
                                >
                                    Tiếp tục
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">Nội dung yêu cầu *</label>
                                    <div className="relative bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                                        <textarea
                                            required
                                            rows={4}
                                            value={form.message}
                                            onChange={e => setForm({ ...form, message: e.target.value })}
                                            placeholder="Mô tả chi tiết vấn đề..."
                                            className="w-full px-4 py-3 bg-transparent text-sm outline-none resize-none"
                                        />

                                        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-white/50 rounded-b-xl">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploading}
                                                    className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Đính kèm ảnh hoặc file"
                                                >
                                                    {uploading ? (
                                                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full" />
                                                    ) : (
                                                        <Paperclip className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                                />
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-medium">Giới hạn file 5MB</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments List */}
                                {attachments.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {attachments.map((file, index) => (
                                            <div key={index} className="relative group bg-gray-50 p-2 rounded-lg border border-gray-200 flex items-center gap-2">
                                                {file.fileType === 'image' ? (
                                                    <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                                                        <img src={file.fileUrl} alt={file.fileName} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                                        <FileIcon className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-gray-900 truncate">{file.fileName}</p>
                                                    <p className="text-[9px] text-gray-400">{formatFileSize(file.fileSize)}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
                                                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Security Warning (Subtle) */}
                                {/* Security Warning (Detailed) */}
                                <div className="flex gap-2 px-2 py-2 text-[10px] text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className='space-y-1 leading-tight'>
                                        <p><span className="font-bold text-gray-700">Chấp nhận:</span> JPG, PNG, PDF, Word, Excel, TXT (Max 5MB)</p>
                                        <p><span className="font-bold text-red-500">Từ chối:</span> EXE, BAT, MSI, JS và file thực thi.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                                    >
                                        Quay lại
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || uploading}
                                        className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                        ) : (
                                            <>
                                                Gửi Hỗ Trợ
                                                <Send className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 3 && (
                            <div className="text-center py-8 space-y-5 animate-in zoom-in-95 duration-500">
                                <div className="relative inline-block">
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50 shadow-inner">
                                        <ShieldCheck className="w-10 h-10" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md">
                                        <div className="bg-green-500 w-4 h-4 rounded-full"></div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-extrabold text-xl text-gray-900 leading-tight">Yêu cầu đã gửi!</h4>
                                    <p className="text-xs text-gray-500 mt-2 px-4 leading-relaxed font-medium">
                                        Cảm ơn <span className="text-indigo-600 font-bold">{form.name.split(' ').pop()}</span>, yêu cầu của bạn đã được ưu tiên xử lý. Đội ngũ kỹ thuật sẽ gọi lại cho bạn qua số {form.phone} ngay khi có thể.
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsOpen(false)
                                        setStep(1)
                                        setForm({ ...form, message: '' })
                                        setAttachments([])
                                    }}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
                                >
                                    Đã hiểu
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 p-2.5 text-center border-t border-gray-100">
                        <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">
                            SmartBuild Pro-Support System
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
