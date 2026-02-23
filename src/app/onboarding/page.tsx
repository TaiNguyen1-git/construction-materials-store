'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Building2,
    ShoppingCart,
    HardHat,
    Truck,
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    ArrowRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/auth-context'
import { toast, Toaster } from 'react-hot-toast'

type RoleType = 'CUSTOMER' | 'CONTRACTOR' | 'SUPPLIER'

export default function OnboardingPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading: authLoading, user } = useAuth()
    const [selectedRole, setSelectedRole] = useState<RoleType | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Redirect if not authenticated
    React.useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?callbackUrl=/onboarding')
        }
    }, [authLoading, isAuthenticated, router])

    if (authLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>
        )
    }

    const roles = [
        {
            id: 'CUSTOMER' as RoleType,
            title: 'Khách hàng cá nhân',
            description: 'Mua sắm vật liệu xây dựng lẻ cho gia đình, sửa chữa nhà cửa với giá tốt nhất.',
            icon: <ShoppingCart className="w-10 h-10 text-blue-500" />,
            color: 'blue',
            features: ['Mua hàng nhanh chóng', 'Theo dõi đơn hàng', 'Tích điểm thành viên']
        },
        {
            id: 'CONTRACTOR' as RoleType,
            title: 'Nhà thầu xây dựng',
            description: 'Dành cho các chủ thầu, kỹ sư. Quản lý dự án, nhận báo giá sỉ và ưu đãi riêng.',
            icon: <HardHat className="w-10 h-10 text-emerald-500" />,
            color: 'emerald',
            features: ['Giá chiết khấu cao', 'Quản lý nhiều công trình', 'Hỗ trợ kỹ thuật 24/7']
        },
        {
            id: 'SUPPLIER' as RoleType,
            title: 'Nhà cung cấp',
            description: 'Dành cho đại lý, tổng kho. Đưa sản phẩm tiếp cận hàng ngàn nhà thầu và khách hàng.',
            icon: <Truck className="w-10 h-10 text-orange-500" />,
            color: 'orange',
            features: ['Quản lý gian hàng', 'Thống kê doanh thu', 'Mở rộng thị trường']
        }
    ]

    const handleSelectRole = async () => {
        if (!selectedRole) return

        try {
            setIsLoading(true)
            const res = await fetch('/api/auth/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: selectedRole }),
            })

            const data = await res.json()

            if (data.success) {
                toast.success('Thiết lập vai trò thành công!')
                // Redirect based on role
                setTimeout(() => {
                    if (selectedRole === 'SUPPLIER') router.push('/supplier')
                    else if (selectedRole === 'CONTRACTOR') router.push('/contractor')
                    else router.push('/')
                }, 1000)
            } else {
                throw new Error(data.error || 'Có lỗi xảy ra')
            }
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoBack = () => {
        router.push('/')
    }

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 relative overflow-hidden">
            <Toaster position="top-right" />

            {/* Background Pastel Elements */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[100px] -z-10 animate-pulse-gentle" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-50/50 rounded-full blur-[100px] -z-10" />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-white/50 backdrop-blur-md border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-500 p-2 rounded-xl">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-black uppercase tracking-tighter italic">SmartBuild</span>
                </div>

                <button
                    onClick={handleGoBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-all group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Quay lại trang chủ
                </button>
            </header>

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center">
                {/* Intro */}
                <div className="text-center mb-16 space-y-4 max-w-2xl">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-black tracking-tight text-slate-900 leading-tight"
                    >
                        Chào mừng bạn đến với <span className="text-blue-600">SmartBuild</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-slate-500 font-medium"
                    >
                        Để bắt đầu trải nghiệm tốt nhất, hãy chọn vai trò phù hợp với bạn trong hệ thống của chúng tôi.
                    </motion.p>
                </div>

                {/* Role Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-16">
                    {roles.map((role, index) => (
                        <motion.div
                            key={role.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.2 }}
                            onClick={() => setSelectedRole(role.id)}
                            className={`
                relative cursor-pointer group p-8 rounded-[40px] border-2 transition-all duration-500
                ${selectedRole === role.id
                                    ? `bg-white border-${role.color}-500 shadow-2xl shadow-${role.color}-500/10 scale-[1.02]`
                                    : 'bg-white border-slate-50 hover:border-slate-200 shadow-xl shadow-slate-200/20 hover:scale-[1.01]'
                                }
              `}
                        >
                            {/* Active Indicator */}
                            {selectedRole === role.id && (
                                <div className="absolute top-6 right-6 text-blue-500">
                                    <CheckCircle2 className="w-7 h-7 fill-blue-500 text-white" />
                                </div>
                            )}

                            <div className={`mb-8 p-4 rounded-3xl bg-${role.color}-50 w-fit group-hover:scale-110 transition-transform duration-500`}>
                                {role.icon}
                            </div>

                            <h3 className="text-2xl font-black mb-4 text-slate-900 tracking-tight">{role.title}</h3>
                            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                {role.description}
                            </p>

                            <div className="space-y-3">
                                {role.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                        <div className={`w-1.5 h-1.5 rounded-full bg-${role.color}-400`} />
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            {/* Decorative Glow */}
                            <div
                                className={`
                  absolute inset-0 rounded-[40px] opacity-0 group-hover:opacity-10 transition-opacity duration-500 -z-10
                  bg-gradient-to-br from-${role.color}-400 to-transparent
                `}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Action Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="w-full max-w-md flex flex-col items-center gap-6"
                >
                    <button
                        onClick={handleSelectRole}
                        disabled={!selectedRole || isLoading}
                        className={`
              w-full py-5 rounded-[24px] text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3
              disabled:opacity-50 disabled:grayscale
              ${selectedRole
                                ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/40 hover:bg-blue-700 active:scale-[0.98]'
                                : 'bg-slate-100 text-slate-400'
                            }
            `}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Xác nhận vai trò</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    <p className="text-sm font-bold text-slate-400 text-center px-8">
                        Bằng việc xác nhận, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của SmartBuild.
                    </p>
                </motion.div>
            </main>

            {/* Footer Info */}
            <footer className="text-center pb-12">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-300">
                    SmartBuild ERP © 2026 - Digital Construction Platform
                </p>
            </footer>

            {/* Global CSS for manual color classes (since Tailwind might not catch dynamic ones) */}
            <style jsx global>{`
        .bg-blue-50 { background-color: #eff6ff; }
        .bg-emerald-50 { background-color: #ecfdf5; }
        .bg-orange-50 { background-color: #fff7ed; }
        .border-blue-500 { border-color: #3b82f6; }
        .border-emerald-500 { border-color: #10b981; }
        .border-orange-500 { border-color: #f97316; }
        .bg-blue-400 { background-color: #60a5fa; }
        .bg-emerald-400 { background-color: #34d399; }
        .bg-orange-400 { background-color: #fb923c; }
        .shadow-blue-500/10 { shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1); }
        .shadow-emerald-500/10 { shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.1); }
        .shadow-orange-500/10 { shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.1); }
      `}</style>
        </div>
    )
}
