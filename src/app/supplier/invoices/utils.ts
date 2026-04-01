export const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

export const fmtShort = (n: number) => {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' tỷ'
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' tr'
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k'
    return n.toString()
}

export const statusMap: Record<string, { label: string; color: string; bg: string; border: string }> = {
    DRAFT: { label: 'Nháp', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    SENT: { label: 'Đã gửi', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    PAID: { label: 'Đã thanh toán', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    OVERDUE: { label: 'Quá hạn', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    CANCELLED: { label: 'Đã hủy', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
}

export const typeMap: Record<string, string> = {
    SALES: 'Bán hàng',
    PURCHASE: 'Mua hàng',
    RETURN: 'Trả hàng',
    CREDIT_NOTE: 'Ghi có',
}

export const getStatus = (s: string) => statusMap[s] || statusMap.DRAFT
