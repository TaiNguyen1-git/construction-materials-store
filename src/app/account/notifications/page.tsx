'use client'

import { useState, useEffect } from 'react'
import { Bell, CheckCircle, AlertTriangle, Info, Trash2, ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'
import { getAuthHeaders } from '@/lib/api-client'
import Link from 'next/link'

interface Notification {
    id: string
    title: string
    message: string
    type: string
    priority: string
    read: boolean
    createdAt: string
    referenceId?: string
    referenceType?: string
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const headers = getAuthHeaders()
            const response = await fetch('/api/notifications', { headers })

            if (response.ok) {
                const result = await response.json()
                if (result.success && result.data) {
                    setNotifications(result.data.notifications)
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [])

    const markAllRead = async () => {
        try {
            const headers = getAuthHeaders()
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true })
            })
            setNotifications(notifications.map(n => ({ ...n, read: true })))
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    const deleteNotification = async (id: string) => {
        try {
            const headers = getAuthHeaders()
            await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                headers
            })
            setNotifications(notifications.filter(n => n.id !== id))
        } catch (error) {
            console.error('Error deleting notification:', error)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'STOCK_ALERT': return <AlertTriangle className="w-6 h-6 text-red-500" />
            case 'ORDER_UPDATE': return <CheckCircle className="w-6 h-6 text-green-500" />
            default: return <Info className="w-6 h-6 text-blue-500" />
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/account" className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200">
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </Link>
                        <h1 className="text-3xl font-black text-gray-900">Thông báo của tôi</h1>
                    </div>
                    {notifications.some(n => !n.read) && (
                        <button
                            onClick={markAllRead}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200"
                        >
                            Đánh dấu tất cả đã đọc
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-500 font-medium">Đang tải thông báo...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-20 text-center">
                            <Bell className="w-20 h-20 text-gray-200 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có thông báo nào</h3>
                            <p className="text-gray-500">Chúng tôi sẽ cập nhật khi có tin mới cho bạn!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`p-6 flex items-start justify-between hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50/50' : ''}`}
                                >
                                    <div className="flex gap-4">
                                        <div className={`p-3 rounded-2xl ${notif.read ? 'bg-gray-100' : 'bg-white shadow-sm'}`}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div>
                                            <h4 className={`text-lg mb-1 ${notif.read ? 'text-gray-700' : 'text-gray-900 font-bold'}`}>
                                                {notif.title}
                                            </h4>
                                            <p className="text-gray-600 mb-2 leading-relaxed">{notif.message}</p>
                                            <span className="text-sm text-gray-400">
                                                {new Date(notif.createdAt).toLocaleString('vi-VN')}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteNotification(notif.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
