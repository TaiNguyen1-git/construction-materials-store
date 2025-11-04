'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Loader2, Copy, Check, Clock } from 'lucide-react'

interface QRPaymentProps {
  amount: number
  orderId: string
  description?: string
  expiresAt?: Date | string // QR expiration time (15 minutes from creation)
}

export default function QRPayment({ amount, orderId, description, expiresAt }: QRPaymentProps) {
  const [qrUrl, setQrUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)

  // Thông tin tài khoản ngân hàng - TPBank
  const bankInfo = {
    bankId: '970423', // TPBank
    // Các mã ngân hàng phổ biến:
    // 970422 - MB Bank
    // 970415 - Vietinbank  
    // 970436 - Vietcombank
    // 970418 - BIDV
    // 970405 - Agribank
    // 970407 - Techcombank
    // 970423 - TPBank
    // 970416 - ACB
    accountNo: '06729594301', // Số tài khoản
    accountName: 'NGUYEN THANH TAI', // Tên chủ tài khoản (viết hoa, không dấu)
    template: 'compact2' // Template QR code
  }

  // Validate inputs to prevent injection
  const sanitizedAmount = Math.max(0, Math.floor(amount))
  const sanitizedOrderId = orderId.replace(/[^a-zA-Z0-9-_]/g, '')
  const sanitizedDescription = (description || '').replace(/[<>]/g, '').slice(0, 100)

  // Calculate expiration time (15 minutes from now if not provided)
  const expirationTime = expiresAt 
    ? new Date(expiresAt) 
    : new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  // Countdown timer effect
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expiration = expirationTime.getTime()
      const difference = expiration - now

      if (difference <= 0) {
        setIsExpired(true)
        return 0
      }

      return Math.floor(difference / 1000) // Convert to seconds
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)
      
      if (remaining <= 0) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expirationTime])

  useEffect(() => {
    generateQR()
  }, [amount, orderId, description])
  
  // Format time left as MM:SS
  const formatTimeLeft = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const generateQR = async () => {
    setIsLoading(true)
    
    try {
      // Validate amount
      if (sanitizedAmount <= 0) {
        console.error('Invalid amount:', amount)
        setIsLoading(false)
        return
      }
      
      // Format description for transaction
      const transferContent = sanitizedDescription || `Thanh toan ${sanitizedOrderId}`
      
      // VietQR API URL with sanitized values
      const apiUrl = 'https://img.vietqr.io/image/' +
        `${bankInfo.bankId}-${bankInfo.accountNo}-${bankInfo.template}.png` +
        `?amount=${sanitizedAmount}` +
        `&addInfo=${encodeURIComponent(transferContent)}` +
        `&accountName=${encodeURIComponent(bankInfo.accountName)}`
      
      setQrUrl(apiUrl)
      setIsLoading(false)
    } catch (error) {
      console.error('Error generating QR code:', error)
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Countdown Timer */}
      <div className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 ${
        isExpired 
          ? 'bg-red-50 border-red-500' 
          : timeLeft < 300 
            ? 'bg-yellow-50 border-yellow-500' 
            : 'bg-green-50 border-green-500'
      }`}>
        <Clock className={`h-6 w-6 ${
          isExpired 
            ? 'text-red-600' 
            : timeLeft < 300 
              ? 'text-yellow-600' 
              : 'text-green-600'
        }`} />
        <div>
          <p className="text-sm font-semibold text-gray-700">
            {isExpired ? 'Mã QR đã hết hạn' : 'Thời gian còn lại'}
          </p>
          <p className={`text-2xl font-black ${
            isExpired 
              ? 'text-red-600' 
              : timeLeft < 300 
                ? 'text-yellow-600' 
                : 'text-green-600'
          }`}>
            {isExpired ? '00:00' : formatTimeLeft(timeLeft)}
          </p>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex justify-center relative">
        <div className={`bg-white p-6 rounded-2xl shadow-xl border-4 ${
          isExpired ? 'border-gray-300' : 'border-green-500'
        }`}>
          {qrUrl ? (
            <>
              <Image
                src={qrUrl}
                alt="QR Code Payment"
                width={300}
                height={300}
                className={`rounded-lg ${isExpired ? 'opacity-30' : ''}`}
                unoptimized
              />
              {isExpired && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-xl">
                    ĐÃ HẾT HẠN
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-[300px] h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Không thể tạo QR code</p>
            </div>
          )}
        </div>
      </div>

      {isExpired && (
        <div className="bg-red-100 border-2 border-red-500 rounded-xl p-4">
          <p className="text-red-800 text-center font-semibold">
            ⚠️ Mã QR đã hết hạn. Vui lòng làm mới trang hoặc liên hệ với chúng tôi để được hỗ trợ.
          </p>
        </div>
      )}

      {/* Bank Information */}
      <div className="bg-white rounded-xl p-6 space-y-4 shadow-lg border border-gray-200">
        <h4 className="font-bold text-gray-900 text-center mb-4">
          Hoặc chuyển khoản thủ công
        </h4>
        
        {/* Account Number */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 mb-1">Số tài khoản</p>
            <p className="font-bold text-gray-900 text-lg">{bankInfo.accountNo}</p>
          </div>
          <button
            onClick={() => copyToClipboard(bankInfo.accountNo, 'account')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Copy số tài khoản"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <Copy className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Account Name */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 mb-1">Chủ tài khoản</p>
            <p className="font-bold text-gray-900">{bankInfo.accountName}</p>
          </div>
        </div>

        {/* Bank Name */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 mb-1">Ngân hàng</p>
            <p className="font-bold text-gray-900">
              {getBankName(bankInfo.bankId)}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
          <div>
            <p className="text-sm text-gray-600 mb-1">Số tiền cần chuyển</p>
            <p className="font-black text-green-600 text-2xl">
              {sanitizedAmount.toLocaleString()}đ
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(sanitizedAmount.toString(), 'amount')}
            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
            title="Copy số tiền"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <Copy className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Transfer Content */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div className="flex-1 mr-2">
            <p className="text-sm text-gray-600 mb-1">Nội dung chuyển khoản</p>
            <p className="font-bold text-gray-900 break-words">
              {sanitizedDescription || `Thanh toan ${sanitizedOrderId}`}
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(sanitizedDescription || `Thanh toan ${sanitizedOrderId}`, 'content')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            title="Copy nội dung"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <Copy className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">ℹ️</span>
          Hướng dẫn thanh toán
        </h4>
        <ol className="space-y-2 text-sm text-blue-900">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>Mở ứng dụng ngân hàng/ví điện tử hỗ trợ VietQR</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>Chọn chức năng quét QR Code</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>Quét mã QR phía trên - số tiền và nội dung sẽ tự động điền</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <span>Xác nhận và hoàn tất giao dịch</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">5.</span>
            <span>Đơn hàng sẽ được xử lý sau khi chúng tôi nhận được thanh toán</span>
          </li>
        </ol>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <p className="text-sm text-yellow-900 text-center">
          ⚠️ <strong>Lưu ý:</strong> Vui lòng chuyển khoản đúng số tiền và ghi đúng nội dung để đơn hàng được xử lý nhanh chóng
        </p>
      </div>
    </div>
  )
}

// Helper function to get bank name from bank ID
function getBankName(bankId: string): string {
  const bankNames: Record<string, string> = {
    '970422': 'MB Bank (Ngân hàng Quân Đội)',
    '970415': 'Vietinbank (Ngân hàng Công Thương)',
    '970436': 'Vietcombank (Ngân hàng Ngoại Thương)',
    '970418': 'BIDV (Ngân hàng Đầu Tư và Phát Triển)',
    '970405': 'Agribank (Ngân hàng Nông Nghiệp)',
    '970407': 'Techcombank (Ngân hàng Kỹ Thương)',
    '970423': 'TPBank (Ngân hàng Tiên Phong)',
    '970416': 'ACB (Ngân hàng Á Châu)',
    '970403': 'Sacombank (Ngân hàng Sài Gòn Thương Tín)',
    '970432': 'VPBank (Ngân hàng Việt Nam Thịnh Vượng)',
  }
  
  return bankNames[bankId] || 'Ngân hàng'
}
