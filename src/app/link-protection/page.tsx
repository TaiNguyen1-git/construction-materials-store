'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ShieldAlert, ArrowRight, ShieldCheck, ExternalLink, Shield } from 'lucide-react'

function LinkProtectionContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [targetUrl, setTargetUrl] = useState('')
    const [hostname, setHostname] = useState('')

    useEffect(() => {
        const url = searchParams.get('url')
        if (url) {
            setTargetUrl(url)
            try {
                const parsed = new URL(url)
                setHostname(parsed.hostname)
            } catch (e) {
                setHostname('Liên kết không xác định')
            }
        } else {
            router.push('/')
        }
    }, [searchParams, router])

    const handleProceed = () => {
        window.location.href = targetUrl
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden relative">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-bl-[10rem] -z-10" />
                
                <div className="p-12 md:p-16 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-10 shadow-inner animate-in zoom-in-50 duration-500">
                        <ShieldAlert size={48} />
                    </div>

                    <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                        Cảnh báo bảo mật
                    </h1>
                    
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed max-w-md">
                        Bạn đang rời khỏi hệ thống SmartBuild để truy cập vào một trang web bên ngoài. Hãy đảm bảo bạn tin tưởng liên kết này để bảo vệ thông tin cá nhân.
                    </p>

                    <div className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 mb-10 flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 shrink-0 shadow-sm group-hover:text-blue-500 transition-colors">
                            <ExternalLink size={20} />
                        </div>
                        <div className="text-left overflow-hidden">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trang web đích</p>
                            <p className="text-sm font-bold text-slate-700 truncate">{hostname}</p>
                            <p className="text-[10px] text-slate-400 truncate opacity-60 mt-0.5">{targetUrl}</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <button 
                            onClick={() => window.close()}
                            className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95 text-sm"
                        >
                            Quay lại an toàn
                        </button>
                        <button 
                            onClick={handleProceed}
                            className="flex-[1.5] py-5 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 hover:shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                        >
                            Tiếp tục truy cập <ArrowRight size={18} />
                        </button>
                    </div>

                    <div className="mt-10 flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                        <ShieldCheck size={14} className="text-emerald-500" /> Được bảo vệ bởi SmartScan
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LinkProtectionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        }>
            <LinkProtectionContent />
        </Suspense>
    )
}

function Loader2({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
