'use client'

import { FileText, Calendar, Building, Package, Coins } from 'lucide-react'

export interface InvoiceItem {
  name: string
  quantity?: number
  unit?: string
  unitPrice?: number
  totalPrice?: number
}


interface ChatOCRPreviewProps {
  invoiceNumber?: string
  invoiceDate?: Date
  supplierName?: string
  items: InvoiceItem[]
  totalAmount?: number
  confidence: number
  onConfirm: () => void
  onEdit: () => void
  onCancel: () => void
}

export default function ChatOCRPreview({
  invoiceNumber,
  invoiceDate,
  supplierName,
  items,
  totalAmount,
  confidence,
  onConfirm,
  onEdit,
  onCancel
}: ChatOCRPreviewProps) {
  return (
    <div className="bg-white rounded-lg border-2 border-purple-500 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Hóa Đơn Nhận Diện</h3>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full font-medium ${confidence > 0.8 ? 'bg-green-100 text-green-700' :
            confidence > 0.6 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
          }`}>
          {(confidence * 100).toFixed(0)}% tin cậy
        </div>
      </div>

      {/* Invoice Info */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {invoiceNumber && (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-gray-500 text-xs">Số HĐ</div>
              <div className="font-medium text-gray-900">{invoiceNumber}</div>
            </div>
          </div>
        )}

        {invoiceDate && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-gray-500 text-xs">Ngày</div>
              <div className="font-medium text-gray-900">
                {invoiceDate.toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        )}

        {supplierName && (
          <div className="flex items-center gap-2 col-span-2">
            <Building className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-gray-500 text-xs">Nhà cung cấp</div>
              <div className="font-medium text-gray-900">{supplierName}</div>
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Package className="w-4 h-4" />
          <span>Sản phẩm ({items.length})</span>
        </div>

        <div className="max-h-40 overflow-y-auto space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
              <div className="font-medium text-gray-900">{item.name}</div>
              <div className="text-gray-600 flex justify-between items-center">
                <span>
                  {item.quantity && item.unit && `${item.quantity} ${item.unit}`}
                  {item.unitPrice && ` x ${item.unitPrice.toLocaleString('vi-VN')}đ`}
                </span>
                {item.totalPrice && (
                  <span className="font-semibold">
                    {item.totalPrice.toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      {totalAmount && (
        <div className="border-t pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-gray-900">Tổng cộng:</span>
            </div>
            <span className="text-xl font-bold text-purple-600">
              {totalAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      )}

      {/* Warnings */}
      {confidence < 0.7 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800">
          ⚠️ Độ tin cậy thấp. Vui lòng kiểm tra kỹ thông tin trước khi lưu.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onConfirm}
          className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          💾 Lưu hóa đơn
        </button>
        <button
          onClick={onEdit}
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          ✏️ Sửa
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          ❌ Hủy
        </button>
      </div>
    </div>
  )
}
