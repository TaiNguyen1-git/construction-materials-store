import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ContractorCartItem {
    id: string
    productId: string
    name: string
    price: number
    quantity: number
    image?: string
    sku: string
    unit: string
    maxStock?: number
}

interface ContractorCartStore {
    items: ContractorCartItem[]
    projectName: string
    poNumber: string
    notes: string

    // Actions
    addItem: (item: Omit<ContractorCartItem, 'quantity'> & { quantity?: number }) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    setProjectName: (name: string) => void
    setPoNumber: (po: string) => void
    setNotes: (notes: string) => void

    // Getters
    getTotalItems: () => number
    getTotalPrice: () => number
    getItem: (productId: string) => ContractorCartItem | undefined
}

export const useContractorCartStore = create<ContractorCartStore>()(
    persist(
        (set, get) => ({
            items: [],
            projectName: '',
            poNumber: '',
            notes: '',

            addItem: (item) => {
                const items = get().items
                const existingItem = items.find(i => i.productId === item.productId)

                if (existingItem) {
                    // Update quantity if item already exists
                    const newQuantity = existingItem.quantity + (item.quantity || 1)

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

                set({
                    items: get().items.map(i =>
                        i.productId === productId
                            ? { ...i, quantity }
                            : i
                    )
                })
            },

            clearCart: () => {
                set({ items: [], projectName: '', poNumber: '', notes: '' })
            },

            setProjectName: (name) => set({ projectName: name }),
            setPoNumber: (po) => set({ poNumber: po }),
            setNotes: (notes) => set({ notes: notes }),

            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0)
            },

            getTotalPrice: () => {
                return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
            },

            getItem: (productId) => {
                return get().items.find(i => i.productId === productId)
            }
        }),
        {
            name: 'contractor-cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
)
