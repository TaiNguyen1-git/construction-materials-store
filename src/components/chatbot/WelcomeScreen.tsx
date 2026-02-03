'use client'

import { Sparkles } from 'lucide-react'

interface WelcomeScreenProps {
    isAdmin: boolean;
}

export default function WelcomeScreen({ isAdmin }: WelcomeScreenProps) {
    return (
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            {/* Avatar */}
            <div className="relative mb-6">
                <div className="w-24 h-24 bg-white rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <img
                        src="/images/smartbuild_bot.png"
                        alt="SmartBuild AI"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-sm" />
            </div>

            {/* Welcome text */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
                Xin chào! 👋
            </h3>
            <p className="text-sm text-gray-500 max-w-[260px] leading-relaxed">
                {isAdmin
                    ? 'Tôi là trợ lý quản trị SmartBuild. Tôi có thể giúp bạn xem báo cáo, doanh thu và quản lý hệ thống.'
                    : 'Tôi là SmartBuild AI. Bạn cần tư vấn vật liệu, dự toán công trình hay tìm sản phẩm giá tốt hôm nay?'
                }
            </p>

            <div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>AI Assistant is active</span>
            </div>
        </div>
    )
}
