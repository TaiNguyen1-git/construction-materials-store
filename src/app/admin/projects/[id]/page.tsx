'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchWithAuth } from '@/lib/api-client'
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
  Building2,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Trash
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import FormModal from '@/components/FormModal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Badge } from '@/components/ui/badge'

interface Project {
  id: string
  name: string
  description: string | null
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
  contractorId: string | null
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
    id: string
    name: string
    sku: string
    price: number
  }
}

export default function AdminProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [employees, setEmployees] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [contractors, setContractors] = useState<any[]>([])

  // Task Form State
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [taskFormLoading, setTaskFormLoading] = useState(false)
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    assigneeId: '',
    startDate: '',
    dueDate: '',
    estimatedHours: 0,
    notes: ''
  })

  // Material Form State
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null)
  const [materialFormLoading, setMaterialFormLoading] = useState(false)
  const [materialForm, setMaterialForm] = useState({
    productId: '',
    quantity: 1,
    unitPrice: 0,
    status: 'REQUESTED',
    notes: ''
  })

  // Contractor Assign State
  const [showContractorModal, setShowContractorModal] = useState(false)
  const [selectedContractorId, setSelectedContractorId] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)

  useEffect(() => {
    fetchProject()
    fetchEmployees()
    fetchProducts()
    fetchContractors()
  }, [projectId])

  const fetchContractors = async () => {
    try {
      const response = await fetchWithAuth('/api/customers?type=CONTRACTOR')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data && Array.isArray(result.data.data)) {
          setContractors(result.data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching contractors:', error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetchWithAuth('/api/employees')
      if (response.ok) {
        const result = await response.json()
        // API returns { success: true, data: { data: [], pagination: {} } }
        if (result.success && result.data && Array.isArray(result.data.data)) {
          setEmployees(result.data.data)
        } else if (Array.isArray(result)) {
          setEmployees(result)
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetchWithAuth('/api/products')
      if (response.ok) {
        const result = await response.json()
        // Handle both simple array and success/data wrapper
        if (result.success && result.data && Array.isArray(result.data.data)) {
          setProducts(result.data.data)
        } else if (result.success && result.data && Array.isArray(result.data.products)) {
          setProducts(result.data.products)
        } else if (Array.isArray(result)) {
          setProducts(result)
        } else if (result.products) {
          setProducts(result.products)
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetchWithAuth(`/api/projects/${projectId}`)

      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        toast.error('Không thể tải dự án')
        router.push('/admin/projects')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      toast.error('Không thể tải dự án')
      router.push('/admin/projects')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa dự án này? Hành động này không thể hoàn tác.')) {
      return
    }

    try {
      const response = await fetchWithAuth(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Xóa dự án thành công')
        router.push('/admin/projects')
      } else {
        toast.error('Không thể xóa dự án')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Không thể xóa dự án')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-800'
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800'
      case 'HIGH':
        return 'bg-yellow-100 text-yellow-800'
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMaterialStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return 'bg-gray-100 text-gray-800'
      case 'ORDERED':
        return 'bg-blue-100 text-blue-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-600'
    if (progress >= 75) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 25) return 'bg-yellow-500'
    return 'bg-gray-300'
  }

  const openTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task)
      setTaskForm({
        name: task.name,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assigneeId: (task.assignee as any)?.id || '',
        startDate: task.startDate ? task.startDate.split('T')[0] : '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        estimatedHours: task.estimatedHours || 0,
        notes: task.notes || ''
      })
    } else {
      setEditingTask(null)
      setTaskForm({
        name: '',
        description: '',
        status: 'PENDING',
        priority: 'MEDIUM',
        assigneeId: '',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        estimatedHours: 0,
        notes: ''
      })
    }
    setShowTaskModal(true)
  }

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTaskFormLoading(true)
    try {
      const url = editingTask
        ? `/api/projects/${projectId}/tasks/${editingTask.id}`
        : `/api/projects/${projectId}/tasks`
      const method = editingTask ? 'PUT' : 'POST'

      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(taskForm)
      })

      if (response.ok) {
        toast.success(editingTask ? 'Cập nhật công việc thành công' : 'Thêm công việc thành công')
        setShowTaskModal(false)
        fetchProject() // Refresh project data to see new task and updated progress
      } else {
        const error = await response.json()
        toast.error(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error('Không thể lưu công việc')
    } finally {
      setTaskFormLoading(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!deletingTask) return
    setTaskFormLoading(true)
    try {
      const response = await fetchWithAuth(`/api/projects/${projectId}/tasks/${deletingTask.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Xóa công việc thành công')
        setDeletingTask(null)
        fetchProject()
      } else {
        toast.error('Không thể xóa công việc')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Không thể xóa công việc')
    } finally {
      setTaskFormLoading(false)
    }
  }

  const openMaterialModal = (material?: Material) => {
    if (material) {
      setEditingMaterial(material)
      setMaterialForm({
        productId: material.product.id,
        quantity: material.quantity,
        unitPrice: material.unitPrice,
        status: material.status,
        notes: material.notes || ''
      })
    } else {
      setEditingMaterial(null)
      setMaterialForm({
        productId: '',
        quantity: 1,
        unitPrice: 0,
        status: 'REQUESTED',
        notes: ''
      })
    }
    setShowMaterialModal(true)
  }

  const handleProductChange = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId)
    setMaterialForm(prev => ({
      ...prev,
      productId,
      unitPrice: selectedProduct ? selectedProduct.price : 0
    }))
  }

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMaterialFormLoading(true)
    try {
      const url = editingMaterial
        ? `/api/projects/${projectId}/materials/${editingMaterial.id}`
        : `/api/projects/${projectId}/materials`
      const method = editingMaterial ? 'PUT' : 'POST'

      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(materialForm)
      })

      if (response.ok) {
        toast.success(editingMaterial ? 'Cập nhật vật liệu thành công' : 'Thêm vật liệu thành công')
        setShowMaterialModal(false)
        fetchProject()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error saving material:', error)
      toast.error('Không thể lưu vật liệu')
    } finally {
      setMaterialFormLoading(false)
    }
  }

  const handleAssignContractor = async () => {
    if (!selectedContractorId) return
    setAssignLoading(true)
    try {
      const response = await fetchWithAuth(`/api/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({ contractorId: selectedContractorId })
      })

      if (response.ok) {
        toast.success('Phân công nhà thầu thành công')
        setShowContractorModal(false)
        fetchProject()
      } else {
        toast.error('Có lỗi xảy ra khi phân công')
      }
    } catch (error) {
      console.error('Error assigning contractor:', error)
      toast.error('Lỗi kết nối server')
    } finally {
      setAssignLoading(false)
    }
  }

  const handleDeleteMaterial = async () => {
    if (!deletingMaterial) return
    setMaterialFormLoading(true)
    try {
      const response = await fetchWithAuth(`/api/projects/${projectId}/materials/${deletingMaterial.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Xóa vật liệu thành công')
        setDeletingMaterial(null)
        fetchProject()
      } else {
        toast.error('Không thể xóa vật liệu')
      }
    } catch (error) {
      console.error('Error deleting material:', error)
      toast.error('Không thể xóa vật liệu')
    } finally {
      setMaterialFormLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy dự án</h3>
        <p className="mt-1 text-sm text-gray-500">Không thể tìm thấy dự án yêu cầu.</p>
        <div className="mt-6">
          <Link
            href="/admin/projects"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Trở Về Danh Sách Dự Án
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/projects" className="text-blue-600 hover:text-blue-800 flex items-center mb-2">
          <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
          Trở Về Danh Sách Dự Án
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {project.description || 'Không có mô tả'}
            </p>
          </div>
          <div className="flex space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {project.status.replace('_', ' ')}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
              {project.priority}
            </span>
            <button
              onClick={handleDeleteProject}
              className="text-red-600 hover:text-red-900 flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Xóa
            </button>
          </div>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Tiến Độ</p>
              <p className="text-2xl font-bold text-gray-900">{project.taskCompletion}%</p>
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressColor(project.taskCompletion)}`}
              style={{ width: `${project.taskCompletion}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Ngân Sách</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(project.budget)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Đã Chi</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(project.actualCost)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <User className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Khách Hàng</p>
              <p className="text-sm font-medium text-gray-900">{project.customer.user.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Tổng Quan
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'tasks'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Công Việc ({project.totalTasks})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'materials'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Vật Liệu ({project.projectMaterials.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Details */}
          <div className="bg-white rounded-lg border p-6 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Chi Tiết Dự Án</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Ngày Bắt Đầu</p>
                <p className="text-sm font-medium text-gray-900">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {new Date(project.startDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ngày Kết Thúc</p>
                <p className="text-sm font-medium text-gray-900">
                  {project.endDate ? (
                    <>
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {new Date(project.endDate).toLocaleDateString()}
                    </>
                  ) : (
                    'Not set'
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Khách Hàng</p>
                <p className="text-sm font-medium text-gray-900 flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {project.customer.user.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email Khách Hàng</p>
                <p className="text-sm font-medium text-gray-900">{project.customer.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nhà Thầu Phụ Trách</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 flex items-center">
                    <Building2 className="h-4 w-4 mr-1 text-blue-600" />
                    {project.contractor?.user.name || 'Chưa phân công'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email Nhà Thầu</p>
                <p className="text-sm font-medium text-gray-900">{project.contractor?.user.email || '-'}</p>
              </div>
            </div>

            {project.notes && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm text-gray-900 mt-1">{project.notes}</p>
              </div>
            )}
          </div>

          {/* Task Progress */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Task Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Completed Tasks</span>
                  <span>{project.completedTasks} of {project.totalTasks}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressColor((project.completedTasks / project.totalTasks) * 100)}`}
                    style={{ width: `${(project.completedTasks / project.totalTasks) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-sm font-medium text-gray-900">{project.projectTasks.filter(t => t.status === 'PENDING').length}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-sm font-medium text-gray-900">{project.projectTasks.filter(t => t.status === 'IN_PROGRESS').length}</p>
                  <p className="text-xs text-gray-500">In Progress</p>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-sm font-medium text-gray-900">{project.projectTasks.filter(t => t.status === 'COMPLETED').length}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Danh Mục Công Việc</h3>
                <p className="text-xs text-gray-500 italic">Ghi chú: Nếu không có nhà thầu, hãy dùng mục này để quản lý các mốc cấp hàng (Foundation, Wall, Finishing...)</p>
              </div>
              <button
                onClick={() => openTaskModal()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center shadow-sm transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm Công Việc
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Công Việc
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người Thực Hiện
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mức Độ Ưu Tiên
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hạn Chót
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiến Độ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {project.projectTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{task.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {task.description || 'Không có mô tả'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {task.assignee?.user?.name || 'Chưa phân công'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Chưa có'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                          <div
                            className={`h-1.5 rounded-full ${getProgressColor(task.progress)}`}
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{task.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => openTaskModal(task)} className="text-blue-600 hover:text-blue-900 mr-3">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeletingTask(task)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Vật Liệu Dự Án</h3>
              <p className="text-xs text-gray-500 italic">Quản lý danh mục vật tư cung cấp cho khách hàng trong khuôn khổ dự án này.</p>
            </div>
            <button
              onClick={() => openMaterialModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center shadow-md transition-all whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm Vật Liệu
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vật Liệu
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số Lượng
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá Đơn Vị
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng Cộng
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng Thái
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {project.projectMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{material.product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(material.unitPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(material.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMaterialStatusColor(material.status)}`}>
                        {material.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => openMaterialModal(material)} className="text-blue-600 hover:text-blue-900 mr-3">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeletingMaterial(material)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Modal */}
      <FormModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title={editingTask ? 'Sửa Công Việc' : 'Thêm Công Việc Mới'}
        size="lg"
      >
        <form onSubmit={handleTaskSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên Công Việc / Mốc Cung Ứng *</label>
            <input
              type="text"
              value={taskForm.name}
              onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="VD: Giao VLXD phần móng / Đổ sàn tầng 1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô Tả Chi Tiết</label>
            <textarea
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Người Phụ Trách</label>
              <select
                value={taskForm.assigneeId}
                onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Chưa phân công --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.user?.name || emp.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Độ Ưu Tiên</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung Bình</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn Cấp</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Bắt Đầu</label>
              <input
                type="date"
                value={taskForm.startDate}
                onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hạn Chót</label>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng Thái</label>
            <select
              value={taskForm.status}
              onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="PENDING">Chưa thực hiện</option>
              <option value="IN_PROGRESS">Đang thực hiện</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t font-bold">
            <button
              type="button"
              onClick={() => setShowTaskModal(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={taskFormLoading}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
            >
              {taskFormLoading ? 'Đang lưu...' : (editingTask ? 'Cập Nhật' : 'Thêm Công Việc')}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Task Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteTask}
        title="Xóa Công Việc"
        message={`Bạn có chắc muốn xóa công việc "${deletingTask?.name}"?`}
        confirmText="Xóa"
        type="danger"
        loading={taskFormLoading}
      />

      {/* Material Modal */}
      <FormModal
        isOpen={showMaterialModal}
        onClose={() => setShowMaterialModal(false)}
        title={editingMaterial ? 'Sửa Vật Liệu Dự Án' : 'Thêm Vật Liệu Vào Dự Án'}
        size="lg"
      >
        <form onSubmit={handleMaterialSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sản Phẩm *</label>
            <select
              value={materialForm.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              required
              disabled={!!editingMaterial} // Disable product selection when editing
            >
              <option value="">-- Chọn sản phẩm từ kho --</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({new Intl.NumberFormat('vi-VN').format(product.price)}đ)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số Lượng *</label>
              <input
                type="number"
                step="0.01"
                value={materialForm.quantity}
                onChange={(e) => setMaterialForm({ ...materialForm, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn Giá (VND) *</label>
              <input
                type="number"
                value={materialForm.unitPrice}
                onChange={(e) => setMaterialForm({ ...materialForm, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng Thái</label>
            <select
              value={materialForm.status}
              onChange={(e) => setMaterialForm({ ...materialForm, status: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="REQUESTED">Đã yêu cầu</option>
              <option value="ORDERED">Đã đặt hàng</option>
              <option value="DELIVERED">Đã giao hàng</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi Chú</label>
            <textarea
              value={materialForm.notes}
              onChange={(e) => setMaterialForm({ ...materialForm, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t font-bold">
            <button
              type="button"
              onClick={() => setShowMaterialModal(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={materialFormLoading}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
            >
              {materialFormLoading ? 'Đang lưu...' : (editingMaterial ? 'Cập Nhật' : 'Thêm Vật Liệu')}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Material Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingMaterial}
        onClose={() => setDeletingMaterial(null)}
        onConfirm={handleDeleteMaterial}
        title="Xóa Vật Liệu"
        message={`Bạn có chắc muốn xóa vật liệu này khỏi dự án?`}
        confirmText="Xóa"
        type="danger"
        loading={materialFormLoading}
      />

      {/* Contractor Assignment Modal */}
      <FormModal
        isOpen={showContractorModal}
        onClose={() => setShowContractorModal(false)}
        title="Phân Công Nhà Thầu"
        size="md"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Nhà Thầu *</label>
            <select
              value={selectedContractorId}
              onChange={(e) => setSelectedContractorId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Chọn nhà thầu đã xác minh --</option>
              {contractors.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t font-bold">
            <button
              onClick={() => setShowContractorModal(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleAssignContractor}
              disabled={assignLoading || !selectedContractorId}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
            >
              {assignLoading ? 'Đang phân công...' : 'Xác Nhận'}
            </button>
          </div>
        </div>
      </FormModal>
    </div>
  )
}