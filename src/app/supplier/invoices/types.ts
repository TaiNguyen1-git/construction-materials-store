export interface InvoiceItem {
    id: string
    productId: string
    description?: string
    quantity: number
    unitPrice: number
    totalPrice: number
    discount: number
    taxRate: number
    taxAmount: number
    product?: { name: string }
}

export interface Invoice {
    id: string
    invoiceNumber: string
    invoiceType: string
    orderId?: string
    customerId?: string
    supplierId?: string
    issueDate: string
    dueDate?: string
    status: string
    subtotal: number
    taxAmount: number
    discountAmount: number
    totalAmount: number
    paidAmount: number
    balanceAmount: number
    paymentTerms?: string
    notes?: string
    vatInvoiceUrl?: string
    createdAt: string
    updatedAt: string
    invoiceItems: InvoiceItem[]
    order?: { orderNumber: string }
    customer?: { user?: { name?: string; email?: string }; companyName?: string }
}
