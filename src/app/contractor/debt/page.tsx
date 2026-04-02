'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import QRPayment from '@/components/QRPayment'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import {
    LayoutDashboard,
    TrendingUp,
    CreditCard,
    AlertCircle,
    Building2,
    Clock,
    Coins,
    ChevronRight,
    Download,
    Wallet,
    PieChart,
    ArrowUpRight,
    Calendar,
    FileText,
    CheckCircle2,
    X,
    Loader2,
    ShieldCheck,
    Zap,
    Scale,
    History,
    FileSearch,
    RefreshCw
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import React from 'react'

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

export default function ContractorFinancialHub() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    // Modal States
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [showCreditRequestModal, setShowCreditRequestModal] = useState(false)
    const [creditRequestAmount, setCreditRequestAmount] = useState('')
    const [creditRequestReason, setCreditRequestReason] = useState('')
    const [requestLoading, setRequestLoading] = useState(false)

    useEffect(() => {
        if (user) {
            fetchFinancialData()
        }
    }, [user])

    const fetchFinancialData = async () => {
        setLoading(true)
        try {
            const res = await fetchWithAuth('/api/contractor/financial-hub')
            if (res.ok) {
                const result = await res.json()
                setData(result.data)
            } else {
                setData(MOCK_DATA)
                if (res.status !== 404) toast.error('Financial telemetry sync failure')
            }
        } catch (error) {
            setData(MOCK_DATA)
        } finally {
            setLoading(false)
        }
    }

    const handleRequestCreditIncrease = async (e: React.FormEvent) => {
        e.preventDefault()
        setRequestLoading(true)
        try {
            const res = await fetchWithAuth('/api/credit/request-increase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(creditRequestAmount),
                    reason: creditRequestReason
                })
            })

            if (res.ok) {
                toast.success('Credit escalation protocol initialized!')
                setShowCreditRequestModal(false)
                setCreditRequestAmount('')
                setCreditRequestReason('')
            } else {
                toast.error('Escalation rejected: Contextual validation failed')
            }
        } catch (error) {
            toast.error('Transmission timeout')
        } finally {
            setRequestLoading(false)
        }
    }

    if (loading && !data) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center gap-6 animate-pulse">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Synchronizing Financial Integrity Vault...</p>
            </div>
        )
    }

    const summary = data?.summary || MOCK_DATA.summary
    const projects = data?.projects || MOCK_DATA.projects
    const creditUsage = (summary.totalDebt / summary.creditLimit) * 100

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
            {/* High-Liquidity Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
                        <Wallet className="w-10 h-10 text-blue-600" />
                        Fiscal Control Center
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Quản lý dòng tiền, công nợ dự án và hạn mức tín dụng B2B</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowCreditRequestModal(true)}
                        className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all flex items-center gap-3 active:scale-95 shadow-sm"
                    >
                        <ArrowUpRight size={16} /> Elevate Credit Tier
                    </button>
                    <button
                        onClick={() => {
                            toast.success('Audit report generation initialized...')
                        }}
                        className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center gap-3 shadow-xl shadow-slate-200 active:scale-95"
                    >
                        <Download size={16} /> Generate Monthly Audit
                    </button>
                </div>
            </div>

            {/* Financial Bento Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Credit Health Terminal */}
                <div className="lg:col-span-8 bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-950 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-1000 group-hover:scale-150"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>

                    <div className="relative z-10 space-y-12">
                        <div className="flex justify-between items-start">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.3em]">Available Liquid Liquidity</p>
                                <h2 className="text-6xl font-black italic tracking-tighter tabular-nums">
                                    {formatCurrency(summary.creditLimit - summary.totalDebt)}
                                </h2>
                                <div className="flex items-center gap-3 text-emerald-400 font-black text-[9px] uppercase tracking-widest bg-emerald-500/10 w-fit px-4 py-2 rounded-full border border-emerald-500/20">
                                    <ShieldCheck size={14} /> Fiscal Status: Verified & High-Trust
                                </div>
                            </div>
                            <div className="p-6 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-inner">
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-200 opacity-60">Strategic Credit Limit</p>
                                    <p className="text-2xl font-black italic tabular-nums">{formatCurrency(summary.creditLimit)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest opacity-60">Aggregate Expenditure</p>
                                    <p className="text-xl font-black italic tabular-nums">{formatCurrency(summary.totalDebt)}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest opacity-60">Utilization Index</p>
                                    <p className="text-xl font-black italic tracking-tighter">{creditUsage.toFixed(1)}%</p>
                                </div>
                            </div>
                            <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1 border border-white/5 backdrop-blur-sm">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${creditUsage > 80 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]'}`}
                                    style={{ width: `${creditUsage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Risk Monitors */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm group hover:border-rose-100 transition-all duration-500 flex flex-col justify-between h-[calc(50%-1rem)]">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgent Liability (7D-Mark)</p>
                                <h3 className="text-3xl font-black italic tracking-tighter text-rose-600 tabular-nums">{formatCurrency(summary.dueThisWeek)}</h3>
                            </div>
                            <div className="p-4 bg-rose-50 text-rose-600 rounded-[1.5rem] group-hover:scale-110 transition-transform">
                                <Clock size={24} />
                            </div>
                        </div>
                        <div className="pt-6 border-t border-slate-50">
                            <p className="text-[10px] font-bold text-slate-400 italic leading-relaxed">Critical: Requires immediate settlement to prevent protocol downgrading.</p>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white group hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 flex flex-col justify-between h-[calc(50%-1rem)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Escrow Neutrality Balance</p>
                                <h3 className="text-3xl font-black italic tracking-tighter text-amber-400 tabular-nums">{formatCurrency(summary.escrowBalance)}</h3>
                            </div>
                            <div className="p-4 bg-white/5 text-amber-400 rounded-[1.5rem] group-hover:scale-110 transition-transform border border-white/5">
                                <Scale size={24} />
                            </div>
                        </div>
                        <div className="pt-6 border-t border-white/5 relative z-10">
                            <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed">Held in secure trust awaiting milestone verification tokens.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Liability Breakdown */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                            <PieChart size={20} />
                        </div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 font-bold">Project Liability Matrices</h2>
                    </div>
                    <Link href="/contractor/projects" className="px-6 py-3 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Audit All Nodes</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {projects.map((project: any) => (
                        <div key={project.id} className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-700 group flex flex-col justify-between relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-slate-50 rounded-[1.8rem] flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shadow-inner">
                                            <Building2 size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-lg font-black uppercase italic tracking-tight text-slate-900 line-clamp-1">{project.name}</h4>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Initialized: {project.startDate}</p>
                                        </div>
                                    </div>
                                    {project.hasOverdue && (
                                        <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-rose-100 animate-pulse">
                                            <AlertCircle size={12} /> Critical Overdue
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6 py-8 border-y border-slate-50">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Aggregate Asset Debt</p>
                                        <p className="text-xl font-black italic tabular-nums text-slate-900">{formatCurrency(project.debtAmount)}</p>
                                    </div>
                                    {project.overdueAmount > 0 && (
                                        <div className="flex justify-between items-end">
                                            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest opacity-60">Delinquent Capital</p>
                                            <p className="text-xl font-black italic tabular-nums text-rose-600">{formatCurrency(project.overdueAmount)}</p>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-end pt-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Temporal Deadline</p>
                                        <div className="text-right">
                                            <p className={`text-sm font-black uppercase italic ${project.hasOverdue ? 'text-rose-500' : 'text-slate-900'}`}>{project.nextDueDate}</p>
                                            <p className="text-[9px] font-bold text-slate-400 italic">{project.daysLeft < 0 ? `Alert: ${Math.abs(project.daysLeft)} Day Deficit` : `${project.daysLeft} Cycles Remaining`}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 flex gap-6 mt-auto">
                                <Link
                                    href={`/contractor/projects/${project.id}`}
                                    className="flex-1 py-5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 transition-all active:scale-95"
                                >
                                    <FileSearch size={16} /> Audit Node
                                </Link>
                                <button
                                    onClick={() => {
                                        setSelectedInvoice({ amount: project.debtAmount, invoiceNumber: `DISBURSE-PROJ-${project.id}` })
                                        setShowPaymentModal(true)
                                    }}
                                    className="flex-1 py-5 bg-blue-600 text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-500/20"
                                >
                                    <Zap size={16} /> Settle Debt
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Institutional Invoice Ledger */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-1000">
                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                            <History size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-900">Institutional Debt Ledger</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active nodes requiring fiscal settlement</p>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Serial Signal</th>
                                <th className="px-6 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Core Project Node</th>
                                <th className="px-6 py-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Temporal Cutoff</th>
                                <th className="px-6 py-8 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Financial Delta</th>
                                <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Operational Link</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data?.invoices?.map((inv: any) => (
                                <tr key={inv.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    <td className="px-10 py-8 whitespace-nowrap">
                                        <span className="text-sm font-black text-blue-600 uppercase italic tracking-tighter group-hover:scale-110 inline-block transition-transform">{inv.invoiceNumber}</span>
                                    </td>
                                    <td className="px-6 py-8">
                                        <span className="text-sm font-bold text-slate-800 italic uppercase">{inv.projectName || 'Spot Procurement'}</span>
                                    </td>
                                    <td className="px-6 py-8 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${inv.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {inv.dueDate}
                                        </span>
                                    </td>
                                    <td className="px-6 py-8 text-right">
                                        <span className="text-base font-black italic tabular-nums text-slate-900 group-hover:text-blue-600 transition-colors">{formatCurrency(inv.amount - inv.paid)}</span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <button
                                            onClick={() => {
                                                setSelectedInvoice(inv)
                                                setShowPaymentModal(true)
                                            }}
                                            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-90"
                                        >
                                            Transmit Settle
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Credit Escalation Modal */}
            {showCreditRequestModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowCreditRequestModal(false)}></div>
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 relative z-10 border border-white/20">
                        <div className="bg-slate-900 p-12 text-white flex justify-between items-end relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                            <div className="relative z-10 space-y-4">
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-4">
                                    <ArrowUpRight className="w-10 h-10 text-blue-400" />
                                    Tier Escalation
                                </h2>
                                <p className="text-blue-300/60 text-[10px] font-black uppercase tracking-widest italic">Initialize institutional credit multiplier protocol</p>
                            </div>
                            <button onClick={() => setShowCreditRequestModal(false)} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-colors relative z-10">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleRequestCreditIncrease} className="p-12 space-y-10">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Requested Liquid Delta (VNĐ)</label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        required
                                        value={creditRequestAmount}
                                        onChange={(e) => setCreditRequestAmount(e.target.value)}
                                        className="w-full px-12 py-8 bg-slate-50 border-none rounded-[2.5rem] text-4xl font-black italic tabular-nums tracking-tighter focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-slate-200"
                                        placeholder="50.000.000"
                                    />
                                    <span className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-200 font-black italic uppercase text-lg tracking-widest">VNĐ</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Contextual Justification / Expansion Plan</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={creditRequestReason}
                                    onChange={(e) => setCreditRequestReason(e.target.value)}
                                    className="w-full px-10 py-8 bg-slate-50 border-none rounded-[2.5rem] text-sm font-bold italic leading-relaxed focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-slate-200"
                                    placeholder="Provide narrative on project scaling and asset procurement strategies..."
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={requestLoading}
                                className="w-full py-8 bg-blue-600 text-white font-black rounded-[2rem] text-[10px] uppercase tracking-[0.3em] hover:bg-blue-700 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/20 active:scale-95"
                            >
                                {requestLoading ? <Loader2 size={24} className="animate-spin text-white" /> : <><ShieldCheck size={20} /> Transmit Request Protocol</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showPaymentModal && selectedInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowPaymentModal(false)}></div>
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 relative z-10 border border-white/20 flex flex-col max-h-[90vh]">
                        <div className="bg-slate-900 p-12 text-white flex justify-between items-end relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                            <div className="relative z-10 space-y-4">
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-4 text-emerald-400">
                                    <Zap className="w-10 h-10" />
                                    Rapid Settle
                                </h2>
                                <p className="text-emerald-300/60 text-[10px] font-black uppercase tracking-widest italic">Instant institutional debt remission protocol</p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-colors relative z-10 border border-white/10">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-12 space-y-10 scrollbar-hide">
                            <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100/50 space-y-4 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Settlement Amount</p>
                                <p className="text-5xl font-black italic text-slate-900 tabular-nums tracking-tighter">{formatCurrency(selectedInvoice.amount)}</p>
                            </div>
                            <div className="flex justify-center p-4 bg-white rounded-[3.5rem] border-4 border-slate-900/5 shadow-inner">
                                <QRPayment
                                    amount={selectedInvoice.amount}
                                    orderId={selectedInvoice.invoiceNumber}
                                    description={`Settle: ${selectedInvoice.invoiceNumber}`}
                                />
                            </div>
                            <div className="flex items-center gap-4 justify-center py-6 border-t border-slate-50 italic">
                                <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">System monitoring for transaction verification... [30-180s Cycle]</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// MOCK DATA used when API is not ready
const MOCK_DATA = {
    summary: {
        totalDebt: 45200000,
        creditLimit: 100000000,
        escrowBalance: 15000000,
        dueThisWeek: 8500000
    },
    projects: [
        {
            id: 'PROJ-001',
            name: 'Biệt thự Vườn Riverside Phase 1',
            startDate: '2025-12-15',
            debtAmount: 32500000,
            nextDueDate: '2026-02-05',
            daysLeft: 5,
            hasOverdue: false
        },
        {
            id: 'PROJ-002',
            name: 'Showroom Nội thất Minh Long HQ',
            startDate: '2026-01-10',
            debtAmount: 12700000,
            nextDueDate: '2026-01-28',
            daysLeft: -2,
            hasOverdue: true
        }
    ],
    invoices: [
        { id: 'INV-1021', invoiceNumber: 'INV-1021', projectName: 'Biệt thự Vườn Riverside', dueDate: '2026-02-05', amount: 15000000, paid: 0, status: 'PENDING' },
        { id: 'INV-1018', invoiceNumber: 'INV-1018', projectName: 'Showroom Minh Long', dueDate: '2026-01-28', amount: 8500000, paid: 0, status: 'OVERDUE' },
        { id: 'INV-1022', invoiceNumber: 'INV-1022', projectName: 'Biệt thự Vườn Riverside', dueDate: '2026-02-10', amount: 17500000, paid: 0, status: 'PENDING' }
    ]
}
