/**
 * Script to create folders for ALL products in database
 * This allows you to add images for all products, even if they already have images
 * 
 * Usage:
 *   npx tsx scripts/create-all-product-folders.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

// Get root directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const PRODUCT_IMAGES_FOLDER = path.join(rootDir, 'product-images')

async function createAllFolders() {
  console.log('📁 Creating folders for ALL products...\n')
  console.log('=' .repeat(80))

  // Get all products
  const products = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      images: true,
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

  console.log(`\n📦 Found ${products.length} products in database\n`)

  // Create product-images folder if not exists
  if (!fs.existsSync(PRODUCT_IMAGES_FOLDER)) {
    fs.mkdirSync(PRODUCT_IMAGES_FOLDER, { recursive: true })
    console.log(`✅ Created folder: product-images/\n`)
  }

  let createdCount = 0
  let existingCount = 0
  const createdFolders: string[] = []
  const existingFolders: string[] = []

  // Create folder for each product
  for (const product of products) {
    const folderPath = path.join(PRODUCT_IMAGES_FOLDER, product.sku)
    const hasImages = product.images && Array.isArray(product.images) && product.images.length > 0
    const imageStatus = hasImages ? `✅ ${product.images.length} ảnh` : '❌ Chưa có ảnh'

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true })
      createdFolders.push(product.sku)
      createdCount++
      console.log(`✅ Created: ${product.sku}/ - ${product.name} (${imageStatus})`)
    } else {
      existingFolders.push(product.sku)
      existingCount++
      console.log(`⏭️  Exists: ${product.sku}/ - ${product.name} (${imageStatus})`)
    }
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log('\n📊 Summary:')
  console.log(`   ✅ Folders created: ${createdCount}`)
  console.log(`   ⏭️  Folders already exist: ${existingCount}`)
  console.log(`   📦 Total products: ${products.length}`)

  const noImages = products.filter(p => !p.images || (Array.isArray(p.images) && p.images.length === 0))
  const withImages = products.filter(p => p.images && Array.isArray(p.images) && p.images.length > 0)

  console.log(`\n📸 Image Status:`)
  console.log(`   ✅ Products with images: ${withImages.length}`)
  console.log(`   ❌ Products without images: ${noImages.length}`)

  if (createdFolders.length > 0) {
    console.log(`\n📁 Newly created folders (${createdFolders.length}):`)
    createdFolders.forEach(sku => {
      console.log(`   - product-images/${sku}/`)
    })
  }

  console.log(`\n💡 Tip: Add images to folders, then run:`)
  console.log(`   npx tsx scripts/import-product-images-from-folder.ts`)
}

createAllFolders()
  .then(() => {
    console.log('\n✅ All folders created successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

