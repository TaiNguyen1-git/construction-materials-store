import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const supplierId = searchParams.get('supplierId')

        if (!supplierId) {
            return NextResponse.json(createErrorResponse('Missing supplierId'), { status: 400 })
        }

        const prismaAny = prisma as any
        const model = prismaAny.supplierDocument || prismaAny.supplier_document || prismaAny.SupplierDocument

        if (!model) {
            console.error('Available Prisma keys:', Object.keys(prismaAny).filter(k => k.toLowerCase().includes('supplier')))
            throw new Error('SupplierDocument model not found in Prisma client. Please restart dev server and run prisma generate.')
        }

        const documents = await model.findMany({
            where: { supplierId },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse(documents))
    } catch (error) {
        console.error('Fetch documents error:', error)
        return NextResponse.json(createErrorResponse('Server error'), { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { supplierId, name, type, fileUrl, expiryDate } = body

        const prismaAny = prisma as any
        const model = prismaAny.supplierDocument || prismaAny.supplier_document || prismaAny.SupplierDocument

        if (!model) {
            throw new Error('SupplierDocument model not found in Prisma client.')
        }

        const doc = await model.create({
            data: {
                supplierId,
                name,
                type,
                fileUrl,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                status: 'PENDING'
            }
        })

        return NextResponse.json(createSuccessResponse(doc, 'Đã tải lên chứng từ'))
    } catch (error) {
        console.error('Upload document error:', error)
        return NextResponse.json(createErrorResponse('Server error'), { status: 500 })
    }
}
