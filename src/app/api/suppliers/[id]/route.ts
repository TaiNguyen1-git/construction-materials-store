import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/suppliers/[id] - Get supplier by ID
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        const supplier = await prisma.supplier.findUnique({
            where: { id }
        })

        if (!supplier) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: supplier })
    } catch (error) {
        console.error('Error fetching supplier:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/suppliers/[id] - Update supplier
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const body = await request.json()

        const existingSupplier = await prisma.supplier.findUnique({ where: { id } })
        if (!existingSupplier) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
        }

        const updateData: any = {}
        if (body.name !== undefined) updateData.name = body.name
        if (body.email !== undefined) updateData.email = body.email
        if (body.phone !== undefined) updateData.phone = body.phone
        if (body.address !== undefined) updateData.address = body.address
        if (body.city !== undefined) updateData.city = body.city
        if (body.contactPerson !== undefined) updateData.contactPerson = body.contactPerson
        if (body.creditLimit !== undefined) updateData.creditLimit = parseFloat(body.creditLimit) || 0
        if (body.isActive !== undefined) updateData.isActive = body.isActive

        const supplier = await prisma.supplier.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json({ success: true, data: supplier })
    } catch (error) {
        console.error('Error updating supplier:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/suppliers/[id] - Delete supplier
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        const existingSupplier = await prisma.supplier.findUnique({ where: { id } })
        if (!existingSupplier) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
        }

        await prisma.supplier.delete({ where: { id } })

        return NextResponse.json({ success: true, message: 'Supplier deleted successfully' })
    } catch (error) {
        console.error('Error deleting supplier:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
