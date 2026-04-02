import PermissionGuard from '@/components/admin/PermissionGuard'
import { PERMISSIONS } from '@/lib/permissions'

interface OrderBulkActionsProps {
  selectedCount: number
  onClearSelection: () => void
  onBulkStatusUpdate: (status: string) => void
  onBulkDelete: () => void
  onBulkPrint: () => void
  getStatusLabel: (status: string) => string
}

const OrderBulkActions: React.FC<OrderBulkActionsProps> = ({
  selectedCount,
  onClearSelection,
  onBulkStatusUpdate,
  onBulkDelete,
  getStatusLabel,
  onBulkPrint
}) => {
  if (selectedCount === 0) return null

  return (
    <div className="sticky top-4 z-40 bg-white border border-blue-200 shadow-xl rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top duration-300 mb-6">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
          {selectedCount}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">đơn hàng đang được chọn</p>
          <button onClick={onClearSelection} className="text-xs text-blue-600 hover:underline">Bỏ chọn tất cả</button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <PermissionGuard permission={PERMISSIONS.ORDERS_PRINT}>
          <button 
            onClick={onBulkPrint}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            In hàng loạt
          </button>
        </PermissionGuard>

        <button 
          onClick={() => onBulkStatusUpdate('CONFIRMED')} 
          className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Xác nhận loạt
        </button>

        <button 
          onClick={() => onBulkStatusUpdate('SHIPPED')} 
          className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          Giao hàng loạt
        </button>

        <PermissionGuard permission={PERMISSIONS.ORDERS_DELETE}>
          <button 
            onClick={onBulkDelete}
            className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-bold hover:bg-red-100 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Xóa loạt
          </button>
        </PermissionGuard>
      </div>
    </div>
  )
}

export default OrderBulkActions
