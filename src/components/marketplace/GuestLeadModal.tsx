import { useState } from 'react'
import { X, UserPlus, LogIn, Mail, Lock, User, Facebook, Chrome, ArrowRight, Bookmark, ShieldCheck, Zap, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { useGoogleLogin } from '@react-oauth/google'
import { useFacebookSDK, loginWithFacebook } from '@/lib/facebook-sdk'

interface GuestLeadModalProps {
    isOpen: boolean
    onClose: () => void
    projectTitle?: string
    onSuccess?: (data: { name: string, phone: string, email: string }) => void
}

export default function GuestLeadModal({
    isOpen,
    onClose,
    projectTitle,
    onSuccess
}: GuestLeadModalProps) {
    const { login, refreshUser } = useAuth()
    const [activeTab, setActiveTab] = useState<'info' | 'login'>('info')
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: ''
    })
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)

    // Init Facebook SDK
    useFacebookSDK()

    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.phone) {
            toast.error('Vui lòng nhập tên và số điện thoại')
            return
        }
        
        setLoading(true)
        try {
            // Simulate Lead Capture
            const res = await fetch('/api/marketplace/guest-leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    action: 'BOOKMARK',
                    projectTitle
                })
            })
            
            toast.success('Đã lưu dự án vào danh sách quan tâm của bạn!')
            onSuccess?.(formData)
            onClose()
        } catch (error) {
            toast.error('Không thể lưu thông tin. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    const handleManualLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!loginData.email || !loginData.password) {
            toast.error('Vui lòng nhập đầy đủ thông tin')
            return
        }

        setLoading(true)
        try {
            const response = await login(loginData) as any
            if (response?.user) {
                toast.success('Đăng nhập thành công!')
                await refreshUser()
                onClose()
            }
        } catch (error: any) {
            toast.error(error.message || 'Đăng nhập thất bại')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setLoading(true)
                const res = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: tokenResponse.access_token }),
                })
                const data = await res.json()
                if (data.success) {
                    toast.success('Đăng nhập Google thành công!')
                    localStorage.setItem('auth_active', 'true')
                    await refreshUser()
                    onClose()
                } else {
                    throw new Error(data.error || 'Đăng nhập Google thất bại')
                }
            } catch (err: any) {
                toast.error(err.message || 'Có lỗi xảy ra khi đăng nhập bằng Google')
            } finally {
                setLoading(false)
            }
        },
        onError: () => { toast.error('Đăng nhập Google thất bại') }
    })

    const handleFacebookLogin = async () => {
        try {
            setLoading(true)
            const authResponse = await loginWithFacebook()
            const res = await fetch('/api/auth/facebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: authResponse.accessToken }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Đăng nhập Facebook thành công!')
                localStorage.setItem('auth_active', 'true')
                await refreshUser()
                onClose()
            } else {
                throw new Error(data.error || 'Đăng nhập Facebook thất bại')
            }
        } catch (err: any) {
            if (!err.message?.includes('cancelled')) {
                toast.error(err.message || 'Có lỗi xảy ra khi đăng nhập bằng Facebook')
            }
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                {/* Header Section */}
                <div className="relative p-8 pb-0">
                    <button 
                        onClick={onClose}
                        className="absolute right-6 top-6 p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                            <Bookmark className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Lưu dự án</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest line-clamp-1">Quan tâm: {projectTitle}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-8 mt-6">
                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Thông tin nhanh
                        </button>
                        <button
                            onClick={() => setActiveTab('login')}
                            className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Đăng nhập
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    {activeTab === 'info' ? (
                        <form onSubmit={handleInfoSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên *</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        placeholder="Nhập tên của bạn"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại *</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        placeholder="Nhập số điện thoại"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Không bắt buộc)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        placeholder="Nhập email của bạn"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center gap-2 group mt-4 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>LƯU QUAN TÂM <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>

                            <p className="text-[10px] text-center text-slate-400 font-bold leading-relaxed px-4">
                                Bằng cách tiếp tục, bạn đồng ý nhận thông báo về dự án này qua SĐT/Email.
                            </p>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    type="button"
                                    onClick={() => handleFacebookLogin()}
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all group disabled:opacity-50"
                                >
                                    <Facebook className="w-5 h-5 text-[#1877F2]" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">Facebook</span>
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handleGoogleLogin()}
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all group disabled:opacity-50"
                                >
                                    <Chrome className="w-5 h-5 text-[#DB4437]" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">Google</span>
                                </button>
                            </div>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-100"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-4 bg-white text-[10px] font-black text-slate-300 uppercase tracking-widest">Hoặc đăng nhập với SmartBuild</span>
                                </div>
                            </div>

                            <form onSubmit={handleManualLogin} className="space-y-3">
                                <input 
                                    type="email"
                                    required
                                    value={loginData.email}
                                    onChange={e => setLoginData({...loginData, email: e.target.value})}
                                    placeholder="Email của bạn"
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                                <input 
                                    type="password"
                                    required
                                    value={loginData.password}
                                    onChange={e => setLoginData({...loginData, password: e.target.value})}
                                    placeholder="Mật khẩu"
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>ĐĂNG NHẬP <LogIn className="w-4 h-4" /></>
                                    )}
                                </button>
                            </form>

                            <p className="text-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Chưa có tài khoản? </span>
                                <button className="text-[10px] font-black text-primary-600 uppercase tracking-tight hover:underline">Đăng ký ngay</button>
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Perks */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Bảo mật thông tin</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Cập nhật tức thì</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
