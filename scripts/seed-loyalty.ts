import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding loyalty data...')

    // Find some existing customers or create new ones
    const customers = await prisma.customer.findMany({
        include: { user: true },
        take: 5
    })

    if (customers.length === 0) {
        console.log('No customers found. Please run seed-real-data.ts first or create customers manually.')
        return
    }

    // Update customers with loyalty data
    const updates = [
        { tier: 'BRONZE', points: 450, totalSpent: 4500000 },
        { tier: 'SILVER', points: 1200, totalSpent: 12000000 },
        { tier: 'GOLD', points: 2650, totalSpent: 26500000 },
        { tier: 'PLATINUM', points: 6700, totalSpent: 67000000 },
        { tier: 'DIAMOND', points: 15000, totalSpent: 150000000 }
    ]

    for (let i = 0; i < customers.length; i++) {
        const customer = customers[i]
        const update = updates[i % updates.length]

        await prisma.customer.update({
            where: { id: customer.id },
            data: {
                loyaltyTier: update.tier as any,
                loyaltyPoints: update.points,
                totalPointsEarned: update.points + 500, // Assume some points were redeemed
                totalPointsRedeemed: 500,
                totalPurchases: update.totalSpent,
                loyaltyPointsToNextTier: 1000 // Just a placeholder
            }
        })

        console.log(`Updated customer ${customer.user.name} (${customer.email}) to ${update.tier} with ${update.points} points`)
    }

    console.log('Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
