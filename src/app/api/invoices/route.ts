import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'
import { UserRole } from '@/lib/auth'

// GET /api/invoices - Get invoices (optional auth - guests and users can access)
export async function GET(request: NextRequest) {
  try {
    // Get user from verified token (optional - guests allowed)
    const user = verifyTokenFromRequest(request)

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'SALES' or 'PURCHASE'
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const supplierId = searchParams.get('supplierId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build filter object
    const where: any = {}
    
    if (type) where.invoiceType = type
    if (status) where.status = status
    if (customerId) where.customerId = customerId
    if (supplierId) where.supplierId = supplierId

    // If user is customer, only show their invoices
    if (user && user.role === 'CUSTOMER') {
      where.customerId = user.id
      where.invoiceType = 'SALES' // Customers can only see sales invoices
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: {
            select: { id: true, user: { select: { name: true, email: true } } }
          },
          supplier: {
            select: { id: true, name: true, email: true, contactPerson: true }
          },
          order: {
            select: { id: true, orderNumber: true }
          },
          invoiceItems: {
            include: {
              product: {
                select: { id: true, name: true, sku: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.invoice.count({ where })
    ])

    return NextResponse.json({
      data: invoices,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/invoices - Create invoice
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, customerId, supplierId, orderId, invoiceItems, dueDate, note, tax } = body

    // Validate required fields
    if (!type || !['SALES', 'PURCHASE'].includes(type)) {
      return NextResponse.json({ error: 'Valid invoice type is required (SALES or PURCHASE)' }, { status: 400 })
    }

    if (!invoiceItems || !Array.isArray(invoiceItems) || invoiceItems.length === 0) {
      return NextResponse.json({ error: 'Invoice items are required' }, { status: 400 })
    }

    // Validate customer/supplier based on type
    if (type === 'SALES' && !customerId) {
      return NextResponse.json({ error: 'Customer ID is required for sales invoice' }, { status: 400 })
    }

    if (type === 'PURCHASE' && !supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required for purchase invoice' }, { status: 400 })
    }

    // Validate customer or supplier exists
    if (type === 'SALES' && customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      })
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }
    } else if (type === 'PURCHASE' && supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId }
      })
      if (!supplier) {
        return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
      }
    }

    // Validate order if provided
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      })
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
    }

    // Validate products and calculate totals
    let subtotalAmount = 0
    const validatedItems = []

    for (const item of invoiceItems) {
      if (!item.productId || !item.quantity || item.quantity <= 0 || !item.unitPrice || item.unitPrice <= 0) {
        return NextResponse.json({ error: 'Invalid invoice item data' }, { status: 400 })
      }

      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 })
      }

      const itemTotal = item.unitPrice * item.quantity
      subtotalAmount += itemTotal

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
        description: item.description || product.name
      })
    }

    // Calculate tax and total
    const taxRate = tax || 0
    const taxAmount = subtotalAmount * (taxRate / 100)
    const totalAmount = subtotalAmount + taxAmount

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count()
    const prefix = type === 'SALES' ? 'INV-S' : 'INV-P'
    const invoiceNumber = `${prefix}-${Date.now()}-${(invoiceCount + 1).toString().padStart(4, '0')}`

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceType: type,
        customerId: type === 'SALES' ? customerId : null,
        supplierId: type === 'PURCHASE' ? supplierId : null,
        orderId: orderId || null,
        subtotal: subtotalAmount,
        taxAmount: (subtotalAmount * (taxRate || 0)) / 100,
        totalAmount,
        status: 'DRAFT',
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        notes: note || '',
        invoiceItems: {
          create: validatedItems
        }
      },
      include: {
        customer: {
          select: { id: true, user: { select: { name: true, email: true } } }
        },
        supplier: {
          select: { id: true, name: true, email: true, contactPerson: true }
        },
        order: {
          select: { id: true, orderNumber: true }
        },
        invoiceItems: {
          include: {
            product: {
              select: { id: true, name: true, sku: true }
            }
          }
        }
      }
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}