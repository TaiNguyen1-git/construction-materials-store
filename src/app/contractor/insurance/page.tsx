'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Shield, AlertTriangle, FileText, CheckCircle, Clock, Download, X, ShieldCheck, HeartPulse, Building2, Zap, ArrowUpRight, History, CreditCard, Lock } from 'lucide-react'
import FormModal from '@/components/FormModal'
import { toast } from 'react-hot-toast'

export default function ContractorInsurancePage() {
    const { user } = useAuth()
    const [viewingPolicy, setViewingPolicy] = useState<any>(null)
    const [reportingClaim, setReportingClaim] = useState<any>(null)
    const [showBuyModal, setShowBuyModal] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [buyingType, setBuyingType] = useState<string | null>(null)

    // Form state for claim
    const [claimForm, setClaimForm] = useState({
        incidentDate: '',
        description: '',
        estimatedLoss: ''
    })

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)
            setSelectedFiles([...selectedFiles, ...newFiles])
            toast.success(`Protocol: ${newFiles.length} evidence tokens registered`)
        }
    }

    const handleBuyPolicy = (type: string) => {
        setBuyingType(type)
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Initializing Institutional Contract...',
                success: 'Protocol registered successfully! Awaiting fiscal settlement.',
                error: 'Transmission Failure'
            }
        ).then(() => {
            setShowBuyModal(false)
            setBuyingType(null)
        })
    }

    const insuranceTypes = [
        {
            id: 'MATERIAL_TRANSIT',
            name: 'Material Transit Protocol',
            desc: 'Protects bulk construction assets during logistics and deployment phases.',
            price: 'From 0.1% Asset Value',
            icon: <Building2 className="w-6 h-6" />
        },
        {
            id: 'CONSTRUCTION_ALL_RISK',
            name: 'CAR Risk Mitigation (CAR)',
            desc: 'Comprehensive structural, asset, and third-party liability coverage.',
            price: 'From 0.5% Project Value',
            icon: <ShieldCheck className="w-6 h-6" />
        },
        {
            id: 'WORKERS_COMPENSATION',
            name: 'Force Integrity Protection',
            desc: 'Operational accident coverage for ground personnel and engineering teams.',
            price: '200.000 VNĐ / Unit / Year',
            icon: <HeartPulse className="w-6 h-6" />
        }
    ]

    const policies = [
        {
            id: '1',
            policyNumber: 'BH-MAT-2024-00123',
            type: 'MATERIAL_TRANSIT',
            insurer: 'PVI Institutional Insurance',
            coverage: 500000000,
            expiryDate: '2024-05-30',
            status: 'ACTIVE',
            pdfUrl: '#'
        },
        {
            id: '2',
            policyNumber: 'BH-CAR-2024-00456',
            type: 'CONSTRUCTION_ALL_RISK',
            insurer: 'Bao Viet Global',
            coverage: 2000000000,
            expiryDate: '2024-12-31',
            status: 'ACTIVE',
            pdfUrl: '#'
        }
    ]

    const handleViewContract = (policy: any) => setViewingPolicy(policy)

    const handleReportClaim = (policy: any) => {
        setReportingClaim(policy)
        setClaimForm({
            incidentDate: new Date().toISOString().split('T')[0],
            description: '',
            estimatedLoss: ''
        })
    }

    const submitClaim = () => {
        if (!claimForm.description || !claimForm.estimatedLoss) {
            toast.error('Context validation failed: Incident data incomplete')
            return
        }

        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: 'Transmitting claim protocol to underwriter...',
                success: 'Claim authorized! Reference: CLM-2024-8892',
                error: 'Submission Timeout'
            }
        ).then(() => setReportingClaim(null))
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
            {/* High-Integrity Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Shield className="w-8 h-8 text-blue-600" />
                        Bảo hiểm công trình
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Quản lý bảo hiểm công trình & Đội ngũ nhân sự thi công</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowBuyModal(true)}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md shadow-blue-500/10 active:scale-95"
                    >
                        <Zap size={18} /> Mua bảo hiểm mới
                    </button>
                </div>
            </div>

            {/* Active Coverage Grid - Bento Architecture */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {policies.map(policy => (
                    <div key={policy.id} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                        <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-xl shadow-sm">ĐANG HIỆU LỰC</div>
                        
                        <div className="flex items-start gap-4 mb-8">
                            <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors shadow-inner">
                                <Shield className="w-8 h-8 text-slate-300 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <div className="space-y-1 pt-1">
                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {policy.type === 'MATERIAL_TRANSIT' ? 'Bảo hiểm vận chuyển' : 'Bảo hiểm mọi rủi ro (CAR)'}
                                </h3>
                                <p className="text-xs font-semibold text-slate-400 tabular-nums">{policy.policyNumber}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 py-6 border-y border-slate-50">
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đơn vị bảo hiểm</p>
                                <p className="text-sm font-bold text-slate-800">{policy.insurer}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hạn mức bồi thường</p>
                                <p className="text-sm font-bold text-blue-600 tabular-nums">{policy.coverage.toLocaleString('vi-VN')} đ</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngày hết hạn</p>
                                <p className="text-sm font-bold text-slate-800 tabular-nums">{new Date(policy.expiryDate).toLocaleDateString('vi-VN')}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tình trạng phí</p>
                                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-wider pt-0.5">
                                    <CheckCircle className="w-3.5 h-3.5" /> Đã quyết toán
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={() => handleViewContract(policy)}
                                className="flex-1 py-3 bg-slate-50 text-slate-500 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                            >
                                <FileText size={16} /> Xem hợp đồng
                            </button>
                            <button
                                onClick={() => handleReportClaim(policy)}
                                className="flex-1 py-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                            >
                                <AlertTriangle size={16} /> Yêu cầu bồi thường
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Historical Incident Log */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-1000">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                            <History size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Lịch sử bồi thường</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lịch sử yêu cầu bồi thường & giám định hiện trường</p>
                        </div>
                    </div>
                </div>
                <div className="py-24 text-center flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-100">
                        <FileText className="w-8 h-8 text-slate-200" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900">Chưa có sự cố nào</h3>
                        <p className="text-[11px] font-semibold text-slate-400 max-w-[320px] mx-auto uppercase tracking-wide">Mọi rủi ro vẫn đang nằm trong tầm kiểm soát.</p>
                    </div>
                </div>
            </div>

            {/* Premium Modals */}
            <FormModal
                isOpen={showBuyModal}
                onClose={() => setShowBuyModal(false)}
                title="Initialize New Coverage Protocol"
                size="lg"
            >
                <div className="p-8 space-y-8 animate-in zoom-in duration-300">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900">Lựa chọn gói bảo hiểm</h3>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed italic">Vui lòng chọn loại hình bảo hiểm phù hợp với nhu cầu thi công của bạn.</p>
                    </div>
                    
                    <div className="grid gap-4">
                        {insuranceTypes.map(type => (
                            <div key={type.id} className="group border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 rounded-2xl p-6 transition-all cursor-pointer flex items-center gap-6 relative overflow-hidden">
                                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm border border-slate-50 transition-all group-hover:scale-105">
                                    {type.icon}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h4 className="text-base font-bold text-slate-900">{type.name}</h4>
                                    <p className="text-xs font-semibold text-slate-400 italic max-w-sm">{type.desc}</p>
                                </div>
                                <div className="text-right space-y-2 relative z-10">
                                    <p className="text-lg font-bold text-blue-600 tabular-nums">{type.price}</p>
                                    <button
                                        onClick={() => handleBuyPolicy(type.id)}
                                        disabled={buyingType === type.id}
                                        className="px-5 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-blue-600 transition-all disabled:opacity-30 active:scale-95"
                                    >
                                        {buyingType === type.id ? 'ĐANG XỬ LÝ...' : 'CHỌN MUA'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </FormModal>

            <FormModal
                isOpen={!!viewingPolicy}
                onClose={() => setViewingPolicy(null)}
                title="Operational Contract Audit"
                size="lg"
            >
                {viewingPolicy && (
                    <div className="p-8 space-y-10 animate-in zoom-in duration-300">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-8">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-slate-900">{viewingPolicy.type === 'MATERIAL_TRANSIT' ? 'Bảo hiểm vận chuyển' : 'Bảo hiểm mọi rủi ro'}</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-400 tabular-nums">{viewingPolicy.policyNumber}</span>
                                    <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">Hợp lệ</span>
                                </div>
                            </div>
                            <Shield className="w-12 h-12 text-slate-100" />
                        </div>

                        <div className="grid gap-6">
                            <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Lock size={14} className="text-blue-600" /> Các điều khoản bảo hiểm cơ bản
                                </h4>
                                <ul className="space-y-3 text-sm font-semibold text-slate-600 italic">
                                    <li className="flex items-start gap-4">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                                        Bảo vệ tài sản toàn diện đối với {viewingPolicy.type === 'MATERIAL_TRANSIT' ? 'quá trình vận chuyển vật tư từ kho đến công trình' : 'các rủi ro vật chất phát sinh trực tiếp trong quá trình thi công xây dựng'}.
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                                        Phạm vi rủi ro: Mất mát, hư hỏng do vận chuyển, hỏa hoạn, thiên tai, hoặc các tác động ngoại cảnh không lường trước được.
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                                        Mức khấu trừ: 5,000,000 VNĐ cho mỗi vụ việc được xác nhận.
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 border-t border-slate-100 pt-8">
                            <button onClick={() => setViewingPolicy(null)} className="px-8 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all">Đóng</button>
                            <button className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg">
                                <Download size={16} /> Tải file PDF
                            </button>
                        </div>
                    </div>
                )}
            </FormModal>

            <FormModal
                isOpen={!!reportingClaim}
                onClose={() => setReportingClaim(null)}
                title="Yêu cầu bồi thường bảo hiểm"
                size="md"
            >
                {reportingClaim && (
                    <div className="p-8 space-y-8 animate-in zoom-in duration-300">
                        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex items-start gap-4">
                            <AlertTriangle className="w-8 h-8 text-rose-600 flex-shrink-0" />
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Cảnh báo quan trọng</p>
                                <p className="text-xs font-semibold text-rose-700 leading-relaxed italic">Giữ nguyên hiện trường và thu thập bằng chứng hình ảnh/video rõ nét. Nhân viên giám định sẽ có mặt trong vòng 2h kể từ khi nhận yêu cầu.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Hợp đồng bảo hiểm liên kết</label>
                                <input
                                    type="text"
                                    value={`${reportingClaim.policyNumber} - ${reportingClaim.insurer}`}
                                    disabled
                                    className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-500 uppercase"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Ngày xảy ra sự cố</label>
                                    <input
                                        type="date"
                                        value={claimForm.incidentDate}
                                        onChange={(e) => setClaimForm({ ...claimForm, incidentDate: e.target.value })}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600/10 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Ước tính thiệt hại (VNĐ)</label>
                                    <input
                                        type="number"
                                        placeholder="Ví dụ: 50,000,000"
                                        value={claimForm.estimatedLoss}
                                        onChange={(e) => setClaimForm({ ...claimForm, estimatedLoss: e.target.value })}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold tabular-nums focus:ring-2 focus:ring-blue-600/10 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Mô tả sự cố chi tiết</label>
                                <textarea
                                    rows={4}
                                    placeholder="Cung cấp thông tin chi tiết về diễn biến sự cố và các thiệt hại vật chất..."
                                    value={claimForm.description}
                                    onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold italic leading-relaxed focus:ring-2 focus:ring-blue-600/10 outline-none"
                                ></textarea>
                            </div>

                            <div
                                className="border-2 border-dashed border-slate-100 rounded-2xl p-8 text-center hover:bg-slate-50 cursor-pointer transition-all group"
                                onClick={() => document.getElementById('claim-file-upload')?.click()}
                            >
                                <input
                                    type="file"
                                    id="claim-file-upload"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <div className="space-y-3">
                                    <Camera className="w-10 h-10 text-slate-200 group-hover:text-blue-600 transition-all mx-auto" />
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider group-hover:text-slate-500 transition-colors">Tải lên hình ảnh bằng chứng</p>
                                </div>

                                {selectedFiles.length > 0 && (
                                    <div className="mt-4 text-left bg-blue-50/30 p-4 rounded-xl space-y-2 border border-blue-50">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-blue-600">Đã chọn: {selectedFiles.length} file</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedFiles.map((f, i) => (
                                                <span key={i} className="px-2 py-1 bg-white border border-blue-100 rounded-lg text-[9px] font-bold text-blue-800">{f.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-8 border-t border-slate-100">
                            <button onClick={() => setReportingClaim(null)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all">Hủy bỏ</button>
                            <button onClick={submitClaim} className="flex-[2] py-3 bg-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-rose-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                                <ShieldAlert size={18} /> Gửi yêu cầu bồi thường
                            </button>
                        </div>
                    </div>
                )}
            </FormModal>
        </div>
    )
}

function Camera(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
        </svg>
    )
}

function ShieldAlert(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
        </svg>
    )
}
