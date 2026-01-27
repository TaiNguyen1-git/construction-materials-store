'use client'

import { useState, useEffect } from 'react'
import { User as UserIcon, LogIn, UserX, Shield, X } from 'lucide-react'

interface SessionPromptModalProps {
    isOpen: boolean
    userEmail: string
    userName: string
    userRole: string
    onContinue: () => void
    onBrowseAsGuest: () => void
    onClose: () => void
}

const roleLabels: Record<string, string> = {
    MANAGER: 'Quản lý',
    EMPLOYEE: 'Nhân viên',
    CUSTOMER: 'Khách hàng',
    CONTRACTOR: 'Nhà thầu',
}

export default function SessionPromptModal({
    isOpen,
    userEmail,
    userName,
    userRole,
    onContinue,
    onBrowseAsGuest,
    onClose,
}: SessionPromptModalProps) {
    const [rememberChoice, setRememberChoice] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (isOpen) {
            // Small delay for smooth animation
            const timer = setTimeout(() => setIsVisible(true), 50)
            return () => clearTimeout(timer)
        } else {
            setIsVisible(false)
        }
    }, [isOpen])

    const handleContinue = () => {
        if (rememberChoice) {
            localStorage.setItem('session_prompt_preference', 'continue')
        }
        onContinue()
    }

    const handleBrowseAsGuest = () => {
        if (rememberChoice) {
            localStorage.setItem('session_prompt_preference', 'guest')
        }
        onBrowseAsGuest()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl transform transition-all duration-300 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
                    }`}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="px-6 pt-8 pb-4 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4 shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Phiên đăng nhập được phát hiện
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Bạn có muốn tiếp tục với tài khoản đã đăng nhập không?
                    </p>
                </div>

                {/* User info card */}
                <div className="mx-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                            <UserIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {userName || 'Người dùng'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {userEmail}
                            </p>
                            <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                                {roleLabels[userRole] || userRole}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 space-y-3">
                    <button
                        onClick={handleContinue}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200"
                    >
                        <LogIn className="w-5 h-5" />
                        Tiếp tục với tài khoản này
                    </button>

                    <button
                        onClick={handleBrowseAsGuest}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200"
                    >
                        <UserX className="w-5 h-5" />
                        Duyệt như khách
                    </button>
                </div>

                {/* Remember choice */}
                <div className="px-6 pb-6 pt-0">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={rememberChoice}
                                onChange={(e) => setRememberChoice(e.target.checked)}
                                className="sr-only"
                            />
                            <div
                                className={`w-5 h-5 border-2 rounded transition-all duration-200 ${rememberChoice
                                        ? 'bg-blue-500 border-blue-500'
                                        : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'
                                    }`}
                            >
                                {rememberChoice && (
                                    <svg
                                        className="w-full h-full text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Nhớ lựa chọn của tôi
                        </span>
                    </label>
                </div>

                {/* Footer note */}
                <div className="px-6 pb-6">
                    <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                        Bạn có thể thay đổi tùy chọn này sau trong cài đặt tài khoản
                    </p>
                </div>
            </div>
        </div>
    )
}
