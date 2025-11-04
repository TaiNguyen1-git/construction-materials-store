'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Bot, ShoppingCart, AlertCircle, RefreshCw, Camera, Image as ImageIcon, BarChart3, Package, Users, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import ChatOrderSummary from './ChatOrderSummary'
import ChatConfirmDialog from './ChatConfirmDialog'
import ChatOCRPreview from './ChatOCRPreview'

interface ChatMessage {
  id: string
  userMessage: string
  botMessage: string
  suggestions: string[]
  productRecommendations?: any[]
  confidence: number
  timestamp: string
  // New fields for enhanced features
  ocrData?: any
  calculationData?: any
  orderData?: any
  requiresConfirmation?: boolean
}

interface ChatbotProps {
  customerId?: string
}

export default function Chatbot({ customerId }: ChatbotProps) {
  const { user, isAuthenticated } = useAuth()
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
  const isAdmin = isAuthenticated && user && (user.role === 'MANAGER' || user.role === 'EMPLOYEE')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Send welcome message with role context
      const welcomeMsg = isAdmin ? 'admin_hello' : 'hello'
      sendMessage(welcomeMsg)
    }
  }, [isOpen, isAdmin])

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
          botMessage: data.data.message,
          suggestions: data.data.suggestions || [],
          productRecommendations: data.data.productRecommendations || [],
          confidence: data.data.confidence || 0,
          timestamp: data.data.timestamp,
          ocrData: data.data.ocrData,
          calculationData: data.data.calculationData,
          orderData: data.data.orderData
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

  const handleSuggestionClick = (suggestion: string, message?: ChatMessage) => {
    // Handle "Xem chi tiết" for orders
    if (suggestion === 'Xem chi tiết' && message?.orderData?.trackingUrl) {
      window.location.href = message.orderData.trackingUrl
      return
    }
    
    // Default: send as message
    sendMessage(suggestion)
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
        className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
        aria-label="Mở chat hỗ trợ"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-2xl border z-50 flex flex-col max-h-[600px]">
      {/* Header */}
      <div className={`${isAdmin ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-primary-600'} text-white p-4 rounded-t-lg flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          {isAdmin ? <BarChart3 className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
          <div>
            <div className="font-semibold">
              {isAdmin ? '🎯 Admin Assistant' : '🛠️ Hỗ trợ khách hàng'}
            </div>
            <div className="text-xs opacity-90">
              {isAdmin 
                ? 'Trợ lý quản trị hệ thống' 
                : 'Trợ lý ảo Construction Materials'
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
            <Bot className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <div>Xin chào! Tôi có thể giúp gì cho bạn?</div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-3">
            {/* User Message */}
            {message.userMessage !== 'hello' && message.userMessage !== 'admin_hello' && (
              <div className="flex justify-end">
                <div className={`${isAdmin ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-primary-600'} text-white p-3 rounded-lg max-w-xs`}>
                  <div className="text-sm">{message.userMessage}</div>
                  <div className="text-xs opacity-75 mt-1">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            )}

            {/* Bot Message */}
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg max-w-xs border border-gray-200">
                <div className="flex items-start gap-2">
                  <Bot className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-950 font-semibold leading-relaxed">{message.botMessage}</div>
                    <div className="text-xs text-gray-700 font-medium mt-1">{formatTime(message.timestamp)}</div>
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
            <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-primary-600 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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
                toast.info('Chức năng chỉnh sửa đang được phát triển')
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
                toast.info('Chức năng chỉnh sửa đang được phát triển')
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