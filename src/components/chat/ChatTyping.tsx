interface ChatTypingProps {
    partnerName?: string
}

export default function ChatTyping({ partnerName }: ChatTypingProps) {
    return (
        <div className="flex items-end gap-2 mb-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm overflow-hidden">
                {partnerName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
            </div>
        </div>
    )
}
