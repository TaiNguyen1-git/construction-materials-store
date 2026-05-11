import { MessageCircle } from 'lucide-react'

export default function ChatEmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                <MessageCircle className="w-12 h-12 text-blue-100" />
            </div>
            <p className="font-medium text-gray-600 text-center px-4">Chọn một cuộc trò chuyện để bắt đầu</p>
            <p className="text-sm text-center px-4 mt-1">Kết nối trực tiếp giữa nhà thầu và khách hàng</p>
        </div>
    )
}
