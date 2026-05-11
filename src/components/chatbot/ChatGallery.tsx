'use client'

import React, { useMemo } from 'react'
import { X, Image as ImageIcon, FileText, Download, AlertCircle } from 'lucide-react'
import { ChatMessage } from './types'

interface ChatGalleryProps {
    messages: ChatMessage[];
    onClose: () => void;
    onImageClick: (url: string) => void;
    isGuest?: boolean;
}

export default function ChatGallery({ messages, onClose, onImageClick, isGuest }: ChatGalleryProps) {
    const files = useMemo(() => {
        const result: { id: string; url: string; type: 'image' | 'doc'; timestamp: string; isBot: boolean }[] = [];
        messages.forEach(m => {
            if (m.userImage) {
                result.push({ 
                    id: `user-${m.id}`, 
                    url: m.userImage, 
                    type: m.userImage.startsWith('data:image/') ? 'image' : 'doc', 
                    timestamp: m.timestamp,
                    isBot: false
                });
            }
            if (m.botImage) {
                result.push({ 
                    id: `bot-${m.id}`, 
                    url: m.botImage, 
                    type: m.botImage.startsWith('data:image/') ? 'image' : 'doc', 
                    timestamp: m.timestamp,
                    isBot: true
                });
            }
        });
        return result.reverse(); // Newest first
    }, [messages]);

    return (
        <div className="absolute inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">Kho Tư Liệu</h3>
                        <p className="text-[10px] text-gray-500 font-medium">{files.length} tập tin đã lưu</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Warning for Guests */}
            {isGuest && (
                <div className="m-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 items-start animate-fadeIn">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                        Lịch sử file này chỉ lưu trên trình duyệt này. Hãy <span className="font-bold underline cursor-pointer">đăng ký tài khoản</span> để đồng bộ vĩnh viễn và xem trên mọi thiết bị.
                    </p>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {files.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3 opacity-60">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-medium">Chưa có ảnh hoặc tài liệu nào</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {files.map((file) => (
                            <div 
                                key={file.id} 
                                className="aspect-square relative group cursor-pointer rounded-lg overflow-hidden border border-gray-100 shadow-sm"
                            >
                                {file.type === 'image' ? (
                                    <>
                                        <img 
                                            src={file.url} 
                                            alt="Gallery item"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onClick={() => onImageClick(file.url)}
                                        />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Download className="w-5 h-5 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <a 
                                        href={file.url} 
                                        download 
                                        className="w-full h-full flex flex-col items-center justify-center bg-blue-50 group-hover:bg-blue-100 transition-colors"
                                    >
                                        <FileText className="w-6 h-6 text-blue-600" />
                                        <span className="text-[8px] font-bold text-blue-700 mt-1">DOC</span>
                                    </a>
                                )}
                                <div className={`absolute top-1 left-1 w-2 h-2 rounded-full ${file.isBot ? 'bg-blue-500' : 'bg-indigo-500'} border border-white shadow-sm`} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
