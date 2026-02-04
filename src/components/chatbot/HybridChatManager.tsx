'use client'

import React, { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, onChildAdded, off, push, set } from 'firebase/database'
import { useAuth } from '@/contexts/auth-context'
import { ChatMode, GuestIdentity, HybridChatState, LiveChatMessage } from './types'
import toast from 'react-hot-toast'

interface HybridChatManagerProps {
    onNewMessage: (msg: LiveChatMessage) => void;
    onModeChange: (mode: ChatMode) => void;
    currentMode: ChatMode;
    customerId?: string;
}

const GUEST_ID_KEY = 'smartbuild_guest_id'
const GUEST_NAME_KEY = 'smartbuild_guest_name'

export default function HybridChatManager({
    onNewMessage,
    onModeChange,
    currentMode,
    customerId
}: HybridChatManagerProps) {
    const { user, isAuthenticated } = useAuth()
    const [identity, setIdentity] = useState<{ id: string, name: string } | null>(null)
    const [conversationId, setConversationId] = useState<string | null>(null)

    // Initialize Identity (Guest or User)
    useEffect(() => {
        if (isAuthenticated && user) {
            // Logged in user
            setIdentity({
                id: user.id || customerId || '',
                name: user.name || 'Thành viên'
            })
        } else {
            // Guest handling logic
            let guestId = localStorage.getItem(GUEST_ID_KEY)
            let guestName = localStorage.getItem(GUEST_NAME_KEY)

            if (!guestId) {
                guestId = `guest_${uuidv4().substring(0, 8)}`
                guestName = `Khách #${guestId.substring(6)}`
                localStorage.setItem(GUEST_ID_KEY, guestId)
                localStorage.setItem(GUEST_NAME_KEY, guestName)
            }
            setIdentity({ id: guestId, name: guestName || 'Khách' })
        }
    }, [isAuthenticated, user, customerId])

    // Listen to Firebase Messages when in HUMAN mode
    useEffect(() => {
        if (currentMode !== 'HUMAN' || !conversationId) return;

        const db = getFirebaseDatabase()
        const messagesRef = ref(db, `conversations/${conversationId}/messages`);

        const handleNewMessage = (snapshot: any) => {
            const data = snapshot.val();
            if (data) {
                const message: LiveChatMessage = {
                    ...data,
                    conversationId
                }

                // Only notify parent if it's from the other side (Admin)
                if (data.senderId !== identity?.id) {
                    onNewMessage(message)
                }
            }
        };

        onChildAdded(messagesRef, handleNewMessage);

        return () => {
            off(messagesRef, 'child_added', handleNewMessage);
        };
    }, [currentMode, conversationId, identity])

    // Function to Connect to Live Agent (Create Conversation)
    const connectToAgent = async () => {
        if (!identity) return false;

        try {
            const res = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: 'admin_support', // Special ID for support queue
                    senderId: identity.id,
                    senderName: identity.name,
                    initialMessage: 'Xin chào, tôi cần gặp nhân viên hỗ trợ.'
                })
            })

            const data = await res.json()
            if (data.success) {
                setConversationId(data.data.id)
                sessionStorage.setItem('active_support_chat', data.data.id)
                return true
            }
            return false
        } catch (error) {
            console.error('Connection failed:', error)
            toast.error('Không thể kết nối đến máy chủ hỗ trợ')
            return false
        }
    }

    // Expose methods to parent via Ref or Context (simplifying here by attaching to window for now or returning renderless)
    // For this implementation, we will use a Renderless component approach that passes data up

    // Auto-reconnect if session exists
    useEffect(() => {
        const savedConvId = sessionStorage.getItem('active_support_chat')
        if (savedConvId && currentMode === 'AI') {
            // Allow auto-reconnect logic if we want persistence
            // For now, we keep it manual to let user choose
        }
    }, [])

    return {
        connectToAgent,
        identity,
        conversationId,
        sendMessage: async (content: string, fileData?: any) => {
            if (!conversationId || !identity) return false;

            try {
                // Determine API endpoint based on auth status
                // But since we use a unified API now:
                const res = await fetch('/api/chat/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add guest headers if needed, or rely on body
                    },
                    body: JSON.stringify({
                        conversationId,
                        content,
                        senderId: identity.id, // Explicitly send ID for guests
                        senderName: identity.name,
                        fileUrl: fileData?.fileUrl,
                        fileType: fileData?.fileType,
                        fileName: fileData?.fileName
                    })
                })
                return res.ok;
            } catch (e) {
                console.error(e)
                return false
            }
        }
    }
}
