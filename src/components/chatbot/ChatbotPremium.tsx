'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Sparkles } from 'lucide-react'
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

// Types
import {
    ChatMessage,
    ChatbotProps,
    OCRData,
    OrderData,
    ReportData,
    ConfirmDialogData
} from './types'

export default function ChatbotPremium({ customerId, onClose }: ChatbotProps) {
    const { user, isAuthenticated } = useAuth()
    const pathname = usePathname()

    // UI State - Start open if onClose is provided (embedded mode)
    const [isOpen, setIsOpen] = useState(!!onClose)
    const [isExpanded, setIsExpanded] = useState(false)

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [currentMessage, setCurrentMessage] = useState('')
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isError, setIsError] = useState(false)
    const [errorRetryCount, setErrorRetryCount] = useState(0)
    const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

    // Feature State
    const [showOrderSummary, setShowOrderSummary] = useState(false)
    const [showOCRPreview, setShowOCRPreview] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [confirmDialogData, setConfirmDialogData] = useState<ConfirmDialogData | null>(null)
    const [pendingOrderData, setPendingOrderData] = useState<OrderData | null>(null)
    const [pendingOCRData, setPendingOCRData] = useState<OCRData | null>(null)

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Check if user is admin/manager
    const isAdminRoute = pathname?.startsWith('/admin') ?? false
    const isAdminByRole = isAuthenticated && user && (user.role === 'MANAGER' || user.role === 'EMPLOYEE')
    const isAdmin = isAdminRoute || !!isAdminByRole

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
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        if (!shouldHideChatbot) {
            scrollToBottom()
        }
    }, [messages, shouldHideChatbot])

    useEffect(() => {
        if (!shouldHideChatbot && isOpen && messages.length === 0) {
            const timer = setTimeout(() => {
                const welcomeMsg = isAdmin ? 'admin_hello' : 'hello'
                sendMessage(welcomeMsg)
            }, 100)
            return () => clearTimeout(timer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, isAdmin, messages.length, shouldHideChatbot])

    if (shouldHideChatbot) {
        return null
    }

    const sendMessage = async (message: string, useCurrentMessage = false) => {
        const messageToSend = useCurrentMessage ? currentMessage : message
        const imageToSend = selectedImage

        if (!messageToSend.trim() && !imageToSend) return

        setCurrentMessage('')
        setSelectedImage(null)
        setIsLoading(true)
        setIsError(false)

        try {
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageToSend || undefined,
                    image: imageToSend || undefined,
                    customerId,
                    sessionId,
                    userRole: user?.role || 'CUSTOMER',
                    isAdmin: isAdmin,
                    context: {
                        currentPage: window.location.pathname,
                    }
                })
            })

            const data = await response.json()
            if (data.success) {
                const newMessage: ChatMessage = {
                    id: Date.now().toString(),
                    userMessage: messageToSend,
                    userImage: imageToSend || undefined,
                    botMessage: data.data.message,
                    suggestions: data.data.suggestions || [],
                    productRecommendations: data.data.productRecommendations || [],
                    confidence: data.data.confidence || 0,
                    timestamp: data.data.timestamp,
                    ocrData: data.data.ocrData,
                    calculationData: data.data.calculationData,
                    orderData: data.data.orderData,
                    data: data.data.data
                }

                setMessages(prev => [...prev, newMessage])
                setErrorRetryCount(0)

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
                const errorMessage: ChatMessage = {
                    id: Date.now().toString(),
                    userMessage: messageToSend,
                    botMessage: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau.',
                    suggestions: ['Thử lại', 'Liên hệ hỗ trợ'],
                    confidence: 1,
                    timestamp: new Date().toISOString()
                }
                setMessages(prev => [...prev, errorMessage])
                toast.error(data.error?.message || 'Failed to get response from chatbot')
            }
        } catch (error) {
            console.error('Chatbot error:', error)
            setIsError(true)
            const errorMessage: ChatMessage = {
                id: Date.now().toString(),
                userMessage: messageToSend,
                botMessage: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
                suggestions: ['Thử lại'],
                confidence: 1,
                timestamp: new Date().toISOString()
            }
            setMessages(prev => [...prev, errorMessage])
            toast.error('Network error. Please check your connection.')
        } finally {
            setIsLoading(false)
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
    if (!isOpen) {
        return (
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
          ${isAdmin ? 'bg-purple-500' : 'bg-blue-500'}
        `} style={{ animationDuration: '2s' }} />

                {/* Avatar */}
                <img
                    src="/images/smartbuild_bot.png"
                    alt="SmartBuild AI"
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
        )
    }

    // Chat Window (Open State)
    return (
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
            {/* Header */}
            <ChatHeader
                isAdmin={isAdmin}
                isExpanded={isExpanded}
                onClose={() => {
                    if (onClose) {
                        onClose() // Embedded mode - call parent's close handler
                    } else {
                        setIsOpen(false) // Standalone mode - just close
                    }
                }}
                onToggleExpand={() => setIsExpanded(!isExpanded)}
            />

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50">
                {/* Welcome Screen */}
                {messages.length === 0 && !isLoading && (
                    <WelcomeScreen isAdmin={isAdmin} />
                )}

                {/* Messages */}
                {messages.map((message) => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        isAdmin={isAdmin}
                        onSuggestionClick={handleSuggestionClick}
                        isLoading={isLoading}
                    />
                ))}

                {/* Typing Indicator */}
                {isLoading && <TypingIndicator isAdmin={isAdmin} />}

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
            />
        </div>
    )
}
