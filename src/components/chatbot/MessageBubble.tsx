'use client'

import React from 'react'
import { ShoppingCart, ExternalLink, Copy, Check } from 'lucide-react'
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
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    let tableRows: string[][] = [];

    const flushTable = (keyIndex: number) => {
        if (tableRows.length > 0) {
            const dataRows = tableRows.filter(row => !row.every(cell => cell.match(/^[-\s:]+$/)));
            if (dataRows.length > 0) {
                const header = dataRows[0];
                const body = dataRows.slice(1);
                
                elements.push(
                    <div key={`table-${keyIndex}`} className="overflow-x-auto my-3 rounded-lg border border-slate-200">
                        <table className="w-full text-[13px] text-left">
                            <thead className="bg-slate-50 text-slate-700">
                                <tr>
                                    {header.map((h, i) => (
                                        <th key={i} className="px-3 py-2 font-bold border-b border-slate-200 whitespace-nowrap"><RenderText text={h} /></th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {body.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-slate-50/50 border-b border-slate-100 last:border-0 transition-colors">
                                        {row.map((cell, cIdx) => (
                                            <td key={cIdx} className="px-3 py-2 text-slate-700 whitespace-nowrap"><RenderText text={cell} /></td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }
            tableRows = [];
        }
    };

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        
        // Table detection
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            const cells = trimmed.split('|').slice(1, -1).map(s => s.trim());
            tableRows.push(cells);
            return;
        } else {
            flushTable(idx);
        }

        // List items
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.replace(/^[•\-\*]\s*/, '').trim();
            elements.push(
                <div key={idx} className="flex items-start gap-2 my-1.5">
                    <span className="text-blue-600 font-bold mt-1 text-base">•</span>
                    <span className="text-[15px]"><RenderText text={content} /></span>
                </div>
            );
            return;
        }

        // Numbered list
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numberedMatch) {
            elements.push(
                <div key={idx} className="flex items-start gap-2 my-1.5">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm">
                        {numberedMatch[1]}
                    </span>
                    <span className="text-[15px]"><RenderText text={numberedMatch[2]} /></span>
                </div>
            );
            return;
        }

        // Heading detection
        const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const textSize = level === 1 ? 'text-lg font-black text-gray-900 mt-4 mb-2' : 
                             level === 2 ? 'text-base font-bold text-gray-800 mt-3 mb-1.5' : 
                                           'text-[15px] font-bold text-blue-800 mt-2 mb-1';
            elements.push(
                <div key={idx} className={textSize}>
                    <RenderText text={headingMatch[2]} />
                </div>
            );
            return;
        }

        // Normal line
        if (trimmed) {
            elements.push(
                <div key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
                    <span className="text-[15px] leading-relaxed"><RenderText text={trimmed} /></span>
                </div>
            );
            return;
        }
        
        elements.push(<div key={idx} className="h-2" />);
    });

    flushTable(lines.length);

    return <>{elements}</>;
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
    
    const [isCopied, setIsCopied] = React.useState(false);
    const handleCopy = () => {
        if (!message.botMessage) return;
        navigator.clipboard.writeText(message.botMessage);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }

    return (
        <div className="space-y-4 animate-fadeIn group/message">
            {/* User Message */}
            {(message.userMessage || message.userImage) && !isHelloMessage && (
                <div className="flex justify-end pr-2">
                    <div
                        className={`
                            max-w-[85%] px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-sm
                            ${isAdmin
                                ? 'bg-indigo-600 text-white'
                                : 'bg-blue-600 text-white'
                            }
                            relative
                        `}
                    >

                        {message.userImage && (
                            <div className="relative mb-3">
                                {message.userImage.startsWith('data:image/') ? (
                                    <div
                                        className="cursor-pointer group rounded-xl overflow-hidden border border-white/20"
                                        onClick={() => onImageClick?.(message.userImage!)}
                                    >
                                        <img
                                            src={message.userImage}
                                            alt="Uploaded"
                                            className="max-w-full hover:opacity-90 transition-opacity duration-300"
                                        />
                                    </div>
                                ) : (
                                    <a
                                        href={message.userImage}
                                        download="document"
                                        className="flex items-center gap-3 p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors border border-white/10"
                                    >
                                        <div className="bg-white/20 p-2 rounded-lg">
                                            <span className="text-xl">📄</span>
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <p className="text-sm font-bold truncate text-white">Tài liệu đính kèm</p>
                                            <p className="text-[10px] opacity-80 uppercase text-white">Nhấn để tải về</p>
                                        </div>
                                    </a>
                                )}

                                {isLoading && !message.botMessage && (
                                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center rounded-xl">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                                    </div>
                                )}
                            </div>
                        )}
                        {message.userMessage && (
                            <div className="text-[15.5px] font-medium leading-relaxed relative z-10">{message.userMessage}</div>
                        )}
                        <div className="text-[10px] opacity-60 mt-1.5 text-right font-medium relative z-10">
                            {formatTime(message.timestamp)}
                        </div>
                    </div>
                </div>
            )}

            {/* Bot Message */}
            {message.botMessage && (
                <div className="flex justify-start gap-3 pl-1">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-white mt-1">
                        <img
                            src="/images/smartbuild_bot.png"
                            alt="AI"
                            className="w-full h-full object-cover mix-blend-multiply"
                        />
                    </div>

                    <div className="max-w-[88%] space-y-3">
                        <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-sm shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative group/bubble">
                            
                            {/* Copy Button */}
                            <button
                                onClick={handleCopy}
                                className="absolute top-2 right-2 p-1.5 opacity-0 group-hover/bubble:opacity-100 transition-opacity bg-white border border-slate-100 shadow-sm rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 z-20"
                                title="Sao chép"
                            >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            <div className="text-gray-900 relative z-10 pt-1">
                                {isLast ? (
                                    <StreamingText text={message.botMessage} />
                                ) : (
                                    <RenderContent text={message.botMessage} />
                                )}
                            </div>

                            {message.botImage && (
                                <div className="mt-4 relative">
                                    {message.botImage.startsWith('data:image/') ? (
                                        <div
                                            className="cursor-pointer group rounded-xl overflow-hidden border border-slate-200"
                                            onClick={() => onImageClick?.(message.botImage!)}
                                        >
                                            <img
                                                src={message.botImage}
                                                alt="Admin Uploaded"
                                                className="max-w-full hover:opacity-90 transition-opacity duration-300"
                                            />
                                        </div>
                                    ) : (
                                        <a
                                            href={message.botImage}
                                            download="document"
                                            className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100"
                                        >
                                            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                                <span className="text-xl">📄</span>
                                            </div>
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="text-sm font-bold truncate text-gray-900">Tài liệu phản hồi</p>
                                                <p className="text-[10px] opacity-70 uppercase text-gray-600">Nhấn để tải về</p>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            )}

                            <div className="text-[10px] text-slate-400 mt-3 font-medium flex justify-between items-center opacity-80">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
                                        text-xs px-4 py-2 rounded-xl font-semibold transition-all
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        bg-blue-50 border border-blue-100 text-blue-700 
                                        hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm
                                    `}
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
