'use client'

import { useState, useEffect } from 'react'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, onValue, off, set, serverTimestamp } from 'firebase/database'

interface TypingStatus {
    isTyping: boolean;
    userName: string;
    timestamp: number;
}

interface LiveTypingIndicatorProps {
    conversationId: string;
    myUserId: string;
    onTypingChange?: (isTyping: boolean, userName: string) => void;
}

export default function LiveTypingIndicator({
    conversationId,
    myUserId,
    onTypingChange
}: LiveTypingIndicatorProps) {
    const [otherTyping, setOtherTyping] = useState<TypingStatus | null>(null)

    // Listen to typing status from Firebase
    useEffect(() => {
        if (!conversationId) return;

        const db = getFirebaseDatabase()
        const typingRef = ref(db, `conversations/${conversationId}/typing`)

        const unsubscribe = onValue(typingRef, (snapshot) => {
            const data = snapshot.val()
            if (!data) {
                setOtherTyping(null)
                onTypingChange?.(false, '')
                return
            }

            // Find if someone else is typing
            const otherUserTyping = Object.entries(data).find(
                ([oderId, status]) => {
                    const typingData = status as TypingStatus
                    return oderId !== myUserId &&
                        typingData.isTyping &&
                        Date.now() - typingData.timestamp < 5000 // 5s timeout
                }
            )

            if (otherUserTyping) {
                const [, status] = otherUserTyping
                const typingData = status as TypingStatus
                setOtherTyping(typingData)
                onTypingChange?.(true, typingData.userName)
            } else {
                setOtherTyping(null)
                onTypingChange?.(false, '')
            }
        })

        return () => {
            off(typingRef)
        }
    }, [conversationId, myUserId, onTypingChange])

    if (!otherTyping || !otherTyping.isTyping) return null;

    return (
        <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5">
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-500 ml-1">
                    {otherTyping.userName} đang nhập...
                </span>
            </div>
        </div>
    )
}

// Helper function to update typing status
export async function updateTypingStatus(
    conversationId: string,
    userId: string,
    userName: string,
    isTyping: boolean
) {
    try {
        const db = getFirebaseDatabase()
        const typingRef = ref(db, `conversations/${conversationId}/typing/${userId}`)
        await set(typingRef, {
            isTyping,
            userName,
            timestamp: Date.now()
        })
    } catch (error) {
        console.error('Failed to update typing status:', error)
    }
}
