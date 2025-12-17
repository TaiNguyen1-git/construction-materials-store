import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { UserRole } from '@/lib/auth'

// Mock token verification for development
const verifyToken = async (request: NextRequest) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.cookies.get('access_token')?.value

  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return decoded
  } catch {
    return null
  }
}

// GET /api/invoices/[id] - Get invoice by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, user: { select: { name: true, email: true } } }
        },
        supplier: {
          select: { id: true, name: true, email: true, contactPerson: true, address: true }
        },
        order: {
          select: { id: true, orderNumber: true }
        },
        invoiceItems: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, description: true }
            }
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Check if user has access to this invoice
    if (user.role === 'CUSTOMER' && invoice.customerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await verifyToken(request)
    if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, dueDate, note, paidDate, paymentMethod } = body

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id }
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Prevent modifying paid invoices
    if (existingInvoice.status === 'PAID' && status !== 'PAID') {
      return NextResponse.json({ error: 'Cannot modify paid invoice' }, { status: 400 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (dueDate) updateData.dueDate = new Date(dueDate)
    if (note !== undefined) updateData.note = note
    if (paymentMethod) updateData.paymentMethod = paymentMethod

    // Handle payment
    if (status === 'PAID' && existingInvoice.status !== 'PAID') {
      updateData.paidDate = paidDate ? new Date(paidDate) : new Date()
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await verifyToken(request)
    if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Prevent deletion of paid invoices
    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Cannot delete paid invoice' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // Delete invoice items first
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id }
      })

      // Delete payments
      await tx.payment.deleteMany({
        where: { invoiceId: id }
      })

      // Delete the invoice
      await tx.invoice.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}