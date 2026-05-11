import { X, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface GuestChatModalProps {
    onClose: () => void
    onSubmit: (e: React.FormEvent) => void
    contact: { name: string; phone: string; message: string }
    setContact: (val: any) => void
}

export default function GuestChatModal({ onClose, onSubmit, contact, setContact }: GuestChatModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full p-8 md:p-10 relative overflow-hidden animate-slide-in border border-slate-100">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-all">
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-inner">
                        <MessageSquare className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Kết nối đối tác</h3>
                    <p className="text-slate-500 text-sm font-medium">Để lại lời nhắn, nhà thầu sẽ phản hồi sớm nhất.</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                            <input
                                required
                                placeholder="Nguyễn Văn A"
                                className="w-full px-5 py-3.5 bg-slate-50 rounded-xl border border-slate-100 font-bold text-xs outline-none focus:bg-white focus:border-blue-500 transition-all"
                                value={contact.name}
                                onChange={e => setContact({ ...contact, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                            <input
                                required
                                placeholder="0901 xxx xxx"
                                className="w-full px-5 py-3.5 bg-slate-50 rounded-xl border border-slate-100 font-bold text-xs outline-none focus:bg-white focus:border-blue-500 transition-all"
                                value={contact.phone}
                                onChange={e => setContact({ ...contact, phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung trao đổi</label>
                        <textarea
                            required
                            placeholder="Mô tả sơ qua về nhu cầu của bạn..."
                            rows={3}
                            className="w-full px-5 py-3.5 bg-slate-50 rounded-xl border border-slate-100 font-bold text-xs outline-none focus:bg-white focus:border-blue-500 transition-all resize-none"
                            value={contact.message}
                            onChange={e => setContact({ ...contact, message: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 uppercase tracking-[0.15em] text-[10px] active:scale-95">
                        GỬI TIN NHẮN NGAY
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                    <Link href="/login" className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center justify-center gap-2">
                        Đăng nhập để chat trực tiếp
                    </Link>
                </div>
            </div>
        </div>
    )
}
