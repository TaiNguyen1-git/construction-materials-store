'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Command, 
  FileText, 
  Package, 
  Users, 
  ShoppingCart, 
  Settings, 
  TrendingUp, 
  Briefcase,
  ShieldCheck,
  LayoutDashboard,
  Truck,
  CreditCard,
  Ticket,
  ChevronRight,
  PlusCircle,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface SearchItem {
  id: string
  name: string
  href?: string
  icon: React.ElementType
  category: 'PAGES' | 'ACTIONS' | 'DATA'
  description?: string
  action?: () => void
}

const PAGES: SearchItem[] = [
  { id: 'dashboard', name: 'Tổng Quan', href: '/admin', icon: LayoutDashboard, category: 'PAGES' },
  { id: 'orders', name: 'Đơn Hàng & Dự Án', href: '/admin/orders', icon: ShoppingCart, category: 'PAGES' },
  { id: 'inventory', name: 'Tồn Kho & Sản Phẩm', href: '/admin/inventory', icon: Package, category: 'PAGES' },
  { id: 'dispatch', name: 'Điều Xe Giao Hàng', href: '/admin/store-operations', icon: Truck, category: 'PAGES' },
  { id: 'customers', name: 'Khách Hàng', href: '/admin/customers', icon: Users, category: 'PAGES' },
  { id: 'finance', name: 'Quản Lý Công Nợ', href: '/admin/credit-management', icon: CreditCard, category: 'PAGES' },
  { id: 'integrity', name: 'Nhật Ký Audit & Rủi Ro', href: '/admin/integrity', icon: ShieldCheck, category: 'PAGES' },
  { id: 'hr', name: 'Quản Lý Nhân Sự', href: '/admin/hr-management', icon: Briefcase, category: 'PAGES' },
  { id: 'support', name: 'Tickets Hỗ Trợ', href: '/admin/tickets', icon: Ticket, category: 'PAGES' },
]

const QUICK_ACTIONS: SearchItem[] = [
  { id: 'new-quote', name: 'Tạo Báo Giá Nhanh', icon: PlusCircle, category: 'ACTIONS', action: () => {} },
  { id: 'record-expense', name: 'Ghi Chi Phí Store', icon: CreditCard, category: 'ACTIONS', action: () => {} },
]

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredItems = [...PAGES, ...QUICK_ACTIONS].filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase())
  )

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    setQuery('')
    setSelectedIndex(0)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleClose = useCallback(() => setIsOpen(false), [])

  const handleSelect = useCallback((item: SearchItem) => {
    if (item.href) {
      router.push(item.href)
    } else if (item.action) {
      item.action()
    }
    handleClose()
  }, [router, handleClose])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Navigation with arrows
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredItems.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length)
      } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
        e.preventDefault()
        handleSelect(filteredItems[selectedIndex])
      } else if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, filteredItems, selectedIndex, handleSelect, handleClose])

  return (
    <>
      {/* Search Trigger Button for Header */}
      <button 
        onClick={handleOpen}
        className="flex items-center gap-4 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 rounded-2xl transition-all duration-300 w-full md:w-64 group"
      >
        <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
        <span className="text-sm font-bold text-slate-400 group-hover:text-slate-600 transition-colors flex-1 text-left">
          Tìm kiếm nhanh...
        </span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-black text-slate-400 opacity-100 uppercase tracking-tighter">
          <span className="text-xs">Ctrl</span> K
        </kbd>
      </button>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/20 mx-4"
            >
              <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                <Search className="w-6 h-6 text-blue-600" />
                <input 
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {setQuery(e.target.value); setSelectedIndex(0)}}
                  placeholder="Gõ để tìm kiếm Đơn hàng, Tính năng hoặc Khách hàng..." 
                  className="flex-1 bg-transparent border-none outline-none text-xl font-bold text-slate-900 placeholder:text-slate-300"
                />
                <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                {filteredItems.length > 0 ? (
                  <div className="space-y-6">
                    {/* Groups */}
                    {['PAGES', 'ACTIONS'].map(cat => {
                      const items = filteredItems.filter(i => i.category === cat)
                      if (items.length === 0) return null

                      return (
                        <div key={cat} className="space-y-2">
                          <h3 className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {cat === 'PAGES' ? 'Trang Chức Năng' : 'Hành Động Nhanh'}
                          </h3>
                          <div className="space-y-1">
                            {items.map((item) => {
                              const globalIdx = filteredItems.indexOf(item)
                              const isSelected = selectedIndex === globalIdx
                              
                              return (
                                <button
                                  key={item.id}
                                  onMouseEnter={() => setSelectedIndex(globalIdx)}
                                  onClick={() => handleSelect(item)}
                                  className={cn(
                                    "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 group/item",
                                    isSelected ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "hover:bg-slate-50 text-slate-600"
                                  )}
                                >
                                  <div className={cn(
                                    "p-2.5 rounded-xl transition-colors",
                                    isSelected ? "bg-white/20" : "bg-slate-100 group-hover/item:bg-white"
                                  )}>
                                    <item.icon className={cn("w-5 h-5", isSelected ? "text-white" : "text-blue-600")} />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="font-bold tracking-tight">{item.name}</p>
                                    <p className={cn("text-xs", isSelected ? "text-white/70" : "text-slate-400")}>
                                      {item.category === 'PAGES' ? 'Nhấn để điều hướng tới trang' : 'Phiên làm việc nhanh'}
                                    </p>
                                  </div>
                                  {isSelected && <ChevronRight className="w-4 h-4 opacity-50" />}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Không tìm thấy kết quả cho "${query}"</p>
                      <p className="text-sm text-slate-400">Thử tìm kiếm với từ khóa khác xem sao!</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><kbd className="bg-white px-1 rounded border">Enter</kbd> Chọn</span>
                  <span className="flex items-center gap-1.5"><kbd className="bg-white px-1 rounded border">↑↓</kbd> Duyệt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="bg-white px-1 rounded border">Esc</kbd> Đóng
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
