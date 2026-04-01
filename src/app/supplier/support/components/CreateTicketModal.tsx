import { Plus, X, Send } from 'lucide-react'
import { CATEGORIES, PRIORITY_CONFIG } from '../types'

interface CreateTicketModalProps {
    show: boolean
    onClose: () => void
    onSubmit: (e: React.FormEvent) => void
    formData: any
    setFormData: (data: any) => void
}

export default function CreateTicketModal({
    show, onClose, onSubmit, formData, setFormData
}: CreateTicketModalProps) {
    if (!show) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl w-full max-w-xl max-h-[95vh] md:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 md:p-6 text-white flex justify-between items-start flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-black flex items-center gap-3">
                            <Plus className="w-6 h-6" />
                            Tạo yêu cầu hỗ trợ
                        </h2>
                        <p className="text-blue-200 text-sm mt-1">Chọn danh mục phù hợp để được hỗ trợ nhanh nhất</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Category Selection */}
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Danh mục vấn đề *</label>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(CATEGORIES).map(([key, cfg]) => {
                                    const Icon = cfg.icon
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setFormData((prev: any) => ({ ...prev, category: key }))}
                                            className={`p-3 rounded-xl border text-left transition-all ${formData.category === key
                                                ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10'
                                                : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon className={`w-4 h-4 ${formData.category === key ? 'text-blue-600' : 'text-slate-400'}`} />
                                                <span className={`text-xs font-bold ${formData.category === key ? 'text-blue-700' : 'text-slate-700'}`}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 line-clamp-1">{cfg.description}</p>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Tiêu đề *</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                placeholder="Ví dụ: Sai lệch thanh toán PO-123"
                                value={formData.reason}
                                onChange={(e) => setFormData((prev: any) => ({ ...prev, reason: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Mã PO (nếu có)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="PO-XXXXX"
                                    value={formData.orderId}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, orderId: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Mức độ</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, priority: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                                        <option key={key} value={key}>{cfg.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Mô tả chi tiết *</label>
                            <textarea
                                required
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Mô tả cụ thể vấn đề bạn đang gặp..."
                                value={formData.description}
                                onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="p-5 md:p-6 bg-slate-50/50 border-t border-slate-100 flex gap-4 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 text-sm hover:bg-white hover:text-slate-700 transition-all shadow-sm"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="flex-[1.5] px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Send className="w-4 h-4" />
                            Gửi yêu cầu ngay
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
