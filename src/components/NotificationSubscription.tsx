'use client'

import React, { useState, useEffect } from 'react'
import { Bell, BellOff, X, CheckCircle2, ShieldCheck } from 'lucide-react'
import { usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const NotificationSubscription: React.FC = () => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [showGuide, setShowGuide] = useState(false)

  const shouldHide =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/supplier') ||
    pathname?.startsWith('/employee') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
      if (Notification.permission === 'granted') {
        setIsSubscribed(true)
      }
    }

    // Listen for close event from other widgets
    const handleCloseAll = () => setIsOpen(false)
    window.addEventListener('close-all-floating-widgets', handleCloseAll)
    return () => window.removeEventListener('close-all-floating-widgets', handleCloseAll)
  }, [])

  const toggleOpen = () => {
    const nextState = !isOpen
    if (nextState) {
      // Dispatch event to close other widgets
      window.dispatchEvent(new CustomEvent('close-all-floating-widgets'))
    }
    setIsOpen(nextState)
  }

  const handleSubscribe = async () => {
    if (!('Notification' in window)) {
      toast.error('Trình duyệt không hỗ trợ thông báo.')
      return
    }

    if (Notification.permission === 'denied') {
      setShowGuide(true)
      return
    }

    const result = await Notification.requestPermission()
    setPermission(result)
    
    if (result === 'granted') {
      setIsSubscribed(true)
      setTimeout(() => setIsOpen(false), 2000)
      toast.success('Tuyệt vời! Bạn sẽ nhận được tin mới nhất.', { icon: '🎉' })
    }
  }

  const getButtonText = () => {
    if (isSubscribed) return 'Đã đăng ký'
    if (permission === 'denied') return 'Bị chặn bởi trình duyệt'
    return 'Đăng ký ngay'
  }

  // Don't show on auth, admin or supplier pages — AFTER all hooks
  if (shouldHide) return null

  return (
    <div className="fixed bottom-8 left-8 z-[60]">
      {/* Floating Bell Button */}
      <button
        onClick={toggleOpen}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 animate-bounce-slow bg-white hover:bg-slate-50 text-primary-600 border ${
          isSubscribed ? 'border-primary-200' : 'border-slate-100'
        } group relative`}
      >
        <Bell size={24} className={`${isSubscribed ? 'fill-primary-600' : ''} group-hover:rotate-12 transition-all`} />
        {isSubscribed && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Subscription Modal/Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-[100px] left-8 w-72 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden z-[90] max-h-[70vh] flex flex-col"
          >
            <div className="bg-primary-600 p-5 text-white relative shrink-0">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors p-1"
              >
                <X size={18} />
              </button>
              <Bell size={24} className="mb-3 opacity-50" />
              <h3 className="text-lg font-black leading-tight">
                {showGuide ? 'Hướng dẫn mở lại' : 'Đừng bỏ lỡ tin tức!'}
              </h3>
            </div>
            
            <div className="p-5 overflow-y-auto">
              {!showGuide ? (
                <>
                  <p className="text-[11px] text-slate-500 mb-4 font-bold uppercase tracking-wider">
                    Cập nhật mới nhất về:
                  </p>
                  
                  <ul className="space-y-2.5 mb-6">
                    <li className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Biến động giá vật liệu
                    </li>
                    <li className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Dự án mới gần bạn
                    </li>
                    <li className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Ưu đãi từ nhà cung cấp
                    </li>
                  </ul>

                  <button
                    onClick={handleSubscribe}
                    disabled={isSubscribed}
                    className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                      isSubscribed
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : permission === 'denied'
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg active:scale-95'
                    }`}
                  >
                    {getButtonText()}
                  </button>

                  {permission === 'denied' && (
                    <button 
                      onClick={() => setShowGuide(true)}
                      className="w-full mt-3 text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline"
                    >
                      Nhấn để xem hướng dẫn ↗
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                      <p className="text-xs text-slate-600 font-medium">Nhấn vào icon <b>ổ khóa 🔒</b> hoặc <b>cài đặt</b> trên thanh địa chỉ.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                      <p className="text-xs text-slate-600 font-medium">Tìm mục <b>Thông báo (Notifications)</b>.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                      <p className="text-xs text-slate-600 font-medium">Chuyển trạng thái sang <b>Cho phép (Allow)</b>.</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowGuide(false)}
                    className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Quay lại
                  </button>
                </div>
              )}
              
              {!showGuide && (
                <div className="mt-4 flex items-center justify-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <ShieldCheck size={10} />
                  Bảo mật & Không spam
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationSubscription
