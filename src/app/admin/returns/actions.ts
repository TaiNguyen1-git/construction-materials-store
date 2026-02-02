'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getReturns() {
    try {
        const returns = await prisma.purchaseReturn.findMany({
            include: {
                supplier: true,
                purchaseOrder: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return { success: true, data: returns }
    } catch (error) {
        console.error('Error fetching returns:', error)
        return { success: false, error: 'Failed to fetch returns' }
    }
}

export async function getSuppliers() {
    try {
        const suppliers = await prisma.supplier.findMany({
            where: { isActive: true },
            select: { id: true, name: true }
        })
        return { success: true, data: suppliers }
    } catch (error) {
        return { success: false, error: 'Failed to fetch suppliers' }
    }
}

export async function getEligiblePurchaseOrders(supplierId: string) {
    try {
        // Only fetch orders that are received or partially received/returned
        const orders = await prisma.purchaseOrder.findMany({
            where: {
                supplierId,
                status: {
                    in: ['RECEIVED', 'CONFIRMED'] // Can return items from confirmed/received orders
                }
            },
            include: {
                purchaseItems: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                orderDate: 'desc'
            }
        })
        return { success: true, data: orders }
    } catch (error) {
        return { success: false, error: 'Failed to fetch purchase orders' }
    }
}

export async function createReturn(data: {
    supplierId: string;
    purchaseOrderId: string;
    reason: string;
    processingMethod: string;
    evidenceUrls?: string[];
    items: { productId: string; quantity: number; unitPrice: number; reason?: string; condition?: string }[]
}) {
    try {
        const totalRefundAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

        const newReturn = await prisma.$transaction(async (tx) => {
            const purchaseReturn = await tx.purchaseReturn.create({
                data: {
                    supplierId: data.supplierId,
                    purchaseOrderId: data.purchaseOrderId,
                    reason: data.reason,
                    processingMethod: data.processingMethod,
                    evidenceUrls: data.evidenceUrls || [],
                    status: 'PENDING',
                    totalRefundAmount,
                    items: {
                        create: data.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            reason: item.reason,
                            condition: item.condition
                        }))
                    }
                } as any
            })

            return purchaseReturn
        })

        revalidatePath('/admin/returns')
        return { success: true, data: newReturn }
    } catch (error) {
        console.error('Create return error:', error)
        return { success: false, error: 'Failed to create return request' }
    }
}

export async function updateReturnStatus(id: string, status: 'RECEIVED' | 'REFUNDED' | 'CANCELLED') {
    try {
        await prisma.purchaseReturn.update({
            where: { id },
            data: { status }
        })
        revalidatePath('/admin/returns')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to update status' }
    }
}
