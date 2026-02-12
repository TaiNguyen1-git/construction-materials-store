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
                    ? 'bg-gradient-to-r from-indigo-700 to-indigo-600'
                    : (isHuman
                        ? 'bg-gradient-to-r from-emerald-700 to-emerald-600'
                        : 'bg-gradient-to-r from-blue-700 to-blue-600')
                }
                text-white p-4 relative shadow-lg
            `}
        >
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                    {/* Simplified Circular Avatar */}
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden bg-white shadow-md">
                            <img
                                src={isHuman ? "/images/support_agent.png" : "/images/smartbuild_bot.png"}
                                alt="Avatar"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
                    </div>
                    ...
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-base tracking-tight whitespace-nowrap">
                                {isAdmin ? 'Quản trị viên' : (isHuman ? 'Nhân viên hỗ trợ' : 'SmartBuild AI')}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[11px] text-white font-bold uppercase tracking-wider">
                                {isAdmin ? 'Trực tuyến' : (isHuman ? 'Liên hệ trực tiếp' : 'Hệ thống sẵn sàng')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Unified Glass Control Bar */}
                    <div className="flex items-center h-10 bg-black/20 backdrop-blur-md rounded-xl border border-white/20 px-1">
                        {isHuman && onSwitchToAI && (
                            <button
                                onClick={onSwitchToAI}
                                className="px-4 h-8 text-[11px] font-black uppercase tracking-wider text-rose-100 hover:text-white hover:bg-rose-500 rounded-lg transition-all"
                            >
                                Kết thúc
                            </button>
                        )}

                        {(isHuman && onSwitchToAI) && <div className="w-[1px] h-5 bg-white/20 mx-1" />}

                        <button
                            onClick={onToggleExpand}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                            title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
                        >
                            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                            title="Đóng cửa sổ"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
