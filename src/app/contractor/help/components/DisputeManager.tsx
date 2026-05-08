import React from 'react'
import { 
    X, 
    ShieldAlert, 
    FileText, 
    Sparkles, 
    Scale, 
    ArrowRight, 
    Building2, 
    User, 
    Camera, 
    Loader2, 
    Clock, 
    History, 
    MessageCircle, 
    CheckCircle2, 
    ArrowLeft 
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface DisputeManagerProps {
    showDisputeForm: boolean
    setShowDisputeForm: (show: boolean) => void
    mediationStep: 'form' | 'suggestion' | 'escalate'
    setMediationStep: (step: 'form' | 'suggestion' | 'escalate') => void
    disputeForm: any
    setDisputeForm: (form: any) => void
    orders: any[]
    disputes: any[]
    loadingDisputes: boolean
    submittingDispute: boolean
    uploadingImage: boolean
    fileInputRef: React.RefObject<HTMLInputElement | null>
    mediationSuggestion: string
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    removeEvidence: (idx: number) => void
    handleMediationCheck: (e: React.FormEvent) => void
    handleDisputeSubmit: (e?: React.FormEvent) => void
}

export const DisputeManager: React.FC<DisputeManagerProps> = ({
    showDisputeForm,
    setShowDisputeForm,
    mediationStep,
    setMediationStep,
    disputeForm,
    setDisputeForm,
    orders,
    disputes,
    loadingDisputes,
    submittingDispute,
    uploadingImage,
    fileInputRef,
    mediationSuggestion,
    handleFileUpload,
    removeEvidence,
    handleMediationCheck,
    handleDisputeSubmit
}) => {
    return (
        <div className="space-y-10">
            {/* Dispute Actions */}
            <div className="flex justify-end">
                <button
                    onClick={() => {
                        setShowDisputeForm(!showDisputeForm)
                        if (showDisputeForm) setMediationStep('form')
                    }}
                    className={`px-8 py-3.5 ${showDisputeForm ? 'bg-slate-100 text-slate-500' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'} rounded-2xl text-sm font-bold transition-all flex items-center gap-3 active:scale-95`}
                >
                    {showDisputeForm ? <><X size={20} /> Hủy bỏ</> : <><ShieldAlert size={20} /> Tạo khiếu nại mới</>}
                </button>
            </div>

            {showDisputeForm && (
                <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-xl mb-12 animate-in slide-in-from-top-5 duration-700 overflow-hidden">
                    {/* Progress Stepper */}
                    <div className="flex items-center gap-4 mb-10 pb-8 border-b border-slate-50">
                        {[
                            { step: 'form', label: 'Thông tin sự việc', icon: FileText },
                            { step: 'suggestion', label: 'Gợi ý giải pháp AI', icon: Sparkles },
                            { step: 'escalate', label: 'Hòa giải/Phân xử', icon: Scale }
                        ].map((m, i) => (
                            <div key={m.step} className="flex items-center gap-4">
                                <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-xs font-bold transition-all duration-500 ${mediationStep === m.step ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-400'}`}>
                                    <m.icon size={18} />
                                    {m.label}
                                </div>
                                {i < 2 && <ArrowRight size={16} className="text-slate-200" />}
                            </div>
                        ))}
                    </div>

                    {mediationStep === 'form' && (
                        <form onSubmit={handleMediationCheck} className="space-y-8 animate-in fade-in duration-500">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Đơn hàng liên quan</label>
                                    <select
                                        required
                                        value={disputeForm.orderId}
                                        onChange={e => setDisputeForm({ ...disputeForm, orderId: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all"
                                    >
                                        <option value="">-- CHỌN MÃ ĐƠN HÀNG --</option>
                                        {orders.map((o: any) => (
                                            <option key={o.id} value={o.id}>#{o.orderNumber} - {o.customer?.user?.name || 'KHÁCH HÀNG'}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Đối tượng khiếu nại</label>
                                    <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setDisputeForm({ ...disputeForm, targetType: 'STORE' })}
                                            className={`flex-1 py-3 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${disputeForm.targetType === 'STORE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            <Building2 size={16} /> Nhà cung cấp
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDisputeForm({ ...disputeForm, targetType: 'CUSTOMER' })}
                                            className={`flex-1 py-3 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${disputeForm.targetType === 'CUSTOMER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            <User size={16} /> Chủ đầu tư
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Lý do khiếu nại</label>
                                <select
                                    required
                                    value={disputeForm.reason}
                                    onChange={e => setDisputeForm({ ...disputeForm, reason: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all"
                                >
                                    <option value="">-- PHÂN LOẠI TRANH CHẤP --</option>
                                    {disputeForm.targetType === 'STORE' ? (
                                        <>
                                            <option value="Vật tư kém chất lượng">CHẤT LƯỢNG VẬT TƯ KHÔNG ĐẢM BẢO</option>
                                            <option value="Giao thiếu vật tư">GIAO THIẾU SỐ LƯỢNG</option>
                                            <option value="Giao hàng chậm">CHẬM TIẾN ĐỘ GIAO HÀNG</option>
                                            <option value="Sai quy cách vật tư">SAI QUY CÁCH KỸ THUẬT</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Chủ nhà không thanh toán">CHỦ NHÀ CHẬM THANH TOÁN</option>
                                            <option value="Yêu cầu thay đổi ngoài hợp đồng">YÊU CẦU THAY ĐỔI NGOÀI PHẠM VI</option>
                                            <option value="Gây khó dễ thi công">CẢN TRỞ QUÁ TRÌNH THI CÔNG</option>
                                            <option value="Vi phạm điều khoản an toàn">VI PHẠM AN TOÀN LAO ĐỘNG</option>
                                        </>
                                    )}
                                    <option value="Khác">LÝ DO KHÁC</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Mô tả sự việc</label>
                                <textarea
                                    required
                                    value={disputeForm.description}
                                    onChange={e => setDisputeForm({ ...disputeForm, description: e.target.value })}
                                    rows={5}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 text-sm font-semibold leading-relaxed focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300"
                                    placeholder="Cung cấp dòng thời gian sự việc và đề xuất giải quyết của bạn..."
                                ></textarea>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Bằng chứng (Hình ảnh/Video)</label>
                                <div className="flex flex-wrap gap-4">
                                    {disputeForm.evidence.map((url: string, idx: number) => (
                                        <div key={idx} className="relative w-28 h-28 group">
                                            <img src={url} alt="Evidence" className="w-full h-full object-cover rounded-2xl border border-slate-100" />
                                            <button
                                                type="button"
                                                onClick={() => removeEvidence(idx)}
                                                className="absolute -top-3 -right-3 bg-slate-900 text-white rounded-xl w-8 h-8 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />

                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-28 h-28 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-300 cursor-pointer hover:bg-white hover:border-blue-400 hover:text-blue-500 transition-all ${uploadingImage ? 'animate-pulse pointer-events-none' : ''}`}
                                    >
                                        <Camera size={24} className="mb-2" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Tải lên</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-50 flex justify-end">
                                <button
                                    type="submit"
                                    className="px-10 py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95"
                                >
                                    Tiếp tục <ArrowRight size={18} />
                                </button>
                            </div>
                        </form>
                    )}

                    {mediationStep === 'suggestion' && (
                        <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                            <div className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100 space-y-6">
                                <div className="flex items-center gap-4 text-blue-600">
                                    <Sparkles size={24} />
                                    <h3 className="text-xl font-bold">SmartBuild Mediation AI Suggestions</h3>
                                </div>
                                <div className="bg-white p-8 rounded-2xl border border-blue-100 text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap shadow-sm">
                                    {mediationSuggestion}
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
                                <button
                                    onClick={() => setMediationStep('form')}
                                    className="w-full md:w-auto px-8 py-3.5 bg-slate-100 text-slate-500 rounded-2xl text-sm font-bold flex items-center justify-center gap-3 hover:bg-slate-200 transition-all"
                                >
                                    <ArrowLeft size={18} /> Quay lại sửa thông tin
                                </button>

                                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                                    <button
                                        onClick={() => setShowDisputeForm(false)}
                                        className="w-full md:w-auto px-8 py-3.5 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={18} /> Tôi đã hiểu và tự giải quyết
                                    </button>
                                    <button
                                        onClick={() => setMediationStep('escalate')}
                                        className="w-full md:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-200 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all"
                                    >
                                        Yêu cầu hòa giải <Scale size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {mediationStep === 'escalate' && (
                        <div className="text-center py-12 space-y-8 animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <Scale size={48} />
                            </div>
                            <div className="space-y-3 max-w-lg mx-auto">
                                <h3 className="text-2xl font-bold text-slate-900">Xác nhận gửi yêu cầu hòa giải?</h3>
                                <p className="text-slate-500 font-medium leading-relaxed text-sm">
                                    SmartBuild sẽ chỉ định một chuyên viên hòa giải độc lập để xem xét hồ sơ và liên hệ với các bên trong vòng 24-48h.
                                </p>
                            </div>
                            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={() => setMediationStep('suggestion')}
                                    className="w-full md:w-auto px-10 py-4 bg-slate-100 text-slate-500 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
                                >
                                    Quay lại
                                </button>
                                <button
                                    onClick={() => handleDisputeSubmit()}
                                    disabled={submittingDispute}
                                    className="w-full md:w-auto px-12 py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-200 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    {submittingDispute ? <Loader2 className="animate-spin" /> : 'Xác nhận & Gửi yêu cầu'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Historical Records */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <History size={22} className="text-blue-600" />
                        <h2 className="text-xl font-bold text-slate-900">Lịch sử khiếu nại & Hòa giải</h2>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Mã vụ việc</th>
                                    <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Đơn hàng</th>
                                    <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Loại tranh chấp</th>
                                    <th className="px-8 py-5 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                                    <th className="px-8 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loadingDisputes ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin opacity-40" />
                                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Đang tải hồ sơ...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : disputes.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="space-y-4 opacity-30">
                                                <History size={48} className="mx-auto" />
                                                <p className="text-xs font-bold uppercase tracking-widest">Chưa có lịch sử khiếu nại</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    disputes.map((dis: any) => (
                                        <tr key={dis.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-black text-blue-600">#{dis.id.slice(-8).toUpperCase()}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-bold text-slate-900">{dis.order?.orderNumber}</p>
                                                <p className="text-[10px] font-medium text-slate-400">Dự án: {dis.order?.projectName || 'Mua lẻ'}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-bold text-slate-700">{dis.reason}</p>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <Badge className={`px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-none border-none ${
                                                    dis.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' : 
                                                    dis.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 
                                                    'bg-blue-50 text-blue-600'
                                                }`}>
                                                    {dis.status}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Link 
                                                    href={`/contractor/help/disputes/${dis.id}`}
                                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                                >
                                                    Hồ sơ chi tiết
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
