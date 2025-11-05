/**
 * Script to delete unwanted products
 * Keep only: Xi măng, Gạch, Cát, Đá, and 1-2 Thép products
 * 
 * Usage:
 *   npx tsx scripts/delete-unwanted-products.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// SKUs to delete
const SKUS_TO_DELETE = [
  'BTN-M250-001',      // Bê tông tươi M250
  'GACH-LAT-60X60',    // Gạch lát nền 60x60
  'GACH-OP-30X60',     // Gạch ốp tường 30x60
  'SON-DULUX-18L',     // Sơn nước Dulux Inspire
  'DAY-CADIVI-2X15',   // Dây điện Cadivi 2x1.5
  'CT-GOC-BITUM',      // Chống thấm gốc bitum
  'THEP-HOP-4020',     // Thép hộp 40x20x1.2 (giữ lại THEP-CB240-D10)
  'ONG-PPR-D25'        // Ống nước PPR PN16 D25
]

async function deleteUnwantedProducts() {
  console.log('🗑️  Deleting unwanted products...\n')
  console.log('=' .repeat(80))

  // Get all products first
  const allProducts = await prisma.product.findMany({
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

  console.log(`\n📦 Total products before deletion: ${allProducts.length}\n`)

  let deletedCount = 0
  let notFoundCount = 0
  const deletedProducts: string[] = []

  // Delete products by SKU
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
        notFoundCount++
        continue
      }

      console.log(`\n🗑️  Deleting: [${sku}] ${product.name}`)
      if (product.category) {
        console.log(`   Category: ${product.category.name}`)
      }

      // Check related data
      const hasRelatedData = 
        product.inventoryItem !== null ||
        product.orderItems.length > 0 ||
        product.invoiceItems.length > 0 ||
        product.purchaseItems.length > 0 ||
        product.inventoryMovements.length > 0 ||
        product.productReviews.length > 0 ||
        product.projectMaterials.length > 0 ||
        product.projectTaskMaterials.length > 0 ||
        product.inventoryPredictions.length > 0 ||
        product.inventoryHistory.length > 0

      if (hasRelatedData) {
        console.log(`   ⚠️  Has related data - will be deleted in transaction`)
      }

      // Delete in transaction to handle related data
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
  console.log(`   ⚠️  Products not found: ${notFoundCount}`)
  console.log(`   📦 Remaining products: ${remainingProducts.length}`)

  if (remainingProducts.length > 0) {
    console.log(`\n📋 Remaining products:\n`)
    
    // Group by category
    const byCategory: Record<string, typeof remainingProducts> = {}
    remainingProducts.forEach(product => {
      const categoryName = product.category.name
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

deleteUnwantedProducts()
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

