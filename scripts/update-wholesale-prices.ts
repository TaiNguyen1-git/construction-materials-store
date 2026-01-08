
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔄 Updating wholesale prices for demo...')

    // Get all products
    const products = await prisma.product.findMany()

    for (const product of products) {
        // Set wholesale price to 90% of regular price
        // Set min qty to 10
        const wholesalePrice = Math.floor(product.price * 0.9)

        await prisma.product.update({
            where: { id: product.id },
            data: {
                wholesalePrice: wholesalePrice,
                minWholesaleQty: 10
            }
        })

        console.log(`✅ Updated ${product.name}: Price ${product.price} -> Wholesale ${wholesalePrice} (Min 10)`)
    }

    console.log('🎉 Wholesale prices updated!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
