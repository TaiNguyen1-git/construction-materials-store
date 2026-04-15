'use client'

import { useRef, useEffect } from 'react'
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
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Reset height when message is cleared
    useEffect(() => {
        if (currentMessage === '' && textareaRef.current) {
            textareaRef.current.style.height = ''
        }
    }, [currentMessage])

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
            const result = event.target?.result as string;

            // If it's an image, compress it with Canvas
            if (file.type.startsWith('image/')) {
                const img = new Image()
                img.onload = () => {
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

                    const base64 = canvas.toDataURL(file.type, 0.7)
                    setSelectedImage(base64) // We misuse selectedImage for general file Base64
                }
                img.src = result
            } else {
                // For PDFs and other documents, just use raw Base64
                setSelectedImage(result)
            }
        }
        reader.readAsDataURL(file)
    }

    return (
        <div className="flex-shrink-0 p-4 border-t border-neutral-200 bg-white">
            {/* Image Preview */}
            {selectedImage && (
                <div className="mb-3 relative inline-block animate-fadeIn">
                    {selectedImage.startsWith('data:image/') ? (
                        <img
                            src={selectedImage}
                            alt="Preview"
                            className="h-20 w-20 object-cover rounded-xl border border-neutral-200 shadow-sm"
                        />
                    ) : (
                        <div className="h-20 w-20 flex flex-col items-center justify-center bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
                            <span className="text-xl">📄</span>
                            <span className="text-[10px] font-bold text-blue-700 mt-1">Tài liệu</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 shadow-md transition-all transform hover:scale-110"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            <div className="flex gap-2 items-end">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleFileUpload}
                />

                <div className="flex gap-1.5 mb-0.5">
                    {/* Connect to Support Button */}
                    {!isAdmin && !isHumanMode && onConnectSupport && (
                        <button
                            onClick={onConnectSupport}
                            disabled={isLoading}
                            className="flex-shrink-0 text-neutral-400 p-2.5 rounded-xl hover:bg-neutral-100 hover:text-neutral-700 transition-all active:scale-95"
                            title="Gặp nhân viên hỗ trợ"
                        >
                            <Headphones className="w-5 h-5" />
                        </button>
                    )}

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="flex-shrink-0 text-neutral-400 p-2.5 rounded-xl hover:bg-neutral-100 hover:text-neutral-700 transition-all active:scale-95"
                        title="Đính kèm ảnh"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 min-w-0">
                    <textarea
                        ref={textareaRef}
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
                        placeholder="Message..."
                        className="w-full bg-neutral-100/50 border border-transparent rounded-xl px-4 py-3 text-sm text-neutral-900 leading-snug focus:bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none placeholder-neutral-400 transition-all max-h-40 min-h-[46px] resize-none overflow-y-auto"
                    />
                </div>

                <button
                    onClick={onSendMessage}
                    disabled={isLoading || (!currentMessage.trim() && !selectedImage)}
                    className={`
                        flex-shrink-0 p-2.5 rounded-xl text-white transition-all shadow-sm mb-0.5 active:scale-95
                        ${isAdmin ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}
                        disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none
                    `}
                >
                    <Send className="w-4 h-4 ml-0.5" />
                </button>
            </div>

            <div className="mt-3 text-[11px] text-neutral-400 text-center font-medium">
                {isHumanMode ? 'Đang chat trực tiếp với nhân viên' : 'AI có thể phản hồi không chính xác. Xin vui lòng kiểm tra thông tin bổ sung.'}
            </div>
        </div>
    )
}
