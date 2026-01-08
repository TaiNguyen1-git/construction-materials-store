'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, Send, Bot, ShoppingCart, AlertCircle, RefreshCw, Camera, Image as ImageIcon, BarChart3, Package, Users, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import ChatOrderSummary from './ChatOrderSummary'
import ChatConfirmDialog from './ChatConfirmDialog'
import ChatOCRPreview from './ChatOCRPreview'

interface ChatMessage {
  id: string
  userMessage: string
  userImage?: string // Base64 image uploaded by user
  botMessage: string
  suggestions: string[]
  productRecommendations?: any[]
  confidence: number
  timestamp: string
  // New fields for enhanced features
  ocrData?: any
  calculationData?: any
  orderData?: any
  data?: any // Report/analytics data
  requiresConfirmation?: boolean
}

interface ChatbotProps {
  customerId?: string
}

export default function Chatbot({ customerId }: ChatbotProps) {
  const { user, isAuthenticated } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorRetryCount, setErrorRetryCount] = useState(0)
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // New state for enhanced features
  const [showOrderSummary, setShowOrderSummary] = useState(false)
  const [showOCRPreview, setShowOCRPreview] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmDialogData, setConfirmDialogData] = useState<any>(null)
  const [pendingOrderData, setPendingOrderData] = useState<any>(null)
  const [pendingOCRData, setPendingOCRData] = useState<any>(null)

  // Check if user is admin/manager
  // Check both user role AND pathname to handle reload cases
  const isAdminRoute = pathname?.startsWith('/admin')
  const isAdminByRole = isAuthenticated && user && (user.role === 'MANAGER' || user.role === 'EMPLOYEE')
  const isAdmin = isAdminRoute || isAdminByRole

  // ===== CHATBOT VISIBILITY LOGIC =====
  // Hide chatbot on auth pages, checkout flow, static pages, and marketplace
  const hiddenPages = [
    // Auth pages
    '/login',
    '/register',
    '/forgot-password',
    // Contractor auth/landing
    '/contractor',
    '/contractor/login',
    '/contractor/register',
    // Checkout flow (user needs focus)
    '/cart',
    '/checkout',
    '/order-tracking',
    '/wishlist',
    // Static/info pages
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    // Marketplace & AI tool (has own UI)
    '/estimator',
    '/contractors',
    '/projects',
  ]

  const shouldHideChatbot = hiddenPages.some(page =>
    pathname === page || pathname?.startsWith(page + '/')
  )

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
      // Send welcome message with role context
      // Wait a bit for auth state to initialize on reload
      const timer = setTimeout(() => {
        const welcomeMsg = isAdmin ? 'admin_hello' : 'hello'
        sendMessage(welcomeMsg)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isAdmin, messages.length, shouldHideChatbot])

  if (shouldHideChatbot) {
    return null
  }

  const sendMessage = async (message: string, useCurrentMessage = false) => {
    const messageToSend = useCurrentMessage ? currentMessage : message
    const imageToSend = selectedImage

    // Must have either message or image
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
          data: data.data.data // Store analytics/report data for export
        }

        setMessages(prev => [...prev, newMessage])
        setErrorRetryCount(0)

        // Handle special responses
        if (data.data.ocrData) {
          setPendingOCRData(data.data.ocrData)
          setShowOCRPreview(true)
        }

        if (data.data.orderData) {
          setPendingOrderData(data.data.orderData)
          setShowOrderSummary(true)
        }
      } else {
        // Error fallback
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
      // Remove the error message
      setMessages(prev => prev.slice(0, -1))
      // Resend the message
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

    // Handle "Lưu mã đơn" - show order number
    if (suggestion === 'Lưu mã đơn' && message?.orderData?.orderNumber) {
      const orderNumber = message.orderData.orderNumber
      // Copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(orderNumber)
        toast.success(`Đã sao chép mã đơn: ${orderNumber}`)
      } else {
        toast.success(`Mã đơn hàng: ${orderNumber}`)
      }
      return
    }

    // Handle "Xem tất cả đơn" - show all orders
    if (suggestion === 'Xem tất cả đơn' || suggestion.toLowerCase().includes('tất cả đơn')) {
      sendMessage('Tất cả đơn hàng')
      return
    }

    // Handle "Chi tiết hơn" - show detailed report
    if (suggestion === 'Chi tiết hơn' || suggestion.toLowerCase().includes('chi tiết')) {
      if (message?.data) {
        showDetailedReport(message.data, message)
        return
      }
      // If no data, try to get from last analytics message
      const lastAnalyticsMessage = messages.findLast(m => m.data && m.data.dateRange)
      if (lastAnalyticsMessage?.data) {
        showDetailedReport(lastAnalyticsMessage.data, lastAnalyticsMessage)
        return
      }
      // Fallback: send as message to get data
      toast('Đang tải dữ liệu báo cáo...')
      sendMessage(suggestion)
      return
    }

    // Handle "Xuất báo cáo" - export report as file
    if (suggestion === 'Xuất báo cáo' || suggestion.toLowerCase().includes('xuất báo cáo')) {
      if (message?.data) {
        await exportReport(message.data)
        return
      }
      // If no data, try to get from last analytics message
      const lastAnalyticsMessage = messages.findLast(m => m.data && m.data.dateRange)
      if (lastAnalyticsMessage?.data) {
        await exportReport(lastAnalyticsMessage.data)
        return
      }
      // Fallback: send as message to get data
      toast('Đang tải dữ liệu báo cáo...')
      sendMessage(suggestion)
      return
    }

    // Default: send as message
    sendMessage(suggestion)
  }

  const showDetailedReport = async (reportData: any, sourceMessage: ChatMessage) => {
    try {
      if (!reportData.dateRange) {
        toast.error('Không có dữ liệu chi tiết')
        return
      }

      // Ensure from and to are Date objects
      const from = reportData.dateRange.from instanceof Date
        ? reportData.dateRange.from
        : new Date(reportData.dateRange.from)
      const to = reportData.dateRange.to instanceof Date
        ? reportData.dateRange.to
        : new Date(reportData.dateRange.to)

      // Fetch detailed orders data
      const params = new URLSearchParams({
        startDate: from.toISOString(),
        endDate: to.toISOString()
      })

      toast.loading('Đang tải chi tiết...', { id: 'detailed-report' })

      const response = await fetch(`/api/reports/analytics/detailed?${params}`)

      if (response.ok) {
        const result = await response.json()
        const detailedData = result.data || result

        // Format detailed message
        let detailedMessage = `📊 **Báo Cáo Chi Tiết**\n\n`
        detailedMessage += `📅 **Thời gian:** ${from.toLocaleDateString('vi-VN')} - ${to.toLocaleDateString('vi-VN')}\n\n`

        if (detailedData.orders && detailedData.orders.length > 0) {
          detailedMessage += `📦 **Danh Sách Đơn Hàng (${detailedData.orders.length} đơn):**\n\n`

          detailedData.orders.slice(0, 10).forEach((order: any, idx: number) => {
            const customerName = order.customerType === 'GUEST'
              ? order.guestName
              : order.customer?.user?.name || 'N/A'

            const statusMap: Record<string, string> = {
              'PENDING': 'Chờ xử lý',
              'CONFIRMED': 'Đã xác nhận',
              'PROCESSING': 'Đang xử lý',
              'SHIPPED': 'Đang giao',
              'DELIVERED': 'Đã giao',
              'CANCELLED': 'Đã hủy'
            }
            const statusLabel = statusMap[order.status as string] || order.status
            detailedMessage += `${idx + 1}. **${order.orderNumber}**\n`
            detailedMessage += `   👤 ${customerName}\n`
            detailedMessage += `   💰 ${order.netAmount.toLocaleString('vi-VN')}đ\n`
            detailedMessage += `   📦 ${statusLabel} | ${order.paymentMethod || 'N/A'}\n`
            detailedMessage += `   📅 ${new Date(order.createdAt).toLocaleDateString('vi-VN')}\n\n`
          })

          if (detailedData.orders.length > 10) {
            detailedMessage += `... và ${detailedData.orders.length - 10} đơn hàng khác\n\n`
          }
        }

        if (detailedData.topProducts && detailedData.topProducts.length > 0) {
          detailedMessage += `🏆 **Top Sản Phẩm Bán Chạy:**\n\n`
          detailedData.topProducts.slice(0, 5).forEach((product: any, idx: number) => {
            detailedMessage += `${idx + 1}. **${product.name}**\n`
            detailedMessage += `   📦 ${product.quantity} ${product.unit}\n`
            detailedMessage += `   💰 ${product.revenue.toLocaleString('vi-VN')}đ\n\n`
          })
        }

        detailedMessage += `\n💡 Nhấn "Xuất báo cáo" để tải file Excel chi tiết!`

        // Add detailed message to chat
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

  const exportReport = async (reportData: any) => {
    try {
      if (!reportData.dateRange) {
        toast.error('Không có dữ liệu báo cáo để xuất')
        return
      }

      // Ensure from and to are Date objects
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage('', true)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh (JPG, PNG, etc.)')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setSelectedImage(base64)
      toast.success('Đã chọn ảnh. Nhấn gửi để nhận diện!')
    }
    reader.readAsDataURL(file)
  }

  const removeSelectedImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-0 rounded-full shadow-lg hover:scale-110 transition-all z-50 overflow-hidden border-2 border-white w-16 h-16 flex items-center justify-center bg-white"
        aria-label="Mở chat hỗ trợ"
      >
        <img src="/images/smartbuild_bot.png" alt="SmartBuild AI" className="w-full h-full object-cover" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-2xl border z-50 flex flex-col max-h-[600px]">
      {/* Header */}
      <div className={`${isAdmin ? 'bg-gradient-to-r from-indigo-600 to-blue-600' : 'bg-blue-600'} text-white p-4 rounded-t-lg flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full overflow-hidden border-2 border-blue-400">
            <img src="/images/smartbuild_bot.png" alt="SmartBuild AI" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-semibold">
              {isAdmin ? '🎯 SmartBuild Admin' : '🤖 SmartBuild AI'}
            </div>
            <div className="text-xs opacity-90">
              {isAdmin
                ? 'Trợ lý quản trị hệ thống'
                : 'Trợ lý vật liệu thông minh'
              }
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className={`text-white ${isAdmin ? 'hover:bg-purple-700' : 'hover:bg-primary-700'} p-1 rounded`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-8">
            <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-full overflow-hidden border-2 border-gray-100 shadow-sm">
              <img src="/images/smartbuild_bot.png" alt="SmartBuild AI" className="w-full h-full object-cover" />
            </div>
            <div className="font-medium">Xin chào! SmartBuild AI có thể giúp gì cho bạn?</div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-3">
            {/* User Message */}
            {(message.userMessage !== 'hello' && message.userMessage !== 'admin_hello') || message.userImage ? (
              <div className="flex justify-end">
                <div className={`${isAdmin ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-primary-600'} text-white p-3 rounded-lg max-w-xs`}>
                  {message.userImage && (
                    <img
                      src={message.userImage}
                      alt="Uploaded"
                      className="w-full max-w-[200px] rounded mb-2"
                    />
                  )}
                  {message.userMessage && message.userMessage !== 'hello' && message.userMessage !== 'admin_hello' && (
                    <div className="text-sm">{message.userMessage}</div>
                  )}
                  <div className="text-xs opacity-75 mt-1">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            ) : null}

            {/* Bot Message */}
            <div className="flex justify-start">
              <div className="bg-gray-100 p-4 rounded-lg max-w-2xl border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 bg-white shadow-sm">
                    <img src="/images/smartbuild_bot.png" alt="SmartBuild AI" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div
                      className="text-sm text-gray-950 font-medium leading-relaxed whitespace-pre-wrap"
                      style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        lineHeight: '1.6'
                      }}
                    >
                      {message.botMessage.split('\n').map((line, idx) => {
                        // Style separator lines
                        if (line.trim().startsWith('━━')) {
                          return (
                            <div key={idx} className="text-gray-300 my-2 font-mono text-xs">
                              {line}
                            </div>
                          )
                        }

                        // Function to render inline markdown (bold, links, images)
                        const renderInlineMarkdown = (text: string) => {
                          const elements: React.ReactNode[] = []
                          let remaining = text
                          let keyCounter = 0

                          while (remaining.length > 0) {
                            // Check for image ![alt](url)
                            const imgMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
                            if (imgMatch) {
                              elements.push(
                                <img
                                  key={keyCounter++}
                                  src={imgMatch[2]}
                                  alt={imgMatch[1]}
                                  className="max-w-full rounded-lg my-2"
                                />
                              )
                              remaining = remaining.slice(imgMatch[0].length)
                              continue
                            }

                            // Check for link [text](url)
                            const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
                            if (linkMatch) {
                              elements.push(
                                <a
                                  key={keyCounter++}
                                  href={linkMatch[2]}
                                  className="text-blue-600 hover:text-blue-800 font-semibold underline"
                                  target={linkMatch[2].startsWith('http') ? '_blank' : undefined}
                                  rel={linkMatch[2].startsWith('http') ? 'noopener noreferrer' : undefined}
                                >
                                  {linkMatch[1]}
                                </a>
                              )
                              remaining = remaining.slice(linkMatch[0].length)
                              continue
                            }

                            // Check for bold **text**
                            const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
                            if (boldMatch) {
                              elements.push(
                                <span key={keyCounter++} className="font-bold text-gray-900">
                                  {boldMatch[1]}
                                </span>
                              )
                              remaining = remaining.slice(boldMatch[0].length)
                              continue
                            }

                            // Find next special character or end
                            const nextSpecial = remaining.search(/\*\*|\[|\!\[/)
                            if (nextSpecial === -1) {
                              // No more special chars, add rest as text
                              elements.push(<span key={keyCounter++}>{remaining}</span>)
                              break
                            } else if (nextSpecial > 0) {
                              // Add text before special char
                              elements.push(<span key={keyCounter++}>{remaining.slice(0, nextSpecial)}</span>)
                              remaining = remaining.slice(nextSpecial)
                            } else {
                              // Special char at start but didn't match, treat as normal char
                              elements.push(<span key={keyCounter++}>{remaining[0]}</span>)
                              remaining = remaining.slice(1)
                            }
                          }

                          return elements
                        }

                        return (
                          <div key={idx} className={idx > 0 && !line.trim().startsWith('━━') ? 'mt-1' : ''}>
                            {renderInlineMarkdown(line)}
                          </div>
                        )
                      })}
                    </div>
                    <div className="text-xs text-gray-700 font-medium mt-2">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Recommendations */}
            {message.productRecommendations && message.productRecommendations.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-gray-600">Sản phẩm đề xuất:</div>
                {message.productRecommendations.map((product, index) => (
                  <div key={index} className="bg-blue-50 p-2 rounded border border-blue-200 text-sm">
                    <div className="font-semibold text-blue-900">{product.name}</div>
                    <div className="text-blue-800 font-medium">
                      {product.price?.toLocaleString('vi-VN')}đ/{product.unit}
                    </div>
                    <button className="text-primary-700 hover:text-primary-900 font-medium text-xs mt-1 flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" />
                      Xem chi tiết
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {message.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion, message)}
                    disabled={isLoading}
                    className="text-xs bg-blue-100 text-blue-900 font-semibold px-3 py-1.5 rounded-full hover:bg-blue-200 disabled:opacity-50 border border-blue-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg max-w-xs border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-white flex-shrink-0 border border-gray-100">
                  <img src="/images/smartbuild_bot.png" alt="SmartBuild AI" className="w-full h-full object-cover" />
                </div>
                <div className="flex space-x-1">
                  <div className="h-1.5 w-1.5 bg-primary-600 rounded-full animate-bounce"></div>
                  <div className="h-1.5 w-1.5 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-1.5 w-1.5 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error message with retry */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="ml-2 flex-1">
                <h3 className="text-sm font-semibold text-red-900">Lỗi Kết Nối</h3>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={retryLastMessage}
                    disabled={isLoading}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-semibold rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    Thử lại
                  </button>
                  <span className="text-xs text-red-700 font-medium">
                    {errorRetryCount > 0 ? `Thử lại lần ${errorRetryCount}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
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
              confidence={pendingOCRData.confidence}
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
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        {/* Image Preview */}
        {selectedImage && (
          <div className="mb-3 relative inline-block">
            <img
              src={selectedImage}
              alt="Preview"
              className="h-20 w-20 object-cover rounded-lg border-2 border-primary-500"
            />
            <button
              onClick={removeSelectedImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            title="Upload ảnh"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            placeholder={selectedImage ? "Thêm ghi chú (tùy chọn)..." : "Nhập tin nhắn hoặc upload ảnh..."}
            className="flex-1 border rounded-lg px-3 py-2 text-sm text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage('', true)}
            disabled={isLoading || (!currentMessage.trim() && !selectedImage)}
            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          📸 Upload ảnh để AI nhận diện vật liệu | 💬 Hoặc chat trực tiếp
        </div>
      </div>
    </div>
  )
}