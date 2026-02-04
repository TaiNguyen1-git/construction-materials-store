'use client'

import React from 'react'
import { ShoppingCart, ExternalLink } from 'lucide-react'
import { ChatMessage, ProductRecommendation } from './types'

interface MessageBubbleProps {
    message: ChatMessage;
    isAdmin: boolean;
    onSuggestionClick: (suggestion: string, message?: ChatMessage) => void;
    isLoading: boolean;
}

// Format time helper
const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Simple inline markdown renderer
const renderContent = (text: string) => {
    // Split by newlines
    return text.split('\n').map((line, idx) => {
        // Bold text
        let processed = line.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')

        // Links
        processed = processed.replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">$1</a>'
        )

        // List items
        if (line.trim().startsWith('• ') || line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const content = line.replace(/^[•\-\*]\s*/, '').trim()
            return (
                <div key={idx} className="flex items-start gap-2 my-1">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }} />
                </div>
            )
        }

        // Numbered list
        const numberedMatch = line.trim().match(/^(\d+)\.\s+(.*)/)
        if (numberedMatch) {
            return (
                <div key={idx} className="flex items-start gap-2 my-1">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {numberedMatch[1]}
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: numberedMatch[2].replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }} />
                </div>
            )
        }

        // Normal line
        if (line.trim()) {
            return (
                <div key={idx} className={idx > 0 ? 'mt-1' : ''} dangerouslySetInnerHTML={{ __html: processed }} />
            )
        }
        return <div key={idx} className="h-2" />
    })
}

export default function MessageBubble({
    message,
    isAdmin,
    onSuggestionClick,
    isLoading
}: MessageBubbleProps) {
    const isHelloMessage = message.userMessage === 'hello' || message.userMessage === 'admin_hello'

    return (
        <div className="space-y-3">
            {/* User Message - Only show if there's content */}
            {(message.userMessage || message.userImage) && !isHelloMessage && (
                <div className="flex justify-end">
                    <div
                        className={`
                            max-w-[80%] p-3 rounded-2xl rounded-tr-sm shadow-sm
                            ${isAdmin
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            }
                        `}
                    >
                        {message.userImage && (
                            <img
                                src={message.userImage}
                                alt="Uploaded"
                                className="max-w-[180px] rounded-lg mb-2"
                            />
                        )}
                        {message.userMessage && (
                            <div className="text-sm">{message.userMessage}</div>
                        )}
                        <div className="text-[10px] opacity-70 mt-1 text-right">
                            {formatTime(message.timestamp)}
                        </div>
                    </div>
                </div>
            )}

            {/* Bot Message - Only show if there's content */}
            {message.botMessage && (
                <div className="flex justify-start gap-2">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-white">
                        <img
                            src="/images/smartbuild_bot.png"
                            alt="AI"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="max-w-[85%] space-y-2">
                        {/* Message bubble */}
                        <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm">
                            <div className="text-sm text-gray-800 leading-relaxed">
                                {renderContent(message.botMessage)}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-2">
                                {formatTime(message.timestamp)}
                            </div>
                        </div>

                        {/* Product Recommendations */}
                        {message.productRecommendations && message.productRecommendations.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-xs text-gray-500 font-medium">
                                    Sản phẩm đề xuất:
                                </div>
                                {message.productRecommendations.map((product: ProductRecommendation, index: number) => (
                                    <div
                                        key={index}
                                        className="bg-blue-50 p-3 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                                    >
                                        <div className="font-semibold text-gray-900 text-sm">
                                            {product.name}
                                        </div>
                                        <div className="text-blue-600 font-bold text-sm mt-1">
                                            {product.price?.toLocaleString('vi-VN')}đ/{product.unit}
                                        </div>
                                        <button className="text-blue-600 hover:text-blue-800 text-xs mt-2 flex items-center gap-1">
                                            <ShoppingCart className="w-3 h-3" />
                                            Xem chi tiết
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {message.suggestions.map((suggestion: string, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => onSuggestionClick(suggestion, message)}
                                        disabled={isLoading}
                                        className={`
                                        text-xs px-3 py-1.5 rounded-full font-medium transition-colors
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        bg-white border border-gray-200 text-gray-700 
                                        hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700
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
