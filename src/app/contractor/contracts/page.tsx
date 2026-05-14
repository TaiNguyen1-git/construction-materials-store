'use client'

/**
 * Contractor Contracts Page - Light Theme
 * Contract management for contractors
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import FormModal from '@/components/FormModal'
import { Toaster, toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import {
    Building2,
    Package,
    FileText,
    CreditCard,
    ShoppingCart,
    LogOut,
    Bell,
    Plus,
    Menu,
    X,
    Home,
    Download,
    Eye,
    Calendar,
    CheckCircle,
    Clock,
    TrendingDown,
    ShieldCheck,
    ArrowUpRight,
    Zap,
    Briefcase,
    FileLock,
    AlertCircle,
    Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/format-utils'

interface Contract {
    id: string
    contractNumber: string
    name: string
    type: string
    status: 'ACTIVE' | 'EXPIRED' | 'PENDING'
    validFrom: string
    validTo: string
    creditLimit: number
    discountPercent: number
}

export default function ContractorContractsPage() {
    const pathname = usePathname()
    const { user } = useAuth()
    const [contracts, setContracts] = useState<Contract[]>([])
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
    const [showAmendmentModal, setShowAmendmentModal] = useState(false)
    const [amendmentReason, setAmendmentReason] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const loadContracts = async () => {
            if (!user?.id) return;
            try {
                // Lấy thông tin customerId của user hiện tại
                const customerRes = await fetchWithAuth(`/api/customers?userId=${user.id}`);
                const customerData = await customerRes.json();
                const customerId = customerData.data?.data?.[0]?.id || customerData.data?.[0]?.id;

                if (customerId) {
                    const res = await fetchWithAuth(`/api/contracts?customerId=${customerId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setContracts(data);
                    }
                }
            } catch (error) {
                console.error('Lỗi tải hợp đồng:', error);
            }
        };
        loadContracts();
    }, [user?.id])

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-100 text-emerald-700'
            case 'EXPIRED': return 'bg-slate-100 text-slate-700'
            case 'PENDING': return 'bg-orange-100 text-orange-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'Hợp đồng chính thức'
            case 'EXPIRED': return 'Đã tất toán'
            case 'PENDING': return 'Đang chờ ký'
            default: return status
        }
    }

    return (
        <>
            <Toaster position="top-right" reverseOrder={false} gutter={8} toastOptions={{ duration: 5000, style: { zIndex: 9999 } }} />
            <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
                {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <FileLock className="w-8 h-8 text-blue-600" />
                        Hợp đồng & Cam kết
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Quản lý các cam kết hợp tác & Điều khoản ưu đãi B2B</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowAmendmentModal(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md active:scale-95"
                    >
                        <ShieldCheck size={16} /> Yêu cầu điều chỉnh
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 gap-8 px-1">
                <Link 
                    href="/contractor/quotes"
                    className={`pb-4 text-sm font-bold transition-all border-b-2 ${pathname === '/contractor/quotes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Báo giá & Đấu thầu
                </Link>
                <Link 
                    href="/contractor/contracts"
                    className={`pb-4 text-sm font-bold transition-all border-b-2 ${pathname === '/contractor/contracts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Quản lý Hợp đồng
                </Link>
            </div>

            {/* Contracts List */}
            <div className="grid gap-10">
                {contracts.length === 0 ? (
                    <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-24 md:p-32 text-center flex flex-col items-center justify-center space-y-8">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center">
                            <FileText size={40} className="text-slate-200" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Không có hợp đồng hiện dụng</h3>
                            <p className="text-slate-400 font-bold max-w-md mx-auto text-[10px] tracking-widest leading-relaxed uppercase opacity-60">
                                Liên hệ với chúng tôi để thiết lập khung hợp tác pháp lý & Nhận các đặc quyền tài chính dành riêng cho đối tác.
                            </p>
                        </div>
                        <Link
                            href="/contact"
                            className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-3"
                        >
                            Thiết lập hợp đồng <ArrowUpRight size={16} />
                        </Link>
                    </div>
                ) : (
                    contracts.map((contract) => {
                        const isExpired = new Date(contract.validTo) < new Date();
                        const currentStatus = isExpired ? 'EXPIRED' : contract.status;

                        return (
                            <div key={contract.id} className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col ${isExpired ? 'opacity-90' : ''}`}>
                                <div className="p-8 md:p-10">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
                                        <div className="flex items-start gap-6">
                                            <div className={`w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0 ${isExpired ? 'text-rose-600' : 'text-slate-400'}`}>
                                                <Briefcase size={28} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className={`text-xl font-bold text-slate-900 tracking-tight ${isExpired ? 'text-rose-600' : ''}`}>{contract.name}</h3>
                                                <p className="text-slate-400 font-bold tracking-widest text-[9px] uppercase">Số hợp đồng: <span className="text-slate-900">{contract.contractNumber}</span></p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm ${isExpired ? 'bg-rose-50 text-rose-600 border border-rose-100' : getStatusStyle(currentStatus)}`}>
                                            {isExpired ? <AlertCircle className="w-3 h-3" /> : (
                                                <>
                                                    {currentStatus === 'ACTIVE' && <CheckCircle className="w-3 h-3" />}
                                                    {currentStatus === 'PENDING' && <Clock className="w-3 h-3" />}
                                                </>
                                            )}
                                            {isExpired ? 'Hợp đồng đã hết hạn' : getStatusText(currentStatus)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            { label: 'Ngày hiệu lực', value: contract.validFrom, icon: Calendar, color: 'bg-slate-50 text-slate-500', border: 'border-slate-100' },
                                            { label: 'Ngày đáo hạn', value: contract.validTo, icon: Calendar, color: isExpired ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-500', border: isExpired ? 'border-rose-100' : 'border-slate-100' },
                                            { label: 'Chiết khấu B2B', value: `${contract.discountPercent}%`, icon: TrendingDown, color: isExpired ? 'bg-slate-50 text-slate-300' : 'bg-emerald-50 text-emerald-600', border: isExpired ? 'border-slate-100' : 'border-emerald-100' },
                                            { label: 'Hạn mức tín dụng', value: formatCurrency(contract.creditLimit), icon: Zap, color: isExpired ? 'bg-slate-50 text-slate-300' : 'bg-blue-50 text-blue-600', border: isExpired ? 'border-slate-100' : 'border-blue-100' }
                                        ].map((stat, i) => (
                                            <div key={i} className={`${stat.color.split(' ')[0]} rounded-2xl p-6 border ${stat.border} flex flex-col justify-between h-32 ${isExpired && i >= 2 ? 'grayscale opacity-60' : ''}`}>
                                                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest opacity-60">
                                                    <stat.icon size={12} />
                                                    {stat.label}
                                                </div>
                                                <p className={`font-bold text-xl tracking-tight uppercase tabular-nums ${stat.color.split(' ')[1]}`}>{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 px-8 py-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className={`flex items-center gap-3 font-bold text-[9px] uppercase tracking-widest ${isExpired ? 'text-rose-500' : 'text-slate-400'}`}>
                                        {isExpired ? <AlertCircle size={16} /> : <ShieldCheck size={16} className="text-emerald-500" />}
                                        {isExpired ? 'Vui lòng gia hạn để tiếp tục nhận các ưu đãi B2B' : 'Hợp đồng được bảo mật bởi giao thức SSL-256'}
                                    </div>
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <button
                                            onClick={() => setSelectedContract(contract)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white text-slate-500 px-6 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                        >
                                            <Eye size={16} /> Xem chi tiết
                                        </button>
                                        {isExpired ? (
                                            <button
                                                onClick={() => {
                                                    setAmendmentReason('Tôi muốn yêu cầu gia hạn hợp đồng ' + contract.contractNumber);
                                                    setShowAmendmentModal(true);
                                                }}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-rose-600 text-white px-8 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-500/20 no-print active:scale-95"
                                            >
                                                <Zap size={16} /> Gia hạn ngay
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => window.print()}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-md shadow-blue-500/10 no-print active:scale-95"
                                            >
                                                <Download size={16} /> Xuất file hợp đồng
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <FormModal
                isOpen={!!selectedContract}
                onClose={() => setSelectedContract(null)}
                title="Chi tiết điều khoản hợp đồng"
                size="lg"
            >
                {selectedContract && (
                    <div className="p-8 md:p-10 space-y-10">
                        {/* Modal Header */}
                        <div className="bg-slate-50 p-10 rounded-3xl text-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 shadow-sm border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -mr-32 -mt-32 blur-[60px]"></div>
                            <div className="relative z-10 space-y-1">
                                <h3 className="text-2xl font-bold tracking-tight uppercase">{selectedContract.name}</h3>
                                <p className="font-bold text-slate-400 tracking-widest uppercase text-[9px]">Mã định danh: <span className="text-slate-900">{selectedContract.contractNumber}</span></p>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border relative z-10 ${getStatusStyle(selectedContract.status)}`}>
                                {getStatusText(selectedContract.status)}
                            </span>
                        </div>

                        {/* Detailed Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest border-b-4 border-blue-600 inline-block pb-1">Thông tin pháp lý</h4>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Ngày kích hoạt', value: selectedContract.validFrom },
                                        { label: 'Thời hạn đáo hạn', value: selectedContract.validTo },
                                        { label: 'Quản lý tài khoản', value: 'Quản trị viên chiến lược' }
                                    ].map((field, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">{field.label}</span>
                                            <span className="font-bold text-slate-900 uppercase tracking-tight text-xs">{field.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest border-b-4 border-emerald-500 inline-block pb-1">Quyền lợi thương mại</h4>
                                <div className="space-y-4">
                                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 group hover:shadow-md transition-all duration-300">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-emerald-800 font-bold uppercase text-[9px] tracking-widest">Tỷ lệ chiết khấu B2B</span>
                                            <span className="text-3xl font-bold text-emerald-600 tracking-tight tabular-nums">{selectedContract.discountPercent}%</span>
                                        </div>
                                        <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-widest opacity-60 leading-relaxed italic">
                                            Giá ưu đãi áp dụng cho tất cả giao dịch mua sắm trực tuyến.
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 group hover:shadow-md transition-all duration-300">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-blue-800 font-bold uppercase text-[9px] tracking-widest">Hạn mức tín dụng</span>
                                            <span className="text-2xl font-bold text-blue-600 tracking-tight tabular-nums">{formatCurrency(selectedContract.creditLimit)}</span>
                                        </div>
                                        <p className="text-[9px] text-blue-700 font-bold uppercase tracking-widest opacity-60 leading-relaxed italic">
                                            Hạn mức tín dụng xoay vòng cho mua sắm hạ tầng tần suất cao.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Terms & Conditions Block */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest border-b-4 border-slate-900 inline-block pb-1">Điều khoản cam kết</h4>
                            <div className="bg-slate-50 p-8 rounded-3xl text-[10px] text-slate-600 space-y-4 max-h-56 overflow-y-auto custom-scrollbar font-bold uppercase tracking-widest leading-loose">
                                <p className="flex items-start gap-4"><span className="text-slate-900">01 / Chất lượng:</span> SmartBuild đảm bảo tiêu chuẩn vật tư theo đúng quy định sản xuất khu vực.</p>
                                <p className="flex items-start gap-4"><span className="text-slate-900">02 / Giá cả:</span> Định giá được giữ cố định trong suốt thời hạn hợp đồng, giảm thiểu rủi ro biến động thị trường.</p>
                                <p className="flex items-start gap-4"><span className="text-slate-900">03 / Vận chuyển:</span> Miễn phí giao hàng hỏa tốc cho các đơn hàng đạt ngưỡng tối thiểu theo quy định.</p>
                                <p className="flex items-start gap-4"><span className="text-slate-900">04 / Thanh toán:</span> Đối soát thương mại định kỳ vào ngày 5 hàng tháng. Thanh toán trễ sẽ chịu phí quá hạn.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-slate-100">
                            <button
                                onClick={() => setSelectedContract(null)}
                                className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Đóng
                            </button>
                            <button className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 group active:scale-95">
                                <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                                Xuất file bản sao chính thức
                            </button>
                        </div>
                    </div>
                )}
            </FormModal>

            {/* Amendment Request Modal */}
            <FormModal
                isOpen={showAmendmentModal}
                onClose={() => setShowAmendmentModal(false)}
                title="Yêu cầu điều chỉnh hợp đồng"
                size="md"
            >
                <div className="p-8 space-y-6">
                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                        <p className="text-xs font-semibold text-amber-700 leading-relaxed italic">
                            Các yêu cầu điều chỉnh sẽ được bộ phận pháp lý của SmartBuild xem xét trong vòng 24-48h làm việc.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Lý do điều chỉnh</label>
                            <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-600/10 outline-none transition-all appearance-none">
                                <option>Nâng hạn mức tín dụng</option>
                                <option>Thay đổi tỷ lệ chiết khấu</option>
                                <option>Gia hạn thời gian hợp đồng</option>
                                <option>Thay đổi thông tin pháp nhân</option>
                                <option>Khác...</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Chi tiết nội dung cần thay đổi</label>
                            <textarea
                                rows={5}
                                value={amendmentReason}
                                onChange={(e) => setAmendmentReason(e.target.value)}
                                placeholder="Mô tả chi tiết mong muốn của bạn..."
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-semibold italic focus:ring-2 focus:ring-blue-600/10 outline-none transition-all min-h-[120px]"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            onClick={() => setShowAmendmentModal(false)}
                            className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            onClick={async () => {
                                if (submitting || !amendmentReason) return;
                                setSubmitting(true);
                                try {
                                    const res = await fetchWithAuth('/api/contractor/contracts/request-amendment', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            contractId: contracts[0]?.id || '1',
                                            type: 'Gia hạn / Điều chỉnh',
                                            reason: amendmentReason
                                        })
                                    });

                                    if (res.ok) {
                                        toast.success('Yêu cầu điều chỉnh đã được gửi tới hệ thống!');
                                        setShowAmendmentModal(false);
                                        setAmendmentReason('');
                                    } else {
                                        toast.error('Có lỗi xảy ra khi gửi yêu cầu.');
                                    }
                                } catch (error) {
                                    toast.error('Lỗi kết nối máy chủ.');
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                            disabled={submitting || !amendmentReason}
                            className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Gửi yêu cầu'}
                        </button>
                    </div>
                </div>
            </FormModal>
        </div>
        </>
    )
}
