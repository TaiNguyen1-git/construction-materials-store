import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('🔍 Checking inventory data...\n')

    // Check products with inventory
    const products = await prisma.product.findMany({
      include: {
        inventoryItem: true,
        category: true
      },
      take: 5
    })

    console.log('📦 Sample Products with Inventory:')
    products.forEach(p => {
      console.log(`  - ${p.name}:`)
      console.log(`    Stock: ${p.inventoryItem?.quantity || 0}`)
      console.log(`    Min: ${p.inventoryItem?.minStockLevel || 0}`)
      console.log(`    Max: ${p.inventoryItem?.maxStockLevel || 0}`)
    })

    // Check AI predictions
    const predictions = await prisma.inventoryPrediction.findMany({
      include: {
        product: true
      },
      take: 5
    })

    console.log('\n🤖 AI Predictions:')
    console.log(`  Total: ${predictions.length}`)
    predictions.forEach(p => {
      console.log(`  - ${p.product.name}: Predicted ${p.predictedDemand}, Confidence ${p.confidence}`)
    })

    // Check inventory movements
    const movements = await prisma.inventoryMovement.findMany({
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    console.log('\n📊 Recent Inventory Movements:')
    console.log(`  Total: ${movements.length}`)
    movements.forEach(m => {
      console.log(`  - ${m.product.name}: ${m.movementType} ${m.quantity} units`)
    })

    // Check low stock products
    const lowStockProducts = await prisma.inventoryItem.findMany({
      where: {
        OR: [
          { quantity: { lte: prisma.inventoryItem.fields.minStockLevel } },
          {
            quantity: {
              lte: 50
            }
          }
        ]
      },
      include: {
        product: true
      }
    })

    console.log('\n⚠️  Low Stock Products:')
    console.log(`  Total: ${lowStockProducts.length}`)
    lowStockProducts.forEach(item => {
      console.log(`  - ${item.product.name}: ${item.quantity}/${item.minStockLevel}`)
    })

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    await prisma.$disconnect()
  }
}

checkData()
