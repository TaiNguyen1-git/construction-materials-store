'use client'

import { X, Maximize2, Minimize2 } from 'lucide-react'

interface ChatHeaderProps {
    isAdmin: boolean;
    isExpanded: boolean;
    onClose: () => void;
    onToggleExpand: () => void;
    isHuman?: boolean;
    onSwitchToAI?: () => void;
}

export default function ChatHeader({
    isAdmin,
    isExpanded,
    onClose,
    onToggleExpand,
    isHuman,
    onSwitchToAI
}: ChatHeaderProps) {
    return (
        <div className={`flex-shrink-0 border-b border-transparent p-4 relative shadow-sm ${isAdmin ? 'bg-indigo-600' : 'bg-blue-600'}`}>
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-white/90 flex items-center justify-center p-1.5 overflow-hidden">
                            <img
                                src={isHuman ? "/images/support_agent.png" : "/images/smartbuild_bot.png"}
                                alt="Avatar"
                                className="w-full h-full object-contain mix-blend-multiply"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-inherit" style={{ borderColor: isAdmin ? '#4f46e5' : '#2563eb' }} />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white tracking-tight whitespace-nowrap">
                                {isAdmin ? 'Quản trị viên' : (isHuman ? 'Nhân viên hỗ trợ' : 'SmartBuild AI')}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-white/80 font-medium tracking-wide shadow-sm">
                                {isAdmin ? 'Trực tuyến' : (isHuman ? 'Đang hỗ trợ' : 'Sẵn sàng tư vấn')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {isHuman && onSwitchToAI && (
                        <button
                            onClick={onSwitchToAI}
                            className="px-3 py-1.5 text-[11px] font-bold text-white hover:text-white hover:bg-white/20 rounded-lg transition-all"
                        >
                            Kết thúc hỗ trợ
                        </button>
                    )}

                    {(isHuman && onSwitchToAI) && <div className="w-[1px] h-4 bg-white/20 mx-1" />}

                    <button
                        onClick={onToggleExpand}
                        className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                        title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
                    >
                        {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={onClose}
                        className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                        title="Đóng cửa sổ"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
