export interface Product {
    id: string
    name: string
    sku: string
    price: number
    unit: string
    category: { name: string } | null
    inventoryItem: { availableQuantity: number } | null
    images: string[]
    _id?: string
}

export interface ItemDiscount {
    type: 'percent' | 'fixed'
    value: number
}

export interface CartItem {
    product: Product
    quantity: number
    discount?: ItemDiscount
}

export interface Customer {
    id: string
    name: string
    phone: string
    email?: string
    address?: string
}

export interface SuccessOrder {
    id: string
    orderNumber: string
    customerName: string
    customerPhone?: string
    items: { name: string; quantity: number; unitPrice: number; total: number; discount?: ItemDiscount }[]
    subtotal: number
    itemDiscountTotal: number
    orderDiscountAmount: number
    totalDiscount: number
    total: number
    paymentMethod: string
    createdAt: string
}

export interface GuestInfo {
    name: string
    phone: string
}

export interface SuspendedCart {
    id: string
    label: string
    cart: CartItem[]
    customer: Customer | null
    guestInfo: GuestInfo
    shippingFee: number
    deliveryDate: string
    savedAt: string
}
