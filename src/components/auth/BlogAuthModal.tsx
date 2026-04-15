'use client'

import React, { useState } from 'react'
import { X, Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useGoogleLogin } from '@react-oauth/google'
import { useFacebookSDK, loginWithFacebook } from '@/lib/facebook-sdk'
import { toast } from 'react-hot-toast'

interface BlogAuthModalProps {
    isOpen: boolean
    onClose: () => void
    initialMode?: 'LOGIN' | 'REGISTER'
    title?: string
    onSuccess?: () => void
}

export default function BlogAuthModal({ isOpen, onClose, initialMode = 'LOGIN', title = 'Đăng nhập để tương tác', onSuccess }: BlogAuthModalProps) {
    const { login, register, refreshUser } = useAuth()
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(initialMode)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    })

    useFacebookSDK()

    const handleSuccess = async (user: any) => {
        await refreshUser()
        onClose()
        if (onSuccess) onSuccess()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (mode === 'LOGIN') {
                const response = await login({ email: formData.email, password: formData.password }) as any
                if (response?.user) {
                    toast.success('Đăng nhập thành công!')
                    handleSuccess(response.user)
                }
            } else {
                if (formData.password !== formData.confirmPassword) {
                    toast.error('Mật khẩu không khớp!')
                    setIsLoading(false)
                    return
                }
                const response = await register({
                    fullName: formData.name,
                    phone: '',
                    email: formData.email,
                    password: formData.password
                }) as any
                if (response?.user) {
                    toast.success('Đăng ký thành công!')
                    handleSuccess(response.user)
                } else if (response?.verificationRequired) {
                    toast.success('Đăng ký thành công. Vui lòng kiểm tra email để xác thực.')
                    onClose()
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'Có lỗi xảy ra')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setIsLoading(true)
                const res = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: tokenResponse.access_token }),
                })
                const data = await res.json()
                if (data.success) {
                    toast.success('Đăng nhập Google thành công!')
                    localStorage.setItem('auth_active', 'true')
                    handleSuccess(data.user)
                } else {
                    throw new Error(data.error || 'Đăng nhập Google thất bại')
                }
            } catch (err: any) {
                toast.error(err.message || 'Có lỗi xảy ra khi đăng nhập bằng Google')
            } finally {
                setIsLoading(false)
            }
        },
        onError: () => { toast.error('Đăng nhập Google thất bại') }
    })

    const handleFacebookLogin = async () => {
        try {
            setIsLoading(true)
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
                handleSuccess(data.user)
            } else {
                throw new Error(data.error || 'Đăng nhập Facebook thất bại')
            }
        } catch (err: any) {
            if (!err.message?.includes('cancelled')) {
                toast.error(err.message || 'Có lỗi xảy ra khi đăng nhập bằng Facebook')
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors z-10">
                    <X className="w-5 h-5" />
                </button>
                
                <div className="p-8 pb-6 text-center">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-2">
                        {mode === 'LOGIN' ? 'Điền thông tin để tiếp tục' : 'Tạo tài khoản để tham gia thảo luận'}
                    </p>
                </div>

                <div className="px-8 pb-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'REGISTER' && (
                            <div className="relative group">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Họ và tên"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                                />
                            </div>
                        )}
                        
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="email"
                                placeholder="Email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Mật khẩu"
                                required
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {mode === 'REGISTER' && (
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Xác nhận mật khẩu"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 mt-2"
                        >
                            {isLoading ? 'Đang xử lý...' : (mode === 'LOGIN' ? 'Đăng nhập' : 'Đăng ký')}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 border-t border-slate-100"></div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hoặc</span>
                        <div className="flex-1 border-t border-slate-100"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-6">
                        <button
                            type="button"
                            onClick={() => handleGoogleLogin()}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 py-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Google</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleFacebookLogin}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 py-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#1877F2]">Facebook</span>
                        </button>
                    </div>

                    <p className="text-center text-sm font-medium text-slate-500">
                        {mode === 'LOGIN' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                        <button 
                            type="button" 
                            onClick={() => setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                            className="text-blue-600 font-bold hover:underline"
                        >
                            {mode === 'LOGIN' ? 'Tạo mới' : 'Đăng nhập'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
