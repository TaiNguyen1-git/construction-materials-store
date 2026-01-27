
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
        // Fetch order to get unit prices for value calculation
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { orderItems: true }
        });

        if (!order) throw new Error('Order not found');

        return await (prisma as any).$transaction(async (tx: any) => {
            const createdPhases = []

            for (const phaseData of phases) {
                // Calculate phase value
                let phaseValue = 0;
                for (const item of phaseData.items) {
                    const orderItem = order.orderItems.find(oi => oi.id === item.orderItemId);
                    if (orderItem) {
                        phaseValue += orderItem.unitPrice * item.quantity;
                    }
                }

                const phase = await tx.deliveryPhase.create({
                    data: {
                        orderId,
                        phaseNumber: phaseData.phaseNumber,
                        phaseName: `Đợt ${phaseData.phaseNumber}`,
                        phaseValue,
                        scheduledDate: phaseData.scheduledDate,
                        description: phaseData.notes || '',
                        items: phaseData.items.map(item => ({
                            orderItemId: item.orderItemId,
                            quantity: item.quantity
                        }))
                    }
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
