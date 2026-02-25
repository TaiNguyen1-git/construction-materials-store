/**
 * Chat History Database (IndexedDB via Dexie.js)
 * 
 * Provides instant offline-first chat loading:
 * 1. On open: Load last 20 messages from IndexedDB → display immediately
 * 2. In background: Sync with Firebase/Server to get any new messages
 * 3. On new message: Save to IndexedDB + send to server
 * 
 * TTL: Auto-cleanup messages older than 7 days
 */

import Dexie, { type EntityTable } from 'dexie'

// ─── Schema ────────────────────────────────────────────────────────────────────

export interface CachedChatMessage {
    /** Auto-incremented local key */
    localId?: number
    /** Server/Firebase message ID */
    id: string
    /** Session or conversation ID */
    sessionId: string
    /** Original user message */
    userMessage: string
    /** User-attached image (base64) */
    userImage?: string
    /** Bot/Agent response */
    botMessage: string
    /** Suggestion chips */
    suggestions: string[]
    /** Product recommendations */
    productRecommendations?: Record<string, unknown>[]
    /** AI confidence score */
    confidence: number
    /** ISO timestamp */
    timestamp: string
    /** OCR data if any */
    ocrData?: Record<string, unknown>
    /** Order data if any */
    orderData?: Record<string, unknown>
    /** Report data if any */
    data?: Record<string, unknown>
    /** When this record was cached locally */
    cachedAt: number
}

export interface ChatSession {
    /** Session/Conversation ID */
    sessionId: string
    /** Last time this session was accessed */
    lastAccessed: number
    /** Chat mode when session was last used */
    chatMode: 'AI' | 'HUMAN'
    /** Number of messages in this session */
    messageCount: number
}

// ─── Database ──────────────────────────────────────────────────────────────────

class ChatDatabase extends Dexie {
    messages!: EntityTable<CachedChatMessage, 'localId'>
    sessions!: EntityTable<ChatSession, 'sessionId'>

    constructor() {
        super('SmartBuildChatDB')

        this.version(1).stores({
            // Compound index for fast session-based queries
            messages: '++localId, id, sessionId, timestamp, cachedAt, [sessionId+timestamp]',
            sessions: 'sessionId, lastAccessed'
        })
    }
}

// Singleton instance
let db: ChatDatabase | null = null

function getDB(): ChatDatabase {
    if (!db) {
        db = new ChatDatabase()
    }
    return db
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Save a single message to local cache
 */
export async function cacheMessage(
    sessionId: string,
    message: Omit<CachedChatMessage, 'localId' | 'sessionId' | 'cachedAt'>
): Promise<void> {
    try {
        const chatDB = getDB()

        // Prevent duplicates (by server ID)
        const existing = await chatDB.messages
            .where('id')
            .equals(message.id)
            .first()

        if (existing) {
            // Update existing message (e.g., bot reply arrived)
            await chatDB.messages.update(existing.localId!, {
                ...message,
                sessionId,
                cachedAt: Date.now()
            })
        } else {
            await chatDB.messages.add({
                ...message,
                sessionId,
                cachedAt: Date.now()
            })
        }

        // Update session metadata
        await chatDB.sessions.put({
            sessionId,
            lastAccessed: Date.now(),
            chatMode: 'AI',
            messageCount: await chatDB.messages
                .where('sessionId')
                .equals(sessionId)
                .count()
        })
    } catch (err) {
        console.warn('[ChatDB] Failed to cache message:', err)
    }
}

/**
 * Save multiple messages at once (batch operation)
 */
export async function cacheMessages(
    sessionId: string,
    messages: Omit<CachedChatMessage, 'localId' | 'sessionId' | 'cachedAt'>[]
): Promise<void> {
    try {
        const chatDB = getDB()

        const records = messages.map(msg => ({
            ...msg,
            sessionId,
            cachedAt: Date.now()
        }))

        // Clear existing messages for this session and replace
        await chatDB.transaction('rw', chatDB.messages, chatDB.sessions, async () => {
            await chatDB.messages.where('sessionId').equals(sessionId).delete()
            await chatDB.messages.bulkAdd(records)

            await chatDB.sessions.put({
                sessionId,
                lastAccessed: Date.now(),
                chatMode: 'AI',
                messageCount: records.length
            })
        })
    } catch (err) {
        console.warn('[ChatDB] Failed to batch cache messages:', err)
    }
}

/**
 * Load recent messages from local cache (instant, no network)
 */
export async function loadCachedMessages(
    sessionId: string,
    limit: number = 30
): Promise<CachedChatMessage[]> {
    try {
        const chatDB = getDB()

        const messages = await chatDB.messages
            .where('sessionId')
            .equals(sessionId)
            .sortBy('timestamp')

        // Return last N messages
        return messages.slice(-limit)
    } catch (err) {
        console.warn('[ChatDB] Failed to load cached messages:', err)
        return []
    }
}

/**
 * Get the last active session ID (for restoring chat on reload)
 */
export async function getLastActiveSession(): Promise<string | null> {
    try {
        const chatDB = getDB()

        const sessions = await chatDB.sessions
            .orderBy('lastAccessed')
            .reverse()
            .limit(1)
            .toArray()

        if (sessions.length > 0) {
            // Only return if accessed within last 24 hours
            const isRecent = Date.now() - sessions[0].lastAccessed < 24 * 60 * 60 * 1000
            return isRecent ? sessions[0].sessionId : null
        }

        return null
    } catch (err) {
        console.warn('[ChatDB] Failed to get last session:', err)
        return null
    }
}

/**
 * Update a specific message in cache (e.g., when bot reply arrives)
 */
export async function updateCachedMessage(
    messageId: string,
    updates: Partial<CachedChatMessage>
): Promise<void> {
    try {
        const chatDB = getDB()

        const existing = await chatDB.messages
            .where('id')
            .equals(messageId)
            .first()

        if (existing) {
            await chatDB.messages.update(existing.localId!, {
                ...updates,
                cachedAt: Date.now()
            })
        }
    } catch (err) {
        console.warn('[ChatDB] Failed to update cached message:', err)
    }
}

/**
 * Clear old cached data (messages older than 7 days)
 */
export async function cleanupOldCache(): Promise<number> {
    try {
        const chatDB = getDB()
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

        const oldMessages = await chatDB.messages
            .where('cachedAt')
            .below(sevenDaysAgo)
            .count()

        await chatDB.messages
            .where('cachedAt')
            .below(sevenDaysAgo)
            .delete()

        // Also clean up old sessions
        await chatDB.sessions
            .where('lastAccessed')
            .below(sevenDaysAgo)
            .delete()

        if (oldMessages > 0) {
            console.log(`[ChatDB] Cleaned up ${oldMessages} old cached messages`)
        }

        return oldMessages
    } catch (err) {
        console.warn('[ChatDB] Cleanup failed:', err)
        return 0
    }
}

/**
 * Clear all cached data for a specific session
 */
export async function clearSessionCache(sessionId: string): Promise<void> {
    try {
        const chatDB = getDB()

        await chatDB.transaction('rw', chatDB.messages, chatDB.sessions, async () => {
            await chatDB.messages.where('sessionId').equals(sessionId).delete()
            await chatDB.sessions.delete(sessionId)
        })
    } catch (err) {
        console.warn('[ChatDB] Failed to clear session cache:', err)
    }
}
