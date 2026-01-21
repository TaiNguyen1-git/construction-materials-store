'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCircle, AlertTriangle, Info, RefreshCw, Building2, FileText } from 'lucide-react'
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
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const { user } = useAuth()

  // Use refs to access latest values in callbacks without re-triggering useEffect
  const readIdsRef = useRef<Set<string>>(new Set())
  const deletedIdsRef = useRef<Set<string>>(new Set())

  // Load persisted state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const storedRead = localStorage.getItem(`read_notifs_${user.id}`)
      const storedDeleted = localStorage.getItem(`deleted_notifs_${user.id}`)

      if (storedRead) {
        const ids = JSON.parse(storedRead)
        const set = new Set<string>(ids)
        setReadIds(set)
        readIdsRef.current = set
      }

      if (storedDeleted) {
        const ids = JSON.parse(storedDeleted)
        const set = new Set<string>(ids)
        setDeletedIds(set)
        deletedIdsRef.current = set
      }
    }
  }, [user])

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`read_notifs_${user.id}`, JSON.stringify(Array.from(readIds)))
      readIdsRef.current = readIds
    }
  }, [readIds, user])

  useEffect(() => {
    if (user) {
      localStorage.setItem(`deleted_notifs_${user.id}`, JSON.stringify(Array.from(deletedIds)))
      deletedIdsRef.current = deletedIds
    }
  }, [deletedIds, user])

  // Automatically sync unreadCount based on current filtered notifications
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length
    setUnreadCount(count)
  }, [notifications])

  // Manual refresh function
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
          const currentDeletedIds = deletedIdsRef.current
          const currentReadIds = readIdsRef.current

          const newNotifs = result.data.notifications
            .filter((n: any) => !currentDeletedIds.has(n.id))
            .map((n: any) => ({
              id: n.id,
              title: n.title,
              message: n.message,
              type: n.type,
              priority: n.priority,
              read: currentReadIds.has(n.id) ? true : (n.isRead !== undefined ? n.isRead : (n.read !== undefined ? n.read : false)),
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
            // Adjust count based on local readIds/deletedIds that haven't synced to DB yet
            const localAdjusted = result.data.notifications.filter((n: any) =>
              (currentReadIds.has(n.id) || currentDeletedIds.has(n.id)) &&
              !(n.isRead ?? n.read ?? false)
            ).length;
            setUnreadCount(Math.max(0, result.data.unreadCount - localAdjusted));
          } else {
            setUnreadCount(newNotifs.filter((n: any) => !n.read).length)
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
          if (result.success && result.data && Array.isArray(result.data.notifications)) {
            const currentDeletedIds = deletedIdsRef.current
            const currentReadIds = readIdsRef.current

            const notifs: Notification[] = result.data.notifications
              .filter((n: any) => !currentDeletedIds.has(n.id))
              .map((n: any) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type,
                priority: n.priority,
                read: currentReadIds.has(n.id) ? true : (n.isRead ?? n.read ?? false),
                createdAt: n.createdAt,
                referenceId: n.referenceId,
                referenceType: n.referenceType
              }))

            setNotifications(notifs)

            if (result.data.unreadCount !== undefined) {
              const localAdjusted = result.data.notifications.filter((n: any) =>
                (currentReadIds.has(n.id) || currentDeletedIds.has(n.id)) &&
                !(n.isRead ?? n.read ?? false)
              ).length;
              setUnreadCount(Math.max(0, result.data.unreadCount - localAdjusted));
            } else {
              setUnreadCount(notifs.filter((n: Notification) => !n.read).length)
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
          (firebaseNotifs: any[]) => {
            firebaseWorking = true // Firebase is working, disable polling

            const currentDeletedIds = deletedIdsRef.current
            const currentReadIds = readIdsRef.current

            const notifs: Notification[] = firebaseNotifs
              .filter((n: any) => n.id && !currentDeletedIds.has(n.id))
              .map((n: any) => ({
                id: n.id || `temp-${Date.now()}-${Math.random()}`,
                title: n.title,
                message: n.message,
                type: n.type,
                priority: n.priority,
                read: (n.id && currentReadIds.has(n.id)) ? true : n.read,
                createdAt: n.createdAt,
                referenceId: n.referenceId,
                referenceType: n.referenceType
              }))

            setNotifications(notifs)
            setUnreadCount(notifs.filter((n: Notification) => !n.read).length)
          }
        )

        // Wait a bit to see if Firebase delivers data
        setTimeout(() => {
          if (!firebaseWorking) {
            pollInterval = setInterval(pollNotifications, 10000) // Poll every 10s for snappier feel
          }
        }, 3000)

      } catch (e) {
        console.error("Firebase init error, using API polling:", e)
        // Start polling on Firebase error
        pollInterval = setInterval(pollNotifications, 10000)
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
    // 1. Update local tracking instantly to prevent Firebase overwrite
    setReadIds(prev => new Set(prev).add(id))

    // 2. Update current notifications list
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))

    try {
      // 3. Update in Database
      const headers = getAuthHeaders()
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId: id })
      })

      // 4. Update in Firebase
      if (user) {
        const { markNotificationReadInFirebase } = await import('@/lib/firebase-notifications')
        await markNotificationReadInFirebase(user.id, id)
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    // 1. Get all unread IDs from current list
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)

    // 2. Update local tracking (including system notifs)
    setReadIds((prev: Set<string>) => {
      const next = new Set(prev)
      unreadIds.forEach(id => next.add(id))
      return next
    })

    // 3. Optimistic update - update UI immediately
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updatedNotifications)

    try {
      const headers = getAuthHeaders()

      // 4. Batch request to Database (will only affect user-specific ones)
      fetch('/api/notifications', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ markAll: true })
      })

      // 5. Update Firebase (for each unread if possible)
      if (user) {
        const { markNotificationReadInFirebase } = await import('@/lib/firebase-notifications')
        for (const id of unreadIds) {
          if (!id.startsWith('system-')) {
            await markNotificationReadInFirebase(user.id, id)
          }
        }
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      refreshNotifications()
    }
  }

  const deleteNotification = async (id: string) => {
    // 1. Update local tracking instantly 
    setDeletedIds((prev: Set<string>) => new Set(prev).add(id))

    // 2. Update UI
    const notification = notifications.find(n => n.id === id)
    if (notification && !notification.read) {
      setUnreadCount(Math.max(0, unreadCount - 1))
    }
    setNotifications(notifications.filter(n => n.id !== id))

    try {
      // 3. Update Database
      const headers = getAuthHeaders()
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers
      })

      // 4. Update Firebase
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
      } else if (notification.referenceType === 'PRODUCT' || notification.type === 'LOW_STOCK' || notification.type === 'REORDER_NEEDED') {
        if (isAdmin) {
          window.location.href = `/admin/products`
        } else {
          window.location.href = `/products/${notification.referenceId}`
        }
      } else {
        // Default: mark as read only
      }
    } else {
      // Handle navigation for quote notifications even without refId if they point to list
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
