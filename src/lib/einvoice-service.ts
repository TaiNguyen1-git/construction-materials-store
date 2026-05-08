import { prisma } from './prisma'

export interface EInvoiceData {
  orderId: string
  invoiceNumber?: string
  issueDate: Date
  buyerName: string
  buyerTaxCode?: string
  buyerAddress: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
    taxRate: number
  }>
  totalAmount: number
  taxAmount: number
  netAmount: number
}

export class EInvoiceService {
  /**
   * MOCK: Sends invoice data to an E-Invoice provider (e.g., VNPT, Viettel, MeInvoice)
   */
  static async issueInvoice(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: { include: { product: true } },
          customer: { include: { user: true } }
        }
      })

      if (!order) throw new Error('Order not found')

      // 1. Prepare data in the format required by the provider
      const invoiceData: EInvoiceData = {
        orderId: order.id,
        issueDate: new Date(),
        buyerName: order.customer?.user.name || order.guestName || 'Khách hàng',
        buyerAddress: typeof order.shippingAddress === 'string' ? order.shippingAddress : (order.shippingAddress as any)?.address || '',
        items: order.orderItems.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          taxRate: 0.1 // Default 10%
        })),
        totalAmount: order.totalAmount,
        taxAmount: order.taxAmount || (order.totalAmount * 0.1),
        netAmount: order.netAmount
      }

      console.log('[EInvoiceService] Sending data to provider:', invoiceData)

      // 2. Simulate API Call delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 3. Mock Success Response from Provider
      const mockInvoiceNumber = `VAT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
      const mockPdfUrl = `https://smartbuild-storage.com/invoices/${mockInvoiceNumber}.pdf`

      // 4. Record in our DB (Update order or create Invoice record)
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: mockInvoiceNumber,
          invoiceType: 'SALES',
          orderId: order.id,
          customerId: order.customerId,
          status: 'SENT',
          subtotal: order.totalAmount,
          taxAmount: invoiceData.taxAmount,
          totalAmount: order.netAmount,
          vatInvoiceUrl: mockPdfUrl,
          issueDate: new Date(),
          notes: 'Tự động xuất bởi hệ thống'
        }
      })

      return {
        success: true,
        invoiceNumber: mockInvoiceNumber,
        pdfUrl: mockPdfUrl,
        invoiceId: invoice.id
      }
    } catch (error) {
      console.error('[EInvoiceService] Error issuing invoice:', error)
      throw error
    }
  }
}
