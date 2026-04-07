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
import { Badge } from '@/components/ui/badge'

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
            toast.success('Đã sao chép mã giới thiệu!')
        }
    }

    const handleWithdraw = async () => {
        const amountStr = withdrawForm.amount.replace(/[^\d]/g, '')
        const amount = parseInt(amountStr)
        const wallet = data?.wallet || { balance: 0 }

        if (!amount || amount < 50000) {
            toast.error('Số tiền rút tối thiểu là 50,000 VNĐ')
            return
        }
        if (amount > wallet.balance) {
            toast.error('Số dư không đủ')
            return
        }
        if (!withdrawForm.bankName || !withdrawForm.accountNumber || !withdrawForm.accountHolder) {
            toast.error('Vui lòng nhập đầy đủ thông tin ngân hàng')
            return
        }

        setWithdrawing(true)
        try {
            const res = await fetchWithAuth('/api/contractors/wallet/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    bankName: withdrawForm.bankName,
                    accountNumber: withdrawForm.accountNumber,
                    accountHolder: withdrawForm.accountHolder
                })
            })

            const result = await res.json()
            if (result.success) {
                toast.success('Yêu cầu rút tiền đã được gửi.')
                setShowWithdrawModal(false)
                setWithdrawForm({ amount: '', bankName: '', accountNumber: '', accountHolder: '' })
                queryClient.invalidateQueries({ queryKey: ['contractor-wallet'] })
            } else {
                toast.error(result.error?.message || 'Có lỗi xảy ra.')
            }
        } catch (err) {
            toast.error('Lỗi kết nối.')
        } finally {
            setWithdrawing(false)
        }
    }

    if (loading) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin opacity-40" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu tài chính...</p>
            </div>
        )
    }

    const wallet = data?.wallet || { balance: 0, totalEarned: 0, transactions: [] }

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-0">
            <Toaster position="top-right" />
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-blue-600" />
                        Ví & Tài chính
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Quản lý thu nhập hoa hồng Affiliate B2B</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowWithdrawModal(true)}
                        disabled={!wallet.balance || wallet.balance < 50000}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-30"
                    >
                        <ArrowUpRight size={18} /> Rút tiền
                    </button>
                    <button 
                        onClick={() => {
                            toast.loading('Đang làm mới...', { duration: 1000 });
                            refetch();
                        }} 
                        className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:rotate-180 shadow-sm"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Main Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Balance Card */}
                <div className="lg:col-span-2 bg-indigo-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-100 flex flex-col justify-between relative overflow-hidden group min-h-[220px]">
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-2">Số dư khả dụng</p>
                        <h2 className="text-4xl font-bold tracking-tight">{formatCurrency(wallet.balance)}</h2>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/10">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider opacity-60">Tổng đã nhận</p>
                            <p className="text-xl font-bold">{formatCurrency(wallet.totalEarned)}</p>
                        </div>
                        <div className="space-y-0.5 text-right">
                            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider opacity-60">Nhà thầu đã mời</p>
                            <p className="text-xl font-bold">{data?.totalReferrals || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Referral Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl text-blue-600 flex items-center justify-center shadow-sm">
                                <Share2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Mã giới thiệu</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Affiliate B2B</p>
                            </div>
                        </div>
                        
                        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center relative group/token shadow-inner">
                            <div className="text-2xl font-bold text-blue-600 tracking-widest uppercase">
                                {data?.referralCode || 'SMART-B2B'}
                            </div>
                            <button
                                onClick={copyReferralCode}
                                className="absolute inset-0 w-full h-full bg-blue-600 text-white rounded-xl opacity-0 group-hover/token:opacity-100 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase hover:bg-blue-700"
                            >
                                <Copy size={16} /> Sao chép
                            </button>
                        </div>
                    </div>
                    
                    <p className="text-[10px] font-bold text-slate-400 italic mt-4">
                        * Nhận <span className="text-blue-600">2.0% hoa hồng</span> trọn đời trên mọi đơn hàng từ đối tác bạn giới thiệu.
                    </p>
                </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                            <History size={20} />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-lg font-bold text-slate-900">Lịch sử giao dịch</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dòng tiền thực tế</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Thời gian</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Mô tả</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Loại</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Số tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {wallet.transactions.length > 0 ? (
                                wallet.transactions.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 transition-all">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-[11px] font-bold text-slate-500">{new Date(tx.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <span className="text-xs font-bold text-slate-700 line-clamp-1">{tx.description}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-none border-none ${tx.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {tx.type === 'COMMISSION' ? 'Hoa hồng' : tx.type === 'WITHDRAW' ? 'Rút tiền' : 'Hệ thống'}
                                            </Badge>
                                        </td>
                                        <td className={`px-6 py-4 text-right text-sm font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}đ
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-10">
                                            <History size={60} className="text-slate-300" />
                                            <p className="text-[11px] font-bold uppercase tracking-wider">Chưa có giao dịch nào</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowWithdrawModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 relative z-10">
                        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                            <h2 className="text-lg font-bold uppercase tracking-tight">Rút tiền mặt</h2>
                            <button onClick={() => setShowWithdrawModal(false)} className="text-white/60 hover:text-white transition-all"><X size={20} /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Số tiền (VNĐ)</label>
                                <input
                                    type="text"
                                    value={withdrawForm.amount}
                                    onChange={(e) => {
                                        const rawVal = e.target.value.replace(/[^\d]/g, '')
                                        const formatted = rawVal ? parseInt(rawVal).toLocaleString('vi-VN') : ''
                                        setWithdrawForm(prev => ({ ...prev, amount: formatted }))
                                    }}
                                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/10 outline-none text-2xl font-bold text-blue-600 shadow-inner"
                                    placeholder="0"
                                />
                                <p className="text-[10px] font-bold text-slate-300 italic px-1">Số dư khả dụng: {formatCurrency(wallet.balance)}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5 px-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ngân hàng thụ hưởng</label>
                                    <input
                                        type="text"
                                        value={withdrawForm.bankName}
                                        onChange={(e) => setWithdrawForm(prev => ({ ...prev, bankName: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                                        placeholder="Ví dụ: Vietcombank"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 px-1 text-left">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Số tài khoản</label>
                                        <input
                                            type="text"
                                            value={withdrawForm.accountNumber}
                                            onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-600/10 outline-none"
                                            placeholder="..."
                                        />
                                    </div>
                                    <div className="space-y-1.5 px-1 text-left">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chủ tài khoản</label>
                                        <input
                                            type="text"
                                            value={withdrawForm.accountHolder}
                                            onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountHolder: e.target.value.toUpperCase() }))}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-600/10 outline-none"
                                            placeholder="TÊN KHÔNG DẤU..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowWithdrawModal(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all"
                                >
                                    Bỏ qua
                                </button>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={withdrawing}
                                    className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all"
                                >
                                    {withdrawing ? <Loader2 size={16} className="animate-spin" /> : 'Xác nhận rút tiền'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
