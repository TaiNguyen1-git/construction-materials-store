'use client'

import { useState } from 'react'
import { Shield, ShieldCheck, ShieldAlert, Loader2, Smartphone, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface TwoFactorAuthSetupProps {
    is2FAEnabled: boolean
    onStatusChange?: () => void
}

export default function TwoFactorAuthSetup({ is2FAEnabled, onStatusChange }: TwoFactorAuthSetupProps) {
    const [loading, setLoading] = useState(false)
    const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null)
    const [verificationCode, setVerificationCode] = useState('')
    const [step, setStep] = useState<'IDLE' | 'SETUP' | 'VERIFY'>('IDLE')

    const startSetup = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/supplier/auth/2fa/setup')
            const data = await res.json()
            if (data.success) {
                setSetupData(data.data)
                setStep('SETUP')
            } else {
                toast.error('Không thể khởi tạo 2FA')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    const verifyAndEnable = async () => {
        if (!setupData || verificationCode.length < 6) return
        setLoading(true)
        try {
            const res = await fetch('/api/supplier/auth/2fa/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret: setupData.secret,
                    code: verificationCode
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Đã kích hoạt bảo mật 2 lớp thành công!')
                setStep('IDLE')
                setSetupData(null)
                setVerificationCode('')
                if (onStatusChange) onStatusChange()
            } else {
                toast.error(data.error?.message || 'Mã xác thực không chính xác')
            }
        } catch (error) {
            toast.error('Lỗi xác thực')
        } finally {
            setLoading(false)
        }
    }

    if (is2FAEnabled && step === 'IDLE') {
        return (
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tight italic">Tài khoản đã được bảo vệ</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Xác thực 2 lớp qua ứng dụng đang hoạt động. Tài khoản của bạn rất an toàn.</p>
                </div>
                <div className="px-5 py-2 bg-emerald-600/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                    Đã kích hoạt
                </div>
            </div>
        )
    }

    if (step === 'SETUP' && setupData) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black">1</div>
                    <h3 className="text-lg font-bold">Quét mã QR</h3>
                </div>
                <p className="text-slate-500 text-sm font-medium">Mở ứng dụng Authenticator (Google/Microsoft) và quét mã bên dưới:</p>
                <div className="flex flex-col items-center">
                    <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 mb-4">
                        <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Hoặc nhập mã thủ công:</p>
                        <code className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-indigo-600 text-lg">
                            {setupData.secret}
                        </code>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
                    <button onClick={() => setStep('IDLE')} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600">Hủy bỏ</button>
                    <button
                        onClick={() => setStep('VERIFY')}
                        className="px-8 py-3 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        Tiếp theo
                    </button>
                </div>
            </div>
        )
    }

    if (step === 'VERIFY') {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black">2</div>
                    <h3 className="text-lg font-bold">Xác nhận mã</h3>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">
                        Nhập mã 6 số từ ứng dụng
                    </label>
                    <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full py-5 bg-white border border-slate-200 rounded-2xl text-center text-3xl font-black tracking-[0.5em] focus:ring-4 focus:ring-indigo-500/10 outline-none border-indigo-500/50"
                        placeholder="000000"
                    />
                </div>
                <div className="flex justify-between items-center gap-3 pt-4 border-t border-slate-200/60">
                    <button onClick={() => setStep('SETUP')} className="text-xs font-bold text-slate-400 hover:text-slate-600">Quay lại mã QR</button>
                    <button
                        onClick={verifyAndEnable}
                        disabled={loading || verificationCode.length < 6}
                        className="px-10 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Kích hoạt ngay'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center shrink-0">
                <Shield className="w-8 h-8 text-slate-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">Xác thực 2 lớp (2FA)</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Sử dụng ứng dụng Authenticator để bảo vệ tài khoản khỏi các truy cập trái phép.</p>
            </div>
            <button
                onClick={startSetup}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:brightness-110 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kích hoạt'}
            </button>
        </div>
    )
}
