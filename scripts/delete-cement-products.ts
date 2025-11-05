/**
 * Script to delete specific cement products
 * Delete: XM-HATIEN-PC30, XM-INSEE-PC30, XM-PCB40-001
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SKUS_TO_DELETE = [
  'XM-HATIEN-PC30',   // Xi măng Hà Tiên PC30
  'XM-INSEE-PC30',    // Xi măng INSEE PC30
  'XM-PCB40-001'      // Xi măng Portland PCB40
]

async function deleteCementProducts() {
  console.log('🗑️  Deleting cement products...\n')
  console.log('=' .repeat(80))

  let deletedCount = 0
  const deletedProducts: string[] = []

  for (const sku of SKUS_TO_DELETE) {
    try {
      const product = await prisma.product.findUnique({
        where: { sku },
        include: {
          category: {
            select: {
              name: true
            }
          },
          inventoryItem: true,
          orderItems: true,
          invoiceItems: true,
          purchaseItems: true,
          inventoryMovements: true,
          productReviews: true,
          projectMaterials: true,
          projectTaskMaterials: true,
          inventoryPredictions: true,
          inventoryHistory: true
        }
      })

      if (!product) {
        console.log(`⚠️  Product not found: ${sku}`)
        continue
      }

      console.log(`\n🗑️  Deleting: [${sku}] ${product.name}`)
      if (product.category) {
        console.log(`   Category: ${product.category.name}`)
      }

      // Delete in transaction
      await prisma.$transaction(async (tx) => {
        // Delete related records first
        if (product.inventoryItem) {
          await tx.inventoryItem.delete({ where: { id: product.inventoryItem.id } })
        }
        
        await tx.orderItem.deleteMany({ where: { productId: product.id } })
        await tx.invoiceItem.deleteMany({ where: { productId: product.id } })
        await tx.purchaseItem.deleteMany({ where: { productId: product.id } })
        await tx.inventoryMovement.deleteMany({ where: { productId: product.id } })
        await tx.productReview.deleteMany({ where: { productId: product.id } })
        await tx.projectMaterial.deleteMany({ where: { productId: product.id } })
        await tx.projectTaskMaterial.deleteMany({ where: { productId: product.id } })
        await tx.inventoryPrediction.deleteMany({ where: { productId: product.id } })
        await tx.inventoryHistory.deleteMany({ where: { productId: product.id } })

        // Delete the product
        await tx.product.delete({ where: { id: product.id } })
      })

      deletedProducts.push(sku)
      deletedCount++
      console.log(`   ✅ Deleted successfully`)
    } catch (error: any) {
      console.error(`   ❌ Error deleting ${sku}:`, error.message)
    }
  }

  // Get remaining products
  const remainingProducts = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      category: {
        select: {
          name: true
        }
      }
    },
    orderBy: [
      { category: { name: 'asc' } },
      { sku: 'asc' }
    ]
  })

  console.log(`\n${'='.repeat(80)}`)
  console.log('\n📊 Summary:')
  console.log(`   ✅ Products deleted: ${deletedCount}`)
  console.log(`   📦 Remaining products: ${remainingProducts.length}`)

  if (remainingProducts.length > 0) {
    console.log(`\n📋 Remaining products:\n`)
    
    // Group by category
    const byCategory: Record<string, typeof remainingProducts> = {}
    remainingProducts.forEach(product => {
      const categoryName = product.category?.name || 'Unknown'
      if (!byCategory[categoryName]) {
        byCategory[categoryName] = []
      }
      byCategory[categoryName].push(product)
    })

    for (const [categoryName, products] of Object.entries(byCategory)) {
      console.log(`📁 ${categoryName} (${products.length} products)`)
      products.forEach((p, i) => {
        console.log(`   ${i + 1}. [${p.sku}] ${p.name}`)
      })
      console.log()
    }
  }

  if (deletedProducts.length > 0) {
    console.log(`\n🗑️  Deleted products (${deletedProducts.length}):`)
    deletedProducts.forEach(sku => {
      console.log(`   - ${sku}`)
    })
  }
}

deleteCementProducts()
  .then(() => {
    console.log('\n✅ Deletion completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

