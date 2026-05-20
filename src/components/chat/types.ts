export interface ChatMessage {
    id: string
    tempId?: string
    senderId?: string
    senderName: string
    senderType?: 'me' | 'other' | 'system'
    senderAvatar?: string
    content: string | null
    createdAt: string
    status?: 'sending' | 'sent' | 'delivered' | 'seen' | 'error'
    
    // UI focused properties (mapped from raw data)
    imageUrl?: string
    attachments?: { fileName: string; fileUrl: string; fileType: string }[]
    
    // Raw data properties (needed for logic and persistence)
    fileUrl?: string | null
    fileName?: string | null
    fileType?: string | null
    fileSize?: number | null
    isRead?: boolean
    isDelivered?: boolean
    isUnsent?: boolean
    isInternal?: boolean
    internalLabel?: string
    replyToId?: string

    replyTo?: {
        id: string
        content: string | null
        senderName: string
        fileUrl?: string | null
        fileType?: string | null
    } | null
}

export interface Conversation {
    id: string
    otherUserId: string
    otherUserName: string
    projectId: string | null
    projectTitle: string | null
    lastMessage: string | null
    unreadCount: number
    lastMessageAt: string | null
    createdAt: string
    isGroup?: boolean
    groupTitle?: string | null
    participantIds?: string[]
    participantNames?: string[]
}

export type ChatThemeColor = 'indigo' | 'blue' | 'green' | 'amber'

export const THEME = {
    indigo: { bubble: 'bg-indigo-600', text: 'text-white', meta: 'text-indigo-200', attach: 'bg-indigo-700 hover:bg-indigo-800 text-indigo-50' },
    blue: { bubble: 'bg-blue-600', text: 'text-white', meta: 'text-blue-200', attach: 'bg-blue-700 hover:bg-blue-800 text-blue-50' },
    green: { bubble: 'bg-emerald-600', text: 'text-white', meta: 'text-emerald-200', attach: 'bg-emerald-700 hover:bg-emerald-800 text-emerald-50' },
    amber: { bubble: 'bg-amber-500', text: 'text-white', meta: 'text-amber-100', attach: 'bg-amber-600 hover:bg-amber-700 text-amber-50' },
}
