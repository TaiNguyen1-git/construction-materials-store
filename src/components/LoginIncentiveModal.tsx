'use client'

import { X, Heart, Star, ShoppingBag, ShieldCheck, LogIn, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface LoginIncentiveModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    feature?: 'wishlist' | 'order' | 'review' | 'general'
}

export default function LoginIncentiveModal({
    isOpen,
    onClose,
    title = 'Bạn cần đăng nhập',
    description = 'Đăng nhập ngay để khám phá đầy đủ các tính năng hấp dẫn của SmartBuild.',
    feature = 'wishlist'
}: LoginIncentiveModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isOpen) {
            // Prevent scrolling and handle scrollbar shift
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
            document.body.style.overflow = 'hidden'
            document.body.style.paddingRight = `${scrollBarWidth}px`
        } else {
            document.body.style.overflow = ''
            document.body.style.paddingRight = ''
        }
        return () => {
            document.body.style.overflow = ''
            document.body.style.paddingRight = ''
        }
    }, [isOpen])

    if (!isOpen || !mounted) return null

    const getFeatureContent = () => {
        switch (feature) {
            case 'wishlist':
                return {
                    icon: <Heart className="w-8 h-8 text-red-500 fill-red-500" />,
                    title: 'Lưu giữ những món đồ yêu thích',
                    desc: 'Tạo tài khoản để lưu lại những vật tư bạn ưng ý và xem lại bất cứ khi nào, trên bất kỳ thiết bị nào.'
                }
            case 'order':
                return {
                    icon: <ShoppingBag className="w-8 h-8 text-blue-500" />,
                    title: 'Theo dõi đơn hàng dễ dàng',
                    desc: 'Cập nhật trạng thái vận chuyển, lịch sử mua hàng và quản lý hóa đơn chuyên nghiệp.'
                }
            case 'review':
                return {
                    icon: <Star className="w-8 h-8 text-amber-500 fill-amber-500" />,
                    title: 'Chia sẻ trải nghiệm của bạn',
                    desc: 'Đóng góp ý kiến về sản phẩm để nhận được các ưu đãi đặc biệt và giúp cộng đồng SmartBuild phát triển.'
                }
            default:
                return {
                    icon: <ShieldCheck className="w-8 h-8 text-primary-600" />,
                    title: 'Vì quyền lợi của bạn',
                    desc: 'Đăng ký thành viên để nhận ngay mã giảm giá 5% cho đơn hàng đầu tiên và nhiều ưu đãi khác.'
                }
        }
    }

    const content = getFeatureContent()

    const modalContent = (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div
                className="bg-white rounded-[2rem] max-w-md w-full overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-20"
                >
                    <X size={20} className="text-gray-400" />
                </button>

                {/* Hero Section with Pattern */}
                <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-4 transform -rotate-6">
                            {content.icon}
                        </div>
                        <h2 className="text-xl font-black text-white leading-tight mb-2">
                            {title}
                        </h2>
                        <p className="text-primary-100 text-xs leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Benefit Section */}
                <div className="p-6">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
                        <h3 className="font-bold text-gray-900 text-sm mb-1.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary-600 rounded-full"></span>
                            {content.title}
                        </h3>
                        <p className="text-[11px] text-gray-600 leading-relaxed">
                            {content.desc}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 w-full bg-primary-600 text-white py-3.5 rounded-xl text-sm font-black shadow-lg shadow-primary-200 hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <LogIn size={18} />
                            Đăng Nhập Ngay
                        </Link>
                        <Link
                            href="/register"
                            className="flex items-center justify-center gap-2 w-full bg-white text-primary-600 border-2 border-primary-50 py-3.2 rounded-xl text-sm font-black hover:bg-primary-50 transition-all text-center"
                        >
                            <UserPlus size={18} />
                            Tạo Tài Khoản Mới
                        </Link>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full text-center mt-6 text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
                    >
                        Để sau, tôi muốn xem tiếp
                    </button>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
