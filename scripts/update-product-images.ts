import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Bộ ảnh vật liệu xây dựng từ Unsplash (miễn phí cho dự án)
// Format: https://images.unsplash.com/photo-[id]?w=800&q=80
const PRODUCT_IMAGES: Record<string, string[]> = {
  // Xi măng & Bê tông
  'XM-INSEE-PCB40': [
    'https://images.unsplash.com/photo-1588854337221-4cf9fa96e56d?w=800&q=80', // Cement bags
    'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80', // Concrete mixing
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80'  // Construction cement
  ],
  'XM-HATIEN-PCB40': [
    'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=800&q=80', // Cement pile
    'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&q=80', // Concrete work
    'https://images.unsplash.com/photo-1632687621924-a6b3b46d2e88?w=800&q=80'  // Construction materials
  ],
  
  // Thép xây dựng
  'THEP-CB240-D10': [
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80', // Steel rebar
    'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&q=80', // Steel construction
    'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80', // Metal bars
    'https://images.unsplash.com/photo-1632687621924-a6b3b46d2e88?w=800&q=80'  // Construction site
  ],
  
  // Gạch ốp tường
  'GACH-OP-30X60': [
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80', // Wall tiles
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80', // Modern tiles
    'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80', // Tile wall
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80'  // Bathroom tiles
  ],
  
  // Gạch lát nền
  'GACH-LAT-60X60': [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', // Floor tiles
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80', // Tile flooring
    'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=800&q=80', // Modern floor
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'  // Ceramic tiles
  ],
  
  // Sơn nước
  'SON-DULUX-18L': [
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80', // Paint cans
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&q=80', // Paint supplies
    'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=800&q=80', // Color paint
    'https://images.unsplash.com/photo-1598300056393-4aac492f4344?w=800&q=80'  // Paint bucket
  ],
  
  // Ống nước PPR
  'ONG-PPR-D25': [
    'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800&q=80', // PVC pipes
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80', // Plumbing pipes
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80', // Water pipes
    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80'  // Construction plumbing
  ]
}

async function updateProductImages() {
  console.log('🖼️  Starting product images update...\n')
  
  let updateCount = 0
  let errorCount = 0
  let skippedCount = 0
  
  // Validate all URLs before updating
  console.log('🔍 Validating image URLs...\n')
  const invalidUrls: string[] = []
  
  for (const [sku, images] of Object.entries(PRODUCT_IMAGES)) {
    for (const url of images) {
      try {
        new URL(url) // Validate URL format
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          invalidUrls.push(`${sku}: ${url} (not http/https)`)
        }
      } catch {
        invalidUrls.push(`${sku}: ${url} (invalid format)`)
      }
    }
  }
  
  if (invalidUrls.length > 0) {
    console.log('⚠️  Found invalid URLs:')
    invalidUrls.forEach(url => console.log(`   - ${url}`))
    console.log('\n❌ Please fix invalid URLs before continuing.\n')
    return
  }
  
  console.log('✅ All URLs are valid!\n')
  
  for (const [sku, images] of Object.entries(PRODUCT_IMAGES)) {
    try {
      console.log(`📸 Updating images for SKU: ${sku}`)
      
      const product = await prisma.product.findUnique({
        where: { sku },
        select: { id: true, name: true, images: true }
      })
      
      if (!product) {
        console.log(`   ⚠️  Product not found: ${sku}`)
        errorCount++
        continue
      }
      
      // Check if product already has images
      const currentImages = Array.isArray(product.images) ? product.images : []
      if (currentImages.length > 0) {
        console.log(`   ℹ️  Product already has ${currentImages.length} image(s)`)
        const answer = process.env.FORCE_UPDATE === 'true' ? 'y' : 'skip'
        
        if (answer === 'skip') {
          console.log(`   ⏭️  Skipping (already has images)`)
          skippedCount++
          continue
        }
      }
      
      // Update with transaction for safety
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { sku },
          data: { 
            images,
            updatedAt: new Date()
          }
        })
      })
      
      console.log(`   ✅ Updated ${images.length} images for: ${product.name}`)
      updateCount++
      
    } catch (error: any) {
      console.error(`   ❌ Error updating ${sku}:`, error.message)
      errorCount++
    }
  }
  
  console.log(`\n${'='.repeat(80)}`)
  console.log('\n📊 Update Summary:')
  console.log(`   ✅ Successfully updated: ${updateCount} products`)
  console.log(`   ⏭️  Skipped (already has images): ${skippedCount} products`)
  console.log(`   ❌ Errors: ${errorCount} products`)
  console.log(`   📸 Total images in configuration: ${Object.values(PRODUCT_IMAGES).flat().length}`)
  console.log(`   📝 Total products in configuration: ${Object.keys(PRODUCT_IMAGES).length}`)
  
  if (skippedCount > 0) {
    console.log(`\n💡 Tip: Set FORCE_UPDATE=true to overwrite existing images`)
    console.log(`   Example: FORCE_UPDATE=true npx tsx scripts/update-product-images.ts`)
  }
  
  // Verify results
  console.log('\n🔍 Verifying results...\n')
  
  const allProducts = await prisma.product.findMany({
    select: {
      name: true,
      sku: true,
      images: true
    }
  })
  
  const withImages = allProducts.filter(p => p.images && Array.isArray(p.images) && p.images.length > 0)
  const withoutImages = allProducts.filter(p => !p.images || (Array.isArray(p.images) && p.images.length === 0))
  
  console.log('✅ Products with images:')
  withImages.forEach(p => {
    const imageCount = Array.isArray(p.images) ? p.images.length : 0
    console.log(`   - ${p.name} (${imageCount} images)`)
  })
  
  if (withoutImages.length > 0) {
    console.log('\n⚠️  Products still without images:')
    withoutImages.forEach(p => {
      console.log(`   - ${p.name} (SKU: ${p.sku})`)
    })
  } else {
    console.log('\n🎉 All products now have images!')
  }
  
  console.log(`\n📈 Coverage: ${withImages.length}/${allProducts.length} products (${((withImages.length / allProducts.length) * 100).toFixed(1)}%)`)
}

updateProductImages()
  .then(() => {
    console.log('\n✅ Update completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
