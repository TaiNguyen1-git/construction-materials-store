'use client'

import { Sparkles } from 'lucide-react'

interface WelcomeScreenProps {
    isAdmin: boolean;
    onConnectSupport?: () => void;
    onSuggestionClick?: (suggestion: string) => void;
}

// Static suggestions - no API call needed
const CUSTOMER_SUGGESTIONS = [
    { label: '🔍 Tìm sản phẩm', value: 'Tôi muốn tìm sản phẩm' },
    { label: '📐 Tính vật liệu', value: 'Tôi muốn tính toán vật liệu cho công trình' },
    { label: '💰 Xem giá', value: 'Tôi muốn xem bảng giá vật liệu' },
    { label: '🛒 Hỗ trợ đơn hàng', value: 'Tôi cần hỗ trợ về đơn hàng' },
]

const ADMIN_SUGGESTIONS = [
    { label: '📊 Báo cáo doanh thu', value: 'Cho tôi xem báo cáo doanh thu hôm nay' },
    { label: '📦 Tồn kho', value: 'Kiểm tra tồn kho sắp hết' },
    { label: '📋 Đơn hàng mới', value: 'Có đơn hàng mới nào không?' },
    { label: '👥 Khách hàng', value: 'Thống kê khách hàng trong tháng' },
]

export default function WelcomeScreen({ isAdmin, onConnectSupport, onSuggestionClick }: WelcomeScreenProps) {
    const suggestions = isAdmin ? ADMIN_SUGGESTIONS : CUSTOMER_SUGGESTIONS

    return (
        <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
            {/* Avatar */}
            <div className="relative mb-5">
                <div className="w-20 h-20 bg-white rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <img
                        src="/images/smartbuild_bot.png"
                        alt="SmartBuild AI"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white shadow-sm" />
            </div>

            {/* Welcome text */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">
                Xin chào! 👋
            </h3>
            <p className="text-sm text-gray-500 max-w-[260px] leading-relaxed mb-6">
                {isAdmin
                    ? 'Tôi là trợ lý quản trị SmartBuild. Tôi có thể giúp bạn xem báo cáo, doanh thu và quản lý hệ thống.'
                    : 'Tôi là SmartBuild AI. Bạn cần tư vấn vật liệu, dự toán công trình hay tìm sản phẩm giá tốt hôm nay?'
                }
            </p>

            {/* Quick Action Buttons - Static, no API call */}
            {onSuggestionClick && (
                <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-[300px]">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => onSuggestionClick(suggestion.value)}
                            className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors shadow-sm"
                        >
                            {suggestion.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Support Connection Button */}
            {!isAdmin && onConnectSupport && (
                <button
                    onClick={onConnectSupport}
                    className="mb-6 px-4 py-2 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors flex items-center gap-2"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Gặp nhân viên hỗ trợ
                </button>
            )}

            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-wider opacity-60">
                <Sparkles className="w-3 h-3" />
                <span>AI Powered Assistant</span>
            </div>
        </div>
    )
}
