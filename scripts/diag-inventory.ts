
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const allProducts = await prisma.product.findMany({
        select: {
            id: true,
            name: true,
            inventoryItem: {
                select: { id: true }
            }
        }
    })

    const missing = allProducts.filter(p => !p.inventoryItem)
    console.log(`Total products: ${allProducts.length}`)
    console.log(`Products missing inventory: ${missing.length}`)

    const allInventoryItems = await prisma.inventoryItem.findMany({
        select: { productId: true }
    })
    console.log(`Total inventory items: ${allInventoryItems.length}`)

    // Check for orphaned inventory items or duplicates
    const inventoryProductIds = new Set(allInventoryItems.map(i => i.productId))
    const trulyMissing = missing.filter(p => !inventoryProductIds.has(p.id))
    console.log(`Truly missing (no match in inventory_items collection): ${trulyMissing.length}`)

    if (trulyMissing.length > 0) {
        console.log('Sample truly missing:', trulyMissing.slice(0, 5).map(p => p.name))
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
