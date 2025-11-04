import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMissingImages() {
  console.log('🔍 Checking products with missing images...\n')
  
  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      categoryId: true,
      images: true,
      category: {
        select: {
          name: true
        }
      }
    }
  })
  
  console.log(`📦 Total products: ${allProducts.length}`)
  
  const productsWithoutImages = allProducts.filter(p => !p.images || (Array.isArray(p.images) && p.images.length === 0))
  const productsWithImages = allProducts.filter(p => p.images && Array.isArray(p.images) && p.images.length > 0)
  
  console.log(`❌ Products WITHOUT images: ${productsWithoutImages.length}`)
  console.log(`✅ Products WITH images: ${productsWithImages.length}`)
  console.log(`\n${'='.repeat(80)}\n`)
  
  // Group by category
  const byCategory: Record<string, any[]> = {}
  
  productsWithoutImages.forEach(p => {
    const catName = p.category.name
    if (!byCategory[catName]) {
      byCategory[catName] = []
    }
    byCategory[catName].push(p)
  })
  
  console.log('📊 Products without images by category:\n')
  
  Object.keys(byCategory).forEach(catName => {
    console.log(`\n🏷️  ${catName} (${byCategory[catName].length} products):`)
    byCategory[catName].forEach(p => {
      console.log(`   - ${p.name} (SKU: ${p.sku})`)
    })
  })
  
  console.log(`\n${'='.repeat(80)}\n`)
  
  // Summary
  console.log('📋 Summary:')
  console.log(`   Total products: ${allProducts.length}`)
  console.log(`   Missing images: ${productsWithoutImages.length} (${((productsWithoutImages.length / allProducts.length) * 100).toFixed(1)}%)`)
  console.log(`   Has images: ${productsWithImages.length} (${((productsWithImages.length / allProducts.length) * 100).toFixed(1)}%)`)
  
  return {
    total: allProducts.length,
    missing: productsWithoutImages.length,
    hasImages: productsWithImages.length,
    byCategory
  }
}

checkMissingImages()
  .then(() => {
    console.log('\n✅ Check completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
