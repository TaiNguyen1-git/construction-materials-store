'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Clock, CheckCircle, AlertCircle, X } from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  taskType: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  completedAt?: string
  createdAt: string
  employee: {
    user: {
      name: string
      email: string
    }
  }
}

const TASK_TYPES = [
  { value: 'GENERAL', label: 'Tổng quát' },
  { value: 'LOADING', label: 'Bốc xếp' },
  { value: 'TRANSPORT', label: 'Vận chuyển' },
  { value: 'INVENTORY', label: 'Kiểm kê' },
  { value: 'SALES', label: 'Bán hàng' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
]

const TASK_STATUS = [
  { value: 'PENDING', label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'IN_PROGRESS', label: 'Đang thực hiện', color: 'bg-blue-100 text-blue-800' },
  { value: 'COMPLETED', label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
  { value: 'CANCELLED', label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
]

const PRIORITY_LEVELS = [
  { value: 'LOW', label: 'Thấp', color: 'bg-gray-100 text-gray-800' },
  { value: 'MEDIUM', label: 'Trung bình', color: 'bg-blue-100 text-blue-800' },
  { value: 'HIGH', label: 'Cao', color: 'bg-orange-100 text-orange-800' },
  { value: 'URGENT', label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    taskType: '',
    priority: '',
    employeeId: ''
  })

  // Form state for creating new task
  const [newTask, setNewTask] = useState({
    employeeId: '',
    title: '',
    description: '',
    taskType: 'GENERAL',
    priority: 'MEDIUM',
    dueDate: '',
    estimatedHours: ''
  })

  useEffect(() => {
    fetchTasks()
    fetchEmployees()
  }, [filters])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/employee-tasks?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setTasks(data.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      if (data.success) {
        setEmployees(data.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const createTask = async () => {
    try {
      const taskData = {
        ...newTask,
        estimatedHours: newTask.estimatedHours ? parseFloat(newTask.estimatedHours) : undefined,
        dueDate: newTask.dueDate || undefined
      }

      const response = await fetch('/api/employee-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })

      const data = await response.json()
      if (data.success) {
        setShowCreateModal(false)
        setNewTask({
          employeeId: '',
          title: '',
          description: '',
          taskType: 'GENERAL',
          priority: 'MEDIUM',
          dueDate: '',
          estimatedHours: ''
        })
        fetchTasks()
      } else {
        alert('Lỗi tạo task: ' + data.error?.message)
      }
    } catch (error) {
      alert('Lỗi tạo task: ' + error)
    }
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/employee-tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      const data = await response.json()
      if (data.success) {
        fetchTasks()
      } else {
        alert('Lỗi cập nhật task: ' + data.error?.message)
      }
    } catch (error) {
      alert('Lỗi cập nhật task: ' + error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = TASK_STATUS.find(s => s.value === status)
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig?.color || 'bg-gray-100 text-gray-800'}`}>
        {statusConfig?.label || status}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = PRIORITY_LEVELS.find(p => p.value === priority)
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig?.color || 'bg-gray-100 text-gray-800'}`}>
        {priorityConfig?.label || priority}
      </span>
    )
  }

  const getTaskTypeLabel = (taskType: string) => {
    return TASK_TYPES.find(t => t.value === taskType)?.label || taskType
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Task Nhân viên</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Tạo Task Mới
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <input
                type="text"
                placeholder="Tìm kiếm task..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Tất cả trạng thái</option>
              {TASK_STATUS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

            <select
              value={filters.taskType}
              onChange={(e) => setFilters({...filters, taskType: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Tất cả loại task</option>
              {TASK_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Tất cả mức độ</option>
              {PRIORITY_LEVELS.map(priority => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>

            <select
              value={filters.employeeId}
              onChange={(e) => setFilters({...filters, employeeId: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Tất cả nhân viên</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.user.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân viên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ưu tiên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{task.employee.user.name}</div>
                      <div className="text-sm text-gray-500">{task.employee.user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{getTaskTypeLabel(task.taskType)}</td>
                    <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                    <td className="px-6 py-4">{getPriorityBadge(task.priority)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {task.status === 'PENDING' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Bắt đầu
                          </button>
                        )}
                        {task.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                            className="text-green-600 hover:text-green-900 text-sm"
                          >
                            Hoàn thành
                          </button>
                        )}
                        {task.status !== 'CANCELLED' && task.status !== 'COMPLETED' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'CANCELLED')}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {tasks.length === 0 && (
              <div className="p-8 text-center text-gray-500">Không có task nào</div>
            )}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tạo Task Mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên</label>
                <select
                  value={newTask.employeeId}
                  onChange={(e) => setNewTask({...newTask, employeeId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Chọn nhân viên</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại task</label>
                  <select
                    value={newTask.taskType}
                    onChange={(e) => setNewTask({...newTask, taskType: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {TASK_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ưu tiên</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {PRIORITY_LEVELS.map(priority => (
                      <option key={priority.value} value={priority.value}>{priority.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hạn hoàn thành</label>
                  <input
                    type="datetime-local"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ dự kiến</label>
                  <input
                    type="number"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({...newTask, estimatedHours: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    step="0.5"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={createTask}
                disabled={!newTask.employeeId || !newTask.title}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Tạo Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
