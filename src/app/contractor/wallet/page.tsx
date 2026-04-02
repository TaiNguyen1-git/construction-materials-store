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
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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
            toast.success('Protocol referral token captured to clipboard!')
        }
    }

    const handleWithdraw = async () => {
        const amount = parseInt(withdrawForm.amount.replace(/[^\d]/g, ''))
        const wallet = data?.wallet || { balance: 0 }

        if (!amount || amount < 50000) {
            toast.error('Minimum withdrawal protocol requires 50,000 VNĐ')
            return
        }
        if (amount > wallet.balance) {
            toast.error('Balance deficit: Insufficient liquidity')
            return
        }
        if (!withdrawForm.bankName || !withdrawForm.accountNumber || !withdrawForm.accountHolder) {
            toast.error('Institution credentials incomplete')
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
                toast.success('Withdrawal request initialized. Audit cycle: 24h.')
                setShowWithdrawModal(false)
                setWithdrawForm({ amount: '', bankName: '', accountNumber: '', accountHolder: '' })
                queryClient.invalidateQueries({ queryKey: ['contractor-wallet'] })
            } else {
                toast.error(result.error?.message || 'Withdrawal protocol failure')
            }
        } catch (err) {
            toast.error('Network protocol error')
        } finally {
            setWithdrawing(false)
        }
    }

    if (loading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center gap-6 animate-pulse">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Synching Financial Ledger...</p>
            </div>
        )
    }

    const wallet = data?.wallet || { balance: 0, totalEarned: 0, transactions: [] }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
            {/* High-Liquidity Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
                        <Wallet className="w-10 h-10 text-blue-600" />
                        Liquidity Center
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Ví Hoa Hồng & Quản lý thu nhập Affiliate B2B</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowWithdrawModal(true)}
                        disabled={!wallet.balance || wallet.balance < 50000}
                        className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center gap-3 shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-30"
                    >
                        <ArrowUpRight size={16} /> Disburse to Institution
                    </button>
                    <button onClick={() => refetch()} className="w-14 h-14 bg-white border border-slate-100 rounded-[1.2rem] flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:rotate-180 duration-700">
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Financial Bento Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Balance Terminal - High Impact */}
                <div className="md:col-span-12 lg:col-span-5 bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-950 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-1000 group-hover:scale-150"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                    
                    <div className="relative z-10 space-y-12">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.3em]">Current Liquid Balance</p>
                                <h2 className="text-6xl font-black italic tracking-tighter tabular-nums">{wallet.balance?.toLocaleString()}đ</h2>
                            </div>
                            <div className="p-6 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/10">
                                <DollarSign size={40} className="text-blue-200" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/10">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest opacity-60">Cumulative Earnings</p>
                                <p className="text-xl font-black italic tabular-nums">{wallet.totalEarned?.toLocaleString()}đ</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest opacity-60">Verified Referrals</p>
                                <p className="text-xl font-black italic tabular-nums">{data?.totalReferrals || 0} Entities</p>
                            </div>
                        </div>

                        <button className="w-full py-5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all backdrop-blur-sm">
                            <QrCode size={16} /> Generate Rapid Settle QR
                        </button>
                    </div>
                </div>

                {/* Affiliate Protocol Hub */}
                <div className="md:col-span-12 lg:col-span-7 grid md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 space-y-8 shadow-sm flex flex-col justify-between group hover:shadow-2xl hover:shadow-slate-200 transition-all duration-700">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                                    <Share2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase italic tracking-tight">Referral Token</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Affiliate Protocol</p>
                                </div>
                            </div>
                            
                            <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center relative group/token">
                                <div className="text-4xl font-black text-indigo-700 tracking-[0.2em] uppercase italic tabular-nums">
                                    {data?.referralCode || 'SMART-B2B'}
                                </div>
                                <button
                                    onClick={copyReferralCode}
                                    className="absolute inset-0 w-full h-full bg-indigo-600 text-white rounded-[2.5rem] opacity-0 group-hover/token:opacity-100 transition-all flex items-center justify-center gap-4 font-black text-[10px] uppercase tracking-widest"
                                >
                                    <Copy size={20} /> Capture Token
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                                * Protocol Benefit: Activate <span className="text-indigo-600 font-black">2.0% Residual Commission</span> on all future procurement phases from referred entities.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white space-y-8 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                        
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl text-indigo-400">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase italic tracking-tight">Expansion Target</h3>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Loyalty Multiplier Protocol</p>
                                </div>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic">
                                Onboard 5 additional high-volume contractors to unlock <span className="text-white font-black">Elite Tier Status</span> with <span className="text-indigo-400 font-black">3.5% Aggregate Commission</span>.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden p-1 border border-white/5">
                                <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: '60%' }} />
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                <span className="text-slate-500">Tier Progress: 03/05 Entities</span>
                                <span className="text-indigo-400">Next Tier: Elite</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction Ledger */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-1000">
                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                            <History size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase italic tracking-tight">Project Transaction Ledger</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lịch sử thu nhập & Biến động số dư</p>
                        </div>
                    </div>
                    <button className="px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Export Audit Log</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic font-black">Temporal Mark</th>
                                <th className="px-6 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic font-black">Transaction Context</th>
                                <th className="px-6 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic font-black">Protocol Type</th>
                                <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic font-black">Financial Delta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {wallet.transactions.length > 0 ? (
                                wallet.transactions.map((tx: any) => (
                                    <tr key={tx.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        <td className="px-10 py-8 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <Clock className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                <span className="text-xs font-bold text-slate-500 tabular-nums">{new Date(tx.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8">
                                            <span className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{tx.description}</span>
                                        </td>
                                        <td className="px-6 py-8">
                                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${tx.amount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {tx.amount > 0 ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                                                {tx.type === 'COMMISSION' ? 'Revenue' : tx.type === 'ESCROW_RELEASE' ? 'Escrow Release' : 'Operational'}
                                            </span>
                                        </td>
                                        <td className={`px-10 py-8 text-right text-base font-black italic tabular-nums ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}đ
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-10 py-40 text-center">
                                        <div className="flex flex-col items-center gap-6 opacity-10">
                                            <History size={80} />
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Ledger Inactivity Detected</p>
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
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowWithdrawModal(false)}></div>
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 relative z-10 border border-white/20">
                        <div className="bg-slate-900 p-12 text-white flex justify-between items-end relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                            <div className="relative z-10 space-y-4">
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-4">
                                    <Building2 className="w-8 h-8 text-blue-400" />
                                    Disbursement
                                </h2>
                                <p className="text-blue-300/60 text-[10px] font-black uppercase tracking-widest">Protocol balance: {wallet.balance?.toLocaleString()}đ</p>
                            </div>
                            <button onClick={() => setShowWithdrawModal(false)} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-colors relative z-10">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-12 space-y-8">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Requested Delta Amount (VNĐ)</label>
                                <input
                                    type="text"
                                    value={withdrawForm.amount}
                                    onChange={(e) => {
                                        const rawVal = e.target.value.replace(/[^\d]/g, '')
                                        const formatted = rawVal ? parseInt(rawVal).toLocaleString('vi-VN') : ''
                                        setWithdrawForm(prev => ({ ...prev, amount: formatted }))
                                    }}
                                    className="w-full px-10 py-6 bg-slate-50 border-none rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none text-3xl font-black italic tabular-nums tracking-tighter"
                                    placeholder="0"
                                />
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] ml-4 italic">* Operational minimum: 50,000 VNĐ</p>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Banking Institution</label>
                                    <input
                                        type="text"
                                        value={withdrawForm.bankName}
                                        onChange={(e) => setWithdrawForm(prev => ({ ...prev, bankName: e.target.value }))}
                                        className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-black italic uppercase tracking-tight"
                                        placeholder="VIETCOMBANK / MB BANK / TECHCOMBANK..."
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Account Signal</label>
                                        <input
                                            type="text"
                                            value={withdrawForm.accountNumber}
                                            onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                                            className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-black tracking-widest"
                                            placeholder="SERIAL ID..."
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Verified Principal</label>
                                        <input
                                            type="text"
                                            value={withdrawForm.accountHolder}
                                            onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountHolder: e.target.value.toUpperCase() }))}
                                            className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-black italic uppercase tracking-tight"
                                            placeholder="HOLDER NAME..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-6 pt-8">
                                <button
                                    onClick={() => setShowWithdrawModal(false)}
                                    className="flex-1 py-6 bg-slate-50 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-100 transition-all"
                                >
                                    Dismiss Protocol
                                </button>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={withdrawing}
                                    className="flex-[2] py-6 bg-blue-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-4 active:scale-95"
                                >
                                    {withdrawing ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" /> Transmitting Liquidity...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowUpRight size={20} /> Execute Disbursement
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
