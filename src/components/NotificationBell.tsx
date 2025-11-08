'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { getAuthHeaders } from '@/lib/api-client'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  priority: string
  read: boolean
  createdAt: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Real-time notifications using Server-Sent Events (SSE)
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token && process.env.NODE_ENV === 'production') return

    let abortController: AbortController | null = null
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
    let fallbackInterval: NodeJS.Timeout | null = null
    let isMounted = true

    const setupSSE = async () => {
      if (!isMounted) return
      
      try {
        const headers = getAuthHeaders()
        // Create new abort controller for each connection attempt
        const currentAbortController = new AbortController()
        abortController = currentAbortController

        const response = await fetch('/api/notifications/stream', {
          headers: {
            ...headers,
            'Accept': 'text/event-stream'
          },
          signal: currentAbortController.signal
        })

        if (!response.ok || !response.body) {
          throw new Error('SSE connection failed')
        }

        const currentReader = response.body.getReader()
        reader = currentReader
        const decoder = new TextDecoder()

        const readStream = async () => {
          try {
            while (isMounted && !currentAbortController.signal.aborted) {
              const { done, value } = await currentReader.read()
              
              if (done) {
                if (isMounted && !currentAbortController.signal.aborted) {
                  setTimeout(() => {
                    if (isMounted) {
                      setupSSE()
                    }
                  }, 2000)
                }
                break
              }

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6))
                    
                    if (data.type === 'notifications' && data.data && isMounted) {
                      const notifs = data.data.notifications.map((n: any) => ({
                        id: n.id,
                        title: n.title,
                        message: n.message,
                        type: n.type,
                        priority: n.priority,
                        read: n.isRead ?? n.read ?? false,
                        createdAt: n.createdAt
                      }))
                      setNotifications(notifs)
                      setUnreadCount(data.data.unreadCount || notifs.filter((n: any) => !n.read).length)
                    }
                  } catch (e) {
                    // Ignore parse errors
                  }
                }
              }
            }
          } catch (error: any) {
            if (error.name !== 'AbortError' && isMounted) {
              setupFallbackPolling()
            }
          }
        }

        readStream()
      } catch (error: any) {
        if (error.name !== 'AbortError' && isMounted) {
          setupFallbackPolling()
        }
      }
    }

    const setupFallbackPolling = () => {
      const fetchNotifications = async () => {
        try {
          setIsLoading(true)
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
                createdAt: n.createdAt
              }))
              
              setNotifications(notifs)
              setUnreadCount(result.data.unreadCount || notifs.filter((n: any) => !n.read).length)
            }
          }
        } catch (error) {
          // Silent fail
        } finally {
          setIsLoading(false)
        }
      }

      fetchNotifications()
      fallbackInterval = setInterval(fetchNotifications, 10000)
    }

    setupFallbackPolling()
    setupSSE()

    return () => {
      isMounted = false
      if (abortController && !abortController.signal.aborted) {
        try {
          abortController.abort()
        } catch (e) {
          // Ignore abort errors
        }
      }
      if (reader) {
        reader.cancel().catch(() => {
          // Ignore cancel errors
        })
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval)
      }
    }
  }, [])

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
    try {
      const persistedNotifications = notifications.filter(n => !n.id.startsWith('realtime-'))
      
      const headers = getAuthHeaders()
      const results = await Promise.all(
        persistedNotifications.map(n => 
          fetch('/api/notifications', {
            method: 'POST',
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notificationId: n.id })
          })
        )
      )

      // Only update state if all requests succeeded
      const allSucceeded = results.every(r => r.ok)
      if (allSucceeded) {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      // Silent fail
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
              <h3 className="text-lg font-medium text-gray-900">Thông Báo</h3>
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
                  className={`p-4 border-b border-gray-100 ${getPriorityColor(notification.priority)} border-l-4 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
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
                    <div className="flex space-x-1">
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
