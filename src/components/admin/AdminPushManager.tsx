'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const VAPID_PUBLIC_KEY = 'BDZf_lS7ABOkMrnaKKoDY_u1KWuL7xJDoMU4F_7lZeyq5d4xa0SyIlXVNJR7JVKpYfdfBMGiDAxCet0jmz83Xvs'

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function AdminPushManager() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            checkSubscription()
        } else {
            setLoading(false)
        }
    }, [])

    const checkSubscription = async () => {
        // Timeout after 3 seconds to prevent infinite loading
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('timeout'), 3000));

        try {
            // Race between service worker readiness and timeout
            const result = await Promise.race([
                navigator.serviceWorker.ready,
                timeoutPromise
            ]);

            if (result === 'timeout') {
                console.warn('Service worker check timed out. Push notifications might be disabled or blocked (e.g. Incognito mode).');
                setLoading(false);
                return;
            }

            const registration = result as ServiceWorkerRegistration;
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
        } catch (error) {
            console.error('Error checking subscription:', error);
        } finally {
            setLoading(false);
        }
    }

    const subscribe = async () => {
        try {
            setLoading(true)

            // 1. Request permission
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                toast.error('Bạn cần cho phép thông báo để sử dụng tính năng này')
                return
            }

            // 2. Register Service Worker (custom-sw.js)
            const registration = await navigator.serviceWorker.register('/custom-sw.js', {
                scope: '/'
            })

            // Wait for the service worker to be ready/active
            // This fixes the "no active Service Worker" error
            if (!registration.active) {
                await new Promise<void>((resolve) => {
                    const worker = registration.installing || registration.waiting;
                    if (!worker) {
                        resolve();
                        return;
                    }
                    const stateChangeHandler = () => {
                        if (worker.state === 'activated') {
                            worker.removeEventListener('statechange', stateChangeHandler);
                            resolve();
                        }
                    };
                    worker.addEventListener('statechange', stateChangeHandler);
                });
            }

            // 2.5 CLEAR OLD SUBSCRIPTION (Crucial if key changed)
            const existingSub = await registration.pushManager.getSubscription()
            if (existingSub) {
                await existingSub.unsubscribe()
            }

            // 3. Subscribe to push using NEW KEY
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            })

            // 4. Send to server
            const res = await fetch('/api/notifications/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub)
            })

            if (res.ok) {
                setSubscription(sub)
                toast.success('Đã bật thông báo đẩy thành công')
            } else {
                throw new Error('Failed to subscribe on server')
            }
        } catch (error) {
            console.error('Push subscription failed:', error)
            toast.error('Không thể bật thông báo. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    const unsubscribe = async () => {
        try {
            setLoading(true)
            if (subscription) {
                // 1. Unsubscribe from push manager
                await subscription.unsubscribe()

                // 2. Notify server
                await fetch('/api/notifications/push/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                })

                setSubscription(null)
                toast.success('Đã tắt thông báo đẩy')
            }
        } catch (error) {
            console.error('Unsubscribe failed:', error)
            toast.error('Lỗi khi tắt thông báo')
        } finally {
            setLoading(false)
        }
    }

    if (!isSupported) return null

    return (
        <div className="flex items-center gap-2">
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : subscription ? (
                <button
                    onClick={unsubscribe}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 hover:bg-emerald-100 transition-colors text-xs font-bold"
                    title="Tắt thông báo đẩy"
                >
                    <BellRing className="w-3.5 h-3.5" />
                    ĐANG BẬT THÔNG BÁO
                </button>
            ) : (
                <button
                    onClick={subscribe}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors text-xs font-bold"
                    title="Bật thông báo đẩy"
                >
                    <BellOff className="w-3.5 h-3.5" />
                    BẬT THÔNG BÁO PUSH
                </button>
            )}
        </div>
    )
}
