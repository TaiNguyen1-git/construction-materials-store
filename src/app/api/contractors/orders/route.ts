import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

// GET /api/contractors/orders - Get contractor's orders
export async function GET(request: NextRequest) {
    try {
        // Get user from auth header or token
        const authHeader = request.headers.get('authorization')
        const userId = request.headers.get('x-user-id')

        let currentUserId = userId

        // Try to get from JWT if available
        const tokenPayload = verifyTokenFromRequest(request)
        if (tokenPayload?.userId) {
            currentUserId = tokenPayload.userId
        }

        if (!currentUserId) {
            return NextResponse.json(
                createErrorResponse('Unauthorized', 'UNAUTHORIZED'),
                { status: 401 }
            )
        }

        // Get customer record for this user
        const customer = await prisma.customer.findFirst({
            where: { userId: currentUserId }
        })

        if (!customer) {
            return NextResponse.json(
                createErrorResponse('Customer not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // Get query params
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const status = searchParams.get('status')
        const search = searchParams.get('search')
        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {
            customerId: customer.id
        }

        if (status && status !== 'all') {
            where.status = status
        }

        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { notes: { contains: search, mode: 'insensitive' } }
            ]
        }

        // Fetch orders
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    totalAmount: true,
                    netAmount: true,
                    shippingAmount: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    paymentType: true,
                    depositAmount: true,
                    remainingAmount: true,
                    notes: true,
                    createdAt: true,
                    updatedAt: true,
                    orderItems: {
                        select: {
                            id: true,
                            quantity: true,
                            unitPrice: true,
                            totalPrice: true,
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    sku: true,
                                    images: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.order.count({ where })
        ])

        // Transform orders for frontend
        const transformedOrders = orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            date: order.createdAt.toISOString().split('T')[0],
            total: order.netAmount,
            status: order.status,
            items: order.orderItems.length,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            paymentType: order.paymentType,
            depositAmount: order.depositAmount,
            remainingAmount: order.remainingAmount,
            notes: order.notes,
            project: order.notes?.includes('Dự án') ? order.notes.split(':')[0] : 'N/A',
            orderItems: order.orderItems.map(item => ({
                id: item.id,
                productId: item.product.id,
                productName: item.product.name,
                sku: item.product.sku,
                image: item.product.images?.[0] || null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice
            }))
        }))

        return NextResponse.json(
            createSuccessResponse({
                orders: transformedOrders,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }, 'Orders retrieved successfully'),
            { status: 200 }
        )

    } catch (error) {
        console.error('Error fetching contractor orders:', error)
        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

// POST /api/contractors/orders - Create order for contractor (with credit/debt)
export async function POST(request: NextRequest) {
    try {
        // Get user from auth
        const authHeader = request.headers.get('authorization')
        const userId = request.headers.get('x-user-id')

        let currentUserId = userId

        // Try to get from JWT if available
        const tokenPayload = verifyTokenFromRequest(request)
        if (tokenPayload?.userId) {
            currentUserId = tokenPayload.userId
        }

        if (!currentUserId) {
            return NextResponse.json(
                createErrorResponse('Unauthorized', 'UNAUTHORIZED'),
                { status: 401 }
            )
        }

        // Get customer
        const customer = await prisma.customer.findFirst({
            where: { userId: currentUserId }
        })

        if (!customer) {
            return NextResponse.json(
                createErrorResponse('Customer not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        const body = await request.json()
        const { items, projectName, poNumber, notes, shippingAddress } = body

        if (!items || items.length === 0) {
            return NextResponse.json(
                createErrorResponse('No items in order', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Calculate total
        let totalAmount = 0
        const orderItems: any[] = []

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                include: { inventoryItem: true }
            })

            if (!product) {
                return NextResponse.json(
                    createErrorResponse(`Product not found: ${item.productId}`, 'NOT_FOUND'),
                    { status: 404 }
                )
            }

            // Check stock
            if (product.inventoryItem && product.inventoryItem.availableQuantity < item.quantity) {
                return NextResponse.json(
                    createErrorResponse(`Insufficient stock for ${product.name}`, 'INSUFFICIENT_STOCK'),
                    { status: 400 }
                )
            }

            // Use wholesale price if available and quantity meets minimum
            const unitPrice = (product.wholesalePrice && item.quantity >= product.minWholesaleQty)
                ? product.wholesalePrice
                : product.price

            const itemTotal = unitPrice * item.quantity
            totalAmount += itemTotal

            orderItems.push({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice,
                totalPrice: itemTotal,
                discount: 0
            })
        }

        // Apply contractor discount based on loyalty tier
        const discountPercent = getDiscountByTier(customer.loyaltyTier)
        const discountAmount = totalAmount * (discountPercent / 100)
        const netAmount = totalAmount - discountAmount

        // Check credit limit
        const currentDebt = await getCurrentDebt(customer.id)
        const availableCredit = customer.creditLimit - currentDebt

        if (netAmount > availableCredit && !customer.creditHold) {
            return NextResponse.json(
                createErrorResponse(
                    `Order exceeds available credit. Available: ${availableCredit.toLocaleString('vi-VN')}đ`,
                    'CREDIT_EXCEEDED'
                ),
                { status: 400 }
            )
        }

        if (customer.creditHold) {
            return NextResponse.json(
                createErrorResponse('Your credit is on hold. Please contact support.', 'CREDIT_HOLD'),
                { status: 400 }
            )
        }

        // Generate order number
        const orderCount = await prisma.order.count()
        const orderNumber = `ORD-${Date.now()}-${(orderCount + 1).toString().padStart(4, '0')}`

        // Create order as CREDIT (debt-based)
        const order = await prisma.$transaction(async (tx) => {
            // Create order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    customerId: customer.id,
                    customerType: 'REGISTERED',
                    status: 'PENDING_CONFIRMATION',
                    totalAmount,
                    discountAmount,
                    netAmount,
                    shippingAmount: 0, // Free shipping for contractors
                    taxAmount: 0,
                    paymentMethod: 'CREDIT', // Ghi nợ
                    paymentStatus: 'PENDING',
                    paymentType: 'FULL',
                    notes: projectName ? `Dự án: ${projectName}${poNumber ? ` | Ref: ${poNumber}` : ''}${notes ? ` | ${notes}` : ''}` : notes,
                    shippingAddress: shippingAddress || {
                        address: customer.companyAddress || '',
                        city: ''
                    },
                    orderItems: {
                        create: orderItems
                    }
                },
                include: {
                    orderItems: {
                        include: {
                            product: {
                                select: { id: true, name: true, sku: true }
                            }
                        }
                    }
                }
            })

            // Update inventory
            for (const item of orderItems) {
                await tx.inventoryItem.update({
                    where: { productId: item.productId },
                    data: {
                        availableQuantity: { decrement: item.quantity },
                        reservedQuantity: { increment: item.quantity }
                    }
                })
            }

            // Create invoice for the order (contractor debt)
            const invoiceCount = await tx.invoice.count()
            const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(4, '0')}`

            // Due date is 30 days from now (typical contractor terms)
            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 30)

            await tx.invoice.create({
                data: {
                    invoiceNumber,
                    invoiceType: 'SALES',
                    orderId: newOrder.id,
                    customerId: customer.id,
                    issueDate: new Date(),
                    dueDate,
                    status: 'SENT',
                    subtotal: totalAmount,
                    discountAmount,
                    totalAmount: netAmount,
                    balanceAmount: netAmount,
                    paymentTerms: 'Net 30',
                    invoiceItems: {
                        create: orderItems.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.totalPrice,
                            discount: 0,
                            taxRate: 0,
                            taxAmount: 0
                        }))
                    }
                }
            })

            return newOrder
        })

        return NextResponse.json(
            createSuccessResponse(order, 'Order created successfully'),
            { status: 201 }
        )

    } catch (error) {
        console.error('Error creating contractor order:', error)
        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

function getDiscountByTier(tier: string): number {
    switch (tier) {
        case 'DIAMOND': return 20
        case 'PLATINUM': return 15
        case 'GOLD': return 12
        case 'SILVER': return 8
        case 'BRONZE': return 5
        default: return 0
    }
}

async function getCurrentDebt(customerId: string): Promise<number> {
    // InvoiceStatus enum: DRAFT, SENT, PAID, OVERDUE, CANCELLED
    const unpaidInvoices = await prisma.invoice.findMany({
        where: {
            customerId,
            status: { in: ['SENT', 'OVERDUE'] } // Only valid InvoiceStatus values
        },
        select: { balanceAmount: true }
    })

    return unpaidInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0)
}
