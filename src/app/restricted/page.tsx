'use client'

import { useSearchParams } from 'next/navigation'
import { ShieldAlert, Mail, ArrowLeft, MessageSquare, Clock, Info } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

function RestrictedContent() {
    const searchParams = useSearchParams()
    const reason = searchParams.get('reason') || 'Vi phạm chính sách cộng đồng và điều khoản sử dụng của hệ thống SmartBuild.'
    const type = searchParams.get('type') || 'IP_BAN'
    const endDate = searchParams.get('until')

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/20 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full animate-pulse"></div>

            <div className="max-w-2xl w-full relative z-10">
                {/* Main Card */}
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-black/50">
                    <div className="flex flex-col items-center text-center">
                        {/* Icon */}
                        <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-700 rounded-3xl flex items-center justify-center shadow-lg shadow-red-500/20 mb-8">
                            <ShieldAlert className="w-12 h-12 text-white" />
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                            Truy cập bị Hạn chế
                        </h1>
                        
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-md">
                            Hệ thống an ninh SmartBuild đã phát hiện các hoạt động không thường xuyên từ địa chỉ của bạn.
                        </p>

                        {/* Details Box */}
                        <div className="w-full bg-black/30 border border-white/5 rounded-3xl p-6 mb-8 text-left space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-white/5 rounded-lg">
                                    <Info className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Lý do cụ thể</p>
                                    <p className="text-gray-200 font-medium leading-snug">{reason}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white/5 rounded-lg">
                                        <Clock className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Thời hạn</p>
                                        <p className="text-gray-200 font-bold uppercase tracking-tight">
                                            {endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'VĨNH VIỄN'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white/5 rounded-lg">
                                        <ShieldAlert className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Loại hình</p>
                                        <p className="text-gray-200 font-bold uppercase tracking-tight">{type.replace('_', ' ')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            <a 
                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=thanhtai16012004@gmail.com&su=Kháng cáo hạn chế truy cập - ${type}&body=Tôi muốn kháng cáo về việc hạn chế truy cập của địa chỉ IP/Tài khoản của tôi.%0D%0ALý do bị hạn chế: ${reason}%0D%0ALoại hình: ${type}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#0f172a] font-black rounded-2xl hover:bg-gray-200 transition-all shadow-xl shadow-white/5 active:scale-95"
                            >
                                <MessageSquare className="w-5 h-5" /> GỬI KHÁNG CÁO
                            </a>
                            <Link 
                                href="/"
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-white/5 text-white font-black rounded-2xl border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                            >
                                <ArrowLeft className="w-5 h-5" /> VỀ TRANG CHỦ
                            </Link>
                        </div>

                        {/* Support Footer */}
                        <div className="mt-12 pt-8 border-t border-white/5 w-full flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                                <Mail className="w-4 h-4" />
                                Hỗ trợ: support@smartbuild.ai
                            </div>
                            <div className="text-gray-600 text-xs font-bold uppercase tracking-widest">
                                SmartBuild Security Layer v2.0
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer */}
                <p className="text-center text-gray-600 text-[10px] font-bold mt-8 uppercase tracking-[0.2em]">
                    Copyright © 2026 SmartBuild AI Ecosystem. All Rights Reserved.
                </p>
            </div>
        </div>
    )
}

export default function RestrictedPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <RestrictedContent />
        </Suspense>
    )
}
