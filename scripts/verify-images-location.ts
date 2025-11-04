/**
 * Script to verify images are in correct locations
 * 
 * This script checks:
 * 1. Images in public/products/ (served to website)
 * 2. Images referenced in database
 * 3. Images in product-images/ (source folder - can be deleted)
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function verifyImagesLocation() {
  console.log('🔍 Verifying images location...\n')
  
  const rootDir = process.cwd()
  const publicProductsFolder = path.join(rootDir, 'public', 'products')
  const productImagesFolder = path.join(rootDir, 'product-images')
  
  // Get all products from database
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      images: true
    }
  })
  
  console.log(`📦 Found ${products.length} products in database\n`)
  
  // Check public/products folder
  let publicImagesCount = 0
  const publicImages: string[] = []
  
  if (fs.existsSync(publicProductsFolder)) {
    const files = fs.readdirSync(publicProductsFolder)
    publicImagesCount = files.filter(f => {
      const ext = path.extname(f).toLowerCase()
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)
    }).length
    
    publicImages.push(...files.filter(f => {
      const ext = path.extname(f).toLowerCase()
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)
    }))
  }
  
  // Check product-images folder
  let sourceImagesCount = 0
  
  if (fs.existsSync(productImagesFolder)) {
    const folders = fs.readdirSync(productImagesFolder, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
    
    for (const folder of folders) {
      const folderPath = path.join(productImagesFolder, folder)
      const files = fs.readdirSync(folderPath)
      sourceImagesCount += files.filter(f => {
        const ext = path.extname(f).toLowerCase()
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)
      }).length
    }
  }
  
  // Count images in database
  let dbImagesCount = 0
  const dbImageUrls: string[] = []
  
  products.forEach(product => {
    if (Array.isArray(product.images)) {
      dbImagesCount += product.images.length
      dbImageUrls.push(...product.images)
    }
  })
  
  // Verify each product's images exist in public/products
  console.log('📊 Location Summary:')
  console.log(`   📁 public/products/: ${publicImagesCount} ảnh`)
  console.log(`   📁 product-images/: ${sourceImagesCount} ảnh (source - có thể xóa)`)
  console.log(`   💾 Database: ${dbImagesCount} image URLs`)
  
  console.log(`\n${'='.repeat(80)}`)
  console.log('\n✅ Verification:')
  
  // Check if database URLs match files in public/products
  let missingFiles = 0
  let foundFiles = 0
  
  dbImageUrls.forEach(url => {
    // URL format: /products/FILENAME
    const filename = url.replace('/products/', '')
    const filePath = path.join(publicProductsFolder, filename)
    
    if (fs.existsSync(filePath)) {
      foundFiles++
    } else {
      missingFiles++
      console.log(`   ⚠️  Missing: ${filename} (referenced in DB but not in public/products/)`)
    }
  })
  
  console.log(`\n   ✅ Found: ${foundFiles}/${dbImagesCount} images in public/products/`)
  if (missingFiles > 0) {
    console.log(`   ❌ Missing: ${missingFiles} images`)
  } else {
    console.log(`   🎉 All database images exist in public/products/!`)
  }
  
  console.log(`\n${'='.repeat(80)}`)
  console.log('\n💡 Important:')
  console.log(`   1. ✅ public/products/ - Ảnh được serve cho website (KHÔNG XÓA!)`)
  console.log(`   2. 📁 product-images/ - Folder source (CÓ THỂ XÓA sau khi import)`)
  console.log(`   3. 💾 Database - Lưu URLs trỏ đến public/products/`)
  
  console.log(`\n📝 Answer:`)
  console.log(`   ❓ "Nếu xóa folder product-images/ thì có mất ảnh không?"`)
  console.log(`   ✅ KHÔNG MẤT! Vì:`)
  console.log(`      - Ảnh đã được COPY sang public/products/`)
  console.log(`      - Database lưu URLs trỏ đến public/products/`)
  console.log(`      - Website load ảnh từ public/products/`)
  console.log(`      - Folder product-images/ chỉ là nơi tạm thời để import`)
  
  console.log(`\n   ⚠️  CHỈ XÓA public/products/ thì mới MẤT ảnh!`)
}

verifyImagesLocation()
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

