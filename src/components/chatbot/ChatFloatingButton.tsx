import React from 'react';
import { Sparkles } from 'lucide-react';
import { ChatMode } from './types';

interface ChatFloatingButtonProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isAdmin: boolean;
    chatMode: ChatMode;
}

export const ChatFloatingButton: React.FC<ChatFloatingButtonProps> = ({
    isOpen,
    setIsOpen,
    isAdmin,
    chatMode
}) => {
    if (isOpen) return null;

    return (
        <button
            onClick={() => setIsOpen(true)}
            className={`
                fixed bottom-6 right-6 z-50 group
                w-16 h-16 rounded-full
                bg-white border-2 border-gray-100
                shadow-xl hover:shadow-2xl
                transition-all duration-300
                hover:scale-110 active:scale-95
                overflow-hidden
            `}
            aria-label="Mở chat hỗ trợ"
        >
            {/* Glow effect */}
            <div className={`
                absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
                ${isAdmin
                    ? 'bg-gradient-to-r from-purple-400/30 to-blue-400/30'
                    : 'bg-gradient-to-r from-blue-400/30 to-cyan-400/30'
                }
            `} />

            {/* Pulse ring */}
            <div className={`
                absolute inset-0 rounded-full animate-ping opacity-25
                ${isAdmin ? 'bg-purple-500' : (chatMode === 'HUMAN' ? 'bg-green-500' : 'bg-blue-500')}
            `} style={{ animationDuration: '2s' }} />

            {/* Avatar */}
            <img
                src={chatMode === 'HUMAN' ? "/images/support_agent.png" : "/images/smartbuild_bot.png"}
                alt="Chatbot"
                className="w-full h-full object-cover relative z-10"
            />

            {/* Online badge */}
            <div className="absolute -top-1 -right-1 z-20">
                <div className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white" />
                </div>
            </div>

            {/* Sparkle icon */}
            <div className={`
                absolute bottom-0 right-0 z-20
                w-6 h-6 rounded-full flex items-center justify-center
                ${isAdmin
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                }
                shadow-lg
            `}>
                <Sparkles className="w-3 h-3 text-white" />
            </div>
        </button>
    );
};
