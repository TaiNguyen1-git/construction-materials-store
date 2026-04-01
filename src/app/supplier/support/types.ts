import { Database, Upload, CreditCard, Package, RefreshCw, LifeBuoy } from 'lucide-react'

export interface SupplierTicket {
    id: string
    reason: string
    description: string
    category?: string
    orderId?: string
    status: string
    priority?: string
    comments?: TicketComment[]
    evidenceUrls?: string[]
    createdAt: string
    updatedAt?: string
}

export interface TicketComment {
    id: string
    senderId?: string
    senderType: string
    senderName?: string
    content: string
    createdAt: string
}

export const CATEGORIES: Record<string, { label: string; icon: React.ElementType; description: string }> = {
    INVENTORY_SYNC: { label: 'Đồng bộ tồn kho', icon: Database, description: 'Số liệu tồn kho sai lệch với thực tế' },
    PRODUCT_UPLOAD: { label: 'Lỗi upload sản phẩm', icon: Upload, description: 'Không thể tải lên/chỉnh sửa sản phẩm' },
    PAYMENT_MISMATCH: { label: 'Sai lệch đối soát', icon: CreditCard, description: 'Số tiền nhận về không khớp với báo cáo' },
    PURCHASE_ORDER: { label: 'Vấn đề đơn mua (PO)', icon: Package, description: 'Nhầm lẫn về PO, số lượng, đơn giá' },
    RETURN_ISSUE: { label: 'Trả hàng / Khiếu nại', icon: RefreshCw, description: 'Vấn đề về quy trình trả hàng từ cửa hàng' },
    GENERAL: { label: 'Vấn đề khác', icon: LifeBuoy, description: 'Thắc mắc chung hoặc góp ý cải thiện' },
}

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    OPEN: { label: 'Mới gửi', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    IN_PROGRESS: { label: 'Đang xử lý', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    WAITING: { label: 'Chờ NCC phản hồi', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    RESOLVED: { label: 'Đã giải quyết', color: 'bg-green-100 text-green-700 border-green-200' },
    CLOSED: { label: 'Đã đóng', color: 'bg-slate-100 text-slate-600 border-slate-200' },
}

export const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    LOW: { label: 'Thấp', color: 'bg-slate-100 text-slate-600' },
    MEDIUM: { label: 'Trung bình', color: 'bg-blue-100 text-blue-600' },
    HIGH: { label: 'Cao', color: 'bg-orange-100 text-orange-700' },
    URGENT: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-700' },
}
