import { Paperclip, X, FileText, Send } from 'lucide-react'
import { useRef } from 'react'
import { ChatMessage } from './types'

interface ChatInputProps {
    newMessage: string
    setNewMessage: (val: string) => void
    selectedFile: { file: File; preview: string; type: string } | null
    setSelectedFile: (val: any) => void
    replyingTo: ChatMessage | null
    setReplyingTo: (val: any) => void
    sending: boolean
    uploading: boolean
    onSendMessage: () => void
    onTyping: () => void
    formatFileSize: (bytes: number) => string
}

export default function ChatInput({
    newMessage,
    setNewMessage,
    selectedFile,
    setSelectedFile,
    replyingTo,
    setReplyingTo,
    sending,
    uploading,
    onSendMessage,
    onTyping,
    formatFileSize
}: ChatInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    return (
        <div className="bg-white border-t border-gray-100">
            {/* Reply Preview */}
            {replyingTo && (
                <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between animate-in slide-in-from-bottom duration-200">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-1 bg-blue-500 h-8 rounded-full flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Đang trả lời {replyingTo.senderName}</p>
                            <p className="text-xs text-gray-600 truncate italic">
                                {replyingTo.content || (replyingTo.fileUrl ? '📎 Tệp đính kèm' : '...')}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-blue-100 rounded-full text-blue-400 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="p-4">
                {selectedFile && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-2xl flex items-center justify-between border-2 border-dashed border-gray-200 animate-in slide-in-from-bottom duration-300">
                        <div className="flex items-center gap-3">
                            {selectedFile.type === 'image' ? (
                                <img src={selectedFile.preview} className="w-12 h-12 object-cover rounded-xl shadow-sm" />
                            ) : (
                                <div className="w-12 h-12 bg-blue-100 flex items-center justify-center rounded-xl">
                                    <FileText className="text-blue-600 w-6 h-6" />
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-black text-gray-800 max-w-[200px] truncate leading-tight mb-0.5">
                                    {selectedFile.file.name}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{formatFileSize(selectedFile.file.size)}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-[32px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-inner">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending || uploading}
                        className="p-3 text-gray-500 hover:text-blue-600 hover:bg-white rounded-full transition-all disabled:opacity-50"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const type = file.type.startsWith('image/') ? 'image' : 'file'
                            const preview = type === 'image' ? URL.createObjectURL(file) : ''
                            setSelectedFile({ file, preview, type })
                        }}
                        className="hidden"
                        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <textarea
                        value={newMessage}
                        onChange={e => {
                            setNewMessage(e.target.value)
                            onTyping()
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                onSendMessage()
                            } else {
                                onTyping()
                            }
                        }}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-gray-800 placeholder:text-gray-400 py-3 resize-none max-h-32 leading-relaxed"
                        rows={1}
                    />
                    <button
                        onClick={onSendMessage}
                        disabled={uploading || (!newMessage.trim() && !selectedFile)}
                        className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-200 active:scale-90"
                    >
                        {uploading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
