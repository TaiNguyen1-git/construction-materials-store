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
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      {/* QR Code Section - More integrated */}
      <div className="relative mb-6 group">
        <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 rounded-[2rem] blur-xl opacity-50"></div>
        <div className="relative bg-white p-3 rounded-3xl border border-slate-100 shadow-sm transition-transform duration-500 group-hover:scale-[1.02]">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="QR Payment"
              width={180}
              height={180}
              className="rounded-2xl"
            />
          ) : (
            <div className="w-[180px] h-[180px] bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Lỗi tạo mã
            </div>
          )}
        </div>
      </div>

      <div className="w-full space-y-3">
        <div className="flex items-center gap-3 px-1 mb-1">
            <div className="h-px bg-slate-200 flex-1"></div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Chuyển khoản thủ công</h3>
            <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Account Info Group */}
            <div className="sm:col-span-2 bg-slate-50/80 rounded-2xl p-4 border border-slate-100/50 flex justify-between items-center group/item hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Số tài khoản & Ngân hàng</p>
                    <p className="text-base font-black text-slate-800 font-mono tracking-tight">{bankInfo.accountNo}</p>
                    <p className="text-[11px] font-bold text-slate-500">TPBank • {bankInfo.accountName}</p>
                </div>
                <button
                    onClick={() => copyToClipboard(bankInfo.accountNo, 'account')}
                    className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all active:scale-90"
                >
                    {copiedState === 'account' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
            </div>

            {/* Amount Card */}
            <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100/50 flex justify-between items-center group/item hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all">
                <div className="space-y-1">
                    <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider leading-none">Số tiền</p>
                    <p className="text-base font-black text-emerald-700">{sanitizedAmount.toLocaleString()}đ</p>
                </div>
                <button
                    onClick={() => copyToClipboard(sanitizedAmount.toString(), 'amount')}
                    className="p-2 bg-white rounded-lg border border-emerald-100 text-emerald-400 hover:text-emerald-600 transition-all active:scale-90"
                >
                    {copiedState === 'amount' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
            </div>

            {/* Content Card */}
            <div className="bg-blue-50/40 rounded-2xl p-4 border border-blue-100/50 flex justify-between items-center group/item hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="space-y-1 overflow-hidden">
                    <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider leading-none">Nội dung</p>
                    <p className="text-xs font-black text-blue-700 truncate">{transferContent}</p>
                </div>
                <button
                    onClick={() => copyToClipboard(transferContent, 'content')}
                    className="p-2 bg-white rounded-lg border border-blue-100 text-blue-400 hover:text-blue-600 transition-all active:scale-90"
                >
                    {copiedState === 'content' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
            </div>
        </div>

        <div className="flex items-center gap-2 justify-center pt-4 opacity-50">
            <Clock className="w-3 h-3 text-slate-400" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tự động xác nhận sau 1-3 phút</p>
        </div>
      </div>
    </div>
  )
}
