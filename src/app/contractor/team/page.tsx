'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, Copy, ExternalLink, Package, Check, X, Clock, RefreshCw, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'

export default function ContractorTeamPage() {
    const { user } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        // Only open by default on large screens
        if (window.innerWidth >= 1024) {
            setSidebarOpen(true)
        }
    }, [])
    const DEFAULT_MEMBERS = [
        { name: 'Nguyễn Văn Hùng', role: 'Thợ chính (Cai thợ)', status: 'ACTIVE', projects: 2 },
        { name: 'Trần Minh Đức', role: 'Thợ điện nước', status: 'ACTIVE', projects: 1 },
        { name: 'Lê Hoàng Nam', role: 'Thợ xây', status: 'ON_LEAVE', projects: 0 }
    ]

    const [activeTab, setActiveTab] = useState<'LINKS' | 'REQUESTS' | 'MEMBERS'>('REQUESTS')
    const [data, setData] = useState<any>({ projects: [], requests: [], reports: [], members: DEFAULT_MEMBERS })
    const [loading, setLoading] = useState(true)
    const [showMemberModal, setShowMemberModal] = useState(false)
    const [editingMember, setEditingMember] = useState<any>(null)
    const [memberForm, setMemberForm] = useState({ name: '', role: '', status: 'ACTIVE', projects: 0 })

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetchWithAuth('/api/contractors/team-dashboard')
            if (res.ok) {
                const json = await res.json()
                setData({
                    ...json.data,
                    members: json.data.members?.length > 0 ? json.data.members : DEFAULT_MEMBERS
                })
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    const handleGenerateToken = async (projectId: string) => {
        try {
            const res = await fetchWithAuth(`/api/contractors/projects/${projectId}/report-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'CREATE' })
            })
            if (res.ok) {
                toast.success('Đã tạo link mới')
                fetchData() // Refresh to see token
            }
        } catch (e) {
            toast.error('Lỗi tạo link')
        }
    }

    const copyLink = async (token: string) => {
        const link = `${window.location.origin}/report/${token}`
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(link)
                toast.success('Đã copy link báo cáo')
            } else {
                const textArea = document.createElement("textarea")
                textArea.value = link
                textArea.style.position = "fixed"
                textArea.style.left = "-9999px"
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()
                document.execCommand('copy')
                document.body.removeChild(textArea)
                toast.success('Đã copy link báo cáo')
            }
        } catch (err) {
            toast.error('Lỗi khi copy link')
        }
    }

    const handleDownloadQR = (projectId: string, token: string) => {
        const link = `${window.location.origin}/report/${token}`
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`

        toast.promise(
            fetch(qrUrl)
                .then(res => res.blob())
                .then(blob => {
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `QR-Bao-Cao-${projectId.slice(-4)}.png`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                }),
            {
                loading: 'Đang chuẩn bị ảnh QR...',
                success: 'Đã tải mã QR thành công!',
                error: 'Không thể tải ảnh QR'
            }
        )
    }

    const handleApproveRequest = async (id: string, items: any[]) => {
        // Here we would call an API, but for demo UI we'll just toast
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Đang thêm vào giỏ hàng...',
                success: 'Đã thêm vật tư vào giỏ hàng!',
                error: 'Lỗi'
            }
        )
        // Optimistic update
        setData({
            ...data,
            requests: data.requests.filter((r: any) => r.id !== id)
        })
    }

    const handleAddMember = () => {
        setEditingMember(null)
        setMemberForm({ name: '', role: '', status: 'ACTIVE', projects: 0 })
        setShowMemberModal(true)
    }

    const handleEditMember = (member: any) => {
        setEditingMember(member)
        setMemberForm({ ...member })
        setShowMemberModal(true)
    }

    const handleSaveMember = () => {
        if (!memberForm.name || !memberForm.role) return toast.error('Vui lòng điền đủ thông tin')

        let newMembers = [...(data.members || [])]
        if (editingMember) {
            newMembers = newMembers.map(m => m.name === editingMember.name ? memberForm : m)
            toast.success('Đã cập nhật thành viên')
        } else {
            newMembers.push(memberForm)
            toast.success('Đã thêm thành viên mới')
        }

        setData({ ...data, members: newMembers })
        setShowMemberModal(false)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className={`flex-1 pt-[73px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Users className="w-6 h-6" /> Quản lý Đội thợ & Vật tư
                    </h1>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-6 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('REQUESTS')}
                            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'REQUESTS' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <Package className="w-4 h-4" />
                            Yêu cầu Vật tư
                            {data.requests.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{data.requests.length}</span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('LINKS')}
                            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'LINKS' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <ExternalLink className="w-4 h-4" />
                            Link Báo cáo / QR
                        </button>
                        <button
                            onClick={() => setActiveTab('MEMBERS')}
                            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'MEMBERS' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <Users className="w-4 h-4" />
                            Thành viên Đội
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-12"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div>
                    ) : (
                        <>
                            {activeTab === 'REQUESTS' && (
                                <div className="space-y-4">
                                    {data.requests.length === 0 ? (
                                        <div className="text-center p-12 bg-gray-50 rounded-xl text-gray-500">
                                            Không có yêu cầu vật tư nào cần duyệt
                                        </div>
                                    ) : (
                                        data.requests.map((req: any) => (
                                            <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Mới</span>
                                                            <span className="text-sm font-bold text-gray-900">{req.project?.title || 'Dự án chưa đặt tên'}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-500">
                                                            Yêu cầu bởi <span className="font-bold text-gray-900">{req.workerName}</span> • {new Date(req.createdAt).toLocaleString('vi-VN')}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-100">
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveRequest(req.id, req.items)}
                                                            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                                                        >
                                                            <Check className="w-4 h-4" /> Duyệt & Thêm vào Giỏ
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Danh sách vật tư</h4>
                                                    <div className="space-y-2">
                                                        {req.items.map((item: any, i: number) => (
                                                            <div key={i} className="flex justify-between items-center text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                                                <span className="font-medium text-gray-700">{item.name}</span>
                                                                <span className="font-bold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">{item.quantity} {item.unit}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {req.notes && (
                                                        <div className="mt-4 pt-3 border-t border-gray-200 text-sm text-gray-600 italic">
                                                            "{req.notes}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'LINKS' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {data.projects.map((project: any) => (
                                        <div key={project.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="font-bold text-gray-900 line-clamp-1" title={project.name}>{project.name}</h3>
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${project.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {project.status === 'IN_PROGRESS' ? 'Đang thi công' : project.status}
                                                </span>
                                            </div>

                                            <div className="bg-blue-50 rounded-lg p-5 mb-4 text-center border border-blue-100">
                                                {project.activeToken ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="bg-white p-3 rounded-xl shadow-sm mb-3">
                                                            <img
                                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/report/${project.activeToken}`)}`}
                                                                alt="QR Code"
                                                                className="w-24 h-24 mix-blend-multiply"
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-blue-700 font-black uppercase tracking-widest mb-2">Quét để báo cáo</p>
                                                        <button
                                                            onClick={() => handleDownloadQR(project.id, project.activeToken)}
                                                            className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                                                        >
                                                            <Download className="w-3 h-3" /> Tải mã về in
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic py-2">Chưa có link báo cáo</p>
                                                )}
                                            </div>

                                            {project.activeToken ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => copyLink(project.activeToken)}
                                                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                                                    >
                                                        <Copy className="w-4 h-4" /> Copy Link
                                                    </button>
                                                    <Link
                                                        href={`/report/${project.activeToken}`}
                                                        target="_blank"
                                                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                                        title="Mở thử"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleGenerateToken(project.id)}
                                                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                                                >
                                                    <Plus className="w-4 h-4" /> Tạo Link Báo Cáo
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {data.projects.length === 0 && (
                                        <div className="col-span-full text-center p-12 text-gray-400">
                                            Bạn chưa có dự án nào đang chạy.
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'MEMBERS' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Quản lý nhân sự</h3>
                                            <p className="text-sm text-gray-500">Mời và phân quyền cho các thành viên trong đội của bạn.</p>
                                        </div>
                                        <button onClick={handleAddMember} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100">
                                            <Plus className="w-5 h-5" /> Mời Thành Viên
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {(data.members || []).map((member: any, idx: number) => (
                                            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all group">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold text-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-gray-900 truncate">{member.name}</h4>
                                                        <p className="text-xs text-gray-500 font-medium">{member.role}</p>
                                                    </div>
                                                    <div className={`w-2 h-2 rounded-full ${member.status === 'ACTIVE' ? 'bg-green-500' :
                                                        member.status === 'ON_LEAVE' ? 'bg-orange-500' :
                                                            'bg-red-500'
                                                        }`} title={
                                                            member.status === 'ACTIVE' ? 'Đang làm' :
                                                                member.status === 'ON_LEAVE' ? 'Nghỉ phép' : 'Nghỉ việc'
                                                        } />
                                                </div>
                                                <div className="flex items-center justify-between text-xs font-bold pt-4 border-t border-gray-50">
                                                    <div className="text-gray-400 uppercase tracking-widest">{member.projects} Dự án</div>
                                                    <button onClick={() => handleEditMember(member)} className="text-blue-600 hover:underline">Quản lý</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Member Form Modal */}
                {showMemberModal && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                                <h3 className="font-black uppercase tracking-tight">{editingMember ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}</h3>
                                <button onClick={() => setShowMemberModal(false)}><X className="w-6 h-6" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Họ và tên</label>
                                    <input type="text" value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} placeholder="Nguyễn Văn A" className="w-full px-4 py-3 bg-gray-50 rounded-2xl font-bold outline-none border border-transparent focus:border-blue-200 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Vai trò / Chuyên môn</label>
                                    <input type="text" value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })} placeholder="Ví dụ: Thợ điện, Cai thợ..." className="w-full px-4 py-3 bg-gray-50 rounded-2xl font-bold outline-none border border-transparent focus:border-blue-200 transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Trạng thái</label>
                                        <select value={memberForm.status} onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-2xl font-bold outline-none">
                                            <option value="ACTIVE">Đang làm</option>
                                            <option value="ON_LEAVE">Nghỉ phép</option>
                                            <option value="INACTIVE">Đã nghỉ việc</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Số dự án</label>
                                        <input type="number" value={memberForm.projects} onChange={(e) => setMemberForm({ ...memberForm, projects: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-gray-50 rounded-2xl font-bold outline-none" />
                                    </div>
                                </div>
                                <button onClick={handleSaveMember} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Lưu thông tin</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
