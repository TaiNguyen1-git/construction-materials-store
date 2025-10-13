'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, Check, X, AlertCircle, Download, Eye, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface OCRRecord {
  id: string
  fileName: string
  filePath: string
  extractedText?: string
  processedData?: any
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVIEWED'
  confidence?: number
  errorMessage?: string
  processedBy?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export default function OCRPage() {
  const [ocrRecords, setOcrRecords] = useState<OCRRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<OCRRecord | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20
  })

  useEffect(() => {
    fetchOCRRecords()
  }, [filters])

  const fetchOCRRecords = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString())
      })

      const response = await fetch(`/api/ocr/invoice?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setOcrRecords(data.data.data || [])
      } else {
        setError(data.error?.message || 'Failed to fetch OCR records')
        toast.error(data.error?.message || 'Failed to fetch OCR records')
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.')
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File quá lớn, vui lòng chọn file dưới 10MB')
      return
    }

    setUploading(true)
    
    try {
      // In a real implementation, you would upload the file to storage first
      // For demo purposes, we'll simulate with a mock path
      const mockFilePath = `/uploads/invoices/${Date.now()}_${file.name}`
      
      const response = await fetch('/api/ocr/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          filePath: mockFilePath,
          invoiceType: 'SUPPLIER'
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Upload thành công! Đang xử lý OCR...')
        fetchOCRRecords()
      } else {
        toast.error('Lỗi upload: ' + data.error?.message)
      }
    } catch (error) {
      toast.error('Lỗi upload: ' + (error as Error).message)
    } finally {
      setUploading(false)
      // Reset input
      event.target.value = ''
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
      'PROCESSING': { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800' },
      'COMPLETED': { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      'FAILED': { label: 'Thất bại', color: 'bg-red-100 text-red-800' },
      'REVIEWED': { label: 'Đã duyệt', color: 'bg-purple-100 text-purple-800' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING']
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500'
    if (confidence >= 0.9) return 'text-green-600'
    if (confidence >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const viewOCRResult = (record: OCRRecord) => {
    setSelectedRecord(record)
    setShowPreview(true)
  }

  const markAsReviewed = async (recordId: string) => {
    try {
      // In a real implementation, you would have an API endpoint to mark as reviewed
      // For now, we'll just refresh the list
      toast.success('Đã đánh dấu là đã duyệt')
      fetchOCRRecords()
    } catch (error) {
      toast.error('Lỗi cập nhật: ' + (error as Error).message)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">OCR Invoice Processing</h1>
          
          {/* Upload Button */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <button
              disabled={uploading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Đang xử lý...' : 'Upload Invoice'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border mb-4">
          <div className="flex gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="FAILED">Thất bại</option>
              <option value="REVIEWED">Đã duyệt</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OCR Records Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Độ chính xác</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ocrRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.fileName}</div>
                          <div className="text-sm text-gray-500">ID: {record.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                    <td className="px-6 py-4">
                      {record.confidence ? (
                        <span className={`text-sm font-medium ${getConfidenceColor(record.confidence)}`}>
                          {(record.confidence * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(record.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {record.status === 'COMPLETED' && (
                          <>
                            <button
                              onClick={() => viewOCRResult(record)}
                              className="text-blue-600 hover:text-blue-900 text-sm flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Xem
                            </button>
                            {record.status === 'COMPLETED' && (
                              <button
                                onClick={() => markAsReviewed(record.id)}
                                className="text-green-600 hover:text-green-900 text-sm flex items-center gap-1"
                              >
                                <Check className="w-4 h-4" />
                                Duyệt
                              </button>
                            )}
                          </>
                        )}
                        {record.status === 'FAILED' && record.errorMessage && (
                          <span className="text-red-600 text-sm flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Lỗi
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {ocrRecords.length === 0 && !error && (
              <div className="p-8 text-center text-gray-500">
                Chưa có file nào được xử lý
                <div className="mt-2 text-sm">Upload hình ảnh hóa đơn để bắt đầu</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Retry Button when error occurs */}
      {error && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={fetchOCRRecords}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử lại
          </button>
        </div>
      )}

      {/* OCR Result Preview Modal */}
      {showPreview && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Kết quả OCR - {selectedRecord.fileName}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Extracted Text */}
              <div>
                <h4 className="font-medium mb-2">Văn bản trích xuất:</h4>
                <div className="bg-gray-50 p-4 rounded-lg text-sm max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{selectedRecord.extractedText || 'Không có dữ liệu'}</pre>
                </div>
              </div>

              {/* Processed Data */}
              <div>
                <h4 className="font-medium mb-2">Dữ liệu đã xử lý:</h4>
                <div className="bg-gray-50 p-4 rounded-lg text-sm max-h-96 overflow-y-auto">
                  {selectedRecord.processedData ? (
                    <div className="space-y-4">
                      {/* Invoice Info */}
                      <div>
                        <div className="font-medium text-gray-700">Thông tin hóa đơn:</div>
                        <div className="mt-1 text-sm">
                          <div>Số HĐ: {selectedRecord.processedData.invoiceNumber || 'N/A'}</div>
                          <div>Ngày: {selectedRecord.processedData.date || 'N/A'}</div>
                        </div>
                      </div>

                      {/* Supplier Info */}
                      {selectedRecord.processedData.supplier && (
                        <div>
                          <div className="font-medium text-gray-700">Nhà cung cấp:</div>
                          <div className="mt-1 text-sm">
                            <div>Tên: {selectedRecord.processedData.supplier.name || 'N/A'}</div>
                            <div>Địa chỉ: {selectedRecord.processedData.supplier.address || 'N/A'}</div>
                          </div>
                        </div>
                      )}

                      {/* Items */}
                      {selectedRecord.processedData.items && (
                        <div>
                          <div className="font-medium text-gray-700">Sản phẩm:</div>
                          <div className="mt-1 space-y-2">
                            {selectedRecord.processedData.items.map((item: any, index: number) => (
                              <div key={index} className="bg-white p-2 rounded border text-sm">
                                <div className="font-medium">{item.name}</div>
                                <div className="text-gray-600">
                                  Số lượng: {item.quantity} | Đơn giá: {item.unitPrice?.toLocaleString('vi-VN')}đ | 
                                  Tổng: {item.total?.toLocaleString('vi-VN')}đ
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Totals */}
                      {selectedRecord.processedData.totals && (
                        <div>
                          <div className="font-medium text-gray-700">Tổng cộng:</div>
                          <div className="mt-1 text-sm">
                            <div>Subtotal: {selectedRecord.processedData.totals.subtotal?.toLocaleString('vi-VN')}đ</div>
                            <div>Thuế: {selectedRecord.processedData.totals.tax?.toLocaleString('vi-VN')}đ</div>
                            <div className="font-medium">Tổng: {selectedRecord.processedData.totals.total?.toLocaleString('vi-VN')}đ</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500">Không có dữ liệu được xử lý</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                Độ chính xác: <span className={`font-medium ${getConfidenceColor(selectedRecord.confidence)}`}>
                  {selectedRecord.confidence ? (selectedRecord.confidence * 100).toFixed(1) + '%' : 'N/A'}
                </span>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                >
                  Đóng
                </button>
                {selectedRecord.status === 'COMPLETED' && (
                  <button
                    onClick={() => {
                      markAsReviewed(selectedRecord.id)
                      setShowPreview(false)
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Duyệt và Đóng
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}