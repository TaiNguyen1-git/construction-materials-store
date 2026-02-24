'use client'

import React from 'react'
import { MessageSquare, CheckCircle, User as UserIcon, Phone, Mail, Send, Loader2 } from 'lucide-react'

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
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl shadow-indigo-200/20">
            {/* Abstract Background Elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -ml-40 -mb-40"></div>

            <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-3 bg-white/10 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 border border-white/5 backdrop-blur-md">
                        <MessageSquare className="w-4 h-4" /> KẾT NỐI CHUYÊN GIA
                    </div>
                    <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.1]">
                        Bạn cần <span className="text-indigo-400">tư vấn thực tế</span> <br />
                        cho dự án này?
                    </h3>
                    <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-lg">
                        Kết quả AI là cơ sở tuyệt vời để bắt đầu. Nếu bạn muốn lưu lại dự toán này hoặc cần đội ngũ kỹ sư của SmartBuild kiểm tra lại khối lượng thực tế, hãy để lại thông tin bên dưới.
                    </p>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 text-slate-300">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                            <span className="text-sm font-medium">Hỗ trợ lưu trữ dự toán vĩnh viễn trên hệ thống.</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-300">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                            <span className="text-sm font-medium">Kết nối trực tiếp tới Zalo kỹ sư chuyên môn.</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Họ và tên của bạn"
                                value={leadName}
                                onChange={(e) => setLeadName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                            />
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="tel"
                                placeholder="Số điện thoại (Nhận tin qua Zalo)"
                                value={leadPhone}
                                onChange={(e) => setLeadPhone(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                            />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="email"
                                placeholder="Email (Để nhận bản báo giá PDF)"
                                value={leadEmail}
                                onChange={(e) => setLeadEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <button
                        onClick={onSubmit}
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl py-5 font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> ĐANG XỬ LÝ...
                            </>
                        ) : (
                            <>
                                GỬI YÊU CẦU & KẾT NỐI ZALO <Send className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                        Chúng tôi tôn trọng quyền riêng tư của bạn. <br /> Thông tin chỉ được dùng để hỗ trợ kỹ thuật cho dự toán này.
                    </p>
                </div>
            </div>
        </div>
    )
}
