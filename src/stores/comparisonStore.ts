import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ComparisonProduct {
  id: string
  name: string
  price: number
  sku: string
  description: string
  images: string[]
  category?: {
    id: string
    name: string
  }
  inventoryItem?: {
    availableQuantity: number
  }
  unit?: string
  weight?: number
  dimensions?: string
  tags?: string[]
}

interface ComparisonStore {
  products: ComparisonProduct[]
  maxProducts: number
  
  // Actions
  addProduct: (product: ComparisonProduct) => boolean
  removeProduct: (productId: string) => void
  clearAll: () => void
  isInComparison: (productId: string) => boolean
  canAddMore: () => boolean
  getCount: () => number
}

export const useComparisonStore = create<ComparisonStore>()(
  persist(
    (set, get) => ({
      products: [],
      maxProducts: 4,

      addProduct: (product) => {
        const { products, maxProducts } = get()
        
        if (products.length >= maxProducts) {
          return false // Can't add more
        }
        
        if (products.find(p => p.id === product.id)) {
          return false // Already in comparison
        }

        set({ products: [...products, product] })
        return true
      },

      removeProduct: (productId) => {
        set({ products: get().products.filter(p => p.id !== productId) })
      },

      clearAll: () => {
        set({ products: [] })
      },

      isInComparison: (productId) => {
        return get().products.some(p => p.id === productId)
      },

      canAddMore: () => {
        return get().products.length < get().maxProducts
      },

      getCount: () => {
        return get().products.length
      }
    }),
    {
      name: 'comparison-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
