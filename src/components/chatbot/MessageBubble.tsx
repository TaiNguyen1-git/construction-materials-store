'use client'

import React from 'react'
import { ShoppingCart, ExternalLink } from 'lucide-react'
import { ChatMessage, ProductRecommendation } from './types'

interface MessageBubbleProps {
    message: ChatMessage;
    isAdmin: boolean;
    onSuggestionClick: (suggestion: string, message?: ChatMessage) => void;
    isLoading: boolean;
    onImageClick?: (url: string) => void; // New prop for lightbox
    isLast?: boolean;
}

// Format time helper
const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Optimized text renderer for performance
const RenderText = React.memo(({ text }: { text: string }) => {
    const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-bold text-gray-950">{part.slice(2, -2)}</strong>;
                }

                const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                if (linkMatch) {
                    return (
                        <a
                            key={i}
                            href={linkMatch[2]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 font-bold underline hover:text-blue-900"
                        >
                            {linkMatch[1]}
                        </a>
                    );
                }

                return part;
            })}
        </>
    );
});

const StreamingText = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = React.useState('')
    const [currentIndex, setCurrentIndex] = React.useState(0)

    React.useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex])
                setCurrentIndex(prev => prev + 1)
            }, 5) // Very fast for 2026 feel
            return () => clearTimeout(timeout)
        }
    }, [currentIndex, text])

    return <RenderContent text={displayedText} />
}

const RenderContent = React.memo(({ text }: { text: string }) => {
    return (
        <>
            {text.split('\n').map((line, idx) => {
                // List items
                if (line.trim().startsWith('• ') || line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                    const content = line.replace(/^[•\-\*]\s*/, '').trim();
                    return (
                        <div key={idx} className="flex items-start gap-2 my-1.5">
                            <span className="text-blue-600 font-bold mt-1 text-base">•</span>
                            <span className="text-[15px]"><RenderText text={content} /></span>
                        </div>
                    );
                }

                // Numbered list
                const numberedMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
                if (numberedMatch) {
                    return (
                        <div key={idx} className="flex items-start gap-2 my-1.5">
                            <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {numberedMatch[1]}
                            </span>
                            <span className="text-[15px]"><RenderText text={numberedMatch[2]} /></span>
                        </div>
                    );
                }

                // Normal line
                if (line.trim()) {
                    return (
                        <div key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
                            <span className="text-[15px] leading-relaxed"><RenderText text={line} /></span>
                        </div>
                    );
                }
                return <div key={idx} className="h-2" />;
            })}
        </>
    );
});

export default function MessageBubble({
    message,
    isAdmin,
    onSuggestionClick,
    isLoading,
    onImageClick,
    isLast = false
}: MessageBubbleProps) {
    const isHelloMessage = message.userMessage === 'hello' || message.userMessage === 'admin_hello'

    return (
        <div className="space-y-4 animate-fadeIn">
            {/* User Message */}
            {(message.userMessage || message.userImage) && !isHelloMessage && (
                <div className="flex justify-end pr-2">
                    <div
                        className={`
                            max-w-[85%] p-4 rounded-3xl rounded-tr-sm shadow-xl animate-float-ultra
                            ${isAdmin
                                ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white'
                                : 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white'
                            }
                            relative overflow-hidden
                        `}
                    >
                        {/* 2026 Backlight effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 rounded-full pointer-events-none" />

                        {message.userImage && (
                            <div
                                className={`relative cursor-pointer group mb-3 rounded-2xl overflow-hidden border-2 border-white/20 shadow-inner ${isLoading && !message.botMessage ? 'animate-ambient-glow' : ''}`}
                                onClick={() => onImageClick?.(message.userImage!)}
                            >
                                <img
                                    src={message.userImage}
                                    alt="Uploaded"
                                    className="max-w-full hover:scale-105 transition-transform duration-700"
                                />

                                {/* 2026 Neural Mapping Dots (only while loading this message) */}
                                {isLoading && !message.botMessage && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-1/4 left-1/3 w-1.5 h-1.5 bg-blue-400 rounded-full animate-neural shadow-[0_0_8px_white]" />
                                        <div className="absolute top-1/2 left-2/3 w-1.5 h-1.5 bg-white rounded-full animate-neural shadow-[0_0_8px_white]" style={{ animationDelay: '0.4s' }} />
                                        <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 bg-blue-300 rounded-full animate-neural shadow-[0_0_8px_white]" style={{ animationDelay: '0.8s' }} />
                                    </div>
                                )}
                            </div>
                        )}
                        {message.userMessage && (
                            <div className="text-[15.5px] font-medium leading-relaxed relative z-10">{message.userMessage}</div>
                        )}
                        <div className="text-[10px] opacity-70 mt-2 text-right font-bold tracking-tighter uppercase relative z-10">
                            {formatTime(message.timestamp)}
                        </div>
                    </div>
                </div>
            )}

            {/* Bot Message */}
            {message.botMessage && (
                <div className="flex justify-start gap-3 pl-1">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-xl bg-white mt-1 group">
                        <img
                            src="/images/smartbuild_bot.png"
                            alt="AI"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>

                    <div className="max-w-[88%] space-y-3">
                        {/* Message bubble */}
                        <div className="glass-2026 p-5 rounded-3xl rounded-tl-sm shadow-premium relative group animate-float-ultra">
                            {/* Layered reflection */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none rounded-3xl" />

                            <div className="text-gray-900 relative z-10">
                                {isLast ? (
                                    <StreamingText text={message.botMessage} />
                                ) : (
                                    <RenderContent text={message.botMessage} />
                                )}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-widest flex justify-between items-center opacity-60">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    SmartBuild AI
                                </span>
                                <span>{formatTime(message.timestamp)}</span>
                            </div>
                        </div>

                        {/* Bento-Grid Recommendations */}
                        {message.productRecommendations && message.productRecommendations.length > 0 && (
                            <div className="pt-2">
                                <div className="text-[11px] text-blue-900 font-black uppercase tracking-[0.2em] ml-2 mb-3 flex items-center gap-2">
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                    Vật liệu đề xuất
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {message.productRecommendations.map((product: ProductRecommendation, index: number) => (
                                        <div
                                            key={index}
                                            className="glass-2026 p-4 rounded-3xl border-2 border-transparent hover:border-blue-400/30 hover:shadow-2xl transition-all cursor-pointer group animate-bento"
                                            style={{ animationDelay: `${index * 150}ms` }}
                                        >
                                            <div className="flex flex-col gap-3">
                                                <div className="flex-1">
                                                    <div className="font-bold text-gray-950 text-[15px] leading-tight group-hover:text-blue-700 transition-colors">
                                                        {product.name}
                                                    </div>
                                                    <div className="text-blue-800 font-black text-xl mt-1.5 drop-shadow-sm">
                                                        {product.price?.toLocaleString('vi-VN')}
                                                        <span className="text-xs font-bold text-gray-500 ml-0.5">đ/{product.unit}</span>
                                                    </div>
                                                </div>
                                                <button className="w-full bg-blue-600/90 hover:bg-blue-600 text-white py-2.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                                                    <ShoppingCart className="w-4 h-4" />
                                                    Thêm ngay
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1 pb-2">
                                {message.suggestions.map((suggestion: string, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => onSuggestionClick(suggestion, message)}
                                        disabled={isLoading}
                                        className={`
                                        text-[13px] px-5 py-2.5 rounded-2xl font-bold transition-all
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        bg-white border border-blue-100 text-blue-700 
                                        hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-md
                                        active:scale-95 animate-bento
                                    `}
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
