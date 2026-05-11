'use client'

import React, { useState, useEffect } from 'react'
import { Bell, BellOff, X, CheckCircle2, ShieldCheck } from 'lucide-react'
import { usePathname } from 'next/navigation'
import toast from 'react-hot-toast'

const NotificationSubscription: React.FC = () => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  // Don't show on admin or supplier pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/supplier') || pathname?.startsWith('/employee')) {
    return null
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
      if (Notification.permission === 'granted') {
        setIsSubscribed(true)
      }
    }
  }, [])

  const handleSubscribe = async () => {
    if (!('Notification' in window)) {
      toast.error('Trình duyệt của bạn không hỗ trợ thông báo.')
      return
    }

    const result = await Notification.requestPermission()
    setPermission(result)
    
    if (result === 'granted') {
      setIsSubscribed(true)
      setIsOpen(false)
      toast.success('Đã đăng ký nhận thông báo thành công!')
      
      // Simulate sending a test notification
      new Notification('SmartBuild', {
        body: 'Cảm ơn bạn đã đăng ký nhận tin từ SmartBuild!',
        icon: '/logo.png'
      })
    } else {
      toast.error('Bạn đã từ chối quyền nhận thông báo.')
    }
  }

  return (
    <div className="fixed bottom-32 right-8 z-[60]">
      {/* Floating Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 animate-bounce-slow ${
          isSubscribed 
            ? 'bg-emerald-500 hover:bg-emerald-600' 
            : 'bg-white hover:bg-slate-50'
        } ${isSubscribed ? 'text-white' : 'text-primary-600'} border border-slate-100 group`}
      >
        {isSubscribed ? <Bell size={24} /> : <Bell size={24} className="group-hover:rotate-12 transition-transform" />}
        {!isSubscribed && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white">
            1
          </span>
        )}
      </button>

      {/* Subscription Modal/Popup */}
      {isOpen && (
        <div className="absolute bottom-18 right-0 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-primary-600 p-6 text-white relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <Bell size={40} className="mb-4 opacity-50" />
            <h3 className="text-xl font-black leading-tight">Đừng bỏ lỡ <br/>tin tức quan trọng!</h3>
          </div>
          
          <div className="p-6">
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              Nhận thông báo ngay khi có cập nhật về:
            </p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-xs font-bold text-slate-700">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Biến động giá vật liệu
              </li>
              <li className="flex items-center gap-3 text-xs font-bold text-slate-700">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Dự án mới gần bạn
              </li>
              <li className="flex items-center gap-3 text-xs font-bold text-slate-700">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Ưu đãi từ nhà cung cấp
              </li>
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={isSubscribed}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                isSubscribed
                  ? 'bg-slate-100 text-slate-400 cursor-default'
                  : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg active:scale-95'
              }`}
            >
              {isSubscribed ? 'Đã đăng ký' : 'Đăng ký ngay'}
            </button>
            
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <ShieldCheck size={12} />
              Bảo mật & Không spam
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationSubscription
