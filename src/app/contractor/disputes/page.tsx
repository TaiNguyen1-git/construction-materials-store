'use client'

import { useState, useEffect, useRef } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { AlertCircle, FileText, CheckCircle2, Clock, Plus, Camera, X, Building2, User, MessageSquare, Sparkles, ArrowRight, Scale, ThumbsUp, Loader2, ChevronRight, Gavel, ShieldAlert, History, MessageCircle } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'

export default function ContractorDisputePage() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [disputes, setDisputes] = useState<any[]>([])
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [mediationStep, setMediationStep] = useState<'form' | 'suggestion' | 'escalate'>('form')
    const [mediationSuggestion, setMediationSuggestion] = useState('')

    const [form, setForm] = useState({
        orderId: '',
        targetType: 'STORE' as 'STORE' | 'CUSTOMER',
        reason: '',
        description: '',
        evidence: [] as string[]
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const meRes = await fetchWithAuth('/api/auth/me')
            const me = await meRes.json()
            const contractorId = me.contractorProfile?.id

            if (!contractorId) return

            const [disRes, ordRes] = await Promise.all([
                fetchWithAuth(`/api/disputes?contractorId=${contractorId}`),
                fetchWithAuth(`/api/contractors/orders`)
            ])

            if (disRes.ok) setDisputes(await disRes.json())
            if (ordRes.ok) {
                const ordData = await ordRes.json()
                setOrders(ordData.data || ordData.orders || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const selectedOrder = orders.find(o => o.id === form.orderId)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingImage(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetchWithAuth('/api/upload', {
                method: 'POST',
                body: formData,
                headers: {}
            })

            const result = await res.json()
            if (result.success) {
                setForm(prev => ({
                    ...prev,
                    evidence: [...prev.evidence, result.data.url]
                }))
                toast.success('Evidence uploaded successfully')
            }
        } catch (error) {
            toast.error('Failed to transmit evidence')
        } finally {
            setUploadingImage(false)
        }
    }

    const removeEvidence = (index: number) => {
        setForm(prev => ({
            ...prev,
            evidence: prev.evidence.filter((_, i) => i !== index)
        }))
    }

    const MEDIATION_SUGGESTIONS: Record<string, string> = {
        'Vật tư kém chất lượng': '🔧 Operational Protocol Suggestion:\n\n1. Capture HD evidence of sub-standard assets and transmit via B2B Chat\n2. Invoke "Quality Assurance Recall" within 7 business days\n3. For partial asset consumption, negotiate "Commercial Credit" for upcoming procurement batches',
        'Giao thiếu vật tư': '📦 Logistics Audit Suggestion:\n\n1. Cross-reference digital delivery tokens with physical asset count\n2. Initiate "Logistics Reconciliation" via real-time vendor communications\n3. Request expedited re-delivery within 24-48h window upon confirmation',
        'Giao hàng chậm': '🚛 Scheduling Protocol Suggestion:\n\n1. Verify "Live Tracking" temporal data in Logistics Hub\n2. If delay exceeds >48h, claim "Performance Penalty" covering delivery overhead\n3. Negotiate new high-priority deployment slot with vendor project management',
        'Sai quy cách vật tư': '📐 Geometric Accuracy Suggestion:\n\n1. Contrast physical dimensions with digital procurement specifications\n2. Trigger "Asset Exchange Protocol" within 7-day liability window\n3. Ensure asset integrity remains intact — avoid deployment of incorrect units',
        'Chủ nhà không thanh toán': '💰 Revenue Recovery Suggestion:\n\n1. Transmit "Commercial Remittance Notice" via portal messaging system\n2. If Escrow is active, liquidity will be released post-milestone validation\n3. For non-Escrow transactions, issue formal "Institutional Recovery Notification" via verified channels',
        'Yêu cầu thay đổi ngoài hợp đồng': '📝 Project Variation Suggestion:\n\n1. Formalize "Change Order Appendix" for all architectural modifications\n2. Calculate additional fiscal impact and submit via "Dynamic Bidding" module\n3. Halt deployment until digital confirmation of the modified protocol is secured',
    }

    const handleMediationCheck = (e: React.FormEvent) => {
        e.preventDefault()
        const suggestion = MEDIATION_SUGGESTIONS[form.reason] || `💬 Strategic Overview:\n\n1. Initiate direct resolution dialogue via integrated B2B communication channels\n2. Provide comprehensive evidence vault (Imagery, Metadata, Field Reports)\n3. Propose a specific commercial resolution framework for evaluation`
        setMediationSuggestion(suggestion)
        setMediationStep('suggestion')
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setSubmitting(true)

        try {
            const meRes = await fetchWithAuth('/api/auth/me')
            const me = await meRes.json()

            const type = form.targetType === 'CUSTOMER' ? 'CONTRACTOR_TO_CUSTOMER' : 'CONTRACTOR_TO_STORE'

            const res = await fetchWithAuth('/api/disputes', {
                method: 'POST',
                body: JSON.stringify({
                    orderId: form.orderId,
                    contractorId: me.contractorProfile?.id || me.id,
                    customerId: selectedOrder?.customerId,
                    type,
                    reason: form.reason,
                    description: form.description,
                    evidence: form.evidence
                })
            })

            if (res.ok) {
                toast.success('Dispute case successfully logged in the resolution vault')
                setShowForm(false)
                setMediationStep('form')
                setForm({ orderId: '', targetType: 'STORE', reason: '', description: '', evidence: [] })
                fetchData()
            } else {
                toast.error('Case registration failed')
            }
        } catch (error) {
            toast.error('Protocol transmission error')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
            <Toaster position="top-right" />
            
            {/* High Impact Resolution Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
                        <Gavel className="w-10 h-10 text-rose-600" />
                        Dispute Vault
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Hệ thống giải quyết tranh chấp & Trung tâm hòa giải B2B</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            setShowForm(!showForm)
                            if (showForm) setMediationStep('form')
                        }}
                        className={`px-8 py-4 ${showForm ? 'bg-slate-100 text-slate-500' : 'bg-rose-600 text-white shadow-xl shadow-rose-500/20'} rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all flex items-center gap-3 active:scale-95`}
                    >
                        {showForm ? <><X size={16} /> Abort Case</> : <><ShieldAlert size={16} /> Log New Case</>}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl mb-12 animate-in slide-in-from-top-10 duration-700 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                    
                    {/* Resolution Progress Protocol */}
                    <div className="flex items-center gap-6 mb-12 pb-8 border-b border-slate-50 relative z-10">
                        {[
                            { step: 'form', label: 'Case Context', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
                            { step: 'suggestion', label: 'AI Strategy', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
                            { step: 'escalate', label: 'Adjudication', icon: Scale, color: 'text-rose-500', bg: 'bg-rose-50' }
                        ].map((m, i) => (
                            <div key={m.step} className="flex items-center gap-6">
                                <div className={`flex items-center gap-4 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${mediationStep === m.step ? `${m.bg} ${m.color} shadow-lg shadow-black/5` : 'bg-slate-50 text-slate-300 opacity-40'}`}>
                                    <m.icon size={16} />
                                    {m.label}
                                </div>
                                {i < 2 && <ArrowRight size={14} className="text-slate-100" />}
                            </div>
                        ))}
                    </div>

                    {/* Stage 01: Case Documentation */}
                    {mediationStep === 'form' && (
                        <form onSubmit={handleMediationCheck} className="space-y-10 relative z-10">
                            <div className="grid md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Linked Transaction Record</label>
                                    <select
                                        required
                                        value={form.orderId}
                                        onChange={e => setForm({ ...form, orderId: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] px-8 py-5 text-sm font-black italic tracking-tight focus:bg-white focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/20 outline-none transition-all"
                                    >
                                        <option value="">-- SELECT TRANSACTION PROTOCOL --</option>
                                        {orders.map((o: any) => (
                                            <option key={o.id} value={o.id}>#{o.orderNumber} - {o.customer?.user?.name || 'PRIVATE CLIENT'}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Target Counterparty</label>
                                    <div className="flex gap-4 p-2 bg-slate-50 rounded-[1.8rem] border border-slate-100 h-[64px]">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, targetType: 'STORE' })}
                                            className={`flex-1 rounded-[1.2rem] text-[10px] font-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest ${form.targetType === 'STORE' ? 'bg-white text-rose-600 shadow-xl border border-black/5' : 'text-slate-400'}`}
                                        >
                                            <Building2 size={16} /> Commercial Vendor
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, targetType: 'CUSTOMER' })}
                                            className={`flex-1 rounded-[1.2rem] text-[10px] font-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest ${form.targetType === 'CUSTOMER' ? 'bg-white text-rose-600 shadow-xl border border-black/5' : 'text-slate-400'}`}
                                        >
                                            <User size={16} /> Project Principal
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Categorical Conflict Primary Reason</label>
                                <select
                                    required
                                    value={form.reason}
                                    onChange={e => setForm({ ...form, reason: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] px-8 py-5 text-sm font-black italic tracking-tight focus:bg-white focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/20 outline-none transition-all"
                                >
                                    <option value="">-- CLASSIFY DISPUTE ORIGIN --</option>
                                    {form.targetType === 'STORE' ? (
                                        <>
                                            <option value="Vật tư kém chất lượng">SUB-STANDARD ASSET QUALITY</option>
                                            <option value="Giao thiếu vật tư">LOGISTICS QUANTITY DISCREPANCY</option>
                                            <option value="Giao hàng chậm">TEMPORAL LOGISTICS VIOLATION</option>
                                            <option value="Sai quy cách vật tư">ASSET SPECIFICATION ERROR</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Chủ nhà không thanh toán">NON-SETTLEMENT OF REVENUE</option>
                                            <option value="Yêu cầu thay đổi ngoài hợp đồng">UNAUTHORIZED PROTOCOL VARIATION</option>
                                            <option value="Gây khó dễ thi công">OPERATIONAL INTERFERENCE</option>
                                            <option value="Vi phạm điều khoản an toàn">SAFETY PROTOCOL BREACH</option>
                                        </>
                                    )}
                                    <option value="Khác">UNCLASSIFIED PROTOCOL VARIANCE</option>
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Operational Incident Report</label>
                                <textarea
                                    required
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={5}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] px-10 py-8 text-sm font-bold leading-relaxed focus:bg-white focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/20 outline-none transition-all placeholder:text-slate-200"
                                    placeholder="Provide detailed chronological logs of the incident and desired commercial resolution..."
                                ></textarea>
                            </div>

                            <div className="space-y-6">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Verification Evidence Vault</label>
                                <div className="flex flex-wrap gap-6">
                                    {form.evidence.map((url, idx) => (
                                        <div key={idx} className="relative w-32 h-32 group">
                                            <img src={url} alt="Evidence" className="w-full h-full object-cover rounded-[1.8rem] border-[3px] border-slate-100 shadow-sm" />
                                            <button
                                                type="button"
                                                onClick={() => removeEvidence(idx)}
                                                className="absolute -top-3 -right-3 bg-slate-900 text-white rounded-2xl w-10 h-10 flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600"
                                            >
                                                <X size={18} />
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
                                        className={`w-32 h-32 bg-slate-50 rounded-[2.5rem] flex flex-col items-center justify-center border-[3px] border-dashed border-slate-200 text-slate-300 cursor-pointer hover:bg-white hover:border-rose-400 hover:text-rose-500 transition-all duration-500 ${uploadingImage ? 'animate-pulse pointer-events-none' : ''}`}
                                    >
                                        {uploadingImage ? (
                                            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                                        ) : (
                                            <>
                                                <Camera size={32} />
                                                <span className="text-[10px] mt-2 font-black uppercase tracking-widest">Add Evidence</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-10">
                                <button
                                    type="submit"
                                    disabled={uploadingImage}
                                    className="bg-amber-500 text-white px-12 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] italic hover:bg-amber-600 disabled:bg-slate-200 transition-all shadow-2xl shadow-amber-500/20 flex items-center gap-4 active:scale-95"
                                >
                                    <Sparkles size={20} />
                                    Generate AI Resolution Strategy
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Stage 02: AI Dynamic Strategy */}
                    {mediationStep === 'suggestion' && (
                        <div className="space-y-10 relative z-10 animate-in zoom-in duration-500">
                            <div className="bg-amber-50/50 border-[3px] border-amber-500 border-dashed rounded-[3.5rem] p-12">
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-16 h-16 bg-amber-500 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                                        <Sparkles size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-amber-900 uppercase italic tracking-tighter">AI Tactical Suggestion</h3>
                                        <p className="text-[10px] text-amber-600 font-black uppercase tracking-[0.3em]">Commercial Intelligence Engine</p>
                                    </div>
                                </div>
                                <div className="bg-white rounded-[2.5rem] p-10 border border-amber-100 shadow-inner">
                                    <p className="text-lg text-slate-800 font-bold whitespace-pre-wrap leading-relaxed italic">“{mediationSuggestion}”</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 pt-6">
                                <button
                                    onClick={() => setMediationStep('form')}
                                    className="px-10 py-6 border-2 border-slate-100 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    ← Modify Context
                                </button>
                                <button
                                    onClick={() => {
                                        toast.success('Strategy accepted. Initiating direct resolution.')
                                        setShowForm(false)
                                        setMediationStep('form')
                                        setForm({ orderId: '', targetType: 'STORE', reason: '', description: '', evidence: [] })
                                    }}
                                    className="flex-1 px-10 py-6 bg-emerald-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-emerald-500/20 active:scale-95"
                                >
                                    <ThumbsUp size={20} />
                                    Execute Tactical Solution
                                </button>
                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={submitting}
                                    className="px-10 py-6 bg-rose-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-rose-700 disabled:bg-slate-200 transition-all flex items-center gap-4 shadow-2xl shadow-rose-500/20 active:scale-95"
                                >
                                    <Scale size={20} />
                                    {submitting ? 'Registering...' : 'Escalate to Adjudication'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Historical Case Records - Bento Interaction */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 px-4">
                    <History size={20} className="text-slate-300" />
                    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Historical Conflict Logs & Active Records</h2>
                </div>
                
                {disputes.length === 0 ? (
                    <div className="bg-white p-32 text-center rounded-[4rem] border-[3px] border-dashed border-slate-100 text-slate-200 shadow-sm flex flex-col items-center gap-8 group">
                        <Scale className="opacity-5 group-hover:opacity-10 transition-opacity duration-1000 group-hover:rotate-12" size={120} />
                        <div className="space-y-3">
                            <p className="font-black text-slate-900 uppercase italic tracking-tighter text-3xl">Protocol Intact</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] max-w-sm mx-auto">No commercial or logistics disputes detected in the current operational cycle.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {disputes.map((dis, i) => (
                            <div key={i} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-700 group overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-4 h-full bg-slate-50 group-hover:bg-rose-500 transition-all duration-700"></div>
                                
                                <div className="flex justify-between items-start mb-8 pr-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <span className={`px-5 py-1.5 rounded-2xl text-[9px] font-black tracking-widest uppercase shadow-sm ${dis.status === 'OPEN' ? 'bg-blue-500 text-white' :
                                                dis.status === 'UNDER_REVIEW' ? 'bg-amber-500 text-white' :
                                                    dis.status === 'RESOLVED' ? 'bg-emerald-500 text-white' :
                                                        'bg-slate-500 text-white'
                                                }`}>
                                                {dis.status === 'OPEN' ? 'Initialized' :
                                                    dis.status === 'UNDER_REVIEW' ? 'Audit in Progress' :
                                                        dis.status === 'RESOLVED' ? 'Legally Resolved' : 'Deactivated'}
                                            </span>
                                            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{dis.reason}</h3>
                                            <span className="text-[9px] text-slate-400 font-black bg-slate-50 px-4 py-1.5 rounded-2xl border border-slate-100 uppercase tracking-widest">
                                                Target: {dis.type === 'CONTRACTOR_TO_STORE' ? 'Vendor' : 'Principal'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-3">
                                            <Clock size={12} className="text-rose-400" /> Transmitted: {new Date(dis.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    <div className="w-16 h-16 bg-slate-50 rounded-[1.8rem] flex items-center justify-center group-hover:bg-rose-50 group-hover:scale-110 transition-all duration-700">
                                        <FileSearch size={28} className="text-slate-300 group-hover:text-rose-500" />
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 p-8 rounded-[2.5rem] mb-10 border border-slate-100 relative group-hover:bg-white transition-all duration-700 shadow-inner group-hover:shadow-xl group-hover:shadow-black/5">
                                    <p className="text-sm text-slate-700 leading-relaxed font-bold italic">
                                        “{dis.description}”
                                    </p>
                                </div>

                                {dis.evidence && dis.evidence.length > 0 && (
                                    <div className="flex gap-6 mb-10 overflow-x-auto pb-4 custom-scrollbar">
                                        {dis.evidence.map((ev: any, idx: number) => (
                                            <img key={idx} src={ev.imageUrl} alt="Evidence" className="w-24 h-24 object-cover rounded-[1.8rem] border border-slate-100 shadow-sm shrink-0 hover:scale-110 hover:-rotate-3 transition-all duration-500 cursor-zoom-in" />
                                        ))}
                                    </div>
                                )}

                                {dis.resolution && (
                                    <div className="bg-emerald-50/50 border-[3px] border-emerald-500 border-dashed p-10 rounded-[3rem] flex gap-8 mb-10 shadow-2xl shadow-emerald-500/5 animate-in slide-in-from-left-10 duration-1000">
                                        <div className="w-16 h-16 bg-emerald-500 text-white rounded-[1.8rem] flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em]">Institutional Adjudication Final Ruling</p>
                                            <p className="text-xl text-emerald-900 font-black leading-relaxed italic tracking-tight">“{dis.resolution}”</p>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-slate-50 pt-8 mt-4">
                                    <details className="group/messages">
                                        <summary className="text-[10px] font-black text-slate-400 cursor-pointer list-none flex items-center gap-4 hover:text-rose-600 transition-all uppercase tracking-[0.3em]">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover/messages:bg-rose-50 transition-colors">
                                                <MessageCircle size={18} />
                                            </div>
                                            Resolution Dialogue Vault ({dis.comments?.length || 0} Entries)
                                            <ChevronRight size={14} className="ml-auto group-open/messages:rotate-90 transition-transform duration-500" />
                                        </summary>

                                        <div className="mt-8 space-y-6">
                                            <div className="max-h-[400px] overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                                                {dis.comments?.map((comment: any, idx: number) => (
                                                    <div key={idx} className={`p-8 rounded-[2.5rem] border ${comment.author.role === 'ADMIN' ? 'bg-blue-600 text-white border-transparent ml-12 shadow-2xl shadow-blue-500/20' : 'bg-slate-50 border-slate-100 mr-12'}`}>
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${comment.author.role === 'ADMIN' ? 'text-blue-100' : 'text-slate-400'}`}>
                                                                {comment.author.name} {comment.author.role === 'ADMIN' && '[REGIONAL ADMIN]'}
                                                            </span>
                                                            <span className={`text-[9px] font-bold ${comment.author.role === 'ADMIN' ? 'text-blue-200' : 'text-slate-300'}`}>{new Date(comment.createdAt).toLocaleString('vi-VN')}</span>
                                                        </div>
                                                        <p className={`text-sm font-bold leading-relaxed ${comment.author.role === 'ADMIN' ? 'italic' : ''}`}>{comment.content}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="relative pt-4">
                                                <input
                                                    type="text"
                                                    placeholder="Transmit tactical rebuttal or supplementary evidence protocol..."
                                                    className="w-full bg-slate-950 border-none rounded-[1.8rem] px-10 py-6 text-sm font-bold text-white placeholder:text-slate-600 focus:ring-4 focus:ring-rose-500/20 outline-none transition-all shadow-2xl shadow-black/20"
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter') {
                                                            const content = e.currentTarget.value.trim()
                                                            if (!content) return
                                                            const input = e.currentTarget

                                                            try {
                                                                const meRes = await fetchWithAuth('/api/auth/me')
                                                                const me = await meRes.json()

                                                                const res = await fetchWithAuth('/api/disputes/comments', {
                                                                    method: 'POST',
                                                                    body: JSON.stringify({
                                                                        disputeId: dis.id,
                                                                        authorId: me.id,
                                                                        content
                                                                    })
                                                                })

                                                                if (res.ok) {
                                                                    input.value = ''
                                                                    fetchData()
                                                                    toast.success('Transmission confirmed')
                                                                }
                                                            } catch (err) {
                                                                toast.error('Transmission failure')
                                                            }
                                                        }
                                                    }}
                                                />
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4 pointer-events-none opacity-40">
                                                    <span className="text-[10px] font-black text-white uppercase bg-white/10 px-3 py-1 rounded-lg">Execute Transaction</span>
                                                </div>
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
