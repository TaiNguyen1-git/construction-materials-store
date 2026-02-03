'use client'

import { useRef } from 'react'
import { Send, Image as ImageIcon, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface ChatInputProps {
    currentMessage: string;
    setCurrentMessage: (message: string) => void;
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    isLoading: boolean;
    onSendMessage: () => void;
    isAdmin: boolean;
}

export default function ChatInput({
    currentMessage,
    setCurrentMessage,
    selectedImage,
    setSelectedImage,
    isLoading,
    onSendMessage,
    isAdmin
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

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.')
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const base64 = event.target?.result as string
            setSelectedImage(base64)
        }
        reader.readAsDataURL(file)
    }

    return (
        <div className="flex-shrink-0 p-4 border-t bg-white">
            {/* Image Preview */}
            {selectedImage && (
                <div className="mb-3 relative inline-block">
                    <img
                        src={selectedImage}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded-lg border shadow-sm"
                    />
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            <div className="flex gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex-shrink-0 bg-gray-50 text-gray-400 p-2.5 rounded-xl hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    title="Đính kèm ảnh"
                >
                    <ImageIcon className="w-5 h-5" />
                </button>

                <div className="flex-1">
                    <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={isLoading}
                        placeholder="Nhập tin nhắn..."
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none placeholder-gray-400"
                    />
                </div>

                <button
                    onClick={onSendMessage}
                    disabled={isLoading || (!currentMessage.trim() && !selectedImage)}
                    className={`
                        flex-shrink-0 p-2.5 rounded-xl text-white transition-all
                        ${isAdmin
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }
                        disabled:bg-gray-200 disabled:text-gray-400
                    `}
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>

            <div className="mt-2 text-[10px] text-gray-400 text-center">
                AI hỗ trợ tư vấn vật liệu & đơn hàng 24/7
            </div>
        </div>
    )
}
