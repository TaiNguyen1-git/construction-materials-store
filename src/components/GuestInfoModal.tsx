'use client'

import { useState } from 'react'
import { User, Phone, Mail, MessageSquare } from 'lucide-react'
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
        if (name && phone) {
            onSubmit({ name, phone, email, message })
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-300">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                    <h2 className="text-3xl font-black mb-2 tracking-tight">Trò chuyện ngay</h2>
                    <p className="text-blue-100 text-sm font-medium">Vui lòng để lại thông tin để SmartBuild hỗ trợ bạn tốt nhất</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid gap-5">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Họ và tên *</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Số điện thoại *</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                        placeholder="0912345678"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Email (Tùy chọn)</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Bạn cần giúp gì? *</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                                <textarea
                                    required
                                    rows={3}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none"
                                    placeholder="Tôi muốn hỏi về..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-colors font-black text-xs uppercase tracking-widest"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95"
                        >
                            Gửi yêu cầu & Chat
                        </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-500 font-medium">
                            Bạn đã có tài khoản?{' '}
                            <Link href="/login" className="text-blue-600 font-black hover:underline underline-offset-4">Đăng nhập ngay</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}
