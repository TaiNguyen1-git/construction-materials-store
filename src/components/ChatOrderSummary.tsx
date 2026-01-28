'use client'

import { ShoppingCart, Package, MapPin, CreditCard } from 'lucide-react'

export interface OrderItem {
  productName: string
  quantity: number
  unit: string
  unitPrice?: number
  totalPrice?: number
}


interface ChatOrderSummaryProps {
  items: OrderItem[]
  customerInfo?: {
    name: string
    phone: string
    address: string
  }
  paymentMethod?: string
  deliveryMethod?: string
  totalAmount?: number
  onConfirm: () => void
  onEdit: () => void
  onCancel: () => void
}

export default function ChatOrderSummary({
  items,
  customerInfo,
  paymentMethod,
  deliveryMethod,
  totalAmount,
  onConfirm,
  onEdit,
  onCancel
}: ChatOrderSummaryProps) {
  return (
    <div className="bg-white rounded-lg border-2 border-primary-500 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b pb-2">
        <ShoppingCart className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-gray-900">Đơn Hàng Của Bạn</h3>
      </div>

      {/* Items */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Package className="w-4 h-4" />
          <span>Sản phẩm ({items.length})</span>
        </div>

        {items.map((item, idx) => (
          <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
            <div className="font-medium text-gray-900">{item.productName}</div>
            <div className="text-gray-600 flex justify-between">
              <span>Số lượng: {item.quantity} {item.unit}</span>
              {item.totalPrice && (
                <span className="font-semibold">{item.totalPrice.toLocaleString('vi-VN')}đ</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Customer Info */}
      {customerInfo && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className="w-4 h-4" />
            <span>Thông tin giao hàng</span>
          </div>
          <div className="bg-blue-50 p-2 rounded text-sm">
            <div className="font-medium text-gray-900">{customerInfo.name}</div>
            <div className="text-gray-600">{customerInfo.phone}</div>
            <div className="text-gray-600">{customerInfo.address}</div>
          </div>
        </div>
      )}

      {/* Payment Method */}
      {paymentMethod && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <CreditCard className="w-4 h-4" />
            <span>Thanh toán</span>
          </div>
          <div className="bg-green-50 p-2 rounded text-sm">
            <span className="font-medium text-gray-900">
              {formatPaymentMethod(paymentMethod)}
            </span>
          </div>
        </div>
      )}

      {/* Total */}
      {totalAmount && (
        <div className="border-t pt-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Tổng cộng:</span>
            <span className="text-xl font-bold text-primary-600">
              {totalAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onConfirm}
          className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          ✅ Xác nhận đặt hàng
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

function formatPaymentMethod(method: string): string {
  const labels: Record<string, string> = {
    'CASH': 'Tiền mặt (COD)',
    'BANK_TRANSFER': 'Chuyển khoản ngân hàng',
    'QR_CODE': 'Quét mã QR',
    'CREDIT_CARD': 'Thẻ tín dụng'
  }
  return labels[method] || method
}
