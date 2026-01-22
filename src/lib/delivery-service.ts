
import { prisma } from './prisma'
// @ts-ignore
import { DeliveryPhaseStatus } from '@prisma/client'

export const deliveryService = {
    /**
     * Create delivery phases for an order
     */
    async createPhases(orderId: string, phases: {
        phaseNumber: number,
        scheduledDate: Date,
        notes?: string,
        items: { orderItemId: string, quantity: number }[]
    }[]) {
        return await (prisma as any).$transaction(async (tx: any) => {
            const createdPhases = []

            for (const phaseData of phases) {
                const phase = await tx.deliveryPhase.create({
                    data: {
                        orderId,
                        phaseNumber: phaseData.phaseNumber,
                        scheduledDate: phaseData.scheduledDate,
                        notes: phaseData.notes,
                        items: {
                            create: phaseData.items.map(item => ({
                                orderItemId: item.orderItemId,
                                quantity: item.quantity
                            }))
                        }
                    },
                    include: { items: true }
                })
                createdPhases.push(phase)
            }

            // Update order status if needed
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'PROCESSING' }
            })

            return createdPhases
        })
    },

    /**
     * Get all phases for an order
     */
    async getOrderPhases(orderId: string) {
        return await (prisma as any).deliveryPhase.findMany({
            where: { orderId },
            include: {
                items: {
                    include: {
                        orderItem: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            },
            orderBy: { phaseNumber: 'asc' }
        })
    },

    /**
     * Update phase status
     */
    async updatePhaseStatus(phaseId: string, status: DeliveryPhaseStatus, actualDate?: Date) {
        return await (prisma as any).deliveryPhase.update({
            where: { id: phaseId },
            data: {
                status,
                actualDate: status === 'DELIVERED' ? (actualDate || new Date()) : undefined
            }
        })
    }
}
