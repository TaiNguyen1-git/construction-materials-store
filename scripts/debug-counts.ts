import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const productsCount = await prisma.product.count()
    const categories = await prisma.category.findMany({
        include: {
            _count: {
                select: { products: true }
            }
        }
    })

    console.log('Total Products:', productsCount)
    console.log('Categories data:', JSON.stringify(categories, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
