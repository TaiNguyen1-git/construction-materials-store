import { RotateCcw, Trash2, Loader2 } from 'lucide-react'

interface ChatConfirmModalProps {
    type: 'unsend' | 'remove'
    isProcessing: boolean
    onConfirm: () => void
    onCancel: () => void
}

export default function ChatConfirmModal({
    type,
    isProcessing,
    onConfirm,
    onCancel
}: ChatConfirmModalProps) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 max-w-[320px] w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto ${type === 'unsend' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'}`}>
                    {type === 'unsend' ? <RotateCcw size={28} /> : <Trash2 size={28} />}
                </div>
                <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
                    {type === 'unsend' ? 'Thu hồi tin nhắn?' : 'Gỡ tin nhắn?'}
                </h3>
                <p className="text-slate-500 text-center text-[11px] font-medium mb-6 leading-relaxed">
                    {type === 'unsend' 
                        ? 'Tin nhắn này sẽ bị xóa đối với tất cả mọi người trong cuộc trò chuyện.' 
                        : 'Tin nhắn này sẽ chỉ bị gỡ khỏi thiết bị của bạn.'}
                </p>
                <div className="flex flex-col gap-2">
                    <button 
                        disabled={isProcessing}
                        onClick={onConfirm}
                        className={`py-3 rounded-xl font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''} ${type === 'unsend' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-rose-500 hover:bg-rose-600'}`}
                    >
                        {isProcessing ? <Loader2 size={18} className="animate-spin" /> : 'Xác nhận'}
                    </button>
                    <button 
                        disabled={isProcessing}
                        onClick={onCancel}
                        className="py-3 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Hủy bỏ
                    </button>
                </div>
            </div>
        </div>
    )
}
