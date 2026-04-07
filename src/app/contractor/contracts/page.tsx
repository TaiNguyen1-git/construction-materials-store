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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <FileLock className="w-8 h-8 text-blue-600" />
                        Legal Agreements
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Quản lý các cam kết hợp tác & Điều khoản ưu đãi B2B</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md">
                        <ShieldCheck size={16} /> Request Amendment
                    </button>
                </div>
            </div>

            {/* Contracts List */}
            <div className="grid gap-10">
                {contracts.length === 0 ? (
                    <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-24 md:p-32 text-center flex flex-col items-center justify-center space-y-8">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center">
                            <FileText size={40} className="text-slate-200" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">No Active Protocols</h3>
                            <p className="text-slate-400 font-bold max-w-md mx-auto text-[10px] tracking-widest leading-relaxed uppercase opacity-60">
                                Liên hệ với chúng tôi để thiết lập khung hợp tác pháp lý & Nhận các đặc quyền tài chính dành riêng cho đối tác.
                            </p>
                        </div>
                        <Link
                            href="/contact"
                            className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-3"
                        >
                            Initiate Agreement <ArrowUpRight size={16} />
                        </Link>
                    </div>
                ) : (
                    contracts.map((contract) => (
                        <div key={contract.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 flex flex-col">
                            <div className="p-8 md:p-10">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
                                    <div className="flex items-start gap-6">
                                        <div className="w-16 h-16 bg-slate-50 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500">
                                            <Briefcase size={28} />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{contract.name}</h3>
                                            <p className="text-slate-400 font-bold tracking-widest text-[9px] uppercase">Số hợp đồng: <span className="text-slate-900">{contract.contractNumber}</span></p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm transition-all duration-500 ${getStatusStyle(contract.status)}`}>
                                        {contract.status === 'ACTIVE' && <CheckCircle className="w-3 h-3" />}
                                        {contract.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                        {getStatusText(contract.status)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Effective Date', value: contract.validFrom, icon: Calendar, color: 'bg-slate-50 text-slate-500', border: 'border-slate-100' },
                                        { label: 'Termination', value: contract.validTo, icon: Calendar, color: 'bg-slate-50 text-slate-500', border: 'border-slate-100' },
                                        { label: 'B2B Leverage', value: `${contract.discountPercent}%`, icon: TrendingDown, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
                                        { label: 'Credit Capacity', value: formatCurrency(contract.creditLimit), icon: Zap, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' }
                                    ].map((stat, i) => (
                                        <div key={i} className={`${stat.color.split(' ')[0]} rounded-2xl p-6 border ${stat.border} flex flex-col justify-between h-32 group/stat hover:scale-105 transition-all duration-500`}>
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
                                <div className="flex items-center gap-3 text-slate-400 font-bold text-[9px] uppercase tracking-widest group-hover:text-slate-600 transition-colors">
                                    <ShieldCheck size={16} className="text-emerald-500" />
                                    Hợp đồng được bảo mật bởi giao thức SSL-256
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <button
                                        onClick={() => setSelectedContract(contract)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-blue-50 text-blue-600 px-6 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all shadow-sm active:scale-95"
                                    >
                                        <Eye size={16} /> Review Protocol
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 no-print active:scale-95"
                                    >
                                        <Download size={16} /> Export Vault
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
                                <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest border-b-4 border-blue-600 inline-block pb-1">Institutional Context</h4>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Activation Date', value: selectedContract.validFrom },
                                        { label: 'Expiration Period', value: selectedContract.validTo },
                                        { label: 'Account Executive', value: 'Strategic Business Admin' }
                                    ].map((field, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">{field.label}</span>
                                            <span className="font-bold text-slate-900 uppercase tracking-tight text-xs">{field.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest border-b-4 border-emerald-500 inline-block pb-1">Commercial Rights</h4>
                                <div className="space-y-4">
                                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 group hover:shadow-md transition-all duration-300">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-emerald-800 font-bold uppercase text-[9px] tracking-widest">B2B Discount Rate</span>
                                            <span className="text-3xl font-bold text-emerald-600 tracking-tight tabular-nums">{selectedContract.discountPercent}%</span>
                                        </div>
                                        <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-widest opacity-60 leading-relaxed italic">
                                            Priority pricing applied to all digital procurement transactions.
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 group hover:shadow-md transition-all duration-300">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-blue-800 font-bold uppercase text-[9px] tracking-widest">Credit Provisioning</span>
                                            <span className="text-2xl font-bold text-blue-600 tracking-tight tabular-nums">{formatCurrency(selectedContract.creditLimit)}</span>
                                        </div>
                                        <p className="text-[9px] text-blue-700 font-bold uppercase tracking-widest opacity-60 leading-relaxed italic">
                                            Revolving credit limit for high-frequency infrastructure procurement.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Terms & Conditions Block */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest border-b-4 border-slate-900 inline-block pb-1">Terms of Engagement</h4>
                            <div className="bg-slate-50 p-8 rounded-3xl text-[10px] text-slate-600 space-y-4 max-h-56 overflow-y-auto custom-scrollbar font-bold uppercase tracking-widest leading-loose">
                                <p className="flex items-start gap-4"><span className="text-slate-900">01 / Assurance:</span> SmartBuild guarantee standard material specifications defined by regional manufacturing protocols.</p>
                                <p className="flex items-start gap-4"><span className="text-slate-900">02 / Pricing:</span> Valuations remain static throughout the contractual duration, mitigating market volatility risks.</p>
                                <p className="flex items-start gap-4"><span className="text-slate-900">03 / Logistics:</span> Complimentary expedited delivery for consolidated procurement reaching the designated threshold.</p>
                                <p className="flex items-start gap-4"><span className="text-slate-900">04 / Settlement:</span> Monthly commercial audits concluded by the 5th business day. Late settlement incurs operational overhead.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-slate-100">
                            <button
                                onClick={() => setSelectedContract(null)}
                                className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Dismiss
                            </button>
                            <button className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 group active:scale-95">
                                <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                                Official Vault Export
                            </button>
                        </div>
                    </div>
                )}
            </FormModal>
        </div>
    )
}
