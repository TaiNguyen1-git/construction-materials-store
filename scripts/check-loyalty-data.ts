import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking loyalty data...')

    const customerCount = await prisma.customer.count()
    console.log(`Total customers: ${customerCount}`)

    const customers = await prisma.customer.findMany({
        take: 5,
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    })

    console.log('Sample customers:', JSON.stringify(customers, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
