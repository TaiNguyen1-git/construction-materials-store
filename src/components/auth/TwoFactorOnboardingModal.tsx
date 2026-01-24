'use client'

import { useState } from 'react'
import { ShieldCheck, X, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface TwoFactorOnboardingModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
}

export default function TwoFactorOnboardingModal({
    isOpen,
    onClose,
    onConfirm
}: TwoFactorOnboardingModalProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { user } = useAuth()

    if (!isOpen) return null

    const handleConfirm = async () => {
        setLoading(true)
        try {
            await onConfirm()
            const profilePath = (user?.role === 'MANAGER' || user?.role === 'EMPLOYEE')
                ? '/admin/profile'
                : '/account/profile'
            router.push(`${profilePath}?setup2fa=true`)
            onClose()
        } catch (error) {
            console.error('2FA Onboarding Error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg border border-white/20 overflow-hidden transform transition-all animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">

                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary-600/10 to-secondary-600/10" />
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-secondary-500/10 rounded-full blur-3xl" />

                <div className="relative p-8 md:p-10">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        {/* 3D Shield Icon Container */}
                        <div className="relative mb-8 transform hover:scale-110 transition-transform duration-300">
                            <div className="absolute inset-0 bg-primary-500/20 rounded-3xl blur-2xl animate-pulse" />
                            <div className="relative bg-gradient-to-br from-primary-600 to-secondary-600 p-6 rounded-3xl shadow-xl">
                                <ShieldCheck className="h-14 w-14 text-white" strokeWidth={1.5} />
                            </div>
                        </div>

                        <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                            Tăng cường bảo mật<br />cho tài khoản của bạn?
                        </h3>

                        <p className="text-gray-600 text-lg leading-relaxed mb-10 max-w-sm">
                            Kích hoạt xác thực 2 yếu tố (2FA) để bảo vệ tài khoản của bạn khỏi truy cập trái phép. Quy trình đơn giản, giúp tăng cường an ninh dữ liệu và đảm bảo sự an tâm.
                        </p>

                        <div className="flex flex-col w-full gap-4">
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="group relative w-full flex justify-center items-center gap-3 py-5 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white text-lg font-bold rounded-2xl shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)] hover:shadow-[0_15px_25px_-5px_rgba(79,70,229,0.5)] transition-all transform hover:scale-[1.02] active:scale-100 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <span>Thiết lập ngay</span>
                                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="w-full py-4 text-gray-500 font-semibold hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
                            >
                                Để sau
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="bg-gray-50/50 p-4 border-t border-gray-100/50 flex justify-center items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Gợi ý bảo mật từ SmartBuild</p>
                </div>
            </div>
        </div>
    )
}
