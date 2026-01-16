
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
            children: {
                where: { isActive: true },
                select: { name: true }
            },
            products: {
                where: { isActive: true },
                take: 5,
                select: { name: true, price: true }
            }
        }
    })

    console.log(JSON.stringify(categories, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
