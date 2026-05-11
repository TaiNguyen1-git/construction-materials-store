import { Phone, Video } from 'lucide-react'
import ChatSummaryButton from '@/components/ChatSummaryButton'

interface ChatHeaderProps {
    partnerName: string
    userId: string
    selectedConv: string
    onCall: (type: 'audio' | 'video') => void
}

export default function ChatHeader({
    partnerName,
    userId,
    selectedConv,
    onCall
}: ChatHeaderProps) {
    return (
        <div className="px-6 py-4 border-b bg-white flex items-center justify-between sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black shadow-md">
                    {partnerName.charAt(0)}
                </div>
                <div className="min-w-0">
                    <h3 className="font-black text-gray-900 truncate tracking-tight text-sm flex items-center gap-2">
                        {partnerName}
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-lg border border-blue-100 uppercase tracking-widest">Nhà thầu</span>
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Đang hoạt động</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onCall('audio')} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="Gọi thoại">
                    <Phone className="w-5 h-5" />
                </button>
                <button onClick={() => onCall('video')} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="Gọi video">
                    <Video className="w-5 h-5" />
                </button>
                <div className="w-px h-8 bg-gray-100 mx-1" />
                <ChatSummaryButton
                    conversationId={selectedConv}
                    currentUserId={userId}
                />
            </div>
        </div>
    )
}
