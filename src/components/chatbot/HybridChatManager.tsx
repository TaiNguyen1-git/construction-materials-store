'use client'

import React, { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, onChildAdded, onValue, off, push, set } from 'firebase/database'
import { useAuth } from '@/contexts/auth-context'
import { ChatMode, GuestIdentity, HybridChatState, LiveChatMessage } from './types'
import toast from 'react-hot-toast'

interface HybridChatManagerProps {
    onNewMessage: (msg: LiveChatMessage) => void;
    onMessageChanged?: (msg: LiveChatMessage) => void;
    onHistoryLoaded?: (messages: LiveChatMessage[], convId: string) => void;
    onModeChange: (mode: ChatMode) => void;
    currentMode: ChatMode;
    customerId?: string;
}

const GUEST_ID_KEY = 'smartbuild_guest_id'
const GUEST_NAME_KEY = 'smartbuild_guest_name'
const ACTIVE_CONV_KEY = 'smartbuild_active_conv'

export default function useHybridChatManager({
    onNewMessage,
    onMessageChanged,
    onHistoryLoaded,
    onModeChange,
    currentMode,
    customerId
}: HybridChatManagerProps) {
    const { user, isAuthenticated } = useAuth()
    const [identity, setIdentity] = useState<{ id: string, name: string } | null>(null)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [adminPresence, setAdminPresence] = useState<{ id: string, name: string } | null>(null)

    // Using refs for callbacks to prevent effect re-runs when functions are recreated in parent
    const onHistoryLoadedRef = useRef(onHistoryLoaded)
    const onNewMessageRef = useRef(onNewMessage)
    const onMessageChangedRef = useRef(onMessageChanged)

    useEffect(() => {
        onHistoryLoadedRef.current = onHistoryLoaded
    }, [onHistoryLoaded])

    useEffect(() => {
        onNewMessageRef.current = onNewMessage
    }, [onNewMessage])

    useEffect(() => {
        onMessageChangedRef.current = onMessageChanged
    }, [onMessageChanged])

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

    // Fetch History when conversationId is set (Smart Loading: Limit to 25)
    useEffect(() => {
        if (!conversationId || !onHistoryLoadedRef.current) return;
 
        const fetchHistory = async () => {
            const db = getFirebaseDatabase()
            const { get, query, limitToLast } = await import('firebase/database')
            // Using query with limitToLast for smart loading
            const messagesRef = ref(db, `conversations/${conversationId}/messages`);
            const recentMessagesQuery = query(messagesRef, limitToLast(25));
 
            try {
                const snapshot = await get(recentMessagesQuery);
                if (snapshot && snapshot.exists()) {
                    const data = snapshot.val();
                    const historyMessages = Object.keys(data).map(key => ({
                        ...data[key],
                        id: key,
                        conversationId
                    })) as LiveChatMessage[];
 
                    // Filter and Sort
                    const filtered = historyMessages
                        .filter((m: any) => !m.adminOnly)
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    
                    onHistoryLoadedRef.current?.(filtered, conversationId);
                }
            } catch (err) {
                console.error("Error fetching history:", err);
            }
        };
 
        fetchHistory();
    }, [conversationId])

    // Listen to Firebase Messages when conversationId is active
    useEffect(() => {
        if (!conversationId) return;

        const db = getFirebaseDatabase()
        const messagesRef = ref(db, `conversations/${conversationId}/messages`);

        const handleNewMessage = (snapshot: any) => {
            const data = snapshot.val();
            if (data) {
                // Skip admin-only system messages on customer side
                if (data.adminOnly) return;

                const message: LiveChatMessage = {
                    ...data,
                    id: snapshot.key,
                    conversationId
                }

                // Only notify parent if it's from someone ELSE (Admin)
                if (data.senderId !== identity?.id) {
                    onNewMessageRef.current?.(message)
                }
            }
        };

        const handleMessageChanged = (snapshot: any) => {
            const data = snapshot.val();
            if (data) {
                if (data.adminOnly) return;
                const message: LiveChatMessage = {
                    ...data,
                    id: snapshot.key,
                    conversationId
                }
                onMessageChangedRef.current?.(message);
            }
        };

        import('firebase/database').then(({ onChildChanged }) => {
            onChildChanged(messagesRef, handleMessageChanged);
        });

        onChildAdded(messagesRef, handleNewMessage);
 
        // Listen to Admin Presence
        const statusRef = ref(db, `conversations/${conversationId}/status`);
        const unsubscribeStatus = onValue(statusRef, (snapshot: any) => {
            const data = snapshot.val();
            if (data && data.activeAdmin) {
                setAdminPresence(data.activeAdmin);
            } else {
                setAdminPresence(null);
            }
        });

        return () => {
            off(messagesRef, 'child_added', handleNewMessage);
            off(statusRef, 'value', unsubscribeStatus);
            import('firebase/database').then(({ off: offChanged }) => {
                offChanged(messagesRef, 'child_changed');
            });
        };
    }, [conversationId, identity?.id])

    const connectToAgent = async (initialMessage?: string) => {
        if (!identity) return false;
 
        // If already have a conversationId, just use it
        if (conversationId && !initialMessage) return true;

        try {
            const res = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: 'admin_support',
                    senderId: identity.id,
                    senderName: identity.name
                })
            })
 
            const data = await res.json()
            if (data.success) {
                const newId = data.data.id;
                setConversationId(newId)
                sessionStorage.setItem('active_support_chat', newId)
                localStorage.setItem(ACTIVE_CONV_KEY, newId)
 
                // Explicitly send the initial message to ensure it reaches admin
                if (initialMessage) {
                    await fetch('/api/chat/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            conversationId: newId,
                            content: initialMessage,
                            senderId: identity.id,
                            senderName: identity.name
                        })
                    })
                }
 
                return true
            }
            return false
        } catch (error) {
            console.error('Connection failed:', error)
            return false
        }
    }
 
    // Background Initialization
    useEffect(() => {
        if (identity && !conversationId) {
            // Quietly initialize conversation in background to avoid delay on first message
            connectToAgent();
        }
    }, [identity, conversationId]);

    const saveMessageToFirebase = async (content: string, sender: 'USER' | 'AI' | 'SYSTEM', extra?: any) => {
        if (!conversationId || !identity || content === undefined || content === null) {
            console.warn('[Firebase] Skipping save: identity, conversationId or content is missing');
            return false;
        }

        const db = getFirebaseDatabase();
        const messagesRef = ref(db, `conversations/${conversationId}/messages`);
        const newMsgRef = push(messagesRef);

        const newMsg: Partial<LiveChatMessage> = {
            id: newMsgRef.key!,
            senderId: sender === 'USER' ? identity.id : (sender === 'AI' ? 'smartbuild_bot' : 'system'),
            senderName: sender === 'USER' ? identity.name : (sender === 'AI' ? 'SmartBuild AI' : 'System'),
            content,
            createdAt: new Date().toISOString(),
            isRead: false,
            ...extra
        };

        try {
            await set(newMsgRef, newMsg);
            return true;
        } catch (err) {
            console.error('[Firebase] Save failed:', err);
            return false;
        }
    }

    return {
        connectToAgent,
        identity,
        conversationId,
        adminPresence,
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
