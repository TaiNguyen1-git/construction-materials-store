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
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                    : (isHuman
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
                        : 'bg-gradient-to-r from-blue-600 to-blue-500')
                }
                text-white p-4 
            `}
        >
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-10 h-10 bg-white rounded-full overflow-hidden border-2 border-white/30 shadow-md">
                            <img
                                src={isHuman ? "/images/support_agent.png" : "/images/smartbuild_bot.png"}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Online indicator */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                    </div>

                    <div>
                        <div className="font-bold text-base flex items-center gap-2">
                            {isAdmin
                                ? 'SmartBuild Admin'
                                : (isHuman ? 'Nhân viên hỗ trợ' : 'SmartBuild AI')}
                            <span className={`
                                inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold
                                ${isAdmin ? 'bg-purple-500/30' : (isHuman ? 'bg-emerald-800/30' : 'bg-blue-400/30')}
                            `}>
                                {isAdmin ? '🎯 Pro' : (isHuman ? '👨‍💼 Support' : '✨ AI')}
                            </span>
                        </div>
                        <div className="text-xs text-white/80">
                            {isAdmin
                                ? 'Trợ lý quản trị hệ thống'
                                : (isHuman ? 'Đang kết nối trực tiếp' : 'Trợ lý vật liệu thông minh')
                            }
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* End Chat Button (Human Mode) */}
                    {isHuman && onSwitchToAI && (
                        <button
                            onClick={onSwitchToAI}
                            className="bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg mr-2 transition-colors uppercase tracking-wider"
                        >
                            Kết thúc
                        </button>
                    )}

                    {/* Expand/Collapse button */}
                    <button
                        onClick={onToggleExpand}
                        className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                        title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
                    >
                        {isExpanded ? (
                            <Minimize2 className="w-4 h-4" />
                        ) : (
                            <Maximize2 className="w-4 h-4" />
                        )}
                    </button>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
