import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  sku: string
  unit: string
  maxStock?: number
  wholesalePrice?: number
  minWholesaleQty?: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void

  // Getters
  getTotalItems: () => number
  getTotalPrice: () => number
  getItem: (productId: string) => CartItem | undefined
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const items = get().items
        const existingItem = items.find(i => i.productId === item.productId)

        if (existingItem) {
          // Update quantity if item already exists
          const newQuantity = existingItem.quantity + (item.quantity || 1)

          // Check max stock if available
          if (item.maxStock && newQuantity > item.maxStock) {
            alert(`Chỉ còn ${item.maxStock} sản phẩm trong kho!`)
            return
          }

          set({
            items: items.map(i =>
              i.productId === item.productId
                ? { ...i, quantity: newQuantity }
                : i
            )
          })
        } else {
          // Add new item
          set({
            items: [
              ...items,
              {
                ...item,
                quantity: item.quantity || 1
              }
            ]
          })
        }
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter(i => i.productId !== productId)
        })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        const item = get().getItem(productId)
        if (item?.maxStock && quantity > item.maxStock) {
          alert(`Chỉ còn ${item.maxStock} sản phẩm trong kho!`)
          return
        }

        set({
          items: get().items.map(i =>
            i.productId === productId
              ? { ...i, quantity }
              : i
          )
        })
      },

      clearCart: () => {
        set({ items: [] })
      },

      toggleCart: () => {
        set({ isOpen: !get().isOpen })
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const unitPrice = (item.wholesalePrice && item.minWholesaleQty && item.quantity >= item.minWholesaleQty)
            ? item.wholesalePrice
            : item.price
          return total + (unitPrice * item.quantity)
        }, 0)
      },

      getItem: (productId) => {
        return get().items.find(i => i.productId === productId)
      }
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
