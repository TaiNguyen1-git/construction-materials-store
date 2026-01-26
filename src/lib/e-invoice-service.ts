/**
 * E-Invoice Service - Feature 1: Hóa đơn điện tử VAT
 * 
 * Tích hợp với các nhà cung cấp hóa đơn điện tử Việt Nam:
 * - Misa meInvoice
 * - Viettel S-Invoice
 * - VNPT E-Invoice
 * - FPT.eInvoice
 * - BKAV eHoadon
 */

import { prisma } from './prisma'
import { EInvoiceProvider, EInvoiceStatus } from '@prisma/client'

// Cấu hình provider (sẽ được lấy từ env)
interface ProviderConfig {
    apiUrl: string
    apiKey: string
    username: string
    password: string
    taxCode: string      // MST doanh nghiệp
    templateCode: string // Mẫu hóa đơn
    series: string       // Ký hiệu hóa đơn
}

interface InvoiceData {
    orderId?: string
    quoteId?: string
    invoiceId?: string   // Link to internal invoice

    // Buyer
    buyerName: string
    buyerTaxCode?: string
    buyerAddress?: string
    buyerEmail?: string

    // Items
    items: Array<{
        name: string
        unit: string
        quantity: number
        unitPrice: number
        vatRate: number
    }>

    // Payment
    paymentMethod?: string
    notes?: string
}

export class EInvoiceService {
    private static config: ProviderConfig | null = null
    private static provider: EInvoiceProvider = 'INTERNAL'

    /**
     * Initialize service with provider config
     */
    static initialize(provider: EInvoiceProvider, config: ProviderConfig) {
        this.provider = provider
        this.config = config
    }

