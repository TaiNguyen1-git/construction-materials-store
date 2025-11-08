/**
 * Script to check products in database
 * Usage: npx tsx scripts/check-products.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkProducts() {
  try {
    console.log('🔍 Checking products in database...\n')
    
    // Get total count
    const totalCount = await prisma.product.count()
    console.log(`📦 Total products: ${totalCount}`)
    
    // Get active products
    const activeCount = await prisma.product.count({
      where: { isActive: true }
    })
    console.log(`✅ Active products: ${activeCount}`)
    
    // Get all products with names
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        isActive: true,
        tags: true
      },
      take: 20
    })
    
    console.log(`\n📋 Sample products (first 20):`)
    allProducts.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.name} (SKU: ${p.sku}, Active: ${p.isActive})`)
      if (p.tags && p.tags.length > 0) {
        console.log(`   Tags: ${p.tags.join(', ')}`)
      }
    })
    
    // Search for products with "xi măng" in name
    console.log(`\n🔍 Searching for products with "xi măng" in name...`)
    const searchQueries = [
      'xi măng',
      'Xi măng',
      'XI MĂNG',
      'Xi Măng'
    ]
    
    for (const query of searchQueries) {
      const results = await prisma.product.findMany({
        where: {
          name: { contains: query },
          isActive: true
        },
        select: {
          id: true,
          name: true,
          sku: true
        }
      })
      
      console.log(`  - Search "${query}": ${results.length} products`)
      if (results.length > 0) {
        results.forEach(p => console.log(`    • ${p.name} (${p.sku})`))
      }
    }
    
    // Also check with OR condition
    console.log(`\n🔍 Searching with OR condition (multiple variations)...`)
    const orResults = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'xi măng' } },
          { name: { contains: 'Xi măng' } },
          { name: { contains: 'XI MĂNG' } },
          { name: { contains: 'Xi Măng' } },
          { description: { contains: 'xi măng' } },
          { sku: { contains: 'xi măng' } },
          { tags: { hasSome: ['xi măng', 'Xi măng', 'XI MĂNG'] } }
        ],
        isActive: true
      },
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        tags: true
      }
    })
    
    console.log(`  Found ${orResults.length} products`)
    orResults.forEach(p => {
      console.log(`    • ${p.name} (${p.sku})`)
      if (p.tags && p.tags.length > 0) {
        console.log(`      Tags: ${p.tags.join(', ')}`)
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

checkProducts()

