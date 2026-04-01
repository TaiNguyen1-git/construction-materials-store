export interface Category {
    id: string
    name: string
}

export interface Product {
    id: string
    name: string
    sku: string
    price: number
    isActive: boolean
    category: { id?: string, name: string }
    images: string[]
    inventoryItem?: {
        availableQuantity: number
    }
    unit: string
    wholesalePrice?: number
    minWholesaleQty?: number
}
