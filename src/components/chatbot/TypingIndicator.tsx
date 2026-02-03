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
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm flex items-center gap-1">
                <div
                    className={`h-1.5 w-1.5 rounded-full animate-bounce ${isAdmin ? 'bg-purple-400' : 'bg-blue-400'}`}
                    style={{ animationDelay: '0ms' }}
                />
                <div
                    className={`h-1.5 w-1.5 rounded-full animate-bounce ${isAdmin ? 'bg-purple-400' : 'bg-blue-400'}`}
                    style={{ animationDelay: '150ms' }}
                />
                <div
                    className={`h-1.5 w-1.5 rounded-full animate-bounce ${isAdmin ? 'bg-purple-400' : 'bg-blue-400'}`}
                    style={{ animationDelay: '300ms' }}
                />
            </div>
        </div>
    )
}
