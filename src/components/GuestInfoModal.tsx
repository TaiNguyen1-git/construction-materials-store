'use client'

import { useState } from 'react'
import { User, Phone, Mail, MessageSquare, X, Send } from 'lucide-react'
import Link from 'next/link'

interface GuestInfoModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (info: { name: string; phone: string; email: string; message: string }) => void
}

export default function GuestInfoModal({ isOpen, onClose, onSubmit }: GuestInfoModalProps) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name && phone && message) {
            onSubmit({ name, phone, email, message })
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 max-h-[94vh] flex flex-col">
                {/* Header - Fixed at top */}
                <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-6 text-center relative shrink-0">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
                    
                    <button 
                        onClick={onClose}
                        type="button"
                        className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all outline-none"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="inline-flex p-2 bg-white/10 rounded-xl mb-3 backdrop-blur-sm">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-black text-white mb-1 tracking-tight">Kênh Trò Chuyện</h2>
                    <p className="text-blue-100 text-[11px] font-medium opacity-90">Để lại thông tin để bắt đầu chat ngay</p>
                </div>

                {/* Form Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-5">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Họ và tên *</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all outline-none"
                                            placeholder="Nguyễn Văn A"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Số điện thoại *</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="tel"
                                            required
                                            pattern="[0-9]{10,11}"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all outline-none"
                                            placeholder="0912345678"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email (Tùy chọn)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all outline-none"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Chúng tôi có thể giúp gì? *</label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                                    <textarea
                                        required
                                        rows={3}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all outline-none resize-none min-h-[100px]"
                                        placeholder="Tôi đang gặp thắc mắc về..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                            >
                                <span>Gửi & Kết nối</span>
                                <Send className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        <div className="text-center text-[10px] font-medium text-slate-400 tracking-wide">
                            Đã có tài khoản?{' '}
                            <Link href="/login" className="text-blue-600 font-black hover:underline underline-offset-4 decoration-2">
                                Đăng nhập ngay
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    )
}
