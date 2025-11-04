/**
 * Script to import product images from local folder
 * 
 * Usage:
 * 1. Create folder structure: product-images/[SKU]/image1.jpg, image2.jpg, ...
 *    OR: product-images/[Product-Name]/image1.jpg, image2.jpg, ...
 * 
 * 2. Run script:
 *    npx tsx scripts/import-product-images-from-folder.ts
 * 
 * Options:
 * - SKU-based: Match by SKU (recommended)
 * - Name-based: Match by product name (fuzzy matching)
 * - Force update: Overwrite existing images
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

// Configuration
const PRODUCT_IMAGES_FOLDER = path.join(rootDir, 'product-images')
const PUBLIC_PRODUCTS_FOLDER = path.join(rootDir, 'public', 'products')
const FORCE_UPDATE = process.env.FORCE_UPDATE === 'true'
const MATCH_BY_SKU = process.env.MATCH_BY_NAME !== 'true' // Default: match by SKU

// Supported image extensions
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']

interface ProductImageMatch {
  productId: string
  productName: string
  sku: string
  images: string[]
  sourcePath: string
}

/**
 * Get all products from database
 */
async function getAllProducts() {
  return await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      images: true
    }
  })
}

/**
 * Normalize product name for matching
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .trim()
}

/**
 * Find product by SKU (exact match)
 */
function findProductBySKU(products: any[], folderName: string): any | null {
  return products.find(p => p.sku === folderName) || null
}

/**
 * Find product by name (fuzzy match)
 */
function findProductByName(products: any[], folderName: string): any | null {
  const normalizedFolder = normalizeName(folderName)
  
  // Try exact normalized match first
  let match = products.find(p => normalizeName(p.name) === normalizedFolder)
  if (match) return match
  
  // Try partial match (folder name contains product name or vice versa)
  match = products.find(p => {
    const normalizedProduct = normalizeName(p.name)
    return normalizedFolder.includes(normalizedProduct) || 
           normalizedProduct.includes(normalizedFolder)
  })
  if (match) return match
  
  // Try keyword matching (split by common separators)
  const folderKeywords = normalizedFolder.split(/[-_\s]+/)
  match = products.find(p => {
    const productKeywords = normalizeName(p.name).split(/[-_\s]+/)
    const commonKeywords = folderKeywords.filter(k => 
      productKeywords.some(pk => pk.includes(k) || k.includes(pk))
    )
    return commonKeywords.length >= Math.min(2, folderKeywords.length / 2)
  })
  
  return match || null
}

/**
 * Get image files from folder
 */
function getImageFiles(folderPath: string): string[] {
  if (!fs.existsSync(folderPath)) {
    return []
  }
  
  const files = fs.readdirSync(folderPath)
  return files
    .filter(file => {
      const ext = path.extname(file).toLowerCase()
      return IMAGE_EXTENSIONS.includes(ext)
    })
    .sort() // Sort alphabetically for consistent order
    .map(file => path.join(folderPath, file))
}

/**
 * Copy image to public folder
 */
function copyImageToPublic(sourcePath: string, productSKU: string, index: number): string {
  const ext = path.extname(sourcePath)
  const filename = `${productSKU}-${index + 1}${ext}`
  const destPath = path.join(PUBLIC_PRODUCTS_FOLDER, filename)
  
  // Create public/products folder if it doesn't exist
  if (!fs.existsSync(PUBLIC_PRODUCTS_FOLDER)) {
    fs.mkdirSync(PUBLIC_PRODUCTS_FOLDER, { recursive: true })
  }
  
  // Copy file
  fs.copyFileSync(sourcePath, destPath)
  
  // Return relative URL (from public folder)
  return `/products/${filename}`
}

/**
 * Main import function
 */
