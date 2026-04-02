'use client'

/**
 * Contractor Contracts Page - Light Theme
 * Contract management for contractors
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import FormModal from '@/components/FormModal'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
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
    FileLock
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
    const { user } = useAuth()
    const [contracts, setContracts] = useState<Contract[]>([])
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

    useEffect(() => {
        setContracts([
            {
                id: '1',
                contractNumber: 'HD-CONTRACTOR-001',
                name: 'Strategic Infrastructure Provider Agreement 2025',
                type: 'DISCOUNT',
                status: 'ACTIVE',
                validFrom: '2025-01-01',
                validTo: '2025-12-31',
                creditLimit: 150000000,
                discountPercent: 15
            },
        ])
    }, [])

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
            case 'ACTIVE': return 'Legally Binding'
            case 'EXPIRED': return 'Terminated'
            case 'PENDING': return 'Await Signature'
            default: return status
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
                        <FileLock className="w-10 h-10 text-blue-600" />
                        Legal Agreements
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Quản lý các cam kết hợp tác & Điều khoản ưu đãi B2B</p>
                </div>

                <div className="flex items-center gap-4">
                    <button className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center gap-3 shadow-xl shadow-slate-200">
                        <ShieldCheck size={16} /> Request Amendment
                    </button>
                </div>
            </div>

            {/* Contracts List */}
            <div className="grid gap-10">
                {contracts.length === 0 ? (
                    <div className="bg-white rounded-[4rem] border-[3px] border-dashed border-slate-100 p-32 text-center flex flex-col items-center justify-center space-y-10">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center">
                            <FileText size={48} className="text-slate-100" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">No Active Protocols</h3>
                            <p className="text-slate-400 font-bold max-w-md mx-auto uppercase text-[10px] tracking-[0.2em] leading-relaxed">
                                Liên hệ với chúng tôi để thiết lập khung hợp tác pháp lý & Nhận các đặc quyền tài chính dành riêng cho đối tác.
                            </p>
                        </div>
                        <Link
                            href="/contact"
                            className="bg-blue-600 text-white px-12 py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 active:scale-95 flex items-center gap-4"
                        >
                            Initiate Agreement <ArrowUpRight size={16} />
                        </Link>
                    </div>
                ) : (
                    contracts.map((contract) => (
                        <div key={contract.id} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-700 flex flex-col">
                            <div className="p-12">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-12">
                                    <div className="flex items-start gap-8">
                                        <div className="w-20 h-20 bg-slate-50 group-hover:bg-blue-600 group-hover:text-white rounded-[2rem] flex items-center justify-center flex-shrink-0 transition-all duration-700 shadow-inner group-hover:shadow-blue-500/50">
                                            <Briefcase size={32} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter group-hover:text-blue-600 transition-colors">{contract.name}</h3>
                                            <p className="text-slate-400 font-black tracking-[0.25em] text-[10px] uppercase">Ref: <span className="text-slate-900">{contract.contractNumber}</span></p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm transition-all duration-500 ${getStatusStyle(contract.status)}`}>
                                        {contract.status === 'ACTIVE' && <CheckCircle className="w-3.5 h-3.5" />}
                                        {contract.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                                        {getStatusText(contract.status)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                    {[
                                        { label: 'Effective Date', value: contract.validFrom, icon: Calendar, color: 'bg-slate-50 text-slate-400' },
                                        { label: 'Termination', value: contract.validTo, icon: Calendar, color: 'bg-slate-50 text-slate-400' },
                                        { label: 'B2B Leverage', value: `${contract.discountPercent}%`, icon: TrendingDown, color: 'bg-emerald-50 text-emerald-600' },
                                        { label: 'Credit Capacity', value: formatCurrency(contract.creditLimit), icon: Zap, color: 'bg-blue-50 text-blue-600' }
                                    ].map((stat, i) => (
                                        <div key={i} className={`${stat.color.split(' ')[0]} rounded-[2rem] p-8 border border-black/5 flex flex-col justify-between h-40 group/stat hover:scale-105 transition-all duration-500`}>
                                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                                                <stat.icon size={14} />
                                                {stat.label}
                                            </div>
                                            <p className={`font-black text-2xl italic tracking-tighter uppercase tabular-nums ${stat.color.split(' ')[1]}`}>{stat.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-50/50 px-12 py-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest italic group-hover:text-slate-600 transition-colors">
                                    <ShieldCheck size={18} className="text-emerald-500" />
                                    Hợp đồng được bảo mật bởi giao thức SSL-256
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <button
                                        onClick={() => setSelectedContract(contract)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-4 bg-white text-slate-900 px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest border border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
                                    >
                                        <Eye size={18} /> Review Protocol
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-4 bg-blue-600 text-white px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/10 no-print active:scale-95"
                                    >
                                        <Download size={18} /> Export Vault
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <FormModal
                isOpen={!!selectedContract}
                onClose={() => setSelectedContract(null)}
                title="Contractual Protocol"
                size="lg"
            >
                {selectedContract && (
                    <div className="p-12 space-y-12">
                        {/* Modal Header */}
                        <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-10 shadow-2xl shadow-slate-900/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
                            <div className="relative z-10 space-y-2">
                                <h3 className="text-4xl font-black italic tracking-tighter uppercase">{selectedContract.name}</h3>
                                <p className="font-black text-slate-500 tracking-[0.3em] uppercase text-[10px]">Reference Identification: <span className="text-white">{selectedContract.contractNumber}</span></p>
                            </div>
                            <span className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-white relative z-10 ${getStatusStyle(selectedContract.status).split(' ')[1]}`}>
                                {getStatusText(selectedContract.status)}
                            </span>
                        </div>

                        {/* Detailed Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] border-b-[6px] border-blue-600 inline-block italic">Institutional Context</h4>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Activation Date', value: selectedContract.validFrom },
                                        { label: 'Expiration Period', value: selectedContract.validTo },
                                        { label: 'Account Executive', value: 'Strategic Business Admin' }
                                    ].map((field, i) => (
                                        <div key={i} className="flex justify-between items-center p-6 bg-slate-50 rounded-[1.8rem] border border-slate-100">
                                            <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">{field.label}</span>
                                            <span className="font-black text-slate-900 uppercase italic tracking-tighter">{field.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] border-b-[6px] border-emerald-500 inline-block italic">Commercial Rights</h4>
                                <div className="space-y-6">
                                    <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 group hover:bg-emerald-100 transition-all duration-500">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-emerald-800 font-black uppercase text-[10px] tracking-widest">B2B Discount Rate</span>
                                            <span className="text-4xl font-black text-emerald-600 italic tracking-tighter tabular-nums">{selectedContract.discountPercent}%</span>
                                        </div>
                                        <p className="text-[10px] text-emerald-700 font-bold italic uppercase tracking-widest opacity-60 leading-relaxed">
                                            Priority pricing applied to all digital procurement transactions within the contractual lifecycle.
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 group hover:bg-blue-100 transition-all duration-500">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-blue-800 font-black uppercase text-[10px] tracking-widest">Credit Provisioning</span>
                                            <span className="text-3xl font-black text-blue-600 italic tracking-tighter tabular-nums">{formatCurrency(selectedContract.creditLimit)}</span>
                                        </div>
                                        <p className="text-[10px] text-blue-700 font-bold italic uppercase tracking-widest opacity-60 leading-relaxed">
                                            Revolving credit limit for high-frequency infrastructure materials procurement.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Terms & Conditions Block */}
                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] border-b-[6px] border-slate-900 inline-block italic">Terms of Engagement</h4>
                            <div className="bg-slate-50 p-10 rounded-[3rem] text-[11px] text-slate-600 space-y-6 max-h-64 overflow-y-auto custom-scrollbar font-bold uppercase tracking-widest leading-loose shadow-inner">
                                <p className="flex items-start gap-4"><span className="text-slate-900">01 / Assurance:</span> SmartBuild guarantee standard material specifications defined by regional manufacturing protocols.</p>
                                <p className="flex items-start gap-4"><span className="text-slate-900">02 / Pricing:</span> Valuations remain static throughout the contractual duration, mitigating market volatility risks.</p>
                                <p className="flex items-start gap-4"><span className="text-slate-900">03 / Logistics:</span> Complimentary expedited delivery for consolidated procurement reaching the designated threshold.</p>
                                <p className="flex items-start gap-4"><span className="text-slate-900">04 / Settlement:</span> Monthly commercial audits concluded by the 5th business day. Late settlement incurs operational overhead.</p>
                            </div>
                        </div>

                        <div className="flex gap-6 pt-6 border-t border-slate-50">
                            <button
                                onClick={() => setSelectedContract(null)}
                                className="flex-1 py-6 bg-slate-100 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-200 transition-all"
                            >
                                Dismiss
                            </button>
                            <button className="flex-[2] py-6 bg-blue-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-4 group active:scale-95">
                                <Download size={20} className="group-hover:translate-y-1 transition-transform" />
                                Official Vault Export
                            </button>
                        </div>
                    </div>
                )}
            </FormModal>
        </div>
    )
}
