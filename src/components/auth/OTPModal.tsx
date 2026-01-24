'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, X, Loader2 } from 'lucide-react'

interface OTPModalProps {
    isOpen: boolean
    onClose: () => void
    onVerify: (otp: string) => Promise<void>
    email: string
    title?: string
    description?: string
    isLoading?: boolean
}

export default function OTPModal({
    isOpen,
    onClose,
    onVerify,
    email,
    title = 'Xác thực OTP',
    description = 'Vui lòng nhập mã xác thực đã được gửi đến email của bạn',
    isLoading = false
}: OTPModalProps) {
    const [otp, setOtp] = useState('')
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (otp.length !== 6) {
            setError('Vui lòng nhập đủ 6 chữ số')
            return
        }

        try {
            await onVerify(otp)
        } catch (err: any) {
            setError(err.message || 'Mã xác thực không chính xác')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary-100 p-2 rounded-lg">
                                <ShieldCheck className="h-6 w-6 text-primary-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="text-center mb-8">
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {description}<br />
                            <span className="font-semibold text-gray-900">{email}</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <input
                                type="text"
                                autoFocus
                                maxLength={6}
                                value={otp}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '')
                                    setOtp(val)
                                    if (error) setError('')
                                }}
                                className="block w-full text-center text-3xl tracking-[1.5rem] font-bold py-4 border-2 border-gray-200 rounded-xl focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                placeholder="000000"
                            />
                            {error && (
                                <p className="mt-2 text-sm text-red-600 text-center animate-shake">{error}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || otp.length !== 6}
                            className="w-full flex justify-center items-center gap-2 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang xác thực...
                                </>
                            ) : (
                                'Xác nhận'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-xs text-center text-gray-400 italic">
                        * Mã OTP có hiệu lực trong vòng 5-10 phút.
                    </p>
                </div>
            </div>
        </div>
    )
}