async function importProductImages() {
  console.log('🖼️  Starting product images import from folder...\n')
  
  // Check if source folder exists
  if (!fs.existsSync(PRODUCT_IMAGES_FOLDER)) {
    console.log(`❌ Source folder not found: ${PRODUCT_IMAGES_FOLDER}`)
    console.log(`\n📁 Please create the folder structure:`)
    console.log(`   ${PRODUCT_IMAGES_FOLDER}/`)
    console.log(`   ├── [SKU]/`)
    console.log(`   │   ├── image1.jpg`)
    console.log(`   │   ├── image2.jpg`)
    console.log(`   │   └── ...`)
    console.log(`   └── [SKU]/`)
    console.log(`       └── ...`)
    console.log(`\n💡 Tip: Use SKU as folder name for best matching`)
    console.log(`   Example: XM-INSEE-PCB40/image1.jpg, image2.jpg`)
    console.log(`\n   Or use product name: Xi măng INSEE PCB40/image1.jpg`)
    console.log(`   (Set MATCH_BY_NAME=true to match by name)`)
    return
  }
  
  // Get all products
  const products = await getAllProducts()
  console.log(`📦 Found ${products.length} products in database\n`)
  
  // Get all folders in product-images
  const folders = fs.readdirSync(PRODUCT_IMAGES_FOLDER, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
  
  if (folders.length === 0) {
    console.log(`⚠️  No folders found in ${PRODUCT_IMAGES_FOLDER}`)
    console.log(`\n📁 Please create folders with images:`)
    console.log(`   ${PRODUCT_IMAGES_FOLDER}/`)
    console.log(`   ├── [SKU]/`)
    console.log(`   │   ├── image1.jpg`)
    console.log(`   │   └── image2.jpg`)
    return
  }
  
  console.log(`📁 Found ${folders.length} folders in product-images\n`)
  
  // Create public/products folder
  if (!fs.existsSync(PUBLIC_PRODUCTS_FOLDER)) {
    fs.mkdirSync(PUBLIC_PRODUCTS_FOLDER, { recursive: true })
    console.log(`✅ Created public/products folder\n`)
  }
  
  let importCount = 0
  let updateCount = 0
  let errorCount = 0
  let skippedCount = 0
  let notFoundCount = 0
  
  const matches: ProductImageMatch[] = []
  
  // Process each folder
  for (const folderName of folders) {
    const folderPath = path.join(PRODUCT_IMAGES_FOLDER, folderName)
    
    // Get images from folder
    const imageFiles = getImageFiles(folderPath)
    
    if (imageFiles.length === 0) {
      console.log(`⚠️  No images found in folder: ${folderName}`)
      continue
    }
    
    // Find matching product
    let product: any = null
    
    if (MATCH_BY_SKU) {
      product = findProductBySKU(products, folderName)
      if (!product) {
        // Try fuzzy match as fallback
        product = findProductByName(products, folderName)
      }
    } else {
      product = findProductByName(products, folderName)
    }
    
    if (!product) {
      console.log(`❌ Product not found for folder: ${folderName}`)
      console.log(`   Available SKUs: ${products.slice(0, 5).map(p => p.sku).join(', ')}${products.length > 5 ? '...' : ''}`)
      notFoundCount++
      continue
    }
    
    // Check if product already has images
    const currentImages = Array.isArray(product.images) ? product.images : []
    if (currentImages.length > 0 && !FORCE_UPDATE) {
      console.log(`⏭️  Skipping ${product.name} (${product.sku}) - already has ${currentImages.length} image(s)`)
      console.log(`   Use FORCE_UPDATE=true to overwrite`)
      skippedCount++
      continue
    }
    
    // Copy images to public folder and get URLs
    const imageUrls: string[] = []
    
    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const imageUrl = copyImageToPublic(imageFiles[i], product.sku, i)
        imageUrls.push(imageUrl)
      }
      
      // Update database
      await prisma.product.update({
        where: { id: product.id },
        data: {
          images: imageUrls,
          updatedAt: new Date()
        }
      })
      
      matches.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        images: imageUrls,
        sourcePath: folderPath
      })
      
      console.log(`✅ Updated ${product.name} (${product.sku})`)
      console.log(`   📸 Imported ${imageUrls.length} image(s) from: ${folderName}`)
      console.log(`   📁 URLs: ${imageUrls.join(', ')}`)
      
      if (currentImages.length > 0) {
        updateCount++
      } else {
        importCount++
      }
      
    } catch (error: any) {
      console.error(`❌ Error processing ${product.name} (${product.sku}):`, error.message)
      errorCount++
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(80)}`)
  console.log('\n📊 Import Summary:')
  console.log(`   ✅ New imports: ${importCount} products`)
  console.log(`   🔄 Updated: ${updateCount} products`)
  console.log(`   ⏭️  Skipped: ${skippedCount} products`)
  console.log(`   ❌ Errors: ${errorCount} products`)
  console.log(`   ❓ Not found: ${notFoundCount} folders`)
  console.log(`   📸 Total images imported: ${matches.reduce((sum, m) => sum + m.images.length, 0)}`)
  
  if (notFoundCount > 0) {
    console.log(`\n💡 Tips for matching:`)
    console.log(`   - Use SKU as folder name (e.g., "XM-INSEE-PCB40")`)
    console.log(`   - Or use exact product name (e.g., "Xi măng INSEE PCB40")`)
    console.log(`   - Set MATCH_BY_NAME=true to match by name instead of SKU`)
  }
  
  if (skippedCount > 0) {
    console.log(`\n💡 To overwrite existing images:`)
    console.log(`   FORCE_UPDATE=true npx tsx scripts/import-product-images-from-folder.ts`)
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
  
  console.log(`✅ Products with images: ${withImages.length}/${allProducts.length}`)
  console.log(`   Coverage: ${((withImages.length / allProducts.length) * 100).toFixed(1)}%`)
  
  if (withoutImages.length > 0) {
    console.log(`\n⚠️  Products still without images (${withoutImages.length}):`)
    withoutImages.slice(0, 10).forEach(p => {
      console.log(`   - ${p.name} (SKU: ${p.sku})`)
    })
    if (withoutImages.length > 10) {
      console.log(`   ... and ${withoutImages.length - 10} more`)
    }
  } else {
    console.log('\n🎉 All products now have images!')
  }
}

// Run import
importProductImages()
  .then(() => {
    console.log('\n✅ Import completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

