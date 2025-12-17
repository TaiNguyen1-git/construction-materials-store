'use client'

import Link from 'next/link'
import { Package, Heart, User, LogOut, ChevronDown, Building2, Home, Tag, Info, Phone, Search, LogIn, UserPlus, Calculator, Briefcase, MessageSquare, Users } from 'lucide-react'
import CartIcon from './CartIcon'
import NotificationBell from './NotificationBell'
import { useWishlistStore } from '@/stores/wishlistStore'
import { useAuth } from '@/contexts/auth-context'
import { useState } from 'react'

export default function Header() {
  const { getTotalItems } = useWishlistStore()
  const { user, isAuthenticated, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMarketplaceMenu, setShowMarketplaceMenu] = useState(false)
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
              SmartBuild
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-3 xl:space-x-5 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-primary-600 font-semibold relative group whitespace-nowrap text-sm">
              <Home className="w-4 h-4" />
              Trang chủ
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/products" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 font-semibold relative group whitespace-nowrap text-sm">
              <Package className="w-4 h-4" />
              Sản phẩm
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/categories" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 font-semibold relative group whitespace-nowrap text-sm">
              <Tag className="w-4 h-4" />
              Danh mục
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/about" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 font-semibold relative group whitespace-nowrap text-sm">
              <Info className="w-4 h-4" />
              Giới thiệu
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/contact" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 font-semibold relative group whitespace-nowrap text-sm">
              <Phone className="w-4 h-4" />
              Liên hệ
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            {/* Marketplace Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMarketplaceMenu(!showMarketplaceMenu)}
                onBlur={() => setTimeout(() => setShowMarketplaceMenu(false), 200)}
                className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-all text-sm shadow-md hover:shadow-lg"
              >
                <Building2 className="w-4 h-4" />
                Sàn Giao Dịch
                <ChevronDown className={`w-4 h-4 transition-transform ${showMarketplaceMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMarketplaceMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                  <Link
                    href="/contractors"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    onClick={() => setShowMarketplaceMenu(false)}
                  >
                    <Users className="h-5 w-5 mr-3 text-indigo-600" />
                    <div>
                      <div className="font-semibold">Nhà Thầu</div>
                      <div className="text-xs text-gray-500">Tìm nhà thầu uy tín</div>
                    </div>
                  </Link>
                  <Link
                    href="/projects"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    onClick={() => setShowMarketplaceMenu(false)}
                  >
                    <Briefcase className="h-5 w-5 mr-3 text-purple-600" />
                    <div>
                      <div className="font-semibold">Dự Án</div>
                      <div className="text-xs text-gray-500">Xem & đăng dự án</div>
                    </div>
                  </Link>
                  <Link
                    href="/messages"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    onClick={() => setShowMarketplaceMenu(false)}
                  >
                    <MessageSquare className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <div className="font-semibold">Tin Nhắn</div>
                      <div className="text-xs text-gray-500">Liên hệ nhà thầu</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
            <Link
              href="/estimator"
              className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-all text-sm shadow-md hover:shadow-lg"
            >
              <Calculator className="w-4 h-4" />
              Dự toán AI
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

            {/* Notification Bell - Only show when authenticated */}
            {isAuthenticated && <NotificationBell />}

            {/* User Menu or Login/Register */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-600 to-secondary-600 flex items-center justify-center text-white font-semibold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:block text-sm font-semibold text-gray-700">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <Link
                      href="/account"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Tài khoản của tôi
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        setShowUserMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="hidden md:flex items-center gap-1 text-gray-600 hover:text-primary-600 font-semibold transition-all duration-300 whitespace-nowrap text-sm lg:text-base">
                  <LogIn className="h-4 w-4" /> Đăng nhập
                </Link>
                <Link href="/register" className="gradient-primary text-white px-4 lg:px-6 py-2 rounded-full hover:from-primary-700 hover:to-secondary-700 font-semibold transition-all duration-300 hover:scale-105 shadow-lg whitespace-nowrap text-sm lg:text-base flex items-center gap-1">
                  <UserPlus className="h-4 w-4" /> Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
