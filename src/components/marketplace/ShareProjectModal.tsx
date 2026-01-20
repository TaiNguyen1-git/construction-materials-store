'use client'

/**
 * Share Project Modal Component
 * Features: Copy Link, QR Code, Social Share, Template Message
 */

import { useState, useEffect } from 'react'
import { X, Copy, Check, QrCode, Facebook, MessageCircle, Share2, Download, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface ShareProjectModalProps {
    isOpen: boolean
    onClose: () => void
    project: {
        id: string
        title: string
        projectType: string
        city: string
        estimatedBudget: number | null
        isUrgent: boolean
    }
}

export default function ShareProjectModal({ isOpen, onClose, project }: ShareProjectModalProps) {
    const [copied, setCopied] = useState(false)
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'template'>('link')

    const projectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/projects/${project.id}`
        : `/projects/${project.id}`

    const formatBudget = (amount: number | null) => {
        if (!amount) return 'Thương lượng'
        if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} tỷ`
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} triệu`
        return `${amount.toLocaleString('vi-VN')}đ`
    }

    // Template message for sharing
    const templateMessage = `🏗️ *${project.title}*

📍 Địa điểm: ${project.city}
💰 Ngân sách: ${formatBudget(project.estimatedBudget)}
${project.isUrgent ? '🔥 CẦN GẤP!\n' : ''}
👉 Xem chi tiết & ứng tuyển tại:
${projectUrl}

---
📱 Đăng qua SmartBuild - Sàn kết nối nhà thầu uy tín`

    // Generate QR Code using API
    useEffect(() => {
        if (isOpen && activeTab === 'qr') {
            generateQRCode()
        }
    }, [isOpen, activeTab, projectUrl])

    const generateQRCode = async () => {
        try {
            // Using QR Server API (free, no dependency needed)
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(projectUrl)}&bgcolor=ffffff&color=1e40af`
            setQrDataUrl(qrUrl)
        } catch (error) {
            console.error('QR generation failed:', error)
        }
    }

    const copyToClipboard = async (text: string, label: string = 'Link') => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            toast.success(`Đã sao chép ${label}!`)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast.error('Không thể sao chép')
        }
    }

    const shareToFacebook = () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(projectUrl)}`
        window.open(fbUrl, '_blank', 'width=600,height=400')
    }

    const shareToZalo = () => {
        // Zalo share API
        const zaloUrl = `https://zalo.me/share?url=${encodeURIComponent(projectUrl)}&title=${encodeURIComponent(project.title)}`
        window.open(zaloUrl, '_blank', 'width=600,height=400')
    }

    const downloadQR = () => {
        if (qrDataUrl) {
            const link = document.createElement('a')
            link.href = qrDataUrl
            link.download = `qr-${project.id}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success('Đã tải mã QR!')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Share2 className="w-6 h-6" />
                            <h2 className="text-lg font-bold">Chia sẻ & Mời thầu</h2>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-sm text-blue-100 mt-1 line-clamp-1">{project.title}</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    {[
                        { id: 'link', label: 'Sao chép link', icon: Copy },
                        { id: 'qr', label: 'Mã QR', icon: QrCode },
                        { id: 'template', label: 'Tin nhắn mẫu', icon: MessageCircle }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-5">
                    {activeTab === 'link' && (
                        <div className="space-y-4">
                            {/* Link preview */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <p className="text-xs text-gray-500 mb-2">Link dự án</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-sm text-blue-600 bg-white px-3 py-2 rounded-lg border border-gray-200 truncate">
                                        {projectUrl}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(projectUrl)}
                                        className={`p-2.5 rounded-lg transition-colors ${copied
                                                ? 'bg-green-500 text-white'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                    >
                                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Social share buttons */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-3">Chia sẻ nhanh</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={shareToFacebook}
                                        className="flex items-center justify-center gap-2 py-3 bg-[#1877F2] text-white rounded-xl font-medium hover:bg-[#166FE5] transition-colors"
                                    >
                                        <Facebook className="w-5 h-5" />
                                        Facebook
                                    </button>
                                    <button
                                        onClick={shareToZalo}
                                        className="flex items-center justify-center gap-2 py-3 bg-[#0068FF] text-white rounded-xl font-medium hover:bg-[#0055CC] transition-colors"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        Zalo
                                    </button>
                                </div>
                            </div>

                            {/* Preview card info */}
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                <p className="text-xs font-medium text-blue-600 mb-2">💡 Mẹo hay</p>
                                <p className="text-sm text-gray-600">
                                    Khi gửi link qua Zalo/Facebook, hệ thống sẽ tự động hiện ảnh preview dự án giúp tăng tỷ lệ click!
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'qr' && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center">
                                {/* QR Code */}
                                <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                                    {qrDataUrl ? (
                                        <img
                                            src={qrDataUrl}
                                            alt="QR Code"
                                            className="w-48 h-48"
                                        />
                                    ) : (
                                        <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm text-gray-500 mt-4 text-center">
                                    Quét mã để xem chi tiết dự án
                                </p>

                                {/* Download button */}
                                <button
                                    onClick={downloadQR}
                                    disabled={!qrDataUrl}
                                    className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Tải mã QR
                                </button>
                            </div>

                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <p className="text-sm text-amber-800">
                                    📌 In mã QR này và dán tại công trường hoặc gửi cho thợ để họ xem thông tin nhanh trên điện thoại!
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'template' && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <p className="text-xs text-gray-500 mb-2">Tin nhắn mẫu</p>
                                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                                    {templateMessage}
                                </pre>
                            </div>

                            <button
                                onClick={() => copyToClipboard(templateMessage, 'Tin nhắn')}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                            >
                                <Copy className="w-5 h-5" />
                                Sao chép tin nhắn
                            </button>

                            <p className="text-xs text-gray-500 text-center">
                                Dán tin nhắn này vào Zalo, Facebook hoặc gửi SMS cho nhà thầu
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Được hỗ trợ bởi SmartBuild</span>
                        <a
                            href={projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                            Xem trang <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
