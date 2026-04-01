'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Sparkles, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'

// Components
import ChatHeader from './ChatHeader'
import ChatInput from './ChatInput'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import ErrorMessage from './ErrorMessage'
import WelcomeScreen from './WelcomeScreen'
import ChatOrderSummary from '../ChatOrderSummary'
import ChatConfirmDialog from '../ChatConfirmDialog'
import ChatOCRPreview from '../ChatOCRPreview'
import LiveTypingIndicator, { updateTypingStatus } from './LiveTypingIndicator'

// Types
import {
    ChatMessage,
    ChatbotProps,
    OCRData,
    OrderData,
    ReportData,
    ConfirmDialogData,
    ChatMode,
    LiveChatMessage
} from './types'
import useHybridChatManager from './HybridChatManager'
import ChatCallManager from '../ChatCallManager'

// IndexedDB Chat Cache
import {
    loadCachedMessages,
    cacheMessage,
    cacheMessages,
    updateCachedMessage,
    cleanupOldCache
} from '@/lib/chat-db'

export default function ChatbotPremium({ customerId, onClose }: ChatbotProps) {
    const { user, isAuthenticated } = useAuth()
    const pathname = usePathname()

    // UI State - Start open if onClose is provided (embedded mode)
    const [isOpen, setIsOpen] = useState(!!onClose)
    const [isExpanded, setIsExpanded] = useState(false)
    const [lightboxImage, setLightboxImage] = useState<string | null>(null)

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [currentMessage, setCurrentMessage] = useState('')
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isError, setIsError] = useState(false)
    const [errorRetryCount, setErrorRetryCount] = useState(0)
    const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    const [streamingText, setStreamingText] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [cacheLoaded, setCacheLoaded] = useState(false)

    // Deduplication: prevent identical rapid-fire sends
    const lastSentRef = useRef<{ message: string; timestamp: number }>({ message: '', timestamp: 0 })

    // Feature State
    const [showOrderSummary, setShowOrderSummary] = useState(false)
    const [showOCRPreview, setShowOCRPreview] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [confirmDialogData, setConfirmDialogData] = useState<ConfirmDialogData | null>(null)
    const [pendingOrderData, setPendingOrderData] = useState<OrderData | null>(null)
    const [pendingOCRData, setPendingOCRData] = useState<OCRData | null>(null)
    const [abortController, setAbortController] = useState<AbortController | null>(null)

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const isAtBottom = useRef(true)

    // Check if user is admin/manager
    const isAdminRoute = pathname?.startsWith('/admin') ?? false
    const isAdminByRole = isAuthenticated && user && (user.role === 'MANAGER' || user.role === 'EMPLOYEE')
    const isAdmin = isAdminRoute || !!isAdminByRole

    // Hybrid Chat Integration
    const [chatMode, setChatMode] = useState<ChatMode>('AI')

    // Call Manager State
    const [myIdentity, setMyIdentity] = useState<{ id: string, name: string } | null>(null)

    // Identity for mapping - consistent with HybridChatManager logic
    const currentUserId = (isAuthenticated && user)
        ? (user.id || customerId || '')
        : (typeof window !== 'undefined' ? localStorage.getItem('smartbuild_guest_id') : null);

    // Memoized Callbacks for Hybrid Manager
    const handleHistoryLoaded = useCallback((history: LiveChatMessage[]) => {
        const mappedMessages: ChatMessage[] = history.map(msg => ({
            id: msg.id,
            userMessage: msg.senderId === currentUserId ? msg.content : '',
            userImage: (msg.senderId === currentUserId && msg.fileType?.startsWith('image')) ? msg.fileUrl : undefined,
            botMessage: msg.senderId !== currentUserId ? msg.content : '',
            suggestions: [],
            confidence: 1,
            timestamp: msg.createdAt,
            requiresConfirmation: false
        }));
        setMessages(mappedMessages);

        // If the last message was from an agent, maybe switch to HUMAN mode
        const lastMsg = history[history.length - 1];
        if (lastMsg && lastMsg.senderId !== 'smartbuild_bot' && lastMsg.senderId !== currentUserId) {
            setChatMode('HUMAN');
        }
    }, [currentUserId]);

    const handleNewMessage = useCallback((msg: LiveChatMessage) => {
        setMessages(prev => {
            // 1. Check if message already exists by ID
            if (prev.some(m => m.id === msg.id)) return prev;

            // 2. Check if it's a Bot response we already have (optimistic update)
            if (msg.senderId === 'smartbuild_bot') {
                const existingIdx = prev.findIndex(m => m.botMessage === msg.content && !m.id.startsWith('chat_'));
                if (existingIdx !== -1) {
                    // Update the local message with the real Firebase ID
                    const newMessages = [...prev];
                    newMessages[existingIdx] = { ...newMessages[existingIdx], id: msg.id };
                    return newMessages;
                }
            }

            // 3. Otherwise add as new message
            const newMessage: ChatMessage = {
                id: msg.id,
                userMessage: msg.senderId === currentUserId ? msg.content : '',
                botMessage: msg.senderId !== currentUserId ? msg.content : '',
                suggestions: [],
                confidence: 1,
                timestamp: msg.createdAt,
                requiresConfirmation: false
            }
            return [...prev, newMessage];
        });
        setIsLoading(false);
    }, [currentUserId]);

    // Hybrid Manager Hook usage
    const hybridManager = useHybridChatManager({
        currentMode: chatMode,
        onModeChange: setChatMode,
        customerId,
        onHistoryLoaded: handleHistoryLoaded,
        onNewMessage: handleNewMessage
    });

    // Sync identity for Call Manager
    useEffect(() => {
        if (hybridManager.identity) {
            setMyIdentity(hybridManager.identity)
        }
    }, [hybridManager.identity])

    const handleConnectSupport = async () => {
        const loadingMsg: ChatMessage = {
            id: Date.now().toString(),
            userMessage: 'Gặp nhân viên hỗ trợ',
            botMessage: 'Đang kết nối đến nhân viên hỗ trợ...',
            suggestions: [],
            confidence: 1,
            timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, loadingMsg])
        setIsLoading(true)

        const connected = await hybridManager.connectToAgent()

        setIsLoading(false)
        if (connected) {
            // The message "Đã kết nối!" is often handled by the backend's initialMessage 
            // or already synced via Firebase. Let's just switch mode and avoid extra local UI bubbles.
            setChatMode('HUMAN')

            // Note: successMsg is removed here because handleNewMessage/handleHistoryLoaded 
            // will pick up the "Xin chào..." and "Đã kết nối" from Firebase/DB.
        } else {
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                userMessage: '',
                botMessage: 'Hiện tại tất cả nhân viên đều bận. Vui lòng để lại tin nhắn hoặc thử lại sau.',
                suggestions: ['Thử lại', 'Gửi yêu cầu offline'],
                confidence: 1,
                timestamp: new Date().toISOString()
            }
            setMessages(prev => [...prev, errorMsg])
        }
    }

    const handleSwitchToAI = () => {
        setChatMode('AI')
        const msg: ChatMessage = {
            id: Date.now().toString(),
            userMessage: '',
            botMessage: 'Đã chuyển về chế độ AI tự động. Tôi có thể giúp gì tiếp ạ?',
            suggestions: ['Tra cứu đơn hàng', 'Tìm sản phẩm'],
            confidence: 1,
            timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, msg])

        // Save to firebase
        hybridManager.saveMessageToFirebase(msg.botMessage, 'AI');
    }

    // Hidden pages list
    const hiddenPages = [
        '/login', '/register', '/forgot-password',
        '/contractor', '/contractor/login', '/contractor/register',
        '/cart', '/checkout', '/order-tracking', '/wishlist',
        '/about', '/contact', '/privacy', '/terms',
        '/estimator', '/contractors', '/projects',
    ]

    const shouldHideChatbot = hiddenPages.some(page =>
        pathname === page || pathname?.startsWith(page + '/')
    )

    // Scroll to bottom
    const handleScroll = () => {
        if (!chatContainerRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight
        isAtBottom.current = distanceFromBottom < 100
    }

    const scrollToBottom = useCallback((force = false) => {
        if ((isAtBottom.current || force) && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [])

    useEffect(() => {
        if (!shouldHideChatbot) {
            // Force scroll on user's own message, or if already at bottom
            const lastMsg = messages[messages.length - 1]
            const isFromUser = lastMsg && lastMsg.userMessage && !lastMsg.botMessage
            scrollToBottom(!!isFromUser)
        }
    }, [messages, shouldHideChatbot, scrollToBottom])

    // ── Load cached messages from IndexedDB on mount (instant display) ──
    useEffect(() => {
        if (typeof window === 'undefined' || cacheLoaded) return

        const loadCache = async () => {
            try {
                const effectiveSessionId = hybridManager.conversationId || sessionId
                const cached = await loadCachedMessages(effectiveSessionId, 30)

                if (cached.length > 0) {
                    const restoredMessages: ChatMessage[] = cached.map(c => ({
                        id: c.id,
                        userMessage: c.userMessage,
                        userImage: c.userImage,
                        botMessage: c.botMessage,
                        suggestions: c.suggestions || [],
                        productRecommendations: c.productRecommendations as ChatMessage['productRecommendations'],
                        confidence: c.confidence,
                        timestamp: c.timestamp,
                        ocrData: c.ocrData as ChatMessage['ocrData'],
                        orderData: c.orderData as ChatMessage['orderData'],
                        data: c.data as ChatMessage['data'],
                    }))
                    setMessages(restoredMessages)
                }

                // Cleanup old cache in background
                cleanupOldCache()
            } catch (err) {
                console.warn('[ChatDB] Cache load failed:', err)
            } finally {
                setCacheLoaded(true)
            }
        }

        loadCache()
    }, [cacheLoaded, hybridManager.conversationId, sessionId])

    useEffect(() => {
        // Only trigger welcome if we have NO messages and AREN'T currently loading
        if (!shouldHideChatbot && isOpen && messages.length === 0 && !isLoading && cacheLoaded) {
            const welcomeMsg = isAdmin ? 'admin_hello' : 'hello'
            sendMessage(welcomeMsg)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, isAdmin, messages.length, shouldHideChatbot, isLoading, cacheLoaded])

    if (shouldHideChatbot) {
        return null
    }

    const sendMessage = async (message: string, useCurrentMessage = false) => {
        if (isLoading) return // Important: Prevent duplicate sending

        const messageToSend = useCurrentMessage ? currentMessage : message
        const imageToSend = selectedImage

        if (!messageToSend.trim() && !imageToSend) return

        // ── Client-side Deduplication ──────────────────────────────────────────
        // Block identical messages sent within 2 seconds (anti-spam / double-click)
        const now = Date.now()
        if (
            messageToSend === lastSentRef.current.message &&
            now - lastSentRef.current.timestamp < 2000
        ) {
            console.log('[Chatbot] Blocked duplicate message within cooldown')
            return
        }
        lastSentRef.current = { message: messageToSend, timestamp: now }

        // ---------------------------------------------------------
        // HUMAN MODE HANDLER
        // ---------------------------------------------------------
        if (chatMode === 'HUMAN') {
            setCurrentMessage('')
            setSelectedImage(null)

            // Optimistic update
            const tempMsg: ChatMessage = {
                id: Date.now().toString(),
                userMessage: messageToSend,
                userImage: imageToSend || undefined,
                botMessage: '', // Wait for reply
                suggestions: [],
                confidence: 1,
                timestamp: new Date().toISOString()
            }
            setMessages(prev => [...prev, tempMsg]) // Add user message immediately

            const success = await hybridManager.sendMessage(messageToSend, imageToSend ? { fileUrl: imageToSend, fileType: 'image/jpeg' } : undefined)

            if (!success) {
                toast.error('Gửi tin nhắn thất bại')
                // Optionally remove failed message
            }
            return
        }

        // ---------------------------------------------------------
        // AI MODE HANDLER — Streaming SSE + Fallback
        // ---------------------------------------------------------

        if (!messageToSend.trim() && !imageToSend) return

        // Create new AbortController for this request
        const controller = new AbortController()
        setAbortController(controller)

        setCurrentMessage('')
        setSelectedImage(null)
        setIsLoading(true)
        setIsError(false)
        setStreamingText('')
        setIsStreaming(false)

        // Optimistic update: Add user message immediately so it's not hidden during loading
        const tempId = Date.now().toString()
        const userOnlyMessage: ChatMessage = {
            id: tempId,
            userMessage: messageToSend,
            userImage: imageToSend || undefined,
            botMessage: '', // Empty while loading
            suggestions: [],
            confidence: 1,
            timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, userOnlyMessage])

        // Cache user message to IndexedDB
        const effectiveSessionId = hybridManager.conversationId || sessionId
        cacheMessage(effectiveSessionId, {
            id: tempId,
            userMessage: messageToSend,
            userImage: imageToSend || undefined,
            botMessage: '',
            suggestions: [],
            confidence: 1,
            timestamp: new Date().toISOString()
        })

        try {
            // First, if no conversationId, we should ideally create one for history
            if (!hybridManager.conversationId) {
                // We'll create a conversation for AI history if it doesn't exist
                await hybridManager.connectToAgent(); // This creates a conv and saves to storage
            }

            // Save user message to firebase history (Optimistic)
            hybridManager.saveMessageToFirebase(messageToSend, 'USER', imageToSend ? { fileUrl: imageToSend } : undefined);

            // ── Try SSE Streaming first (text-only, no image) ──
            // Stream for ALL text messages (customer + admin). Only images need JSON fallback.
            const canStream = !imageToSend

            if (canStream) {
                // Build conversation history from recent messages
                const recentHistory = messages.slice(-4).flatMap(m => {
                    const entries: { role: string; content: string }[] = []
                    if (m.userMessage && m.userMessage !== 'hello' && m.userMessage !== 'admin_hello') {
                        entries.push({ role: 'user', content: m.userMessage })
                    }
                    if (m.botMessage) {
                        entries.push({ role: 'assistant', content: m.botMessage })
                    }
                    return entries
                })

                const streamRes = await fetch('/api/chatbot/stream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: messageToSend,
                        customerId,
                        sessionId: hybridManager.conversationId || sessionId,
                        userRole: user?.role || 'CUSTOMER',
                        isAdmin: !!isAdmin,
                        context: { currentPage: window.location.pathname },
                        conversationHistory: recentHistory
                    }),
                    signal: controller.signal
                })

                // Check if SSE stream or JSON response
                const contentType = streamRes.headers.get('content-type') || ''

                if (contentType.includes('text/event-stream') && streamRes.body) {
                    // ── SSE Stream Mode ──
                    setIsStreaming(true)
                    setIsLoading(false) // Hide typing indicator, show streaming text

                    const reader = streamRes.body.getReader()
                    const decoder = new TextDecoder()
                    let accumulatedText = ''
                    let suggestions: string[] = []

                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        const chunk = decoder.decode(value, { stream: true })
                        const lines = chunk.split('\n')

                        for (const line of lines) {
                            if (!line.startsWith('data: ')) continue
                            try {
                                const payload = JSON.parse(line.slice(6))

                                if (payload.type === 'token') {
                                    accumulatedText += payload.content
                                    setStreamingText(accumulatedText)
                                    // Update the temporary message with streaming text
                                    setMessages(prev => prev.map(m => m.id === tempId ? {
                                        ...m,
                                        botMessage: accumulatedText
                                    } : m))
                                } else if (payload.type === 'suggestions') {
                                    suggestions = payload.content || []
                                    setMessages(prev => prev.map(m => m.id === tempId ? {
                                        ...m,
                                        suggestions
                                    } : m))
                                } else if (payload.type === 'done') {
                                    const finalData = payload.content
                                    setMessages(prev => prev.map(m => m.id === tempId ? {
                                        ...m,
                                        botMessage: finalData.response || accumulatedText,
                                        suggestions: finalData.suggestions || suggestions,
                                        confidence: finalData.confidence || 0.9,
                                        timestamp: finalData.timestamp || new Date().toISOString()
                                    } : m))

                                    // Cache final message to IndexedDB
                                    updateCachedMessage(tempId, {
                                        botMessage: finalData.response || accumulatedText,
                                        suggestions: finalData.suggestions || suggestions,
                                        confidence: finalData.confidence || 0.9
                                    })

                                    // Save bot response to firebase
                                    hybridManager.saveMessageToFirebase(finalData.response || accumulatedText, 'AI')
                                } else if (payload.type === 'error') {
                                    setMessages(prev => prev.map(m => m.id === tempId ? {
                                        ...m,
                                        botMessage: payload.content || 'Lỗi kết nối.',
                                        suggestions: ['Thử lại'],
                                        confidence: 0
                                    } : m))
                                }
                            } catch { /* skip malformed line */ }
                        }
                    }

                    setIsStreaming(false)
                    setStreamingText('')
                    setErrorRetryCount(0)
                } else {
                    // ── JSON Fallback (quick responses, rule-based) ──
                    const data = await streamRes.json()
                    if (data.success) {
                        setMessages(prev => prev.map(m => m.id === tempId ? {
                            ...m,
                            botMessage: data.data.message || data.data.response,
                            suggestions: data.data.suggestions || [],
                            confidence: data.data.confidence || 1,
                            timestamp: data.data.timestamp || new Date().toISOString()
                        } : m))

                        updateCachedMessage(tempId, {
                            botMessage: data.data.message || data.data.response,
                            suggestions: data.data.suggestions || [],
                            confidence: data.data.confidence || 1
                        })

                        hybridManager.saveMessageToFirebase(data.data.message || data.data.response, 'AI')
                        setErrorRetryCount(0)
                    }
                }
            } else {
                // ── Original non-streaming path (images, admin, flows) ──
                const response = await fetch('/api/chatbot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: messageToSend || undefined,
                        image: imageToSend || undefined,
                        customerId,
                        sessionId: hybridManager.conversationId || sessionId,
                        userRole: user?.role || 'CUSTOMER',
                        isAdmin: isAdmin,
                        context: {
                            currentPage: window.location.pathname,
                        }
                    }),
                    signal: controller.signal
                })

                const data = await response.json()
                if (data.success) {
                    // Update the temporary message with actual data instead of adding a new one
                    setMessages(prev => prev.map(m => m.id === tempId ? {
                        ...m,
                        botMessage: data.data.message,
                        suggestions: data.data.suggestions || [],
                        productRecommendations: data.data.productRecommendations || [],
                        confidence: data.data.confidence || 0,
                        timestamp: data.data.timestamp || new Date().toISOString(),
                        ocrData: data.data.ocrData,
                        calculationData: data.data.calculationData,
                        orderData: data.data.orderData,
                        data: data.data.data
                    } : m))

                    setErrorRetryCount(0)

                    // Cache to IndexedDB
                    updateCachedMessage(tempId, {
                        botMessage: data.data.message,
                        suggestions: data.data.suggestions || [],
                        confidence: data.data.confidence || 0
                    })

                    // Save bot response to firebase history
                    hybridManager.saveMessageToFirebase(data.data.message, 'AI');

                    if (data.data.ocrData) {
                        setPendingOCRData(data.data.ocrData)
                        setShowOCRPreview(true)
                    }

                    if (data.data.orderData) {
                        setPendingOrderData(data.data.orderData)
                        setShowOrderSummary(true)
                    }
                } else {
                    setIsError(true)
                    setMessages(prev => prev.map(m => m.id === tempId ? {
                        ...m,
                        botMessage: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau.',
                        suggestions: ['Thử lại', 'Gặp nhân viên hỗ trợ'],
                        confidence: 1,
                        timestamp: new Date().toISOString()
                    } : m))
                    toast.error(data.error?.message || 'Failed to get response from chatbot')
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Chatbot request was aborted')
                return // Exit silently
            }
            console.error('Chatbot error:', error)
            setIsError(true)
            // Update the temporary message with connection error
            setMessages(prev => prev.map(m => m.id === tempId ? {
                ...m,
                botMessage: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
                suggestions: ['Thử lại'],
                confidence: 1,
                timestamp: new Date().toISOString()
            } : m))
            toast.error('Lỗi mạng. Vui lòng kiểm tra kết nối của bạn.')
        } finally {
            setIsLoading(false)
            setIsStreaming(false)
            setStreamingText('')
            setAbortController(null)
        }
    }

    const stopResponse = () => {
        if (abortController) {
            abortController.abort()
            setAbortController(null)
            setIsLoading(false)
            // Fix the last message state
            setMessages(prev => prev.map((m, i) =>
                (i === prev.length - 1 && !m.botMessage)
                    ? { ...m, botMessage: '⏹️ Đã dừng phản hồi.' }
                    : m
            ))
            toast.success('Đã dừng AI')
        }
    }

    const regenerateResponse = () => {
        // Find the most recent message that has a userMessage
        const lastUserMsg = [...messages].reverse().find(m => m.userMessage && m.userMessage !== 'hello' && m.userMessage !== 'admin_hello')
        if (lastUserMsg) {
            sendMessage(lastUserMsg.userMessage, false)
        } else {
            toast.error('Không tìm thấy yêu cầu trước đó để tạo lại.')
        }
    }

    const retryLastMessage = () => {
        if (messages.length > 0) {
            const lastUserMessage = messages[messages.length - 1].userMessage
            setMessages(prev => prev.slice(0, -1))
            sendMessage(lastUserMessage)
        }
    }

    const handleSuggestionClick = async (suggestion: string, message?: ChatMessage) => {
        // Handle "Xem chi tiết" or "Xem đơn hàng" for orders
        if ((suggestion === 'Xem chi tiết' || suggestion === 'Xem đơn hàng') && message?.orderData) {
            if (message.orderData.trackingUrl) {
                window.location.href = message.orderData.trackingUrl
            } else if (message.orderData.orderNumber) {
                window.location.href = `/order-tracking?orderNumber=${message.orderData.orderNumber}`
            }
            return
        }

        // Handle "Lưu mã đơn"
        if (suggestion === 'Lưu mã đơn' && message?.orderData?.orderNumber) {
            const orderNumber = message.orderData.orderNumber
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(orderNumber)
                toast.success(`Đã sao chép mã đơn: ${orderNumber}`)
            } else {
                toast.success(`Mã đơn hàng: ${orderNumber}`)
            }
            return
        }

        // Handle "Xem tất cả đơn"
        if (suggestion === 'Xem tất cả đơn' || suggestion.toLowerCase().includes('tất cả đơn')) {
            sendMessage('Tất cả đơn hàng')
            return
        }

        // Handle "Chi tiết hơn"
        if (suggestion === 'Chi tiết hơn' || suggestion.toLowerCase().includes('chi tiết')) {
            if (message?.data) {
                showDetailedReport(message.data, message)
                return
            }
            const lastAnalyticsMessage = messages.findLast(m => m.data && m.data.dateRange)
            if (lastAnalyticsMessage?.data) {
                showDetailedReport(lastAnalyticsMessage.data, lastAnalyticsMessage)
                return
            }
            toast('Đang tải dữ liệu báo cáo...')
            sendMessage(suggestion)
            return
        }

        // Handle "Xuất báo cáo"
        if (suggestion === 'Xuất báo cáo' || suggestion.toLowerCase().includes('xuất báo cáo')) {
            if (message?.data) {
                await exportReport(message.data)
                return
            }
            const lastAnalyticsMessage = messages.findLast(m => m.data && m.data.dateRange)
            if (lastAnalyticsMessage?.data) {
                await exportReport(lastAnalyticsMessage.data)
                return
            }
            toast('Đang tải dữ liệu báo cáo...')
            sendMessage(suggestion)
            return
        }

        if (suggestion === 'Gặp nhân viên hỗ trợ' || suggestion === 'Liên hệ hỗ trợ') {
            handleConnectSupport()
            return
        }

        sendMessage(suggestion)
    }

    const showDetailedReport = async (reportData: ReportData, sourceMessage: ChatMessage) => {
        try {
            if (!reportData.dateRange) {
                toast.error('Không có dữ liệu chi tiết')
                return
            }

            const from = reportData.dateRange.from instanceof Date
                ? reportData.dateRange.from
                : new Date(reportData.dateRange.from)
            const to = reportData.dateRange.to instanceof Date
                ? reportData.dateRange.to
                : new Date(reportData.dateRange.to)

            const params = new URLSearchParams({
                startDate: from.toISOString(),
                endDate: to.toISOString()
            })

            toast.loading('Đang tải chi tiết...', { id: 'detailed-report' })

            const response = await fetch(`/api/reports/analytics/detailed?${params}`)

            if (response.ok) {
                const result = await response.json()
                const detailedData = result.data || result

                let detailedMessage = `📊 **Báo Cáo Chi Tiết**\n\n`
                detailedMessage += `📅 **Thời gian:** ${from.toLocaleDateString('vi-VN')} - ${to.toLocaleDateString('vi-VN')}\n\n`

                if (detailedData.orders && detailedData.orders.length > 0) {
                    detailedMessage += `📦 **Danh Sách Đơn Hàng (${detailedData.orders.length} đơn):**\n\n`

                    detailedData.orders.slice(0, 10).forEach((order: Record<string, unknown>, idx: number) => {
                        const customerType = order.customerType as string
                        const guestName = order.guestName as string
                        const customer = order.customer as { user?: { name?: string } } | undefined
                        const customerName = customerType === 'GUEST'
                            ? guestName
                            : customer?.user?.name || 'N/A'

                        const statusMap: Record<string, string> = {
                            'PENDING': 'Chờ xử lý',
                            'CONFIRMED': 'Đã xác nhận',
                            'PROCESSING': 'Đang xử lý',
                            'SHIPPED': 'Đang giao',
                            'DELIVERED': 'Đã giao',
                            'CANCELLED': 'Đã hủy'
                        }
                        const status = order.status as string
                        const statusLabel = statusMap[status] || status
                        const orderNumber = order.orderNumber as string
                        const netAmount = order.netAmount as number
                        const paymentMethod = order.paymentMethod as string
                        const createdAt = order.createdAt as string

                        detailedMessage += `${idx + 1}. **${orderNumber}**\n`
                        detailedMessage += `   👤 ${customerName}\n`
                        detailedMessage += `   💰 ${netAmount.toLocaleString('vi-VN')}đ\n`
                        detailedMessage += `   📦 ${statusLabel} | ${paymentMethod || 'N/A'}\n`
                        detailedMessage += `   📅 ${new Date(createdAt).toLocaleDateString('vi-VN')}\n\n`
                    })

                    if (detailedData.orders.length > 10) {
                        detailedMessage += `... và ${detailedData.orders.length - 10} đơn hàng khác\n\n`
                    }
                }

                if (detailedData.topProducts && detailedData.topProducts.length > 0) {
                    detailedMessage += `🏆 **Top Sản Phẩm Bán Chạy:**\n\n`
                    detailedData.topProducts.slice(0, 5).forEach((product: Record<string, unknown>, idx: number) => {
                        const name = product.name as string
                        const quantity = product.quantity as number
                        const unit = product.unit as string
                        const revenue = product.revenue as number

                        detailedMessage += `${idx + 1}. **${name}**\n`
                        detailedMessage += `   📦 ${quantity} ${unit}\n`
                        detailedMessage += `   💰 ${revenue.toLocaleString('vi-VN')}đ\n\n`
                    })
                }

                detailedMessage += `\n💡 Nhấn "Xuất báo cáo" để tải file Excel chi tiết!`

                const detailedChatMessage: ChatMessage = {
                    id: Date.now().toString(),
                    userMessage: 'Chi tiết hơn',
                    botMessage: detailedMessage,
                    suggestions: ['Xuất báo cáo', 'So sánh kỳ trước', 'Trở lại'],
                    confidence: 1.0,
                    timestamp: new Date().toISOString(),
                    data: reportData
                }

                setMessages(prev => [...prev, detailedChatMessage])
                toast.success('Đã tải chi tiết báo cáo!', { id: 'detailed-report' })
            } else {
                const errorData = await response.json()
                toast.error(errorData.error || 'Không thể tải chi tiết', { id: 'detailed-report' })
            }
        } catch (error) {
            console.error('Error loading detailed report:', error)
            toast.error('Lỗi khi tải chi tiết. Vui lòng thử lại.', { id: 'detailed-report' })
        }
    }

    const exportReport = async (reportData: ReportData) => {
        try {
            if (!reportData.dateRange) {
                toast.error('Không có dữ liệu báo cáo để xuất')
                return
            }

            const from = reportData.dateRange.from instanceof Date
                ? reportData.dateRange.from
                : new Date(reportData.dateRange.from)
            const to = reportData.dateRange.to instanceof Date
                ? reportData.dateRange.to
                : new Date(reportData.dateRange.to)

            const params = new URLSearchParams({
                startDate: from.toISOString(),
                endDate: to.toISOString(),
                format: 'excel'
            })

            toast.loading('Đang xuất báo cáo...', { id: 'export-report' })

            const response = await fetch(`/api/reports/analytics/export?${params}`)

            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                const dateStr = `${from.toISOString().split('T')[0]}_${to.toISOString().split('T')[0]}`
                a.download = `bao-cao-doanh-thu-${dateStr}.xlsx`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast.success('Đã xuất báo cáo thành công!', { id: 'export-report' })
            } else {
                const errorData = await response.json()
                toast.error(errorData.error || 'Không thể xuất báo cáo', { id: 'export-report' })
            }
        } catch (error) {
            console.error('Error exporting report:', error)
            toast.error('Lỗi khi xuất báo cáo. Vui lòng thử lại.', { id: 'export-report' })
        }
    }

    const handleSendMessage = () => {
        sendMessage('', true)
    }

    // Floating Button (Closed State)
    // Final Render logic using Fragment for global elements
    return (
        <>
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className={`
          fixed bottom-6 right-6 z-50 group
          w-16 h-16 rounded-full
          bg-white border-2 border-gray-100
          shadow-xl hover:shadow-2xl
          transition-all duration-300
          hover:scale-110 active:scale-95
          overflow-hidden
        `}
                    aria-label="Mở chat hỗ trợ"
                >
                    {/* Glow effect */}
                    <div className={`
          absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
          ${isAdmin
                            ? 'bg-gradient-to-r from-purple-400/30 to-blue-400/30'
                            : 'bg-gradient-to-r from-blue-400/30 to-cyan-400/30'
                        }
        `} />

                    {/* Pulse ring */}
                    <div className={`
          absolute inset-0 rounded-full animate-ping opacity-25
          ${isAdmin ? 'bg-purple-500' : (chatMode === 'HUMAN' ? 'bg-green-500' : 'bg-blue-500')}
        `} style={{ animationDuration: '2s' }} />

                    {/* Avatar */}
                    <img
                        src={chatMode === 'HUMAN' ? "/images/support_agent.png" : "/images/smartbuild_bot.png"}
                        alt="Chatbot"
                        className="w-full h-full object-cover relative z-10"
                    />

                    {/* Online badge */}
                    <div className="absolute -top-1 -right-1 z-20">
                        <div className="relative flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white" />
                        </div>
                    </div>

                    {/* Sparkle icon */}
                    <div className={`
          absolute bottom-0 right-0 z-20
          w-6 h-6 rounded-full flex items-center justify-center
          ${isAdmin
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        }
          shadow-lg
        `}>
                        <Sparkles className="w-3 h-3 text-white" />
                    </div>
                </button>
            ) : (
                <div
                    className={`
                fixed bottom-6 right-6 z-50
                ${isExpanded
                            ? 'w-full h-full sm:w-[500px] sm:h-[700px] sm:max-h-[90vh]'
                            : 'w-[380px] h-[600px] max-h-[calc(100vh-100px)]'
                        }
                bg-white
                rounded-2xl
                shadow-[0_20px_50px_rgba(0,0,0,0.15)]
                flex flex-col 
                overflow-hidden
                border border-gray-100
                animate-fadeIn
            `}
                >
                    {/* Video Call Manager - Always mounted but hidden until needed */}
                    {myIdentity && (
                        <ChatCallManager
                            userId={myIdentity.id}
                            userName={myIdentity.name}
                            listenAdminSupport={false}
                        />
                    )}

                    {/* Header - Hidden when viewing large image to focus on content */}
                    {!lightboxImage && (
                        <ChatHeader
                            isAdmin={isAdmin}
                            isExpanded={isExpanded}
                            isHuman={chatMode === 'HUMAN'}
                            onSwitchToAI={handleSwitchToAI}
                            onClose={() => {
                                if (onClose) {
                                    onClose() // Embedded mode - call parent's close handler
                                } else {
                                    setIsOpen(false) // Standalone mode - just close
                                }
                            }}
                            onToggleExpand={() => setIsExpanded(!isExpanded)}
                        />
                    )}

                    {/* Messages Area */}
                    <div
                        ref={chatContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0 bg-slate-50 scroll-smooth"
                    >
                        {/* Welcome Screen */}
                        {messages.length === 0 && !isLoading && (
                            <WelcomeScreen
                                isAdmin={isAdmin}
                                onConnectSupport={handleConnectSupport}
                                onSuggestionClick={(text) => sendMessage(text)}
                            />
                        )}

                        {/* Messages */}
                        {messages.map((message, index) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                isAdmin={isAdmin}
                                onSuggestionClick={handleSuggestionClick}
                                isLoading={isLoading}
                                onImageClick={setLightboxImage}
                                isLast={index === messages.length - 1}
                            />
                        ))}

                        {/* Typing Indicator — only show when loading and NOT streaming */}
                        {isLoading && !isStreaming && <TypingIndicator isAdmin={isAdmin} />}

                        {/* Live Typing Indicator for HUMAN mode */}
                        {chatMode === 'HUMAN' && hybridManager.conversationId && myIdentity && (
                            <LiveTypingIndicator
                                conversationId={hybridManager.conversationId}
                                myUserId={myIdentity.id}
                            />
                        )}

                        {/* Stop Response Button (2026 AI UX) */}
                        {isLoading && chatMode === 'AI' && abortController && (
                            <div className="flex justify-center sticky bottom-2 z-20 animate-fadeIn">
                                <button
                                    onClick={stopResponse}
                                    className="bg-white/80 backdrop-blur-md border border-red-200 text-red-600 px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-red-50 flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    Dừng phản hồi AI
                                </button>
                            </div>
                        )}

                        {/* Regenerate Button (Shows only for the last AI message if not loading) */}
                        {!isLoading && chatMode === 'AI' && messages.length > 0 && messages[messages.length - 1].botMessage && (
                            <div className="flex justify-start pl-14 animate-fadeIn">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        regenerateResponse();
                                    }}
                                    className="text-[11px] text-blue-600 font-bold flex items-center gap-1.5 hover:text-blue-700 transition-colors opacity-80 hover:opacity-100"
                                >
                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                                        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                                    </svg>
                                    Tạo lại câu trả lời
                                </button>
                            </div>
                        )}

                        {/* Error Message */}
                        {isError && (
                            <ErrorMessage
                                onRetry={retryLastMessage}
                                isLoading={isLoading}
                                retryCount={errorRetryCount}
                            />
                        )}

                        {/* OCR Preview */}
                        {showOCRPreview && pendingOCRData && (
                            <div className="mt-4">
                                <ChatOCRPreview
                                    invoiceNumber={pendingOCRData.invoiceNumber}
                                    invoiceDate={pendingOCRData.invoiceDate ? new Date(pendingOCRData.invoiceDate) : undefined}
                                    supplierName={pendingOCRData.supplierName}
                                    items={pendingOCRData.items || []}
                                    totalAmount={pendingOCRData.totalAmount}
                                    confidence={pendingOCRData.confidence || 0}
                                    onConfirm={() => {
                                        sendMessage('Xác nhận lưu')
                                        setShowOCRPreview(false)
                                    }}
                                    onEdit={() => {
                                        setShowOCRPreview(false)
                                        toast('Chức năng chỉnh sửa đang được phát triển')
                                    }}
                                    onCancel={() => {
                                        sendMessage('Hủy')
                                        setShowOCRPreview(false)
                                        setPendingOCRData(null)
                                    }}
                                />
                            </div>
                        )}

                        {/* Order Summary */}
                        {showOrderSummary && pendingOrderData && (
                            <div className="mt-4">
                                <ChatOrderSummary
                                    items={pendingOrderData.items || []}
                                    customerInfo={pendingOrderData.customerInfo}
                                    paymentMethod={pendingOrderData.paymentMethod}
                                    deliveryMethod={pendingOrderData.deliveryMethod}
                                    totalAmount={pendingOrderData.totalAmount}
                                    onConfirm={() => {
                                        sendMessage('Xác nhận đặt hàng')
                                        setShowOrderSummary(false)
                                    }}
                                    onEdit={() => {
                                        setShowOrderSummary(false)
                                        toast('Chức năng chỉnh sửa đang được phát triển')
                                    }}
                                    onCancel={() => {
                                        sendMessage('Hủy đơn hàng')
                                        setShowOrderSummary(false)
                                        setPendingOrderData(null)
                                    }}
                                />
                            </div>
                        )}

                        {/* Confirm Dialog */}
                        {showConfirmDialog && confirmDialogData && (
                            <div className="mt-4">
                                <ChatConfirmDialog
                                    type={confirmDialogData.type || 'info'}
                                    title={confirmDialogData.title}
                                    message={confirmDialogData.message}
                                    confirmText={confirmDialogData.confirmText}
                                    cancelText={confirmDialogData.cancelText}
                                    onConfirm={() => {
                                        if (confirmDialogData.onConfirm) {
                                            confirmDialogData.onConfirm()
                                        }
                                        setShowConfirmDialog(false)
                                        setConfirmDialogData(null)
                                    }}
                                    onCancel={() => {
                                        if (confirmDialogData.onCancel) {
                                            confirmDialogData.onCancel()
                                        }
                                        setShowConfirmDialog(false)
                                        setConfirmDialogData(null)
                                    }}
                                />
                            </div>
                        )}

                        {/* Scroll anchor */}
                        <div ref={messagesEndRef} />
                    </div>


                    {/* Input Area */}
                    <ChatInput
                        currentMessage={currentMessage}
                        setCurrentMessage={setCurrentMessage}
                        selectedImage={selectedImage}
                        setSelectedImage={setSelectedImage}
                        isLoading={isLoading}
                        onSendMessage={handleSendMessage}
                        isAdmin={isAdmin}
                        onConnectSupport={handleConnectSupport}
                        isHumanMode={chatMode === 'HUMAN'}
                    />
                </div>
            )}

            {/* Global Lightbox - Outside the main container to avoid z-index/overflow issues */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-black/5 backdrop-blur-[1px] animate-fadeIn"
                    onClick={() => setLightboxImage(null)}
                >
                    {/* Floating Close Button */}
                    <div className="absolute top-10 right-10 z-[1000001]">
                        <button
                            className="bg-white text-gray-900 p-4 rounded-full shadow-2xl border-2 border-gray-200 hover:bg-gray-50 transition-all hover:scale-110 active:scale-95"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxImage(null);
                            }}
                        >
                            <X className="w-8 h-8" />
                        </button>
                    </div>

                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={lightboxImage}
                            alt="Full view"
                            className="max-w-[95%] max-h-[85vh] object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.3)] border-8 border-white animate-scaleIn"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </>
    )
}
