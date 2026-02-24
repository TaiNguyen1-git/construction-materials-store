'use client'

export interface Product {
    id: string
    name: string
    sku: string
    price: number
    unit: string
    category: { id: string; name: string }
    supplier?: { id: string; name: string } | null
    supplierId?: string | null
    inventoryItem?: {
        quantity: number
        availableQuantity?: number
        minStockLevel: number
    }
    isActive: boolean
}

export interface Category {
    id: string
    name: string
}

export interface Supplier {
    id: string
    name: string
    contactPerson: string | null
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    creditLimit: number
    currentBalance: number
    rating: number | null
    isActive: boolean
}

export const getStockStatus = (product: Product) => {
    if (!product.inventoryItem) return { text: 'Chưa có', color: 'bg-gray-100 text-gray-800' }
    const qty = product.inventoryItem.availableQuantity ?? product.inventoryItem.quantity ?? 0
    const min = product.inventoryItem.minStockLevel || 0
    if (qty <= 0) return { text: 'Hết hàng', color: 'bg-red-100 text-red-800' }
    if (qty <= min) return { text: 'Sắp hết', color: 'bg-yellow-100 text-yellow-800' }
    return { text: 'Còn hàng', color: 'bg-green-100 text-green-800' }
}
