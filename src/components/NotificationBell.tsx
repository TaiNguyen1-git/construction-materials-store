'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react'
import { getAuthHeaders } from '@/lib/api-client'
import { useAuth } from '@/contexts/auth-context'

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

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { user } = useAuth()

  // Manual refresh function
  const refreshNotifications = async () => {
    try {
      setIsRefreshing(true)
      const headers = getAuthHeaders()

      const response = await fetch('/api/notifications', {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()

        if (result.success && result.data) {
          const notifs = result.data.notifications.map((n: any) => ({
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

          setNotifications(notifs)
          setUnreadCount(result.data.unreadCount || notifs.filter((n: any) => !n.read).length)
        }
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Real-time notifications using Firebase with API fallback
  useEffect(() => {
    // Check if we are in browser or no user
    if (typeof window === 'undefined' || !user) return

    let unsubscribe: (() => void) | undefined
    let pollInterval: NodeJS.Timeout | undefined
    let firebaseWorking = false

    // Fallback polling function
    const pollNotifications = async () => {
      if (firebaseWorking) return // Don't poll if Firebase is working

      try {
        const headers = getAuthHeaders()
        const response = await fetch('/api/notifications', {
          headers: { ...headers, 'Content-Type': 'application/json' }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            const notifs = result.data.notifications.map((n: any) => ({
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
            setUnreadCount(result.data.unreadCount || notifs.filter((n: any) => !n.read).length)
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
          (firebaseNotifs) => {
            firebaseWorking = true // Firebase is working, disable polling

            const notifs = firebaseNotifs.map(n => ({
              id: n.id || `temp-${Date.now()}-${Math.random()}`,
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

        // Wait a bit to see if Firebase delivers data
        setTimeout(() => {
          if (!firebaseWorking) {
            console.log('[NotificationBell] Firebase not responding, starting API polling')
            pollInterval = setInterval(pollNotifications, 30000) // Poll every 30s
          }
        }, 3000)

      } catch (e) {
        console.error("Firebase init error, using API polling:", e)
        // Start polling on Firebase error
        pollInterval = setInterval(pollNotifications, 30000)
      }
    }

    // Load notifications immediately on mount (don't wait for Firebase)
    pollNotifications()

    // Then try Firebase subscription
    setupFirebaseSubscription()

    return () => {
      if (unsubscribe) unsubscribe()
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [user])

  const markAsRead = async (id: string) => {
    try {
      if (id.startsWith('realtime-')) {
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ))
        setUnreadCount(Math.max(0, unreadCount - 1))
        return
      }

      const headers = getAuthHeaders()
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId: id })
      })

      if (response.ok) {
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ))
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      // Silent fail
    }
  }

  const markAllAsRead = async () => {
    // Optimistic update - update UI immediately
    setNotifications(notifications.map(n => ({ ...n, read: true })))
    setUnreadCount(0)

    try {
      const persistedNotifications = notifications.filter(n => !n.id.startsWith('realtime-') && !n.read)

      if (persistedNotifications.length === 0) return

      const headers = getAuthHeaders()

      // Send requests in background - don't wait for response
      persistedNotifications.forEach(n => {
        fetch('/api/notifications', {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notificationId: n.id })
        }).catch(() => {
          // Silent fail - UI already updated
        })
      })
    } catch (error) {
      // Silent fail - UI already updated
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const notification = notifications.find(n => n.id === id)
      if (notification && !notification.read) {
        setUnreadCount(Math.max(0, unreadCount - 1))
      }

      setNotifications(notifications.filter(n => n.id !== id))

      if (id.startsWith('realtime-')) {
        return
      }

      const headers = getAuthHeaders()
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers
      })
    } catch (error) {
      // Silent fail
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'STOCK_ALERT':
      case 'LOW_STOCK':
      case 'REORDER_NEEDED':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'ORDER_UPDATE':
      case 'ORDER_NEW':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'PAYMENT_UPDATE':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
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
    console.log('[NotificationBell] Click:', {
      id: notification.id,
      type: notification.type,
      referenceId: notification.referenceId,
      referenceType: notification.referenceType
    })

    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Close dropdown
    setIsOpen(false)

    // Navigate based on type
    if (notification.referenceId) {
      const isAdmin = window.location.pathname.startsWith('/admin')

      if (notification.referenceType === 'ORDER' || notification.type === 'ORDER_NEW' || notification.type === 'ORDER_UPDATE') {
        if (isAdmin) {
          // For admin, go to orders page - the order detail modal will need to be opened manually
          window.location.href = `/admin/orders`
        } else {
          window.location.href = `/order-tracking?orderId=${notification.referenceId}`
        }
      } else if (notification.referenceType === 'PRODUCT' || notification.type === 'LOW_STOCK' || notification.type === 'REORDER_NEEDED') {
        if (isAdmin) {
          window.location.href = `/admin/products`
        } else {
          window.location.href = `/products/${notification.referenceId}`
        }
      } else {
        // Default: just close dropdown, notification is marked as read
        console.log('[NotificationBell] Unknown referenceType, no navigation')
      }
    } else {
      console.log('[NotificationBell] No referenceId, no navigation')
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
                  onClick={refreshNotifications}
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
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Không có thông báo
              </div>
            ) : (
              notifications.map((notification) => (
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
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800">
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
