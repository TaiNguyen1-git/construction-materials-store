import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function finalDataFix() {
  try {
    console.log('🔧 Final comprehensive data fix...\n')

    // 1. Create AI Predictions
    console.log('1️⃣ Creating AI Predictions...')
    const products = await prisma.product.findMany({
      include: {
        inventoryItem: true
      }
    })

    await prisma.inventoryPrediction.deleteMany({}) // Clear old predictions

    for (const product of products) {
      if (!product.inventoryItem) continue

      const currentStock = product.inventoryItem.availableQuantity
      const predictedDemand = Math.floor(Math.random() * 50) + 20
      const recommendedOrder = Math.max(0, predictedDemand - currentStock + product.inventoryItem.minStockLevel)

      await prisma.inventoryPrediction.create({
        data: {
          productId: product.id,
          timeframe: 'MONTH',
          predictionDate: new Date(),
          predictedDemand,
          confidence: 0.75 + Math.random() * 0.2, // 0.75-0.95
          recommendedOrder,
          factors: {
            historicalSales: Math.floor(Math.random() * 40) + 10,
            seasonality: 1.0 + (Math.random() * 0.4 - 0.2),
            trend: 'stable'
          }
        }
      })
    }
    console.log(`✅ Created ${products.length} AI predictions\n`)

    // 2. Create Purchase Recommendations (skip if model doesn't exist)
    console.log('2️⃣ Creating Purchase Recommendations...')
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "purchase_recommendations" LIMIT 1`
      console.log('⏭️  Purchase recommendations table not available\n')
    } catch (error) {
      console.log('⏭️  Skipped (table may not exist)\n')
    }

    // 3. Create Inventory Movements
    console.log('3️⃣ Creating Inventory Movements...')
    const existingMovements = await prisma.inventoryMovement.count()
    
    if (existingMovements < 10) {
      for (let i = 0; i < 20; i++) {
        const product = products[Math.floor(Math.random() * products.length)]
        if (!product.inventoryItem) continue

        const movementType = ['IN', 'OUT', 'ADJUSTMENT'][Math.floor(Math.random() * 3)] as any
        const quantity = Math.floor(Math.random() * 20) + 5
        const previousStock = product.inventoryItem.availableQuantity
        const newStock = movementType === 'IN' 
          ? previousStock + quantity 
          : Math.max(0, previousStock - quantity)

        const reasons = {
          IN: ['Nhập hàng từ nhà cung cấp', 'Hoàn trả từ khách hàng', 'Điều chỉnh tăng'],
          OUT: ['Xuất hàng theo đơn', 'Hàng hỏng', 'Mẫu trưng bày'],
          ADJUSTMENT: ['Kiểm kê định kỳ', 'Điều chỉnh sai sót', 'Cân đối kho']
        }

        await prisma.inventoryMovement.create({
          data: {
            inventoryId: product.inventoryItem.id,
            productId: product.id,
            movementType,
            quantity,
            previousStock,
            newStock,
            reason: reasons[movementType][Math.floor(Math.random() * 3)],
            referenceType: movementType === 'OUT' ? 'ORDER' : 'PURCHASE',
            performedBy: 'admin'
          }
        })
      }
      console.log('✅ Created 20 inventory movements\n')
    } else {
      console.log('✅ Inventory movements already exist\n')
    }

    // 4. Update all inventory items to ensure they have proper stock levels
    console.log('4️⃣ Updating inventory stock levels...')
    const inventoryItems = await prisma.inventoryItem.findMany()
    
    for (const item of inventoryItems) {
      const quantity = item.quantity || Math.floor(Math.random() * 200) + 50
      await prisma.inventoryItem.update({
        where: { id: item.id },
        data: {
          quantity,
          availableQuantity: quantity,
          minStockLevel: 30,
          maxStockLevel: 500,
          reorderPoint: 40
        }
      })
    }
    console.log(`✅ Updated ${inventoryItems.length} inventory items\n`)

    // 5. Statistics
    const stats = {
      products: await prisma.product.count(),
      customers: await prisma.customer.count(),
      orders: await prisma.order.count(),
      inventory: await prisma.inventoryItem.count(),
      predictions: await prisma.inventoryPrediction.count(),
      movements: await prisma.inventoryMovement.count(),
      reviews: await prisma.productReview.count()
    }

    console.log('📊 Final Database Statistics:')
    console.log(`   Products: ${stats.products}`)
    console.log(`   Customers: ${stats.customers}`)
    console.log(`   Orders: ${stats.orders}`)
    console.log(`   Inventory: ${stats.inventory}`)
    console.log(`   AI Predictions: ${stats.predictions}`)
    console.log(`   Inventory Movements: ${stats.movements}`)
    console.log(`   Product Reviews: ${stats.reviews}`)

    console.log('\n🎉 Final data fix completed!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

finalDataFix()
