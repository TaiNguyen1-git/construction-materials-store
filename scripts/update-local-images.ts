import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Map SKU to actual folder name and image filename
const IMAGE_MAPPINGS: Record<string, { folder: string, image: string }> = {
    'CAT-VANG': { folder: 'CAT-VANG', image: 'CatVang.jpg' },
    'CAT-XD-I': { folder: 'CAT-XD-I', image: 'CatXD.jpg' },
    'DA-1X2': { folder: 'DA-1X2', image: '1x2.jpg' },
    'DA-MI': { folder: 'DA-MI', image: 'dami.jpg' },
    'GACH-DINH-8X8X18': { folder: 'GACH-DINH-8X8X18', image: 'gach-dinh-2-lo.jpg' },
    'GACH-ONG-6X10X20': { folder: 'GACH-ONG-6X10X20', image: 'Gach-ong-tron.jpg' },
    'THEP-CB240-D10': { folder: 'THEP-CB240-D10', image: '20230910063750-40gia-thep.jpeg' },
    'XM-HATIEN-PCB40': { folder: 'XM-HATIEN-PCB40', image: 'pc40HT.jpg' },
    'XM-INSEE-PC40': { folder: 'XM-INSEE-PC40', image: 'Vo-bao-XM-Insee-Da-Dung-PCB-40.png' },
}

async function updateLocalImages() {
    console.log('🖼️  Updating products to use LOCAL images...\n')

    let updateCount = 0
    let errorCount = 0
    let notFoundCount = 0

    for (const [sku, mapping] of Object.entries(IMAGE_MAPPINGS)) {
        try {
            console.log(`📸 Updating SKU: ${sku}`)

            // Check if product exists
            const product = await prisma.product.findUnique({
                where: { sku },
                select: { id: true, name: true }
            })

            if (!product) {
                console.log(`   ⚠️  Product not found: ${sku}`)
                notFoundCount++
                continue
            }

            // Build local image path
            const imagePath = `/product-images/${mapping.folder}/${mapping.image}`

            // Verify file exists
            const fullPath = path.join(process.cwd(), 'product-images', mapping.folder, mapping.image)
            if (!fs.existsSync(fullPath)) {
                console.log(`   ❌ Image file not found: ${fullPath}`)
                errorCount++
                continue
            }

            // Update product with local image path
            await prisma.product.update({
                where: { sku },
                data: {
                    images: [imagePath],
                    updatedAt: new Date()
                }
            })

            console.log(`   ✅ Updated: ${product.name}`)
            console.log(`      Path: ${imagePath}`)
            updateCount++

        } catch (error: any) {
            console.error(`   ❌ Error updating ${sku}:`, error.message)
            errorCount++
        }
    }

    console.log(`\n${'='.repeat(80)}`)
    console.log('\n📊 Update Summary:')
    console.log(`   ✅ Successfully updated: ${updateCount} products`)
    console.log(`   ⚠️  Products not found: ${notFoundCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📝 Total products in mapping: ${Object.keys(IMAGE_MAPPINGS).length}`)

    // Verify results
    console.log('\n🔍 Verifying results...\n')

    const allProducts = await prisma.product.findMany({
        select: {
            name: true,
            sku: true,
            images: true
        },
        orderBy: { name: 'asc' }
    })

    console.log('📋 Current product image status:')
    allProducts.forEach(p => {
        const imageCount = Array.isArray(p.images) ? p.images.length : 0
        const imageType = imageCount > 0 && p.images[0].startsWith('/product-images') ? '(LOCAL)' : '(EXTERNAL)'
        console.log(`   - ${p.name} (${p.sku}): ${imageCount} image(s) ${imageType}`)
        if (imageCount > 0) {
            console.log(`      └─ ${p.images[0]}`)
        }
    })
}

updateLocalImages()
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
