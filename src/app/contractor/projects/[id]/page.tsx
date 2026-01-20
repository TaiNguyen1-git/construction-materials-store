import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/app/contractor/components/Sidebar'
import {
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    Building2,
    User,
    Package,
    ChevronRight,
    ArrowLeft,
    Check,
    Play,
    Pause,
    Plus,
    Trash2,
    Edit,
    QrCode,
    Camera,
    HardHat,
    ExternalLink
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import WorkerReportWidget from '@/app/contractor/components/WorkerReportWidget'
import SiteMaterialRequestWidget from '@/app/contractor/components/SiteMaterialRequestWidget'

// ... interfaces as before

export default function ContractorProjectDetailPage() {
    const params = useParams()
    const projectId = params.id as string
    const [project, setProject] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('tasks')
    const [taskUpdating, setTaskUpdating] = useState<string | null>(null)
    const [magicToken, setMagicToken] = useState<string | null>(null)

    useEffect(() => {
        fetchProject()
        fetchMagicToken()
    }, [projectId])

    const fetchProject = async () => {
        try {
            const response = await fetchWithAuth(`/api/projects/${projectId}`)
            if (response.ok) {
                const result = await response.json()
                setProject(result)
            }
        } catch (error) {
            console.error('Error fetching project:', error)
            toast.error('Không thể tải thông tin công trình')
        } finally {
            setLoading(false)
        }
    }

    const fetchMagicToken = async () => {
        try {
            const response = await fetchWithAuth(`/api/contractors/projects/${projectId}/report-token`)
            if (response.ok) {
                const result = await response.json()
                setMagicToken(result.data?.token)
            }
        } catch (err) {
            console.error('Error fetching token:', err)
        }
    }

    const generateToken = async () => {
        try {
            const response = await fetchWithAuth(`/api/contractors/projects/${projectId}/report-token`, {
                method: 'POST'
            })
            if (response.ok) {
                const result = await response.json()
                setMagicToken(result.data.token)
                toast.success('Đã kích hoạt Cổng Hiện Trường')
            }
        } catch (err) {
            toast.error('Lỗi khi tạo mã')
        }
    }

    const updateTaskStatus = async (taskId: string, newStatus: string) => {
        setTaskUpdating(taskId)
        try {
            const response = await fetchWithAuth(`/api/projects/${projectId}/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            })

            if (response.ok) {
                toast.success('Cập nhật tiến độ thành công')
                fetchProject()
            } else {
                toast.error('Có lỗi xảy ra')
            }
        } catch (error) {
            console.error('Error updating task:', error)
            toast.error('Lỗi kết nối')
        } finally {
            setTaskUpdating(null)
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PLANNING': return 'Chuẩn bị'
            case 'IN_PROGRESS': return 'Đang thi công'
            case 'COMPLETED': return 'Hoàn thành'
            case 'ON_HOLD': return 'Tạm dừng'
            default: return status
        }
    }

    const getTaskStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-gray-100 text-gray-700'
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700'
            case 'COMPLETED': return 'bg-green-100 text-green-700'
            case 'CANCELLED': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!project) return null

    const reportUrl = `${window.location.protocol}//${window.location.host}/report/${magicToken}`

    return (
        <div className="min-h-screen bg-gray-50 font-bold">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="lg:ml-64">
                <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/contractor/projects" className="p-2 hover:bg-white rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5 text-gray-500" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                                <p className="text-gray-500 text-sm">Chủ nhà: {project.customer.user.name}</p>
                            </div>
                        </div>
                        <Badge className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm">
                            {getStatusText(project.status)}
                        </Badge>
                    </div>

                    {/* Site Access Card (Flow 1 & 2 logic) */}
                    <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1">
                                <h2 className="text-3xl font-black mb-2 flex items-center gap-2">
                                    <QrCode className="w-8 h-8" /> CỔNG HIỆN TRƯỜNG
                                </h2>
                                <p className="text-blue-100 font-medium mb-6 max-w-md">
                                    Dán mã QR này tại công trình để thợ có thể gửi ảnh báo cáo và yêu cầu vật tư tức thì mà không cần ứng dụng.
                                </p>

                                {!magicToken ? (
                                    <button
                                        onClick={generateToken}
                                        className="bg-white text-blue-700 px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform"
                                    >
                                        KÍCH HOẠT CỔNG QR
                                    </button>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(reportUrl)
                                                toast.success('Đã sao chép link')
                                            }}
                                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-3 rounded-xl text-sm font-black transition-all border border-white/20"
                                        >
                                            SAO CHÉP LINK
                                        </button>
                                        <a
                                            href={reportUrl}
                                            target="_blank"
                                            className="bg-green-500 text-white px-6 py-3 rounded-xl text-sm font-black shadow-lg flex items-center gap-2"
                                        >
                                            <ExternalLink className="w-4 h-4" /> TRUY CẬP THỬ
                                        </a>
                                    </div>
                                )}
                            </div>

                            {magicToken && (
                                <div className="bg-white p-4 rounded-3xl shadow-2xl flex flex-col items-center">
                                    <div className="w-40 h-40 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
                                        {/* Mock QR - in real use, use qrcode.react */}
                                        <QrCode className="w-24 h-24 text-gray-300" />
                                    </div>
                                    <span className="text-gray-900 text-[10px] uppercase font-black tracking-widest mt-3">Mã QR Công Trình</span>
                                </div>
                            )}
                        </div>
                        {/* Decorative background circles */}
                        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-[-50px] left-[-100px] w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <span className="text-sm text-gray-500 font-bold">Tổng tiến độ</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{project.taskCompletion}%</p>
                            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${project.taskCompletion}%` }} />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <span className="text-sm text-gray-500 font-bold">Ngày bắt đầu</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                                {new Date(project.startDate).toLocaleDateString('vi-VN')}
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <User className="w-5 h-5" />
                                </div>
                                <span className="text-sm text-gray-500 font-bold">Liên hệ chủ nhà</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">{project.customer.user.phone}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 overflow-x-auto bg-white rounded-t-2xl">
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`px-6 py-4 text-sm font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'tasks' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Đầu việc
                        </button>
                        <button
                            onClick={() => setActiveTab('site')}
                            className={`px-6 py-4 text-sm font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'site' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <Camera className="w-4 h-4" /> Báo cáo & Vật tư hiện trường
                        </button>
                        <button
                            onClick={() => setActiveTab('materials')}
                            className={`px-6 py-4 text-sm font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'materials' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Dự toán vật tư
                        </button>
                    </div>

                    {/* Content */}
                    <div className="min-h-[400px]">
                        {activeTab === 'tasks' ? (
                            <div className="space-y-4">
                                {project.projectTasks?.map((task: any) => (
                                    <div key={task.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-gray-900">{task.name}</h3>
                                                <Badge className={getTaskStatusColor(task.status)}>
                                                    {task.status === 'IN_PROGRESS' ? 'Đang làm' :
                                                        task.status === 'COMPLETED' ? 'Hoàn thành' : 'Chờ làm'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-500 italic font-medium">{task.description || 'Không có mô tả chi tiết'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {task.status !== 'COMPLETED' && (
                                                <button
                                                    disabled={taskUpdating === task.id}
                                                    onClick={() => updateTaskStatus(task.id, task.status === 'IN_PROGRESS' ? 'COMPLETED' : 'IN_PROGRESS')}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${task.status === 'IN_PROGRESS' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-blue-600 text-white shadow-lg shadow-blue-100'}`}
                                                >
                                                    {task.status === 'IN_PROGRESS' ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                    {taskUpdating === task.id ? '...' : (task.status === 'IN_PROGRESS' ? 'Xong' : 'Làm')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'site' ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                <WorkerReportWidget projectId={projectId} />
                                <SiteMaterialRequestWidget projectId={projectId} />
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vật tư</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Số lượng</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {project.projectMaterials?.map((material: any) => (
                                            <tr key={material.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                                            <Package className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900">{material.product.name}</div>
                                                            <div className="text-xs text-gray-500">SKU: {material.product.sku}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {material.quantity} đơn vị
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge className={material.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : material.status === 'ORDERED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                                                        {material.status === 'DELIVERED' ? 'Đã giao' : material.status === 'ORDERED' ? 'Đang chuẩn bị' : 'Đã yêu cầu'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
