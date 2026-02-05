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
        <div
            className={`
                flex-shrink-0
                ${isAdmin
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500'
                    : (isHuman
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500'
                        : 'bg-gradient-to-r from-blue-600 to-blue-500')
                }
                text-white p-4 relative
            `}
        >
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                    {/* Simplified Circular Avatar */}
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden bg-white shadow-sm">
                            <img
                                src={isHuman ? "/images/support_agent.png" : "/images/smartbuild_bot.png"}
                                alt="Avatar"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm tracking-tight whitespace-nowrap">
                                {isAdmin ? 'Quản trị viên' : (isHuman ? 'Nhân viên hỗ trợ' : 'SmartBuild AI')}
                            </span>
                        </div>
                        <span className="text-[10px] text-white/70 font-medium">
                            {isAdmin ? 'Đang hoạt động' : (isHuman ? 'Đang kết nối trực tiếp' : 'Trợ lý AI sẵn sàng')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Unified Glass Control Bar */}
                    <div className="flex items-center h-9 bg-black/10 backdrop-blur-md rounded-xl border border-white/10 px-1">
                        {isHuman && onSwitchToAI && (
                            <button
                                onClick={onSwitchToAI}
                                className="px-3 h-7 text-[10px] font-bold uppercase tracking-wider text-rose-100 hover:text-white hover:bg-rose-500/20 rounded-lg transition-all"
                            >
                                Kết thúc
                            </button>
                        )}

                        {(isHuman && onSwitchToAI) && <div className="w-[1px] h-4 bg-white/10 mx-1" />}

                        <button
                            onClick={onToggleExpand}
                            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
                        >
                            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        </button>

                        <button
                            onClick={onClose}
                            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
