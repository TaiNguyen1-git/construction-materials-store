
'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-slate-100 relative overflow-hidden">
                {/* Background Noise */}
                <div className="absolute inset-0 bg-grid-slate-50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none"></div>

                <div className="relative z-10 space-y-6">
                    <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center animate-pulse">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            Đã Xảy Ra Lỗi Hệ Thống!
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">
                            Đừng lo lắng, chúng tôi đã ghi nhận sự cố này. Giống như mọi công trình, đôi khi có những sự cố kỹ thuật nhỏ.
                        </p>
                        {error.digest && (
                            <div className="bg-slate-100 p-2 rounded-lg text-[10px] font-mono text-slate-400 mt-2 break-all">
                                Mã lỗi: {error.digest}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={
                                // Attempt to recover by trying to re-render the segment
                                () => reset()
                            }
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} />
                            Thử Lại Ngay
                        </button>

                        <Link
                            href="/"
                            className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center gap-2"
                        >
                            <Home size={18} />
                            Trở Về Trang Chủ
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
