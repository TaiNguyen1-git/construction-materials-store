
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting inventory fix script...')

    const productsWithoutInventory = await prisma.product.findMany({
        where: {
            inventoryItem: {
                is: null
            }
        }
    })

    console.log(`Found ${productsWithoutInventory.length} products without inventory items.`)

    if (productsWithoutInventory.length === 0) {
        console.log('Nothing to fix.')
        return
    }

    let successCount = 0
    let errorCount = 0

    for (const product of productsWithoutInventory) {
        try {
            await prisma.inventoryItem.create({
                data: {
                    productId: product.id,
                    quantity: 1000, // Default generous stock for B2B demo
                    availableQuantity: 1000,
                    reservedQuantity: 0,
                    minStockLevel: 10,
                    location: 'Kho chính',
                    notes: 'Tự động khởi tạo bởi system fix'
                }
            })
            successCount++
            console.log(`Created inventory for: ${product.name}`)
        } catch (error) {
            errorCount++
            console.log(`Error creating inventory for ${product.name}:`, error)
        }
    }

    console.log(`--- Result ---`)
    console.log(`Success: ${successCount}`)
    console.log(`Errors: ${errorCount}`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
