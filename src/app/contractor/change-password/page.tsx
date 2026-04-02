'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ShieldCheck, Lock, ShieldAlert, Cpu, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'

export default function ChangePasswordPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    })

    const validatePassword = (password: string) => {
        const checks = {
            length: password.length >= 6,
            hasNumber: /\d/.test(password),
            hasLetter: /[a-zA-Z]/.test(password)
        }
        return checks
    }

    const passwordChecks = validatePassword(form.newPassword)
    const isPasswordValid = passwordChecks.length && passwordChecks.hasNumber && passwordChecks.hasLetter
    const passwordsMatch = form.newPassword === form.confirmPassword && form.confirmPassword.length > 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.currentPassword) {
            toast.error('Current verification token required')
            return
        }

        if (!isPasswordValid) {
            toast.error('New protocol criteria not satisfied')
            return
        }

        if (!passwordsMatch) {
            toast.error('Token synchronization failure: Confirm mismatch')
            return
        }

        setLoading(true)
        try {
            const res = await fetchWithAuth('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: form.currentPassword,
                    newPassword: form.newPassword
                })
            })

            const data = await res.json()

            if (res.ok && data.success) {
                toast.success('Security protocol updated successfully!')
                setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
            } else {
                toast.error(data.error || data.message || 'Escalation failed')
            }
        } catch (error) {
            toast.error('Network integrity failure')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto">
            {/* High-Security Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
                        <Lock className="w-10 h-10 text-blue-600" />
                        Security Rotation
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Cập nhật mật khẩu & Bảo mật tài khoản Nhà Thầu</p>
                </div>

                <div className="hidden md:flex items-center gap-3 text-emerald-500 font-black text-[9px] uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 italic">
                    <ShieldCheck size={14} /> Identity Verified: {user?.name || 'Authorized'}
                </div>
            </div>

            {/* Main Security Console */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-12">
                    <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-1000"></div>
                        
                        <div className="p-12 lg:p-16">
                            <div className="flex items-center gap-6 mb-12 pb-10 border-b border-slate-50">
                                <div className="w-20 h-20 bg-slate-950 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-slate-200">
                                    <KeyRound size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900">Credential Matrix Update</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol: Layer-2 Cryptographic Update</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-10 max-w-2xl">
                                {/* Current Password */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Current Verification Token</label>
                                    <div className="relative group">
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={form.currentPassword}
                                            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                                            className="w-full px-10 py-6 bg-slate-50 border-none rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none text-base font-bold italic transition-all placeholder:text-slate-200"
                                            placeholder="Enter active secret..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white border border-slate-100 rounded-xl text-slate-300 hover:text-blue-600 transition-all shadow-sm"
                                        >
                                            {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password Matrix */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">New Secret Identifier</label>
                                    <div className="relative group">
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={form.newPassword}
                                            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                                            className="w-full px-10 py-6 bg-slate-50 border-none rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none text-base font-bold italic transition-all placeholder:text-slate-200"
                                            placeholder="Forge new secret..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white border border-slate-100 rounded-xl text-slate-300 hover:text-blue-600 transition-all shadow-sm"
                                        >
                                            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    {/* Real-time Requirement Telemetry */}
                                    {form.newPassword && (
                                        <div className="grid grid-cols-3 gap-4 mt-6 px-4">
                                            <div className={`p-4 rounded-2xl flex items-center gap-3 transition-all ${passwordChecks.length ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-slate-50 border border-transparent text-slate-300 opacity-40'}`}>
                                                {passwordChecks.length ? <CheckCircle size={14} className="animate-in zoom-in duration-300" /> : <AlertCircle size={14} />}
                                                <span className="text-[9px] font-black uppercase tracking-widest">Length 6+</span>
                                            </div>
                                            <div className={`p-4 rounded-2xl flex items-center gap-3 transition-all ${passwordChecks.hasLetter ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-slate-50 border border-transparent text-slate-300 opacity-40'}`}>
                                                {passwordChecks.hasLetter ? <CheckCircle size={14} className="animate-in zoom-in duration-300" /> : <AlertCircle size={14} />}
                                                <span className="text-[9px] font-black uppercase tracking-widest">Alpha Node</span>
                                            </div>
                                            <div className={`p-4 rounded-2xl flex items-center gap-3 transition-all ${passwordChecks.hasNumber ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-slate-50 border border-transparent text-slate-300 opacity-40'}`}>
                                                {passwordChecks.hasNumber ? <CheckCircle size={14} className="animate-in zoom-in duration-300" /> : <AlertCircle size={14} />}
                                                <span className="text-[9px] font-black uppercase tracking-widest">Numeric Node</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Sync */}
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Synchronize Identity Token</label>
                                    <div className="relative group">
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={form.confirmPassword}
                                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                            className={`w-full px-10 py-6 bg-slate-50 border-[3px] rounded-[2rem] outline-none text-base font-bold italic transition-all placeholder:text-slate-200 ${form.confirmPassword && !passwordsMatch
                                                ? 'border-rose-100 focus:bg-rose-50/20'
                                                : form.confirmPassword && passwordsMatch
                                                    ? 'border-emerald-100 focus:bg-emerald-50/20'
                                                    : 'border-transparent'
                                            }`}
                                            placeholder="Sync new secret..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white border border-slate-100 rounded-xl text-slate-300 hover:text-blue-600 transition-all shadow-sm"
                                        >
                                            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {form.confirmPassword && !passwordsMatch && (
                                        <p className="flex items-center gap-3 text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] ml-4 italic px-4 py-2 bg-rose-50 w-fit rounded-lg animate-in fade-in slide-in-from-left-2 transition-all">
                                            <ShieldAlert size={14} /> Synchronous Failure: Match mismatch
                                        </p>
                                    )}
                                    {passwordsMatch && (
                                        <p className="flex items-center gap-3 text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] ml-4 italic px-4 py-2 bg-emerald-50 w-fit rounded-lg animate-in fade-in slide-in-from-left-2 transition-all">
                                            <Sparkles size={14} /> Synchronous Success: Verified
                                        </p>
                                    )}
                                </div>

                                {/* Execute Rotation */}
                                <div className="pt-8">
                                    <button
                                        type="submit"
                                        disabled={loading || !isPasswordValid || !passwordsMatch || !form.currentPassword}
                                        className="w-full py-8 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-4 shadow-2xl shadow-slate-300 active:scale-95 disabled:opacity-5 disabled:cursor-not-allowed group/btn overflow-hidden"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={24} className="animate-spin" /> Transmitting Update Protocols...
                                            </>
                                        ) : (
                                            <>
                                                <Cpu size={24} className="group-hover:animate-spin transition-all" /> Execute Security Rotation
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tactical Security Matrix Advisory */}
            <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center flex-shrink-0 border border-white/5">
                        <ShieldCheck size={40} className="text-emerald-500" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase whitespace-nowrap">Institutional Security Advisory</h3>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol Isolation</p>
                                <p className="text-xs font-bold text-slate-400 italic leading-relaxed">Ensure secrecy across discrete account nodes to prevent cross-lateral risks.</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rotation Frequency</p>
                                <p className="text-xs font-bold text-slate-400 italic leading-relaxed">Optimal rotation occurs every 90 operational cycles to mitigate brute-force vectoring.</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Identity Custody</p>
                                <p className="text-xs font-bold text-slate-400 italic leading-relaxed">Principal access is non-transferable. Institutional support will never request token cleartext.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
