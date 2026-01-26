'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Calendar, MapPin, Wrench,
    CheckCircle2, Circle, Clock, DollarSign,
    Plus, FileText, ChevronRight, Layout,
    MessageCircle, AlertTriangle, MoreVertical,
    Download, Image as ImageIcon, Briefcase, Loader2,
    Package, Users
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import ContractorHeader from '../../components/ContractorHeader'
import { fetchWithAuth } from '@/lib/api-client'
import toast, { Toaster } from 'react-hot-toast'
import { savePendingReport } from '@/lib/offline-db'
import OfflineSyncManager from '@/components/OfflineSyncManager'

interface Milestone {
    id: string
    name: string
    percentage: number
    amount: number
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PAID'
    dueDate?: string
}

interface ProjectDetail {
    id: string
    title: string
    description: string
    status: string
    projectType: string
    city: string
    district: string
    location: string
    estimatedBudget: number
    createdAt: string
    contactName: string
    contactPhone: string
    milestones: Milestone[]
    expenses: any[]
    actualCost: number
    progress: number
}

export default function ProjectDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [project, setProject] = useState<ProjectDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [clientReports, setClientReports] = useState<any[]>([])

    // Modal States
    const [showExpenseModal, setShowExpenseModal] = useState(false)
    const [showMilestoneModal, setShowMilestoneModal] = useState(false)
    const [showClientHistory, setShowClientHistory] = useState(false)

    // Form States
    const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'MATERIALS', notes: '' })
    const [milestoneForm, setMilestoneForm] = useState({ name: '', amount: '', dueDate: '' })

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }
        fetchProjectDetail()
    }, [])

    const fetchProjectDetail = async () => {
        setLoading(true)
        try {
            const res = await fetchWithAuth(`/api/contractors/projects/${params.id}`)
            if (res.ok) {
                const data = await res.json()
                setProject(data.data)
            } else {
                toast.error('Không tìm thấy dự án')
                router.push('/contractor/projects')
            }
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount) + ' đ'
    }

    // Event Handlers
    const handleChatWithClient = () => {
        if (project) {
            router.push(`/contractor/messages?id=${project.id}`)
        }
    }

    const handleUpdateMilestoneStatus = async (milestoneId: string, newStatus: Milestone['status']) => {
        try {
            const res = await fetchWithAuth(`/api/contractors/milestones/${milestoneId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (res.ok) {
                toast.success('Đã cập nhật trạng thái!')
                fetchProjectDetail()
            } else {
                const error = await res.json()
                toast.error(error.message || 'Lỗi cập nhật')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        }
    }

    const handleAddMilestone = () => {
        setMilestoneForm({
            name: '',
            amount: (project ? (project.estimatedBudget / 4).toString() : '0'),
            dueDate: new Date().toISOString().split('T')[0]
        })
        setShowMilestoneModal(true)
    }

    const handleRecordExpense = () => {
        setExpenseForm({ amount: '', category: 'MATERIALS', notes: '' })
        setShowExpenseModal(true)
    }

    const submitExpense = async () => {
        if (!expenseForm.amount) return toast.error('Vui lòng nhập số tiền')
        try {
            const res = await fetchWithAuth(`/api/contractors/projects/${project?.id}/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expenseForm)
            })
            if (res.ok) {
                toast.success('Đã ghi nhận chi phí!')
                setShowExpenseModal(false)
                fetchProjectDetail()
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        }
    }

    const submitMilestone = async () => {
        if (!milestoneForm.name || !milestoneForm.amount) return toast.error('Vui lòng điền đủ thông tin')
        try {
            const res = await fetchWithAuth(`/api/contractors/projects/${project?.id}/milestones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(milestoneForm)
            })
            if (res.ok) {
                toast.success('Đã thêm giai đoạn thành công!')
                setShowMilestoneModal(false)
                fetchProjectDetail()
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        }
    }

    const handlePhotoReport = async (milestoneName: string) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e: any) => {
            const file = e.target.files[0]
            if (!file) return

            // Check connection
            if (!navigator.onLine) {
                try {
                    await savePendingReport({
                        projectId: project?.id || '',
                        fileBlob: file,
                        fileName: file.name,
                        fileType: file.type,
                        notes: `Báo cáo cho giai đoạn: ${milestoneName}`,
                        workerName: user?.name || 'Nhà thầu',
                        createdAt: Date.now()
                    })
                    toast.success('Đã lưu báo cáo offline. Sẽ tự động gửi khi có mạng!')
                } catch (err) {
                    toast.error('Lỗi khi lưu báo cáo offline')
                }
                return
            }

            const formData = new FormData()
            formData.append('file', file)

            toast.promise(
                (async () => {
                    const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
                    const uploadData = await uploadRes.json()
                    const reportRes = await fetchWithAuth('/api/contractors/reports', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            projectId: project?.id,
                            photoUrl: uploadData.data.url,
                            notes: `Báo cáo cho giai đoạn: ${milestoneName}`,
                            workerName: user?.name || 'Nhà thầu'
                        })
                    })
                    if (!reportRes.ok) throw new Error('Lỗi tạo báo cáo')
                    return 'Đã gửi báo cáo ảnh thành công!'
                })(),
                {
                    loading: 'Đang tải ảnh và gửi báo cáo...',
                    success: (msg: string) => msg,
                    error: (err: any) => err.message || 'Lỗi xử lý'
                }
            )
        }
        input.click()
    }

    const handleShowHistory = async () => {
        setShowClientHistory(true)
        setHistoryLoading(true)
        try {
            const res = await fetchWithAuth(`/api/contractors/team-dashboard`)
            const data = await res.json()
            if (data.success) {
                setClientReports(data.data.reports?.filter((r: any) => r.projectId === project?.id) || [])
            }
        } catch (err) {
            console.error(err)
        } finally {
            setHistoryLoading(false)
        }
    }

    const handleDownloadDoc = (docName: string) => {
        toast.success(`Đang tải tài liệu: ${docName}`)
    }

    const handleUploadDoc = async () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.onchange = async (e: any) => {
            const file = e.target.files[0]
            if (!file) return
            const formData = new FormData()
            formData.append('file', file)
            toast.promise(
                (async () => {
                    const res = await fetch('/api/upload', { method: 'POST', body: formData })
                    if (!res.ok) throw new Error('Lỗi tải lên')
                    return 'Đã tải lên tài liệu thành công!'
                })(),
                {
                    loading: 'Đang xử lý file...',
                    success: (msg: string) => msg,
                    error: (err: any) => err.message
                }
            )
        }
        input.click()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="mt-4 text-gray-500 font-medium">Đang tải chi tiết dự án...</p>
            </div>
        )
    }

    if (!project) return null

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-right" />
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <OfflineSyncManager />

            <main className={`flex-1 pt-[73px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <Link href="/contractor/projects" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-2 transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại danh sách
                            </Link>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{project.title}</h1>
                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {project.status === 'IN_PROGRESS' ? 'Đang thi công' : 'Mới khởi tạo'}
                                </span>
                                <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
                                    <MapPin className="w-4 h-4" />
                                    {project.city}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleChatWithClient} className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm">
                                <MessageCircle className="w-5 h-5 text-blue-500" />
                                Chat với khách
                            </button>
                            <button onClick={handleAddMilestone} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 no-print">
                                <Plus className="w-5 h-5" />
                                Thêm Milestone
                            </button>
                            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm no-print">
                                <Download className="w-5 h-5 text-gray-500" />
                                Xuất file PDF
                            </button>
                        </div>
                    </div>

                    {/* Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Tổng ngân sách</span>
                            </div>
                            <div className="text-2xl font-black text-gray-900">{formatCurrency(project.estimatedBudget || 0)}</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <Layout className="w-6 h-6 text-orange-600" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Tiến độ</span>
                            </div>
                            <div className="text-2xl font-black text-gray-900">{project.progress || 0}%</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <Wrench className="w-6 h-6 text-purple-600" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Milestones</span>
                            </div>
                            <div className="text-2xl font-black text-gray-900">{project.milestones?.filter(m => m.status === 'COMPLETED').length || 0}/{project.milestones?.length || 0}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Milestones */}
                            <section>
                                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <Clock className="w-6 h-6 text-blue-500" />
                                    Các giai đoạn (Milestones)
                                </h2>
                                <div className="space-y-4">
                                    {project.milestones?.length > 0 ? project.milestones.map((m, idx) => (
                                        <div key={m.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all">
                                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${m.status === 'COMPLETED' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 text-gray-300'}`}>
                                                {m.status === 'COMPLETED' ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <h4 className="font-bold text-gray-900 text-sm uppercase">{m.name}</h4>
                                                    <div className="text-right">
                                                        <div className="font-black text-gray-900 text-sm">{formatCurrency(m.amount)}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 mt-3">
                                                    {m.status === 'PENDING' && <button onClick={() => handleUpdateMilestoneStatus(m.id, 'IN_PROGRESS')} className="text-[10px] font-bold px-3 py-1 bg-gray-100 rounded-lg uppercase">Bắt đầu</button>}
                                                    {m.status === 'IN_PROGRESS' && <button onClick={() => handleUpdateMilestoneStatus(m.id, 'COMPLETED')} className="text-[10px] font-bold px-3 py-1 bg-green-500 text-white rounded-lg uppercase">Hoàn thành</button>}
                                                    <button onClick={() => handlePhotoReport(m.name)} className="text-[10px] font-bold px-3 py-1 border border-gray-100 rounded-lg uppercase">Gửi ảnh</button>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 font-medium font-bold">Chưa có giai đoạn nào.</p>
                                            <button onClick={handleAddMilestone} className="mt-4 text-blue-600 font-bold hover:underline">Thiết lập ngay</button>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Expenses */}
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                        <DollarSign className="w-6 h-6 text-green-500" />
                                        Bóc tách Lợi nhuận & Chi phí
                                    </h2>
                                    <button onClick={handleRecordExpense} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Ghi khoản chi
                                    </button>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
                                    <div className="grid grid-cols-2 gap-8 mb-8">
                                        <div className="p-6 bg-blue-50 rounded-3xl">
                                            <p className="text-[10px] font-black text-blue-600 uppercase mb-2">Tổng chi thực tế</p>
                                            <p className="text-2xl font-black text-gray-900">{formatCurrency(project.actualCost || 0)}</p>
                                        </div>
                                        <div className="p-6 bg-green-50 rounded-3xl">
                                            <p className="text-[10px] font-black text-green-600 uppercase mb-2">Lợi nhuận dự kiến</p>
                                            <p className="text-2xl font-black text-gray-900">{formatCurrency(project.estimatedBudget - (project.actualCost || 0))}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-gray-400 uppercase">Lịch sử chi gần nhất</h4>
                                        {project.expenses?.length > 0 ? project.expenses.map((exp: any) => (
                                            <div key={exp.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{exp.notes || 'Chi phí không tên'}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{exp.category}</p>
                                                </div>
                                                <p className="font-black text-red-600">{formatCurrency(exp.amount)}</p>
                                            </div>
                                        )) : <p className="text-sm text-gray-400 font-medium">Chưa có khoản chi nào được ghi nhận.</p>}
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Sidebar: Client */}
                        <div className="space-y-8">
                            <section>
                                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Chủ đầu tư</h2>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                                    <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-100">
                                        {project.contactName?.charAt(0)}
                                    </div>
                                    <h3 className="font-black text-gray-900">{project.contactName}</h3>
                                    <div className="flex gap-2 mt-6">
                                        <button onClick={handleChatWithClient} className="flex-1 py-2 bg-gray-50 rounded-xl font-bold text-sm hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4" /> Chat</button>
                                        <button onClick={handleShowHistory} className="flex-1 py-2 bg-gray-50 rounded-xl font-bold text-sm hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2"><Clock className="w-4 h-4" /> Lịch sử</button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* MODALS */}
                {showExpenseModal && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                                <h3 className="font-black uppercase tracking-tight">Ghi nhận chi phí</h3>
                                <button onClick={() => setShowExpenseModal(false)}><Plus className="w-6 h-6 rotate-45" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="Số tiền (Ví dụ: 1.000.000)" className="w-full px-4 py-3 bg-gray-50 rounded-2xl font-bold outline-none" />
                                    {expenseForm.amount && (
                                        <p className="text-[10px] font-black text-blue-600 ml-2">Xem trước: {formatCurrency(parseFloat(expenseForm.amount))}</p>
                                    )}
                                </div>
                                <select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-2xl font-bold outline-none">
                                    <option value="MATERIALS">Vật tư</option>
                                    <option value="LABOR">Nhân công</option>
                                    <option value="TRANSPORT">Vận chuyển</option>
                                    <option value="OTHER">Chi phí khác</option>
                                </select>
                                <textarea value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} placeholder="Lý do chi (Ví dụ: Mua sơn, trả lương thợ...)" rows={3} className="w-full px-4 py-3 bg-gray-50 rounded-2xl font-bold outline-none resize-none" />
                                <button onClick={submitExpense} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700">Lưu khoản chi</button>
                            </div>
                        </div>
                    </div>
                )}

                {showMilestoneModal && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
                                <h3 className="font-black uppercase tracking-tight">Thêm giai đoạn</h3>
                                <button onClick={() => setShowMilestoneModal(false)}><Plus className="w-6 h-6 rotate-45" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <input type="text" value={milestoneForm.name} onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })} placeholder="Tên giai đoạn" className="w-full px-4 py-3 bg-gray-50 rounded-2xl font-bold outline-none" />
                                <div className="space-y-1">
                                    <input type="number" value={milestoneForm.amount} onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })} placeholder="Giá trị giai đoạn" className="w-full px-4 py-3 bg-gray-50 rounded-2xl font-bold outline-none" />
                                    {milestoneForm.amount && (
                                        <p className="text-[10px] font-black text-indigo-600 ml-2">Xem trước: {formatCurrency(parseFloat(milestoneForm.amount))}</p>
                                    )}
                                </div>
                                <input type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-2xl font-bold outline-none" />
                                <button onClick={submitMilestone} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700">Khởi tạo</button>
                            </div>
                        </div>
                    </div>
                )}

                {showClientHistory && (
                    <div className="fixed inset-0 z-[110] flex justify-end">
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowClientHistory(false)} />
                        <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black">Lịch sử</h3>
                                <button onClick={() => setShowClientHistory(false)}><Plus className="w-6 h-6 rotate-45" /></button>
                            </div>
                            <div className="space-y-6">
                                {historyLoading ? <Loader2 className="w-10 h-10 animate-spin mx-auto" /> : clientReports.length > 0 ? clientReports.map(report => (
                                    <div key={report.id} className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="text-sm font-bold text-gray-900">{report.notes}</p>
                                        {report.photoUrl && <img src={report.photoUrl} alt="Report" className="w-full h-32 object-cover rounded-xl mt-3" />}
                                        <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">{new Date(report.createdAt).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                )) : <p className="text-center text-gray-400 font-bold mt-20">Chưa có lịch sử.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
