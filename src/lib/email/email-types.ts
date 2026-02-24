// Email shared types and constants

export interface EmailTemplate {
    to: string
    subject: string
    html: string
    text?: string
}

export interface OrderItem {
    name: string
    quantity: number
    price: number
}

export interface OrderApprovedData {
    email: string
    name: string
    orderNumber: string
    orderId: string
    totalAmount: number
    depositAmount?: number
    paymentMethod: string
    paymentType: string
    items: OrderItem[]
}

export interface NewOrderEmployeeData {
    orderNumber: string
    customerName: string
    customerPhone?: string
    totalAmount: number
    itemCount: number
}

export interface StockAlertData {
    productName: string
    sku: string
    currentStock: number
    minStock: number
}

export interface AdminReportData {
    reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
    periodLabel: string
    revenue: {
        total: number
        orderCount: number
        averageOrderValue: number
        growth?: number
    }
    stats: {
        newCustomers: number
        topProducts: Array<{ name: string; quantity: number; revenue: number }>
        inventoryStatus: {
            lowStockItems: number
            totalValue: number
        }
    }
    employeeKPI: Array<{
        name: string
        role: string
        tasksCompleted: number
        shiftsWorked: number
        performanceScore: number
    }>
}

export interface OrderConfirmationData {
    email: string
    name: string
    orderNumber: string
    totalAmount: number
    items: OrderItem[]
}

export interface ShippingNotificationData {
    email: string
    name: string
    orderNumber: string
    trackingNumber?: string
}

export interface PasswordResetData {
    email: string
    name: string
    resetLink: string
}

export interface OTPData {
    email: string
    name: string
    otpCode: string
    type: 'VERIFICATION' | '2FA' | 'CHANGE_PROFILE'
    expiresInMinutes?: number
}

export const BANK_INFO = {
    bankId: '970423', // TPBank
    bankName: 'TPBank',
    accountNumber: '06729594301',
    accountName: 'NGUYEN THANH TAI',
    fullBankName: 'Ngân hàng TMCP Tiên Phong (TPBank)'
}

// Helper function to get base URL - handles Vercel serverless environment
export function getBaseUrl(): string {
    const url = (
        process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
        (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
        'http://localhost:3000'
    ).replace(/\/$/, '')
    return url
}