    /**
     * Create and issue an e-invoice
     */
    static async createInvoice(data: InvoiceData): Promise<{
        success: boolean
        invoiceId?: string
        invoiceNumber?: string
        error?: string
    }> {
        try {
            // Calculate totals
            let subtotal = 0
            let vatAmount = 0

            for (const item of data.items) {
                const itemTotal = item.quantity * item.unitPrice
                subtotal += itemTotal
                vatAmount += itemTotal * (item.vatRate / 100)
            }

            const totalAmount = subtotal + vatAmount

            // Generate invoice number (for internal use)
            const year = new Date().getFullYear()
            const count = await prisma.eInvoice.count({
                where: {
                    createdAt: {
                        gte: new Date(`${year}-01-01`),
                        lt: new Date(`${year + 1}-01-01`)
                    }
                }
            })
            const invoiceNumber = `HD${year}${String(count + 1).padStart(6, '0')}`

            // Create invoice record
            const invoice = await prisma.eInvoice.create({
                data: {
                    orderId: data.orderId,
                    quoteId: data.quoteId,
                    invoiceId: data.invoiceId,

                    invoiceNumber,
                    invoiceSeries: this.config?.series,
                    templateCode: this.config?.templateCode,

                    sellerTaxCode: this.config?.taxCode || process.env.COMPANY_TAX_CODE || '',
                    sellerName: process.env.COMPANY_NAME || 'Cửa hàng VLXD',
                    sellerAddress: process.env.COMPANY_ADDRESS,

                    buyerName: data.buyerName,
                    buyerTaxCode: data.buyerTaxCode,
                    buyerAddress: data.buyerAddress,
                    buyerEmail: data.buyerEmail,

                    subtotal,
                    vatRate: 10,  // Default 10%
                    vatAmount,
                    totalAmount,

                    provider: this.provider,
                    status: 'DRAFT'
                }
            })

            // If not internal, send to provider
            if (this.provider !== 'INTERNAL' && this.config) {
                const result = await this.sendToProvider(invoice.id, data)
                if (!result.success) {
                    return { success: false, error: result.error }
                }
            }

            return {
                success: true,
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber
            }
        } catch (error: any) {
            console.error('E-Invoice creation error:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Send invoice to external provider
     */
    private static async sendToProvider(invoiceId: string, data: InvoiceData): Promise<{
        success: boolean
        providerInvoiceId?: string
        error?: string
    }> {
        if (!this.config) {
            return { success: false, error: 'Provider not configured' }
        }

        try {
            // Build provider-specific payload
            let apiUrl = ''
            let payload: any = {}

            switch (this.provider) {
                case 'MISA':
                    apiUrl = `${this.config.apiUrl}/api/v1/invoices`
                    payload = this.buildMisaPayload(data)
                    break
                case 'VIETTEL':
                    apiUrl = `${this.config.apiUrl}/services/invoiceservice/sinvoice`
                    payload = this.buildViettelPayload(data)
                    break
                case 'VNPT':
                    apiUrl = `${this.config.apiUrl}/PublishService.asmx`
                    payload = this.buildVNPTPayload(data)
                    break
                default:
                    return { success: false, error: 'Unsupported provider' }
            }

            // Make API call (simulated for now)
            console.log(`[E-INVOICE] Sending to ${this.provider}:`, apiUrl)

            // In production, use fetch:
            // const response = await fetch(apiUrl, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${this.config.apiKey}`
            //     },
            //     body: JSON.stringify(payload)
            // })

            // Simulate success response
            const providerInvoiceId = `${this.provider}_${Date.now()}`

            // Update invoice with provider response
            await prisma.eInvoice.update({
                where: { id: invoiceId },
                data: {
                    providerInvoiceId,
                    providerResponse: { status: 'success', id: providerInvoiceId },
                    status: 'PENDING_SIGN'
                }
            })

            return { success: true, providerInvoiceId }
        } catch (error: any) {
            console.error('Provider API error:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Sign and finalize invoice
     */
    static async signInvoice(invoiceId: string): Promise<{
        success: boolean
        pdfUrl?: string
        error?: string
    }> {
        try {
            const invoice = await prisma.eInvoice.findUnique({
                where: { id: invoiceId }
            })

            if (!invoice) {
                return { success: false, error: 'Invoice not found' }
            }

            // In production, call provider's sign API
            // For now, simulate signing
            const pdfUrl = `/invoices/${invoice.invoiceNumber}.pdf`

            await prisma.eInvoice.update({
                where: { id: invoiceId },
                data: {
                    status: 'SIGNED',
                    signedAt: new Date(),
                    pdfUrl
                }
            })

            return { success: true, pdfUrl }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Send signed invoice to customer
     */
    static async sendToCustomer(invoiceId: string): Promise<{
        success: boolean
        error?: string
    }> {
        try {
            const invoice = await prisma.eInvoice.findUnique({
                where: { id: invoiceId }
            })

            if (!invoice || invoice.status !== 'SIGNED') {
                return { success: false, error: 'Invoice must be signed first' }
            }

            // In production, send email with PDF attachment
            // For now, just update status
            if (invoice.buyerEmail) {
                console.log(`[E-INVOICE] Sending to ${invoice.buyerEmail}`)
                // await EmailService.send({ ... })
            }

            await prisma.eInvoice.update({
                where: { id: invoiceId },
                data: {
                    status: 'SENT',
                    sentAt: new Date()
                }
            })

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Cancel an invoice
     */
    static async cancelInvoice(invoiceId: string, reason: string): Promise<{
        success: boolean
        error?: string
    }> {
        try {
            const invoice = await prisma.eInvoice.findUnique({
                where: { id: invoiceId }
            })

            if (!invoice) {
                return { success: false, error: 'Invoice not found' }
            }

            // If sent to provider, need to cancel there too
            if (invoice.providerInvoiceId && this.config) {
                // Call provider's cancel API
                console.log(`[E-INVOICE] Cancelling ${invoice.providerInvoiceId} on ${invoice.provider}`)
            }

            await prisma.eInvoice.update({
                where: { id: invoiceId },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                    cancelReason: reason
                }
            })

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    // Provider-specific payload builders
    private static buildMisaPayload(data: InvoiceData): any {
        return {
            invoiceTypeCode: '01GTKT',
            currencyCode: 'VND',
            buyer: {
                buyerLegalName: data.buyerName,
                buyerTaxCode: data.buyerTaxCode,
                buyerAddressLine: data.buyerAddress,
                buyerEmail: data.buyerEmail
            },
            invoiceDetails: data.items.map((item, index) => ({
                lineNumber: index + 1,
                itemName: item.name,
                unitName: item.unit,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                vatPercentage: item.vatRate
            }))
        }
    }

    private static buildViettelPayload(data: InvoiceData): any {
        return {
            generalInvoiceInfo: {
                invoiceType: '01GTKT',
                currencyCode: 'VND',
                buyerInfo: {
                    buyerName: data.buyerName,
                    buyerCode: data.buyerTaxCode,
                    buyerAddress: data.buyerAddress
                }
            },
            itemInfo: data.items.map(item => ({
                itemName: item.name,
                unitName: item.unit,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxPercentage: item.vatRate
            }))
        }
    }

    private static buildVNPTPayload(data: InvoiceData): any {
        return {
            Invoice: {
                CusName: data.buyerName,
                CusTaxCode: data.buyerTaxCode,
                CusAddress: data.buyerAddress,
                Products: data.items.map(item => ({
                    ProdName: item.name,
                    ProdUnit: item.unit,
                    ProdQuantity: item.quantity,
                    ProdPrice: item.unitPrice,
                    VATRate: item.vatRate
                }))
            }
        }
    }

    /**
     * Get invoice by ID
     */
    static async getInvoice(invoiceId: string) {
        return prisma.eInvoice.findUnique({
            where: { id: invoiceId }
        })
    }

    /**
     * List invoices with filters
     */
    static async listInvoices(filters: {
        orderId?: string
        buyerTaxCode?: string
        status?: EInvoiceStatus
        fromDate?: Date
        toDate?: Date
        limit?: number
    }) {
        return prisma.eInvoice.findMany({
            where: {
                ...(filters.orderId && { orderId: filters.orderId }),
                ...(filters.buyerTaxCode && { buyerTaxCode: filters.buyerTaxCode }),
                ...(filters.status && { status: filters.status }),
                ...(filters.fromDate || filters.toDate) && {
                    createdAt: {
                        ...(filters.fromDate && { gte: filters.fromDate }),
                        ...(filters.toDate && { lte: filters.toDate })
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: filters.limit || 50
        })
    }
}

export default EInvoiceService
