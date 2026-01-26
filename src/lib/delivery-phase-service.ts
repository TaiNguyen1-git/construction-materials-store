/**
 * Delivery Phase Service - Feature 4: Giao hàng theo giai đoạn
 * 
 * Quản lý việc chia đơn hàng thành nhiều đợt giao:
 * - Giai đoạn móng (thép, xi măng)
 * - Giai đoạn xây thô (gạch, cát)
 * - Giai đoạn hoàn thiện (thiết bị vệ sinh, sơn)
 */

import { prisma } from './prisma'
import { DeliveryPhaseStatus, PhasePaymentStatus } from '@prisma/client'

interface PhaseItem {
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    unit: string
}

interface CreatePhaseData {
    orderId: string
    phaseNumber: number
    phaseName: string
    description?: string
    items: PhaseItem[]
    scheduledDate: Date
    depositRequired?: number  // Percentage of phase value
}

export class DeliveryPhaseService {

    /**
     * Create delivery phases from order items
     */
    static async createPhasesFromOrder(
        orderId: string,
        phases: Array<{
            name: string
            description?: string
            scheduledDate: Date
            depositPercent?: number
            productIds: string[]  // Items to include in this phase
        }>
    ): Promise<{ success: boolean; phaseIds?: string[]; error?: string }> {
        try {
            // Get order with items
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { orderItems: true }
            })

            if (!order) {
                return { success: false, error: 'Order not found' }
            }

            const createdPhases: string[] = []

            for (let i = 0; i < phases.length; i++) {
                const phase = phases[i]

                // Filter items for this phase
                const phaseItems = order.orderItems
                    .filter(item => phase.productIds.includes(item.productId))
                    .map(item => ({
                        productId: item.productId,
                        productName: item.productId, // Should be resolved from product
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        unit: 'cái'
                    }))

                const phaseValue = phaseItems.reduce(
                    (sum, item) => sum + item.quantity * item.unitPrice,
                    0
                )

                const depositRequired = phase.depositPercent
                    ? phaseValue * (phase.depositPercent / 100)
                    : 0

                const created = await prisma.deliveryPhase.create({
                    data: {
                        orderId,
                        phaseNumber: i + 1,
                        phaseName: phase.name,
                        description: phase.description,
                        items: phaseItems as any,
                        itemCount: phaseItems.length,
                        phaseValue,
                        depositRequired,
                        scheduledDate: phase.scheduledDate,
                        status: 'PENDING',
                        paymentStatus: 'UNPAID'
                    }
                })

                createdPhases.push(created.id)
            }

