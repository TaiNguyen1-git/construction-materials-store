'use client'

import Link from 'next/link'
import { Package, Heart } from 'lucide-react'
import CartIcon from './CartIcon'
import CartDrawer from './CartDrawer'
import { useWishlistStore } from '@/stores/wishlistStore'

export default function Header() {
  const { getTotalItems } = useWishlistStore()
  return (
    <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-primary-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2 rounded-xl">
              <Package className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-xl lg:text-2xl font-black text-gradient-primary whitespace-nowrap">
              SmartBuild 🏗️
            </span>
          </div>
          
          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 flex-shrink-0">
            <Link href="/" className="text-gray-900 hover:text-primary-600 font-semibold relative group whitespace-nowrap text-sm xl:text-base">
              🏠 Trang chủ
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/products" className="text-gray-600 hover:text-primary-600 font-semibold relative group whitespace-nowrap text-sm xl:text-base">
              📦 Sản phẩm
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/categories" className="text-gray-600 hover:text-primary-600 font-semibold relative group whitespace-nowrap text-sm xl:text-base">
              🏷️ Danh mục
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-primary-600 font-semibold relative group whitespace-nowrap text-sm xl:text-base">
              ℹ️ Về chúng tôi
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-primary-600 font-semibold relative group whitespace-nowrap text-sm xl:text-base">
              📞 Liên hệ
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </nav>
          
          {/* Actions */}
          <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
            {/* Wishlist Icon */}
            <Link href="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Heart className="h-6 w-6 text-gray-700" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems() > 9 ? '9+' : getTotalItems()}
                </span>
              )}
            </Link>
            
            {/* Cart Icon */}
            <CartIcon />
            
            <Link href="/login" className="hidden md:block text-gray-600 hover:text-primary-600 font-semibold transition-all duration-300 whitespace-nowrap text-sm lg:text-base">
              🔐 Đăng nhập
            </Link>
            <Link href="/register" className="gradient-primary text-white px-4 lg:px-6 py-2 rounded-full hover:from-primary-700 hover:to-secondary-700 font-semibold transition-all duration-300 hover:scale-105 shadow-lg whitespace-nowrap text-sm lg:text-base">
              ✨ Đăng ký
            </Link>
          </div>
        </div>
      </div>
      
      {/* Cart Drawer */}
      <CartDrawer />
    </header>
  )
}
