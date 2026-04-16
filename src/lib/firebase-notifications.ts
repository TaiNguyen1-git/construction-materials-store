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
    MANAGER: ['STOCK_ALERT', 'ORDER_NEW', 'ORDER_UPDATE', 'PAYMENT_UPDATE', 'INFO', 'WARNING', 'SUCCESS', 'ERROR', 'LOW_STOCK', 'REORDER_NEEDED', 'STOCK_UPDATE', 'FRAUD_ALERT'],
    EMPLOYEE: ['STOCK_ALERT', 'ORDER_NEW', 'ORDER_UPDATE', 'INFO', 'WARNING', 'LOW_STOCK', 'STOCK_UPDATE'],
    CONTRACTOR: ['ORDER_NEW', 'ORDER_UPDATE', 'PAYMENT_UPDATE', 'INFO', 'SUCCESS', 'CREDIT_WARNING', 'PROJECT_MATCH', 'QUOTE_NEW', 'QUOTE_UPDATE', 'FRAUD_ALERT'],
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
 * Push a system-wide notification to each target user's personal path
 * Instead of a shared "system" channel, each user gets their own copy
 */
export async function pushSystemNotification(notification: Omit<FirebaseNotification, 'id' | 'userId'>, targetUserIds?: string[]): Promise<void> {
    try {
        if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
            console.warn('⚠️ Firebase keys missing. Skipping system notification.')
            return
        }

        if (!targetUserIds || targetUserIds.length === 0) return

        const db = getFirebaseDatabase()
        for (const userId of targetUserIds) {
            const userRef = ref(db, `notifications/${userId}`)
            const newRef = push(userRef)
            await set(newRef, {
                ...notification,
                userId,
                createdAt: notification.createdAt || new Date().toISOString()
            })
        }
    } catch (error) {
        console.error('Error pushing system notification:', error)
    }
}

/**
 * Auto-cleanup: keep only the most recent N notifications per user in Firebase
 */
export async function cleanupOldFirebaseNotifications(userId: string, keepCount: number = 100): Promise<void> {
    try {
        const db = getFirebaseDatabase()
        const userRef = ref(db, `notifications/${userId}`)
        const snapshot = await new Promise<DataSnapshot>((resolve) => {
            onValue(userRef, resolve, { onlyOnce: true })
        })

        if (!snapshot.exists()) return

        const entries: { key: string; createdAt: string }[] = []
        snapshot.forEach((child) => {
            entries.push({ key: child.key!, createdAt: child.val()?.createdAt || '' })
        })

        if (entries.length <= keepCount) return

        // Sort by createdAt descending, delete the oldest beyond keepCount
        entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        const toDelete = entries.slice(keepCount)

        for (const entry of toDelete) {
            const oldRef = ref(db, `notifications/${userId}/${entry.key}`)
            await set(oldRef, null)
        }
    } catch (error) {
        console.error('Error cleaning up Firebase notifications:', error)
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
    const allowedTypes = ROLE_NOTIFICATION_TYPES[userRole] || ROLE_NOTIFICATION_TYPES.CUSTOMER

    // Listen ONLY to user's own personal notification path
    const userRef = query(
        ref(db, `notifications/${userId}`),
        orderByChild('createdAt'),
        limitToLast(50)
    )

    const callback = (snapshot: DataSnapshot) => {
        const notifications: FirebaseNotification[] = []
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const notif = child.val() as FirebaseNotification
                if (allowedTypes.includes(notif.type)) {
                    notifications.push({ ...notif, id: child.key! })
                }
            })
        }
        // Sort newest first
        notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        onNotification(notifications)
    }

    onValue(userRef, callback)

    return () => {
        off(userRef, 'value', callback)
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

/**
 * Delete notification from Firebase
 */
export async function deleteNotificationFromFirebase(userId: string, notificationId: string): Promise<boolean> {
    try {
        const db = getFirebaseDatabase()
        const notifRef = ref(db, `notifications/${userId}/${notificationId}`)
        await set(notifRef, null)
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

        const db = getFirebaseDatabase()
        const orderRef = ref(db, `orders/${orderId}`)

        const data = {
            status,
            orderNumber,
            updatedAt: new Date().toISOString()
        }

        await set(orderRef, data)

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
                } else {
                }
            } else {
            }
        }

        onValue(orderRef, callback)

        return () => {
            off(orderRef, 'value', callback)
        }
    } catch (error) {
        console.error('[Firebase] ❌ Error subscribing to order status:', error)
        return () => { }
    }
}


/**
 * Push a new ticket message to Firebase for real-time chat
 */
export async function pushTicketMessageToFirebase(ticketId: string, message: any): Promise<boolean> {
    try {
        if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
            return false
        }

        const db = getFirebaseDatabase()
        const ticketMessagesRef = ref(db, `tickets/${ticketId}/messages`)
        const newMessageRef = push(ticketMessagesRef)

        await set(newMessageRef, {
            ...message,
            createdAt: message.createdAt || new Date().toISOString()
        })

        return true
    } catch (error) {
        console.error('Error pushing ticket message to Firebase:', error)
        return false
    }
}

/**
 * Subscribe to ticket messages
 * Returns unsubscribe function
 */
export function subscribeToTicketMessages(
    ticketId: string,
    onNewMessage: (message: any) => void
): () => void {
    try {
        const db = getFirebaseDatabase()
        const ticketMessagesRef = query(
            ref(db, `tickets/${ticketId}/messages`),
            orderByChild('createdAt'),
            limitToLast(1) // Only listen for the latest new message
        )

        let initialLoad = true
        const callback = (snapshot: DataSnapshot) => {
            if (initialLoad) {
                initialLoad = false
                return
            }

            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    onNewMessage({ ...child.val(), id: child.key! })
                })
            }
        }

        onValue(ticketMessagesRef, callback)
        return () => off(ticketMessagesRef, 'value', callback)
    } catch (error) {
        console.error('Error subscribing to ticket messages:', error)
        return () => { }
    }
}
