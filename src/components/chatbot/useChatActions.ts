import { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { ChatMessage, ChatMode, LiveChatMessage, ReportData } from './types';
import { v4 as uuidv4 } from 'uuid';

interface UseChatActionsProps {
    currentUserId: string | null;
    currentUserName?: string | null;
    chatMode: ChatMode;
    sessionId: string;
    conversationId?: string;
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    setIsLoading: (loading: boolean) => void;
    setIsStreaming: (streaming: boolean) => void;
    setIsError: (error: boolean) => void;
    setErrorRetryCount: React.Dispatch<React.SetStateAction<number>>;
    setAbortController: (ac: AbortController | null) => void;
    handleConnectSupport: () => void;
    setShowOCRPreview: (val: boolean) => void;
    setPendingOCRData: (val: any) => void;
    setShowOrderSummary: (val: boolean) => void;
    setPendingOrderData: (val: any) => void;
    setShowConfirmDialog: (val: boolean) => void;
    setConfirmDialogData: (val: any) => void;
    scrollToBottom: () => void;
    setChatMode: (mode: ChatMode) => void;
}

export function useChatActions({
    currentUserId, currentUserName, chatMode, sessionId, conversationId,
    setMessages, setIsLoading, setIsStreaming, setIsError,
    setErrorRetryCount, setAbortController, handleConnectSupport,
    setShowOCRPreview, setPendingOCRData, setShowOrderSummary,
    setPendingOrderData, setShowConfirmDialog, setConfirmDialogData,
    scrollToBottom, setChatMode
}: UseChatActionsProps) {
    
    const abortControllerRef = useRef<AbortController | null>(null);
    const streamingBotMsgIdRef = useRef<string | null>(null);
    const streamingBotContentRef = useRef<string>('');

    const sendMessage = useCallback(async (text: string, isFromInput = false, currentMessage = '', setCurrentMessage?: (v: string) => void, selectedImage: string | null = null, setSelectedImage?: (v: string | null) => void, replyTo?: { id: string; text: string } | null) => {
        const messageText = isFromInput ? currentMessage : text;
        if (!messageText.trim() && !selectedImage) return;

        const tempId = `chat_${Date.now()}`;
        const userMsg: ChatMessage = {
            id: tempId,
            userMessage: messageText,
            userImage: selectedImage || undefined,
            botMessage: '',
            suggestions: [],
            confidence: 1,
            timestamp: new Date().toISOString(),
            requiresConfirmation: false,
            chatMode: chatMode,
            replyToId: replyTo?.id,
            replyToContent: replyTo?.text
        };

        setMessages(prev => [...prev, userMsg]);
        if (setCurrentMessage) setCurrentMessage('');
        if (setSelectedImage) setSelectedImage(null);
        setIsLoading(true);
        setIsError(false);
        scrollToBottom();

        // Firebase Push (Optimistic)
        if (conversationId && chatMode === 'HUMAN') {
            let inferredFileType = undefined;
            let inferredFileName = undefined;
            if (selectedImage && selectedImage.startsWith('data:')) {
                const match = selectedImage.match(/^data:([^;]+);/);
                if (match) {
                    inferredFileType = match[1];
                    const ext = inferredFileType.split('/')[1] || 'bin';
                    inferredFileName = `upload_${Date.now()}.${ext}`;
                }
            }

            const dbRef = (await import('@/lib/firebase')).getFirebaseDatabase();
            const { ref, push, set } = await import('firebase/database');
            const chatRef = ref(dbRef, `conversations/${conversationId}/messages`);
            const newMessageRef = push(chatRef);
            set(newMessageRef, {
                id: newMessageRef.key,
                tempId: tempId,
                senderId: currentUserId || sessionId,
                senderName: currentUserName || 'Khách',
                content: messageText,
                fileUrl: selectedImage || null,
                fileType: inferredFileType || null,
                fileName: inferredFileName || null,
                createdAt: new Date().toISOString(),
                status: 'sent',
                isRead: false,
                replyToId: replyTo?.id || null,
                replyToContent: replyTo?.text || null
            });
        }

        if (chatMode === 'HUMAN') {
            // Persist to Database so it shows up in Admin Panel
            if (conversationId) {
                let inferredFileType = undefined;
                let inferredFileName = undefined;
                if (selectedImage && selectedImage.startsWith('data:')) {
                    const match = selectedImage.match(/^data:([^;]+);/);
                    if (match) {
                        inferredFileType = match[1];
                        const ext = inferredFileType.split('/')[1] || 'bin';
                        inferredFileName = `upload_${Date.now()}.${ext}`;
                    }
                }

                try {
                    await fetch('/api/chat/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            conversationId,
                            content: messageText,
                            senderId: currentUserId || sessionId,
                            senderName: currentUserName || 'Khách',
                            fileUrl: selectedImage || null,
                            fileType: inferredFileType,
                            fileName: inferredFileName,
                            tempId: tempId,
                            replyToId: replyTo?.id || null,
                            replyToContent: replyTo?.text || null
                        })
                    });
                } catch (err) {
                    console.error('[API] Failed to persist message:', err);
                }
            }
            setIsLoading(false);
            return;
        }

        // AI Request (Streaming)
        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;
            setAbortController(controller);

            // Use the streaming endpoint if it's a pure text query. Use old endpoint for image/audio parsing.
            const endpoint = selectedImage ? '/api/chatbot' : '/api/chatbot/stream';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    sessionId,
                    conversationId,
                    customerId: currentUserId,
                    image: selectedImage
                }),
                signal: controller.signal
            });

            if (!response.ok) throw new Error('API Error');

            const contentType = response.headers.get('content-type');
            if (contentType?.includes('text/event-stream')) {
                setIsStreaming(true);
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                // Reset streaming state using refs so they survive React re-renders
                streamingBotMsgIdRef.current = null;
                streamingBotContentRef.current = '';

                while (true) {
                    const { done, value } = await reader!.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6).trim();
                            if (data === '[DONE]') break;
                            if (!data) continue;

                            try {
                                const parsed = JSON.parse(data);

                                if (parsed.escalate) {
                                    handleConnectSupport();
                                }

                                if (parsed.autoAddToCart) {
                                    toast.success(`AI đang tự động thêm ${parsed.autoAddToCart.length} sản phẩm vào giỏ hàng...`, { icon: '🛒' });
                                    window.dispatchEvent(new CustomEvent('ai_add_to_cart', { detail: parsed.autoAddToCart }));
                                }

                                if (parsed.text || parsed.suggestions || parsed.productRecommendations) {
                                    // ── IMPORTANT: mutate refs OUTSIDE setMessages updater ──
                                    // setMessages updater must be a pure function (React may re-run it).
                                    // All side-effects on refs must happen here in the normal event loop.

                                    if (!streamingBotMsgIdRef.current) {
                                        // First chunk: initialise the bot message
                                        streamingBotMsgIdRef.current = uuidv4();
                                        streamingBotContentRef.current = parsed.text || '';
                                    } else if (parsed.text) {
                                        // Subsequent chunks: accumulate
                                        streamingBotContentRef.current += parsed.text;
                                    }

                                    // Snapshot stable values for the pure updater closure
                                    const botId      = streamingBotMsgIdRef.current!;
                                    const botContent = streamingBotContentRef.current;
                                    const parsedSnap = parsed;

                                    setMessages(prev => {
                                        const msgIndex = prev.findIndex(m => m.id === botId);

                                        if (msgIndex === -1) {
                                            // Message not in list yet → create it
                                            const newMsg: ChatMessage = {
                                                id: botId,
                                                userMessage: '',
                                                botMessage: botContent,
                                                suggestions: parsedSnap.suggestions || [],
                                                productRecommendations: parsedSnap.productRecommendations || [],
                                                confidence: parsedSnap.confidence || 1,
                                                timestamp: new Date().toISOString(),
                                                data: parsedSnap.data,
                                                chatMode: 'AI'
                                            };
                                            return [...prev, newMsg];
                                        }

                                        // Message already in list → update it
                                        const updatedMsg = { ...prev[msgIndex], botMessage: botContent };
                                        if (parsedSnap.suggestions) updatedMsg.suggestions = parsedSnap.suggestions;
                                        if (parsedSnap.productRecommendations) {
                                            updatedMsg.productRecommendations = [
                                                ...(updatedMsg.productRecommendations || []),
                                                ...parsedSnap.productRecommendations
                                            ];
                                        }
                                        const newArray = [...prev];
                                        newArray[msgIndex] = updatedMsg;
                                        return newArray;
                                    });
                                    scrollToBottom();
                                }
                            } catch (e) { /* partial / malformed SSE chunk, skip */ }
                        }
                    }
                }
            } else {
                const responseData = await response.json();
                const aiData = responseData.data;
                const botMsg: ChatMessage = {
                    id: uuidv4(),
                    userMessage: '',
                    botMessage: aiData.message || aiData.botMessage,
                    suggestions: aiData.suggestions || [],
                    productRecommendations: aiData.productRecommendations || [],
                    confidence: aiData.confidence || 1,
                    timestamp: new Date().toISOString(),
                    data: aiData.data,
                    chatMode: 'AI'
                };
                setMessages(prev => [...prev, botMsg]);
                scrollToBottom();
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setIsError(true);
                setErrorRetryCount(prev => prev + 1);
            }
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            setAbortController(null);
            abortControllerRef.current = null;
        }
    }, [chatMode, sessionId, conversationId, currentUserId]);

    const handleSuggestionClick = useCallback((suggestion: string, message?: ChatMessage) => {
        if (suggestion === 'Chi tiết hơn' && message?.data) {
            setPendingOrderData(message.data);
            setShowOrderSummary(true);
            return;
        }
        if (suggestion === 'Xuất báo cáo' && message?.data) {
            toast.success('Đang khởi tạo bản in báo giá...');
            // Logic for exportReport
            setTimeout(() => {
                window.open(`/api/export/estimate?data=${encodeURIComponent(JSON.stringify(message.data))}`, '_blank');
            }, 1000);
            return;
        }
        if (suggestion === 'Gặp nhân viên hỗ trợ' || suggestion === 'Liên hệ hỗ trợ') {
            handleConnectSupport();
            return;
        }
        if (suggestion === 'Đăng nhập') {
            window.location.href = '/auth/login';
            return;
        }
        if (suggestion === 'Đăng ký ngay') {
            window.location.href = '/auth/register';
            return;
        }
        sendMessage(suggestion);
    }, [sendMessage, handleConnectSupport, setPendingOrderData, setShowOrderSummary]);

    return {
        sendMessage,
        handleSuggestionClick,
        abortController: abortControllerRef.current
    };
}
