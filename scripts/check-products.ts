import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const products = await prisma.product.findMany({
        take: 5,
        select: {
            id: true,
            name: true,
            categoryId: true
        }
    })

    console.log('Sample products:', JSON.stringify(products, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
