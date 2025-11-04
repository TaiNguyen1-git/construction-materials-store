import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

// Validate URL format
function isValidImageUrl(url: string): { valid: boolean; error?: string } {
  try {
    const urlObj = new URL(url)
    
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must use http or https protocol' }
    }
    
    // Check if it looks like an image URL (optional but recommended)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const hasImageExtension = imageExtensions.some(ext => 
      urlObj.pathname.toLowerCase().includes(ext)
    )
    
    const hasImageParam = urlObj.searchParams.has('w') || urlObj.searchParams.has('format')
    
    if (!hasImageExtension && !hasImageParam) {
      console.log(`   ⚠️  Warning: URL doesn't appear to be an image (no extension or image params)`)
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' }
  }
}

async function addProductImages() {
  console.log('🖼️  Add Product Images Tool\n')
  console.log('='.repeat(60))
  
  // Get all products
  const products = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      images: true
    },
    orderBy: { name: 'asc' }
  })
  
  console.log('\n📦 Available Products:\n')
  products.forEach((p, idx) => {
    const imageCount = Array.isArray(p.images) ? p.images.length : 0
    const status = imageCount > 0 ? `✅ ${imageCount} images` : '❌ No images'
    console.log(`${idx + 1}. ${p.name} (SKU: ${p.sku}) - ${status}`)
  })
  
  console.log('\n' + '='.repeat(60) + '\n')
  
  // Select product
  const productIndex = await question('Enter product number (or "q" to quit): ')
  
  if (productIndex.toLowerCase() === 'q') {
    console.log('👋 Goodbye!')
    rl.close()
    process.exit(0)
  }
  
  const selectedProduct = products[parseInt(productIndex) - 1]
  
  if (!selectedProduct) {
    console.log('❌ Invalid product number!')
    rl.close()
    process.exit(1)
  }
  
  console.log(`\n✅ Selected: ${selectedProduct.name} (${selectedProduct.sku})`)
  
  const currentImages = Array.isArray(selectedProduct.images) ? selectedProduct.images : []
  if (currentImages.length > 0) {
    console.log(`\n📸 Current images (${currentImages.length}):`)
    currentImages.forEach((img, idx) => {
      console.log(`   ${idx + 1}. ${img}`)
    })
  } else {
    console.log('\n📸 No images currently.')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('\nOptions:')
  console.log('1. Add new image(s)')
  console.log('2. Replace all images')
  console.log('3. Remove all images')
  console.log('4. Cancel')
  
  const option = await question('\nSelect option (1-4): ')
  
  switch (option) {
    case '1': {
      // Add new images
      console.log('\n📝 Enter image URLs (one per line, empty line to finish):')
      console.log('💡 Tip: URLs should start with http:// or https://')
      const newImages: string[] = []
      const invalidUrls: string[] = []
      
      while (true) {
        const url = await question(`Image ${newImages.length + 1} URL: `)
        if (!url.trim()) break
        
        // Validate URL
        const validation = isValidImageUrl(url.trim())
        if (!validation.valid) {
          console.log(`   ❌ Invalid URL: ${validation.error}`)
          invalidUrls.push(url.trim())
          const retry = await question('   Retry this URL? (y/n): ')
          if (retry.toLowerCase() === 'y') continue
        } else {
          newImages.push(url.trim())
          console.log(`   ✅ URL added`)
        }
      }
      
      if (newImages.length === 0) {
        console.log('⚠️  No valid images added.')
        break
      }
      
      if (invalidUrls.length > 0) {
        console.log(`\n⚠️  ${invalidUrls.length} invalid URL(s) were skipped`)
      }
      
      const updatedImages = [...currentImages, ...newImages]
      
      try {
        await prisma.product.update({
          where: { id: selectedProduct.id },
          data: { 
            images: updatedImages,
            updatedAt: new Date()
          }
        })
        
        console.log(`\n✅ Added ${newImages.length} image(s)!`)
        console.log(`📊 Total images now: ${updatedImages.length}`)
      } catch (error: any) {
        console.error(`\n❌ Error updating product: ${error.message}`)
      }
      break
    }
    
    case '2': {
      // Replace all images
      if (currentImages.length > 0) {
        const confirm = await question(`\n⚠️  This will replace ${currentImages.length} existing image(s). Continue? (yes/no): `)
        if (confirm.toLowerCase() !== 'yes') {
          console.log('❌ Cancelled.')
          break
        }
      }
      
      console.log('\n📝 Enter new image URLs (one per line, empty line to finish):')
      console.log('💡 Tip: URLs should start with http:// or https://')
      const newImages: string[] = []
      const invalidUrls: string[] = []
      
      while (true) {
        const url = await question(`Image ${newImages.length + 1} URL: `)
        if (!url.trim()) break
        
        // Validate URL
        const validation = isValidImageUrl(url.trim())
        if (!validation.valid) {
          console.log(`   ❌ Invalid URL: ${validation.error}`)
          invalidUrls.push(url.trim())
          const retry = await question('   Retry this URL? (y/n): ')
          if (retry.toLowerCase() === 'y') continue
        } else {
          newImages.push(url.trim())
          console.log(`   ✅ URL added`)
        }
      }
      
      if (newImages.length === 0) {
        console.log('⚠️  No valid images provided.')
        break
      }
      
      if (invalidUrls.length > 0) {
        console.log(`\n⚠️  ${invalidUrls.length} invalid URL(s) were skipped`)
      }
      
      try {
        await prisma.product.update({
          where: { id: selectedProduct.id },
          data: { 
            images: newImages,
            updatedAt: new Date()
          }
        })
        
        console.log(`\n✅ Replaced with ${newImages.length} new image(s)!`)
      } catch (error: any) {
        console.error(`\n❌ Error updating product: ${error.message}`)
      }
      break
    }
    
    case '3': {
      // Remove all images
      if (currentImages.length === 0) {
        console.log('\n⚠️  Product has no images to remove.')
        break
      }
      
      console.log(`\n⚠️  WARNING: This will remove ${currentImages.length} image(s) from the product.`)
      console.log('⚠️  This action cannot be undone!')
      const confirm = await question('\nType "DELETE" to confirm: ')
      
      if (confirm === 'DELETE') {
        try {
          await prisma.product.update({
            where: { id: selectedProduct.id },
            data: { 
              images: [],
              updatedAt: new Date()
            }
          })
          
          console.log(`\n✅ All ${currentImages.length} image(s) removed!`)
        } catch (error: any) {
          console.error(`\n❌ Error removing images: ${error.message}`)
        }
      } else {
        console.log('\n❌ Cancelled. (You must type "DELETE" to confirm)')
      }
      break
    }
    
    case '4':
      console.log('\n❌ Cancelled.')
      break
    
    default:
      console.log('\n❌ Invalid option!')
  }
  
  console.log('\n' + '='.repeat(60))
  
  // Show final result
  const updated = await prisma.product.findUnique({
    where: { id: selectedProduct.id },
    select: { images: true }
  })
  
  const finalImages = Array.isArray(updated?.images) ? updated.images : []
  console.log(`\n📊 Final state: ${finalImages.length} image(s)`)
  
  if (finalImages.length > 0) {
    console.log('\n📸 Current images:')
    finalImages.forEach((img, idx) => {
      console.log(`   ${idx + 1}. ${img}`)
    })
  }
  
  console.log('\n✅ Done!')
}

addProductImages()
  .then(() => {
    rl.close()
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    rl.close()
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
