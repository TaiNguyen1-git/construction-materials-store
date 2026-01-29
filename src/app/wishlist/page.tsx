'use client'

import { useWishlistStore, Collection } from '@/stores/wishlistStore'
import { useCartStore } from '@/stores/cartStore'
import Header from '@/components/Header'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  Package,
  FolderPlus,
  MoreVertical,
  ChevronRight,
  Plus,
  Folder,
  LayoutGrid,
  ExternalLink,
  MoveHorizontal,
  FolderTree,
  AlertCircle,
  List,
  CheckCircle2,
  MousePointer2,
  Lightbulb
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useState, useMemo } from 'react'

export default function WishlistPage() {
  const {
    items,
    collections,
    removeItem,
    clearWishlist,
    createCollection,
    deleteCollection,
    moveItemToCollection
  } = useWishlistStore()

  const { addItem: addToCart } = useCartStore()
  const [activeCollectionId, setActiveCollectionId] = useState<string>('default')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCollName, setNewCollName] = useState('')
  const [newCollDesc, setNewCollDesc] = useState('')
  const [newCollColor, setNewCollColor] = useState('blue')

  // States for custom opaque drag layer
  const [draggedItem, setDraggedItem] = useState<typeof items[0] | null>(null)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })

  // View Mode & Guide States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showGuideModal, setShowGuideModal] = useState(false)

  const COLLECTION_COLORS: Record<string, { bg: string, text: string, primary: string, shadow: string, border: string, gradient: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', primary: 'bg-blue-600', shadow: 'shadow-blue-100', border: 'border-blue-100', gradient: 'from-blue-500 to-indigo-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', primary: 'bg-rose-600', shadow: 'shadow-rose-100', border: 'border-rose-100', gradient: 'from-rose-500 to-pink-600' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', primary: 'bg-emerald-600', shadow: 'shadow-emerald-100', border: 'border-emerald-100', gradient: 'from-emerald-500 to-teal-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', primary: 'bg-orange-600', shadow: 'shadow-orange-100', border: 'border-orange-100', gradient: 'from-orange-500 to-amber-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', primary: 'bg-purple-600', shadow: 'shadow-purple-100', border: 'border-purple-100', gradient: 'from-purple-500 to-violet-600' },
  }

  // Memoized items for the active collection
  const filteredItems = useMemo(() => {
    return items.filter(item => item.collectionId === activeCollectionId)
  }, [items, activeCollectionId])

  const stats = useMemo(() => ({
    total: items.length,
    inStock: items.filter(i => i.inStock).length,
    collectionsCount: collections.length
  }), [items, collections])

  const handleAddToCart = (item: typeof items[0]) => {
    if (!item.inStock) {
      toast.error('Sản phẩm hiện đã hết hàng')
      return
    }

    addToCart({
      id: item.id,
      productId: item.productId,
      name: item.name,
      price: item.price,
      sku: item.sku,
      unit: 'pcs',
      image: item.image
    })

    toast.success('Đã thêm vào giỏ hàng!')
  }

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCollName.trim()) return
    const id = createCollection(newCollName, newCollDesc, newCollColor)
    setNewCollName('')
    setNewCollDesc('')
    setShowCreateModal(false)
    setActiveCollectionId(id)
    toast.success('Đã tạo bộ sưu tập mới')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Toaster position="top-right" />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* PREMIUM BENTO HEADER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-2">
                <Link href="/account" className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-slate-100">
                  <ArrowLeft size={18} />
                </Link>
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em]">Hệ thống SmartBuild</p>
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">
                Bộ Sưu Tập <span className="text-primary-600">Yêu Thích</span>
              </h1>
              <p className="text-slate-500 font-medium max-w-lg leading-relaxed">
                Nơi lưu trữ và tổ chức những vật liệu tốt nhất cho công trình của bạn. Tạo các bộ sưu tập theo từng khu vực hoặc giai đoạn thi công.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 mt-8 relative z-10">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-primary-600 text-white px-6 py-4 rounded-2xl hover:bg-primary-700 transition-all font-black text-xs uppercase tracking-widest active:scale-95 shadow-xl shadow-primary-100"
              >
                <FolderPlus size={18} />
                Tạo BST Mới
              </button>
              <Link
                href="/products"
                className="flex items-center gap-2 bg-white text-primary-600 border border-primary-100 px-6 py-4 rounded-2xl hover:bg-primary-50 transition-all font-black text-xs uppercase tracking-widest active:scale-95 shadow-sm"
              >
                <LayoutGrid size={18} />
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-6">
            <div className="bg-primary-600 rounded-[32px] p-6 text-white flex flex-col justify-between shadow-xl shadow-primary-100 group transition-all hover:-translate-y-1">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Heart size={20} fill="currentColor" />
              </div>
              <div>
                <p className="text-4xl font-black tracking-tighter">{stats.total}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Sản phẩm lưu</p>
              </div>
            </div>
            <div className="bg-emerald-500 rounded-[32px] p-6 text-white flex flex-col justify-between shadow-xl shadow-emerald-100 group transition-all hover:-translate-y-1">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Package size={20} />
              </div>
              <div>
                <p className="text-4xl font-black tracking-tighter">{stats.inStock}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Sẵn hàng</p>
              </div>
            </div>
            <div className="col-span-2 bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex items-center justify-between group hover:border-primary-600 transition-all cursor-pointer" onClick={() => clearWishlist()}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
                  <Trash2 size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 tracking-tight">Xóa tất cả</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dọn dẹp thư viện</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-primary-600 transition-all" />
            </div>
          </div>
        </div>

        {/* MAIN EXPLORER AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* COLLECTION SIDEBAR */}
          <div className="lg:col-span-1 space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Bộ sưu tập của tôi</p>
            <div className="bg-white rounded-[32px] border border-slate-200 p-3 shadow-sm space-y-1">
              {collections.map((coll) => {
                const colorTheme = COLLECTION_COLORS[coll.color || 'blue'] || COLLECTION_COLORS.blue;
                return (
                  <button
                    key={coll.id}
                    onClick={() => setActiveCollectionId(coll.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add(colorTheme.bg, 'scale-[1.02]', 'ring-2', 'ring-primary-400');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove(colorTheme.bg, 'scale-[1.02]', 'ring-2', 'ring-primary-400');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove(colorTheme.bg, 'scale-[1.02]', 'ring-2', 'ring-primary-400');
                      const productId = e.dataTransfer.getData('productId');
                      if (productId && coll.id !== activeCollectionId) {
                        moveItemToCollection(productId, coll.id);
                        toast.success(`Đã chuyển vào ${coll.name}`);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group relative ${activeCollectionId === coll.id
                      ? `${colorTheme.primary} text-white shadow-lg ${colorTheme.shadow}`
                      : `text-slate-600 hover:${colorTheme.bg} hover:${colorTheme.text}`
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${activeCollectionId === coll.id ? 'bg-white/20' : `${colorTheme.bg} ${colorTheme.text} group-hover:scale-110 transition-transform`}`}>
                        <Folder size={16} fill={activeCollectionId === coll.id ? "currentColor" : "none"} />
                      </div>
                      <span className="text-sm font-black tracking-tight truncate max-w-[120px]">{coll.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md ${activeCollectionId === coll.id ? 'bg-white/20' : 'bg-slate-50 text-slate-400'}`}>
                        {items.filter(i => i.collectionId === coll.id).length}
                      </span>
                      {coll.id !== 'default' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Bạn có chắc muốn xóa bộ sưu tập "${coll.name}"? Các sản phẩm bên trong sẽ bị xóa khỏi yêu thích.`)) {
                              deleteCollection(coll.id);
                              if (activeCollectionId === coll.id) {
                                setActiveCollectionId('default');
                              }
                              toast.success('Đã xóa bộ sưu tập');
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-all ${activeCollectionId === coll.id
                            ? 'hover:bg-red-500 text-white/60 hover:text-white'
                            : 'hover:bg-red-50 text-slate-300 hover:text-red-600'
                            }`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </button>
                );
              })}

              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all group border border-dashed border-slate-200 mt-2"
              >
                <Plus size={16} />
                <span className="text-sm font-bold">Thêm thư mục</span>
              </button>
            </div>

            {/* QUICK ACTIONS CARD */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-500 rounded-[32px] p-6 text-white overflow-hidden relative shadow-xl shadow-primary-100">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FolderTree size={100} />
              </div>
              <p className="text-[10px] font-black text-primary-100 uppercase tracking-[0.2em] mb-4">Mẹo sử dụng</p>
              <p className="text-sm font-medium leading-relaxed mb-6 text-primary-50">
                Lưu sản phẩm theo khu vực xây dựng để dễ dàng quản lý ngân sách và đặt hàng đồng loạt.
              </p>
              <button
                onClick={() => setShowGuideModal(true)}
                className="text-xs font-black uppercase tracking-widest text-white hover:text-primary-100 transition-colors flex items-center gap-2"
              >
                Tìm hiểu thêm <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* ITEM GRID */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <p className="text-xl font-black text-slate-900 tracking-tight">
                  {collections.find(c => c.id === activeCollectionId)?.name}
                </p>
                <div className="h-4 w-px bg-slate-200"></div>
                <p className="text-sm text-slate-500 font-medium">{filteredItems.length} sản phẩm</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                    className={`p-2 border rounded-xl transition-all active:scale-95 ${viewMode === 'grid'
                      ? 'bg-primary-50 text-primary-600 border-primary-200'
                      : 'bg-white text-slate-400 border-slate-200 hover:text-primary-600 hover:border-primary-100'
                      }`}
                  >
                    {viewMode === 'grid' ? <LayoutGrid size={18} /> : <List size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-[40px] border border-slate-200 py-24 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart size={40} className="text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Thư mục đang trống</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                  Hãy thêm những vật liệu yêu thích của bạn vào bộ sưu tập này để bắt đầu kế hoạch.
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-2xl hover:bg-primary-700 transition-all font-black text-xs uppercase tracking-widest active:scale-95 shadow-xl shadow-primary-100"
                >
                  Khám phá ngay
                </Link>
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
              }>
                {filteredItems.map((item) => (
                  <div
                    key={item.productId}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('productId', item.productId);
                      e.dataTransfer.effectAllowed = 'move';
                      const img = new globalThis.Image();
                      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                      e.dataTransfer.setDragImage(img, 0, 0);
                      setDraggedItem(item);
                      const target = e.currentTarget;
                      requestAnimationFrame(() => { target.style.opacity = '0.2'; });
                    }}
                    onDrag={(e) => {
                      if (e.clientX !== 0 && e.clientY !== 0) {
                        setDragPos({ x: e.clientX, y: e.clientY });
                      }
                    }}
                    onDragEnd={(e) => {
                      setDraggedItem(null);
                      e.currentTarget.style.opacity = '1';
                    }}
                    className={`bg-white rounded-[32px] border border-slate-200 group hover:border-primary-600 hover:shadow-2xl hover:shadow-primary-600/5 transition-all relative cursor-grab active:cursor-grabbing ${viewMode === 'grid' ? 'p-4 flex flex-col h-full' : 'p-3 flex items-center gap-6'}`}
                  >
                    {/* Image Area */}
                    <div className={`overflow-hidden relative bg-slate-50 ${viewMode === 'grid' ? 'aspect-[4/3] rounded-[24px] mb-4' : 'w-32 h-32 rounded-[20px] flex-shrink-0'}`}>
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Package size={viewMode === 'grid' ? 48 : 32} />
                        </div>
                      )}

                      {/* Floating Actions (Grid Only) */}
                      {viewMode === 'grid' && (
                        <>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="absolute top-3 right-3 p-3 bg-white/90 backdrop-blur-md rounded-xl text-slate-400 hover:text-rose-600 hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md border ${item.inStock
                            ? 'bg-emerald-500 border-emerald-400 text-white'
                            : 'bg-rose-500 border-rose-400 text-white'
                            }`}>
                            {item.inStock ? 'Còn hàng' : 'Hết hàng'}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 px-2 min-w-0">
                      <div className="flex justify-between items-start mb-2 group-hover:px-1 transition-all">
                        <h4 className={`font-black text-slate-900 leading-tight tracking-tight ${viewMode === 'grid' ? 'line-clamp-2' : 'truncate text-lg'}`}>
                          {item.name}
                        </h4>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">SKU: {item.sku}</p>

                      {viewMode === 'list' && (
                        <div className={`inline-flex px-3 py-1 mb-3 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm border ${item.inStock
                          ? 'bg-emerald-500 border-emerald-400 text-white'
                          : 'bg-rose-500 border-rose-400 text-white'
                          }`}>
                          {item.inStock ? 'Còn hàng' : 'Hết hàng'}
                        </div>
                      )}

                      <p className="text-2xl font-black text-primary-600 tracking-tighter mb-4">
                        {item.price.toLocaleString()}đ
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className={viewMode === 'grid' ? "grid grid-cols-5 gap-2 px-1 pb-1" : "flex flex-col gap-2 w-40"}>
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.inStock}
                        className={`${viewMode === 'grid' ? 'col-span-4' : 'w-full'} bg-primary-600 text-white p-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2 shadow-lg shadow-primary-100`}
                      >
                        <ShoppingCart size={14} />
                        {viewMode === 'grid' ? 'Thêm vào giỏ' : 'Thêm'}
                      </button>

                      {viewMode === 'list' ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div
                            className="bg-slate-50 hover:bg-primary-50 text-slate-600 hover:text-primary-600 p-3 rounded-[16px] border border-slate-100 hover:border-primary-100 transition-all flex items-center justify-center relative group/move cursor-pointer"
                            title="Chuyển BST"
                          >
                            <MoveHorizontal size={16} />
                            {collections.length > 1 && (
                              <div className="absolute right-full top-0 mr-2 w-48 opacity-0 pointer-events-none group-hover/move:opacity-100 group-hover/move:pointer-events-auto transition-all z-20">
                                <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-2">
                                  {collections.filter(c => c.id !== item.collectionId).map(c => (
                                    <button
                                      key={c.id}
                                      onClick={(e) => {
                                        e.preventDefault(); e.stopPropagation();
                                        moveItemToCollection(item.productId, c.id);
                                        toast.success(`Đã chuyển tới ${c.name}`);
                                      }}
                                      className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary-600 transition-all flex items-center gap-2"
                                    >
                                      <Folder size={12} /> {c.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-3 rounded-[16px] border border-slate-100 hover:border-rose-100 transition-all flex items-center justify-center"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="col-span-1 bg-slate-50 hover:bg-primary-50 text-slate-600 hover:text-primary-600 p-4 rounded-[20px] border border-slate-100 hover:border-primary-100 transition-all flex items-center justify-center relative group/move cursor-pointer"
                          title="Chuyển sang bộ sưu tập khác"
                          onClick={() => {
                            if (collections.length <= 1) toast.error('Bạn cần tạo thêm bộ sưu tập để chuyển sản phẩm');
                          }}
                        >
                          <MoveHorizontal size={16} strokeWidth={3} />
                          {collections.length > 1 && (
                            <div
                              className="absolute bottom-full right-0 w-48 opacity-0 pointer-events-none group-hover/move:opacity-100 group-hover/move:pointer-events-auto transition-all z-20 pb-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Chuyển sang BST</p>
                                {collections.filter(c => c.id !== item.collectionId).map(c => (
                                  <button
                                    key={c.id}
                                    onClick={(e) => {
                                      e.preventDefault(); e.stopPropagation();
                                      moveItemToCollection(item.productId, c.id);
                                      toast.success(`Đã chuyển tới ${c.name}`);
                                    }}
                                    className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary-600 transition-all flex items-center gap-2"
                                  >
                                    <Folder size={12} /> {c.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main >

      {/* Custom Drag Layer */}
      {
        draggedItem && (
          <div
            className="fixed pointer-events-none z-[9999] w-72 bg-white rounded-[32px] p-4 border-2 border-primary-500 shadow-2xl opacity-100"
            style={{
              left: dragPos.x - 144,
              top: dragPos.y - 100,
              transform: 'rotate(-2deg)'
            }}
          >
            <div className="aspect-[4/3] rounded-[24px] bg-slate-50 overflow-hidden mb-4 relative">
              {draggedItem.image && (
                <Image src={draggedItem.image} alt="" fill className="object-cover" />
              )}
            </div>
            <h4 className="font-black text-slate-900 leading-tight line-clamp-1 tracking-tight mb-1 text-sm">
              {draggedItem.name}
            </h4>
            <p className="text-primary-600 font-black text-lg">{draggedItem.price.toLocaleString()}đ</p>
          </div>
        )
      }

      {/* CREATE COLLECTION MODAL */}
      {
        showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
            <div className="bg-white rounded-[40px] p-10 w-full max-w-md relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Tạo Bộ Sưu Tập</h3>
              <p className="text-slate-500 font-medium mb-8">Đặt tên cho nhóm sản phẩm mới của bạn.</p>

              <form onSubmit={handleCreateCollection} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Tên thư mục</label>
                  <input
                    type="text"
                    value={newCollName}
                    onChange={(e) => setNewCollName(e.target.value)}
                    placeholder="Ví dụ: Phòng khách, Nhà Master..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Màu đại diện</label>
                  <div className="flex gap-3 px-2">
                    {Object.keys(COLLECTION_COLORS).map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCollColor(color)}
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${COLLECTION_COLORS[color].gradient} transition-all ${newCollColor === color ? 'ring-4 ring-offset-4 ring-slate-200 scale-110' : 'opacity-60 hover:opacity-100'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-slate-50 text-slate-400 p-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 bg-gradient-to-br ${COLLECTION_COLORS[newCollColor].gradient} text-white p-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-xl ${COLLECTION_COLORS[newCollColor].shadow}`}
                  >
                    Tạo ngay
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
      {/* GUIDE MODAL */}
      {
        showGuideModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowGuideModal(false)}></div>
            <div className="bg-white rounded-[40px] p-0 w-full max-w-3xl relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                {/* Left Decoration */}
                <div className="md:col-span-2 bg-gradient-to-br from-primary-600 to-indigo-700 p-8 text-white flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Lightbulb size={200} />
                  </div>
                  <div>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                      <FolderTree size={24} />
                    </div>
                    <h3 className="text-3xl font-black tracking-tighter mb-4">Mẹo Sử Dụng</h3>
                    <p className="text-primary-100 font-medium leading-relaxed opacity-90">
                      Tối ưu hóa quy trình quản lý vật liệu của bạn với các tính năng thông minh của SmartBuild Wishlist.
                    </p>
                  </div>
                  <div className="flex gap-2 mt-8">
                    <div className="w-2 h-2 rounded-full bg-white opacity-100"></div>
                    <div className="w-2 h-2 rounded-full bg-white opacity-40"></div>
                    <div className="w-2 h-2 rounded-full bg-white opacity-40"></div>
                  </div>
                </div>

                {/* Right Content */}
                <div className="md:col-span-3 p-8 md:p-10 bg-white">
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">3 Bước đơn giản</h4>

                  <div className="space-y-8">
                    <div className="flex gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <FolderPlus size={24} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">1. Phân loại không gian</h5>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          Tạo các bộ sưu tập riêng cho từng khu vực như
                          <span className="font-semibold text-slate-700"> Phòng khách, Bếp, Master Bedroom</span>.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <MousePointer2 size={24} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">2. Kéo thả thông minh</h5>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          Di chuyển vật liệu giữa các thư mục chỉ bằng thao tác
                          <span className="font-semibold text-slate-700"> Kéo & Thả (Drag & Drop)</span> cực nhanh.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">3. Lên kế hoạch mua sắm</h5>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          Sử dụng chế độ xem
                          <span className="font-semibold text-slate-700"> Danh sách (List View)</span> để dễ dàng so sánh giá và kiểm soát ngân sách.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowGuideModal(false)}
                    className="w-full mt-10 bg-slate-900 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg hover:shadow-primary-200 active:scale-95"
                  >
                    Đã hiểu, bắt đầu ngay!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
