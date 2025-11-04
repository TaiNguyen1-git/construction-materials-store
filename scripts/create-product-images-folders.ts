/**
 * Script to create folder structure for product images
 * Creates product-images folder with subfolders for each product SKU
 * 
 * Usage:
 *   npx tsx scripts/create-product-images-folders.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function createFolders() {
  console.log('📁 Creating folder structure for product images...\n')
  
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      category: {
        select: {
          name: true
        }
      },
      images: true,
      isActive: true
    },
    orderBy: [
      { category: { name: 'asc' } },
      { name: 'asc' }
    ]
  })
  
  const rootDir = process.cwd()
  const productImagesFolder = path.join(rootDir, 'product-images')
  
  // Create main folder
  if (!fs.existsSync(productImagesFolder)) {
    fs.mkdirSync(productImagesFolder, { recursive: true })
    console.log(`✅ Created folder: product-images/`)
  } else {
    console.log(`📁 Folder already exists: product-images/`)
  }
  
  let createdCount = 0
  let existingCount = 0
  let skippedCount = 0
  
  // Create subfolders for each product
  for (const product of products) {
    const folderName = product.sku
    const folderPath = path.join(productImagesFolder, folderName)
    
    // Skip if folder name contains invalid characters
    if (!folderName || folderName.trim() === '') {
      console.log(`⚠️  Skipping product with empty SKU: ${product.name}`)
      skippedCount++
      continue
    }
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true })
      
      // Create README file in folder with product info
      const readmeContent = `# ${product.name}

**SKU:** ${product.sku}
**Category:** ${product.category.name}
**Status:** ${product.isActive ? 'Active' : 'Inactive'}

## Hướng dẫn

1. Đặt ảnh sản phẩm vào folder này
2. Format ảnh: .jpg, .jpeg, .png, .webp, .gif, .svg
3. Tên file ảnh không quan trọng (script sẽ tự động đổi tên)
4. Có thể đặt nhiều ảnh (ảnh sẽ được sắp xếp theo thứ tự alphabet)

## Chạy script import

\`\`\`bash
npx tsx scripts/import-product-images-from-folder.ts
\`\`\`

## Lưu ý

- Ảnh sẽ được copy vào \`public/products/\`
- Tên file sẽ được đổi thành: \`${product.sku}-1.jpg\`, \`${product.sku}-2.jpg\`, ...
- URLs trong database: \`/products/${product.sku}-1.jpg\`, ...
`
      
      fs.writeFileSync(
        path.join(folderPath, 'README.md'),
        readmeContent,
        'utf-8'
      )
      
      const hasImages = product.images && Array.isArray(product.images) && product.images.length > 0
      const status = hasImages ? '✅ (có ảnh)' : '❌ (chưa có ảnh)'
      
      console.log(`✅ Created: product-images/${folderName}/ ${status}`)
      createdCount++
    } else {
      const hasImages = product.images && Array.isArray(product.images) && product.images.length > 0
      const status = hasImages ? '✅ (có ảnh)' : '❌ (chưa có ảnh)'
      
      console.log(`📁 Exists: product-images/${folderName}/ ${status}`)
      existingCount++
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(80)}`)
  console.log('\n📊 Summary:')
  console.log(`   ✅ Created: ${createdCount} folders`)
  console.log(`   📁 Already exists: ${existingCount} folders`)
  console.log(`   ⏭️  Skipped: ${skippedCount} products`)
  console.log(`   📦 Total products: ${products.length}`)
  
  // List products without images
  const withoutImages = products.filter(p => !p.images || (Array.isArray(p.images) && p.images.length === 0))
  
  if (withoutImages.length > 0) {
    console.log(`\n📸 Products without images (${withoutImages.length}):`)
    withoutImages.forEach(p => {
      console.log(`   - [${p.sku}] ${p.name}`)
      console.log(`     📁 Folder: product-images/${p.sku}/`)
    })
  }
  
  console.log(`\n💡 Next steps:`)
  console.log(`   1. Đặt ảnh vào các folder trong product-images/`)
  console.log(`   2. Chạy script import: npx tsx scripts/import-product-images-from-folder.ts`)
  console.log(`   3. Kiểm tra ảnh hiển thị trên website`)
}

createFolders()
  .then(() => {
    console.log('\n✅ Folder creation completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

