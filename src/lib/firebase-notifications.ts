/**
 * Firebase Notification Service
 * Handles real-time push notifications via Firebase Realtime Database
 */

import { getFirebaseDatabase } from './firebase'
import { ref, push, set, onValue, off, query, orderByChild, limitToLast, DataSnapshot } from 'firebase/database'

export interface FirebaseNotification {
    id?: string
    userId: string
    userRole: string
    type: string
    title: string
    message: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    read: boolean
    createdAt: string
    data?: any
    referenceId?: string
    referenceType?: string
}

// Notification types allowed for each role
const ROLE_NOTIFICATION_TYPES: Record<string, string[]> = {
    MANAGER: ['STOCK_ALERT', 'ORDER_NEW', 'ORDER_UPDATE', 'PAYMENT_UPDATE', 'INFO', 'WARNING', 'SUCCESS', 'ERROR', 'LOW_STOCK', 'REORDER_NEEDED'],
    EMPLOYEE: ['STOCK_ALERT', 'ORDER_NEW', 'ORDER_UPDATE', 'INFO', 'WARNING', 'LOW_STOCK'],
    CONTRACTOR: ['ORDER_NEW', 'ORDER_UPDATE', 'PAYMENT_UPDATE', 'INFO', 'SUCCESS', 'CREDIT_WARNING'],
    CUSTOMER: ['ORDER_NEW', 'ORDER_UPDATE', 'PAYMENT_UPDATE', 'INFO', 'SUCCESS', 'PROMOTION']
}

/**
 * Push a new notification to Firebase
 * Call this when creating a notification that should be pushed in real-time
 */
export async function pushNotificationToFirebase(notification: Omit<FirebaseNotification, 'id'>): Promise<string | null> {
    try {
        if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
            console.warn('⚠️ Firebase keys missing. Skipping push notification.')
            return null
        }

        const db = getFirebaseDatabase()
        const notificationsRef = ref(db, `notifications/${notification.userId}`)
        const newNotificationRef = push(notificationsRef)

        await set(newNotificationRef, {
            ...notification,
            createdAt: notification.createdAt || new Date().toISOString()
        })

        return newNotificationRef.key
    } catch (error) {
        console.error('Error pushing notification to Firebase:', error)
        return null
    }
}

/**
 * Push a system-wide notification (for admin roles)
 * These go to a special "system" path that admins listen to
 */
export async function pushSystemNotification(notification: Omit<FirebaseNotification, 'id' | 'userId'>): Promise<string | null> {
    try {
        if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
            console.warn('⚠️ Firebase keys missing. Skipping system notification.')
            return null
        }

        const db = getFirebaseDatabase()
        const systemRef = ref(db, 'notifications/system')
        const newNotificationRef = push(systemRef)

        await set(newNotificationRef, {
            ...notification,
            userId: 'system',
            createdAt: notification.createdAt || new Date().toISOString()
        })

        return newNotificationRef.key
    } catch (error) {
        console.error('Error pushing system notification:', error)
        return null
    }
}

/**
 * Subscribe to notifications for a user
 * Returns unsubscribe function
 */
