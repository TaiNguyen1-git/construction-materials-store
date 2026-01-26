import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Change type to Promise
) {
    try {
        const { id } = await params // Await params here

        const invoice = await prisma.eInvoice.findUnique({
            where: { id }
        })

        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
        }

        let items: any[] = []

        if (invoice.orderId) {
            // Fetch Order Items via Order
            const order = await prisma.order.findUnique({
                where: { id: invoice.orderId },
                include: {
                    orderItems: {
                        include: {
                            product: {
                                select: { name: true }
                            }
                        }
                    }
                }
            })

            if (order && order.orderItems) {
                items = order.orderItems.map(item => ({
                    id: item.id,
                    productName: item.product.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.totalPrice
                }))
            }
        }

        // Return combined data
        const invoiceDetail = {
            ...invoice,
            subtotal: invoice.subtotal || (invoice.totalAmount / 1.1),
            vatAmount: invoice.vatAmount || (invoice.totalAmount - (invoice.totalAmount / 1.1)),
            items: items
        }

        return NextResponse.json({
            success: true,
            data: {
                invoice: invoiceDetail
            }
        })

    } catch (error) {
        console.error('Error fetching invoice detail:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}
