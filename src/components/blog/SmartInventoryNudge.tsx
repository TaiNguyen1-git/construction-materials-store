'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, ArrowRight, X, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface Product {
  id: string
  name: string
  price: number
  discount?: number
  featuredImage: string
  slug: string
  category?: { name: string }
}

interface Props {
  categoryId?: string
}

export default function SmartInventoryNudge({ categoryId }: Props) {
  const [product, setProduct] = useState<Product | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasDismissed, setHasDismissed] = useState(false)

  useEffect(() => {
    if (!categoryId) return

    const fetchTopDeal = async () => {
      try {
        const res = await fetch(`/api/products/related?categoryId=${categoryId}&limit=1`)
        const data = await res.json()
        if (data.success && data.data.length > 0) {
          // Check if it's a high discount item
          const topProduct = data.data[0]
          if (topProduct.discount && topProduct.discount > 0) {
            setProduct(topProduct)
          }
        }
      } catch (err) {
        console.error('Failed to fetch nudge product:', err)
      }
    }

    fetchTopDeal()
  }, [categoryId])

  useEffect(() => {
    const handleScroll = () => {
      if (hasDismissed || !product) return
      
      const scrollY = window.scrollY
      const threshold = 1000 // Show after 1000px scroll
      
      if (scrollY > threshold && !isVisible) {
        setIsVisible(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [product, isVisible, hasDismissed])

  if (!product) return null

  const discountedPrice = product.price * (1 - (product.discount || 0) / 100)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-8 right-8 z-[60] w-[320px] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-neutral-100 overflow-hidden group"
        >
          {/* Close button */}
          <button 
            onClick={() => {
              setIsVisible(false)
              setHasDismissed(true)
            }}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-black/5 hover:bg-black/10 text-neutral-500 rounded-full transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative">
            {/* Image Header */}
            <div className="h-40 relative overflow-hidden">
              <img 
                src={product.featuredImage} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              <div className="absolute bottom-4 left-6">
                 <span className="px-3 py-1 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                    Cơ hội tối ưu chi phí
                 </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                 <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                 <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Ưu đãi đặc quyền</span>
              </div>
              <h4 className="text-sm font-black text-neutral-900 leading-tight mb-4 group-hover:text-primary-600 transition-colors line-clamp-2">
                {product.name}
              </h4>
              
              <div className="flex items-end gap-3 mb-6">
                 <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest line-through">
                        {product.price.toLocaleString('vi-VN')}đ
                    </p>
                    <p className="text-lg font-black text-emerald-600">
                        {discountedPrice.toLocaleString('vi-VN')}đ
                    </p>
                 </div>
                 <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-md border border-emerald-100 mb-1">
                    -{product.discount}%
                 </div>
              </div>

              <Link 
                href={`/products/${product.slug}`}
                className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-600 hover:-translate-y-1 transition-all shadow-xl shadow-neutral-200"
              >
                Khám phá ưu đãi <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
