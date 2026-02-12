'use client'

interface TypingIndicatorProps {
    isAdmin: boolean;
}

export default function TypingIndicator({ isAdmin }: TypingIndicatorProps) {
    return (
        <div className="flex justify-start gap-2">
            {/* Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-gray-100 bg-white">
                <img
                    src="/images/smartbuild_bot.png"
                    alt="AI"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Typing bubble */}
            <div className={`
                glass-2026 px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-lg flex items-center gap-1.5 animate-ambient-glow
                ${isAdmin ? 'border-purple-200/50' : 'border-blue-200/50'}
            `}>
                <div
                    className={`h-1.5 w-1.5 rounded-full animate-bounce ${isAdmin ? 'bg-indigo-500' : 'bg-blue-500'}`}
                    style={{ animationDelay: '0ms', animationDuration: '1s' }}
                />
                <div
                    className={`h-1.5 w-1.5 rounded-full animate-bounce ${isAdmin ? 'bg-indigo-500' : 'bg-blue-500'}`}
                    style={{ animationDelay: '200ms', animationDuration: '1s' }}
                />
                <div
                    className={`h-1.5 w-1.5 rounded-full animate-bounce ${isAdmin ? 'bg-indigo-500' : 'bg-blue-500'}`}
                    style={{ animationDelay: '400ms', animationDuration: '1s' }}
                />
                <span className="text-[10px] font-bold ml-2 text-gray-400 uppercase tracking-widest animate-pulse">
                    AI đang soạn...
                </span>
            </div>
        </div>
    )
}
