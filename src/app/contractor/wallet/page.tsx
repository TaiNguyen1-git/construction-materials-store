'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Wallet,
    TrendingUp,
    Users,
    ArrowUpRight,
    ArrowDownLeft,
    Copy,
    CheckCircle2,
    Clock,
    Coins,
    Share2,
    X,
    Loader2,
    Building2,
    ShieldCheck,
    Zap,
    CreditCard,
    DollarSign,
    RefreshCw,
    History,
    QrCode
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

interface Transaction {
    id: string
    createdAt: string
    description: string
    type: string
    amount: number
}

interface WalletData {
    wallet: {
        balance: number
        totalEarned: number
        transactions: Transaction[]
    }
    referralCode: string
    totalReferrals: number
}

export default function ContractorWalletPage() {
    const { user, isAuthenticated } = useAuth()
    const queryClient = useQueryClient()
    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const [withdrawing, setWithdrawing] = useState(false)
    const [withdrawForm, setWithdrawForm] = useState({
        amount: '',
        bankName: '',
        accountNumber: '',
        accountHolder: ''
    })
    const router = useRouter()

    const fetchWalletData = async (): Promise<WalletData> => {
        const res = await fetchWithAuth('/api/contractors/wallet')
        if (!res.ok) throw new Error('Fetch wallet failed')
        const result = await res.json()
        return result.data
    }

    const { data, isLoading: loading, refetch } = useQuery({
        queryKey: ['contractor-wallet'],
        queryFn: fetchWalletData,
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000 
    })

    const copyReferralCode = () => {
        if (data?.referralCode) {
            navigator.clipboard.writeText(data.referralCode)
            toast.success('Đã sao chép mã giới thiệu vào bộ nhớ tạm!')
        }
    }

    const handleWithdraw = async () => {
        const amount = parseInt(withdrawForm.amount.replace(/[^\d]/g, ''))
        const wallet = data?.wallet || { balance: 0 }

        if (!amount || amount < 50000) {
            toast.error('Số tiền rút tối thiểu là 50,000 VNĐ')
            return
        }
        if (amount > wallet.balance) {
            toast.error('Số dư hiện tại không đủ để thực hiện giao dịch')
            return
        }
        if (!withdrawForm.bankName || !withdrawForm.accountNumber || !withdrawForm.accountHolder) {
            toast.error('Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng')
            return
        }

        setWithdrawing(true)
        try {
            const res = await fetchWithAuth('/api/contractors/wallet/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                    bankName: withdrawForm.bankName,
                    accountNumber: withdrawForm.accountNumber,
                    accountHolder: withdrawForm.accountHolder
                })
            })

            const result = await res.json()
            if (result.success) {
                toast.success('Yêu cầu rút tiền đã được gửi. Thời gian xử lý: 24h.')
                setShowWithdrawModal(false)
                setWithdrawForm({ amount: '', bankName: '', accountNumber: '', accountHolder: '' })
                queryClient.invalidateQueries({ queryKey: ['contractor-wallet'] })
            } else {
                toast.error(result.error?.message || 'Có lỗi xảy ra trong quá trình rút tiền.')
            }
        } catch (err) {
            toast.error('Lỗi kết nối mạng: Không thể truyền tải yêu cầu.')
        } finally {
            setWithdrawing(false)
        }
    }

    if (loading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center gap-6 animate-pulse">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Đang đồng bộ sổ cái tài chính...</p>
            </div>
        )
    }

    const wallet = data?.wallet || { balance: 0, totalEarned: 0, transactions: [] }

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-24 max-w-7xl mx-auto">
            <Toaster position="top-right" />
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-3">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-5">
                        <Wallet className="w-12 h-12 text-blue-600" />
                        Trung tâm tài chính
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] italic">Quản lý thu nhập hoa hồng & Ví Affiliate B2B</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowWithdrawModal(true)}
                        disabled={!wallet.balance || wallet.balance < 50000}
                        className="px-10 py-6 bg-blue-600 text-white rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all flex items-center gap-4 shadow-2xl shadow-blue-500/30 active:scale-95 italic group disabled:opacity-30"
                    >
                        <ArrowUpRight size={20} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" /> Rút tiền về ngân hàng
                    </button>
                    <button 
                        onClick={() => {
                            toast.loading('Đang đồng bộ dữ liệu ví...', { duration: 1500 });
                            refetch();
                        }} 
                        className="w-16 h-16 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:rotate-180 duration-700 shadow-sm"
                    >
                        <RefreshCw size={24} />
                    </button>
                </div>
            </div>

            {/* Financial Bento Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Balance Terminal - High Impact */}
                <div className="lg:col-span-12 xl:col-span-5 bg-indigo-600 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-1000 group-hover:scale-150"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                    
                    <div className="relative z-10 space-y-12">
                        <div className="flex items-center justify-between">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.3em] italic">Số dư khả dụng</p>
                                <h2 className="text-6xl font-black italic tracking-tighter tabular-nums">{formatCurrency(wallet.balance)}</h2>
                            </div>
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/10 flex items-center justify-center shadow-2xl">
                                <Coins size={40} className="text-blue-200" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-10 pt-10 border-t border-white/10">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest opacity-60 italic">Tổng thu nhập tích lũy</p>
                                <p className="text-2xl font-black italic tabular-nums">{formatCurrency(wallet.totalEarned)}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest opacity-60 italic">Đối tác đã kết nối</p>
                                <p className="text-2xl font-black italic tabular-nums">{data?.totalReferrals || 0} Đơn vị</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => toast.success('Đang khởi tạo mã định danh thanh toán...', { duration: 1500 })}
                            className="w-full py-7 bg-white/10 hover:bg-white/20 border border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all backdrop-blur-sm italic active:scale-95 shadow-xl"
                        >
                            <QrCode size={20} /> Tạo mã QR nạp tiền nhanh
                        </button>
                    </div>
                </div>

                {/* Affiliate Protocol Hub */}
                <div className="lg:col-span-12 xl:col-span-7 grid md:grid-cols-2 gap-10">
                    <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 space-y-10 shadow-sm flex flex-col justify-between group hover:shadow-2xl hover:shadow-blue-200/30 transition-all duration-700">
                        <div className="space-y-6">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                    <Share2 size={24} />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-xl font-black uppercase italic tracking-tight">Mã giới thiệu</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Chương trình Đối tác toàn cầu</p>
                                </div>
                            </div>
                            
                            <div className="p-10 bg-slate-50 border-2 border-dashed border-blue-100 rounded-[2.5rem] text-center relative group/token shadow-inner">
                                <div className="text-4xl font-black text-blue-600 tracking-[0.1em] uppercase italic tabular-nums">
                                    {data?.referralCode || 'SMART-B2B'}
                                </div>
                                <button
                                    onClick={copyReferralCode}
                                    className="absolute inset-0 w-full h-full bg-blue-600 text-white rounded-[2.5rem] opacity-0 group-hover/token:opacity-100 transition-all flex items-center justify-center gap-4 font-black text-[11px] uppercase tracking-widest italic shadow-2xl"
                                >
                                    <Copy size={24} /> Sao chép mã giới thiệu
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                                * Quyền lợi đối tác: Nhận ngay <span className="text-blue-600 font-black">2.0% Hoa hồng trọn đời</span> trên mọi đơn hàng phát sinh từ đơn vị bạn giới thiệu.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white space-y-10 flex flex-col justify-between relative overflow-hidden group shadow-2xl shadow-slate-200">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
                        
                        <div className="space-y-8">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-white/5 rounded-2xl text-blue-400 flex items-center justify-center border border-white/5">
                                    <TrendingUp size={24} />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-xl font-black uppercase italic tracking-tight leading-none">Mục tiêu tăng trưởng</h3>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Lộ trình thăng hạng đối tác</p>
                                </div>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic pr-4">
                                Kết nối thêm 5 nhà thầu mới để mở khóa <span className="text-white font-black">Hạng VIP Elite</span> với mức hoa hồng ưu đãi <span className="text-blue-400 font-black">3.5% Toàn hệ thống</span>.
                            </p>
                        </div>

                        <div className="space-y-5">
                            <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                                <div className="bg-blue-600 h-full rounded-full transition-all duration-[2000ms] shadow-[0_0_15px_rgba(37,99,235,0.5)]" style={{ width: '60%' }} />
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest italic">
                                <span className="text-slate-500">Tiến độ: 03/05 Đơn vị</span>
                                <span className="text-blue-400">Hạng kế tiếp: VIP Elite</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction Ledger */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden animate-in slide-in-from-bottom-10 duration-1000">
                <div className="p-12 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100">
                            <History size={24} />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Sổ cái giao dịch tài chính</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Lịch sử thu nhập & Biến động dòng tiền thực tế</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => toast.loading('Đang khởi tạo nhật ký giao dịch...', { duration: 1500 })}
                        className="px-8 py-5 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic shadow-sm active:scale-95"
                    >
                        Tải nhật ký kiểm toán
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-12 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Dấu mốc thời gian</th>
                                <th className="px-8 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Nội dung giao dịch</th>
                                <th className="px-8 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Loại tài khoản</th>
                                <th className="px-12 py-8 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Biến động số dư</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {wallet.transactions.length > 0 ? (
                                wallet.transactions.map((tx: any) => (
                                    <tr key={tx.id} className="group hover:bg-blue-50/30 transition-all duration-500">
                                        <td className="px-12 py-10 whitespace-nowrap">
                                            <div className="flex items-center gap-5">
                                                <Clock className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                                                <span className="text-xs font-black text-slate-500 tabular-nums italic">{new Date(tx.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-10">
                                            <span className="text-sm font-black text-slate-900 uppercase italic tracking-tighter group-hover:text-blue-600 transition-colors">{tx.description}</span>
                                        </td>
                                        <td className="px-8 py-10">
                                            <span className={`inline-flex items-center gap-3 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest italic shadow-sm ${tx.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {tx.amount > 0 ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                                {tx.type === 'COMMISSION' ? 'Hoa hồng' : tx.type === 'WITHDRAW' ? 'Rút tiền' : 'Giao dịch hệ thống'}
                                            </span>
                                        </td>
                                        <td className={`px-12 py-10 text-right text-lg font-black italic tabular-nums ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}đ
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-12 py-56 text-center">
                                        <div className="flex flex-col items-center gap-10 opacity-10">
                                            <History size={100} className="text-slate-300" />
                                            <p className="text-xs font-black uppercase tracking-[0.4em] italic">Chưa phát hiện biến động tài chính</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Institutional Disbursement Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowWithdrawModal(false)}></div>
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-500 relative z-10 border border-white/20">
                        <div className="bg-blue-600 p-12 text-white flex justify-between items-end relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                            <div className="relative z-10 space-y-4">
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-5">
                                    <Building2 className="w-10 h-10 text-indigo-200" />
                                    Yêu cầu rút tiền
                                </h2>
                                <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.3em] italic">Số dư khả dụng: {formatCurrency(wallet.balance)}</p>
                            </div>
                            <button onClick={() => setShowWithdrawModal(false)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all relative z-10 shadow-lg group">
                                <X size={24} className="group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>

                        <div className="p-12 space-y-10">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Số tiền cần rút (VNĐ)</label>
                                <input
                                    type="text"
                                    value={withdrawForm.amount}
                                    onChange={(e) => {
                                        const rawVal = e.target.value.replace(/[^\d]/g, '')
                                        const formatted = rawVal ? parseInt(rawVal).toLocaleString('vi-VN') : ''
                                        setWithdrawForm(prev => ({ ...prev, amount: formatted }))
                                    }}
                                    className="w-full px-10 py-7 bg-slate-50 border-none rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none text-4xl font-black italic tabular-nums tracking-tighter text-blue-600 shadow-inner"
                                    placeholder="0"
                                />
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] ml-4 italic">* Tối thiểu: 50,000 VNĐ</p>
                            </div>

                            <div className="grid grid-cols-1 gap-8">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Ngân hàng thụ hưởng</label>
                                    <input
                                        type="text"
                                        value={withdrawForm.bankName}
                                        onChange={(e) => setWithdrawForm(prev => ({ ...prev, bankName: e.target.value }))}
                                        className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.8rem] text-sm font-black italic uppercase tracking-widest focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                        placeholder="NHẬP TÊN NGÂN HÀNG..."
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Số tài khoản</label>
                                        <input
                                            type="text"
                                            value={withdrawForm.accountNumber}
                                            onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                                            className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.8rem] text-sm font-black tracking-widest focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                            placeholder="SỐ TÀI KHOẢN..."
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Chủ tài khoản</label>
                                        <input
                                            type="text"
                                            value={withdrawForm.accountHolder}
                                            onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountHolder: e.target.value.toUpperCase() }))}
                                            className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.8rem] text-sm font-black italic uppercase tracking-widest focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                            placeholder="TÊN CHỦ TÀI KHOẢN..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-6 pt-10">
                                <button
                                    onClick={() => setShowWithdrawModal(false)}
                                    className="flex-1 py-7 bg-slate-50 text-slate-400 rounded-[2.2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-100 transition-all italic shadow-sm"
                                >
                                    Hủy lệnh rút
                                </button>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={withdrawing}
                                    className="flex-[2] py-7 bg-blue-600 text-white rounded-[2.2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 flex items-center justify-center gap-5 active:scale-95 italic group/sub"
                                >
                                    {withdrawing ? (
                                        <>
                                            <Loader2 size={24} className="animate-spin text-white" /> Đang truyền tải yêu cầu...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowUpRight size={24} className="group-hover/sub:translate-x-2 group-hover/sub:-translate-y-2 transition-transform" /> Xác nhận lệnh rút tiền
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
