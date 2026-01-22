import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const categoriesWithProducts = await prisma.category.findMany({
        where: {
            products: {
                some: {}
            }
        },
        select: {
            id: true,
            name: true,
            _count: {
                select: { products: true }
            }
        }
    })

    console.log('Categories with products:', JSON.stringify(categoriesWithProducts, null, 2))

    const allCategories = await prisma.category.findMany({
        select: { id: true, name: true }
    })
    console.log('All categories:', JSON.stringify(allCategories, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
