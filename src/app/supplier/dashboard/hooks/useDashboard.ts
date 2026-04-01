import { useState, useCallback } from 'react'
import { Clock, RotateCcw, Star } from 'lucide-react'
import toast from 'react-hot-toast'

interface DashboardStats {
    totalOrders: number
    pendingOrders: number
    totalRevenue: number
    pendingPayments: number
}

interface PerformanceAlert {
    type: 'warning' | 'critical' | 'info'
    title: string
    description: string
    action: string
    link: string
    icon: any
}

export function useDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        pendingPayments: 0
    })
    const [recentOrders, setRecentOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [performanceAlerts, setPerformanceAlerts] = useState<PerformanceAlert[]>([])

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true)
            const supplierId = localStorage.getItem('supplier_id')
            const token = localStorage.getItem('supplier_token')

            const res = await fetch(`/api/supplier/dashboard?supplierId=${supplierId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setStats(data.data.stats)
                    setRecentOrders(data.data.recentOrders || [])

                    // Generate performance alerts
                    const alerts: PerformanceAlert[] = []
                    if (data.data.stats.pendingOrders > 5) {
                        alerts.push({
                            type: 'warning',
                            title: `${data.data.stats.pendingOrders} PO chờ xử lý`,
                            description: 'Phản hồi PO trong 4 tiếng để giữ tỷ lệ phản hồi nhanh',
                            action: 'Xem đơn hàng',
                            link: '/supplier/orders',
                            icon: Clock
                        })
                    }
                    if (data.data.stats.returnRate && data.data.stats.returnRate > 5) {
                        alerts.push({
                            type: 'critical',
                            title: `Tỷ lệ trả hàng ${data.data.stats.returnRate}%`,
                            description: 'Kiểm tra chất lượng đóng gói ngay',
                            action: 'Kiểm tra trả hàng',
                            link: '/supplier/returns',
                            icon: RotateCcw
                        })
                    }
                    if (data.data.stats.avgRating && data.data.stats.avgRating < 4.0) {
                        alerts.push({
                            type: 'warning',
                            title: `Đánh giá Tệ: ${data.data.stats.avgRating}/5`,
                            description: 'Khách hàng có trải nghiệm k tốt, hãy cải thiện. Cần xử lý sớm',
                            action: 'Xem phản hồi',
                            link: '/supplier/analytics',
                            icon: Star
                        })
                    }
                    setPerformanceAlerts(alerts)
                }
            }
        } catch (error) {
            console.error('Failed to fetch dashboard:', error)
            toast.error('Lỗi khi tải dữ liệu dashboard')
        } finally {
            setLoading(false)
        }
    }, [])

    const handleExport = useCallback(() => {
        const loadingToast = toast.loading('Đang chuẩn bị dữ liệu báo cáo...', { 
            position: 'top-right'
        })
        try {
            const headers = ['Mã Đơn Hàng', 'Sản phẩm', 'Số lượng', 'Trạng thái', 'Ngày tạo']
            const rows = recentOrders.map(order => [
                order.orderNumber,
                `"${order.productName}"`,
                order.quantity,
                order.status,
                new Date(order.createdAt).toLocaleDateString('vi-VN')
            ])
            const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', `Dashboard_Report_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success('Xuất file thành công!', { id: loadingToast })
        } catch (error) {
            toast.error('Có lỗi xảy ra', { id: loadingToast })
        }
    }, [recentOrders])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount)
    }

    return {
        stats,
        recentOrders,
        loading,
        performanceAlerts,
        fetchDashboardData,
        handleExport,
        formatCurrency
    }
}
