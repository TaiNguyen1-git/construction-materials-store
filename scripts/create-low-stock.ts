import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createLowStock() {
  try {
    console.log('📉 Creating low stock scenarios...\n')

    const products = await prisma.product.findMany({
      include: {
        inventoryItem: true
      },
      take: 5
    })

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      if (!product.inventoryItem) continue

      // Create varying levels of low stock
      let newStock = 0
      if (i === 0) {
        newStock = 0 // Out of stock
      } else if (i === 1) {
        newStock = 10 // Very low
      } else if (i === 2) {
        newStock = 20 // Low
      } else {
        newStock = 25 // Just below min (30)
      }

      await prisma.inventoryItem.update({
        where: { id: product.inventoryItem.id },
        data: {
          quantity: newStock,
          availableQuantity: newStock
        }
      })

      console.log(`✅ ${product.name}: Set stock to ${newStock}`)
    }

    console.log('\n🎉 Low stock scenarios created successfully!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createLowStock()
