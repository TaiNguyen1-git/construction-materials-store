import { ArrowLeft, Clock, Package, MessageCircle, Send } from 'lucide-react'
import { SupplierTicket, STATUS_CONFIG, CATEGORIES, PRIORITY_CONFIG } from '../types'

interface TicketDetailViewProps {
    selectedTicket: SupplierTicket
    setSelectedTicket: (ticket: SupplierTicket | null) => void
    formatRelative: (date: string) => string
    newComment: string
    setNewComment: (comment: string) => void
    sendComment: () => void
    sending: boolean
}

export default function TicketDetailView({
    selectedTicket, setSelectedTicket, formatRelative, newComment, setNewComment, sendComment, sending
}: TicketDetailViewProps) {
    const statusCfg = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.OPEN
    const categoryCfg = CATEGORIES[selectedTicket.category || 'GENERAL'] || CATEGORIES.GENERAL
    const CategoryIcon = categoryCfg.icon

    return (
        <div className="space-y-6 pb-20">
            <button
                onClick={() => setSelectedTicket(null)}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Quay lại danh sách
            </button>

            {/* Ticket Header */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${statusCfg.color}`}>
                                {statusCfg.label}
                            </span>
                            {selectedTicket.priority && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_CONFIG[selectedTicket.priority]?.color}`}>
                                    {PRIORITY_CONFIG[selectedTicket.priority]?.label}
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-1">{selectedTicket.reason}</h2>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                                <CategoryIcon className="w-3.5 h-3.5" />
                                {categoryCfg.label}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatRelative(selectedTicket.createdAt)}
                            </span>
                            {selectedTicket.orderId && (
                                <span className="flex items-center gap-1 text-blue-600 font-bold">
                                    <Package className="w-3.5 h-3.5" />
                                    PO: {selectedTicket.orderId}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
            </div>

            {/* Conversation */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Trao đổi ({selectedTicket.comments?.length || 0})
                    </h3>
                </div>

                <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                    {selectedTicket.comments?.map((comment) => (
                        <div
                            key={comment.id}
                            className={`flex ${comment.senderType === 'SUPPLIER' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[75%] rounded-2xl p-4 ${comment.senderType === 'SUPPLIER'
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-white border border-slate-200 rounded-bl-md shadow-sm'
                                }`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold ${comment.senderType === 'SUPPLIER' ? 'text-blue-200' : 'text-slate-400'}`}>
                                        {comment.senderName || (comment.senderType === 'SUPPLIER' ? 'Bạn' : 'Admin')}
                                    </span>
                                    <span className={`text-[10px] ${comment.senderType === 'SUPPLIER' ? 'text-blue-300' : 'text-slate-300'}`}>
                                        {formatRelative(comment.createdAt)}
                                    </span>
                                </div>
                                <p className={`text-sm whitespace-pre-wrap ${comment.senderType === 'SUPPLIER' ? 'text-white' : 'text-slate-700'}`}>
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    ))}

                    {(!selectedTicket.comments || selectedTicket.comments.length === 0) && (
                        <div className="text-center py-8 text-slate-400">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Chưa có trao đổi</p>
                        </div>
                    )}
                </div>

                {/* Reply */}
                {selectedTicket.status !== 'CLOSED' && (
                    <div className="p-4 border-t border-slate-100 bg-white">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Nhập phản hồi cho Admin..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendComment()}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <button
                                onClick={sendComment}
                                disabled={sending || !newComment.trim()}
                                className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                                {sending ? '...' : 'Gửi'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
