'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Sparkles, X, Maximize2, Minimize2, Send, Paperclip, MessageSquare, ShieldCheck, User, Zap, AlertCircle, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuth } from '@/contexts/auth-context'
import useHybridChatManager from './HybridChatManager'
import { ChatMessage, ChatMode, LiveChatMessage, ReportData } from './types'

// Sub-components
import ChatHeader from './ChatHeader'
import ChatInput from './ChatInput'
import ChatCallManager from '../ChatCallManager'
import { ChatFloatingButton } from './ChatFloatingButton'
import { ChatLightbox } from './ChatLightbox'
import { useCartStore } from '@/stores/cartStore'
import { ChatMessagesArea } from './ChatMessagesArea'
import ChatGallery from './ChatGallery'

// Hooks
import { useChatMessages } from './useChatMessages'
import { useChatActions } from './useChatActions'

export default function ChatbotPremium({ isOpen: propIsOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
    const { user, isAuthenticated } = useAuth()
    const isAdmin = (user?.role as string) === 'ADMIN' || (user?.role as string) === 'MANAGER'
    const currentUserId = user?.id || null
    const customerId = user?.id || undefined

    // UI State
    const [isOpen, setIsOpen] = useState(propIsOpen || false)
    
    // Notify other components about chatbot state
    useEffect(() => {
        const event = new CustomEvent('chatbot-state-change', { detail: { isOpen } });
        window.dispatchEvent(event);
    }, [isOpen]);

    const [isExpanded, setIsExpanded] = useState(false)
    const [chatMode, setChatMode] = useState<ChatMode>('AI')
    const [isLoading, setIsLoading] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [isError, setIsError] = useState(false)
    const [errorRetryCount, setErrorRetryCount] = useState(0)
    const [currentMessage, setCurrentMessage] = useState('')
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [lightboxImage, setLightboxImage] = useState<string | null>(null)
    const [abortController, setAbortController] = useState<AbortController | null>(null)
    const [replyingTo, setReplyingTo] = useState<{ id: string; text: string; isUser: boolean } | null>(null)

    // Functional State (Modals)
    const [showOCRPreview, setShowOCRPreview] = useState<boolean>(false)
    const [pendingOCRData, setPendingOCRData] = useState<import('./types').OCRData | null>(null)
    const [showOrderSummary, setShowOrderSummary] = useState<boolean>(false)
    const [pendingOrderData, setPendingOrderData] = useState<import('./types').OrderData | null>(null)
    const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false)
    const [confirmDialogData, setConfirmDialogData] = useState<import('./types').ConfirmDialogData | null>(null)
    const [showGallery, setShowGallery] = useState(false)

    // Identity
    const sessionId = useRef(uuidv4()).current
    const myIdentity = isAdmin ? { id: 'admin_support', name: 'Nhân viên hỗ trợ' } : (user ? { id: user.id, name: user.name } : null)

    // Refs
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = useCallback((force = false) => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        if (force || isAtBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [])

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        // Can be used to show/hide "Scroll to bottom" fab
    }, [])

    // Message Hook
    const { 
        messages, setMessages, 
        hasMore, isLoadingMore, loadMore,
        handleHistoryLoaded, handleNewMessage 
    } = useChatMessages({ 
        sessionId: sessionId, 
        currentUserId 
    })


    const { addItem } = useCartStore()
    const handleAddToCart = useCallback((product: import('./types').ProductRecommendation) => {
        console.log('[Chatbot] Adding to cart:', product)
        
        if (!product.id) {
            console.warn('[Chatbot] Missing product ID for:', product.name)
            toast.error('Sản phẩm này hiện đang được cập nhật, vui lòng liên hệ nhân viên.')
            return
        }

        try {
            addItem({
                productId: product.id,
                id: product.id,
                name: product.name,
                price: product.price || 0,
                image: product.imageUrl || (product as any).image || '/placeholder.png',
                quantity: 1,
                unit: product.unit || 'cái',
                sku: product.sku || 'N/A'
            })
            toast.success(`Đã thêm ${product.name} vào giỏ hàng`)
        } catch (err) {
            console.error('[Chatbot] Cart error:', err)
            toast.error('Không thể thêm vào giỏ hàng. Vui lòng thử lại.')
        }
    }, [addItem])

    // Hybrid Manager
    const hybridManager = useHybridChatManager({
        currentMode: chatMode,
        onModeChange: setChatMode,
        customerId,
        onNewMessage: handleNewMessage,
        onHistoryLoaded: handleHistoryLoaded
    })

    const handleConnectSupport = useCallback(async () => {
        setChatMode('HUMAN')
        toast.success('Đang kết nối với nhân viên hỗ trợ...')
        if (hybridManager.conversationId && hybridManager.identity) {
            // Persist to DB so Admin sees it
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: hybridManager.conversationId,
                    content: 'Khách hàng yêu cầu hỗ trợ trực tiếp từ nhân viên.',
                    senderId: 'system',
                    senderName: 'Hệ thống'
                })
            });
        }
    }, [hybridManager.conversationId, hybridManager.identity])

    const handleDeleteMessage = useCallback(async (messageId: string) => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isDeleted: true } : m));
        
        if (chatMode === 'HUMAN' && hybridManager.conversationId) {
            try {
                // Not implementing real delete API for now, just marking local state
            } catch (err) {
                console.error("Failed to delete message", err);
            }
        }
    }, [chatMode, hybridManager.conversationId, setMessages]);

    const handleReplyMessage = useCallback((message: ChatMessage, isUser: boolean) => {
        setReplyingTo({
            id: message.id,
            text: isUser ? message.userMessage : (message.botMessage || 'Ảnh/Tài liệu đính kèm'),
            isUser
        });
    }, []);

    // Actions Hook (Uses hybridManager.conversationId which might be undefined initially)
    const actions = useChatActions({
        currentUserId: hybridManager.identity?.id || currentUserId,
        currentUserName: hybridManager.identity?.name || user?.name,
        chatMode,
        sessionId,
        conversationId: hybridManager.conversationId ?? undefined,
        setMessages,
        setIsLoading,
        setIsStreaming,
        setIsError,
        setErrorRetryCount,
        setAbortController,
        handleConnectSupport,
        setShowOCRPreview,
        setPendingOCRData,
        setShowOrderSummary,
        setPendingOrderData,
        setShowConfirmDialog,
        setConfirmDialogData,
        scrollToBottom,
        setChatMode
    })

    const handleSendMessage = () => actions.sendMessage('', true, currentMessage, setCurrentMessage, selectedImage, setSelectedImage)

    // Listen to admin presence changes
    useEffect(() => {
        if (hybridManager.adminPresence && chatMode === 'HUMAN') {
            setMessages(prev => {
                const alreadyNotified = prev.some(m => m.id === 'admin-join-msg');
                if (alreadyNotified) return prev;
                return [...prev, {
                    id: 'admin-join-msg',
                    userMessage: '',
                    botMessage: `Nhân viên **${hybridManager.adminPresence?.name || 'Hỗ trợ'}** đã tham gia cuộc trò chuyện.`,
                    suggestions: [],
                    confidence: 1,
                    timestamp: new Date().toISOString(),
                    isSystem: true
                }];
            });
            scrollToBottom();
        }
    }, [hybridManager.adminPresence, chatMode, setMessages, scrollToBottom]);

    return (
        <>
            <ChatFloatingButton isOpen={isOpen} setIsOpen={setIsOpen} isAdmin={isAdmin} chatMode={chatMode} />

            {isOpen && (
                <div className={`fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden border border-gray-100 animate-fadeIn bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] ${isExpanded ? 'w-full h-full sm:w-[500px] sm:h-[700px] sm:max-h-[90vh]' : 'w-[380px] h-[600px] max-h-[calc(100vh-100px)]'}`}>
                    {myIdentity && <ChatCallManager userId={myIdentity.id} userName={myIdentity.name} listenAdminSupport={false} />}
                    
                    {!lightboxImage && (
                        <ChatHeader 
                            isAdmin={isAdmin} 
                            isExpanded={isExpanded} 
                            isHuman={chatMode === 'HUMAN'} 
                            onSwitchToAI={async () => {
                                setChatMode('AI')
                                if (hybridManager.conversationId) {
                                    await fetch('/api/chat/messages', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            conversationId: hybridManager.conversationId,
                                            content: 'Khách hàng đã kết thúc hỗ trợ và chuyển về AI.',
                                            senderId: 'system',
                                            senderName: 'Hệ thống'
                                        })
                                    });
                                }
                            }} 
                            onClose={() => onClose ? onClose() : setIsOpen(false)} 
                            onToggleExpand={() => setIsExpanded(!isExpanded)} 
                            onShowGallery={() => setShowGallery(true)}
                        />
                    )}

                    <ChatMessagesArea
                        messages={messages}
                        isLoading={isLoading}
                        isStreaming={isStreaming}
                        hasMore={hasMore}
                        isLoadingMore={isLoadingMore}
                        loadMore={loadMore}
                        isError={isError}
                        errorRetryCount={errorRetryCount}
                        chatMode={chatMode}
                        isAdmin={isAdmin}
                        abortController={abortController}
                        chatContainerRef={chatContainerRef}
                        messagesEndRef={messagesEndRef}
                        setLightboxImage={setLightboxImage}
                        showOCRPreview={showOCRPreview}
                        setShowOCRPreview={setShowOCRPreview}
                        pendingOCRData={pendingOCRData}
                        setPendingOCRData={setPendingOCRData}
                        showOrderSummary={showOrderSummary}
                        setShowOrderSummary={setShowOrderSummary}
                        pendingOrderData={pendingOrderData}
                        setPendingOrderData={setPendingOrderData}
                        showConfirmDialog={showConfirmDialog}
                        setShowConfirmDialog={setShowConfirmDialog}
                        confirmDialogData={confirmDialogData}
                        setConfirmDialogData={setConfirmDialogData}
                        conversationId={hybridManager.conversationId ?? undefined}
                        myIdentity={myIdentity || undefined}
                        handleScroll={handleScroll}
                        handleConnectSupport={handleConnectSupport}
                        sendMessage={actions.sendMessage}
                        handleSuggestionClick={actions.handleSuggestionClick}
                        onAddToCart={handleAddToCart}
                        onDeleteMessage={handleDeleteMessage}
                        onReplyMessage={handleReplyMessage}
                        stopResponse={() => abortController?.abort()}
                        regenerateResponse={() => {
                            const aiMessages = messages.filter(m => (m.chatMode || 'AI') === 'AI');
                            if (aiMessages.length === 0) return;

                            // Find the last bot reply (message with botMessage but no userMessage)
                            const lastBotIdx = [...aiMessages].map((m, i) => ({ m, i }))
                                .reverse()
                                .find(({ m }) => m.botMessage && !m.userMessage);

                            if (!lastBotIdx) return;

                            // Find the user message that preceded this bot reply
                            const precedingUserMsg = aiMessages
                                .slice(0, lastBotIdx.i)
                                .reverse()
                                .find(m => m.userMessage || m.userImage);

                            if (!precedingUserMsg) return;

                            // Remove only the bot reply, keep the user message intact
                            setMessages(prev => prev.filter(m => m.id !== lastBotIdx.m.id));
                            actions.sendMessage(precedingUserMsg.userMessage || '', false, '', undefined, precedingUserMsg.userImage);
                        }}
                        retryLastMessage={() => {
                            const aiMessages = messages.filter(m => (m.chatMode || 'AI') === 'AI');
                            const lastUserMsg = [...aiMessages].reverse().find(m => (m.userMessage || m.userImage) && !m.botMessage);
                            if (lastUserMsg) actions.sendMessage(lastUserMsg.userMessage || '', false, '', undefined, lastUserMsg.userImage);
                        }}
                    />

                    {showGallery && (
                        <ChatGallery 
                            messages={messages} 
                            onClose={() => setShowGallery(false)}
                            onImageClick={setLightboxImage}
                            isGuest={!user}
                        />
                    )}

                    <ChatInput 
                        currentMessage={currentMessage} 
                        setCurrentMessage={setCurrentMessage} 
                        selectedImage={selectedImage} 
                        setSelectedImage={setSelectedImage} 
                        isLoading={isLoading} 
                        onSendMessage={() => {
                            actions.sendMessage(currentMessage, true, currentMessage, setCurrentMessage, selectedImage, setSelectedImage, replyingTo);
                            setReplyingTo(null);
                        }} 
                        isAdmin={isAdmin} 
                        onConnectSupport={handleConnectSupport} 
                        isHumanMode={chatMode === 'HUMAN'} 
                        onTyping={() => {}} 
                        replyingTo={replyingTo}
                        onCancelReply={() => setReplyingTo(null)}
                    />
                </div>
            )}

            <ChatLightbox lightboxImage={lightboxImage} setLightboxImage={setLightboxImage} />
        </>
    )
}
