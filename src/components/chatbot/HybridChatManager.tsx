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
    onHistoryLoaded?: (messages: LiveChatMessage[]) => void;
    onModeChange: (mode: ChatMode) => void;
    currentMode: ChatMode;
    customerId?: string;
}

const GUEST_ID_KEY = 'smartbuild_guest_id'
const GUEST_NAME_KEY = 'smartbuild_guest_name'
const ACTIVE_CONV_KEY = 'smartbuild_active_conv'

export default function HybridChatManager({
    onNewMessage,
    onHistoryLoaded,
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
            setIdentity({
                id: user.id || customerId || '',
                name: user.name || 'Thành viên'
            })
        } else {
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

    // Load active conversation from storage
    useEffect(() => {
        const savedConvId = localStorage.getItem(ACTIVE_CONV_KEY) || sessionStorage.getItem('active_support_chat')
        if (savedConvId) {
            setConversationId(savedConvId)
        }
    }, [])

    // Fetch History when conversationId is set
    useEffect(() => {
        if (!conversationId || !onHistoryLoaded) return;

        const fetchHistory = async () => {
            const db = getFirebaseDatabase()
            const messagesRef = ref(db, `conversations/${conversationId}/messages`);

            // In a real app, we'd use a more specialized fetch, but for simplicity with RTDB
            // we'll listen once to get the current state
            const snapshot = await new Promise<any>((resolve) => {
                const tempRef = ref(db, `conversations/${conversationId}/messages`);
                // We could use get() if available in our version of Firebase SDK or just use 'once' 
                // But since we are using RTDB standard:
                import('firebase/database').then(({ get }) => {
                    get(tempRef).then(resolve);
                });
            });

            if (snapshot && snapshot.exists()) {
                const data = snapshot.val();
                const historyMessages = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key,
                    conversationId
                })) as LiveChatMessage[];

                // Sort by timestamp
                historyMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                onHistoryLoaded(historyMessages);

                // If there's history, we might want to auto-switch to correct mode
                // (e.g. if the last message was from human support, maybe stay in HUMAN mode)
            }
        };

        fetchHistory();
    }, [conversationId, onHistoryLoaded])

    // Listen to Firebase Messages when conversationId is active (regardless of mode, for syncing)
    useEffect(() => {
        if (!conversationId) return;

        const db = getFirebaseDatabase()
        const messagesRef = ref(db, `conversations/${conversationId}/messages`);

        const handleNewMessage = (snapshot: any) => {
            const data = snapshot.val();
            if (data) {
                const message: LiveChatMessage = {
                    ...data,
                    id: snapshot.key,
                    conversationId
                }

                // Only notify parent if it's from someone ELSE (Admin)
                if (data.senderId !== identity?.id) {
                    onNewMessage(message)
                }
            }
        };

        onChildAdded(messagesRef, handleNewMessage);

        return () => {
            off(messagesRef, 'child_added', handleNewMessage);
        };
    }, [conversationId, identity])

    const connectToAgent = async () => {
        if (!identity) return false;

        try {
            const res = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: 'admin_support',
                    senderId: identity.id,
                    senderName: identity.name,
                    initialMessage: 'Xin chào, tôi cần gặp nhân viên hỗ trợ.'
                })
            })

            const data = await res.json()
            if (data.success) {
                const newId = data.data.id;
                setConversationId(newId)
                sessionStorage.setItem('active_support_chat', newId)
                localStorage.setItem(ACTIVE_CONV_KEY, newId)
                return true
            }
            return false
        } catch (error) {
            console.error('Connection failed:', error)
            toast.error('Không thể kết nối đến máy chủ hỗ trợ')
            return false
        }
    }

    const saveMessageToFirebase = async (content: string, sender: 'USER' | 'AI' | 'SYSTEM', extra?: any) => {
        if (!conversationId || !identity) return false;

        const db = getFirebaseDatabase();
        const messagesRef = ref(db, `conversations/${conversationId}/messages`);

        const newMsg: Partial<LiveChatMessage> = {
            senderId: sender === 'USER' ? identity.id : (sender === 'AI' ? 'smartbuild_bot' : 'system'),
            senderName: sender === 'USER' ? identity.name : (sender === 'AI' ? 'SmartBuild AI' : 'System'),
            content,
            createdAt: new Date().toISOString(),
            isRead: false,
            ...extra
        };

        await push(messagesRef, newMsg);
        return true;
    }

    return {
        connectToAgent,
        identity,
        conversationId,
        saveMessageToFirebase,
        sendMessage: async (content: string, fileData?: any) => {
            if (!conversationId || !identity) return false;

            try {
                const res = await fetch('/api/chat/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conversationId,
                        content,
                        senderId: identity.id,
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