export function subscribeToNotifications(
    userId: string,
    userRole: string,
    onNotification: (notifications: FirebaseNotification[]) => void
): () => void {
    const db = getFirebaseDatabase()
    const unsubscribes: (() => void)[] = []
    const allNotifications: Map<string, FirebaseNotification> = new Map()

    const allowedTypes = ROLE_NOTIFICATION_TYPES[userRole] || ROLE_NOTIFICATION_TYPES.CUSTOMER
    const isAdmin = userRole === 'MANAGER' || userRole === 'EMPLOYEE'

    // Helper to merge and filter notifications
    const emitFiltered = () => {
        const filtered = Array.from(allNotifications.values())
            .filter(n => allowedTypes.includes(n.type))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 50)
            .map(n => ({
                ...n,
                // Ensure ID is present if it was lost in map
                id: n.id
            }))
        onNotification(filtered)
    }

    // Listen to user's own notifications
    const userRef = query(
        ref(db, `notifications/${userId}`),
        orderByChild('createdAt'),
        limitToLast(30)
    )

    const userCallback = (snapshot: DataSnapshot) => {
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const notif = child.val() as FirebaseNotification
                allNotifications.set(child.key!, { ...notif, id: child.key! })
            })
        }
        emitFiltered()
    }

    onValue(userRef, userCallback)
    unsubscribes.push(() => off(userRef, 'value', userCallback))

    // Admins also listen to system notifications
    if (isAdmin) {
        const systemRef = query(
            ref(db, 'notifications/system'),
            orderByChild('createdAt'),
            limitToLast(20)
        )

        const systemCallback = (snapshot: DataSnapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const notif = child.val() as FirebaseNotification
                    allNotifications.set(`system-${child.key}`, { ...notif, id: `system-${child.key}` })
                })
            }
            emitFiltered()
        }

        onValue(systemRef, systemCallback)
        unsubscribes.push(() => off(systemRef, 'value', systemCallback))
    }

    // Return cleanup function
    return () => {
        unsubscribes.forEach(unsub => unsub())
    }
}

/**
 * Mark notification as read in Firebase
 */
export async function markNotificationReadInFirebase(userId: string, notificationId: string): Promise<boolean> {
    try {
        const db = getFirebaseDatabase()
        // Handle system notifications separately if needed, but typically they are just removed from view locally or marked read per user
        // For now, only mark user-specific notifications as read in DB if possible
        // System notifications generally don't have per-user read state in this simple schema

        if (!notificationId.startsWith('system-')) {
            const notifRef = ref(db, `notifications/${userId}/${notificationId}/read`)
            await set(notifRef, true)
        }
        return true
    } catch (error) {
        console.error('Error marking notification as read:', error)
        return false
    }
}

/**
 * Delete notification from Firebase
 */
export async function deleteNotificationFromFirebase(userId: string, notificationId: string): Promise<boolean> {
    try {
        const db = getFirebaseDatabase()
        if (!notificationId.startsWith('system-')) {
            const notifRef = ref(db, `notifications/${userId}/${notificationId}`)
            await set(notifRef, null) // Use set with null to delete
        }
        // System notifications are shared, we can't delete them for all users easily
        // but for now we'll just return true and handle local filtering
        return true
    } catch (error) {
        console.error('Error deleting notification from Firebase:', error)
        return false
    }
}

/**
 * Push order status update to Firebase for real-time tracking
 */
export async function pushOrderStatusUpdate(orderId: string, status: string, orderNumber: string): Promise<boolean> {
    console.log(`[Firebase Push] Starting push for order ${orderId} → ${status}`)

    try {
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
        const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL

        if (!apiKey || !dbUrl) {
            console.warn('⚠️ Firebase keys missing:', {
                hasApiKey: !!apiKey,
                hasDbUrl: !!dbUrl
            })
            return false
        }

        console.log(`[Firebase Push] Getting database reference for orders/${orderId}`)
        const db = getFirebaseDatabase()
        const orderRef = ref(db, `orders/${orderId}`)

        const data = {
            status,
            orderNumber,
            updatedAt: new Date().toISOString()
        }

        console.log(`[Firebase Push] Setting data:`, data)
        await set(orderRef, data)

        console.log(`✅ [Firebase Push] Success: ${orderId} → ${status}`)
        return true
    } catch (error) {
        console.error('❌ [Firebase Push] Error:', error)
        return false
    }
}

/**
 * Subscribe to order status updates
 * Returns unsubscribe function
 */
export function subscribeToOrderStatus(
    orderId: string,
    onStatusChange: (status: string) => void
): () => void {
    try {
        const db = getFirebaseDatabase()
        const orderRef = ref(db, `orders/${orderId}`)

        const callback = (snapshot: DataSnapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val()
                if (data.status) {
                    onStatusChange(data.status)
                }
            }
        }

        onValue(orderRef, callback)

        return () => off(orderRef, 'value', callback)
    } catch (error) {
        console.error('Error subscribing to order status:', error)
        return () => { }
    }
}