            return { success: true, phaseIds: createdPhases }
        } catch (error: any) {
            console.error('Create phases error:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Create a single phase
     */
    static async createPhase(data: CreatePhaseData): Promise<{
        success: boolean
        phaseId?: string
        error?: string
    }> {
        try {
            const phaseValue = data.items.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0
            )

            const depositRequired = data.depositRequired
                ? phaseValue * (data.depositRequired / 100)
                : 0

            const phase = await prisma.deliveryPhase.create({
                data: {
                    orderId: data.orderId,
                    phaseNumber: data.phaseNumber,
                    phaseName: data.phaseName,
                    description: data.description,
                    items: data.items as any,
                    itemCount: data.items.length,
                    phaseValue,
                    depositRequired,
                    scheduledDate: data.scheduledDate,
                    status: 'PENDING',
                    paymentStatus: 'UNPAID'
                }
            })

            return { success: true, phaseId: phase.id }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Update phase status
     */
    static async updateStatus(
        phaseId: string,
        status: DeliveryPhaseStatus,
        metadata?: {
            trackingNumber?: string
            carrierName?: string
            deliveryProof?: string
            receiverName?: string
            receiverSignature?: string
        }
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const updateData: any = { status }

            if (metadata) {
                if (metadata.trackingNumber) updateData.trackingNumber = metadata.trackingNumber
                if (metadata.carrierName) updateData.carrierName = metadata.carrierName
                if (metadata.deliveryProof) updateData.deliveryProof = metadata.deliveryProof
                if (metadata.receiverName) updateData.receiverName = metadata.receiverName
                if (metadata.receiverSignature) updateData.receiverSignature = metadata.receiverSignature
            }

            if (status === 'DELIVERED') {
                updateData.actualDate = new Date()
            }

            await prisma.deliveryPhase.update({
                where: { id: phaseId },
                data: updateData
            })

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Process deposit payment for a phase
     */
    static async processDeposit(
        phaseId: string,
        paidAmount: number,
        paymentMethod: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const phase = await prisma.deliveryPhase.findUnique({
                where: { id: phaseId }
            })

            if (!phase) {
                return { success: false, error: 'Phase not found' }
            }

            if (paidAmount < phase.depositRequired) {
                return { success: false, error: 'Insufficient deposit amount' }
            }

            await prisma.deliveryPhase.update({
                where: { id: phaseId },
                data: {
                    paymentStatus: 'DEPOSIT_PAID',
                    depositPaidAt: new Date()
                }
            })

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Move funds to escrow for a phase
     */
    static async escrowPhase(phaseId: string, walletId: string): Promise<{
        success: boolean
        error?: string
    }> {
        try {
            const phase = await prisma.deliveryPhase.findUnique({
                where: { id: phaseId }
            })

            if (!phase) {
                return { success: false, error: 'Phase not found' }
            }

            // Move funds from wallet to escrow
            await prisma.$transaction(async (tx) => {
                // Deduct from wallet balance
                await tx.wallet.update({
                    where: { id: walletId },
                    data: {
                        balance: { decrement: phase.phaseValue },
                        holdBalance: { increment: phase.phaseValue }
                    }
                })

                // Create escrow transaction
                await tx.walletTransaction.create({
                    data: {
                        walletId,
                        amount: -phase.phaseValue,
                        type: 'ORDER_PAYMENT',
                        status: 'COMPLETED',
                        description: `Escrow cho ${phase.phaseName} - Đơn hàng`,
                        metadata: { phaseId, phaseName: phase.phaseName }
                    }
                })

                // Update phase status
                await tx.deliveryPhase.update({
                    where: { id: phaseId },
                    data: { paymentStatus: 'ESCROWED' }
                })
            })

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Customer confirms delivery, release escrow
     */
    static async confirmAndRelease(
        phaseId: string,
        confirmedBy: string,
        recipientWalletId: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const phase = await prisma.deliveryPhase.findUnique({
                where: { id: phaseId },
                include: { order: true }
            })

            if (!phase) {
                return { success: false, error: 'Phase not found' }
            }

            if (phase.status !== 'DELIVERED') {
                return { success: false, error: 'Phase must be delivered first' }
            }

            if (phase.paymentStatus !== 'ESCROWED') {
                return { success: false, error: 'Funds not in escrow' }
            }

            await prisma.$transaction(async (tx) => {
                // Release from customer's hold
                const customerWallet = await tx.wallet.findUnique({
                    where: { customerId: phase.order.customerId! }
                })

                if (customerWallet) {
                    await tx.wallet.update({
                        where: { id: customerWallet.id },
                        data: {
                            holdBalance: { decrement: phase.phaseValue }
                        }
                    })
                }

                // Add to recipient wallet (supplier or contractor)
                await tx.wallet.update({
                    where: { id: recipientWalletId },
                    data: {
                        balance: { increment: phase.phaseValue },
                        totalEarned: { increment: phase.phaseValue }
                    }
                })

                // Create earning transaction
                await tx.walletTransaction.create({
                    data: {
                        walletId: recipientWalletId,
                        amount: phase.phaseValue,
                        type: 'ESCROW_RELEASE',
                        status: 'COMPLETED',
                        description: `Giải ngân ${phase.phaseName}`,
                        metadata: { phaseId, orderId: phase.orderId }
                    }
                })

                // Update phase
                await tx.deliveryPhase.update({
                    where: { id: phaseId },
                    data: {
                        status: 'CONFIRMED',
                        paymentStatus: 'RELEASED',
                        confirmedBy,
                        confirmedAt: new Date(),
                        releasedAt: new Date()
                    }
                })
            })

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Get phases for an order
     */
    static async getOrderPhases(orderId: string) {
        return prisma.deliveryPhase.findMany({
            where: { orderId },
            orderBy: { phaseNumber: 'asc' }
        })
    }

    /**
     * Get phase details
     */
    static async getPhase(phaseId: string) {
        return prisma.deliveryPhase.findUnique({
            where: { id: phaseId },
            include: { order: true }
        })
    }

    /**
     * Get upcoming deliveries
     */
    static async getUpcomingDeliveries(days: number = 7) {
        const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

        return prisma.deliveryPhase.findMany({
            where: {
                scheduledDate: {
                    gte: new Date(),
                    lte: futureDate
                },
                status: { in: ['PENDING', 'PREPARING', 'READY'] }
            },
            include: { order: true },
            orderBy: { scheduledDate: 'asc' }
        })
    }

    /**
     * Auto-suggest phases based on product categories
     */
    static async suggestPhases(orderId: string): Promise<Array<{
        name: string
        description: string
        suggestedDelay: number  // Days from order date
        productIds: string[]
    }>> {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderItems: {
                    include: {
                        product: {
                            include: { category: true }
                        }
                    }
                }
            }
        })

        if (!order) return []

        // Group items by category for intelligent phasing
        const categoryGroups = new Map<string, string[]>()

        for (const item of order.orderItems) {
            const category = (item.product as any)?.category?.name || 'Khác'
            const existing = categoryGroups.get(category) || []
            existing.push(item.productId)
            categoryGroups.set(category, existing)
        }

        // Define construction phases
        const phaseTemplates = [
            {
                categories: ['Xi măng', 'Thép', 'Cát', 'Đá'],
                name: 'Giai đoạn móng - Kết cấu',
                delay: 0
            },
            {
                categories: ['Gạch', 'Bê tông', 'Vữa'],
                name: 'Giai đoạn xây thô',
                delay: 14
            },
            {
                categories: ['Điện', 'Ống nước', 'Dây điện'],
                name: 'Giai đoạn M&E',
                delay: 30
            },
            {
                categories: ['Sơn', 'Gạch ốp lát', 'Thiết bị vệ sinh'],
                name: 'Giai đoạn hoàn thiện',
                delay: 60
            }
        ]

        const suggestions: Array<{
            name: string
            description: string
            suggestedDelay: number
            productIds: string[]
        }> = []

        for (const template of phaseTemplates) {
            const matchingProducts: string[] = []

            for (const cat of template.categories) {
                const products = categoryGroups.get(cat)
                if (products) {
                    matchingProducts.push(...products)
                }
            }

            if (matchingProducts.length > 0) {
                suggestions.push({
                    name: template.name,
                    description: `Bao gồm: ${template.categories.join(', ')}`,
                    suggestedDelay: template.delay,
                    productIds: matchingProducts
                })
            }
        }

        return suggestions
    }
}

export default DeliveryPhaseService
