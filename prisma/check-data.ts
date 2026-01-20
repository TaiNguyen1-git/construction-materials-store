import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const count = await prisma.contractorProfile.count()
    console.log(`Current ContractorProfile count: ${count}`)

    const profiles = await prisma.contractorProfile.findMany({
        take: 10,
        select: { id: true, customerId: true, displayName: true }
    })
    console.log('Sample profiles:', JSON.stringify(profiles, null, 2))
}

main().finally(() => prisma.$disconnect())
