import React from 'react'
import { Sparkles, Bot, X, RefreshCw, Send, User } from 'lucide-react'
import { ChatMessage } from '../types'

interface AIAssistantWidgetProps {
    showChat: boolean
    setShowChat: (show: boolean) => void
    chatMessages: ChatMessage[]
    chatInput: string
    setChatInput: (input: string) => void
    chatLoading: boolean
    handleAIChat: () => void
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
    showChat,
    setShowChat,
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    handleAIChat
}) => {
    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
            {showChat && (
                <div className="w-[450px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-500 flex flex-col shadow-blue-200/50">
                    {/* Chat Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold tracking-tight">SmartBuild Advisor</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">Hệ thống AI đang trực tuyến</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowChat(false)} className="text-white/60 hover:text-white bg-white/10 p-2 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <p className="text-xs font-medium text-blue-50 leading-relaxed opacity-80">
                            Chuyên gia tư vấn về hạn mức tín dụng, quy trình thanh toán và rủi ro chuỗi cung ứng.
                        </p>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/20 scrollbar-hide" style={{ height: '400px' }}>
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-[2rem] p-6 shadow-sm border ${msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-none border-blue-500' 
                                    : 'bg-white text-slate-800 rounded-bl-none border-slate-100'
                                }`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        {msg.role === 'assistant' ? (
                                            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                        ) : (
                                            <User className="w-3.5 h-3.5 text-slate-300" />
                                        )}
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {msg.role === 'user' ? 'Bạn' : 'SmartBuild Assistant'}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-100 rounded-[2rem] rounded-bl-none p-6 shadow-sm flex items-center gap-5">
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Advisor đang phản hồi...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Input */}
                    <div className="p-8 border-t border-slate-100 bg-white">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Hỏi về hạn mức tín dụng hoặc giải ngân..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAIChat()}
                                className="w-full pl-6 pr-20 py-5 bg-slate-50 border-none rounded-[2rem] text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300"
                            />
                            <button
                                onClick={handleAIChat}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setShowChat(!showChat)}
                className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all active:scale-90 group relative ${showChat ? 'bg-white text-slate-600 rotate-90' : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-2'}`}
            >
                {showChat ? <X size={32} /> : (
                    <>
                        <Bot size={36} className="relative z-10" />
                        <div className="absolute inset-0 bg-blue-400 rounded-[2rem] animate-ping opacity-20 group-hover:hidden"></div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-xl flex items-center justify-center border-4 border-white shadow-lg animate-bounce">1</div>
                    </>
                )}
            </button>
        </div>
    )
}
