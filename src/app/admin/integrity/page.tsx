'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Shield, Search, Filter, MoreVertical, Eye, Download, Info, X, ChevronLeft, ChevronRight, FileDown, CheckSquare, Square, History } from 'lucide-react'
import toast from 'react-hot-toast'

interface IntegrityStats {
    overview: {
        pendingKYC: number
        openAlerts: number
        activeRestrictions: number
        recentAuditLogs: number
    }
    alertsBySeverity: Record<string, number>
    restrictionsByType: Record<string, number>
}

interface SuspiciousActivity {
    id: string
    activityType: string
    description: string
    severity: string
    status: string
    createdAt: string
    riskScore: number
    customerId?: string
}

interface KYCDocument {
    id: string
    documentType: string
    status: string
    createdAt: string
    customer?: {
        companyName?: string
        user?: { name: string; email: string }
        contractorProfile?: { displayName: string }
    }
}

interface UserRestriction {
    id: string
    type: string
    reason: string
    isActive: boolean
    startDate: string
    endDate?: string
    appealStatus: string
    appealReason?: string
    customerId: string
    updatedAt?: string
    createdAt: string
}

interface AuditLog {
    id: string
    action: string
    entityType: string
    entityId?: string
    actorEmail?: string
    actorRole?: string
    oldValue?: any
    newValue?: any
    reason?: string
    createdAt: string
    severity: string
}

