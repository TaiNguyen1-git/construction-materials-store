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
        const notifRef = ref(db, `notifications/${userId}/${notificationId}/read`)
        await set(notifRef, true)
        return true
    } catch (error) {
        console.error('Error marking notification as read:', error)
        return false
    }
}
