'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle, AlertTriangle, Info, RefreshCw, Building2, FileText } from 'lucide-react'
import { getAuthHeaders } from '@/lib/api-client'
import { useAuth } from '@/contexts/auth-context'
import type { FirebaseNotification } from '@/lib/firebase-notifications'


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

interface RawNotification extends Partial<FirebaseNotification> {
  id: string
  isRead?: boolean
}


export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const { user } = useAuth()

  // Sync unreadCount based on current notifications
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length
    setUnreadCount(count)
  }, [notifications])

  // Manual refresh / load more
  const refreshNotifications = async (loadMore = false) => {
    try {
      if (loadMore) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      const headers = getAuthHeaders()
      const currentPage = loadMore ? page + 1 : 1
      const limit = 10

      const response = await fetch(`/api/notifications?page=${currentPage}&limit=${limit}`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()

        if (result.success && result.data && Array.isArray(result.data.notifications)) {
          const newNotifs: Notification[] = result.data.notifications.map((n: RawNotification) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            priority: n.priority,
            read: n.isRead !== undefined ? n.isRead : (n.read !== undefined ? n.read : false),
            createdAt: n.createdAt,
            referenceId: n.referenceId,
            referenceType: n.referenceType
          }))

          if (loadMore) {
            setNotifications(prev => [...prev, ...newNotifs])
            setPage(currentPage)
          } else {
            setNotifications(newNotifs)
            setPage(1)
          }

          setHasMore(result.data.pagination?.hasNext || false)

          if (result.data.unreadCount !== undefined) {
            setUnreadCount(result.data.unreadCount)
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error)
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }

  // Real-time via Firebase with API fallback
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return

    let unsubscribe: (() => void) | undefined
    let pollInterval: NodeJS.Timeout | undefined
    let firebaseWorking = false

    // Fallback polling
    const pollNotifications = async () => {
      if (firebaseWorking) return

      try {
        const headers = getAuthHeaders()
        const response = await fetch('/api/notifications', {
          headers: { ...headers, 'Content-Type': 'application/json' }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data && Array.isArray(result.data.notifications)) {
            const notifs: Notification[] = result.data.notifications.map((n: RawNotification) => ({
              id: n.id,
              title: n.title,
              message: n.message,
              type: n.type,
              priority: n.priority,
              read: n.isRead ?? n.read ?? false,
              createdAt: n.createdAt,
              referenceId: n.referenceId,
              referenceType: n.referenceType
            }))

            setNotifications(notifs)

            if (result.data.unreadCount !== undefined) {
              setUnreadCount(result.data.unreadCount)
            } else {
              setUnreadCount(notifs.filter(n => !n.read).length)
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }

    const setupFirebaseSubscription = async () => {
      try {
        const { subscribeToNotifications } = await import('@/lib/firebase-notifications')

        unsubscribe = subscribeToNotifications(
          user.id,
          user.role,
          (firebaseNotifs: FirebaseNotification[]) => {
            firebaseWorking = true

            const notifs: Notification[] = firebaseNotifs
              .filter((n: FirebaseNotification) => !!n.id)
              .map((n: FirebaseNotification) => ({
                id: n.id!,
                title: n.title,
                message: n.message,
                type: n.type,
                priority: n.priority,
                read: n.read,
                createdAt: n.createdAt,
                referenceId: n.referenceId,
                referenceType: n.referenceType
              }))

            setNotifications(notifs)
            setUnreadCount(notifs.filter(n => !n.read).length)
          }
        )

        // Wait to see if Firebase delivers data
        setTimeout(() => {
          if (!firebaseWorking) {
            pollInterval = setInterval(pollNotifications, 10000)
          }
        }, 3000)

      } catch (e) {
        console.error("Firebase init error, using API polling:", e)
        pollInterval = setInterval(pollNotifications, 10000)
      }
    }

    // Load immediately, then try Firebase
    pollNotifications()
    setupFirebaseSubscription()

    return () => {
      if (unsubscribe) unsubscribe()
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [user])

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))

    try {
      // Update Database
      const headers = getAuthHeaders()
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      })

      // Update Firebase
      if (user) {
        const { markNotificationReadInFirebase } = await import('@/lib/firebase-notifications')
        await markNotificationReadInFirebase(user.id, id)
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)

    // Optimistic update
    setNotifications(notifications.map(n => ({ ...n, read: true })))

    try {
      const headers = getAuthHeaders()

      // Batch mark all in Database
      fetch('/api/notifications', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      })

      // Mark each in Firebase
      if (user) {
        const { markNotificationReadInFirebase } = await import('@/lib/firebase-notifications')
        for (const id of unreadIds) {
          await markNotificationReadInFirebase(user.id, id)
        }
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      refreshNotifications()
    }
  }

  const deleteNotification = async (id: string) => {
    // Optimistic update
    const notification = notifications.find(n => n.id === id)
    if (notification && !notification.read) {
      setUnreadCount(Math.max(0, unreadCount - 1))
    }
    setNotifications(notifications.filter(n => n.id !== id))

    try {
      // Delete from Database
      const headers = getAuthHeaders()
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers
      })

      // Delete from Firebase
      if (user) {
        const { deleteNotificationFromFirebase } = await import('@/lib/firebase-notifications')
        await deleteNotificationFromFirebase(user.id, id)
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'STOCK_ALERT':
      case 'LOW_STOCK':
      case 'REORDER_NEEDED':
      case 'STOCK_UPDATE':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'ORDER_UPDATE':
      case 'ORDER_NEW':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'PAYMENT_UPDATE':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case 'PROJECT_MATCH':
        return <Building2 className="w-5 h-5 text-orange-500" />
      case 'QUOTE_NEW':
      case 'QUOTE_UPDATE':
        return <FileText className="w-5 h-5 text-purple-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'border-l-red-500'
      case 'URGENT':
        return 'border-l-red-700'
      default:
        return 'border-l-gray-300'
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Close dropdown
    setIsOpen(false)

    // Navigate based on type
    if (notification.referenceId) {
      const isAdmin = window.location.pathname.startsWith('/admin')
      const isContractor = window.location.pathname.startsWith('/contractor')

      if (notification.type === 'PROJECT_MATCH') {
        window.location.href = `/projects/${notification.referenceId}`
        return
      }

      if (notification.type === 'QUOTE_NEW' || notification.type === 'QUOTE_UPDATE') {
        window.location.href = `/contractor/quotes`
        return
      }

      if (notification.referenceType === 'ORDER' || notification.type === 'ORDER_NEW' || notification.type === 'ORDER_UPDATE') {
        if (isAdmin) {
          window.location.href = `/admin/orders`
        } else if (isContractor) {
          window.location.href = `/contractor/orders`
        } else {
          window.location.href = `/order-tracking?orderId=${notification.referenceId}`
        }
      } else if (notification.referenceType === 'MILESTONE') {
        const isContractor = window.location.pathname.startsWith('/contractor')
        if (isContractor) {
          window.location.href = `/contractor/projects` // Could be more specific if we had project ID
        } else {
          window.location.href = `/account/projects`
        }
      } else if (notification.referenceType === 'PRODUCT' || notification.type === 'LOW_STOCK' || notification.type === 'REORDER_NEEDED') {
        if (isAdmin) {
          window.location.href = `/admin/products`
        } else {
          window.location.href = `/products/${notification.referenceId}`
        }
      }
    } else {
      if (notification.type === 'QUOTE_NEW' || notification.type === 'QUOTE_UPDATE') {
        window.location.href = `/contractor/quotes`
      }
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-gray-900">Thông Báo</h3>
                <button
                  onClick={() => refreshNotifications(false)}
                  disabled={isRefreshing}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                  title="Làm mới"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && !isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Không có thông báo
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b border-gray-100 ${getPriorityColor(notification.priority)} border-l-4 ${!notification.read ? 'bg-blue-50' : ''
                      } cursor-pointer hover:bg-gray-50 transition-colors`}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-start">
                        {getNotificationIcon(notification.type)}
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Đánh dấu đã đọc"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Xóa"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Đang tải thêm...</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 text-center">
            {hasMore ? (
              <button
                onClick={() => refreshNotifications(true)}
                disabled={isLoading}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
              >
                {isLoading ? 'Đang tải...' : 'Xem các thông báo cũ hơn'}
              </button>
            ) : notifications.length > 0 ? (
              <span className="text-xs text-gray-400 italic">Đã hiện tất cả thông báo</span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
