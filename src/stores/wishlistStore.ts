import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface WishlistItem {
  id: string
  productId: string
  name: string
  price: number
  image?: string
  sku: string
  inStock: boolean
  addedAt: Date
}

interface WishlistStore {
  items: WishlistItem[]
  
  // Actions
  addItem: (item: Omit<WishlistItem, 'addedAt'>) => void
  removeItem: (productId: string) => void
  clearWishlist: () => void
  isInWishlist: (productId: string) => boolean
  
  // Getters
  getTotalItems: () => number
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const items = get().items
        const exists = items.find(i => i.productId === item.productId)

        if (!exists) {
          set({
            items: [
              ...items,
              {
                ...item,
                addedAt: new Date()
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

      clearWishlist: () => {
        set({ items: [] })
      },

      isInWishlist: (productId) => {
        return get().items.some(i => i.productId === productId)
      },

      getTotalItems: () => {
        return get().items.length
      }
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
