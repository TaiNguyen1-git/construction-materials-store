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
  collectionId: string
}

export interface Collection {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
}

interface WishlistStore {
  items: WishlistItem[]
  collections: Collection[]

  // Actions
  addItem: (item: Omit<WishlistItem, 'addedAt' | 'collectionId'>, collectionId?: string) => void
  removeItem: (productId: string) => void
  clearWishlist: () => void
  isInWishlist: (productId: string) => boolean

  // Collection Actions
  createCollection: (name: string, description?: string, color?: string) => string
  updateCollection: (id: string, updates: Partial<Collection>) => void
  deleteCollection: (id: string) => void
  moveItemToCollection: (productId: string, targetCollectionId: string) => void

  // Getters
  getTotalItems: () => number
  getCollectionItems: (collectionId: string) => WishlistItem[]
}

const DEFAULT_COLLECTION_ID = 'default'

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      collections: [
        {
          id: DEFAULT_COLLECTION_ID,
          name: 'Yêu thích chung',
          description: 'Danh sách sản phẩm quan tâm',
          color: 'blue'
        }
      ],

      addItem: (item, collectionId = DEFAULT_COLLECTION_ID) => {
        const items = get().items
        const exists = items.find(i => i.productId === item.productId)

        if (!exists) {
          set({
            items: [
              ...items,
              {
                ...item,
                collectionId,
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

      createCollection: (name, description, color = 'blue') => {
        const id = Math.random().toString(36).substring(2, 9)
        set(state => ({
          collections: [
            ...state.collections,
            { id, name, description, color }
          ]
        }))
        return id
      },

      updateCollection: (id, updates) => {
        set(state => ({
          collections: state.collections.map(c => c.id === id ? { ...c, ...updates } : c)
        }))
      },

      deleteCollection: (id) => {
        if (id === DEFAULT_COLLECTION_ID) return
        set(state => ({
          collections: state.collections.filter(c => c.id !== id),
          // Move items back to default
          items: state.items.map(item =>
            item.collectionId === id ? { ...item, collectionId: DEFAULT_COLLECTION_ID } : item
          )
        }))
      },

      moveItemToCollection: (productId, targetCollectionId) => {
        set(state => ({
          items: state.items.map(item =>
            item.productId === productId ? { ...item, collectionId: targetCollectionId } : item
          )
        }))
      },

      getTotalItems: () => {
        return get().items.length
      },

      getCollectionItems: (collectionId) => {
        return get().items.filter(item => item.collectionId === collectionId)
      }
    }),
    {
      name: 'wishlist-storage-v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
