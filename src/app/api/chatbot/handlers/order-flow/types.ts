import { OrderItem } from '@/lib/chatbot/entity-extractor'

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export interface EnrichedOrderItem {
    productName: string
    productId: string
    quantity: number
    unit: string
    selectedProduct: {
        id: string
        name: string
        price: number
        unit: string
        sku: string
    }
}

export interface CustomerInfo {
    name: string
    phone: string
    email: string
    address: string
}

export interface GuestInfo {
    name?: string
    phone?: string
    address?: string
}

export interface VatInfo {
    companyName: string
    taxId: string
    companyAddress: string
}

export interface OrderEntities {
    orderNumber?: string
    phone?: string
    phoneNumber?: string
    rawMessage?: string
}
