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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
                        <Shield className="w-10 h-10 text-emerald-600" />
                        Risk Mitigation Vault
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Quản lý bảo hiểm công trình & Đội ngũ nhân sự thi công</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowBuyModal(true)}
                        className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center gap-3 shadow-xl shadow-slate-200 active:scale-95"
                    >
                        <Zap size={16} /> Deploy New Coverage
                    </button>
                    <button className="w-14 h-14 bg-white border border-slate-100 rounded-[1.2rem] flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all active:scale-90">
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* Active Coverage Grid - Bento Architecture */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {policies.map(policy => (
                    <div key={policy.id} className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-700 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 px-8 py-3 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-[2rem] shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform origin-top-right">ACTIVE PROTOCOL</div>
                        
                        <div className="flex items-start gap-8 mb-10">
                            <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-50 transition-colors duration-500 shadow-inner">
                                <Shield className="w-10 h-10 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                            </div>
                            <div className="space-y-1 pt-2">
                                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter group-hover:text-emerald-600 transition-colors">
                                    {policy.type === 'MATERIAL_TRANSIT' ? 'Material Transit' : 'CAR Multi-Risk'}
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono tabular-nums">{policy.policyNumber}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-10 py-8 border-y border-slate-50 relative">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Institutional Underwriter</p>
                                <p className="text-base font-black text-slate-800 uppercase italic tracking-tight">{policy.insurer}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Max Liability Ceiling</p>
                                <p className="text-base font-black text-slate-900 tabular-nums italic text-emerald-600">{policy.coverage.toLocaleString('vi-VN')} đ</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Expiration Temporal Mark</p>
                                <p className="text-base font-black text-slate-800 tabular-nums tabular-nums uppercase italic">{new Date(policy.expiryDate).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Fiscal Status</p>
                                <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest pt-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Fully Remitted
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex gap-6">
                            <button
                                onClick={() => handleViewContract(policy)}
                                className="flex-1 py-5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 transition-all active:scale-95 shadow-sm"
                            >
                                <FileText size={16} /> Audit Contract
                            </button>
                            <button
                                onClick={() => handleReportClaim(policy)}
                                className="flex-1 py-5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 transition-all active:scale-95"
                            >
                                <AlertTriangle size={16} /> File Claim
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Historical Incident Log */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-1000">
                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
                            <History size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase italic tracking-tight">Active Claims & Incident Logs</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lịch sử yêu cầu bồi thường và giám định hiện trường</p>
                        </div>
                    </div>
                </div>
                <div className="py-32 text-center flex flex-col items-center gap-6 group">
                    <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-1000 border-2 border-dashed border-slate-200">
                        <FileText className="w-12 h-12 text-slate-200 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black italic text-slate-900 uppercase tracking-tighter">Operational Safety Intact</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[320px] mx-auto opacity-60">No pending claim protocols detected. Strategic risk mitigation remains within nominal parameters.</p>
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
                <div className="p-12 space-y-10 animate-in zoom-in duration-300">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Selection Tier</h3>
                        <p className="text-sm font-bold text-slate-500 leading-relaxed italic">Select the institutional mitigation package aligned with your tactical mission. Underwriters: PVI Institutional, Bao Viet Global, PTI Strategic.</p>
                    </div>
                    
                    <div className="grid gap-6">
                        {insuranceTypes.map(type => (
                            <div key={type.id} className="group border-2 border-slate-50 hover:border-emerald-500/20 hover:bg-emerald-50/30 rounded-[2.5rem] p-8 transition-all cursor-pointer flex items-center gap-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all"></div>
                                <div className="w-20 h-20 bg-white rounded-[1.8rem] flex items-center justify-center text-slate-400 group-hover:text-emerald-600 shadow-xl shadow-slate-200 transition-all group-hover:scale-110">
                                    {type.icon}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{type.name}</h4>
                                    <p className="text-[11px] font-bold text-slate-500 italic max-w-sm">{type.desc}</p>
                                </div>
                                <div className="text-right space-y-3 relative z-10">
                                    <p className="text-xl font-black text-emerald-600 italic tabular-nums">{type.price}</p>
                                    <button
                                        onClick={() => handleBuyPolicy(type.id)}
                                        disabled={buyingType === type.id}
                                        className="px-6 py-3 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-black transition-all disabled:opacity-30 active:scale-95"
                                    >
                                        {buyingType === type.id ? 'TRANSMITTING...' : 'INITIALIZE'}
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
                    <div className="p-12 space-y-12 animate-in zoom-in duration-300">
                        <div className="flex justify-between items-end border-b-4 border-slate-900 pb-10">
                            <div className="space-y-4">
                                <h3 className="text-4xl font-black italic tracking-tighter uppercase">{viewingPolicy.type === 'MATERIAL_TRANSIT' ? 'Material Transit' : 'Risk Multi-CAR'}</h3>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">{viewingPolicy.policyNumber}</span>
                                    <span className="px-5 py-2 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Protocol Verified</span>
                                </div>
                            </div>
                            <Shield className="w-16 h-16 text-slate-100" />
                        </div>

                        <div className="grid gap-10">
                            <div className="p-10 bg-slate-50 rounded-[3rem] space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <Lock size={14} className="text-emerald-500" /> Essential Coverage Parameters
                                </h4>
                                <ul className="space-y-4 text-sm font-bold text-slate-700 italic">
                                    <li className="flex items-start gap-4">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        Comprehensive asset protection for {viewingPolicy.type === 'MATERIAL_TRANSIT' ? 'transit logistics from origin hub to operational site' : 'vertical build structural integrity against physical threats'}.
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        Mission Radius: {viewingPolicy.type === 'MATERIAL_TRANSIT' ? 'Total loss, structural warping due to logistics incident, pyrotechnic events, or force majeure' : 'Seismic activity, hydrologic events, operational oversight, or institutional sub-standard deployment'}.
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        Deductible Threshold: 5,000,000 VNĐ per verified incident.
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex justify-end gap-6 border-t border-slate-50 pt-10">
                            <button onClick={() => setViewingPolicy(null)} className="px-10 py-5 bg-slate-100 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">Dismiss Audit</button>
                            <button className="px-10 py-5 bg-emerald-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-3">
                                <Download size={16} /> Sync PDF to Vault
                            </button>
                        </div>
                    </div>
                )}
            </FormModal>

            <FormModal
                isOpen={!!reportingClaim}
                onClose={() => setReportingClaim(null)}
                title="Operational Incident Transmission"
                size="md"
            >
                {reportingClaim && (
                    <div className="p-12 space-y-10 animate-in zoom-in duration-300">
                        <div className="bg-rose-50 p-8 rounded-[2.5rem] border-2 border-rose-100 border-dashed flex items-start gap-6">
                            <AlertTriangle className="w-10 h-10 text-rose-600 flex-shrink-0" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Protocol Warning</p>
                                <p className="text-xs font-bold text-rose-700 leading-relaxed italic">Freeze incident perimeter and secure HD visual evidence. Verified audit units will deploy within a 2-hour window post-receipt.</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Linked Insurance Protocol</label>
                                <input
                                    type="text"
                                    value={`${reportingClaim.policyNumber} - ${reportingClaim.insurer}`}
                                    disabled
                                    className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-[10px] font-black uppercase tracking-tighter text-slate-400"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Incident Temporal Mark</label>
                                    <input
                                        type="date"
                                        value={claimForm.incidentDate}
                                        onChange={(e) => setClaimForm({ ...claimForm, incidentDate: e.target.value })}
                                        className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-black focus:ring-4 focus:ring-rose-500/10 outline-none"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Estimated Loss (VNĐ)</label>
                                    <input
                                        type="number"
                                        placeholder="EX: 50,000,000"
                                        value={claimForm.estimatedLoss}
                                        onChange={(e) => setClaimForm({ ...claimForm, estimatedLoss: e.target.value })}
                                        className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-black italic tracking-tighter focus:ring-4 focus:ring-rose-500/10 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Critical Situation Narrative</label>
                                <textarea
                                    rows={5}
                                    placeholder="Provide high-density narrative of incident trajectory and structural impact..."
                                    value={claimForm.description}
                                    onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                                    className="w-full px-10 py-8 bg-slate-50 border-none rounded-[2.5rem] text-sm font-bold italic leading-relaxed focus:ring-4 focus:ring-rose-500/10 outline-none"
                                ></textarea>
                            </div>

                            <div
                                className="border-[3px] border-dashed border-slate-100 rounded-[2.5rem] p-10 text-center hover:bg-slate-50 cursor-pointer transition-all duration-500 group relative"
                                onClick={() => document.getElementById('claim-file-upload')?.click()}
                            >
                                <input
                                    type="file"
                                    id="claim-file-upload"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <div className="space-y-4">
                                    <Camera className="w-12 h-12 text-slate-200 group-hover:text-rose-500 group-hover:scale-110 transition-all mx-auto" />
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] group-hover:text-rose-600 transition-colors">Inject Incident Evidence Vault</p>
                                </div>

                                {selectedFiles.length > 0 && (
                                    <div className="mt-6 text-left bg-rose-50/50 p-6 rounded-[1.8rem] space-y-4 border border-rose-100">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-600">Active Registry: {selectedFiles.length} Tokens</p>
                                        <div className="flex flex-wrap gap-3">
                                            {selectedFiles.map((f, i) => (
                                                <span key={i} className="px-3 py-1 bg-white border border-rose-100 rounded-lg text-[9px] font-black uppercase text-rose-800">{f.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-6 pt-10 border-t border-slate-50">
                            <button onClick={() => setReportingClaim(null)} className="flex-1 py-6 bg-slate-100 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">Abort Incident Report</button>
                            <button onClick={submitClaim} className="flex-[2] py-6 bg-rose-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-rose-500/20 hover:bg-rose-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                                <ShieldAlert size={20} /> Transmit Protocol
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
