'use client'

import React from 'react'
import { MessageSquare, CheckCircle, User as UserIcon, Phone, Mail, Send, Loader2, Sparkles } from 'lucide-react'

interface LeadCaptureSectionProps {
    leadName: string
    setLeadName: (val: string) => void
    leadPhone: string
    setLeadPhone: (val: string) => void
    leadEmail: string
    setLeadEmail: (val: string) => void
    onSubmit: () => void
    submitting: boolean
}

export default function LeadCaptureSection({
    leadName, setLeadName,
    leadPhone, setLeadPhone,
    leadEmail, setLeadEmail,
    onSubmit, submitting
}: LeadCaptureSectionProps) {
    return (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] -mr-40 -mt-40 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] -ml-40 -mb-40 pointer-events-none" />

            {/* Subtle dot grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }}
            />

            <div className="relative z-10 grid lg:grid-cols-2 gap-14 items-center">
                {/* Left: Copy */}
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 border border-white/10 backdrop-blur-sm">
                        <MessageSquare className="w-4 h-4" /> Kết nối chuyên gia
                    </div>
                    <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.1]">
                        Bạn cần <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">tư vấn thực tế</span><br />
                        cho dự án này?
                    </h3>
                    <p className="text-slate-400 text-base leading-relaxed font-medium max-w-md">
                        Kết quả AI là cơ sở tuyệt vời để bắt đầu. Để nhận tư vấn chuyên sâu hoặc lưu dự toán, hãy để lại thông tin bên dưới.
                    </p>

                    <div className="flex flex-col gap-4">
                        {[
                            'Hỗ trợ lưu trữ dự toán vĩnh viễn trên hệ thống',
                            'Kết nối trực tiếp tới Zalo kỹ sư chuyên môn',
                        ].map((text, i) => (
                            <div key={i} className="flex items-center gap-4 text-slate-300">
                                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span className="text-sm font-medium">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Form */}
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-2xl space-y-5">
                    {[
                        { icon: UserIcon, placeholder: 'Họ và tên của bạn', value: leadName, onChange: setLeadName, type: 'text' },
                        { icon: Phone, placeholder: 'Số điện thoại (Nhận tin qua Zalo)', value: leadPhone, onChange: setLeadPhone, type: 'tel' },
                        { icon: Mail, placeholder: 'Email (Nhận bản báo giá PDF)', value: leadEmail, onChange: setLeadEmail, type: 'email' },
                    ].map(({ icon: Icon, placeholder, value, onChange, type }, i) => (
                        <div key={i} className="relative">
                            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type={type}
                                placeholder={placeholder}
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all font-medium text-sm"
                            />
                        </div>
                    ))}

                    <button
                        onClick={onSubmit}
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl py-4 font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                    >
                        {submitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                        ) : (
                            <>Gửi yêu cầu & Kết nối Zalo <Send className="w-4 h-4" /></>
                        )}
                    </button>

                    <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
                        Chúng tôi tôn trọng quyền riêng tư của bạn.<br />
                        Thông tin chỉ dùng để hỗ trợ kỹ thuật cho dự toán này.
                    </p>
                </div>
            </div>
        </div>
    )
}
