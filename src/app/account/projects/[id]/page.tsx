'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Play,
  Pause,
  Check,
  User,
  Package,
  FileText,
  Plus,
  ChevronRight,
  MessageCircle,
  TrendingUp,
  Map
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Header from '@/components/Header'
import ProjectRoadmap from '@/components/ProjectRoadmap'

interface Project {
  id: string
  name: string
  description: string | null
  contractorId: string | null
  status: string
  startDate: string
  endDate: string | null
  budget: number
  actualCost: number
  progress: number
  priority: string
  notes: string | null
  createdAt: string
  updatedAt: string
  taskCompletion: number
  totalTasks: number
  completedTasks: number
  totalMaterialCost: number
  customer: {
    user: {
      name: string
      email: string
    }
  }
  contractor: {
    user: {
      name: string
      email: string
    }
  } | null
  projectTasks: Task[]
  projectMaterials: Material[]
}

interface Task {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  startDate: string | null
  dueDate: string | null
  completedAt: string | null
  estimatedHours: number | null
  actualHours: number | null
  progress: number
  notes: string | null
  createdAt: string
  updatedAt: string
  assignee: {
    user: {
      name: string
    } | null
  } | null
}

interface Material {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: string
  requestedAt: string
  deliveredAt: string | null
  notes: string | null
  product: {
    name: string
    sku: string
    price: number
  }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [fetchingMatch, setFetchingMatch] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}`)

      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        toast.error('Failed to load project')
        router.push('/account/projects')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      toast.error('Failed to load project')
      router.push('/account/projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (project && !project.contractorId) {
      fetchRecommendations()
    }
  }, [project?.id, project?.contractorId])

  const fetchRecommendations = async () => {
    try {
      setFetchingMatch(true)
      const res = await fetch(`/api/contractors/matching?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setRecommendations(data.data.recommendations || [])
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setFetchingMatch(false)
    }
  }

  const handleChat = async (contractor: any) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: localStorage.getItem('user_id'),
          senderName: localStorage.getItem('user_name'),
          recipientId: contractor.customerId,
          recipientName: contractor.displayName,
          projectId: project?.id,
          projectTitle: project?.name,
          initialMessage: `Chào ${contractor.displayName}, tôi muốn trao đổi về dự án "${project?.name}" của tôi.`
        })
      })

      if (res.ok) {
        router.push('/messages')
      }
    } catch (error) {
      toast.error('Không thể mở cuộc hội thoại')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800'
      case 'MEDIUM': return 'bg-blue-100 text-blue-800'
      case 'HIGH': return 'bg-yellow-100 text-yellow-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMaterialStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED': return 'bg-gray-100 text-gray-800'
      case 'ORDERED': return 'bg-blue-100 text-blue-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 25) return 'bg-yellow-500'
    return 'bg-gray-300'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <Link href="/account/projects" className="text-primary-600 hover:text-primary-800 flex items-center mb-4 font-bold">
            <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
            Quay lại danh sách dự án
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-gray-900">{project.name}</h1>
              <p className="mt-2 text-gray-500 font-medium">
                {project.description || 'Không có mô tả dự án'}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${getPriorityColor(project.priority)}`}>
                {project.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Tiến Độ</p>
                <p className="text-2xl font-black text-gray-900">{project.taskCompletion}%</p>
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getProgressColor(project.taskCompletion)}`}
                style={{ width: `${project.taskCompletion}%` }}
              />
            </div>
          </div>

          {[
            { label: 'Ngân Sách', value: project.budget, icon: DollarSign, color: 'green' },
            { label: 'Đã Chi', value: project.actualCost, icon: Clock, color: 'purple' },
            { label: 'Vật Tư', value: project.totalMaterialCost, icon: Package, color: 'yellow' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`p-3 bg-${stat.color}-50 rounded-xl text-${stat.color}-600`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-xl font-black text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stat.value)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'roadmap', 'tasks', 'materials'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-black text-sm uppercase tracking-wider transition-all ${activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                  }`}
              >
                {tab === 'overview' ? 'Tổng Quan' : tab === 'roadmap' ? 'Lộ Trình' : tab === 'tasks' ? `Công Việc (${project.totalTasks})` : `Vật Tư (${project.projectMaterials.length})`}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border p-8 lg:col-span-2 shadow-sm">
                <h3 className="text-xl font-black text-gray-900 mb-6">Thông Tin Chi Tiết</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase mb-1">Ngày Bắt Đầu</p>
                    <p className="text-md font-bold text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-primary-600" />
                      {new Date(project.startDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase mb-1">Dự Kiến Hoàn Thành</p>
                    <p className="text-md font-bold text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-primary-600" />
                      {project.endDate ? new Date(project.endDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase mb-1">Nhà Thầu Đảm Nhiệm</p>
                    <p className="text-md font-bold text-gray-900 flex items-center">
                      <User className="h-4 w-4 mr-2 text-blue-600" />
                      {project.contractor?.user.name || 'Chưa có nhà thầu'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase mb-1">Liên Hệ Nhà Thầu</p>
                    <p className="text-md font-bold text-gray-900">{project.contractor?.user.email || '-'}</p>
                  </div>
                </div>
                {project.notes && (
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <p className="text-xs font-black text-gray-400 uppercase mb-2">Ghi Chú Dự Án</p>
                    <div className="bg-gray-50 p-4 rounded-xl text-gray-700 font-medium italic">
                      "{project.notes}"
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border p-8 shadow-sm">
                <h3 className="text-xl font-black text-gray-900 mb-6">Thống Kê Công Việc</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-gray-500">Hoàn thành</span>
                      <span className="text-primary-600">{project.completedTasks} / {project.totalTasks}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${getProgressColor((project.completedTasks / project.totalTasks) * 100)}`}
                        style={{ width: `${(project.completedTasks / project.totalTasks) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4">
                    {[
                      { label: 'Chờ', count: project.projectTasks.filter(t => t.status === 'PENDING').length, color: 'gray' },
                      { label: 'Làm', count: project.projectTasks.filter(t => t.status === 'IN_PROGRESS').length, color: 'blue' },
                      { label: 'Xong', count: project.projectTasks.filter(t => t.status === 'COMPLETED').length, color: 'green' }
                    ].map((s, idx) => (
                      <div key={idx} className={`bg-${s.color}-50 p-4 rounded-2xl text-center border border-${s.color}-100`}>
                        <p className={`text-xl font-black text-${s.color}-700`}>{s.count}</p>
                        <p className={`text-[10px] font-black text-${s.color}-500 uppercase tracking-widest mt-1`}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            {!project.contractorId && recommendations.length > 0 && (
              <div className="bg-white rounded-3xl border-2 border-primary-100 p-8 shadow-xl shadow-primary-50">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                      <TrendingUp className="h-7 w-7 text-primary-600" />
                      Gợi Ý Nhà Thầu Hiệu Quả (AI Matching)
                    </h3>
                    <p className="text-gray-500 font-medium mt-1">Dựa trên yêu cầu dự án và dữ liệu năng lực nhà thầu</p>
                  </div>
                  <Link href="/contractors" className="text-primary-600 font-bold hover:underline">Xem thêm →</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-2xl transition-all border-l-4 border-l-primary-600 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                            {rec.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Phù Hợp 98%</span>
                        </div>
                        <h4 className="text-lg font-black text-gray-900 mb-2 truncate">{rec.displayName}</h4>
                        <div className="space-y-2 mb-8">
                          {rec.matchReasons.map((reason: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-600 font-medium leading-snug">
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleChat(rec)}
                          className="bg-white border-2 border-primary-600 text-primary-600 hover:bg-primary-50 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <MessageCircle className="h-4 w-4" /> Chat
                        </button>
                        <Link
                          href={`/contractors/${rec.id}`}
                          className="bg-primary-600 text-white hover:bg-primary-700 py-3 rounded-xl text-xs font-bold text-center flex items-center justify-center transition-all"
                        >Hồ Sơ</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Roadmap Tab */}
        {activeTab === 'roadmap' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <ProjectRoadmap
              estimateId={project.id}
              projectType={project.description?.includes('Lát nền') ? 'flooring' :
                project.description?.includes('Sơn') ? 'painting' : 'general'}
              area={project.budget / 1000000} // Estimate area from budget
              materials={project.projectMaterials.map(m => ({
                productId: m.product?.sku,
                productName: m.product?.name,
                quantity: m.quantity,
                unit: 'pcs'
              }))}
              startDate={project.startDate}
            />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900">Tiến Độ Theo Từng Công Việc</h3>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-700 flex items-center transition-all shadow-lg shadow-primary-100">
                <Plus className="h-4 w-4 mr-2" /> Thêm Việc Mới
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Hạng Mục</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Mức Độ</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Hạn Định</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Trạng Thái</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tiến Độ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {project.projectTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="px-6 py-6">
                        <p className="font-bold text-gray-900 text-sm">{task.name}</p>
                        <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">{task.description}</p>
                      </td>
                      <td className="px-6 py-6 font-bold text-xs uppercase">
                        <span className={`px-3 py-1 rounded-lg ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                      </td>
                      <td className="px-6 py-6 text-sm text-gray-500 font-medium">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="px-6 py-6 font-bold text-xs uppercase">
                        <span className={`px-3 py-1 rounded-lg ${getTaskStatusColor(task.status)}`}>{task.status.replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${getProgressColor(task.progress)}`} style={{ width: `${task.progress}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-gray-400">{task.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900">Chi Tiết Vật Tư & Thiết Bị</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tên Vật Tư</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Khối Lượng</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Đơn Giá</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Thành Tiền</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tình Trạng</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {project.projectMaterials.map((material) => (
                    <tr key={material.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="px-6 py-6">
                        <p className="font-bold text-gray-900 text-sm">{material.product.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-1">SKU: {material.product.sku}</p>
                      </td>
                      <td className="px-6 py-6 font-bold text-sm text-gray-700">{material.quantity}</td>
                      <td className="px-6 py-6 text-sm text-gray-500">{new Intl.NumberFormat('vi-VN').format(material.unitPrice)} ₫</td>
                      <td className="px-6 py-6 font-black text-sm text-primary-700">{new Intl.NumberFormat('vi-VN').format(material.totalPrice)} ₫</td>
                      <td className="px-6 py-6">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${getMaterialStatusColor(material.status)}`}>
                          {material.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}