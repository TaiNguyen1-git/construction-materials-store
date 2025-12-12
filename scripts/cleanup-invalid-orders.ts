/**
 * Delete orders with invalid future dates
 * Run before re-seeding with corrected dates
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupInvalidOrders() {
    console.log('🧹 Cleaning up orders with invalid dates...')

    const maxDate = new Date() // Current date
    maxDate.setHours(23, 59, 59, 999)

    console.log(`Max allowed date: ${maxDate.toLocaleDateString('vi-VN')}`)

    // Find invalid orders
    const invalidOrders = await prisma.order.findMany({
        where: {
            createdAt: { gt: maxDate }
        },
        select: {
            id: true,
            orderNumber: true,
            createdAt: true
        }
    })

    if (invalidOrders.length === 0) {
        console.log('✅ No invalid orders found')
        return
    }

    console.log(`Found ${invalidOrders.length} orders with invalid dates`)

    // Delete order items first (foreign key constraint)
    for (const order of invalidOrders) {
        await prisma.orderItem.deleteMany({
            where: { orderId: order.id }
        })
    }

    // Delete orders
    const deleted = await prisma.order.deleteMany({
        where: {
            createdAt: { gt: maxDate }
        }
    })

    console.log(`✅ Deleted ${deleted.count} invalid orders`)
}

cleanupInvalidOrders()
    .then(() => {
        console.log('✅ Cleanup completed')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Cleanup error:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
