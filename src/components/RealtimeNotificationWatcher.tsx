'use client'

/**
 * Real-time Notification Watcher
 * Polls for new unread notifications and shows them as premium toasts.
 */

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Bell, ShieldCheck, CheckCircle2, AlertTriangle, Info, Camera, DollarSign } from 'lucide-react'

// Map notification types to colors and icons for a premium look
const NOTIFICATION_THEMES: Record<string, { icon: any, color: string, ring: string, bg: string }> = {
    'ORDER_UPDATE': { icon: <Bell className="w-5 h-5 text-blue-600" />, color: 'bg-blue-600', ring: 'ring-blue-100', bg: 'bg-blue-50' },
    'PAYMENT_RECEIVED': { icon: <DollarSign className="w-5 h-5 text-green-600" />, color: 'bg-green-600', ring: 'ring-green-100', bg: 'bg-green-50' },
    'MILESTONE_COMPLETED': { icon: <CheckCircle2 className="w-5 h-5 text-indigo-600" />, color: 'bg-indigo-600', ring: 'ring-indigo-100', bg: 'bg-indigo-50' },
    'SYSTEM_ALERT': { icon: <AlertTriangle className="w-5 h-5 text-amber-600" />, color: 'bg-amber-600', ring: 'ring-amber-100', bg: 'bg-amber-50' },
    'DEFAULT': { icon: <Info className="w-5 h-5 text-blue-600" />, color: 'bg-blue-600', ring: 'ring-blue-100', bg: 'bg-blue-50' }
}

export default function RealtimeNotificationWatcher() {
    const lastSeenRef = useRef<Set<string>>(new Set())
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
        // Check for existing notifications in localStorage to avoid re-toasting old ones on refresh
        try {
            const seen = localStorage.getItem('seen_notifications')
            if (seen) {
                const seenArray = JSON.parse(seen)
                lastSeenRef.current = new Set(seenArray)
            }
        } catch (e) { }
    }, [])

    useEffect(() => {
        if (!isClient) return

        const checkNotifications = async () => {
            try {
                const token = localStorage.getItem('access_token')
                if (!token) return

                const res = await fetch('/api/notifications?limit=5&unreadOnly=true', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                if (!res.ok) return

                const data = await res.json()
                const notifications = data.data?.notifications || []

                notifications.forEach((notif: any) => {
                    if (!lastSeenRef.current.has(notif.id)) {
                        lastSeenRef.current.add(notif.id)

                        // Show premium toast
                        showPremiumToast(notif)

                        // Update local storage (capped at 50 IDs)
                        const seenArray = Array.from(lastSeenRef.current).slice(-50)
                        localStorage.setItem('seen_notifications', JSON.stringify(seenArray))
                    }
                })
            } catch (error) {
                console.error('Polling error', error)
            }
        }

        // Initial check
        checkNotifications()

        // Poll every 10 seconds
        const interval = setInterval(checkNotifications, 10000)
        return () => clearInterval(interval)
    }, [isClient])

    const showPremiumToast = (notif: any) => {
        const theme = NOTIFICATION_THEMES[notif.type] || NOTIFICATION_THEMES['DEFAULT']

        toast.custom((t) => (
            <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border border-gray-100`}
            >
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <div className={`${theme.bg} p-2 rounded-xl ring-4 ${theme.ring}`}>
                                {theme.icon}
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-black text-gray-900 leading-tight">
                                {notif.title}
                            </p>
                            <p className="mt-1 text-xs font-medium text-gray-500 leading-relaxed">
                                {notif.message}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${theme.color} text-white`}>
                                    Mới
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">
                                    Vừa xong
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex border-l border-gray-100">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-bold text-blue-600 hover:text-blue-500 bg-blue-50/10 active:bg-blue-50 transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        ), { duration: 6000 })
    }

    return null // Invisible component
}
