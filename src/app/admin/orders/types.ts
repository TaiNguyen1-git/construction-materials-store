export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
}

export interface Product {
  id: string
  name: string
  sku: string
  price: number
}

export interface OrderItem {
  id: string
  productId: string
  product: Product
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Order {
  id: string
  orderNumber: string
  customer?: Customer
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  customerType: 'REGISTERED' | 'GUEST'
  orderItems: OrderItem[]
  totalAmount: number
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED_AWAITING_DEPOSIT' | 'DEPOSIT_PAID' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'RETURNED'
  shippingAddress: string | any
  paymentMethod: string
  paymentStatus?: string
  paymentType?: 'FULL' | 'DEPOSIT'
  depositPercentage?: number
  depositAmount?: number
  remainingAmount?: number
  depositPaidAt?: string
  depositProof?: string
  confirmedBy?: string
  confirmedAt?: string
  trackingNumber?: string
  note?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface PaginationData {
  total: number
  page: number
  limit: number
  pages: number
}

export interface OrderFilters {
  status: string
  customerId: string
  customerType: string
  search: string
  page: number
}
