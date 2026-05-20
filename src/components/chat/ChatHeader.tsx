import { Phone, Video, Info } from 'lucide-react'
import ChatSummaryButton from '@/components/ChatSummaryButton'

interface ChatHeaderProps {
    partnerName: string
    userId: string
    selectedConv: string
    onCall: (type: 'audio' | 'video') => void
    isGroup?: boolean
    participantNames?: string[]
    onShowInfo?: () => void
}

export default function ChatHeader({
    partnerName,
    userId,
    selectedConv,
    onCall,
    isGroup,
    participantNames,
    onShowInfo
}: ChatHeaderProps) {
    return (
        <div className="px-6 py-4 border-b bg-white flex items-center justify-between sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black shadow-md flex-shrink-0">
                    {partnerName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-black text-gray-900 truncate tracking-tight text-sm flex items-center gap-2">
                        {partnerName}
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg border uppercase tracking-widest ${isGroup ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {isGroup ? 'Nhóm' : 'Nhà thầu'}
                        </span>
                    </h3>
                    <div className="flex items-center gap-1.5 min-w-0">
                        {isGroup ? (
                            <p className="text-[10px] text-gray-500 font-medium truncate max-w-md">
                                {(participantNames || []).join(', ')}
                            </p>
                        ) : (
                            <>
                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Đang hoạt động</p>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => onCall('audio')} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="Gọi thoại">
                    <Phone className="w-5 h-5" />
                </button>
                <button onClick={() => onCall('video')} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="Gọi video">
                    <Video className="w-5 h-5" />
                </button>
                {onShowInfo && (
                    <button onClick={onShowInfo} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="Thông tin nhóm">
                        <Info className="w-5 h-5" />
                    </button>
                )}
                <div className="w-px h-8 bg-gray-100 mx-1" />
                <ChatSummaryButton
                    conversationId={selectedConv}
                    currentUserId={userId}
                />
            </div>
        </div>
    )
}
