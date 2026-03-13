export interface Product {
    id: string
    name: string
    sku: string
    price: number
    unit: string
    stock: number
    image?: string
    images?: string[]
    category?: { id: string; name: string }
    inventoryItem?: { availableQuantity: number } | null
}

export interface CartItem {
    product: Product
    quantity: number
}

export interface EvaluatedItem {
    productId: string
    originalPrice: number
    effectivePrice: number
    discountAmount: number
    quantity: number
    totalPrice: number
    appliedRules?: string[]
}

export interface EvaluatedCart {
    items: EvaluatedItem[]
    summary: {
        totalOriginal: number
        totalDiscount: number
        totalPrice: number
    }
}

export interface SuccessOrderData {
    id: string
    orderNumber: string
    projectName: string
    items: {
        name: string
        quantity: number
        unitPrice: number
        effectivePrice: number
        total: number
    }[]
    subtotal: number
    discountTotal: number
    total: number
    createdAt: string
}
