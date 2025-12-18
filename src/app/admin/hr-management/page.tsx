'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Users, Calendar, ClipboardList, ChevronDown, ChevronUp, Plus, Edit, Trash2, X, XCircle, Image as ImageIcon, CheckCheck, FileText, ExternalLink } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import FormattedNumberInput from '@/components/FormattedNumberInput'
import ConfirmDialog from '@/components/ConfirmDialog'
import FormModal from '@/components/FormModal'

const handleTaskSubmitStatus = async (taskId: string, status: string) => {
  try {
    const response = await fetchWithAuth(`/api/employee-tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (response.ok) {
      toast.success('Cập nhật trạng thái thành công')
      window.location.reload()
    }
  } catch (error) {
    toast.error('Có lỗi xảy ra')
  }
}

interface User {
  id: string
  name: string
  email: string
}

interface Employee {
  id: string
  employeeCode: string
  user: User
  department: string
  position: string
  baseSalary: number
  hireDate: string
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED'
  phone?: string
  isActive?: boolean
}

interface WorkShift {
  id: string
  employeeId: string
  employee: { user: { name: string } }
  date: string | Date
  startTime: string
  endTime: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT' | 'CANCELLED'
  shiftType?: string
  notes?: string
}

interface Task {
  id: string
  employeeId: string
  title: string
  description: string
  employee?: { user: { name: string } }
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'AWAITING_REVIEW' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  taskType?: string
  dueDate?: string | Date
  createdAt: string
  proofUrl?: string
  proofNotes?: string
  submittedAt?: string
}

export default function HRManagementPage() {
  const [expandedSections, setExpandedSections] = useState({
    employees: true,
    shifts: false,
    tasks: false
  })

  // Employees state
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    employeeCode: '',
    department: '',
    position: '',
    baseSalary: 0,
    hireDate: new Date().toISOString().split('T')[0]
  })

  // Work Shifts state
  const [shifts, setShifts] = useState<WorkShift[]>([])
  const [shiftsLoading, setShiftsLoading] = useState(false)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null)
  const [deletingShift, setDeletingShift] = useState<WorkShift | null>(null)
  const [shiftForm, setShiftForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '17:00',
    shiftType: 'REGULAR',
    notes: ''
  })

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [taskForm, setTaskForm] = useState({
    employeeId: '',
    title: '',
    description: '',
    taskType: 'GENERAL',
    priority: 'MEDIUM',
    dueDate: '',
    status: 'PENDING'
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (expandedSections.shifts) fetchShifts()
  }, [expandedSections.shifts])

  useEffect(() => {
    if (expandedSections.tasks) fetchTasks()
  }, [expandedSections.tasks])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Helper functions for currency
  const formatCurrency = (value: number | string) => {
    if (!value) return ''
    const number = typeof value === 'string' ? parseInt(value.replace(/\./g, '')) : value
    return isNaN(number) ? '' : number.toLocaleString('vi-VN').replace(/,/g, '.')
  }

  const parseCurrency = (value: string) => {
    return value ? parseInt(value.replace(/\./g, '')) : 0
  }

  // ============ EMPLOYEES FUNCTIONS ============
  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true)
      const response = await fetchWithAuth('/api/employees')
      if (response.ok) {
        const data = await response.json()
        const employeesData = data.data?.data || data.data || []
        setEmployees(Array.isArray(employeesData) ? employeesData : [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Không thể tải danh sách nhân viên')
    } finally {
      setEmployeesLoading(false)
    }
  }

  const openEmployeeModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee)
      setEmployeeForm({
        name: employee.user.name,
        email: employee.user.email,
        password: '',
        phone: employee.phone || '',
        employeeCode: employee.employeeCode,
        department: employee.department,
        position: employee.position,
        baseSalary: employee.baseSalary,
        hireDate: employee.hireDate?.split('T')[0] || ''
      })
    } else {
      setEditingEmployee(null)

      // Auto-generate employee code
      let nextCode = 'NV001'
      if (employees.length > 0) {
        const maxId = employees.reduce((max, emp) => {
          const match = emp.employeeCode.match(/NV(\d+)/)
          if (match) {
            const num = parseInt(match[1])
            return num > max ? num : max
          }
          return max
        }, 0)
        nextCode = `NV${String(maxId + 1).padStart(3, '0')}`
      }

      setEmployeeForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        employeeCode: nextCode,
        department: '',
        position: '',
        baseSalary: 0,
        hireDate: new Date().toISOString().split('T')[0]
      })
    }
    setShowEmployeeModal(true)
  }

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingEmployee) {
        // Update employee
        const response = await fetchWithAuth(`/api/employees/${editingEmployee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            department: employeeForm.department,
            position: employeeForm.position,
            baseSalary: employeeForm.baseSalary
          })
        })
        if (response.ok) {
          toast.success('Cập nhật nhân viên thành công')
          setShowEmployeeModal(false)
          fetchEmployees()
        } else {
          const error = await response.json()
          toast.error(error.error?.message || 'Không thể cập nhật nhân viên')
        }
      } else {
        // Create new employee
        const response = await fetchWithAuth('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeForm)
        })
        if (response.ok) {
          toast.success('Thêm nhân viên thành công')
          setShowEmployeeModal(false)
          fetchEmployees()
        } else {
          const error = await response.json()
          toast.error(error.error?.message || 'Không thể thêm nhân viên')
        }
      }
    } catch (error) {
      console.error('Error saving employee:', error)
      toast.error('Có lỗi xảy ra')
    }
  }

  const handlePermanentDelete = async (employee: Employee) => {
    if (window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa VĨNH VIỄN nhân viên ${employee.user.name}? Dữ liệu sẽ không thể khôi phục.`)) {
      try {
        const response = await fetchWithAuth(`/api/employees/${employee.id}?permanent=true`, { method: 'DELETE' })
        if (response.ok) {
          toast.success('Xóa vĩnh viễn nhân viên thành công')
          fetchEmployees()
        } else {
          toast.error('Không thể xóa nhân viên')
        }
      } catch (error) {
        toast.error('Có lỗi xảy ra khi xóa')
      }
    }
  }

  const handleDeleteEmployee = async (permanent: boolean = false) => {
    if (!deletingEmployee) return

    // Additional confirmation for permanent delete
    if (permanent) {
      if (!window.confirm('CẢNH BÁO: Hành động này sẽ xóa hoàn toàn dữ liệu nhân viên và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?')) {
        return
      }
    }

    try {
      const url = permanent
        ? `/api/employees/${deletingEmployee.id}?permanent=true`
        : `/api/employees/${deletingEmployee.id}`

      const response = await fetchWithAuth(url, { method: 'DELETE' })
      if (response.ok) {
        toast.success(permanent ? 'Xóa vĩnh viễn nhân viên thành công' : 'Vô hiệu hóa nhân viên thành công')
        setDeletingEmployee(null)
        fetchEmployees()
      } else {
        toast.error('Không thể xóa nhân viên')
      }
    } catch (error) {
      toast.error('Không thể xóa nhân viên')
    }
  }

  // ============ SHIFTS FUNCTIONS ============
  const fetchShifts = async () => {
    try {
      setShiftsLoading(true)
      const response = await fetchWithAuth('/api/work-shifts')
      if (response.ok) {
        const data = await response.json()
        const shiftsData = data.data?.data || data.data || []
        setShifts(Array.isArray(shiftsData) ? shiftsData : [])
      }
    } catch (error) {
      console.error('Error fetching shifts:', error)
      toast.error('Không thể tải ca làm việc')
    } finally {
      setShiftsLoading(false)
    }
  }

  const openShiftModal = (shift?: WorkShift) => {
    if (shift) {
      setEditingShift(shift)
      setShiftForm({
        employeeId: shift.employeeId,
        date: typeof shift.date === 'string' ? shift.date.split('T')[0] : new Date(shift.date).toISOString().split('T')[0],
        startTime: shift.startTime,
        endTime: shift.endTime,
        shiftType: shift.shiftType || 'REGULAR',
        notes: shift.notes || ''
      })
    } else {
      setEditingShift(null)
      setShiftForm({
        employeeId: employees[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '17:00',
        shiftType: 'REGULAR',
        notes: ''
      })
    }
    setShowShiftModal(true)
  }

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingShift) {
        const response = await fetchWithAuth(`/api/work-shifts/${editingShift.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shiftForm)
        })
        if (response.ok) {
          toast.success('Cập nhật ca làm việc thành công')
          setShowShiftModal(false)
          fetchShifts()
        } else {
          const error = await response.json()
          toast.error(error.error?.message || 'Không thể cập nhật ca làm việc')
        }
      } else {
        const response = await fetchWithAuth('/api/work-shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shiftForm)
        })
        if (response.ok) {
          toast.success('Thêm ca làm việc thành công')
          setShowShiftModal(false)
          fetchShifts()
        } else {
          const error = await response.json()
          toast.error(error.error?.message || 'Không thể thêm ca làm việc')
        }
      }
    } catch (error) {
      console.error('Error saving shift:', error)
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleDeleteShift = async () => {
    if (!deletingShift) return
    try {
      const response = await fetchWithAuth(`/api/work-shifts/${deletingShift.id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Xóa ca làm việc thành công')
        setDeletingShift(null)
        fetchShifts()
      } else {
        toast.error('Không thể xóa ca làm việc')
      }
    } catch (error) {
      toast.error('Không thể xóa ca làm việc')
    }
  }

  // ============ TASKS FUNCTIONS ============
  const fetchTasks = async () => {
    try {
      setTasksLoading(true)
      const response = await fetchWithAuth('/api/employee-tasks')
      if (response.ok) {
        const data = await response.json()
        const tasksData = data.data?.data || data.data || []
        setTasks(Array.isArray(tasksData) ? tasksData : [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Không thể tải công việc')
    } finally {
      setTasksLoading(false)
    }
  }

  const openTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task)
      setTaskForm({
        employeeId: task.employeeId || '',
        title: task.title,
        description: task.description || '',
        taskType: task.taskType || 'GENERAL',
        priority: task.priority,
        dueDate: task.dueDate ? (typeof task.dueDate === 'string' ? task.dueDate.split('T')[0] : new Date(task.dueDate).toISOString().split('T')[0]) : '',
        status: task.status
      })
    } else {
      setEditingTask(null)
      setTaskForm({
        employeeId: employees[0]?.id || '',
        title: '',
        description: '',
        taskType: 'GENERAL',
        priority: 'MEDIUM',
        dueDate: '',
        status: 'PENDING'
      })
    }
    setShowTaskModal(true)
  }

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...taskForm,
        dueDate: taskForm.dueDate || undefined
      }

      if (editingTask) {
        const response = await fetchWithAuth(`/api/employee-tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (response.ok) {
          toast.success('Cập nhật công việc thành công')
          setShowTaskModal(false)
          fetchTasks()
        } else {
          const error = await response.json()
          toast.error(error.error?.message || 'Không thể cập nhật công việc')
        }
      } else {
        const response = await fetchWithAuth('/api/employee-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (response.ok) {
          toast.success('Thêm công việc thành công')
          setShowTaskModal(false)
          fetchTasks()
        } else {
          const error = await response.json()
          toast.error(error.error?.message || 'Không thể thêm công việc')
        }
      }
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleDeleteTask = async () => {
    if (!deletingTask) return
    try {
      const response = await fetchWithAuth(`/api/employee-tasks/${deletingTask.id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Xóa công việc thành công')
        setDeletingTask(null)
        fetchTasks()
      } else {
        toast.error('Không thể xóa công việc')
      }
    } catch (error) {
      toast.error('Không thể xóa công việc')
    }
  }

  // ============ HELPER FUNCTIONS ============
  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-yellow-100 text-yellow-800',
      'TERMINATED': 'bg-red-100 text-red-800',
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'ABSENT': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      'ACTIVE': 'Đang Làm',
      'INACTIVE': 'Nghỉ Việc',
      'TERMINATED': 'Đã Nghỉ',
      'SCHEDULED': 'Đã Lên Lịch',
      'IN_PROGRESS': 'Đang Làm',
      'COMPLETED': 'Hoàn Thành',
      'ABSENT': 'Vắng Mặt',
      'CANCELLED': 'Đã Hủy',
      'PENDING': 'Chờ Xử Lý'
    }
    return texts[status] || status
  }

  const getPriorityBadge = (priority: string) => {
    const colors: { [key: string]: string } = {
      'LOW': 'bg-gray-100 text-gray-800',
      'MEDIUM': 'bg-orange-100 text-orange-800',
      'HIGH': 'bg-red-100 text-red-800',
      'URGENT': 'bg-red-200 text-red-900'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityText = (priority: string) => {
    const texts: { [key: string]: string } = { 'LOW': 'Thấp', 'MEDIUM': 'Trung Bình', 'HIGH': 'Cao', 'URGENT': 'Khẩn Cấp' }
    return texts[priority] || priority
  }

  const formatDate = (dateInput: string | Date | undefined) => {
    if (!dateInput) return '-'
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('vi-VN')
    } catch {
      return '-'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Nhân Sự</h1>
          <p className="text-sm text-gray-500 mt-1">Nhân viên, ca làm việc và công việc</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Tổng Nhân Viên</div>
              <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
              <div className="text-xs text-green-600 mt-1">
                {employees.filter(e => e.isActive !== false).length} đang làm việc
              </div>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Ca Làm Việc Hôm Nay</div>
              <div className="text-2xl font-bold text-gray-900">
                {shifts.filter(s => {
                  try { return new Date(s.date).toDateString() === new Date().toDateString() } catch { return false }
                }).length}
              </div>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Công Việc Đang Thực Hiện</div>
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'IN_PROGRESS').length}
              </div>
            </div>
            <ClipboardList className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Section 1: Employees */}
      <div className="bg-white rounded-lg shadow">
        <div
          onClick={() => toggleSection('employees')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Nhân Viên</h2>
            <span className="text-sm text-gray-500">({employees.length} người)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openEmployeeModal() }}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Thêm
            </button>
            {expandedSections.employees ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>

        {expandedSections.employees && (
          <div className="border-t">
            {employeesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã NV</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ Tên</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phòng Ban</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chức Vụ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lương</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.employeeCode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.position}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{(employee.baseSalary || 0).toLocaleString('vi-VN')}đ</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(employee.isActive !== false ? 'ACTIVE' : 'INACTIVE')}`}>
                            {getStatusText(employee.isActive !== false ? 'ACTIVE' : 'INACTIVE')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button onClick={() => openEmployeeModal(employee)} className="text-blue-600 hover:text-blue-900" title="Sửa"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => setDeletingEmployee(employee)} className="text-orange-600 hover:text-orange-900" title="Vô hiệu hóa"><Trash2 className="h-4 w-4" /></button>
                          <button onClick={() => handlePermanentDelete(employee)} className="text-red-600 hover:text-red-900" title="Xóa vĩnh viễn"><XCircle className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Work Shifts */}
      <div className="bg-white rounded-lg shadow">
        <div
          onClick={() => toggleSection('shifts')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Ca Làm Việc</h2>
            <span className="text-sm text-gray-500">({shifts.length} ca)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openShiftModal() }}
              className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Thêm
            </button>
            {expandedSections.shifts ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>

        {expandedSections.shifts && (
          <div className="border-t">
            {shiftsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhân Viên</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giờ Bắt Đầu</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giờ Kết Thúc</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shifts.map((shift) => (
                      <tr key={shift.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shift.employee?.user?.name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(shift.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shift.startTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shift.endTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(shift.status)}`}>
                            {getStatusText(shift.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button onClick={() => openShiftModal(shift)} className="text-blue-600 hover:text-blue-900"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => setDeletingShift(shift)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 3: Tasks */}
      <div className="bg-white rounded-lg shadow">
        <div
          onClick={() => toggleSection('tasks')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <ClipboardList className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Công Việc</h2>
            <span className="text-sm text-gray-500">({tasks.length} công việc)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openTaskModal() }}
              className="bg-orange-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-orange-700 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Thêm
            </button>
            {expandedSections.tasks ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>

        {expandedSections.tasks && (
          <div className="border-t">
            {tasksLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu Đề</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người Thực Hiện</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ưu Tiên</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex flex-col">
                            <span>{task.title}</span>
                            {(task as any).proofUrl && (
                              <button
                                onClick={() => openTaskModal(task)}
                                className="text-[10px] text-blue-500 font-bold flex items-center gap-1 mt-1 hover:underline text-left"
                              >
                                <ImageIcon className="w-3 h-3" /> CÓ MINH CHỨNG
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.employee?.user?.name || 'Chưa phân công'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(task.priority)}`}>
                            {getPriorityText(task.priority)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${task.status === 'AWAITING_REVIEW' ? 'bg-blue-100 text-blue-800 animate-pulse' : getStatusBadge(task.status)
                            }`}>
                            {task.status === 'AWAITING_REVIEW' ? 'Chờ Duyệt' : getStatusText(task.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(task.dueDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button onClick={() => openTaskModal(task)} className="text-blue-600 hover:text-blue-900" title="Chi tiết"><Edit className="h-4 w-4" /></button>
                          {task.status === 'AWAITING_REVIEW' && (
                            <button
                              onClick={() => {
                                // Logic to approve/review
                                if (confirm('Bạn có muốn phê duyệt công việc này không?')) {
                                  handleTaskSubmitStatus(task.id, 'COMPLETED')
                                }
                              }}
                              className="text-green-600 hover:text-green-900" title="Duyệt"
                            >
                              <CheckCheck className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => setDeletingTask(task)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Employee Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editingEmployee ? 'Sửa Nhân Viên' : 'Thêm Nhân Viên'}</h3>
              <button onClick={() => setShowEmployeeModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              {!editingEmployee && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Họ Tên *</label>
                    <input type="text" value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mật khẩu *</label>
                    <input type="password" value={employeeForm.password} onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" required minLength={6} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mã Nhân Viên *</label>
                    <input type="text" value={employeeForm.employeeCode} onChange={(e) => setEmployeeForm({ ...employeeForm, employeeCode: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phòng Ban *</label>
                  <input type="text" value={employeeForm.department} onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chức Vụ *</label>
                  <input type="text" value={employeeForm.position} onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lương Cơ Bản *</label>
                  <FormattedNumberInput
                    value={employeeForm.baseSalary}
                    onChange={(val) => setEmployeeForm({ ...employeeForm, baseSalary: val })}
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                  />
                  {employeeForm.baseSalary === 0 && <p className="text-xs text-gray-500 mt-1">Nhập 0 hoặc để trống</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày Vào Làm</label>
                  <input type="date" value={employeeForm.hireDate} onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowEmployeeModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingEmployee ? 'Cập Nhật' : 'Thêm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editingShift ? 'Sửa Ca Làm Việc' : 'Thêm Ca Làm Việc'}</h3>
              <button onClick={() => setShowShiftModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleShiftSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nhân Viên *</label>
                <select value={shiftForm.employeeId} onChange={(e) => setShiftForm({ ...shiftForm, employeeId: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" required>
                  <option value="">Chọn nhân viên</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.user.name} ({emp.employeeCode})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày *</label>
                <input type="date" value={shiftForm.date} onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giờ Bắt Đầu *</label>
                  <input type="time" value={shiftForm.startTime} onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giờ Kết Thúc *</label>
                  <input type="time" value={shiftForm.endTime} onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Loại Ca</label>
                <select value={shiftForm.shiftType} onChange={(e) => setShiftForm({ ...shiftForm, shiftType: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2">
                  <option value="REGULAR">Bình Thường</option>
                  <option value="OVERTIME">Tăng Ca</option>
                  <option value="LOADING">Bốc Xếp</option>
                  <option value="TRANSPORT">Vận Chuyển</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ghi Chú</label>
                <textarea value={shiftForm.notes} onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" rows={2} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowShiftModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{editingShift ? 'Cập Nhật' : 'Thêm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editingTask ? 'Sửa Công Việc' : 'Thêm Công Việc'}</h3>
              <button onClick={() => setShowTaskModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tiêu Đề *</label>
                <input type="text" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mô Tả</label>
                <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phân Công Cho *</label>
                <select value={taskForm.employeeId} onChange={(e) => setTaskForm({ ...taskForm, employeeId: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" required>
                  <option value="">Chọn nhân viên</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.user.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Loại Công Việc</label>
                  <select value={taskForm.taskType} onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2">
                    <option value="GENERAL">Tổng Hợp</option>
                    <option value="LOADING">Bốc Xếp</option>
                    <option value="TRANSPORT">Vận Chuyển</option>
                    <option value="INVENTORY">Kho</option>
                    <option value="SALES">Bán Hàng</option>
                    <option value="MAINTENANCE">Bảo Trì</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ưu Tiên</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2">
                    <option value="LOW">Thấp</option>
                    <option value="MEDIUM">Trung Bình</option>
                    <option value="HIGH">Cao</option>
                    <option value="URGENT">Khẩn Cấp</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng Thái</label>
                <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2">
                  <option value="PENDING">Chờ Xử Lý</option>
                  <option value="IN_PROGRESS">Đang Làm</option>
                  <option value="AWAITING_REVIEW">Đang Kiểm Duyệt</option>
                  <option value="COMPLETED">Hoàn Thành</option>
                  <option value="CANCELLED">Đã Hủy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hạn Hoàn Thành</label>
                <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
              </div>
              {editingTask && editingTask.proofUrl && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600" /> Minh chứng công việc
                  </h4>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex flex-col gap-4">
                      {/* Multimedia Preview */}
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 bg-white shadow-inner flex items-center justify-center">
                        {/* Check for image extensions explicitly */}
                        {editingTask.proofUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                          <img
                            src={editingTask.proofUrl}
                            alt="Minh chứng"
                            className="w-full h-full object-contain"
                          />
                        ) : editingTask.proofUrl.match(/\.(mp4|webm|mov)$/i) ? (
                          <video src={editingTask.proofUrl} controls className="w-full h-full object-contain" />
                        ) : editingTask.proofUrl.match(/\.pdf$/i) || editingTask.proofUrl.includes('/api/files/') ? (
                          /* For PDF and API-served files, show document icon */
                          <div className="flex flex-col items-center justify-center gap-3 p-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <FileText className="w-10 h-10 text-white" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-gray-700">Tài liệu PDF</p>
                              <p className="text-[11px] text-gray-400 mt-1">Bấm nút bên dưới để xem</p>
                            </div>
                          </div>
                        ) : editingTask.proofUrl.match(/\.(doc|docx)$/i) ? (
                          <div className="flex flex-col items-center justify-center gap-3 p-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <FileText className="w-10 h-10 text-white" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-gray-700">Tài liệu Word</p>
                              <p className="text-[11px] text-gray-400 mt-1">Bấm nút bên dưới để tải</p>
                            </div>
                          </div>
                        ) : editingTask.proofUrl.match(/\.(xls|xlsx)$/i) ? (
                          <div className="flex flex-col items-center justify-center gap-3 p-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <FileText className="w-10 h-10 text-white" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-gray-700">Tài liệu Excel</p>
                              <p className="text-[11px] text-gray-400 mt-1">Bấm nút bên dưới để tải</p>
                            </div>
                          </div>
                        ) : (
                          /* Fallback for unknown file types */
                          <div className="flex flex-col items-center justify-center gap-3 p-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center shadow-lg">
                              <FileText className="w-10 h-10 text-white" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-gray-700">Tệp đính kèm</p>
                              <p className="text-[11px] text-gray-400 mt-1">Bấm nút bên dưới để xem</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info & Actions */}
                      <div className="flex flex-col gap-3">
                        {editingTask.proofNotes && (
                          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                            <p className="text-sm text-blue-800 leading-relaxed italic">
                              "{editingTask.proofNotes}"
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thời gian nộp</span>
                            <span className="text-xs text-gray-600 font-medium">
                              {editingTask.submittedAt ? new Date(editingTask.submittedAt).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                            </span>
                          </div>
                          <a
                            href={editingTask.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2"
                          >
                            <ExternalLink className="w-3 h-3" />
                            MỞ GỐC
                          </a>
                        </div>

                        {/* Approve/Reject Buttons for Managers */}
                        {(editingTask.status === 'AWAITING_REVIEW' || editingTask.status === 'IN_PROGRESS') && (
                          <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={async () => {
                                const reason = prompt('Lý do yêu cầu làm lại:', 'Chưa đạt yêu cầu, vui lòng kiểm tra lại.')
                                if (reason === null) return
                                try {
                                  const res = await fetchWithAuth(`/api/employee-tasks/${editingTask.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      status: 'IN_PROGRESS',
                                      proofNotes: `[Quản lý từ chối]: ${reason}`
                                    })
                                  })
                                  if (res.ok) {
                                    toast.success('Đã yêu cầu làm lại')
                                    setShowTaskModal(false)
                                    fetchTasks()
                                  }
                                } catch (e) { toast.error('Lỗi khi thực hiện') }
                              }}
                              className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                            >
                              <XCircle className="w-4 h-4" /> Yêu Cầu Làm Lại
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm('Xác nhận phê duyệt hoàn thành công việc này?')) return
                                try {
                                  const res = await fetchWithAuth(`/api/employee-tasks/${editingTask.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'COMPLETED' })
                                  })
                                  if (res.ok) {
                                    toast.success('Đã phê duyệt công việc')
                                    setShowTaskModal(false)
                                    fetchTasks()
                                  }
                                } catch (e) { toast.error('Lỗi khi thực hiện') }
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 shadow-md shadow-green-200 transition-all flex items-center justify-center gap-2"
                            >
                              <CheckCheck className="w-4 h-4" /> Phê Duyệt
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">{editingTask ? 'Cập Nhật' : 'Thêm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmations */}
      <ConfirmDialog isOpen={!!deletingEmployee} onClose={() => setDeletingEmployee(null)} onConfirm={handleDeleteEmployee} title="Xóa Nhân Viên" message={`Bạn có chắc muốn xóa nhân viên "${deletingEmployee?.user.name}"?`} confirmText="Xóa" type="danger" />
      <ConfirmDialog isOpen={!!deletingShift} onClose={() => setDeletingShift(null)} onConfirm={handleDeleteShift} title="Xóa Ca Làm Việc" message="Bạn có chắc muốn xóa ca làm việc này?" confirmText="Xóa" type="danger" />
      <ConfirmDialog isOpen={!!deletingTask} onClose={() => setDeletingTask(null)} onConfirm={handleDeleteTask} title="Xóa Công Việc" message={`Bạn có chắc muốn xóa công việc "${deletingTask?.title}"?`} confirmText="Xóa" type="danger" />
    </div>
  )
}
