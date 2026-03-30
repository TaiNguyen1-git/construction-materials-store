import type { Metadata } from 'next'
import Header from '@/components/Header'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Cộng đồng Chuyên gia SmartBuild',
    description: 'Nơi kết nối thợ thầu và chủ nhà, giải đáp tư vấn kỹ thuật vật liệu xây dựng.',
}

export default function ForumLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            
            {/* Header Banner */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Cộng Đồng Diễn Đàn</h1>
                    <p className="mt-2 text-base text-gray-500 max-w-2xl">
                        Nơi giao lưu, giải đáp chuyên môn và chia sẻ kinh nghiệm xây dựng giữa hàng ngàn chủ nhà, thợ thầu và đại lý vật liệu.
                    </p>
                </div>
            </div>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Khu vực nội dung chính (Cột Trái 75%) */}
                    <div className="flex-1 w-full lg:w-3/4">
                        {children}
                    </div>

                    {/* Sidebar Bên Phải (Cột Phải 25%) */}
                    <div className="w-full lg:w-1/4 space-y-6">
                        {/* Box Đăng Câu Hỏi */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                            <h3 className="font-bold text-gray-900 mb-2">Gặp vấn đề thi công?</h3>
                            <p className="text-xs text-gray-500 mb-5">
                                Các kỹ sư và chuyên gia của chúng tôi sẵn sàng giải đáp miễn phí cho bạn.
                            </p>
                            <Link 
                                href="/forum/ask"
                                className="block w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm"
                            >
                                Đặt Câu Hỏi Mới
                            </Link>
                        </div>

                        {/* Box Nội Quy */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Nội quy cộng đồng</h3>
                            <ul className="text-sm text-gray-600 space-y-3 list-inside list-disc">
                                <li>Văn minh, lịch sự trong giao tiếp.</li>
                                <li>Nghiêm cấm chia sẻ liên kết rác, quảng cáo đối thủ.</li>
                                <li>Các câu trả lời mang tính chuyên môn cao sẽ được tick xanh và cộng điểm uy tín.</li>
                                <li>Sử dụng tính năng tìm kiếm trước khi hỏi.</li>
                            </ul>
                        </div>
                        
                        {/* Placeholder Top Chuyên Gia (Sẽ fetch Data sau) */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Bảng Vàng V.I.P</h3>
                            <div className="text-sm text-gray-500 italic text-center py-4">
                                Bảng xếp hạng Top 3 chuyên gia năng nổ nhất tuần sẽ được khởi động vào đầu tháng tới.
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
