/**
 * Script to verify product images are saved in database
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyImages() {
  console.log('🔍 Verifying product images in database...\n')
  
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      images: true
    },
    orderBy: {
      name: 'asc'
    }
  })
  
  console.log(`📦 Found ${products.length} products\n`)
  console.log(`${'='.repeat(80)}`)
  
  let withImages = 0
  let withoutImages = 0
  let totalImages = 0
  
  products.forEach((product, index) => {
    const imageCount = Array.isArray(product.images) ? product.images.length : 0
    totalImages += imageCount
    
    if (imageCount > 0) {
      withImages++
      console.log(`${(index + 1).toString().padStart(2)}. ✅ ${product.name} (${product.sku})`)
      console.log(`    📸 ${imageCount} ảnh: ${product.images.slice(0, 2).join(', ')}${imageCount > 2 ? '...' : ''}`)
    } else {
      withoutImages++
      console.log(`${(index + 1).toString().padStart(2)}. ❌ ${product.name} (${product.sku})`)
      console.log(`    📸 Chưa có ảnh`)
    }
  })
  
  console.log(`\n${'='.repeat(80)}`)
  console.log('\n📊 Summary:')
  console.log(`   ✅ Products with images: ${withImages}/${products.length}`)
  console.log(`   ❌ Products without images: ${withoutImages}/${products.length}`)
  console.log(`   📸 Total images in database: ${totalImages}`)
  console.log(`   📈 Coverage: ${((withImages / products.length) * 100).toFixed(1)}%`)
  
  if (withoutImages === 0) {
    console.log('\n🎉 All products have images in database!')
  } else {
    console.log(`\n⚠️  ${withoutImages} products still need images`)
  }
}

verifyImages()
  .then(() => {
    console.log('\n✅ Verification completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

