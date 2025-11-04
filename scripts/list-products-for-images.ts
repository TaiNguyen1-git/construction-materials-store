/**
 * Script to list all products with SKU and name
 * Helpful for creating product-images folder structure
 * 
 * Usage:
 *   npx tsx scripts/list-products-for-images.ts
 * 
 * Output:
 *   - Console list of all products
 *   - Optional: Export to CSV file
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function listProducts() {
  console.log('📦 Listing all products for image import...\n')
  
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
  
  console.log(`Found ${products.length} products\n`)
  console.log(`${'='.repeat(100)}`)
  
  // Group by category
  const byCategory: Record<string, typeof products> = {}
  
  products.forEach(product => {
    const categoryName = product.category.name
    if (!byCategory[categoryName]) {
      byCategory[categoryName] = []
    }
    byCategory[categoryName].push(product)
  })
  
  // Print grouped by category
  for (const [categoryName, categoryProducts] of Object.entries(byCategory)) {
    console.log(`\n📁 ${categoryName} (${categoryProducts.length} products)`)
    console.log('-'.repeat(100))
    
    categoryProducts.forEach((product, index) => {
      const hasImages = product.images && Array.isArray(product.images) && product.images.length > 0
      const imageStatus = hasImages ? `✅ ${product.images.length} ảnh` : '❌ Chưa có ảnh'
      const status = product.isActive ? '' : '⚠️ INACTIVE'
      
      console.log(`${(index + 1).toString().padStart(3)}. [${product.sku}] ${product.name}`)
      console.log(`     ${imageStatus} ${status}`)
      
      // Print folder structure suggestion
      if (!hasImages) {
        console.log(`     📁 Folder: product-images/${product.sku}/`)
      }
    })
  }
  
  // Summary
  const withImages = products.filter(p => p.images && Array.isArray(p.images) && p.images.length > 0)
  const withoutImages = products.filter(p => !p.images || (Array.isArray(p.images) && p.images.length === 0))
  const inactive = products.filter(p => !p.isActive)
  
  console.log(`\n${'='.repeat(100)}`)
  console.log('\n📊 Summary:')
  console.log(`   ✅ Products with images: ${withImages.length}`)
  console.log(`   ❌ Products without images: ${withoutImages.length}`)
  console.log(`   ⚠️  Inactive products: ${inactive.length}`)
  console.log(`   📈 Coverage: ${((withImages.length / products.length) * 100).toFixed(1)}%`)
  
  // Generate folder structure suggestions
  if (withoutImages.length > 0) {
    console.log(`\n📁 Suggested folder structure for products without images:\n`)
    console.log(`product-images/`)
    
    withoutImages.slice(0, 20).forEach(product => {
      console.log(`├── ${product.sku}/`)
      console.log(`│   └── (place images here)`)
    })
    
    if (withoutImages.length > 20) {
      console.log(`├── ... (${withoutImages.length - 20} more)`)
    }
  }
  
  // Export to CSV (optional)
  const exportCSV = process.env.EXPORT_CSV === 'true'
  if (exportCSV) {
    const csvPath = path.join(process.cwd(), 'products-list.csv')
    const csvLines = [
      'SKU,Name,Category,Has Images,Image Count,Status',
      ...products.map(p => {
        const hasImages = p.images && Array.isArray(p.images) && p.images.length > 0
        const imageCount = hasImages ? (p.images as string[]).length : 0
        return [
          p.sku,
          `"${p.name}"`,
          `"${p.category.name}"`,
          hasImages ? 'Yes' : 'No',
          imageCount.toString(),
          p.isActive ? 'Active' : 'Inactive'
        ].join(',')
      })
    ]
    
    fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8')
    console.log(`\n✅ Exported to: ${csvPath}`)
    console.log(`   Run with: EXPORT_CSV=true npx tsx scripts/list-products-for-images.ts`)
  } else {
    console.log(`\n💡 Tip: Export to CSV with:`)
    console.log(`   EXPORT_CSV=true npx tsx scripts/list-products-for-images.ts`)
  }
}

listProducts()
  .then(() => {
    console.log('\n✅ List completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

