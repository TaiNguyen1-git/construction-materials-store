'use client'

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
    Edit
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'

interface Task {
    id: string
    name: string
    description: string | null
    status: string
    priority: string
    startDate: string | null
    dueDate: string | null
    completedAt: string | null
}

interface Material {
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    status: string
    product: {
        name: string
        sku: string
    }
}

interface Project {
    id: string
    name: string
    description: string
    status: string
    startDate: string
    endDate: string | null
    taskCompletion: number
    totalTasks: number
    completedTasks: number
    customer: {
        user: {
            name: string
            phone: string
        }
    }
    projectTasks: Task[]
    projectMaterials: Material[]
}

export default function ContractorProjectDetailPage() {
    const params = useParams()
    const projectId = params.id as string
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('tasks')
    const [taskUpdating, setTaskUpdating] = useState<string | null>(null)

    useEffect(() => {
        fetchProject()
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
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Công việc & Tiến độ
                        </button>
                        <button
                            onClick={() => setActiveTab('materials')}
                            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'materials' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Vật tư dự kiến
                        </button>
                    </div>

                    {/* Content */}
                    <div className="min-h-[400px]">
                        {activeTab === 'tasks' ? (
                            <div className="space-y-4">
                                {project.projectTasks?.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed">
                                        <p className="text-gray-500">Chưa có danh sách công việc được phân công.</p>
                                    </div>
                                ) : (
                                    project.projectTasks?.map((task) => (
                                        <div key={task.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-gray-900">{task.name}</h3>
                                                    <Badge className={getTaskStatusColor(task.status)}>
                                                        {task.status === 'IN_PROGRESS' ? 'Đang làm' :
                                                            task.status === 'COMPLETED' ? 'Hoàn thành' : 'Chờ làm'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-500 italic">{task.description || 'Không có mô tả chi tiết'}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        Hạn: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không hạn'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {task.status !== 'COMPLETED' && (
                                                    <button
                                                        disabled={taskUpdating === task.id}
                                                        onClick={() => updateTaskStatus(task.id, task.status === 'IN_PROGRESS' ? 'COMPLETED' : 'IN_PROGRESS')}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${task.status === 'IN_PROGRESS'
                                                                ? 'bg-green-600 text-white hover:bg-green-700'
                                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                                            }`}
                                                    >
                                                        {task.status === 'IN_PROGRESS' ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                        {taskUpdating === task.id ? 'Đang xử lý...' : (task.status === 'IN_PROGRESS' ? 'Hoàn thành' : 'Bắt đầu')}
                                                    </button>
                                                )}
                                                {task.status === 'COMPLETED' && (
                                                    <button
                                                        disabled={taskUpdating === task.id}
                                                        onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200"
                                                    >
                                                        <Pause className="w-4 h-4" />
                                                        Mở lại
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
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
                                        {project.projectMaterials?.map((material) => (
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
                                                    <Badge className={
                                                        material.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                            material.status === 'ORDERED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                    }>
                                                        {material.status === 'DELIVERED' ? 'Đã giao' :
                                                            material.status === 'ORDERED' ? 'Đang chuẩn bị' : 'Đã yêu cầu'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                        {project.projectMaterials?.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                                    Chưa có thông tin vật tư cho công trình này.
                                                </td>
                                            </tr>
                                        )}
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
