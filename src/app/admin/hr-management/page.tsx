'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Users, Calendar, ClipboardList, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import ConfirmDialog from '@/components/ConfirmDialog'
import FormModal from '@/components/FormModal'

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
  title: string
  description: string
  employee?: { user: { name: string } }
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string | Date
  createdAt: string
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
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)

  // Work Shifts state
  const [shifts, setShifts] = useState<WorkShift[]>([])
  const [shiftsLoading, setShiftsLoading] = useState(false)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [deletingShift, setDeletingShift] = useState<WorkShift | null>(null)

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)

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

  // Employees functions
  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true)
      const response = await fetch('/api/employees') // Use regular fetch instead of fetchWithAuth
      if (response.ok) {
        const data = await response.json()
        // Handle nested data structure
        const employeesData = data.data?.data || data.data || []
        const employeesArray = Array.isArray(employeesData) ? employeesData : []
        console.log('Fetched employees:', employeesArray.length)
        setEmployees(employeesArray)
      } else if (response.status === 401 || response.status === 403) {
        console.warn('Authentication failed, fetching without auth')
        // Try without auth for development
        const retryResponse = await fetch('/api/employees')
        if (retryResponse.ok) {
          const data = await retryResponse.json()
          const employeesData = data.data?.data || data.data || []
          const employeesArray = Array.isArray(employeesData) ? employeesData : []
          setEmployees(employeesArray)
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Không thể tải danh sách nhân viên')
    } finally {
      setEmployeesLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-yellow-100 text-yellow-800',
      'TERMINATED': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Work Shifts functions
  const fetchShifts = async () => {
    try {
      setShiftsLoading(true)
      const response = await fetch('/api/work-shifts')
      if (response.ok) {
        const data = await response.json()
        const shiftsData = data.data?.data || data.data || []
        const shiftsArray = Array.isArray(shiftsData) ? shiftsData : []
        console.log('Fetched shifts:', shiftsArray.length)
        setShifts(shiftsArray)
      } else if (response.status === 401 || response.status === 403) {
        console.warn('Authentication failed for shifts')
        setShifts([])
      }
    } catch (error) {
      console.error('Error fetching shifts:', error)
      toast.error('Không thể tải ca làm việc')
    } finally {
      setShiftsLoading(false)
    }
  }

  const getShiftStatusBadge = (status: string) => {
    const colors = {
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'ABSENT': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }
  
  const getShiftStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      'SCHEDULED': 'Đã Lên Lịch',
      'IN_PROGRESS': 'Đang Làm',
      'COMPLETED': 'Hoàn Thành',
      'ABSENT': 'Vắng Mặt',
      'CANCELLED': 'Đã Hủy'
    }
    return texts[status] || status
  }

  // Tasks functions
  const fetchTasks = async () => {
    try {
      setTasksLoading(true)
      const response = await fetch('/api/employee-tasks')
      if (response.ok) {
        const data = await response.json()
        const tasksData = data.data?.data || data.data || []
        const tasksArray = Array.isArray(tasksData) ? tasksData : []
        console.log('Fetched tasks:', tasksArray.length)
        setTasks(tasksArray)
      } else if (response.status === 401 || response.status === 403) {
        console.warn('Authentication failed for tasks')
        setTasks([])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Không thể tải công việc')
    } finally {
      setTasksLoading(false)
    }
  }

  const getTaskStatusBadge = (status: string) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }
  
  const getTaskStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      'PENDING': 'Chờ Xử Lý',
      'IN_PROGRESS': 'Đang Thực Hiện',
      'COMPLETED': 'Hoàn Thành',
      'CANCELLED': 'Đã Hủy'
    }
    return texts[status] || status
  }
  
  const getPriorityBadge = (priority: string) => {
    const colors = {
      'LOW': 'bg-gray-100 text-gray-800',
      'MEDIUM': 'bg-orange-100 text-orange-800',
      'HIGH': 'bg-red-100 text-red-800',
      'URGENT': 'bg-red-200 text-red-900'
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }
  
  const getPriorityText = (priority: string) => {
    const texts: { [key: string]: string } = {
      'LOW': 'Thấp',
      'MEDIUM': 'Trung Bình',
      'HIGH': 'Cao',
      'URGENT': 'Khẩn Cấp'
    }
    return texts[priority] || priority
  }

  // Delete handlers
  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return
    try {
      const response = await fetch(`/api/employees/${deletingEmployee.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        toast.success('Xóa nhân viên thành công')
        setDeletingEmployee(null)
        fetchEmployees()
      } else {
        toast.error('Không thể xóa nhân viên')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error('Không thể xóa nhân viên')
    }
  }

  const handleDeleteShift = async () => {
    if (!deletingShift) return
    try {
      const response = await fetch(`/api/work-shifts/${deletingShift.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        toast.success('Xóa ca làm việc thành công')
        setDeletingShift(null)
        fetchShifts()
      } else {
        toast.error('Không thể xóa ca làm việc')
      }
    } catch (error) {
      console.error('Error deleting shift:', error)
      toast.error('Không thể xóa ca làm việc')
    }
  }

  const handleDeleteTask = async () => {
    if (!deletingTask) return
    try {
      const response = await fetch(`/api/employee-tasks/${deletingTask.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        toast.success('Xóa công việc thành công')
        setDeletingTask(null)
        fetchTasks()
      } else {
        toast.error('Không thể xóa công việc')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Không thể xóa công việc')
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
                {employees.filter(e => e.status === 'ACTIVE').length} đang làm việc
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
                  try {
                    const shiftDate = new Date(s.date)
                    return !isNaN(shiftDate.getTime()) && shiftDate.toDateString() === new Date().toDateString()
                  } catch {
                    return false
                  }
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
        <button
          onClick={() => toggleSection('employees')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Nhân Viên</h2>
            <span className="text-sm text-gray-500">({employees.length} người)</span>
          </div>
          {expandedSections.employees ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.employeeCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {(employee.baseSalary || 0).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(employee.isActive ? 'ACTIVE' : 'INACTIVE')}`}>
                            {employee.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900">Xem</button>
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
        <button
          onClick={() => toggleSection('shifts')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Ca Làm Việc</h2>
            <span className="text-sm text-gray-500">({shifts.length} ca)</span>
          </div>
          {expandedSections.shifts ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shifts.map((shift) => (
                      <tr key={shift.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {shift.employee.user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(() => {
                            try {
                              if (!shift.date) return '-'
                              
                              // Handle different date formats
                              let date: Date
                              if (shift.date instanceof Date) {
                                date = shift.date
                              } else if (typeof shift.date === 'string') {
                                // Try parsing as ISO string
                                date = new Date(shift.date)
                                // If invalid, try other formats
                                if (isNaN(date.getTime())) {
                                  // Try YYYY-MM-DD format
                                  const parts = shift.date.split('-')
                                  if (parts.length === 3) {
                                    date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
                                  } else {
                                    return 'Invalid Date'
                                  }
                                }
                              } else {
                                return '-'
                              }
                              
                              if (isNaN(date.getTime())) {
                                console.warn('Invalid date:', shift.date)
                                return '-'
                              }
                              
                              return date.toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })
                            } catch (error) {
                              console.error('Error parsing date:', shift.date, error)
                              return '-'
                            }
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {shift.startTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {shift.endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getShiftStatusBadge(shift.status)}`}>
                            {getShiftStatusText(shift.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {shift.notes || '-'}
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
        <button
          onClick={() => toggleSection('tasks')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <ClipboardList className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Công Việc</h2>
            <span className="text-sm text-gray-500">({tasks.length} công việc)</span>
          </div>
          {expandedSections.tasks ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô Tả</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người Thực Hiện</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ưu Tiên</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {task.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="max-w-xs truncate">{task.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.employee?.user.name || 'Chưa phân công'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(task.priority)}`}>
                            {getPriorityText(task.priority)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTaskStatusBadge(task.status)}`}>
                            {getTaskStatusText(task.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(() => {
                            try {
                              if (!task.dueDate) return '-'
                              
                              // Handle different date formats
                              let date: Date
                              if (task.dueDate instanceof Date) {
                                date = task.dueDate
                              } else if (typeof task.dueDate === 'string') {
                                date = new Date(task.dueDate)
                                if (isNaN(date.getTime())) {
                                  const parts = task.dueDate.split('-')
                                  if (parts.length === 3) {
                                    date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
                                  } else {
                                    return '-'
                                  }
                                }
                              } else {
                                return '-'
                              }
                              
                              if (isNaN(date.getTime())) {
                                return '-'
                              }
                              
                              return date.toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })
                            } catch {
                              return '-'
                            }
                          })()}
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

      {/* Delete Employee Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        onConfirm={handleDeleteEmployee}
        title="Xóa Nhân Viên"
        message={`Bạn có chắc muốn xóa nhân viên "${deletingEmployee?.user.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        type="danger"
      />

      {/* Delete Shift Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingShift}
        onClose={() => setDeletingShift(null)}
        onConfirm={handleDeleteShift}
        title="Xóa Ca Làm Việc"
        message="Bạn có chắc muốn xóa ca làm việc này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        type="danger"
      />

      {/* Delete Task Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteTask}
        title="Xóa Công Việc"
        message={`Bạn có chắc muốn xóa công việc "${deletingTask?.title}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        type="danger"
      />
    </div>
  )
}
