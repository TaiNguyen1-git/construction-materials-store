'use client'

import { Calendar, Clock, Users } from 'lucide-react'

export default function WorkShiftsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ca Làm Việc</h1>
          <p className="text-gray-600 mt-1">Quản lý lịch làm việc và ca trực của nhân viên</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Tạo Ca Mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ca Hôm Nay</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Nhân Viên Đang Làm</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Giờ Tuần Này</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Work Shifts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lịch Ca Làm Việc</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có ca làm việc nào
            </h3>
            <p className="text-gray-600 mb-6">
              Tạo ca làm việc đầu tiên để bắt đầu quản lý lịch trực của nhân viên
            </p>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <Calendar className="h-4 w-4 mr-2" />
              Tạo Ca Làm Việc
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch Tháng</h2>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Chức năng lịch chi tiết sẽ được triển khai trong phiên bản tiếp theo
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Trang Đang Phát Triển
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Trang quản lý ca làm việc đang được phát triển. Các tính năng sẽ bao gồm:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Tạo và phân công ca làm việc</li>
                <li>Chấm công vào/ra</li>
                <li>Quản lý giờ làm thêm</li>
                <li>Báo cáo thống kê ca làm việc</li>
                <li>Lịch làm việc theo tuần/tháng</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
