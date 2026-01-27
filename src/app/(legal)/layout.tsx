'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    ArrowLeft, FileText, Lock, Scale, Building2,
    ChevronRight, Share2, Printer, Info, HelpCircle,
    ShieldCheck, BookOpen
} from 'lucide-react'

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isActive = (path: string) => pathname === path

    return (
        <div className="min-h-screen bg-white font-sans text-neutral-900 flex flex-col md:flex-row relative">
            {/* Sidebar Navigation - Fixed on desktop */}
            <aside className="w-full md:w-[300px] bg-[#0c0f17] text-slate-400 flex-shrink-0 md:h-screen md:fixed md:left-0 md:top-0 overflow-y-auto z-30 border-r border-white/5 shadow-2xl">
                {/* Subtle decorative glow */}
                <div className="absolute top-0 right-0 w-full h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none -mt-[300px]"></div>

                <div className="p-8 flex flex-col min-h-full relative z-10">
                    {/* Logo Section */}
                    <Link href="/" className="flex items-center gap-3 mb-12 group transition-all">
                        <div className="bg-blue-600 p-2.5 rounded-xl shadow-[0_10px_20px_rgba(37,99,235,0.3)] group-hover:scale-110 transition-transform duration-300">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <span className="block font-black text-xl text-white tracking-tighter uppercase italic leading-none">SmartBuild</span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1.5 block">Legality & Documents</span>
                        </div>
                    </Link>

                    {/* Quick Back */}
                    <div className="mb-10">
                        <Link href="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-400 transition-all group">
                            <ArrowLeft className="h-3.5 w-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
                            QUAY LẠI TRANG CHỦ
                        </Link>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 space-y-10">
                        {/* Section 1: Tài liệu pháp lý */}
                        <div>
                            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 px-4">Tài liệu pháp lý</h3>
                            <ul className="space-y-1.5">
                                {[
                                    { href: '/terms', label: 'Điều khoản dịch vụ', icon: FileText },
                                    { href: '/privacy', label: 'Chính sách bảo mật', icon: Lock },
                                    { href: '/guidelines', label: 'Nguyên tắc cộng đồng', icon: Scale },
                                ].map((item) => (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center justify-between px-5 py-3 rounded-xl transition-all group border ${isActive(item.href)
                                                ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)] font-bold'
                                                : 'hover:bg-white/[0.03] hover:text-slate-200 border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className={`h-4 w-4 transition-colors ${isActive(item.href) ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-400'}`} />
                                                <span className="text-sm">{item.label}</span>
                                            </div>
                                            {isActive(item.href) && <ChevronRight className="h-4 w-4 opacity-50 animate-pulse" />}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Section 2: Hướng dẫn sử dụng */}
                        <div>
                            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 px-4">Hướng dẫn sử dụng</h3>
                            <ul className="space-y-1.5">
                                {[
                                    { href: '/help', label: 'Trung tâm trợ giúp', icon: HelpCircle },
                                    { href: '/payment-policy', label: 'Thanh toán & Hoàn phí', icon: ShieldCheck },
                                ].map((item) => (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center justify-between px-5 py-3 rounded-xl transition-all group border ${isActive(item.href)
                                                ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)] font-bold'
                                                : 'hover:bg-white/[0.03] hover:text-slate-200 border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className={`h-4 w-4 transition-colors ${isActive(item.href) ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-400'}`} />
                                                <span className="text-sm">{item.label}</span>
                                            </div>
                                            {isActive(item.href) && <ChevronRight className="h-4 w-4 opacity-50 animate-pulse" />}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Section 3: Tiêu chuẩn ngành */}
                        <div>
                            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 px-4">Tiêu chuẩn ngành</h3>
                            <ul className="space-y-1.5">
                                <li>
                                    <Link
                                        href="/standards"
                                        className={`flex items-center justify-between px-5 py-3 rounded-xl transition-all group border ${isActive('/standards')
                                            ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)] font-bold'
                                            : 'hover:bg-white/[0.03] hover:text-slate-200 border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <BookOpen className={`h-4 w-4 transition-colors ${isActive('/standards') ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-400'}`} />
                                            <span className="text-sm">Chất lượng vật tư</span>
                                        </div>
                                        {isActive('/standards') && <ChevronRight className="h-4 w-4 opacity-50 animate-pulse" />}
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Help Desk Link */}
                        <div>
                            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 px-4">Liên hệ hỗ trợ</h3>
                            <div className="px-2">
                                <a href="mailto:legal@smartbuild.vn" className="block p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 transition-all group overflow-hidden relative">
                                    <div className="absolute right-0 top-0 h-full w-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <span className="text-[9px] font-black text-slate-500 block mb-1 uppercase tracking-widest leading-none">Ban Pháp Chế</span>
                                    <span className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">legal@smartbuild.vn</span>
                                </a>
                            </div>
                        </div>
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="mt-12 pt-10 border-t border-white/5">
                        <div className="flex items-center gap-4 mb-8">
                            <button className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-blue-400 transition-all text-slate-500">
                                <Share2 className="h-4 w-4" />
                            </button>
                            <button className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-blue-400 transition-all text-slate-500">
                                <Printer className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-[9px] font-bold text-slate-700 leading-relaxed uppercase tracking-[0.2em]">
                            © 2026 SmartBuild ERP.<br />Global Privacy Standard.
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] md:ml-[300px]">
                <div className="max-w-6xl w-full mx-auto px-6 py-12 md:px-10 md:py-20 lg:px-12 shrink-0">
                    <div className="bg-white p-8 md:p-12 lg:p-20 rounded-[48px] shadow-[0_20px_60px_rgba(0,0,0,0.02)] border border-slate-100">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
