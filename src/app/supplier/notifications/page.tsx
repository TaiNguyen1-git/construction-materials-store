'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Clock, Trash2, Info, AlertTriangle, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupplierNotifications() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch(`/api/supplier/notifications?supplierId=${supplierId}`)
            const data = await res.json()
            if (data.success) {
                setNotifications(data.data.notifications)
            }
        } catch (error) {
            console.error('Fetch notifications failed')
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch('/api/supplier/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })
            if (res.ok) {
                setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
            }
        } catch (error) {
            toast.error('Lỗi khi cập nhật')
        }
    }

    const markAllAsRead = async () => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch('/api/supplier/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ supplierId, all: true })
            })
            if (res.ok) {
                setNotifications(notifications.map(n => ({ ...n, read: true })))
                toast.success('Đã đánh dấu tất cả là đã đọc')
            }
        } catch (error) {
            toast.error('Lỗi khi cập nhật')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="w-6 h-6 text-blue-600" />
                        Thông báo
                    </h1>
                    <p className="text-gray-500">Cập nhật tin tức và hoạt động mới nhất.</p>
                </div>
                {notifications.some(n => !n.read) && (
                    <button
                        onClick={markAllAsRead}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                        <Check className="w-4 h-4" /> Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                {notifications.length > 0 ? (
                    <div className="divide-y">
                        {notifications.map((noti) => (
                            <div
                                key={noti.id}
                                className={`p-6 flex gap-4 hover:bg-gray-50 transition-colors ${!noti.read ? 'bg-blue-50/30' : ''}`}
                            >
                                <div className={`p-3 rounded-xl h-fit ${noti.type === 'ALERT' ? 'bg-red-100 text-red-600' :
                                        noti.type === 'SUCCESS' ? 'bg-green-100 text-green-600' :
                                            'bg-blue-100 text-blue-600'
                                    }`}>
                                    {noti.type === 'ALERT' ? <AlertTriangle className="w-5 h-5" /> :
                                        noti.type === 'SUCCESS' ? <Check className="w-5 h-5" /> :
                                            <Info className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`font-bold ${noti.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                            {noti.title}
                                        </h3>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(noti.createdAt).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                    <p className={`text-sm ${noti.read ? 'text-gray-500' : 'text-gray-600 font-medium'}`}>
                                        {noti.message}
                                    </p>
                                    {!noti.read && (
                                        <button
                                            onClick={() => markAsRead(noti.id)}
                                            className="text-xs font-semibold text-blue-600 hover:underline mt-2"
                                        >
                                            Đánh dấu đã đọc
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p>Bạn không có thông báo nào</p>
                    </div>
                )}
            </div>
        </div>
    )
}
