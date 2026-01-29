'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Loader2, Copy, Check, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface QRPaymentProps {
  amount: number
  orderId: string
  description?: string
  expiresAt?: Date | string
}

export default function QRPayment({ amount, orderId, description, expiresAt }: QRPaymentProps) {
  const [qrUrl, setQrUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [copiedState, setCopiedState] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)

  const bankInfo = {
    bankId: '970423', // TPBank
    accountNo: '06729594301',
    accountName: 'NGUYEN THANH TAI',
    template: 'compact2'
  }

  const sanitizedAmount = Math.max(0, Math.floor(amount))
  const sanitizedOrderId = orderId.replace(/[^a-zA-Z0-9-_]/g, '')
  const sanitizedDescription = (description || '').replace(/[<>]/g, '').slice(0, 100)
  const transferContent = sanitizedDescription || `Thanh toan ${sanitizedOrderId}`

  useEffect(() => {
    const generateQR = async () => {
      setIsLoading(true)
      try {
        if (sanitizedAmount <= 0) return

        const apiUrl = 'https://img.vietqr.io/image/' +
          `${bankInfo.bankId}-${bankInfo.accountNo}-${bankInfo.template}.png` +
          `?amount=${sanitizedAmount}` +
          `&addInfo=${encodeURIComponent(transferContent)}` +
          `&accountName=${encodeURIComponent(bankInfo.accountName)}`

        setQrUrl(apiUrl)
      } catch (error) {
        console.error('Error generating QR:', error)
      } finally {
        setIsLoading(false)
      }
    }
    generateQR()
  }, [amount, orderId, description])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedState(field)
    toast.success('Đã sao chép!')
    setTimeout(() => setCopiedState(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">

      {/* QR Code Section */}
      <div className="relative mb-8 group">
        <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <div className="relative bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="QR Payment"
              width={220}
              height={220}
              className="rounded-lg"
            />
          ) : (
            <div className="w-[220px] h-[220px] bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">
              Lỗi tạo mã
            </div>
          )}

          {/* Bank Logos Badge - Removed as they are already in the QR template */}
        </div>
      </div>

      <div className="w-full space-y-4">
        <h3 className="text-center text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Hoặc chuyển khoản thủ công</h3>

        {/* Account Number Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center group hover:bg-white hover:border-blue-200 hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Số tài khoản</p>
            <p className="text-lg font-black text-slate-800 font-mono tracking-tight">{bankInfo.accountNo}</p>
          </div>
          <button
            onClick={() => copyToClipboard(bankInfo.accountNo, 'account')}
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
          >
            {copiedState === 'account' ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        {/* Account Name & Bank */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 gap-1 group hover:bg-white hover:border-blue-200 hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Chủ tài khoản</p>
            <p className="text-sm font-black text-slate-800">{bankInfo.accountName}</p>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-200/50">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Ngân hàng</p>
            <p className="text-sm font-bold text-slate-700">TPBank (Ngân hàng Tiên Phong)</p>
          </div>
        </div>

        {/* Amount Card */}
        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex justify-between items-center group hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Số tiền cần chuyển</p>
            <p className="text-xl font-black text-emerald-700">{sanitizedAmount.toLocaleString()}đ</p>
          </div>
          <button
            onClick={() => copyToClipboard(sanitizedAmount.toString(), 'amount')}
            className="p-2 bg-white rounded-lg border border-emerald-200 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 transition-all"
          >
            {copiedState === 'amount' ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center group hover:bg-white hover:border-blue-200 hover:shadow-md transition-all">
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Nội dung chuyển khoản</p>
            <p className="text-sm font-bold text-slate-800 break-all">{transferContent}</p>
          </div>
          <button
            onClick={() => copyToClipboard(transferContent, 'content')}
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shrink-0 ml-3"
          >
            {copiedState === 'content' ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

      </div>
    </div>
  )
}
