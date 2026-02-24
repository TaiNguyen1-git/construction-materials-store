'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Users, Calendar, ClipboardList, X } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import FormattedNumberInput from '@/components/FormattedNumberInput'
import ConfirmDialog from '@/components/ConfirmDialog'
import FormModal from '@/components/FormModal'

import {
  Employee, WorkShift, Task,
  formatDate
} from './types'

import EmployeeSection from './components/EmployeeSection'
import ShiftSection from './components/ShiftSection'
import TaskSection from './components/TaskSection'

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
        name: '', email: '', password: '', phone: '',
        employeeCode: nextCode, department: '', position: '',
        baseSalary: 0, hireDate: new Date().toISOString().split('T')[0]
      })
    }
    setShowEmployeeModal(true)
  }

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingEmployee) {
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
    if (permanent && !window.confirm('CẢNH BÁO: Hành động này sẽ xóa hoàn toàn dữ liệu nhân viên và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?')) {
      return
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
      const res = await fetchWithAuth(editingShift ? `/api/work-shifts/${editingShift.id}` : '/api/work-shifts', {
        method: editingShift ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftForm)
      })
      if (res.ok) {
        toast.success(`${editingShift ? 'Cập nhật' : 'Thêm'} ca làm việc thành công`)
        setShowShiftModal(false)
        fetchShifts()
      } else {
        const error = await res.json()
        toast.error(error.error?.message || 'Không thể lưu ca làm việc')
      }
    } catch {
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
    } catch {
      toast.error('Lỗi khi xóa ca làm việc')
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
        title: '', description: '', taskType: 'GENERAL',
        priority: 'MEDIUM', dueDate: '', status: 'PENDING'
      })
    }
    setShowTaskModal(true)
  }

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...taskForm, dueDate: taskForm.dueDate || undefined }
      const res = await fetchWithAuth(editingTask ? `/api/employee-tasks/${editingTask.id}` : '/api/employee-tasks', {
        method: editingTask ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        toast.success(`${editingTask ? 'Cập nhật' : 'Thêm'} công việc thành công`)
        setShowTaskModal(false)
        fetchTasks()
      } else {
        const error = await res.json()
        toast.error(error.error?.message || 'Không thể lưu công việc')
      }
    } catch {
      toast.error('Lỗi khi lưu công việc')
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
    } catch {
      toast.error('Lỗi khi xóa công việc')
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
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Tổng Nhân Viên</div>
            <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
            <div className="text-xs text-green-600 mt-1">{employees.filter(e => e.isActive !== false).length} đang làm việc</div>
          </div>
          <Users className="w-8 h-8 text-blue-600" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500 flex items-center justify-between">
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
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Công Việc Đang Thực Hiện</div>
            <div className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</div>
          </div>
          <ClipboardList className="w-8 h-8 text-orange-600" />
        </div>
      </div>

      {/* Sections */}
      <EmployeeSection
        employees={employees} loading={employeesLoading}
        expanded={expandedSections.employees} onToggle={() => toggleSection('employees')}
        onAdd={() => openEmployeeModal()} onEdit={openEmployeeModal}
        onDelete={setDeletingEmployee} onPermanentDelete={handlePermanentDelete}
      />

      <ShiftSection
        shifts={shifts} loading={shiftsLoading}
        expanded={expandedSections.shifts} onToggle={() => toggleSection('shifts')}
        onAdd={() => openShiftModal()} onEdit={openShiftModal} onDelete={setDeletingShift}
      />

      <TaskSection
        tasks={tasks} loading={tasksLoading}
        expanded={expandedSections.tasks} onToggle={() => toggleSection('tasks')}
        onAdd={() => openTaskModal()} onEdit={openTaskModal} onDelete={setDeletingTask}
      />

      {/* MODALS */}
      <FormModal
        isOpen={showEmployeeModal} onClose={() => setShowEmployeeModal(false)}
        title={editingEmployee ? 'Sửa Nhân Viên' : 'Thêm Nhân Viên'}
        onSubmit={handleEmployeeSubmit}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên Nhân Viên</label>
              <input type="text" required value={employeeForm.name} onChange={e => setEmployeeForm({ ...employeeForm, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mã Nhân Viên</label>
              <input type="text" required value={employeeForm.employeeCode} readOnly className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" required value={employeeForm.email} onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })} disabled={!!editingEmployee} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            {!editingEmployee && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <input type="password" required value={employeeForm.password} onChange={e => setEmployeeForm({ ...employeeForm, password: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Số Điện Thoại</label>
              <input type="text" value={employeeForm.phone} onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phòng Ban</label>
              <input type="text" required value={employeeForm.department} onChange={e => setEmployeeForm({ ...employeeForm, department: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Chức Vụ</label>
              <input type="text" required value={employeeForm.position} onChange={e => setEmployeeForm({ ...employeeForm, position: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Lương Cơ Bản</label>
            <FormattedNumberInput value={employeeForm.baseSalary} onChange={val => setEmployeeForm({ ...employeeForm, baseSalary: val })} suffix="đ" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ngày Vào Làm</label>
            <input type="date" required value={employeeForm.hireDate} onChange={e => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
        </div>
      </FormModal>

      <FormModal
        isOpen={showShiftModal} onClose={() => setShowShiftModal(false)}
        title={editingShift ? 'Sửa Ca Làm Việc' : 'Thêm Ca Làm Việc'}
        onSubmit={handleShiftSubmit}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nhân Viên</label>
            <select required value={shiftForm.employeeId} onChange={e => setShiftForm({ ...shiftForm, employeeId: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
              <option value="">Chọn nhân viên</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.user.name} ({emp.employeeCode})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ngày</label>
            <input type="date" required value={shiftForm.date} onChange={e => setShiftForm({ ...shiftForm, date: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Giờ Bắt Đầu</label>
              <input type="time" required value={shiftForm.startTime} onChange={e => setShiftForm({ ...shiftForm, startTime: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Giờ Kết Thúc</label>
              <input type="time" required value={shiftForm.endTime} onChange={e => setShiftForm({ ...shiftForm, endTime: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ghi Chú</label>
            <textarea value={shiftForm.notes} onChange={e => setShiftForm({ ...shiftForm, notes: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" rows={3} />
          </div>
        </div>
      </FormModal>

      <FormModal
        isOpen={showTaskModal} onClose={() => setShowTaskModal(false)}
        title={editingTask ? 'Sửa Công Việc' : 'Thêm Công Việc'}
        onSubmit={handleTaskSubmit}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tiêu Đề</label>
            <input type="text" required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Người Thực Hiện</label>
            <select required value={taskForm.employeeId} onChange={e => setTaskForm({ ...taskForm, employeeId: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
              <option value="">Chọn nhân viên</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.user.name} ({emp.employeeCode})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Ưu Tiên</label>
              <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as any })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung Bình</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn Cấp</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hạn Chót</label>
              <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mô Tả</label>
            <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" rows={4} />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deletingEmployee} onClose={() => setDeletingEmployee(null)}
        title="Vô hiệu hóa nhân viên" description={`Bạn có chắc chắn muốn vô hiệu hóa nhân viên ${deletingEmployee?.user.name}? Nhân viên sẽ không thể đăng nhập vào hệ thống.`}
        onConfirm={() => handleDeleteEmployee(false)}
      />

      <ConfirmDialog
        isOpen={!!deletingShift} onClose={() => setDeletingShift(null)}
        title="Xóa ca làm việc" description="Bạn có chắc chắn muốn xóa ca làm việc này?"
        onConfirm={handleDeleteShift}
      />

      <ConfirmDialog
        isOpen={!!deletingTask} onClose={() => setDeletingTask(null)}
        title="Xóa công việc" description="Bạn có chắc chắn muốn xóa công việc này?"
        onConfirm={handleDeleteTask}
      />
    </div>
  )
}
