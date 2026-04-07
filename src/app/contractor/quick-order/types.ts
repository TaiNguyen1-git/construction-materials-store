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
    shippingFee: number
    total: number
    paymentMethod?: string
    createdAt: string
}

// Project for shipping calculation
export interface ContractorProject {
    id: string
    title: string
    description?: string
    status: string
    location?: string
    lat?: number | null
    lng?: number | null
    city?: string
    district?: string
}

// Shipping calculation result from API
export interface ShippingCalculation {
    distanceKm: number
    distanceStraight: number
    baseFee: number
    finalFee: number
    isFreeShipping: boolean
    freeReason?: string
    tier: {
        minKm: number
        maxKm: number
        fee: number
        label: string
    }
    requiresContact: boolean
}
