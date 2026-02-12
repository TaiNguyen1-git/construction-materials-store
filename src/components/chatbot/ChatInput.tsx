'use client'

import { useRef } from 'react'
import { Send, Image as ImageIcon, X, Headphones } from 'lucide-react'
import toast from 'react-hot-toast'

interface ChatInputProps {
    currentMessage: string;
    setCurrentMessage: (message: string) => void;
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    isLoading: boolean;
    onSendMessage: () => void;
    isAdmin: boolean;
    onConnectSupport?: () => void;
    isHumanMode?: boolean;
}

export default function ChatInput({
    currentMessage,
    setCurrentMessage,
    selectedImage,
    setSelectedImage,
    isLoading,
    onSendMessage,
    isAdmin,
    onConnectSupport,
    isHumanMode = false
}: ChatInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSendMessage()
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 10 * 1024 * 1024) { // Allow up to 10MB but we will compress
            toast.error('Ảnh quá lớn. Hệ thống chỉ xử lý ảnh tối đa 10MB.')
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const img = new Image()
            img.onload = () => {
                // 2026 Client-side Pre-processing: Compress image to max 1200px
                const canvas = document.createElement('canvas')
                const MAX_WIDTH = 1200
                const MAX_HEIGHT = 1200
                let width = img.width
                let height = img.height

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width
                        width = MAX_WIDTH
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height
                        height = MAX_HEIGHT
                    }
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx?.drawImage(img, 0, 0, width, height)

                // Low quality for AI recognition speed (0.7 is perfect balance)
                const base64 = canvas.toDataURL('image/jpeg', 0.7)
                setSelectedImage(base64)
            }
            img.src = event.target?.result as string
        }
        reader.readAsDataURL(file)
    }

    return (
        <div className="flex-shrink-0 p-5 border-t bg-white shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
            {/* Image Preview */}
            {selectedImage && (
                <div className="mb-4 relative inline-block animate-fadeIn">
                    <img
                        src={selectedImage}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded-xl border-2 border-blue-100 shadow-md"
                    />
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 shadow-lg border-2 border-white transition-all transform hover:scale-110"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex gap-2 items-end">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                />

                <div className="flex gap-1.5 mb-0.5">
                    {/* Connect to Support Button */}
                    {!isAdmin && !isHumanMode && onConnectSupport && (
                        <button
                            onClick={onConnectSupport}
                            disabled={isLoading}
                            className="flex-shrink-0 bg-emerald-50 text-emerald-700 p-2.5 rounded-xl hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
                            title="Gặp nhân viên hỗ trợ"
                        >
                            <Headphones className="w-5 h-5" />
                        </button>
                    )}

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="flex-shrink-0 bg-gray-100 text-gray-500 p-2.5 rounded-xl hover:bg-gray-200 hover:text-gray-700 transition-all shadow-sm active:scale-95"
                        title="Đính kèm ảnh"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 min-w-0">
                    <textarea
                        rows={1}
                        value={currentMessage}
                        onChange={(e) => {
                            setCurrentMessage(e.target.value);
                            // Auto-resize logic
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onKeyDown={handleKeyPress}
                        disabled={isLoading}
                        placeholder="Hỏi tôi về vật liệu..."
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-[15px] text-gray-900 leading-snug focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none placeholder-gray-400 transition-all max-h-40 min-h-[50px] resize-none overflow-y-auto"
                    />
                </div>

                <button
                    onClick={onSendMessage}
                    disabled={isLoading || (!currentMessage.trim() && !selectedImage)}
                    className={`
                        flex-shrink-0 p-2.5 rounded-xl text-white transition-all shadow-md mb-0.5 active:scale-95
                        ${isAdmin
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }
                        disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none
                    `}
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>

            <div className="mt-2.5 text-[10px] text-gray-400 text-center font-medium lowercase tracking-wide">
                {isHumanMode ? 'Đang chat trực tiếp với nhân viên' : 'hệ thống ai tự động đang hoạt động'}
            </div>
        </div>
    )
}