export default function IntegrityDashboard() {
    const [stats, setStats] = useState<IntegrityStats | null>(null)
    const [alerts, setAlerts] = useState<SuspiciousActivity[]>([])
    const [kycQueue, setKycQueue] = useState<KYCDocument[]>([])
    const [restrictions, setRestrictions] = useState<UserRestriction[]>([])
    const [appeals, setAppeals] = useState<UserRestriction[]>([])
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
    const [workerFraud, setWorkerFraud] = useState<any[]>([])
    
    const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'kyc' | 'restrictions' | 'appeals' | 'audit' | 'worker-fraud'>('overview')
    const [loading, setLoading] = useState(true)

    // Phase 2 State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        type: 'rejectKYC' | 'resolveAlert' | 'liftRestriction' | 'rejectReport' | 'appeal';
        targetId: string;
        extraData?: any;
    } | null>(null);
    const [modalInput, setModalInput] = useState('');
    const [modalSelect, setModalSelect] = useState('');

    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds([]);
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'overview') {
                const res = await fetch('/api/admin/integrity?view=dashboard')
                const data = await res.json()
                if (data.success) setStats(data.data)
            } else if (activeTab === 'alerts') {
                const res = await fetch('/api/admin/integrity/alerts')
                const data = await res.json()
                if (data.success) setAlerts(data.data.alerts)
            } else if (activeTab === 'kyc') {
                const res = await fetch('/api/admin/integrity?view=kyc-queue')
                const data = await res.json()
                if (data.success) setKycQueue(data.data.documents)
            } else if (activeTab === 'restrictions') {
                const res = await fetch('/api/admin/integrity/restrictions')
                const data = await res.json()
                if (data.success) setRestrictions(data.data.restrictions)
            } else if (activeTab === 'appeals') {
                const res = await fetch('/api/admin/integrity/restrictions?view=appeals')
                const data = await res.json()
                if (data.success) setAppeals(data.data.appeals)
            } else if (activeTab === 'audit') {
                const res = await fetch('/api/admin/integrity?view=audit-logs')
                const data = await res.json()
                if (data.success) setAuditLogs(data.data.logs)
            } else if (activeTab === 'worker-fraud') {
                const res = await fetch('/api/admin/integrity/worker-fraud')
                const data = await res.json()
                if (data.success) setWorkerFraud(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        }
        setLoading(false)
    }

    // === PHASE 2 CAPABILITIES ===
    const handleExportCSV = () => {
        const dataMap: any = { 'alerts': alerts, 'kyc': kycQueue, 'restrictions': restrictions, 'appeals': appeals, 'audit': auditLogs, 'worker-fraud': workerFraud };
        const activeData = dataMap[activeTab];
        if (!activeData || activeData.length === 0) return toast.error('Không có dữ liệu!');
        const headers = Object.keys(activeData[0]).join(',');
        const rows = activeData.map((item: any) => Object.values(item).map(val => typeof val === 'object' ? `"${JSON.stringify(val).replace(/"/g, '""')}"` : `"${String(val).replace(/"/g, '""')}"`).join(','));
        const blob = new Blob(['\uFEFF' + headers + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Risk_Compliance_${activeTab}.csv`; link.click();
        toast.success('Đã xuất CSV');
    };

    const handleBulkResolve = async () => {
        if (!selectedIds.length) return toast.error('Chưa chọn bản ghi nào!');
        toast.loading('Đang xử lý...', { id: 'bulk' });
        try {
            await Promise.all(selectedIds.map(id => fetch('/api/admin/integrity/alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alertId: id, action: 'RESOLVE', resolution: 'Xử lý hàng loạt' }) })));
            toast.success('Thành công', { id: 'bulk' }); setSelectedIds([]); fetchData();
        } catch(e) { toast.error('Lỗi', { id: 'bulk' }); }
    };

    const getPaginatedData = (data: any[]) => data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    const PaginationUI = ({ total }: { total: number }) => {
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="text-sm font-bold text-gray-500">Đang xem {(currentPage-1)*ITEMS_PER_PAGE + 1} - {Math.min(currentPage*ITEMS_PER_PAGE, total)} / {total}</div>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-200 disabled:opacity-50"><ChevronLeft className="w-5 h-5"/></button>
                    <div className="px-4 py-2 font-black bg-blue-50 text-blue-700 rounded-lg">{currentPage} / {totalPages}</div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-200 disabled:opacity-50"><ChevronRight className="w-5 h-5"/></button>
                </div>
            </div>
        );
    };

    const handleKYCAction = async (docId: string, action: 'APPROVE') => {
        try {
            const res = await fetch('/api/admin/integrity/kyc', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: docId, action })
            })
            if (res.ok) {
                toast.success('Đã duyệt hồ sơ KYC')
                fetchData()
            }
        } catch (error) {
            console.error('KYC action failed:', error)
        }
    }

    const handleQuickResolveAlert = async (alertId: string, action: string) => {
        try {
            const res = await fetch('/api/admin/integrity/alerts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alertId, action, resolution: action === 'FALSE_POSITIVE' ? 'Báo nhầm' : 'Đã xử lý' })
            })
            if (res.ok) {
                toast.success('Đã cập nhật trạng thái cảnh báo')
                fetchData()
            }
        } catch (error) { }
    }

    const handleQuickApproveReport = async (reportId: string) => {
        try {
            const res = await fetch('/api/admin/integrity/worker-fraud', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId, status: 'APPROVED' })
            })
            if (res.ok) {
                toast.success('Đã chấp nhận báo cáo')
                fetchData()
            }
        } catch (error) { }
    }

    const handleReviewAppeal = async (restrictionId: string, approved: boolean) => {
        try {
            const res = await fetch('/api/admin/integrity/restrictions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restrictionId, action: approved ? 'APPROVE_APPEAL' : 'REJECT_APPEAL' })
            })
            if (res.ok) {
                toast.success(approved ? 'Đã chấp nhận kháng cáo (Gỡ cấm)' : 'Đã từ chối kháng cáo')
                fetchData()
                setModalConfig(null)
            } else {
                toast.error('Lỗi khi xử lý kháng cáo')
            }
        } catch(e) { }
    }

    const handleModalSubmit = async () => {
        if (!modalConfig) return;
        
        try {
            if (modalConfig.type === 'rejectKYC') {
                if (!modalInput.trim()) return toast.error('Vui lòng nhập lý do từ chối');
                
                const res = await fetch('/api/admin/integrity/kyc', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ documentId: modalConfig.targetId, action: 'REJECT', rejectionReason: modalInput })
                })
                if (res.ok) {
                    toast.success('Đã từ chối hồ sơ KYC')
                    fetchData()
                    setModalConfig(null)
                }
            } 
            else if (modalConfig.type === 'resolveAlert') {
                const body: any = { 
                    alertId: modalConfig.targetId, 
                    action: 'RESOLVE', 
                    resolution: modalInput || 'Đã xử lý' 
                }
                
                if (modalSelect && modalConfig.extraData?.showBanOption) {
                    body.applyRestriction = true
                    body.restrictionType = modalSelect
                    body.restrictionReason = modalInput || 'Khoá tự động do phát hiện vi phạm'
                }

                const res = await fetch('/api/admin/integrity/alerts', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                })
                if (res.ok) {
                    toast.success(modalSelect ? 'Đã xử lý và Khóa tài khoản' : 'Đã xử lý cảnh báo')
                    fetchData()
                    setModalConfig(null)
                }
            }
            else if (modalConfig.type === 'liftRestriction') {
                if (!modalInput.trim()) return toast.error('Vui lòng nhập lý do gỡ');
                
                const res = await fetch('/api/admin/integrity/restrictions', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ restrictionId: modalConfig.targetId, action: 'LIFT', reason: modalInput })
                })
                if (res.ok) {
                    toast.success('Đã gỡ bỏ hạn chế thành công')
                    fetchData()
                    setModalConfig(null)
                }
            }
            else if (modalConfig.type === 'rejectReport') {
                if (!modalInput.trim()) return toast.error('Vui lòng nhập lý do từ chối báo cáo');
                
                const res = await fetch('/api/admin/integrity/worker-fraud', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reportId: modalConfig.targetId, status: 'REJECTED', rejectionReason: modalInput })
                })
                if (res.ok) {
                    toast.success('Đã từ chối báo cáo')
                    fetchData()
                    setModalConfig(null)
                }
            }
        } catch (error) {
            console.error('Action failed:', error)
            toast.error('Có lỗi xảy ra, vui lòng thử lại')
        }
    }

    const severityColors: Record<string, string> = {
        LOW: 'bg-blue-100 text-blue-700',
        MEDIUM: 'bg-yellow-100 text-yellow-700',
        HIGH: 'bg-orange-100 text-orange-700',
        CRITICAL: 'bg-red-100 text-red-700'
    }

    const restrictionTypeLabels: Record<string, string> = {
        FULL_BAN: 'Cấm hoàn toàn',
        MARKETPLACE_BAN: 'Cấm Marketplace',
        WALLET_HOLD: 'Giữ ví',
        CREDIT_FREEZE: 'Đóng băng tín dụng',
        REVIEW_BAN: 'Cấm đánh giá',
        BIDDING_BAN: 'Cấm đấu thầu',
        PROBATION: 'Thử thách'
    }

    const activityTypeLabels: Record<string, string> = {
        MULTI_ACCOUNT: 'Nhiều tài khoản',
        COLLUSION_BIDDING: 'Thông đồng đấu thầu',
        FAKE_REVIEWS: 'Đánh giá ảo',
        RAPID_WITHDRAWALS: 'Rút tiền bất thường',
        UNUSUAL_TRANSACTION: 'Giao dịch lạ',
        PRICE_MANIPULATION: 'Thao túng giá',
        IDENTITY_MISMATCH: 'Thông tin không khớp',
        PAYMENT_FRAUD: 'Gian lận thanh toán'
    }

    return (
        <div className="min-h-screen bg-gray-50 relative">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                
                            <p className="text-sm text-gray-500">Hệ thống Quản trị Rủi ro & Tuân thủ</p>
                        </div>
                        <Link href="/admin" className="text-blue-600 hover:underline text-sm font-medium">
                            ← Quay lại Bảng điều khiển
                        </Link>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b shadow-sm sticky top-[73px] z-10">
                <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
                    <nav className="flex gap-2 min-w-max">
                        {[
                            { id: 'overview', label: 'Tổng quan', count: null },
                            { id: 'alerts', label: 'Cảnh báo', count: stats?.overview.openAlerts },
                            { id: 'kyc', label: 'Duyệt KYC', count: stats?.overview.pendingKYC },
                            { id: 'restrictions', label: 'Hạn chế', count: stats?.overview.activeRestrictions },
                            { id: 'appeals', label: 'Kháng cáo', count: appeals.length || null },
                            { id: 'worker-fraud', label: 'Kiểm thợ', count: workerFraud.length || null },
                            { id: 'audit', label: 'Audit Logs', count: null }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-3.5 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.label}
                                {(tab.count ?? 0) > 0 && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-lg shadow-sm">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-300">
                        {/* PHASE 2: TOOLBAR */}
                        {activeTab !== 'overview' && (
                            <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 gap-4">
                                <div className="flex items-center gap-3">
                                    {activeTab === 'alerts' && selectedIds.length > 0 && (
                                        <button onClick={handleBulkResolve} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors">
                                            <CheckSquare className="w-4 h-4"/> Xử lý Gộp ({selectedIds.length})
                                        </button>
                                    )}
                                    {activeTab === 'alerts' && (
                                        <div className="text-sm text-gray-500 font-medium ml-2">
                                            ✔ Chọn checkbox để Xử lý Hàng loạt
                                        </div>
                                    )}
                                </div>
                                <button onClick={handleExportCSV} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md shadow-slate-900/20">
                                    <FileDown className="w-4 h-4" /> Export CSV File
                                </button>
                            </div>
                        )}

                        {/* Overview Tab */}
                        {activeTab === 'overview' && stats && (
                            <div className="space-y-6">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-orange-50 rounded-full opacity-50"></div>
                                        <div className="text-3xl font-black text-orange-600 relative z-10">{stats.overview.pendingKYC}</div>
                                        <div className="text-sm text-gray-500 mt-1 uppercase tracking-wider font-semibold relative z-10">KYC chờ duyệt</div>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-red-50 rounded-full opacity-50"></div>
                                        <div className="text-3xl font-black text-red-600 relative z-10">{stats.overview.openAlerts}</div>
                                        <div className="text-sm text-gray-500 mt-1 uppercase tracking-wider font-semibold relative z-10">Cảnh báo mở</div>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100 relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-50 rounded-full opacity-50"></div>
                                        <div className="text-3xl font-black text-purple-600 relative z-10">{stats.overview.activeRestrictions}</div>
                                        <div className="text-sm text-gray-500 mt-1 uppercase tracking-wider font-semibold relative z-10">Hạn chế áp dụng</div>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-50 rounded-full opacity-50"></div>
                                        <div className="text-3xl font-black text-blue-600 relative z-10">{stats.overview.recentAuditLogs}</div>
                                        <div className="text-sm text-gray-500 mt-1 uppercase tracking-wider font-semibold relative z-10">Audit logs (24h)</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Alerts by Severity */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-1 border-t-4 border-t-red-500">
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Shield className="text-red-500 w-5 h-5"/>Phân bổ Rủi ro</h3>
                                        <div className="flex flex-col gap-4">
                                            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(severity => (
                                                <div key={severity} className="flex items-center justify-between">
                                                    <div className={`text-xs font-black uppercase px-2 py-1 rounded-lg ${
                                                        severity === 'CRITICAL' ? 'bg-red-50 text-red-700' :
                                                        severity === 'HIGH' ? 'bg-orange-50 text-orange-700' :
                                                        severity === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
                                                    }`}>{severity}</div>
                                                    <div className="font-bold text-gray-800">{stats.alertsBySeverity[severity] || 0}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Restrictions by Type */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2 border-t-4 border-t-indigo-500">
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><AlertCircle className="text-indigo-500 w-5 h-5"/> Loại Hạn chế đang Áp dụng</h3>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                            {Object.entries(restrictionTypeLabels).map(([type, label]) => (
                                                <div key={type} className="p-4 bg-gray-50/80 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100">
                                                    <div className="text-2xl font-black text-indigo-900 mb-1">
                                                        {stats.restrictionsByType[type] || 0}
                                                    </div>
                                                    <div className="text-xs font-semibold text-gray-600 line-clamp-1" title={label}>{label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Alerts Tab */}
                        {activeTab === 'alerts' && (
                            <div className="space-y-4">
                                {alerts.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                                        <p className="text-gray-500 font-bold">✅ Không có cảnh báo rủi ro nào đang mở</p>
                                    </div>
                                ) : (
                                    getPaginatedData(alerts).map(alert => (
                                        <div key={alert.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative group">
                                            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                                                <button 
                                                    onClick={() => setSelectedIds(prev => prev.includes(alert.id) ? prev.filter(id => id !== alert.id) : [...prev, alert.id])}
                                                    className={`mt-1 p-1 rounded-md transition-colors \${selectedIds.includes(alert.id) ? 'text-blue-600' : 'text-gray-300 hover:text-gray-500'}`}
                                                >
                                                    {selectedIds.includes(alert.id) ? <CheckSquare className="w-6 h-6"/> : <Square className="w-6 h-6"/>}
                                                </button>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg border ${
                                                            alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-700' :
                                                            alert.severity === 'HIGH' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                                                            alert.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-blue-50 border-blue-200 text-blue-700'
                                                        }`}>
                                                            {alert.severity}
                                                        </span>
                                                        <span className="text-sm font-black text-gray-900">
                                                            {activityTypeLabels[alert.activityType] || alert.activityType}
                                                        </span>
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-md">
                                                            Risk: {alert.riskScore}%
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm">{alert.description}</p>
                                                    <p className="text-xs text-gray-400 mt-3 font-medium">
                                                        🕒 {new Date(alert.createdAt).toLocaleString('vi-VN')}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col gap-2 min-w-[170px]">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleQuickResolveAlert(alert.id, 'RESOLVE')}
                                                            className="flex-1 px-3 py-2 text-sm font-bold bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors"
                                                        >
                                                            ✓ Xong
                                                        </button>
                                                        <button
                                                            onClick={() => handleQuickResolveAlert(alert.id, 'FALSE_POSITIVE')}
                                                            className="flex-1 px-3 py-2 text-sm font-bold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                                                        >
                                                            Bỏ qua
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setModalInput('');
                                                            setModalSelect('MARKETPLACE_BAN');
                                                            setModalConfig({ isOpen: true, title: 'Ban & Khóa User', type: 'resolveAlert', targetId: alert.id, extraData: { showBanOption: true } });
                                                        }}
                                                        className="w-full px-3 py-2 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-sm transition-colors flex items-center justify-center gap-1.5"
                                                    >
                                                        <Shield className="w-4 h-4" /> Khóa Tài khoản
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <PaginationUI total={alerts.length} />
                            </div>
                        )}

                        {/* KYC Tab */}
                        {activeTab === 'kyc' && (
                            <div className="space-y-4">
                                {kycQueue.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                        <p className="text-gray-500 font-bold">✅ Không có hồ sơ KYC nào chờ duyệt</p>
                                    </div>
                                ) : (
                                    kycQueue.map(doc => (
                                        <div key={doc.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex-1">
                                                    <div className="font-black text-lg text-gray-900">
                                                        {doc.customer?.contractorProfile?.displayName || doc.customer?.companyName || doc.customer?.user?.name || '---'}
                                                    </div>
                                                    <div className="text-sm text-gray-500 font-medium">
                                                        {doc.customer?.user?.email}
                                                    </div>
                                                    <div className="mt-4 flex items-center gap-2">
                                                        <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                                                            Loại: {doc.documentType}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-medium">
                                                            {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 min-w-[160px]">
                                                    <button
                                                        onClick={() => {
                                                            setModalInput('');
                                                            setModalSelect('');
                                                            setModalConfig({ isOpen: true, title: 'Từ chối Hồ sơ KYC', type: 'rejectKYC', targetId: doc.id });
                                                        }}
                                                        className="flex-1 px-4 py-2 text-sm font-bold bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 border border-gray-200 transition-colors"
                                                    >
                                                        Từ chối
                                                    </button>
                                                    <button
                                                        onClick={() => handleKYCAction(doc.id, 'APPROVE')}
                                                        className="flex-1 px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-colors"
                                                    >
                                                        ✓ Duyệt
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Appeals Tab */}
                        {activeTab === 'appeals' && (
                            <div className="space-y-4">
                                {appeals.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                                        <p className="text-gray-500 font-bold">Trống. Không có kháng cáo nào từ khách hàng.</p>
                                    </div>
                                ) : (
                                    appeals.map(appeal => (
                                        <div key={appeal.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400"></div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-black rounded-lg uppercase tracking-widest">
                                                        YÊU CẦU GỠ CẤM
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-500">
                                                        {new Date(appeal.updatedAt || appeal.createdAt).toLocaleString('vi-VN')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-2xl font-black text-gray-900">{restrictionTypeLabels[appeal.type] || appeal.type}</span>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                    <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Lý do phạt trước đây:</p>
                                                    <p className="text-sm text-gray-700 font-medium mb-4">{appeal.reason}</p>
                                                    
                                                    <p className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-widest">Nội dung Khách hàng kháng cáo:</p>
                                                    <p className="text-base text-gray-900 font-semibold">{appeal.appealReason || 'Khách hàng không đính kèm nội dung.'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-center min-w-[140px]">
                                                <button
                                                    onClick={() => {
                                                        setModalInput('');
                                                        setModalSelect('');
                                                        setModalConfig({ isOpen: true, title: 'Thẩm định Kháng cáo', type: 'appeal', targetId: appeal.id, extraData: { appealReason: appeal.appealReason } });
                                                    }}
                                                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm transition-all"
                                                >
                                                    Xét duyệt
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Restrictions Tab */}
                        {activeTab === 'restrictions' && (
                            <div className="space-y-4">
                                {restrictions.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                        <p className="text-gray-500 font-bold">✅ Không có tài khoản nào đang bị Hạn chế</p>
                                    </div>
                                ) : (
                                    restrictions.map(restriction => (
                                        <div key={restriction.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-lg font-black text-rose-700">
                                                            {restrictionTypeLabels[restriction.type] || restriction.type}
                                                        </span>
                                                        {restriction.appealStatus === 'PENDING' && (
                                                            <span className="px-2 py-1 text-[10px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-800 rounded-lg">
                                                                Có kháng cáo
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-700 font-medium bg-red-50 p-2 rounded-lg text-sm border border-red-100 w-max">{restriction.reason}</p>
                                                    <div className="mt-3 text-xs text-gray-500 font-medium">
                                                        Từ {new Date(restriction.startDate).toLocaleDateString('vi-VN')}
                                                        {restriction.endDate ? ` đến ${new Date(restriction.endDate).toLocaleDateString('vi-VN')}` : ' (Khóa Vĩnh viễn)'}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setModalInput('');
                                                        setModalSelect('');
                                                        setModalConfig({ isOpen: true, title: 'Gỡ hạn chế hệ thống', type: 'liftRestriction', targetId: restriction.id });
                                                    }}
                                                    className="px-4 py-2 text-sm font-bold bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 shadow-sm transition-all"
                                                >
                                                    Mở khóa (Gỡ bỏ)
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Audit Logs Tab */}
                        {activeTab === 'audit' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-200">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Historical Logs (100 records)</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-white">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Thời gian</th>
                                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Quản trị viên</th>
                                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Thao tác</th>
                                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Tác động</th>
                                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Chi tiết Data</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {auditLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500 font-medium">Chưa có dữ liệu audit log</td>
                                                </tr>
                                            ) : (
                                                auditLogs.map(log => (
                                                    <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium tracking-tight">
                                                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-bold text-gray-900">{log.actorEmail || 'Hệ thống'}</div>
                                                            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-black">{log.actorRole}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 py-1 text-[10px] uppercase tracking-widest font-black rounded-lg ${log.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                                                log.severity === 'WARNING' ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-indigo-50 border border-indigo-100 text-indigo-700'
                                                                }`}>
                                                                {log.action}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-bold text-gray-700">{log.entityType}</div>
                                                            <div className="text-xs text-gray-400 font-medium">ID: {log.entityId?.slice(0, 8)}...</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-[300px]">
                                                            {log.reason && <div className="font-semibold text-gray-800 mb-1">{log.reason}</div>}
                                                            {log.oldValue && log.newValue && (
                                                                <div className="mt-1 flex flex-col gap-1 text-[11px] font-mono bg-gray-50 p-2 rounded-lg border border-gray-100 overflow-x-auto">
                                                                    <div className="flex gap-2"><span className="text-rose-500 font-bold select-none">- </span> <span className="truncate">{JSON.stringify(log.oldValue)}</span></div>
                                                                    <div className="flex gap-2"><span className="text-emerald-500 font-bold select-none">+ </span> <span className="truncate">{JSON.stringify(log.newValue)}</span></div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Worker Fraud Tab */}
                        {activeTab === 'worker-fraud' && (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-orange-50 to-rose-50 border border-orange-100 p-5 rounded-2xl flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-orange-100 flex items-center justify-center text-orange-600">
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-orange-900 text-lg">Giám sát Công trường bằng AI</h4>
                                        <p className="text-sm text-orange-800 font-medium">Auto-pilot: Lọc báo cáo Check-in gian lận GPS/Vị trí & Hình ảnh giả mạo.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {workerFraud.length === 0 ? (
                                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                                            <p className="text-gray-500 font-bold text-lg">Không phát hiện hành vi gian lận nào</p>
                                        </div>
                                    ) : (
                                        workerFraud.map(report => (
                                            <div key={report.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                                                <div className="w-full md:w-56 h-56 bg-gray-100 rounded-xl overflow-hidden relative group">
                                                    <img src={report.photoUrl} alt="Report" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                        <a href={report.photoUrl} target="_blank" className="text-white text-sm font-bold bg-white/20 px-4 py-2 rounded-lg hover:bg-white/40 border border-white/50 transition-all">Phóng to Ảnh</a>
                                                    </div>
                                                </div>

                                                <div className="flex-1 flex flex-col">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black bg-rose-100 text-rose-700 px-3 py-1 rounded-lg uppercase tracking-widest border border-rose-200">
                                                                RỦI RO: {report.riskScore}%
                                                            </span>
                                                            <span className="text-base font-black text-gray-900">{report.project.title}</span>
                                                        </div>
                                                        <span className="text-xs text-gray-400 font-bold bg-gray-50 px-3 py-1 rounded-lg">{new Date(report.createdAt).toLocaleString('vi-VN')}</span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {report.fraudType.map((t: string) => (
                                                            <span key={t} className="text-xs font-bold bg-slate-900 text-white px-3 py-1 rounded-lg">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 mb-6 flex-1">
                                                        <p className="text-sm text-rose-800 font-bold flex gap-2">
                                                            <span className="text-rose-500">⚠️</span> {report.fraudDetails}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-auto">
                                                        <div className="grid grid-cols-2 gap-8 text-sm bg-gray-50 px-4 py-2 rounded-xl">
                                                            <div>
                                                                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest block mb-0.5">Thợ chụp:</span>
                                                                <span className="font-black text-gray-800">{report.workerName}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest block mb-0.5">Nhà thầu QL:</span>
                                                                <span className="font-black text-gray-800">{report.contractor.name}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setModalInput('');
                                                                    setModalSelect('');
                                                                    setModalConfig({ isOpen: true, title: 'Từ chối (Hủy Báo cáo)', type: 'rejectReport', targetId: report.id });
                                                                }}
                                                                className="px-6 py-2.5 bg-white text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-50 border border-rose-200 transition-colors"
                                                            >
                                                                Từ chối
                                                            </button>
                                                            <button
                                                                onClick={() => handleQuickApproveReport(report.id)}
                                                                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-all"
                                                            >
                                                                Đúng, Khẳng định Gian lận
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* FULLY FUNCTIONAL DYNAMIC MODAL LAYER */}
            {modalConfig && modalConfig.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-xl">
                            <h3 className="text-xl font-black text-slate-900">{modalConfig.title}</h3>
                            <button onClick={() => setModalConfig(null)} className="text-slate-400 hover:text-slate-900 transition-colors p-1.5 rounded-xl hover:bg-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5 bg-white">
                            {modalConfig.type === 'appeal' && (
                                <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 text-orange-900">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Thông điệp từ Khách hàng:</p>
                                    <p className="font-semibold text-base leading-relaxed">{modalConfig.extraData?.appealReason || 'Khách hàng không điền nội dung chi tiết. (Không có bằng chứng).'}</p>
                                </div>
                            )}

                            {modalConfig.type === 'resolveAlert' && modalConfig.extraData?.showBanOption && (
                                <div className="space-y-4 bg-rose-50 p-5 rounded-2xl border border-rose-100">
                                    <div className="flex items-center gap-3 text-sm font-black text-rose-700 uppercase tracking-widest">
                                        <Shield className="w-5 h-5 text-rose-500" />
                                        Mức phạt Áp dụng
                                    </div>
                                    <select
                                        value={modalSelect}
                                        onChange={(e) => setModalSelect(e.target.value)}
                                        className="w-full px-4 py-3 border border-rose-200 bg-white rounded-xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all cursor-pointer outline-none"
                                    >
                                        <option value="MARKETPLACE_BAN">🏪 Đình chỉ Cửa hàng / Marketplace</option>
                                        <option value="FULL_BAN">🚫 Cấm vĩnh viễn (Xóa sổ)</option>
                                        <option value="WALLET_HOLD">💰 Đóng băng Ví tiền & Rút ví</option>
                                        <option value="CREDIT_FREEZE">❄️ Khóa Hạn mức Công Nợ</option>
                                        <option value="REVIEW_BAN">⭐ Tước quyền Đánh giá</option>
                                        <option value="BIDDING_BAN">📋 Tước quyền Đấu thầu Giá</option>
                                        <option value="PROBATION">👁️ Theo dõi & Cảnh báo đỏ</option>
                                    </select>
                                </div>
                            )}

                            {modalConfig.type !== 'appeal' && (
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest">
                                        <Info className="w-4 h-4 text-blue-500" /> Lý do / Căn cứ
                                    </label>
                                    <textarea
                                        value={modalInput}
                                        onChange={(e) => setModalInput(e.target.value)}
                                        className="w-full px-5 py-4 border border-slate-200 bg-slate-50/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white resize-none transition-all outline-none font-medium placeholder-slate-400"
                                        rows={4}
                                        placeholder="Nhập giải trình chi tiết vào đây. Sẽ được lưu vào Audit Log..."
                                    />
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-5 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                            <button
                                onClick={() => setModalConfig(null)}
                                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
                            >
                                Hủy Bỏ
                            </button>
                            
                            {modalConfig.type === 'appeal' ? (
                                <>
                                    <button
                                        onClick={() => handleReviewAppeal(modalConfig.targetId, false)}
                                        className="px-6 py-2.5 text-sm font-black text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
                                    >
                                        Bác Bỏ & Giữ Án Phạt
                                    </button>
                                    <button
                                        onClick={() => handleReviewAppeal(modalConfig.targetId, true)}
                                        className="px-6 py-2.5 text-sm font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/30"
                                    >
                                        Chấp Thuận (Mở Khóa)
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleModalSubmit}
                                    className={`px-8 py-2.5 text-sm font-black text-white rounded-xl transition-all shadow-lg ${
                                        modalConfig.type === 'resolveAlert' && modalSelect ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                                    }`}
                                >
                                    {modalConfig.type === 'resolveAlert' && modalSelect ? 'Xác Nhận CẤM' : 'Xác Nhận'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
