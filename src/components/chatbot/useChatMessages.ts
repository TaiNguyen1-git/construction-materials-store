import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, LiveChatMessage, ReportData } from './types';
import { loadCachedMessages, cacheMessages } from '../../lib/chat-db';

interface UseChatMessagesProps {
    sessionId: string;
    currentUserId: string | null;
}

export function useChatMessages({ sessionId, currentUserId }: UseChatMessagesProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [offset, setOffset] = useState(0);

    const loadMore = useCallback(async () => {
        if (!sessionId || isLoadingMore || !hasMore) return;
        
        setIsLoadingMore(true);
        try {
            const limit = 20;
            const cached = await loadCachedMessages(sessionId, limit, offset + limit);
            if (cached && cached.length > 0) {
                const mapped = cached.map((m: any) => ({
                    ...m,
                    suggestions: m.suggestions || [],
                    data: m.data as ReportData | undefined,
                    chatMode: m.chatMode || 'AI'
                }));
                setMessages(prev => [...mapped, ...prev]);
                setOffset(prev => prev + limit);
                if (cached.length < limit) setHasMore(false);
            } else {
                setHasMore(false);
            }
        } finally {
            setIsLoadingMore(false);
        }
    }, [sessionId, offset, isLoadingMore, hasMore]);

    // Initial load
    useEffect(() => {
        const initLoad = async () => {
            if (sessionId) {
                setOffset(0);
                setHasMore(true);
                const cached = await loadCachedMessages(sessionId, 20, 0);
                if (cached && cached.length > 0) {
                    setMessages(cached.map(m => ({
                        ...m,
                        suggestions: m.suggestions || [],
                        productRecommendations: m.productRecommendations as any as import('./types').ProductRecommendation[],
                        data: m.data as ReportData | undefined,
                        chatMode: m.chatMode || 'AI'
                    })));
                    if (cached.length < 20) setHasMore(false);
                } else {
                    setHasMore(false);
                }
            }
        };
        initLoad();
    }, [sessionId]);

    const handleHistoryLoaded = useCallback((history: LiveChatMessage[], convId: string) => {
        setMessages(prev => {
            const mappedMessages: ChatMessage[] = history.map(msg => ({
                id: msg.id,
                userMessage: msg.senderId === currentUserId ? msg.content : '',
                userImage: msg.senderId === currentUserId ? msg.fileUrl : undefined,
                botMessage: msg.senderId !== currentUserId ? msg.content : '',
                botImage: msg.senderId !== currentUserId ? msg.fileUrl : undefined,
                suggestions: [],
                confidence: 1,
                timestamp: msg.createdAt,
                requiresConfirmation: false,
                chatMode: 'HUMAN'
            }));

            const merged = [...mappedMessages];
            prev.forEach(p => {
                if (!merged.some(m => m.id === p.id)) {
                    const isLocal = p.id.startsWith('chat_') || p.id.includes('temp') || !p.id.match(/^-/);
                    if (isLocal) {
                        merged.push(p);
                    }
                }
            });
            
            merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            cacheMessages(convId || sessionId, mappedMessages as any).catch(() => {});
            return merged;
        });
    }, [currentUserId, sessionId]);

    const handleNewMessage = useCallback((msg: LiveChatMessage) => {
        setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;

            // Prevent duplicate of local optimistic messages
            if (msg.tempId) {
                const tempIndex = prev.findIndex(m => m.id === msg.tempId);
                if (tempIndex !== -1) {
                    const newMessages = [...prev];
                    newMessages[tempIndex] = { ...newMessages[tempIndex], id: msg.id };
                    return newMessages;
                }
            }

            if (msg.senderId === 'smartbuild_bot') {
                const existingIdx = prev.findIndex(m => m.botMessage === msg.content && !m.id.startsWith('chat_'));
                if (existingIdx !== -1) {
                    const newMessages = [...prev];
                    newMessages[existingIdx] = { ...newMessages[existingIdx], id: msg.id };
                    return newMessages;
                }
            }

            const newMessage: ChatMessage = {
                id: msg.id,
                userMessage: msg.senderId === currentUserId ? msg.content : '',
                userImage: msg.senderId === currentUserId ? msg.fileUrl : undefined,
                botMessage: msg.senderId !== currentUserId ? msg.content : '',
                botImage: msg.senderId !== currentUserId ? msg.fileUrl : undefined,
                suggestions: [],
                confidence: 1,
                timestamp: msg.createdAt,
                requiresConfirmation: false,
                isSystem: (msg as any).senderRole === 'SYSTEM' || msg.senderId === 'system',
                chatMode: 'HUMAN'
            };
            return [...prev, newMessage];
        });
    }, [currentUserId]);

    return {
        messages,
        setMessages,
        loadMore,
        hasMore,
        isLoadingMore,
        handleHistoryLoaded,
        handleNewMessage
    };
}
        